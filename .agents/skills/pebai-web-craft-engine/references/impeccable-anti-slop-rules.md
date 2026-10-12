# El Canon Impeccable: Reglas Anti-AI-Slop y Dirección de Arte

Basado en el framework **Impeccable** de Paul Bakaus (referenciado por Migue Baena y Víctor Crespo), este manual establece los estándares de calidad visual e ingeniería de diseño que erradican completamente el aspecto genérico de "web creada por IA" (*AI Slop*).

---

## 1. El Vocabulario de Dirección de Arte (Steering Commands)

Cuando se diseña o revisa una interfaz, no se usan órdenes ambiguas como "hazla más bonita". Se emplean comandos de dirección precisos:

| Comando | Acción Exacta de Ingeniería Visual |
| :--- | :--- |
| **`craft`** | Construir la interfaz desde cero aplicando la escala matemática de tipografía, contraste de capas y ritmo espacial de 8px. |
| **`critique`** | Realizar una auditoría forense de fallos: detectar textos sin jerarquía, botones flotantes sin peso, bordes con contraste excesivo o desbordamientos en móvil. |
| **`polish`** | Ajustar micro-detalles: reducir radios de borde inconsistentes, afinar sombras (`box-shadow`), ajustar alturas de línea (`line-height: 1.2` en títulos, `1.5` en párrafos) y añadir feedback `:active`. |
| **`distill`** | Eliminar ruido decorativo superfluo: borrar degradados innecesarios, retirar tarjetas que no aportan estructura y dejar que el espacio negativo y la tipografía respiren. |
| **`bolder`** | Aumentar la tensión visual: elevar el tamaño o peso de titulares, usar acentos cromáticos de alto contraste (`#B7FF3C` o `#6A5CFF`), y marcar bordes activos con claridad. |
| **`quieter`** | Reducir estridencia: atenuar fondos secundarios, bajar opacidad de bordes (`rgba(255,255,255,0.06)`), y suavizar sombras para una estética técnica sobria y refinada. |

---

## 2. Las 40+ Reglas Anti-Slop (Leyes de Composición)

### A. Tipografía y Jerarquía
1. **Nunca usar fuentes genéricas sin calibrar:** Prohibido usar fuentes de sistema por defecto sin declarar pesos variables específicos. En PEBAI se utiliza `Manrope` (pesos 300, 500, 700, 800) combinada con acentos monoespaciados (`JetBrains Mono`, `SF Mono` o `monospace`) para métricas, telemetría y códigos de estado.
2. **Escala Modular Armónica:** Cada tamaño de fuente debe pertenecer a una escala definida:
   * Display Hero: `clamp(36px, 6vw, 68px)` con `letter-spacing: -0.03em; line-height: 1.05;`
   * H2 Sección: `clamp(26px, 3.8vw, 40px)` con `letter-spacing: -0.02em; line-height: 1.15;`
   * H3 Tarjeta: `clamp(18px, 2.2vw, 22px)` con `letter-spacing: -0.01em; line-height: 1.25;`
   * Párrafo Principal: `15px - 16.5px` con `line-height: 1.5; color: var(--fg-muted);`
   * Píldora / Telemetría: `10px - 12px` con `font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;`
3. **Control estricto de longitud de línea (Measure):** Los párrafos nunca deben superar los 65-75 caracteres por línea (`max-width: 60ch`). Textos más anchos fatigan la lectura y delatan falta de diseño.
4. **Números Tabulares en Métricas:** Siempre usar `font-variant-numeric: tabular-nums;` en números, contadores, porcentajes y precios para evitar saltos de ancho durante animaciones o comparativas.

### B. Color, Fondos y Luminiscencia
5. **Prohibido el negro puro (`#000000`):** El negro puro absorbe la luz y destruye la profundidad en pantallas OLED/IPS. Usar negros cromáticos con tinte azulado o grafito profundo:
   * Fondo base (Dark Mode): `#090A10`
   * Superficie de tarjeta / panel: `rgba(18, 20, 32, 0.95)` o `#121420`
   * Superficie activa / hover: `rgba(28, 36, 60, 0.98)` o `#1A1D2E`
6. **Bordes luminiscentes, nunca opacos ni gruesos:** En interfaces oscuras, los bordes deben simular refracción de luz, no muros de corte. Usar `1px solid rgba(255, 255, 255, 0.08)` o degradados sutiles con máscara.
7. **Prohibido el degradado púrpura cliché de IA:** Descartar el gradiente violeta-fucsia-rosa genérico de ChatGPT. En PEBAI, el contraste se construye con:
   * **Lima Eléctrico Técnico:** `#B7FF3C` (con resplandor suave `rgba(183, 255, 60, 0.25)`).
   * **Azul Cobalto Profundo:** `#6A5CFF` y `#7E73FF` (con halo `rgba(106, 92, 255, 0.20)`).
8. **Doble Tema Nativo con Contraste WCAG AAA:** Cada componente debe soportar sin errores tanto `data-theme="dark"` como `data-theme="light"`. En modo claro, los fondos deben ser marfil técnico cálido (`#FAF9F7` o `#EFEDE7`), nunca blanco hospitalario estridente (`#FFFFFF` en toda la pantalla).

### C. Espaciado, Retícula y Densidad
9. **Cuadrícula base de 8px (Spatial Rhythm):** Todos los `padding`, `margin` y `gap` deben ser múltiplos de 4 u 8: `4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px`.
10. **Alineación óptica sobre geométrica:** Los iconos dentro de botones o píldoras deben alinearse ópticamente con el texto central (`display: inline-flex; align-items: center; justify-content: center;`).
11. **Consistencia de Radios de Borde (Nested Radii Rule):** El radio de un elemento contenedor debe ser mayor que el de sus hijos internos:
   $$\text{Radius}_{\text{interior}} = \max(0, \text{Radius}_{\text{exterior}} - \text{Padding})$$
   *Ejemplo:* Contenedor con `border-radius: 16px` y `padding: 8px` $\rightarrow$ tarjetas hijas con `border-radius: 8px`.

### D. Componentes y Ergonomía
12. **Target táctil mínimo en móvil:** Cualquier botón, enlace, selector o casilla interactiva debe tener un área táctil mínima de **$44 \times 44\text{px}$** en pantallas móviles (`touch-action: manipulation;`).
13. **Feedback físico en clic:** Los botones interactivos deben reaccionar al toque:
   ```css
   .btn {
     transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.16s ease, border-color 0.16s ease;
   }
   .btn:active {
     transform: scale(0.97);
   }
   ```
14. **Inputs de formulario estables:** Sin saltos de tamaño al hacer foco. El borde debe transicionar con `border-color` y `box-shadow` suave, jamás cambiando el `border-width`.
15. **Badges con píldora viva:** Los indicadores de estado deben combinar una etiqueta legible con un punto pulsante (`.dot-pulse`) con animación `box-shadow` infinita.

---

## 3. Matriz Antes / Después (De AI Slop a Impeccable Craft)

| Elemento | ❌ Lo que hace la IA por defecto (AI Slop) | ✅ Lo que exige el Canon Impeccable |
| :--- | :--- | :--- |
| **Hero Section** | Fondo `#000` con titular centrado gigante, degradado púrpura chillón y un botón flotante sin contexto. | Título en Manrope bold con tracking negativo, subtítulo legible a 60ch, badge de estado en píldora con halo sutil, y métrica auditable. |
| **Tarjetas de Servicio** | 3 tarjetas idénticas con iconos genéricos de FontAwesome metidos en círculos de colores. | Bento Grid asimétrico con jerarquía visual: tarjeta principal destacada con preview interactivo o telemetría, y tarjetas secundarias con datos tangibles. |
| **Botones CTA** | Botón gigante con degradado multicolor, borde grueso y sombra difusa excesiva. | Botón con sólido de alto contraste (`#B7FF3C` con tinta `#090A10` o `#6A5CFF`), micro-borde reflexivo de 1px, tipografía bold y respuesta física `scale(0.97)` en `:active`. |
| **Móvil / Responsive** | Elementos que desbordan lateralmente (scroll horizontal fantasma), textos diminutos o botones apelmazados. | Viewport fijo sin desbordamiento (`overflow-x: hidden`), espaciado táctil holgado de 44px, tipografía fluida con `clamp()`. |
