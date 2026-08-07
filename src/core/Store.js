import { EventBus } from './EventBus.js';

/**
 * Store: estado global mínimo con suscripciones por clave.
 * Evita variables globales y permite compartir estado entre
 * componentes (p. ej. la selección del configurador).
 */
export class Store {
  constructor(estadoInicial = {}) {
    this._estado = { ...estadoInicial };
    this._bus = new EventBus();
  }

  /**
   * Lee el valor de una clave.
   * @param {string} clave
   */
  get(clave) {
    return this._estado[clave];
  }

  /**
   * Escribe una clave y notifica a los suscriptores.
   * @param {string} clave
   * @param {*} valor
   */
  set(clave, valor) {
    this._estado[clave] = valor;
    this._bus.emit(clave, valor);
  }

  /**
   * Se suscribe a cambios de una clave.
   * @param {string} clave
   * @param {Function} fn
   * @returns {Function} Función para desuscribirse.
   */
  subscribe(clave, fn) {
    return this._bus.on(clave, fn);
  }

  /**
   * Reinicia el estado y limpia suscriptores.
   */
  clear() {
    this._estado = {};
    this._bus.clear();
  }
}

/** Instancia global compartida del store. */
export const store = new Store();
