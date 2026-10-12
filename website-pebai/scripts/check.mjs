import { access } from 'node:fs/promises';

const required = [
  'dist/index.html', 'dist/styles.css', 'dist/app.js', 'dist/signal-field.js', 'dist/config.js',
  'dist/vendor/gsap.min.js', 'dist/vendor/ScrollTrigger.min.js', 'dist/vendor/lenis.min.js', 'dist/vendor/lenis.css',
  'dist/brand/pebai-logo-03-master-transparent-v1.png',
  'dist/clients/fran-garcia-cars-hero.jpg', 'dist/clients/construcciones-gargom-casa-brise-soleil.jpg', 'dist/clients/suministros-santacruz-empresa.png',
  'dist/team/dani-editorial.png', 'dist/team/adrian-editorial.png', 'dist/team/adrian-editorial-v3.png'
];

for (const file of required) await access(file);
console.log(`Local build check passed (${required.length} required files).`);
