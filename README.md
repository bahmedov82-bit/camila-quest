# Camila's Quest

A daily, self-paced learning program for one student: adaptive math (counting → fractions), reading words out loud,
a new original story every day that teaches a real business concept, speech practice, typing, music breaks, and prizes
earned by finishing whole days. Everything runs in one file (`index.html`) with no sign-in; progress is saved in the browser.

- `src/` — the source, concatenated by `python3 build.py <version>` into `index.html`
- `test/smoke.js` — headless run through a whole day (`node test/smoke.js mic` or `nomic`)
- `test/smart.js` — answers correctly for six days and checks levels climb

The microphone (Web Speech API) needs the page served over https, which is why it is hosted on GitHub Pages.

## Education team connection (v1.7)

- **Out:** the Day complete screen has a "Send to Dad" button. It opens Mail to bahmedov82@gmail.com with the
  readable report and one `CQDATA {json}` line. The team's Coach reads those emails from Gmail every evening and logs
  them in the `camila-education` D1 database (table `quest_days`). The Grown-ups → Report "Email to Dad" button sends the same thing.
- **In:** `plan.json` next to `index.html`: `{"id": "...", "note": "...", "until": "YYYY-MM-DD", "levels": {"add": 3, "story": 2}}`.
  The note shows on her home screen until `until`. `levels` are applied once per `id` (a new id is needed to apply again);
  keys are the math skills (`numbers, add, sub, mul, money, frac`) plus `words, speech, typing, story`. Only Dad approves plan changes.
