import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env local si existe
dotenv.config();

// Cargar claves de APIs centrales si existen
const centralApiKeysPath = 'C:/programacion/APIs/api_keys.json';
let centralKeys = {};
if (fs.existsSync(centralApiKeysPath)) {
  try {
    centralKeys = JSON.parse(fs.readFileSync(centralApiKeysPath, 'utf8'));
  } catch (e) {
    console.warn('⚠️ No se pudo leer api_keys.json central:', e.message);
  }
}

export const Config = {
  // Interruptor maestro de activación (por defecto activo salvo BOT_ENABLED=false)
  ENABLED: process.env.BOT_ENABLED !== 'false',

  // Interruptor específico de prospección en frío (desactivado por defecto hasta orden expresa de Daniel)
  OUTREACH_ENABLED: process.env.OUTREACH_ENABLED === 'true',

  // Horarios de trabajo (Hora peninsular España)
  // Mañana: 08:30 a 14:00
  // Tarde: 16:00 a 19:30
  SCHEDULE: {
    MORNING: {
      START_HOUR: parseInt(process.env.SCHEDULE_MORNING_START_HOUR || '8', 10),
      START_MINUTE: parseInt(process.env.SCHEDULE_MORNING_START_MIN || '30', 10),
      END_HOUR: parseInt(process.env.SCHEDULE_MORNING_END_HOUR || '14', 10),
      END_MINUTE: parseInt(process.env.SCHEDULE_MORNING_END_MIN || '0', 10),
    },
    AFTERNOON: {
      START_HOUR: parseInt(process.env.SCHEDULE_AFTERNOON_START_HOUR || '16', 10),
      START_MINUTE: parseInt(process.env.SCHEDULE_AFTERNOON_START_MIN || '0', 10),
      END_HOUR: parseInt(process.env.SCHEDULE_AFTERNOON_END_HOUR || '19', 10),
      END_MINUTE: parseInt(process.env.SCHEDULE_AFTERNOON_END_MIN || '30', 10),
    },
    // Días laborables: 1 (Lunes) a 5 (Viernes). Si se desea fin de semana, configurar true.
    ALLOW_WEEKENDS: process.env.ALLOW_WEEKENDS === 'true',
  },

  // Cadencia anti-baneo
  DELAYS: {
    // Intervalo aleatorio entre mensajes (en minutos)
    MIN_MINUTES: parseFloat(process.env.MIN_DELAY_MINUTES || '8'),
    MAX_MINUTES: parseFloat(process.env.MAX_DELAY_MINUTES || '15'),

    // Simulación de escritura ('composing'): segundos
    MIN_TYPING_SECONDS: 6,
    MAX_TYPING_SECONDS: 14,
  },

  // Límites de volumen diario
  LIMITS: {
    MAX_DAILY_MESSAGES: parseInt(process.env.MAX_DAILY_MESSAGES || '35', 10),
  },

  // Google Sheets & Fallback
  SHEETS: {
    SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
    SHEET_NAME: process.env.GOOGLE_SHEETS_TAB_NAME || 'Leads',
    TYPEFORM_TAB_NAME: process.env.GOOGLE_SHEETS_TYPEFORM_TAB || '📋 Respuestas Typeform',
    SERVICE_ACCOUNT_PATH: (() => {
      const candidates = [
        process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
        path.join(__dirname, 'google_service_account.json'),
        '/home/u571171513/google_service_account.json',
        '/home/u571171513/whatsapp-outreach-bot/google_service_account.json',
        'C:/programacion/APIs/google_service_account.json'
      ];
      for (const p of candidates) {
        if (p && fs.existsSync(p)) return p;
      }
      return path.join(__dirname, 'google_service_account.json');
    })(),
    FALLBACK_CSV_PATH: path.join(__dirname, 'leads.csv'),
  },

  // Flujo de Calificación y Descarte (Tally / Typeform)
  TYPEFORM: {
    DELAY_HOURS_OPTION_B: 2, // Esperar 2 horas antes de enviar el descarte (simula revisión humana)
    CALENDLY_URL: process.env.CALENDLY_URL || '',
    FORM_URL: process.env.TYPEFORM_URL || 'https://pebaisystems.es/diagnostico',
    TALLY_API_KEY: process.env.TALLY_API_KEY || '',
    TALLY_FORM_ID: process.env.TALLY_FORM_ID || 'Me0YQk'
  },

  // WhatsApp Baileys
  WHATSAPP: {
    AUTH_DIR: path.join(__dirname, 'session'),
    PORT: parseInt(process.env.PORT || '3000', 10),
  },

  // IA para variación dinámica de textos
  AI: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || centralKeys.gemini_api_key || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  },

  // Identidad comercial
  BRAND: {
    SENDER_NAME: process.env.SENDER_NAME || 'Daniel',
    COMPANY_NAME: process.env.COMPANY_NAME || 'PEBAI Systems',
    WEBSITE_URL: process.env.WEBSITE_URL || 'https://pebaisystems.com',
    SERVICES: [
      'SEO y Posicionamiento en Motores de Búsqueda de Nueva Generación e IA (Google AI Overviews, ChatGPT Search, Perplexity)',
      'Chatbots con IA entrenados con toda la información de la empresa para resolver dudas, vender y filtrar clientes',
      'Agentes de voz con IA para atender llamadas y cualificar 24/7',
      'Desarrollo de páginas web y landings con la última tecnología',
      'Aplicaciones y automatizaciones a medida'
    ],
    GOAL: 'Agendar una consultoría estratégica gratuita de 15 minutos sin compromiso para analizar el negocio y detectar áreas de mejora.'
  },

  // Guiones de respuesta rápida para cuando un prospecto muestra interés
  SCRIPTS: {
    SEO: `Te cuento rápido: hoy la gente ya no solo busca en Google; cada vez más clientes usan las respuestas de IA (Google AI, ChatGPT, Perplexity) para pedir presupuestos.\nLo que hacemos es posicionar vuestro negocio para que seáis la opción #1 recomendada cuando alguien busca vuestros servicios en vuestra zona.\nPara que veas el margen de mejora que tenéis, solemos hacer una consultoría estratégica gratuita de 15 minutos donde auditamos vuestra presencia digital y os enseñamos exactamente dónde estáis perdiendo clientes.\n¿Qué día os vendría mejor esta semana para verlo?`,
    CHATBOT: `Básicamente creamos un asistente de IA entrenado con todo vuestro catálogo, tarifas y procesos. Atiende por WhatsApp y web en 2 segundos, resuelve dudas de clientes, vende y deriva a vuestro equipo cuando hace falta.\nSolemos hacer una consultoría gratuita de 15 minutos por videollamada donde os enseñamos el sistema funcionando por dentro y analizamos vuestro caso sin compromiso.\n¿Qué día os vendría mejor esta semana para verlo?`,
    INVITATION_FORM: (nombre, empresa, telefono) => {
      const p = encodeURIComponent(telefono || '');
      const e = encodeURIComponent(empresa || '');
      const n = encodeURIComponent(nombre || '');
      const url = `https://pebaisystems.es/diagnostico?telefono=${p}&empresa=${e}&nombre=${n}`;
      return `Perfecto ${nombre ? nombre : ''}, te pre-reservo el hueco.\n\nPara no hacerte perder tiempo en la videollamada y poder preparar la consultoría gratuita sin compromiso para vuestro caso concreto con vuestros números, necesito que completes este breve formulario (son literalmente 4 preguntas rápidas de un clic, tardas 45 segundos):\n\n👉 ${url}\n\nEn cuanto lo tengas enviado, confirmamos la sala de Meet y te paso el enlace. ¡Un saludo!`;
    },
    REJECTION_OPTION_B: (nombre) => `Hola ${nombre || ''}, aquí Daniel de PEBAI Systems.\n\nHe estado revisando personalmente la ficha previa de vuestro negocio. Por el momento y la fase en la que os encontráis ahora mismo, nuestros sistemas de infraestructura de IA a medida no son lo que más os compensa, ya que requieren de cierto volumen e inversión para amortizarlos rápido.\n\nPara no hacerte perder tiempo en una videollamada que no te sería rentable ahora mismo, prefiero serte 100% transparente. Nos guardamos vuestro contacto y en cuanto tengáis el volumen adecuado, lo retomamos con gusto. ¡Mucho éxito en el negocio!`,
    APPROVAL_OPTION_A: (nombre, empresa, ciudad, urlAgenda) => `Buenas ${nombre || ''}, acabo de revisar la ficha de ${empresa || 'vuestra empresa'} y encajáis perfectamente en el perfil que buscamos para la plaza de vuestro sector en ${ciudad || 'vuestra zona'}.\n\nYa tengo a nuestro equipo recopilando los datos de vuestra competencia y cómo os están indexando los motores de IA para llevarlo todo listo a la llamada.\n\nPara no demorarlo, te dejo aquí mi agenda directa para que escojas el hueco de 15 minutos que mejor te cuadre esta semana:\n\n👉 ${urlAgenda || 'https://calendly.com'}\n\nEn cuanto lo marques, te llega el acceso a Google Meet al correo. ¡Nos vemos en la videollamada!`
  }
};
