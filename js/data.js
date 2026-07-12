(() => {
  const cache = new Map();

  async function loadJson(url) {
    if (!cache.has(url)) {
      cache.set(url, fetch(url).then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${url}`);
        return response.json();
      }));
    }
    return cache.get(url);
  }

  window.ConcreteIdeasData = { loadJson };
})();
