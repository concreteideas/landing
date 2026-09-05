(() => {
  const detail = document.querySelector('[data-product-detail]');
  if (!detail) return;
  const { loadJson } = window.ConcreteIdeasData;
  const id = new URLSearchParams(window.location.search).get('id');
  const productUrl = (productId) => `product.html?id=${encodeURIComponent(productId)}`;
  const showError = () => { detail.innerHTML = '<p class="products-empty">We could not find this piece. <a href="index.html">Return to the collection.</a></p>'; };
  const categoriesFor = (product) => Array.isArray(product.category) ? product.category : product.category ? [product.category] : [];
  const productImages = (product) => {
    const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    if (images.length) return images;
    const image = product.image || product.hero;
    return image ? [image] : [];
  };
  const productImage = (product) => productImages(product)[0] || '';

  loadJson('../data/products.json')
    .then((products) => {
      const product = products.find((item) => item.id === id);
      if (!product) return showError();
      document.title = `${product.name} | Concrete Ideas`;
      document.querySelector('[data-breadcrumb-name]').textContent = product.name;
      const categories = categoriesFor(product);
      const images = productImages(product);
      const specifications = [
        ['Material', product.materials, '../manufacturing/index.html', 'View materials'],
        ['Reinforcement', product.reinforcement],
        ['Finish', product.finish, '../textures/index.html', 'View curated finishes']
      ].filter(([, value]) => value).map(([label, value, href, linkLabel]) => `<div><dt>${label}</dt><dd><span>${value}</span>${href ? ` <a class="product-specs__link" href="${href}">${linkLabel} <span aria-hidden="true">→</span></a>` : ''}</dd></div>`).join('');
      const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : [{ id: 'standard', name: 'Standard', dimensions: product.dimensions || 'Project specific' }];
      const defaultSize = sizes.find((size) => size.id === 'medium') || sizes[0];
      const pendingQuantities = Object.fromEntries(sizes.map((size) => [size.id, 0]));
      const sizeOptions = sizes.map((size) => {
        const quantity = pendingQuantities[size.id] || 0;
        return `<div class="product-size__option" data-size-id="${size.id}">
          <div class="product-size__info"><span class="product-size__name">${size.name}</span><span class="product-size__dimensions"><strong>Dimension:</strong> ${size.dimensions}</span><span class="product-size__weight"><strong>Weight:</strong> ${size.weight || 'To be confirmed'}</span></div>
          <div class="product-size__quantity" aria-label="Quantity of ${size.name}">
            <button type="button" class="product-size__quantity-btn" data-product-size-decrease="${size.id}" aria-label="Decrease ${size.name} quantity">−</button>
            <span class="product-size__quantity-value" data-product-size-count="${size.id}" aria-live="polite">${quantity}</span>
            <button type="button" class="product-size__quantity-btn" data-product-size-increase="${size.id}" aria-label="Increase ${size.name} quantity">+</button>
          </div>
        </div>`;
      }).join('');
      const galleryThumbs = images.length > 1 ? images.map((image, index) => `<button type="button" class="product-detail__gallery-thumb ${index === 0 ? 'is-active' : ''}" data-product-image-index="${index}" aria-label="View image ${index + 1}"><img src="${image}" alt="${product.name} ${index + 1}" loading="lazy" /></button>`).join('') : '';
      detail.innerHTML = `
        <div class="product-detail__gallery">
          <div class="product-detail__gallery-main"><img src="${images[0] || productImage(product)}" alt="${product.name}" data-product-main-image /></div>
          ${galleryThumbs ? `<div class="product-detail__gallery-thumbs">${galleryThumbs}</div>` : ''}
        </div>
        <div class="product-detail__content"><p class="site-eyebrow">${categories.join(' / ')}</p><h1>${product.name}</h1><p class="product-detail__intro">${product.description}</p>
          ${specifications ? `<dl class="product-specs">${specifications}</dl>` : ''}
          <div class="product-size"><div class="product-size__heading"><div><p class="site-eyebrow">Available sizes</p><h2>Select quantities</h2></div><a class="product-size__view-enquiry" href="../enquiry/index.html">View enquiry <span aria-hidden="true">→</span></a></div><div class="product-size__options" role="group" aria-label="Available sizes">${sizeOptions}</div><div class="product-size__footer"><button type="button" class="product-size__add-button" data-add-selected-to-enquiry disabled>Add to enquiry <span aria-hidden="true">→</span></button><span class="product-size__add-status" data-add-status aria-live="polite"></span></div></div>
        </div>`;
      const addButton = detail.querySelector('[data-add-selected-to-enquiry]');
      const statusEl = detail.querySelector('[data-add-status]');
      const refreshPendingCounts = () => {
        let total = 0;
        sizes.forEach((size) => {
          const count = pendingQuantities[size.id] || 0;
          total += count;
          const countEl = detail.querySelector(`[data-product-size-count="${size.id}"]`);
          if (countEl) countEl.textContent = count;
        });
        addButton.disabled = total === 0;
        addButton.classList.toggle('is-ready', total > 0);
        addButton.innerHTML = total > 0 ? `Add ${total} ${total === 1 ? 'piece' : 'pieces'} to enquiry <span aria-hidden="true">→</span>` : 'Add to enquiry <span aria-hidden="true">→</span>';
      };
      detail.querySelectorAll('[data-product-size-increase], [data-product-size-decrease]').forEach((button) => {
        button.addEventListener('click', () => {
          const sizeId = button.dataset.productSizeIncrease || button.dataset.productSizeDecrease;
          const current = pendingQuantities[sizeId] || 0;
          pendingQuantities[sizeId] = button.dataset.productSizeIncrease ? current + 1 : Math.max(0, current - 1);
          statusEl.textContent = '';
          refreshPendingCounts();
        });
      });
      addButton.addEventListener('click', () => {
        let added = 0;
        sizes.forEach((size) => {
          const quantity = pendingQuantities[size.id] || 0;
          if (!quantity) return;
          window.ConcreteIdeasEnquiry.addItem(product, size, quantity);
          added += quantity;
          pendingQuantities[size.id] = 0;
        });
        if (added) {
          statusEl.textContent = `${added} ${added === 1 ? 'piece' : 'pieces'} added to your enquiry.`;
          refreshPendingCounts();
        }
      });
      refreshPendingCounts();

      if (images.length > 1) {
        const mainImage = detail.querySelector('[data-product-main-image]');
        detail.querySelectorAll('[data-product-image-index]').forEach((button) => {
          button.addEventListener('click', () => {
            const nextIndex = Number(button.dataset.productImageIndex);
            if (!images[nextIndex]) return;
            mainImage.src = images[nextIndex];
            mainImage.alt = `${product.name} ${nextIndex + 1}`;
            detail.querySelectorAll('[data-product-image-index]').forEach((thumb) => thumb.classList.toggle('is-active', thumb === button));
          });
        });
      }
      const related = products.filter((item) => item.id !== product.id && categoriesFor(item).some((category) => categories.includes(category))).slice(0, 3);
      document.querySelector('[data-related-products]').innerHTML = related.map((item) => `
        <article class="product-card"><a class="product-card__image" href="${productUrl(item.id)}"><img src="${productImage(item)}" alt="${item.name}" loading="lazy"></a><div class="product-card__body"><p class="product-card__category">${categoriesFor(item).join(' / ')}</p><h3><a href="${productUrl(item.id)}">${item.name}</a></h3><div class="product-card__actions"><a class="product-card__link" href="${productUrl(item.id)}">View piece <span aria-hidden="true">→</span></a><a class="product-card__enquiry" href="${productUrl(item.id)}">Select size <span aria-hidden="true">→</span></a></div></div></article>`).join('');
    })
    .catch(showError);
})();
