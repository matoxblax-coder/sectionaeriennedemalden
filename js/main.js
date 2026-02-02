/* ==========================================================================
   S.A.M. — ONE-PAGE
   Réglages rapides (modifiez ici)
   ========================================================================== */

const SETTINGS = {
  gateKey: "sam_gate_ok",
  gateParam: "gate",
  revealRootMargin: "-10% 0px -10% 0px",
  lazyRootMargin: "1200px 0px",
  moduleInertia: 0.10,          // 0.06–0.14 : inertie ressentie
  moduleEdgeFade: 0.12,        // 0.08–0.16 : fondu d'entrée/sortie (progress)
  moduleMinAlpha: 0.55,        // plancher d'opacité aux bords
  parallaxStrength: 0.9,        // 0.6–1.2 : amplitude (multiplicateur de --module-parallax)
  parallaxEase: 0.12,           // lissage pointeur
  dotClickSnap: true,           // clic sur dots : positionne l'étape
  mailToFallback: "contact@sam.example"
};

const MODULE_COPY = {
  alphajet: {
    total: 4,
    steps: [
      {
        title: "MEETING",
        text: "Présence maîtrisée. Cadre public. Exécution nette. Le brief fixe la ligne et la marge. Rien de plus."
      },
      {
        title: "COORDINATION",
        text: "Rôles clairs, communications utiles, distances tenues. La formation existe par la cohérence, pas par le bruit."
      },
      {
        title: "RIGUEUR",
        text: "Checks courts. Paramètres stables. Corrections minimales. La sécurité précède tout, sans exception."
      },
      {
        title: "DISCIPLINE",
        text: "Tenue de posture jusqu’à la fin. Retours sobres, traçables. Le niveau se vérifie dans la répétition."
      }
    ]
  },
  rafale: {
    total: 3,
    steps: [
      {
        title: "PERMANENCE OPÉRATIONNELLE",
        text: "Maintien de capacité. Présence. Disponibilité. La mission commence avant l’action visible."
      },
      {
        title: "SURVEILLANCE",
        text: "Lecture de situation, contrôle des paramètres, anticipation. La vigilance est continue, silencieuse."
      },
      {
        title: "ENDURANCE",
        text: "Tenir la mission du début à la fin. Continuité, sobriété, stabilité. Pas d’écart, pas de folklore."
      }
    ]
  }
};

/* ==========================================================================
   Utils
   ========================================================================== */

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function prefersReducedMotion(){
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pad2(n){
  const s = String(n);
  return s.length === 1 ? "0" + s : s;
}

/* ==========================================================================
   Gate
   ========================================================================== */

function initGate(){
  const gate = qs("#gate");
  const enterBtn = qs("#gate-enter");
  if (!gate || !enterBtn) return;

  const params = new URLSearchParams(window.location.search);
  const forceGate = params.get(SETTINGS.gateParam) === "1";

  const storedOk = localStorage.getItem(SETTINGS.gateKey) === "1";
  const shouldLock = forceGate || !storedOk;

  const focusableSel = "a[href], button, input, textarea, [tabindex]:not([tabindex='-1'])";
  let lastFocused = null;

  function lock(){
    document.body.classList.add("is-gate-locked");
    gate.hidden = false;
    lastFocused = document.activeElement;
    // Focus first actionable element
    setTimeout(() => enterBtn.focus(), 0);
  }

  function unlock(){
    document.body.classList.remove("is-gate-locked");
    gate.hidden = true;
    document.body.classList.add("is-ready");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function approve(){
    localStorage.setItem(SETTINGS.gateKey, "1");
    gate.classList.add("is-leaving");
    // sortie contrôlée : sensation d'inertie
    setTimeout(() => {
      gate.classList.remove("is-leaving");
      unlock();
    }, 520);
  }

  function trapFocus(e){
    if (gate.hidden) return;

    if (e.key === "Escape") {
      // pas de fermeture : l'accès doit être validé
      e.preventDefault();
      return;
    }

    if (e.key !== "Tab") return;

    const focusables = qsa(focusableSel, gate).filter(el => !el.hasAttribute("disabled"));
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  enterBtn.addEventListener("click", approve);
  document.addEventListener("keydown", trapFocus);

  if (shouldLock) lock();
  else {
    gate.hidden = true;
    document.body.classList.remove("is-gate-locked");
    document.body.classList.add("is-ready");
  }
}

/* ==========================================================================
   Reveals (IntersectionObserver)
   ========================================================================== */

function initReveals(){
  const nodes = qsa("[data-reveal]");
  if (!nodes.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries){
      if (e.isIntersecting){
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    }
  }, { root: null, threshold: 0.12, rootMargin: SETTINGS.revealRootMargin });

  nodes.forEach(n => io.observe(n));
}

/* ==========================================================================
   Lazy images (for non-hero and bg slides)
   ========================================================================== */

function initLazyImages(){
  const imgs = qsa("img[data-src]");
  if (!imgs.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries){
      if (!e.isIntersecting) continue;
      const img = e.target;
      io.unobserve(img);
      const src = img.getAttribute("data-src");
      if (!src) return;
      img.decoding = "async";
      img.loading = "lazy";
      img.src = src;
    }
  }, { root: null, threshold: 0.01, rootMargin: SETTINGS.lazyRootMargin });

  imgs.forEach(img => io.observe(img));
}

function initImageFallback(){
  const imgs = qsa("img");
  imgs.forEach(img => {
    img.addEventListener("error", () => img.classList.add("is-broken"), { once: true });
  });
}

/* ==========================================================================
   Form (mailTo)
   ========================================================================== */


/* ==========================================================================
   HUD NAV (sections actives)
   ========================================================================== */

function initSectionHud(){
  const value = qs("#hudnav-value");
  const ticksWrap = qs("#hudnav-ticks");
  if (!ticksWrap) return;

  const items = [
    { id: "hero", label: "DÉCOLLAGE" },
    { id: "silence", label: "SILENCE" },
    { id: "alphajet", label: "ALPHAJET" },
    { id: "rafale", label: "RAFALE" },
    { id: "doctrine", label: "DOCTRINE" },
    { id: "capabilities", label: "CAPACITÉS" },
    { id: "legitimacy", label: "LÉGITIMITÉ" },
    { id: "unit", label: "ATHOS" },
    { id: "gallery", label: "GALERIE" },
    { id: "contact", label: "CONTACT" }
  ];

  const nodes = items
    .map(it => ({...it, el: document.getElementById(it.id)}))
    .filter(it => it.el);

  const tickEls = qsa("[data-hud-tick]", ticksWrap);
  const byId = new Map(tickEls.map(t => [t.getAttribute("data-hud-tick"), t]));

  let activeId = null;

  const io = new IntersectionObserver((entries) => {
    // choisir l'entrée la plus "centrée" par ratio
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => (b.intersectionRatio - a.intersectionRatio));

    if (!visible.length) return;

    const id = visible[0].target.id;
    if (id === activeId) return;
    activeId = id;

    for (const it of items){
      const tick = byId.get(it.id);
      if (tick) tick.classList.toggle("is-active", it.id === id);
    }
    const current = items.find(x => x.id === id);
    if (value && current) value.textContent = current.label;
  }, { root: null, threshold: [0.2, 0.35, 0.5, 0.65], rootMargin: "-35% 0px -35% 0px" });

  nodes.forEach(n => io.observe(n.el));
}

function initForm(){
  const btn = qs("#form-send");
  const form = qs(".form");
  if (!btn || !form) return;

  btn.addEventListener("click", () => {
    const subject = qs("input[name='subject']", form)?.value?.trim() || "Demande";
    const slot = qs("input[name='slot']", form)?.value?.trim() || "(créneau à préciser)";
    const msg = qs("textarea[name='message']", form)?.value?.trim() || "";
    const contact = qs("input[name='contact']", form)?.value?.trim() || "";

    const bodyLines = [
      "Objet : " + subject,
      "Créneau : " + slot,
      contact ? ("Contact : " + contact) : "",
      "",
      msg
    ].filter(Boolean);

    const mailto = SETTINGS.mailToFallback;
    const url = "mailto:" + encodeURIComponent(mailto) +
      "?subject=" + encodeURIComponent("S.A.M. — " + subject) +
      "&body=" + encodeURIComponent(bodyLines.join("\n"));

    window.location.href = url;
  });
}

/* ==========================================================================
   Modules (scroll piloté, performant via rAF)
   ========================================================================== */

function initModules(){
  const reduced = prefersReducedMotion();
  const modules = qsa(".js-module").map(el => createModule(el, reduced)).filter(Boolean);
  if (!modules.length) return;

  // Activation: n'actualise que lorsque le module est proche du viewport
  for (const m of modules) m.isActive = false;

  const activeIO = new IntersectionObserver((entries) => {
    for (const e of entries){
      const mod = modules.find(x => x.section === e.target);
      if (!mod) continue;
      mod.isActive = e.isIntersecting;
    }
  }, { root: null, threshold: 0.01, rootMargin: "240px 0px 240px 0px" });

  modules.forEach(m => activeIO.observe(m.section));

  let pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let rafId = 0;
  let lastActivity = performance.now();

  function onPointerMove(ev){
    const x = ((ev.clientX / window.innerWidth) * 2 - 1);
    const y = ((ev.clientY / window.innerHeight) * 2 - 1);
    // clamp : évite les écarts en bord d'écran / multi-écrans
    const cx = Math.max(-1, Math.min(1, x));
    const cy = Math.max(-1, Math.min(1, y));
    pointer.tx = cx;
    pointer.ty = cy;
    lastActivity = performance.now();
    start();
  }

  function onScroll(){
    lastActivity = performance.now();
    start();
  }

  function tick(){
    // Pointeur : lissage léger (inertie)
    pointer.x += (pointer.tx - pointer.x) * SETTINGS.parallaxEase;
    pointer.y += (pointer.ty - pointer.y) * SETTINGS.parallaxEase;

    const scrollY = window.scrollY || window.pageYOffset;

    let anyActive = false;
    for (const m of modules){
      if (!m.isActive) continue;
      anyActive = true;
      m.update(scrollY, pointer, reduced);
    }

    // Si rien d'actif et pas d'activité récente : stop
    const now = performance.now();
    if (!anyActive && (now - lastActivity) > 900){
      stop();
      return;
    }

    rafId = window.requestAnimationFrame(tick);
  }

  function start(){
    if (rafId) return;
    rafId = window.requestAnimationFrame(tick);
  }

  function stop(){
    if (!rafId) return;
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => modules.forEach(m => m.recalc()), { passive: true });
  if (!reduced){
    window.addEventListener("mousemove", onPointerMove, { passive: true });
  }

  // Synchronisation initiale
  start();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
}

function createModule(section, reduced){
  const key = section.getAttribute("data-module");
  const copy = MODULE_COPY[key];
  if (!copy) return null;

  const steps = copy.total;
  section.style.setProperty("--steps", String(steps));

  const strip = qs(".bg__strip", section);
  const aircraft = qs(".module__aircraft", section);
  const stepIndex = qs(".js-stepIndex", section);
  const stepTotal = qs(".js-stepTotal", section);
  const stepTitle = qs(".js-stepTitle", section);
  const stepText = qs(".js-stepText", section);
  const dotBtns = qsa("[data-step-dot]", section);

  let start = 0;
  let end = 0;
  let targetP = 0;
  let p = 0;
  let activeStep = -1;

  function recalc(){
    const rect = section.getBoundingClientRect();
    const top = rect.top + (window.scrollY || window.pageYOffset);
    start = top;
    const scrollLen = Math.max(1, section.offsetHeight - window.innerHeight);
    end = start + scrollLen;
  }

  function setStep(i){
    const s = copy.steps[i];
    if (!s) return;
    if (stepIndex) stepIndex.textContent = pad2(i + 1);
    if (stepTotal) stepTotal.textContent = pad2(steps);
    if (stepTitle) stepTitle.textContent = s.title;
    if (stepText) stepText.textContent = s.text;

    dotBtns.forEach((b, idx) => {
      b.classList.toggle("is-active", idx === i);
      b.setAttribute("aria-selected", idx === i ? "true" : "false");
      b.setAttribute("tabindex", idx === i ? "0" : "-1");
    });
  }

  function snapToStep(i){
    if (!SETTINGS.dotClickSnap) return;
    // vise le début du segment d'étape
    const seg = 1 / Math.max(1, (steps - 1));
    let wanted = (i * seg) + 0.0005;
    wanted = Math.min(1, Math.max(0, wanted)); // petit offset pour éviter bord exact
    const y = start + wanted * (end - start);
    window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
  }

  dotBtns.forEach((b, idx) => {
    b.addEventListener("click", () => snapToStep(idx));
  });

  function update(scrollY, pointer, reducedLocal){
    if (!end) recalc();

    targetP = clamp01((scrollY - start) / Math.max(1, (end - start)));

    // inertie ressentie
    const inertia = reducedLocal ? 1 : SETTINGS.moduleInertia;
    p += (targetP - p) * inertia;

    // fondu d'entrée/sortie : évite les raccords secs entre modules
    const edge = SETTINGS.moduleEdgeFade;
    let a = 1;
    if (p < edge) a = p / edge;
    else if (p > (1 - edge)) a = (1 - p) / edge;
    a = Math.max(SETTINGS.moduleMinAlpha, Math.min(1, a));
    section.style.setProperty("--module-alpha", a.toFixed(3));

    // mouvement des fonds (horizontal)
    if (strip){
      const travel = (steps - 1) * window.innerWidth;
      const x = -Math.round(p * travel);
      strip.style.transform = `translate3d(${x}px,0,0)`;
    }

    // étape active
    const idx = Math.min(steps - 1, Math.floor(p * (steps - 1) + 1e-6));
    if (idx !== activeStep){
      activeStep = idx;
      setStep(idx);
    }

    // parallax avion (subtil)
    if (aircraft && !reducedLocal){
      const px = pointer.x * SETTINGS.parallaxStrength;
      const py = pointer.y * SETTINGS.parallaxStrength;
      section.style.setProperty("--mx", px.toFixed(3));
      section.style.setProperty("--my", py.toFixed(3));
    } else {
      section.style.setProperty("--mx", "0");
      section.style.setProperty("--my", "0");
    }
  }

  recalc();
  setStep(0);

  return { section, recalc, update, isActive: false };
}

/* ==========================================================================
   Boot
   ========================================================================== */

function boot(){
  initGate();
  initReveals();
  initLazyImages();
  initImageFallback();
  initForm();
  initSectionHud();
  initModules();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
