# Worldwide Auto Leasing — website

Static site, hosted on GitHub Pages at **https://worldwideautoleasing.com** (custom domain via `CNAME`).

## Edit → build → publish

```
# edit src/pages/*.html, src/partials/*.html, css/, js/
python3 tools/build.py        # regenerates the root *.html, sitemap.xml, robots.txt
git add -A && git commit -m "…" && git push
```

GitHub Pages serves the root of `main`. The built `*.html` files are committed on purpose so Pages needs no build step.

- **Business details** (phone, email, hours, address, tagline): `tools/build.py` → `SITE`, then rebuild. Also `js/config.js` for the phone shown in error toasts.
- **No inventory by design.** Vehicles = brands and body styles we lease; Specials = a request form for the current month's programs.
- **Forms**: both forms POST JSON to `WWAL.FORM_ENDPOINT` in `js/config.js` (FormSubmit AJAX by default; the first submission sends the inbox an activation email). Swap for your own handler any time. Every submission with SMS consent carries the exact consent text, timestamp, page and user agent (10DLC proof of consent).
- **Credit app**: set `WWAL.CREDIT_APP_URL` in `js/config.js` to the xDesk application URL and the page embeds it automatically.
- **Reviews**: `src/pages/reviews.html` and the teaser on `index.html` contain labelled sample reviews. Replace with real Google reviews before launch.

## 10DLC compliance checklist (campaign registration)

- Opt-in checkbox on every form: unchecked by default, brand name, message types, "Message frequency varies", "Msg & data rates may apply", STOP/HELP, "Consent is not a condition of purchase", links to Privacy Policy and SMS Terms. ✔
- Privacy policy states mobile information is not shared with third parties/affiliates for marketing. ✔ (`privacy.html`)
- Public SMS Terms page with program name, frequency, cost, opt-out, help, carriers. ✔ (`sms-terms.html`)
- Proof of consent captured per submission. ✔ (`js/main.js`)
- For the campaign form: use `https://worldwideautoleasing.com/custom-quote.html` as the opt-in URL and screenshot the consent box; privacy URL `…/privacy.html`; terms URL `…/sms-terms.html`.
