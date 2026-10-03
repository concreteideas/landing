(() => {
  const content = document.querySelector("[data-textures-content]");
  if (!content) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  })[character]);

  const categories = [
    {
      key: "Curated textures and hand-crafted finishes",
      eyebrow: "01 / Curated finishes",
      title: "Curated & hand-crafted textures",
      intro: "Tactile surfaces developed to give each concrete form a distinct material character."
    },
    {
      key: "Curated solid shades",
      eyebrow: "02 / Curated shades",
      title: "Curated solid shades",
      intro: "A considered palette of solid tones designed to work across landscape and interior settings."
    },
    {
      key: "Project-specific finishes",
      eyebrow: "03 / Bespoke finishes",
      title: "Project-specific finishes",
      intro: "Finishes selected and developed with the project team."
    }
  ];

  fetch("../data/textures.json")
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    })
    .then((items) => {
      content.innerHTML = categories.map((category) => {
        const finishes = items.filter((item) => item.category === category.key);
        if (!finishes.length) return "";
        const sectionId = category.key.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const cards = finishes.map((finish) => {
          const characteristics = Array.isArray(finish.characteristics) ? finish.characteristics : [];
          const list = characteristics.length
            ? `<ul class="texture-card__characteristics">${characteristics.map(({ label, value }) => `<li><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></li>`).join("")}</ul>`
            : "";

          return `<article class="texture-card" id="${escapeHtml(finish.id)}">
            <div class="texture-card__image"><img src="${escapeHtml(finish.shadeImage)}" alt="${escapeHtml(finish.name)} finish" loading="lazy"></div>
            <div class="texture-card__body">
              <p class="texture-card__id">${escapeHtml(finish.id)}</p>
              <h3>${escapeHtml(finish.name)}</h3>
              <p class="texture-card__description">${escapeHtml(finish.description)}</p>
              ${list}
            </div>
          </article>`;
        }).join("");

        return `<section class="texture-category" aria-labelledby="${sectionId}">
          <header class="texture-category__heading">
            <p class="site-eyebrow">${escapeHtml(category.eyebrow)}</p>
            <h2 id="${sectionId}">${escapeHtml(category.title)}</h2>
            <p class="texture-category__intro">${escapeHtml(category.intro)}</p>
          </header>
          <div class="textures-grid">${cards}</div>
        </section>`;
      }).join("");
    })
    .catch(() => {
      content.innerHTML = "<p class=\"textures-error\">We could not load curated finishes right now. Please try again later.</p>";
    });
})();