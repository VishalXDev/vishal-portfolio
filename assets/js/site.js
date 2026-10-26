(function () {
  var root = document.documentElement,
    $ = function (s, c) {
      return (c || document).querySelector(s);
    },
    $$ = function (s, c) {
      return [].slice.call((c || document).querySelectorAll(s));
    };
  var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // theme toggle
  $("[data-theme-toggle]").addEventListener("click", function () {
    var next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
  });
  // mobile menu: full-screen glass sheet built from the nav links
  var nav = $("[data-nav]"),
    burger = $("[data-burger]");
  burger.innerHTML = "<i></i><i></i>";
  var sheet = document.createElement("div");
  sheet.className = "sheet";
  sheet.setAttribute("aria-hidden", "true");
  var items = [
    ["#top", "Home"],
    ["#about", "About"],
    ["#work", "Work"],
    ["#process", "Process"],
    ["#experience", "Experience"],
    ["#skills", "Skills"],
    ["#education", "Education"],
    ["#contact", "Contact"],
  ];
  sheet.innerHTML =
    items
      .map(function (it, i) {
        return (
          '<a class="lnk" style="--i:' +
          i +
          '" href="' +
          it[0] +
          '">' +
          it[1] +
          "</a>"
        );
      })
      .join("") +
    '<div class="foot"><a class="btn" href="assets/Vishal_Dwivedy_Resume.pdf" download>Download resume</a><a class="btn ghost" href="mailto:Vishaldwidy@gmail.com">Email me</a></div>';
  document.body.appendChild(sheet);
  function menu(open) {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    sheet.setAttribute("aria-hidden", !open);
  }
  burger.addEventListener("click", function () {
    menu(!document.body.classList.contains("menu-open"));
  });
  sheet.addEventListener("click", function (e) {
    if (e.target.closest("a")) menu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") menu(false);
  });
  matchMedia("(min-width: 1001px)").addEventListener("change", function (e) {
    if (e.matches) menu(false);
  });
  // current section in nav
  var secs = $$("main section[id]").filter(function (s) {
    return $('.links a[href="#' + s.id + '"]');
  });
  var navObs = new IntersectionObserver(
    function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting)
          $$(".links a").forEach(function (a) {
            if (a.getAttribute("href") === "#" + e.target.id)
              a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
      });
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );
  secs.forEach(function (s) {
    navObs.observe(s);
  });

  // year
  $$("[data-year]").forEach(function (n) {
    n.textContent = new Date().getFullYear();
  });

  // logo drift: build two identical halves so the loop is seamless
  var track = $("[data-track]");
  if (track) {
    var set = track.innerHTML;
    track.innerHTML = set + set + set;
    track.innerHTML += track.innerHTML;
  }

  // reveal on scroll: once, staggered, first screen does not animate
  var targets = $$("[data-reveal]");
  if (targets.length && !calm && "IntersectionObserver" in window) {
    root.classList.add("reveal-ready");
    var vh = innerHeight;
    targets.forEach(function (t) {
      if (t.getBoundingClientRect().top < vh * 0.9)
        t.setAttribute("data-reveal", "in");
    });
    var batch = 0,
      timer;
    var io = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          io.unobserve(el);
          el.style.transitionDelay = Math.min(batch++, 4) * 70 + "ms";
          el.setAttribute("data-reveal", "in");
          clearTimeout(timer);
          timer = setTimeout(function () {
            batch = 0;
          }, 120);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    targets.forEach(function (t) {
      if (t.getAttribute("data-reveal") !== "in") io.observe(t);
    });
  }

  // count-up numbers
  function count(el) {
    var end = parseFloat(el.dataset.count),
      dec = +el.dataset.decimals || 0,
      suf = el.dataset.suffix || "";
    if (calm) {
      el.textContent = end.toFixed(dec) + suf;
      return;
    }
    var t0 = performance.now(),
      dur = 1400;
    (function tick(t) {
      var p = Math.min(1, (t - t0) / dur),
        e = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * e).toFixed(dec) + (p === 1 ? suf : "");
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  var cio = new IntersectionObserver(
    function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          cio.unobserve(e.target);
          count(e.target);
        }
      });
    },
    { threshold: 0.6 },
  );
  $$("[data-count]").forEach(function (n) {
    cio.observe(n);
  });

  // pointer glow (pixel-dot spotlight)
  $$("[data-glow]").forEach(function (box) {
    box.addEventListener("pointermove", function (e) {
      var r = box.getBoundingClientRect(),
        g = $(".glow", box);
      if (!g) return;
      g.style.setProperty("--x", e.clientX - r.left + "px");
      g.style.setProperty("--y", e.clientY - r.top + "px");
    });
  });

  // scroll-scrubbed process section (desktop only; stacked everywhere else)
  var proc = $("[data-process]");
  if (proc) {
    var steps = $$(".step", proc),
      pres = $$(".console pre", proc),
      meter = $("[data-meter]", proc),
      cap = $("[data-cap]", proc);
    var names = ["plan", "automate", "pipeline", "validate llms"],
      cur = -1;
    var gate = matchMedia("(min-width: 1001px) and (min-height: 600px)");
    function show(i) {
      if (i === cur) return;
      cur = i;
      steps.forEach(function (s, k) {
        s.classList.toggle("on", k === i);
      });
      pres.forEach(function (p, k) {
        p.classList.toggle("on", k === i);
      });
      cap.textContent = "0" + (i + 1) + " / " + names[i];
    }
    function frame() {
      var r = proc.getBoundingClientRect(),
        total = r.height - innerHeight;
      var p = Math.max(0, Math.min(1, -r.top / total));
      meter.style.width = p * 100 + "%";
      show(Math.min(3, Math.floor(p * 4)));
    }
    function setup() {
      var on = gate.matches && !calm;
      proc.classList.toggle("flat", !on);
      if (!on) {
        cur = -1;
        show(0);
        return;
      }
      frame();
    }
    gate.addEventListener("change", setup);
    setup();
    var tick = false;
    addEventListener(
      "scroll",
      function () {
        if (tick || proc.classList.contains("flat")) return;
        tick = true;
        requestAnimationFrame(function () {
          tick = false;
          frame();
        });
      },
      { passive: true },
    );
    addEventListener("resize", function () {
      if (!proc.classList.contains("flat")) frame();
    });
    steps.forEach(function (s, i) {
      s.addEventListener("click", function () {
        if (proc.classList.contains("flat")) show(i);
      });
    });
  }

  // phones and tablets: bottom dock, progress bar, carousel dots, ripple, hero parallax
  var small = matchMedia("(max-width: 1000px)");
  var bar = document.createElement("div");
  bar.className = "scrollbar";
  document.body.appendChild(bar);
  var icons = {
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    work: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    exp: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    edu: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  };
  var dockItems = [
    ["#top", "Home", "home", ".hero"],
    ["#work", "Work", "work", "#work"],
    ["#experience", "Experience", "exp", "#experience"],
    ["#education", "Education", "edu", "#education"],
    ["#contact", "Contact", "mail", "#contact"],
  ];
  var dock = document.createElement("nav");
  dock.className = "dock";
  dock.setAttribute("aria-label", "Quick navigation");
  dock.innerHTML = dockItems
    .map(function (d) {
      return (
        '<a href="' +
        d[0] +
        '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        icons[d[2]] +
        "</svg><span>" +
        d[1] +
        "</span></a>"
      );
    })
    .join("");
  document.body.appendChild(dock);
  var dockLinks = $$("a", dock),
    dockTargets = dockItems.map(function (d) {
      return $(d[3]);
    });
  dock.addEventListener("click", function () {
    if (navigator.vibrate && small.matches) navigator.vibrate(8);
  });

  // carousel dots for the work cards
  var grid = $(".grid"),
    cards = grid ? $$(".card", grid) : [],
    dots = null;
  if (grid && cards.length) {
    dots = document.createElement("div");
    dots.className = "cdots";
    dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = cards
      .map(function () {
        return '<button type="button" tabindex="-1"></button>';
      })
      .join("");
    grid.parentNode.insertBefore(dots, grid.nextSibling);
    $$("button", dots).forEach(function (b, i) {
      b.addEventListener("click", function () {
        cards[i].scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      });
    });
  }
  function markDot() {
    if (!dots) return;
    var mid = grid.scrollLeft + grid.clientWidth / 2,
      best = 0,
      bd = 1e9;
    cards.forEach(function (c, i) {
      var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    $$("button", dots).forEach(function (b, i) {
      b.classList.toggle("on", i === best);
    });
  }
  if (grid)
    grid.addEventListener(
      "scroll",
      function () {
        requestAnimationFrame(markDot);
      },
      { passive: true },
    );
  markDot();
  addEventListener("resize", markDot);

  // one scroll handler drives the progress bar, dock highlight, dock hide, hero parallax
  var lastY = scrollY,
    ticking = false,
    heroImg = $(".visual > img");
  function onScroll() {
    ticking = false;
    if (!small.matches) return;
    var y = scrollY,
      max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform =
      "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    var at = 0;
    dockTargets.forEach(function (t, i) {
      if (t && t.getBoundingClientRect().top <= innerHeight * 0.4) at = i;
    });
    dockLinks.forEach(function (a, i) {
      a.classList.toggle("on", i === at);
    });
    var dy = y - lastY;
    if (Math.abs(dy) > 6) {
      dock.classList.toggle("hide", dy > 0 && y > 240);
      lastY = y;
    }
    if (y < 120) dock.classList.remove("hide");
    if (heroImg && !calm)
      heroImg.style.setProperty("--py", Math.min(y * 0.07, 36));
  }
  addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  addEventListener("resize", onScroll);
  onScroll();

  // tap ripple on buttons and dock
  document.addEventListener("pointerdown", function (e) {
    if (!small.matches || calm) return;
    var t = e.target.closest(".btn, .icon-btn, .dock a");
    if (!t) return;
    var r = t.getBoundingClientRect(),
      d = Math.max(r.width, r.height) * 1.6,
      s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText =
      "width:" +
      d +
      "px;height:" +
      d +
      "px;left:" +
      (e.clientX - r.left - d / 2) +
      "px;top:" +
      (e.clientY - r.top - d / 2) +
      "px";
    t.appendChild(s);
    setTimeout(function () {
      s.remove();
    }, 700);
  });

  // contact form (Formspree)
  var form = $("[data-form]"),
    note = $("[data-note]");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    note.className = "note";
    note.textContent = "Sending…";
    var btn = $(".btn", form);
    btn.disabled = true;
    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (r) {
        if (r.ok) {
          note.className = "note ok";
          note.textContent = "Thanks. Your message is with me.";
          form.reset();
        } else {
          note.className = "note err";
          note.textContent =
            (r.j && r.j.errors && r.j.errors[0] && r.j.errors[0].message) ||
            "Something went wrong. Please email me instead.";
        }
      })
      .catch(function () {
        note.className = "note err";
        note.textContent = "Network error. Please email me instead.";
      })
      .then(function () {
        btn.disabled = false;
      });
  });
})();
