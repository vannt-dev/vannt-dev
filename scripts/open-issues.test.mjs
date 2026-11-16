import { test } from "node:test"
import assert from "node:assert/strict"
import { pickIssues, renderSection, replaceSection, badge } from "./open-issues.mjs"

const item = (over = {}) => ({
  repository_url: "https://api.github.com/repos/vannt-dev/nimbleclip",
  number: 102,
  title: "Saved media shows date 1 Jan 1970",
  html_url: "https://github.com/vannt-dev/nimbleclip/issues/102",
  user: { login: "someone", type: "User" },
  created_at: "2026-11-15T00:54:34Z",
  ...over,
})

test("keeps people's issues, drops bots and pull requests, newest first", () => {
  const issues = pickIssues([
    item(),
    item({ number: 4, user: { login: "github-actions[bot]", type: "Bot" } }),
    item({ number: 5, pull_request: {} }),
    item({ number: 103, created_at: "2026-11-16T00:00:00Z" }),
  ])
  assert.deepEqual(issues.map((i) => i.number), [103, 102])
  assert.equal(issues[0].repo, "nimbleclip")
  assert.equal(issues[0].created, "2026-11-16")
})

test("renders a table, escapes pipes, links to the rest past ten rows", () => {
  const one = pickIssues([item({ title: "a | b" })])
  assert.match(renderSection(one), /\[#102 a \\\| b\]\(https:\/\/github.com\/vannt-dev\/nimbleclip\/issues\/102\)/)
  const many = pickIssues(Array.from({ length: 12 }, (_, n) => item({ number: n })))
  const text = renderSection(many)
  assert.equal(text.split("\n").filter((l) => l.startsWith("| nimbleclip")).length, 10)
  assert.match(text, /\[and 2 more\]\(https:\/\/github.com\/issues\?q=/)
  assert.equal(renderSection([]), "No open issues right now.")
})

test("replaces only the text between the markers", () => {
  const readme = "top\n<!-- open-issues:start -->\nold\n<!-- open-issues:end -->\nbottom\n"
  assert.equal(
    replaceSection(readme, "new"),
    "top\n<!-- open-issues:start -->\nnew\n<!-- open-issues:end -->\nbottom\n",
  )
  assert.throws(() => replaceSection("no markers", "x"), /needs/)
})

test("badge is green at zero, orange otherwise", () => {
  assert.equal(badge(0).color, "brightgreen")
  assert.deepEqual(badge(3), { schemaVersion: 1, label: "open issues", message: "3", color: "orange" })
})
