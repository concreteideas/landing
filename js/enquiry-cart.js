(() => {
  const STORAGE_KEY = 'concreteIdeasCart';
  const SHIPPING_RATE = 0.05;
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
  const subtotal = (cart = getCart()) => cart.reduce((sum, item) => sum + Number(item.rate || 0) * Number(item.quantity || 0), 0);
  const shipping = (cart = getCart()) => subtotal(cart) * SHIPPING_RATE;
  const total = (cart = getCart()) => subtotal(cart) + shipping(cart);
  const updateCount = () => {
    const count = totalItems();
    document.querySelectorAll('[data-enquiry-count], [data-cart-count]').forEach((el) => { el.textContent = count; el.hidden = count === 0; });
    document.querySelectorAll('[data-enquiry-label], [data-cart-label]').forEach((el) => { el.textContent = count ? `Cart (${count})` : 'Cart'; });
  };
  const normalizeProduct = (product, size) => ({
    id: product.id, name: product.name,
    image: product.image || (Array.isArray(product.images) ? product.images[0] : ''),
    sizeId: size?.id || 'standard', sizeName: size?.name || 'Standard',
    dimensions: size?.dimensions || product.dimensions || '', weight: size?.weight || 'To be confirmed',
    rate: Number(size?.rate ?? product.rate ?? 0), quantity: 1
  });
  const itemKey = (item) => `${item.id}::${item.sizeId || 'standard'}`;
  const migrateLegacyItems = (cart) => cart.map((item) => item.sizeId ? item : ({ ...item, sizeId:'standard', sizeName:'Standard', dimensions:item.dimensions || '', rate:Number(item.rate || 0) }));
  const addItem = (product, size, quantity = 1) => {
    const cart = migrateLegacyItems(getCart()); const next = normalizeProduct(product, size);
    if (!(next.rate > 0)) { showToast('This size is currently available on request.'); return false; }
    const existing = cart.find((item) => itemKey(item) === itemKey(next));
    if (existing) existing.quantity += quantity; else cart.push({ ...next, quantity });
    saveCart(cart); showToast(`${product.name} — ${next.sizeName} added to your cart.`); return true;
  };
  const updateQuantity = (key, quantity) => { const cart=migrateLegacyItems(getCart()); const item=cart.find(e=>itemKey(e)===key); if(!item)return; const q=Math.max(0,Number(quantity)||0); if(!q){saveCart(cart.filter(e=>itemKey(e)!==key));return;} item.quantity=q; saveCart(cart); };
  const removeItem = (key) => saveCart(migrateLegacyItems(getCart()).filter((item) => itemKey(item) !== key));
  const clear = () => saveCart([]);
  const getVariantQuantity = (productId, sizeId='standard') => Number(migrateLegacyItems(getCart()).find(i=>i.id===productId&&(i.sizeId||'standard')===sizeId)?.quantity||0);
  function showToast(message){let toast=document.querySelector('[data-enquiry-toast]');if(!toast){toast=document.createElement('div');toast.className='enquiry-toast';toast.setAttribute('data-enquiry-toast','');document.body.appendChild(toast);}toast.textContent=message;toast.classList.add('is-visible');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('is-visible'),2400);}
  document.addEventListener('click',(event)=>{const action=event.target.closest('[data-enquiry-action]');if(!action)return;const key=action.dataset.key;const item=migrateLegacyItems(getCart()).find(i=>itemKey(i)===key);if(action.dataset.enquiryAction==='increase')updateQuantity(key,(item?.quantity||0)+1);if(action.dataset.enquiryAction==='decrease')updateQuantity(key,(item?.quantity||1)-1);if(action.dataset.enquiryAction==='remove')removeItem(key);if(action.dataset.enquiryAction==='clear')clear();});
  window.ConcreteIdeasEnquiry={getCart,addItem,updateQuantity,removeItem,clear,totalItems,subtotal,shipping,total,itemKey,getVariantQuantity,SHIPPING_RATE};
  updateCount();
})();
