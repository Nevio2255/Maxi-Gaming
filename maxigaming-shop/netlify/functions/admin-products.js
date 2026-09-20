const { getCatalog, saveCatalog } = require('./_catalog');

const MAX_IMAGES_PER_PRODUCT = 6;
// Rough safety cap so a single product blob (base64 images included) can't
// grow large enough to break function payload limits.
const MAX_TOTAL_IMAGE_CHARS = 6_000_000;

exports.handler = async (event) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return respond(500, { error: 'ADMIN_PASSWORD ist auf dem Server nicht gesetzt.' });
  }
  const suppliedPassword = event.headers['x-admin-password'] || '';
  if (suppliedPassword !== adminPassword) {
    return respond(401, { error: 'Falsches Passwort.' });
  }

  if (event.httpMethod === 'POST') return handleSave(event);
  if (event.httpMethod === 'DELETE') return handleDelete(event);
  return respond(405, { error: 'Method not allowed' });
};

async function handleSave(event) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return respond(400, { error: 'Ungültige Anfrage.' });
  }

  const { id, name, tagline, target, price, currency, specs, images } = body;

  if (!name || !price || !currency) {
    return respond(400, { error: 'Name, Preis und Währung sind Pflichtfelder.' });
  }
  const imgArray = Array.isArray(images) ? images : [];
  if (imgArray.length > MAX_IMAGES_PER_PRODUCT) {
    return respond(400, { error: `Maximal ${MAX_IMAGES_PER_PRODUCT} Bilder pro Produkt.` });
  }
  const totalImageChars = imgArray.reduce((sum, img) => sum + (img ? img.length : 0), 0);
  if (totalImageChars > MAX_TOTAL_IMAGE_CHARS) {
    return respond(400, { error: 'Bilder zusammen zu groß. Bitte kleinere/weniger Bilder verwenden.' });
  }

  const products = await getCatalog();
  const productId = id || slugify(name) + '-' + Date.now().toString(36);

  const newProduct = {
    id: productId,
    name,
    tagline: tagline || '',
    target: target || '',
    price: Number(price),
    currency,
    specs: specs && typeof specs === 'object' ? specs : {},
    images: imgArray,
  };

  const existingIndex = products.findIndex((p) => p.id === productId);
  if (existingIndex >= 0) {
    products[existingIndex] = newProduct;
  } else {
    products.push(newProduct);
  }

  await saveCatalog(products);
  return respond(200, { product: newProduct });
}

async function handleDelete(event) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return respond(400, { error: 'Ungültige Anfrage.' });
  }
  const { id } = body;
  if (!id) return respond(400, { error: 'id fehlt.' });

  const products = await getCatalog();
  const filtered = products.filter((p) => p.id !== id);
  await saveCatalog(filtered);
  return respond(200, { ok: true });
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function respond(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}
