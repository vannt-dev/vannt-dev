// Hourly list of open issues across the public vannt-dev repositories, written into the profile
// README between the open-issues markers and into stats/issues-badge.json (a shields.io endpoint).
// Issues opened by bots (copy-watch reports, release bots) and pull requests are left out.
// Writes only when the list changes, so an unchanged hour makes no commit.
// Usage: node scripts/open-issues.mjs [--dry-run]. Node 22+, no dependencies.
import { readFileSync, writeFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

const OWNER = "vannt-dev"
const MAX_ROWS = 10
const START = "<!-- open-issues:start -->"
const END = "<!-- open-issues:end -->"
const ALL_URL = `https://github.com/issues?q=is%3Aopen+is%3Aissue+user%3A${OWNER}`

export function pickIssues(items) {
  return items
    .filter((i) => !i.pull_request && i.user?.type !== "Bot" && !i.user?.login.endsWith("[bot]"))
    .map((i) => ({
      repo: i.repository_url.split("/").pop(),
      number: i.number,
      title: i.title,
      url: i.html_url,
      author: i.user.login,
      created: i.created_at.slice(0, 10),
    }))
    .sort((a, b) => b.created.localeCompare(a.created) || a.repo.localeCompare(b.repo))
}

const cell = (text) => text.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim()

export function renderSection(issues) {
  if (issues.length === 0) return "No open issues right now."
  const rows = issues
    .slice(0, MAX_ROWS)
    .map((i) => `| ${i.repo} | [#${i.number} ${cell(i.title)}](${i.url}) | ${i.author} | ${i.created} |`)
  const more = issues.length > MAX_ROWS ? [``, `[and ${issues.length - MAX_ROWS} more](${ALL_URL})`] : []
  return ["| Repository | Issue | Opened by | Since |", "| --- | --- | --- | --- |", ...rows, ...more].join("\n")
}

export function replaceSection(readme, section) {
  const a = readme.indexOf(START)
  const b = readme.indexOf(END)
  if (a < 0 || b < a) throw new Error(`README needs ${START} and ${END}`)
  return `${readme.slice(0, a + START.length)}\n${section}\n${readme.slice(b)}`
}

export function badge(count) {
  return { schemaVersion: 1, label: "open issues", message: String(count), color: count ? "orange" : "brightgreen" }
}

async function search(token) {
  const q = encodeURIComponent(`is:open is:issue user:${OWNER} archived:false`)
  const res = await fetch(`https://api.github.com/search/issues?q=${q}&per_page=100&sort=created`, {
    headers: { Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!res.ok) throw new Error(`search failed: ${res.status} ${await res.text()}`)
  return (await res.json()).items
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const issues = pickIssues(await search(process.env.GITHUB_TOKEN))
  const readme = readFileSync("README.md", "utf8")
  const next = replaceSection(readme, renderSection(issues))
  const badgeText = `${JSON.stringify(badge(issues.length))}\n`
  console.log(`${issues.length} open issue(s)`)
  if (dryRun) return console.log(renderSection(issues))
  if (next !== readme) writeFileSync("README.md", next)
  writeFileSync("stats/issues-badge.json", badgeText)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main()
