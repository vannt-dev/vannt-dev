# Proof of origin and copy watch: design

Date: 2026-10-14. Status: design approved in chat; this spec waits for review.

## Goal

- **A, recognition:** anyone using an official build can see that it comes from vannt-dev.
- **B, origin:** anyone can tell an official build from a copy, and vannt-dev learns when a public
  copy of a repository appears.

## Non-goals

- Knowing who downloads a source ZIP. GitHub does not expose it: Insights → Traffic gives 14-day
  totals of views, clones and referrers, with no names and no separate count of source ZIPs.
- Seeing private or offline use of the code. Nothing can, short of code that reports home, and
  that is ruled out below.
- Restricting what people do with the code. MIT allows any use as long as the copyright notice
  is kept; the licence stays.
- Telemetry, phone-home code, obfuscation, hidden watermarks, signed tags, licence changes.

## Constraints

- MIT stays on every repository.
- No remote code and no obfuscation in anything shipped to a store. The Chrome Web Store rejected
  Universal File Converter 1.1.3 for remote code, and obfuscation is against the same policy.
- Nothing published describes how the private cores of NimbleClip and aegis-net work.
- One list of official channels: `stats/sources.json` in this repository, already read by
  `scripts/download-stats.mjs`. New keys are safe: that script reads only `npm`, `pypi`,
  `githubReleases` and `chromeWebStore`.

## Phase 1: official channels and proof of origin (B)

### 1.1 `stats/sources.json` gains two keys

- `signingCertificates`: one entry per Android app, `{ "repo": "vannt-dev/nimbleclip",
  "sha256": "AB:CD:..." }`, and the same for `vannt-dev/aegis-net`. The fingerprint is read
  from the APK attached to the latest release (`apksigner verify --print-certs`, or
  `keytool -printcert -jarfile`). A repacked APK cannot carry this certificate, so the
  fingerprint is the proof of origin for the apps; no workflow changes there.
- `otherListings`: store pages that are not on the Chrome Web Store (Edge Add-ons, Google Play),
  as `{ "name", "store", "url" }`. Filled only with listings the user confirms exist.

### 1.2 Official channels page on the personal site

- New page `official.html` in `vannt-dev.github.io`, in the same style as `index.html`, in
  English like the rest of the site.
- At load it fetches
  `https://raw.githubusercontent.com/vannt-dev/vannt-dev/main/stats/sources.json` and lists:
  - npm packages, linked, with "check with `npm audit signatures`" (they carry npm provenance:
    checked 14/10 on openapi-drift 0.2.0 and repokeeper 0.9.0);
  - PyPI packages, linked;
  - GitHub releases, linked, with "check a ZIP with
    `gh attestation verify <file> --owner vannt-dev`" for the four extensions;
  - Chrome Web Store listings, linked by ID, and `otherListings`;
  - APK signing certificate fingerprints.
- It says plainly: anything not listed here is not published by vannt-dev.
- If the fetch fails, the page shows a link to `stats/sources.json` on GitHub instead of an
  empty list.
- Linked from the footer of `index.html`, the profile README, and one line near the top of the
  README of the four extensions, NimbleClip and Aegis Net.

### 1.3 Build attestations for the four extensions

| Repository | Default branch | Release file(s) |
| --- | --- | --- |
| browser-extension | main | `dist/zips/*.zip` |
| network-overrides-devtools | develop | `release/*.zip` |
| region-snap | main | `release/*.zip` (built in one job, released in another) |
| convert-md-to-pdf | main | `dist/extension-*.zip` |

- In the job that holds the final ZIP, before it is uploaded to the release: add
  `id-token: write` and `attestations: write` to the job's permissions and an
  `actions/attest-build-provenance` step with `subject-path` set to the ZIP(s). The action is
  pinned the way each workflow already pins its other actions.
- The release body gains the verify command.
- convert-md-to-pdf lists `release.yml` under `owned` in `.repokeeper.yml`, so the edit does not
  show as drift. The other three have no repokeeper config.
- No release is cut just for this. The step is proven once on a branch in region-snap with a
  manual run; the other three are confirmed by `gh attestation verify` on their next release.

## Phase 2: copy watch

- `scripts/copy-watch.mjs`: Node 22, no dependencies, same style as `download-stats.mjs`.
- `.github/workflows/copy-watch.yml`: weekly on Monday, plus `workflow_dispatch`; permissions
  `contents: write` and `issues: write`.
- GitHub code searches, each with `-user:vannt-dev`:
  1. `"github.com/vannt-dev"`: package.json `repository`, manifest `homepage_url`, README links;
  2. `"vannt-dev" filename:LICENSE`;
  3. each Chrome Web Store ID from `sources.json`.

  The Phase 3 headers carry `github.com/vannt-dev/<repo>`, so query 1 also finds them.
- Code search allows 10 requests a minute: requests are spaced, at most 100 results per query.
- Hits are grouped by repository. A hit is new when its repository is in neither
  - `copy-watch/known.json`: kept by hand, `{ "repo", "reason" }`, seeded with
    `szabgab/pydigger-data` ("PyPI metadata index", found 14/10); nor
  - `copy-watch/seen.json`: kept by the workflow, repository and first-seen date.
- New hits open one issue, labelled `copy-watch`, titled
  `Copy watch: N new repositories (YYYY-MM-DD)`, listing each repository, the matching query and
  up to five paths with links. Then `seen.json` is committed the way the stats are.
- `--dry-run` prints the issue instead of opening it and writes nothing.
- Token: first run with `GITHUB_TOKEN`. If code search refuses it, the user creates a fine-grained
  token with read-only access to public repositories, stored as the secret `COPY_WATCH_TOKEN`.
- Limits, stated in the script header:
  - public GitHub only;
  - code search covers default branches, skips large files and most forks (forks show under each
    repository's Insights → Forks);
  - the Chrome Web Store has no search API: copies there are found by searching the extension
    names by hand;
  - npm is left out: its text search is fuzzy ("vannt-dev" returns webpack and babel packages).

## Phase 3: per-file headers, pilot on the four extensions (A)

- Each first-party JS, TS and CSS source file starts with
  `/*! SPDX-License-Identifier: MIT | Copyright (c) <year> <holder> | github.com/vannt-dev/<repo> */`,
  with year and holder copied from the repository's LICENSE ("2026 Van Nguyen" in three of them,
  "2026 vannt-dev" in region-snap, "2025 Van Nguyen" in network-overrides-devtools).
- Left out: generated files, vendored code, build output, config files, tests.
- `/*!` marks a legal comment that minifiers keep. Each bundler is checked and, where needed, set
  to keep legal comments (esbuild `legalComments`, terser `format.comments`):
  - browser-extension: `vite build`;
  - network-overrides-devtools: `tsc` and `scripts/bundle.mjs`;
  - region-snap: `scripts/build.mjs`;
  - convert-md-to-pdf: `scripts/build-extension.js`.
- A comment is not obfuscation: the store ZIP stays readable.
- The headers ship with each extension's next normal release; Store uploads stay the user's.
- No enforcement during the pilot: a one-off script adds the headers. After the pilot, a separate
  decision on a repokeeper `license-headers` module, with its own spec and repokeeper release.
- Not applied to demo repositories, kafka-demo, web-workers-react-example, the profile or the
  personal site.

## Order and how changes land

Phase 1, then 2, then 3. Repository changes go by pull request (network-overrides-devtools into
`develop`). The profile repository and the personal site take direct commits on `main`, as they
already do.

## Testing

- **1.2:** open the page locally and live, at desktop and phone width; block
  `raw.githubusercontent.com` and check the fallback link.
- **1.3:** the region-snap branch run, then `gh attestation verify` on its ZIP passes; a file
  changed by one byte fails.
- **2:** `node scripts/copy-watch.mjs --dry-run` locally finds `szabgab/pydigger-data`, filters
  it out through `known.json` and reports no new repositories; then one manual workflow run.
- **3:** build each store ZIP, unzip it and find the header in every shipped JS and CSS file;
  load the unpacked build in Chrome and check the extension still works.

## Open items for the user

- Edge Add-ons and Google Play listing URLs, if there are any.
- A fine-grained token, only if `GITHUB_TOKEN` cannot run code search.
