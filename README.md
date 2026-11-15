# Camila's Quest

A daily, self-paced learning program for one student: adaptive math (counting → fractions), reading words out loud,
a new original story every day that teaches a real business concept, speech practice, typing, music breaks, and prizes
earned by finishing whole days. Everything runs in one file (`index.html`) with no sign-in; progress is saved in the browser.

- `src/` — the source, concatenated by `python3 build.py <version>` into `index.html`
- `test/smoke.js` — headless run through a whole day (`node test/smoke.js mic` or `nomic`)
- `test/smart.js` — answers correctly for six days and checks levels climb
- `test/camila.js` — plays 7 days from Camila's real v1.7 save with a realistic learner model; prints levels per day and repeats
- `test/gen.js` — generates 300 questions per math level and checks every one (answer present, no NaN, no duplicate options)

The microphone (Web Speech API) needs the page served over https, which is why it is hosted on GitHub Pages.

## Education team connection (v1.7)

- **Out:** the Day complete screen has a "Send to Dad" button. It opens Mail to bahmedov82@gmail.com with the
  readable report and one `CQDATA {json}` line. The team's Coach reads those emails from Gmail every evening and logs
  them in the `camila-education` D1 database (table `quest_days`). The Grown-ups → Report "Email to Dad" button sends the same thing.
- **In:** `plan.json` next to `index.html`: `{"id": "...", "note": "...", "until": "YYYY-MM-DD", "levels": {"add": 3, "story": 2}}`.
  The note shows on her home screen until `until`. `levels` are applied once per `id` (a new id is needed to apply again);
  keys are the math skills (`numbers, add, sub, mul, money, frac, pre`) plus `words, speech, typing, story`. Only Dad approves plan changes.

## v1.8 progression

- **Level Finder:** the first Math Quest after the update binary-searches every island (about 30 questions, two right in a row
  to move up) and places her there. Grown-ups → Settings can run it again.
- **Weekly Check moves levels up** (never down) to what she showed: math probes, check words, reading speed and comprehension.
- **Test out:** first 3 answers right at a new level = mastered. **Step down:** 1 or fewer right out of the last 4 drops one level.
- **No repeats:** the last 150 math questions are not reused; words, Echo Stage lines and typing avoid the last 3-4 days.
- **Reviews and Brain Sparks** use the top levels she owns, not the bottom ones.
- **Mic fairness:** names and 3-letter words the recognizer mishears no longer count as her reading mistakes.
- **New content:** Big Leagues Island (grade 5-7: decimals, percent, sale price, unit price, ratios, negative numbers,
  solve for x, markup), 4 new Times levels, 3 new Fraction levels, wider Muffin Money, 2 school-vocabulary Word Work levels,
  4 grade 6-7 stories (wholesale, markup and margin, opportunity cost, negotiation), a "Pitch it like a boss" speech level,
  and 3 new typing levels (story lines, school words, capitals and commas).
