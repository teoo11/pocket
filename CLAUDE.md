@AGENTS.md

# Pocket: guide for Claude Code

Pocket is a neighbourhood micro-job web app for **Bucharest and Ilfov (Romania)**: people post small paid jobs and people nearby offer to do them. This is the production rewrite of the prototype in `reference/pocket/` (git-ignored, unzipped from `../pocket.zip`). The prototype's `docs/SPEC.md` is still the product spec, except for the changes listed below. The full plan is in `C:\Users\vlad\.claude\plans\this-is-a-nice-gleaming-bengio.md`.

Stack: Next.js 16 (App Router, `src/proxy.ts`, React Compiler) · Tailwind v4 · shadcn/ui + Watermelon UI · Supabase (Postgres + PostGIS, Auth, Realtime, Storage) · Stripe Connect · Google Maps · next-intl (en, ro) · Vercel.

## Commands

```bash
npm run dev          # http://localhost:3000
npm run check        # typecheck + lint + unit tests: run after every change
npm run e2e          # Playwright (phone + desktop) on a production build at :3100, without a Maps key (E2E_MAPS=1 keeps it)
npm run i18n:check   # en.json and ro.json must have the same keys
npm run db:test      # SQL scenario tests (supabase/tests/) + pending migrations, in a rolled-back transaction
npm run db:push      # apply supabase/migrations to the linked project
npm run db:types     # regenerate src/lib/supabase/database.types.ts
npm run account:test # a confirmed account for trying the app by hand
```

## Code rules

1. **Feature modules:** `src/features/<name>/` holds `components/`, `actions.ts` (server actions), `queries.ts`, `schemas.ts` (zod) and pure logic files. Shared UI goes in `src/components/{ui,watermelon,shell}`.
2. **Reads** happen in Server Components. **Writes** are server actions: validate with zod, then call a Postgres RPC. Clients never write jobs, offers, payments or reviews directly.
3. **Business rules live in Postgres** (`SECURITY DEFINER` RPCs with `set search_path = ''`, an `auth.uid()` check, and execute revoked from `public`/`anon`). RLS is on for every table. Views use `security_invoker = true`.
4. **Auth checks** use `getClaims()` (`src/lib/supabase/auth.ts`), never `getSession()`.
5. **No sentences in the database:** store keys (categories, tags, reasons, notification types) and render them with next-intl. Every new string goes in **both** `messages/en.json` and `messages/ro.json`.
6. **Time zone:** "today", night jobs and leaderboard months are always Europe/Bucharest.
7. **Watermelon files** (`src/components/watermelon/`) keep their MIT notice header; see `THIRD_PARTY_NOTICES.md`.
8. **Sizes in rem**, so the Aa text-size setting scales them. Never hard-code px for text, buttons or inputs.
9. Add or update tests for new logic (Vitest next to the code, Playwright in `e2e/`, SQL scenarios in `supabase/tests/`).
10. **Maps** (`src/features/maps/`): wrap in `MapsProvider`, render `<Map>` only after hydration (`useHydrated`) and inside `MapBoundary`; never unmount a map because Google failed (hide it). The browser never gets a job's exact point unless it is the poster or the picked helper.
12. **Job search** lives in SQL (`public.search_jobs` / `search_job_counts`, both built on `private.search_base`, so chip counts always equal results). The URL state is `src/features/jobs/search-params.ts`; Home is the search (`/search` and `/map` redirect). Distances are from home, or from "Near me now" (`pocket-near` httpOnly cookie, ~100 m, 2 h; `src/features/jobs/origin.ts`), never from a URL.
13. **Profile** is `/me`: public part = the same `PublicProfileSummary` / `PublicProfileActivity` as `/profile/[id]` (your own id redirects to `/me`); private part = earnings, payouts, phone, home address, job suggestions, your data. Keep anything private out of the public components.
11. **Stripe** (`src/lib/stripe.ts`, `src/features/payments/`): card functions in SQL are `service_role` only; server actions check the user, then call them with the admin client. Never export a helper that takes an account or payment id from a `"use server"` file. Webhooks are idempotent (`stripe_events`). Without `STRIPE_SECRET_KEY` Pocket is cash only.

## Product rules that must not be broken

- **One account does both:** anyone can post jobs and help. There are no account types, no age questions and no parents. The `/minors` page (Romanian Labour Code) is linked from sign-up, job pages and posting. Night (22:00–06:00) and Carrying jobs show the stronger warning.
- **Always "earnings", never "money"** (RO: "câștiguri", never "bani"). Prices are in lei. Earnings, balance and the savings goal are **private to their owner**. There is **no withdraw button**.
- **Privacy:** the exact address and the phone number (which is optional) are shown only to the picked helper and the poster, after the pick. Public pins are moved 70–140 m, in SQL. Every distance shown is measured from the fuzzed point.
- **Pay comes in two halves:** the first when the helper taps "I'm starting now", the rest after the poster confirms the job is done. Each half is paid by Card (Stripe Connect, fee `STRIPE_FEE_PERCENT` deducted) or Cash. Helpers without a Stripe account can only receive cash, and the UI never says why.
- **Points:** `floor(minutes / 15) + 1` per completed job. **Levels:** `levelGap(n) = min(5n, 100)`.
- **Easy for older people:** 17px base text, buttons at least 54px tall, inputs 56px, everything scales with Aa (×1, ×1.15, ×1.3).
- **Look:** warm nude pastel palette (light and dark), Inter, thin line icons (lucide, stroke 1.5–1.7), **no emoji**. Job listings have **sharp corners**. Copy is plain and human.
- **Changed from the prototype SPEC (decided October 2026):**
  - live chat opens when a helper offers;
  - reviews go both ways, with text, and are double-blind (shown once both sides have reviewed, or after 7 days);
  - risky words are blocked at posting (there is no "being checked" state);
  - login is Google, Apple or email (the fake SMS code is gone);
  - no bots and no Demo button;
  - a helper's "New earnings" pop-up and the level-up pop-up show once each (seen markers in `profile_private`);
  - people can download their data and delete their account (Me → Your data); deletion is refused while a job is under way.
- **Legal texts** (`src/content/legal.ts`, `LEGAL` in `src/config/pocket.ts`) are drafts with placeholder company details until reviewed.
