/*
 * PEBAI · Agente de WhatsApp (departamento de Captación).
 *
 * Corre 24/7 en el servidor (PM2), vinculado como "dispositivo" al WhatsApp de Daniel: el PC puede estar apagado.
 * No decide nada por su cuenta: cada vez pregunta al panel (api/agente.php) a quién escribir, qué texto y cuándo.
 * Solo envía el primer mensaje; las respuestas las contesta Daniel desde el móvil.
 *
 * Comportamiento de persona: se conecta como "no en línea", abre el chat, escribe a velocidad humana con
 * pausas, envía, y se desconecta. Nunca marca mensajes como leídos (los ves sin leer en el móvil).
 *
 * .env (al lado de este archivo, nunca en git): PANEL_API, AGENT_TOKEN, WA_NUMERO.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pino from 'pino';
import makeWASocket, { Browsers, DisconnectReason, fetchLatestBaileysVersion, isLidUser, useMultiFileAuthState } from 'baileys';

const DIR = path.dirname(fileURLToPath(import.meta.url));
for (const line of (fs.existsSync(path.join(DIR, '.env')) ? fs.readFileSync(path.join(DIR, '.env'), 'utf8') : '').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const PANEL_API = process.env.PANEL_API || 'https://pebaisystems.es/api/agente.php';
const TOKEN = process.env.AGENT_TOKEN || '';
const NUMERO = (process.env.WA_NUMERO || '').replace(/\D/g, '');
const VINCULO = (process.env.WA_VINCULO || 'qr').toLowerCase();
const SESION = path.join(DIR, 'sesion');
const CONTACTADOS_FILE = path.join(DIR, 'contactados.json');
if (!TOKEN || !NUMERO) {
  console.error('Faltan AGENT_TOKEN o WA_NUMERO en .env');
  process.exit(1);
}

// Una sola instancia: dos procesos con la misma sesión se pisan y WhatsApp cierra la sesión.
const LOCK = path.join(DIR, 'agente.pid');
try {
  const viejo = Number(fs.readFileSync(LOCK, 'utf8'));
  // Tras un reinicio el pid puede ser de otro programa: solo cuenta si es este mismo script
  const esAgente = fs.existsSync('/proc/' + viejo) ? fs.readFileSync('/proc/' + viejo + '/cmdline', 'utf8').includes('index.js') : true;
  if (viejo && viejo !== process.pid && esAgente) { process.kill(viejo, 0); console.error('Ya hay otro agente corriendo (pid ' + viejo + ')'); process.exit(0); }
} catch { /* no hay otro: seguimos */ }
fs.writeFileSync(LOCK, String(process.pid));

const logger = pino({ level: 'warn' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const log = (...a) => console.log(new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }), '·', ...a);

let sock = null;
let estado = 'arrancando';
let detalle = '';
let codigo = '';
let intentosVinculo = 0;
let contactados = new Set();
const enviadosAgente = new Set(); // ids de los mensajes que envía el agente (para no confundirlos con los que escribe Daniel)
try { contactados = new Set(JSON.parse(fs.readFileSync(CONTACTADOS_FILE, 'utf8'))); } catch { /* primera vez */ }
const guardaContactados = () => fs.writeFileSync(CONTACTADOS_FILE, JSON.stringify([...contactados]));

/* ---------------------------------------------------------------- panel --- */
async function api(accion, datos = {}) {
  try {
    const r = await fetch(PANEL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Agent-Token': TOKEN, 'User-Agent': 'pebai-agente-whatsapp/1.0' },
      body: JSON.stringify({ accion, ...datos }),
      signal: AbortSignal.timeout(25000),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(`HTTP ${r.status}`);
    return j;
  } catch (e) {
    log('API', accion, 'falló:', e.message);
    return null;
  }
}
async function latido() {
  const r = await api('latido', { estado, detalle, codigo });
  if (r && Array.isArray(r.contactados)) {
    r.contactados.forEach((t) => contactados.add(String(t)));
    guardaContactados();
  }
  return r;
}

/* ------------------------------------------------------------- conexión --- */
async function conectar() {
  const { state, saveCreds } = await useMultiFileAuthState(SESION);
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));
  let pedido = false;
  sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: Browsers.macOS('Chrome'),
    markOnlineOnConnect: false,       // no aparecer "en línea" cada vez que el servidor se conecta
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
  });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    // Sin sesión: se vincula escaneando un QR que sale en el panel (WA_VINCULO=qr, por defecto).
    // El código de 8 letras (WA_VINCULO=codigo) falla en Baileys 7.0.0-rc14 al confirmar ("Invalid buffer"), por eso el QR.
    if (qr && !sock.authState.creds.registered && VINCULO === 'qr') {
      if (!pedido) { pedido = true; intentosVinculo++; }
      codigo = 'QR:' + qr;   // el QR cambia cada ~20 s: se manda cada vez
      estado = 'esperando_vinculo';
      detalle = 'QR de vinculación listo';
      log('QR de vinculación nuevo');
      await latido();
    } else if (qr && !sock.authState.creds.registered && !pedido) {
      pedido = true;
      intentosVinculo++;
      try {
        codigo = await sock.requestPairingCode(NUMERO);
        estado = 'esperando_vinculo';
        detalle = 'Código de vinculación listo';
        log('Código de vinculación:', codigo);
      } catch (e) {
        detalle = 'No se pudo pedir el código: ' + e.message;
        log(detalle);
      }
      await latido();
    }
    if (connection === 'open') {
      estado = 'conectado'; codigo = ''; detalle = 'Conectado'; intentosVinculo = 0;
      log('Conectado a WhatsApp');
      await latido();
      setTimeout(() => fotosPendientes().catch(() => {}), 60e3);
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        // Desvinculado desde el móvil o por WhatsApp: se borra la sesión y se pedirá un código nuevo.
        estado = 'desvinculado'; codigo = ''; detalle = 'WhatsApp cerró la sesión';
        log('Sesión cerrada por WhatsApp (loggedOut)');
        await latido();
        fs.rmSync(SESION, { recursive: true, force: true });
      } else if (estado !== 'esperando_vinculo') {
        estado = 'reconectando'; detalle = 'Conexión perdida (' + (code || 'sin código') + ')';
        await latido();
      }
      // Si nadie vincula, no pedir códigos sin parar: 10 intentos seguidos y luego uno por hora.
      const espera = intentosVinculo >= 10 ? 3600e3 : estado === 'esperando_vinculo' ? 5e3 : Math.min(60e3, 5e3 * (1 + Math.random() * 3));
      setTimeout(() => conectar().catch((e) => { log('Error al reconectar:', e.message); process.exit(1); }), espera);
    }
  });

  // Respuestas: solo de números a los que ha escrito el agente (nunca chats personales). No se marcan como leídas.
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return;
    for (const m of messages) {
      if (!m.message) continue;
      // Lo que envía el propio agente ya está registrado: se reconoce por su id y se salta.
      if (m.key.fromMe && enviadosAgente.has(m.key.id)) continue;
      if (!m.key.fromMe && type !== 'notify') continue;
      const tel = await telDelChat(m.key);
      if (!tel || !contactados.has(tel)) continue;
      const texto = textoDe(m.message);
      if (m.key.fromMe) {
        // Lo que escribe Daniel desde el móvil a una empresa contactada también se guarda, para ver la conversación completa en el panel
        log('Mensaje de Daniel desde el móvil a', tel);
        await api('manual', { telefono: tel, texto, ts: Number(m.messageTimestamp) || 0 });
        continue;
      }
      log('Respuesta de', tel);
      await api('entrante', { telefono: tel, texto });
      recuperaHistorial(tel, m).catch(() => {});
    }
  });
  // Historial que manda el móvil cuando se le pide (recuperaHistorial): solo se guardan los mensajes de Daniel que faltan
  sock.ev.on('messaging-history.set', async ({ messages = [] }) => {
    let n = 0;
    for (const m of messages) {
      if (!m.message || !m.key?.fromMe || enviadosAgente.has(m.key.id)) continue;
      const tel = await telDelChat(m.key);
      if (!tel || !contactados.has(tel)) continue;
      const r = await api('manual', { telefono: tel, texto: textoDe(m.message), ts: Number(m.messageTimestamp) || 0 });
      if (r && !r.ignorado) n++;
    }
    if (n) log('Historial: recuperados', n, 'mensajes de Daniel');
  });
}

// Número de la empresa de un chat. En los mensajes propios, remoteJidAlt es el número de Daniel, no el de la empresa:
// ahí manda remoteJid (el chat), traducido de LID a número si hace falta.
async function telDelChat(key) {
  let jid = key.fromMe ? (key.remoteJid || '') : (key.remoteJidAlt || key.senderPn || key.remoteJid || '');
  if (key.fromMe && isLidUser(jid) && key.remoteJidAlt && !isLidUser(key.remoteJidAlt) && !key.remoteJidAlt.startsWith(NUMERO || "-")) jid = key.remoteJidAlt;
  if (isLidUser(jid)) jid = (await sock.signalRepository.lidMapping.getPNForLID(jid).catch(() => null)) || '';
  if (!jid.endsWith('@s.whatsapp.net')) return '';
  return jid.split('@')[0].split(':')[0];
}
function textoDe(msg) {
  msg = msg.deviceSentMessage?.message || msg.ephemeralMessage?.message || msg;
  return msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption
    || (msg.audioMessage ? '[nota de voz]' : msg.imageMessage ? '[imagen]' : msg.stickerMessage ? '[sticker]' : msg.documentMessage ? '[documento]' : '[mensaje]');
}
// Una vez por chat y arranque: pide al móvil los mensajes anteriores para recuperar lo que Daniel escribió y no se guardó
const historialPedido = new Set();
async function recuperaHistorial(tel, m) {
  if (historialPedido.has(tel)) return;
  historialPedido.add(tel);
  await sock.fetchMessageHistory(50, m.key, Number(m.messageTimestamp) || Math.floor(Date.now() / 1000));
}

/* --------------------------------------------------- envío como persona --- */
// Un envío cada vez: un primer mensaje y una respuesta aprobada nunca se escriben a la vez
let turno = Promise.resolve();
function escribirComoPersona(jid, texto) {
  const t = turno.then(() => escribirAhora(jid, texto));
  turno = t.catch(() => {});
  return t;
}
async function escribirAhora(jid, texto) {
  await sock.sendPresenceUpdate('available');
  await sleep(rand(4e3, 14e3));                      // abre WhatsApp y busca el chat
  await sock.presenceSubscribe(jid).catch(() => {});
  await sleep(rand(1e3, 3e3));
  // Escribir: ~130-200 ms por carácter, con alguna pausa para "pensar". WhatsApp quita el "escribiendo…" a los ~10 s: se renueva.
  let falta = Math.min(95e3, texto.length * rand(130, 200));
  while (falta > 0) {
    await sock.sendPresenceUpdate('composing', jid);
    const tramo = Math.min(falta, rand(6e3, 9e3));
    await sleep(tramo);
    falta -= tramo;
    if (falta > 0 && Math.random() < 0.3) {
      await sock.sendPresenceUpdate('paused', jid);
      await sleep(rand(1.5e3, 4e3));
    }
  }
  await sock.sendPresenceUpdate('paused', jid);
  await sleep(rand(400, 1200));
  const enviado = await sock.sendMessage(jid, { text: texto });
  if (enviado?.key?.id) enviadosAgente.add(enviado.key.id);
  await sleep(rand(5e3, 20e3));                      // se queda un momento y cierra la app
  await sock.sendPresenceUpdate('unavailable');
}

async function enviar(p, texto) {
  const tel = String(p.telefono);
  try {
    const [res] = (await sock.onWhatsApp(tel + '@s.whatsapp.net')) || [];
    if (!res?.exists) {
      log('Sin WhatsApp:', tel);
      return api('resultado', { id: p.id, ok: false, sin_whatsapp: true, error: 'El número no tiene WhatsApp' });
    }
    contactados.add(tel);
    guardaContactados();
    await escribirComoPersona(res.jid, texto);
    log('Enviado a', p.empresa || tel);
    const r = await api('resultado', { id: p.id, ok: true, texto });
    subeFoto(tel, res.jid).catch(() => {});
    return r;
  } catch (e) {
    log('Error enviando a', tel, e.message);
    return api('resultado', { id: p.id, ok: false, error: String(e.message).slice(0, 250) });
  }
}

/* ------------------------------------------- fotos de perfil (panel) --- */
// La foto de perfil de WhatsApp de cada empresa contactada se guarda en el panel (si la tiene pública).
const fotosHechas = new Set();
async function subeFoto(tel, jid) {
  if (fotosHechas.has(tel)) return;
  fotosHechas.add(tel);
  const url = await sock.profilePictureUrl(jid || tel + '@s.whatsapp.net', 'image').catch((e) => { fotoLog.push(tel + ': sin foto (' + e.message + ')'); return null; });
  if (!url) return;
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) { fotoLog.push(tel + ': descarga ' + r.status); return; }
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > 400000) return;
  const j = await api('foto', { telefono: tel, img: buf.toString('base64') });
  fotoLog.push(tel + ': ' + (j && !j.ignorado ? 'guardada' : 'rechazada por la API'));
}
const fotoLog = [];
async function fotosPendientes() {
  for (const tel of [...contactados]) {
    if (estado !== 'conectado') return;
    await subeFoto(tel).catch((e) => fotoLog.push(tel + ': error ' + e.message));
    await sleep(rand(2e3, 5e3));
  }
  log('Fotos de perfil: ' + fotoLog.splice(0).join(' · ').slice(0, 1500));
}

/* ------------------------------------------------------------ bucles --- */
async function bucleEnvios() {
  for (;;) {
    if (estado !== 'conectado') { await sleep(30e3); continue; }
    const r = await api('siguiente');
    if (!r) { await sleep(120e3); continue; }
    if (r.esperar) {
      detalle = { pausado: 'En pausa desde el panel', fuera_de_horario: 'Fuera de horario', cupo_completo: 'Cupo de hoy completo',
        sin_prospectos: 'Sin prospectos en cola', pausa_entre_envios: 'Esperando entre envíos' }[r.motivo] || 'Esperando';
      await sleep(Math.max(30, r.esperar) * 1000);
      continue;
    }
    detalle = 'Escribiendo a ' + (r.prospecto.empresa || r.prospecto.telefono);
    const res = await enviar(r.prospecto, r.texto);
    detalle = 'Esperando entre envíos';
    await sleep(Math.max(60, res?.esperar || 300) * 1000);
  }
}
// Respuestas que Daniel ha aprobado en el panel (Captación › Conversaciones): salen en cuanto se puede, a cualquier hora
async function bucleRespuestas() {
  for (;;) {
    await sleep(rand(25e3, 40e3));
    if (estado !== 'conectado') continue;
    const r = await api('salida');
    const w = r?.salida;
    if (!w) continue;
    const tel = String(w.telefono);
    try {
      const [res] = (await sock.onWhatsApp(tel + '@s.whatsapp.net')) || [];
      if (!res?.exists) throw new Error('El número no tiene WhatsApp');
      contactados.add(tel);
      guardaContactados();
      await escribirComoPersona(res.jid, w.texto);
      log('Respuesta aprobada enviada a', tel);
      await api('salida_resultado', { id: w.id, ok: true });
    } catch (e) {
      log('Error enviando respuesta a', tel, e.message);
      await api('salida_resultado', { id: w.id, ok: false, error: String(e.message).slice(0, 250) });
    }
  }
}
async function bucleLatidos() {
  for (;;) {
    await sleep(estado === 'conectado' ? 5 * 60e3 : 45e3);
    await latido();
  }
}

process.on('unhandledRejection', (e) => log('Promesa rechazada:', e?.message || e));
process.on('uncaughtException', (e) => { log('Error fatal:', e.message); process.exit(1); }); // PM2 lo vuelve a arrancar

log('Arrancando agente de WhatsApp →', PANEL_API);
await conectar();
await latido();
bucleLatidos();
bucleEnvios();
bucleRespuestas();
