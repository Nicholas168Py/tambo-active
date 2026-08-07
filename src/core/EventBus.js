/**
 * EventBus: bus de eventos pub/sub minimalista.
 * Permite comunicación entre componentes sin acoplarlos.
 */
export class EventBus {
  constructor() {
    this._oyentes = new Map();
  }

  /**
   * Registra un suscriptor para un evento.
   * @param {string} evento
   * @param {Function} fn
   * @returns {Function} Función para desuscribirse.
   */
  on(evento, fn) {
    if (!this._oyentes.has(evento)) {
      this._oyentes.set(evento, new Set());
    }
    this._oyentes.get(evento).add(fn);
    return () => this.off(evento, fn);
  }

  /**
   * Elimina un suscriptor.
   * @param {string} evento
   * @param {Function} fn
   */
  off(evento, fn) {
    this._oyentes.get(evento)?.delete(fn);
  }

  /**
   * Emite un evento con datos opcionales.
   * @param {string} evento
   * @param {*} datos
   */
  emit(evento, datos) {
    this._oyentes.get(evento)?.forEach((fn) => fn(datos));
  }

  /**
   * Limpia todos los suscriptores.
   */
  clear() {
    this._oyentes.clear();
  }
}

/** Instancia global compartida del bus. */
export const eventBus = new EventBus();
