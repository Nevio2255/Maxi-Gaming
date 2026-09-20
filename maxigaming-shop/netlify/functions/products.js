const { getCatalog } = require('./_catalog');

exports.handler = async () => {
  try {
    const products = await getCatalog();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(products),
    };
  } catch (err) {
    console.error('products function error', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Produkte konnten nicht geladen werden.' }),
    };
  }
};
