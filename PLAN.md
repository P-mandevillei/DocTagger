# Project plan

## Goal

Provide an Obsidian-Base-like property/tag layer for Google Docs in which
writers insert controlled tags and a shared Google Sheet records searchable,
countable occurrences with deep links.

## Implemented application

- [x] Apps Script Editor add-on and Docs sidebar
- [x] Registry creation and connection
- [x] Property and option creation
- [x] Standalone styled tags at the cursor
- [x] Stable named-range occurrence IDs
- [x] Bookmark-based deep links
- [x] Current-document sync and stale-occurrence deletion
- [x] Current-document tag list and removal
- [x] Occurrence and distinct-document summaries
- [x] Google Docs tab traversal
- [x] Pure-function tests and deployment guide
- [x] In-product data-use disclosure and affirmative user consent
- [x] User-controlled registry purge
- [x] Spreadsheet formula-injection protection
- [x] Public legal/support site templates and Marketplace submission packet
- [x] Marketplace icons and card banner

## Pilot checklist

1. Install a test deployment with at least two external Google accounts.
2. Test with at least two writers, ten documents, and 100 tag occurrences.
3. Verify concurrent insertion, duplicate document copies, nested Docs tabs,
   deleted tags, missing bookmarks, and revoked Sheet access.
4. Confirm the final OAuth scope list in the production Cloud project.
5. Gather feedback on tag appearance and property-management UX.

## Next milestones

### 1. Hardening

- Add an audit/repair action for missing bookmarks and malformed named ranges.
- Detect copied documents containing duplicate occurrence IDs and re-key them.
- Add definition editing, deactivation, and color-per-option controls.
- Add pagination/chunking when a registry grows beyond a few thousand rows.
- Add Apps Script integration tests in a dedicated test document.

### 2. Public distribution

- Configure a standard Google Cloud project and production OAuth consent
  screen.
- Publish the legal/support site on a verified domain and replace publisher
  placeholders.
- Complete live test evidence and capture accurate screenshots.
- Complete sensitive-scope OAuth verification and Marketplace review.

### 3. Optional scale features

- Hourly, chunked rebuild of registered documents.
- Drive Changes API/Cloud Run indexer for near-real-time synchronization.
- Passage annotations and multiple tags attached to one selection.
- Link-preview smart chips backed by a hosted tag resource.
- Sheet-side controls for filtered views and saved Base-like dashboards.
