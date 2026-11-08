# Camila's Quest

A daily, self-paced learning program for one student: adaptive math (counting → fractions), reading words out loud,
a new original story every day that teaches a real business concept, speech practice, typing, music breaks, and prizes
earned by finishing whole days. Everything runs in one file (`index.html`) with no sign-in; progress is saved in the browser.

- `src/` — the source, concatenated by `python3 build.py <version>` into `index.html`
- `test/smoke.js` — headless run through a whole day (`node test/smoke.js mic` or `nomic`)
- `test/smart.js` — answers correctly for six days and checks levels climb

The microphone (Web Speech API) needs the page served over https, which is why it is hosted on GitHub Pages.
