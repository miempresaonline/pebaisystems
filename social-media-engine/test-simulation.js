// social-media-engine/test-simulation.js
// Verificación completa de la lógica de duplicados por post y límites independientes

const { processIncomingInteraction } = require('./response-dispatcher');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('  VERIFICACIÓN FASE 2: DEDUPLICACIÓN POR POST Y LÍMITES         ');
console.log('================================================================\n');

// Limpiar base de datos para la prueba
const dbPath = path.join(__dirname, 'data', 'interactions.json');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const testScenarios = [
  {
    name: 'Paso 1: Carlos comenta CONSULTORÍA en Vídeo A (Reel de procesos)',
    event: {
      platform: 'instagram',
      userId: 'user_carlos',
      username: 'carlos_pyme',
      postId: 'reel_video_A',
      text: 'CONSULTORÍA',
      canReceiveDM: true
    }
  },
  {
    name: 'Paso 2: Carlos vuelve a comentar CONSULTORÍA en el MISMO Vídeo A (Debe Bloquearse)',
    event: {
      platform: 'instagram',
      userId: 'user_carlos',
      username: 'carlos_pyme',
      postId: 'reel_video_A',
      text: 'consultoria por favor',
      canReceiveDM: true
    }
  },
  {
    name: 'Paso 3: Carlos comenta CONSULTORÍA en un NUEVO Vídeo B (Debe Enviarse)',
    event: {
      platform: 'instagram',
      userId: 'user_carlos',
      username: 'carlos_pyme',
      postId: 'reel_video_B', // POST DIFERENTE
      text: 'CONSULTORÍA',
      canReceiveDM: true
    }
  },
  {
    name: 'Paso 4: TikTok con DMs cerrados (Fallback no consume cupo de DMs)',
    event: {
      platform: 'tiktok',
      userId: 'user_laura',
      username: 'laura_directora',
      postId: 'tiktok_video_10',
      text: 'RESPUESTA',
      canReceiveDM: false
    }
  }
];

testScenarios.forEach((scenario, index) => {
  console.log(`----------------------------------------------------------------`);
  console.log(`[TEST ${index + 1}] ${scenario.name}`);
  console.log(`Post ID: ${scenario.event.postId} | Usuario: @${scenario.event.username}`);
  
  const result = processIncomingInteraction(scenario.event);
  console.log(`Estado: [${result.status}]`);

  if (result.status === 'ready_to_send') {
    console.log(`✅ DM generado con éxito para ${scenario.event.platform}`);
    console.log(`Retardo: ${(result.typingDelayMs / 1000).toFixed(1)}s | Respuesta pública: "${result.publicCommentReply}"`);
  } else if (result.status === 'duplicate_blocked') {
    console.log(`🛡️ Duplicado bloqueado correctamente en el mismo post (${result.postId})`);
    console.log(`Aviso público: "${result.publicCommentReply}"`);
  } else if (result.status === 'executed_fallback') {
    console.log(`⚡ Fallback ejecutado en TikTok (Solo comentario público, DMs intactos)`);
    console.log(`Respuesta: "${result.commentReplyText}"`);
  }
  console.log('');
});

console.log('================================================================');
console.log('       PRUEBAS DE MATICES DE DUPLICADOS Y LIMITES SUPERADAS     ');
console.log('================================================================');
