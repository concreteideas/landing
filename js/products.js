(() => {
  const grid = document.querySelector('[data-products-grid]');
  if (!grid) return;
  const { loadJson } = window.ConcreteIdeasData;

  const categoryFromUrl = new URLSearchParams(window.location.search).get('category');
  const presetCategory = grid.dataset.category || categoryFromUrl || 'All';
  const search = document.querySelector('[data-product-search]');
  const filters = document.querySelector('[data-product-filters]');
  const count = document.querySelector('[data-product-count]');
  let products = [];
  let activeCategory = presetCategory;
  let searchTerm = '';

  const productUrl = (id) => `${grid.dataset.productBase || 'product.html'}?id=${encodeURIComponent(id)}`;
  const card = (product) => `
    <article class="product-card">
      <a class="product-card__image" href="${productUrl(product.id)}" aria-label="View ${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
      </a>
      <div class="product-card__body">
        <p class="product-card__category">${product.category}</p>
        <h2><a href="${productUrl(product.id)}">${product.name}</a></h2>
        <p>${product.description}</p>
        <a class="product-card__link" href="${productUrl(product.id)}">View piece <span aria-hidden="true">→</span></a>
      </div>
    </article>`;

  function render() {
    const visible = products.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      const searchable = `${product.name} ${product.category} ${product.description}`.toLowerCase();
      return matchesCategory && searchable.includes(searchTerm);
    });
    grid.innerHTML = visible.length ? visible.map(card).join('') : '<p class="products-empty">No pieces match your search. Please try another term or collection.</p>';
    if (count) count.textContent = `${visible.length} ${visible.length === 1 ? 'piece' : 'pieces'}`;
    if (filters) filters.querySelectorAll('button').forEach((button) => button.classList.toggle('is-active', button.dataset.category === activeCategory));
  }

  loadJson('../data/products.json')
    .then((data) => { products = data; render(); })
    .catch(() => { grid.innerHTML = '<p class="products-empty">The collection is currently unavailable. Please refresh and try again.</p>'; });

  filters?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    render();
  });
  search?.addEventListener('input', (event) => { searchTerm = event.target.value.trim().toLowerCase(); render(); });
})();
