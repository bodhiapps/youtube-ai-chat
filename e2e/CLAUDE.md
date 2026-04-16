# e2e test guidelines

## No timeouts

Do not introduce sleeps, `waitForTimeout`, or per-call `timeout: N` hacks to paper over flakiness. They hide real issues (slow code paths, wrong element, missing state) and slow every run by the hardcoded amount. The API models we use in tests (`gpt-4.1-nano`, etc.) are small and fast — any legitimate wait is sub-second.

Instead:

- **Use Playwright's auto-waiting primitives.** `locator.waitFor()`, `expect(...).toBeVisible()`, `expect(...).toHaveAttribute(...)` all poll deterministically and fail with a clear message when the condition can't be satisfied in the suite's default timeout.
- **Race on state, not on time.** When either of two outcomes is acceptable (e.g. `clientReady` badge _or_ setup overlay), use `locator.or(otherLocator).first().waitFor()` — resolves the instant either one is true.
- **Make the UI testing-friendly.** If you can't express "wait until the app finished X" via an existing DOM condition, add a `data-testid` / `data-teststate` attribute that bubbles the internal state up to the DOM. Then wait on that attribute deterministically. This is almost always the right fix for a would-be `sleep(2000)`.

## No `page.evaluate` for assertions or interactions

Interact only through the UI surface — click buttons, fill inputs, read visible text. `page.evaluate` turns a black-box test into a white-box one and couples the test to internal module shape. Use it only for rare debugging (console instrumentation) and never in committed test code.

## No if/else in tests

Tests must be deterministic. Never branch on "maybe the modal is there", "maybe the user is already logged in", "maybe the model list already loaded". Branches create two untested code paths: sometimes one runs, sometimes the other, and the failures don't reproduce.

If a condition varies between runs, the test isn't set up right — fix the setup instead of branching. Examples:

- Don't `if (await overlay.isVisible()) walkModal()`. Decide upfront whether the modal appears (e.g. start every test from a clean browser context) and always walk it — or never walk it.
- Don't `if (alreadyLoggedIn) skip()`. Arrange the test so the precondition is always the same.
- Don't `try { ... } catch { return; }` — that is an if/else in disguise.

Race conditions where _either_ outcome is acceptable (rare) should use `locator.or(...)` so Playwright waits on both conditions simultaneously without branching in JS.
