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
const SESION = path.join(DIR, 'sesion');
const CONTACTADOS_FILE = path.join(DIR, 'contactados.json');
if (!TOKEN || !NUMERO) {
  console.error('Faltan AGENT_TOKEN o WA_NUMERO en .env');
  process.exit(1);
}

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
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false,
  });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    // Sin sesión: en vez de QR se pide un código de 8 letras que se escribe en el móvil (se ve en el panel).
    if (qr && !sock.authState.creds.registered && !pedido) {
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
    if (type !== 'notify') return;
    for (const m of messages) {
      if (!m.message || m.key.fromMe) continue;
      let jid = m.key.remoteJidAlt || m.key.senderPn || m.key.remoteJid || '';
      if (isLidUser(jid)) jid = (await sock.signalRepository.lidMapping.getPNForLID(jid).catch(() => null)) || '';
      if (!jid.endsWith('@s.whatsapp.net')) continue;
      const tel = jid.split('@')[0].split(':')[0];
      if (!contactados.has(tel)) continue;
      const msg = m.message;
      const texto = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption
        || (msg.audioMessage ? '[nota de voz]' : msg.imageMessage ? '[imagen]' : msg.stickerMessage ? '[sticker]' : msg.documentMessage ? '[documento]' : '[mensaje]');
      log('Respuesta de', tel);
      await api('entrante', { telefono: tel, texto });
    }
  });
}

/* --------------------------------------------------- envío como persona --- */
async function escribirComoPersona(jid, texto) {
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
  await sock.sendMessage(jid, { text: texto });
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
    return api('resultado', { id: p.id, ok: true, texto });
  } catch (e) {
    log('Error enviando a', tel, e.message);
    return api('resultado', { id: p.id, ok: false, error: String(e.message).slice(0, 250) });
  }
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
