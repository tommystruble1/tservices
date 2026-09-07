/* T's Services — account sign-in, via Better Auth magic links
   ---------------------------------------------------------------------------
   No password, no code to type. The visitor enters an email, we send a link,
   and opening that link signs them in — creating the account the first time.

   GitHub Pages serves static files only, so there is no server here. The
   token is generated, stored and checked by the separate backend under
   /server (Better Auth's magicLink plugin). This file is the UI plus two
   Better Auth REST calls:

     POST /api/auth/sign-in/magic-link            { email, callbackURL }
     GET  /api/auth/magic-link/verify?token=...

   The emailed link points back to  <site>/#account?magic=<token> ; when that
   page loads this file calls verify with the token and gets the session token
   in the `set-auth-token` response header (bearer plugin), then stores it and
   sends it as `Authorization: Bearer <token>` on every request after. */
(function () {
  'use strict';

  var TIMEOUT_MS = 12000;

  var els = {
    unconfigured: document.getElementById('authUnconfigured'),
    signedOut:    document.getElementById('authSignedOut'),
    loading:      document.getElementById('authLoading'),
    signedIn:     document.getElementById('authSignedIn'),

    form:      document.getElementById('authForm'),
    email:     document.getElementById('authEmail'),
    submit:    document.getElementById('authSubmit'),
    formTitle: document.getElementById('authFormTitle'),
    formHint:  document.getElementById('authFormHint'),
    message:   document.getElementById('authMessage'),
    resend:    document.getElementById('authResend'),
    restart:   document.getElementById('authRestart'),

    who:      document.getElementById('authWho'),
    initial:  document.getElementById('authInitial'),
    signOut:  document.getElementById('authSignOut'),
    navAccount: document.getElementById('navAccount'),

    orders:      document.getElementById('ordersList'),
    ordersEmpty: document.getElementById('ordersEmpty'),
    ordersError: document.getElementById('ordersError')
  };

  if (!els.signedOut || !window.TS) return; // section not on this page, or backend.js missing

  var sentTo = '';

  function show(name) {
    ['unconfigured', 'signedOut', 'loading', 'signedIn'].forEach(function (k) {
      if (els[k]) els[k].hidden = (k !== name);
    });
  }

  function say(text, kind) {
    els.message.textContent = text || '';
    els.message.className = 'authmsg' + (kind ? ' authmsg--' + kind : '');
  }

  function busy(on) {
    els.submit.disabled = on;
    els.email.disabled = on;
    els.submit.textContent = on ? 'Sending…' : 'Email me a link';
  }

  /* ---- REST helpers ---- */
  function timeoutFetch(path, options) {
    var controller = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, TIMEOUT_MS);
    options = options || {};
    if (controller) options.signal = controller.signal;

    return window.TS.authFetch(path, options)
      .catch(function () { throw new Error('Could not reach the server. Check your connection and try again.'); })
      .then(
        function (res) { clearTimeout(timer); return res; },
        function (err) { clearTimeout(timer); throw err; }
      );
  }

  function authCall(path, body, method) {
    return timeoutFetch('/api/auth' + path, {
      method: method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body || {})
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
        if (!orders.length) { els.ordersEmpty.hidden = false; return; }
        orders.forEach(function (o) {
          var li = document.createElement('li');
          li.className = 'orderitem';

          var info = document.createElement('div');
          var name = document.createElement('p');
          name.className = 'orderitem__name';
          name.textContent = o.product + ' — ' + o.variant;
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
      .catch(function () { els.ordersError.hidden = false; });
  }

  function renderUser(user) {
    var label = (user && user.email) || 'Signed in';
    els.who.textContent = label;
    els.initial.textContent = label.slice(0, 1).toUpperCase();
    setNavAccount(user);
    show('signedIn');
    loadOrders();
  }

  /* Swap the nav "Sign In" button for a profile chip, and back. */
  function setNavAccount(user) {
    var el = els.navAccount;
    if (!el) return;

    if (user) {
      var name = (user.name && user.name.trim()) || (user.email || '').split('@')[0] || 'Account';
      var initial = (name.slice(0, 1) || '?').toUpperCase();
      el.removeAttribute('data-i18n');
      el.className = 'navacct';
      el.textContent = '';
      var av = document.createElement('span');
      av.className = 'navacct__avatar';
      av.setAttribute('aria-hidden', 'true');
      av.textContent = initial;
      var nm = document.createElement('span');
      nm.className = 'navacct__name';
      nm.textContent = name;
      el.appendChild(av);
      el.appendChild(nm);
      el.setAttribute('aria-label', 'Your account (' + (user.email || name) + ')');
    } else {
      el.className = 'btn btn--sm btn--primary';
      el.setAttribute('data-i18n', 'nav.signIn');
      el.removeAttribute('aria-label');
      el.textContent = 'Sign In';
    }
  }

  /* ---- signed-out form states ---- */
  function toEmailForm() {
    els.formTitle.textContent = 'Create an account';
    els.formHint.textContent =
      "Enter your email and we'll send a sign-in link. No password — opening the link signs you in, and creates your account the first time.";
    els.resend.hidden = true;
    els.restart.hidden = true;
    els.email.disabled = false;
    busy(false);
    say('', '');
  }

  function toSentState(email) {
    sentTo = email;
    els.formTitle.textContent = 'Check your email';
    els.formHint.textContent = 'We sent a sign-in link to ' + email +
      '. Open it on any device to finish — you can close this tab.';
    els.email.disabled = true;
    els.submit.disabled = true;
    els.submit.textContent = 'Link sent';
    els.resend.hidden = false;
    els.resend.disabled = false;
    els.resend.textContent = 'Send another link';
    els.restart.hidden = false;
    say('Link sent. Check your inbox (and spam).', 'ok');
  }

  function sendLink(email) {
    return authCall('/sign-in/magic-link', {
      email: email,
      callbackURL: window.location.origin + '/'
    });
  }

  /* ---- verify the token from an opened link ---- */
  function verifyMagic(token) {
    show('loading');
    say('', '');
    return timeoutFetch('/api/auth/magic-link/verify?token=' + encodeURIComponent(token), { method: 'GET' })
      .then(function (res) {
        var t = res.headers.get('set-auth-token');
        if (t) window.TS.setToken(t);
        return res.json().catch(function () { return null; });
      })
      .then(function (data) {
        // verify returns { token, user } when no callbackURL is passed
        if (data && data.token) window.TS.setToken(data.token);
        if (data && data.user) { renderUser(data.user); return; }
        if (window.TS.getToken()) {
          return getSession().then(function (s) {
            if (s && s.user) { renderUser(s.user); return; }
            throw new Error('bad');
          });
        }
        throw new Error('bad');
      })
      .catch(function () {
        window.TS.setToken(null);
        toEmailForm();
        show('signedOut');
        say('That link has expired or was already used. Enter your email for a new one.', 'err');
      });
  }

  /* ---- events ---- */
  els.form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = els.email.value.trim();
    if (!email || email.indexOf('@') === -1) {
      say('Enter a valid email address.', 'err');
      els.email.focus();
      return;
    }
    busy(true);
    say('Sending your link…', '');
    sendLink(email)
      .then(function () { toSentState(email); })
      .catch(function (err) { say(err.message, 'err'); busy(false); });
  });

  els.resend.addEventListener('click', function () {
    if (!sentTo) return;
    els.resend.disabled = true;
    say('Sending…', '');
    sendLink(sentTo)
      .then(function () { els.resend.disabled = false; say('New link sent.', 'ok'); })
      .catch(function (err) { els.resend.disabled = false; say(err.message, 'err'); });
  });

  els.restart.addEventListener('click', function () {
    els.email.value = '';
    toEmailForm();
    els.email.focus();
  });

  els.signOut.addEventListener('click', function () {
    var hadToken = !!window.TS.getToken();
    window.TS.setToken(null);
    els.email.value = '';
    toEmailForm();
    setNavAccount(null);
    show('signedOut');
    if (hadToken) authCall('/sign-out', {}).catch(function () {});
  });

  /* ---- boot ---- */
  toEmailForm();

  var magicToken = (window.location.hash.match(/[#&?]magic=([^&]+)/) || [])[1];
  if (magicToken) {
    // Strip ?magic= from the URL so a refresh can't replay it.
    try {
      var cleaned = window.location.hash.replace(/([#&?])magic=[^&]+/, '$1').replace(/[?&]$/, '');
      history.replaceState(null, '', window.location.pathname + window.location.search + cleaned);
    } catch (err) {}
  }

  if (!window.TS.BACKEND_URL) {
    show('unconfigured');
    return;
  }

  if (magicToken) {
    verifyMagic(decodeURIComponent(magicToken));
    return;
  }

  var existingToken = window.TS.getToken();
  if (!existingToken) {
    show('signedOut');
  } else {
    show('loading');
    getSession().then(function (data) {
      if (data && data.user) renderUser(data.user);
      else { window.TS.setToken(null); show('signedOut'); }
    });
  }
})();
