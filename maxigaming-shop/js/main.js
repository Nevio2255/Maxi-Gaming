document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Hero counters (single load-in animation) ---------- */
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(progress * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
animateCounters();

/* ---------- Product rendering ---------- */
const grid = document.getElementById('product-grid');
const priceFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0 });

fetch('data/products.json')
  .then((r) => r.json())
  .then((products) => {
    grid.innerHTML = products.map(renderProductCard).join('');
    products.forEach((p) => {
      document
        .querySelector(`[data-buy="${p.id}"]`)
        .addEventListener('click', () => startCheckout(p));
    });
  })
  .catch(() => {
    grid.innerHTML = '<p style="color:#a3a7ae">Produkte konnten nicht geladen werden.</p>';
  });

function renderProductCard(p) {
  const specRows = Object.entries(p.specs)
    .map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`)
    .join('');
  return `
    <div class="product-card">
      <span class="target-tag">${p.target}</span>
      <h3>${p.name}</h3>
      <p class="tagline">${p.tagline}</p>
      <ul class="spec-list">${specRows}</ul>
      <div class="product-price">${priceFormatter.format(p.price)}&nbsp;€<sup>*</sup></div>
      <button class="buy-btn" data-buy="${p.id}">Kaufen</button>
    </div>
  `;
}

/* ---------- Checkout flow ---------- */
const overlay = document.getElementById('checkout-overlay');
const titleEl = document.getElementById('checkout-title');
const summaryEl = document.getElementById('checkout-summary');
const statusEl = document.getElementById('checkout-status');
const cardMount = document.getElementById('sumup-card');
let activeWidget = null;

document.getElementById('checkout-close').addEventListener('click', closeCheckout);

function closeCheckout() {
  overlay.hidden = true;
  cardMount.innerHTML = '';
  if (activeWidget) {
    try { activeWidget.unmount(); } catch (e) { /* already gone */ }
    activeWidget = null;
  }
}

async function startCheckout(product) {
  overlay.hidden = false;
  titleEl.textContent = product.name;
  summaryEl.textContent = `${priceFormatter.format(product.price)} € · ${product.target}`;
  statusEl.textContent = 'Zahlung wird vorbereitet …';
  statusEl.className = 'checkout-status';
  cardMount.innerHTML = '';

  try {
    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Checkout konnte nicht erstellt werden.');
    }

    const { checkoutId, amount, currency } = await res.json();
    statusEl.textContent = 'Kartendaten eingeben:';

    activeWidget = SumUpCard.mount({
      id: 'sumup-card',
      checkoutId,
      amount: String(amount),
      currency,
      locale: 'de-DE',
      onResponse: handleSumUpResponse,
    });
  } catch (err) {
    statusEl.textContent = err.message || 'Es ist ein Fehler aufgetreten.';
    statusEl.className = 'checkout-status error';
  }
}

function handleSumUpResponse(type, body) {
  switch (type) {
    case 'sent':
      statusEl.textContent = 'Zahlung wird verarbeitet …';
      statusEl.className = 'checkout-status';
      break;
    case 'invalid':
      statusEl.textContent = 'Bitte überprüfe deine Eingaben.';
      statusEl.className = 'checkout-status error';
      break;
    case 'auth-screen':
      statusEl.textContent = 'Bitte bestätige die Zahlung (3D Secure) …';
      break;
    case 'success':
      statusEl.textContent = 'Zahlung erfolgreich! Wir melden uns per E-Mail zur Lieferung.';
      statusEl.className = 'checkout-status success';
      cardMount.innerHTML = '';
      break;
    case 'fail':
      statusEl.textContent = 'Zahlung abgebrochen oder fehlgeschlagen. Bitte versuche es erneut.';
      statusEl.className = 'checkout-status error';
      break;
    case 'error':
      statusEl.textContent = 'Serverfehler bei der Zahlung. Bitte später erneut versuchen.';
      statusEl.className = 'checkout-status error';
      break;
    default:
      console.log('SumUp response', type, body);
  }
}
