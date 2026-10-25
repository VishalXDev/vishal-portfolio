(function () {
  var root = document.documentElement, $ = function (s, c) { return (c || document).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // theme toggle
  $("[data-theme-toggle]").addEventListener("click", function () {
    var next = root.dataset.theme === "dark" ? "light" : "dark"; root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
  // mobile menu
  var nav = $("[data-nav]"), burger = $("[data-burger]");
  burger.addEventListener("click", function () { var o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
  $$(".links a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }); });
  // current section in nav
  var secs = $$("main section[id]").filter(function (s) { return $('.links a[href="#' + s.id + '"]'); });
  var navObs = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) $$(".links a").forEach(function (a) { if (a.getAttribute("href") === "#" + e.target.id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); }); });
  }, { rootMargin: "-40% 0px -55% 0px" });
  secs.forEach(function (s) { navObs.observe(s); });

  // year
  $$("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });

  // logo drift: build two identical halves so the loop is seamless
  var track = $("[data-track]"); if (track) { var set = track.innerHTML; track.innerHTML = set + set + set; track.innerHTML += track.innerHTML; }

  // reveal on scroll: once, staggered, first screen does not animate
  var targets = $$("[data-reveal]");
  if (targets.length && !calm && "IntersectionObserver" in window) {
    root.classList.add("reveal-ready");
    var vh = innerHeight;
    targets.forEach(function (t) { if (t.getBoundingClientRect().top < vh * 0.9) t.setAttribute("data-reveal", "in"); });
    var batch = 0, timer;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        el.style.transitionDelay = Math.min(batch++, 4) * 70 + "ms";
        el.setAttribute("data-reveal", "in");
        clearTimeout(timer); timer = setTimeout(function () { batch = 0; }, 120);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t) { if (t.getAttribute("data-reveal") !== "in") io.observe(t); });
  }

  // count-up numbers
  function count(el) {
    var end = parseFloat(el.dataset.count), dec = +el.dataset.decimals || 0, suf = el.dataset.suffix || "";
    if (calm) { el.textContent = end.toFixed(dec) + suf; return; }
    var t0 = performance.now(), dur = 1400;
    (function tick(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * e).toFixed(dec) + (p === 1 ? suf : ""); if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  var cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { cio.unobserve(e.target); count(e.target); } }); }, { threshold: 0.6 });
  $$("[data-count]").forEach(function (n) { cio.observe(n); });

  // pointer glow (pixel-dot spotlight)
  $$("[data-glow]").forEach(function (box) {
    box.addEventListener("pointermove", function (e) {
      var r = box.getBoundingClientRect(), g = $(".glow", box); if (!g) return;
      g.style.setProperty("--x", e.clientX - r.left + "px"); g.style.setProperty("--y", e.clientY - r.top + "px");
    });
  });

  // scroll-scrubbed process section (desktop only; stacked everywhere else)
  var proc = $("[data-process]");
  if (proc) {
    var steps = $$(".step", proc), pres = $$(".console pre", proc), meter = $("[data-meter]", proc), cap = $("[data-cap]", proc);
    var names = ["plan", "automate", "pipeline", "validate llms"], cur = -1;
    var gate = matchMedia("(min-width: 1001px) and (min-height: 600px)");
    function show(i) {
      if (i === cur) return; cur = i;
      steps.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      pres.forEach(function (p, k) { p.classList.toggle("on", k === i); });
      cap.textContent = "0" + (i + 1) + " / " + names[i];
    }
    function frame() {
      var r = proc.getBoundingClientRect(), total = r.height - innerHeight;
      var p = Math.max(0, Math.min(1, -r.top / total));
      meter.style.width = p * 100 + "%"; show(Math.min(3, Math.floor(p * 4)));
    }
    function setup() {
      var on = gate.matches && !calm;
      proc.classList.toggle("flat", !on);
      if (!on) { steps.forEach(function (s) { s.classList.remove("on"); }); cur = -1; return; }
      frame();
    }
    gate.addEventListener("change", setup); setup();
    var tick = false;
    addEventListener("scroll", function () { if (tick || proc.classList.contains("flat")) return; tick = true; requestAnimationFrame(function () { tick = false; frame(); }); }, { passive: true });
    addEventListener("resize", frame);
  }

  // contact form (Formspree)
  var form = $("[data-form]"), note = $("[data-note]");
  form.addEventListener("submit", function (e) {
    e.preventDefault(); note.className = "note"; note.textContent = "Sending…";
    var btn = $(".btn", form); btn.disabled = true;
    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) {
        if (r.ok) { note.className = "note ok"; note.textContent = "Thanks. Your message is with me."; form.reset(); }
        else { note.className = "note err"; note.textContent = (r.j && r.j.errors && r.j.errors[0] && r.j.errors[0].message) || "Something went wrong. Please email me instead."; }
      })
      .catch(function () { note.className = "note err"; note.textContent = "Network error. Please email me instead."; })
      .then(function () { btn.disabled = false; });
  });
})();
