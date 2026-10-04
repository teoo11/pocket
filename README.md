# Pocket

Small paid jobs, done by people nearby, in Bucharest and Ilfov. One account lets you ask for help and help others.

Next.js 16 · Tailwind v4 · shadcn/ui + Watermelon UI · Supabase · Stripe Connect · Google Maps · English and Romanian.

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev                  # http://localhost:3000
npm run check                # typecheck, lint, unit tests
npm run e2e                  # end-to-end tests (Playwright)
npm run db:test              # database scenario test (rolled back)
npm run account:test         # a confirmed account to try the app by hand (prints its password)
```

`SCREENS=<folder> npx playwright test lifecycle --project=desktop` also saves screenshots of the main story.

Rules for working on the code, and the product rules, are in `CLAUDE.md`. Third-party licences are in `THIRD_PARTY_NOTICES.md`.

## Deploying to Vercel

The app runs in Vercel's Dublin region (`vercel.json`), next to the Supabase database (eu-west-1).

1. Push this folder to a Git repository and import it in Vercel (it detects Next.js).
2. **Environment variables** (Production and Preview):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
   `NEXT_PUBLIC_SITE_URL` (e.g. `https://pocket.ro`), `NEXT_PUBLIC_AUTH_PROVIDERS` (`google,apple` once set up),
   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`,
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `STRIPE_FEE_PERCENT`.
   `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` stay on your computer (only the CLI uses them).
3. **Supabase → Authentication → URL configuration:** Site URL = your domain; add `https://<your-domain>/**` to the
   redirect URLs (or edit `supabase/config.toml` and run `npm run supabase:config`).
4. **Google Cloud → the Maps key → Website restrictions:** add `https://<your-domain>/*`.
5. **Stripe → Developers → Webhooks** (test mode first, then live):
   - `https://<your-domain>/api/stripe/webhook`, "Your account": `checkout.session.completed`,
     `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`,
     `charge.refunded` → secret in `STRIPE_WEBHOOK_SECRET`.
   - `https://<your-domain>/api/stripe/connect-webhook`, "Connected accounts": `account.updated`
     → secret in `STRIPE_CONNECT_WEBHOOK_SECRET`.
   - Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (and `--forward-connect-to` for the other).
6. **Before launch:** remove the example data (`npx supabase db query --linked -f supabase/cleanup_examples.sql`),
   fill in the company details in `src/config/pocket.ts` (`CONTACT`, `LEGAL`) and have the privacy notice and terms
   reviewed, set up an email provider (SMTP) in Supabase, and set `STRIPE_FEE_PERCENT`.
