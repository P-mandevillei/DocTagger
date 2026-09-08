const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'Core.gs'), 'utf8');
const context = { encodeURIComponent };
vm.createContext(context);
vm.runInContext(source, context, { filename: 'Core.gs' });

test('extracts an ID from a Sheets URL', () => {
  assert.equal(
    context.dtiExtractGoogleFileId(
      'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit'
    ),
    '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789'
  );
});

test('rejects an invalid Sheet reference', () => {
  assert.throws(() => context.dtiExtractGoogleFileId('not a sheet'), /valid Google Sheet/);
});

test('normalizes comma and line separated options', () => {
  const actual = Array.from(context.dtiNormalizeOptions('Draft, Reviewed\ndraft, Published'));
  assert.deepEqual(actual, ['Draft', 'Reviewed', 'Published']);
});

test('builds readable tags and rejects structural delimiters', () => {
  assert.equal(context.dtiBuildTagText('Status', 'Draft'), '[Status: Draft]');
  assert.equal(context.dtiBuildTagText('Topic\nName', 'One'), '[Topic Name: One]');
});

test('neutralizes spreadsheet formula prefixes and restores display text', () => {
  for (const value of ['=IMPORTXML("https://example.com")', '+1', '-1', '@SUM(A1:A2)']) {
    const safe = context.dtiSafeSheetText(value);
    assert.notEqual(safe[0], value[0]);
    assert.equal(context.dtiReadSheetText(safe), value);
  }
  assert.equal(context.dtiSafeSheetText('Draft'), 'Draft');
  assert.equal(context.dtiReadSheetText('Draft'), 'Draft');
});

test('round-trips managed named-range metadata', () => {
  const parts = {
    occurrenceId: 't_123',
    propertyId: 'p_456',
    optionId: 'o_789',
    bookmarkId: 'id.bookmark',
  };
  const name = context.dtiEncodeManagedRange(parts);
  assert.deepEqual({ ...context.dtiParseManagedRange(name) }, parts);
  assert.equal(context.dtiParseManagedRange('someone-elses-range'), null);
});

test('creates document and exact-tag URLs', () => {
  assert.equal(
    context.dtiBuildTagUrl('doc id', 't.0', 'id.abc'),
    'https://docs.google.com/document/d/doc%20id/edit?tab=t.0#bookmark=id.abc'
  );
});

test('aggregates active occurrences and distinct documents', () => {
  const rows = [
    {
      documentId: 'd1', propertyId: 'p1', propertyName: 'Status',
      optionId: 'o1', optionName: 'Draft', active: true, lastSeenAt: '2026-01-01',
    },
    {
      documentId: 'd1', propertyId: 'p1', propertyName: 'Status',
      optionId: 'o1', optionName: 'Draft', active: true, lastSeenAt: '2026-01-02',
    },
    {
      documentId: 'd2', propertyId: 'p1', propertyName: 'Status',
      optionId: 'o1', optionName: 'Draft', active: true, lastSeenAt: '2026-01-03',
    },
    {
      documentId: 'd3', propertyId: 'p1', propertyName: 'Status',
      optionId: 'o2', optionName: 'Published', active: false, lastSeenAt: '2026-01-04',
    },
  ];
  const result = Array.from(context.dtiAggregateOccurrences(rows), (item) => ({ ...item }));
  assert.deepEqual(result, [{
    propertyId: 'p1',
    propertyName: 'Status',
    optionId: 'o1',
    optionName: 'Draft',
    occurrenceCount: 3,
    documentCount: 2,
    lastSeenAt: '2026-01-03',
  }]);
});
