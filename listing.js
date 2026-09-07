(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".gallery-slide"));
  const thumbs = Array.from(document.querySelectorAll(".gallery-thumb"));
  const count = document.getElementById("galleryCount");
  const progress = document.getElementById("galleryProgress");
  let current = 0;
  let timer;

  function showSlide(next) {
    current = (next + slides.length) % slides.length;
    slides.forEach((slide, index) => slide.classList.toggle("is-active", index === current));
    thumbs.forEach((thumb, index) => {
      thumb.classList.toggle("is-active", index === current);
      thumb.setAttribute("aria-current", index === current ? "true" : "false");
    });
    count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    progress.style.transform = `translateX(${current * 100}%)`;
  }

  function restartAutoPlay() {
    clearInterval(timer);
    timer = setInterval(() => showSlide(current + 1), 6500);
  }

  document.getElementById("galleryPrev").addEventListener("click", () => { showSlide(current - 1); restartAutoPlay(); });
  document.getElementById("galleryNext").addEventListener("click", () => { showSlide(current + 1); restartAutoPlay(); });
  thumbs.forEach((thumb, index) => thumb.addEventListener("click", () => { showSlide(index); restartAutoPlay(); }));

  let touchStart = 0;
  const viewport = document.getElementById("galleryViewport");
  viewport.addEventListener("touchstart", (event) => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
  viewport.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 45) showSlide(current + (distance < 0 ? 1 : -1));
    restartAutoPlay();
  }, { passive: true });

  const saveButton = document.querySelector(".save-button");
  saveButton.addEventListener("click", () => {
    const saved = saveButton.getAttribute("aria-pressed") === "true";
    saveButton.setAttribute("aria-pressed", String(!saved));
    saveButton.querySelector(".save-label").textContent = saved ? "Save" : "Saved";
  });

  const modal = document.getElementById("contactModal");
  function setModal(open) {
    modal.classList.toggle("is-open", open);
    modal.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("modal-open", open);
    if (open) modal.querySelector("input")?.focus();
  }
  document.querySelectorAll("[data-open-contact]").forEach((button) => button.addEventListener("click", () => setModal(true)));
  document.querySelectorAll("[data-close-contact]").forEach((button) => button.addEventListener("click", () => setModal(false)));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") setModal(false); });
  document.getElementById("contactForm").addEventListener("submit", (event) => {
    event.preventDefault();
    document.getElementById("formSuccess").hidden = false;
    event.currentTarget.reset();
  });

  showSlide(0);
  restartAutoPlay();
})();
