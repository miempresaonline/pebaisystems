// social-media-engine/config.js
// Configuración Maestra del Motor de Redes Sociales de PEBAI Systems

module.exports = {
  // -------------------------------------------------------------
  // 1. UMBRALES DE SEGURIDAD Y TIEMPOS HUMANIZADOS (ANTI-BAN)
  // -------------------------------------------------------------
  security: {
    // Límites de volumen horario
    hourlyLimitSafe: 40,      // Ritmo de crucero seguro
    hourlyLimitHard: 50,      // Techo infranqueable por hora
    
    // Retardo realista de lectura y escritura (milisegundos)
    typingDelayMinMs: 8000,   // Mínimo 8 segundos
    typingDelayMaxMs: 22000,  // Máximo 22 segundos
    
    // Intervalo de escaneo entre comprobaciones (polling aleatorio)
    pollingIntervalMinMs: 45000,  // 45 segundos
    pollingIntervalMaxMs: 90000,  // 90 segundos

    // Ventana de descanso nocturno (hora local de España)
    // Entre las 02:00 y las 07:00 no se envían mensajes salientes; se encolan para la mañana.
    nightRestStartHour: 2,
    nightRestEndHour: 7,

    // Ventana de protección contra duplicados (horas)
    deduplicationWindowHours: 24
  },

  // -------------------------------------------------------------
  // 2. PLATAFORMAS ACTIVAS
  // -------------------------------------------------------------
  platforms: {
    instagram: {
      enabled: true,
      handle: '@pebaisystems',
      sourceKey: 'instagram'
    },
    tiktok: {
      enabled: true,
      handle: '@pebaisystems',
      sourceKey: 'tiktok',
      hasDMRestrictions: true // Activa lógica de fallback
    },
    facebook: {
      enabled: true,
      sourceKey: 'facebook'
    },
    x: {
      enabled: true,
      sourceKey: 'x'
    },
    // LinkedIn: EXPLÍCITAMENTE EXCLUIDO de automatizaciones por comentarios.
    linkedin: {
      enabled: false
    }
  },

  // -------------------------------------------------------------
  // 3. MATRIZ DE PALABRAS CLAVE Y ALIAS RECONOCIDOS
  // -------------------------------------------------------------
  keywords: {
    consultoria: {
      key: 'consultoria',
      label: 'CONSULTORÍA',
      aliases: ['consultoria', 'consultoría', 'consultar', 'auditoria', 'auditoría', 'sistema'],
      objective: 'procesos'
    },
    respuesta: {
      key: 'respuesta',
      label: 'RESPUESTA',
      aliases: ['respuesta', 'respuestas', 'responder', 'lead', 'leads', 'atencion', 'atención', 'rapida', 'rápida', 'voz', 'llamadas', 'llamada', 'agente'],
      objective: 'respuesta'
    },
    geo: {
      key: 'geo',
      label: 'GEO',
      aliases: ['geo', 'motor', 'motores', 'perplexity', 'chatgpt', 'gemini', 'buscadores'],
      objective: 'geo'
    },
    formacion: {
      key: 'formacion',
      label: 'FORMACIÓN',
      aliases: ['formacion', 'formación', 'equipo', 'equipos', 'plantilla', 'capacitacion', 'capacitación'],
      objective: 'formacion'
    }
  },

  // -------------------------------------------------------------
  // 4. GENERADOR DE PLANTILLAS DE MENSAJES DIRECTOS (DMs)
  // Diseñados estrictamente para venta y cualificación B2B
  // -------------------------------------------------------------
  dmTemplates: {
    consultoria: (platform) => {
      const url = `https://pebaisystems.es/diagnostico/?origen=${platform}&palabra=consultoria`;
      return (
`Hola. Gracias por escribir CONSULTORÍA.

Estamos seleccionando empresas para realizar una consultoría de IA a 0 € y detectar dónde estáis perdiendo horas, costes y ventas que se puedan solucionar con sistemas inteligentes.

Para que revisemos tu caso y valoremos si podemos abrir una plaza para tu empresa, déjanos los datos en la solicitud privada:
👉 ${url}

Revisamos cada solicitud personalmente. Si vemos encaje, te contactamos directamente por WhatsApp.`
      );
    },

    respuesta: (platform) => {
      const url = `https://pebaisystems.es/diagnostico/?origen=${platform}&palabra=respuesta`;
      return (
`Hola. Gracias por escribir RESPUESTA.

En PEBAI implantamos sistemas que atienden, cualifican y orientan a potenciales clientes en menos de 60 segundos, evitando la pérdida de ventas fuera de horario y fines de semana.

Para analizar los canales de tu negocio y valorar si encaja implantar este sistema en tu operativa, déjanos los datos en la solicitud privada:
👉 ${url}

Analizaremos tu volumen de consultas y te diremos si tiene sentido trabajarlo juntos.`
      );
    },

    geo: (platform) => {
      const url = `https://pebaisystems.es/diagnostico/?origen=${platform}&palabra=geo`;
      return (
`Hola. Gracias por escribir GEO.

Los motores de IA (ChatGPT, Perplexity) ya están recomendando proveedores y desviando clientes hacia la competencia. En PEBAI auditamos y posicionamos empresas para que la IA las recomiende como la opción de referencia.

Para que nuestro equipo evalúe la visibilidad de tu marca y valoremos si hay oportunidad de posicionarte en tu sector, déjanos los datos aquí:
👉 ${url}

Revisaremos si tu empresa reúne las condiciones para este servicio.`
      );
    },

    formacion: (platform) => {
      const url = `https://pebaisystems.es/diagnostico/?origen=${platform}&palabra=formacion`;
      return (
`Hola. Gracias por escribir FORMACIÓN.

En PEBAI no damos cursos teóricos de IA: entrenamos a equipos sobre sus procesos reales y herramientas diarias para generar un ahorro medible de horas desde la primera semana.

Para analizar los las tareas repetitivas y atascos de tu plantilla y valorar si encaja diseñar un plan de formación a medida para tu empresa, déjanos los datos en la solicitud privada:
👉 ${url}

Revisaremos el perfil de tu equipo y te diremos la viabilidad técnica.`
      );
    }
  },

  // -------------------------------------------------------------
  // 5. RESPUESTAS PÚBLICAS A COMENTARIOS (IMPULSO DEL ALGORITMO)
  // -------------------------------------------------------------
  publicCommentReplies: [
    'Te lo acabamos de enviar por mensaje privado 📩',
    'Revisa tus mensajes directos 👍 Te lo hemos dejado ahí.',
    'Enviado por DM con toda la información ⚡',
    'Listo, te lo hemos enviado por mensaje privado 📩'
  ],

  // -------------------------------------------------------------
  // 6. PROTOCOLO DE FALLBACK PARA TIKTOK (DMs CERRADOS / BLOQUEADOS)
  // -------------------------------------------------------------
  tiktokFallbackReplies: [
    (keyword) => `Tienes los mensajes privados de TikTok restringidos y no te llega 🔒 Escríbenos la palabra "${keyword}" por mensaje directo a nuestro Instagram @pebaisystems y te lo enviamos al segundo.`,
    (keyword) => `Tu configuración de TikTok no permite mensajes privados. Puedes acceder a la valoración directamente desde nuestra web en pebaisystems.es/diagnostico o mandarnos un DM en Instagram: @pebaisystems.`
  ],

  // -------------------------------------------------------------
  // 7. CRITERIOS DE EXCEPCIÓN HUMANA
  // -------------------------------------------------------------
  humanExceptionRules: {
    maxWordsForPureKeyword: 5,  // Si tiene más de 5 palabras, suele ser una duda compleja
    questionMarkTriggers: ['?', '¿', 'cuanto', 'cuánto', 'precio', 'coste', 'reformas', 'inmobiliaria', 'mi caso']
  }
};
