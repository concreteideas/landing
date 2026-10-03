(() => {
  const root = document.querySelector('[data-enquiry-content]');
  if (!root || !window.ConcreteIdeasEnquiry) return;
  const cart = window.ConcreteIdeasEnquiry;
  // Keep the deployed endpoint from the current site if the project uses the existing URL.
  const endpoint = window.CONCRETE_IDEAS_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxqEDxs5d11NWNhHDeuiGfdF-CyPAI1rbpHgAtM-Vnti_fHIj855-zwmg_FvWrfeDQF/exec';
  const money = (n) => `₹${Math.round(Number(n || 0)).toLocaleString('en-IN')}`;
  const escapeHtml = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const productUrl = (id) => `../products/product.html?id=${encodeURIComponent(id)}`;
  const renderItems = (items) => items.map((item) => {
    const line = Number(item.rate || 0) * Number(item.quantity || 0);
    return `<article class="enquiry-item">
      <a class="enquiry-item__image" href="${productUrl(item.id)}"><img src="${item.image || '../brand/icon.png'}" alt="${escapeHtml(item.name)}" loading="lazy"></a>
      <div class="enquiry-item__info"><p class="enquiry-item__eyebrow">${escapeHtml(item.sizeName || 'Standard')}</p><h3><a href="${productUrl(item.id)}">${escapeHtml(item.name)}</a></h3><p class="enquiry-item__dimensions"><strong>Dimension:</strong> ${escapeHtml(item.dimensions || 'To be confirmed')}<br><strong>Weight:</strong> ${escapeHtml(item.weight || 'To be confirmed')}</p><p class="enquiry-item__unit-price">${money(item.rate)} / piece</p><button class="enquiry-remove" type="button" data-enquiry-action="remove" data-key="${escapeHtml(cart.itemKey(item))}">Remove</button></div>
      <div class="enquiry-item__pricing"><div class="enquiry-quantity"><button type="button" data-enquiry-action="decrease" data-key="${escapeHtml(cart.itemKey(item))}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-enquiry-action="increase" data-key="${escapeHtml(cart.itemKey(item))}" aria-label="Increase quantity">+</button></div><strong>${money(line)}</strong></div>
    </article>`;
  }).join('');
  const render = () => {
    const items = cart.getCart();
    if (!items.length) { root.innerHTML = `<div class="enquiry-empty"><p class="site-eyebrow">Your cart is empty</p><h2>Build your collection.</h2><p>Choose the pieces and quantities you need, then return here to place your order.</p><a class="site-button site-button--primary" href="../products/index.html">Explore products <span aria-hidden="true">→</span></a></div>`; return; }
    const count = cart.totalItems(items), sub = cart.subtotal(items), ship = cart.shipping(items), total = cart.total(items);
    root.innerHTML = `<div class="enquiry-layout"><div class="enquiry-list"><div class="enquiry-list__heading"><div><p class="site-eyebrow">Your cart</p><h2>${count} ${count===1?'piece':'pieces'}</h2></div><button class="enquiry-clear" type="button" data-enquiry-action="clear">Clear cart</button></div><div>${renderItems(items)}</div></div><aside class="enquiry-summary"><p class="site-eyebrow">Order summary</p><h2>Ready to place your order?</h2><div class="cart-totals"><div><span>Products</span><strong>${money(sub)}</strong></div><div><span>Shipment · 5%</span><strong>${money(ship)}</strong></div><div class="cart-total"><span>Total</span><strong>${money(total)}</strong></div></div><p class="enquiry-summary__note">Shipment is calculated at 5% of the product value. Your order total is shown above before you confirm.</p><a class="site-button site-button--primary enquiry-summary__button" href="../order/index.html">Place order <span aria-hidden="true">→</span></a><a class="enquiry-summary__continue" href="../products/index.html">Continue shopping</a></aside></div>`;
  };
  document.addEventListener('concreteideas:cart-updated', render);
  render();
})();
