import { Component } from '../../core/Component.js';
import { COLORES } from '../../data/colores.js';
import { COLOR_INICIAL, LOGO_INICIAL } from '../../data/site.js';
import { store } from '../../core/Store.js';
import { sectionHeading } from '../../shared/components/SectionHeading.js';
import { renderIcons } from '../../shared/utils/icons.js';
import template from './configurator.html?raw';
import './configurator.css';

/**
 * Configurator: Visualizador y catálogo 3D interactivo para explorar prendas y colores.
 * La compra transaccional está centralizada exclusivamente en los combos y su modal.
 */
export class Configurator extends Component {
  constructor() {
    super(template, { mount: '#app' });
    const inicial = store.get('seleccion') ?? { color: COLOR_INICIAL, logo: LOGO_INICIAL };
    this.colorSeleccionado = inicial.color || 'negro';
    this.tipoPrenda = 'CAMISETA';

    this._tres = null;
    this._observador3D = null;
    this._destruido = false;
    this._seleccion = { color: this.colorSeleccionado, logo: 'tambo' };
  }

  render() {
    super.render();

    const heading = this.query('[data-section-heading]');
    if (heading) {
      heading.innerHTML = sectionHeading({
        title: 'Catálogo Interactivo',
        subtitle: 'Interactúa con nuestras prendas en 360°, explora la paleta de colores y comprueba cada detalle.',
        wrapperClass: 'mb-8 lg:mb-12 text-center',
        h2Class: 'mb-2 text-black dark:text-white font-black tracking-tight text-3xl sm:text-4xl lg:text-5xl uppercase'
      });
    }

    this._renderizarColores();
    renderIcons(this.root);
  }

  _renderizarColores() {
    const contenedor = this.query('[data-catalog-colors]');
    if (!contenedor) return;

    contenedor.innerHTML = COLORES.map((c) => {
      const isSelected = c.id === this.colorSeleccionado;
      return `
        <button type="button" data-color-id="${c.id}" data-color-hex="${c.hex}" data-color-label="${c.label}"
          class="aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all p-1 min-w-0 ${
            isSelected
              ? 'border-black dark:border-white ring-2 ring-black dark:ring-white scale-105 bg-black/5 dark:bg-white/10'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white bg-transparent'
          }" title="${c.label}">
          <span class="w-6 h-6 rounded-full border border-black/20 dark:border-white/30 shadow-xs flex items-center justify-center flex-shrink-0" style="background-color: ${c.hex}">
            ${isSelected ? '<span class="w-1.5 h-1.5 rounded-full bg-white dark:bg-black"></span>' : ''}
          </span>
          <span class="text-[10px] font-bold text-black dark:text-white mt-1 truncate max-w-full leading-none">${c.label}</span>
        </button>
      `;
    }).join('');

    const colorActivoLabel = this.query('[data-color-active-name]');
    const activeColorObj = COLORES.find((c) => c.id === this.colorSeleccionado);
    if (colorActivoLabel && activeColorObj) {
      colorActivoLabel.textContent = activeColorObj.label;
    }

    const caption = this.query('[data-config-caption]');
    if (caption && activeColorObj) {
      caption.textContent = activeColorObj.label;
    }
  }

  bindEvents() {
    const contenedor3D = this.query('[data-config-3d]');
    const caption = this.query('[data-config-caption]');
    const colorActivoLabel = this.query('[data-color-active-name]');

    // Selector de Tipo de Prenda (Camiseta / Manga Siza)
    const btnsPrenda = this.queryAll('[data-product-type-btn]');
    btnsPrenda.forEach((btn) => {
      this.on(btn, 'click', () => {
        const tipoKey = btn.getAttribute('data-product-type-btn');
        this.tipoPrenda = tipoKey;

        // Actualizar estados visuales de los botones
        btnsPrenda.forEach((b) => {
          const isActive = b.getAttribute('data-product-type-btn') === tipoKey;
          if (isActive) {
            b.className =
              'py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 bg-black text-white dark:bg-white dark:text-black shadow-sm';
          } else {
            b.className =
              'py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700';
          }
        });

        // Cambiar modelo 3D
        this._tres?.cambiarModelo(tipoKey);
      });
    });

    // Delegación de eventos para la paleta de colores
    const contenedorColores = this.query('[data-catalog-colors]');
    if (contenedorColores) {
      this.on(contenedorColores, 'click', (e) => {
        const btn = e.target.closest('[data-color-id]');
        if (!btn) return;

        const colorId = btn.getAttribute('data-color-id');
        const colorHex = btn.getAttribute('data-color-hex');
        const colorLabel = btn.getAttribute('data-color-label');

        this.colorSeleccionado = colorId;
        this._seleccion = { color: colorId, logo: 'tambo' };
        store.set('seleccion', this._seleccion);

        if (caption) caption.textContent = colorLabel;
        if (colorActivoLabel) colorActivoLabel.textContent = colorLabel;

        // Aplicar al visor 3D
        this._tres?.aplicarSeleccion({ color: colorHex, logo: 'tambo' });

        // Actualizar visual de swatches
        this._renderizarColores();
      });
    }

    if (contenedor3D) {
      this._iniciarCarga3D(contenedor3D);
    }
  }

  /**
   * Carga el visor 3D de forma diferida.
   * @param {HTMLElement} contenedor3D
   */
  _iniciarCarga3D(contenedor3D) {
    const cargar = () => {
      import('../../three/Configurator3D.js').then(({ Configurator3D }) => {
        if (this._destruido) return;
        this._tres = new Configurator3D(contenedor3D);
        const activeColorObj = COLORES.find((c) => c.id === this.colorSeleccionado);
        this._tres.aplicarSeleccion({
          color: activeColorObj ? activeColorObj.hex : '#111111',
          logo: 'tambo'
        });
        this._tres.montar();
      });
    };

    this._precargar3D();

    if (!('IntersectionObserver' in window)) {
      cargar();
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          observador.disconnect();
          this._observador3D = null;
          cargar();
        }
      },
      { rootMargin: '600px 0px' }
    );
    this._observador3D = observador;
    observador.observe(contenedor3D);
  }

  _precargar3D() {
    const enIdle = (cb) => {
      if ('requestIdleCallback' in window) requestIdleCallback(cb, { timeout: 3000 });
      else setTimeout(cb, 100);
    };
    const arrancar = () => {
      enIdle(() => {
        if (this._destruido) return;
        import('../../three/Configurator3D.js')
          .then(({ rutaModelo }) => fetch(rutaModelo).catch(() => {}))
          .catch(() => {});
      });
    };
    if (document.readyState === 'complete') arrancar();
    else window.addEventListener('load', arrancar, { once: true });
  }

  destroy() {
    this._observador3D?.disconnect();
    this._observador3D = null;
    this._destruido = true;
    this._tres?.dispose();
    this._tres = null;
    super.destroy();
  }

  initAnimations() {
    this.queryAll('[data-reveal]').forEach((el) => this.revelarElemento(el));
  }
}
