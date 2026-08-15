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