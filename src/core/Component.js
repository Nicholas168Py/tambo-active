import { revelarElemento, revelarGrupo } from '../shared/utils/animations.js';
import { cargarImagen } from '../shared/utils/helpers.js';
import { LAZY_MARGEN } from '../shared/constants/index.js';

/**
 * Component: clase base de todos los componentes de la aplicación.
 *
 * Ciclo de vida:
 *   init()            -> punto de entrada (render -> bindEvents -> initAnimations)
 *   render()          -> inyecta su plantilla HTML en el montaje
 *   bindEvents()      -> registra sus listeners
 *   initAnimations()  -> inicializa sus animaciones GSAP
 *   destroy()         -> limpia listeners, observadores, tweens y se desmonta
 *
 * Cada componente implementa únicamente lo que necesita.
 */
export class Component {
  /**
   * @param {string} template  - HTML de la plantilla (importado con `?raw`).
   * @param {{ mount?: string|Element }} options - Selector o elemento donde montarse.
   */
  constructor(template = '', options = {}) {
    this.template = template;
    this.mount = options.mount ?? null;
    this.root = null;
    this._disposers = [];
    this._observers = [];
    this._tweens = [];
  }

  /**
   * Define el contenedor de montaje (fluido).
   * @param {string|Element} container
   * @returns {Component}
   */
  mountTo(container) {
    this.mount = container;
    return this;
  }

  /**
   * Arranca el ciclo de vida del componente.
   * @returns {Component}
   */
  init() {
    this.render();
    this.bindEvents();
    this.initAnimations();
    return this;
  }

  /**
   * Inyecta la plantilla en el montaje dentro de un contenedor raíz.
   * El wrapper no aplica estilos, solo aísla el ámbito del componente.
   */
  render() {
    if (!this.template) return;
    const contenedor =
      typeof this.mount === 'string' ? document.querySelector(this.mount) : this.mount;
    if (!contenedor) {
      throw new Error(`[Component] Montaje no encontrado: ${this.mount}`);
    }
    this.root = document.createElement('div');
    this.root.innerHTML = this.template;
    contenedor.appendChild(this.root);
  }

  /** Hook: registrar eventos del componente. */
  bindEvents() {}

  /** Hook: inicializar animaciones propias del componente. */
  initAnimations() {}

  /**
   * Consulta un elemento dentro del ámbito del componente.
   * @param {string} selector
   */
  query(selector) {
    return this.root?.querySelector(selector) ?? null;
  }

  /**
   * Consulta varios elementos dentro del ámbito del componente.
   * @param {string} selector
   * @returns {Element[]}
   */
  queryAll(selector) {
    return this.root ? [...this.root.querySelectorAll(selector)] : [];
  }

  /**
   * Registra un listener rastreable: se elimina en destroy().
   * @param {string|Element} target
   * @param {string} evento
   * @param {Function} manejador
   * @param {*} opciones
   * @returns {Function} Función para desregistrar el listener.
   */
  on(target, evento, manejador, opciones) {
    const el = typeof target === 'string' ? this.query(target) : target;
    if (!el) return () => {};
    el.addEventListener(evento, manejador, opciones);
    const dispose = () => el.removeEventListener(evento, manejador, opciones);
    this._disposers.push(dispose);
    return dispose;
  }

  /**
   * Reveal de un elemento dentro del componente (rastreado).
   * @param {Element} el
   * @param {object} opciones
   */
  revelarElemento(el, opciones) {
    const tween = revelarElemento(el, opciones);
    if (tween) this._tweens.push(tween);
    return tween;
  }

  /**
   * Reveal escalonado de un grupo dentro del componente (rastreado).
   * @param {Element} contenedor
   * @param {string} selector
   * @param {object} opciones
   */
  revelarGrupo(contenedor, selector, opciones) {
    const tween = revelarGrupo(contenedor, selector, opciones);
    if (tween) this._tweens.push(tween);
    return tween;
  }

  /**
   * Lazy loading con IntersectionObserver para las imágenes del
   * componente marcadas con `data-src`.
   * @param {string} selector
   * @param {string} margen
   */
  observarImagenes(selector = 'img[data-src]', margen = LAZY_MARGEN) {
    const imagenes = this.queryAll(selector);
    if (!imagenes.length) return;

    if (!('IntersectionObserver' in window)) {
      imagenes.forEach(cargarImagen);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            cargarImagen(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: margen }
    );

    imagenes.forEach((img) => observer.observe(img));
    this._observers.push(observer);
  }

  /**
   * Desmonta el componente y libera todos sus recursos.
   */
  destroy() {
    this._tweens.forEach((tween) => {
      try {
        tween.scrollTrigger?.kill();
      } catch {
        /* noop */
      }
      try {
        tween.kill();
      } catch {
        /* noop */
      }
    });
    this._tweens = [];

    this._disposers.forEach((dispose) => {
      try {
        dispose();
      } catch {
        /* noop */
      }
    });
    this._disposers = [];

    this._observers.forEach((observer) => observer.disconnect());
    this._observers = [];

    this.root?.remove();
    this.root = null;
  }
}
