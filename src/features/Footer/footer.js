import { Component } from '../../core/Component.js';
import template from './footer.html?raw';
import './footer.css';

/**
 * Footer: mantiene el año actualizado.
 */
export class Footer extends Component {
  constructor() {
    super(template, { mount: '#app' });
  }

  bindEvents() {
    const year = this.query('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  }
}
