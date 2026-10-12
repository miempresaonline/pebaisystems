import fs from 'fs';
import path from 'path';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { Config } from './config.js';

let googleDocInstance = null;

// Pestañas activas para prospección multicanal de PEBAI Systems
export const TARGET_SHEET_TITLES = ['🎯 Leads Físicos', '🎯 Leads Full Online'];

/**
 * Inicializa la conexión con Google Sheets si está configurado.
 */
async function initGoogleSheets() {
  if (!Config.SHEETS.SPREADSHEET_ID) {
    return null;
  }

  if (googleDocInstance) return googleDocInstance;

  try {
    if (!fs.existsSync(Config.SHEETS.SERVICE_ACCOUNT_PATH)) {
      console.warn(`⚠️ Archivo de cuenta de servicio no encontrado en: ${Config.SHEETS.SERVICE_ACCOUNT_PATH}`);
      return null;
    }

    const creds = JSON.parse(fs.readFileSync(Config.SHEETS.SERVICE_ACCOUNT_PATH, 'utf8'));

    const serviceAccountAuth = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const doc = new GoogleSpreadsheet(Config.SHEETS.SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    console.log(`📊 Conectado a Google Sheets: "${doc.title}"`);
    googleDocInstance = doc;
    return doc;
  } catch (err) {
    console.error('❌ Error conectando a Google Sheets:', err.message);
    return null;
  }
}

export { initGoogleSheets as getSheetsDocument };

/**
 * Normaliza números de teléfono para España o formato internacional.
 */
export function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return '';
  let clean = String(rawPhone).replace(/[^0-9]/g, '');
  if (!clean) return '';

  // Si tiene 9 dígitos y empieza por 6, 7, 8 o 9 (móviles/fijos de España)
  if (clean.length === 9 && ['6', '7', '8', '9'].includes(clean[0])) {
    return `34${clean}`;
  }

  // Si empieza por 0034, eliminar los ceros
  if (clean.startsWith('0034')) {
    clean = clean.substring(2);
  }

  return clean;
}

/**
 * Parsea marcas temporales registradas en Google Sheets al formato timestamp en ms.
 */
function parseSheetTimestamp(rawDate) {
  if (!rawDate) return 0;
  try {
    const parts = rawDate.split(',');
    if (parts.length === 2) {
      const dParts = parts[0].trim().split('/');
      const tParts = parts[1].trim().split(':');
      if (dParts.length === 3 && tParts.length >= 2) {
        const day = parseInt(dParts[0], 10);
        const month = parseInt(dParts[1], 10) - 1;
        let year = parseInt(dParts[2], 10);
        if (year < 100) year += 2000;
        const hours = parseInt(tParts[0], 10);
        const mins = parseInt(tParts[1], 10);
        const secs = tParts[2] ? parseInt(tParts[2], 10) : 0;

        const isSummerTime = (month >= 2 && month <= 9);
        const offset = isSummerTime ? '+02:00' : '+01:00';
        const mMonth = String(month + 1).padStart(2, '0');
        const mDay = String(day).padStart(2, '0');
        const mHours = String(hours).padStart(2, '0');
        const mMins = String(mins).padStart(2, '0');
        const mSecs = String(secs).padStart(2, '0');
        const isoStr = `${year}-${mMonth}-${mDay}T${mHours}:${mMins}:${mSecs}${offset}`;
        const parsedMs = new Date(isoStr).getTime();
        return isNaN(parsedMs) ? 0 : parsedMs;
      }
    }
  } catch (e) {}
  return 0;
}

/**
 * Obtiene los leads pendientes desde Google Sheets en ambas pestañas (Full Online y Físicos).
 */
export async function getPendingLeads() {
  const doc = await initGoogleSheets();

  if (doc) {
    try {
      const contactedPhones = new Set();
      let lastSentMs = 0;
      const allPendingLeads = [];

      // 1. Recorrer ambas pestañas para detectar teléfonos ya contactados y el último envío
      for (const title of TARGET_SHEET_TITLES) {
        const sheet = doc.sheetsByTitle[title];
        if (!sheet) continue;

        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();

        for (const row of rows) {
          const rawPhone = row.get('Teléfono') || row.get('Telefono') || '';
          const cleanPhone = normalizePhoneNumber(rawPhone);
          const waStatus = (row.get('💬 WhatsApp Status') || '').trim().toUpperCase();
          const generalEstado = (row.get('Estado') || '').trim();
          const rawDate = (row.get('📅 Fecha WhatsApp') || '').trim();

          const isContacted = waStatus.includes('ENVIADO') ||
                              waStatus === 'SIN WHATSAPP' ||
                              waStatus.includes('RESPOND') ||
                              waStatus.includes('CONVERS') ||
                              waStatus.includes('DESCARTAD') ||
                              waStatus.includes('FORMULARIO') ||
                              generalEstado.toLowerCase().includes('enviado') ||
                              generalEstado.toLowerCase().includes('descartad') ||
                              generalEstado.toLowerCase().includes('convers') ||
                              Boolean(rawDate);

          if (isContacted && cleanPhone) {
            contactedPhones.add(cleanPhone.slice(-9));
          }

          if (rawDate && (waStatus.includes('ENVIADO') || generalEstado.toLowerCase().includes('enviado'))) {
            const parsedMs = parseSheetTimestamp(rawDate);
            if (parsedMs > lastSentMs) {
              lastSentMs = parsedMs;
            }
          }
        }
      }

      // 2. Extraer leads pendientes de ambas pestañas
      for (const title of TARGET_SHEET_TITLES) {
        const sheet = doc.sheetsByTitle[title];
        if (!sheet) continue;

        const rows = await sheet.getRows();

        for (const row of rows) {
          const encargado = (row.get('Encargado') || '').trim();
          const empresa = (row.get('Empresa') || '').trim();

          // FILTRO ESTRICTO OBLIGATORIO:
          // Encargado debe ser Inteligencia Artificial (o 🤖)
          // NUNCA jamás contactar leads asignados a Adrián Ballesteros
          const isAssignedToAI = encargado.includes('Inteligencia Artificial') || encargado.includes('🤖');
          const isAdrian = encargado.toLowerCase().includes('adrian') || encargado.toLowerCase().includes('ballesteros');

          if (!isAssignedToAI || isAdrian || !empresa) {
            continue;
          }

          const rawPhone = row.get('Teléfono') || row.get('Telefono') || '';
          const cleanPhone = normalizePhoneNumber(rawPhone);
          if (!cleanPhone || cleanPhone.length < 9) {
            continue;
          }

          // Si el teléfono ya fue contactado en cualquier pestaña, ignorar
          if (contactedPhones.has(cleanPhone.slice(-9))) {
            continue;
          }

          const waStatus = (row.get('💬 WhatsApp Status') || '').trim().toUpperCase();
          const generalEstado = (row.get('Estado') || '').trim().toLowerCase();
          const rawDate = (row.get('📅 Fecha WhatsApp') || '').trim();
          const rawMsg = (row.get('📝 Mensaje WhatsApp') || '').trim();

          // Si ya tiene estado enviado, fecha o mensaje, ignorar
          if (waStatus && waStatus !== 'PENDIENTE' && !waStatus.includes('PAUSADO') && !waStatus.includes('DESACTIVADO')) {
            continue;
          }
          if (rawDate || rawMsg) {
            continue;
          }
          if (generalEstado.includes('enviado') || generalEstado.includes('descartad') || generalEstado.includes('convers') || generalEstado.includes('formulario')) {
            continue;
          }

          const isMobile = cleanPhone.startsWith('346') || cleanPhone.startsWith('347');

          allPendingLeads.push({
            rowId: row.rowNumber,
            _rawRow: row,
            tabTitle: title,
            empresa: empresa,
            encargado: encargado,
            telefono: cleanPhone,
            isMobile: isMobile,
            contacto: row.get('Contacto') || '',
            sector: row.get('Nicho') || row.get('Sector') || '',
            ciudad: row.get('Ciudad') || '',
            resenas: row.get('⭐ Reseñas Google') || '',
            tamano: row.get('👥 Tamaño Estimado') || '',
            web: row.get('Web') || '',
            notas: row.get('Notas de la llamada') || row.get('Notas') || '',
            estado: row.get('Estado') || '⚪ Nuevo / Sin llamar'
          });
        }
      }

      // 3. VARIACIÓN MULTICANAL (ROUND-ROBIN ENTRE PESTAÑAS Y NICHOS):
      // Agrupar los leads por pestaña y por sector para intercalarlos
      const byTabAndNiche = {};
      for (const lead of allPendingLeads) {
        const key = `${lead.tabTitle} | ${lead.sector || 'General'}`;
        if (!byTabAndNiche[key]) byTabAndNiche[key] = [];
        byTabAndNiche[key].push(lead);
      }

      const interleaved = [];
      const keys = Object.keys(byTabAndNiche);
      const maxCount = Math.max(0, ...keys.map(k => byTabAndNiche[k].length));

      for (let i = 0; i < maxCount; i++) {
        for (const k of keys) {
          if (i < byTabAndNiche[k].length) {
            interleaved.push(byTabAndNiche[k][i]);
          }
        }
      }

      return {
        source: `Google Sheets [${TARGET_SHEET_TITLES.join(' + ')}]`,
        leads: interleaved,
        lastSentMs
      };
    } catch (e) {
      console.error('⚠️ Error leyendo filas de Google Sheets. Conmutando a CSV:', e.message);
    }
  }

  // Fallback a CSV
  const csvPath = Config.SHEETS.FALLBACK_CSV_PATH;
  if (!fs.existsSync(csvPath)) {
    return { source: 'csv', leads: [], lastSentMs: 0 };
  }

  return { source: 'csv', leads: [], lastSentMs: 0 };
}

/**
 * Actualiza el estado de un lead en Google Sheets tras un envío inicial.
 */
export async function updateLeadStatus(lead, status, messageSnippet = '') {
  const timestamp = new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    dateStyle: 'short',
    timeStyle: 'medium'
  });

  if (lead._rawRow) {
    try {
      const row = lead._rawRow;

      if (status === 'IA mensaje enviado' || status === 'ENVIADO') {
        row.set('💬 WhatsApp Status', 'IA mensaje enviado');
        row.set('Estado', 'IA mensaje enviado');
        row.set('📅 Fecha WhatsApp', timestamp);
        if (messageSnippet) {
          row.set('📝 Mensaje WhatsApp', messageSnippet.substring(0, 1000));
        }
      } else if (status === 'SIN WHATSAPP' || status === 'Sin WhatsApp') {
        row.set('💬 WhatsApp Status', 'Sin WhatsApp');
        row.set('Estado', 'Sin WhatsApp');
        row.set('📅 Fecha WhatsApp', timestamp);
      } else if (status === 'ERROR_TELEFONO' || status === 'Error teléfono') {
        row.set('💬 WhatsApp Status', 'Error teléfono');
        row.set('Estado', 'Error teléfono');
        row.set('📅 Fecha WhatsApp', timestamp);
      } else {
        row.set('💬 WhatsApp Status', status);
        row.set('Estado', status);
        row.set('📅 Fecha WhatsApp', timestamp);
      }

      await row.save();
      return true;
    } catch (err) {
      console.error('❌ Error actualizando fila en Google Sheets:', err.message);
      return false;
    }
  }

  return false;
}

/**
 * Revisa leads contactados hace más de 3 días sin respuesta y los marca como 'No responde'.
 */
export async function checkAndMarkUnresponsiveLeads() {
  const doc = await initGoogleSheets();
  if (!doc) return 0;

  const now = Date.now();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  let markedCount = 0;

  for (const title of TARGET_SHEET_TITLES) {
    const sheet = doc.sheetsByTitle[title];
    if (!sheet) continue;

    try {
      await sheet.loadHeaderRow();
      const rows = await sheet.getRows();

      for (const row of rows) {
        const rawDate = (row.get('📅 Fecha WhatsApp') || '').trim();
        const waStatus = (row.get('💬 WhatsApp Status') || '').trim();
        const estado = (row.get('Estado') || '').trim();

        // Si fue enviado pero aún no ha respondido ni ha sido descartado
        const isAwaitingReply = waStatus === 'IA mensaje enviado' || waStatus === 'ENVIADO' || estado.includes('enviado');
        const isAlreadyProcessed = estado.includes('No responde') || estado.includes('Descartado') || estado.includes('conversación') || estado.includes('Formulario');

        if (rawDate && isAwaitingReply && !isAlreadyProcessed) {
          const sentMs = parseSheetTimestamp(rawDate);
          if (sentMs > 0 && (now - sentMs) > THREE_DAYS_MS) {
            row.set('Estado', 'No responde');
            row.set('💬 WhatsApp Status', 'No responde');
            await row.save();
            markedCount++;
            console.log(`⏳ [3 DÍAS SIN RESPUESTA]: Lead "${row.get('Empresa')}" marcado como "No responde" en ${title}.`);
          }
        }
      }
    } catch (e) {
      console.error(`⚠️ Error revisando no respondidos en ${title}:`, e.message);
    }
  }

  if (markedCount > 0) {
    console.log(`✅ [SEGUIMIENTO]: ${markedCount} leads marcados como "No responde" tras 3 días sin contestar.`);
  }

  return markedCount;
}

/**
 * Actualiza el estado de un lead cuando responde por WhatsApp buscando por su número en ambas pestañas.
 */
export async function updateLeadResponseByPhone(rawPhone, status = 'En conversación', responseSnippet = '') {
  const cleanPhone = normalizePhoneNumber(rawPhone);
  const cleanLast9 = cleanPhone.slice(-9);
  const timestamp = new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    dateStyle: 'short',
    timeStyle: 'medium'
  });

  const doc = await initGoogleSheets();
  if (doc) {
    try {
      for (const title of TARGET_SHEET_TITLES) {
        const sheet = doc.sheetsByTitle[title];
        if (!sheet) continue;

        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();

        for (const row of rows) {
          const rowPhone = normalizePhoneNumber(row.get('Teléfono') || row.get('Telefono') || '');
          if (rowPhone && rowPhone.slice(-9) === cleanLast9) {
            row.set('💬 WhatsApp Status', status);
            row.set('Estado', status);

            const currentNotes = row.get('Notas de la llamada') || row.get('Notas') || '';
            const newNotes = currentNotes
              ? `${currentNotes}\n[WA ${timestamp}]: ${responseSnippet}`
              : `[WA ${timestamp}]: ${responseSnippet}`;

            row.set('Notas de la llamada', newNotes.substring(0, 1000));
            await row.save();
            console.log(`📝 [CRM GOOGLE SHEETS (${title})]: Actualizado +${cleanPhone} -> Estado: "${status}"`);
            return true;
          }
        }
      }
    } catch (err) {
      console.error('❌ Error actualizando respuesta por teléfono en Google Sheets:', err.message);
    }
  }
  return false;
}

/**
 * Consulta la información del lead (Empresa, Sector, Ciudad, Notas) en Google Sheets a partir del teléfono.
 */
export async function getLeadInfoByPhone(rawPhone) {
  const cleanPhone = normalizePhoneNumber(rawPhone);
  const cleanLast9 = cleanPhone.slice(-9);

  const doc = await initGoogleSheets();
  if (doc) {
    try {
      for (const title of TARGET_SHEET_TITLES) {
        const sheet = doc.sheetsByTitle[title];
        if (!sheet) continue;

        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();

        for (const row of rows) {
          const rowPhone = normalizePhoneNumber(row.get('Teléfono') || row.get('Telefono') || '');
          if (rowPhone && rowPhone.slice(-9) === cleanLast9) {
            return {
              empresa: (row.get('Empresa') || '').trim(),
              sector: (row.get('Nicho') || row.get('Sector') || '').trim(),
              ciudad: (row.get('Ciudad') || '').trim(),
              web: (row.get('Web') || '').trim(),
              notas: (row.get('Notas de la llamada') || row.get('Notas') || '').trim(),
              tabTitle: title
            };
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Error buscando datos de lead por teléfono en Google Sheets:', err.message);
    }
  }
  return null;
}
