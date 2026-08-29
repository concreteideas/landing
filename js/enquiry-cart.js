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
  const addItem = (product, quantity = 1) => {
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += quantity;
    else cart.push({ id: product.id, name: product.name, image: product.image || (Array.isArray(product.images) ? product.images[0] : ''), quantity });
    saveCart(cart);
    showToast(`${product.name} added to your enquiry.`);
  };
  const updateQuantity = (id, quantity) => {
    const cart = getCart();
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    item.quantity = Math.max(1, Number(quantity) || 1);
    saveCart(cart);
  };
  const removeItem = (id) => saveCart(getCart().filter((item) => item.id !== id));
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
      try { addItem(JSON.parse(addButton.dataset.product)); } catch (_) {}
      return;
    }
    const action = event.target.closest('[data-enquiry-action]');
    if (!action) return;
    const id = action.dataset.id;
    if (action.dataset.enquiryAction === 'increase') updateQuantity(id, getCart().find((item) => item.id === id)?.quantity + 1);
    if (action.dataset.enquiryAction === 'decrease') updateQuantity(id, (getCart().find((item) => item.id === id)?.quantity || 1) - 1);
    if (action.dataset.enquiryAction === 'remove') removeItem(id);
    if (action.dataset.enquiryAction === 'clear') clear();
  });

  window.ConcreteIdeasEnquiry = { getCart, addItem, updateQuantity, removeItem, clear, totalItems };
  updateCount();
})();
