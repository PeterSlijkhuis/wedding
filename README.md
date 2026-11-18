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
- Design: pick one of 23 templates (filter by mood: elegant, bold, charming, earthy, expressive), then change any of its parts: colors (17 palettes), fonts (12 pairings), layout (centered, framed, split, bold banner), decoration (flowers, olive branch, stars, sun and more) and motion (still, gentle, lively). Also an accent color, a cover photo and its shape
- Website: the home page message and the text pages (Our story, Schedule, Travel, FAQ, Gifts) per language; a page with no text stays hidden
- Photos: a private library for the couple. Drag photos in; they are resized to 2000px on your device, which also strips location data, and stored in free Cloudflare KV. Guests see only the photos you place on the site (the cover and page photos), and only after the guest password. Pick a focus point per photo so cropping never cuts off faces
- Guest list and RSVP: a searchable table of every guest with an edit dialog per guest (name, email, RSVP, meal, dietary needs, add someone to the group), filters by answer, invitation emails through Resend with sent, opened and clicked status, CSV import and export (works with Excel, also in Dutch and Spanish), and an RSVP overview with meal counts
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

## Invitation emails (optional)

Invitations go out through [Resend](https://resend.com). The free plan sends 100 emails a day and 3,000 a month. Resend only sends to guests from a domain you own, so you need a domain first (for example one bought on Cloudflare).

1. Create a free Resend account. Under Domains, add your domain and follow the DNS steps. On Cloudflare, Resend can add the records for you.
2. On that domain in Resend, turn on open tracking and click tracking.
3. Under API Keys, create a key with sending access, then run:
   ```bash
   npx wrangler secret put RESEND_API_KEY
   ```
4. To see delivered, opened and clicked in the guest list: under Webhooks, add `https://<your site>/api/resend/webhook` with the events sent, delivered, opened, clicked, bounced and complained. Copy its signing secret, then run:
   ```bash
   npx wrangler secret put RESEND_WEBHOOK_SECRET
   ```

Then open Guest list, choose Send invitations, send yourself a test, and send. Each send covers at most 100 guests; send the rest the next day.

## Tests

```bash
npm test
```

## License

MIT

## Design system

Everything visual lives in `public/js/designs.js`: palettes, font pairings, layouts, decorations and the templates that combine them. Add a palette or template there and it shows up in the admin. `npm test` checks every palette for readable contrast (WCAG AA). Fonts are served from `public/fonts/` (SIL Open Font License), so guests never contact a font service, and all of them include Cyrillic for Macedonian. Motion plays once per page per visit, never on scroll or in a loop, and is off for anyone whose device asks for reduced motion. To add flowers, stars or other decorations, see [docs/design-elements.md](docs/design-elements.md).

