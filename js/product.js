(() => {
  const detail = document.querySelector('[data-product-detail]');
  if (!detail) return;
  const { loadJson } = window.ConcreteIdeasData;
  const id = new URLSearchParams(window.location.search).get('id');
  const productUrl = (productId) => `product.html?id=${encodeURIComponent(productId)}`;
  const showError = () => { detail.innerHTML = '<p class="products-empty">We could not find this piece. <a href="index.html">Return to the collection.</a></p>'; };

  loadJson('../data/products.json')
    .then((products) => {
      const product = products.find((item) => item.id === id);
      if (!product) return showError();
      document.title = `${product.name} | Concrete Ideas`;
      document.querySelector('[data-breadcrumb-name]').textContent = product.name;
      detail.innerHTML = `
        <div class="product-detail__image"><img src="${product.image}" alt="${product.name}" /></div>
        <div class="product-detail__content"><p class="site-eyebrow">${product.category}</p><h1>${product.name}</h1><p class="product-detail__intro">${product.description}</p>
          <dl class="product-specs"><div><dt>Material</dt><dd>${product.materials}</dd></div><div><dt>Dimensions</dt><dd>${product.dimensions}</dd></div><div><dt>Finish</dt><dd>${product.finish}</dd></div></dl>
          <a class="main-btn" href="mailto:concreteideas.sales@gmail.com?subject=${encodeURIComponent(`Enquiry: ${product.name}`)}">Request a quote</a>
        </div>`;
      const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
      document.querySelector('[data-related-products]').innerHTML = related.map((item) => `
        <article class="product-card"><a class="product-card__image" href="${productUrl(item.id)}"><img src="${item.image}" alt="${item.name}" loading="lazy"></a><div class="product-card__body"><p class="product-card__category">${item.category}</p><h3><a href="${productUrl(item.id)}">${item.name}</a></h3><a class="product-card__link" href="${productUrl(item.id)}">View piece <span aria-hidden="true">â†’</span></a></div></article>`).join('');
    })
    .catch(showError);
})();
