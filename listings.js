(function () {
  "use strict";
  const results = document.getElementById("listingResults");
  const cards = Array.from(results.querySelectorAll(".browse-card"));
  const filterPanel = document.getElementById("filterPanel");
  const backdrop = document.getElementById("filterBackdrop");
  const sort = document.getElementById("sortListings");
  const browseLayout = document.querySelector(".browse-layout");
  const desktopFilterButton = document.getElementById("openFiltersDesktop");

  cards.forEach((card) => {
    const favorite = document.createElement("button");
    favorite.className = "browse-card__fav";
    favorite.type = "button";
    favorite.setAttribute("aria-label", "Save vehicle");
    favorite.textContent = "♡";
    favorite.addEventListener("click", () => {
      favorite.classList.toggle("is-saved");
      favorite.textContent = favorite.classList.contains("is-saved") ? "♥" : "♡";
    });
    card.querySelector(".browse-card__media").appendChild(favorite);
  });

  function openFilters(open) {
    filterPanel.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  function applyFilters() {
    const selected = {};
    document.querySelectorAll("[data-filter]").forEach((field) => { selected[field.dataset.filter] = field.value; });
    const min = Number(document.getElementById("minPrice").value) || 0;
    const max = Number(document.getElementById("maxPrice").value) || Infinity;
    cards.forEach((card) => {
      const matches = (!selected.make || card.dataset.make === selected.make) && (!selected.type || card.dataset.type === selected.type) && (!selected.fuel || card.dataset.fuel === selected.fuel) && Number(card.dataset.price) >= min && Number(card.dataset.price) <= max;
      card.hidden = !matches;
    });
    document.querySelector(".browse-heading h1 span").textContent = `· ${cards.filter((card) => !card.hidden).length} vehicles`;
    openFilters(false);
  }

  function sortCards() {
    const ordered = [...cards].sort((a, b) => {
      if (sort.value === "price-low") return Number(a.dataset.price) - Number(b.dataset.price);
      if (sort.value === "price-high") return Number(b.dataset.price) - Number(a.dataset.price);
      return Number(b.dataset.year) - Number(a.dataset.year);
    });
    ordered.forEach((card) => results.appendChild(card));
  }

  document.getElementById("openFilters").addEventListener("click", () => openFilters(true));
  desktopFilterButton.addEventListener("click", () => {
    if (window.innerWidth <= 760) {
      openFilters(true);
      return;
    }
    const collapsed = filterPanel.classList.toggle("is-collapsed");
    browseLayout.classList.toggle("filters-collapsed", collapsed);
    desktopFilterButton.innerHTML = collapsed ? '<span aria-hidden="true">⌕</span> Show filters' : '<span aria-hidden="true">⌕</span> Hide filters';
    desktopFilterButton.setAttribute("aria-expanded", String(!collapsed));
  });
  document.getElementById("closeFilters").addEventListener("click", () => openFilters(false));
  backdrop.addEventListener("click", () => openFilters(false));
  document.getElementById("applyFilters").addEventListener("click", applyFilters);
  sort.addEventListener("change", sortCards);
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("is-active", item === button));
    results.classList.toggle("is-list", button.dataset.view === "list");
  }));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") openFilters(false); });
})();
