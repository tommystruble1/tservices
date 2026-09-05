/* T's Services — account sign-in
   ---------------------------------------------------------------------------
   GitHub Pages serves static files only, so there is no server here to check a
   password against. Passwords are handled by Supabase Auth instead: it hashes
   them, issues the session tokens and enforces the rules. This file only ever
   passes credentials straight to Supabase over HTTPS and keeps the resulting
   session — it never stores, compares or inspects a password itself.

   The anon key below is PUBLIC by design. It identifies the project, it is not
   a secret, and it is safe in page source. What protects your data is Supabase
   Row Level Security, configured on their dashboard — not the key.

   No SDK: the Auth REST API is called directly with fetch, so the site stays
   dependency-free and loads no third-party script.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  /* ===== CONFIG — from Supabase → Project Settings → API ===== */
  var SUPABASE_URL = '';        // e.g. https://abcdefgh.supabase.co
  var SUPABASE_ANON_KEY = '';   // the "anon / public" key
  /* =========================================================== */

  var SESSION_KEY = 'ts_session';
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

    who:     document.getElementById('authWho'),
    initial: document.getElementById('authInitial'),
    signOut: document.getElementById('authSignOut')
  };

  if (!els.signedOut) return;   // section not on this page

  var mode = 'signin';          // 'signin' | 'signup'

  /* ---- storage that never throws ----
     Private mode and blocked site data make localStorage throw on access,
     not merely return null. */
  function save(value) {
    try {
      if (value === null) localStorage.removeItem(SESSION_KEY);
      else localStorage.setItem(SESSION_KEY, JSON.stringify(value));
    } catch (err) { /* session just won't survive a reload */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) { return null; }
  }

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
    els.submit.textContent = on
      ? 'Working…'
      : (mode === 'signin' ? 'Sign in' : 'Create account');
  }

  /* ---- Supabase Auth REST ---- */
  function api(path, body, token) {
    var headers = {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY
    };
    if (token) headers.Authorization = 'Bearer ' + token;

    // Give up ourselves rather than waiting on the browser's own timeout, which
    // on a bad DNS lookup can leave the form disabled for 20s with no
    // explanation. Anything slower than this is broken from the user's side.
    var controller = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, TIMEOUT_MS);

    return fetch(SUPABASE_URL.replace(/\/+$/, '') + '/auth/v1' + path, {
      method: 'POST',
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller ? controller.signal : undefined
    }).catch(function () {
      // Offline, DNS failure, blocked request, our own abort — never surface
      // "Failed to fetch" or "AbortError" to someone trying to sign in.
      throw new Error('Could not reach the server. Check your connection and try again.');
    }).then(function (res) {
      clearTimeout(timer);
      return res;
    }, function (err) {
      clearTimeout(timer);
      throw err;
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          // Supabase puts the readable reason in one of these.
          var msg = data.error_description || data.msg || data.message
            || data.error || 'Something went wrong. Try again.';
          throw new Error(msg);
        }
        return data;
      });
    });
  }

  function storeSession(data) {
    if (!data.access_token) return null;
    var session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires: Date.now() + ((data.expires_in || 3600) * 1000),
      email: (data.user && data.user.email) || els.email.value.trim()
    };
    save(session);
    return session;
  }

  function renderSignedIn(session) {
    // Email is user-supplied data: textContent only, never innerHTML.
    els.who.textContent = session.email || 'Signed in';
    els.initial.textContent = (session.email || '?').slice(0, 1).toUpperCase();
    show('signedIn');
  }

  function refresh(session) {
    return api('/token?grant_type=refresh_token', {
      refresh_token: session.refresh_token
    }).then(function (data) {
      var next = storeSession(data);
      if (!next) throw new Error('Could not renew session.');
      return next;
    });
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
    els.toggle.textContent = signin
      ? 'No account yet? Create one'
      : 'Already have an account? Sign in';
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
    // UX check only — Supabase enforces the real policy server-side.
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

    var request = mode === 'signin'
      ? api('/token?grant_type=password', { email: email, password: password })
      : api('/signup', { email: email, password: password });

    request.then(function (data) {
      els.password.value = '';       // don't leave it sitting in the DOM
      var session = storeSession(data);

      if (session) {
        renderSignedIn(session);
      } else {
        // Signup with email confirmation on: no session until they confirm.
        setMode('signin');
        say('Account created. Check your email to confirm it, then sign in.', 'ok');
      }
    }).catch(function (err) {
      say(err.message, 'err');
    }).then(function () {
      busy(false);
    });
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
    api('/recover', { email: email })
      .then(function () {
        // Deliberately the same message whether or not the account exists,
        // so this can't be used to find out who has an account.
        say('If that address has an account, a reset link is on its way.', 'ok');
      })
      .catch(function (err) { say(err.message, 'err'); })
      .then(function () { busy(false); });
  });

  els.signOut.addEventListener('click', function () {
    var session = load();
    save(null);
    show('signedOut');
    setMode('signin');
    els.email.value = '';
    els.password.value = '';
    // Best effort — the local session is already gone either way.
    if (session && session.access_token) {
      api('/logout', null, session.access_token).catch(function () {});
    }
  });

  /* ---- boot ---- */
  setMode('signin');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    show('unconfigured');
    return;
  }

  var existing = load();

  if (!existing) {
    show('signedOut');
  } else if (Date.now() < existing.expires) {
    renderSignedIn(existing);
  } else if (existing.refresh_token) {
    show('loading');
    refresh(existing)
      .then(renderSignedIn)
      .catch(function () {
        save(null);
        show('signedOut');
        say('That session expired. Sign in again.', 'err');
      });
  } else {
    save(null);
    show('signedOut');
  }
})();
