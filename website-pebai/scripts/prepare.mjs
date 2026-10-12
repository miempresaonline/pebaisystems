import { mkdir, copyFile, access } from 'node:fs/promises';
await mkdir('dist/vendor', { recursive: true });
for (const [source, target] of [
  ['node_modules/gsap/dist/gsap.min.js', 'gsap.min.js'],
  ['node_modules/gsap/dist/ScrollTrigger.min.js', 'ScrollTrigger.min.js'],
  ['node_modules/lenis/dist/lenis.min.js', 'lenis.min.js'],
  ['node_modules/lenis/dist/lenis.css', 'lenis.css'],
  ['node_modules/lenis/LICENSE', 'LENIS-LICENSE.txt']
]) {
  const destination = `dist/vendor/${target}`;
  try { await access(destination); continue; } catch { /* prepare missing vendor file */ }
  try { await copyFile(source, destination); }
  catch { console.warn(`Vendor file already staged or unavailable: ${target}`); }
}
console.log('Animation libraries prepared locally.');
