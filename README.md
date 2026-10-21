# Hi, I'm Van Nguyen 👋

**Full-stack & AI Agent Engineer** · Da Nang, Vietnam

I build open-source tools that make AI-assisted software engineering reliable: workflow
orchestration and governance for coding agents, portable agent skills, and AI-powered testing tools.

[![Total downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fvannt-dev%2Fvannt-dev%2Fmain%2Fstats%2Fbadge.json&label=total%20downloads)](https://github.com/vannt-dev/vannt-dev/blob/main/stats/README.md)
· [download stats per package](https://github.com/vannt-dev/vannt-dev/blob/main/stats/README.md)
· [official channels](https://vannt-dev.github.io/official.html): the only places my packages, extensions and apps are published

## 🤖 AI coding agents

| Project | What it does | Get it |
| --- | --- | --- |
| [**Junto**](https://github.com/vannt-dev/junto) | Durable workflow orchestration for AI coding agents: plan → human approval → execute → review → verify, with verifiable evidence. Advisory reviews can run on any OpenAI-compatible endpoint (OpenRouter, Ollama, LM Studio). | Claude Code plugin · [Site](https://vannt-dev.github.io/junto/) |
| [**AIWS — AI Software Factory**](https://github.com/vannt-dev/aiws-factory) | Turns a requirement into tested code through gated phases: analysis → design + test spec → AI design review → human approval → implementation with unit tests → review → PR. An optional openapi-drift check holds the backend to the API contract, and pull request review comments go back into rework. Claude Code does the work, Codex can take the review; cost per requirement, HTML reports, Vietnamese or English documents. | [npm](https://www.npmjs.com/package/aiws-factory) · [Site](https://vannt-dev.github.io/aiws-factory/) |
| [**governed-agent-sdlc**](https://github.com/vannt-dev/governed-agent-sdlc) | Governance toolkit for AI coding agents: policies, review gates, human approval (verifiable on GitHub) and an audit trail, with 11 stack profiles. | [PyPI](https://pypi.org/project/governed-agent-sdlc/) · [Site](https://vannt-dev.github.io/governed-agent-sdlc/) |
| [**AI Engineering Skills**](https://github.com/vannt-dev/ai-engineering-skills) | 17 portable engineering skills (10 workflow, 7 stack) for Claude Code, Codex, OpenCode and Google Antigravity; installs from a Claude Code plugin marketplace. | [Site](https://vannt-dev.github.io/ai-engineering-skills/) |
| [**token-efficient-work**](https://github.com/vannt-dev/token-efficient-work) | A skill + instruction hooks that stop coding agents from wasting tokens on redundant reads, re-checks and long output. Installs as a Claude Code plugin, with an optional read guard. | [Site](https://vannt-dev.github.io/token-efficient-work/) |
| [**Document Reader Skill**](https://github.com/vannt-dev/document-reader-skill-ai) | A skill that reads the requirement documents in a local folder selectively (now also HTML pages and plain text), reports what changed between revisions, then updates the project's code and tests to match. For Codex, Claude Code and Gemini CLI. | [Releases](https://github.com/vannt-dev/document-reader-skill-ai/releases) |

## 🧪 AI for testing

| Project | What it does | Get it |
| --- | --- | --- |
| [**openapi-drift**](https://github.com/vannt-dev/openapi-drift) | Keeps an OpenAPI document honest: reads the routes your NestJS, Express, Fastify or Spring code declares, compares them with the document and fails the build on drift in either direction, with SARIF output and pull request annotations. CLI, library and GitHub Action; no AI, no build of your project. | [npm](https://www.npmjs.com/package/openapi-drift) · [Site](https://vannt-dev.github.io/openapi-drift/) · [Demo](https://github.com/vannt-dev/openapi-drift-demo) |
| [**openapi-postman-test-generator**](https://github.com/vannt-dev/openapi-postman-test-generator) | Generate Postman collections and API tests from Swagger/OpenAPI with Codex, Claude, Antigravity, OpenAI or custom providers; checks the declared response headers and reports coverage from a Newman run. | [npm](https://www.npmjs.com/package/openapi-postman-test-generator) · [Site](https://vannt-dev.github.io/openapi-postman-test-generator/) |
| [**ai-testcase-generator**](https://github.com/vannt-dev/ai-testcase-generator) | Turn requirements, user stories and uploaded requirement files into traceable Excel test suites, review existing suites for coverage gaps, write bug reports from rough notes, and generate Playwright web and API tests. | [Live demo](https://ai-testcase-gen.streamlit.app/) · [Site](https://vannt-dev.github.io/ai-testcase-generator/) |

## 🛠 Developer tools & apps

- [**repokeeper**](https://github.com/vannt-dev/repokeeper) — one CLI that keeps every repository on the same standard: Conventional Commits, git hooks, CI, releases and dependency updates for 12 stacks (Node, Python, Dart, Go, Rust, Java, Kotlin, .NET, PHP, Ruby, shell/PowerShell, Dockerfiles), on GitHub and GitLab, plus code scanning, repository settings as code and optional modules for Actions cache cleanup, Dependabot auto-merge and npm/PyPI trusted publishing. [npm](https://www.npmjs.com/package/repokeeper) · [Playground](https://vannt-dev.github.io/repokeeper/)
- [**Network Overrides**](https://github.com/vannt-dev/network-overrides-devtools) — mock API responses (with or without calling the server), inject headers and simulate failures inside Chrome DevTools. [Chrome Web Store](https://chromewebstore.google.com/detail/network-overrides-api-dev/holdjgmcnpelgclhopiejilhhkfcmpba)
- [**Markdown to PDF**](https://github.com/vannt-dev/convert-md-to-pdf) — CLI and Chrome extension for styled PDFs with Mermaid, LaTeX, themes, page numbers, a running header/footer and PDF bookmarks. [npm](https://www.npmjs.com/package/md-pdf-studio) · [Chrome Web Store](https://chromewebstore.google.com/detail/markdown-to-pdf-converter/djikikejkmkklfeklfmddaadilhahamj)
- [**Region Snap**](https://github.com/vannt-dev/region-snap) — capture an exact region of a live page as a local PNG, with text notes, numbered step marks, scrolling capture and burst shots. [Chrome Web Store](https://chromewebstore.google.com/detail/region-snap-interactive-s/gdcpiocagphfbomdokhfomjnecnjfcon) · [Site](https://vannt-dev.github.io/region-snap/)
- [**Universal File Converter**](https://github.com/vannt-dev/browser-extension) — Chrome extension that converts images, documents, PDFs, spreadsheets and structured data entirely in the browser, with PDF page tools and offline OCR to searchable PDFs. [Chrome Web Store](https://chromewebstore.google.com/detail/universal-file-converter/bekbobpfdajniiiiadbpiedlbhccidnp) · [Releases](https://github.com/vannt-dev/browser-extension/releases)
- [**Dynamic Field Kit**](https://github.com/vannt-dev/dynamic-field-kit) — schema-driven dynamic form engine for React, Vue, Angular and Svelte, with conditions written as data, labelled built-in controls and a Storybook. [Docs](https://vannt-dev.github.io/dynamic-field-kit/) · [npm](https://www.npmjs.com/package/@dynamic-field-kit/core)
- [**Aegis Net**](https://github.com/vannt-dev/aegis-net) — DNS privacy guard and ad blocker for Android & iOS (Flutter + Rust), with DNS over HTTPS, TLS and QUIC; the log says why a domain was blocked, you can test a domain, trackers hiding behind a site's own subdomain are blocked, and 30 days of history stay on the phone. [Releases](https://github.com/vannt-dev/aegis-net/releases)
- [**NimbleClip**](https://github.com/vannt-dev/nimbleclip) — cross-platform Flutter app for downloading public videos, pictures and audio from YouTube, TikTok, Facebook, Instagram, X, Threads, Pinterest, SoundCloud and Flickr. [Releases](https://github.com/vannt-dev/nimbleclip/releases)

## Tech stack

**Languages & frameworks:** TypeScript · JavaScript · Python · Dart · React · Next.js · Node.js · NestJS · Flutter<br>
**Data & infra:** PostgreSQL · MySQL · Redis · Docker · GitHub Actions<br>
**AI:** AI agents · MCP · LLM tool calling · Claude Code · Codex
