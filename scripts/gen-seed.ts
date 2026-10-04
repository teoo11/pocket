/**
 * Writes supabase/seed.sql: the prototype's example people and jobs (src/js/04-example-data.js),
 * so a new Pocket doesn't look empty. Re-runnable: it removes the previous example data first, and
 * dates are relative to the day it runs. Example people have no password and cannot log in;
 * supabase/cleanup_examples.sql removes all of it before launch.
 *
 *   npx tsx scripts/gen-seed.ts && npm run db:seed:examples
 */
import { writeFileSync } from "node:fs"

import { PLACES } from "../src/features/maps/places"

const HOME: [number, number] = [44.4598, 26.1047] // Floreasca

function offset(base: [number, number], meters: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [base[0] + (-Math.sin(a) * meters) / 111320, base[1] + (Math.cos(a) * meters) / (111320 * Math.cos((base[0] * Math.PI) / 180))]
}
const place = (name: string): [number, number] => {
  const p = PLACES.find((x) => x.name === name)
  if (!p) throw new Error(`unknown place ${name}`)
  return [p.lat, p.lng]
}

const uuid = (n: number) => `00000000-0000-4000-a000-${String(n).padStart(12, "0")}`
const q = (s: string) => `'${s.replace(/'/g, "''")}'`
const pt = ([lat, lng]: [number, number]) => `private.make_point(${lat.toFixed(6)}, ${lng.toFixed(6)})`

type Person = {
  key: string
  name: string
  home: [number, number]
  bio?: string
  skills?: string[]
  schedule?: Record<number, [number, number]>
}

const people: Person[] = [
  {
    key: "alex",
    name: "Alex M.",
    home: offset(HOME, 0, 0),
    bio: "I like dogs, I’m good with phones and I can help with maths homework.",
    schedule: { 0: [600, 1140], 1: [960, 1140], 2: [960, 1140], 3: [960, 1140], 4: [960, 1140], 5: [960, 1200], 6: [600, 1140] },
  },
  { key: "maria", name: "Maria P.", home: offset(HOME, 250, -160), skills: ["tutoring", "plants", "creative"] },
  { key: "ioana", name: "Ioana D.", home: offset(HOME, 380, 40), bio: "Student, love animals and plants." },
  { key: "matei", name: "Matei R.", home: offset(HOME, 520, -120), bio: "Freelance designer, home most afternoons." },
  { key: "elena", name: "Elena V.", home: place("Tei"), bio: "Retired teacher. Happy to help with lessons." },
  { key: "radu", name: "Radu I.", home: place("Floreasca") },
  { key: "victor", name: "Victor S.", home: place("Tei") },
  { key: "ana", name: "Ana G.", home: place("Floreasca") },
  { key: "doru", name: "Doru T.", home: place("Herăstrău") },
  { key: "sorin", name: "Sorin B.", home: place("Voluntari"), bio: "Weekends free, have a car for bigger shopping runs." },
]
const idOf = (key: string) => uuid(people.findIndex((p) => p.key === key) + 1)

// Day expressions evaluated in SQL so dates stay relative to the day the seed runs.
const day = (n: number) => `(private.bucharest_today() + ${n})`
const nextDow = (w: number) => `(private.bucharest_today() + (((${w} - extract(dow from private.bucharest_today())::int + 7) % 7) + case when (${w} - extract(dow from private.bucharest_today())::int + 7) % 7 = 0 then 7 else 0 end))`

type OpenJob = [id: number, cat: string, title: string, desc: string, by: string, where: [number, number] | string, date: string, time: number, dur: number, pay: number, label?: string]
const open: OpenJob[] = [
  [1, "tech", "Help me set up my new phone", "Connect it to Wi-Fi, move my contacts over and show me the main settings. I’m patient, I promise.", "maria", [180, -40], day(1), 1080, 30, 30],
  [7, "other", "Fix a flat bike tyre", "Back tyre is flat. I have a new inner tube, I just need someone who knows how.", "ana", [260, 100], day(1), 1080, 30, 30, "Bike repair"],
  [2, "tutoring", "Maths help for a 6th grader", "Fractions and percentages before Monday’s test. Worksheets are ready.", "radu", [400, 150], nextDow(6), 660, 60, 50],
  [3, "carrying", "Carry boxes to the storage room", "Six medium boxes of books down to the basement. There’s a lift.", "victor", [350, 60], nextDow(4), 1050, 40, 40],
  [4, "plants", "Water my balcony plants", "About 12 pots on a ground-floor balcony while I’m away for the weekend.", "elena", [300, -120], nextDow(0), 600, 15, 15],
  [5, "tech", "Install video calls on my tablet", "Install a video call app and show me how to call my grandchildren.", "ana", [350, 20], nextDow(2), 1110, 30, 25],
  [8, "errands", "Bring shopping from the market", "Two bags from the Otopeni market to my flat on the 2nd floor. I’ll pay for the shopping in advance.", "doru", "Otopeni", nextDow(5), 1000, 45, 35],
  [9, "household", "Hang two curtain rails", "I have the rails, screws and a drill. I just can’t climb the ladder any more.", "radu", "Popești-Leordeni", nextDow(1), 1020, 60, 60],
  [6, "pet", "Walk two dogs in Herăstrău Park", "Two calm labradors, an hour around the park.", "doru", [1600, -155], nextDow(3), 1020, 60, 45],
]

// helper, category, title, poster, pay, days ago (negative), minutes, stars
const past: [string, string, string, string, number, number, number, number][] = [
  ["alex", "pet", "Dog walk", "maria", 25, -26, 35, 5], ["alex", "tutoring", "Maths revision", "radu", 35, -12, 70, 5],
  ["alex", "tech", "Phone setup", "elena", 20, -5, 40, 5], ["alex", "pet", "Dog walk", "doru", 20, -3, 30, 5],
  ["alex", "carrying", "Move boxes to the cellar", "victor", 30, -1, 55, 5], ["alex", "tech", "Set up a smart TV", "victor", 20, -48, 45, 5],
  ["alex", "pet", "Feed the cat for a weekend", "ana", 25, -70, 60, 4],
  ["elena", "tutoring", "English lesson", "radu", 40, -2, 90, 5], ["elena", "tutoring", "Homework help", "ana", 35, -6, 75, 5],
  ["elena", "creative", "Birthday poster", "maria", 30, -9, 80, 5], ["elena", "tutoring", "Maths lesson", "radu", 40, -14, 90, 5],
  ["elena", "tutoring", "Reading practice", "doru", 30, -21, 60, 5], ["elena", "plants", "Repot the balcony plants", "victor", 25, -40, 50, 4],
  ["ioana", "pet", "Dog walk", "doru", 20, -1, 40, 5], ["ioana", "plants", "Water plants", "elena", 15, -4, 20, 5],
  ["ioana", "errands", "Pharmacy run", "victor", 15, -7, 25, 5], ["ioana", "pet", "Cat sitting", "ana", 30, -10, 45, 4],
  ["ioana", "errands", "Groceries", "maria", 20, -16, 35, 5], ["ioana", "pet", "Dog walk", "doru", 20, -19, 40, 5],
  ["ioana", "household", "Tidy the storage room", "radu", 35, -35, 90, 5],
  ["matei", "carrying", "Carry a sofa upstairs", "victor", 60, -3, 50, 5], ["matei", "computer", "Fix a slow laptop", "ana", 40, -8, 120, 5],
  ["matei", "carrying", "Move boxes", "radu", 30, -25, 45, 5],
  ["sorin", "carrying", "Bring furniture from IKEA", "doru", 80, -2, 150, 5], ["sorin", "errands", "Big shopping run", "maria", 40, -11, 95, 4],
  ["sorin", "household", "Assemble a wardrobe", "victor", 70, -20, 140, 5],
]
const helperTags = (stars: number) => (stars === 5 ? "array['on_time','great_job']" : "array['friendly']")

const sql: string[] = []
sql.push(`-- GENERATED by scripts/gen-seed.ts. Example people and jobs from the prototype. Re-runnable.
begin;

-- Remove the previous example data (jobs first: their poster link would only be set to null).
delete from public.jobs where is_example;
delete from auth.users where raw_app_meta_data ->> 'is_example' = 'true';
`)

for (const [i, p] of people.entries()) {
  const id = uuid(i + 1)
  // Auth expects empty strings, not NULL, in its token columns (otherwise listing users fails).
  sql.push(`insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values (${q(id)}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${q(`${p.key}@example.pocket.invalid`)},
  '{"is_example": true}', ${q(JSON.stringify({ display_name: p.name }))}, now() - interval '120 days', now(), '', '', '', '', '', '', '', '');
update public.profile_private set home = ${pt(p.home)}, home_label = private.nearest_place(${pt(p.home)}) where user_id = ${q(id)};
update public.profiles set onboarded_at = now() - interval '120 days', area_label = private.nearest_place(${pt(p.home)}),
  bio = ${q(p.bio ?? "")}${p.skills ? `, skills = array[${p.skills.map(q).join(",")}]::public.job_category[]` : ""}${
    p.schedule ? `, schedule = ${q(JSON.stringify(p.schedule))}::jsonb` : ""
  } where id = ${q(id)};
`)
}
sql.push(`update public.profile_private set savings_goal_name = 'Wireless headphones', savings_goal_lei = 300 where user_id = ${q(idOf("alex"))};
`)

for (const [n, cat, title, desc, by, where, date, time, dur, pay, label] of open) {
  const exact = typeof where === "string" ? offset(place(where), 150, 40) : offset(HOME, where[0], where[1])
  const jobId = uuid(1000 + n)
  sql.push(`insert into public.jobs (id, poster_id, category, category_label, title, description, public_loc, area_label, starts_on, start_min, dur_min, starts_at, pay_lei, is_example, created_at)
values (${q(jobId)}, ${q(idOf(by))}, ${q(cat)}, ${label ? q(label) : "null"}, ${q(title)}, ${q(desc)}, private.fuzz(${pt(exact)}), private.nearest_place(${pt(exact)}),
  ${date}, ${time}, ${dur}, now(), ${pay}, true, now() - interval '${n * 3} hours');
insert into public.job_private (job_id, exact_loc, address) values (${q(jobId)}, ${pt(exact)}, 'Example street 12');
`)
}

for (const [i, [helper, cat, title, by, pay, ago, minutes, stars]] of past.entries()) {
  const h = people.find((p) => p.key === helper)!
  const exact = offset(h.home, 200 + i * 15, i * 37)
  const jobId = uuid(2000 + i)
  const when = `(now() + interval '${ago} days')`
  const first = Math.ceil(pay / 2)
  sql.push(`insert into public.jobs (id, poster_id, helper_id, category, title, public_loc, area_label, starts_on, start_min, dur_min, starts_at, pay_lei, status,
  started_at, finished_at, minutes, confirmed_at, half1_paid_at, paid_at, is_example, created_at)
values (${q(jobId)}, ${q(idOf(by))}, ${q(idOf(helper))}, ${q(cat)}, ${q(title)}, ${pt(exact)}, private.nearest_place(${pt(exact)}),
  ${day(ago)}, 1020, ${minutes}, now(), ${pay}, 'paid', ${when}, ${when}, ${minutes}, ${when}, ${when}, ${when}, true, ${when} - interval '2 days');
insert into public.job_private (job_id, exact_loc) values (${q(jobId)}, ${pt(exact)});
insert into public.payments (job_id, part, method, amount_bani, payer_id, payee_id, status, created_at, succeeded_at) values
  (${q(jobId)}, 1, 'cash', ${first * 100}, ${q(idOf(by))}, ${q(idOf(helper))}, 'succeeded', ${when}, ${when}),
  (${q(jobId)}, 2, 'cash', ${(pay - first) * 100}, ${q(idOf(by))}, ${q(idOf(helper))}, 'succeeded', ${when}, ${when});
insert into public.reviews (job_id, author_id, subject_id, subject_role, stars, tags, created_at) values
  (${q(jobId)}, ${q(idOf(by))}, ${q(idOf(helper))}, 'helper', ${stars}, ${helperTags(stars)}, ${when}),
  (${q(jobId)}, ${q(idOf(helper))}, ${q(idOf(by))}, 'poster', 5, array['paid_on_time'], ${when});
`)
}

sql.push(`
-- These inserts fired "job changed" broadcasts; nobody is listening to example jobs, so that's harmless.
select 'SEED OK' as result;
commit;
`)

writeFileSync("supabase/seed.sql", sql.join("\n"))
writeFileSync(
  "supabase/cleanup_examples.sql",
  `-- Removes every example person and job (run before launch: npx supabase db query --linked -f supabase/cleanup_examples.sql).
begin;
delete from public.jobs where is_example;
delete from auth.users where raw_app_meta_data ->> 'is_example' = 'true';
commit;
`,
)
console.log(`seed.sql: ${people.length} people, ${open.length} open jobs, ${past.length} finished jobs`)
