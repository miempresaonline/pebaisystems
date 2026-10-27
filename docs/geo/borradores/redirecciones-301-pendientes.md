# 301 preparadas (Técnico, 27/10/2026)

Se aplican el mismo día que Contenido publique cada página (solo si la URL destino da 200). Orden en `website-pebai/dist/.htaccess`: las reglas 301 específicas van antes de la regla 302 de la línea 81.

## Formación (previsto 28/10)
1. Quitar de la lista 302 de la línea 81: `curso-inteligencia-artificial-para-empresas-espana`, `formacion-inteligencia-artificial-empresas`, `formacion-inteligencia-artificial-para-empresas-espana`.
2. Añadir antes (junto a la de WhatsApp, línea 69):
`RewriteRule ^(formacion-inteligencia-artificial-empresas|formacion-inteligencia-artificial-para-empresas-espana|curso-inteligencia-artificial-para-empresas-espana)(/.*)?$ ia-para-empresas/formacion/ [R=301,L]`

## Cuánto cuesta (previsto 29/10)
1. Quitar de la lista 302: `cuanto-cuesta-implementar-inteligencia-artificial-empresa`, `roi-retorno-inversion-inteligencia-artificial`.
2. `reducir-costes-operativos-automatizacion-ia` hoy ya es 301 a `/automatizacion-de-procesos/` (regla propia): `pilares.md` §5 lo manda a cuanto-cuesta. Cambiar su destino solo si Contenido lo confirma (ahora tiene sentido por tema en ambas).
3. Añadir:
`RewriteRule ^(cuanto-cuesta-implementar-inteligencia-artificial-empresa|roi-retorno-inversion-inteligencia-artificial)(/.*)?$ ia-para-empresas/cuanto-cuesta/ [R=301,L]`

## Comprobación
`curl -sI https://pebaisystems.es/<slug>/` = 301 con `location` al destino; `curl -s -o /dev/null -w %{http_code}` del destino = 200 (sin cadenas). Apuntar en `tecnico.md`.
