// social-media-engine/response-dispatcher.js
// Orquestador central de decisiones de respuesta para Instagram, TikTok, Facebook y X

const config = require('./config');
const { matchKeyword } = require('./keyword-matcher');
const memoryStore = require('./memory-store');

/**
 * Procesa un evento de comentario o mensaje entrante y genera el plan de acción.
 * @param {object} event - Datos del evento entrante.
 * @returns {object} - Plan de respuesta estructurado.
 */
function processIncomingInteraction(event) {
  const {
    platform,       // 'instagram', 'tiktok', 'facebook', 'x'
    userId,
    username,
    text,
    commentId = null,
    postId = null,
    canReceiveDM = true // Flag especial para TikTok
  } = event;

  // 1. Detección de palabra clave e intención
  const matchResult = matchKeyword(text);
  if (!matchResult.matched) {
    return {
      status: 'ignored',
      reason: 'no_keyword_matched',
      rawText: text
    };
  }

  const { keywordKey, keywordLabel, requiresHuman, humanReason } = matchResult;

  // 2. Control de duplicados INTELIGENTE (por usuario + postId + keywordKey)
  // Si comenta en el MISMO post/vídeo en menos de 24h, se bloquea el duplicado.
  // Si comenta en OTRO vídeo distinto, SÍ se procesa.
  if (memoryStore.isDuplicate(userId, keywordKey, platform, postId)) {
    return {
      status: 'duplicate_blocked',
      reason: 'already_processed_in_same_post_last_24h',
      publicCommentReply: 'Ya te enviamos el acceso por mensaje privado antes 📩 Si no lo ves, revisa tu carpeta de solicitudes.',
      userId,
      postId,
      keywordKey
    };
  }

  // 3. Comprobación de descanso nocturno y límites de DMs
  const permission = memoryStore.canSendOutboundDM();
  if (!permission.allowed) {
    if (permission.reason === 'night_rest_active') {
      memoryStore.enqueueNightMessage({
        platform,
        userId,
        username,
        keywordKey,
        commentId,
        postId
      });
      return {
        status: 'queued_night_rest',
        reason: 'night_rest_02_to_07_am',
        publicCommentReply: null
      };
    }

    if (permission.reason.includes('limit_reached')) {
      console.warn(`[Security] Límite horario de DMs alcanzado (${permission.count} DMs/h). Encolando evento.`);
      return {
        status: 'rate_limited',
        reason: permission.reason
      };
    }
  }

  // 4. Caso Especial TIKTOK: DMs Cerrados por Privacidad (Fallback)
  if (platform === 'tiktok' && canReceiveDM === false) {
    const fallbackTemplate = config.tiktokFallbackReplies[0];
    const fallbackText = fallbackTemplate(keywordLabel);

    memoryStore.recordAction({
      platform,
      userId,
      username,
      keywordKey,
      postId,
      commentId,
      actionType: 'fallback_replied',
      status: 'blocked_privacy',
      details: 'TikTok DM restringido por configuración de usuario (Fallback ejecutado)',
      requiresHuman,
      humanReason
    });

    return {
      status: 'executed_fallback',
      action: 'reply_comment_publicly',
      commentReplyText: fallbackText,
      dmMessageText: null,
      requiresHuman,
      humanReason
    };
  }

  // 5. Caso Estándar: Generación de DM Comercial + Respuesta Pública de Apoyo
  const dmTemplate = config.dmTemplates[keywordKey];
  const dmMessageText = dmTemplate ? dmTemplate(platform) : null;

  // Selección de respuesta pública aleatoria
  const randomReply = config.publicCommentReplies[
    Math.floor(Math.random() * config.publicCommentReplies.length)
  ];

  // Cálculo de retardo humano aleatorio (ej. entre 8 y 22 segundos)
  const typingDelayMs = Math.floor(
    Math.random() * (config.security.typingDelayMaxMs - config.security.typingDelayMinMs) +
    config.security.typingDelayMinMs
  );

  // Registro en memoria
  memoryStore.recordAction({
    platform,
    userId,
    username,
    keywordKey,
    postId,
    commentId,
    actionType: 'dm_sent',
    status: 'success',
    details: `DM ${keywordLabel} generado para ${platform}`,
    requiresHuman,
    humanReason
  });

  return {
    status: 'ready_to_send',
    platform,
    userId,
    username,
    postId,
    commentId,
    keywordKey,
    dmMessageText,
    publicCommentReply: randomReply,
    typingDelayMs,
    requiresHuman,
    humanReason: requiresHuman ? humanReason : null
  };
}

module.exports = {
  processIncomingInteraction
};
