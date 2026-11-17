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

Log in with the admin password, open `/admin/` and set the guest password.

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
