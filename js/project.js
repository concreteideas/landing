(() => {
  const detail = document.querySelector('[data-project-detail]');
  if (!detail) return;
  const { loadJson } = window.ConcreteIdeasData;

  const projectId = new URLSearchParams(window.location.search).get('id');
  const relatedProducts = document.querySelector('[data-related-products]');
  const relatedProjects = document.querySelector('[data-related-projects]');
  const gallery = document.querySelector('[data-project-gallery]');
  const breadcrumb = document.querySelector('[data-breadcrumb-name]');
  const productUrl = (id) => `../products/product.html?id=${encodeURIComponent(id)}`;
  const projectUrl = (id) => `project.html?id=${encodeURIComponent(id)}`;
  const showError = () => { detail.innerHTML = '<p class="projects-empty">We could not find this project. <a href="index.html">Return to projects.</a></p>'; };

  const productCard = (product) => `
    <article class="related-product"><a class="related-product__image" href="${productUrl(product.id)}"><img src="${product.image}" alt="${product.name}" loading="lazy"></a><h3><a href="${productUrl(product.id)}">${product.name}</a></h3></article>`;
  const projectCard = (project) => `
    <article class="project-card"><a class="project-card__image" href="${projectUrl(project.id)}"><img src="${project.hero}" alt="${project.title}, ${project.location}" loading="lazy"></a><div class="project-card__body"><p class="project-card__meta">${project.category}</p><h3><a href="${projectUrl(project.id)}">${project.title}</a></h3><p class="project-card__location">${project.location}</p></div></article>`;

  Promise.all([loadJson('../data/projects.json'), loadJson('../data/products.json')])
    .then(([projects, products]) => {
      const project = projects.find((item) => item.id === projectId);
      if (!project) return showError();
      const usedProducts = project.products.map((id) => products.find((product) => product.id === id)).filter(Boolean);
      document.title = `${project.title} | Concrete Ideas`;
      breadcrumb.textContent = project.title;
      detail.innerHTML = `
        <div class="project-detail__hero"><img src="${project.hero}" alt="${project.title}, ${project.location}"></div>
        <div class="project-detail__content"><p class="site-eyebrow">${project.category}</p><h1>${project.title}</h1><p class="project-detail__overview">${project.description}</p>
          <dl class="project-facts"><div><dt>Location</dt><dd>${project.location}</dd></div><div><dt>Project type</dt><dd>${project.category}</dd></div><div><dt>Architect</dt><dd>${project.architect}</dd></div><div><dt>Completed</dt><dd>${project.year}</dd></div><div><dt>Products used</dt><dd>${usedProducts.map((product) => `<a href="${productUrl(product.id)}">${product.name}</a>`).join(', ')}</dd></div></dl>
        </div>`;
      gallery.innerHTML = project.gallery.map((image, index) => `<figure><img src="${image}" alt="${project.title} ${index + 1}" loading="lazy"></figure>`).join('');
      relatedProducts.innerHTML = usedProducts.map(productCard).join('');
      const similarProjects = projects.filter((item) => item.id !== project.id && (item.category === project.category || item.featured)).slice(0, 3);
      relatedProjects.innerHTML = similarProjects.map(projectCard).join('');
    })
    .catch(showError);
})();
