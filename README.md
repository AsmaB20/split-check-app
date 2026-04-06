# 🧾 SplitCheck

> Split restaurant bills without the drama. Handles taxes, fees, and discounts — shows everyone exactly what they owe.

**No login. No database. No server-side data. Everything lives in the browser.**

---

## Features

- Add multiple people with individual items and quantities
- Apply taxes / fees and discounts (by % or flat amount)
- Proportional or equal splitting for adjustments
- Bill verification — paste your actual total to check for mistakes
- Multi-currency support
- State auto-saved in `localStorage` — refreshing won't lose your work
- Copy results to clipboard to share via WhatsApp / iMessage

---

## Project Structure

```
splitcheck/
├── public/
│   └── index.html     ← entire app (HTML + CSS + JS)
├── server.js          ← minimal Express server
├── vercel.json        ← Vercel deployment config
├── package.json
└── .gitignore
```

---

## Tech Stack

- **Frontend**: Vanilla HTML / CSS / JS (zero frameworks, zero build step)
- **Backend**: Node.js + Express (just serves static files)
- **Storage**: Browser `localStorage` (no accounts, no data sent anywhere)
- **Fonts**: Google Fonts (Playfair Display, DM Mono, DM Sans)

---
