# Guía de Ingeniería de Animación e Interacción: Estándar Emil Kowalski

Basado en la metodología de **Emil Kowalski** (referenciada en los análisis virales de Migue Baena y Víctor Crespo), este documento recoge las reglas matemáticas y de código para que las animaciones web de PEBAI Systems se sientan **físicas, fluidas, instantáneas y con peso real**, desterrando el movimiento artificial, robótico o pesado generado por IA.

---

## 1. Los Principios de Oro de la Física de Interfaz

### Regla 1: Animar Únicamente Propiedades Aceleradas por GPU
* **Permitidas (60/120 FPS sin layout shift):** `transform` (`translate3d`, `scale`, `rotate`) y `opacity`.
* **Terminantemente Prohibidas:** `height`, `width`, `top`, `left`, `bottom`, `right`, `margin`, `padding`. Animar estas propiedades fuerza el recálculo continuo de la geometría del DOM (*Layout Thrashing*), produciendo tirones y saltos de página.
* **Técnica para acordeones o drawers:** Usar `grid-template-rows: 0fr` a `1fr` con `overflow: hidden`, o animar con transformaciones de escala en el eje Y (`scaleY`) manteniendo el contenedor base.

### Regla 2: La Curva de Aceleración Orgánica (Cubic Bezier Universal)
Las animaciones por defecto de CSS (`ease`, `linear`, `ease-in`) se sienten antinaturales porque aceleran y frenan sin inercia física.
En PEBAI Systems se estandarizan las siguientes curvas de resorte amortiguado:

```css
:root {
  /* Curva Maestra de Entrada Rápida y Freno Suave (Vercel / Apple Style) */
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  
  /* Curva Cinética para Modales y Paneles Deslizantes */
  --ease-kinetic: cubic-bezier(0.22, 1, 0.36, 1);
  
  /* Curva de Retorno Rápido para Salidas */
  --ease-out-snap: cubic-bezier(0.7, 0, 0.84, 0);
}
```

### Regla 3: Tiempos de Respuesta Perceptual (Duraciones)
* **Micro-interacciones (hover, focus, toggles, clicks):** `140ms - 220ms`. Si dura más de 250ms, el usuario percibe retraso (*input lag*).
* **Transiciones de vista y cambios de tab:** `240ms - 320ms`.
* **Modales, Drawers y Diálogos:** `320ms - 420ms`.

---

## 2. Snippets de Código Estandarizados (Copy-Paste Ready)

### A. Botón Táctil con Respuesta Física Instantánea
```css
.btn-tactile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  will-change: transform;
  transition: transform 0.16s var(--ease-spring),
              background-color 0.16s ease,
              border-color 0.16s ease,
              box-shadow 0.16s ease;
}

.btn-tactile:hover {
  transform: translateY(-1.5px);
}

.btn-tactile:active {
  transform: scale(0.965) translateY(0);
  transition-duration: 0.08s; /* La compresión física al pulsar debe ser dos veces más rápida */
}
```

### B. Tarjeta Interactiva con Iluminación Reflectante
```css
.interactive-card {
  position: relative;
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  overflow: hidden;
  will-change: transform, border-color;
  transition: transform 0.22s var(--ease-spring),
              border-color 0.22s ease,
              box-shadow 0.22s ease;
}

.interactive-card:hover {
  transform: translateY(-3px);
  border-color: rgba(183, 255, 60, 0.35);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45),
              0 0 20px rgba(183, 255, 60, 0.06);
}

.interactive-card:active {
  transform: scale(0.985);
  transition-duration: 0.1s;
}
```

### C. Entradas Escalonadas Suaves (Staggered Animation)
Permite que una lista de tarjetas o elementos entre en cascada sin saturar al usuario:

```css
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-item {
  opacity: 0;
  animation: slideUpFade 0.45s var(--ease-spring) forwards;
  animation-delay: calc(var(--stagger-index, 0) * 60ms);
}
```

### D. Badge con Pulso Radárico Vivo (Aura Fluida)
```css
.dot-pulse {
  position: relative;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--lime, #B7FF3C);
}

.dot-pulse::after {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1.5px solid var(--lime, #B7FF3C);
  opacity: 0.8;
  animation: radarWave 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
}

@keyframes radarWave {
  0% {
    transform: scale(0.8);
    opacity: 0.9;
  }
  70% {
    transform: scale(2.4);
    opacity: 0;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}
```

### E. Transiciones de Pantalla Nativas (`@view-transition`)
Para navegaciones entre vistas de formulario o tabs sin parpadeo blanco:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.24s;
  animation-timing-function: var(--ease-spring);
}
```

---

## 3. Checklist de Auditoría de Movimiento (Emil Kowalski Audit)

Antes de considerar terminada una página o componente en PEBAI Systems:
* [ ] ¿Se anima alguna propiedad no acelerada por GPU (`height`, `margin`, `top`)? **Eliminarla y sustituir por `transform`.**
* [ ] ¿El feedback al hacer clic (`:active`) comprime el elemento (`scale(0.96-0.98)`) en menos de 100ms?
* [ ] ¿Los hovers tienen una curva suave (`cubic-bezier(0.16, 1, 0.3, 1)`) en lugar de `linear` o `ease`?
* [ ] ¿Las animaciones respetan las preferencias del sistema con `@media (prefers-reduced-motion: reduce)`?
