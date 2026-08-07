# Optimización de rendimiento, corrección del logo 3D y ajustes de contenido — Tambo Active

Fecha: 2026-08-07
Stack: Vite 8 + Three.js 0.185 + GSAP + Lenis + Lucide (JS vanilla, sin React)

## Descripción general

Este documento agrupa las modificaciones realizadas en la sesión de trabajo sobre la landing **Tambo Active**. Incluye:

1. **Optimización de rendimiento**: la causa principal de lentitud era la carga síncrona de three.js (626 kB) y del modelo `camisa.glb` (20,7 MB) en el bundle inicial.
2. **Corrección de un bug visual**: el logo de "Elige tu combinación" no se veía sobre la camiseta en el visor 3D.
3. **Ajustes de contenido e imágenes** solicitados por el cliente.

**Restricción respetada**: no se cambió el diseño, la UX, las animaciones ni la lógica de negocio; tampoco se optimizó el peso de imágenes o del `.glb` (solo su forma de carga).

---

## Resumen del problema de rendimiento

**Antes**: el navegador descargaba three.js (626 kB) y encolaba el GLB (20,7 MB) **antes de pintar nada**.
**Después**: el bundle inicial es ~190 kB (15.5 kB gzip solo de `index.js`) y el visor 3D empieza a cargarse solo cuando la sección "Colores" está a ≤600 px del viewport.

## Impacto medido (build)

| Chunk | Antes | Después | Cómo se carga |
|---|---|---|---|
| `index.js` (app) | 63.05 kB | **49.99 kB** | Bundle inicial |
| `three-*.js` | 626.19 kB | 626.19 kB | **Diferido (solo al acercarse al configurador)** |
| `camisa.glb` | 21,697 kB | 21,697 kB | **Diferido (mismo chunk que three.js)** |
| `Configurator3D-*.js` | — | 13.53 kB | **Diferido** |
| `vendor-*.js` (gsap) | 112.93 kB | 112.93 kB | Bundle inicial (necesario para animaciones) |
| `lenis-*.js` | 20.45 kB | 20.45 kB | Bundle inicial |
| `icons-*.js` (lucide) | 3.72 kB | 3.72 kB | Bundle inicial |
| `index.css` | ~31.4 kB | 30.63 kB | CSS |

---

## Cambios por área

### 1. Lazy-load del visor 3D (causa #1 de lentitud)

- **`src/features/Configurator/configurator.js`**
  - Eliminado el import estático `Configurator3D`.
  - Nuevo método `_iniciarCarga3D(contenedor3D)`: carga el visor con `import()` dinámico solo cuando la sección "Colores" se acerca al viewport, usando `IntersectionObserver` con `rootMargin: '600px 0px'`. Fallback a carga directa sin `IntersectionObserver`.
  - Se guarda la selección inicial (`this._seleccion`) antes del lazy-load para aplicarla al montar.
  - `destroy()` actualizado: desconecta el observador, marca `_destruido` y libera `_tres?.dispose()`.
  - Inicializados `_observador3D`, `_destruido` y `_seleccion` en el constructor.
- **Resultado**: three.js (626 kB) + el GLB (20,7 MB) ya no bloquean el primer paint; se descargan como chunks separados cuando el usuario se acerca al configurador.

### 2. Bug corregido: logo no visible en la camiseta 3D

- **`src/three/Configurator3D.js`**
  - **Causa**: el anclaje del logo en el pecho (`_obtenerFrenteReducido()`, raycast + AABB) se calculaba de forma **asíncrona** cuando terminaba de cargar la textura PNG. Para entonces la animación de intro ya había escalado (0.86) y rotado (-0.15 rad) el modelo, corrompiendo el raycast y el AABB → el `DecalGeometry` quedaba descolocado o dentro de la tela (invisible).
  - **Fix**: `_obtenerFrenteReducido()` ahora se precarga de forma **síncrona** en `montar()`, justo después de `centrarModelo()` y antes de que la intro modifique escala/rotación. Verificado con Node: decal con 4203 vértices centrado en el pecho (x≈0.19–0.35, z≈0.15–0.30).

### 3. Fuentes no bloqueantes

- **`index.html`**
  - Inter y Material Symbols se cargan ahora con `media="print" onload="this.media='all'"` + `preload` + `<noscript>` fallback, evitando que el render se bloquee esperando las fuentes.

### 4. Imágenes

- Hero (`/hero/camisa-hero.png`): se mantiene eager (es el LCP) y con `<link rel="preload" as="image" fetchpriority="high">` en `index.html`.
- Gallery y CTA: ya usaban `data-src` + `observarImagenes()` (IntersectionObserver en `src/core/Component.js`); verificado, sin cambios.
- Logos del configurador y avatares de testimonios: `loading="lazy" decoding="async"` (ya existía).

### 5. Eliminación de archivos muertos

- **`src/data/productos.js`** (eliminado)
- **`src/data/products.js`** (eliminado, duplicado sin importadores)
- **`src/shared/utils/assetUrl.js`** (eliminado, sin consumidores)
- **`src/core/EventBus.js`** (eliminado; el Store ya no emite eventos y nadie se suscribe)
- **`image.png`** (eliminado, captura de referencia en la raíz sin uso)

### 6. Eliminación de código muerto

- **`src/core/Store.js`**: eliminados `subscribe()`, `clear()` y la dependencia de `EventBus`; simplificado a un objeto plano con `get`/`set` (la API pública `store` se conserva).
- **`src/data/site.js`**: eliminados `IMAGEN_FALLBACK` y su import `assetUrl`.
- **`src/shared/utils/dom.js`**: eliminado `$` (queda solo `$$`).
- **`src/shared/utils/helpers.js`**: eliminado `debounce`.
- **CSS**:
  - `src/shared/styles/variables.css`: eliminadas variables sin uso (`--color-brand-black/dark/darkgray/gray/white/green-light/ease-smooth`).
  - `src/shared/styles/base.css`: eliminados `.bg-hero-gradient` y `.shadow-soft`.
  - `src/features/Configurator/configurator.css`: eliminados `.config-imagen` y `.config-logo-ta` (y su regla en media query).

### 7. Code-splitting (vite.config.js)

- `manualChunks`: gsap → `vendor`, lenis → `lenis`, lucide → `icons`, three → `three`.
- `chunkSizeWarningLimit: 700` para silenciar la advertencia del chunk de three (intencionalmente grande, ahora diferido).

### 8. Ajustes de contenido (solicitud del cliente)

- **`src/features/CTA/cta.html`**:
  - Imagen local nueva en `public/cta/entrenando-c.png` (reemplaza la URL externa de Google; `data-src` → `src` con lazy loading). Ruta corregida a `/cta/entrenando-c.png` (absoluta desde la raíz).
  - Textos del CTA: "¿LISTO PARA REALIZAR TU PEDIDO? / HAZLO AQUÍ" y ajuste del subtítulo.
- **`index.html`** (JSON-LD): "logo bordado" → "logo estampado".
- **`src/features/Comparison/comparison.html`**: "Logo bordado" → "Logo estampado".
- **`src/features/Gallery/gallery.html`**: "Logo bordado" → "Logo estampado".
- **`src/features/Navbar/navbar.html`**: solo formato (sin cambios funcionales).

### 9. Assets nuevos

- **`public/cta/entrenando-c.png`** (nuevo)
- **`public/cta/entrenando.png`** (nuevo, sin uso directo todavía)

---

## Causas de lentitud encontradas

1. **Three.js + GLB en el bundle inicial** (principal): 626 kB JS + 20,7 MB GLB antes del paint.
2. **Carga bloqueante de fuentes** de Google Fonts.
3. **Código y archivos muertos** que inflaban el bundle y el árbol de módulos.

---

## Verificación

- `npm run build` pasa sin errores ni advertencias.
- El build emite `three-*.js` y `Configurator3D-*.js` como chunks separados, no referenciados desde `index.html` (se resuelven con `import()` dinámico en runtime).
- El anclaje del logo 3D fue validado mediante script de Node sobre el `.glb`.

---

## Notas / pendientes (fuera de alcance)

- El `.glb` (20,7 MB) sigue siendo el mayor asset; se recomienda comprimir con Draco/glTF-Transform o un modelo más ligero en una iteración futura (no se tocó por alcance).
- Optimizar las imágenes `/detalle/*.png` y logos a WebP/AVIF con dimensiones correctas en una iteración futura.
- El servidor debería servir el `.glb` con `Content-Encoding: br/gzip`.
- Caché agresiva para `dist/assets/*` (hash en nombre, ideal para caché inmutable).
