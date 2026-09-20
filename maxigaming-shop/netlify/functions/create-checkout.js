const products = require('../../data/products.json');

const SUMUP_API_URL = 'https://api.sumup.com/v0.1/checkouts';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.SUMUP_API_KEY;
  const merchantCode = process.env.SUMUP_MERCHANT_CODE;

  if (!apiKey || !merchantCode) {
    return respond(500, { error: 'SumUp ist auf dem Server noch nicht konfiguriert.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return respond(400, { error: 'Ungültige Anfrage.' });
  }

  const product = products.find((p) => p.id === body.productId);
  if (!product) {
    return respond(400, { error: 'Unbekanntes Produkt.' });
  }

  // Amount and currency always come from our own catalog, never from the client.
  const checkoutReference = `mg_${product.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const sumupRes = await fetch(SUMUP_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference: checkoutReference,
        amount: product.price,
        currency: product.currency,
        merchant_code: merchantCode,
        description: product.name,
      }),
    });

    const data = await sumupRes.json();

    if (!sumupRes.ok) {
      console.error('SumUp create-checkout error', data);
      return respond(502, { error: 'Zahlungsanbieter hat die Anfrage abgelehnt.' });
    }

    return respond(200, {
      checkoutId: data.id,
      amount: product.price,
      currency: product.currency,
    });
  } catch (err) {
    console.error('SumUp request failed', err);
    return respond(502, { error: 'Verbindung zum Zahlungsanbieter fehlgeschlagen.' });
  }
};

function respond(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}
