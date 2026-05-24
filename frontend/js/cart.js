/* ─────────────────────────────────────────────
   cart.js  –  Shared cart logic (all pages)
   ───────────────────────────────────────────── */

const CART_KEY = 'sportzone_cart';

/* ── Read / Write ── */
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

/* ── Badge ── */
function updateCartBadge() {
  const total = getCart().reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cartBadge, #cartBadgeMobile').forEach(el => {
    el.textContent = total;
  });
}

/* ── Add item ── */
function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, product.stock);
  } else {
    cart.push({ ...product, qty: Math.min(qty, product.stock) });
  }
  saveCart(cart);
  showToast(`<i class="fas fa-check"></i> "${product.name}" added to cart`, 'success');
}

/* ── Remove item ── */
function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}

/* ── Update qty ── */
function updateCartQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, Math.min(item.qty + delta, item.stock));
  saveCart(cart);
}

/* ── Clear ── */
function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

/* ── Toast ── */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = msg;
  t.className = `toast show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ── Nav search ── */
function handleNavSearch() {
  const q = document.getElementById('navSearch')?.value.trim();
  if (q) window.location.href = `products.html?search=${encodeURIComponent(q)}`;
}
document.getElementById('navSearch')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleNavSearch();
});

/* ── Mobile menu ── */
function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('open');
}

/* ── Stars HTML ── */
function starsHtml(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let s = '';
  for (let i = 0; i < full; i++) s += '<i class="fas fa-star"></i>';
  if (half) s += '<i class="fas fa-star-half-alt"></i>';
  const empty = 5 - full - (half ? 1 : 0);
  for (let i = 0; i < empty; i++) s += '<i class="far fa-star"></i>';
  return s;
}

/* ── Product card HTML ── */
function productCardHtml(p) {
  const inCart = getCart().some(i => i.id === p.id);
  const stockBadge = p.stock === 0
    ? '<span class="stock-badge out-of-stock">Out of Stock</span>'
    : p.stock <= 5
      ? `<span class="stock-badge low-stock">Only ${p.stock} left</span>`
      : `<span class="stock-badge in-stock">In Stock</span>`;

  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'" />
        ${p.discount > 0 ? `<span class="badge-discount">-${p.discount}%</span>` : ''}
        ${p.featured ? '<span class="badge-featured"><i class="fas fa-fire"></i> Hot</span>' : ''}
        <button class="quick-view-btn" onclick="openModal(${p.id})">
          <i class="fas fa-eye"></i> Quick View
        </button>
      </div>
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-rating">
          <span class="stars">${starsHtml(p.rating)}</span>
          <span class="review-count">(${p.reviews})</span>
        </div>
        <div class="product-price">
          <span class="price-current">$${p.price.toFixed(2)}</span>
          ${p.originalPrice > p.price ? `<span class="price-original">$${p.originalPrice.toFixed(2)}</span>` : ''}
        </div>
      </div>
      <div class="product-actions">
        <button class="btn-add-cart" onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})"
                ${p.stock === 0 ? 'disabled' : ''}>
          <i class="fas fa-shopping-cart"></i> ${p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
        <button class="btn-wishlist" onclick="toggleWishlist(this, ${p.id})"
                title="Wishlist">
          <i class="fas fa-heart"></i>
        </button>
      </div>
    </div>`;
}

/* ── Wishlist (local only) ── */
function toggleWishlist(btn, id) {
  btn.classList.toggle('active');
  const active = btn.classList.contains('active');
  showToast(active ? '<i class="fas fa-heart"></i> Added to wishlist' : 'Removed from wishlist',
            active ? 'success' : '');
}

/* ── Init badge on page load ── */
updateCartBadge();
