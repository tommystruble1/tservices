/* The one and only place a price is decided.
   ---------------------------------------------------------------------------
   The static site displays these same numbers for humans to read, but a
   browser is not a trustworthy source of what something costs — anyone can
   edit the page or replay a request with a different amount. checkout.js
   looks prices up here by id and ignores whatever the client sent for price.

   Keep this in sync with the .variant blocks in index.html by hand; there is
   no shared source between the static site and this server. */
export const PRICES = {
  'yari-week':     { name: 'Yari — 1 week',    cents: 700 },
  'yari-month':    { name: 'Yari — 1 month',   cents: 2500 },
  'yari-2month':   { name: 'Yari — 2 months',  cents: 4500 },
  'yari-3month':   { name: 'Yari — 3 months',  cents: 6000 },
  'yari-lifetime': { name: 'Yari — Lifetime',  cents: 11000 }
};
