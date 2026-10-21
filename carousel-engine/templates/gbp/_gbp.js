/* PEBAI · motor mínimo de las plantillas GBP.
   Los datos llegan, por orden de prioridad:
   1. window.GBP_DATA (lo inyecta carousel-engine/render_gbp.py)
   2. ?data=<JSON en base64url>
   3. parámetros sueltos: ?title=...&subtitle=...&tag=...&items=a|b|c&theme=light
   4. los valores de ejemplo de cada plantilla.
   Texto entre *asteriscos* sale en cursiva con el color de acento.
   Un item "Título: texto" se separa en título y texto donde la plantilla lo use. */
(function () {
  function fromQuery() {
    var q = new URLSearchParams(location.search);
    if (q.get('data')) {
      var b = q.get('data').replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(b))));
    }
    var d = {};
    q.forEach(function (v, k) {
      if (k === 'safe') return;
      d[k] = /^(items|before|after|rows|options)$/.test(k) ? v.split('|') : v;
    });
    return d;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function md(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
  }
  function split(item) {
    if (item && typeof item === 'object') return { head: item.title || item.head || '', text: item.text || '' };
    var s = String(item), i = s.indexOf(': ');
    return i > 0 ? { head: s.slice(0, i), text: s.slice(i + 2) } : { head: s, text: '' };
  }
  /* reduce el cuerpo de letra hasta que el bloque quepa en su caja */
  function fit(el, min) {
    if (!el) return;
    var size = parseFloat(getComputedStyle(el).fontSize);
    var mh = parseFloat(getComputedStyle(el).maxHeight);
    var guard = 80;
    /* tolerancia de 0,2 em: tildes, ¿ y descendentes sobresalen de la caja de línea sin que el texto sobre */
    var over = function () { return (isFinite(mh) && el.scrollHeight > mh + size * 0.2) || el.scrollWidth > el.clientWidth + 1; };
    while (guard-- > 0 && size > min && over()) {
      size -= 2;
      el.style.fontSize = size + 'px';
    }
  }

  function shell(d) {
    var html = document.documentElement;
    html.dataset.theme = d.theme === 'light' ? 'light' : 'dark';
    var serie = d.serie || '';
    var pre = document.createElement('div');
    pre.innerHTML =
      '<div class="bg"></div><div class="grid"></div><div class="noise"></div>' +
      '<div class="rail l"><span class="num t">' + esc(d.rail_top || 'PEBAI') + '</span><span class="v">' + esc(d.rail_left || 'Consultoría de procesos e Inteligencia Artificial') + '</span></div>' +
      '<div class="rail r"><span class="num t">' + esc(serie) + '</span><span class="v">pebaisystems.es</span><span class="num b">ES</span></div>' +
      '<i class="cross" style="left:150px;top:30px"></i><i class="cross" style="left:1050px;top:30px"></i>' +
      '<i class="cross" style="left:150px;top:870px"></i><i class="cross" style="left:1050px;top:870px"></i>';
    while (pre.firstChild) document.body.insertBefore(pre.firstChild, document.body.firstChild);
    if (new URLSearchParams(location.search).get('safe') || d.safe_guide) {
      var g = document.createElement('div'); g.className = 'safe-guide'; document.body.appendChild(g);
    }
  }

  window.GBP = {
    esc: esc, md: md, split: split, fit: fit,
    boot: function (defaults, render) {
      var d;
      try { d = window.GBP_DATA || fromQuery(); } catch (e) { d = {}; console.error('GBP: datos ilegibles', e); }
      d = Object.assign({}, defaults, d || {});
      shell(d);
      render(d);
      var ready = function () {
        document.querySelectorAll('[data-fit]').forEach(function (el) { fit(el, parseFloat(el.dataset.fit) || 40); });
        /* si el conjunto no cabe en 900 px, se reduce el titular */
        var safe = document.querySelector('.safe'), t = document.querySelector('.title'), g = 60;
        var foot = document.querySelector('.foot');
        var limit = safe ? safe.getBoundingClientRect().bottom - parseFloat(getComputedStyle(safe).paddingBottom) : 0;
        while (safe && t && foot && g-- > 0 && foot.getBoundingClientRect().bottom > limit + 1 && parseFloat(getComputedStyle(t).fontSize) > 44) {
          t.style.fontSize = (parseFloat(getComputedStyle(t).fontSize) - 2) + 'px';
          t.style.maxHeight = 'none';
        }
        document.body.dataset.ready = '1';
      };
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
        requestAnimationFrame(function () { requestAnimationFrame(ready); });
      });
    }
  };
})();
