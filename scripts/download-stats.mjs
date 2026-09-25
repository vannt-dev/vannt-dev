// Collects download counts for published packages and writes:
//   stats/history.json  - daily npm/PyPI counts, merged on every run so history outlives the
//                         registries' windows (npm: 18 months, pypistats: 180 days)
//   stats/summary.json  - per-source totals
//   stats/badge.json    - shields.io endpoint badge with the combined total
//   stats/README.md     - human-readable table
// Sources are listed in stats/sources.json. Node 22+, no dependencies.
import { existsSync, readFileSync, writeFileSync } from "node:fs"

const dir = new URL("../stats/", import.meta.url)
const sources = JSON.parse(readFileSync(new URL("sources.json", dir), "utf8"))
const historyFile = new URL("history.json", dir)
const history = existsSync(historyFile) ? JSON.parse(readFileSync(historyFile, "utf8")) : { npm: {}, pypi: {} }

const day = (d) => d.toISOString().slice(0, 10)
const today = new Date()
const since30 = day(new Date(today.getTime() - 30 * 86400000))

// Returns null on 404 when allowMissing is set: npm and pypistats have no data for a package
// until it has been downloaded after publishing.
async function getJson(url, headers = {}, allowMissing = false) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "user-agent": "vannt-dev-download-stats", ...headers } })
    if (res.ok) return res.json()
    if (res.status === 404 && allowMissing) {
      console.warn(`${url}: no data yet`)
      return null
    }
    if (attempt >= 3 || res.status < 500) throw new Error(`${url}: HTTP ${res.status}`)
    await new Promise((r) => setTimeout(r, 2000 * attempt))
  }
}

function merge(bucket, name, days) {
  const series = (bucket[name] ??= {})
  for (const [date, count] of days) series[date] = count
}

const sum = (series, from = "") => Object.entries(series ?? {}).reduce((n, [d, c]) => (d >= from ? n + c : n), 0)

// npm: the range endpoint serves at most 18 months per request.
const npmStart = day(new Date(today.getTime() - 540 * 86400000))
for (const name of sources.npm) {
  const data = await getJson(`https://api.npmjs.org/downloads/range/${npmStart}:${day(today)}/${name}`, {}, true)
  merge(history.npm, name, (data?.downloads ?? []).map((d) => [d.day, d.downloads]))
}

// PyPI: pypistats keeps 180 days. "with_mirrors" matches what pepy.tech badges show.
for (const name of sources.pypi) {
  const data = await getJson(`https://pypistats.org/api/packages/${name}/overall?mirrors=true`, {}, true)
  merge(history.pypi, name, (data?.data ?? []).filter((d) => d.category === "with_mirrors").map((d) => [d.date, d.downloads]))
}

// GitHub Releases: asset counters are cumulative, so no history is needed.
const auth = process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}
const releases = []
for (const repo of sources.githubReleases) {
  let total = 0
  for (let page = 1; ; page++) {
    const list = await getJson(`https://api.github.com/repos/${repo}/releases?per_page=100&page=${page}`, auth)
    for (const r of list) for (const a of r.assets) total += a.download_count
    if (list.length < 100) break
  }
  releases.push({ name: repo, total })
}

// Chrome Web Store has no public API; shields.io reads the listing. Users, not downloads.
const chrome = []
for (const ext of sources.chromeWebStore) {
  try {
    const data = await getJson(`https://img.shields.io/chrome-web-store/users/${ext.id}.json`)
    chrome.push({ ...ext, users: data.value })
  } catch (error) {
    chrome.push({ ...ext, users: "n/a" })
    console.warn(error.message)
  }
}

const rows = [
  ...sources.npm.map((name) => ({ source: "npm", name, total: sum(history.npm[name]), last30: sum(history.npm[name], since30), url: `https://www.npmjs.com/package/${name}` })),
  ...sources.pypi.map((name) => ({ source: "PyPI", name, total: sum(history.pypi[name]), last30: sum(history.pypi[name], since30), url: `https://pypi.org/project/${name}/` })),
  ...releases.map((r) => ({ source: "GitHub Releases", name: r.name.split("/")[1], total: r.total, last30: null, url: `https://github.com/${r.name}/releases` })),
]
const total = rows.reduce((n, r) => n + r.total, 0)

const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n)).replace(".0", "")
const updated = today.toISOString().slice(0, 16).replace("T", " ") + " UTC"

writeFileSync(historyFile, JSON.stringify(history, null, 2) + "\n")
writeFileSync(new URL("summary.json", dir), JSON.stringify({ total, packages: rows, chromeWebStore: chrome }, null, 2) + "\n")
writeFileSync(new URL("badge.json", dir), JSON.stringify({ schemaVersion: 1, label: "downloads", message: compact(total), color: "brightgreen" }) + "\n")

const table = rows
  .sort((a, b) => b.total - a.total)
  .map((r) => `| [${r.name}](${r.url}) | ${r.source} | ${r.total.toLocaleString("en-US")} | ${r.last30 === null ? "—" : r.last30.toLocaleString("en-US")} |`)
const chromeTable = chrome.map((c) => `| [${c.name}](https://chromewebstore.google.com/detail/${c.id}) | ${c.users} |`)
writeFileSync(
  new URL("README.md", dir),
  `# Download stats

Updated daily by [download-stats](../.github/workflows/download-stats.yml). Last run: ${updated}.

**Total downloads: ${total.toLocaleString("en-US")}** (npm + PyPI + GitHub release assets).

| Package | Source | Total | Last 30 days |
| --- | --- | ---: | ---: |
${table.join("\n")}

## Chrome Web Store

Weekly active users as shown on the store listing (not downloads, so not part of the total).

| Extension | Users |
| --- | ---: |
${chromeTable.join("\n")}

npm and PyPI counts include CI and mirror downloads. Their APIs keep 18 months and 180 days of data;
\`history.json\` keeps every day once collected, so totals keep growing past those windows.
`,
)
console.log(`total ${total}`)
