// Volitelné vylepšení přes GSAP + ScrollTrigger (načítá se z CDN).
// Když se knihovny nenačtou, nebo si člověk nepřeje animace, nic se nestane
// a ukázku práce animuje záložní kód v motion.js. Vypnutí na zkoušku: přidej ?gsap=0 k adrese.
(function () {
  const root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) return;
  if (/[?&]gsap=0/.test(window.location.search)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const section = document.querySelector(".case");
  const media = document.querySelector(".case-media");
  if (!section || !media) return;

  try {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    // Počítač: ukázka se přišpendlí pod hlavičku a při scrollu se v ní postupně děje víc věcí
    mm.add("(min-width: 961px)", () => {
      root.classList.add("gsap");
      const headerH = (document.querySelector(".site-header") || { offsetHeight: 68 }).offsetHeight;

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: section,
          start: "top top+=" + headerH,
          end: "+=120%",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
        },
      });

      tl.fromTo(media, { "--p": 0.35 }, { "--p": 1, duration: 1 }, 0)
        .fromTo(".ms-photo", { scale: 1.12 }, { scale: 1, duration: 1.1 }, 0)
        .from(".case-facts div", { opacity: 0.2, y: 14, stagger: 0.14, duration: 0.5 }, 0.3);

      return () => root.classList.remove("gsap");
    });

    // Telefon a tablet: bez přišpendlení, jen plynulé otevření podle scrollu
    mm.add("(max-width: 960px)", () => {
      root.classList.add("gsap");
      gsap.fromTo(
        media,
        { "--p": 0.2 },
        {
          "--p": 1,
          ease: "none",
          scrollTrigger: { trigger: media, start: "top 92%", end: "top 35%", scrub: 0.5 },
        }
      );
      return () => root.classList.remove("gsap");
    });
  } catch (err) {
    root.classList.remove("gsap");
    if (window.console) console.warn("GSAP animace se nespustila, běží záložní režim.", err);
  }
})();
