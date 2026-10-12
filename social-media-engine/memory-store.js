// social-media-engine/memory-store.js
// Gestor de memoria persistente con deduplicación por vídeo (postId) y contadores separados

const fs = require('fs');
const path = require('path');
const config = require('./config');

const DB_PATH = path.join(__dirname, 'data', 'interactions.json');
const QUEUE_PATH = path.join(__dirname, 'data', 'night_queue.json');

function initStorage() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ 
      interactions: [], 
      stats: { totalDMsSent: 0, totalCommentsReplied: 0 } 
    }, null, 2));
  }
  if (!fs.existsSync(QUEUE_PATH)) {
    fs.writeFileSync(QUEUE_PATH, JSON.stringify([], null, 2));
  }
}

function loadInteractions() {
  initStorage();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[MemoryStore] Error leyendo base de datos:', err.message);
    return { interactions: [], stats: { totalDMsSent: 0, totalCommentsReplied: 0 } };
  }
}

function saveInteractions(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[MemoryStore] Error guardando base de datos:', err.message);
  }
}

function isNightRestTime() {
  const now = new Date();
  const currentHour = now.getHours();
  const { nightRestStartHour, nightRestEndHour } = config.security;
  return currentHour >= nightRestStartHour && currentHour < nightRestEndHour;
}

/**
 * Cuenta las acciones de un tipo específico realizadas en los últimos 60 minutos.
 * @param {'dm_sent' | 'comment_replied' | 'fallback_replied'} actionType 
 */
function getActionsInLastHour(actionType) {
  const data = loadInteractions();
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  return data.interactions.filter(item => {
    return item.actionType === actionType && new Date(item.timestamp).getTime() > oneHourAgo;
  }).length;
}

/**
 * Comprueba los límites de seguridad específicos para DMs privados.
 */
function canSendOutboundDM() {
  if (isNightRestTime()) {
    return { allowed: false, reason: 'night_rest_active' };
  }

  const dmsInLastHour = getActionsInLastHour('dm_sent');
  if (dmsInLastHour >= config.security.hourlyLimitHard) {
    return { allowed: false, reason: 'hourly_dm_hard_limit_reached', count: dmsInLastHour };
  }
  if (dmsInLastHour >= config.security.hourlyLimitSafe) {
    return { allowed: false, reason: 'hourly_dm_safe_limit_reached', count: dmsInLastHour };
  }

  return { allowed: true, count: dmsInLastHour };
}

/**
 * DEDUPLICACIÓN INTELIGENTE:
 * Solo se considera duplicado si es el MISMO usuario, en el MISMO post/vídeo, 
 * con la MISMA palabra clave y en la ventana de 24 horas.
 * Si es OTRO post/vídeo, se permite y se procesa.
 */
function isDuplicate(userId, keywordKey, platform, postId) {
  if (!postId) {
    // Si no hay postId conocido, revisa solo usuario + keyword en ventana de 24h
    return checkUserGlobalDuplicate(userId, keywordKey, platform);
  }

  const data = loadInteractions();
  const windowMs = config.security.deduplicationWindowHours * 60 * 60 * 1000;
  const cutoffTime = Date.now() - windowMs;

  const found = data.interactions.find(item => {
    return item.userId === String(userId) &&
           item.platform === platform &&
           item.keywordKey === keywordKey &&
           item.postId === String(postId) && // Condición clave: MISMO POST
           new Date(item.timestamp).getTime() > cutoffTime;
  });

  return !!found;
}

function checkUserGlobalDuplicate(userId, keywordKey, platform) {
  const data = loadInteractions();
  const windowMs = config.security.deduplicationWindowHours * 60 * 60 * 1000;
  const cutoffTime = Date.now() - windowMs;

  const found = data.interactions.find(item => {
    return item.userId === String(userId) &&
           item.platform === platform &&
           item.keywordKey === keywordKey &&
           new Date(item.timestamp).getTime() > cutoffTime;
  });

  return !!found;
}

function recordAction({ platform, userId, username, keywordKey, postId, commentId, actionType, status, details, requiresHuman, humanReason }) {
  const data = loadInteractions();
  
  const record = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    platform,
    userId: String(userId),
    username: username || 'unknown',
    keywordKey,
    postId: postId ? String(postId) : null,
    commentId: commentId ? String(commentId) : null,
    actionType, // 'dm_sent', 'comment_replied', 'fallback_replied', 'queued'
    status,     // 'success', 'failed', 'blocked_privacy'
    details: details || null,
    requiresHuman: !!requiresHuman,
    humanReason: humanReason || null
  };

  data.interactions.push(record);
  
  if (actionType === 'dm_sent' && status === 'success') {
    data.stats.totalDMsSent = (data.stats.totalDMsSent || 0) + 1;
  }
  if ((actionType === 'comment_replied' || actionType === 'fallback_replied') && status === 'success') {
    data.stats.totalCommentsReplied = (data.stats.totalCommentsReplied || 0) + 1;
  }

  saveInteractions(data);
  return record;
}

function enqueueNightMessage(item) {
  initStorage();
  try {
    const raw = fs.readFileSync(QUEUE_PATH, 'utf-8');
    const queue = JSON.parse(raw);
    queue.push({ ...item, queuedAt: new Date().toISOString() });
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
    console.log(`[Queue] Mensaje encolado para la mañana: @${item.username} (${item.keywordKey})`);
  } catch (err) {
    console.error('[Queue] Error encolando mensaje:', err.message);
  }
}

module.exports = {
  isNightRestTime,
  getActionsInLastHour,
  canSendOutboundDM,
  isDuplicate,
  recordAction,
  enqueueNightMessage,
  loadInteractions
};
