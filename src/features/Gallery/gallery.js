import { Component } from '../../core/Component.js';
import { sectionHeading } from '../../shared/components/SectionHeading.js';
import template from './gallery.html?raw';
import './gallery.css';

/**
 * Gallery (Cada detalle importa):
 * - Revelado escalonado de las tarjetas.
 * - Lazy loading de las imágenes con IntersectionObserver.
 * - Fallback a imagen remota si el asset local aún no existe.
 */
export class Gallery extends Component {
  constructor() {
    super(template, { mount: '#app' });
  }

  render() {
    super.render();
    const heading = this.query('[data-section-heading]');
    if (heading) {
      heading.innerHTML = sectionHeading({
        title: 'CADA DETALLE IMPORTA',
        wrapperClass: 'mb-16',
        h2Class: 'mb-4 text-brand-dark'
      });
    }
  }

  bindEvents() {
    this.queryAll('.detalle-img').forEach((img) => {
      this.on(img, 'error', () => {
        const fallback = img.dataset.fallback;
        if (fallback && img.dataset.fallbackUsado !== '1') {
          img.dataset.fallbackUsado = '1';
          img.src = fallback;
        }
      });
    });

    this.observarImagenes();
  }

  initAnimations() {
    const heading = this.query('#detalles [data-reveal]');
    if (heading) this.revelarElemento(heading);

    const grid = this.query('#detalles .grid');
    if (grid) this.revelarGrupo(grid, ':scope > div', { y: 30, stagger: 0.07 });
  }
}
