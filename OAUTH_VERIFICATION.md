# OAuth verification packet

## Requested scopes

Keep these values identical in `src/appsscript.json`, the OAuth consent screen,
and the Google Workspace Marketplace SDK.

### `https://www.googleapis.com/auth/documents.currentonly`

Doc Tag Index uses this scope only in the Google Doc where the user invokes the
add-on. It reads managed tag ranges and the document title, and it inserts or
removes visible tag text, named ranges, and bookmarks. It does not enumerate or
open other documents.

### `https://www.googleapis.com/auth/spreadsheets`

Doc Tag Index uses spreadsheet access to create a registry Sheet or open the
registry that the user explicitly identifies, read property definitions, and
write document/tag index rows and aggregate counts. The add-on does not list,
search, or inspect other spreadsheets. A current-spreadsheet scope cannot
support this workflow because the host is a Google Doc and the registry is a
separate Google Sheet.

This is a sensitive scope. If Google requires a narrower design, replace the
`SpreadsheetApp` storage layer with Advanced Sheets/Drive API calls and a
Google Picker flow using `drive.file`; do not merely change the manifest scope.

### `https://www.googleapis.com/auth/script.container.ui`

Doc Tag Index uses this scope to add its menu and display the sidebar and help
dialog inside the current Google Doc.

## Data-use declaration

The application uses Google Workspace data only to provide its visible tag and
registry features. It does not sell data, serve advertisements, build user
profiles, perform credit decisions, or train generalized AI/ML models. It does
not send document or registry content to developer-controlled servers.

## Demonstration video script

Record a single unlisted video using the exact production name, icon, OAuth
client, scopes, and deployed add-on:

1. Begin signed out or with the add-on authorization revoked.
2. Install/open Doc Tag Index and show the complete OAuth consent screen in
   English, including every requested scope.
3. Open the sidebar and show the per-document disclosure and affirmative
   consent checkbox.
4. Create a registry and show the new Google Sheet.
5. Create a Status property with Draft and Published options.
6. Insert both tags in the Doc and synchronize.
7. Show the Occurrences, Summary, and Documents tabs and follow a tag link back
   to the Doc.
8. Remove a tag, confirm the action, synchronize, and show its occurrence row
   is gone.
9. Delete the document's registry data and show that the document and
   occurrence rows are gone.
10. Show the public homepage, privacy policy, terms, support, and deletion page
    on the verified domain.
11. State that no data is sent to the developer or third parties and that no
    external account is required.

Do not edit the app name, logo, homepage, privacy URL, or scopes after approval
without checking whether OAuth re-verification is required.

