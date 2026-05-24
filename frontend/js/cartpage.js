/* ─────────────────────────────────────────────
   cartpage.js  –  Cart page logic
   ───────────────────────────────────────────── */

const COUPON_CODES = { SPORT10: 10, SAVE20: 20, ZONE5: 5 };
let appliedDiscount = 0;

/* ─── Render ─── */
function renderCart() {
  const cart    = getCart();
  const section = document.getElementById('cartItemsSection');
  const summary = document.getElementById('orderSummary');

  if (!cart.length) {
    section.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-cart"></i>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <a href="products.html" class="btn btn-primary">
          <i class="fas fa-arrow-left"></i> Start Shopping
        </a>
      </div>`;
    if (summary) summary.style.display = 'none';
    return;
  }

  if (summary) summary.style.display = 'block';

  section.innerHTML = cart.map(item => `
    <div class="cart-item-card" id="cartItem-${item.id}">
      <div class="cart-item-img">
        <img src="${item.image}" alt="${item.name}"
             onerror="this.src='https://via.placeholder.com/90x90?text=N/A'" />
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-brand">${item.brand} · ${item.category}</div>
        <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">–</button>
        <span class="qty-display" id="qty-${item.id}">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, +1)">+</button>
      </div>
      <div class="cart-item-total" id="total-${item.id}">
        $${(item.price * item.qty).toFixed(2)}
      </div>
      <button class="cart-item-remove" onclick="removeItem(${item.id})" title="Remove">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>`
  ).join('');

  updateSummary();
}

/* ─── Qty change ─── */
function changeQty(id, delta) {
  updateCartQty(id, delta);
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return renderCart();

  const qtyEl   = document.getElementById(`qty-${id}`);
  const totalEl = document.getElementById(`total-${id}`);
  if (qtyEl)   qtyEl.textContent   = item.qty;
  if (totalEl) totalEl.textContent = `$${(item.price * item.qty).toFixed(2)}`;

  updateSummary();
}

/* ─── Remove ─── */
function removeItem(id) {
  removeFromCart(id);
  document.getElementById(`cartItem-${id}`)?.remove();
  const cart = getCart();
  if (!cart.length) renderCart();
  else updateSummary();
  showToast('<i class="fas fa-trash"></i> Item removed', 'error');
}

/* ─── Summary ─── */
function updateSummary() {
  const cart = getCart();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = subtotal * appliedDiscount / 100;
  const shipping = subtotal > 75 ? 0 : 9.99;
  const total    = subtotal - discount + shipping;
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  document.getElementById('summaryItemCount').textContent = itemCount;
  document.getElementById('summarySubtotal').textContent  = `$${subtotal.toFixed(2)}`;
  document.getElementById('summaryShipping').textContent  =
    shipping === 0 ? 'Free 🎉' : `$${shipping.toFixed(2)}`;
  document.getElementById('summaryTotal').textContent     = `$${total.toFixed(2)}`;

  const discountRow = document.getElementById('discountRow');
  if (appliedDiscount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('summaryDiscount').textContent = `-$${discount.toFixed(2)}`;
  } else {
    discountRow.style.display = 'none';
  }
}

/* ─── Coupon ─── */
function applyCoupon() {
  const code    = document.getElementById('couponInput').value.trim().toUpperCase();
  const msgEl   = document.getElementById('couponMsg');
  const discount = COUPON_CODES[code];

  if (!code) {
    msgEl.textContent = 'Please enter a coupon code.';
    msgEl.className = 'coupon-msg error';
    return;
  }
  if (discount == null) {
    msgEl.textContent = 'Invalid coupon code.';
    msgEl.className = 'coupon-msg error';
    appliedDiscount = 0;
  } else {
    appliedDiscount = discount;
    msgEl.textContent = `✓ Coupon applied! ${discount}% off`;
    msgEl.className = 'coupon-msg success';
    showToast(`<i class="fas fa-tag"></i> ${discount}% discount applied!`, 'success');
  }
  updateSummary();
}
document.getElementById('couponInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') applyCoupon();
});

/* ─── Checkout ─── */
function checkout() {
  const cart = getCart();
  if (!cart.length) return;
  const orderId = 'SZ-' + Date.now().toString(36).toUpperCase();
  document.getElementById('orderId').textContent = orderId;
  document.getElementById('checkoutModal').classList.add('open');
  clearCart();
  renderCart();
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('open');
}

/* ─── Nav search redirect ─── */
function handleNavSearch() {
  const q = document.getElementById('navSearch')?.value.trim();
  if (q) window.location.href = `products.html?search=${encodeURIComponent(q)}`;
}

/* ─── Mobile menu ─── */
function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('open');
}

/* ─── Init ─── */
renderCart();
