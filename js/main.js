const featuredProductGalleries = document.querySelectorAll("[data-featured-products]");

if (featuredProductGalleries.length) {
  const { loadJson } = window.ConcreteIdeasData;
  const productDataUrl = new URL("./data/products.json", window.location.href);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
  const categoriesFor = (product) => {
    const categories = Array.isArray(product.category) ? product.category : [product.category];
    return categories.filter(Boolean).flatMap((category) => String(category).split("/").map((item) => item.trim()));
  };

  loadJson("./data/products.json")
    .then((products) => {
      featuredProductGalleries.forEach((gallery) => {
        const category = gallery.dataset.featuredProducts;
        const featuredProducts = products.filter((product) =>
          product.featured === true && categoriesFor(product).includes(category) &&
          product.id && product.name && Array.isArray(product.images) && product.images[0]
        );

        gallery.innerHTML = featuredProducts.map((product) => {
          const productUrl = `./products/product.html?id=${encodeURIComponent(product.id)}`;
          const imageUrl = new URL(product.images[0], productDataUrl).href;
          const name = escapeHtml(product.name);
          return `
            <div class="col-lg-3 col-sm-6 mb-5 mb-lg-0">
              <div class="product-items d-flex flex-column align-items-center justify-content-center">
                <a href="${productUrl}" aria-label="View ${name}">
                  <img class="mb-3 w-75" src="${imageUrl}" alt="${name}" loading="lazy" />
                </a>
                <div class="d-flex align-items-center justify-content-center">
                  <a class="me-2 alt-font d-inline-block" href="${productUrl}">${name}</a>
                  <i class="fa-solid fa-arrow-right-long"></i>
                </div>
              </div>
            </div>`;
        }).join("");
      });
    })
    .catch(() => {
      featuredProductGalleries.forEach((gallery) => {
        gallery.innerHTML = '<p class="col-12">Featured products are currently unavailable.</p>';
      });
    });
}

window.addEventListener("load", function () {
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");

    setTimeout(() => {
      loader.classList.add("hidden");

      setTimeout(() => {
        loader.style.display = "none";
        mainContent.style.display = "block";
        // If the page was opened with a hash (e.g. index.html#collections),
        // ensure we scroll to the target now that content is visible.
        if (window.location.hash) {
          setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target && typeof target.scrollIntoView === 'function') {
              target.scrollIntoView({ behavior: 'smooth' });
            }
          }, 50);
        }
      }, 500);
    }, 500);
  });