/* T's Services — account sign-in, via Better Auth email OTP
   ---------------------------------------------------------------------------
   No password. The visitor enters an email, we send a 6-digit code, and
   entering that code signs them in — creating the account the first time.

   GitHub Pages serves static files only, so there is no server here. The code
   is generated, stored and checked by the separate backend under /server
   (Better Auth's emailOTP plugin), and the email is sent by whatever provider
   that backend is configured with. This file is only the UI plus the three
   Better Auth REST calls it makes:

     POST /api/auth/email-otp/send-verification-otp   { email, type: "sign-in" }
     POST /api/auth/sign-in/email-otp                 { email, otp }
     GET  /api/auth/get-session

   Auth is bearer-token based (see backend.js): sign-in returns the token in a
   `set-auth-token` response header, stored and sent as `Authorization: Bearer`.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var TIMEOUT_MS = 12000;
  var RESEND_COOLDOWN_MS = 30000;

  var els = {
    unconfigured: document.getElementById('authUnconfigured'),
    signedOut:    document.getElementById('authSignedOut'),
    loading:      document.getElementById('authLoading'),
    signedIn:     document.getElementById('authSignedIn'),

    form:      document.getElementById('authForm'),
    email:     document.getElementById('authEmail'),
    codeField: document.getElementById('authCodeField'),
    code:      document.getElementById('authCode'),
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

  var step = 'email';   // 'email' | 'code'
  var pendingEmail = '';
  var lastSentAt = 0;
  var resendTimer = null;

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
    els.email.disabled = on || step === 'code';
    if (els.code) els.code.disabled = on;
    els.submit.textContent = on
      ? 'Working…'
      : (step === 'email' ? 'Send code' : 'Verify & sign in');
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

  /* ---- step handling ---- */
  function toEmailStep() {
    step = 'email';
    pendingEmail = '';
    els.formTitle.textContent = 'Create an account';
    els.formHint.textContent =
      "Enter your email and we'll send a 6-digit code. No password — the code signs you in, and creates your account the first time.";
    els.codeField.hidden = true;
    if (els.code) els.code.value = '';
    els.resend.hidden = true;
    els.restart.hidden = true;
    stopResendTimer();
    say('', '');
    busy(false);
    els.email.disabled = false;
  }

  function toCodeStep(email) {
    step = 'code';
    pendingEmail = email;
    lastSentAt = Date.now();
    els.formTitle.textContent = 'Enter your code';
    els.formHint.textContent = 'We sent a 6-digit code to ' + email + '.';
    els.codeField.hidden = false;
    els.restart.hidden = false;
    els.email.disabled = true;
    busy(false);
    if (els.code) els.code.focus();
    startResendTimer();
  }

  function stopResendTimer() {
    if (resendTimer) { clearInterval(resendTimer); resendTimer = null; }
  }
  function startResendTimer() {
    stopResendTimer();
    els.resend.hidden = false;
    function tick() {
      var left = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - lastSentAt)) / 1000);
      if (left > 0) {
        els.resend.disabled = true;
        els.resend.textContent = 'Resend code in ' + left + 's';
      } else {
        els.resend.disabled = false;
        els.resend.textContent = 'Resend code';
        stopResendTimer();
      }
    }
    tick();
    resendTimer = setInterval(tick, 1000);
  }

  function sendCode(email) {
    return authCall('/email-otp/send-verification-otp', { email: email, type: 'sign-in' });
  }

  /* ---- events ---- */
  els.form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (step === 'email') {
      var email = els.email.value.trim();
      if (!email || email.indexOf('@') === -1) {
        say('Enter a valid email address.', 'err');
        els.email.focus();
        return;
      }
      busy(true);
      say('Sending your code…', '');
      sendCode(email)
        .then(function () {
          say('Code sent. Check your inbox (and spam).', 'ok');
          toCodeStep(email);
        })
        .catch(function (err) { say(err.message, 'err'); busy(false); });
      return;
    }

    // step === 'code'
    var otp = (els.code.value || '').replace(/\D/g, '');
    if (otp.length !== 6) {
      say('Enter the 6-digit code from the email.', 'err');
      els.code.focus();
      return;
    }
    busy(true);
    say('Checking your code…', '');
    authCall('/sign-in/email-otp', { email: pendingEmail, otp: otp })
      .then(function (data) {
        if (data && data.user) renderUser(data.user);
        else return getSession().then(function (s) {
          if (s && s.user) renderUser(s.user);
          else throw new Error('Signed in, but could not load your account. Reload the page.');
        });
      })
      .catch(function (err) { say(err.message, 'err'); busy(false); });
  });

  els.resend.addEventListener('click', function () {
    if (els.resend.disabled || !pendingEmail) return;
    busy(true);
    say('Resending…', '');
    sendCode(pendingEmail)
      .then(function () { lastSentAt = Date.now(); startResendTimer(); say('New code sent.', 'ok'); busy(false); })
      .catch(function (err) { say(err.message, 'err'); busy(false); });
  });

  els.restart.addEventListener('click', function () {
    toEmailStep();
    els.email.focus();
  });

  els.signOut.addEventListener('click', function () {
    var hadToken = !!window.TS.getToken();
    window.TS.setToken(null);
    toEmailStep();
    els.email.value = '';
    setNavAccount(null);
    show('signedOut');
    if (hadToken) authCall('/sign-out', {}).catch(function () {});
  });

  /* ---- boot ---- */
  toEmailStep();

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
      if (data && data.user) renderUser(data.user);
      else { window.TS.setToken(null); show('signedOut'); }
    });
  }
})();
