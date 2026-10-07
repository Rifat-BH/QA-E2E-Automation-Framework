---
name: automate-test-case
description: Turn written test cases into automated specs placed correctly in this framework. Use when given test cases, acceptance criteria, a QA spec or a ticket to automate, or when the user says "automate these tests", "write a spec for this", "add coverage for", or pastes a list of scenarios.
---

# Automate a test case

Takes a written scenario and produces a spec that lives in the right layer,
reuses what exists, and can actually fail.

Read `.claude/skills/framework-conventions/SKILL.md` first. This skill assumes
those rules.

## Step 1 — Read what you were given, and say what is missing

For each scenario, identify four things:

1. **Precondition** — what must be true before it starts
2. **Action** — the single thing being done
3. **Oracle** — the observable fact that decides pass or fail
4. **Boundary** — where that fact is observed: a screen, a response, a
   database, another system

**If the oracle is vague, stop and ask.** "Verify it works", "check the data
is correct" and "confirm it saves" are not oracles. Automating them produces a
test that passes because it asserts something nobody chose.

This is the step most worth slowing down on. Every wrong assumption here
becomes a test that is green and worthless.

## Step 2 — Place each scenario in a layer

Use the table in the conventions skill. Then sanity-check against the
boundary from step 1: **the layer must be able to see the oracle.**

A scenario whose oracle is a row in a database cannot be verified by a UI
test that only sees a success toast. That mismatch is the most common way an
automated suite ends up proving less than it claims.

Three outcomes are legitimate, and saying so is part of the job:

- **Automate** — the layer can see the oracle
- **Automate later** — it could, but something is missing first (a test id, a
  seeded record, an endpoint)
- **Do not automate** — the oracle needs human judgement, or the setup costs
  more than the risk. Say which, and why.

Never silently downgrade a scenario to something easier to assert. If the
oracle cannot be reached, report it; do not substitute a weaker one.

## Step 3 — Read before writing

Do not invent selectors, routes or helpers. In order:

1. **Existing page objects and clients** — is there already one for this
   screen or endpoint?
2. **The application's source** — real test ids, labels, routes, response
   shapes. If the source is unavailable, inspect the running application. If
   neither is possible, say so and stop; a spec built on guessed selectors
   wastes more time than it saves.
3. **Existing specs in the same folder** — match their structure. A suite
   whose files each follow their own pattern costs every future reader.
4. **`src/helpers`, `src/data`** — polling, locking, generators already exist.

## Step 4 — Write it

Order of work:

1. **Extend the page object or client first**, if the spec needs a locator or
   route that does not exist. Locators in the constructor, methods named for
   what a user does, no assertions.
2. **Add a fixture** only if more than one spec needs the arrangement.
3. **Write the spec**: one behaviour per test, named as a sentence describing
   the behaviour.
4. **Put awkward data through a real journey** rather than writing a separate
   character-handling test.

For a cross-system spec, additionally: take the lock if the record is shared,
`expect.poll` with `syncPoll` and `pollRead` for the wait, and restore through
the same system you wrote through.

## Step 5 — Prove it can fail

**Non-negotiable, and the step that separates a real spec from a green
decoration.**

1. Run it. It passes.
2. Break the thing it checks: change the expected value, or point it at data
   that should not satisfy it.
3. Confirm it fails, **and read the failure message.** If the message would
   not tell a colleague at 7am what broke, improve it before moving on.
4. Put it back. Run again. It passes.

Then run it three times in a row. A test that passes twice and fails once is
not finished, and finding that out now is far cheaper than finding out from a
nightly run in two weeks.

## Step 6 — Check it will actually run

A test in a gate that cannot reach its dependencies is worse than no test,
because it reads as coverage.

- Does the layer it is in run in the gate you expect?
- If a new folder was added, does the pipeline's path filter include it?
- Does that gate hold the credentials and network access the test needs?

## Step 7 — Report

Say, per scenario:

- Which file and test covers it
- Which ones you did not automate, and why
- What the deliberate-failure check showed
- Anything the application needs before the rest can be automated: a missing
  test id, an unseeded record, an endpoint that does not exist

Be specific about what is *not* covered. A list of what was automated, with
the gaps left implicit, is how a team ends up believing a scenario is tested
when it never was.

## Checklist before handing back

- [ ] Imports come from `@fixtures`
- [ ] Every test has an oracle that could fail
- [ ] No ticket ids in titles or comments
- [ ] No `waitForTimeout`
- [ ] No hardcoded credentials, tokens or internal hostnames
- [ ] No `test.only` or stray `test.skip`
- [ ] Page objects contain no assertions
- [ ] Cleanup restores through the path the test wrote through
- [ ] At most one `@smoke` per endpoint or screen
- [ ] `npm run verify` passes
- [ ] Each new test has been seen to fail
