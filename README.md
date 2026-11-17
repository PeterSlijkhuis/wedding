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

Log in with the admin password (`change-me` locally). In `/admin/` you can:

- set names, date, RSVP deadline, a greeting per language (the landing page shows all of them), theme (Classic, Modern, Garden) and meal options
- set the guest password you share with your guests
- write the home page welcome message and the text pages (Our story, Schedule, Travel, FAQ, Gifts) per language; a page with no text stays hidden
- upload photos (resized on your device, stored in free Cloudflare KV, visible only to people with the guest password)
- add guest groups (one invitation per group) and see who replied

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
