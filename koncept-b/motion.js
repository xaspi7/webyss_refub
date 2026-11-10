// Koncept B: pravítko, úvod, značkovač, horizontální služby, ukázka, ceny.
// Bez JS nebo s "méně pohybu" je všechno rovnou vidět v konečném stavu.
(function () {
  const root = document.documentElement;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wide = window.matchMedia("(min-width: 900px)");
  const remPx = () => parseFloat(getComputedStyle(root).fontSize) || 16;
  const UNIT = 1.1; // rem na jeden "centimetr", shodné s --u v CSS

  /* ---------- svislé pravítko ---------- */
  const tapeInner = $(".tape-inner");
  const tapeVal = $("#tape-val");

  function buildTape() {
    if (!tapeInner) return;
    const u = remPx() * UNIT;
    const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    tapeInner.style.height = docH + "px";
    $$(".tape-num", tapeInner).forEach((n) => n.remove());
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= Math.floor(docH / (u * 10)); i++) {
      const s = document.createElement("span");
      s.className = "tape-num";
      s.textContent = String(i * 10);
      s.style.top = i * 10 * u + "px";
      frag.appendChild(s);
    }
    tapeInner.appendChild(frag);
  }

  function updateTape() {
    if (!tapeInner) return;
    const u = remPx() * UNIT;
    tapeInner.style.transform = "translate3d(0," + -window.scrollY + "px,0)";
    if (tapeVal) tapeVal.textContent = String(Math.round((window.scrollY + window.innerHeight * 0.42) / u));
  }

  /* ---------- vodorovné pravítko v úvodu ---------- */
  const tapeH = $(".tape-h-inner");
  function buildTapeH() {
    if (!tapeH) return;
    $$(".tape-h-num", tapeH).forEach((n) => n.remove());
    const u = remPx() * UNIT;
    const width = window.innerWidth * 3.2;
    const frag = document.createDocumentFragment();
    for (let i = 0; i <= Math.floor(width / (u * 10)); i++) {
      const s = document.createElement("span");
      s.className = "tape-h-num";
      s.textContent = String(i * 10);
      s.style.left = i * 10 * u + "px";
      frag.appendChild(s);
    }
    tapeH.appendChild(frag);
  }

  /* ---------- úvod ---------- */
  function playIntro() {
    requestAnimationFrame(() => root.classList.add("loaded"));
  }
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(playIntro);
  } else {
    playIntro();
  }

  const hero = $(".hero");
  const heroTitle = $(".hero-title");
  function updateHero() {
    if (!hero) return;
    const h = hero.offsetHeight;
    const y = window.scrollY;
    root.classList.toggle("hero-active", y < h - 80);
    if (reduce.matches) return;
    if (heroTitle) {
      const p = clamp(y / (h * 0.85), 0, 1);
      heroTitle.style.fontStretch = (62 + p * 20).toFixed(1) + "%";
    }
    if (tapeH) tapeH.style.transform = "translate3d(" + -y * 0.8 + "px,0,0)";
  }

  /* ---------- hlavička a navigace ---------- */
  const header = $(".site-header");
  const navLinks = $$(".main-nav a");
  const navSections = $$("[data-nav]");
  function updateNav() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = "";
    navSections.forEach((s) => {
      if (s.getBoundingClientRect().top + window.scrollY <= y) current = s.id;
    });
    navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + current));
  }

  /* ---------- ukazatel scrollu na mobilu ---------- */
  const pbar = $(".pbar");
  function updatePbar() {
    if (!pbar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    pbar.style.transform = "scaleX(" + (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0) + ")";
  }

  /* ---------- věta se značkovačem ---------- */
  const marker = $("[data-marker]");
  let words = [];
  if (marker) {
    const parts = marker.textContent.trim().split(/\s+/);
    marker.textContent = "";
    marker.setAttribute("aria-label", parts.join(" "));
    words = parts.map((w, i) => {
      const span = document.createElement("span");
      span.className = "mw";
      span.setAttribute("aria-hidden", "true");
      span.textContent = w;
      marker.appendChild(span);
      if (i < parts.length - 1) marker.appendChild(document.createTextNode(" "));
      return span;
    });
  }
  function updateMarker() {
    if (!marker || !words.length) return;
    if (reduce.matches) {
      words.forEach((w) => w.style.setProperty("--k", "1"));
      return;
    }
    const r = marker.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.85 - r.top) / (vh * 0.55 + r.height * 0.3), 0, 1);
    const n = words.length;
    words.forEach((w, i) => w.style.setProperty("--k", clamp(p * (n + 2) - i, 0, 1).toFixed(3)));
  }

  /* ---------- služby: vodorovný scroll ---------- */
  const hs = $("[data-hscroll]");
  const hsTrack = hs ? $(".hs-track", hs) : null;
  const hsBar = hs ? $(".hs-progress i", hs) : null;
  const hsSticky = hs ? $(".hs-sticky", hs) : null;
  let hsMax = 0;

  function layoutHs() {
    if (!hs || !hsTrack) return;
    const on = wide.matches && !reduce.matches;
    hs.classList.toggle("is-h", on);
    if (!on) {
      hs.style.height = "";
      hsTrack.style.transform = "";
      return;
    }
    hsMax = Math.max(0, hsTrack.scrollWidth - hsSticky.clientWidth);
    hs.style.height = hsMax + window.innerHeight + "px";
  }
  function updateHs() {
    if (!hs || !hs.classList.contains("is-h")) return;
    const rect = hs.getBoundingClientRect();
    const span = hs.offsetHeight - window.innerHeight;
    const p = span > 0 ? clamp(-rect.top / span, 0, 1) : 0;
    hsTrack.style.transform = "translate3d(" + -p * hsMax + "px,0,0)";
    if (hsBar) hsBar.style.transform = "scaleX(" + p + ")";
  }

  /* ---------- ukázka práce: náhled a obrysové nápisy ---------- */
  const clips = $$("[data-clip]");
  function updateClips() {
    clips.forEach((el) => {
      if (reduce.matches) return el.style.setProperty("--p", "1");
      const r = el.getBoundingClientRect();
      const p = clamp((window.innerHeight - r.top) / (window.innerHeight * 0.75), 0, 1);
      el.style.setProperty("--p", (1 - Math.pow(1 - p, 3)).toFixed(4));
    });
  }
  const marquees = $$("[data-marquee]");
  function updateMarquees() {
    if (reduce.matches) return;
    marquees.forEach((m) => {
      const r = m.parentElement.getBoundingClientRect();
      const dir = Number(m.dataset.marquee) || 1;
      m.style.transform = "translate3d(" + (r.top - window.innerHeight / 2) * 0.4 * dir + "px,0,0)";
    });
  }

  /* ---------- vstup prvků do záběru ---------- */
  const reveal = $$("[data-rise], [data-line], .step");
  if ("IntersectionObserver" in window && !reduce.matches) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 }
    );
    reveal.forEach((el) => io.observe(el));
  } else {
    reveal.forEach((el) => el.classList.add("in"));
  }

  /* ---------- ceny: počítání od nuly ---------- */
  const fmt = (n) => n.toLocaleString("cs-CZ");
  $$("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count);
    el.textContent = fmt(end);
    if (reduce.matches || !("IntersectionObserver" in window)) return;
    el.textContent = "0";
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const dur = 1500;
      (function tick(now) {
        const k = clamp((now - t0) / dur, 0, 1);
        el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - k, 4))));
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.4 });
    io.observe(el);
  });

  /* ---------- smyčka ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateTape();
      updateHero();
      updateNav();
      updatePbar();
      updateMarker();
      updateHs();
      updateClips();
      updateMarquees();
      ticking = false;
    });
  }
  function relayout() {
    layoutHs();
    buildTape();
    buildTapeH();
    onScroll();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", relayout);
  window.addEventListener("load", relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  if (wide.addEventListener) wide.addEventListener("change", relayout);
  if (reduce.addEventListener) reduce.addEventListener("change", relayout);
  relayout();
})();
