import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Config } from './config.js';
import { whatsappEngine } from './whatsapp-engine.js';
import { getPendingLeads, updateLeadStatus, checkAndMarkUnresponsiveLeads } from './sheets-service.js';
import { generateOutreachMessage } from './ai-generator.js';
import { checkAndProcessTypeformSubmissions } from './typeform-processor.js';
import { recordOutreachMessageSent } from './sales-closer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dailySentCount = 0;
let currentDayStr = '';

/**
 * Retorna la fecha y hora actual en la zona horaria de España peninsular.
 */
function getSpainDate() {
  const now = new Date();
  const esStr = now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' });
  return new Date(esStr);
}

/**
 * Comprueba si el momento actual está dentro del horario laboral de prospección:
 * - Lunes a Jueves: 08:30 a 14:00 y 16:00 a 19:30
 * - Viernes: 08:30 a 14:00 (tarde libre, sin prospección)
 * - Excepción hoy viernes 18/09/2026: hasta las 19:00 (7:00 pm)
 * - Fines de semana: pausado
 */
function checkScheduleStatus() {
  const spain = getSpainDate();
  const dayOfWeek = spain.getDay(); // 0 = Domingo, 1 = Lunes, ..., 5 = Viernes, 6 = Sábado
  const hours = spain.getHours();
  const minutes = spain.getMinutes();
  const currentTotalMinutes = hours * 60 + minutes;

  const todayStr = `${spain.getFullYear()}-${spain.getMonth() + 1}-${spain.getDate()}`;
  if (todayStr !== currentDayStr) {
    currentDayStr = todayStr;
    dailySentCount = 0; // Reiniciar contador diario al cambiar de día
  }

  // 1. Comprobar fin de semana (Sábado y Domingo siempre pausados)
  if (!Config.SCHEDULE.ALLOW_WEEKENDS && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return {
      allowed: false,
      reason: 'Fin de semana (prospección pausada)',
      waitMs: calculateWaitUntilNextMondayMorning(spain)
    };
  }

  const morningStart = Config.SCHEDULE.MORNING.START_HOUR * 60 + Config.SCHEDULE.MORNING.START_MINUTE; // 08:30 = 510
  const morningEnd = Config.SCHEDULE.MORNING.END_HOUR * 60 + Config.SCHEDULE.MORNING.END_MINUTE;       // 14:00 = 840

  const afternoonStart = Config.SCHEDULE.AFTERNOON.START_HOUR * 60 + Config.SCHEDULE.AFTERNOON.START_MINUTE; // 16:00 = 960
  const afternoonEnd = Config.SCHEDULE.AFTERNOON.END_HOUR * 60 + Config.SCHEDULE.AFTERNOON.END_MINUTE;       // 19:30 = 1170

  // 2. Antes de la mañana (ej. 07:00) -> esperar hasta 08:30 de hoy
  if (currentTotalMinutes < morningStart) {
    const diffMinutes = morningStart - currentTotalMinutes;
    return {
      allowed: false,
      reason: `Fuera de horario (abre a las ${formatTime(Config.SCHEDULE.MORNING.START_HOUR, Config.SCHEDULE.MORNING.START_MINUTE)})`,
      waitMs: diffMinutes * 60 * 1000
    };
  }

  // 3. Turno Mañana activo (08:30 - 14:00) - Aplica a Lunes, Martes, Miércoles, Jueves y Viernes
  if (currentTotalMinutes >= morningStart && currentTotalMinutes < morningEnd) {
    return { allowed: true, slot: 'mañana' };
  }

  // 4. Tratamiento de VIERNES (dayOfWeek === 5)
  // Regla general: Los viernes solo de 08:30 a 14:00 (las tardes no se trabaja).
  // Excepción hoy (18/09/2026): permitido hasta las 19:00 (7:00 pm).
  const isTodayException = (spain.getFullYear() === 2026 && spain.getMonth() === 8 && spain.getDate() === 18);
  if (dayOfWeek === 5) {
    if (isTodayException) {
      const exceptionEndMinutes = 19 * 60; // 19:00 (7:00 pm)
      if (currentTotalMinutes >= afternoonStart && currentTotalMinutes < exceptionEndMinutes) {
        return { allowed: true, slot: 'tarde (excepción hoy hasta 19:00)' };
      }
      if (currentTotalMinutes >= exceptionEndMinutes) {
        return {
          allowed: false,
          reason: `Jornada excepcional de hoy finalizada a las 19:00 (se reanuda el lunes a las ${formatTime(Config.SCHEDULE.MORNING.START_HOUR, Config.SCHEDULE.MORNING.START_MINUTE)})`,
          waitMs: calculateWaitUntilNextMondayMorning(spain)
        };
      }
      if (currentTotalMinutes >= morningEnd && currentTotalMinutes < afternoonStart) {
        const diffMinutes = afternoonStart - currentTotalMinutes;
        return {
          allowed: false,
          reason: `Pausa de mediodía (se reanuda a las ${formatTime(Config.SCHEDULE.AFTERNOON.START_HOUR, Config.SCHEDULE.AFTERNOON.START_MINUTE)})`,
          waitMs: diffMinutes * 60 * 1000
        };
      }
    } else {
      // Viernes normal recurrente: a partir de las 14:00 no hay turno de tarde
      if (currentTotalMinutes >= morningEnd) {
        return {
          allowed: false,
          reason: `Viernes por la tarde sin prospección (se reanuda el lunes a las ${formatTime(Config.SCHEDULE.MORNING.START_HOUR, Config.SCHEDULE.MORNING.START_MINUTE)})`,
          waitMs: calculateWaitUntilNextMondayMorning(spain)
        };
      }
    }
  }

  // 5. Lunes a Jueves: Pausa de mediodía (14:00 - 16:00)
  if (currentTotalMinutes >= morningEnd && currentTotalMinutes < afternoonStart) {
    const diffMinutes = afternoonStart - currentTotalMinutes;
    return {
      allowed: false,
      reason: `Pausa de mediodía (se reanuda a las ${formatTime(Config.SCHEDULE.AFTERNOON.START_HOUR, Config.SCHEDULE.AFTERNOON.START_MINUTE)})`,
      waitMs: diffMinutes * 60 * 1000
    };
  }

  // 6. Lunes a Jueves: Turno Tarde activo (16:00 - 19:30)
  if (currentTotalMinutes >= afternoonStart && currentTotalMinutes < afternoonEnd) {
    return { allowed: true, slot: 'tarde' };
  }

  // 7. Lunes a Jueves: Después de las 19:30 -> esperar hasta mañana a las 08:30
  const minutesUntilMidnight = (24 * 60) - currentTotalMinutes;
  const totalMinutesUntilTomorrow = minutesUntilMidnight + morningStart;
  return {
    allowed: false,
    reason: `Jornada finalizada por hoy (se reanuda mañana a las ${formatTime(Config.SCHEDULE.MORNING.START_HOUR, Config.SCHEDULE.MORNING.START_MINUTE)})`,
    waitMs: totalMinutesUntilTomorrow * 60 * 1000
  };
}

function calculateWaitUntilNextMondayMorning(spainDate) {
  const day = spainDate.getDay();
  let daysToAdd = 1;
  if (day === 5) daysToAdd = 3; // Viernes noche -> 3 días para Lunes
  if (day === 6) daysToAdd = 2; // Sábado -> 2 días para Lunes
  if (day === 0) daysToAdd = 1; // Domingo -> 1 día para Lunes

  const currentTotalMinutes = spainDate.getHours() * 60 + spainDate.getMinutes();
  const morningStart = Config.SCHEDULE.MORNING.START_HOUR * 60 + Config.SCHEDULE.MORNING.START_MINUTE;
  const minutesToMidnight = (24 * 60) - currentTotalMinutes;

  const totalWaitMinutes = minutesToMidnight + ((daysToAdd - 1) * 24 * 60) + morningStart;
  return totalWaitMinutes * 60 * 1000;
}

function formatTime(h, m) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Bucle de ejecución principal del bot.
 */
async function startOutreachLoop() {
  if (!Config.ENABLED || process.env.BOT_ENABLED === 'false') {
    console.log('============================================================');
    console.log('🛑 [BOT TOTALMENTE DESACTIVADO]');
    console.log('El bot está pausado por orden directa del usuario.');
    console.log('No se enviará ningún mensaje ni se establecerán conexiones.');
    console.log('Para volver a activarlo, cambia BOT_ENABLED=true en .env.');
    console.log('============================================================');
    process.exit(0);
  }

  console.log('============================================================');
  console.log('🤖 INICIANDO BOT DE PROSPECCIÓN WHATSAPP - PEBAI SYSTEMS');
  console.log('⏰ Horario L-J: 08:30 a 14:00 y 16:00 a 19:30');
  console.log('⏰ Horario Viernes: 08:30 a 14:00 (tardes libre)');
  console.log('⚡ Excepción hoy (18/09): activo hasta las 19:00');
  console.log(`⏳ Cadencia humana entre envíos: ${Config.DELAYS.MIN_MINUTES} a ${Config.DELAYS.MAX_MINUTES} minutos`);
  console.log(`🎯 Límite máximo de envíos diarios: ${Config.LIMITS.MAX_DAILY_MESSAGES} mensajes`);
  console.log('============================================================\n');

  // 1. Iniciar WhatsApp Baileys
  await whatsappEngine.initialize();

  // 2. Esperar a que la sesión esté conectada
  console.log('⏳ Esperando conexión de WhatsApp...');
  await whatsappEngine.waitUntilReady();
  let lastLocalSentMs = 0;

  // 3. Bucle continuo de prospección
  while (true) {
    if (!Config.ENABLED || process.env.BOT_ENABLED === 'false') {
      console.log('\n🛑 [BOT DESACTIVADO] Se ha detectado la orden de pausa. Deteniendo ejecución...');
      process.exit(0);
    }

    try {
      // Comprobar si hay una solicitud de envío manual o de prueba encolada
      const triggerPath = path.join(__dirname, 'send_trigger.json');
      if (fs.existsSync(triggerPath)) {
        try {
          const triggerData = JSON.parse(fs.readFileSync(triggerPath, 'utf8'));
          fs.unlinkSync(triggerPath);
          if (triggerData.phone && triggerData.text) {
            console.log(`📤 [ENVÍO MANUAL / TEST]: Enviando mensaje a +${triggerData.phone}...`);
            const sendResult = await whatsappEngine.sendHumanLikeMessage(triggerData.phone, triggerData.text);
            if (sendResult.success) {
              recordOutreachMessageSent(triggerData.phone, triggerData.text, triggerData);
              console.log(`✅ [ENVÍO MANUAL COMPLETADO]: Mensaje enviado y registrado en memoria para +${triggerData.phone}`);
            }
          }
        } catch (trigErr) {
          console.error('⚠️ Error procesando send_trigger.json:', trigErr.message);
        }
      }

      // Si la prospección en frío está en pausa (modo prueba / solo recepción)
      if (!Config.OUTREACH_ENABLED) {
        // WhatsApp sigue conectado al 100% escuchando mensajes y respondiendo a pruebas/clientes
        await sleep(3000);
        continue;
      }

      // Comprobar horario
      const schedule = checkScheduleStatus();
      if (!schedule.allowed) {
        const waitMinutes = Math.round(schedule.waitMs / (1000 * 60));
        console.log(`\n⏸️ [REPOSO] ${schedule.reason}. Esperando ${waitMinutes} minutos...`);
        await sleep(Math.min(schedule.waitMs, 30 * 60 * 1000)); // Revisar al menos cada 30 min
        continue;
      }

      // Procesar respuestas entrantes del Typeform (Descartes Opción B tras 2h y Leads Opción A)
      await checkAndProcessTypeformSubmissions(whatsappEngine);

      // Comprobar y marcar leads sin respuesta tras más de 3 días
      await checkAndMarkUnresponsiveLeads();

      // Comprobar límite diario de prospección en frío
      if (dailySentCount >= Config.LIMITS.MAX_DAILY_MESSAGES) {
        console.log(`\n🛑 [CUOTA DIARIA CUMPLIDA] Se han alcanzado ${dailySentCount} de ${Config.LIMITS.MAX_DAILY_MESSAGES} mensajes hoy.`);
        console.log('Pausando envíos hasta la jornada de mañana para proteger la cuenta contra baneos...');
        await sleep(60 * 60 * 1000); // Dormir 1 hora antes de volver a evaluar el día
        continue;
      }

      // Obtener leads pendientes
      const { source, leads, lastSentMs } = await getPendingLeads();

      if (!leads || leads.length === 0) {
        console.log(`\n💤 No hay leads pendientes en ${source}. Esperando 5 minutos para volver a comprobar...`);
        await sleep(5 * 60 * 1000);
        continue;
      }

      // SEGURIDAD CRÍTICA ANTI-SPAM / REARRANQUE:
      // Comprobar cuándo fue el último envío registrado (en Google Sheets o en memoria local).
      // Si han pasado menos de MIN_MINUTES (ej. 8 min) desde el último envío, ESPERAR antes de enviar.
      // De esta forma NUNCA se enviará un mensaje inmediato al editar código o reiniciar el bot.
      const mostRecentSentMs = Math.max(lastSentMs || 0, lastLocalSentMs || 0);
      if (mostRecentSentMs > 0) {
        let elapsedSinceLastSendMs = Date.now() - mostRecentSentMs;
        // Blindaje contra desfases de reloj o zonas horarias: si es negativo, asumir que acaba de ocurrir
        if (elapsedSinceLastSendMs < 0) {
          elapsedSinceLastSendMs = 0;
        }

        const minCadenceMs = Config.DELAYS.MIN_MINUTES * 60 * 1000;
        if (elapsedSinceLastSendMs < minCadenceMs) {
          // El tiempo restante nunca puede ser superior al intervalo configurado (ej. 8 min)
          const remainingWaitMs = Math.min(minCadenceMs, Math.max(0, minCadenceMs - elapsedSinceLastSendMs));
          const waitMinsFormatted = (remainingWaitMs / (60 * 1000)).toFixed(1);
          const elapsedMinsFormatted = (elapsedSinceLastSendMs / (60 * 1000)).toFixed(1);
          console.log(`\n🛡️ [CADENCIA DE SEGURIDAD] Hace solo ${elapsedMinsFormatted} min del último envío registrado.`);
          console.log(`⏳ Esperando ${waitMinsFormatted} min más para garantizar el intervalo mínimo de ${Config.DELAYS.MIN_MINUTES} minutos...`);
          await sleep(remainingWaitMs);
          continue; // Volver a evaluar horario y lista tras la espera
        }
      }

      const nextLead = leads[0];
      console.log(`\n🎯 [NUEVO PROSPECTO (${leads.length} pendientes)] ${nextLead.empresa} (${nextLead.sector || 'Sin sector'}) | [${nextLead.tabTitle}]`);
      console.log(`🤖 Encargado en Sheet: ${nextLead.encargado}`);
      console.log(`📱 Teléfono normalizado: +${nextLead.telefono}`);

      if (!nextLead.telefono || nextLead.telefono.length < 9) {
        console.warn(`⚠️ Teléfono no válido para ${nextLead.empresa}: "${nextLead.telefono}". Marcando como ERROR.`);
        await updateLeadStatus(nextLead, 'ERROR_TELEFONO');
        continue;
      }

      // Generar mensaje variado con IA
      console.log('🤖 Generando mensaje único y personalizado con IA...');
      const messageText = await generateOutreachMessage(nextLead);

      console.log('------------------------------------------------------------');
      console.log(`💬 TEXTO A ENVIAR:\n${messageText}`);
      console.log('------------------------------------------------------------');

      // Enviar con simulación humana de presencia
      const sendResult = await whatsappEngine.sendHumanLikeMessage(nextLead.telefono, messageText);

      if (sendResult.success) {
        lastLocalSentMs = Date.now();
        dailySentCount++;
        console.log(`✅ Registrando estado "IA mensaje enviado" en ${nextLead.tabTitle} (Total hoy: ${dailySentCount}/${Config.LIMITS.MAX_DAILY_MESSAGES})`);
        await updateLeadStatus(nextLead, 'IA mensaje enviado', messageText);
        recordOutreachMessageSent(nextLead.telefono, messageText, nextLead);

        // Espera aleatoria entre MIN_MINUTES y MAX_MINUTES
        const minSec = Config.DELAYS.MIN_MINUTES * 60;
        const maxSec = Config.DELAYS.MAX_MINUTES * 60;
        const randomSeconds = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
        const randomMinutes = (randomSeconds / 60).toFixed(1);

        console.log(`\n🛡️ [PAUSA ANTI-BANEO] Esperando ${randomMinutes} minutos (${randomSeconds}s) antes del siguiente contacto...`);
        await sleep(randomSeconds * 1000);
      } else if (sendResult.reason === 'NO_TIENE_WHATSAPP') {
        console.log(`⚠️ Marcando en ${nextLead.tabTitle} como SIN WHATSAPP`);
        await updateLeadStatus(nextLead, 'SIN WHATSAPP');
        // Pausa breve de 15 segundos ya que no se envió nada
        await sleep(15 * 1000);
      } else {
        console.error(`❌ Error en el envío: ${sendResult.error || 'Desconocido'}. Marcando como ERROR.`);
        await updateLeadStatus(nextLead, 'ERROR');
        await sleep(30 * 1000);
      }

    } catch (loopError) {
      console.error('❌ Error inesperado en el bucle de prospección:', loopError);
      await sleep(30 * 1000);
    }
  }
}

startOutreachLoop();
