# T's Services

Single-page pre-launch site for a Discord-based GTA shop — mod menu resale. Currently in a **coming soon** state: no lineup, no prices, nothing for sale. The menus are being arranged directly with their developers, and the page says so plainly instead of listing tiers that would only change later. The CTA collects interest.

Static HTML/CSS/JS, no build step, no dependencies. Hosts free on GitHub Pages.

```
index.html
assets/css/style.css
assets/js/main.js
```

The logo is inline SVG in the nav, with a matching copy in the favicon `data:` URI in `<head>` — change both if you redraw it. There is no image asset to manage.

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

- **The lineup.** Once the menus are arranged with their developers, replace the `.pending` panel in `#menus` with the real cards — names, prices, features. That is the one thing standing between this and a working shop.
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

`index.html` carries Open Graph and Twitter card tags, so the link unfurls with a title and description when pasted into Discord — worth having when a DM is your only channel. The `theme-color` tints the left stripe of Discord's embed pink.

There's no preview **image**, because that needs a real 1200×630 PNG (the card is declared `summary_large_image`). If you want one, drop it at `assets/og.png` and add:

```html
<meta property="og:image" content="https://tservices.cc/assets/og.png" />
<meta name="twitter:image" content="https://tservices.cc/assets/og.png" />
```

The OG tags hardcode `https://tservices.cc/` — if the domain ever changes, update them along with `CNAME` and the `<link rel="canonical">`.

---

## Content notes

**Nothing on the page is invented.** There are no menu names, no prices and no feature lists, because the lineup isn't settled — you're sourcing from the developers directly. `#menus` is a single `.pending` panel that says exactly that. Everything else — the platform claims, the process, the FAQ, the disclaimers — is written to be true regardless of what you end up stocking.

Earlier drafts of this page carried placeholder tiers (Entry / Standard / Premium), a **Tools & Jobs** section and a **What You Get** comparison table. All removed, along with their CSS and the click-to-pick JS. Nothing dead is left behind.

The `<meta name="description">` is your search-result snippet — rewrite it once the lineup is real.

### Going live

To open for business you'll be adding the lineup, not just flipping switches. The switches, though:

| Where | Now | When you open |
|---|---|---|
| `#menus` | one `.pending` panel | your real menu cards |
| Hero kicker | `<span class="dot dot--soon">` + `<b class="is-soon">COMING SOON</b>` | `<span class="dot">` + `<b>IN STOCK</b>` |
| Hero second CTA | "Why the Wait" → `#menus` | "See the Lineup" |
| Nav + hero + `#contact` heading | "Join the List" | "Get Access" |
| Hero `Launch` fact | "Not open yet" | delivery terms |
| `#setup` step 01 | "Once the lineup is up…" | drop the preamble |
| `#faq` | "When do you open?" entry | remove it |
| `#contact` | three-line list template | add a product line |

`badge--live` (green) and `.dot` (green, pulsing) are still in the CSS for exactly this. A green pulsing dot over a shop that isn't open is the kind of detail people screenshot, so keep the kicker and the panel telling the same story.

If you want click-to-pick back on the product cards, the JS hook was a `[data-service]` attribute on each CTA whose value got written into the `#contact` template. It was removed with the tiers; check the git history for the implementation.

## Theming

All colors are CSS custom properties at the top of `style.css`. To shift the accent, change `--pink`, `--pink-lo` and `--pink-glow` — buttons, gradients, focus rings, hovers, the outlined hero type and the logo all follow. `--green` is the in-stock badge and the pulsing status dot; `--amber` is the risk notice and the out-of-stock badge.

Type is three Google fonts: **Anton** for the slab headings, **Barlow** for body, **IBM Plex Mono** for the eyebrows and the handle. They're set as `--display`, `--body` and `--mono`; change the `<link>` in `<head>` if you swap any of them.

The hero's outlined word uses `-webkit-text-stroke`, which every current browser supports but which renders as solid fill if it ever isn't; that degrades fine.

If you shift `--pink`, update `<meta name="theme-color">` in `<head>` to match — it tints the stripe on Discord link previews.

## Ordering: Discord, not a form

There is no contact form and that's deliberate — GitHub Pages serves static files only, so a form would have needed a third-party backend, and a form that silently drops orders is worse than no form.

Instead, `#contact` is a sign-up card: the handle `tom1x1` with a **Copy handle** button, a three-point checklist of what to send, and a **Copy message template** button that puts a pre-filled message on the clipboard. Nothing submits anywhere — the buttons just hand people text to paste into a DM.

There is no server invite. Intake is the handle only — if you later want a server link back, add it as a second `.handle` block rather than turning the handle into a link, because the copy button is what makes a bare handle usable.

The copy button uses the async Clipboard API with an `execCommand` fallback, and shows an amber "copy it manually" message if both are blocked. The Clipboard API needs a secure context, so it works on `https://` and `localhost` but not from a bare `file://` path — that's a local-preview quirk, not a production one.

If you later want orders by email instead, [Formspree](https://formspree.io) is the least-effort option. Do **not** put a Discord webhook URL in client-side JS — anyone can read it and spam your server. Proxy it through a Cloudflare Worker.

## Risk and legal notes

These are real, not boilerplate — read them.

- **Take-Two sues mod menu sellers, and wins.** This is the material difference from the old trophy business. Take-Two has taken direct legal action against menu operators and resellers — Elusive and Absolute are the well-known ones — and shut them down. Resale is a smaller target than authorship, but it is the same target. Know what you're standing in front of.
- **Never claim "undetected".** The site deliberately says the opposite, in the risk notice under `#menus`, in the "Will I get banned?" FAQ and in the footer. Keep that language. Sellers who promise a permanently safe menu are the ones who get charged back, reported and removed, and honesty here is your best defence in a payment dispute.
- **No work aimed at other players.** The FAQ and footer both say you don't take work targeting other people's accounts, sessions or connections. That line is doing real work: crashers, kickers and connection tools are what turns a ToS problem into a criminal-liability problem, and they're the fastest route to a platform-level report. If you decide to sell that anyway, the line has to come off the page — don't leave a promise up that you're not keeping.
- **Account credentials.** If any of your jobs need buyer logins, that makes you a target for chargebacks and impersonation, and your buyers targets for anyone impersonating *you*. There's no FAQ entry for it yet because the answer is yours to write.
- **Payment processors kill accounts over this.** PayPal in particular treats game-modification sales as prohibited and will freeze balances. Plan for it.
- **No Rockstar or Take-Two assets are used** — no logos, key art, fonts or screenshots. The pink-and-black look reads Los Santos without borrowing anything ownable. Keep it that way, and keep the footer disclaimer.
