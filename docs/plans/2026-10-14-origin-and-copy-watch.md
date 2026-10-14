# Proof of origin and copy watch: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** an official channels page, build attestations for the four extensions, a weekly copy
watch, and a header pilot, as the spec describes.

**Architecture:** `stats/sources.json` in the profile repository is the one list of official
channels. The personal site renders it at load; the copy watch reads it for its queries. The four
extension release workflows attest their ZIPs. Headers are added once by a script kept outside the
repositories.

**Tech Stack:** Node 22 (no dependencies, `node --test`), plain HTML/CSS/JS, GitHub Actions,
`actions/attest-build-provenance@v4` (latest v4.2.2 on 14/10), `apksigner` from Android build-tools 36.

**Spec:** `docs/specs/2026-10-14-origin-and-copy-watch-design.md` (this repository).

## Global Constraints

- MIT stays; no telemetry, phone-home, obfuscation or remote code in anything shipped.
- Nothing published describes how the private cores of NimbleClip and aegis-net work.
- Commit messages: Conventional Commits, no `Co-Authored-By` or other trailers, body lines under
  100 characters.
- PRs: one per repository and phase; network-overrides-devtools and aegis-net target `develop`,
  the rest `main`. PRs are opened, CI must be green, and the user merges.
- Profile repository and personal site: direct commits on `main`.
- Actions are pinned by major tag, like the other actions in each workflow.
- No release is cut for this work.

## Review Focus

1. A code search result owned by vannt-dev despite `-user:vannt-dev`: must be dropped, never reported.
2. Owner names differing only in case (`Szabgab/PyDigger-data`): treated as the same repository.
3. Code search refused for `GITHUB_TOKEN` (HTTP 403/422): the run fails with a message naming
   `COPY_WATCH_TOKEN`, and `seen.json` is left untouched.
4. Issue creation fails: `seen.json` is not written, so the same repositories are reported next week.
5. A value in `sources.json` containing `<`: shown as text on the page, never parsed as HTML.

---

## Phase 1

### Task 1: signing certificates in `stats/sources.json`

**Files:** Modify `stats/sources.json`.

- [ ] **Step 1:** In the scratchpad, download `nimbleclip-v1.13.2-android.apk` (vannt-dev/nimbleclip
  v1.13.2) and `app-release.apk` (vannt-dev/aegis-net v1.6.0) with `gh release download`.
- [ ] **Step 2:** For each, run
  `"$LOCALAPPDATA/Android/Sdk/build-tools/36.0.0/apksigner.bat" verify --print-certs <apk>` and read
  `Signer #1 certificate SHA-256 digest`. Format it as colon-separated upper-case pairs.
- [ ] **Step 3:** Add after `chromeWebStore`:

```json
  "signingCertificates": [
    { "repo": "vannt-dev/nimbleclip", "sha256": "<from step 2>" },
    { "repo": "vannt-dev/aegis-net", "sha256": "<from step 2>" }
  ],
  "otherListings": []
```

- [ ] **Step 4:** Check that the stats script still reads the file:
  `node -e "const s=require('./stats/sources.json');for(const k of ['npm','pypi','githubReleases','chromeWebStore','signingCertificates','otherListings'])if(!Array.isArray(s[k]))throw k"`.
  Expected: no output.
- [ ] **Step 5:** Merge the spec branch into `main`, commit `chore(stats): list app signing
  certificates`, push.

### Task 2: official channels page

**Files:** Create `vannt-dev.github.io/official.html`; modify `vannt-dev.github.io/index.html:223`
(footer); modify `vannt-dev/README.md` (one line near the links).

**Interfaces:** Consumes `stats/sources.json` from Task 1 at
`https://raw.githubusercontent.com/vannt-dev/vannt-dev/main/stats/sources.json`.

- [ ] **Step 1:** Write `official.html`: the `<head>` and CSS tokens of `index.html` (same fonts,
  colours, dark mode, `main` width, `h2` and `footer` styles), title "Official channels · Van
  Nguyen". Content:
  - eyebrow "Proof of origin", `h1` "Official channels", lede: "These are the only places
    vannt-dev publishes code and builds. A package, extension or app that is not listed here is
    not published by vannt-dev."
  - `<div id="channels" aria-live="polite">Loading the list…</div>`
  - a static section "How to check a download" with three commands in `<code>`:
    `npm audit signatures`, `gh attestation verify <file>.zip --owner vannt-dev`,
    `apksigner verify --print-certs <file>.apk` (compare with the fingerprint above).
  - footer as on `index.html` plus a link back to the home page.
- [ ] **Step 2:** The script renders with `document.createElement` and `textContent` only:

```js
const SOURCE = "https://raw.githubusercontent.com/vannt-dev/vannt-dev/main/stats/sources.json"
const FILE = "https://github.com/vannt-dev/vannt-dev/blob/main/stats/sources.json"
const el = (tag, text, attrs = {}) => {
  const n = document.createElement(tag)
  if (text) n.textContent = text
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v)
  return n
}
const link = (text, href) => el("a", text, { href })
function section(title, rows) {
  if (!rows.length) return null
  const s = el("section"); s.append(el("h2", title))
  const ul = el("ul", "", { class: "list" })
  for (const row of rows) { const li = el("li"); li.append(...row); ul.append(li) }
  s.append(ul); return s
}
function render(src) {
  const parts = [
    section("npm", (src.npm || []).map((n) => [link(n, `https://www.npmjs.com/package/${n}`)])),
    section("PyPI", (src.pypi || []).map((n) => [link(n, `https://pypi.org/project/${n}/`)])),
    section("Chrome Web Store", (src.chromeWebStore || []).map((e) =>
      [link(e.name, `https://chromewebstore.google.com/detail/${e.id}`), el("code", e.id)])),
    section("Other stores", (src.otherListings || []).map((l) => [link(`${l.name} (${l.store})`, l.url)])),
    section("GitHub releases", (src.githubReleases || []).map((r) =>
      [link(r, `https://github.com/${r}/releases`)])),
    section("Android signing certificates (APKs from GitHub releases)",
      (src.signingCertificates || []).map((c) => [el("span", c.repo), el("code", c.sha256)])),
  ].filter(Boolean)
  document.getElementById("channels").replaceChildren(...parts)
}
function fallback() {
  const p = el("p", "The list could not be loaded. Read it on GitHub: ")
  p.append(link("stats/sources.json", FILE))
  document.getElementById("channels").replaceChildren(p)
}
fetch(SOURCE).then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then(render, fallback)
```

  CSS for `.list` (no bullets, one row per item, `code` in IBM Plex Mono with
  `overflow-wrap: anywhere` so fingerprints wrap at 390 px).
- [ ] **Step 3:** Test locally with Playwright: serve the folder (`npx http-server -p 8765`), open
  `official.html` at 1280 and 390 px wide, light and dark. Expected: six sections, no horizontal
  scroll (`document.documentElement.scrollWidth <= innerWidth`). Then route
  `raw.githubusercontent.com` to abort: expected the fallback link. Then replace a CWS name with
  `<img src=x onerror=alert(1)>` through a routed response: expected the literal text shown.
- [ ] **Step 4:** Footer of `index.html`: `© 2026 Van Nguyen · <a href="https://github.com/vannt-dev">github.com/vannt-dev</a> · <a href="/official.html">Official channels</a>`.
- [ ] **Step 5:** Commit `feat: add official channels page` on the site, push; open
  `https://vannt-dev.github.io/official.html` once Pages has deployed and repeat the 390 px check.
- [ ] **Step 6:** Profile README: add "Official builds and packages:
  [vannt-dev.github.io/official.html](https://vannt-dev.github.io/official.html)" beside the
  existing site link; commit `docs: link the official channels page`, push.

### Task 3: attestation in region-snap, proven on a branch

**Files:** Modify `region-snap/.github/workflows/release.yml`, `region-snap/README.md`.

- [ ] **Step 1:** Branch `ci/attest-store-zip` from `main`.
- [ ] **Step 2:** In job `extension`, add job permissions and a step after "Build Store ZIP":

```yaml
    permissions:
      contents: read
      id-token: write
      attestations: write
```

```yaml
      - name: Attest Store ZIP
        uses: actions/attest-build-provenance@v4
        with:
          subject-path: release/*.zip
```

  In job `release`, turn `body` into a block that keeps the expression and adds a line:

```yaml
          body: |
            ${{ needs.desktop.outputs.signed == 'true' && 'Includes the Chrome extension package and signed Windows installer.' || 'The Chrome extension package is available now. The signed Windows installer will be attached after the code-signing certificate is configured.' }}

            Check the extension ZIP: `gh attestation verify <zip> --owner vannt-dev`
```

- [ ] **Step 3:** README: one line under the title block: "Official builds are listed at
  [vannt-dev.github.io/official.html](https://vannt-dev.github.io/official.html); anything else is
  not published by vannt-dev."
- [ ] **Step 4:** Commit `ci(release): attest the store ZIP`, push the branch, run
  `gh workflow run release.yml --ref ci/attest-store-zip`, wait for job `extension`.
- [ ] **Step 5:** `gh run download <id> -n region-snap-store-package -D <scratch>`, then
  `gh attestation verify <zip> --owner vannt-dev`. Expected: verified. Append one byte to a copy
  and verify again. Expected: fails.
- [ ] **Step 6:** Open the PR to `main`; wait for CI.

### Task 4: attestation in the other three extensions

Same README line as Task 3 Step 3 in each. One branch `ci/attest-store-zip` and one PR per repository.

- [ ] **browser-extension** (`main`): job `create-release` permissions become
  `contents: write`, `id-token: write`, `attestations: write`; after "Package Release ZIP":

```yaml
      - name: Attest Release ZIP
        uses: actions/attest-build-provenance@v4
        with:
          subject-path: dist/zips/*.zip
```

  Release body gains:

```yaml
            ### Verify
            `gh attestation verify universal-file-converter-${{ env.VERSION }}.zip --owner vannt-dev`
```

- [ ] **network-overrides-devtools** (`develop`): job `release` permissions as above; after "Build
  store release package":

```yaml
      - name: Attest store package
        if: steps.check_tag.outputs.EXISTS != 'true'
        uses: actions/attest-build-provenance@v4
        with:
          subject-path: release/*.zip
```

  Release body gains a "Verify" line with
  `gh attestation verify network-overrides-api-devtools-${{ env.TAG_NAME }}-store.zip --owner vannt-dev`.
- [ ] **convert-md-to-pdf** (`main`): job `release` gets permissions `contents: write`,
  `id-token: write`, `attestations: write`; after "Build Extension Artifacts":

```yaml
      - name: Attest Extension Artifacts
        uses: actions/attest-build-provenance@v4
        with:
          subject-path: dist/extension-*.zip
```

  and `body: "Check the extension ZIP: \`gh attestation verify <zip> --owner vannt-dev\`"` (softprops
  puts it before the generated notes).
- [ ] **Check each:** `npx --yes @action-validator/cli .github/workflows/release.yml` (or actionlint
  if installed) passes; commit `ci(release): attest the store ZIP`; push; open the PR; CI green.

### Task 5: README line in NimbleClip and Aegis Net

- [ ] nimbleclip (`main`) and aegis-net (`develop`): the README line from Task 3 Step 3, plus "APK
  signing certificate fingerprints are listed there too." Commit `docs: link the official
  channels page`; PR each; CI green. No other file changes.

## Phase 2

### Task 6: copy watch script

**Files:** Create `scripts/copy-watch.mjs`, `scripts/copy-watch.test.mjs`,
`copy-watch/known.json`, `copy-watch/seen.json` (`{}`).

**Interfaces (exported from `copy-watch.mjs`):**
- `buildQueries(sources) -> string[]`
- `groupByRepo(items: {repo, owner, path, url, query}[]) -> {repo, query, paths: {path, url}[]}[]`
- `newRepos(groups, known: {repo, reason}[], seen: Record<string, string>) -> groups`
- `issueBody(groups, date) -> string`

- [ ] **Step 1: failing tests** in `scripts/copy-watch.test.mjs`:

```js
import { test } from "node:test"
import assert from "node:assert/strict"
import { buildQueries, groupByRepo, newRepos, issueBody } from "./copy-watch.mjs"

test("queries exclude the vannt-dev account and include each store ID", () => {
  const q = buildQueries({ chromeWebStore: [{ name: "X", id: "abc" }] })
  assert.deepEqual(q, [
    '"github.com/vannt-dev" -user:vannt-dev',
    "vannt-dev filename:LICENSE -user:vannt-dev",
    "abc -user:vannt-dev",
  ])
})

test("groups by repository, drops vannt-dev-owned hits, keeps five paths", () => {
  const hit = (repo, path) => ({ repo, owner: repo.split("/")[0], path, url: `u/${path}`, query: "q" })
  const items = [hit("vannt-dev/x", "a"), ...["1", "2", "3", "4", "5", "6"].map((p) => hit("a/b", p))]
  const groups = groupByRepo(items)
  assert.equal(groups.length, 1)
  assert.equal(groups[0].repo, "a/b")
  assert.equal(groups[0].paths.length, 5)
})

test("known and seen repositories are not new, whatever the case", () => {
  const groups = [{ repo: "Szabgab/PyDigger-data" }, { repo: "c/d" }, { repo: "e/f" }]
  const out = newRepos(groups, [{ repo: "szabgab/pydigger-data", reason: "index" }], { "C/D": "2026-10-14" })
  assert.deepEqual(out.map((g) => g.repo), ["e/f"])
})

test("issue body lists repository, query and paths", () => {
  const body = issueBody([{ repo: "e/f", query: "q", paths: [{ path: "p", url: "https://x" }] }], "2026-10-14")
  assert.match(body, /\[e\/f\]\(https:\/\/github.com\/e\/f\)/)
  assert.match(body, /\[p\]\(https:\/\/x\)/)
})
```

- [ ] **Step 2:** `node --test scripts/copy-watch.test.mjs` → FAIL (module not found).
- [ ] **Step 3: implement** `scripts/copy-watch.mjs`:

```js
// Weekly search for public copies of vannt-dev code outside the vannt-dev account.
// Searches GitHub code for strings that vannt-dev repositories carry, drops repositories listed in
// copy-watch/known.json or already reported in copy-watch/seen.json, and opens one issue for the
// rest. Limits: public GitHub only; code search covers default branches and skips large files and
// most forks; the Chrome Web Store and npm are not searched.
// Usage: node scripts/copy-watch.mjs [--dry-run]. Node 22+, no dependencies.
import { readFileSync, writeFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

const OWNER = "vannt-dev"
const MAX_PATHS = 5

export function buildQueries(sources) {
  return [
    `"github.com/${OWNER}" -user:${OWNER}`,
    `${OWNER} filename:LICENSE -user:${OWNER}`,
    ...(sources.chromeWebStore || []).map((ext) => `${ext.id} -user:${OWNER}`),
  ]
}

export function groupByRepo(items) {
  const groups = new Map()
  for (const item of items) {
    if (item.owner.toLowerCase() === OWNER) continue
    const key = item.repo.toLowerCase()
    if (!groups.has(key)) groups.set(key, { repo: item.repo, query: item.query, paths: [] })
    const group = groups.get(key)
    if (group.paths.length < MAX_PATHS && !group.paths.some((p) => p.path === item.path)) {
      group.paths.push({ path: item.path, url: item.url })
    }
  }
  return [...groups.values()]
}

export function newRepos(groups, known, seen) {
  const skip = new Set([...known.map((k) => k.repo), ...Object.keys(seen)].map((r) => r.toLowerCase()))
  return groups.filter((g) => !skip.has(g.repo.toLowerCase()))
}

export function issueBody(groups, date) {
  const lines = [`Public repositories outside vannt-dev that match a copy-watch query (${date}).`, ""]
  for (const g of groups) {
    lines.push(`- [${g.repo}](https://github.com/${g.repo}): \`${g.query}\``)
    for (const p of g.paths) lines.push(`  - [${p.path}](${p.url})`)
  }
  lines.push("", "Harmless? Add it to `copy-watch/known.json` with a reason.")
  return lines.join("\n")
}

async function gh(path, token, init = {}) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: { accept: "application/vnd.github+json", authorization: `Bearer ${token}`,
        "user-agent": "vannt-dev-copy-watch", ...init.headers },
    })
    if (res.ok) return res.json()
    if (attempt < 3 && res.status >= 500) { await new Promise((r) => setTimeout(r, 2000 * attempt)); continue }
    const hint = path.startsWith("/search/code") && [401, 403, 422].includes(res.status)
      ? " (code search refused this token: set the COPY_WATCH_TOKEN secret)" : ""
    throw new Error(`${path}: HTTP ${res.status}${hint}`)
  }
}

async function search(query, token) {
  const data = await gh(`/search/code?per_page=100&q=${encodeURIComponent(query)}`, token)
  return data.items.map((i) => ({ repo: i.repository.full_name, owner: i.repository.owner.login,
    path: i.path, url: i.html_url, query }))
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const searchToken = process.env.SEARCH_TOKEN || process.env.GITHUB_TOKEN
  const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"))
  const sources = read("stats/sources.json")
  const known = read("copy-watch/known.json")
  const seen = read("copy-watch/seen.json")
  const items = []
  for (const [i, query] of buildQueries(sources).entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 7000)) // code search: 10 requests a minute
    items.push(...(await search(query, searchToken)))
  }
  const fresh = newRepos(groupByRepo(items), known, seen)
  const date = new Date().toISOString().slice(0, 10)
  console.log(`${items.length} hits, ${fresh.length} new repositories`)
  if (!fresh.length) return
  const title = `Copy watch: ${fresh.length} new repositories (${date})`
  const body = issueBody(fresh, date)
  if (dryRun) { console.log(`\n${title}\n\n${body}`); return }
  await gh(`/repos/${OWNER}/${OWNER}/issues`, process.env.GITHUB_TOKEN, {
    method: "POST", body: JSON.stringify({ title, body, labels: ["copy-watch"] }) })
  for (const g of fresh) seen[g.repo] = date
  writeFileSync(new URL("../copy-watch/seen.json", import.meta.url), `${JSON.stringify(seen, null, 2)}\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error(err.message); process.exit(1) })
}
```

  `copy-watch/known.json`:
  `[{ "repo": "szabgab/pydigger-data", "reason": "PyPI metadata index (found 14/10)" }]`
- [ ] **Step 4:** `node --test scripts/copy-watch.test.mjs` → PASS (4 tests).
- [ ] **Step 5:** `GITHUB_TOKEN=$(gh auth token) node scripts/copy-watch.mjs --dry-run`. Expected:
  "N hits, 0 new repositories" (pydigger filtered by `known.json`); nothing written
  (`git status` clean apart from the new files).
- [ ] **Step 6:** Commit `feat(copy-watch): search for public copies of vannt-dev code`.

### Task 7: copy watch workflow

**Files:** Create `.github/workflows/copy-watch.yml`.

- [ ] **Step 1:**

```yaml
name: copy-watch

on:
  schedule:
    - cron: "41 3 * * 1"
  workflow_dispatch:
    inputs:
      dry_run:
        description: Print the issue instead of opening it
        type: boolean
        default: true

permissions:
  contents: write
  issues: write

concurrency:
  group: copy-watch
  cancel-in-progress: false

jobs:
  watch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
      - name: Test
        run: node --test scripts/copy-watch.test.mjs
      - name: Search for copies
        run: node scripts/copy-watch.mjs ${{ github.event_name == 'workflow_dispatch' && inputs.dry_run && '--dry-run' || '' }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SEARCH_TOKEN: ${{ secrets.COPY_WATCH_TOKEN || secrets.GITHUB_TOKEN }}
      - name: Commit seen list
        run: |
          git add copy-watch/seen.json
          if git diff --cached --quiet; then
            echo "No changes"
            exit 0
          fi
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git commit -m "chore(copy-watch): record reported repositories"
          git pull --rebase
          git push
```

- [ ] **Step 2:** `gh label create copy-watch --repo vannt-dev/vannt-dev --color 1e40af
  --description "Public copy of vannt-dev code"`.
- [ ] **Step 3:** Commit `ci(copy-watch): run the copy watch weekly`, push to `main`.
- [ ] **Step 4:** `gh workflow run copy-watch.yml -f dry_run=true`, watch the run. Expected: tests
  pass, search succeeds with `GITHUB_TOKEN`. If the search step fails with the
  `COPY_WATCH_TOKEN` hint: stop and ask the user to create the token (public repositories,
  read-only) and store it as that secret, then rerun.

## Phase 3

### Task 8: header script (kept in the scratchpad, not committed)

- [ ] **Step 1:** `add-headers.mjs <repoDir> <holderLine> <repoName> <dir>...`: for each `.js`,
  `.mjs`, `.cjs`, `.ts`, `.css` file under the given directories, skipping `node_modules`, `dist`,
  `build`, `release`, `lib`, `vendor`, tests (`test/`, `tests/`, `__tests__/`, `*.test.*`,
  `*.spec.*`), `*.d.ts` and `*.min.*`; if the first 5 lines lack `SPDX-License-Identifier`, insert
  `/*! SPDX-License-Identifier: MIT | Copyright (c) <holderLine> | github.com/vannt-dev/<repoName> */`
  as line 1, or line 2 after a `#!` line. Keep the file's line endings. Print the files changed.
- [ ] **Step 2:** Run it twice on a scratch copy: the second run changes nothing.

### Task 9-12: header pilot, one PR per extension (branch `chore/source-headers`)

For each repository: list the shipped directories (from `git ls-files` and the store-package
script), run the script, build the store ZIP, unzip into the scratchpad and check every shipped
`.js`/`.css` that came from a changed file still starts with the header. Run the repository's test
command. Commit `chore: add licence headers to source files`, open the PR, CI green.

| Repo | Holder line | Directories | Build | Extra check |
| --- | --- | --- | --- | --- |
| browser-extension | `2026 Van Nguyen` | `shared`, `popup` and the other first-party folders found in step 1 (not `lib/`) | `npm run zip` | Vite minifies: if headers are gone, set `esbuild: { legalComments: "inline" }` in `vite.config.js`; load the unpacked `dist/` in Chrome and convert one PNG to JPG |
| network-overrides-devtools | `2025 Van Nguyen` | `src`, `styles`, `styles.css` | `npm run package:store` | `tsc` keeps `/*!` comments; confirm in `dist` |
| region-snap | `2026 vannt-dev` | the extension's root `.js`/`.css` files and `desktop/` (not `docs/`) | `npm run package:store` | `npm run smoke` |
| convert-md-to-pdf | `2026 Van Nguyen` | `src`, `bin`, `extension` (not `extension/lib`) | `npm run build:extension` | `npm test` |

## Finish

- [ ] Update the memory note; report PR links and what is the user's (merges, Store uploads at the
  next normal release, `otherListings` URLs, the token if Task 7 needed it).
