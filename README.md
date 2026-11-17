# Wedding

A free, open-source wedding website you host yourself on Cloudflare's free plan. Guests log in with one shared password. You manage everything from an admin page. Available in English, Spanish, Dutch and Macedonian.

## Run it locally

Needs Node.js 22 or newer.

```bash
npm install
cp .dev.vars.example .dev.vars        # sets the local admin password
npm run db:migrate:local
npm run dev                           # open http://localhost:8787
```

Log in with the admin password (`change-me` locally). `/admin/` is a dashboard of tiles with a live preview of your site next to it, and a menu (top left) with every section:

- Event details: names, date, location, RSVP deadline, countdown, a greeting per language (guests see the one for the language they pick, or English) and meal options
- Design: pick a theme (Sage, Classic, Modern, Garden), an accent color and a cover photo
- Website: the home page message and the text pages (Our story, Schedule, Travel, FAQ, Gifts) per language; a page with no text stays hidden
- Photos: uploaded from your device (resized there, stored in free Cloudflare KV), visible only to people with the guest password
- Guest list and RSVP: add guest groups (one invitation per group) and see who replied
- Privacy: set the guest password you share with your guests

Edits show in the preview right away and are saved with the Save button (Cancel undoes them). The couple get an Admin link on the landing page and in the guest menu, so there is always a way back.

Anyone can see the landing page. Everything else needs the guest password. Guests find their invitation on the RSVP page by typing part of a name.

## Put it online

Needs a free Cloudflare account.

```bash
npx wrangler login
npx wrangler secret put ADMIN_PASSWORD   # choose a strong admin password
npm run deploy                           # creates the database on first deploy
npm run db:migrate
```

The site is then live at `https://wedding.<your-subdomain>.workers.dev`.

## Tests

```bash
npm test
```

## License

MIT
