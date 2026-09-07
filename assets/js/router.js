/* T's Services — single-view router
   ---------------------------------------------------------------------------
   The site is not one long scroll. Home shows the hero and the reviews; every
   other section only appears when its nav option (or a link to its #hash) is
   clicked. Plain hash routing, so back/forward and shared links work.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  // view name -> section ids shown for that view (in DOM order)
  var VIEWS = {
    home:     ['home', 'reviews'],
    products: ['products'],
    partners: ['partners'],
    faq:      ['faq'],
    account:  ['account'],
    support:  ['support'],
    setup:    ['setup']
  };

  // every section the router owns
  var MANAGED = ['home', 'products', 'reviews', 'partners', 'faq', 'account', 'support', 'setup'];

  var sections = {};
  MANAGED.forEach(function (id) { sections[id] = document.getElementById(id); });

  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav__links a[href^="#"], .footer__col a[href^="#"]')
  );

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function routeFromHash() {
    var h = (location.hash || '').replace(/^#/, '').toLowerCase();
    if (h === '' || h === 'top') h = 'home';
    return VIEWS[h] ? h : 'home';
  }

  function show(view) {
    var visible = VIEWS[view] || VIEWS.home;

    MANAGED.forEach(function (id) {
      var el = sections[id];
      if (!el) return;
      var on = visible.indexOf(id) !== -1;
      el.hidden = !on;
      if (on) {
        // Section was display:none while hidden, so its scroll-reveal observer
        // never fired — just show its content now.
        el.querySelectorAll('.reveal').forEach(function (r) {
          r.style.transitionDelay = '0ms';
          r.classList.add('in');
        });
      }
    });

    document.querySelectorAll('.nav__links a').forEach(function (a) {
      var t = (a.getAttribute('href') || '').replace(/^#/, '').toLowerCase();
      if (t === 'top' || t === '') t = 'home';
      a.classList.toggle('is-active', t === view);
    });

    // Beat the browser's native "scroll to #hash element" on load.
    window.scrollTo(0, 0);
    requestAnimationFrame(function () { window.scrollTo(0, 0); });
    document.dispatchEvent(new CustomEvent('ts:route', { detail: { view: view } }));
  }

  document.body.classList.add('routed');
  window.addEventListener('hashchange', function () { show(routeFromHash()); });
  show(routeFromHash());
})();
