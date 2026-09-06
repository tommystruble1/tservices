/* T's Services — shopping cart
   ---------------------------------------------------------------------------
   A working cart with nothing to put in it yet. It holds state, renders,
   persists across reloads and totals correctly — so the day products go on the
   page, they only need the markup contract below.

   To make anything add to the cart, give it:

     <button data-add-to-cart
             data-id="menu-x"          unique and stable — it is the cart key
             data-name="Menu X"        shown in the cart
             data-price="24.99">       decimal, no currency symbol
       Add to cart
     </button>

   Money is held in integer cents throughout. Doing arithmetic on floats gives
   you 0.1 + 0.2 = 0.30000000000000004 on a receipt, which is exactly the sort
   of thing customers screenshot.

   Checkout hands the cart's ids and quantities — never prices — to the
   backend under /server, which looks up what things actually cost from its
   own price list and creates the Stripe Checkout Session. Nothing this page
   sends is treated as authoritative; see server/lib/prices.js. Until
   window.TS.BACKEND_URL (backend.js) points at a deployed backend, the button
   explains that and points to Discord instead.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var STORE_KEY = 'ts_cart';
  var CURRENCY = 'USD';
  var MAX_QTY = 99;

  var els = {
    root:     document.getElementById('cart'),
    drawer:   document.getElementById('cartDrawer'),
    scrim:    document.getElementById('cartScrim'),
    openBtn:  document.getElementById('cartBtn'),
    closeBtn: document.getElementById('cartClose'),
    count:    document.getElementById('cartCount'),
    items:    document.getElementById('cartItems'),
    empty:    document.getElementById('cartEmpty'),
    foot:     document.getElementById('cartFoot'),
    subtotal: document.getElementById('cartSubtotal'),
    checkout: document.getElementById('cartCheckout'),
    status:   document.getElementById('cartStatus')
  };

  if (!els.root || !els.openBtn) return;

  var items = [];
  var lastFocus = null;

  /* ---- storage that never throws ---- */
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(items)); } catch (err) {}
  }
  function restore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      // Anything in storage is user-editable — re-validate rather than trust it.
      return parsed.filter(function (i) {
        return i && typeof i.id === 'string'
          && typeof i.name === 'string'
          && Number.isFinite(i.cents) && i.cents >= 0
          && Number.isFinite(i.qty) && i.qty > 0;
      }).map(function (i) {
        return { id: i.id, name: i.name, cents: Math.round(i.cents), qty: Math.min(Math.round(i.qty), MAX_QTY) };
      });
    } catch (err) { return []; }
  }

  function money(cents) {
    try {
      return new Intl.NumberFormat(document.documentElement.lang || 'en', {
        style: 'currency', currency: CURRENCY
      }).format(cents / 100);
    } catch (err) {
      return '$' + (cents / 100).toFixed(2);
    }
  }

  function subtotal() {
    return items.reduce(function (sum, i) { return sum + i.cents * i.qty; }, 0);
  }
  function totalQty() {
    return items.reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  /* ---- rendering ---- */
  function render() {
    var qty = totalQty();

    els.count.textContent = qty > 99 ? '99+' : String(qty);
    els.count.hidden = qty === 0;
    els.openBtn.setAttribute('aria-label',
      qty === 0 ? 'Cart, empty' : 'Cart, ' + qty + ' item' + (qty === 1 ? '' : 's'));

    var has = items.length > 0;
    els.empty.hidden = has;
    els.items.hidden = !has;
    els.foot.hidden = !has;

    els.items.textContent = '';
    items.forEach(function (item) {
      els.items.appendChild(row(item));
    });

    els.subtotal.textContent = money(subtotal());
  }

  // Built with DOM calls, not innerHTML — product names are data and some day
  // may come from somewhere less trusted than this file.
  function row(item) {
    var li = document.createElement('li');
    li.className = 'cartitem';

    var info = document.createElement('div');
    info.className = 'cartitem__info';

    var name = document.createElement('p');
    name.className = 'cartitem__name';
    name.textContent = item.name;

    var price = document.createElement('p');
    price.className = 'cartitem__price';
    price.textContent = money(item.cents);

    info.appendChild(name);
    info.appendChild(price);

    var controls = document.createElement('div');
    controls.className = 'cartitem__controls';

    controls.appendChild(stepBtn('−', 'Decrease quantity of ' + item.name, function () {
      setQty(item.id, item.qty - 1);
    }));

    var qty = document.createElement('span');
    qty.className = 'cartitem__qty';
    qty.textContent = String(item.qty);
    controls.appendChild(qty);

    controls.appendChild(stepBtn('+', 'Increase quantity of ' + item.name, function () {
      setQty(item.id, item.qty + 1);
    }));

    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'cartitem__remove';
    remove.setAttribute('aria-label', 'Remove ' + item.name);
    remove.textContent = '×';
    remove.addEventListener('click', function () { setQty(item.id, 0); });

    li.appendChild(info);
    li.appendChild(controls);
    li.appendChild(remove);
    return li;
  }

  function stepBtn(glyph, label, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cartitem__step';
    b.setAttribute('aria-label', label);
    b.textContent = glyph;
    b.addEventListener('click', onClick);
    return b;
  }

  /* ---- mutations ---- */
  function add(id, name, cents) {
    var found = null;
    for (var i = 0; i < items.length; i++) if (items[i].id === id) found = items[i];

    if (found) found.qty = Math.min(found.qty + 1, MAX_QTY);
    else items.push({ id: id, name: name, cents: cents, qty: 1 });

    persist();
    render();
    open();
  }

  function setQty(id, qty) {
    qty = Math.min(Math.max(qty, 0), MAX_QTY);
    items = items.reduce(function (out, i) {
      if (i.id !== id) out.push(i);
      else if (qty > 0) { i.qty = qty; out.push(i); }
      return out;
    }, []);
    persist();
    render();
  }

  /* ---- drawer ---- */
  function open() {
    if (!els.root.hidden) return;
    lastFocus = document.activeElement;
    els.root.hidden = false;
    els.openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Wait a frame so the transition runs from the closed position.
    requestAnimationFrame(function () { els.root.classList.add('is-open'); });
    els.closeBtn.focus();
  }

  function close() {
    if (els.root.hidden) return;
    els.root.classList.remove('is-open');
    els.openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';

    var done = function () {
      els.root.hidden = true;
      els.drawer.removeEventListener('transitionend', done);
    };
    els.drawer.addEventListener('transitionend', done);
    // Fallback in case the transition never fires (reduced motion, hidden tab).
    setTimeout(done, 400);

    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  els.openBtn.addEventListener('click', open);
  els.closeBtn.addEventListener('click', close);
  els.scrim.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (els.root.hidden) return;

    if (e.key === 'Escape') { close(); return; }

    // Keep focus inside the drawer while it's modal.
    if (e.key !== 'Tab') return;
    var focusable = els.drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ---- add-to-cart, delegated so future products need no JS ---- */
  document.addEventListener('click', function (e) {
    var closer = e.target.closest('[data-cart-close]');
    if (closer) { close(); return; }

    var btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;

    var id = btn.dataset.id;
    var name = btn.dataset.name;
    var price = parseFloat(btn.dataset.price);

    if (!id || !name || !Number.isFinite(price) || price < 0) {
      // A misconfigured button should be loud in the console, silent to the user.
      console.warn('[cart] button needs data-id, data-name and a numeric data-price', btn);
      return;
    }
    add(id, name, Math.round(price * 100));
  });

  /* ---- checkout ----
     Sends only { id, qty } per line. The backend decides what that id costs;
     it does not read els price data at all. */
  function setStatus(text, kind) {
    els.status.textContent = text;
    els.status.className = 'cart__status' + (kind ? ' is-' + kind : '');
  }

  els.checkout.addEventListener('click', function () {
    if (!window.TS || !window.TS.BACKEND_URL) {
      setStatus('Checkout isn’t connected yet — the shop hasn’t opened. Message tom1x1 on Discord and we’ll sort it directly.', 'warn');
      return;
    }
    if (!window.TS.getToken()) {
      setStatus('Sign in first, then come back to check out.', 'warn');
      return;
    }
    if (!items.length) return;

    els.checkout.disabled = true;
    setStatus('Starting checkout…', '');

    window.TS.authFetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(function (i) { return { id: i.id, qty: i.qty }; })
      })
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        if (!result.ok || !result.data.url) {
          throw new Error((result.data && result.data.error) || 'Could not start checkout.');
        }
        window.location.href = result.data.url; // on to Stripe
      })
      .catch(function (err) {
        setStatus(err.message || 'Could not reach the server. Try again shortly.', 'warn');
        els.checkout.disabled = false;
      });
  });

  items = restore();
  render();

  // Let i18n.js re-render money in the new locale after a language change.
  window.addEventListener('ts:languagechange', render);
})();
