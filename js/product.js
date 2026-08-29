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
        ['Material', product.materials],
        ['Reinforcement', product.reinforcement],
        ['Weight', product.weight],
        ['Finish', product.finish]
      ].filter(([, value]) => value).map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
      const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : [{ id: 'standard', name: 'Standard', dimensions: product.dimensions || 'Project specific' }];
      const defaultSize = sizes.find((size) => size.id === 'medium') || sizes[0];
      const sizeOptions = sizes.map((size) => { const active = size.id === defaultSize.id; return `<button type="button" class="product-size__option ${active ? 'is-active' : ''}" data-product-size='${JSON.stringify(size).replace(/'/g, '&#39;')}' aria-pressed="${active}"><span class="product-size__name">${size.name}</span><span class="product-size__dimensions">${size.dimensions}</span></button>`; }).join('');
      const galleryThumbs = images.length > 1 ? images.map((image, index) => `<button type="button" class="product-detail__gallery-thumb ${index === 0 ? 'is-active' : ''}" data-product-image-index="${index}" aria-label="View image ${index + 1}"><img src="${image}" alt="${product.name} ${index + 1}" loading="lazy" /></button>`).join('') : '';
      detail.innerHTML = `
        <div class="product-detail__gallery">
          <div class="product-detail__gallery-main"><img src="${images[0] || productImage(product)}" alt="${product.name}" data-product-main-image /></div>
          ${galleryThumbs ? `<div class="product-detail__gallery-thumbs">${galleryThumbs}</div>` : ''}
        </div>
        <div class="product-detail__content"><p class="site-eyebrow">${categories.join(' / ')}</p><h1>${product.name}</h1><p class="product-detail__intro">${product.description}</p>
          ${specifications ? `<dl class="product-specs">${specifications}</dl>` : ''}
          <div class="product-size"><div class="product-size__heading"><div><p class="site-eyebrow">Available sizes</p><h2>Select a size</h2></div><span class="product-size__selected" data-selected-size-name>${defaultSize.name}</span></div><div class="product-size__options" role="group" aria-label="Available sizes">${sizeOptions}</div></div>
          <button class="main-btn product-detail__enquiry" type="button" data-add-to-enquiry data-product='${JSON.stringify(product).replace(/'/g, '&#39;')}' data-size='${JSON.stringify(defaultSize).replace(/'/g, '&#39;')}'>Add to enquiry <span aria-hidden="true">+</span></button>
        </div>`;
      const addButton = detail.querySelector('[data-add-to-enquiry]');
      detail.querySelectorAll('[data-product-size]').forEach((button) => {
        button.addEventListener('click', () => {
          const size = JSON.parse(button.dataset.productSize);
          detail.querySelectorAll('[data-product-size]').forEach((option) => {
            const active = option === button;
            option.classList.toggle('is-active', active);
            option.setAttribute('aria-pressed', String(active));
          });
          detail.querySelector('[data-selected-size-name]').textContent = size.name;
          addButton.dataset.size = JSON.stringify(size);
        });
      });
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
