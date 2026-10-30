(function () {
  var doc = document.documentElement;
  var curtain = document.querySelector(".curtain");
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var wide = window.matchMedia("(min-width: 900px)");

  // Studio clock, in the studio's own time zone.
  var clock = document.getElementById("clock");
  function tick() {
    try {
      var t = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
      clock.textContent = "Navi Mumbai, India · " + t + " IST";
    } catch (e) {}
  }
  tick(); setInterval(tick, 20000);

  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (still || !gsap || !ST) { if (curtain) curtain.remove(); return; }
  gsap.registerPlugin(ST);

  // Smooth scroll, driven by GSAP's clock so scroll-linked work stays in step.
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1 });
    lenis.on("scroll", ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        var el = id.length > 1 && document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { duration: 1.4 });
        history.replaceState(null, "", id);
      });
    });
  }

  // ---------- Hero: letters that breathe in width around the cursor ----------
  var title = document.getElementById("title");
  title.setAttribute("aria-label", title.textContent.replace(/\s+/g, " ").trim());
  var chars = [];
  title.querySelectorAll("[data-stretch]").forEach(function (line) {
    line.setAttribute("aria-hidden", "true");
    var host = line.querySelector("em") || line;
    var text = host.textContent;
    host.textContent = "";
    text.split(/(\s+)/).forEach(function (word) {
      if (!word.trim()) { host.appendChild(document.createTextNode(" ")); return; }
      var w = document.createElement("span");
      w.style.whiteSpace = "nowrap"; w.style.display = "inline-block";
      word.split("").forEach(function (c) {
        var s = document.createElement("span");
        s.className = "ch"; s.textContent = c;
        w.appendChild(s); chars.push(s);
      });
      host.appendChild(w);
    });
  });

  // ---------- Intro ----------
  var intro = gsap.timeline();
  intro.from(".curtain span", { yPercent: 100, opacity: 0, duration: 0.7, ease: "expo.out" })
    .to(".curtain", { clipPath: "inset(0 0 100% 0)", duration: 1.0, ease: "expo.inOut" }, "+=0.25")
    .from(".hero h1 .in", { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.09 }, "-=0.45")
    .from(".icons img", { scale: 0, rotate: -40, duration: 1.1, ease: "back.out(1.6)", stagger: 0.12 }, "-=0.7")
    .from(".hero-foot > *", { y: 18, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 }, "-=0.8")
    .add(function () { if (curtain) curtain.remove(); });

  if (fine) {
    var mx = -9999, my = -9999, raf = 0;
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(stretch);
    }, { passive: true });
    document.querySelector(".hero").addEventListener("pointerleave", function () {
      chars.forEach(function (c) { c.style.setProperty("--w", "100%"); });
    });
    function stretch() {
      raf = 0;
      chars.forEach(function (c) {
        var r = c.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        var d = Math.hypot(r.left + r.width / 2 - mx, r.top + r.height / 2 - my);
        var k = Math.max(0, 1 - d / 320);
        c.style.setProperty("--w", (88 + k * 30).toFixed(1) + "%");
      });
    }
  }

  // ---------- Marquee: always moving, faster with the scroll ----------
  var tracks = Array.prototype.map.call(document.querySelectorAll(".track"), function (t, i) {
    t.innerHTML += t.innerHTML;
    return { el: t, x: 0, dir: i % 2 ? 1 : -1 };
  });
  var boost = 0;
  if (lenis) lenis.on("scroll", function (e) { boost = Math.min(14, Math.abs(e.velocity || 0)); });
  gsap.ticker.add(function (time, dt) {
    var step = (0.045 + boost * 0.02) * dt;
    boost *= 0.92;
    tracks.forEach(function (t) {
      var half = t.el.scrollWidth / 2;
      t.x += step * t.dir;
      if (t.x <= -half) t.x += half;
      if (t.x > 0) t.x -= half;
      t.el.style.transform = "translate3d(" + t.x + "px,0,0)";
    });
  });

  // ---------- Work index: a preview that follows the cursor ----------
  var preview = document.querySelector(".preview");
  if (fine && preview) {
    var px = gsap.quickTo(preview, "x", { duration: 0.6, ease: "expo.out" });
    var py = gsap.quickTo(preview, "y", { duration: 0.6, ease: "expo.out" });
    window.addEventListener("pointermove", function (e) { px(e.clientX + 24); py(e.clientY - preview.offsetHeight / 2); }, { passive: true });
    document.querySelectorAll(".work-row").forEach(function (row) {
      row.addEventListener("pointerenter", function () {
        preview.querySelectorAll("img").forEach(function (img) { img.classList.toggle("on", img.dataset.k === row.dataset.preview); });
        gsap.to(preview, { opacity: 1, scale: 1, rotate: row.dataset.preview === "ck" ? -3 : 3, duration: 0.5, ease: "expo.out" });
      });
      row.addEventListener("pointerleave", function () { gsap.to(preview, { opacity: 0, scale: 0.85, duration: 0.4, ease: "expo.out" }); });
    });
    gsap.set(preview, { scale: 0.85 });
  }

  // ---------- Chapters: each sheet opens from a card into the whole screen ----------
  document.querySelectorAll(".sheet").forEach(function (sheet) {
    gsap.fromTo(sheet,
      { clipPath: "inset(6% 4% 0% 4% round 48px)" },
      { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: sheet, start: "top 95%", end: "top 15%", scrub: true } });
    gsap.from(sheet.querySelectorAll(".chapter-title, .pitch, .facts li, .ctas"), {
      y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.07,
      scrollTrigger: { trigger: sheet, start: "top 60%" }
    });
  });

  // The top bar takes each sheet's ink while it sits over that sheet.
  var bar = document.querySelector(".bar");
  [[".calkey .sheet", "over-ck"], [".palmvani .sheet", "over-pv"]].forEach(function (pair) {
    ST.create({ trigger: pair[0], start: "top 40px", end: "bottom 40px", toggleClass: { targets: bar, className: pair[1] }, refreshPriority: -1 });
  });

  // Calkey: the day's meals are typed in and land, one by one, with the scroll.
  var screen = document.querySelector(".calkey .screen");
  var meals = Array.prototype.slice.call(screen.querySelectorAll(".meal"));
  var totals = [520, 520, 110, 460];
  var texts = meals.map(function (m) { return m.querySelector(".typed").textContent; });
  var totalEl = document.getElementById("ck-total");
  screen.classList.add("anim");
  function drawDay(p) {
    var per = 1 / meals.length, sum = 0;
    meals.forEach(function (m, i) {
      var local = Math.min(1, Math.max(0, (p - i * per) / per));
      var typedShare = Math.min(1, local / 0.7);
      var n = Math.round(texts[i].length * typedShare);
      m.querySelector(".typed").textContent = texts[i].slice(0, n);
      m.classList.toggle("typing", local > 0 && local < 0.72);
      var done = local >= 0.78;
      m.classList.toggle("done", done);
      m.classList.toggle("fresh", done && local < 1);
      if (done) sum += totals[i];
    });
    totalEl.textContent = sum.toLocaleString("en-IN");
  }
  drawDay(0);
  var calkeySheet = document.querySelector(".calkey .sheet");
  var palmSheet = document.querySelector(".palmvani .sheet");
  var hands = document.querySelectorAll(".hand figure");
  var mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", function () {
    ST.create({ trigger: calkeySheet, start: "top top", end: "+=110%", pin: true, scrub: 0.4,
      onUpdate: function (s) { drawDay(s.progress); } });
    gsap.fromTo(hands, { rotate: 0, y: 40 }, { rotate: function (i) { return [-24, -8, 8, 24][i]; }, y: 0, ease: "power2.out",
      scrollTrigger: { trigger: palmSheet, start: "top top", end: "+=90%", pin: true, scrub: 0.5 } });
  });
  mm.add("(max-width: 899px)", function () {
    ST.create({ trigger: screen, start: "top 85%", end: "bottom 45%", scrub: 0.4, onUpdate: function (s) { drawDay(s.progress); } });
    gsap.fromTo(hands, { rotate: 0 }, { rotate: function (i) { return [-24, -8, 8, 24][i]; }, ease: "power2.out",
      scrollTrigger: { trigger: ".hand", start: "top 85%", end: "center 50%", scrub: 0.5 } });
  });

  // ---------- Studio: the statement lights up word by word ----------
  var manifesto = document.querySelector("[data-words]");
  if (manifesto) {
    var words = manifesto.textContent.trim().split(/\s+/);
    manifesto.setAttribute("aria-label", manifesto.textContent.trim());
    manifesto.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + "</span>"; }).join(" ");
    gsap.fromTo(manifesto.querySelectorAll(".w"), { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: manifesto, start: "top 80%", end: "bottom 45%", scrub: true } });
  }
  gsap.from(".pledges li", { y: 30, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.1,
    scrollTrigger: { trigger: ".pledges", start: "top 85%" } });

  // ---------- Cursor ----------
  var cursor = document.querySelector(".cursor");
  if (fine && cursor) {
    var cx = gsap.quickTo(cursor, "x", { duration: 0.25, ease: "power3.out" });
    var cy = gsap.quickTo(cursor, "y", { duration: 0.25, ease: "power3.out" });
    window.addEventListener("pointermove", function (e) { cx(e.clientX); cy(e.clientY); }, { passive: true });
    document.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("pointerenter", function () { cursor.classList.add("big"); });
      a.addEventListener("pointerleave", function () { cursor.classList.remove("big"); });
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener("load", function () { ST.refresh(); });
})();
