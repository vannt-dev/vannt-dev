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

// GitHub answers code search from the Actions GITHUB_TOKEN with 429 on the first request
export function refusalHint(path, status) {
  return path.startsWith("/search/code") && [401, 403, 422, 429].includes(status)
    ? " (code search refused this token: set the COPY_WATCH_TOKEN secret)"
    : ""
}

async function gh(path, token, init = {}) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "user-agent": "vannt-dev-copy-watch",
        ...init.headers,
      },
    })
    if (res.ok) return res.json()
    if (attempt < 3 && res.status >= 500) {
      await new Promise((r) => setTimeout(r, 2000 * attempt))
      continue
    }
    throw new Error(`${path}: HTTP ${res.status}${refusalHint(path, res.status)}`)
  }
}

async function search(query, token) {
  const data = await gh(`/search/code?per_page=100&q=${encodeURIComponent(query)}`, token)
  return data.items.map((i) => ({
    repo: i.repository.full_name,
    owner: i.repository.owner.login,
    path: i.path,
    url: i.html_url,
    query,
  }))
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
  if (dryRun) {
    console.log(`\n${title}\n\n${body}`)
    return
  }
  await gh(`/repos/${OWNER}/${OWNER}/issues`, process.env.GITHUB_TOKEN, {
    method: "POST",
    body: JSON.stringify({ title, body, labels: ["copy-watch"] }),
  })
  for (const g of fresh) seen[g.repo] = date
  writeFileSync(new URL("../copy-watch/seen.json", import.meta.url), `${JSON.stringify(seen, null, 2)}\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
