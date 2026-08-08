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

1. Create a new **public** repo on GitHub (no README, no .gitignore — this repo has them).
2. Push:

```bash
git remote add origin https://github.com/USERNAME/REPO.git && git push -u origin main
```

3. Repo → **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save.**
4. Live in ~1 minute at `https://USERNAME.github.io/REPO/`.

Naming the repo `USERNAME.github.io` serves it from the root domain instead.

---

## Custom domain

Yes — GitHub Pages supports custom domains free, and it issues the HTTPS certificate for you. You only pay for the domain itself (~$10–15/yr at Cloudflare, Porkbun or Namecheap; avoid GoDaddy's renewal pricing).

**1. Buy the domain.**

**2. Point DNS at GitHub.** At your registrar's DNS panel:

For the apex domain (`tsservices.com`) — four A records, all with host `@`:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

And optionally the IPv6 AAAA records, same host `@`:

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

For `www` — one CNAME record, host `www`, value `USERNAME.github.io` (note the trailing dot if your registrar wants one).

> These are GitHub's published Pages IPs. Confirm them against
> [GitHub's docs](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site)
> when you set this up — they change rarely, but they do change.

**3. Tell GitHub.** Repo → **Settings → Pages → Custom domain** → type the domain → **Save**. This commits a `CNAME` file to the repo, so run `git pull` before your next push or you'll hit a conflict.

**4. Wait, then force HTTPS.** DNS takes anywhere from 10 minutes to a few hours. Once GitHub shows the domain as verified, tick **Enforce HTTPS**. Don't skip this — an unlocked padlock on a page asking for money kills conversions.

**Notes.** Use Cloudflare's DNS if you want the domain proxied, but set SSL/TLS mode to **Full (strict)** or you'll get a redirect loop. And if you're taking payment for account services, expect that a domain registered with fake WHOIS details can be pulled — most registrars include free WHOIS privacy, which is the right way to stay unlisted.

---

## Before you go live

### 1. Two FAQ answers are unwritten

They render as dashed amber boxes on the page so you can't miss them. Search `class="todo"` in `index.html`.

- **"Do you need my account login?"** — This is the single most important sentence on the site. Every trophy buyer asks it, and a vague answer costs more orders than any price change. Say exactly what you need, whether 2FA has to come off, what you do with the credentials during the job, and what happens to them after.
- **"How do I pay, and do you refund?"** — Your real methods and terms.

### 2. Placeholder content to replace

| Where | What |
|---|---|
| `.quote` blocks | All three vouches are invented. Use real ones from your server or delete the section. |
| `<meta name="description">` | Your search snippet |

Contact details are live: the invite is `discord.gg/reacters`, the handle is `tom1x1`, and the Originators contact is `reactors`. All three cards link to the invite.

Everything else — prices, times, platinum counts, package contents, the BO3 extras list, the emblem tiers — is taken straight from what you posted and should be accurate.

### 3. Turn the emblem service back on

It renders dimmed with an `Offline · Updating` badge and a waitlist note. When the tool is back:

- `<article class="svc svc--offline">` → `<article class="svc">`
- `<span class="badge badge--off">Offline · Updating</span>` → `<span class="badge badge--live">Online</span>`
- Replace the three `Queued until back online` lines and delete the `.svc__note--warn` paragraph.
- Update the hero kicker: `2 OF 3 SERVICES LIVE` → `ALL SERVICES LIVE`.

## Theming

All colors are CSS custom properties at the top of `style.css`. To shift the accent, change `--acc`, `--acc-hot`, `--acc-deep` and `--acc-soft` — everything else (buttons, gradients, focus rings, hovers, the logo) follows. `--cy` is the cyan used for live badges and checkmarks.

The logo is inline SVG in the nav plus a duplicate in the favicon `data:` URI in `<head>` — change both if you redraw it.

## The order form does not send anything

`assets/js/main.js` validates the form and shows a success message, but there is **no backend** — GitHub Pages only serves static files. Submissions go nowhere. Options:

- **[Formspree](https://formspree.io)** — easiest. Set `<form action="https://formspree.io/f/YOUR_ID" method="POST">` and remove the `preventDefault()` handler.
- **[Getform](https://getform.io)** or **[Basin](https://usebasin.com)** — same idea.
- **Discord webhook** — do *not* put the webhook URL in client-side JS; anyone can read it and spam your server. Proxy it through a Cloudflare Worker.

Until one of those is wired up, the Discord link is your real intake and the form is decoration. Consider deleting it rather than shipping a form that silently drops orders.

## Risk and legal notes

These are real, not boilerplate — read them.

- **The services are outside Sony's and Activision's ToS.** The site says so plainly in the Platforms section, in the "Is there a ban risk?" FAQ, on the order checkbox and in the footer. Keep that language. Sellers who promise "100% safe, no ban risk" are the ones who get charged back, reported and removed. Honesty here is also your best defence in a payment dispute.
- **You're asking strangers for account credentials.** That makes you a target for chargebacks and impersonation, and makes your buyers targets for anyone impersonating *you*. Whatever process you use, document it in that FAQ answer.
- **Payment processors kill accounts over this.** PayPal in particular treats game-account services as prohibited and will freeze balances. Plan for it.
- **"We're the only ones who provide this service"** (the BO2 emblem tool) is on the page as a marketing claim. Make sure you can stand behind it.
- **No Sony or Activision assets are used** — no logos, key art, fonts or screenshots. The look is generic tech so it reads the part without the takedown risk. Keep it that way, and keep the footer disclaimer.
