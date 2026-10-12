import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LEARNING_FILE = path.join(__dirname, 'learning_metrics.json');

/**
 * Los 5 Puñales Tácticos de Apertura (Ganchos B2B de Alto Impacto):
 * 1. INFLUENCIA_GEO: Oportunidad y visibilidad directa en ChatGPT y Google AI (Fórmula Daniel).
 * 2. DOLOR_TIEMPO: Filtrar curiosos sin presupuesto para no perder horas en presupuestos/visitas.
 * 3. FUGA_FUERA_HORARIO: Atender y cualificar contactos en noches y fines de semana antes de que llamen a otro.
 * 4. BENCHMARK_SECTOR: Reto de madurez tecnológica frente al sector (casi nadie tiene filtro y pierden ventas).
 * 5. CONVERSION_CIERRE: Duplicar el ratio de cierre filtrando solo a clientes con presupuesto real.
 */
export const HOOK_TYPES = {
  INFLUENCIA_GEO: 'INFLUENCIA_GEO',
  DOLOR_TIEMPO: 'DOLOR_TIEMPO',
  FUGA_FUERA_HORARIO: 'FUGA_FUERA_HORARIO',
  BENCHMARK_SECTOR: 'BENCHMARK_SECTOR',
  CONVERSION_CIERRE: 'CONVERSION_CIERRE'
};

export const NICHE_PLAYBOOKS = {
  'Reformas Integrales': {
    canonicalNiche: 'Reformas Integrales',
    hooks: {
      [HOOK_TYPES.INFLUENCIA_GEO]: {
        pain: 'Clientes que buscan reformas solventes en motores de IA.',
        questions: [
          '¿Cómo influiría en vuestra empresa aparecer recomendados en ChatGPT y Google AI cuando un cliente busca empresa de reformas en {ciudad}?',
          '¿Cómo influiría en vuestra empresa salir en primera posición cuando preguntan a la IA por reformas integrales en {ciudad}?'
        ]
      },
      [HOOK_TYPES.DOLOR_TIEMPO]: {
        pain: 'Ir a medir obras y hacer presupuestos que llevan horas a clientes sin dinero.',
        questions: [
          '¿Cuántas horas perdéis a la semana yendo a medir obras a clientes que luego ni tenían presupuesto real?',
          '¿Cómo influiría en vuestro equipo filtrar m2, fotos y presupuesto por WhatsApp antes de desplazaros a medir?'
        ]
      },
      [HOOK_TYPES.FUGA_FUERA_HORARIO]: {
        pain: 'Contactos que entran viernes tarde o festivos y se van a otra empresa.',
        questions: [
          'Cuando os entra una reforma un viernes por la tarde o festivo, ¿tenéis forma de cualificarla al instante antes de que llamen a otra empresa?'
        ]
      },
      [HOOK_TYPES.BENCHMARK_SECTOR]: {
        pain: 'En reformas casi nadie tiene filtro por WhatsApp y pierden el 40% de leads.',
        questions: [
          'En el sector de las reformas casi nadie tiene filtro por WhatsApp y pierden el 40% de contactos. ¿Vosotros lo lleváis a mano todavía?'
        ]
      },
      [HOOK_TYPES.CONVERSION_CIERRE]: {
        pain: 'Ratio bajo de firmas tras docenas de presupuestos entregados.',
        questions: [
          '¿Qué porcentaje de los presupuestos de obra que entregáis acaban firmando? Tenemos un filtro por WhatsApp para duplicar cierres.'
        ]
      }
    }
  },

  'Casas Prefabricadas y Modulares': {
    canonicalNiche: 'Casas Prefabricadas y Modulares',
    hooks: {
      [HOOK_TYPES.INFLUENCIA_GEO]: {
        pain: 'Particulares buscando fabricantes fiables de casas modulares en IA.',
        questions: [
          '¿Cómo influiría en vuestra empresa aparecer recomendados en ChatGPT y Google AI cuando buscan casas prefabricadas en {ciudad}?'
        ]
      },
      [HOOK_TYPES.DOLOR_TIEMPO]: {
        pain: 'Cientos de curiosos preguntando precios sin tener terreno ni financiación bancaria.',
        questions: [
          '¿Cuántas horas pierde vuestro equipo con curiosos que piden precios de casas modulares sin tener terreno ni presupuesto?',
          '¿Cómo influiría en vuestro día a día que un filtro por WhatsApp descarte a los que no tienen terreno antes de preparar planos?'
        ]
      },
      [HOOK_TYPES.FUGA_FUERA_HORARIO]: {
        pain: 'Familias que miran casas los fines de semana y se enfrían si no hay respuesta rápida.',
        questions: [
          'Cuando una familia pide información de una casa modular en fin de semana, ¿tenéis sistema para cualificarla al momento?'
        ]
      },
      [HOOK_TYPES.BENCHMARK_SECTOR]: {
        pain: 'Saturación comercial con leads basura en casas prefabricadas.',
        questions: [
          'En casas modulares casi todas las empresas están saturadas de curiosos sin terreno. ¿Cómo filtráis vosotros a los compradores reales?'
        ]
      },
      [HOOK_TYPES.CONVERSION_CIERRE]: {
        pain: 'Dedicación excesiva a propuestas que no cierran.',
        questions: [
          '¿Qué porcentaje de quienes os piden catálogo tienen terreno y dinero listo? Tenemos un filtro para enviar ofertas solo a los viables.'
        ]
      }
    }
  },

  'Instalaciones Solares y Autoconsumo': {
    canonicalNiche: 'Instalaciones Solares y Autoconsumo',
    hooks: {
      [HOOK_TYPES.INFLUENCIA_GEO]: {
        pain: 'Particulares y empresas buscando instaladores fotovoltaicos en IA.',
        questions: [
          '¿Cómo influiría en vuestro negocio aparecer recomendados en las búsquedas de Inteligencia Artificial para placas solares en {ciudad}?'
        ]
      },
      [HOOK_TYPES.DOLOR_TIEMPO]: {
        pain: 'Presupuestar a personas que no son propietarias del tejado o con consumos inviables.',
        questions: [
          '¿Cómo influiría en vuestra empresa pedir la factura de la luz y cualificar al cliente por WhatsApp en el acto antes de que pida a la competencia?',
          '¿Cuántos estudios solares hacéis que luego se caen porque el cliente no era el dueño del tejado o no tenía presupuesto?'
        ]
      },
      [HOOK_TYPES.FUGA_FUERA_HORARIO]: {
        pain: 'El cliente fotovoltaico pide 4 presupuestos; quien responde antes gana.',
        questions: [
          'Quien pide presupuesto solar pide a 4 empresas a la vez. ¿Tenéis un sistema en WhatsApp para recoger su factura y adelantaros a los demás?'
        ]
      },
      [HOOK_TYPES.BENCHMARK_SECTOR]: {
        pain: 'Gestión manual lenta de facturas eléctricas.',
        questions: [
          'En fotovoltaica casi todos los instaladores recogen facturas a mano con días de retraso. ¿Tenéis automatizado ese filtro?'
        ]
      },
      [HOOK_TYPES.CONVERSION_CIERRE]: {
        pain: 'Aumentar el ratio de cierre por rapidez.',
        questions: [
          '¿Cómo influiría en vuestro ratio de cierre responder en menos de 2 minutos por WhatsApp con el pre-estudio solar ya validado?'
        ]
      }
    }
  },

  'Piscinas Prefabricadas y Poliéster': {
    canonicalNiche: 'Piscinas Prefabricadas y Poliéster',
    hooks: {
      [HOOK_TYPES.INFLUENCIA_GEO]: {
        pain: 'Familias buscando fabricantes de piscinas en ChatGPT.',
        questions: [
          '¿Cómo influiría en vuestra empresa salir como primera recomendación en ChatGPT cuando buscan fabricantes de piscinas en {ciudad}?'
        ]
      },
      [HOOK_TYPES.DOLOR_TIEMPO]: {
        pain: 'Responder a cientos de personas que no tienen espacio, terreno ni presupuesto.',
        questions: [
          '¿Cuántas horas perdéis respondiendo dudas de precios de piscinas a personas que luego ni tienen terreno apto?',
          '¿Cómo influiría en vuestro equipo filtrar terreno, accesos y presupuesto por WhatsApp antes de dar cotización?'
        ]
      },
      [HOOK_TYPES.FUGA_FUERA_HORARIO]: {
        pain: 'Consultas de particulares en fin de semana que no se atienden.',
        questions: [
          'Cuando un particular os escribe un domingo buscando piscina para el verano, ¿tenéis forma de cualificarlo antes de que mire a otro?'
        ]
      },
      [HOOK_TYPES.BENCHMARK_SECTOR]: {
        pain: 'Falta de cualificación previa en el sector piscinas.',
        questions: [
          'En el sector de piscinas casi nadie filtra accesos ni terreno por WhatsApp y se pierden semanas. ¿Vosotros lo hacéis a mano?'
        ]
      },
      [HOOK_TYPES.CONVERSION_CIERRE]: {
        pain: 'Aumentar visitas que se convierten en contrato.',
        questions: [
          '¿Cómo influiría en vuestra facturación visitar únicamente parcelas de clientes que ya tienen presupuesto y accesos confirmados?'
        ]
      }
    }
  },

  'Clínica Dental': {
    canonicalNiche: 'Clínica Dental',
    hooks: {
      [HOOK_TYPES.INFLUENCIA_GEO]: {
        pain: 'Pacientes buscando especialistas dentales de referencia en IA.',
        questions: [
          '¿Cómo influiría en la clínica aparecer recomendados en ChatGPT y Google AI cuando alguien busca dentista especialista en {ciudad}?'
        ]
      },
      [HOOK_TYPES.DOLOR_TIEMPO]: {
        pain: 'Recepcionistas saturadas atendiendo dudas de precios en vez de a pacientes en sala.',
        questions: [
          '¿Cómo influiría en la clínica tener un asistente por WhatsApp que cualifique pacientes y agende citas 24/7 sin saturar la recepción?',
          '¿Cuántas horas al día pasa vuestra recepción respondiendo preguntas repetitivas de precios por WhatsApp?'
        ]
      },
      [HOOK_TYPES.FUGA_FUERA_HORARIO]: {
        pain: 'Urgencias o dudas fuera de horario que van a otra clínica.',
        questions: [
          'Cuando un paciente tiene una urgencia dental un sábado noche, ¿tenéis forma de agendarle la cita en automático antes de que llame a otra?'
        ]
      },
      [HOOK_TYPES.BENCHMARK_SECTOR]: {
        pain: 'Pérdida de citas por falta de recordatorio o respuesta lenta.',
        questions: [
          'Las clínicas que usan WhatsApp inteligente reducen el absentismo un 30% y agendan citas a cualquier hora. ¿Vosotros lo tenéis activo?'
        ]
      },
      [HOOK_TYPES.CONVERSION_CIERRE]: {
        pain: 'Pacientes que preguntan precio de implantes u ortodoncia y no acuden a consulta.',
        questions: [
          '¿Qué porcentaje de pacientes que preguntan por implantes u ortodoncia por WhatsApp acaban en consulta? Tenemos una forma de aumentarlo.'
        ]
      }
    }
  },

  'Medicina Estética': {
    canonicalNiche: 'Medicina Estética',
    hooks: {
      [HOOK_TYPES.INFLUENCIA_GEO]: {
        pain: 'Búsquedas de clínicas estéticas de primer nivel en IA.',
        questions: [
          '¿Cómo influiría en vuestra clínica ser la recomendación número uno en ChatGPT para tratamientos de medicina estética en {ciudad}?'
        ]
      },
      [HOOK_TYPES.DOLOR_TIEMPO]: {
        pain: 'Preguntas infinitas de precios de botox, ácido y tratamientos que no cierran cita.',
        questions: [
          '¿Cuántas horas pierde vuestro equipo al día respondiendo tarifas de tratamientos estéticos a personas que no reservan cita?',
          '¿Cómo influiría en la clínica filtrar dudas de tarifas y agendar la valoración directamente por WhatsApp?'
        ]
      },
      [HOOK_TYPES.FUGA_FUERA_HORARIO]: {
        pain: 'Pacientes que deciden tratamientos de noche o fines de semana.',
        questions: [
          'La mayoría de pacientes buscan tratamientos estéticos por la noche. ¿Tenéis sistema para captar y agendar su cita fuera de horario?'
        ]
      },
      [HOOK_TYPES.BENCHMARK_SECTOR]: {
        pain: 'Clínicas estéticas saturadas de mensajes en redes y WhatsApp.',
        questions: [
          'En medicina estética el 60% de mensajes por WhatsApp se quedan sin agendar por tardar en responder. ¿Cómo gestionáis ese flujo?'
        ]
      },
      [HOOK_TYPES.CONVERSION_CIERRE]: {
        pain: 'Conversión de consulta informativa a cita médica pagada.',
        questions: [
          '¿Cómo influiría en vuestro negocio convertir el doble de preguntas informativas de WhatsApp en citas de valoración médica presencial?'
        ]
      }
    }
  },

  'Despacho de Abogados / Asesoría': {
    canonicalNiche: 'Despacho de Abogados / Asesoría',
    hooks: {
      [HOOK_TYPES.INFLUENCIA_GEO]: {
        pain: 'Empresas y particulares buscando bufete de referencia en ChatGPT.',
        questions: [
          '¿Cómo influiría en vuestro despacho aparecer como bufete recomendado en ChatGPT y Google AI para asuntos de empresa en {ciudad}?'
        ]
      },
      [HOOK_TYPES.DOLOR_TIEMPO]: {
        pain: 'Consultas gratuitas o no rentables que quitan tiempo a los letrados.',
        questions: [
          '¿Cómo influiría en vuestro bufete tener un filtro por WhatsApp que cualifique casos legales para atender solo los asuntos más rentables?',
          '¿Cuánto tiempo pierde el despacho atendiendo consultas que luego no tienen viabilidad jurídica o económica?'
        ]
      },
      [HOOK_TYPES.FUGA_FUERA_HORARIO]: {
        pain: 'Urgencias jurídicas o fiscales que entran a deshoras.',
        questions: [
          'Cuando entra una consulta jurídica urgente fuera de horario, ¿tenéis forma de recoger los datos del caso para que el letrado lo revise a primera hora?'
        ]
      },
      [HOOK_TYPES.BENCHMARK_SECTOR]: {
        pain: 'Despachos tradicionales con recepción manual desbordada.',
        questions: [
          'Los despachos que cualifican por WhatsApp filtran el 70% de consultas no viables antes de pasar al abogado. ¿Vosotros lo hacéis a mano?'
        ]
      },
      [HOOK_TYPES.CONVERSION_CIERRE]: {
        pain: 'Cierre de clientes de mayor minuta.',
        questions: [
          '¿Cómo influiría en la rentabilidad del despacho centrar las reuniones presenciales únicamente en clientes con asuntos viables y solventes?'
        ]
      }
    }
  },

  'Inmobiliaria': {
    canonicalNiche: 'Inmobiliaria',
    hooks: {
      [HOOK_TYPES.INFLUENCIA_GEO]: {
        pain: 'Propietarios preguntando a ChatGPT qué agencia contratar para vender.',
        questions: [
          '¿Cómo influiría en vuestra agencia salir recomendados en ChatGPT y Google AI cuando un propietario busca inmobiliaria para vender en {ciudad}?'
        ]
      },
      [HOOK_TYPES.DOLOR_TIEMPO]: {
        pain: 'Visitas con curiosos sin hipoteca preaprobada.',
        questions: [
          '¿Cuántas visitas organizáis a la semana con personas que luego no tienen capacidad económica ni hipoteca viable?',
          '¿Cómo influiría en vuestro equipo filtrar la solvencia del comprador por WhatsApp antes de agendar una visita al inmueble?'
        ]
      },
      [HOOK_TYPES.FUGA_FUERA_HORARIO]: {
        pain: 'Leads de portales inmobiliarios que entran viernes noche o domingos.',
        questions: [
          'Los leads de Idealista que entran un domingo se van si tardáis horas en contestar. ¿Tenéis respuesta y cualificación automática en WhatsApp 24/7?'
        ]
      },
      [HOOK_TYPES.BENCHMARK_SECTOR]: {
        pain: 'Inmobiliarias que pierden exclusivas por respuesta lenta.',
        questions: [
          'En el sector inmobiliario quien antes responde a un propietario capta la exclusiva. ¿Tenéis automatizada esa primera respuesta?'
        ]
      },
      [HOOK_TYPES.CONVERSION_CIERRE]: {
        pain: 'Aumentar visitas que acaban en reserva.',
        questions: [
          '¿Cómo influiría en vuestras ventas enseñar los inmuebles únicamente a personas con solvencia económica ya validada por WhatsApp?'
        ]
      }
    }
  },

  'General': {
    canonicalNiche: 'General',
    hooks: {
      [HOOK_TYPES.INFLUENCIA_GEO]: {
        pain: 'Negocios locales buscando visibilidad en IA.',
        questions: [
          '¿Cómo influiría en vuestra empresa aparecer recomendados en ChatGPT y Google AI cuando buscan vuestros servicios en {ciudad}?'
        ]
      },
      [HOOK_TYPES.DOLOR_TIEMPO]: {
        pain: 'Horas perdidas en WhatsApp respondiendo a curiosos sin presupuesto.',
        questions: [
          '¿Cuántas horas a la semana pierde vuestro equipo respondiendo mensajes y presupuestos a personas que luego no compran?',
          '¿Cómo influiría en vuestro día a día tener un filtro inteligente en WhatsApp que solo os pase a los clientes listos para contratar?'
        ]
      },
      [HOOK_TYPES.FUGA_FUERA_HORARIO]: {
        pain: 'Clientes que escriben a deshoras y se van a la competencia.',
        questions: [
          'Cuando un cliente potencial os escribe fuera de horario o en fin de semana, ¿tenéis sistema para cualificarlo y no perder la venta?'
        ]
      },
      [HOOK_TYPES.BENCHMARK_SECTOR]: {
        pain: 'Tareas manuales y atención desbordada.',
        questions: [
          'Casi todas las empresas del sector siguen gestionando presupuestos y dudas a mano. ¿Tenéis algún sistema de IA para automatizarlo?'
        ]
      },
      [HOOK_TYPES.CONVERSION_CIERRE]: {
        pain: 'Aumento del ratio de conversión comercial.',
        questions: [
          '¿Qué porcentaje de los contactos que os piden información acaban cerrando? Tenemos un sistema por WhatsApp para duplicar conversiones.'
        ]
      }
    }
  }
};

/**
 * Carga o inicializa el historial de auto-entrenamiento
 */
export function loadLearningMetrics() {
  if (!fs.existsSync(LEARNING_FILE)) {
    const initialData = {
      totalSent: 0,
      totalResponses: 0,
      positiveResponses: 0,
      negativeResponses: 0,
      niches: {},
      sentByPhone: {}
    };
    fs.writeFileSync(LEARNING_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    return initialData;
  }

  try {
    const data = JSON.parse(fs.readFileSync(LEARNING_FILE, 'utf8'));
    if (!data.sentByPhone) data.sentByPhone = {};
    return data;
  } catch (e) {
    return { niches: {}, sentByPhone: {} };
  }
}

/**
 * Registra un envío para posterior evaluación de conversión
 */
export function recordMessageSent(niche, hookType, messageText, phone = '') {
  const metrics = loadLearningMetrics();
  metrics.totalSent = (metrics.totalSent || 0) + 1;

  if (!metrics.niches[niche]) {
    metrics.niches[niche] = {
      sent: 0,
      responses: 0,
      positive: 0,
      negative: 0,
      hooks: {}
    };
  }

  const nicheData = metrics.niches[niche];
  nicheData.sent = (nicheData.sent || 0) + 1;

  if (!nicheData.hooks[hookType]) {
    nicheData.hooks[hookType] = { sent: 0, responses: 0, positive: 0, negative: 0 };
  }
  nicheData.hooks[hookType].sent = (nicheData.hooks[hookType].sent || 0) + 1;

  if (phone) {
    const clean = phone.replace(/[^0-9]/g, '').slice(-9);
    metrics.sentByPhone[clean] = {
      niche,
      hookType,
      sentAt: new Date().toISOString()
    };
  }

  try {
    fs.writeFileSync(LEARNING_FILE, JSON.stringify(metrics, null, 2), 'utf8');
  } catch (e) {
    console.error('⚠️ Error guardando learning_metrics:', e.message);
  }
}

/**
 * Registra una respuesta entrante y evalúa positividad
 */
export function recordIncomingResponse(phone, responseText) {
  const metrics = loadLearningMetrics();
  const clean = phone.replace(/[^0-9]/g, '').slice(-9);
  const info = metrics.sentByPhone[clean];

  metrics.totalResponses = (metrics.totalResponses || 0) + 1;

  const lower = responseText.toLowerCase();
  const isPositive = /(interesa|cu[eé]ntame|c[oó]mo|precio|coste|vale|ok|hablamos|ll[aá]mame|cuando|horario|info|reuni[oó]n)/i.test(lower);
  const isNegative = /(no\s*interesa|baja|no\s*gracias|borra|spam|dejad|pesados)/i.test(lower);

  if (isPositive) metrics.positiveResponses = (metrics.positiveResponses || 0) + 1;
  if (isNegative) metrics.negativeResponses = (metrics.negativeResponses || 0) + 1;

  if (info && info.niche && metrics.niches[info.niche]) {
    const n = metrics.niches[info.niche];
    n.responses = (n.responses || 0) + 1;
    if (isPositive) n.positive = (n.positive || 0) + 1;
    if (isNegative) n.negative = (n.negative || 0) + 1;

    if (info.hookType && n.hooks[info.hookType]) {
      const h = n.hooks[info.hookType];
      h.responses = (h.responses || 0) + 1;
      if (isPositive) h.positive = (h.positive || 0) + 1;
      if (isNegative) h.negative = (h.negative || 0) + 1;
    }
  }

  try {
    fs.writeFileSync(LEARNING_FILE, JSON.stringify(metrics, null, 2), 'utf8');
    console.log(`📈 [AUTO-APRENDIZAJE]: Registrada respuesta de +${clean} (Positiva: ${isPositive}, Negativa: ${isNegative})`);
  } catch (e) {}
}

/**
 * Selecciona la mejor estrategia (o explora ganchos con Multi-Armed Bandit / Epsilon-Greedy)
 */
export function getBestStrategyForNiche(nicheRaw) {
  const metrics = loadLearningMetrics();
  let canonicalNiche = 'General';

  const nr = (nicheRaw || '').toLowerCase();
  for (const key of Object.keys(NICHE_PLAYBOOKS)) {
    if (nr.includes(key.toLowerCase()) || key.toLowerCase().includes(nr)) {
      canonicalNiche = key;
      break;
    }
  }

  if (canonicalNiche === 'General') {
    if (nr.includes('reforma') || nr.includes('construc')) canonicalNiche = 'Reformas Integrales';
    else if (nr.includes('dental') || nr.includes('dentist')) canonicalNiche = 'Clínica Dental';
    else if (nr.includes('modular') || nr.includes('madera')) canonicalNiche = 'Casas Prefabricadas y Modulares';
    else if (nr.includes('solar') || nr.includes('fotovolt')) canonicalNiche = 'Instalaciones Solares y Autoconsumo';
    else if (nr.includes('piscina')) canonicalNiche = 'Piscinas Prefabricadas y Poliéster';
    else if (nr.includes('estetic') || nr.includes('medic')) canonicalNiche = 'Medicina Estética';
    else if (nr.includes('abogad') || nr.includes('asesor') || nr.includes('gestor')) canonicalNiche = 'Despacho de Abogados / Asesoría';
    else if (nr.includes('inmobil')) canonicalNiche = 'Inmobiliaria';
  }

  const playbook = NICHE_PLAYBOOKS[canonicalNiche] || NICHE_PLAYBOOKS['General'];
  const availableHooks = Object.keys(playbook.hooks);

  // Epsilon-Greedy (25% exploración de nuevos ganchos, 75% explotación del gancho con mayor tasa positiva)
  const epsilon = 0.25;
  const shouldExplore = Math.random() < epsilon;

  let selectedHook = availableHooks[Math.floor(Math.random() * availableHooks.length)];

  if (!shouldExplore && metrics.niches[canonicalNiche]) {
    const nicheStats = metrics.niches[canonicalNiche];
    let bestRate = -1;
    for (const h of availableHooks) {
      const hStats = nicheStats.hooks[h];
      if (hStats && hStats.sent >= 5) {
        const rate = hStats.positive / hStats.sent;
        if (rate > bestRate) {
          bestRate = rate;
          selectedHook = h;
        }
      }
    }
  }

  const hookData = playbook.hooks[selectedHook];
  const qList = hookData.questions;
  const questionTemplate = qList[Math.floor(Math.random() * qList.length)];

  return {
    canonicalNiche,
    hookType: selectedHook,
    pain: hookData.pain,
    questionTemplate
  };
}
