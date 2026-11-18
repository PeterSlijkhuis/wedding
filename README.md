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
- Design: pick one of 27 templates (filter by mood: elegant, bold, charming, earthy, expressive), then change any of its parts in folding sections: colors (21 palettes, plus your own accent, second and background color with a readability warning), fonts (12 pairings) and text size, layout (centered, framed, split, bold banner) with button style and corners, decoration (eucalyptus, roses, wildflowers, olive, laurel, lemons, palm leaves, pampas grass, moon and stars, sun, art deco, arch, confetti) with its size and a background texture (paper, linen, dots, glow), and motion (still, gentle, lively). Also a cover photo and its shape
- Website: the home page message and the text pages (Our story, Schedule, Travel, FAQ, Gifts) per language; a page with no text stays hidden
- Photos: a private library for the couple. Drag photos in; they are resized to 2000px on your device, which also strips location data, and stored in free Cloudflare KV. Guests see only the photos you place on the site (the cover and page photos), and only after the guest password. Pick a focus point per photo so cropping never cuts off faces
- Guest list and RSVP: a searchable table of every guest with an edit dialog per guest (name, email, RSVP, meal, dietary needs, add someone to the group), filters by answer, save the date, invitation and thank-you emails through Resend in your site's colors, with sent, opened and clicked status per guest, a sign-up link in the save the date so guests add themselves (and who comes with them) to the list, CSV import and export (works with Excel, also in Dutch and Spanish), and an RSVP overview with meal counts
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

## Test site and live site, published from the admin

Once this is set up, nobody needs a terminal. Each change to the `development` branch goes to a test site (`wedding-test`, with its own guests and photos). Publish in the admin of the test site sends everything to the live site (`wedding`) that your guests use.

One-time setup, all in the browser:

1. Cloudflare: My Profile, API Tokens, Create Token, use the "Edit Cloudflare Workers" template and add the permission Account, D1, Edit. Copy the token. Also copy your Account ID (Workers & Pages, right-hand column).
2. GitHub: open your copy of this repository, Settings, Secrets and variables, Actions, and add three repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `ADMIN_PASSWORD`, which is the admin password for the test site.
3. GitHub, Actions tab: open the deploy workflow and choose Run workflow on `development`. The test site appears at `https://wedding-test.<your-subdomain>.workers.dev`.
4. In the test site's admin, open Publish, choose Make a token on GitHub, and create a fine-grained token for this repository only, with Contents read and write and Actions read. Paste it with the repository name and press Connect.

From then on, the Publish page lists the changes waiting to go live and has one button to publish them. Each site's deploy also updates its database. The live site keeps its own guests, photos and texts; publishing moves only the website itself.

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

5. Put the site on your domain: in the Cloudflare dashboard, open Workers & Pages, then wedding, Settings, Domains & Routes, Add, Custom domain. Then fill in Website address under Event details, so emails link there and not to workers.dev.
6. Keep emails out of spam: add a DMARC record in Cloudflare DNS (type TXT, name `_dmarc.<your domain>`, content `v=DMARC1; p=none;`), send from the same domain the links point to, write a real message rather than only a button, and send yourself a test first. Brand-new domains often land in spam for the first few sends; ask the first guests to mark it "not spam".

Then open Guest list, choose Send emails, pick Save the date, Invitation or Thank you, send yourself a test, and send. Turn on the sign-up link in Guest list first if the save the date should let guests add themselves; renew the link if it spreads too far (at most 30 sign-ups an hour). Each send covers at most 100 guests; send the rest the next day.

## Tests

```bash
npm test
```

## License

MIT

## Design system

Everything visual lives in `public/js/designs.js`: palettes, font pairings, layouts, decorations and the templates that combine them. Add a palette or template there and it shows up in the admin. Decorations are drawn as page corners and an ornament in three tones of the palette. `npm test` checks every palette for readable contrast (WCAG AA). Fonts are served from `public/fonts/` (SIL Open Font License), so guests never contact a font service, and all of them include Cyrillic for Macedonian. Motion plays once per page per visit, never on scroll or in a loop, and is off for anyone whose device asks for reduced motion. To add flowers, stars or other decorations, see [docs/design-elements.md](docs/design-elements.md).

