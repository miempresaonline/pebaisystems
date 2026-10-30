"""Pasa una página de guía maquetada con el diseño anterior (borradores/html/) al diseño nuevo
de las páginas de soluciones y guías (commit 8925621: cabecera, hero con vídeo, índice lateral, cierre con el equipo y footer).

Uso:  python website-pebai/scripts/portar_diseno_nuevo.py <entrada.html> <salida.html> [--plantilla=<página ya en diseño nuevo>]

Conserva lo que es de la página: cabecera SEO y JSON-LD, miga de pan, etiqueta, H1, autor y fecha,
respuesta corta, texto, FAQ, puente y fuentes. Todo lo demás sale de la plantilla.
El índice lateral se hace con los H2 del texto (sin el puente ni las fuentes).
"""
import re
import sys

PLANTILLA = 'website-pebai/dist/ia-para-empresas/cuanto-cuesta/index.html'


def entre(texto, ini, fin, desde=0):
    a = texto.index(ini, desde)
    b = texto.index(fin, a)
    return texto[a:b]


def portar(viejo, plantilla):
    corte_head = '<link rel="icon" href="/favicon.ico"'
    seo = viejo[:viejo.index(corte_head)]
    cromo = plantilla[plantilla.index(corte_head):plantilla.index('<article class="art sv10">')]
    cierre = plantilla[plantilla.index('<!-- CIERRE Y EQUIPO -->'):]

    art = entre(viejo, '<article class="art">', '</article>')
    crumbs = entre(art, '<nav class="crumbs"', '</nav>') + '</nav>'
    tag = re.search(r'<span class="tag">(.*?)</span>', art).group(1)
    h1 = re.search(r'<h1>(.*?)</h1>', art, re.S).group(1)
    byline = entre(art, '<div class="byline">', '</div>') + '</div>'
    cuerpo = art[art.index('<p class="answer">'):]
    # el cuerpo acaba en </div> de .prose seguido de los cierres de .col y .wrap
    cuerpo = re.sub(r'\s*</div>\s*</div>\s*</div>\s*$', '', cuerpo.rstrip())

    m = re.search(r'/consultoria-gratuita/\?cta=pilar_([a-z0-9-]+)', cuerpo)
    if not m:
        sys.exit('No encuentro el cta=pilar_<slug> del puente')
    slug = m.group(1)

    toc = []
    for idh, txt in re.findall(r'<h2 id="([^"]+)"[^>]*>(.*?)</h2>', cuerpo, re.S):
        if idh in ('puente', 'fuentes'):
            continue
        toc.append(f'<li><a href="#{idh}">{re.sub(r"<[^>]+>", "", txt).strip()}</a></li>')

    hero_media = entre(plantilla, '<div class="svh-media', '</section>')
    hero_media = hero_media[:hero_media.rindex('</div>')]  # sin el cierre de .svh-grid

    sangria = lambda s, n: '\n'.join((' ' * n + l) if l.strip() else l for l in s.strip().split('\n'))
    nuevo = (
        seo + cromo
        + '<article class="art sv10">\n<section class="svh">\n  <div class="wrap svh-grid">\n    <div class="svh-copy">\n'
        + '      ' + crumbs.strip() + '\n'
        + f'      <span class="tag svh-tag">{tag}</span>\n'
        + f'      <h1>{h1}</h1>\n'
        + '      ' + byline.strip() + '\n'
        + f'      <div class="svh-cta"><a class="btn btn-lime" href="/diagnostico/?cta=pilar_{slug}_hero" data-event="click_consultoria_pilar_hero">Consultoría gratuita</a><a class="btn-light" href="/#analizar">Analizar mi empresa</a></div>\n'
        + '    </div>\n    ' + hero_media.strip() + '\n  </div>\n</section>\n'
        + '<section class="svb">\n  <div class="wrap svb-grid">\n'
        + '    <aside class="svb-toc" aria-label="En esta página"><p>En esta página</p><ol>' + ''.join(toc) + '</ol></aside>\n'
        + '    <div class="svb-main">\n      ' + cuerpo.strip() + '\n\n      </div>\n    </div>\n  </div>\n</section>\n</article>\n'
        + cierre
    )
    return nuevo


if __name__ == '__main__':
    opts = {a[2:].split('=', 1)[0]: a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 2:
        sys.exit(__doc__)
    with open(args[0], encoding='utf-8') as f:
        viejo = f.read()
    with open(opts.get('plantilla', PLANTILLA), encoding='utf-8') as f:
        plantilla = f.read()
    with open(args[1], 'w', encoding='utf-8') as f:
        f.write(portar(viejo, plantilla))
    print('ok', args[1])
