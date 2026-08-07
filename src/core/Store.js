/**
 * Store: estado global mínimo.
 * Evita variables globales y permite compartir estado entre
 * componentes (p. ej. la selección del configurador).
 */
function crearStore(estadoInicial = {}) {
  const estado = { ...estadoInicial };
  return {
    get(clave) {
      return estado[clave];
    },
    set(clave, valor) {
      estado[clave] = valor;
    }
  };
}

/** Instancia global compartida del store. */
export const store = crearStore();
