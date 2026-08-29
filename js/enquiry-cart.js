(() => {
  const STORAGE_KEY = 'concreteIdeasEnquiry';
  const getCart = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  };
  const saveCart = (cart) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCount();
    document.dispatchEvent(new CustomEvent('concreteideas:cart-updated', { detail: cart }));
  };
  const totalItems = (cart = getCart()) => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const updateCount = () => {
    const count = totalItems();
    document.querySelectorAll('[data-enquiry-count]').forEach((el) => {
      el.textContent = count;
      el.hidden = count === 0;
    });
    document.querySelectorAll('[data-enquiry-label]').forEach((el) => {
      el.textContent = count ? `Enquiry (${count})` : 'Enquiry';
    });
  };
  const normalizeProduct = (product, size) => ({
    id: product.id,
    name: product.name,
    image: product.image || (Array.isArray(product.images) ? product.images[0] : ''),
    sizeId: size?.id || 'standard',
    sizeName: size?.name || 'Standard',
    dimensions: size?.dimensions || product.dimensions || '',
    quantity: 1
  });
  const itemKey = (item) => `${item.id}::${item.sizeId || 'standard'}`;
  const migrateLegacyItems = (cart) => cart.map((item) => item.sizeId ? item : ({ ...item, sizeId: 'standard', sizeName: 'Standard', dimensions: item.dimensions || '' }));
  const addItem = (product, size, quantity = 1) => {
    const cart = migrateLegacyItems(getCart());
    const next = normalizeProduct(product, size);
    const existing = cart.find((item) => itemKey(item) === itemKey(next));
    if (existing) existing.quantity += quantity;
    else cart.push({ ...next, quantity });
    saveCart(cart);
    showToast(`${product.name} — ${next.sizeName} added to your enquiry.`);
  };
  const updateQuantity = (key, quantity) => {
    const cart = migrateLegacyItems(getCart());
    const item = cart.find((entry) => itemKey(entry) === key);
    if (!item) return;
    item.quantity = Math.max(1, Number(quantity) || 1);
    saveCart(cart);
  };
  const removeItem = (key) => saveCart(migrateLegacyItems(getCart()).filter((item) => itemKey(item) !== key));
  const clear = () => saveCart([]);

  function showToast(message) {
    let toast = document.querySelector('[data-enquiry-toast]');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'enquiry-toast';
      toast.setAttribute('data-enquiry-toast', '');
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  document.addEventListener('click', (event) => {
    const addButton = event.target.closest('[data-add-to-enquiry]');
    if (addButton) {
      event.preventDefault();
      try {
        const product = JSON.parse(addButton.dataset.product);
        const size = addButton.dataset.size ? JSON.parse(addButton.dataset.size) : null;
        addItem(product, size);
      } catch (_) {}
      return;
    }
    const action = event.target.closest('[data-enquiry-action]');
    if (!action) return;
    const key = action.dataset.key;
    if (action.dataset.enquiryAction === 'increase') updateQuantity(key, migrateLegacyItems(getCart()).find((item) => itemKey(item) === key)?.quantity + 1);
    if (action.dataset.enquiryAction === 'decrease') updateQuantity(key, (migrateLegacyItems(getCart()).find((item) => itemKey(item) === key)?.quantity || 1) - 1);
    if (action.dataset.enquiryAction === 'remove') removeItem(key);
    if (action.dataset.enquiryAction === 'clear') clear();
  });

  window.ConcreteIdeasEnquiry = { getCart, addItem, updateQuantity, removeItem, clear, totalItems, itemKey };
  updateCount();
})();
