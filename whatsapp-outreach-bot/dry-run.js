import { Config } from './config.js';
import { getPendingLeads } from './sheets-service.js';
import { generateOutreachMessage } from './ai-generator.js';

async function runDryRun() {
  console.log('============================================================');
  console.log('🧪 MODO DE SIMULACIÓN (DRY-RUN) - BOT DE PROSPECCIÓN WHATSAPP');
  console.log('Ningún mensaje será enviado por WhatsApp en este modo.');
  console.log('============================================================\n');

  console.log('1. Verificando origen de leads (Google Sheets o leads.csv)...');
  const { source, leads } = await getPendingLeads();
  console.log(`✅ Origen detectado: ${source.toUpperCase()}`);
  console.log(`📊 Total de prospectos pendientes encontrados: ${leads.length}`);

  if (leads.length === 0) {
    console.log('⚠️ No hay leads con estado PENDIENTE.');
    return;
  }

  const sampleCount = Math.min(3, leads.length);
  console.log(`\n2. Simulando generación de mensajes únicos para los primeros ${sampleCount} prospectos:\n`);

  for (let i = 0; i < sampleCount; i++) {
    const lead = leads[i];
    console.log(`------------------------------------------------------------`);
    console.log(`🏢 Prospecto #${i + 1}: ${lead.empresa}`);
    console.log(`📱 Teléfono: +${lead.telefono}`);
    console.log(`👤 Contacto: ${lead.contacto || 'No indicado'}`);
    console.log(`🏷️ Sector: ${lead.sector || 'General'}`);
    console.log(`📝 Notas: ${lead.notas || 'Ninguna'}`);

    console.log('🤖 Redactando mensaje personalizado con IA...');
    const message = await generateOutreachMessage(lead);

    console.log('\n💬 [MENSAJE GENERADO]:');
    console.log(message);

    const minSec = Config.DELAYS.MIN_MINUTES * 60;
    const maxSec = Config.DELAYS.MAX_MINUTES * 60;
    const simulatedDelay = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
    console.log(`\n⏳ [CADENCIA CALCULADA]: ${(simulatedDelay / 60).toFixed(1)} minutos de espera antes del siguiente`);
    console.log('------------------------------------------------------------\n');
  }

  console.log('============================================================');
  console.log('✅ SIMULACIÓN COMPLETADA CON ÉXITO');
  console.log('Para iniciar el bot real con WhatsApp, ejecuta: npm start');
  console.log('============================================================');
}

runDryRun().catch(console.error);
