# T's Services

Single-page site for a Discord-based GTA shop — mod menu resale. **Yari is in stock and priced.** Cart and 19 languages work with no setup; accounts, licence-key delivery and checkout are wired up in the page but need the `/server` backend deployed first (see below).

Static HTML/CSS/JS, no build step, no third-party scripts. Hosts free on GitHub Pages.

```
index.html
assets/css/style.css
assets/js/main.js      site interactions + category rail
assets/js/backend.js   BACKEND_URL + the bearer-token fetch helper — set this first
assets/js/auth.js      accounts, via Better Auth — needs /server deployed, see below
assets/js/cart.js      shopping cart + checkout
assets/js/i18n.js      language switcher
server/                Better Auth + Stripe API — a separate deployment, see below
```

Page order: Home (hero) → Products → Partners → How it runs → FAQ → Account → Support.
The nav bar carries Home / Products / Partners / FAQ / Support, a language picker, the cart,
and a **Sign In** button. "How it runs" is deliberately not in the bar — it's a supporting
section, and the bar is already full. Add `<a href="#setup">Setup</a>` to both navs if you disagree.

## Cart

`assets/js/cart.js` — a working cart with nothing to put in it yet. It holds state, renders,
persists across reloads and totals correctly. Any element becomes an add-to-cart button:

```html
<button data-add-to-cart
        data-id="yari-week"       unique and stable — it is the cart key
        data-name="Yari — 1 week" shown in the cart
        data-price="7.00">        decimal, no currency symbol
  Add to cart
</button>
```

The listener is delegated, so products added later need no JS change. A button missing any of
the three attributes is ignored and warns in the console rather than adding a broken line.

Money is held in **integer cents** throughout. Float arithmetic gives you
`0.1 + 0.2 = 0.30000000000000004`, which is exactly the sort of thing customers screenshot.
Totals format through `Intl.NumberFormat` in the active language.

> **Checkout only sends ids and quantities, never prices**, to the `/server` backend covered later
> in this README — that backend, not this page, decides what something actually costs. Until that
> backend is deployed and `assets/js/backend.js` points at it, the button explains that and points
> people at Discord instead.

Cart contents are re-validated on load, because `localStorage` is user-editable — a tampered
entry is dropped rather than trusted.

## Languages

`assets/js/i18n.js` — 19 languages. Elements opt in with `data-i18n="key"` (text) or
`data-i18n-html="key"` (for strings carrying markup, like the hero headline). The choice is
remembered, and on a first visit the browser's own language is used if there's a dictionary for
it. Arabic sets `dir="rtl"` and the layout mirrors, cart drawer included.

**What is translated:** navigation, hero, cart and section headings — the chrome people navigate by.

**What is not, deliberately:** the ban-risk notice, the FAQ answers, and the ToS and trademark
disclaimers. Those paragraphs decide whether a customer understood what they were buying and what
could happen to their account. An unreviewed machine translation of a risk warning is worse than
English. Get a fluent speaker to do those before you promise them in another language.

To add a language, add an entry to `LANGS` and a matching block to `T` in `i18n.js`. Missing keys
fall back to English rather than rendering blank.

The logo is inline SVG in the nav, with a matching copy in the favicon `data:` URI in `<head>` — change both if you redraw it. There is no image asset to manage.

## Accounts, licence keys and checkout — the /server backend

**Nothing in this section works until `/server` is deployed and `assets/js/backend.js` points at
it.** Until then the account section correctly says "Not open yet" and checkout says "Message
tom1x1 on Discord" — that's the honest state, not a bug.

### Why this needs a real server, unlike the rest of the site

Everything else on tservices.cc is static files with no code running anywhere but the visitor's
browser. Two things in this project genuinely cannot work that way, no matter how they're wired:

- **Checking a password.** Whatever code checked it, and whatever it checked it against, would sit
  in page source for anyone to read.
- **Deciding what something costs, for money that's actually changing hands.** The page can
  *display* a price, but it cannot be the thing a payment is trusted against — anyone can edit a
  static page's numbers before a request goes out.

`/server` is a small [Better Auth](https://better-auth.com) + [Stripe](https://stripe.com) API,
meant to be deployed to [Vercel](https://vercel.com) as its own project, separate from this static
site. It talks to tservices.cc over plain HTTPS `fetch` calls — no build step is added to the
static site itself.

**I could not run or test this backend.** Everything else in this repo was checked in a live
browser before being called done; this sandbox has no Node.js runtime, so `/server` was written
carefully against Better Auth's and Stripe's documented APIs but never actually executed. Test it
for real after your first deploy — sign up, sign in, and run one Stripe test-mode purchase — before
trusting it with real payments.

### What you have to do yourself

I can't create the accounts this needs — Vercel, a database, and Stripe all want your name, email,
and eventually (Stripe) your bank details for payouts. That part is yours:

1. **A Postgres database.** [Neon](https://neon.tech) has a free tier and works well here. Copy
   its connection string.
2. **A Stripe account.** Developers → API keys for a secret key; Developers → Webhooks for a
   webhook signing secret, once you have a backend URL to point it at (step 4 makes that URL).
3. **A Vercel account**, then deploy `/server` as its **own** Vercel project (set the project's
   root directory to `server/`, not the repo root — it must not be deployed alongside the static
   site). Set the environment variables from `server/.env.example` in the Vercel project settings.
4. Back in Stripe, add a webhook endpoint at `<your-backend>.vercel.app/api/webhook`, subscribed to
   `checkout.session.completed`, and paste its signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Run Better Auth's migration against your database, then `server/schema.sql` for the licences
   table — see the comment at the top of that file for the exact order (Better Auth's tables have
   to exist first; `licenses` has a foreign key into them):
   ```bash
   npx @better-auth/cli migrate
   psql "$DATABASE_URL" -f server/schema.sql
   ```
6. Paste your deployed backend's URL into `BACKEND_URL` at the top of `assets/js/backend.js`, push,
   and the static site starts talking to it.

### Why bearer tokens, not cookies

Better Auth defaults to a session cookie, but a cookie set by `<your-backend>.vercel.app` is a
**third-party cookie** from tservices.cc's point of view — Safari has blocked those for years, and
Chrome is heading the same way. `server/lib/auth.js` enables Better Auth's `bearer()` plugin
instead: sign-in returns the session token in a `set-auth-token` response header, and
`assets/js/backend.js` stores it and sends it back as `Authorization: Bearer …` on every request
after, the same way any API key works. `server/lib/cors.js` has to explicitly
`Access-Control-Expose-Headers: set-auth-token`, or the browser hides that header from JS entirely
and sign-in silently "succeeds" with no way to read the token back out.

### Why the server holds the only real prices

`server/lib/prices.js` is the one place a price is decided — `api/checkout.js` looks up each
cart line by its id and builds the Stripe Checkout Session from that, ignoring whatever the
browser sent for cost. This isn't new caution added for the backend: it's the same rule the cart
was built under from the start (see *Cart* above) — a browser was never a trustworthy source of
what something costs, and now there's finally a place for that rule to actually be enforced rather
than just asserted in a comment. **Keep `prices.js` in sync with the `.variant` blocks in
`index.html` by hand** — there's no shared source between the static site and this server, so a
mismatch means the page shows one number and Stripe charges another.

### Where a licence key comes from

Only one place: `server/api/webhook.js`, and only after Stripe confirms `checkout.session.completed`
with a signature that verifies against `STRIPE_WEBHOOK_SECRET`. Nothing else in this codebase ever
generates one — not checkout, not the page, not the dashboard. Stripe retries webhook delivery on
anything but a fast 2xx response, so the handler checks for an existing row with that
`stripe_session_id` before inserting, to avoid double-issuing keys on a retry.

### The dashboard

Once signed in, `#account`'s signed-in panel fetches `GET /api/orders`, which returns only the
calling user's own rows — scoped by the verified session's `user.id`, never by anything the client
claims about who it is. Each key renders in a `<code>` with `user-select: all`, so one click-drag
selects the whole thing for copying.

### What still needs a decision from you

- **Delivery beyond the key itself.** The dashboard shows the licence key Stripe's webhook issued.
  Actually installing the menu — a download link, setup instructions — isn't wired up; decide
  whether that's a static file per product, a support handoff, or something else.
- **Refunds and disputes.** Nothing here processes one. That's a Stripe dashboard action plus
  presumably revoking the key, which would need a small addition to `orders.js` (a `revoked`
  column checked before returning a row).

## Run it locally

Open `index.html` directly, or serve it:

```bash
python -m http.server 8123
```

## Deploy to GitHub Pages

Account: **tommystruble1**. Repo name assumed to be `tservices` below — change it if you pick another.

1. Create a new **public** repo named `tservices` on GitHub. Do **not** tick "Add a README" or "Add .gitignore" — this repo already has both, and pre-filling them causes a push conflict.
2. Push:

```bash
git remote add origin https://github.com/tommystruble1/tservices.git && git push -u origin main
```

3. Repo → **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save.**
4. Live in ~1 minute at `https://tommystruble1.github.io/tservices/`.

Confirm that URL loads before touching DNS. If it works there, the site is fine and any later problem is purely DNS.

---

## Status: live

**https://tservices.cc** — deployed, HTTPS, cert auto-renewing.

- [x] Domain bought — `tservices.cc` at Cloudflare
- [x] DNS records added (four A on `@`, CNAME on `www`, all unproxied)
- [x] Repo pushed, Pages building from `main` / `(root)`
- [x] Custom domain configured via the `CNAME` file; Let's Encrypt cert issued
- [ ] Tick **Enforce HTTPS** in Settings → Pages (http already upgrades, but make it explicit)

### Still worth adding

- **A checkout that can take the money.** Tsumi is priced and adds to the cart correctly, but the cart cannot charge anyone — see the Cart section. This is now the only thing between the site and its first sale.
- **A refund answer.** The FAQ says "message us" about payment and says nothing about refunds, because that's a commitment only you can make. Licence keys are the awkward case: once issued they can't be un-issued.
- **Real vouches.** The invented ones were removed. If you add a testimonials section back, use genuine quotes.
- **A link-preview image** — see the Custom domain section.

---

## Custom domain — tservices.cc (Cloudflare)

The `CNAME` file at the repo root already contains `tservices.cc`, so GitHub picks the domain up on the first deploy. **Do not delete it** — it's what tells Pages which domain to serve, and it must stay LF-only with no BOM (`.gitattributes` enforces that).

### DNS records at Cloudflare

Cloudflare dashboard → **tservices.cc** → **DNS** → **Records**. Add five records, and set every one of them to **DNS only** (grey cloud, not orange):

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `185.199.108.153` | DNS only |
| A | `@` | `185.199.109.153` | DNS only |
| A | `@` | `185.199.110.153` | DNS only |
| A | `@` | `185.199.111.153` | DNS only |
| CNAME | `www` | `tommystruble1.github.io` | DNS only |

Note the `www` target is `tommystruble1.github.io` — the account root, **not** `tommystruble1.github.io/tservices`. A CNAME can't contain a path; the `CNAME` file in the repo is what maps the domain to this specific repo.

Optionally add the four IPv6 AAAA records on `@` too: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.

> Confirm these IPs against [GitHub's docs](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site) when you set this up. They change rarely, but they do change.

### The grey cloud matters

Leave the proxy **off** until the site is live on HTTPS. With the orange cloud on, GitHub can't complete the ACME challenge, so it never issues your certificate and you get either a cert warning or an infinite redirect loop. This is the single most common way this setup fails.

Once GitHub shows **Enforce HTTPS** ticked and working, you *may* turn the proxy on — but only after setting **SSL/TLS → Overview → Full (strict)**. The default *Flexible* mode causes a redirect loop with Pages. If you don't specifically need Cloudflare's caching or DDoS protection, just leave it grey; it works fine.

### Order of operations

1. Push the repo and enable Pages (`main` / `(root)`). Confirm `tommystruble1.github.io/tservices` loads.
2. Add the DNS records above at Cloudflare, all DNS only.
3. Repo → **Settings → Pages → Custom domain** → `tservices.cc` → **Save**. GitHub verifies DNS — this can take 10 minutes to a few hours.
4. When the check goes green, tick **Enforce HTTPS**.
5. `git pull` before your next push. GitHub may rewrite the `CNAME` file from its UI.

`www.tservices.cc` will redirect to the apex automatically once the `www` CNAME resolves.

### Link previews

`index.html` carries Open Graph and Twitter card tags, so the link unfurls with a title and description when pasted into Discord — worth having when a DM is your only channel. The `theme-color` tints the left stripe of Discord's embed cyan.

There's no preview **image**, because that needs a real 1200×630 PNG (the card is declared `summary_large_image`). If you want one, drop it at `assets/og.png` and add:

```html
<meta property="og:image" content="https://tservices.cc/assets/og.png" />
<meta name="twitter:image" content="https://tservices.cc/assets/og.png" />
```

The OG tags hardcode `https://tservices.cc/` — if the domain ever changes, update them along with `CNAME` and the `<link rel="canonical">`.

---

## Content notes

**Nothing on the page is invented.** There are no menu names, no prices and no feature lists, because the lineup isn't settled — you're sourcing from the developers directly. Everything else — the platform claims, the process, the FAQ, the disclaimers — is written to be true regardless of what you end up stocking.

### The category rail

`#products` is a two-column `.catalog`: a vertical category rail on the left, the selected
category's panel on the right. Below 1020px the rail flips to a horizontal scrolling strip above
the panel, because a 260px column beside a narrow panel wastes the width.

**GTA is the only category**, since it's the only game you're carrying. Beneath it sits a
deliberately inert `.cat--empty` slot reading "More games / Not yet" — it shows the shape without
pretending to a catalogue you don't have. It is not a tab and keyboard navigation skips it.

To add a game, add two things with matching ids:

```html
<!-- in .catalog__rail -->
<button class="cat" type="button" role="tab" tabindex="-1"
        id="cat-NAME" aria-controls="panel-NAME" aria-selected="false">
  <span class="cat__name">Name</span>
  <span class="cat__meta">Platform</span>
</button>

<!-- in .catalog__panels -->
<div class="catpanel" role="tabpanel" id="panel-NAME" aria-labelledby="cat-NAME" tabindex="0" hidden>
  …
</div>
```

`main.js` reads the tabs at load and wires the rest — no JS edit needed. It's a proper ARIA
tablist: arrow keys move between categories, Home/End jump to the ends, and only the selected tab
sits in the tab order (roving `tabindex`). Keep the new panel's `hidden` attribute; the JS clears
it on selection.

### Products and their three states

Inside the GTA panel, `.products` holds one `.product` card per menu. Right now that's just
**Yari** — earlier drafts also carried Tsumi, Overdose, Cherax and Atlas, all since removed at
the owner's request. Each card is in one of three states, and the badge, the styling and the
button must all agree — a card that looks available but says "Notify me" is how you get a complaint.

| State | Card class | Badge | Button |
|---|---|---|---|
| In stock | `product product--live` | `badge--live` "In stock" | add-to-cart, or "Enquire" until priced |
| Offline | `product is-off` | `badge--off` "Offline" | "Notify me" → `#account` |
| Coming soon | `product` | `badge--soon` "Soon" | "Notify me" → `#account` |

**Yari** is in stock and priced, sold in five durations, each its own `.variant` row and its own
cart line:

| Duration | Price | `data-id` |
|---|---|---|
| 1 week | $7.00 | `yari-week` |
| 1 month | $25.00 | `yari-month` |
| 2 months | $45.00 | `yari-2month` |
| 3 months | $60.00 | `yari-3month` |
| Lifetime *(flagged best value)* | $110.00 | `yari-lifetime` |

The in-stock card takes the full row (`product--wide`) so the durations have room; any offline
card would flow in the grid beneath it. **The displayed price and `data-price` are two separate
strings** — change one and you must change the other, or the cart charges something different
from what the page advertises.

**If you change what's in stock, five other places say so** and will contradict you if you miss
them: the panel badge and its paragraph, the hero `Stock` fact, the ticker (×2), the sub-header
under "What We Sell", and the "When do you open?" FAQ answer.

### Yari's cover and mark

Yari carries two pieces of original artwork, both inline SVG, no image files:

- **`.product__mark`** — 槍 ("spear") on a small black sign board with an orange glow, beside the
  product name. Same pattern as Tsumi's mark before it: SVG `<text>` plus a glow filter, no font
  embed beyond the system CJK fallback stack.
- **`.product__cover`** — a full-width banner above the card: an original skyline (plain
  `<rect>` shapes, not traced from anywhere), an orange gradient sky, faint signal lines, and a
  spearhead silhouette. It bleeds to the card's edges via a negative margin equal to the card's
  own padding (`.product { overflow: hidden }` clips it to the border-radius) — see
  `.product__cover` in `style.css` if you reuse this on another product.

**Both were built from a reference image the owner shared, not from the image itself.** That
reference was a GTA V screenshot — Rockstar's character model and in-game skyline composited with
a neon sign / white chevron mark. This repo's own footer says no Rockstar assets are used, so the
photo itself was never an option; what got reused was the *idea* (a mark silhouetted against a
glowing night skyline), redrawn as original vector shapes. If you swap this out for something
closer to the reference later, keep that constraint in mind — a cropped or lightly-edited version
of the original screenshot is still Rockstar's asset.

**If you change what's in stock, four other places say so** and will contradict you if you miss
them: the panel badge and its paragraph, the hero `Stock` fact, the ticker, and the
"When do you open?" FAQ answer.

Earlier drafts of this page carried placeholder tiers (Entry / Standard / Premium), a **Tools & Jobs** section and a **What You Get** comparison table. All removed, along with their CSS and the click-to-pick JS. Nothing dead is left behind.

The `<meta name="description">` is your search-result snippet — rewrite it once the lineup is real.

### Going live

To open for business you'll be adding the lineup, not just flipping switches. The switches, though:

| Where | Now | When you open |
|---|---|---|
| `#products` | GTA category, no prices | real menus and prices in the GTA panel |
| Hero kicker | `<span class="dot dot--soon">` + `<b class="is-soon">COMING SOON</b>` | `<span class="dot">` + `<b>IN STOCK</b>` |
| Hero second CTA | "Why the Wait" → `#products` | "See the Lineup" |
| Account section | "Not open yet" | deployed /server, live sign-in |
| Hero `Launch` fact | "Not open yet" | delivery terms |
| `#setup` step 01 | "Once the lineup is up…" | drop the preamble |
| `#faq` | "When do you open?" entry | remove it |
| `#partners` | one `.pending` panel | the developers you actually carry |

`badge--live` (green) and `.dot` (green, pulsing) are still in the CSS for exactly this. A green pulsing dot over a shop that isn't open is the kind of detail people screenshot, so keep the kicker and the panel telling the same story.

If you want click-to-pick back on the product cards, the JS hook was a `[data-service]` attribute on each CTA whose value got written into the `#support` template. It was removed with the tiers; check the git history for the implementation.

## Theming

All colors are CSS custom properties at the top of `style.css`. Change `--acc`, `--acc-lo` and
`--acc-glow` and everything follows — buttons, focus rings, hovers, the hero gradient, the rail
tick, the cart badge, the logo. `--violet` is the second colour in the hero and avatar gradients.
`--green` is the live badge and status dot, `--amber` the risk notice and "coming soon" badges.

Type is three Google fonts: **Sora** for headings, **Inter** for body, **IBM Plex Mono** for the
small uppercase labels. They're set as `--display`, `--body` and `--mono`; change the `<link>` in
`<head>` if you swap any.

Two things carry the accent outside CSS: the inline SVG logo in the nav and its copy in the
favicon `data:` URI, and `<meta name="theme-color">` (which tints the stripe on Discord link
previews). Update all three together.

### The `[hidden]` trap

`style.css` has a global `[hidden] { display: none !important; }` near the top, and it is load
bearing. The UA's own `[hidden]` rule is a bare attribute selector, so **any** class rule setting
`display` silently beats it and the element stays visible. That caused three separate bugs here —
stacked account states, stacked catalog panels, and a cart badge reading "0" on an empty cart.
Don't remove it.

## Ordering: Discord, not a form

There is no contact form and that's deliberate — GitHub Pages serves static files only, so a form would have needed a third-party backend, and a form that silently drops orders is worse than no form.

Instead, `#support` is a support card: the handle `tom1x1` with a **Copy handle** button, a three-point checklist, and a **Copy message template** button. Discord is deliberately secondary now — the account section is the main way in, and Discord is there for people who would rather ask a human. Nothing submits anywhere; the buttons just hand people text to paste into a DM.

There is no server invite. Intake is the handle only — if you later want a server link back, add it as a second `.handle` block rather than turning the handle into a link, because the copy button is what makes a bare handle usable.

The copy button uses the async Clipboard API with an `execCommand` fallback, and shows an amber "copy it manually" message if both are blocked. The Clipboard API needs a secure context, so it works on `https://` and `localhost` but not from a bare `file://` path — that's a local-preview quirk, not a production one.

If you later want orders by email instead, [Formspree](https://formspree.io) is the least-effort option. Do **not** put a Discord webhook URL in client-side JS — anyone can read it and spam your server. Proxy it through a Cloudflare Worker.

## Risk and legal notes

These are real, not boilerplate — read them.

- **Take-Two sues mod menu sellers, and wins.** This is the material difference from the old trophy business. Take-Two has taken direct legal action against menu operators and resellers — Elusive and Absolute are the well-known ones — and shut them down. Resale is a smaller target than authorship, but it is the same target. Know what you're standing in front of.
- **Never claim "undetected".** The site deliberately says the opposite, in the risk notice under `#products`, in the "Will I get banned?" FAQ and in the footer. Keep that language. Sellers who promise a permanently safe menu are the ones who get charged back, reported and removed, and honesty here is your best defence in a payment dispute.
- **No work aimed at other players.** The FAQ and footer both say you don't take work targeting other people's accounts, sessions or connections. That line is doing real work: crashers, kickers and connection tools are what turns a ToS problem into a criminal-liability problem, and they're the fastest route to a platform-level report. If you decide to sell that anyway, the line has to come off the page — don't leave a promise up that you're not keeping.
- **Account credentials.** If any of your jobs need buyer logins, that makes you a target for chargebacks and impersonation, and your buyers targets for anyone impersonating *you*. There's no FAQ entry for it yet because the answer is yours to write.
- **Payment processors kill accounts over this.** PayPal in particular treats game-modification sales as prohibited and will freeze balances. Plan for it.
- **No Rockstar or Take-Two assets are used** — no logos, key art, fonts or screenshots. The cyan-and-black look is generic tech, borrowing nothing ownable. Keep it that way, and keep the footer disclaimer.
