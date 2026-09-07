/* =========================================================
   NOCTURNE — luxury car showcase slider
   Organized as: initSlider / changeSlide / animateSlide / updateBackground
   ========================================================= */

(function () {
  "use strict";

  const INITIAL_AUTOPLAY_DELAY = 1500;
  const AUTOPLAY_DELAY = 3500;
  const TOTAL_SLIDES = 8;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- state ----
  let currentIndex = 0;
  let isAnimating = false;
  let autoplayTimer = null;

  // ---- cached DOM ----
  let heroEl, root, sceneEl, navEl;
  let bgLayers, slideContents, cars, dots, prevBtn, nextBtn;

  function cacheDom() {
    heroEl = document.getElementById("hero");
    sceneEl = document.querySelector(".cube-stage");
    navEl = document.getElementById("siteNav");
    root = document.documentElement;
    bgLayers = Array.from(document.querySelectorAll(".bg-layer"));
    slideContents = Array.from(document.querySelectorAll(".slide-content"));
    cars = Array.from(document.querySelectorAll(".car"));
    dots = Array.from(document.querySelectorAll(".dot"));
    prevBtn = document.getElementById("prevBtn");
    nextBtn = document.getElementById("nextBtn");
  }

  function getAccent(index) {
    return slideContents[index].dataset.accent || "#1357F5";
  }

  /* =========================================================
     BACKGROUND — crossfades gradient layers + accent variable
     Only touches opacity + the --accent CSS custom property.
     ========================================================= */
  function updateBackground(newIndex, duration) {
    const tl = gsap.timeline();
    const newLayer = bgLayers[newIndex % bgLayers.length];
    const oldLayer = bgLayers[currentIndex % bgLayers.length];

    tl.to(newLayer, { opacity: 1, duration, ease: "sine.inOut" }, 0);
    if (oldLayer !== newLayer) {
      tl.to(oldLayer, { opacity: 0, duration, ease: "sine.inOut" }, 0);
    }
    tl.to(root, { "--accent": getAccent(newIndex), duration, ease: "sine.inOut" }, 0);

    return tl;
  }

  /* =========================================================
     DOTS — width change achieved purely with scaleX (transform)
     ========================================================= */
  function updateDots(newIndex, duration) {
    dots.forEach((dot, i) => {
      const active = i === newIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", String(active));
      gsap.to(dot, {
        scaleX: active ? 1 : 0.333,
        backgroundColor: active ? getAccent(newIndex) : "rgba(255,255,255,0.22)",
        duration,
        ease: "power3.out",
      });
    });
  }

  /* =========================================================
     ANIMATE SLIDE — the single orchestrated GSAP timeline
     ========================================================= */
  function animateSlide(oldIndex, newIndex, direction) {
    isAnimating = true;

    const oldContent = slideContents[oldIndex];
    const newContent = slideContents[newIndex];
    const oldCar = cars[oldIndex];
    const newCar = cars[newIndex];

    const oldItems = oldContent.querySelectorAll(".anim-item");
    const newItems = newContent.querySelectorAll(".anim-item");

    newContent.classList.add("is-active");
    newCar.classList.add("is-active");

    const rotation = direction > 0 ? -88 : 88;
    const yaw = direction > 0 ? -2 : 2;
    const resetRotation = -rotation;
    const resetYaw = -yaw;
    const outgoingY = direction > 0 ? "-52vh" : "52vh";
    const incomingY = direction > 0 ? "52vh" : "-52vh";
    const outgoingOrigin = direction > 0 ? "50% 100%" : "50% 0%";
    const incomingOrigin = direction > 0 ? "50% 0%" : "50% 100%";

    gsap.set(newContent, { opacity: 0 });
    gsap.set(newCar, { opacity: 0 });
    gsap.set(newItems, { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete() {
        oldContent.classList.remove("is-active");
        oldCar.classList.remove("is-active");
        gsap.set(oldCar, { clearProps: "transform,opacity" });
        gsap.set(oldItems, { clearProps: "transform,opacity" });
        isAnimating = false;
      },
    });

    // Keep the fixed header outside the hero's 3D transition so it never
    // disappears during autoplay or manual slide changes.
    const rollTargets = [heroEl];

    gsap.set(rollTargets, {
      transformOrigin: outgoingOrigin,
      transformPerspective: 1600,
    });

    // 1. Background color shift and outgoing face roll.
    tl.add(updateBackground(newIndex, 0.8), 0);
    tl.add(() => updateDots(newIndex, 0.5), 0);

    tl.to(rollTargets, {
      y: outgoingY,
      rotationX: rotation,
      rotationY: yaw,
      z: -220,
      "--cube-brightness": 0.72,
      "--cube-saturation": 0.84,
      duration: 0.95,
      ease: "power3.in",
    }, 0);
    tl.add(() => {
      oldContent.classList.remove("is-active");
      oldCar.classList.remove("is-active");
      gsap.set(oldContent, { clearProps: "opacity" });
      gsap.set(oldCar, { clearProps: "opacity" });
      gsap.set(rollTargets, {
        y: incomingY,
        rotationX: resetRotation,
        rotationY: resetYaw,
        z: -220,
        transformOrigin: incomingOrigin,
        "--cube-brightness": 0.72,
        "--cube-saturation": 0.84,
      });
      gsap.set(newContent, { opacity: 1 });
      gsap.set(newCar, { opacity: 1 });
    }, 0.98);
    tl.to(rollTargets, {
      y: 0,
      rotationX: 0,
      rotationY: 0,
      z: 0,
      "--cube-brightness": 1,
      "--cube-saturation": 1,
      duration: 0.98,
      ease: "power3.out",
    }, 0.99);

    tl.to(
      newItems,
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" },
      1.35
    );

    tl.eventCallback("onComplete", () => {
      oldContent.classList.remove("is-active");
      oldCar.classList.remove("is-active");
      gsap.set(rollTargets, { clearProps: "transform" });
      isAnimating = false;
    });

    return tl;
  }

  /* =========================================================
     CHANGE SLIDE — public entry point for prev/next/dot/keys
     ========================================================= */
  function changeSlide(newIndex) {
    if (isAnimating) return;
    newIndex = ((newIndex % TOTAL_SLIDES) + TOTAL_SLIDES) % TOTAL_SLIDES;
    if (newIndex === currentIndex) return;

    const direction = newIndex === (currentIndex + 1) % TOTAL_SLIDES ? 1 : -1;

    if (prefersReducedMotion) {
      slideContents[currentIndex].classList.remove("is-active");
      cars[currentIndex].classList.remove("is-active");
      slideContents[newIndex].classList.add("is-active");
      cars[newIndex].classList.add("is-active");
      bgLayers[currentIndex].style.opacity = 0;
      bgLayers[newIndex].style.opacity = 1;
      root.style.setProperty("--accent", getAccent(newIndex));
      updateDots(newIndex, 0.01);
      currentIndex = newIndex;
      resetAutoplay();
      return;
    }

    animateSlide(currentIndex, newIndex, direction);
    currentIndex = newIndex;
    resetAutoplay();
  }

  function goNext() {
    changeSlide(currentIndex + 1);
  }

  function goPrev() {
    changeSlide(currentIndex - 1);
  }

  /* =========================================================
     AUTOPLAY
     ========================================================= */
  function startAutoplay(delay = AUTOPLAY_DELAY) {
    stopAutoplay();
    if (prefersReducedMotion) return;
    autoplayTimer = setTimeout(goNext, delay);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    startAutoplay();
  }

  /* =========================================================
     ENTRANCE — the very first reveal on page load
     ========================================================= */
  function playEntrance() {
    const content = slideContents[currentIndex];
    const car = cars[currentIndex];
    const items = content.querySelectorAll(".anim-item");

    gsap.set(content, { scale: 0.985 });
    gsap.set(items, { opacity: 0, y: 20 });
    gsap.set(car, { opacity: 0, scale: 1, x: 0 });

    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    tl.to(car, { opacity: 1, duration: 0.9, ease: "power4.out" }, 0.1);
    tl.to(content, { scale: 1, duration: 0.8, ease: "back.out(1.6)" }, 0.2);
    tl.to(items, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" }, 0.35);
  }

  /* =========================================================
     EVENTS
     ========================================================= */
  function bindEvents() {
    prevBtn.addEventListener("click", goPrev);
    nextBtn.addEventListener("click", goNext);

    dots.forEach((dot) => {
      dot.addEventListener("click", () => changeSlide(Number(dot.dataset.index)));
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    });

  }

  /* =========================================================
     INIT
     ========================================================= */
  function initSlider() {
    cacheDom();
    root.style.setProperty("--accent", getAccent(currentIndex));
    bindEvents();
    playEntrance();

    const preloader = document.getElementById("preloader");
    if (!preloader || preloader.classList.contains("is-done")) {
      startAutoplay(INITIAL_AUTOPLAY_DELAY);
    } else {
      document.addEventListener("onist:hero-ready", () => startAutoplay(INITIAL_AUTOPLAY_DELAY), { once: true });
    }
  }

  document.addEventListener("DOMContentLoaded", initSlider);
})();
