import { Router } from './Router.js';
import { store } from './Store.js';
import { initSmoothScroll } from '../shared/utils/scroll.js';
import { renderIcons } from '../shared/utils/icons.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COLOR_INICIAL, LOGO_INICIAL } from '../data/site.js';
import { MainLayout } from '../layouts/MainLayout.js';
import { NotFound } from '../shared/components/NotFound/notfound.js';

/**
 * App: bootstrap de la aplicación.
 * Responsabilidades:
 *   - Servicios globales (scroll suave, iconos, ScrollTrigger).
 *   - Estado compartido inicial.
 *   - Registro de rutas y arranque del Router.
 */
export class App {
  /**
   * @param {object} opciones
   * @param {string} opciones.root - Selector del contenedor raíz.
   */
  constructor({ root = '#app' } = {}) {
    this.root = root;
  }

  init() {
    initSmoothScroll();

    // Estado compartido: selección por defecto del configurador.
    store.set('seleccion', { color: COLOR_INICIAL, logo: LOGO_INICIAL });

    this.router = new Router({
      container: this.root,
      routes: {
        '/': () => new MainLayout(),
        '/inicio': () => new MainLayout()
      },
      notFound: () => new NotFound(),
      onResolve: () => {
        renderIcons();
        ScrollTrigger.refresh();
      }
    });
    this.router.start();

    // Recalcula posiciones cuando los recursos (p. ej. imágenes perezosas)
    // cambian la altura del documento después de cargar.
    window.addEventListener('load', () => ScrollTrigger.refresh());

    return this;
  }
}
