---
name: framework-bootstrap
description: Point this framework at a new project. Use when starting automation on a new application, when the repo has just been cloned, or when the user says "set up the framework", "configure this for my project", "bootstrap the tests", or asks what to change first.
---

# Bootstrap the framework for a new project

Turns the template into a working suite for one specific application, without
leaving example code behind pretending to be real coverage.

Read `.claude/skills/framework-conventions/SKILL.md` first. This skill assumes
those rules and does not restate them.

## Step 1 — Find out what is being tested

Ask, and do not guess. Each answer changes what gets built:

- **What is the application?** Name, what it does, who uses it.
- **Which layers apply?** A service with no UI needs no `ui` or `e2e`
  project. Delete what does not apply rather than leaving it empty.
- **What are the environments?** Names and base URLs for each.
- **How does authentication work?** Form login, SSO redirect, API token,
  session cookie, or none. This is the single most common thing that derails a
  setup, so establish it before writing a page object.
- **Where does it run?** Local only, or a CI system too.
- **Is there a second system?** Only then does `e2e` mean anything.

If the application already exists, read its source for real selectors and
routes rather than inventing them. Invented selectors produce a suite that
compiles, runs, and tests nothing.

## Step 2 — Configure

1. `config/.env.example` — rewrite the variable list to what this project
   actually needs. Delete what it does not. Every name present should be one
   something reads.
2. `config/.env.<environment>` — one per environment, holding only values safe
   to commit: URLs, tenant names, feature names. **No secrets.**
3. `config/environment.ts` — add an accessor per new variable. `required()`
   for anything without a sensible default, `optional()` otherwise.
4. `playwright.config.ts` — delete projects for layers this project has no use
   for.

Confirm `config/.env.local` is gitignored before putting a real value anywhere.

## Step 3 — Replace the templates

The repo ships one worked example per layer. They are shapes to copy, not
coverage. Each must be replaced or deleted before the suite means anything.

- `src/pages/login.page.ts` — real selectors, verified against the running
  application. Prefer role and label over CSS.
- `src/api/example.client.ts` and `src/api/schemas/` — real routes and
  response contracts. `.strict()` for an API this team owns.
- `src/types/index.ts` — the domain's own shared shape, replacing the sample
  record.
- `tests/**/*.spec.ts` — delete every example. A suite whose first run is
  green because everything skipped is worse than an empty one.

## Step 4 — Authentication

If the application needs a session:

1. Confirm what the login actually is by looking at the live page or the
   source. Do not assume a form.
2. Check **where the session lives**. `storageState` captures cookies,
   including HttpOnly, and localStorage. It does **not** capture
   sessionStorage. An app keeping its token there needs an init script that
   replays it per context instead.
3. Fill in `tests/setup/auth.setup.ts` using the real page object.
4. Verify the session was established before saving it. A failed login still
   writes a state file otherwise, and every dependent spec then fails on a
   confusing assertion rather than at the cause.

Never type a real credential into a file. Credentials go in
`config/.env.local` or the CI secret store.

## Step 5 — Prove it

In order, and do not skip ahead:

```bash
npm install
npx playwright install chromium
npm run verify          # typecheck and lint
npm run test:api        # fastest layer first
npm test                # everything
```

Then the step people skip: **make one test fail on purpose.** Change an
expected value, confirm it goes red, change it back. A suite that has only
ever been green has not been shown to work.

## Step 6 — CI

`.github/workflows/tests.yml` ships as a starting point. Adapt it, and check
three things specifically:

- **Secrets are injected, never committed.** In most CI systems a secret is
  not placed in a task's environment automatically; it has to be mapped
  explicitly. A suite that silently skips because a variable was never mapped
  looks exactly like a passing suite.
- **Each layer runs in a gate that can reach its dependencies.** An acceptance
  suite in a pull-request gate turns an unrelated outage into a failed build
  for everyone.
- **The stage actually ran.** Confirm it in the run's output. A test whose
  stage never fires reads as coverage and is worse than no test.

## Step 7 — Write it down

Update the README with what this suite covers, what it deliberately does not,
how to run it, and how to get credentials. Do it now, while the answers from
step 1 are still fresh.

## Finishing

Report what was configured, what was deleted, what still needs a human
decision, and the result of the deliberate-failure check. If authentication
could not be verified, say so plainly rather than leaving a setup that looks
finished.
