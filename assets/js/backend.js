/* Shared config for talking to the Better Auth + Stripe backend in /server.
   ---------------------------------------------------------------------------
   That backend is a separate deployment (Vercel) from this static site
   (GitHub Pages) — see server/README.md. Nothing here works until BACKEND_URL
   points at it. Loaded before auth.js and cart.js, which both read window.TS.

   Auth uses a bearer token, not a cookie: a cookie set by the backend's own
   domain would be a third-party cookie from this site's point of view, and
   Safari (and increasingly Chrome) block those outright. The token comes back
   in a response header on sign-in and is sent as `Authorization: Bearer …`
   on every request after — same pattern as any API key. */
(function () {
  'use strict';

  /* ===== CONFIG — paste your deployed backend's URL here ===== */
  var BACKEND_URL = '';   // e.g. https://tservices-api.vercel.app
  /* ============================================================= */

  var TOKEN_KEY = 'ts_auth_token';

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch (err) { return null; }
  }
  function setToken(token) {
    try {
      if (token === null) localStorage.removeItem(TOKEN_KEY);
      else localStorage.setItem(TOKEN_KEY, token);
    } catch (err) { /* no persistence available; session won't survive a reload */ }
  }

  function authFetch(path, options) {
    options = options || {};
    options.headers = options.headers || {};
    var token = getToken();
    if (token) options.headers.Authorization = 'Bearer ' + token;
    return fetch(BACKEND_URL.replace(/\/+$/, '') + path, options);
  }

  window.TS = {
    BACKEND_URL: BACKEND_URL,
    getToken: getToken,
    setToken: setToken,
    authFetch: authFetch
  };
})();
