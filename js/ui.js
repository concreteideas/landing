(() => {
  const root = document.documentElement.dataset.root || './';
  const page = document.documentElement.dataset.page || '';
  const links = [
    ['Home', `${root}index.html`, 'home'],
    ['Collections', `${root}collections/landscape.html`, 'collections'],
    ['Products', `${root}products/index.html`, 'products'],
    ['Projects', `${root}projects/index.html`, 'projects'],
    ['Resources', `${root}resources/index.html`, 'resources'],
    ['About', `${root}index.html#about`, 'about'],
    ['Contact', `${root}index.html#footer`, 'contact']
  ];

  const header = document.querySelector('[data-site-header]');
  if (header) {
    header.innerHTML = `<header class="site-header"><div class="site-header__inner"><a class="site-header__brand" href="${root}index.html"><img src="${root}imgs/cideas-logo.png" alt="Concrete Ideas"></a><button class="site-header__toggle" type="button" aria-expanded="false" aria-controls="site-menu"><i class="fa-solid fa-bars" aria-hidden="true"></i><span class="visually-hidden">Toggle navigation</span></button><nav class="site-header__menu" id="site-menu" aria-label="Main navigation"><ul class="site-header__nav">${links.map(([label, href, key]) => `<li><a href="${href}"${page === key ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul></nav></div></header>`;
    const toggle = header.querySelector('.site-header__toggle');
    const menu = header.querySelector('.site-header__menu');
    toggle.addEventListener('click', () => { const open = menu.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', String(open)); });
  }

  const footer = document.querySelector('[data-site-footer]');
  if (footer) footer.innerHTML = `<footer class="site-footer" id="footer"><div class="site-footer__inner"><div><img class="site-footer__brand" src="${root}cimgs/logo_white.png" alt="Concrete Ideas"><p>Concrete objects for architecture, landscape and interiors.</p></div><div><h2 class="site-footer__heading">Explore</h2><ul class="site-footer__links"><li><a href="${root}collections/landscape.html">Collections</a></li><li><a href="${root}products/index.html">Products</a></li><li><a href="${root}projects/index.html">Projects</a></li><li><a href="${root}resources/index.html">Resources</a></li></ul></div><div><h2 class="site-footer__heading">Get in touch</h2><p>Whitefield, Bengaluru</p><p><a href="tel:+916361091283">+91 636 109 1283</a></p><p><a href="mailto:concreteideas.sales@gmail.com">concreteideas.sales@gmail.com</a></p></div><div><h2 class="site-footer__heading">Studio journal</h2><ul class="site-footer__gallery"><li><img src="${root}imgs/footer-1.jpg" alt="Concrete Ideas project detail" loading="lazy"></li><li><img src="${root}imgs/footer-2.jpg" alt="Concrete Ideas material detail" loading="lazy"></li><li><img src="${root}imgs/footer-3.jpg" alt="Concrete Ideas product detail" loading="lazy"></li></ul></div></div><div class="site-footer__bottom">© 2026 Concrete Ideas</div></footer>`;
})();
