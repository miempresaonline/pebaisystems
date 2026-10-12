# Taste Skill: Calibración Estética e Inferencia de Brief

Basado en el framework **Taste Skill** (`design-taste-frontend` de Leon Lin / Leonxlnx, analizado en los vídeos de Migue Baena y Víctor Crespo), este manual obliga al agente a ejecutar una **calibración estética previa** antes de escribir una sola línea de código, garantizando que el diseño tenga una dirección intencional, diferenciada y de altísimo nivel.

---

## 1. El Protocolo de Inferencia de Brief

Ninguna web, landing o componente en PEBAI Systems se diseña "por inercia" o con plantillas genéricas. Se debe definir explícitamente:
1. **Audiencia y Estatus:** ¿Hablamos con directores de operaciones, CEOs de PYMEs o ingenieros técnicos? El diseño debe transmitir rigor corporativo, alta tecnología y solvencia financiera.
2. **Propósito de Conversión:** ¿Es una landing de captación BOFU con filtro de inversión (como `/diagnostico/`), una página pilar de SEO programático o la portada institucional?
3. **Calibración de los 3 Diales Estéticos.**

---

## 2. Los 3 Diales Estéticos de Calibración

Antes de maquetar, se definen los tres parámetros clave:

### Dial 1: Varianza de Diseño (Archetype)
* **Arquetipo PEBAI Principal: *Lujo Técnico / Engineering Elite* (Vercel + Linear + Apple):**
  * Fondo oscuro profundo y refinado (`#090A10`), superficies elevadas con acentos azulados (`#121420`), micro-bordes luminiscentes de 1px (`rgba(255,255,255,0.08)`), tipografía sans-serif geométrica pura (`Manrope`) y acentos de alto contraste en lima tecnológico (`#B7FF3C`).
* **Arquetipo Alternativo: *Editorial B2B de Alta Conversión* (Financial Times / Stripe Climate):**
  * Fondos en marfil cálido (`#FAF9F7`), tipografía híbrida (Sans geométrica para titulares, Serif elegante de alto contraste para términos clave), tablas analíticas de precisión con líneas punteadas y sellos técnicos de verificación.

### Dial 2: Intensidad de Movimiento (Kinetic Scale)
* **Nivel 1 (Utilidad Estricta):** Microinteracciones puras de hover y click en botones ($150\text{ms}$). Cero distracciones de fondo. Ideal para páginas de términos legales o pasarelas de pago.
* **Nivel 2 (Cinética Elegante — ESTÁNDAR PEBAI):** Entradas escalonadas al cargar (`staggered fade-up`), pulsos radáricos sutiles en badges de estado, transiciones de vista fluidas con `@view-transition`, y feedback de compresión táctil `:active` en botones y tarjetas.
* **Nivel 3 (Inmersivo de Alto Impacto):** Halos atmosféricos reactivos (`ambient-glow`), escenas 3D interactivas (vía GetLayers o Canvas ligero) y animaciones de radar en tiempo real.

### Dial 3: Densidad Visual (Information Density)
* **Alta Densidad / Analítica:** Espacios de 8px a 16px, tablas compactas, telemetría con números tabulares y badges de estado técnicos. (Ej: Dashboards y comparativas técnicas).
* **Densidad Ejecutiva Equilibrada (ESTÁNDAR LANDINGS PEBAI):** Espaciado holgado (`padding: clamp(16px, 3vh, 32px)`), párrafos acotados a 60ch, retículas asimétricas Bento Grid y amplios márgenes para evitar saturación cognitiva.
* **Baja Densidad / High-Ticket Showcase:** Grandes bloques tipográficos de 48px-64px, un solo foco de atención por pantalla, espacios negativos de 64px a 96px que transmiten exclusividad y calma.

---

## 3. Lista de Prohibiciones Estéticas (Anti-Slop Checklist)

Si un diseño contiene cualquiera de estos 12 elementos, **está reprobado y debe ser corregido de inmediato**:
1. ❌ Degradados de texto fucsia-violeta-azul cielo de plantilla de IA.
2. ❌ Tarjetas blancas o grises flotando sin un borde reflexivo que defina sus límites ópticos.
3. ❌ Ilustraciones vectoriales 3D estilo "monigotes corporativos inflables" (Corporate Memphis).
4. ❌ Bloques de texto centrados de más de 4 líneas que destruyen el eje visual de lectura.
5. ❌ Iconos genéricos gigantes dentro de círculos de colores pastel sin propósito funcional.
6. ❌ Botones con sombras gigantes difusas de color que manchan el fondo.
7. ❌ Desbordamientos horizontales en móvil (`overflow-x` con barra de desplazamiento lateral).
8. ❌ Elementos interactivos con un área táctil menor a $44\times 44\text{px}$ en móvil.
9. ❌ Animaciones lentas de más de 400ms que obligan al usuario a esperar para interactuar.
10. ❌ Mezcla caótica de radios de esquina (ej: botones de 4px dentro de tarjetas de 32px).
11. ❌ Ausencia de soporte dual (romperse en modo claro o en modo oscuro).
12. ❌ Falta de feedback táctil `:active` o `:focus-visible` para accesibilidad.
