# PCA Baseball Stats Explorer

PCA Baseball Stats Explorer is a standalone static web app for a classroom software engineering demo. It uses manually entered public baseball stats to show how software can sort data, compare players, calculate new outcomes, and turn raw numbers into understandable summaries.

## Project Overview

This repo is intentionally simple:

- Plain HTML
- Plain CSS
- Vanilla JavaScript
- Local JSON data only
- No framework
- No build step
- No backend

Main features:

- Team summary cards
- Sortable player table
- Click-to-open player detail panel
- Two-player comparison view
- What-if batting average calculator
- Coach Mode leaderboard using Impact Score

## File Structure

- `index.html` - page structure and built-in fallback JSON for opening the app directly from disk
- `styles.css` - dark sports-style responsive design
- `app.js` - modular vanilla JavaScript for loading data, rendering views, sorting, comparing, and calculating stats
- `data/players.json` - starter player dataset
- `.github/workflows/deploy-pages.yml` - GitHub Pages deployment workflow
- `CNAME` - custom domain target for GitHub Pages

## Local Run Instructions

Option 1: Open the file directly

1. Open `index.html` in a browser.
2. The app will still work because `index.html` contains a fallback copy of the same player data.

Option 2: Serve the folder statically

1. Open a terminal in the repo.
2. Run one of these:

```powershell
python -m http.server 8000
```

or

```powershell
py -m http.server 8000
```

3. Visit `http://localhost:8000`.

Serving the folder is the best option when you want the browser to load `data/players.json` directly.

## Updating The Player Data Later

The main dataset lives in `data/players.json`.

If you will deploy or serve the site normally, updating `data/players.json` is enough.

If you also want double-clicking `index.html` to keep working without a server, update the fallback JSON inside `index.html` too. Look for:

```html
<script id="players-fallback" type="application/json">
```

That fallback exists only so the demo works from `file://` as well as GitHub Pages.

## Impact Score

Coach Mode uses this explainable formula:

```text
Impact Score = (hits * 3) + (rbi * 2) + (sb * 2) + (bb * 1) - (k * 1)
```

Missing values are treated as `0` for this metric. This makes it easy to explain how software can combine several stats into one ranking.

## What-If Calculator

The what-if batting average calculator lets you:

- choose a player
- enter future at-bats
- enter future hits
- instantly see projected total at-bats, projected total hits, and projected batting average

This is a good live demo feature because students can suggest numbers and immediately see the result change.

## GitHub Pages Deployment

This repo includes `.github/workflows/deploy-pages.yml` using the current GitHub Pages deployment actions.

How deployment works:

1. Push this repo to GitHub.
2. The workflow runs on pushes to `main`.
3. GitHub uploads the repo contents as a Pages artifact.
4. GitHub deploys the static site.

### Enable GitHub Pages In The Repo

1. Open the GitHub repository.
2. Go to `Settings`.
3. Open `Pages`.
4. Under `Build and deployment`, choose `GitHub Actions`.
5. Push to `main` if you have not already.
6. Wait for the Pages workflow to finish.

## Custom Domain Setup

This repo includes a `CNAME` file with:

```text
pca-baseball.continuumforge.com
```

You still need to configure the custom domain in GitHub Pages settings.

### GitHub Settings Steps

1. Open the repo on GitHub.
2. Go to `Settings` > `Pages`.
3. Confirm the site is deploying from `GitHub Actions`.
4. In the custom domain field, enter `pca-baseball.continuumforge.com`.
5. Save the setting.
6. Once DNS is ready, enable `Enforce HTTPS`.

### DNS Steps

At your DNS provider for `continuumforge.com`, create:

- Type: `CNAME`
- Host/Name: `pca-baseball`
- Target/Value: your GitHub Pages host, usually `<github-user-or-org>.github.io`

Example:

```text
pca-baseball CNAME your-github-account.github.io
```

If this is under a GitHub organization, use the organization Pages hostname instead.

After DNS changes, allow time for propagation and then verify the custom domain inside GitHub Pages settings.

## Classroom/Data Note

This project uses manually entered public stats for classroom and demo use. It is designed to be understandable for a 45-minute middle school STEM talk about software engineering.
