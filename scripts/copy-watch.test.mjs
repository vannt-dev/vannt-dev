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
  const items = [hit("vannt-dev/x", "a"), hit("Vannt-Dev/y", "b"), ...["1", "2", "3", "4", "5", "6"].map((p) => hit("a/b", p))]
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
