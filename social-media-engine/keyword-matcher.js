// social-media-engine/keyword-matcher.js
// Módulo de normalización lingüística y detección inteligente de intenciones

const config = require('./config');

function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .trim();
}

/**
 * Analiza un comentario o mensaje entrante.
 * @param {string} text - Texto del comentario o mensaje directo.
 * @returns {object} - Resultado del análisis.
 */
function matchKeyword(text) {
  const clean = normalizeText(text);
  if (!clean) {
    return { matched: false, reason: 'empty_text' };
  }

  // 1. Detectar si requiere atención humana (pregunta compleja o fuera de guion)
  const words = clean.split(/\s+/).filter(Boolean);
  const rawText = String(text);
  const hasQuestion = rawText.includes('?') || rawText.includes('¿');
  
  let hasSpecificDoubt = false;
  for (const trigger of config.humanExceptionRules.questionMarkTriggers) {
    if (clean.includes(normalizeText(trigger))) {
      hasSpecificDoubt = true;
      break;
    }
  }

  const isComplex = hasQuestion || hasSpecificDoubt || words.length > config.humanExceptionRules.maxWordsForPureKeyword;

  // 2. Buscar coincidencia con alguna de las palabras clave principales
  for (const [key, kwData] of Object.entries(config.keywords)) {
    for (const alias of kwData.aliases) {
      const cleanAlias = normalizeText(alias);
      
      // Coincidencia exacta o contenida como palabra aislada
      const regex = new RegExp(`(^|\\b|\\s)${cleanAlias}(\\b|\\s|$)`, 'i');
      if (regex.test(clean)) {
        return {
          matched: true,
          keywordKey: key,
          keywordLabel: kwData.label,
          objective: kwData.objective,
          requiresHuman: isComplex,
          humanReason: isComplex 
            ? (hasQuestion ? 'Contiene pregunta directa' : 'Mensaje largo con duda específica') 
            : null,
          rawText: text
        };
      }
    }
  }

  // 3. Si no coincide ninguna palabra pero es una consulta compleja dirigida a PEBAI
  if (isComplex && (clean.includes('pebai') || clean.includes('empresa') || clean.includes('hola') || clean.includes('info'))) {
    return {
      matched: true,
      keywordKey: 'consultoria', // Por defecto se canaliza como consultoría general
      keywordLabel: 'CONSULTORÍA',
      objective: 'procesos',
      requiresHuman: true,
      humanReason: 'Consulta abierta de usuario sin palabra clave exacta',
      rawText: text
    };
  }

  return {
    matched: false,
    requiresHuman: false,
    rawText: text
  };
}

module.exports = {
  normalizeText,
  matchKeyword
};
