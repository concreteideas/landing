(() => {
  const root = document.documentElement.dataset.root || './';
  const page = document.documentElement.dataset.page || '';
  const links = [
    ['Home', page === 'home' ? '#home' : `${root}index.html`, 'home'],
    ['About', page === 'home' ? '#about' : `${root}index.html#about`, 'about'],
    ['Collections', page === 'home' ? '#collections' : `${root}index.html#collections`, 'collections'],
    ['Products', `${root}products/index.html`, 'products'],
    ['Projects', `${root}projects/index.html`, 'projects'],
    // ['Resources', `${root}resources/index.html`, 'resources'],
    ['Contact', `${root}contact/index.html`, 'contact']
  ];

  const header = document.querySelector('[data-site-header]');
  if (header) {
    header.innerHTML = `<header class="site-header"><div class="site-header__inner"><a class="site-header__brand" href="${root}index.html"><img src="${root}brand/blacklogo.png" alt="Concrete Ideas"></a><button class="site-header__toggle" type="button" aria-expanded="false" aria-controls="site-menu"><i class="fa-solid fa-bars" aria-hidden="true"></i><span class="visually-hidden">Toggle navigation</span></button><nav class="site-header__menu" id="site-menu" aria-label="Main navigation"><ul class="site-header__nav">${links.map(([label, href, key]) => `<li><a href="${href}"${page === key ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul></nav></div></header>`;
    const toggle = header.querySelector('.site-header__toggle');
    const menu = header.querySelector('.site-header__menu');
    toggle.addEventListener('click', () => { const open = menu.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', String(open)); });
  }

  const footer = document.querySelector('[data-site-footer]');
  if (footer) footer.innerHTML = `<footer class="site-footer" id="footer"><div class="site-footer__inner"><div class="site-footer__brand-block"><img class="site-footer__brand" src="${root}brand/whitelogo.png" alt="Concrete Ideas"><p>Architectural concrete for landscape, interiors, hospitality, and bespoke spaces.</p></div><div class="site-footer__contact"><p class="site-footer__eyebrow">Contact</p><h2 class="site-footer__heading">Start a conversation</h2><address><p>Whitefield, Bengaluru</p><p><a href="tel:+916361091283">+91 636 109 1283</a></p><p><a href="mailto:info@concreteideas.co">info@concreteideas.co</a></p></address><a class="site-footer__contact-link" href="${root}contact/index.html">Contact the studio <span aria-hidden="true">&#8594;</span></a></div></div><div class="site-footer__bottom"><span>© 2026 Concrete Ideas</span><span>Architectural concrete, thoughtfully made.</span></div></footer>`;
})();
