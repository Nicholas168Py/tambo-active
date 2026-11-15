/**
 * Mapeo oficial de las 21 combinaciones de colores para el Combo Dúo.
 * 
 * Tabla de combinaciones (con archivos en public/camisetas/{N}.webp):
 * 1:  #111111 (Negro) + #111111 (Negro)
 * 2:  #DADADA (Gris claro / Blanco) + #DADADA (Gris claro / Blanco)
 * 3:  #172349 (Azul marino) + #172349 (Azul marino)
 * 4:  #4B5320 (Verde militar) + #4B5320 (Verde militar)
 * 5:  #858B93 (Gris medio) + #858B93 (Gris medio)
 * 6:  #3F4043 (Gris carbón) + #3F4043 (Gris carbón)
 * 7:  #111111 (Negro) + #DADADA (Gris claro)
 * 8:  #111111 (Negro) + #172349 (Azul marino)
 * 9:  #111111 (Negro) + #4B5320 (Verde militar)
 * 10: #111111 (Negro) + #858B93 (Gris medio)
 * 11: #111111 (Negro) + #3F4043 (Gris carbón)
 * 12: #DADADA (Gris claro) + #172349 (Azul marino)
 * 13: #DADADA (Gris claro) + #4B5320 (Verde militar)
 * 14: #DADADA (Gris claro) + #858B93 (Gris medio)
 * 15: #DADADA (Gris claro) + #3F4043 (Gris carbón)
 * 16: #172349 (Azul marino) + #4B5320 (Verde militar)
 * 17: #172349 (Azul marino) + #858B93 (Gris medio)
 * 18: #172349 (Azul marino) + #3F4043 (Gris carbón)
 * 19: #4B5320 (Verde militar) + #858B93 (Gris medio)
 * 20: #4B5320 (Verde militar) + #3F4043 (Gris carbón)
 * 21: #858B93 (Gris medio) + #3F4043 (Gris carbón)
 */

export const COMBINACIONES_COMBO_DUO = {
  'negro+negro': 1,
  'blanco+blanco': 2,
  'azul-oscuro+azul-oscuro': 3,
  'verde-militar+verde-militar': 4,
  'gris-claro+gris-claro': 5,
  'gris-oscuro+gris-oscuro': 6,
  'blanco+negro': 7,
  'azul-oscuro+negro': 8,
  'negro+verde-militar': 9,
  'gris-claro+negro': 10,
  'gris-oscuro+negro': 11,
  'azul-oscuro+blanco': 12,
  'blanco+verde-militar': 13,
  'blanco+gris-claro': 14,
  'blanco+gris-oscuro': 15,
  'azul-oscuro+verde-militar': 16,
  'azul-oscuro+gris-claro': 17,
  'azul-oscuro+gris-oscuro': 18,
  'gris-claro+verde-militar': 19,
  'gris-oscuro+verde-militar': 20,
  'gris-claro+gris-oscuro': 21
};

/**
 * Retorna el número de combinación (1..21) y la ruta .webp correspondiente.
 * @param {string} color1Id - Id del color 1 (ej: 'negro', 'blanco', 'azul-oscuro'...)
 * @param {string} color2Id - Id del color 2
 * @returns {{ numero: number, ruta: string }}
 */
export function obtenerCombinacionDuo(color1Id, color2Id) {
  const c1 = String(color1Id || 'negro').toLowerCase();
  const c2 = String(color2Id || 'blanco').toLowerCase();

  const clave = [c1, c2].sort().join('+');
  const numero = COMBINACIONES_COMBO_DUO[clave] || 1;

  return {
    numero,
    ruta: `./camisetas/combo_2/${numero}.webp`
  };
}
