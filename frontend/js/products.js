/* ─────────────────────────────────────────────
   products.js  –  Products page logic
   ───────────────────────────────────────────── */

const API = 'http://localhost:5000/api';

let allProducts = [];
let activeCategory = null;
let activeBrands   = new Set();
let minPrice = null;
let maxPrice = null;
let minRating = 0;

/* ─── Bootstrap ─── */
(async function init() {
  const params = new URLSearchParams(window.location.search);
  const preCategory = params.get('category');
  const preSearch   = params.get('search');

  if (preSearch) document.getElementById('navSearch').value = preSearch;

  await Promise.all([loadFilters(preCategory), loadProducts(preSearch, preCategory)]);
})();

/* ─── Load filter options ─── */
async function loadFilters(preCategory) {
  try {
    const [catRes, brandRes] = await Promise.all([
      fetch(`${API}/categories`),
      fetch(`${API}/brands`)
    ]);
    const { categories } = await catRes.json();
    const { brands }     = await brandRes.json();

    const catWrap = document.getElementById('categoryFilters');
    catWrap.innerHTML = categories.filter(c => c !== 'All').map(c => `
      <label class="filter-checkbox">
        <input type="checkbox" value="${c}" onchange="toggleCategory(this)"
               ${c === preCategory ? 'checked' : ''} />
        ${c}
      </label>`).join('');

    if (preCategory) activeCategory = preCategory;

    const brandWrap = document.getElementById('brandFilters');
    brandWrap.innerHTML = brands.map(b => `
      <label class="filter-checkbox">
        <input type="checkbox" value="${b}" onchange="toggleBrand(this)" />
        ${b}
      </label>`).join('');
  } catch {
    // filters unavailable silently
  }
}

/* ─── Load / Render products ─── */
async function loadProducts(search, category) {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading products...</div>';

  try {
    const params = new URLSearchParams();
    const q     = search || document.getElementById('navSearch')?.value.trim();
    const sort  = document.getElementById('sortSelect')?.value || 'default';

    if (q)              params.set('search',   q);
    if (activeCategory) params.set('category', activeCategory);
    if (minPrice != null) params.set('min_price', minPrice);
    if (maxPrice != null) params.set('max_price', maxPrice);
    if (sort !== 'default') params.set('sort', sort);

    const res = await fetch(`${API}/products?${params}`);
    let { products } = await res.json();

    // client-side brand & rating filters (not sent to API to keep it flexible)
    if (activeBrands.size)   products = products.filter(p => activeBrands.has(p.brand));
    if (minRating > 0)        products = products.filter(p => p.rating >= minRating);

    allProducts = products;
    renderProducts(products);
  } catch {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-plug"></i>
        <h3>Backend Offline</h3>
        <p>Start the Flask server to see products:<br>
           <code style="font-size:0.85rem">cd backend &amp;&amp; python app.py</code>
        </p>
      </div>`;
    document.getElementById('resultCount').textContent = 'Server offline';
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  document.getElementById('resultCount').textContent =
    `${products.length} product${products.length !== 1 ? 's' : ''} found`;

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No products found</h3>
        <p>Try adjusting your filters or search term.</p>
      </div>`;
    return;
  }
  grid.innerHTML = products.map(p => productCardHtml(p)).join('');
}

/* ─── Filter helpers ─── */
function toggleCategory(cb) {
  // single-select category
  document.querySelectorAll('#categoryFilters input[type=checkbox]').forEach(el => {
    if (el !== cb) el.checked = false;
  });
  activeCategory = cb.checked ? cb.value : null;
  applyFilters();
}

function toggleBrand(cb) {
  cb.checked ? activeBrands.add(cb.value) : activeBrands.delete(cb.value);
  renderProducts(allProducts.filter(p =>
    (!activeBrands.size || activeBrands.has(p.brand)) &&
    (p.rating >= minRating)
  ));
  // also refetch for accurate count
  applyFilters();
}

function applyPriceFilter() {
  minPrice = parseFloat(document.getElementById('minPrice').value) || null;
  maxPrice = parseFloat(document.getElementById('maxPrice').value) || null;
  applyFilters();
}

function updateRatingLabel(val) {
  minRating = parseFloat(val);
  document.getElementById('ratingLabel').textContent = val == 0 ? 'Any' : `${val}+`;
}

function applyFilters() {
  const search = document.getElementById('navSearch')?.value.trim();
  loadProducts(search);
}

function clearFilters() {
  activeCategory = null;
  activeBrands.clear();
  minPrice = null;
  maxPrice = null;
  minRating = 0;
  document.querySelectorAll('.filter-checkbox input').forEach(el => el.checked = false);
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  document.getElementById('minRating').value = 0;
  document.getElementById('ratingLabel').textContent = 'Any';
  document.getElementById('navSearch').value = '';
  document.getElementById('sortSelect').value = 'default';
  loadProducts();
}

/* ─── Modal (shared with main.js pattern) ─── */
async function openModal(id) {
  const overlay = document.getElementById('modalOverlay');
  const body    = document.getElementById('modalBody');
  overlay.classList.add('open');
  body.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--accent)"></i></div>';

  try {
    const res = await fetch(`${API}/products/${id}`);
    const { product: p } = await res.json();
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
          <div class="modal-qty">
            <button onclick="modalQtyChange(-1, ${p.stock})">–</button>
            <span id="modalQty">1</span>
            <button onclick="modalQtyChange(1, ${p.stock})">+</button>
          </div>
          <button class="btn-add-cart" style="margin-top:8px" ${p.stock === 0 ? 'disabled' : ''}
                  onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')}, parseInt(document.getElementById('modalQty').textContent))">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>`;
  } catch {
    body.innerHTML = '<p style="padding:20px;color:var(--gray)">Could not load product.</p>';
  }
}

function modalQtyChange(delta, stock) {
  const el = document.getElementById('modalQty');
  el.textContent = Math.max(1, Math.min(parseInt(el.textContent) + delta, stock));
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
