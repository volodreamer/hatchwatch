# Hatchwatch

A Tamagotchi Gen 1 care companion for the physical shell. Pick who you want to grow, log the hatch, and it watches hearts, discipline, and the 15-minute window so the device does not beat you.

**Live (GitHub Pages):** [volodreamer.github.io/hatchwatch](https://volodreamer.github.io/hatchwatch/)

Progress is stored in the browser (`hatchwatch-v1`). Grok Hatchwatch and GitHub Pages do not share it. Use **Save file** / **Open file** in Settings, or optional **Sign in with Google** for a hidden Drive copy. Phone paste boxes cut long backups. **Copy short** drops the care log so it can fit the old paste box.

## Language

English and Ukrainian. Defaults to the phone language until you pick one. Switch in **Settings** (cog) or on the start screen. Character names stay Latin (Mametchi, Bill…).

## How a run works

1. Pick the adult (Mametchi through Bill / Oyajitchi).
2. Say when it hatched — just now, clock just set (egg in ~5 min), or an exact time.
3. Log what you actually press on the shell: meal, snack, game, clean, scold, medicine, lights.
4. The LCD tracks hunger/happy hearts, discipline, weight, poop, and the mistake budget for your target.
5. When a call is open you get a ticking 15-minute window plus the button to press (e.g. Food → Meal).

Tap **Meal / Game right after the shell**. Heart timers restart from that tap. If Hatchwatch shows poop, a skull, or attention that the shell does not, use **Not on the shell** — do not fake a duck, shot, or scold.

## What it knows (original P1)

- Heart drain per character, minus 1 minute per year of age (floors 7 / 9 min)
- Sleep clocks (Marutchi 8pm, Tamatchi 9pm, Maskutchi 11pm–11am, …)
- Care mistakes vs discipline mistakes, and Tamatchi type 1/2 → each adult
- Secret path: never scold, good care, type-2 Maskutchi, wait ~4 days → Bill (EN) or Oyajitchi (JP)
- Poop and sickness do not beep on the real device — Hatchwatch still reminds you

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build:pages   # static build for GitHub Pages (base /hatchwatch/)
```

Pages deploys from `.github/workflows/pages.yml` on every push to `main`. Repo → Settings → Pages → **GitHub Actions**.

## Google backup (optional)

Works on GitHub Pages with no server. The pet stays in the browser; Google holds a second copy in Drive **app data** (not your normal Drive files). After you sign in, Hatchwatch keeps that copy in step while the tab is open. Save / Load are still there if Google has a different run.

1. [Google Cloud Console](https://console.cloud.google.com/) → new project (e.g. Hatchwatch).
2. Enable **Google Drive API**.
3. **OAuth consent screen**: External, Testing. Add your Gmail as a test user.
4. **Credentials** → Create credentials → OAuth client ID → Web application.
5. Authorized JavaScript origins:
   - `https://volodreamer.github.io`
   - `http://localhost:8080` (local preview only)
6. Copy the client ID.
7. GitHub repo → Settings → Secrets and variables → Actions → Variables → `GOOGLE_CLIENT_ID` = that value.
8. Re-run the Pages workflow.

Until that variable is set, Settings still has file backup; the Google button stays off.

Scopes requested: `drive.appdata` and email. Not full Drive.

Privacy policy (for the Google consent screen): [volodreamer.github.io/hatchwatch/privacy.html](https://volodreamer.github.io/hatchwatch/privacy.html)

For your own Gmail, keep the app in **Testing** and add that address as a test user. Publishing to Production with Drive app data also needs Google’s verification.

## Native Android

Paused. Use the website for now.

