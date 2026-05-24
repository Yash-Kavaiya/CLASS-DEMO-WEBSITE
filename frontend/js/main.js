/* ─────────────────────────────────────────────
   main.js  –  Home page logic
   ───────────────────────────────────────────── */

const API = 'http://localhost:5000/api';

const CATEGORY_ICONS = {
  Running:    '🏃',
  Basketball: '🏀',
  Football:   '⚽',
  Tennis:     '🎾',
  Swimming:   '🏊',
  Gym:        '🏋️',
  Golf:       '⛳',
  Boxing:     '🥊',
  All:        '🏅'
};

/* ─── Load stats ─── */
async function loadStats() {
  try {
    const res = await fetch(`${API}/stats`);
    const { stats } = await res.json();
    document.getElementById('statProducts').textContent   = stats.total_products;
    document.getElementById('statCategories').textContent = stats.total_categories;
    document.getElementById('statBrands').textContent     = stats.total_brands;
    document.getElementById('statRating').textContent     = stats.avg_rating;
  } catch {
    // backend not running – show placeholder values
    ['statProducts','statCategories','statBrands','statRating'].forEach(id => {
      document.getElementById(id).textContent = '–';
    });
  }
}

/* ─── Load categories ─── */
async function loadCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  try {
    const res = await fetch(`${API}/categories`);
    const { categories } = await res.json();
    grid.innerHTML = categories
      .filter(c => c !== 'All')
      .map(c => `
        <div class="category-card" onclick="window.location.href='products.html?category=${encodeURIComponent(c)}'">
          <div class="cat-icon">${CATEGORY_ICONS[c] || '🏅'}</div>
          <div class="cat-name">${c}</div>
        </div>`
      ).join('');
  } catch {
    grid.innerHTML = `<p style="color:var(--gray)">Could not load categories.</p>`;
  }
}

/* ─── Load featured products ─── */
async function loadFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  try {
    const res = await fetch(`${API}/products?featured=true`);
    const { products } = await res.json();
    if (!products.length) {
      grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><h3>No featured products</h3></div>';
      return;
    }
    grid.innerHTML = products.map(p => productCardHtml(p)).join('');
  } catch {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-plug"></i>
        <h3>Backend Offline</h3>
        <p>Start the Flask server:<br><code>python backend/app.py</code></p>
      </div>`;
  }
}

/* ─── Modal ─── */
async function openModal(id) {
  const overlay = document.getElementById('modalOverlay');
  const body    = document.getElementById('modalBody');
  if (!overlay) return;
  overlay.classList.add('open');
  body.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--accent)"></i></div>';
  try {
    const res = await fetch(`${API}/products/${id}`);
    const { product: p } = await res.json();
    let qty = 1;
    body.innerHTML = `
      <div class="modal-product">
        <div class="modal-product-img">
          <img src="${p.image}" alt="${p.name}"
               onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'" />
        </div>
        <div class="modal-product-info">
          <span class="product-category">${p.category} · ${p.brand}</span>
          <h2 class="product-name">${p.name}</h2>
          <div class="product-rating">
            <span class="stars">${starsHtml(p.rating)}</span>
            <span class="review-count">${p.rating} (${p.reviews} reviews)</span>
          </div>
          <div class="product-price">
            <span class="price-current">$${p.price.toFixed(2)}</span>
            ${p.originalPrice > p.price ? `<span class="price-original">$${p.originalPrice.toFixed(2)}</span>` : ''}
            ${p.discount > 0 ? `<span class="badge-discount" style="position:static">-${p.discount}%</span>` : ''}
          </div>
          <p class="modal-desc">${p.description}</p>
          <div class="modal-meta">
            ${p.stock === 0
              ? '<span class="stock-badge out-of-stock">Out of Stock</span>'
              : p.stock <= 5
                ? `<span class="stock-badge low-stock">Only ${p.stock} left</span>`
                : `<span class="stock-badge in-stock">In Stock (${p.stock})</span>`}
          </div>
          <div class="modal-qty" id="modalQtyWrap">
            <button onclick="modalQtyChange(-1, ${p.stock})">–</button>
            <span id="modalQty">1</span>
            <button onclick="modalQtyChange(1, ${p.stock})">+</button>
          </div>
          <button class="btn-add-cart" style="margin-top:8px"
                  ${p.stock === 0 ? 'disabled' : ''}
                  onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')}, parseInt(document.getElementById('modalQty').textContent))">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>`;
  } catch {
    body.innerHTML = '<p style="padding:20px;color:var(--gray)">Could not load product details.</p>';
  }
}

function modalQtyChange(delta, stock) {
  const el  = document.getElementById('modalQty');
  const cur = parseInt(el.textContent);
  el.textContent = Math.max(1, Math.min(cur + delta, stock));
}

function closeModal() {
  document.getElementById('modalOverlay')?.classList.remove('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ─── Boot ─── */
loadStats();
loadCategories();
loadFeatured();
