const PW_KEY = 'mg_admin_pw';
const MAX_DIMENSION = 1100;
const JPEG_QUALITY = 0.78;

const loginScreen = document.getElementById('login-screen');
const adminApp = document.getElementById('admin-app');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

const productList = document.getElementById('product-list');
const newProductBtn = document.getElementById('new-product-btn');
const editorOverlay = document.getElementById('editor-overlay');
const editorClose = document.getElementById('editor-close');
const editorTitle = document.getElementById('editor-title');
const form = document.getElementById('product-form');
const deleteBtn = document.getElementById('delete-btn');
const formStatus = document.getElementById('form-status');
const imagePreview = document.getElementById('image-preview');
const imagesInput = document.getElementById('p-images');

let currentImages = []; // data URLs for the product currently being edited
let currentProducts = [];

/* ---------- Auth ---------- */
function adminPassword() {
  return sessionStorage.getItem(PW_KEY) || '';
}

async function tryLogin(pw) {
  const res = await fetch('/.netlify/functions/admin-auth', {
    headers: { 'x-admin-password': pw },
  });
  return res.status !== 401;
}

loginBtn.addEventListener('click', async () => {
  const pw = passwordInput.value.trim();
  if (!pw) return;
  loginBtn.disabled = true;
  loginBtn.textContent = 'Prüfe …';
  const ok = await tryLogin(pw);
  loginBtn.disabled = false;
  loginBtn.textContent = 'Anmelden';
  if (ok) {
    sessionStorage.setItem(PW_KEY, pw);
    showApp();
  } else {
    loginError.hidden = false;
  }
});
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

function showApp() {
  loginScreen.hidden = true;
  adminApp.hidden = false;
  loadProducts();
}

if (adminPassword()) {
  // Re-check silently; if it fails, fall back to login screen.
  tryLogin(adminPassword()).then((ok) => {
    if (ok) showApp();
  });
}

/* ---------- Product list ---------- */
async function loadProducts() {
  productList.innerHTML = '<p style="color:#a3a7ae">Lade …</p>';
  const res = await fetch('/.netlify/functions/products');
  currentProducts = await res.json();
  renderList();
}

function renderList() {
  if (!currentProducts.length) {
    productList.innerHTML = '<p style="color:#a3a7ae">Noch keine Produkte.</p>';
    return;
  }
  productList.innerHTML = currentProducts
    .map(
      (p) => `
      <div class="admin-card" data-id="${p.id}">
        ${
          p.images && p.images[0]
            ? `<img src="${p.images[0]}" alt="${p.name}" />`
            : `<div class="no-image">kein Bild</div>`
        }
        <h3>${p.name}</h3>
        <div class="admin-card-price">${p.price} ${p.currency}</div>
      </div>`
    )
    .join('');
  productList.querySelectorAll('.admin-card').forEach((card) => {
    card.addEventListener('click', () => openEditor(card.dataset.id));
  });
}

/* ---------- Editor ---------- */
newProductBtn.addEventListener('click', () => openEditor(null));
editorClose.addEventListener('click', closeEditor);

function closeEditor() {
  editorOverlay.hidden = true;
  form.reset();
  currentImages = [];
  imagePreview.innerHTML = '';
  formStatus.textContent = '';
  formStatus.className = 'admin-status';
}

function openEditor(id) {
  const product = id ? currentProducts.find((p) => p.id === id) : null;
  editorTitle.textContent = product ? 'Produkt bearbeiten' : 'Neues Produkt';
  document.getElementById('p-id').value = product ? product.id : '';
  document.getElementById('p-name').value = product ? product.name : '';
  document.getElementById('p-tagline').value = product ? product.tagline || '' : '';
  document.getElementById('p-target').value = product ? product.target || '' : '';
  document.getElementById('p-price').value = product ? product.price : '';
  document.getElementById('p-currency').value = product ? product.currency : 'EUR';
  document.getElementById('p-specs').value = product
    ? Object.entries(product.specs || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    : '';
  currentImages = product && Array.isArray(product.images) ? [...product.images] : [];
  renderImagePreview();
  deleteBtn.hidden = !product;
  formStatus.textContent = '';
  formStatus.className = 'admin-status';
  editorOverlay.hidden = false;
}

function renderImagePreview() {
  imagePreview.innerHTML = currentImages
    .map((src, i) => `<img src="${src}" data-i="${i}" title="Klicken zum Entfernen" />`)
    .join('');
  imagePreview.querySelectorAll('img').forEach((img) => {
    img.addEventListener('click', () => {
      currentImages.splice(Number(img.dataset.i), 1);
      renderImagePreview();
    });
  });
}

imagesInput.addEventListener('change', async () => {
  const files = Array.from(imagesInput.files || []);
  for (const file of files) {
    try {
      const compressed = await compressImage(file);
      currentImages.push(compressed);
    } catch (e) {
      console.error('image compression failed', e);
    }
  }
  imagesInput.value = '';
  renderImagePreview();
});

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function parseSpecs(text) {
  const specs = {};
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key) specs[key] = value;
    });
  return specs;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formStatus.textContent = 'Speichere …';
  formStatus.className = 'admin-status';

  const payload = {
    id: document.getElementById('p-id').value || undefined,
    name: document.getElementById('p-name').value.trim(),
    tagline: document.getElementById('p-tagline').value.trim(),
    target: document.getElementById('p-target').value.trim(),
    price: parseFloat(document.getElementById('p-price').value),
    currency: document.getElementById('p-currency').value,
    specs: parseSpecs(document.getElementById('p-specs').value),
    images: currentImages,
  };

  try {
    const res = await fetch('/.netlify/functions/admin-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword() },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen.');
    formStatus.textContent = 'Gespeichert.';
    formStatus.className = 'admin-status success';
    await loadProducts();
    setTimeout(closeEditor, 500);
  } catch (err) {
    formStatus.textContent = err.message;
    formStatus.className = 'admin-status error';
  }
});

deleteBtn.addEventListener('click', async () => {
  const id = document.getElementById('p-id').value;
  if (!id) return;
  if (!confirm('Dieses Produkt wirklich löschen?')) return;
  try {
    const res = await fetch('/.netlify/functions/admin-products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword() },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error('Löschen fehlgeschlagen.');
    await loadProducts();
    closeEditor();
  } catch (err) {
    formStatus.textContent = err.message;
    formStatus.className = 'admin-status error';
  }
});
