---
name: framework-conventions
description: The rules every spec, page object and client in this framework follows, and the reasoning behind each. Read before writing or reviewing any test code in this repo. The other two skills read this first rather than restating it.
---

# Framework conventions

The reference the other skills defer to. Each rule names the failure it
prevents, because a rule whose reason is forgotten gets dropped the first time
it is inconvenient.

## Layers, and how to choose one

| Layer | Scope | Needs | Use for |
|---|---|---|---|
| `tests/api` | one service over HTTP | a reachable API | business rules, validation, contracts, error paths |
| `tests/ui` | one app in a browser | a deployed or local UI | reachability, visible validation, journeys |
| `tests/acceptance` | one deployed service at its boundary | a deployment | post-deploy gates, health, version |
| `tests/e2e` | several systems together | all of them | integration between products |

**Choose the cheapest layer that can actually fail for the right reason.** A
rule tested through a browser takes fifty times longer and fails for fifty
more reasons than the same rule tested over HTTP. The useful question is not
"can this be tested in the UI" but "would a UI-level failure tell me anything
an API-level failure would not".

A scenario that would still make sense described over the phone, without
mentioning a screen, belongs in `api`.

## Specs

**Import from `@fixtures`, never from `@playwright/test`.** A lint rule
enforces it. Reaching past the barrel silently opts the spec out of the shared
arrangement, and it then fails for reasons that look like product bugs. Import
*types* from `@playwright/test` freely; that is not the same thing.

**One behaviour per test.** A test asserting three unrelated things reports
one failure and hides the other two until the first is fixed.

**Name the test after the behaviour, in a sentence.**
`'a blank first name leaves the existing name unchanged'`, not
`'test update patient 2'`. The title is what someone reads in a failed CI run
at 7am, and it should tell them what broke without opening the file.

**Never put a ticket id in a test title or a comment.** Tickets close, move
and get renumbered; the test outlives all of it. State the reasoning inline
instead.

**Assert the negative too.** A test that only checks the error appears passes
when the app shows an error *and* performs the action anyway. That is usually
the bug worth catching.

**`@smoke` marks the one test per area worth running under a time limit.**
More than one per endpoint or screen and the tag means nothing.

## Assertions, and the ways they lie

The highest-value review question is not "is there an assertion" but **"could
this assertion ever fail?"** These all pass while proving nothing:

- **Asserting the caller, not the boundary.** Checking the API returned 200
  when the scenario is about a row reaching a database. The request was
  accepted; nothing says the write landed.
- **Status without shape.** `expect(status).toBe(200)` alone. A silently
  dropped field passes. Validate the body against a `.strict()` schema.
- **Self-fulfilling setup.** Seeding the exact row the test then asserts,
  bypassing the code under test entirely.
- **A mocked-away dependency in an integration test.** You have tested the
  mock. If the real dependency is unreachable from that gate, the test is in
  the wrong layer.
- **Weakened oracle.** `toBeTruthy()` where a value was expected.
- **An assertion that cannot fail.** The subtlest one. A check written after
  a step that already guarantees its outcome.

Before committing, make each new test fail on purpose once. A test that has
never failed has not been tested.

## Page objects

Own locators and vocabulary. **Never assert.** Keeping assertions in specs is
what lets the same page object serve a test expecting success and one
expecting a validation error.

Build locators once in the constructor, so a selector appears exactly once in
the repo.

Prefer role, label or test id over CSS. A CSS path couples the test to the
DOM's shape, so a wrapper div added for layout breaks a test about a button.

Return `Locator`s, not strings, for anything a spec asserts on. The spec can
then check visibility, content or absence without the page object guessing
which.

## API clients

Specs call named methods, never raw URLs. A changed route is then one edit.

**Two method shapes, and the difference matters.** A method that asserts
success and returns a validated body, for arrange steps where failure means a
broken fixture. And a method returning the raw response, for the act step
where the status is what is under test. Collapsing them is how a suite ends up
unable to test its own error paths.

`.strict()` on schemas for an API you own, so contract drift fails loudly at
the boundary. Permissive schemas for a third party's, where a field they add
is not your regression.

## Test data

**Generate what you write, pin what you restore to.** A suite that adopts
whatever it finds as the baseline will, after one failed cleanup, treat last
run's test values as real. The record drifts further every run and never
recovers.

Put the run id in generated names. When a leftover record turns up weeks
later, that is the difference between knowing which run abandoned it and
guessing.

Spread awkward characters across existing scenarios rather than writing a
dedicated "special characters" test. A field that survives a real journey with
an apostrophe in it has been tested more honestly.

## Waiting

**Never `waitForTimeout`.** It is simultaneously too short on a slow day and
wasted time on every other.

Wait on a condition: a locator, a URL, a polled read.

For cross-system propagation use `expect.poll` with `syncPoll`, and wrap the
read in `pollRead`. An unwrapped read that throws ends the poll immediately,
turning one slow page load into a failed run seconds into a much longer
budget.

## Cleanup

Restore through the same system the test wrote through. A different path races
the original change still crossing the sync, which can land afterwards and
undo the restore.

Cleanup failures log, they do not throw. A cleanup failure masking a real
assertion failure is worse than a loud line in the log. Make the message carry
enough to repair the record by hand.

Where an environment hands you one shared record you cannot duplicate, take
the cross-process lock. Playwright's serial mode orders tests within a file
and does nothing between files in parallel workers.

## Secrets

Never commit a credential, token, tenant id, connection string or internal
hostname. `config/.env.example` lists names with empty values; real values go
in `config/.env.local`, which is gitignored, or come from the CI environment.

Config read through `config/environment.ts` only. A missing variable then
fails with a sentence naming what to set, instead of surfacing as an undefined
URL three layers down.

## Gates

A test must only sit in a gate that can actually reach its dependencies. A
test needing a deployed environment in a pull-request gate turns an unrelated
outage into a failed build for everyone.

A test whose stage never runs is worse than no test: it reads as coverage.
After adding a suite, confirm its stage actually executed, not just that the
build went green.
