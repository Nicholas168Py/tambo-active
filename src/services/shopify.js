/**
 * ===================================================================
 * CLIENTE Y SERVICIOS GRAPHQL DE SHOPIFY STOREFRONT API (v2024-07)
 * ===================================================================
 * 
 * Permite sincronizar productos, variantes y generar el checkout oficial
 * de Shopify usando únicamente el Token público de Storefront.
 */

const SHOPIFY_STORE_DOMAIN =
  import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'tambo-active.myshopify.com';

const SHOPIFY_STOREFRONT_TOKEN =
  import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || '';

const API_VERSION = '2024-07';
const GRAPHQL_ENDPOINT = `https://${SHOPIFY_STORE_DOMAIN}/api/${API_VERSION}/graphql.json`;

/**
 * Cliente HTTP GraphQL reutilizable con manejo centralizado de errores.
 * 
 * @param {object} params
 * @param {string} params.query - Consulta o mutación GraphQL.
 * @param {object} [params.variables={}] - Variables asociadas.
 * @returns {Promise<any>} Objeto data retornado por Shopify.
 */
export async function shopifyFetch({ query, variables = {} }) {
  if (!SHOPIFY_STOREFRONT_TOKEN) {
    console.warn(
      '[Shopify] VITE_SHOPIFY_STOREFRONT_TOKEN no está configurado en el archivo .env.'
    );
  }

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error HTTP ${response.status} en Shopify API: ${errorText}`);
    }

    const json = await response.json();

    if (json.errors && json.errors.length > 0) {
      const msgs = json.errors.map((e) => e.message).join(' | ');
      throw new Error(`Error GraphQL de Shopify: ${msgs}`);
    }

    return json.data;
  } catch (error) {
    console.error('[Shopify] Error en shopifyFetch:', error);
    throw error;
  }
}

/**
 * Consulta la lista de productos activos en la tienda con sus variantes e imágenes.
 * 
 * @param {object} [options]
 * @param {number} [options.first=20] - Número de productos a consultar.
 * @returns {Promise<Array>} Lista de productos normalizada.
 */
export async function getProducts({ first = 20 } = {}) {
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            description
            handle
            availableForSale
            images(first: 5) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch({ query, variables: { first } });

  if (!data?.products?.edges) {
    return [];
  }

  return data.products.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    description: node.description,
    handle: node.handle,
    availableForSale: node.availableForSale,
    images: (node.images?.edges || []).map((img) => ({
      url: img.node.url,
      altText: img.node.altText || node.title
    })),
    variants: (node.variants?.edges || []).map((v) => ({
      id: v.node.id, // Formato GID: gid://shopify/ProductVariant/123456
      title: v.node.title,
      availableForSale: v.node.availableForSale,
      price: v.node.price,
      selectedOptions: v.node.selectedOptions || []
    }))
  }));
}

/**
 * Consulta un producto específico por su 'handle' (ej: 'camiseta-tambo-active').
 * 
 * @param {string} handle
 * @returns {Promise<object|null>}
 */
export async function getProductByHandle(handle) {
  const query = `
    query getProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        description
        handle
        availableForSale
        images(first: 5) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 50) {
          edges {
            node {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch({ query, variables: { handle } });
  const node = data?.product;
  if (!node) return null;

  return {
    id: node.id,
    title: node.title,
    description: node.description,
    handle: node.handle,
    availableForSale: node.availableForSale,
    images: (node.images?.edges || []).map((img) => ({
      url: img.node.url,
      altText: img.node.altText || node.title
    })),
    variants: (node.variants?.edges || []).map((v) => ({
      id: v.node.id,
      title: v.node.title,
      availableForSale: v.node.availableForSale,
      price: v.node.price,
      selectedOptions: v.node.selectedOptions || []
    }))
  };
}

/**
 * Busca la variante adecuada según las opciones de Color y Talla seleccionadas.
 * 
 * @param {Array} variants - Lista de variantes de Shopify.
 * @param {string} color - Nombre o etiqueta del color (ej: 'Gris Claro', 'Negro').
 * @param {string} size - Talla (ej: 'S', 'M', 'L', 'XL').
 * @returns {object|null} Variante encontrada o fallback a la primera disponible.
 */
export function findShopifyVariant(variants = [], color = '', size = '') {
  if (!variants || variants.length === 0) return null;

  const colorNorm = String(color).trim().toLowerCase();
  const sizeNorm = String(size).trim().toLowerCase();

  console.log(`🔎 [findShopifyVariant] Buscando variante para Color="${color}" y Talla="${size}" entre ${variants.length} variantes...`);

  // 1. Coincidencia exacta por selectedOptions (Color y Talla/Size)
  const exactMatch = variants.find((variant) => {
    let matchColor = false;
    let matchSize = false;

    for (const opt of variant.selectedOptions || []) {
      const optName = opt.name.toLowerCase();
      const optVal = opt.value.trim().toLowerCase();

      if (optName.includes('color') || optName.includes('colour')) {
        if (optVal === colorNorm || colorNorm.includes(optVal) || optVal.includes(colorNorm)) {
          matchColor = true;
        }
      }

      if (
        optName.includes('talla') ||
        optName.includes('size') ||
        optName.includes('dimension')
      ) {
        if (optVal === sizeNorm) {
          matchSize = true;
        }
      }
    }

    return matchColor && matchSize;
  });

  if (exactMatch) {
    console.log(`   ✅ Coincidencia exacta encontrada: ${exactMatch.id} (${exactMatch.title})`);
    return exactMatch;
  }

  // 2. Coincidencia parcial por título de la variante (ej: "Negro / M")
  const titleMatch = variants.find((variant) => {
    const t = variant.title.toLowerCase();
    return (t.includes(colorNorm) || colorNorm.includes(t)) && t.includes(sizeNorm);
  });

  if (titleMatch) {
    console.log(`   ✅ Coincidencia por título encontrada: ${titleMatch.id} (${titleMatch.title})`);
    return titleMatch;
  }

  // 3. Coincidencia por talla
  const sizeMatch = variants.find((variant) => {
    for (const opt of variant.selectedOptions || []) {
      if (opt.value.trim().toLowerCase() === sizeNorm) return true;
    }
    return variant.title.toLowerCase().includes(sizeNorm);
  });

  if (sizeMatch) {
    console.log(`   ⚠️ Coincidencia parcial por talla: ${sizeMatch.id} (${sizeMatch.title})`);
    return sizeMatch;
  }

  // 4. Fallback: primera variante disponible para venta o primera variante en general
  const fallback = variants.find((v) => v.availableForSale) || variants[0];
  console.log(`   ℹ️ Fallback a primera variante: ${fallback?.id} (${fallback?.title})`);
  return fallback || null;
}

/**
 * Cache en memoria del catálogo para evitar consultas repetitivas innecesarias.
 */
let _cachedCatalog = null;
let _catalogPromise = null;

/**
 * Obtiene el catálogo sincronizado de Shopify (con cache).
 * @returns {Promise<Array>}
 */
export async function getShopifyCatalog() {
  if (_cachedCatalog) return _cachedCatalog;
  if (_catalogPromise) return _catalogPromise;

  _catalogPromise = getProducts({ first: 25 })
    .then((products) => {
      _cachedCatalog = products;
      return products;
    })
    .catch((err) => {
      console.warn('[Shopify] No se pudo precargar el catálogo:', err.message);
      return [];
    })
    .finally(() => {
      _catalogPromise = null;
    });

  return _catalogPromise;
}

export const CART_CREATE_MUTATION = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

/**
 * Crea un Carrito de Shopify y genera la URL oficial de Checkout (mutation cartCreate).
 * Incluye auditoría detallada en consola, validación de GID y protección estricta contra
 * redirecciones al home si la creación del carrito falla.
 * 
 * @param {Array} cartItems - Lista de artículos del carrito local.
 * @returns {Promise<{ checkoutUrl: string, cartId: string }|undefined>}
 */
export async function createShopifyCheckout(cartItems) {
  console.group("🚀 [Shopify Checkout] Iniciando proceso de compra");
  console.log("🛒 Ítems recibidos del carrito local:", cartItems);

  // Validación previa
  if (!cartItems || cartItems.length === 0) {
    console.error("❌ El carrito está vacío.");
    console.groupEnd();
    alert("Tu carrito está vacío.");
    return;
  }

  // Asegurar que el catálogo esté cargado para resolver variantes si faltan
  let catalog = _cachedCatalog;
  if (!catalog || catalog.length === 0) {
    try {
      catalog = await getShopifyCatalog();
    } catch {
      catalog = [];
    }
  }
  const defaultProduct = catalog?.[0] || null;
  const defaultVariants = defaultProduct?.variants || [];

  // 1. Mapeo y validación estricta de merchandiseId (GID)
  const lines = cartItems.map((item, index) => {
    let variantId = item.shopifyVariantId || item.variantId || item.merchandiseId;

    // Si aún no tenemos variantId, resolver con el catálogo de Shopify
    if (!variantId && defaultVariants.length > 0) {
      const matched = findShopifyVariant(defaultVariants, item.color, item.size);
      if (matched?.id) {
        variantId = matched.id;
      }
    }

    // Si todavía no hay variantId pero item.id es un GID o ID numérico
    if (!variantId && item.id) {
      if (String(item.id).startsWith("gid://shopify/ProductVariant/")) {
        variantId = item.id;
      } else {
        const clean = String(item.id).replace(/\D/g, "");
        if (clean.length > 5) {
          variantId = `gid://shopify/ProductVariant/${clean}`;
        }
      }
    }

    // Si el ID es puramente numérico, lo convertimos al formato GID de Shopify
    if (variantId && !String(variantId).startsWith("gid://shopify/ProductVariant/")) {
      // Extrae solo los dígitos por si viene sucio
      const cleanNumericId = String(variantId).replace(/\D/g, "");
      if (cleanNumericId) {
        variantId = `gid://shopify/ProductVariant/${cleanNumericId}`;
      }
    }

    console.log(`🔍 [Línea ${index + 1}] merchandiseId generado:`, variantId);
    console.log(`   - Producto: ${item.name || "Camiseta"}`);
    console.log(`   - Color: ${item.color} | Talla: ${item.size} | Logo: ${item.logo}`);
    console.log(`   - Cantidad: ${item.quantity}`);

    const attributes = item.attributes && Array.isArray(item.attributes) && item.attributes.length > 0
      ? item.attributes
      : [
        { key: "Modalidad", value: String(item.bundleMode || item.modalidad || "Individual") },
        { key: "Referencia", value: String(item.productType || item.referencia || item.name || "Camiseta Deportiva") },
        { key: "Detalle Colores", value: String(item.colorDetailsText || item.color || "") },
        { key: "Talla", value: String(item.size || "") },
        { key: "Logo Seleccionado", value: String(item.logo || "Estándar") }
      ];

    return {
      merchandiseId: variantId,
      quantity: Number(item.quantity) || 1,
      attributes
    };
  });

  // Validar que todas las líneas tengan un merchandiseId de Shopify válido
  const invalidLine = lines.find(
    (l) => !l.merchandiseId || !String(l.merchandiseId).startsWith("gid://shopify/ProductVariant/")
  );
  if (invalidLine) {
    console.error("❌ ERROR: Al menos un producto no tiene un merchandiseId de Shopify válido:", invalidLine);
    alert("No se pudo obtener el identificador de variante de Shopify para uno o más productos. Revisa la consola.");
    console.groupEnd();
    return;
  }

  const variables = {
    input: { lines }
  };

  console.log("📦 Payload enviado a Shopify Storefront API:", JSON.stringify(variables, null, 2));

  try {
    const data = await shopifyFetch({
      query: CART_CREATE_MUTATION,
      variables
    });

    console.log("📡 Respuesta bruta de Shopify (data):", data);

    const cartData = data?.cartCreate;

    // 2. Comprobar si Shopify devolvió errores de negocio
    if (cartData?.userErrors && cartData.userErrors.length > 0) {
      console.error("❌ Errores devueltos por Shopify (userErrors):", cartData.userErrors);
      cartData.userErrors.forEach((err) => {
        console.error(`- Campo: ${err.field?.join(".")} | Mensaje: ${err.message} | Código: ${err.code}`);
      });
      alert(`No se pudo procesar la compra: ${cartData.userErrors[0].message}`);
      console.groupEnd();
      return; // DETENER: No redirigir si hay errores
    }

    const checkoutUrl = cartData?.cart?.checkoutUrl;
    console.log("🔗 checkoutUrl obtenido de Shopify:", checkoutUrl);

    // 3. Redirección oficial al Checkout de Shopify
    if (checkoutUrl) {
      console.log("✅ Redirigiendo al checkout oficial:", checkoutUrl);
      console.groupEnd();
      window.location.href = checkoutUrl;
    } else {
      console.error("❌ ERROR: No se recibió checkoutUrl de Shopify", cartData);
      alert("Hubo un problema al generar la pantalla de pago.");
      console.groupEnd();
    }
  } catch (error) {
    console.error("💥 Error en la petición a Shopify:", error);
    alert("Error de conexión con la pasarela de pago.");
    console.groupEnd();
  }
}

/**
 * Exporta la configuración actual para depuración o UI.
 */
export const shopifyConfig = {
  domain: SHOPIFY_STORE_DOMAIN,
  hasToken: Boolean(SHOPIFY_STOREFRONT_TOKEN),
  endpoint: GRAPHQL_ENDPOINT
};
