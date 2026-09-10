const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadCode(document) {
  const context = {
    encodeURIComponent,
    DocumentApp: {
      ElementType: { TEXT: 'TEXT' },
      TabType: { DOCUMENT_TAB: 'DOCUMENT_TAB' },
      getActiveDocument: () => document,
    },
  };
  vm.createContext(context);
  for (const filename of ['Core.js', 'Code.js']) {
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, '..', 'src', filename), 'utf8'),
      context,
      { filename }
    );
  }
  return context;
}

test('keeps the Tab wrapper while traversing nested document tabs', () => {
  const documentTabView = { getNamedRanges: () => [] };
  const child = {
    getType: () => 'DOCUMENT_TAB',
    getId: () => 't.child',
    asDocumentTab: () => documentTabView,
    getChildTabs: () => [],
  };
  const root = {
    getType: () => 'DOCUMENT_TAB',
    getId: () => 't.root',
    asDocumentTab: () => documentTabView,
    getChildTabs: () => [child],
  };
  const document = { getTabs: () => [root] };
  const context = loadCode(document);

  const tabs = context.dtiGetDocumentTabs_(document);
  assert.equal(tabs.length, 2);
  assert.equal(tabs[0], root);
  assert.equal(tabs[1], child);
});

test('scans an empty document using Tab.getId and DocumentTab content APIs', () => {
  const documentTabView = { getNamedRanges: () => [] };
  const tab = {
    getType: () => 'DOCUMENT_TAB',
    getId: () => 't.0',
    asDocumentTab: () => documentTabView,
    getChildTabs: () => [],
  };
  const document = {
    getId: () => 'document-id',
    getName: () => 'Test document',
    getTabs: () => [tab],
  };
  const context = loadCode(document);

  assert.deepEqual(
    Array.from(context.dtiScanCurrentDocument_({ byOptionId: {} })),
    []
  );
});

test('builds managed tag ranges from the exact inserted character span', () => {
  const context = loadCode({});
  const calls = [];
  const builtRange = {};
  const text = {};
  const builder = {
    addElement(...args) {
      calls.push(args);
      return this;
    },
    build: () => builtRange,
  };
  const documentTab = { newRange: () => builder };

  const result = context.dtiBuildTagRange_(documentTab, text, 15);

  assert.equal(result, builtRange);
  assert.deepEqual(calls, [[text, 0, 14]]);
});

test('deletes only the recorded tag characters without detaching text nodes', () => {
  const context = loadCode({});
  const calls = [];
  const text = {
    getText: () => 'Before [Status: Draft] after',
    deleteText: (start, end) => calls.push(['deleteText', start, end]),
    removeFromParent: () => calls.push(['removeFromParent']),
  };
  const rangeElement = {
    getElement: () => ({
      getType: () => 'TEXT',
      asText: () => text,
    }),
    isPartial: () => true,
    getStartOffset: () => 7,
    getEndOffsetInclusive: () => 21,
  };

  context.dtiDeleteRangeText_([rangeElement]);

  assert.deepEqual(calls, [['deleteText', 7, 21]]);
});

test('clears a whole-element legacy tag without removing its text node', () => {
  const context = loadCode({});
  const calls = [];
  const text = {
    getText: () => '[Status: Draft]',
    deleteText: (start, end) => calls.push(['deleteText', start, end]),
    removeFromParent: () => calls.push(['removeFromParent']),
  };
  const rangeElement = {
    getElement: () => ({
      getType: () => 'TEXT',
      asText: () => text,
    }),
    isPartial: () => false,
  };

  context.dtiDeleteRangeText_([rangeElement]);

  assert.deepEqual(calls, [['deleteText', 0, 14]]);
});

test('synchronization deletes stale occurrence rows and preserves first-seen time', () => {
  const document = { getId: () => 'd1' };
  const context = loadCode(document);
  const firstSeen = new Date('2026-01-01T00:00:00Z');
  const otherSeen = new Date('2026-01-02T00:00:00Z');
  const rows = [
    ['old-keep', 'd1', 'Old', 'url', 'tag-url', 't.0', 'p1', 'Status', 'o1', 'Draft', '[Status: Draft]', 'range1', 'bookmark1', firstSeen, firstSeen],
    ['old-delete', 'd1', 'Old', 'url', 'tag-url', 't.0', 'p1', 'Status', 'o2', 'Done', '[Status: Done]', 'range2', 'bookmark2', firstSeen, firstSeen],
    ['other', 'd2', 'Other', 'url2', 'tag-url2', 't.0', 'p1', 'Status', 'o1', 'Draft', '[Status: Draft]', 'range3', 'bookmark3', otherSeen, otherSeen],
  ];
  const sheet = {
    rows,
    getLastRow() { return this.rows.length + 1; },
    getMaxRows: () => 100,
    getMaxColumns: () => 20,
    getRange(row, column, rowCount) {
      const self = this;
      return {
        getValues: () => self.rows.slice(0, rowCount).map((item) => item.slice()),
        clearContent: () => { self.rows = []; },
        setValues: (values) => { self.rows = values.map((item) => item.slice()); },
        setShowHyperlink: () => {},
        setNumberFormat: () => {},
      };
    },
  };
  const spreadsheet = { getSheetByName: () => sheet };
  const now = new Date('2026-02-01T00:00:00Z');

  context.dtiUpsertOccurrences_(spreadsheet, document, [{
    occurrenceId: 'old-keep',
    documentId: 'd1',
    documentTitle: 'Updated',
    documentUrl: 'url',
    tagUrl: 'tag-url',
    tabId: 't.0',
    propertyId: 'p1',
    propertyName: 'Status',
    optionId: 'o1',
    optionName: 'Draft',
    tagText: '[Status: Draft]',
    namedRangeId: 'range1',
    bookmarkId: 'bookmark1',
  }], now);

  assert.equal(sheet.rows.length, 2);
  assert.equal(sheet.rows.some((row) => row[0] === 'old-delete'), false);
  assert.equal(sheet.rows.some((row) => row[0] === 'other'), true);
  const updated = sheet.rows.find((row) => row[0] === 'old-keep');
  assert.equal(updated[2], 'Updated');
  assert.equal(updated[13], firstSeen);
  assert.equal(updated[14], now);
});

test('migrates the legacy occurrence schema by deleting context and active columns', () => {
  const context = loadCode({});
  const removed = [];
  const sheet = {
    getLastRow: () => 2,
    getMaxColumns: () => 26,
    getRange: () => ({ getValues: () => [Array.from(context.DTI_LEGACY_OCCURRENCE_HEADERS)] }),
    deleteColumn: (column) => removed.push(column),
  };

  context.dtiMigrateOccurrenceSchema_(sheet);
  assert.deepEqual(removed, [17, 12]);
});
