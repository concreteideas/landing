(() => {
  const detail = document.querySelector('[data-product-detail]');
  if (!detail) return;
  const { loadJson } = window.ConcreteIdeasData;
  const id = new URLSearchParams(window.location.search).get('id');
  const productUrl = (productId) => `product.html?id=${encodeURIComponent(productId)}`;
  const showError = () => { detail.innerHTML = '<p class="products-empty">We could not find this piece. <a href="index.html">Return to the collection.</a></p>'; };
  const categoriesFor = (product) => Array.isArray(product.category) ? product.category : product.category ? [product.category] : [];

  loadJson('../data/products.json')
    .then((products) => {
      const product = products.find((item) => item.id === id);
      if (!product) return showError();
      document.title = `${product.name} | Concrete Ideas`;
      document.querySelector('[data-breadcrumb-name]').textContent = product.name;
      const categories = categoriesFor(product);
      const specifications = [
        ['Material', product.materials],
        ['Reinforcement', product.reinforcement],
        ['Dimensions', product.dimensions],
        ['Weight', product.weight],
        ['Finish', product.finish]
      ].filter(([, value]) => value).map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
      detail.innerHTML = `
        <div class="product-detail__image"><img src="${product.image}" alt="${product.name}" /></div>
        <div class="product-detail__content"><p class="site-eyebrow">${categories.join(' / ')}</p><h1>${product.name}</h1><p class="product-detail__intro">${product.description}</p>
          ${specifications ? `<dl class="product-specs">${specifications}</dl>` : ''}
          <a class="main-btn" href="mailto:concreteideas.sales@gmail.com?subject=${encodeURIComponent(`Enquiry: ${product.name}`)}">Request a quote</a>
        </div>`;
      const related = products.filter((item) => item.id !== product.id && categoriesFor(item).some((category) => categories.includes(category))).slice(0, 3);
      document.querySelector('[data-related-products]').innerHTML = related.map((item) => `
        <article class="product-card"><a class="product-card__image" href="${productUrl(item.id)}"><img src="${item.image}" alt="${item.name}" loading="lazy"></a><div class="product-card__body"><p class="product-card__category">${categoriesFor(item).join(' / ')}</p><h3><a href="${productUrl(item.id)}">${item.name}</a></h3><a class="product-card__link" href="${productUrl(item.id)}">View piece <span aria-hidden="true">→</span></a></div></article>`).join('');
    })
    .catch(showError);
})();
