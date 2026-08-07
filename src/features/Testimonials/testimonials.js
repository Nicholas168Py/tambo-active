import { Component } from '../../core/Component.js';
import { sectionHeading } from '../../shared/components/SectionHeading.js';
import { TESTIMONIOS } from '../../data/testimonials.js';
import template from './testimonials.html?raw';
import './testimonials.css';

const POR_PAGINA = 3;

function estrellas() {
  return (
    '<div class="flex text-yellow-400 mb-4">' +
    [1, 2, 3, 4, 5].map(() => '<span class="material-symbols-outlined text-sm">star</span>').join('') +
    '</div>'
  );
}

function renderTarjeta(t) {
  return (
    '<div class="bg-white rounded-2xl p-8 shadow-sm">' +
    estrellas() +
    `<p class="text-gray-700 mb-6 italic">&quot;${t.quote}&quot;</p>` +
    '<div class="flex items-center gap-3">' +
    `<img alt="${t.name}" class="w-10 h-10 rounded-full" loading="lazy" decoding="async" src="${t.avatar}" />` +
    `<div><p class="font-bold text-sm text-brand-dark">${t.name}</p>` +
    `<p class="text-xs text-gray-500">${t.city}</p></div>` +
    '</div>' +
    '</div>'
  );
}

/**
 * Testimonials: carrusel paginado (3 por página) con dots.
 * Los testimonios provienen de `data/testimonials.js`.
 */
export class Testimonials extends Component {
  constructor() {
    super(template, { mount: '#app' });
  }

  render() {
    super.render();

    const heading = this.query('[data-section-heading]');
    if (heading) {
      heading.innerHTML = sectionHeading({
        title: 'LO QUE DICEN NUESTROS CLIENTES',
        wrapperClass: 'mb-16',
        h2Class: 'mb-4 text-brand-dark'
      });
    }

    const track = this.query('#testimonials-track');
    if (track) track.innerHTML = TESTIMONIOS.map(renderTarjeta).join('');
  }

  bindEvents() {
    const prevBtn = this.query('#testimonial-prev');
    const nextBtn = this.query('#testimonial-next');
    const track = this.query('#testimonials-track');
    const dots = this.queryAll('#testimonial-dots div');

    if (!prevBtn || !nextBtn || !track || !dots.length) return;

    const testimonials = [...track.children];
    let page = 0;
    const pages = Math.max(1, Math.ceil(testimonials.length / POR_PAGINA));

    const mostrar = (pagina) => {
      page = pagina;
      testimonials.forEach((el, i) => {
        const visible = i >= page * POR_PAGINA && i < page * POR_PAGINA + POR_PAGINA;
        el.style.display = visible ? '' : 'none';
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('bg-brand-green', i === page);
        dot.classList.toggle('bg-gray-300', i !== page);
      });
    };

    this.on(prevBtn, 'click', () => mostrar((page - 1 + pages) % pages));
    this.on(nextBtn, 'click', () => mostrar((page + 1) % pages));
    dots.forEach((dot, i) => this.on(dot, 'click', () => mostrar(i)));

    mostrar(0);
  }

  initAnimations() {
    this.queryAll('[data-reveal]').forEach((el) => this.revelarElemento(el));
  }
}
