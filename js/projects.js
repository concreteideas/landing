(() => {
  const grid = document.querySelector('[data-projects-grid]');
  if (!grid) return;
  const { loadJson } = window.ConcreteIdeasData;

  const filters = document.querySelector('[data-project-filters]');
  const count = document.querySelector('[data-project-count]');
  const projectUrl = (id) => `project.html?id=${encodeURIComponent(id)}`;
  let projects = [];
  let productNames = new Map();
  let activeCategory = 'All';

  const productList = (ids) => ids.map((id) => productNames.get(id) || 'Concrete Ideas piece').join(', ');
  const card = (project) => `
    <article class="project-card">
      <a class="project-card__image" href="${projectUrl(project.id)}" aria-label="View ${project.title}"><img src="${project.hero}" alt="${project.title}, ${project.location}" loading="lazy"></a>
      <div class="project-card__body"><p class="project-card__meta">${project.category}</p>
      <h2><a href="${projectUrl(project.id)}">${project.title}</a></h2>
      <p class="project-card__location">${project.location}</p>
      </div>
    </article>`;

  function render() {
    const visible = projects.filter((project) => activeCategory === 'All' || project.category === activeCategory);
    grid.innerHTML = visible.length ? visible.map(card).join('') : '<p class="projects-empty">No projects are available in this category.</p>';
    if (count) count.textContent = `${visible.length} ${visible.length === 1 ? 'project' : 'projects'}`;
    filters?.querySelectorAll('button').forEach((button) => button.classList.toggle('is-active', button.dataset.category === activeCategory));
  }

  Promise.all([loadJson('../data/projects.json'), loadJson('../data/products.json')])
    .then(([projectData, productData]) => {
      projects = projectData;
      productNames = new Map(productData.map((product) => [product.id, product.name]));
      render();
    })
    .catch(() => { grid.innerHTML = '<p class="projects-empty">Projects are currently unavailable. Please refresh and try again.</p>'; });

  filters?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    render();
  });
})();
