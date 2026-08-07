import './shared/styles/tailwind.css';
import './shared/styles/variables.css';
import './shared/styles/base.css';
import './shared/styles/animations.css';

import { App } from './core/App.js';

// Marca que JS está activo para habilitar los estados base de reveal.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  new App({ root: '#app' }).init();
});
