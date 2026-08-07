import { Component } from '../../../core/Component.js';
import template from './notfound.html?raw';
import './notfound.css';

/**
 * NotFound: página de error para rutas no registradas.
 * Es un componente reutilizable que muestra un mensaje simple.
 */
export class NotFound extends Component {
  constructor() {
    super(template, { mount: '#app' });
  }

  initAnimations() {
    const bloque = this.query('[data-reveal]');
    if (bloque) this.revelarElemento(bloque);
  }
}
