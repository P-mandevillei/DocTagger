# Production review test plan

Run these tests against the numbered release version, not “latest code.” Record
the result, date, browser, Google account type, and any issue link.

## Installation and authorization

- [ ] Install with a consumer Google account that is not a script collaborator.
- [ ] Install with an external Google Workspace account, if available.
- [ ] Confirm the production app name, icon, and scopes match the listing.
- [ ] Confirm authorization occurs once and reinstall/revocation works.
- [ ] Confirm no unverified-app warning appears after OAuth approval.

## First-use disclosure

- [ ] A new user sees the disclosure before registry data is accessed.
- [ ] Continue is disabled until the checkbox is selected.
- [ ] Each collaborator sees the disclosure independently.
- [ ] Privacy, terms, support, and deletion links work and open separately.

## Core workflow

- [ ] Create a registry; confirm all four sheets and headers are correct.
- [ ] Connect a new blank Sheet after the modification warning.
- [ ] Add properties/options containing punctuation, Unicode, and 80 characters.
- [ ] Insert, list, follow, remove, and synchronize tags.
- [ ] Verify counts across at least two Docs and two users.
- [ ] Verify the current Doc title, tag values, links, and times are accurate.
- [ ] Confirm no surrounding passage text is written to the Sheet.
- [ ] Confirm removed/manual-deleted tags do not remain in occurrence history.
- [ ] Confirm a legacy registry is blocked until the user explicitly approves
      migration, and that cancellation leaves it unchanged.
- [ ] Test top-level and nested Google Docs tabs.

## Data safety and deletion

- [ ] Values beginning with `=`, `+`, `-`, or `@` remain literal Sheet text and
      never execute as formulas.
- [ ] Removing a tag requires confirmation.
- [ ] Connecting an existing Sheet requires confirmation.
- [ ] Purging a document removes its Occurrences and Documents rows, updates
      Summary, leaves visible tags intact, and clears its registry association.
- [ ] Disconnecting does not delete registry rows and accurately says so.
- [ ] Deleting the registry Sheet produces a useful recovery error.

## Permissions and error handling

- [ ] Read-only Doc, comment-only Doc, and missing cursor errors are actionable.
- [ ] Read-only or inaccessible registry errors are actionable.
- [ ] Two collaborators synchronizing at nearly the same time do not lose rows.
- [ ] Buttons cannot be triggered repeatedly while work is in progress.
- [ ] No default red-bar exception or uncaught JavaScript error is visible.

## Scale and presentation

- [ ] Test at least 100 tags across 10 Docs.
- [ ] Sidebar has no horizontal scrolling or clipped labels at standard width.
- [ ] A long current-tag list remains usable.
- [ ] Loading, success, cancellation, and failure states are visible.
- [ ] Icons are sharp and screenshots accurately show the released product.
