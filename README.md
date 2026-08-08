# NULLBYTE OPS

A single-page, Call of Duty–themed site for a custom modding service. Static HTML/CSS/JS — no build step, no dependencies. Designed to be hosted free on GitHub Pages.

```
index.html
assets/css/style.css
assets/js/main.js
```

## Run it locally

Just open `index.html` in a browser, or serve it:

```bash
python -m http.server 8000
```

## Deploy to GitHub Pages

1. Create a new **public** repo on GitHub (no README, no .gitignore — this repo already has them).
2. Push:

```bash
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main
git push -u origin main
```

3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.**
4. Live in ~1 minute at `https://USERNAME.github.io/REPO/`.

If you name the repo `USERNAME.github.io`, it serves from the root domain instead.

## Things you must change before going live

| Where | What |
|---|---|
| `index.html` — `.contact-alt` block | Discord invite, email address, hours |
| `index.html` — `<title>` / `<meta description>` | Brand name and search snippet |
| `index.html` — `.brand__text` (nav + footer) | Business name |
| `index.html` — `.card__price` / `.tier__price` | Real pricing |
| `index.html` — `.quote` blocks | Testimonials are placeholder copy — replace with real ones or delete the section |
| `index.html` — `.hero__stats` `data-count` | Real numbers |

## The order form does not send anything

`assets/js/main.js` validates the form and shows a success message, but there is **no backend** — GitHub Pages only serves static files. Submissions go nowhere. Before you take real orders, do one of:

- **[Formspree](https://formspree.io)** — easiest. Set `<form action="https://formspree.io/f/YOUR_ID" method="POST">` and delete the `preventDefault()` handler.
- **[Getform](https://getform.io)** or **[Basin](https://usebasin.com)** — same idea.
- **Discord webhook** — do *not* put the webhook URL in client-side JS; anyone can read it and spam your server. Proxy it through a Cloudflare Worker.

Until then, point people at the Discord/email links instead.

## Legal note

The footer carries a disclaimer that this is not affiliated with Activision. Keep it. Don't use official Call of Duty logos, key art, fonts or screenshots — that's a trademark/copyright problem and a takedown waiting to happen. The design here is deliberately generic-military so it reads as CoD-adjacent without using their assets.
