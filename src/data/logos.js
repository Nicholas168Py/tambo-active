/**
 * Logos disponibles en el configurador.
 * - tipo 'texto': logotipo propio (renderizado en CSS).
 * - tipo 'imagen': logo externo por URL.
 * @type {{ id: string, label: string, tipo: string, src?: string }[]}
 */
export const LOGOS = [
  { id: 'tambo', label: 'TAMBO ACTIVE', tipo: 'texto' },
  {
    id: 'adidas',
    label: 'Adidas',
    tipo: 'imagen',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgQo-vSrGq88Y1bwQF4_XNgDtl96El5MmV3YBzGP1qgCxDfpgSNrYyJmw-TxM7572oLeps7dbaIdl3ot-hG6G5lVYoGH53Br9kOb_o1Kk9zZE83Fn7rRPB8AlR0vAAgcOztQ3pwAOk_s3LvKAGLS-z9lJ1DXnCtFMXSk9nDFG8VH49EEffQtHafk4-PlMKqJgj_p5qq2Ea4W4a3yfRKpTPYJMjiEIEEWrr6B7HUevFjAu7lTQ9RYjJJA'
  },
  {
    id: 'nike',
    label: 'Nike',
    tipo: 'imagen',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSEcfOCLUt7Rb9AtxpxXAH8XB-xDp_t_3JQaGLsGYtTKpw2YSMP1gZ7AM2j0pW1xb_PhU29fYjaBDF1sXQci8s6is7DtEtCgqHYxTD2sWuHrHaNZkKoFsJxPc3K7FxMNbJdGgchSCZBEtKmed9SkrMaeuHFOGNAZp7yObAHMx3ZbGdH2XSZ1SiWQlhBP6P0--qtuO7GmnHs3HB8-683h9tV5C1N_XeWkqHE4O_TjkQKZVkr-WEJ4I56g'
  }
];
