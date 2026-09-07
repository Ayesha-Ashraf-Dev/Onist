/* =================================================================
   Onist Cars — INTERACTION LAYER
   Animates only transform / opacity / filter (plus one pragmatic
   exception: the nav active-indicator and accordion track sizing,
   both single small elements, kept off the critical render path).
   ================================================================= */
(function () {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. CINEMATIC DARK AUTOMOTIVE MORPHING TIMELINE ---------- */
  function runPreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;

    let hasSeenPreloader = false;
    try {
      hasSeenPreloader = sessionStorage.getItem("onist-preloader-seen") === "true";
    } catch (error) {
      hasSeenPreloader = false;
    }

    if (hasSeenPreloader) {
      preloader.classList.add("is-done");
      preloader.style.display = "none";
      revealHero();
      return;
    }

    try {
      sessionStorage.setItem("onist-preloader-seen", "true");
    } catch (error) {
      // Continue with the animation when session storage is unavailable.
    }

    if (reduced || typeof gsap === "undefined" || typeof flubber === "undefined") {
      preloader.classList.add("is-done");
      preloader.style.display = "none";
      revealHero();
      return;
    }

    const pathEl = document.getElementById("morphPath");
    if (!pathEl) return;

    // SVG Paths for Morphing Sequence (Facing Right)
    const sedanPath = "M 20 85 C 20 65, 30 50, 60 45 L 120 15 C 150 5, 200 5, 230 15 L 280 45 L 340 50 C 370 55, 380 65, 380 85 L 345 85 A 30 30 0 0 0 285 85 L 115 85 A 30 30 0 0 0 55 85 Z";
    const coupePath = "M 20 85 C 20 65, 30 55, 50 50 L 110 25 C 130 15, 170 10, 200 20 L 250 45 L 320 50 C 360 55, 380 60, 380 85 L 345 85 A 30 30 0 0 0 285 85 L 115 85 A 30 30 0 0 0 55 85 Z";
    const suvPath = "M 30 85 C 30 30, 50 10, 70 10 C 100 5, 240 5, 260 10 L 310 40 L 350 45 C 375 45, 385 55, 385 85 L 345 85 A 30 30 0 0 0 285 85 L 115 85 A 30 30 0 0 0 55 85 Z";
    const truckPath = "M 30 85 C 30 65, 30 45, 40 45 L 150 45 L 170 10 C 190 5, 250 5, 270 10 L 310 40 L 350 45 C 375 45, 385 55, 385 85 L 345 85 A 30 30 0 0 0 285 85 L 115 85 A 30 30 0 0 0 55 85 Z";

    // Continuous background animations
    gsap.to(".preloader__wheel-spin", { rotation: 360, transformOrigin: "center", ease: "none", repeat: -1, duration: 1.5 });
    const glowAnim = gsap.to("#morphHeadlightGroup", { opacity: 0.4, yoyo: true, repeat: -1, duration: 1.2, ease: "sine.inOut" });

    // Master Morphing Timeline
    const tl = gsap.timeline({
      onComplete: () => {
        preloader.classList.add("is-done");
        revealHero();
        setTimeout(() => { preloader.style.display = "none"; }, 600);
      }
    });

    // Helper for adding Flubber morph to timeline
    function addMorph(fromP, toP, duration, position) {
      const interpolator = flubber.interpolate(fromP, toP, { maxSegmentLength: 2 });
      const proxy = { t: 0 };
      tl.to(proxy, {
        t: 1,
        duration: duration,
        ease: "power2.inOut",
        onUpdate: () => pathEl.setAttribute("d", interpolator(proxy.t))
      }, position);
    }

    // 1. Initial fade in of car and wheels
    tl.to(".preloader__car-box", { opacity: 1, duration: 0.5, ease: "power2.out" })
      .to(".preloader__wheel", { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.4)" }, "-=0.3")
      .to("#morphHeadlightGroup", { opacity: 1, duration: 0.4 }, "-=0.2");

    // 2. Morph Sequence: Sedan -> Coupe -> SUV -> Truck (0.6s morph, 0.2s pause)
    const pause = "+=0.2";
    addMorph(sedanPath, coupePath, 0.6, pause);
    addMorph(coupePath, suvPath, 0.6, pause);
    addMorph(suvPath, truckPath, 0.6, pause);

    // 3. Final Exit Animation (Brighten, blur forward, logo reveal)
    tl.add(() => { glowAnim.kill(); }, pause) // stop pulsing
      .to("#morphHeadlightGroup", { opacity: 1, scale: 1.2, duration: 0.3, transformOrigin: "center" })
      .to(".preloader__car-box", { x: window.innerWidth > 768 ? 800 : 400, filter: "blur(6px)", duration: 0.65, ease: "power3.in" }, "+=0.1")
      .to(".preloader__flash", { opacity: 0.7, duration: 0.08, ease: "power4.out" }, "-=0.2")
      .to(".preloader__flash", { opacity: 0, duration: 0.45, ease: "power2.out" })
      .to("#preloaderLogo", { opacity: 1, y: -10, scale: 1.06, duration: 0.7, ease: "back.out(1.7)" }, "-=0.25")
      .to("#preloaderLogo img", { scale: 1, duration: 0.55, ease: "power3.out" }, "-=0.45")
      .to(preloader, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, "+=0.4");
  }

  /* ---------- 2. HERO ENTRANCE ---------- */
  function revealHero() {
    document.getElementById("siteNav").classList.add("is-visible");
    document.dispatchEvent(new CustomEvent("onist:hero-ready"));
  }

  /* ---------- 3. NAV SCROLL STATE + SCROLLSPY INDICATOR ---------- */
  function initNav() {
    const nav = document.getElementById("siteNav");
    const links = Array.from(document.querySelectorAll("#navLinks a"));
    const sections = links.map((l) => document.getElementById(l.dataset.section)).filter(Boolean);
    let ticking = false;

    function update() {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);

      let current = sections[0];
      const probe = window.scrollY + window.innerHeight * 0.35;
      sections.forEach((sec) => { if (sec && sec.offsetTop <= probe) current = sec; });

      links.forEach((link) => link.classList.toggle("is-active", current && link.dataset.section === current.id));
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    update();
  }

  /* ---------- 4. SCROLL REVEAL (Intersection Observer) ---------- */
  function initReveal() {
    const items = document.querySelectorAll(".reveal, .feature, .stats__item");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    items.forEach((el, i) => {
      // Gentle stagger for elements sharing a parent grid/section.
      el.style.transitionDelay = reduced ? "0ms" : `${Math.min(i % 6, 5) * 70}ms`;
      observer.observe(el);
    });
  }

  /* ---------- 5. INFOTAINMENT-STYLE DROPDOWN ---------- */
  function initDropdown() {
    const trigger = document.getElementById("makeDropdown");
    const panel = document.getElementById("makePanel");
    const valueLabel = document.getElementById("makeValue");
    if (!trigger || !panel) return;

    function close() {
      panel.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }
    function open() {
      panel.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.classList.contains("is-open") ? close() : open();
    });

    panel.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => {
        valueLabel.textContent = li.textContent;
        close();
      });
    });

    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== trigger) close();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- 6. STAT COUNTERS + DASHBOARD PULSE ---------- */
  function initStats() {
    const numbers = document.querySelectorAll(".stats__number");
    if (!numbers.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    numbers.forEach((el) => observer.observe(el));
  }

  function animateCount(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || "";
    const decimals = parseInt(el.dataset.decimal || "0", 10);
    const duration = 1300;
    const start = performance.now();

    if (reduced) { el.textContent = target.toFixed(decimals) + suffix; return; }

    function frame(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (elapsed < 1) {
        requestAnimationFrame(frame);
      } else {
        el.classList.add("is-pulsing");
        setTimeout(() => el.classList.remove("is-pulsing"), 500);
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 7. TESTIMONIALS CAROUSEL ---------- */
  function initTestimonials() {
    const track = document.getElementById("testimonialsTrack");
    const dotsWrap = document.getElementById("testimonialsDots");
    if (!track) return;
    const slides = Array.from(track.children);
    let index = 0;
    let visibleSlides = getVisibleSlides();

    function getVisibleSlides() {
      if (window.innerWidth <= 620) return 1;
      if (window.innerWidth <= 980) return 2;
      return 3;
    }

    function renderDots() {
      const maxIndex = Math.max(0, slides.length - getVisibleSlides());
      dotsWrap.innerHTML = "";
      for (let i = 0; i <= maxIndex; i++) {
        const dot = document.createElement("button");
        dot.setAttribute("aria-label", `Go to review ${i + 1}`);
        if (i === index) dot.classList.add("is-active");
        dot.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(dot);
      }
    }

    function goTo(i) {
      visibleSlides = getVisibleSlides();
      const maxIndex = Math.max(0, slides.length - visibleSlides);
      index = Math.min(Math.max(i, 0), maxIndex);
      renderDots();
      const cardWidth = slides[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      track.style.transform = `translateX(-${index * (cardWidth + gap)}px)`;
      Array.from(dotsWrap.children).forEach((d, di) => d.classList.toggle("is-active", di === index));
    }

    renderDots();
    let timer = setInterval(() => goTo(index + 1), 6000);
    const container = document.getElementById("testimonials");
    container.addEventListener("mouseenter", () => clearInterval(timer));
    container.addEventListener("mouseleave", () => { timer = setInterval(() => goTo(index + 1), 6000); });
    window.addEventListener("resize", () => goTo(index), { passive: true });
  }

  /* ---------- 8. FAQ ACCORDION — glovebox open ---------- */
  function initAccordion() {
    document.querySelectorAll(".accordion__item").forEach((item) => {
      const trigger = item.querySelector(".accordion__trigger");
      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");
        item.closest(".accordion").querySelectorAll(".accordion__item").forEach((other) => {
          other.classList.remove("is-open");
          other.querySelector(".accordion__trigger").setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* ---------- 9. MOBILE BOTTOM SHEET ---------- */
  function initMobileSheet() {
    const burger = document.getElementById("navBurger");
    const sheet = document.getElementById("mobileSheet");
    const backdrop = document.getElementById("sheetBackdrop");
    if (!burger || !sheet) return;

    function open() {
      sheet.classList.add("is-open");
      backdrop.classList.add("is-open");
      sheet.setAttribute("aria-hidden", "false");
      burger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function close() {
      sheet.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      sheet.setAttribute("aria-hidden", "true");
      burger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    burger.addEventListener("click", () => {
      sheet.classList.contains("is-open") ? close() : open();
    });
    backdrop.addEventListener("click", close);
    sheet.querySelectorAll("a, button").forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- 10. SEARCH FORM (demo no-op) ---------- */
  function initSearchForm() {
    const form = document.getElementById("searchPanel");
    if (!form) return;
    form.addEventListener("submit", (e) => e.preventDefault());
  }

  function initVehicleCardNavigation() {
    document.querySelectorAll(".vehicle-card").forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest("button, a")) return;
        window.location.href = "listing.html";
      });
    });
  }

  function initBrowseRails() {
    document.querySelectorAll("[data-rail-prev], [data-rail-next]").forEach((button) => {
      const railName = button.dataset.railPrev || button.dataset.railNext;
      const rail = document.getElementById(railName === "makes" ? "makeGrid" : "typeGrid");
      if (!rail) return;
      button.addEventListener("click", () => {
        rail.scrollBy({ left: button.dataset.railNext ? rail.clientWidth * 0.8 : -rail.clientWidth * 0.8, behavior: "smooth" });
      });
    });
  }

  function initHomeInventoryControls() {
    const grid = document.querySelector("#inventory .vehicle-grid");
    const trigger = document.getElementById("homeFilterTrigger");
    const popover = document.getElementById("homeFilterPopover");
    if (!grid || !trigger || !popover) return;
    const cards = Array.from(grid.querySelectorAll(".vehicle-card"));
    const close = () => { popover.hidden = true; };
    trigger.addEventListener("click", () => { popover.hidden = !popover.hidden; });
    document.getElementById("homeFilterClose").addEventListener("click", close);
    document.getElementById("homeFilterApply").addEventListener("click", () => {
      const filters = {};
      popover.querySelectorAll("[data-home-filter]").forEach((field) => { filters[field.dataset.homeFilter] = field.value; });
      cards.forEach((card) => {
        card.hidden = Object.entries(filters).some(([key, value]) => value && card.dataset[key] !== value);
      });
      close();
    });
    document.addEventListener("click", (event) => {
      if (!popover.hidden && !popover.contains(event.target) && !trigger.contains(event.target)) close();
    });
    document.querySelectorAll("[data-home-view]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-home-view]").forEach((item) => item.classList.toggle("is-active", item === button));
      grid.classList.toggle("home-list-view", button.dataset.homeView === "list");
    }));
  }

  /* ---------- 11. ROAD SCROLLBAR — vertical journey navigation ---------- */
  function initRoadScrollbar() {
    const scrollbar = document.getElementById('roadScrollbar');
    const car = document.getElementById('roadCar');
    const progress = document.getElementById('roadProgress');
    if (!scrollbar || !car || !progress) return;

    const milestones = Array.from(scrollbar.querySelectorAll('.road-scrollbar__milestone'));
    const sectionIds = milestones.map(m => m.dataset.section);
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

    let ticking = false;
    let lastScrollDir = 1;
    let lastScrollY = 0;

    function getMilestonePositions() {
      const trackEl = scrollbar.querySelector('.road-scrollbar__track');
      const trackH = trackEl ? trackEl.offsetHeight : 0;
      const count = milestones.length;
      const padding = 8;
      const positions = [];
      for (let i = 0; i < count; i++) {
        positions.push(padding + ((trackH - padding * 2) * i) / (count - 1));
      }
      return positions;
    }

    function positionMilestones() {
      const positions = getMilestonePositions();
      milestones.forEach((m, i) => {
        m.style.top = positions[i] + 'px';
      });
    }

    function updateRoad() {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPct = docH > 0 ? Math.min(Math.max(scrollY / docH, 0), 1) : 0;

      if (Math.abs(scrollY - lastScrollY) > 2) {
        lastScrollDir = scrollY > lastScrollY ? 1 : -1;
        lastScrollY = scrollY;
      }

      scrollbar.classList.toggle('is-visible', scrollY > 100);

      progress.style.height = (scrollPct * 100) + '%';

      const trackEl = scrollbar.querySelector('.road-scrollbar__track');
      const trackH = trackEl ? trackEl.offsetHeight : 0;
      const carY = 8 + (trackH - 16) * scrollPct;
      car.style.transform = 'translate3d(-50%, ' + carY + 'px, 0)';

      const carSvg = car.querySelector('svg');
      if (carSvg) {
        carSvg.style.transform = 'rotate(90deg) scaleY(' + (lastScrollDir > 0 ? 1 : -1) + ')';
      }

      const probe = scrollY + window.innerHeight * 0.35;
      let activeIdx = 0;
      sections.forEach((sec, i) => {
        if (sec && sec.offsetTop <= probe) activeIdx = i;
      });

      milestones.forEach((m, i) => {
        const sIdx = sectionIds.indexOf(m.dataset.section);
        const sectionEl = sections[sIdx !== -1 ? sIdx : i];
        if (!sectionEl) return;

        const isPassed = sectionEl.offsetTop < scrollY + window.innerHeight * 0.5;
        const isActive = i === activeIdx;

        m.classList.toggle('is-passed', isPassed && !isActive);
        m.classList.toggle('is-active', isActive);
      });

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateRoad);
        ticking = true;
      }
    }

    milestones.forEach(m => {
      m.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(m.dataset.section);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    positionMilestones();
    window.addEventListener('resize', () => {
      positionMilestones();
      updateRoad();
    }, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    updateRoad();
  }

  document.addEventListener("DOMContentLoaded", () => {
    runPreloader();
    initNav();
    initReveal();
    initDropdown();
    initStats();
    initTestimonials();
    initAccordion();
    initMobileSheet();
    initSearchForm();
    initVehicleCardNavigation();
    initHomeInventoryControls();
    initBrowseRails();
    initRoadScrollbar();
  });
})();
