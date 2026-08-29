(() => {
  const root = document.querySelector('[data-enquiry-content]');
  if (!root || !window.ConcreteIdeasEnquiry) return;
  const cart = window.ConcreteIdeasEnquiry;
  const productUrl = (id) => `../products/product.html?id=${encodeURIComponent(id)}`;

  const render = () => {
    const items = cart.getCart();
    if (!items.length) {
      root.innerHTML = `<div class="enquiry-empty"><p class="site-eyebrow">Nothing selected yet</p><h2>Build your project enquiry.</h2><p>Browse the collection and add pieces you're considering. Your selection will stay here while you continue exploring.</p><a class="site-button site-button--primary" href="../products/index.html">Explore products <span aria-hidden="true">→</span></a></div>`;
      return;
    }
    root.innerHTML = `<div class="enquiry-layout"><div class="enquiry-list"><div class="enquiry-list__heading"><div><p class="site-eyebrow">Selected pieces</p><h2>${items.length} ${items.length === 1 ? 'piece' : 'pieces'}</h2></div><button class="enquiry-clear" type="button" data-enquiry-action="clear">Clear list</button></div>${items.map((item) => `<article class="enquiry-item"><a class="enquiry-item__image" href="${productUrl(item.id)}"><img src="${item.image || '../brand/icon.png'}" alt="${item.name}" loading="lazy"></a><div class="enquiry-item__info"><p class="enquiry-item__eyebrow">Concrete Ideas</p><h3><a href="${productUrl(item.id)}">${item.name}</a></h3><button class="enquiry-remove" type="button" data-enquiry-action="remove" data-id="${item.id}">Remove</button></div><div class="enquiry-quantity" aria-label="Quantity for ${item.name}"><button type="button" data-enquiry-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-enquiry-action="increase" data-id="${item.id}" aria-label="Increase quantity">+</button></div></article>`).join('')}</div><aside class="enquiry-summary"><p class="site-eyebrow">Ready to talk?</p><h2>Send this selection to the studio.</h2><p>We'll review your requirements and get back to you with availability, pricing and delivery guidance.</p><a class="site-button site-button--primary enquiry-summary__button" href="../contact/index.html?enquiry=1">Send enquiry <span aria-hidden="true">→</span></a><a class="enquiry-summary__continue" href="../products/index.html">Continue browsing</a></aside></div>`;
  };
  document.addEventListener('concreteideas:cart-updated', render);
  render();
})();
