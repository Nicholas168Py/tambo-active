import { Component } from '../../core/Component.js';
import { $$ } from '../../shared/utils/dom.js';
import { COLORES } from '../../data/colores.js';
import { LOGOS } from '../../data/logos.js';
import { COLOR_INICIAL, LOGO_INICIAL } from '../../data/site.js';
import { enlaceWhatsApp, etiquetaCombinacion } from '../../shared/utils/whatsapp.js';
import { store } from '../../core/Store.js';
import { sectionHeading } from '../../shared/components/SectionHeading.js';
import { whatsappButton } from '../../shared/components/WhatsAppButton.js';
import { CHECK_SVG } from '../../shared/icons/index.js';
import template from './configurator.html?raw';
import './configurator.css';

const CTA_CLASES =
  'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-green text-brand-black font-bold text-sm transition-all duration-300 shadow-lg shadow-brand-green/20 hover:bg-opacity-90 hover:-translate-y-0.5';

const COLORES_CLAROS = new Set(['blanco', 'gris-claro']);

function contenidoLogo(logo) {
  if (logo.tipo !== 'imagen' || !logo.src) {
    return `<span class="config-logo-txt">${logo.label}</span>`;
  }
  const extra = logo.tamanoMax ? ' config-logo-img--grande' : '';
  return `<img src="${logo.src}" alt="${logo.label}" class="config-logo-img${extra}" loading="lazy" decoding="async" />`;
}

function renderColores(contenedor, colorInicial) {
  contenedor.innerHTML = COLORES.map(
    (color) =>
      '<label class="config-color block cursor-pointer text-center">' +
      `<input type="radio" name="config-color" value="${color.id}" class="sr-only"` +
      (color.id === colorInicial ? ' checked' : '') +
      '>' +
      `<span class="config-swatch" style="background-color:${color.hex}">` +
      `<span class="config-check">${CHECK_SVG}</span>` +
      '</span>' +
      `<span class="config-color-label">${color.label}</span>` +
      '</label>'
  ).join('');
}

function renderLogos(contenedor, logoInicial) {
  contenedor.innerHTML = LOGOS.map(
    (logo) =>
      '<label class="config-logo relative block cursor-pointer">' +
      `<input type="radio" name="config-logo" value="${logo.id}" class="sr-only"` +
      (logo.id === logoInicial ? ' checked' : '') +
      '>' +
      `<div class="config-logo-card${logo.tipo === 'imagen' ? ' config-logo-card--img' : ' bg-white'}">${contenidoLogo(logo)}</div>` +
      `<span class="config-check absolute top-3 right-3">${CHECK_SVG}</span>` +
      '</label>'
  ).join('');
}

function aplicarModoSeccion(seccion, colorId) {
  seccion.classList.toggle('config-section--oscuro', COLORES_CLAROS.has(colorId));
}

function seleccionActual(contexto = document) {
  const color = contexto.querySelector('input[name="config-color"]:checked');
  const logo = contexto.querySelector('input[name="config-logo"]:checked');
  return {
    color: color ? color.value : COLOR_INICIAL,
    logo: logo ? logo.value : LOGO_INICIAL
  };
}

/**
 * Configurator: personalización de color y logo con vista previa 3D.
 * Consume los datos desde `data/colores.js` y `data/logos.js`;
 * publica la selección en el Store y mantiene la vista previa 3D.
 */
export class Configurator extends Component {
  constructor() {
    super(template, { mount: '#app' });
    const inicial = store.get('seleccion') ?? { color: COLOR_INICIAL, logo: LOGO_INICIAL };
    this.colorInicial = inicial.color;
    this.logoInicial = inicial.logo;
    this._tres = null;
    this._observador3D = null;
    this._destruido = false;
    this._seleccion = null;
  }

  render() {
    super.render();

    const heading = this.query('[data-section-heading]');
    if (heading) {
      heading.innerHTML = sectionHeading({
        title: 'Elige tu combinación',
        subtitle: 'Personaliza tu camiseta: elige color y logo, la vista previa se actualiza al instante.',
        wrapperClass: 'mb-16',
        h2Class: 'mb-4 text-brand-dark'
      });
    }

    const cta = this.query('[data-cta-configurator]');
    if (cta) {
      cta.innerHTML = whatsappButton({
        id: 'config-combo-btn',
        text: 'Solicitar esta combinación',
        iconClass: 'w-5 h-5',
        target: '_blank',
        classes: CTA_CLASES,
        href: enlaceWhatsApp(this.colorInicial, this.logoInicial, COLORES, LOGOS)
      });
    }
  }

  bindEvents() {
    const colores = this.query('[data-config-colores]');
    const logos = this.query('[data-config-logos]');
    const caption = this.query('[data-config-caption]');
    const btn = this.query('#config-combo-btn');
    const contenedor3D = this.query('[data-config-3d]');
    const seccion = this.query('#colores');

    if (!colores || !logos || !caption || !btn || !contenedor3D || !seccion) return;

    renderColores(colores, this.colorInicial);
    renderLogos(logos, this.logoInicial);
    aplicarModoSeccion(seccion, this.colorInicial);
    this._seleccion = { color: this.colorInicial, logo: this.logoInicial };

    ['config-color', 'config-logo'].forEach((grupo) => {
      $$(`input[name="${grupo}"]`, this.root).forEach((input) => {
        this.on(input, 'change', () => {
          const sel = seleccionActual(this.root);
          caption.textContent = etiquetaCombinacion(sel.color, sel.logo, COLORES, LOGOS);
          btn.href = enlaceWhatsApp(sel.color, sel.logo, COLORES, LOGOS);
          store.set('seleccion', sel);
          this._seleccion = sel;
          if (grupo === 'config-color') aplicarModoSeccion(seccion, sel.color);
          this._tres?.aplicarSeleccion(sel);
        });
      });
    });

    this._iniciarCarga3D(contenedor3D);
  }

  /**
   * Carga el visor 3D de forma diferida: three.js y el modelo GLB
   * solo se descargan cuando la sección se acerca al viewport.
   * @param {HTMLElement} contenedor3D
   */
  _iniciarCarga3D(contenedor3D) {
    const cargar = () => {
      import('../../three/Configurator3D.js').then(({ Configurator3D }) => {
        if (this._destruido) return;
        this._tres = new Configurator3D(contenedor3D);
        this._tres.aplicarSeleccion(this._seleccion);
        this._tres.montar();
      });
    };

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
