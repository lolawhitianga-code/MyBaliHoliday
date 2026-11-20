# Working in this repo

- My Bali Holiday web site. Plain HTML, CSS and JavaScript - no build step. Live at https://mybaliholiday.kiwi/
- Rule from Lola (20 Nov 2026): merge everything to `main` automatically, every time. Commit on the session
  branch, then merge to `main` and push - no waiting for Lola.
- **Pushing to `main` puts it live.** `.github/workflows/deploy.yml` uploads the repo to `public_html` by FTP
  within about a minute. Check the Actions tab goes green after each push.
- **Never add a `Casino/` or `xmas/` folder here.** Those belong to the LuckyLolaCasino and FamilyXmas repos,
  which upload into `public_html/Casino` and `public_html/xmas`. Two repos writing the same files undo each other.
- `sw.js` caches the site for offline use. Bump its cache version whenever a file changes, or phones keep the old copy.
- Replies to Lola: point form, plain English, NZ based, metric. What changed, that it is live, steps for her.
