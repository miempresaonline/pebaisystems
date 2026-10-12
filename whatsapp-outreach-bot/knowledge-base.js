/**
 * KNOWLEDGE BASE OFICIAL — PEBAI SYSTEMS (pebaisystems.es)
 * Información canónica, verificada y reglas de venta consultiva para el Agente Comercial de WhatsApp.
 * PROHIBIDO INVENTAR DATOS NO PRESENTES EN ESTE DOCUMENTO.
 */

export const PEBAI_KNOWLEDGE_BASE = {
  empresa: {
    nombre: 'PEBAI Systems',
    fundador: 'Daniel',
    web: 'https://pebaisystems.es',
    formularioDiagnostico: 'https://pebaisystems.es/diagnostico',
    telefono: '+34 624 84 27 99',
    email: 'equipo@pebaisystems.es',
    ambito: 'Toda España (proyectos y consultoría para empresas físicas y digitales)',
    cumplimiento: '100% conforme a RGPD y Reglamento Europeo de Inteligencia Artificial (AI Act UE 2024/1689). Servidores seguros en la Unión Europea.'
  },

  propuestaValor: {
    concepto: 'Consultoría estratégica de 10 minutos 100% gratuita y sin compromiso',
    diferenciador: 'Las consultoras tradicionales cobran cientos o miles de euros por este tipo de auditoría. Nosotros la hacemos de forma 100% gratuita para demostrar con hechos y en directo las posibilidades de la IA aplicadas a su negocio.',
    objetivoLlamada: 'Analizar sus fugas operativas actuales (horas perdidas, curiosos sin dinero, llamadas fuera de horario), enseñarles el sistema funcionando en tiempo real y valorar juntos si tiene sentido implantarlo en su empresa.',
    pasoPrevio: 'Completar el formulario de 1 minuto en https://pebaisystems.es/diagnostico para que Daniel y el equipo preparen el análisis antes de la llamada.'
  },

  serviciosPrincipales: {
    // SERVICIO 1 FAVORITO: GEO
    geo: {
      nombre: 'GEO (Generative Engine Optimization) — Posicionamiento en Motores de IA',
      descripcion: 'Posicionamiento técnico y semántico para que ChatGPT, Perplexity, Google Gemini y Google AI Overviews recomienden a la empresa como la opción #1 en su ciudad y sector.',
      dolor: 'Los clientes ya no buscan solo en Google tradicional; ahora le preguntan a ChatGPT o Perplexity qué empresa contratar. Si la empresa no está optimizada para IA, es completamente invisible.',
      beneficio: 'Captación de clientes con alta intención de compra antes de que los competidores locales siquiera sepan qué es el GEO.'
    },

    // SERVICIO 2 FAVORITO: CHATBOT / WHATSAPP IA
    chatbotWhatsapp: {
      nombre: 'Filtro y Asistente Comercial por WhatsApp 24/7',
      descripcion: 'Asistente de inteligencia artificial en WhatsApp que atiende en segundos con tono humano natural, filtra clientes no cualificados y agenda reuniones solo con los que tienen presupuesto real.',
      dolor: 'Pérdida masiva de tiempo y dinero respondiendo mensajes a deshora, visitando obras o haciendo presupuestos detallados para curiosos que luego no compran o no tenían dinero.',
      beneficio: 'El equipo solo atiende a clientes que de verdad van a firmar. Cualificación de metros cuadrados, fotos, tipo de trabajo y rango de presupuesto antes de la visita.',
      disponibilidad: 'Atención 24/7/365 en fines de semana y noches evitando que el cliente se vaya a la competencia.'
    },

    // SERVICIO 3 FAVORITO: APLICACIONES Y SOFTWARE A MEDIDA
    aplicacionesSoftwareMedida: {
      nombre: 'Aplicaciones y Herramientas Internas de Software a Medida con IA',
      descripcion: 'Desarrollo de herramientas digitales, portales de gestión, paneles de control, CRMs y sistemas de automatización creados 100% a la medida de la operativa de la empresa.',
      dolor: 'Herramientas genéricas del mercado que obligan a pagar cuotas mensuales abusivas por cada usuario y que no se adaptan al flujo real de la empresa, obligando a duplicar trabajo manual.',
      beneficio: 'Software propio que pertenece a la empresa, sin licencias mensuales por usuario, que centraliza toda la información y automatiza el 80% de las tareas administrativas repetitivas.'
    },

    // OTROS SERVICIOS OFICIALES
    agentesVoz: {
      nombre: 'Agentes Telefónicos de Voz con IA',
      descripcion: 'Sistemas de voz ultra-realistas que atienden llamadas entrantes, resuelven dudas frecuentes y agendan citas automáticamente.',
      dolor: 'Llamadas perdidas cuando los empleados están ocupados o fuera de horario comercial.'
    },

    automatizaciones: {
      nombre: 'Automatización de Procesos con n8n y Python',
      descripcion: 'Conexión integral entre WhatsApp, correos, bases de datos, generación de presupuestos y ERPs.',
      dolor: 'Empleados dedicando horas a copiar y pegar datos entre documentos y hojas de cálculo.'
    }
  },

  politicaDePrecios: {
    reglaEstricta: 'NO EXISTE UN PRECIO FIJO ESTÁNDAR PUESTO QUE CADA PROYECTO SE ADAPTA A MEDIDA.',
    respuestaTipo: 'No cobramos licencias mensuales por usuario. La inversión depende exactamente del flujo y de lo que se vaya a automatizar. Por eso en la consultoría de 10 minutos analizamos el caso concreto y le damos la cifra exacta sin compromiso.'
  },

  playbookVentaConsultiva: {
    frameworkNEPQ: {
      enfoque: 'Neuro-Emotional Persuasion Questions (Jeremy Miner). Cero presión comercial, tono de médico/consultor diagnosticando un problema.',
      preguntaProblema: 'Ayudar al cliente a darse cuenta de cuánto tiempo o dinero pierde actualmente.',
      preguntaConsecuencia: 'Hacerle ver lo que supone seguir perdiendo horas cada mes sin un filtro automático.'
    },
    frameworkChrisVoss: {
      enfoque: 'Empatía táctica y etiquetado del dolor (Never Split the Difference).',
      etiquetado: '"Parece que dedicáis mucho tiempo a presupuestos que luego no se cierran."',
      orientacionAlNo: '"¿Sería una locura verlo 10 minutos para valorar si os ahorra horas de trabajo?"'
    },
    frameworkHormozi: {
      enfoque: 'Reducción absoluta de fricción y garantía de valor.',
      inversionRiesgo: 'La consultoría es 100% gratuita. Se llevan el análisis de su sector aunque decidan no contratar nada.'
    }
  },

  reglasDeVeracidadYDerivacion: {
    transferenciaObligatoria: [
      'Si el cliente solicita expresamente hablar con una persona, llamada telefónica con Daniel o comercial.',
      'Si el cliente hace preguntas técnicas de desarrollo no recogidas en esta base de conocimiento.',
      'Si el cliente exige presupuestos cerrados de desarrollo sin pasar por la consultoría.',
      'Si el cliente plantea quejas, reclamaciones o aspectos legales específicos.'
    ],
    etiquetaActivadora: '[TRANSFER_TO_HUMAN]',
    emailAlerta: 'equipo@pebaisystems.es'
  }
};
