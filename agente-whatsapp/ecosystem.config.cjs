// PM2: mantiene el agente vivo 24/7 en el servidor y lo reinicia si se cae.
module.exports = {
  apps: [{
    name: 'pebai-agente-whatsapp',
    script: 'index.js',
    cwd: __dirname,
    max_memory_restart: '350M',
    restart_delay: 15000,
    exp_backoff_restart_delay: 2000,
    time: true,
  }],
};
