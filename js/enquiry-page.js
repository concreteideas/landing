(() => {
  const root = document.querySelector('[data-enquiry-content]');
  if (!root || !window.ConcreteIdeasEnquiry) return;

  const cart = window.ConcreteIdeasEnquiry;
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwaIzbdYhUJ9dyMkDMLk9y85OLwrhOykB_3zKZfJCpIafcd2XI1JdHll1rOmRmQ8T-E/exec';
  const productUrl = (id) => `../products/product.html?id=${encodeURIComponent(id)}`;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  const getItemCount = (items) => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const renderItems = (items) => items.map((item) => `
    <article class="enquiry-item">
      <a class="enquiry-item__image" href="${productUrl(item.id)}">
        <img src="${item.image || '../brand/icon.png'}" alt="${escapeHtml(item.name)}" loading="lazy">
      </a>
      <div class="enquiry-item__info">
        <p class="enquiry-item__eyebrow">${escapeHtml(item.sizeName || 'Standard')}</p>
        <h3><a href="${productUrl(item.id)}">${escapeHtml(item.name)}</a></h3>
        <p class="enquiry-item__dimensions"><strong>Dimension:</strong> ${escapeHtml(item.dimensions || 'To be confirmed')}<br><strong>Weight:</strong> ${escapeHtml(item.weight || 'To be confirmed')}</p>
        <button class="enquiry-remove" type="button" data-enquiry-action="remove" data-key="${escapeHtml(cart.itemKey(item))}">Remove</button>
      </div>
      <div class="enquiry-quantity" aria-label="Quantity for ${escapeHtml(item.name)}, ${escapeHtml(item.sizeName || 'Standard')}">
        <button type="button" data-enquiry-action="decrease" data-key="${escapeHtml(cart.itemKey(item))}" aria-label="Decrease quantity">−</button>
        <span>${item.quantity}</span>
        <button type="button" data-enquiry-action="increase" data-key="${escapeHtml(cart.itemKey(item))}" aria-label="Increase quantity">+</button>
      </div>
    </article>
  `).join('');

  const render = () => {
    const items = cart.getCart();
    if (!items.length) {
      root.innerHTML = `<div class="enquiry-empty"><p class="site-eyebrow">Nothing selected yet</p><h2>Build your project enquiry.</h2><p>Browse the collection and add pieces you're considering. Your selection will stay here while you continue exploring.</p><a class="site-button site-button--primary" href="../products/index.html">Explore products <span aria-hidden="true">→</span></a></div>`;
      return;
    }

    const count = getItemCount(items);
    root.innerHTML = `
      <div class="enquiry-layout">
        <div class="enquiry-list">
          <div class="enquiry-list__heading">
            <div><p class="site-eyebrow">Selected pieces</p><h2>${count} ${count === 1 ? 'piece' : 'pieces'}</h2></div>
            <button class="enquiry-clear" type="button" data-enquiry-action="clear">Clear list</button>
          </div>
          <div data-enquiry-items>${renderItems(items)}</div>
        </div>
        <aside class="enquiry-summary">
          <p class="site-eyebrow">Ready to talk?</p>
          <h2>Send this selection to the studio.</h2>
          <p>Share a few details about your project and we'll prepare a quotation based on the volume of your order. Larger quantities allow us to offer better per-piece pricing. Shipping costs are calculated separately based on the delivery location.</p>
          <button class="site-button site-button--primary enquiry-summary__button" type="button" data-open-enquiry-form>Send enquiry <span aria-hidden="true">→</span></button>
          <a class="enquiry-summary__continue" href="../products/index.html">Continue browsing</a>
        </aside>
      </div>
      <section class="enquiry-form-section" data-enquiry-form-section hidden aria-labelledby="enquiry-form-title">
        <div class="enquiry-form-card">
          <div class="enquiry-form-heading">
            <p class="site-eyebrow">Project enquiry</p>
            <h2 id="enquiry-form-title">Tell us about your project.</h2>
            <p>We'll review your selection and prepare a quotation based on the volume of your order. Larger quantities allow us to offer better per-piece pricing. Shipping costs will be calculated based on your delivery location.</p>
          </div>
          <form data-enquiry-form novalidate>
            <div class="enquiry-form-grid">
              <label>Name *<input name="name" type="text" autocomplete="name" required></label>
              <label>Studio / Company<input name="company" type="text" autocomplete="organization"></label>
              <label>Email *<input name="email" type="email" autocomplete="email" required></label>
              <label>Phone / WhatsApp *<input name="phone" type="tel" autocomplete="tel" required></label>
              <label>Project / Requirement<textarea name="project" rows="4" placeholder="Tell us briefly about the project or requirement."></textarea></label>
              <label>Delivery Location *<input name="location" type="text" autocomplete="street-address" required></label>
            </div>
            <p class="enquiry-form-error" data-enquiry-form-error role="alert" hidden></p>
            <div class="enquiry-form-actions">
              <button class="enquiry-form-cancel" type="button" data-close-enquiry-form>Back to enquiry</button>
              <button class="site-button site-button--primary" type="submit" data-enquiry-submit>Send enquiry <span aria-hidden="true">→</span></button>
            </div>
          </form>
        </div>
      </section>
    `;
  };

  const openForm = () => {
    const section = root.querySelector('[data-enquiry-form-section]');
    if (!section) return;
    section.hidden = false;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section.querySelector('input[name="name"]')?.focus();
  };

  const closeForm = () => {
    const section = root.querySelector('[data-enquiry-form-section]');
    if (section) section.hidden = true;
  };

  const setSubmitting = (submitting) => {
    const submit = root.querySelector('[data-enquiry-submit]');
    if (!submit) return;
    submit.disabled = submitting;
    submit.innerHTML = submitting ? 'Sending…' : 'Send enquiry <span aria-hidden="true">→</span>';
  };

  const showFormError = (message) => {
    const error = root.querySelector('[data-enquiry-form-error]');
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  };

  const showSuccess = (enquiryId) => {
    root.innerHTML = `
      <div class="enquiry-success">
        <p class="site-eyebrow">Enquiry received</p>
        <h2>Thank you.</h2>
        <p>Your project enquiry has been sent to the Concrete Ideas studio.</p>
        <p class="enquiry-success__id">Enquiry number <strong>${escapeHtml(enquiryId || 'Received')}</strong></p>
        <a class="site-button site-button--primary" href="../index.html">Back to Concrete Ideas <span aria-hidden="true">→</span></a>
      </div>
    `;
  };

  const submitEnquiry = (form) => {
    const formData = new FormData(form);
    const customer = {
      name: String(formData.get('name') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      project: String(formData.get('project') || '').trim(),
      location: String(formData.get('location') || '').trim(),
      message: String(formData.get('project') || '').trim()
    };
    const items = cart.getCart().map((item) => ({
      productId: item.id,
      product: item.name,
      size: item.sizeName || 'Standard',
      dimension: item.dimensions || 'To be confirmed',
      weight: item.weight || 'To be confirmed',
      quantity: Number(item.quantity || 0)
    })).filter((item) => item.quantity > 0);

    if (!customer.name || !customer.email || !customer.phone || !customer.location) {
      showFormError('Please complete all required fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(customer.email)) {
      showFormError('Please enter a valid email address.');
      return;
    }
    if (!items.length) {
      showFormError('Your enquiry list is empty. Please add at least one piece.');
      return;
    }

    setSubmitting(true);
    showFormError('');
    const error = root.querySelector('[data-enquiry-form-error]');
    if (error) error.hidden = true;

    const iframeName = `concreteIdeasEnquiry_${Date.now()}`;
    const iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.title = 'Enquiry submission';
    iframe.hidden = true;
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const submitForm = document.createElement('form');
    submitForm.method = 'POST';
    submitForm.action = APPS_SCRIPT_URL;
    submitForm.target = iframeName;
    submitForm.style.display = 'none';

    const payload = document.createElement('input');
    payload.type = 'hidden';
    payload.name = 'payload';
    payload.value = JSON.stringify({ customer, items });
    submitForm.appendChild(payload);
    document.body.appendChild(submitForm);

    let completed = false;
    let timeoutId;

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      if (timeoutId) window.clearTimeout(timeoutId);
      submitForm.remove();
      iframe.remove();
    };

    const fail = () => {
      if (completed) return;
      completed = true;
      cleanup();
      setSubmitting(false);
      showFormError('We could not send your enquiry. Please try again, or contact the studio directly at info@concreteideas.co.');
    };

    const handleMessage = (event) => {
      if (event.data?.type !== 'concreteideas-enquiry-result') return;
      if (completed) return;
      if (event.data.success && event.data.enquiryId) {
        completed = true;
        cleanup();
        cart.clear();
        showSuccess(event.data.enquiryId);
      } else {
        fail();
      }
    };

    window.addEventListener('message', handleMessage);
    timeoutId = window.setTimeout(fail, 30000);
    submitForm.submit();
  };

  document.addEventListener('concreteideas:cart-updated', render);
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-enquiry-form]')) openForm();
    if (event.target.closest('[data-close-enquiry-form]')) closeForm();
  });
  root.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-enquiry-form]');
    if (!form) return;
    event.preventDefault();
    submitEnquiry(form);
  });

  render();
})();
