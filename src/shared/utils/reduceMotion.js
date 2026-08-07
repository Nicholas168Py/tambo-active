/**
 * Detecta si el usuario prefiere movimiento reducido.
 * @returns {boolean}
 */
export function prefiereMovimientoReducido() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
