# Project BILLS v0.1.0-beta Release Checklist

## Before Tagging

- [ ] Run `npm install` from the `bills` directory.
- [ ] Run `npx tsc --noEmit` and confirm zero TypeScript errors.
- [ ] Run `npm run build` and confirm the production build succeeds.
- [ ] Run the 15-step guide in `BETA_TEST_PLAN.md` on a phone and desktop browser.
- [ ] Verify no API keys, service-account files, cookies, or environment secrets are in the release.
- [ ] Verify local invoice creation, payment recording, customer ledger, backup export, and safe restore.
- [ ] Review `git diff` and confirm only intended beta changes are included.

## Create the Beta Tag

Run these commands from the repository root after reviewing the changes:

```bash
git add .
git commit -m "chore: freeze v0.1.0-beta"
git tag v0.1.0-beta
```

Check the result:

```bash
git status
git show --stat --oneline v0.1.0-beta
```

Push the commit and tag only when the private beta is ready:

```bash
git push origin main
git push origin v0.1.0-beta
```

Do not commit `.env.local`, credentials, service-account JSON, or private backup exports.
