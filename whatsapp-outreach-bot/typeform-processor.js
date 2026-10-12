import { Config } from './config.js';
import { getSheetsDocument, normalizePhoneNumber } from './sheets-service.js';

/**
 * Comprueba si la hora actual en España está dentro del horario comercial:
 * 08:30-14:00 y 16:00-19:30 (Lunes a Viernes)
 */
function isWithinWorkingHours() {
  const spain = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const day = spain.getDay();
  if (day === 0 || day === 6) return false; // Fin de semana

  const totalMinutes = spain.getHours() * 60 + spain.getMinutes();
  const morningStart = Config.SCHEDULE.MORNING.START_HOUR * 60 + Config.SCHEDULE.MORNING.START_MINUTE; // 08:30
  const morningEnd = Config.SCHEDULE.MORNING.END_HOUR * 60 + Config.SCHEDULE.MORNING.END_MINUTE;       // 14:00
  const afternoonStart = Config.SCHEDULE.AFTERNOON.START_HOUR * 60 + Config.SCHEDULE.AFTERNOON.START_MINUTE; // 16:00
  const afternoonEnd = Config.SCHEDULE.AFTERNOON.END_HOUR * 60 + Config.SCHEDULE.AFTERNOON.END_MINUTE;       // 19:30

  return (totalMinutes >= morningStart && totalMinutes < morningEnd) ||
         (totalMinutes >= afternoonStart && totalMinutes < afternoonEnd);
}

/**
 * Analiza una fecha o marca temporal para calcular las horas transcurridas.
 */
function getHoursElapsed(rawDateStr) {
  if (!rawDateStr) return 999;
  try {
    const parsed = new Date(rawDateStr);
    if (isNaN(parsed.getTime())) return 999;
    const diffMs = Date.now() - parsed.getTime();
    return diffMs / (1000 * 60 * 60);
  } catch (e) {
    return 999;
  }
}

/**
 * Sincroniza automáticamente las respuestas del Diagnóstico Web (pebaisystems.es/api/diagnostico.php) con Google Sheets.
 */
async function syncWebDiagnosticoToGoogleSheets(sheet) {
  try {
    const token = process.env.PEBAI_ALERT_TOKEN || '';
    const url = `https://pebaisystems.es/api/diagnostico.php?token=${token}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return;

    const data = await response.json();
    if (!data.submissions || data.submissions.length === 0) return;

    const rows = await sheet.getRows();
    const existingPhones = new Set();
    for (const r of rows) {
      const p = normalizePhoneNumber(r.get('Teléfono') || '');
      if (p) existingPhones.add(p.slice(-9));
    }

    for (const sub of data.submissions) {
      const cleanPhone = normalizePhoneNumber(sub.telefono);
      if (cleanPhone && !existingPhones.has(cleanPhone.slice(-9))) {
        await sheet.addRow({
          'Marca temporal': sub.created_at || new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }),
          'Nombre': sub.nombre || '',
          'Empresa': sub.empresa || '',
          'Teléfono': cleanPhone,
          'Canal Captación': sub.canal || '',
          'Volumen Consultas Mes': sub.volumen || '',
          'Objetivo Prioritario': sub.objetivo || '',
          'Presupuesto / Opción': sub.presupuesto || (sub.opcion ? `Opción ${sub.opcion}` : ''),
          '💬 Estado WhatsApp': 'PENDIENTE',
          '📅 Fecha WhatsApp': '',
          '📝 Notas': `Web Diagnóstico (ID: ${sub.id || 'web'})`
        });
        existingPhones.add(cleanPhone.slice(-9));
        console.log(`📥 [WEB DIAGNÓSTICO -> GOOGLE SHEETS]: Añadida nueva respuesta de ${sub.empresa || sub.nombre} (+${cleanPhone})`);
      }
    }
  } catch (e) {
    // Si la web no está disponible o no hay registros, continúa normalmente
  }
}

/**
 * Sincroniza automáticamente las respuestas de la API de Tally con Google Sheets.
 */
async function syncTallyApiToGoogleSheets(sheet) {
  if (!Config.TYPEFORM.TALLY_API_KEY || !Config.TYPEFORM.TALLY_FORM_ID) return;

  try {
    const url = `https://api.tally.so/forms/${Config.TYPEFORM.TALLY_FORM_ID}/submissions`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${Config.TYPEFORM.TALLY_API_KEY}`
      }
    });

    if (!response.ok) return;
    const data = await response.json();
    if (!data.submissions || data.submissions.length === 0) return;

    // Crear mapa de preguntas y opciones
    const questionMap = {};
    if (data.questions) {
      for (const q of data.questions) {
        questionMap[q.id] = q.title;
        if (q.fields) {
          for (const f of q.fields) {
            questionMap[f.id] = q.title;
            if (f.options) {
              for (const opt of f.options) {
                questionMap[opt.id] = opt.text;
              }
            }
          }
        }
      }
    }

    // Obtener filas existentes en el Sheet para no duplicar
    const rows = await sheet.getRows();
    const existingPhones = new Set();
    for (const r of rows) {
      const p = normalizePhoneNumber(r.get('Teléfono') || '');
      if (p) existingPhones.add(p.slice(-9));
    }

    for (const sub of data.submissions) {
      let nombre = '';
      let empresa = '';
      let telefono = '';
      let canal = '';
      let volumen = '';
      let objetivo = '';
      let presupuesto = '';

      if (sub.answers) {
        for (const ans of sub.answers) {
          const qTitle = (questionMap[ans.questionId] || '').toLowerCase();
          let val = ans.value;
          if (Array.isArray(val)) {
            val = val.map(vId => questionMap[vId] || vId).join(', ');
          } else if (questionMap[val]) {
            val = questionMap[val];
          }

          if (qTitle.includes('llamas') || qTitle.includes('nombre')) nombre = val;
          else if (qTitle.includes('empresa')) empresa = val;
          else if (qTitle.includes('teléfono') || qTitle.includes('telefono') || qTitle.includes('whatsapp')) telefono = val;
          else if (qTitle.includes('canal')) canal = val;
          else if (qTitle.includes('consultas') || qTitle.includes('volumen')) volumen = val;
          else if (qTitle.includes('objetivo')) objetivo = val;
          else if (qTitle.includes('presupuesto') || qTitle.includes('invertir') || qTitle.includes('1.500')) presupuesto = val;
        }
      }

      if (sub.hiddenFields) {
        if (sub.hiddenFields.telefono) telefono = sub.hiddenFields.telefono;
        if (sub.hiddenFields.empresa) empresa = sub.hiddenFields.empresa;
        if (sub.hiddenFields.nombre) nombre = sub.hiddenFields.nombre;
      }

      if (sub.fields) {
        for (const f of sub.fields) {
          const k = (f.key || f.label || '').toLowerCase();
          if (k.includes('telefono') || k.includes('teléfono')) telefono = f.value || telefono;
          if (k.includes('empresa')) empresa = f.value || empresa;
          if (k.includes('nombre')) nombre = f.value || nombre;
        }
      }

      const cleanPhone = normalizePhoneNumber(telefono);
      if (cleanPhone && !existingPhones.has(cleanPhone.slice(-9))) {
        await sheet.addRow({
          'Marca temporal': sub.createdAt ? new Date(sub.createdAt).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }) : '',
          'Nombre': nombre || '',
          'Empresa': empresa || '',
          'Teléfono': cleanPhone,
          'Canal Captación': canal || '',
          'Volumen Consultas Mes': volumen || '',
          'Objetivo Prioritario': objetivo || '',
          'Presupuesto / Opción': presupuesto || '',
          '💬 Estado WhatsApp': 'PENDIENTE',
          '📅 Fecha WhatsApp': '',
          '📝 Notas': `Sincronizado vía Tally API (${sub.id})`
        });
        existingPhones.add(cleanPhone.slice(-9));
        console.log(`📥 [TALLY -> GOOGLE SHEETS]: Añadida nueva respuesta de ${empresa || nombre} (+${cleanPhone})`);
      }
    }
  } catch (e) {
    console.error('⚠️ Error sincronizando Tally con Google Sheets:', e.message);
  }
}

/**
 * Revisa la pestaña de Typeform en Google Sheets y procesa las respuestas según Opción A u Opción B.
 */
export async function checkAndProcessTypeformSubmissions(whatsappEngine) {
  const doc = await getSheetsDocument();
  if (!doc) return;

  const tabName = Config.SHEETS.TYPEFORM_TAB_NAME || '📋 Respuestas Typeform';
  const sheet = doc.sheetsByTitle[tabName];
  if (!sheet) return;

  try {
    // 1. Sincronizar automáticamente cualquier nueva respuesta desde la Web oficial de Diagnóstico
    await syncWebDiagnosticoToGoogleSheets(sheet);

    // 2. Sincronizar automáticamente cualquier nueva respuesta desde la API de Tally (respaldo)
    await syncTallyApiToGoogleSheets(sheet);

    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    for (const row of rows) {
      const waStatus = (row.get('💬 Estado WhatsApp') || '').trim();
      if (waStatus && waStatus !== 'PENDIENTE') {
        continue; // Ya procesado
      }

      const rawPhone = row.get('Teléfono') || row.get('Telefono') || row.get('WhatsApp') || '';
      const phone = normalizePhoneNumber(rawPhone);
      if (!phone || phone.length < 9) continue;

      const nombre = row.get('Nombre') || row.get('Contacto') || '';
      const empresa = row.get('Empresa') || '';
      const rawBudgetAnswer = (row.get('Presupuesto / Opción') || row.get('Presupuesto') || '').toLowerCase();
      const rawTimestamp = row.get('Marca temporal') || row.get('Fecha') || '';

      const isOptionB = rawBudgetAnswer.includes('opción b') || 
                        rawBudgetAnswer.includes('opcion b') || 
                        rawBudgetAnswer.includes('gratuita') || 
                        rawBudgetAnswer.includes('solo buscamos') ||
                        rawBudgetAnswer.includes('no, ahora') ||
                        rawBudgetAnswer === 'b';

      const isOptionA = rawBudgetAnswer.includes('opción a') || 
                        rawBudgetAnswer.includes('opcion a') || 
                        rawBudgetAnswer.includes('sí') || 
                        rawBudgetAnswer.includes('si') || 
                        rawBudgetAnswer.includes('tenemos presupuesto') ||
                        rawBudgetAnswer === 'a';

      // ----------------------------------------------------
      // CASO OPCIÓN B: Descarte educado tras 2 horas en horario comercial
      // ----------------------------------------------------
      if (isOptionB) {
        const hoursElapsed = getHoursElapsed(rawTimestamp);

        // Comprobar que hayan pasado al menos las 2 horas
        if (hoursElapsed < Config.TYPEFORM.DELAY_HOURS_OPTION_B) {
          continue; // Todavía no han pasado las 2 horas de espera estratégica
        }

        // Comprobar que estemos en horario comercial (08:30-14:00 o 16:00-19:30)
        if (!isWithinWorkingHours()) {
          continue; // Esperar al siguiente turno comercial
        }

        // Enviar WhatsApp de descarte de alto estatus
        if (whatsappEngine && whatsappEngine.isReady) {
          const rejectionText = Config.SCRIPTS.REJECTION_OPTION_B(nombre);
          console.log(`\n🚫 [TYPEFORM - DESCARTE TRAS 2H] Enviando mensaje de descarte a ${empresa || nombre} (+${phone})...`);
          
          const result = await whatsappEngine.sendHumanLikeMessage(phone, rejectionText);
          if (result.success) {
            const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
            row.set('💬 Estado WhatsApp', 'DESCARTADO_ENVIADO');
            row.set('📅 Fecha WhatsApp', timestamp);
            await row.save();
            console.log(`✅ Descarte registrado en Google Sheets para +${phone}`);
          }
        }
      }

      // ----------------------------------------------------
      // CASO OPCIÓN A: Lead Cualificado (+2.000€)
      // ----------------------------------------------------
      if (isOptionA) {
        if (waStatus !== '⭐ APROBADO_LISTO') {
          console.log(`\n🎉 [TYPEFORM - LEAD CUALIFICADO (+2.000€)] ${empresa} (${nombre}) ha marcado Opción A.`);
          row.set('💬 Estado WhatsApp', '⭐ APROBADO_LISTO');
          await row.save();
          console.log(`⭐ Marcado en Google Sheets como ⭐ APROBADO_LISTO.`);
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Error al procesar respuestas de Typeform en Google Sheets:', err.message);
  }
}
