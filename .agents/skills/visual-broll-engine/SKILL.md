---
name: visual-broll-engine
description: Direccion de arte de vanguardia, integracion de imagenes B-roll tecnicas y renderizado multiformato (Playwright Retina 1080x1440 y Remotion) para carruseles de PEBAI Systems.
---

# Visual B-Roll Engine — PEBAI Systems (White Editorial Standard)

Este módulo operativo define la dirección de arte de alta tecnología, la composición visual y el pipeline de renderizado gráfico para los carruseles de PEBAI Systems, integrando los patrones ganadores analizados en `pebai-carousel-design-vault`.

## 1. Identidad Visual y Paleta Cromática

- **Fondo Base:** `#FFFFFF` (Blanco puro) o `#FAF9F6` (Marfil editorial técnico cálido).
- **Acento Primario PEBAI:** `#4F46E5` (Índigo / Cobalto de ingeniería).
- **Acento Secundario (Conversión):** `#B7FF3C` (Tech Lime para badges de aprobación y botones CTA).
- **Acento de Degradado Display:** `#06B6D4` (Cian eléctrico) degradado hacia `#4F46E5` (Índigo).
- **Tipografía Híbrida:**
  - Contraste Humano / Clásico: *Instrument Serif* (cursiva itálica para términos de choque o conceptos clave).
  - Estructura y Claridad: *Plus Jakarta Sans* (Weight 600, 700, 800) para titulares, párrafos y tarjetas.
  - Subtítulos y Anotaciones Guía: *Caveat* (Weight 600) para textos manuscritos que acompañan flechas y llamadas al margen.
  - Código, Terminales y Métricas: *JetBrains Mono* (Weight 500, 700).
- **Logotipo:** `assets/pebai/pebai-horizontal-color-ink-1160.png` obligatorio sobre fondos claros.

---

## 2. Anatomía de Composición por Diapositiva (Inspirada en el Formato Daniel Brown + Steph)

1. **Portadas de Alto Impacto (Slide 1):**
   - Frase superior en Serif clásico + Titular display masivo en gradiente cian a índigo.
   - Doble línea horizontal ultrafina de separación.
   - Subtítulo en caligrafía cursiva manuscrita (*con el último paso, funcionará todo tu día →*).
   - Bloque lateral de stack técnico (tarjetas blancas redondeadas con iconos 3D y subtítulo de función).
   - Centro visual: Iconografía o ilustración 3D de alta definición (esferas de redes neuronales, arquitectura de nodos o maquetas de sistemas).
   - Mini terminal flotante en esquina inferior con prompt de sistema activo.

2. **Diapositivas Interiores (Slides 2 a 4):**
   - Notas de papel kraft adhesivas en las esquinas sujetas con cinta washi tape semitransparente (*LA VENTAJA*, *UN SOLO SISTEMA. ASÍ ES.*).
   - Elementos gráficos vectoriales dibujados a mano: bombillas de revelación, flechas curvas conectando el texto con la UI, óvalos trazados alrededor de términos críticos.
   - Ventanas de consola oscura estilo macOS (`#0F172A`) con logs de Pytest, telemetría real y flujos ejecutables.
   - Tablas de matriz de datos con líneas punteadas limpias.

3. **Diapositiva de Cierre (Slide 5):**
   - **Carrusel Viral:** Debate técnico de dos alternativas (`A vs B`) con óvalos y llamada a guardar.
   - **Carrusel Mixto / B2B:** Tarjeta de entregable (Blueprint PDF de 14 páginas o Auditoría 1 a 1 de 45 min) con botón de alta visibilidad `COMENTA CONSULTORÍA` (palabra oficial en Tech Lime `#B7FF3C`).

---

## 3. Pipeline de Renderizado Técnico

- **Playwright High-Density Retina (1080x1440 PNG):**
  - Motor de renderizado Chromium/Edge con `device_scale_factor: 2` (resolución efectiva de 2160x2880 reescalada sin artefactos).
  - Fuentes de Google cargadas de forma síncrona.
- **Entrega Local:**
  - Cada carrusel se compila en `carousel-engine/output/[ID]/` con `slide_1.png` a `slide_5.png`, `caption.txt` e `index.html`.
