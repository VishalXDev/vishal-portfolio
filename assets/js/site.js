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

  // ================= live layer: the portfolio runs its own tests =================
  var fine = matchMedia("(hover: hover) and (pointer: fine)"),
    wide = matchMedia("(min-width: 1001px)");
  var TOTAL = 14,
    passed = 0,
    bugs = 0,
    suite = {};

  // --- test runner HUD (bottom-left): real checks run as you explore
  var runner = document.createElement("div");
  runner.className = "runner";
  runner.innerHTML =
    '<div class="runner-log" role="log" hidden></div>' +
    '<button type="button" class="runner-pill" aria-expanded="false" aria-label="Live test run. Tap for details">' +
    '<svg viewBox="0 0 24 24" class="ring" aria-hidden="true"><circle cx="12" cy="12" r="9" class="bg"/><circle cx="12" cy="12" r="9" class="fg"/></svg>' +
    '<span class="rt"><b data-pass>0</b>/' +
    TOTAL +
    ' tests</span><i class="dot"></i></button>';
  document.body.appendChild(runner);
  var logEl = $(".runner-log", runner),
    pill = $(".runner-pill", runner),
    fg = $(".fg", runner),
    passEl = $("[data-pass]", runner);
  var CIRC = 2 * Math.PI * 9;
  fg.style.strokeDasharray = CIRC;
  fg.style.strokeDashoffset = CIRC;
  function stamp() {
    var d = new Date();
    return (
      ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2)
    );
  }
  function log(ok, text) {
    var p = document.createElement("p");
    p.className = ok ? "ok" : "bad";
    p.innerHTML =
      "<span>" +
      (ok ? "✓" : "✗") +
      "</span><i>" +
      text +
      "</i><em>" +
      stamp() +
      "</em>";
    logEl.appendChild(p);
    while (logEl.children.length > 40) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
  }
  function bump() {
    runner.classList.remove("bump");
    void runner.offsetWidth;
    runner.classList.add("bump");
  }
  function record(id, ok, text) {
    if (suite[id]) return;
    suite[id] = true;
    log(ok, text);
    bump();
    if (ok) {
      passed++;
      passEl.textContent = passed;
      fg.style.strokeDashoffset = CIRC * (1 - passed / TOTAL);
    }
    if (passed === TOTAL) {
      runner.classList.add("green");
      setTimeout(function () {
        log(true, "suite green: all " + TOTAL + " passed");
      }, 500);
    }
  }
  pill.addEventListener("click", function () {
    var open = logEl.hidden;
    logEl.hidden = !open;
    pill.setAttribute("aria-expanded", open);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !logEl.hidden) {
      logEl.hidden = true;
      pill.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("click", function (e) {
    if (!logEl.hidden && !runner.contains(e.target)) {
      logEl.hidden = true;
      pill.setAttribute("aria-expanded", "false");
    }
  });

  // boot checks run automatically, one after another
  [
    [
      "boot-render",
      "page renders",
      function () {
        return !!$(".hero h1");
      },
    ],
    [
      "boot-fonts",
      "fonts load",
      function () {
        return document.fonts
          ? document.fonts.ready.then(function () {
              return true;
            })
          : true;
      },
    ],
    [
      "boot-hero",
      "hero image decodes",
      function () {
        var i = $(".visual img");
        return (
          !i ||
          (i.decode
            ? i.decode().then(
                function () {
                  return true;
                },
                function () {
                  return false;
                },
              )
            : i.complete)
        );
      },
    ],
    [
      "boot-tokens",
      "theme tokens resolve",
      function () {
        return !!getComputedStyle(root).getPropertyValue("--brand").trim();
      },
    ],
  ].forEach(function (b, i) {
    setTimeout(
      function () {
        Promise.resolve(b[2]()).then(function (ok) {
          record(b[0], !!ok, b[1]);
        });
      },
      900 + i * 700,
    );
  });

  // section checks run the first time each section scrolls into view
  function imgsOk(scope) {
    return Promise.all(
      $$("img", scope).map(function (im) {
        im.loading = "eager";
        return im.complete
          ? Promise.resolve(im.naturalWidth > 0)
          : new Promise(function (res) {
              im.addEventListener("load", function () {
                res(true);
              });
              im.addEventListener("error", function () {
                res(false);
              });
              setTimeout(function () {
                res(im.naturalWidth > 0);
              }, 5000);
            });
      }),
    ).then(function (r) {
      return r.every(Boolean);
    });
  }
  var checks = {
    about: [
      "about section loads",
      function (s) {
        return !!$("h2", s) && imgsOk(s);
      },
    ],
    work: [
      "6 work cards load",
      function (s) {
        return $$(".card", s).length === 6 && imgsOk(s);
      },
    ],
    process: [
      "4 test steps render",
      function (s) {
        return $$(".step", s).length === 4;
      },
    ],
    experience: [
      "experience timeline renders",
      function (s) {
        return $$(".xp-card", s).length >= 2 && imgsOk(s);
      },
    ],
    skills: [
      "skill groups render",
      function (s) {
        return $$(".skill", s).length === 6;
      },
    ],
    education: [
      "education logos load",
      function (s) {
        return $$(".edu-card", s).length === 4 && imgsOk(s);
      },
    ],
    contact: [
      "contact form is wired",
      function (s) {
        var f = $("form", s);
        return (
          !!f &&
          /formspree\.io/.test(f.action) &&
          $$("[required]", f).length >= 3
        );
      },
    ],
  };
  var secObs = new IntersectionObserver(
    function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id,
          c = checks[id];
        secObs.unobserve(e.target);
        if (!c) return;
        setTimeout(function () {
          Promise.resolve(c[1](e.target)).then(function (ok) {
            record("sec-" + id, !!ok, c[0]);
          });
        }, 450);
      });
    },
    { threshold: 0.2 },
  );
  Object.keys(checks).forEach(function (id) {
    var s = document.getElementById(id);
    if (s) secObs.observe(s);
  });

  // interaction checks
  $("[data-theme-toggle]").addEventListener("click", function () {
    record("theme", true, "theme switch works");
  });
  var cardGrid = $(".grid");
  if (cardGrid) {
    cardGrid.addEventListener(
      "pointerenter",
      function () {
        record("cards", true, "cards respond to hover");
      },
      { once: true },
    );
    cardGrid.addEventListener(
      "scroll",
      function () {
        record("cards", true, "cards swipe smoothly");
      },
      { once: true, passive: true },
    );
  }

  // --- live clock
  var facts = $(".facts");
  if (facts) {
    var live = document.createElement("span");
    live.className = "mono live";
    live.innerHTML = '<i class="pulse"></i><span data-clock></span> IST';
    facts.appendChild(live);
    var clock = $("[data-clock]", live);
    (function tickClock() {
      try {
        clock.textContent = new Date().toLocaleTimeString("en-GB", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch (e) {
        clock.textContent = "";
      }
      setTimeout(tickClock, 1000);
    })();
  }

  // --- typing console: lines appear one after another when a step is active
  $$(".console pre").forEach(function (pre) {
    pre.innerHTML = pre.innerHTML
      .split("\n")
      .map(function (l, i) {
        return (
          '<span class="ln" style="--n:' +
          i +
          '">' +
          (l || "&nbsp;") +
          "</span>"
        );
      })
      .join("");
  });

  if (!calm) {
    // --- headline cycles through what gets built in
    var h1 = $(".hero h1"),
      mute = h1 && $(".mute", h1);
    if (mute) {
      h1.setAttribute("aria-label", h1.textContent.replace(/\s+/g, " ").trim());
      var words = ["quality", "coverage", "trust", "stability"],
        wi = 0;
      mute.innerHTML =
        'who builds <span class="swap" aria-hidden="true">quality</span> in.';
      var sw = $(".swap", mute);
      function reserve() {
        h1.style.minHeight = "";
        var m = 0,
          keep = sw.textContent;
        words.forEach(function (w) {
          sw.textContent = w;
          m = Math.max(m, h1.offsetHeight);
        });
        sw.textContent = keep;
        h1.style.minHeight = m + "px";
      }
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(reserve);
      addEventListener("resize", reserve);
      var ease = "cubic-bezier(0.33, 1, 0.68, 1)";
      setInterval(function () {
        if (document.hidden || !sw.animate) return;
        wi = (wi + 1) % words.length;
        sw.animate(
          [
            { opacity: 1, transform: "none", filter: "blur(0)" },
            { opacity: 0, transform: "translateY(-45%)", filter: "blur(6px)" },
          ],
          { duration: 320, easing: "ease-in", fill: "forwards" },
        )
          .finished.then(function () {
            sw.textContent = words[wi];
            return sw.animate(
              [
                {
                  opacity: 0,
                  transform: "translateY(45%)",
                  filter: "blur(6px)",
                },
                { opacity: 1, transform: "none", filter: "blur(0)" },
              ],
              { duration: 520, easing: ease, fill: "forwards" },
            ).finished;
          })
          .then(function () {
            sw.getAnimations().forEach(function (a) {
              a.cancel();
            });
          })
          .catch(function () {});
      }, 3000);
    }

    // --- a bug wanders across the hero photo; click or tap to squash it
    var visual = $(".visual");
    if (visual) {
      var bug = document.createElement("button");
      bug.type = "button";
      bug.className = "bug";
      bug.setAttribute("aria-label", "Squash the bug, just for fun");
      bug.title = "Catch me";
      bug.innerHTML =
        '<svg viewBox="0 0 32 32" aria-hidden="true"><g stroke="#06303d" stroke-width="1.4" stroke-linecap="round"><path d="M6 10l5 4M26 10l-5 4M5 17h6M27 17h-6M7 25l5-4M25 25l-5-4M13 5l-2-3M19 5l2-3"/></g><ellipse cx="16" cy="18" rx="8" ry="9.5" fill="#1aa0bd" stroke="#06303d" stroke-width="1.4"/><path d="M16 9v19" stroke="#06303d" stroke-width="1.2"/><circle cx="16" cy="8" r="4" fill="#06303d"/><circle cx="12.5" cy="16" r="1.7" fill="#e8fbff"/><circle cx="19.5" cy="16" r="1.7" fill="#e8fbff"/><circle cx="12.5" cy="22" r="1.4" fill="#e8fbff"/><circle cx="19.5" cy="22" r="1.4" fill="#e8fbff"/></svg>';
      var tally = document.createElement("span");
      tally.className = "bugtally";
      tally.hidden = true;
      visual.appendChild(bug);
      visual.appendChild(tally);
      var alive = true,
        bx = -40,
        by = 80,
        ang = 90,
        timer;
      function put(x, y, dur) {
        var target = (Math.atan2(y - by, x - bx) * 180) / Math.PI + 90,
          delta = ((target - ang + 540) % 360) - 180;
        ang += delta;
        bug.style.transitionDuration = dur + "ms";
        bug.style.transform =
          "translate(" + x + "px," + y + "px) rotate(" + ang + "deg)";
        bx = x;
        by = y;
      }
      function wander() {
        clearTimeout(timer);
        if (!alive) return;
        if (document.hidden) {
          timer = setTimeout(wander, 1500);
          return;
        }
        var w = Math.max(60, visual.clientWidth - 48),
          h = Math.max(60, visual.clientHeight - 48);
        var nx = 8 + Math.random() * w,
          ny = 8 + Math.random() * h,
          dist = Math.hypot(nx - bx, ny - by),
          dur = Math.max(1500, dist * 9);
        put(nx, ny, dur);
        timer = setTimeout(wander, dur + 300 + Math.random() * 900);
      }
      bug.style.transform = "translate(-40px,80px) rotate(90deg)";
      setTimeout(wander, 1800);
      function burst(cx, cy) {
        for (var i = 0; i < 12; i++) {
          var p = document.createElement("i");
          p.className = "splat";
          p.style.left = cx + "px";
          p.style.top = cy + "px";
          visual.appendChild(p);
          var a = (i / 12) * 2 * Math.PI,
            d = 28 + Math.random() * 34;
          p.animate(
            [
              { transform: "translate(0,0) scale(1)", opacity: 1 },
              {
                transform:
                  "translate(" +
                  Math.cos(a) * d +
                  "px," +
                  Math.sin(a) * d +
                  "px) scale(0)",
                opacity: 0,
              },
            ],
            {
              duration: 650 + Math.random() * 250,
              easing: "cubic-bezier(0.2,0.8,0.2,1)",
            },
          ).onfinish = (function (el) {
            return function () {
              el.remove();
            };
          })(p);
        }
      }
      bug.addEventListener("click", function () {
        if (!alive) return;
        alive = false;
        bugs++;
        clearTimeout(timer);
        var r = bug.getBoundingClientRect(),
          v = visual.getBoundingClientRect();
        burst(r.left - v.left + r.width / 2, r.top - v.top + r.height / 2);
        bug.classList.add("dead");
        tally.hidden = false;
        tally.textContent = "Bugs squashed: " + bugs;
        tally.classList.remove("pop");
        void tally.offsetWidth;
        tally.classList.add("pop");
        if (navigator.vibrate) navigator.vibrate(12);
        if (!suite.bug) record("bug", true, "bug squashed in the hero");
        else {
          log(true, "bug #" + bugs + " squashed (demo)");
          bump();
        }
        setTimeout(function () {
          bug.classList.remove("dead");
          bug.style.transitionDuration = "0ms";
          bx = -40;
          by = 60 + Math.random() * 200;
          bug.style.transform = "translate(-40px," + by + "px) rotate(90deg)";
          ang = 90;
          alive = true;
          setTimeout(wander, 400);
        }, 3200);
      });
    }

    // --- desktop only: soft light that follows the pointer, tilt on cards, magnetic buttons
    if (fine.matches && wide.matches) {
      // custom cursor: dot + glass ring that reacts to what is under it
      var curEl = document.createElement("div");
      curEl.className = "cursor";
      curEl.setAttribute("aria-hidden", "true");
      curEl.innerHTML =
        '<div class="c-ring"><i class="c-body"></i><span class="c-label"></span></div><i class="c-dot"></i>';
      document.body.appendChild(curEl);
      root.classList.add("has-cursor");
      var ring = $(".c-ring", curEl),
        dotEl = $(".c-dot", curEl),
        label = $(".c-label", curEl);
      var px = innerWidth / 2,
        py = innerHeight / 2,
        rx = px,
        ry = py,
        seen = false;
      function state(t) {
        var s = "",
          txt = "";
        if (t && t.closest) {
          if (t.closest("input, textarea, select, [contenteditable]"))
            s = "text";
          else if (t.closest(".bug")) {
            s = "bug";
          } else if (t.closest("a, button, label, [role=button], .pills")) {
            s = "link";
          } else if (t.closest(".card")) {
            s = "card";
            txt = "View";
          }
        }
        if (curEl.dataset.state !== s) curEl.dataset.state = s;
        if (label.textContent !== txt) label.textContent = txt;
      }
      addEventListener(
        "pointermove",
        function (e) {
          px = e.clientX;
          py = e.clientY;
          if (!seen) {
            seen = true;
            rx = px;
            ry = py;
            curEl.classList.add("on");
          }
          state(e.target);
        },
        { passive: true },
      );
      root.addEventListener("mouseleave", function () {
        seen = false;
        curEl.classList.remove("on");
      });
      addEventListener("pointerdown", function () {
        curEl.classList.add("down");
      });
      addEventListener("pointerup", function () {
        curEl.classList.remove("down");
      });
      (function loop() {
        rx += (px - rx) * 0.2;
        ry += (py - ry) * 0.2;
        ring.style.transform =
          "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
        dotEl.style.transform = "translate3d(" + px + "px," + py + "px,0)";
        requestAnimationFrame(loop);
      })();
      $$(".card, .visual").forEach(function (el) {
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect(),
            px = (e.clientX - r.left) / r.width - 0.5,
            py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform =
            "perspective(900px) rotateX(" +
            (-py * 5).toFixed(2) +
            "deg) rotateY(" +
            (px * 6).toFixed(2) +
            "deg) translateY(-4px)";
          el.classList.add("tilting");
        });
        el.addEventListener("pointerleave", function () {
          el.style.transform = "";
          el.classList.remove("tilting");
        });
      });
      $$(".hero .btn, form .btn").forEach(function (b) {
        b.addEventListener("pointermove", function (e) {
          var r = b.getBoundingClientRect();
          b.style.transform =
            "translate(" +
            ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1) +
            "px," +
            ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) +
            "px)";
        });
        b.addEventListener("pointerleave", function () {
          b.style.transform = "";
        });
      });
    }
  }
})();
