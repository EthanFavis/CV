/* Ethan Favis — CV site interactions
   Uses scroll-position checks (getBoundingClientRect) rather than
   IntersectionObserver so reveals/counters fire reliably in every context. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* opt in to the hidden reveal state only now that JS is running */
  if (!reduce) document.documentElement.classList.add('js-anim');

  var nav = document.querySelector('.nav');
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var counts = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  var bars = Array.prototype.slice.call(document.querySelectorAll('.bar i'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('section[id], header[id]'));
  var linkFor = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
    linkFor[a.getAttribute('href').slice(1)] = a;
  });

  /* ---- count-up ---- */
  function animateCount(el) {
    if (el.__done) return; el.__done = true;
    var target = parseFloat(el.getAttribute('data-count'));
    if (reduce) { el.textContent = target; return; }
    var dur = 1300, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step); else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  function inView(el, frac) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var trigger = vh * (frac == null ? 0.92 : frac);
    return r.top < trigger && r.bottom > 0;
  }

  function tick() {
    /* nav */
    if (window.scrollY > 24) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');

    /* reveals */
    for (var i = revealEls.length - 1; i >= 0; i--) {
      if (inView(revealEls[i])) { revealEls[i].classList.add('in'); revealEls.splice(i, 1); }
    }
    /* counts */
    for (var j = counts.length - 1; j >= 0; j--) {
      if (inView(counts[j], 0.85)) { animateCount(counts[j]); counts.splice(j, 1); }
    }
    /* bars */
    for (var k = bars.length - 1; k >= 0; k--) {
      if (inView(bars[k], 0.85)) { bars[k].style.width = bars[k].getAttribute('data-w'); bars.splice(k, 1); }
    }
    /* scroll-spy */
    var mid = (window.innerHeight || 0) * 0.4, current = null;
    for (var s = 0; s < sections.length; s++) {
      var rr = sections[s].getBoundingClientRect();
      if (rr.top <= mid && rr.bottom > mid) { current = sections[s].id; break; }
    }
    Object.keys(linkFor).forEach(function (key) {
      linkFor[key].classList.toggle('active', key === current);
    });
  }

  if (reduce) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    counts.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
    bars.forEach(function (b) { b.style.width = b.getAttribute('data-w'); });
    revealEls = []; counts = []; bars = [];
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { tick(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* initial passes — cover layout/font settling */
  tick();
  requestAnimationFrame(tick);
  window.addEventListener('load', tick);
  setTimeout(tick, 400);
  setTimeout(tick, 1200);

  /* freeze-detection net: in a non-painting context (e.g. a backgrounded
     iframe) CSS transitions never advance, which would leave reveals stuck
     invisible. Probe a revealed element; if it hasn't faded in after ~900ms,
     drop the hidden state entirely so all content shows. Real (painting)
     browsers fade in normally and never trip this. */
  if (!reduce) {
    var probe = document.querySelector('.reveal');
    if (probe) {
      probe.classList.add('in');
      setTimeout(function () {
        if (parseFloat(getComputedStyle(probe).opacity) < 0.06) {
          var s = document.createElement('style');
          s.textContent = '.js-anim .reveal{opacity:1!important;transform:none!important;transition:none!important}.bar i{transition:none!important}';
          document.head.appendChild(s);
          bars.forEach(function (b) { b.style.width = b.getAttribute('data-w'); });
          counts.forEach(animateCount);
        }
      }, 900);
    }
  }

  /* ---- footer back-to-top ---- */
  var ftop = document.querySelector('.ftop');
  if (ftop) ftop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---- year ---- */
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
