/* NULLBYTE OPS — site interactions */
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

  /* ---- price tiles prefill the order form ----
     Each .ptier carries data-service matching an <option> label exactly. */
  var serviceSelect = document.getElementById('serviceSelect');
  document.querySelectorAll('.ptier[data-service]').forEach(function (tile) {
    tile.addEventListener('click', function () {
      if (!serviceSelect) return;
      var want = tile.dataset.service;
      var matched = Array.prototype.some.call(serviceSelect.options, function (opt) {
        if (opt.text !== want) return false;
        serviceSelect.value = opt.value || opt.text;
        return true;
      });
      if (matched) {
        serviceSelect.classList.remove('invalid');
        // Flash the field so it's obvious the tap did something.
        serviceSelect.classList.add('prefilled');
        setTimeout(function () { serviceSelect.classList.remove('prefilled'); }, 1400);
      }
    });
  });

  /* ---- order form ----
     Static hosting has no backend, so this validates and hands off.
     Swap the block below for a Formspree/Getform endpoint or a Discord
     webhook proxy when you're ready to take real submissions. */
  var form = document.getElementById('orderForm');
  var note = document.getElementById('formNote');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    note.className = 'form__note';

    var fields = form.querySelectorAll('input, select, textarea');
    var firstBad = null;

    fields.forEach(function (f) {
      var bad = !f.checkValidity();
      f.classList.toggle('invalid', bad);
      if (bad && !firstBad) firstBad = f;
    });

    if (firstBad) {
      note.textContent = '> TRANSMISSION FAILED — check the highlighted fields.';
      note.classList.add('err');
      firstBad.focus();
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Transmitting…';

    setTimeout(function () {
      btn.disabled = false;
      btn.textContent = 'Transmit Request';
      form.reset();
      note.textContent = '> REQUEST RECEIVED. Quote inbound within 12 hours.';
      note.classList.add('ok');
    }, 900);
  });

  form.addEventListener('input', function (e) {
    if (e.target.classList.contains('invalid') && e.target.checkValidity()) {
      e.target.classList.remove('invalid');
    }
  });
})();
