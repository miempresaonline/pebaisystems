import { Config } from './config.js';
import { recordMessageSent } from './learning-engine.js';

/**
 * Generador de prospección con Inteligencia Artificial y RAZONAMIENTO PROFUNDO.
 * Analiza todo el perfil del lead en Google Sheets (empresa, sector, ciudad, reseñas, web, notas)
 * y selecciona quirúrgicamente el mejor ángulo de los 3 aprobados por Daniel:
 * 1. INFLUENCIA_GEO (Posicionamiento en ChatGPT / Google AI)
 * 2. DOLOR_TIEMPO (Filtrado de curiosos sin presupuesto para no perder horas)
 * 3. FUGA_FUERA_HORARIO (Captación y cualificación en noches y fines de semana)
 */

async function callDeepReasoningGroq(lead) {
  if (!Config.AI.GROQ_API_KEY) throw new Error('Groq API Key no configurada');

  const cleanName = cleanCompanyName(lead.empresa);
  const city = lead.ciudad || 'su zona';

  const systemPrompt = `Eres un estratega comercial de élite para PEBAI Systems (pebaisystems.es).
Tu misión es analizar con razonamiento profundo los datos de una empresa de Google Sheets y redactar un gancho de prospección por WhatsApp ultra-corto, quirúrgico y de alto impacto.

LOS 3 ÁNGULOS ESTRATÉGICOS APROBADOS POR DANIEL:
- ÁNGULO 1 (GEO / Visibilidad en IA): "¿Cómo influiría en [empresa] aparecer recomendados en ChatGPT y Google AI cuando buscan [servicio] en [ciudad]?"
- ÁNGULO 2 (Dolor de tiempo / Filtrado de curiosos): "¿Cuántas horas perdéis a la semana con personas que piden presupuestos de [servicio] pero no tenían presupuesto real?"
- ÁNGULO 3 (Fuga fuera de horario / Respuesta inmediata): "Cuando os entra un contacto de [servicio] un viernes tarde o fin de semana, ¿tenéis forma de cualificarlo al instante antes de que llame a otra empresa?"

PASOS DE RAZONAMIENTO QUE DEBES SEGUIR:
1. Analiza el modelo de negocio: ¿Qué vende exactamente? ¿Cuál es su perfil de cliente?
2. Diagnostica su mayor dolor:
   - Si es reformas/construcción/modulares: dolor de perder horas midiendo presupuestos a curiosos (Ángulo 2) o visibilidad en IA (Ángulo 1).
   - Si es solar/coches/inmobiliaria: consultas fuera de horario que se van a la competencia (Ángulo 3) o filtrado de solvencia (Ángulo 2).
   - Si es clínica: citas y dudas en fin de semana (Ángulo 3) o recomendación de ChatGPT en su ciudad (Ángulo 1).
3. Selecciona el ángulo idóneo y sintetiza un mensaje ultra-breve.

REGLAS INQUEBRANTABLES:
- Longitud: MÁXIMO 18 A 22 PALABRAS EN TOTAL. Muy breve, directo, sin relleno.
- Inicio obligatorio: "Hola, soy Daniel de PEBAI Systems."
- CERO EMOJIS, CERO ENLACES, CERO FORMALISMOS.
- Una sola pregunta directa y natural en español de España (B2B).
- Formato de respuesta: Devuelve ÚNICAMENTE la frase exacta a enviar.`;

  const userPrompt = `Datos del lead en Google Sheets:
Empresa: ${cleanName}
Sector: ${lead.sector || 'Negocio'}
Ciudad: ${city}
Pestaña CRM: ${lead.tabTitle || 'General'}
Reseñas: ${lead.resenas || 'No indicadas'}
Web: ${lead.web || 'No indicada'}
Notas: ${lead.notas || 'Ninguna'}

Selecciona el ángulo más doloroso y redacta el mensaje quirúrgico de WhatsApp:`;

  const models = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];

  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Config.AI.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.5,
          max_tokens: 1200
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text && isValidGeneratedMessage(text)) {
          return text;
        }
      }
    } catch (e) {}
  }

  return null;
}

async function callGemini(prompt) {
  if (!Config.AI.GEMINI_API_KEY) throw new Error('Gemini API Key no configurada');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${Config.AI.GEMINI_MODEL}:generateContent?key=${Config.AI.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Eres Daniel, fundador de PEBAI Systems.
Redacta un mensaje de WhatsApp B2B ULTRA CORTO (18 a 22 palabras) para una empresa.
REGLAS: CERO EMOJIS, cero enlaces, empieza con "Hola, soy Daniel de PEBAI Systems." y haz una sola pregunta directa en español.
${prompt}
Devuelve SOLAMENTE el texto exacto a enviar por WhatsApp.`
        }]
      }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 120
      }
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

export function cleanCompanyName(rawName) {
  if (!rawName) return 'vuestra empresa';
  let clean = rawName.split('|')[0].split(' -')[0].split(' –')[0].trim();
  return clean || rawName;
}

export function sanitizeAndFixGrammar(rawText) {
  if (!rawText) return '';
  let text = rawText.trim();

  // Quitar comillas
  text = text.replace(/^["'«“]+|["'»”]+$/g, '').trim();

  // Eliminar cualquier emoji residual
  text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // Corregir concordancias gramaticales
  text = text.replace(/\baparecen\s+(la|el|tu|su|vuestra)\b/gi, 'aparece $1');
  text = text.replace(/\bsalen\s+(la|el|tu|su|vuestra)\b/gi, 'sale $1');
  text = text.replace(/\bestán\s+(la|el|tu|su|vuestra)\b/gi, 'está $1');
  text = text.replace(/\btienen\s+(la|el|tu|su|vuestra)\b/gi, 'tiene $1');

  // Asegurar saludo oficial de Daniel
  if (!text.toLowerCase().startsWith('hola, soy daniel de pebai systems')) {
    text = text.replace(/^hola[,.]?\s*(soy daniel)?(\s*de pebai systems)?[,.]?\s*/i, '');
    text = `Hola, soy Daniel de PEBAI Systems. ${text}`;
  }

  text = text.replace(/\s{2,}/g, ' ').trim();
  return text;
}

export function isValidGeneratedMessage(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();

  if (t.length < 35 || t.length > 220) return false;
  if (!t.endsWith('?') && !t.endsWith('.')) return false;

  const badPatterns = [
    /\breference\b/i,
    /\bquestion\b/i,
    /\bplaybook\b/i,
    /\bprompt\b/i,
    /\*\*/,
    /#/,
    /¿ten\b/i,
    /¿ref\b/i,
    /assistant/i,
    /user/i,
    /system/i
  ];

  for (const p of badPatterns) {
    if (p.test(t)) return false;
  }

  return true;
}

/**
 * Plantilla de respaldo segura si las APIs no estuvieran disponibles
 */
function generateTemplateFallback(lead) {
  const cleanName = cleanCompanyName(lead.empresa);
  const city = lead.ciudad || 'vuestra zona';
  const sector = (lead.sector || '').toLowerCase();

  if (sector.includes('reforma') || sector.includes('construc')) {
    return `Hola, soy Daniel de PEBAI Systems. ¿Cuántas horas perdéis a la semana midiendo obras para clientes que luego ni tenían presupuesto real?`;
  } else if (sector.includes('dental') || sector.includes('medic') || sector.includes('estetic')) {
    return `Hola, soy Daniel de PEBAI Systems. Cuando un paciente escribe un fin de semana buscando cita, ¿tenéis forma de cualificarlo al instante?`;
  } else if (sector.includes('modular') || sector.includes('casa')) {
    return `Hola, soy Daniel de PEBAI Systems. ¿Cuántas horas pierde el equipo con curiosos que piden precio de casas sin tener terreno ni presupuesto?`;
  } else if (sector.includes('inmobil')) {
    return `Hola, soy Daniel de PEBAI Systems. ¿Cómo influiría en vuestra agencia salir recomendados en ChatGPT cuando buscan inmobiliaria para vender en ${city}?`;
  }
  return `Hola, soy Daniel de PEBAI Systems. ¿Cómo influiría en ${cleanName} aparecer recomendados en ChatGPT y Google AI cuando buscan vuestros servicios en ${city}?`;
}

/**
 * Función principal para generar el mensaje adaptado al lead con razonamiento profundo.
 */
export async function generateOutreachMessage(lead) {
  let finalText = '';

  // 1. Razonamiento profundo con Groq (120B / Qwen)
  try {
    const text = await callDeepReasoningGroq(lead);
    if (text && isValidGeneratedMessage(text)) {
      finalText = text;
    }
  } catch (errGroq) {}

  // 2. Si falla Groq, intentar Gemini
  if (!finalText) {
    try {
      const cleanName = cleanCompanyName(lead.empresa);
      const city = lead.ciudad || 'su zona';
      const prompt = `Empresa: ${cleanName}, Sector: ${lead.sector}, Ciudad: ${city}. Elige si es mejor preguntar por el dolor de curiosos sin presupuesto o por aparecer en ChatGPT y Google AI.`;
      const text = await callGemini(prompt);
      if (text && isValidGeneratedMessage(text)) {
        finalText = text;
      }
    } catch (errGemini) {}
  }

  // 3. Fallback garantizado probado
  if (!finalText) {
    finalText = generateTemplateFallback(lead);
  }

  finalText = sanitizeAndFixGrammar(finalText);

  if (!isValidGeneratedMessage(finalText)) {
    finalText = generateTemplateFallback(lead);
    finalText = sanitizeAndFixGrammar(finalText);
  }

  // Determinar ángulo detectado para métricas
  let detectedAngle = 'INFLUENCIA_GEO';
  const lower = finalText.toLowerCase();
  if (lower.includes('horas') || lower.includes('curiosos') || lower.includes('presupuesto')) {
    detectedAngle = 'DOLOR_TIEMPO';
  } else if (lower.includes('fin de semana') || lower.includes('viernes') || lower.includes('fuera de horario')) {
    detectedAngle = 'FUGA_FUERA_HORARIO';
  }

  try {
    recordMessageSent(lead.sector || 'General', detectedAngle, finalText, lead.telefono);
  } catch (e) {}

  return finalText;
}

export async function testGeneration() {
  const sampleLead = {
    empresa: 'Clínica Dental Dr. Moreno',
    sector: 'Clínica Dental',
    ciudad: 'Sevilla',
    tabTitle: '🎯 Leads Físicos',
    resenas: '4.8 ⭐ (112 reseñas)',
    web: 'https://clinicadentalmoreno.es',
    telefono: '34612345678'
  };

  console.log('Generando mensaje de prueba con razonamiento profundo para:', sampleLead.empresa);
  const msg = await generateOutreachMessage(sampleLead);
  console.log('-------------------------------------------');
  console.log(msg);
  console.log('Palabras:', msg.split(/\s+/).length);
  console.log('-------------------------------------------');
}
