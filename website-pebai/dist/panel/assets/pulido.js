/* PEBAI · Panel — pulido común (06/11).
   Indicador que viaja entre opciones: una sola pieza se mueve de una a otra y se estira por el camino (el borde de delante
   llega antes que el de atrás, 0,36 s y 0,55 s). Sirve para todos los selectores en píldora del panel. Si algo falla, el
   selector se sigue viendo con su estilo de siempre: solo se cambia el aspecto cuando el indicador ya está puesto. */
(() => {
'use strict';
const SEL = '.pb-seg,.pb-pastilla,.pc-estados,.pgx-tipos';
const vigilados = new WeakSet();
function mide(box) {
  const on = box.querySelector(':scope>button.on');
  let ind = box.querySelector(':scope>.pb-ind');
  if (!on || !on.offsetWidth) { if (ind) ind.style.opacity = 0; return; }
  const nueva = !ind;
  if (nueva) { ind = document.createElement('i'); ind.className = 'pb-ind'; ind.setAttribute('aria-hidden', 'true'); box.prepend(ind); box.classList.add('pb-con-ind'); }
  const L = on.offsetLeft, R = box.scrollWidth - L - on.offsetWidth;
  const color = on.style.getPropertyValue('--c');
  if (color) ind.style.setProperty('--c', color);
  // Selector recién pintado (la pastilla de abajo se rehace al cambiar de sección): parte de donde estaba
  const venia = box._pbL != null && nueva;
  if (nueva || ind.style.opacity === '0') {
    ind.style.transition = 'none';
    ind.style.left = (venia ? box._pbL : L) + 'px'; ind.style.right = (venia ? box._pbR : R) + 'px';
    ind.style.top = on.offsetTop + 'px'; ind.style.height = on.offsetHeight + 'px'; ind.style.opacity = 1;
    void ind.offsetWidth; ind.style.transition = '';
    if (!venia) { box._pbL = L; box._pbR = R; return; }
  }
  const aDerecha = L > (box._pbL ?? L);
  ind.style.setProperty('--dl', aDerecha ? '.55s' : '.36s');
  ind.style.setProperty('--dr', aDerecha ? '.36s' : '.55s');
  ind.style.left = L + 'px'; ind.style.right = R + 'px'; ind.style.top = on.offsetTop + 'px'; ind.style.height = on.offsetHeight + 'px';
  box._pbL = L; box._pbR = R;
  // En móvil la fila se desliza: que la opción elegida quede a la vista
  if (box.scrollWidth > box.clientWidth + 2) {
    const a = on.offsetLeft - 12, b = on.offsetLeft + on.offsetWidth + 12 - box.clientWidth;
    if (box.scrollLeft > a) box.scrollTo({ left: a, behavior: 'smooth' }); else if (box.scrollLeft < b) box.scrollTo({ left: b, behavior: 'smooth' });
  }
}
function vigila(box) {
  if (!box) return;
  if (!vigilados.has(box)) {
    vigilados.add(box);
    new MutationObserver((ms) => {
      if (ms.some((m) => m.type === 'attributes' ? m.target.tagName === 'BUTTON' : [...m.addedNodes].some((n) => n.tagName === 'BUTTON'))) requestAnimationFrame(() => mide(box));
    }).observe(box, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  }
  mide(box);
}
const todos = () => document.querySelectorAll(SEL).forEach(vigila);
window.pbSeg = vigila;
document.addEventListener('pb:page', () => { requestAnimationFrame(todos); setTimeout(todos, 500); });
window.addEventListener('resize', () => { clearTimeout(todos.t); todos.t = setTimeout(todos, 150); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(todos);
window.addEventListener('load', () => { todos(); setTimeout(todos, 800); });
})();
