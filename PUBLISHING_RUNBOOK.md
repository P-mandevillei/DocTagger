# DocTagger public publishing runbook

Follow these steps in order. Do not submit either review until the app name,
URLs, scopes, deployed version, screenshots, and demo video all represent the
same release.

## 1. Resolve the publisher-owned release blockers

1. The terms currently use **State of Missouri, United States** as the
   governing-law jurisdiction. Confirm that this remains your intended legal
   choice before submission.
2. The listing currently identifies the publisher as **Non-trader**. Confirm
   this remains accurate when entering the Marketplace SDK fields.
3. Verify `doctagger.org` as an owned **Domain property** through DNS using a
   Google account that is a Project Owner or Editor in the production Cloud
   project. A URL-prefix property is not the required DNS-level verification.
4. Configure the GitHub Pages repository's custom domain as `doctagger.org`.
   Keep `docs/CNAME` in the published branch, configure the required DNS records,
   and enable HTTPS after GitHub finishes validating the records.
5. Publish the updated `docs/` directory. Verify that all five pages display
   **DocTagger**, contain no bracketed placeholders, and load without login:
   - `https://doctagger.org/`
   - `https://doctagger.org/privacy.html`
   - `https://doctagger.org/terms.html`
   - `https://doctagger.org/support.html`
   - `https://doctagger.org/delete-data.html`

**Manual stop:** finish this section before entering URLs in Google Cloud.

## 2. Prepare one production Google Cloud project

1. In Google Cloud Console, create a standard project named **DocTagger** (or
   **DocTagger Production**). Use this project only for this Marketplace app.
2. Ensure the Google account that verified the production domain is a Project
   Owner or Editor. Add a second trusted owner if available.
3. Enable billing for the project, as required by Google's current OAuth
   publishing prerequisites.
4. Enable the **Google Workspace Marketplace SDK**. The script uses built-in
   Apps Script services and does not require you to create a separate web OAuth
   client.
5. Copy the project's numeric **Project number**.

## 3. Link and release the Apps Script project

1. Push the current `src/` content to the existing standalone Apps Script
   project. In the browser editor, JavaScript files display as `Code.gs`,
   `Core.gs`, and `Config.gs`; the local `.js` files contain their source.
   Preserve `Sidebar.html`, `Help.html`, and `appsscript.json`.
2. In Apps Script, open **Project Settings > Google Cloud Project > Change
   project**, enter the numeric production project number, and select **Set
   project**. Users who authorized the former Cloud project must reauthorize.
3. Confirm the script ID under **Project Settings > IDs** and record it.
4. Use **Deploy > Test deployments > Editor add-on** for final testing.
5. After tests pass, use **Deploy > New deployment > Add-on** and create a
   versioned deployment. Record the immutable version number shown under
   **Deploy > Manage deployments**.

## 4. Configure Google Auth Platform

Use the linked production Cloud project.

### Branding

- App name: **DocTagger**
- User support email: `charlie.l38324@gmail.com`
- Homepage: `https://doctagger.org/`
- Privacy policy: `https://doctagger.org/privacy.html`
- Terms: `https://doctagger.org/terms.html`
- Authorized domain: `doctagger.org`
- Developer contact: `charlie.l38324@gmail.com`
- Logo: `assets/icon-128.png`

Publish the Branding configuration. Google requires published brand approval
before Data Access verification can complete.

### Audience

- User type: **External**
- While testing, add every tester explicitly.
- Change publishing status to **In production** when the production evidence is
  ready. A consumer Gmail publisher can publish only publicly.

### Data Access

Enter exactly these scopes—no inferred extras:

- `https://www.googleapis.com/auth/documents.currentonly`
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/script.container.ui`

The same set must appear in `src/appsscript.json`, Google Auth Platform, and the
Marketplace SDK.

## 5. Configure the Marketplace SDK draft

In **APIs & Services > Google Workspace Marketplace SDK > App Configuration**:

1. Choose **Public** visibility. This choice cannot be changed after it is
   saved. Choose individual plus administrator installation so consumer users
   can install it and Workspace administrators can deploy it, unless you have a
   deliberate reason to restrict installation to administrators.
2. Select **Editor add-on** and **Google Docs** as the integration.
3. Enter the production Apps Script **script ID** and **version number**.
4. Enter the exact three OAuth scopes above.
5. Enter the developer identity, mailing address, EEA status, and public URLs
   from `MARKETPLACE_LISTING.md`.
6. If the console offers **Unlisted**, enable it only if installation should be
   limited to people who have the store URL. It is still a public, reviewed app.
7. Save the configuration as a draft.

## 6. Test the immutable release and collect evidence

1. Run every case in `REVIEW_TEST_PLAN.md` against the recorded version. Include
   a consumer Gmail account that is not a script collaborator and, if possible,
   a separate Workspace account.
2. Capture at least one real, full-bleed product screenshot. Recommended size:
   1280×800. The preferred set is documented in `MARKETPLACE_LISTING.md`.
3. Record one unlisted YouTube demonstration following
   `OAUTH_VERIFICATION.md`. Show the OAuth grant, in-product disclosure, tag
   workflow, registry output, deletion, and all public policy pages.
4. Re-run `tools/check_publish_readiness.py`; jurisdiction, EEA status, and the
   screenshot check should all pass.

## 7. Submit OAuth verification

1. Open **Google Auth Platform > Verification Center** for the production
   project.
2. Submit Branding first if it is not already approved and published.
3. Submit Data Access verification for the exact scope set. Paste the scope
   justifications from `OAUTH_VERIFICATION.md`, provide the unlisted demo video,
   and explain that user data stays in user-controlled Google Docs, Sheets, and
   Apps Script properties.
4. Respond to reviewer questions from the developer contact email. Do not edit
   the app name, logo, URLs, or scopes during review.

The requested scope set is sensitive rather than a design that intentionally
uses restricted scopes, so a third-party restricted-scope security assessment
is not expected. The Verification Center's classification is authoritative.

## 8. Complete and submit the Marketplace listing

In **Google Workspace Marketplace SDK > Store Listing**:

1. Paste the name and copy from `MARKETPLACE_LISTING.md`.
2. Choose **Productivity** and **Free of charge**.
3. Upload `assets/icon-32.png`, `assets/icon-128.png`,
   `assets/card-banner-220x140.png`, and the real screenshots.
4. Enter the final terms, privacy, support, setup/help, website, developer, and
   trader-status fields. Confirm no existing Marketplace app has the exact name
   **DocTagger**.
5. Add Gmail draft testers if the Draft Tester section is available, then
   install and test the draft listing.
6. Once OAuth verification is approved, select **Submit for review**. Public
   Marketplace review is separate from OAuth review; approval publishes the
   listing automatically.

## 9. After approval

Install DocTagger from its public listing with a non-developer account, create a
fresh registry, complete one end-to-end tag cycle, and verify that the consent
screen, sidebar, public links, and listing all use the same product name and
scope set.
