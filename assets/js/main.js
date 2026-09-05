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
      entries.forEach(function (entry) {
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

  /* ---- active section in nav ---- */
  var sectionIds = ['products', 'partners', 'faq', 'support'];
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

  /* ---- product category rail ----
     A vertical tablist: clicking a category swaps the panel beside it. Arrow
     keys move between categories, per the ARIA tabs pattern, so it works
     without a mouse. Panels are wired by aria-controls, so adding a category
     is markup only. */
  var rail = document.querySelector('.catalog__rail');
  if (rail) {
    var tabs = Array.prototype.slice.call(rail.querySelectorAll('[role="tab"]'));

    function selectTab(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        // Only the selected tab is in the tab order; arrows move within the rail.
        t.tabIndex = on ? 0 : -1;

        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { selectTab(tab, false); });
    });

    rail.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i === -1) return;

      var next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];

      if (next) {
        e.preventDefault();
        selectTab(next, true);
      }
    });
  }

  /* ---- clipboard helpers ----
     Intake is a Discord DM, so nothing on the page submits anywhere — the
     buttons just hand you text to paste into the conversation. */
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

  function copy(text, done) {
    if (!navigator.clipboard || !window.isSecureContext) {
      done(fallbackCopy(text));
      return;
    }

    // writeText can sit pending forever if the document loses focus mid-click,
    // which would leave the button silent. Report either way, but only once.
    var settled = false;
    function settle(ok) {
      if (settled) return;
      settled = true;
      done(ok);
    }

    var bail = setTimeout(function () { settle(fallbackCopy(text)); }, 1200);

    navigator.clipboard.writeText(text).then(
      function () { clearTimeout(bail); settle(true); },
      function () { clearTimeout(bail); settle(fallbackCopy(text)); }
    );
  }

  /* ---- copy the Discord handle ---- */
  var handleBtn = document.getElementById('copyHandle');
  var handleValue = document.getElementById('handleValue');
  var copyNote = document.getElementById('copyNote');

  function report(ok, okText, errText) {
    if (!copyNote) return;
    copyNote.textContent = ok ? okText : errText;
    copyNote.className = 'order-card__status ' + (ok ? 'ok' : 'err');
  }

  if (handleBtn && handleValue) {
    handleBtn.addEventListener('click', function () {
      copy(handleValue.textContent.trim(), function (ok) {
        report(
          ok,
          'Handle copied — search it on Discord.',
          'Couldn’t copy. The handle is written just above.'
        );
      });
    });
  }

  /* ---- copy a message template to paste into the DM ---- */
  var copyBtn = document.getElementById('copyOrder');

  function buildTemplate() {
    return [
      'Launcher: ',
      'Handle: ',
      'What I want: '
    ].join('\n');
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      copy(buildTemplate(), function (ok) {
        report(
          ok,
          'Copied — paste it straight into the DM.',
          'Couldn’t copy automatically. Send the three lines above manually.'
        );
      });
    });
  }
})();
