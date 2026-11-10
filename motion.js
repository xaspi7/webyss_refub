// Pohyb pro redesign homepage: úvodní animace, slova ve větě a roztažení ukázky při scrollu.
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

  // Úvodní animace hero (spustí se po načtení písem, ať text neskáče)
  function playIntro() {
    requestAnimationFrame(() => root.classList.add("loaded"));
  }
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(playIntro);
  } else {
    playIntro();
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
    // 0, když věta vstupuje zespodu; 1, když je zhruba ve třetině výšky okna
    const p = clamp((vh * 0.88 - rect.top) / (vh * 0.88 - vh * 0.3 + rect.height * 0.2), 0, 1);
    const n = words.length;
    words.forEach((w, i) => {
      const local = clamp(p * (n + 3) - i, 0, 3) / 3;
      w.style.opacity = String(0.16 + local * 0.84);
    });
  }

  // Ukázka práce: rámeček se při scrollu roztáhne z šířky obsahu na celou šířku okna
  const track = document.querySelector("[data-showcase]");
  const frame = track ? track.querySelector(".frame") : null;
  const desktop = window.matchMedia("(min-width: 761px)");

  function updateShowcase() {
    if (!track || !frame) return;
    if (!desktop.matches || reduceMotion.matches) {
      frame.style.transform = "";
      frame.style.borderRadius = "";
      return;
    }
    const headerH = header ? header.offsetHeight : 0;
    const rect = track.getBoundingClientRect();
    const total = track.offsetHeight - (window.innerHeight - headerH);
    const p = clamp((headerH - rect.top) / Math.max(total, 1), 0, 1);
    const eased = 1 - Math.pow(1 - clamp(p / 0.8, 0, 1), 3);

    const vw = document.documentElement.clientWidth;
    const gutter = parseFloat(getComputedStyle(document.querySelector(".wrap")).paddingLeft) || 24;
    const start = clamp((vw - gutter * 2) / vw, 0.6, 1);
    const scale = start + (1 - start) * eased;

    frame.style.transform = "scale(" + scale.toFixed(4) + ")";
    frame.style.borderRadius = (12 * (1 - eased)).toFixed(1) + "px";
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeader();
      updateStatement();
      updateShowcase();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  reduceMotion.addEventListener?.("change", onScroll);
  desktop.addEventListener?.("change", onScroll);
  onScroll();
})();
