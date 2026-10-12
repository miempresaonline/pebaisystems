/* Configuración PEBAI Systems */
window.PEBAI_CONFIG = {
  provisionalLinks: false,
  // Para enlazar directamente con tu número de WhatsApp oficial, añade aquí tu teléfono con prefijo (ej: '34600112233'):
  whatsappNumber: '34624842799',
  links: {
    // Botón circular 'Hablemos por WhatsApp': mensaje directo y limpio sin corchetes
    whatsapp: 'https://wa.me/34624842799?text=Hola%2C%20he%20visto%20la%20web%20de%20PEBAI%20Systems%20y%20me%20gustar%C3%ADa%20hablar%20con%20el%20equipo%20sobre%20mi%20negocio.',
    // Enlace directo al Embudo de Diagnóstico Técnico
    diagnostico: './diagnostico/',
    instagram: 'https://www.instagram.com/pebaisystems/',
    tiktok: 'https://www.tiktok.com/',
    youtube: 'https://www.youtube.com/'
  },
  // Analítica, CRO y Telemetría Server-Side
  analytics: {
    clarityId: 'yjwe6ir50h', // Microsoft Clarity Oficial PEBAI
    ga4Id: 'G-2QFM6HCTWV',     // GA4 Measurement ID Oficial
    telemetryEndpoint: '/api/telemetry.php',
    wpTelemetryEndpoint: '/wp-json/pebai/v1/telemetry',
    leadValueEUR: 50.00
  }
};

