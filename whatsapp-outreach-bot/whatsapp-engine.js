import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import express from 'express';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import stream from 'stream';
import { fileURLToPath } from 'url';
import { Config } from './config.js';
import { handleIncomingSalesMessage, reactivateLeadAI, recordOutreachMessageSent, loadConversationMemory } from './sales-closer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MESSAGE_STORE_FILE = path.join(__dirname, 'message_store_cache.json');
const LID_MAP_FILE = path.join(__dirname, 'lid_mapping.json');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Purga de forma limpia las claves de sesión de Signal para un contacto específico.
 * Se usa cuando ocurre un error de descifrado (Bad MAC) o desincronización de prekeys.
 */
export function purgePeerSessionFiles(phoneOrJid) {
  const cleanPhone = String(phoneOrJid).split('@')[0].replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 7) return;
  const authDir = Config.WHATSAPP.AUTH_DIR;
  if (!fs.existsSync(authDir)) return;
  try {
    const files = fs.readdirSync(authDir);
    let count = 0;
    for (const f of files) {
      if (f.startsWith(`session-${cleanPhone}`) || f.includes(cleanPhone)) {
        try {
          fs.unlinkSync(path.join(authDir, f));
          count++;
        } catch (e) {}
      }
    }
    if (count > 0) {
      console.log(`🧹 [AUTO-REPAIR SIGNAL]: Purgadas ${count} claves corruptas de sesión para +${cleanPhone}`);
    }
  } catch (err) {}
}

function createAutoHealLogger() {
  const autoHealStream = new stream.Writable({
    write(chunk, encoding, callback) {
      const msg = chunk.toString();
      if (msg.includes('Bad MAC') || msg.includes('Session error') || msg.includes('Failed to decrypt')) {
        const match = msg.match(/(\d{9,15})/);
        if (match) {
          purgePeerSessionFiles(match[1]);
        }
      }
      callback();
    }
  });

  return pino({ level: 'warn' }, autoHealStream);
}

class WhatsAppEngine {
  constructor() {
    this.sock = null;
    this.status = 'Desconectado';
    this.connectedUser = null;
    this.currentQrDataUrl = null;
    this.currentQrRaw = null;
    this.serverApp = null;
    this.serverInstance = null;
    this.isReady = false;
    this.isConnecting = false;
    this.readyResolvers = [];

    // Caché de mensajes (E2EE) para resolver reintentos de descifrado en dispositivos vinculados (Móvil / Web)
    this.messageStore = new Map();
    this.loadMessageStoreFromDisk();

    // Mapas de gestión conversacional ultra-robusta (Inspirado en Fran Cars)
    this.customerTypingMap = new Map(); // Guarda el timestamp hasta el que el cliente está escribiendo
    this.userQueueMap = new Map();      // Cola de acumulación y debounce para ráfagas de mensajes

    // Mapeo bidireccional de LIDs (@lid) a números de teléfono reales (@s.whatsapp.net)
    this.lidToPhoneMap = new Map();
    this.loadLidMappings();
    // Registrar mapping explícito para Daniel (+34 601 04 33 05 -> 78524970999836@lid)
    this.saveLidMapping('78524970999836', '34601043305');
  }

  loadLidMappings() {
    try {
      if (fs.existsSync(LID_MAP_FILE)) {
        const raw = fs.readFileSync(LID_MAP_FILE, 'utf8');
        const data = JSON.parse(raw);
        for (const [k, v] of Object.entries(data)) {
          this.lidToPhoneMap.set(k, v);
        }
      }
    } catch (e) {}
  }

  saveLidMapping(lid, phone) {
    if (!lid || !phone) return;
    const cleanLid = String(lid).split('@')[0].replace(/[^0-9]/g, '');
    const cleanPhone = String(phone).split('@')[0].replace(/[^0-9]/g, '');
    if (!cleanLid || !cleanPhone) return;
    this.lidToPhoneMap.set(cleanLid, cleanPhone);
    try {
      const obj = Object.fromEntries(this.lidToPhoneMap.entries());
      fs.writeFileSync(LID_MAP_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {}
  }

  resolveLidToPhone(lid) {
    if (!lid) return null;
    const cleanLid = String(lid).split('@')[0].replace(/[^0-9]/g, '');
    return this.lidToPhoneMap.get(cleanLid) || null;
  }

  destroySocket() {
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.ev.removeAllListeners('messages.upsert');
        this.sock.ev.removeAllListeners('presence.update');
        this.sock.end(undefined);
      } catch (e) {}
      this.sock = null;
    }
  }

  loadMessageStoreFromDisk() {
    try {
      if (fs.existsSync(MESSAGE_STORE_FILE)) {
        const raw = fs.readFileSync(MESSAGE_STORE_FILE, 'utf8');
        const data = JSON.parse(raw);
        for (const [k, v] of Object.entries(data)) {
          this.messageStore.set(k, v);
        }
      }
    } catch (e) {
      console.warn('⚠️ No se pudo cargar message_store_cache:', e.message);
    }
  }

  saveMessageStoreToDisk() {
    try {
      // Guardar solo los últimos 300 mensajes para mantener el archivo ligero y ultra-rápido
      const entries = Array.from(this.messageStore.entries()).slice(-300);
      const obj = Object.fromEntries(entries);
      fs.writeFileSync(MESSAGE_STORE_FILE, JSON.stringify(obj), 'utf8');
    } catch (e) {}
  }

  rememberMessage(keyId, messageProto) {
    if (!keyId || !messageProto) return;
    this.messageStore.set(keyId, messageProto);
    if (this.messageStore.size > 500) {
      const firstKey = this.messageStore.keys().next().value;
      this.messageStore.delete(firstKey);
    }
    // Guardar en disco periódicamente
    this.saveMessageStoreToDisk();
  }

  /**
   * Inicia el mini servidor web para ver el QR en navegador
   */
  startWebServer() {
    if (this.serverInstance || this.serverApp) return;

    this.serverApp = express();
    const port = Config.WHATSAPP.PORT;

    this.serverApp.get('/qr', (req, res) => {
      if (this.currentQrDataUrl) {
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vincular WhatsApp - PEBAI Systems</title>
            <meta http-equiv="refresh" content="8">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #070c14; color: white; }
              .card { background: #0f172a; padding: 2.5rem; border-radius: 1.5rem; text-align: center; max-width: 440px; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
              .qr-box { background: white; padding: 1.2rem; border-radius: 1rem; margin: 1.5rem 0; display: inline-block; }
              .qr-box img { display: block; width: 260px; height: 260px; }
              .status { font-weight: 700; color: #38bdf8; margin-top: 1rem; font-size: 1.1rem; }
              h2 { margin: 0 0 0.5rem 0; color: #f8fafc; font-size: 1.5rem; }
              p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin: 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Vincular WhatsApp</h2>
              <p>Abre <strong>WhatsApp</strong> &gt; <strong>Dispositivos vinculados</strong> &gt; <strong>Vincular un dispositivo</strong></p>
              <div class="qr-box">
                <img src="${this.currentQrDataUrl}" alt="QR WhatsApp" />
              </div>
              <div class="status">${this.status}</div>
            </div>
          </body>
          </html>
        `);
      } else {
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Estado WhatsApp - PEBAI Systems</title>
            <meta http-equiv="refresh" content="5">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #070c14; color: white; }
              .card { background: #0f172a; padding: 2.5rem; border-radius: 1.5rem; text-align: center; max-width: 440px; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
              .badge { background: #059669; color: white; padding: 0.6rem 1.4rem; border-radius: 9999px; display: inline-block; font-weight: 700; margin-top: 1rem; font-size: 1.1rem; }
              h2 { margin: 0 0 0.5rem 0; color: #f8fafc; font-size: 1.5rem; }
              p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-top: 0.75rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>WhatsApp Conectado</h2>
              <div class="badge">${this.status}</div>
              ${this.connectedUser ? `<p>Conectado con el número: <strong style="color:#38bdf8;">+${this.connectedUser}</strong></p>` : ''}
              <p style="font-size:0.85rem; color:#64748b;">Bot autónomo 24/7 activo: prospección outbound y cualificación comercial entrante con IA.</p>
            </div>
          </body>
          </html>
        `);
      }
    });

    this.serverApp.get('/status', (req, res) => {
      res.json({
        status: this.status,
        connectedUser: this.connectedUser,
        isReady: this.isReady
      });
    });

    this.serverApp.post('/send-message', async (req, res) => {
      try {
        const { phone, text, empresa, sector, ciudad } = req.body;
        if (!phone || !text) {
          return res.status(400).json({ error: 'phone and text are required' });
        }
        console.log(`📤 [ENVÍO MANUAL / PROSPECT]: Enviando a +${phone}...`);
        const result = await this.sendHumanLikeMessage(phone, text);

        recordOutreachMessageSent(phone, text, { empresa, sector, ciudad });

        return res.json({ success: true, result });
      } catch (err) {
        console.error('❌ Error en /send-message:', err.message);
        return res.status(500).json({ error: err.message });
      }
    });

    try {
      this.serverInstance = this.serverApp.listen(port, '0.0.0.0', () => {
        console.log(`🌐 Panel de estado y QR disponible en: http://localhost:${port}/qr`);
      });
      this.serverInstance.on('error', (e) => {
        console.warn(`⚠️ Servidor web en puerto ${port} no disponible (${e.message}). Continuando WhatsApp en modo headless.`);
      });
    } catch (e) {
      console.warn('⚠️ No se pudo iniciar el servidor web HTTP en el puerto', port, e.message);
    }
  }

  /**
   * Conecta con Baileys WhatsApp implementando el caché de claves Signal y getMessage
   * para erradicar el problema de "Esperando el mensaje. Esto puede tomar un tiempo".
   */
  async initialize() {
    if (this.isConnecting) return this;
    this.isConnecting = true;
    this.destroySocket();
    this.startWebServer();

    const authDir = Config.WHATSAPP.AUTH_DIR;
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();
    const logger = createAutoHealLogger();

    console.log(`🚀 Iniciando WhatsApp Baileys v${version.join('.')}...`);

    this.sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      logger,
      browser: ['PEBAI Systems Outreach', 'Chrome', '124.0.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 25000,
      generateHighQualityLinkPreview: true,
      printQRInTerminal: false,
      syncFullHistory: false,
      // RESOLUTOR CLAVE DE CIFRADO E2EE ENTRE DISPOSITIVOS VINCULADOS (Móvil / Web):
      getMessage: async (key) => {
        if (key && key.id && this.messageStore.has(key.id)) {
          return this.messageStore.get(key.id);
        }
        return undefined;
      }
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.status = 'Esperando escaneo de código QR';
        this.currentQrRaw = qr;
        try {
          this.currentQrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
        } catch (e) {}

        console.log('\n============================================================');
        console.log('📱 ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP PARA VINCULAR:');
        console.log(`👉 O entra en tu navegador en: http://localhost:${Config.WHATSAPP.PORT}/qr`);
        console.log('============================================================\n');
        qrcodeTerminal.generate(qr, { small: true });
      }

      if (connection === 'close') {
        this.isConnecting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = (statusCode === DisconnectReason.loggedOut);
        this.isReady = false;

        if (isLoggedOut) {
          this.status = 'Sesión cerrada por el usuario. Elimina la carpeta session/ y vuelve a vincular.';
          console.error('❌ Sesión de WhatsApp cerrada en el móvil.');
          this.destroySocket();
        } else if (statusCode === DisconnectReason.connectionReplaced || statusCode === 440) {
          this.status = 'Conexión reemplazada por otra sesión (440). Pausando 30s...';
          console.warn('⚠️ Conexión reemplazada (440). Pausando 30s antes de reconectar...');
          this.destroySocket();
          setTimeout(() => { this.initialize(); }, 30000);
        } else {
          this.status = 'Conexión interrumpida. Reconectando en 5 segundos...';
          console.warn(`⚠️ Conexión cerrada (${statusCode || 'red'}). Reconectando en 5s...`);
          this.destroySocket();
          setTimeout(() => { this.initialize(); }, 5000);
        }
      } else if (connection === 'open') {
        this.isConnecting = false;
        this.status = 'Conectado y listo';
        this.currentQrDataUrl = null;
        this.currentQrRaw = null;
        this.connectedUser = this.sock.user?.id ? this.sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : 'Desconocido';
        this.isReady = true;

        console.log('\n============================================================');
        console.log(`✅ ¡WHATSAPP CONECTADO CON ÉXITO!`);
        console.log(`📱 Número vinculado: +${this.connectedUser}`);
        console.log(`🤖 Agente Comercial IA y Prospección activos: respondiendo y cualificando automáticamente.`);
        console.log('============================================================\n');

        // Resolver promesas de espera
        while (this.readyResolvers.length > 0) {
          const resolve = this.readyResolvers.shift();
          resolve(true);
        }
      }
    });

    // LISTENER DE PRESENCIA: Detección cuando el cliente está escribiendo (composing)
    // Para NUNCA interrumpir al cliente mientras escribe (Regla de Oro Fran Cars)
    this.sock.ev.on('presence.update', (presence) => {
      try {
        const id = presence.id;
        if (!id) return;
        const cleanId = id.split('@')[0].replace(/[^0-9]/g, '');
        const phone = this.resolveLidToPhone(cleanId) || cleanId;
        const presences = presence.presences;
        if (presences && presences[id]) {
          const lastPresence = presences[id].lastKnownPresence;
          if (lastPresence === 'composing') {
            const expiration = Date.now() + 6500;
            this.customerTypingMap.set(phone, expiration);
            this.customerTypingMap.set(cleanId, expiration);
            console.log(`✍️ [PRESENCIA]: El cliente +${phone} está escribiendo... El bot esperará.`);
          }
        }
      } catch (e) {}
    });

    // LISTENER DE MENSAJES ENTRANTES: Acumulación de ráfagas y debounce inteligente
    this.sock.ev.on('messages.upsert', async (m) => {
      try {
        if (!m.messages || m.messages.length === 0) return;
        const msg = m.messages[0];

        // Guardar en caché E2EE para que el móvil propio / web nunca vea "Esperando mensaje"
        if (msg.message && msg.key?.id) {
          this.rememberMessage(msg.key.id, msg.message);
        }

        const remoteJid = msg.key.remoteJid || '';
        // Filtrar solo grupos, difusiones y canales (procesar chats 1-a-1 tanto @s.whatsapp.net como @lid)
        if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid.endsWith('@broadcast') || remoteJid.includes('newsletter')) {
          return;
        }

        const rawId = remoteJid.split('@')[0].replace(/[^0-9]/g, '');
        let senderPhone = rawId;

        if (remoteJid.endsWith('@lid')) {
          const mappedPhone = this.resolveLidToPhone(rawId);
          if (mappedPhone) {
            senderPhone = mappedPhone;
            console.log(`🔗 [LID IDENTIFICADO]: Mensaje de LID @lid ${rawId} reconocido como teléfono +${senderPhone}`);
          } else {
            const memory = loadConversationMemory();
            const memoryKeys = Object.keys(memory);
            if (memoryKeys.length === 1) {
              senderPhone = memoryKeys[0];
              this.saveLidMapping(rawId, senderPhone);
              console.log(`🔗 [LID AUTO-VINCULADO]: LID ${rawId} vinculado al prospecto en memoria +${senderPhone}`);
            }
          }
        }

        const text = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     msg.message?.imageMessage?.caption || '';

        if (!text || text.trim().length === 0) {
          if (!msg.key?.fromMe && senderPhone) {
            console.warn(`⚠️ [MENSAJE SIN DESCIFRAR]: Posible desincronización Signal con +${senderPhone}. Purgando sesión para autorrecuperación limpia...`);
            purgePeerSessionFiles(senderPhone);
            purgePeerSessionFiles(rawId);
          }
          return;
        }
        const cleanSnippet = text.trim();

        // Si el mensaje es propio (enviado por Daniel o el comercial desde el móvil)
        if (msg.key.fromMe) {
          const lower = cleanSnippet.toLowerCase();
          // Comando especial del operador para reactivar el bot en un chat derivado a humano
          if (['#bot', '#ia', '#activar', '!bot'].includes(lower)) {
            console.log(`🤖 [COMANDO OPERADOR]: Reactivando IA para +${senderPhone}`);
            reactivateLeadAI(senderPhone);
          }
          return;
        }

        // Suscribirse a la presencia de este contacto
        this.sock.presenceSubscribe(remoteJid).catch(() => {});
        this.customerTypingMap.delete(senderPhone);
        this.customerTypingMap.delete(rawId);

        console.log(`\n📩 [MENSAJE ENTRANTE DE +${senderPhone} (JID: ${remoteJid})]: "${cleanSnippet}"`);

        // ACUMULACIÓN Y DEBOUNCE DE MENSAJES (Si el cliente envía 2 o 3 líneas seguidas)
        if (!this.userQueueMap.has(senderPhone)) {
          this.userQueueMap.set(senderPhone, {
            pendingTexts: [],
            pendingMsgKeys: [],
            remoteJid: remoteJid,
            timer: null,
            isBusy: false,
            abortFlag: false
          });
        }

        const userQueue = this.userQueueMap.get(senderPhone);
        if (userQueue.isBusy) {
          userQueue.abortFlag = true;
        }

        userQueue.pendingTexts.push(cleanSnippet);
        userQueue.pendingMsgKeys.push(msg.key);
        userQueue.remoteJid = remoteJid;

        // Si es un saludo corto, esperar 5.0s; si es texto más largo, 3.8s
        const isShortGreeting = cleanSnippet.length < 18;
        const debounceDelay = isShortGreeting ? 5000 : 3800;

        if (userQueue.timer) clearTimeout(userQueue.timer);
        userQueue.timer = setTimeout(() => {
          this.processCustomerQueue(senderPhone);
        }, debounceDelay);

      } catch (err) {
        console.error('⚠️ Error procesando mensaje upsert:', err.message);
      }
    });

    return this;
  }

  /**
   * Procesa la cola de mensajes acumulados del cliente tras el debounce
   */
  async processCustomerQueue(phoneNumber) {
    const userQueue = this.userQueueMap.get(phoneNumber);
    if (!userQueue) return;

    if (userQueue.isBusy) {
      userQueue.abortFlag = true;
      return;
    }

    // Comprobar si el cliente sigue escribiendo en este momento
    const lastTypingTime = this.customerTypingMap.get(phoneNumber) || 0;
    if (Date.now() < lastTypingTime) {
      console.log(`⏳ [PRESENCIA]: El cliente +${phoneNumber} sigue tecleando. Pospone respuesta 3.5s...`);
      if (userQueue.timer) clearTimeout(userQueue.timer);
      userQueue.timer = setTimeout(() => this.processCustomerQueue(phoneNumber), 3500);
      return;
    }

    if (userQueue.pendingTexts.length === 0) return;

    userQueue.isBusy = true;
    userQueue.abortFlag = false;

    const textList = [...userQueue.pendingTexts];
    const keysList = [...userQueue.pendingMsgKeys];
    const targetJid = userQueue.remoteJid;

    userQueue.pendingTexts = [];
    userQueue.pendingMsgKeys = [];

    const combinedText = textList.join('\n');
    console.log(`🤖 [PROCESANDO CONSULTA CONSOLIDADA DE +${phoneNumber}]:\n"${combinedText}"`);

    try {
      await handleIncomingSalesMessage(phoneNumber, combinedText, this.sock, userQueue, keysList, this.customerTypingMap, targetJid);
    } catch (err) {
      console.error(`❌ Error en handleIncomingSalesMessage para +${phoneNumber}:`, err);
    } finally {
      userQueue.isBusy = false;
      if (userQueue.pendingTexts.length > 0) {
        setTimeout(() => this.processCustomerQueue(phoneNumber), 1500);
      }
    }
  }

  /**
   * Espera a que WhatsApp esté completamente conectado
   */
  async waitUntilReady() {
    if (this.isReady) return true;
    return new Promise((resolve) => {
      this.readyResolvers.push(resolve);
    });
  }

  /**
   * Envía un mensaje simulando comportamiento humano:
   * 1. Verifica si el número existe en WhatsApp
   * 2. Espera si el cliente está tecleando
   * 3. Activa 'composing' (escribiendo...) durante tiempo realista
   * 4. Envía el mensaje y lo almacena en la caché de claves E2EE
   */
  async sendHumanLikeMessage(phone, text) {
    if (!this.sock || !this.isReady) {
      throw new Error('WhatsApp no está conectado todavía');
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    const jid = `${cleanPhone}@s.whatsapp.net`;

    // 1. Comprobar si el número existe en WhatsApp
    try {
      const [onWaResult] = await this.sock.onWhatsApp(cleanPhone);
      if (!onWaResult || !onWaResult.exists) {
        console.warn(`⚠️ El número +${cleanPhone} no tiene cuenta de WhatsApp.`);
        return { success: false, reason: 'NO_TIENE_WHATSAPP' };
      }
      if (onWaResult.lid) {
        this.saveLidMapping(onWaResult.lid, cleanPhone);
      }
    } catch (checkErr) {
      console.warn(`⚠️ No se pudo comprobar onWhatsApp para +${cleanPhone}:`, checkErr.message);
    }

    // 2. Si el cliente está escribiendo, esperar a que termine
    const typingExp = this.customerTypingMap.get(cleanPhone) || 0;
    if (Date.now() < typingExp) {
      console.log(`⏳ [PRESENCIA]: El cliente +${cleanPhone} está tecleando. Esperando 5s antes del envío...`);
      await delay(5000);
    }

    // 3. Simulación de lectura humana
    const readDelay = Math.floor(Math.random() * 3000) + 3000;
    console.log(`👀 Pausa de lectura humana (+${cleanPhone}) durante ${(readDelay/1000).toFixed(1)}s...`);
    await delay(readDelay);

    // 4. Presencia "composing"
    const minTyping = Config.DELAYS.MIN_TYPING_SECONDS * 1000;
    const maxTyping = Config.DELAYS.MAX_TYPING_SECONDS * 1000;
    const typingDelay = Math.floor(Math.random() * (maxTyping - minTyping + 1)) + minTyping;

    console.log(`✍️ Simulando escritura humana en WhatsApp (+${cleanPhone}) durante ${(typingDelay/1000).toFixed(1)}s...`);
    try {
      await this.sock.sendPresenceUpdate('composing', jid);
      await delay(typingDelay);
      await this.sock.sendPresenceUpdate('paused', jid);
    } catch (presErr) {
      console.warn('⚠️ Error enviando estado de presencia:', presErr.message);
    }

    // 5. Enviar mensaje y cachear para E2EE
    try {
      const result = await this.sock.sendMessage(jid, { text: text });
      
      // Guardar en la caché de mensajes para resolver claves a dispositivos vinculados
      if (result?.message && result?.key?.id) {
        this.rememberMessage(result.key.id, result.message);
      }

      console.log(`📤 Mensaje enviado correctamente a +${cleanPhone} (ID: ${result?.key?.id || 'OK'})`);
      return { success: true, result };
    } catch (sendError) {
      console.error(`❌ Error enviando mensaje a +${cleanPhone}:`, sendError.message);
      throw sendError;
    }
  }
}

export const whatsappEngine = new WhatsAppEngine();
