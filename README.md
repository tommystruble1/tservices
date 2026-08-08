# T's Services

Single-page site for a Discord-based game services shop — PlayStation trophy packages, BO3 Liquid Divinium, BO2 emblem hosting. Static HTML/CSS/JS, no build step, no dependencies. Hosts free on GitHub Pages.

```
index.html
assets/css/style.css
assets/js/main.js
```

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

- **A "Do you need my account login?" FAQ entry.** Deliberately absent rather than guessed at — it's the most common buyer objection, and the answer is a commitment only you can make. Worth writing: what you need from a buyer, whether 2FA has to come off, and what happens to the credentials afterwards.
- **Payment and refund terms**, same reasoning.
- **Real vouches.** The invented ones were removed. If you add a testimonials section back, use genuine quotes from your server.
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

`index.html` carries Open Graph and Twitter card tags, so the link unfurls with a title and description when pasted into Discord — worth having when the invite is your main channel. The `theme-color` tints the left stripe of Discord's embed blue.

There's no preview **image** yet, because that needs a real 1200×630 PNG. If you want one, drop it at `assets/og.png` and add:

```html
<meta property="og:image" content="https://tservices.cc/assets/og.png" />
```

The OG tags hardcode `https://tservices.cc/` — if the domain ever changes, update them along with `CNAME` and the `<link rel="canonical">`.

---

## Content notes

Everything on the page is real. Prices, times, platinum counts, package contents, the BO3 extras list and the emblem tiers all come straight from the service listings. Contact details are live: the invite is `discord.gg/reacters`, the handle is `tom1x1`, and the Originators contact is `reactors` — all three cards link to the invite.

The only thing still generic is `<meta name="description">`, which is your search-result snippet.

### Turn the emblem service back on

It renders dimmed with an `Offline · Updating` badge and a waitlist note. When the tool is back:

- `<article class="svc svc--offline">` → `<article class="svc">`
- `<span class="badge badge--off">Offline · Updating</span>` → `<span class="badge badge--live">Online</span>`
- Replace the three `Queued until back online` lines and delete the `.svc__note--warn` paragraph.
- Update the hero kicker: `2 OF 3 SERVICES LIVE` → `ALL SERVICES LIVE`.

## Theming

All colors are CSS custom properties at the top of `style.css`. To shift the accent, change `--acc`, `--acc-hot`, `--acc-deep` and `--acc-soft` — everything else (buttons, gradients, focus rings, hovers, the logo) follows. `--cy` is the cyan used for live badges and checkmarks.

The logo is inline SVG in the nav plus a duplicate in the favicon `data:` URI in `<head>` — change both if you redraw it.

## Ordering: Discord, not a form

There is no contact form and that's deliberate — GitHub Pages serves static files only, so a form would have needed a third-party backend, and a form that silently drops orders is worse than no form.

Instead, `#contact` is an order card: a four-point checklist of what to send, a button straight to `discord.gg/reacters`, and a **Copy order template** button that puts a pre-filled message on the clipboard. Clicking any price tile writes that package into line 1 of the template, so most people arrive in the server with a complete order already pasted.

The copy button uses the async Clipboard API with an `execCommand` fallback, and shows an amber "copy it manually" message if both are blocked. The Clipboard API needs a secure context, so it works on `https://` and `localhost` but not from a bare `file://` path — that's a local-preview quirk, not a production one.

If you later want orders by email instead, [Formspree](https://formspree.io) is the least-effort option. Do **not** put a Discord webhook URL in client-side JS — anyone can read it and spam your server. Proxy it through a Cloudflare Worker.

## Risk and legal notes

These are real, not boilerplate — read them.

- **The services are outside Sony's and Activision's ToS.** The site says so plainly in the Platforms section, in the "Is there a ban risk?" FAQ, on the order checkbox and in the footer. Keep that language. Sellers who promise "100% safe, no ban risk" are the ones who get charged back, reported and removed. Honesty here is also your best defence in a payment dispute.
- **You're asking strangers for account credentials.** That makes you a target for chargebacks and impersonation, and makes your buyers targets for anyone impersonating *you*. Whatever process you use, document it in that FAQ answer.
- **Payment processors kill accounts over this.** PayPal in particular treats game-account services as prohibited and will freeze balances. Plan for it.
- **"We're the only ones who provide this service"** (the BO2 emblem tool) is on the page as a marketing claim. Make sure you can stand behind it.
- **No Sony or Activision assets are used** — no logos, key art, fonts or screenshots. The look is generic tech so it reads the part without the takedown risk. Keep it that way, and keep the footer disclaimer.
