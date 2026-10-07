# QA Automation Framework

A layered Playwright test framework: API, UI, acceptance and end-to-end suites
behind one set of fixtures. Clone it, point it at an application, delete what
does not apply.

It ships with three skills under `.claude/skills/` that teach an AI assistant
the conventions, how to bootstrap the framework for a new project, and how to
turn written test cases into specs placed correctly.

## Quick start

```bash
npm install
npx playwright install chromium

cp config/.env.example config/.env.local   # fill in your values
npm run verify                             # typecheck + lint
npm test
```

With Claude Code or Cowork in the repo, the fastest start is:

```
/framework-bootstrap
```

It asks what you are testing, configures the layers that apply, and removes
the ones that do not.

## The four layers

The projects are layers, not browsers. Each runs where its dependencies
actually exist, which is what lets a gate run the layers it can reach instead
of running everything and skipping most of it.

| Layer | Scope | Needs | Use for |
|---|---|---|---|
| `tests/api` | one service over HTTP | a reachable API | business rules, validation, contracts, error paths |
| `tests/ui` | one app in a browser | a deployed or local UI | reachability, visible validation, journeys |
| `tests/acceptance` | one deployed service at its boundary | a deployment | post-deploy gates, health, version |
| `tests/e2e` | several systems together | all of them | integration between products |

**Pick the cheapest layer that can still fail for the right reason.** A rule
tested through a browser takes fifty times longer and fails for fifty more
reasons than the same rule over HTTP. If a scenario would still make sense
described over the phone without mentioning a screen, it belongs in `api`.

```bash
npm run test:api          # fastest, no browser
npm run test:ui
npm run test:acceptance
npm run test:e2e
npm run test:smoke        # the @smoke subset across all layers
```

## Layout

```
config/
  environment.ts       every external value, read in one place
  .env.example         the variable list, with empty values
src/
  fixtures/index.ts    what every spec gets; specs import test/expect here
  pages/               page objects: locators and vocabulary, no assertions
  api/                 clients and .strict() response schemas
  systems/             the System interface cross-system specs talk to
  helpers/             polling, cross-process locking, auth state
  data/                generators for per-run unique values
  types/               shared shapes, validated at load
tests/
  setup/               sign-in, run once, saved for the browser projects
  api/ ui/ acceptance/ e2e/
.claude/skills/        the three skills described below
```

## What the framework gives you

**One barrel for fixtures.** Specs import `test` and `expect` from
`src/fixtures`, never from `@playwright/test`. A lint rule enforces it,
because a spec that reaches past the barrel silently opts out of the shared
arrangement and then fails for reasons that look like product bugs.

**Sign-in once.** A setup project captures the session to a storage state the
browser projects reuse, so no spec pays for a login it did not come to test.
It is skipped entirely when no credentials are configured, which lets the API
layer run in a gate that holds no secrets.

**Schema-validated responses.** `.strict()` schemas on an API you own, so a
field the server renames fails at the boundary naming the field, instead of
surfacing three assertions later as a complaint about `undefined`.

**Polling that survives a slow page.** `expect.poll` stops the moment its
callback throws, so an unwrapped read turns one slow load into a failed run
seconds into a much longer budget. `pollRead` returns the error instead of
throwing, which keeps the wait alive and still reports what happened.

**A cross-process lock.** Playwright's serial mode orders tests within a file
and does nothing between files in parallel workers. Where an environment hands
you one shared record you cannot duplicate, `acquireLock` covers that gap.

**Generated writes, pinned restores.** A suite that adopts whatever it finds
as its baseline will, after a single failed cleanup, treat last run's test
values as real, and the record drifts further every run. Values a test writes
are generated per run; the value it restores to is pinned in a fixture file.

## The skills

| Skill | Use it when |
|---|---|
| `framework-conventions` | writing or reviewing any test code here. The other two defer to it. |
| `framework-bootstrap` | pointing the framework at a new application for the first time |
| `automate-test-case` | you have written test cases, acceptance criteria or a ticket to automate |

They live in `.claude/skills/`, so they travel with the repo and stay
versioned alongside the code they describe.

## Configuration

Values are read through `config/environment.ts` and nowhere else, so a missing
variable fails with a sentence naming what to set rather than surfacing as an
undefined URL three layers down.

Resolution order, last wins:

1. `config/.env.<ENVIRONMENT>` — committed, no secrets
2. `config/.env.local` — gitignored, personal and secret values
3. real environment variables — how CI injects secrets

```bash
ENVIRONMENT=ci npm run test:api
```

**Nothing secret is ever committed.** `config/.env.example` lists names with
empty values. If your CI needs a secret, map it explicitly into the job: in
most CI systems a secret is not placed in a task's environment automatically,
and a suite that silently skips because a variable was never mapped looks
exactly like a passing suite.

## Conventions worth knowing before the first spec

- One behaviour per test, titled as a sentence describing that behaviour
- No ticket ids in titles or comments; they go stale, the test does not
- Page objects never assert
- No `waitForTimeout`, ever
- Assert the negative as well as the positive
- At most one `@smoke` per endpoint or screen
- **Make every new test fail on purpose once.** A test that has never failed
  has not been tested

`framework-conventions` has the full set with the reasoning for each.

## CI

`.github/workflows/tests.yml` runs the API layer on every pull request, the UI
layer on main, and end-to-end nightly. Adapt it to your CI system; the split
is the part worth keeping.

## Licence

MIT. Use it, fork it, change it.
