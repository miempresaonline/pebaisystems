---
name: pebai-web-craft-engine
description: >-
  Motor maestro de ingeniería de diseño web para crear, maquetar, rediseñar y auditar webs y landings en PEBAI Systems. Basado en el análisis exhaustivo de los dos vídeos virales de referencia (@miguebaenaia y @victorcrespovaillo): integra el canon Impeccable (Paul Bakaus / 40+ reglas anti-AI-slop), la ingeniería de interacción y física de animación de Emil Kowalski, la calibración estética y de brief de Taste Skill (Leonxlnx), el catálogo cinemático de GetLayers y la suite de auditoría visual multi-dispositivo en navegador real con Playwright y Figma MCP.
---

# PEBAI Web Craft Engine: El Sistema Definitivo de Diseño Web de Alta Gama

Este manual es la **habilidad operativa maestra** para diseñar, programar, evolucionar o auditar cualquier página web, landing page o componente interactivo en PEBAI Systems.

Su objetivo es erradicar al 100% el denominado **"AI Slop"** (diseños genéricos, deslavados, con degradados púrpuras cliché, tarjetas flotantes sin jerarquía o maquetaciones que se rompen en móvil) y transformar a la IA en un **Director de Arte e Ingeniero de Interacción Senior** que entrega software con acabado de agencia de diseño de élite (estándares Vercel, Linear, Apple y Stripe).

---

## 01. Análisis Forense de los 2 Vídeos de Referencia

La arquitectura de esta habilidad surge de la síntesis rigurosa de los dos vídeos de referencia analizados:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EL BUCLE CERRADO DE DISEÑO WEB ÉLITE                     │
│                                                                             │
│   [ 1. Brief & Taste ]  ──►  [ 2. Impeccable Craft ]  ──► [ 3. Emil Motion ] │
│   Calibración de Diales      40+ Reglas Anti-Slop         Física 60fps GPU  │
│   (Leonxlnx Taste Skill)     Escala tipográfica           Resortes orgánicos│
│            ▲                                                      │         │
│            │                 GetLayers Cinemático                 ▼         │
│            │          (3D, Ambient Glow, Bento Grids)                       │
│            │                                                                │
│   [ 5. Auto-Corrección ] ◄── [ 4. Playwright Audit ] ◄──── [ Render HTML ]  │
│   Refinamiento Impeccable    Móvil 390px / Tablet / Desktop                 │
│   Cero overflow / WCAG       Figma MCP Tokens                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Video 1: Migue Baena (`@miguebaenaia` — `reel1`)
* **Tesis Central:** No se trata de escribir un "prompt más largo", sino de otorgarle a la IA un setup con reglas estructurales, referencias visuales y herramientas de autoevaluación.
* **Los 3 Pilares Presentados:**
  1. **Skills de Impeccable y Emil Kowalski:** Otorgan reglas matemáticas de tipografía, espaciado rítmico de 8px y animaciones fluidas con resortes físicos para desterrar el diseño genérico.
  2. **Taste Skill:** Entrena el criterio estético del modelo para basarse en referencias de producto de clase mundial en lugar de inventar patrones mediocres.
  3. **Conexión Figma MCP + Playwright:** Permite extraer especificaciones de diseño con Figma MCP y levantar la web en un navegador real con Playwright para capturar y auto-inspeccionar el resultado.

### Video 2: Víctor Crespo Vaillo (`@victorcrespovaillo` — `reel2`)
* **Tesis Central:** Construir sitios web que parezcan creados por un estudio de diseño profesional en lugar de una IA mediante un flujo cerrado de diseño $\rightarrow$ código $\rightarrow$ comprobación $\rightarrow$ auto-corrección.
* **Metodología Paso a Paso:**
  * Uso de skills como *Impeccable*, *Emil Kowalski* y *Taste Skill* para tipografía, ritmo espacial y movimiento.
  * Ingesta de referencias de webs reales de alto standing.
  * Automatización del navegador con **Playwright**: abre la web en viewport móvil y escritorio, detecta si algo desborda o falla, y lo corrige de forma autónoma.

---

## 02. Pilar 1: El Canon Impeccable (Paul Bakaus)

Basado en el manual detallado en [impeccable-anti-slop-rules.md](./references/impeccable-anti-slop-rules.md).

### 1. Comandos de Dirección de Arte
Cuando el agente diseña o revisa código, ejecuta mentalmente estos 6 comandos:
* **`craft`**: Levantar la estructura con retícula de 8px, escala modular y tipografía Manrope.
* **`critique`**: Auditar contraste de capas, legibilidad a 60ch, balance óptico y desbordamientos.
* **`polish`**: Afinar radios anidados, micro-bordes reflexivos y feedback `:active`.
* **`distill`**: Podar adornos gratuitos, degradados innecesarios y tarjetas redundantes.
* **`bolder`**: Incrementar peso tipográfico, tensión visual y contraste de acentos lima `#B7FF3C`.
* **`quieter`**: Serenar fondos secundarios y reducir opacidad de bordes a `rgba(255,255,255,0.06)`.

### 2. Leyes de Composición Visual
* **Paleta Cromática PEBAI:**
  * Fondo primario: `#090A10` (negro cromático con profundidad, nunca negro plano `#000000`).
  * Superficies elevadas: `#121420` o `rgba(18, 20, 32, 0.95)`.
  * Bordes: `1px solid rgba(255, 255, 255, 0.08)`.
  * Acentos de alta tensión: Lima Eléctrico `#B7FF3C` y Azul Cobalto `#6A5CFF` / `#7E73FF`.
  * Fondo Modo Claro: Marfil técnico cálido `#FAF9F7` o `#EFEDE7` con texto `#12121A`.
* **Fórmula de Radios Anidados (Nested Radii):**
  $$\text{Radius}_{\text{interior}} = \max(0, \text{Radius}_{\text{exterior}} - \text{Padding})$$
* **Escala Tipográfica:**
  * Display: `clamp(36px, 5.5vw, 64px)` con `letter-spacing: -0.03em; line-height: 1.05;`
  * H2: `clamp(24px, 3.5vw, 38px)` con `letter-spacing: -0.02em; line-height: 1.15;`
  * Cuerpo: `15px - 16.5px` con `line-height: 1.5; max-width: 60ch;`
  * Números y métricas: siempre con `font-variant-numeric: tabular-nums;`.

---

## 03. Pilar 2: Ingeniería de Animación e Interacción (Emil Kowalski)

Basado en la guía técnica en [emil-kowalski-motion-guide.md](./references/emil-kowalski-motion-guide.md).

### 1. Física de Interfaz y Easing Curves
Quedan estrictamente prohibidas las animaciones `linear` o `ease` de CSS por defecto. Se emplean curvas de resorte con inercia física real:

```css
:root {
  /* Resorte orgánico universal (Vercel / Apple) */
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  /* Movimiento cinético para modales y paneles */
  --ease-kinetic: cubic-bezier(0.22, 1, 0.36, 1);
}
```

### 2. Regla Absoluta de Rendimiento (GPU-Only)
* **Permitido (120 FPS sin layout shift):** `transform` y `opacity`.
* **Prohibido animar:** `height`, `width`, `top`, `left`, `margin`, `padding`. Provocan recálculos del DOM y parpadeos perceptibles.

### 3. Tiempos de Respuesta y Feedback Físico
* **Micro-interacciones (click, hover, switches):** `140ms - 220ms`.
* **Compresión física táctil al pulsar (`:active`):**
  ```css
  .btn:active, .option-card:active {
    transform: scale(0.965);
    transition-duration: 0.08s;
  }
  ```
* **Entradas escalonadas (Stagger):** Aplicar retraso progresivo con `--stagger-index * 60ms`.

---

## 04. Pilar 3: Taste Skill & Calibración de Diales (Leonxlnx)

Basado en la metodología de [taste-skill-brief-calibration.md](./references/taste-skill-brief-calibration.md).

Antes de escribir código, se define el vector estético calibrando 3 diales:

1. **Dial 1: Varianza de Diseño:**
   * *Estándar PEBAI:* **Lujo Técnico / Engineering Elite.** Look & feel de software de ingeniería de alta precisión: fondos oscuros profundos, cuadrículas sutiles de fondo (`background-size: 36px 36px`), micro-bordes reflexivos y tipografía variable nítida.
2. **Dial 2: Intensidad de Movimiento:**
   * *Nivel 2 (Cinética Elegante):* Hover reactivo suave, pulsos radáricos infinitos en píldoras de estado (`.dot-pulse`), transiciones de vista `@view-transition` y feedback táctil inmediato.
3. **Dial 3: Densidad Visual:**
   * *Ejecutiva Equilibrada:* Márgenes holgados, bloques de texto acotados, retículas Bento Grid asimétricas y sin apelotonar elementos.

### Lista de Prohibiciones Estéticas Inmediatas
* ❌ Degradados violeta-fucsia de chatbot genérico.
* ❌ Bloques de texto centrados de más de 3 líneas.
* ❌ Tarjetas flotando sin bordes de contorno reflexivo.
* ❌ Áreas táctiles menores a $44\times 44\text{px}$ en móvil.
* ❌ Desbordamientos laterales (`overflow-x` con scroll horizontal fantasma).

---

## 05. Integración de GetLayers (Componentes Cinemáticos & 3D)

Basado en la especificación oficial de GetLayers ([`getlayers-mcp-integration.md`](./references/getlayers-mcp-integration.md)).

GetLayers (`textura-agency/getlayers-plugin`) es la biblioteca de diseño cinematográfico y servidor MCP para dotar a las webs de PEBAI Systems de escenas 3D interactivas, fondos cinemáticos y secciones de movimiento.

### Comandos de Instalación
* **Claude Code CLI:**
  ```bash
  /plugin marketplace add textura-agency/getlayers-plugin
  /plugin install getlayers@getlayers
  ```
* **Conector MCP (Antigravity / Cursor / Claude Desktop / Windsurf):**
  Configurado en `.agents/mcp_config.json`:
  ```json
  {
    "mcpServers": {
      "getlayers": {
        "url": "https://mcp.getlayers.ai/mcp"
      }
    }
  }
  ```

### El Protocolo No Negociable de GetLayers MCP:
1. **Llamar SIEMPRE a `getlayers_start` primero:** Devuelve las 5 capacidades activas, la guía, el vocabulario técnico y la información del entorno antes de tocar código.
2. **Seleccionar uno de los 5 Modos:**
   * *Modo 1:* Sitio web completo desde cero (con `getlayers_compositions` para estructurar cada sección).
   * *Modo 2:* Escena 3D a medida (`getlayers_scene_lab` sintetizando a partir de referencias).
   * *Modo 3:* Extraer un componente específico (`getlayers_search` / `getlayers_browse` $\rightarrow$ `getlayers_materialize`).
   * *Modo 4:* Fondos de vídeo cinemáticos (descargando vídeo 4K y póster 2K a `public/`).
   * *Modo 5:* Añadir 3D y movimiento a proyecto existente (leyendo primero el CSS/HTML de PEBAI).
3. **Uso obligatorio de Composiciones (`getlayers_compositions`):**
   * Toda sección se construye sobre esqueletos probados (`hero`, `features`, `bento`, `pricing`, `faq`, `loader`).
   * **PROHIBIDO** generar pilas verticales genéricas y centradas.
4. **Fijar un solo Estilo (`styleId`):** Se pasa a cada llamada de materialización para heredar colores y tipografías consistentes.
5. **Tintar vía CONFIG:** Las escenas 3D se ajustan mediante el mapa `tint` de su configuración, nunca editando el shader GLSL.
6. **Descarga local obligatoria:** Los vídeos y modelos 3D (`.mp4`, `.glb`) se descargan al proyecto para garantizar carga inmediata sin depender de servidores externos ni marcas de agua.
7. **Control de estado:** Mantener `getlayers.json` actualizado para preservar las decisiones de diseño.

---

## 06. Toolchain de Auditoría en Tiempo Real con Playwright

Para cerrar el ciclo descrito en los vídeos de Migue Baena y Víctor Crespo, la habilidad cuenta con un script de auditoría automatizada en navegadores reales:

### Script: `.agents/skills/pebai-web-craft-engine/scripts/playwright_audit.py`
Ejecución:
```bash
python ".agents/skills/pebai-web-craft-engine/scripts/playwright_audit.py" [URL_O_ARCHIVO]
```

### Qué Comprueba Automáticamente:
1. **Auditoría Multi-Dispositivo:**
   * **Móvil (iPhone 15):** Viewport `390x844`, escala DPR 3, emulación táctil.
   * **Tablet (iPad):** Viewport `768x1024`, escala DPR 2.
   * **Escritorio (Retina):** Viewport `1440x900`, escala DPR 2.
2. **Detección de Desbordamiento Horizontal:** Comprueba si `scrollWidth > clientWidth` para erradicar el scroll lateral no deseado.
3. **Ergonomía Táctil:** Identifica botones o enlaces con área inferior a $38-44\text{px}$.
4. **Captura de Errores JS:** Monitorea la consola del navegador para alertar de excepciones no controladas.
5. **Verificación Dual:** Genera capturas tanto en Modo Oscuro como en Modo Claro en `scratch/audit_screenshots/`.

---

## 07. Runbook Operativo: Cómo Trabajar en Cualquier Web de PEBAI

Cada vez que se cree o modifique una página en PEBAI Systems:

### Paso 1: Inferencia de Brief y Calibración
* Definir objetivo de conversión (BOFU Captación, TOFU Orgánico o Institucional).
* Seleccionar los 3 diales (Lujo Técnico, Cinética Elegante, Densidad Equilibrada).

### Paso 2: Maquetación con el Canon Impeccable
* Declarar variables de color (`--bg: #090a10`, `--surface: #121420`, `--lime: #B7FF3C`).
* Aplicar tipografía `Manrope` con tracking negativo en títulos (`-0.02em` a `-0.03em`).
* Aplicar fórmula de radios anidados y regla de 8px en paddings.

### Paso 3: Aplicación de Física Emil Kowalski
* Transiciones con `cubic-bezier(0.16, 1, 0.3, 1)`.
* Solo animar `transform` y `opacity`.
* Añadir compresión `:active { transform: scale(0.965); }` a botones y tarjetas interactivas.

### Paso 4: Ejecución de la Auditoría Playwright
* Ejecutar: `python ".agents/skills/pebai-web-craft-engine/scripts/playwright_audit.py"`
* Revisar las capturas generadas en `scratch/audit_screenshots/`.

### Paso 5: Auto-Corrección y Entrega
* Corregir cualquier desbordamiento o fallo detectado en las capturas antes de dar por terminado el trabajo.
