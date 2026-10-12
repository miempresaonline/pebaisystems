// social-media-engine/runner.js
// Daemon Supervisor 24/7 de Automatización de Redes Sociales — PEBAI Systems

const config = require('./config');
const memoryStore = require('./memory-store');
const { processIncomingInteraction } = require('./response-dispatcher');

console.log('================================================================');
console.log('  INICIANDO PEBAI SOCIAL MEDIA ENGINE (DAEMON 24/7 ACTIVO)      ');
console.log('================================================================');
console.log(`- Límites DMs seguros: ${config.security.hourlyLimitSafe}/hora (Techo: ${config.security.hourlyLimitHard}/h)`);
console.log(`- Descanso nocturno: ${config.security.nightRestStartHour}:00 a ${config.security.nightRestEndHour}:00`);
console.log(`- Ventana deduplicación por post: ${config.security.deduplicationWindowHours} horas`);
console.log(`- Plataformas configuradas: Instagram, TikTok, Facebook, X (LinkedIn: Excluido)`);
console.log('----------------------------------------------------------------\n');

// Loop principal de supervisión periódica
function startSupervisor() {
  setInterval(() => {
    const isNight = memoryStore.isNightRestTime();
    const dmsLastHour = memoryStore.getActionsInLastHour('dm_sent');
    const commentsLastHour = memoryStore.getActionsInLastHour('comment_replied');

    const now = new Date().toLocaleTimeString('es-ES');
    console.log(`[${now}] Estado: ${isNight ? '🌙 DESCANSO NOCTURNO (Colas activas)' : '⚡ ACTIVO'} | DMs últ/h: ${dmsLastHour}/${config.security.hourlyLimitSafe} | Comentarios: ${commentsLastHour}`);
  }, 120000); // Muestra latido cada 2 minutos
}

startSupervisor();
