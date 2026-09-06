/* T's Services — account sign-in, via Better Auth
   ---------------------------------------------------------------------------
   GitHub Pages serves static files only, so there is no server here to check
   a password against or to know who owns a licence key. Both live in the
   separate backend under /server — see server/README.md for what it takes to
   deploy it and window.TS.BACKEND_URL in assets/js/backend.js for where to
   point this file at it once it's live.

   Auth is bearer-token based, not cookie based — see the comment in
   backend.js for why. window.TS (from backend.js) holds the token and the
   fetch helper that attaches it; this file only handles the UI and the
   Better Auth REST calls themselves.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var MIN_PASSWORD = 8;
  var TIMEOUT_MS = 12000;

  var els = {
    unconfigured: document.getElementById('authUnconfigured'),
    signedOut:    document.getElementById('authSignedOut'),
    loading:      document.getElementById('authLoading'),
    signedIn:     document.getElementById('authSignedIn'),

    form:      document.getElementById('authForm'),
    email:     document.getElementById('authEmail'),
    password:  document.getElementById('authPassword'),
    submit:    document.getElementById('authSubmit'),
    formTitle: document.getElementById('authFormTitle'),
    formHint:  document.getElementById('authFormHint'),
    toggle:    document.getElementById('authToggle'),
    forgot:    document.getElementById('authForgot'),
    message:   document.getElementById('authMessage'),
    pwHint:    document.getElementById('authPwHint'),

    who:      document.getElementById('authWho'),
    initial:  document.getElementById('authInitial'),
    signOut:  document.getElementById('authSignOut'),

    orders:      document.getElementById('ordersList'),
    ordersEmpty: document.getElementById('ordersEmpty'),
    ordersError: document.getElementById('ordersError')
  };

  if (!els.signedOut || !window.TS) return; // section not on this page, or backend.js missing

  var mode = 'signin'; // 'signin' | 'signup'

  function show(name) {
    ['unconfigured', 'signedOut', 'loading', 'signedIn'].forEach(function (k) {
      if (els[k]) els[k].hidden = (k !== name);
    });
  }

  function say(text, kind) {
    els.message.textContent = text;
    els.message.className = 'authmsg' + (kind ? ' authmsg--' + kind : '');
  }

  function busy(on) {
    els.submit.disabled = on;
    els.email.disabled = on;
    els.password.disabled = on;
    els.submit.textContent = on ? 'Working…' : (mode === 'signin' ? 'Sign in' : 'Create account');
  }

  /* ---- Better Auth REST calls ----
     These are Better Auth's own documented endpoints, called directly with
     fetch rather than through their client SDK, so the site stays
     dependency-free and loads no bundler-built script. */
  function timeoutFetch(path, options) {
    var controller = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, TIMEOUT_MS);
    options = options || {};
    if (controller) options.signal = controller.signal;

    return window.TS.authFetch(path, options)
      .catch(function () {
        throw new Error('Could not reach the server. Check your connection and try again.');
      })
      .then(
        function (res) { clearTimeout(timer); return res; },
        function (err) { clearTimeout(timer); throw err; }
      );
  }

  function betterAuthCall(path, body) {
    return timeoutFetch('/api/auth' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    }).then(function (res) {
      var token = res.headers.get('set-auth-token');
      if (token) window.TS.setToken(token);

      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var msg = (data && (data.message || data.error)) || 'Something went wrong. Try again.';
          throw new Error(msg);
        }
        return data;
      });
    });
  }

  function getSession() {
    return timeoutFetch('/api/auth/get-session', { method: 'GET' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; });
  }

  /* ---- licence keys ---- */
  function loadOrders() {
    els.orders.textContent = '';
    els.ordersEmpty.hidden = true;
    els.ordersError.hidden = true;

    window.TS.authFetch('/api/orders', { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('Could not load your orders.');
        return res.json();
      })
      .then(function (data) {
        var orders = (data && data.orders) || [];
        if (!orders.length) {
          els.ordersEmpty.hidden = false;
          return;
        }
        orders.forEach(function (o) {
          var li = document.createElement('li');
          li.className = 'orderitem';

          var info = document.createElement('div');
          var name = document.createElement('p');
          name.className = 'orderitem__name';
          name.textContent = o.product + ' — ' + o.variant; // server-supplied, but textContent regardless
          var date = document.createElement('p');
          date.className = 'orderitem__date';
          date.textContent = new Date(o.created_at).toLocaleDateString();
          info.appendChild(name);
          info.appendChild(date);

          var key = document.createElement('code');
          key.className = 'orderitem__key';
          key.textContent = o.license_key;

          li.appendChild(info);
          li.appendChild(key);
          els.orders.appendChild(li);
        });
      })
      .catch(function () {
        els.ordersError.hidden = false;
      });
  }

  /* ---- render signed-in state ---- */
  function renderUser(user) {
    var label = user.email || 'Signed in';
    els.who.textContent = label;
    els.initial.textContent = label.slice(0, 1).toUpperCase();
    show('signedIn');
    loadOrders();
  }

  /* ---- form ---- */
  function setMode(next) {
    mode = next;
    var signin = mode === 'signin';

    els.formTitle.textContent = signin ? 'Sign in' : 'Create an account';
    els.formHint.textContent = signin
      ? 'Use the email and password you signed up with.'
      : 'Pick a password you do not use anywhere else.';
    els.submit.textContent = signin ? 'Sign in' : 'Create account';
    els.toggle.textContent = signin ? 'No account yet? Create one' : 'Already have an account? Sign in';
    els.password.setAttribute('autocomplete', signin ? 'current-password' : 'new-password');
    els.pwHint.hidden = signin;
    els.forgot.hidden = !signin;
    say('', '');
  }

  els.toggle.addEventListener('click', function (e) {
    e.preventDefault();
    setMode(mode === 'signin' ? 'signup' : 'signin');
    els.email.focus();
  });

  els.form.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = els.email.value.trim();
    var password = els.password.value;

    if (!email || email.indexOf('@') === -1) {
      say('Enter a valid email address.', 'err');
      els.email.focus();
      return;
    }
    if (mode === 'signup' && password.length < MIN_PASSWORD) {
      say('Use at least ' + MIN_PASSWORD + ' characters.', 'err');
      els.password.focus();
      return;
    }
    if (!password) {
      say('Enter your password.', 'err');
      els.password.focus();
      return;
    }

    busy(true);
    say('', '');

    var path = mode === 'signin' ? '/sign-in/email' : '/sign-up/email';
    var payload = mode === 'signin'
      ? { email: email, password: password }
      : { email: email, password: password, name: email.split('@')[0] };

    betterAuthCall(path, payload)
      .then(function (data) {
        els.password.value = ''; // don't leave it sitting in the DOM
        if (data && data.user) {
          renderUser(data.user);
        } else {
          setMode('signin');
          say('Account created. Sign in to continue.', 'ok');
        }
      })
      .catch(function (err) { say(err.message, 'err'); })
      .then(function () { busy(false); });
  });

  els.forgot.addEventListener('click', function (e) {
    e.preventDefault();
    var email = els.email.value.trim();
    if (!email || email.indexOf('@') === -1) {
      say('Enter your email address above first, then press this again.', 'err');
      els.email.focus();
      return;
    }
    busy(true);
    betterAuthCall('/forget-password', { email: email, redirectTo: window.location.origin + window.location.pathname })
      .then(function () {
        // Same message whether or not the account exists, so this can't be
        // used to find out who has one.
        say('If that address has an account, a reset link is on its way.', 'ok');
      })
      .catch(function (err) { say(err.message, 'err'); })
      .then(function () { busy(false); });
  });

  els.signOut.addEventListener('click', function () {
    var hadToken = !!window.TS.getToken();
    window.TS.setToken(null);
    show('signedOut');
    setMode('signin');
    els.email.value = '';
    els.password.value = '';
    if (hadToken) betterAuthCall('/sign-out', {}).catch(function () {}); // best effort
  });

  /* ---- boot ---- */
  setMode('signin');

  if (!window.TS.BACKEND_URL) {
    show('unconfigured');
    return;
  }

  var existingToken = window.TS.getToken();
  if (!existingToken) {
    show('signedOut');
  } else {
    show('loading');
    getSession().then(function (data) {
      if (data && data.user) {
        renderUser(data.user);
      } else {
        window.TS.setToken(null);
        show('signedOut');
      }
    });
  }
})();
