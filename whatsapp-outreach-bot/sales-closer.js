import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Config } from './config.js';
import { updateLeadResponseByPhone, getLeadInfoByPhone } from './sheets-service.js';
import { recordIncomingResponse } from './learning-engine.js';
import { PEBAI_KNOWLEDGE_BASE } from './knowledge-base.js';
import { sendHumanTransferAlert } from './email-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEMORY_FILE = path.join(__dirname, 'conversations_memory.json');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function loadConversationMemory() {
  if (!fs.existsSync(MEMORY_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveConversationMemory(memory) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf8');
  } catch (e) {
    console.error('⚠️ Error guardando memoria de conversaciones:', e.message);
  }
}

/**
 * Reactiva el bot para un chat previamente derivado a humano mediante comando del operador (#bot, #ia)
 */
export function reactivateLeadAI(senderPhone) {
  const cleanPhone = (senderPhone || '').replace(/[^0-9]/g, '');
  const cleanLast9 = cleanPhone.slice(-9);
  const memory = loadConversationMemory();

  if (memory[cleanLast9]) {
    memory[cleanLast9].transferredToHuman = false;
    saveConversationMemory(memory);
    console.log(`🤖 [IA REACTIVADA]: Bot restablecido para +${cleanPhone}`);
    return true;
  }
  return false;
}

/**
 * Registra un mensaje de prospección inicial enviado por el bot en la memoria de la conversación
 */
export function recordOutreachMessageSent(phone, text, leadData = {}) {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const cleanLast9 = cleanPhone.slice(-9);
  const memory = loadConversationMemory();

  memory[cleanLast9] = {
    empresa: leadData.empresa || 'su empresa',
    sector: leadData.sector || 'Reformas y Servicios',
    ciudad: leadData.ciudad || 'Madrid',
    transferredToHuman: false,
    history: [
      {
        role: 'assistant',
        content: text,
        timestamp: new Date().toISOString()
      }
    ]
  };

  saveConversationMemory(memory);
  console.log(`💾 [MEMORIA INICIAL REGISTRADA]: Lead +${cleanPhone} (${leadData.empresa || 'Empresa'}) registrado en memoria con mensaje previo.`);
}

/**
 * Divide textos largos en 1 o 2 burbujas naturales de WhatsApp
 */
function splitTextIntoHumanChunks(text) {
  if (!text) return [];
  const trimmed = text.trim();

  // Si tiene párrafos claros separados por doble salto de línea
  const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 2) {
    if (paragraphs.length === 2) {
      return paragraphs;
    }
    const chunk1 = paragraphs[0];
    const chunk2 = paragraphs.slice(1).join('\n\n');
    return [chunk1, chunk2];
  }

  // Si no tiene párrafos pero es largo (> 180 caracteres), dividir por punto y seguido
  if (trimmed.length > 180) {
    const sentences = trimmed.split(/(?<=[.!?])\s+/);
    if (sentences.length >= 2) {
      const mid = Math.ceil(sentences.length / 2);
      const c1 = sentences.slice(0, mid).join(' ');
      const c2 = sentences.slice(mid).join(' ');
      return [c1, c2];
    }
  }

  return [trimmed];
}

/**
 * Generador de respuesta comercial consultiva con IA (Gemini 3.6 Flash / Groq 120B).
 * Entrenado con los 3 pilares clave de PEBAI (GEO, Chatbot/WhatsApp IA, Software a Medida)
 * y frameworks de venta de élite (NEPQ, Chris Voss, Hormozi).
 * REGLA ESTRICTA DE VERACIDAD: si algo no está en la base de conocimiento -> [TRANSFER_TO_HUMAN].
 */
async function generateConsultativeAIResponse(leadInfo, incomingText, history) {
  const historyText = history.map(h => `${h.role === 'user' ? 'Cliente' : 'Daniel'}: ${h.content}`).join('\n');
  const kbJson = JSON.stringify(PEBAI_KNOWLEDGE_BASE, null, 2);

  const hasFormAlreadyBeenSent = (history || []).some(h => h.role === 'assistant' && h.content.includes('pebaisystems.es/diagnostico'));

  const systemInstruction = `
Eres Daniel, fundador de PEBAI Systems (https://pebaisystems.es).
Estás hablando directamente por WhatsApp con el dueño o directivo de ${leadInfo.empresa || 'una empresa'}.
Sector del negocio: ${leadInfo.sector || 'General'}.
Ciudad: ${leadInfo.ciudad || 'España'}.

LOS 3 SERVICIOS CORE QUE VENDEMOS (PRIORIDAD MÁXIMA):
1. GEO (Generative Engine Optimization): Posicionamos a la empresa en ChatGPT, Google AI Overviews y Perplexity para que sea la opción #1 recomendada cuando buscan sus servicios en su ciudad.
2. CHATBOT / WHATSAPP IA: Filtro automático 24/7 que cualifica metros cuadrados, presupuesto aproximado, fotos o citas antes de hacer perder tiempo al equipo con visitas o presupuestos vacíos.
3. APLICACIONES Y SOFTWARE A MEDIDA: Herramientas internas, portales de gestión y automatizaciones creadas a medida para su flujo de trabajo, sin cobrar licencias mensuales por usuario.

PROPUESTA DE VALOR IRRESISTIBLE Y MARCO DE EXCLUSIVIDAD:
- Ofrecemos una consultoría de 10 minutos 100% gratuita por videollamada.
- No trabajamos con todo el mundo: primero analizamos sus respuestas del formulario de diagnóstico de 1 minuto (en https://pebaisystems.es/diagnostico) para valorar si su modelo encaja y si realmente podemos hacerles ahorrar horas y dinero.
- Si cualifican, agendamos la llamada de 10 min donde les mostramos el sistema de IA en vivo.
- Es un análisis de auditoría por el que las consultoras cobran cientos de euros, pero lo hacemos gratis para los casos que seleccionamos.

TÉCNICAS DE VENTA APLICADAS (NEPQ & CHRIS VOSS):
- Cero presión de vendedor pesado. Tono de consultor o médico diagnosticando un punto de bloqueo o fuga operativa con honestidad y empatía.
- Preguntas calibradas breves para que el cliente piense en las horas o dinero que pierde ("¿Cuántas horas se van al mes en...?", "¿Os pasa que...?", "¿Te cuadra que lo veamos en 10 min sin compromiso?").
- Si preguntan precio: Explica con naturalidad que no hay cuotas por usuario y que la inversión depende de lo que se automatice; en la llamada de 10 minutos se analiza su caso para darles cifras exactas.
${hasFormAlreadyBeenSent ? `
ESTADO DEL CLIENTE: Ya se le ha facilitado el enlace de diagnóstico (https://pebaisystems.es/diagnostico).
El cliente está haciendo preguntas o dudas antes de completarlo.
ESTRATEGIA PURA DE CIERRE Y EXCLUSIVIDAD:
- Responde a su duda con total claridad, transparencia y brevedad (máximo 25-35 palabras).
- Hazle ver que precisamente al rellenar el formulario de 1 minuto el equipo valora si podemos trabajar con ellos y preparar la auditoría personalizada antes de la videollamada de 10 min.
` : ''}
REGLAS DE ORO INQUEBRANTABLES:
1. CERO EMOJIS. Totalmente prohibido incluir cualquier emoji.
2. ESTRICTA VERACIDAD Y DERIVACIÓN A HUMANO:
   Si el cliente pregunta presupuestos cerrados de desarrollo, compatibilidades técnicas específicas con herramientas no mencionadas, condiciones legales complejas o pide hablar con una persona/llamada directa, responde amablemente que ese dato exacto lo confirmas con el equipo de desarrollo e incluye la etiqueta obligatoria [TRANSFER_TO_HUMAN].
3. MÁXIMA CONCISIÓN OBLIGATORIA: Frases directas y naturales de WhatsApp. Máximo 25 a 35 palabras en total. Cero parrafadas ni rodeos.
4. Devuelve ÚNICAMENTE el texto exacto a enviar.`;

  const prompt = `
Historial de conversación previa:
${historyText}

Nuevo mensaje del cliente:
"${incomingText}"

Redacta la respuesta quirúrgica de WhatsApp de Daniel:`;

  // 1. Prioridad: Groq ultra-rápido con 120B / Qwen (1400 tokens para razonamiento profundo sin truncamiento)
  if (Config.AI.GROQ_API_KEY) {
    const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];
    for (const m of groqModels) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Config.AI.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: m,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt }
            ],
            temperature: 0.4,
            max_tokens: 1400
          })
        });

        if (groqRes.ok) {
          const gData = await groqRes.json();
          let text = gData.choices?.[0]?.message?.content?.trim() || '';
          text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
          if (text) return text.trim();
        }
      } catch (gErr) {}
    }
  }

  // 2. Respaldo secundario: Gemini
  if (Config.AI.GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${Config.AI.GEMINI_MODEL}:generateContent?key=${Config.AI.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 350
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        if (text) return text.trim();
      }
    } catch (err) {}
  }

  return null;
}

/**
 * Envía una respuesta humanizada respetando pausas de lectura, visto, escritura y burbujas.
 */
async function sendHumanizedSalesReply(sock, remoteJid, replyText, userQueue, keysList, customerTypingMap, cleanPhone) {
  const chunks = splitTextIntoHumanChunks(replyText);

  // 1. RETARDO DE PRE-VISTO (Simula que tarda 2.5s a 4.5s en abrir el chat de WhatsApp)
  const preSeenDelay = Math.floor(Math.random() * 2000) + 2500;
  await delay(preSeenDelay);

  if (userQueue && userQueue.abortFlag) {
    console.log(`⏹️ [ABORT]: El cliente envió otro mensaje o está tecleando. Abortando envío anterior.`);
    return false;
  }

  // 2. MARCAR COMO LEÍDO (DOBLE CHECK AZUL)
  if (Array.isArray(keysList) && keysList.length > 0) {
    for (const k of keysList) {
      try {
        await sock.readMessages([k]);
      } catch (e) {}
    }
  }

  // Marcar chat completo como leído para sincronizar mensajes previos que pudieran quedar en gris
  try {
    if (sock.chatModify && remoteJid) {
      await sock.chatModify({ markRead: true, lastMessages: keysList }, remoteJid);
    }
  } catch (e) {}

  // 3. RETARDO DE LECTURA (Una persona lee el mensaje antes de escribir: 3s a 5s)
  const readDelay = Math.floor(Math.random() * 2000) + 3000;
  console.log(`👀 [SALES CLOSER]: Leyendo mensaje del cliente (+${cleanPhone}) durante ${(readDelay/1000).toFixed(1)}s...`);
  await delay(readDelay);

  if (userQueue && userQueue.abortFlag) return false;

  // 4. ENVIAR BURBUJAS CON VELOCIDAD HUMANA
  for (let i = 0; i < chunks.length; i++) {
    if (userQueue && userQueue.abortFlag) return false;

    // Si el cliente empezó a teclear mientras preparábamos la burbuja, esperar
    const typingUntil = customerTypingMap?.get(cleanPhone) || 0;
    if (Date.now() < typingUntil) {
      console.log(`⏳ [PRESENCIA]: El cliente está escribiendo. Pausando burbuja...`);
      await delay(4000);
    }

    const chunk = chunks[i];
    const charCount = chunk.length;

    // Velocidad de mecanografía humana: 50ms - 70ms por carácter (mínimo 2.5s, máximo 7.5s)
    const speed = Math.floor(Math.random() * 20) + 50;
    const typingDuration = Math.min(7500, Math.max(2500, charCount * speed));

    try {
      await sock.sendPresenceUpdate('composing', remoteJid);
      
      // Hesitación humana ocasional (pausa de pensamiento de 1.2s en textos largos)
      if (charCount > 80 && Math.random() < 0.35) {
        await delay(Math.floor(typingDuration * 0.5));
        await sock.sendPresenceUpdate('paused', remoteJid);
        await delay(1200);
        await sock.sendPresenceUpdate('composing', remoteJid);
        await delay(Math.floor(typingDuration * 0.5));
      } else {
        await delay(typingDuration);
      }

      await sock.sendPresenceUpdate('paused', remoteJid);
      await delay(300);

      const sent = await sock.sendMessage(remoteJid, { text: chunk });
      console.log(`💬 [BURBUJA ${i+1}/${chunks.length} ENVIADA A +${cleanPhone}]:\n"${chunk}"`);

      // Guardar en la caché de mensajes para resolver claves E2EE a dispositivos vinculados
      if (sent?.message && sent?.key?.id && sock.rememberMessage) {
        sock.rememberMessage(sent.key.id, sent.message);
      }
    } catch (err) {
      console.error(`❌ Error enviando burbuja a +${cleanPhone}:`, err.message);
      return false;
    }

    // Pausa natural entre burbujas (2.2s a 3.5s)
    if (i < chunks.length - 1) {
      const pauseBetween = Math.floor(Math.random() * 1300) + 2200;
      await delay(pauseBetween);
    }
  }

  return true;
}

/**
 * Procesa un mensaje entrante y genera la respuesta comercial automática con reglas de venta de élite
 */
export async function handleIncomingSalesMessage(senderPhone, incomingText, sock, userQueue = null, keysList = [], customerTypingMap = null, targetJid = null) {
  const cleanPhone = (senderPhone || '').replace(/[^0-9]/g, '');
  const cleanLast9 = cleanPhone.slice(-9);

  if (!incomingText || incomingText.trim().length === 0) return;
  const text = incomingText.trim();

  // 1. Cargar memoria de conversaciones o consultar Google Sheets si es nuevo
  const memory = loadConversationMemory();
  let leadInfo = memory[cleanLast9];

  if (!leadInfo) {
    // Consultar Google Sheets para obtener nombre real de empresa y sector
    const sheetInfo = await getLeadInfoByPhone(cleanPhone);
    if (sheetInfo) {
      leadInfo = {
        empresa: sheetInfo.empresa || 'su empresa',
        sector: sheetInfo.sector || 'General',
        ciudad: sheetInfo.ciudad || '',
        transferredToHuman: false,
        history: []
      };
    } else {
      // Si no es un lead de Google Sheets ni ha recibido un mensaje previo del bot,
      // ignoramos el mensaje para no interferir con contactos personales o ajenos
      console.log(`ℹ️ [CONTACTO NO PROSPECTADO]: +${cleanPhone} no es un lead de Google Sheets ni tiene mensaje del bot. Ignorando.`);
      return;
    }
  }

  // Si el chat ya está derivado a un operador humano, la IA guarda silencio
  // y notifica por email que el cliente ha vuelto a escribir
  if (leadInfo.transferredToHuman) {
    console.log(`👤 [CHAT EN MODO HUMANO]: Lead +${cleanPhone} está derivado a humano. Guardando mensaje sin auto-respuesta.`);
    leadInfo.history.push({
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    });
    memory[cleanLast9] = leadInfo;
    saveConversationMemory(memory);
    await updateLeadResponseByPhone(cleanPhone, 'Derivado a humano', text);

    // Enviar aviso de seguimiento al email del equipo
    try {
      await sendHumanTransferAlert({
        phone: cleanPhone,
        empresa: leadInfo.empresa,
        sector: leadInfo.sector,
        ciudad: leadInfo.ciudad,
        reason: 'Nuevo mensaje recibido de cliente en espera de operador humano',
        conversationHistory: leadInfo.history
      });
    } catch (e) {}
    return;
  }

  leadInfo.history.push({
    role: 'user',
    content: text,
    timestamp: new Date().toISOString()
  });

  // 2. Detección de intenciones clave
  const hasFormAlreadyBeenSent = leadInfo.history.some(h => h.role === 'assistant' && h.content.includes('pebaisystems.es/diagnostico'));
  const isPostFormConfirmation = hasFormAlreadyBeenSent && /(hecho|listo|rellenado|enviado|completado|ya\s*est[aá]|ya\s*(lo\s*)?(he\s*)?rellen[eé]|ya\s*lo\s*mand[eé]|ok|vale|lo\s*miro|voy)/i.test(text);

  const isHumanRequest = /(hablar\s*con\s*(una\s*)?persona|llamadme|llamar|tel[eé]fono|operador|humano|comercial|daniel\s*en\s*persona)/i.test(text);
  const isHardRejection = /(no\s*(me\s*)?interesa|no\s*gracias|baja|borra(rme)?|dejadme|denunciar|spam|molestar|no\s*quiero|quitar)/i.test(text);
  const isSimpleNo = /^(no\.?|nop|no\s*tenemos\.?|no\s*por\s*ahora\.?|de\s*momento\s*no\.?)$/i.test(text);
  const isPainAffirmation = /^(much[aá]s?|much[ií]sim[aá]s?|bastantes?|demasiad[aá]s?|un\s*mont[oó]n|la\s*verdad\s*(que|es\s*que)?\s*(s[ií]|bastante|muchas?)|totalmente|s[ií](\s*(la\s*verdad|bastante|muchas?))?|incontables|puf\s*muchas?|demasiado\s*tiempo)\b/i.test(text);
  const isAskingWhatIsThis = /(de\s*qu[eé]\s*(se\s*trata|es)|qu[eé]\s*(me\s*)?propones|no\s*s[eé]\s*exactamente|qui[eé]n\s*eres|a\s*qu[eé]\s*te\s*refieres)/i.test(text);
  const isShowingInterest = /(me\s*interesa|cu[eé]ntame\s*m[aá]s|vale|ok|c[oó]mo\s*lo\s*hacemos|p[aá]same\s*info|qu[eé]\s*coste|cu[aá]ndo\s*hablamos|venga|de\s*acuerdo|perfecto|s[ií](\s*me\s*cuadra)?|me\s*cuadra)/i.test(text);

  let replyText = '';
  let newStatus = 'En conversación';
  let shouldTransferToHuman = false;
  let transferReason = '';

  if (isHumanRequest) {
    // Caso 0: Petición explícita de hablar con humano
    replyText = 'Perfecto, le paso la conversación directamente al equipo para que un especialista humano revise vuestro caso y te responda por aquí enseguida.';
    newStatus = 'Derivado a humano';
    shouldTransferToHuman = true;
    transferReason = 'Cliente solicitó hablar con una persona o llamada directa';
  } else if (isHardRejection) {
    // Caso 1: Descarte directo / Solicitud de baja
    replyText = 'Entendido perfectamente, muchas gracias por contestar y disculpa la molestia. ¡Que vaya muy bien la semana!';
    newStatus = 'Descartado';
  } else if (isPostFormConfirmation) {
    // Caso 2: El cliente confirma haber rellenado o recibido el formulario de diagnóstico
    replyText = `Perfecto, revisamos vuestras respuestas con el equipo para valorar si realmente podemos aportar impacto a vuestro caso.

Si vemos que encaja con lo que implementamos, te escribo enseguida para agendar la consultoría de 10 min. ¡Muchas gracias!`;
    newStatus = 'Formulario completado / Derivado a humano';
    shouldTransferToHuman = true;
    transferReason = 'Cliente confirmó envío o recepción del formulario de diagnóstico';
  } else if (isPainAffirmation && leadInfo.history.filter(h => h.role === 'user').length === 1) {
    // Caso 3: El lead afirma el dolor del gancho inicial ("muchas", "bastantes", etc.)
    const sectorLower = (leadInfo.sector || '').toLowerCase();
    const isReforms = sectorLower.includes('reforma') || sectorLower.includes('construc') || sectorLower.includes('obra');
    
    if (isReforms) {
      replyText = `Totalmente, es una barbaridad de tiempo y dinero desplazándose a medir obras que luego ni salen porque no tenían presupuesto real.

Nosotros ponemos un filtro en tu WhatsApp que cualifica m2 y presupuesto antes de ir. Además, en 10 min os hacemos una consultoría gratuita con IA para ver opciones en vuestro caso. ¿Te cuadra que lo veamos sin compromiso?`;
    } else {
      replyText = `Totalmente, es una barbaridad de tiempo que se pierde atendiendo consultas de personas que luego no tenían presupuesto real.

Nosotros ponemos un filtro inteligente en WhatsApp que cualifica la necesidad y presupuesto antes de dedicarle tiempo. Además, en 10 min os hacemos una consultoría gratuita con IA para vuestro caso. ¿Te cuadra verlo sin compromiso?`;
    }
    newStatus = 'En conversación';
  } else if (isSimpleNo && leadInfo.history.filter(h => h.role === 'user').length === 1) {
    // Caso 4: El lead responde "No" a la pregunta inicial
    const sectorLower = (leadInfo.sector || '').toLowerCase();
    const isReforms = sectorLower.includes('reforma') || sectorLower.includes('construc');
    
    if (isReforms) {
      replyText = `Lo imaginaba, casi nadie lo tiene aún en el sector y se pierden muchas horas yendo a medir obras vacías.

Nosotros ponemos un filtro en WhatsApp que pide m2, fotos y presupuesto antes de ir. Además en 10 min os hacemos una consultoría gratuita con IA para vuestro caso. ¿Te cuadra que lo veamos sin compromiso?`;
    } else {
      replyText = `Lo imaginaba, casi nadie lo tiene aún implementado en el sector y se pierden muchas horas con consultas sin presupuesto real.

Nosotros ponemos un filtro inteligente en WhatsApp que cualifica al cliente 24/7 antes de dedicarle tiempo. Además en 10 min os hacemos una consultoría gratuita con IA para vuestro caso. ¿Te cuadra que lo veamos sin compromiso?`;
    }
    newStatus = 'En conversación';
  } else if (isAskingWhatIsThis) {
    // Caso 5: Pregunta de qué se trata o qué propones (Puntos fuertes: GEO, Chatbot y Software a medida)
    replyText = `Buenas, te cuento rápido: en PEBAI Systems ayudamos con 3 cosas: salir recomendados en ChatGPT (GEO), filtro en WhatsApp 24/7 y aplicaciones a medida sin cuotas por usuario.

Hacemos una consultoría de 10 min 100% gratuita para analizar vuestro negocio y ver opciones con IA. ¿Cómo te viene mejor para verlo en 10 min, mañana o el miércoles?`;
    newStatus = 'En conversación';
  } else if (isShowingInterest) {
    // Caso 6: Interés / Piden información / Aceptan hablar -> Formulario de diagnóstico previo y desactivación del bot
    replyText = `Genial. Antes de agendar, pasamos un formulario muy rápido de 1 minuto para analizar vuestro negocio y valorar si vuestro modelo encaja con lo que implementamos:

https://pebaisystems.es/diagnostico

En cuanto lo revisemos con el equipo, si vemos viable ayudaros a ahorrar esas horas, te escribo directamente por aquí para fijar los 10 minutos.`;
    newStatus = 'Formulario enviado / Derivado a humano';
    shouldTransferToHuman = true;
    transferReason = 'Formulario de diagnóstico enviado al cliente (misión del bot cumplida, control cedido al equipo)';
  } else {
    // Caso 5: Consulta personalizada, duda técnica u objeción con IA + KB oficial
    const aiText = await generateConsultativeAIResponse(leadInfo, text, leadInfo.history);
    
    if (aiText && aiText.includes('[TRANSFER_TO_HUMAN]')) {
      shouldTransferToHuman = true;
      transferReason = 'Consulta técnica o dato fuera de la base de conocimiento oficial';
      replyText = aiText.replace(/\[TRANSFER_TO_HUMAN\]/g, '').trim();
      if (!replyText) {
        replyText = 'Ese detalle concreto te lo confirmo directamente con el equipo para darte el dato 100% exacto; en breve te respondemos por aquí.';
      }
      newStatus = 'Derivado a humano';
    } else if (aiText) {
      replyText = aiText;
      newStatus = 'En conversación';
    } else {
      replyText = `Buenas, sobre eso que comentas: para que puedas valorarlo con total exactitud en tu caso real, solemos hacer una llamada rápida de 10 minutos sin coste donde analizamos vuestro negocio y te enseño las posibilidades con IA para vuestro día a día.

¿Cómo te vendría mejor para verlo en 10 minutos, mañana o el miércoles?`;
      newStatus = 'En conversación';
    }
  }

  // 3. Envío humanizado con pausas, visto y burbujas
  if (replyText && sock) {
    const remoteJid = targetJid || `${cleanPhone}@s.whatsapp.net`;
    const sentOk = await sendHumanizedSalesReply(sock, remoteJid, replyText, userQueue, keysList, customerTypingMap, cleanPhone);

    if (sentOk) {
      leadInfo.history.push({
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString()
      });

      if (shouldTransferToHuman) {
        leadInfo.transferredToHuman = true;
        console.log(`👤 [DERIVACIÓN A HUMANO]: Lead +${cleanPhone} marcado como Derivado a humano (${transferReason}).`);
      }
    }
  }

  // 4. Si se derivó a un humano, enviar alerta INMEDIATA por email a equipo@pebaisystems.es
  if (shouldTransferToHuman) {
    try {
      await sendHumanTransferAlert({
        phone: cleanPhone,
        empresa: leadInfo.empresa,
        sector: leadInfo.sector,
        ciudad: leadInfo.ciudad,
        reason: transferReason,
        conversationHistory: leadInfo.history
      });
    } catch (mailErr) {
      console.error('❌ Error enviando email de derivación:', mailErr.message);
    }
  }

  // 5. Guardar memoria local
  memory[cleanLast9] = leadInfo;
  saveConversationMemory(memory);

  // 6. Registrar en motor de autoaprendizaje
  recordIncomingResponse(cleanPhone, text);

  // 7. Actualizar Google Sheets en tiempo real
  const noteSnippet = shouldTransferToHuman ? `[DERIVADO A HUMANO - ${transferReason}]: ${text}` : text;
  await updateLeadResponseByPhone(cleanPhone, newStatus, noteSnippet);
}
