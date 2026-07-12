(() => {
  const cache = new Map();

  function getInlineJson(url) {
    const script = document.querySelector(`script[data-json-path="${url}"]`);
    if (!script) return null;

    try {
      return JSON.parse(script.textContent);
    } catch (error) {
      console.warn(`Unable to parse inline JSON for ${url}`, error);
      return null;
    }
  }

  async function loadJson(url) {
    if (!cache.has(url)) {
      const inlineData = getInlineJson(url);
      if (inlineData) {
        cache.set(url, Promise.resolve(inlineData));
      } else {
        cache.set(url, fetch(url).then((response) => {
          if (!response.ok) throw new Error(`Unable to load ${url}`);
          return response.json();
        }));
      }
    }
    return cache.get(url);
  }

  window.ConcreteIdeasData = { loadJson };
})();
