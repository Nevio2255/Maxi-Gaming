const { getStore, connectLambda } = require('@netlify/blobs');
const seedProducts = require('../../data/products.json');

const STORE_NAME = 'maxigaming';
const KEY = 'catalog';

async function getCatalog(event) {
  if (event) connectLambda(event);
  const store = getStore(STORE_NAME);
  const stored = await store.get(KEY, { type: 'json' });
  if (stored && Array.isArray(stored) && stored.length > 0) {
    return stored;
  }
  return seedProducts;
}

async function saveCatalog(products, event) {
  if (event) connectLambda(event);
  const store = getStore(STORE_NAME);
  await store.setJSON(KEY, products);
}

module.exports = { getCatalog, saveCatalog };
