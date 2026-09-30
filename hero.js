/* ==========================================================================
   Villa Solstice — scroll-scrubbed cinematic hero
   Exact scroll control + fractional frame dual-layer interpolation
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------- SETTINGS ---------------- */
  var CFG = {
    frames: {
      desktop: { dir: 'frames-desktop/frame_', count: 480, pad: 4, ext: '.jpg' },
      mobile:  { dir: 'frames-mobile/frame_',  count: 400, pad: 4, ext: '.jpg' }
    },
    scrollScreens: 10,   // length of the hero in screen heights (10 screens = 1000vh)
    holdStart: 0.01,     // tiny rest on first frame (0% - 1% scroll)
    holdEnd: 0.01,       // tiny rest on last frame (99% - 100% scroll)
    minReady: 15,        // frames needed before the loader disappears
    maxParallel: 8       // simultaneous image downloads
  };

  var html = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  function applyMotionPref() { html.classList.toggle('no-motion', reduceMQ.matches); }
  applyMotionPref();
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', applyMotionPref);

  var progressFill = document.getElementById('progressFill');
  var heroSection  = document.querySelector('.video-hero');
  var canvas       = document.getElementById('heroCanvas');
  var ctx          = canvas.getContext('2d', { alpha: false });
  var scrubFill    = document.getElementById('scrubFill');
  var frameLoader  = document.getElementById('frameLoader');
  var loaderPct    = document.getElementById('loaderPct');
  var overlays = [1, 2, 3, 4, 5].map(function (n) { return document.getElementById('overlayPhase' + n); });

  /* 5 Synchronized Narrative Phases */
  var PHASES = [
    [0.00, 0.18],
    [0.20, 0.38],
    [0.40, 0.58],
    [0.60, 0.78],
    [0.80, 1.01]
  ];

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function pickKey() { return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop'; }

  /* ---------------- state ---------------- */
  var key = null, cfg = null, N = 0;
  var imgs = [], status = [];          // status: 0 todo · 1 loading · 2 done · 3 failed
  var doneCount = 0, inFlight = 0, loaderHidden = false;
  var cw = 0, ch = 0;
  var progress = 0, current = 0, lastDrawn = -1;
  var renderQueued = false;

  html.style.setProperty('--scrub-length', (CFG.scrollScreens * 100) + 'vh');

  /* ---------------- page-wide bits (top progress bar, sticky header) ---------------- */
  function onScrollGlobal() {
    var st = window.scrollY || document.documentElement.scrollTop;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docH > 0 ? clamp(st / docH, 0, 1) : 0;
    if (progressFill) progressFill.style.transform = 'scaleX(' + pct + ')';
    document.body.classList.toggle('scrolled', st > 50);
  }

  /* ---------------- frame loading (nearest-to-viewer first) ---------------- */
  function frameUrl(i) { return cfg.dir + pad(i + 1, cfg.pad) + cfg.ext; }

  function hideLoader() {
    if (loaderHidden) return;
    loaderHidden = true;
    canvas.classList.add('is-ready');
    if (frameLoader) frameLoader.classList.add('is-hidden');
  }

  function nextToLoad() {
    var c = Math.round(current);
    // Priority anchors: first frame and final frame
    if (status[0] === 0) return 0;
    if (status[N - 1] === 0) return N - 1;
    // Outward search from current viewing position
    for (var d = 0; d < N; d++) {
      var a = c + d, b = c - d;
      if (a < N && status[a] === 0) return a;
      if (b >= 0 && status[b] === 0) return b;
    }
    return -1;
  }

  function pump() {
    while (inFlight < CFG.maxParallel) {
      var i = nextToLoad();
      if (i < 0) return;
      loadOne(i, key);
    }
  }

  function loadOne(i, forKey) {
    status[i] = 1;
    inFlight++;
    var im = new Image();
    im.decoding = 'async';
    im.onload = function () {
      if (forKey !== key) return;
      imgs[i] = im;
      status[i] = 2;
      finished(i);
    };
    im.onerror = function () {
      if (forKey !== key) return;
      status[i] = 3;
      finished(i);
    };
    im.src = frameUrl(i);
  }

  function finished(loadedIdx) {
    inFlight--;
    doneCount++;
    if (loaderPct) loaderPct.textContent = 'Loading architectural sequence — ' + Math.round(doneCount / N * 100) + '%';
    if (!loaderHidden && (doneCount >= Math.min(CFG.minReady, N) || status[0] === 2)) {
      hideLoader();
    }
    // If the loaded frame is near current scroll position, redraw immediately
    if (Math.abs(Math.round(current) - loadedIdx) <= 2) {
      scheduleRender(true);
    }
    pump();
  }

  function nearest(i) {
    if (imgs[i]) return imgs[i];
    for (var d = 1; d < N; d++) {
      if (i - d >= 0 && imgs[i - d]) return imgs[i - d];
      if (i + d < N && imgs[i + d]) return imgs[i + d];
    }
    return null;
  }

  function loadFrames(newKey) {
    if (key === newKey && N > 0) return;
    key = newKey;
    cfg = CFG.frames[key];
    N = cfg.count;
    imgs = new Array(N);
    status = new Uint8Array(N);
    doneCount = 0;
    inFlight = 0;
    loaderHidden = false;
    lastDrawn = -1;
    canvas.classList.remove('is-ready');
    if (frameLoader) frameLoader.classList.remove('is-hidden');
    readScroll();
    pump();
  }

  /* ---------------- drawing ---------------- */
  function resizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    cw = Math.round(w * dpr);
    ch = Math.round(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    scheduleRender(true);
  }

  function cover(im) {
    var iw = im.naturalWidth || im.width;
    var ih = im.naturalHeight || im.height;
    if (!iw || !ih) return;
    var s = Math.max(cw / iw, ch / ih);
    var w = iw * s, h = ih * s;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  function render(f, force) {
    if (!N || !cw) return;
    if (!force && Math.abs(f - lastDrawn) < 0.001) return;
    var i0 = clamp(Math.floor(f), 0, N - 1);
    var i1 = Math.min(i0 + 1, N - 1);
    var t = f - i0;
    var a = nearest(i0);
    if (!a) return;
    lastDrawn = f;
    ctx.globalAlpha = 1;
    cover(a);
    /* Fractional frame dual-layer alpha blending:
       creates smooth visual glide between frames without temporal lag */
    if (t > 0.01 && i1 !== i0) {
      var b = nearest(i1);
      if (b && b !== a) {
        ctx.globalAlpha = t;
        cover(b);
        ctx.globalAlpha = 1;
      }
    }
  }

  function scheduleRender(force) {
    if (force) lastDrawn = -1;
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(function () {
      renderQueued = false;
      render(current, false);
    });
  }

  /* ---------------- scroll → exact frame ---------------- */
  function heroProgress() {
    var total = heroSection.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-heroSection.getBoundingClientRect().top / total, 0, 1);
  }

  function readScroll() {
    progress = heroProgress();
    var p = clamp((progress - CFG.holdStart) / (1 - CFG.holdStart - CFG.holdEnd), 0, 1);
    // EXACT frame position directly derived from scroll position (No damping)
    current = p * Math.max(0, N - 1);

    heroSection.classList.toggle('at-start', progress < 0.04);
    heroSection.classList.toggle('in-progress', progress >= 0.04 && progress < 0.99);
    if (scrubFill) scrubFill.style.height = (progress * 100) + '%';

    for (var i = 0; i < overlays.length; i++) {
      var el = overlays[i];
      if (!el) continue;
      var on = progress >= PHASES[i][0] && progress < PHASES[i][1];
      if (el.classList.contains('is-active') !== on) el.classList.toggle('is-active', on);
    }
  }

  /* ---------------- events ---------------- */
  window.addEventListener('scroll', function () {
    onScrollGlobal();
    readScroll();
    scheduleRender();
    pump();
  }, { passive: true });

  var rzTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(rzTimer);
    rzTimer = setTimeout(function () {
      resizeCanvas();
      var k = pickKey();
      if (k !== key) loadFrames(k);
      readScroll();
      scheduleRender(true);
    }, 150);
  });

  /* mobile drawer */
  var menuToggle = document.getElementById('menuToggle');
  var mobileDrawer = document.getElementById('mobileDrawer');
  if (menuToggle && mobileDrawer) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.addEventListener('click', function () {
      var open = mobileDrawer.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileDrawer.querySelectorAll('.mobile-link').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileDrawer.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* debug hooks */
  window.__HERO_DEBUG = {
    getProgress: heroProgress,
    getTargetFrame: function () { return current; },
    getCurrentFrame: function () { return current; },
    getLastDrawn: function () { return Math.round(lastDrawn); },
    getLastDrawnFloat: function () { return lastDrawn; },
    getTotalLoaded: function () { return doneCount; },
    getConfigKey: function () { return key; },
    getTotalFrames: function () { return N; }
  };

  /* ---------------- start ---------------- */
  onScrollGlobal();
  resizeCanvas();
  loadFrames(pickKey());
  readScroll();
  scheduleRender(true);
  setTimeout(hideLoader, 5000);
})();