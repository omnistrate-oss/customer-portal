## Summary

<!-- What does this change and why? Link the issue if there is one. -->

## How it was tested

<!-- Commands you ran, pages you checked, and before/after screenshots for UI changes. -->

## Checklist

- [ ] One concern per pull request; no unrelated refactors or formatting changes.
- [ ] `yarn lint`, `yarn typecheck`, `yarn check:guardrails --base origin/master` and `yarn build` pass.
- [ ] UI changes include before/after screenshots and follow `.agents/skills/ui-and-styling/SKILL.md` (shared components, theme colors, white-label safe).
- [ ] New or changed Playwright specs are discovered (`yarn check:playwright-discovery`) and ship with recorded HAR files.
- [ ] Changes to shared components, `src/api/`, `next.config.js`, `tsconfig.json`, `package.json`, workflows or the HAR submodule pointer are listed above.
- [ ] Regenerated API types are in their own pull request.
- [ ] No entries added to `eslint.migration-allowlists.cjs` and no `eslint-disable` for guardrail rules.
