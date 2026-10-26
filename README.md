# Vishal Dwivedy — portfolio

Plain HTML, CSS and JavaScript in the 169Pi visual language (Inter, teal and pale-blue palette, hairline cards, light and dark theme, scroll reveals, a scroll-scrubbed process section). No build step and nothing to install.

## Run

    node server.mjs        # or: npm run dev

Open http://localhost:3000 (Node 18 or newer).

## Chatbot (Alpie)

1. Copy `.env.example` to `.env`, paste your key after `ALPIE_API_KEY=`.
2. Restart the server. The chat button appears at the bottom-right. With no key it stays hidden.
   The key lives only on the server (`api/chat.js`); never put it in front-end files or commit `.env`.
   The chatbot's knowledge is `api/_profile.js`.

## Deploy

Vercel: import the repo as an "Other" project (no build command). Add `ALPIE_API_KEY` (and optionally `ALPIE_MODEL`, `ALLOWED_ORIGIN`) as environment variables. Any other host works for the page itself; the chatbot needs the `/api/chat` function.

## Edit

Everything is in `index.html`; styles in `assets/css/site.css`; behaviour in `assets/js/site.js`. Logos are in `assets/img/logos/` and photos in `assets/img/`.
