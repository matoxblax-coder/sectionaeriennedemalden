/* SAM — Scroll-driven cinematic one-page
   - Gate lock with localStorage
   - Sequenced hero reveal
   - Reveal-on-enter (IntersectionObserver)
   - Immersive horizontal modules driven by vertical scroll with inertia
   - Subtle mouse drift (optional)
*/

(function(){
  "use strict";

  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Gate
  const gate = qs("#gate");
  const enterBtn = qs("#enterBtn");

  function shouldForceGate(){
    const url = new URL(window.location.href);
    return url.searchParams.get("gate") === "1";
  }

  function lock(){
    document.body.classList.add("is-locked");
  }
  function unlock(){
    document.body.classList.remove("is-locked");
  }

  function openGate(){
    if (!gate) return;
    gate.style.transition = prefersReduced ? "none" : "opacity 520ms cubic-bezier(.16,.84,.24,1)";
    gate.style.opacity = "0";
    unlock();
    window.setTimeout(()=>{
      gate.remove();
      runHeroSequence();
    }, prefersReduced ? 0 : 560);
  }

  
  function applyCurve(p, curve){
    if (curve === "easeOut") return 1 - Math.pow(1 - p, 2);
    if (curve === "easeInOut") return p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p + 2, 2)/2;
    return p;
  }
function initGate(){
    lock();
    const ok = localStorage.getItem("sam_gate_ok") === "1";
    if (ok && !shouldForceGate()){
      // Still keep a short fade to avoid a hard cut
      if (gate){
        gate.style.opacity = "0";
        unlock();
        window.setTimeout(()=>{ gate.remove(); runHeroSequence(); }, prefersReduced ? 0 : 120);
      }
      return;
    }
    if (enterBtn){
      enterBtn.addEventListener("click", ()=>{
        localStorage.setItem("sam_gate_ok", "1");
        openGate();
      });
    }
  }

  // Hero sequence
  const heroKicker = qs("[data-hero='kicker']");
  const heroH1 = qs("[data-hero='h1']");
  const heroSub = qs("[data-hero='sub']");
  const heroMeta = qs("[data-hero='meta']");

  function fadeIn(el, delayMs){
    if (!el) return;
    el.classList.add("reveal");
    window.setTimeout(()=> el.classList.add("is-in"), prefersReduced ? 0 : delayMs);
  }

  function runHeroSequence(){
    // Ensure elements start hidden
    [heroKicker, heroH1, heroSub, heroMeta].forEach(el=>{
      if (!el) return;
      el.classList.add("reveal");
      el.classList.remove("is-in");
    });

    fadeIn(heroKicker, 120);
    fadeIn(heroH1, 220);
    fadeIn(heroSub, 360);
    fadeIn(heroMeta, 520);
  }

  // Generic reveals
  function initReveals(){
    const els = qsa(".reveal-once");
    if (!els.length) return;

    if (prefersReduced){
      els.forEach(el=> el.classList.add("reveal","is-in"));
      return;
    }

    const io = new IntersectionObserver((entries)=>{
      for (const e of entries){
        if (e.isIntersecting){
          e.target.classList.add("reveal","is-in");
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.22 });

    els.forEach(el=> io.observe(el));
  }

  // Immersive modules
  class ImmersiveModule{
    constructor(root){
      this.root = root;
      this.track = qs(".immersive__bgTrack", root);
      this.wordEls = qsa("[data-word-step]", root);
      this.plane = qs(".immersive__plane", root);
      this.hudTitle = qs("[data-hud-title]", root);
      this.hudText = qs("[data-hud-text]", root);
      this.hudStep = qs("[data-hud-step]", root);

      this.steps = parseInt(root.getAttribute("data-steps") || "1", 10);
      this.axis = root.getAttribute("data-axis") || "x";
      this.ease = parseFloat(root.getAttribute("data-ease") || "0.08");
      this.speed = parseFloat(root.getAttribute("data-speed") || "1");
      this.curve = root.getAttribute("data-curve") || "linear";

      this.target = 0;   // target progress 0..1
      this.current = 0;  // inertial progress

      this.mouseX = 0;
      this.mouseY = 0;

      this._raf = null;
      this._onScroll = this.onScroll.bind(this);
      this._onMouse = this.onMouse.bind(this);

      this.bind();
      this.onScroll();
      this.loop();
    }

    bind(){
      window.addEventListener("scroll", this._onScroll, { passive:true });
      if (!prefersReduced){
        window.addEventListener("mousemove", this._onMouse, { passive:true });
      }
      window.addEventListener("resize", this._onScroll, { passive:true });
    }

    unbind(){
      window.removeEventListener("scroll", this._onScroll);
      window.removeEventListener("mousemove", this._onMouse);
      window.removeEventListener("resize", this._onScroll);
      if (this._raf) cancelAnimationFrame(this._raf);
    }

    onMouse(e){
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      // Subtle: keep very low amplitude.
      this.mouseX = nx;
      this.mouseY = ny;
    }

    getScrollProgress(){
      const rect = this.root.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      // root height is N * 100vh (set in HTML). progress should be 0 at top entering, 1 at end.
      const total = rect.height - vh;
      if (total <= 0) return 0;

      const scrolled = clamp(-rect.top, 0, total);
      return scrolled / total;
    }

    onScroll(){
      const base = this.getScrollProgress();
      const curved = applyCurve(base, this.curve);
      this.target = clamp(curved * this.speed, 0, 1);
    }

    loop(){
      // inertial progression
      const t = prefersReduced ? 1 : this.ease;
      this.current = lerp(this.current, this.target, t);

      // Background translation: move track to reveal panels horizontally to the RIGHT
      // If track has panels in order, moving to the LEFT shows next panel.
      const travel = (this.steps - 1) * 100;
      const x = -this.current * travel;

      if (this.track){
        this.track.style.transform = `translate3d(${x}%,0,0)`;
      }

      // Words: segment-based opacity
      this.updateWords();

      // HUD: update step number and text if provided in data attributes
      this.updateHud();

      // Plane micro-drift (mass effect): tiny opposite drift
      if (this.plane && !prefersReduced){
        const driftX = this.mouseX * -4.5;   // px
        const driftY = this.mouseY * -3.2;   // px
        this.plane.style.transform = `translate3d(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px), 0)`;
      }

      this._raf = requestAnimationFrame(()=> this.loop());
    }

    updateWords(){
      if (!this.wordEls.length) return;
      const stepSize = 1 / this.steps;

      for (const el of this.wordEls){
        const idx = parseInt(el.getAttribute("data-word-step") || "0", 10);
        const start = idx * stepSize;
        const end = start + stepSize;

        // Make a soft “window” around the center of the segment
        const mid = (start + end) / 2;
        const d = Math.abs(this.current - mid) / (stepSize/2);
        const opacity = clamp(1 - d, 0, 1);

        el.style.opacity = String(0.25 + opacity * 0.75);
      }
    }

    updateHud(){
      if (!this.hudStep && !this.hudTitle && !this.hudText) return;
      const idx = clamp(Math.floor(this.current * this.steps), 0, this.steps - 1);

      if (this.hudStep){
        const label = String(idx + 1).padStart(2, "0");
        this.hudStep.textContent = `ÉTAPE ${label}/${String(this.steps).padStart(2,"0")}`;
      }

      // Optional per-step HUD content: data arrays via attributes
      const titles = (this.root.getAttribute("data-hud-titles") || "").split("|").map(s=>s.trim()).filter(Boolean);
      const texts  = (this.root.getAttribute("data-hud-texts")  || "").split("|").map(s=>s.trim()).filter(Boolean);

      if (this.hudTitle && titles[idx]) this.hudTitle.textContent = titles[idx];
      if (this.hudText && texts[idx]) this.hudText.textContent = texts[idx];
    }
  }

  function initImmersives(){
    const nodes = qsa("[data-immersive='module']");
    nodes.forEach(n => new ImmersiveModule(n));
  }

  // Sky background swapping (silent variation)
  function initSky(){
    const sky = qs("#skyBg");
    if (!sky) return;

    const frames = [
      "assets/sky-01.jpg",
      "assets/sky-02.jpg",
      "assets/sky-03.jpg",
      "assets/sky-04.jpg"
    ];

    if (prefersReduced){
      sky.style.backgroundImage = `radial-gradient(700px 420px at 40% 10%, rgba(116,147,180,.14), transparent 60%),
      linear-gradient(180deg, rgba(0,0,0,.85), rgba(0,0,0,.92)),
      url('${frames[0]}')`;
      return;
    }

    // Change frame based on scroll position around the sky section
    const skySection = qs("#transition-sky");
    if (!skySection) return;

    const onScroll = ()=>{
      const r = skySection.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      const idx = clamp(Math.floor(p * frames.length), 0, frames.length - 1);
      sky.style.backgroundImage = `radial-gradient(700px 420px at 40% 10%, rgba(116,147,180,.14), transparent 60%),
      linear-gradient(180deg, rgba(0,0,0,.85), rgba(0,0,0,.92)),
      url('${frames[idx]}')`;
    };
    window.addEventListener("scroll", onScroll, { passive:true });
    window.addEventListener("resize", onScroll, { passive:true });
    onScroll();
  }

  // Boot
  document.addEventListener("DOMContentLoaded", ()=>{
    initGate();
    initReveals();
    initImmersives();
    initSky();
  });

})();
