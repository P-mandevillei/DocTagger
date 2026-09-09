# Public publishing checklist

Items marked complete are implemented in this repository. Remaining items
require publisher identity, account access, a verified domain, or interaction
with Google consoles.

## Repository preparation

- [x] V8 runtime and explicit OAuth scopes
- [x] `onInstall()` and `onOpen()` menu lifecycle
- [x] Current-document-only Docs access
- [x] No Drive enumeration, external API calls, analytics, ads, or AI transfer
- [x] In-product data-use disclosure and affirmative user consent
- [x] No surrounding passage collection
- [x] Removed occurrences deleted rather than retained as inactive history
- [x] Formula-leading Sheet values neutralized
- [x] Confirmations for document-text deletion and existing-Sheet initialization
- [x] Explicit, confirmed migration for destructive pre-release schema cleanup
- [x] Per-document registry purge control
- [x] Google Editor add-on CSS package included
- [x] Help/privacy UI and external-link hooks
- [x] Public site, listing, OAuth, video, and test-plan drafts
- [x] Required icon and card-banner source files

## Manual publisher information

- [x] Replace publisher name, address, email, and public URL placeholders in
      `docs/` and `MARKETPLACE_LISTING.md`.
- [ ] Select an accurate EEA trader/non-trader status.
- [ ] Replace `[YOUR JURISDICTION]` in `docs/terms.html` after choosing the
      governing law; have the terms reviewed if appropriate.
- [x] Use a monitored support email that can receive external messages.
- [ ] Confirm “DocTagger” is not already used by another Marketplace listing.

## Verified public website

- [x] Publish `docs/` at `https://p-mandevillei.github.io/DocTagger/`.
- [x] Verify `https://p-mandevillei.github.io` in Google Search Console
      (publisher reported).
- [ ] Confirm the OAuth Verification Center recognizes the authorized domain
      as an owned **Domain property**. Current Google guidance says a URL-prefix
      property is insufficient; use a custom domain with DNS verification if
      Google doesn't accept the GitHub Pages host.
- [x] Confirm all five public pages return HTTP 200 without a login.
- [ ] Republish the current `docs/` directory; the live pages checked on
      September 8, 2026 still displayed the former product name.
- [x] Put the final public URLs in `src/Config.js`.
- [ ] Use those identical homepage/privacy/terms URLs in OAuth and Marketplace.

## Apps Script and Cloud project

- [ ] Create separate development and production standard Google Cloud projects.
- [ ] Push `src/` to the production standalone Apps Script project.
- [ ] Link the Apps Script project to the production Cloud project.
- [ ] Enable billing for the production Cloud project if Google requires it for
      verification or the enabled services.
- [ ] Enable the Google Workspace Marketplace SDK and required Google APIs.
- [ ] Configure the OAuth audience as External and publishing status as In production.
- [ ] Add the exact manifest scopes to OAuth Data Access.
- [ ] Enter the app name, icon, support email, verified homepage, privacy URL,
      terms URL, authorized domain, and developer contacts.
- [ ] Create a numbered Apps Script version and Editor add-on deployment.

## Verification and review evidence

- [ ] Complete every test in `REVIEW_TEST_PLAN.md` against the numbered version.
- [ ] Capture real 1280×800 screenshots from the production-branded version.
- [ ] Record the unlisted video described in `OAUTH_VERIFICATION.md`.
- [ ] Submit sensitive-scope OAuth verification and resolve all findings.
- [ ] Confirm the approved scopes exactly match manifest and Marketplace SDK.

## Marketplace listing and submission

- [ ] Configure Google Docs Editor add-on integration with the production script
      ID and version.
- [ ] Select Public visibility only after all settings are final; visibility is
      not reversible.
- [ ] Enable individual installation and administrator installation as intended.
- [ ] Enter the final copy from `MARKETPLACE_LISTING.md`.
- [ ] Upload 32×32 and 128×128 icons, the 220×140 card banner, and real screenshots.
- [ ] Enter accurate pricing, developer identity/address, support details, and
      trader status.
- [ ] Submit the public Marketplace listing for review and monitor the developer
      email for review findings.
