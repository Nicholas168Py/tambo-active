/**
 * Router: enrutador por hash minimalista.
 *
 * Solo gestiona rutas con el prefijo `#/` (p. ej. `#/productos`).
 * Los anclajes clásicos (`#colores`, `#calidad`, ...) se ignoran y
 * conservan el comportamiento nativo de scroll de la página.
 *
 * Las rutas se registran por inyección de dependencias desde App.js,
 * lo que mantiene al Router genérico y reutilizable en otras páginas.
 */
export class Router {
  /**
   * @param {object} opciones
   * @param {string} opciones.container      - Selector del contenedor raíz.
   * @param {object} opciones.routes         - Mapa { ruta: () => Layout }.
   * @param {Function} opciones.notFound     - Factory del layout 404.
   * @param {Function} opciones.onResolve    - Callback tras resolver una ruta.
   */
  constructor({ container = '#app', routes = {}, notFound = null, onResolve = null } = {}) {
    this.container = container;
    this.routes = routes;
    this.notFound = notFound;
    this.onResolve = onResolve;
    this._current = null;
    this._currentPath = null;
    this._handleHashChange = () => this._resolve();
  }

  /**
   * Comienza a escuchar cambios de hash y resuelve la ruta inicial.
   * @returns {Router}
   */
  start() {
    window.addEventListener('hashchange', this._handleHashChange);
    this._resolve();
    return this;
  }

  /**
   * Detiene el router y desmonta el layout actual.
   */
  stop() {
    window.removeEventListener('hashchange', this._handleHashChange);
    this._current?.destroy?.();
    this._current = null;
  }

  /**
   * Navega a una ruta (acepta `/ruta` o `#/ruta`).
   * @param {string} ruta
   */
  navigate(ruta) {
    const destino = ruta.startsWith('#') ? ruta : `#${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
    if (window.location.hash === destino) return;
    window.location.hash = destino;
  }

  /**
   * Resuelve la ruta actual: desmonta el layout anterior y monta el nuevo.
   */
  _resolve() {
    const hash = window.location.hash;

    // Anclas de página (p. ej. #colores): las maneja el navegador.
    if (hash && !hash.startsWith('#/')) return;

    const ruta = hash.replace(/^#/, '') || '/';

    // Evita re-montar si ya estamos en la misma ruta.
    if (ruta === this._currentPath && this._current) return;

    const factory = this.routes[ruta] ?? this.notFound;
    if (!factory) return;

    this._current?.destroy?.();
    this._currentPath = ruta;
    this._current = factory();
    this._current.init?.();
    this.onResolve?.();
  }
}
