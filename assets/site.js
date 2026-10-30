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
      clock.textContent = "India · " + t + " IST";
    } catch (e) {}
  }
  tick(); setInterval(tick, 20000);

  var gsap = window.gsap, ST = window.ScrollTrigger;
  function endIntro() {
    if (curtain) curtain.remove();
    doc.classList.remove("intro-on");
    try { sessionStorage.setItem("ia-intro", "1"); } catch (e) {}
  }
  if (still || !gsap || !ST) { endIntro(); return; }
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

  // ---------- Intro: hello in the studio's languages, then the name lands in the bar ----------
  var playing = doc.classList.contains("intro-on") && curtain;
  var intro = gsap.timeline({ onComplete: endIntro });
  if (playing) {
    // The intro always lands on the hero, whatever scroll the browser restores.
    var toTop = function () { window.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); };
    toTop(); window.addEventListener("load", toTop);
    var greet = curtain.querySelector(".greet");
    var mark = curtain.querySelector(".mark");
    var brand = document.querySelector(".bar .brand");
    mark.innerHTML = mark.textContent.split("").map(function (c) { return '<span class="l">' + c + "</span>"; }).join("");
    var letters = mark.querySelectorAll(".l");
    var hellos = [["Hello", "en"], ["नमस्ते", "hi"], ["Olá", "pt"], ["Halo", "id"], ["Hola", "es"], ["Hallo", "de"]];
    gsap.set(letters, { yPercent: 60, opacity: 0, "--g": 200, "--s": "75%" });
    intro.to(".intro-foot .bar-line b", { scaleX: 1, duration: 2.7, ease: "power1.inOut" }, 0);
    hellos.forEach(function (h, i) {
      var at = 0.15 + i * 0.24;
      intro.add(function () { greet.textContent = h[0]; greet.lang = h[1]; }, at)
        .fromTo(greet, { opacity: 0, y: 16, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.2, ease: "power3.out" }, at);
      if (i < hellos.length - 1) intro.to(greet, { opacity: 0, y: -12, filter: "blur(8px)", duration: 0.12, ease: "power2.in" }, at + 0.16);
    });
    intro.to(greet, { opacity: 0, scale: 0.9, filter: "blur(14px)", duration: 0.3, ease: "power2.in" }, 0.15 + hellos.length * 0.24)
      .set(mark, { opacity: 1 }, "-=0.1")
      .to(letters, { yPercent: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.03 }, "-=0.15")
      .to(letters, { "--g": 800, "--s": "100%", duration: 0.75, ease: "expo.inOut", stagger: 0.025 }, "<")
      .addLabel("land", "+=0.05")
      // FLIP: the curtain's wordmark flies into the bar and becomes the brand.
      .to(mark, { x: function () { return flip().x; }, y: function () { return flip().y; }, scale: function () { return flip().k; },
        color: function () { return getComputedStyle(brand).color; }, duration: 1.05, ease: "expo.inOut" }, "land")
      .to(".orbs, .grain, .intro-foot", { opacity: 0, duration: 0.6, ease: "power2.out" }, "land")
      .to(curtain, { clipPath: "inset(0 0 100% 0)", duration: 1.05, ease: "expo.inOut" }, "land+=0.2")
      .set(brand, { opacity: 1 }, "land+=1.05")
      .set(mark, { opacity: 0 }, "land+=1.05");
    var flipped = null;
    function flip() {
      if (!flipped) {
        var from = mark.getBoundingClientRect(), to = brand.getBoundingClientRect();
        flipped = { x: to.left - from.left, y: to.top - from.top, k: to.height / from.height };
      }
      return flipped;
    }
    function skip() { intro.progress(1); }
    window.addEventListener("keydown", skip, { once: true });
    curtain.addEventListener("pointerdown", skip, { once: true });
  }
  intro.from(".hero h1 .in", { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.09 }, playing ? "land+=0.6" : 0.1)
    .from(".icons img", { scale: 0, rotate: -40, duration: 1.1, ease: "back.out(1.6)", stagger: 0.12 }, "-=0.7")
    .from(".hero-foot > *", { y: 18, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 }, "-=0.8");

  if (fine) {
    var mx = -9999, my = -9999, raf = 0;
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(stretch);
    }, { passive: true });
    document.querySelector(".hero").addEventListener("pointerleave", function () {
      chars.forEach(function (c) { c.style.setProperty("--w", "100%"); c.style.setProperty("--g", "800"); });
    });
    function stretch() {
      raf = 0;
      chars.forEach(function (c) {
        var r = c.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        var d = Math.hypot(r.left + r.width / 2 - mx, r.top + r.height / 2 - my);
        var k = Math.max(0, 1 - d / 320);
        c.style.setProperty("--w", (100 - k * 25).toFixed(1) + "%");
        c.style.setProperty("--g", Math.round(800 - k * 560));
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
