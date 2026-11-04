# Análisis · ¿`/ia-para-empresas/madrid/`? (geo_contenido, 4/11/2026, 10:00)

Encargos del tablón: Jefe 3/11 (GSC Madrid) y Preguntas 3/11 tarde (`preguntas.md` «Madrid»). Método: `seo-clean-architecture` (una URL madre por tema; una página de ciudad solo si aporta lo que la madre no tiene).

## Conclusión: **no se hace la página.** Se descarta con el dato.

## Por qué

1. **No hay nada real de Madrid que contar.**
   - El equipo es 100 % remoto y no hace reuniones presenciales (`/ia-para-empresas/valencia/`, H2 «Reuniones»: «Por videollamada, en remoto»). Una página de Madrid que prometa cercanía contradiría la de Valencia.
   - Ninguno de los 4 casos de `casos.md` es de Madrid (Fran García Cars: sin ciudad pública; Santacruz: sedes en España, Francia, Países Bajos y Bélgica sin ciudad; Gargom y El Amparo: sin Madrid).
   - La «Sede en Valencia & Madrid» de `/consultoria-gratuita/` está anotada como conflicto en `embudo-y-voz.md` (choca con el NAP y con el JSON-LD); no sirve como base de una página.
2. **Las ayudas de la Comunidad de Madrid no dan para una sección propia hoy** (verificado el 4/11 en fuentes oficiales [V]):
   - **Subvenciones a casos de uso de IA industrial** (sede.comunidad.madrid, ref. A591): plazo del 04/09/2024 al 31/12/2024, **cerrado**; última actuación, resolución del 21/04/2025 (Orden 67/2025). https://sede.comunidad.madrid/ayudas-becas-subvenciones/subvenciones-casos-uso-ia-industrial
   - **AI4Pymes Madrid** (nota del 14/01/2026): plataforma gratuita con IndesIA (análisis de datos, gestor de convocatorias, digitalizador de albaranes, creador de asistentes), con fondos Next Generation. **No es una convocatoria de ayudas**: no da dinero, cuantía ni plazo. https://www.comunidad.madrid/node/107833
   - **Convenio con IndesIA** (nota del 7/08/2026): 6 millones hasta 2028 en programas y servicios gratuitos; sin línea de ayudas, requisitos ni plazo publicados. https://www.comunidad.madrid/node/117962
   - **Taller con OpenAI** (nota del 16/09/2026): una jornada, no una ayuda. https://www.comunidad.madrid/press-releases/download/119285
   - No se encontró en el BOCM una convocatoria de 2026 de IA para pymes abierta a 4/11. Si se publica, se reabre este análisis.
3. **La demanda es pequeña y de «agencia por ciudad».** GSC 28 días a 3/11: «agencia inteligencia artificial empresas madrid» 13 impr. (pos. 72), «automatización ia para empresas madrid» 11 (pos. 84); 0 clics. La URL vieja `/agencia-inteligencia-artificial-empresas-madrid/` (62 impr., pos. 33) recibe sobre todo la consulta de marca «pebai» (`preguntas.md`, 28/10).
4. **La madre ya responde a «¿trabajáis en Madrid?».** `/ia-para-empresas/` dice: «PEBAI trabaja con empresas de toda España, también de Madrid y de Valencia» (encargo de Refresco ya publicado). Una página de Madrid con el mismo contenido canibalizaría la madre.

## Qué se hace en su lugar

- **Propuesta a Técnico (vía Jefe):** la URL vieja `agencia-inteligencia-artificial-empresas-madrid` da 301 a la portada (`.htaccess`, línea 83), mientras que `consultoria-inteligencia-artificial-madrid` ya va a `/ia-para-empresas/` (línea 79). Llevar también la de agencia a `/ia-para-empresas/`, que es la página que menciona Madrid y responde a «automatización IA para empresas». Comprobar: `curl -sI` con un solo salto a `/ia-para-empresas/`.
- **Para la vertical de despachos o una FAQ de ayudas:** si alguien pregunta por ayudas de Madrid, la respuesta honesta es «la línea de casos de uso de IA cerró en 2024; AI4Pymes es una plataforma gratuita, no una subvención». Vale como FAQ en una página de ayudas si algún día se hace, no como página de ciudad.
- **Revisar de nuevo** si aparece un cliente de Madrid con permiso para contarlo o una convocatoria abierta en el BOCM.
