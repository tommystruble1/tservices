/* T's Services — site interactions */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- year ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---- sticky nav shadow ---- */
  var nav = document.getElementById('nav');
  function onScroll() {
    nav.classList.toggle('is-stuck', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu ---- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('is-open')) {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });

  /* ---- scroll reveal ---- */
  var revealables = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // Stagger siblings so grids cascade instead of popping at once.
        var siblings = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.transitionDelay = Math.min(siblings, 6) * 70 + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px' });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---- animated hero counters ---- */
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = target.toFixed(decimals) + suffix; return; }

    var start = performance.now();
    var dur = 1400;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        co.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---- active section in nav ---- */
  var sectionIds = ['services', 'platforms', 'process', 'faq'];
  var navMap = {};
  sectionIds.forEach(function (id) {
    navMap[id] = document.querySelector('.nav__links a[href="#' + id + '"]');
  });

  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = navMap[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.keys(navMap).forEach(function (k) {
            if (navMap[k]) navMap[k].classList.remove('is-active');
          });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50%' });
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) so.observe(el);
    });
  }

  /* ---- price tiles record your pick ----
     Intake is Discord, so a tile click just fills the readout in the order
     card (and the copy template) rather than submitting anything. */
  var picked = document.getElementById('pickedPackage');
  var pickedValue = '';

  document.querySelectorAll('.ptier[data-service]').forEach(function (tile) {
    tile.addEventListener('click', function () {
      if (!picked) return;
      pickedValue = tile.dataset.service;
      picked.textContent = pickedValue;
      picked.classList.add('pick--set');
      // Flash so it's obvious the tap registered before the page scrolls.
      picked.classList.add('pick--flash');
      setTimeout(function () { picked.classList.remove('pick--flash'); }, 1200);
    });
  });

  /* ---- copy an order template to paste into Discord ---- */
  var copyBtn = document.getElementById('copyOrder');
  var copyNote = document.getElementById('copyNote');

  function buildTemplate() {
    return [
      'Package: ' + (pickedValue || '(which one?)'),
      'Platform: ',
      'Handle: ',
      'Extras: '
    ].join('\n');
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function reportCopy(ok) {
    copyNote.textContent = ok
      ? 'Copied — paste it straight into Discord.'
      : 'Couldn’t copy automatically. Select the four lines above and copy them manually.';
    copyNote.className = 'order-card__status ' + (ok ? 'ok' : 'err');
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = buildTemplate();
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          function () { reportCopy(true); },
          function () { reportCopy(fallbackCopy(text)); }
        );
      } else {
        reportCopy(fallbackCopy(text));
      }
    });
  }
})();
