// Pohyb pro redesign: úvodní animace, věta slovo po slovu, kreslení čar, ukázka a kroky procesu.
// Bez JS (nebo s "méně pohybu" v systému) je všechno rovnou vidět v konečném stavu.
(function () {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  // Hlavička dostane pozadí až po prvním posunu
  function updateHeader() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  }

  // Úvodní animace nadpisu (po načtení písem, ať text neskáče)
  function playIntro() {
    requestAnimationFrame(() => root.classList.add("loaded"));
  }
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(playIntro);
  } else {
    playIntro();
  }

  // Čáry se nakreslí, když se prvek objeví; kroky procesu se rozsvítí uprostřed obrazovky
  const lineEls = document.querySelectorAll("[data-line]");
  const stepEls = document.querySelectorAll(".step");

  if ("IntersectionObserver" in window) {
    const lineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            lineObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 }
    );
    lineEls.forEach((el) => lineObserver.observe(el));

    const stepObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => entry.target.classList.toggle("is-active", entry.isIntersecting));
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );
    stepEls.forEach((el) => stepObserver.observe(el));
  } else {
    lineEls.forEach((el) => el.classList.add("in"));
    stepEls.forEach((el) => el.classList.add("is-active"));
  }

  // Věta, která se čte slovo po slovu podle scrollu
  const statement = document.querySelector("[data-statement]");
  let words = [];
  if (statement) {
    const text = statement.textContent.trim().split(/\s+/);
    statement.textContent = "";
    statement.setAttribute("aria-label", text.join(" "));
    words = text.map((word, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.setAttribute("aria-hidden", "true");
      span.textContent = word;
      statement.appendChild(span);
      if (i < text.length - 1) statement.appendChild(document.createTextNode(" "));
      return span;
    });
  }

  function updateStatement() {
    if (!statement || !words.length) return;
    if (reduceMotion.matches) {
      words.forEach((w) => { w.style.opacity = "1"; });
      return;
    }
    const rect = statement.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.88 - rect.top) / (vh * 0.58 + rect.height * 0.2), 0, 1);
    const n = words.length;
    words.forEach((w, i) => {
      const local = clamp(p * (n + 3) - i, 0, 3) / 3;
      w.style.opacity = String(0.16 + local * 0.84);
    });
  }

  // Ukázka práce: fotka se otevírá z menšího výřezu a pomalu se přibližuje do záběru
  const clipEls = document.querySelectorAll("[data-clip]");

  function updateClips() {
    // Když animaci převezme GSAP (gsap-motion.js), tahle záloha nic nedělá
    if (root.classList.contains("gsap")) return;
    clipEls.forEach((el) => {
      if (reduceMotion.matches) {
        el.style.setProperty("--p", "1");
        return;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh - rect.top) / (vh * 0.75), 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.style.setProperty("--p", eased.toFixed(4));
    });
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeader();
      updateStatement();
      updateClips();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", onScroll);
  onScroll();
})();
