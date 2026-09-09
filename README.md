# DocTagger

DocTagger is a Google Docs Editor add-on that inserts structured, visible
tags into a document and indexes every tag occurrence in a central Google
Sheet.

The initial implementation deliberately uses standalone tags because they are
the smallest reliable format in Google Docs. A tag such as
`[Status: Draft]` is:

- readable even when the add-on is not installed;
- wrapped in a Google Docs named range so it can be found after nearby edits;
- anchored by a bookmark so the registry can link to its exact location; and
- assigned a stable occurrence ID for counting and reconciliation.

## Features

- Create or connect a central registry spreadsheet.
- Remember the connected registry on the document, so collaborators who install
  the same add-on inherit the document's registry after accepting the add-on's
  data-use disclosure.
- Define properties and their allowed options from the Docs sidebar.
- Insert a styled property tag at the current cursor position.
- List and remove managed tags in the current document.
- Synchronize the current document without scanning the user's entire Drive.
- Count tag occurrences and distinct documents by property and option.
- Link from the registry to a document or directly to a tag bookmark.
- Remove stale occurrence rows when tag text is deleted and synchronized.
- Handle Google Docs tabs and nested tabs.
- Purge the current document's indexed data from the registry.
- Neutralize formula-leading text before writing user-controlled values to Sheets.

## Registry layout

The add-on owns four sheets:

- **Properties**: one row per allowed option.
- **Occurrences**: one row per managed tag occurrence. This sheet is managed by
  the add-on and should not be edited manually.
- **Summary**: occurrence and distinct-document counts.
- **Documents**: registered documents and their last synchronization status.

Property definitions can be added from the sidebar. Advanced users may edit
the `Properties` sheet directly, but IDs must remain stable and unique and the
name fields are plain text rather than formulas.

## Install a test deployment

1. Create a standalone project at <https://script.google.com/>.
2. Copy the files from `src/` into the project, preserving their names. The
   manifest must be named `appsscript.json`.
3. In **Project Settings**, enable display of the manifest file if necessary.
4. Choose **Deploy > Test deployments**, select **Editor add-on**, and install
   the deployment for Google Docs.
5. Open or refresh a Google Doc, then choose
   **Extensions > DocTagger > Open sidebar**.
6. Create a new registry or connect an existing Google Sheet.

Share the registry Sheet with the same writers who will synchronize tags. The
registry association is saved on the document for other add-on users, but it
does not grant them access to the Sheet automatically.

Google asks for authorization to modify the current document and access
spreadsheets. The app does not request permission to scan all Drive files. The
spreadsheet scope is sensitive and requires OAuth verification before a public
release.

## Prepare a public release

Start with [PUBLISHING_RUNBOOK.md](PUBLISHING_RUNBOOK.md) for the ordered
release procedure and use [PUBLISHING_CHECKLIST.md](PUBLISHING_CHECKLIST.md)
to track completion. The repository
also contains:

- [MARKETPLACE_LISTING.md](MARKETPLACE_LISTING.md), with listing copy and asset
  requirements;
- [OAUTH_VERIFICATION.md](OAUTH_VERIFICATION.md), with scope justifications and
  a verification-video script;
- [REVIEW_TEST_PLAN.md](REVIEW_TEST_PLAN.md), for production manual testing;
- `docs/`, containing the GitHub Pages homepage, privacy, terms, support, and deletion-page
  templates; and
- `assets/`, containing icons and the Marketplace card banner.

The public site is configured for <https://doctagger.org/>. Before submission,
publish the current `docs/` files and verify `doctagger.org` as an authorized,
owned Domain property. The final URLs are stored in `src/Config.js`.

Existing pre-release registries use an older Occurrences schema that stored a
context excerpt and inactive-history flag. The updated sidebar requires an
explicit, confirmed migration. Make a backup first if that historical data is
needed; migration deletes those two legacy columns.

### Optional `clasp` workflow

Copy `.clasp.json.example` to `.clasp.json`, replace the placeholder with the
Apps Script project ID, install Google's `clasp` CLI, and run:

```text
clasp push
clasp open
```

## Typical workflow

1. In the sidebar, enter a property name such as `Status` and comma- or
   line-separated options such as `Draft, Reviewed, Published`.
2. Select a property and option, place the cursor in the document, and click
   **Insert tag**.
3. Click **Sync current document** after manual edits or deletions.
4. Open the registry to filter occurrence rows or inspect the generated
   summary.

Deleting a visible tag directly in Docs is supported: the next synchronization
deletes its occurrence row. Using the sidebar's Remove button also removes its
named range and bookmark after confirmation.

## Development

The code is plain Apps Script JavaScript. Pure parsing and aggregation helpers
live in `src/Core.js` and are exercised with Node's built-in test runner:

```text
node --test tests/core.test.js
```

No third-party runtime dependencies are required.

## Current limitations

- Synchronization is explicit; Google Docs does not provide a normal content
  edit trigger comparable to the Sheets `onEdit` trigger.
- Only tags inserted by this add-on are indexed. Text that merely resembles a
  tag is ignored.
- The add-on creates real bookmarks. Removing a bookmark manually can make an
  occurrence link fall back to the document rather than the exact tag.
- Bulk/background registry rebuilds are intentionally out of scope for this
  least-privilege release.
- The current spreadsheet storage design uses the sensitive `spreadsheets`
  scope and therefore requires OAuth verification for public distribution.
- Public website publication, domain verification, live integration tests,
  real screenshots, a verification video, and Google review are manual steps.

See [PLAN.md](PLAN.md) for the delivery and publication plan.
