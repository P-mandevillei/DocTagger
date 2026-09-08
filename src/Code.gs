var DTI_USER_REGISTRY_KEY = 'DOC_TAG_INDEX_REGISTRY_ID';
var DTI_CONSENT_KEY = 'DOC_TAG_INDEX_DATA_USE_CONSENT_V1';
var DTI_MIGRATION_REQUIRED_PREFIX = 'DTI_MIGRATION_REQUIRED|';

var DTI_SHEET_NAMES = {
  properties: 'Properties',
  occurrences: 'Occurrences',
  summary: 'Summary',
  documents: 'Documents',
};

var DTI_HEADERS = {
  properties: [
    'Property ID', 'Property', 'Option ID', 'Option', 'Color', 'Active', 'Sort Order',
  ],
  occurrences: [
    'Occurrence ID', 'Document ID', 'Document Title', 'Document URL', 'Tag URL',
    'Tab ID', 'Property ID', 'Property', 'Option ID', 'Option', 'Tag Text',
    'Named Range ID', 'Bookmark ID', 'First Seen At', 'Last Seen At',
  ],
  summary: [
    'Property ID', 'Property', 'Option ID', 'Option', 'Tag Count',
    'Document Count', 'Last Seen At',
  ],
  documents: [
    'Document ID', 'Document Title', 'Document URL', 'Last Sync At', 'Tag Count', 'Status',
  ],
};

var DTI_LEGACY_OCCURRENCE_HEADERS = [
  'Occurrence ID', 'Document ID', 'Document Title', 'Document URL', 'Tag URL',
  'Tab ID', 'Property ID', 'Property', 'Option ID', 'Option', 'Tag Text',
  'Context', 'Named Range ID', 'Bookmark ID', 'First Seen At', 'Last Seen At',
  'Active',
];

function onOpen() {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem('Open sidebar', 'showDocTagSidebar')
    .addItem('Sync current document', 'syncCurrentDocumentFromMenu')
    .addSeparator()
    .addItem('Help and privacy', 'showDocTagHelp')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showDocTagSidebar() {
  var output = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Doc Tag Index');
  DocumentApp.getUi().showSidebar(output);
}

function showDocTagHelp() {
  var output = HtmlService.createHtmlOutputFromFile('Help')
    .setWidth(460)
    .setHeight(520);
  DocumentApp.getUi().showModalDialog(output, 'Doc Tag Index help and privacy');
}

function getSidebarState() {
  var response = {
    document: { id: '', title: 'Current document' },
    registry: null,
    properties: [],
    currentTags: [],
    needsConsent: !dtiHasDataUseConsent_(),
    links: getPublicLinks(),
  };

  if (response.needsConsent) {
    return response;
  }

  var doc = DocumentApp.getActiveDocument();
  response.document = { id: doc.getId(), title: doc.getName() };
  var registryId = dtiGetRegistryId_();

  if (!registryId) {
    response.currentTags = dtiScanCurrentDocument_({ byOptionId: {} }).map(dtiTagForSidebar_);
    return response;
  }

  try {
    var spreadsheet = dtiOpenRegistryById_(registryId);
    var definitions = dtiReadDefinitions_(spreadsheet, false);
    response.registry = {
      id: spreadsheet.getId(),
      name: spreadsheet.getName(),
      url: spreadsheet.getUrl(),
    };
    response.properties = definitions.properties;
    response.currentTags = dtiScanCurrentDocument_(definitions).map(dtiTagForSidebar_);
    return response;
  } catch (error) {
    var message = error.message || String(error);
    if (message.indexOf(DTI_MIGRATION_REQUIRED_PREFIX) !== -1) {
      response.migrationRequired = true;
      message = message.slice(
        message.indexOf(DTI_MIGRATION_REQUIRED_PREFIX) +
        DTI_MIGRATION_REQUIRED_PREFIX.length
      );
    }
    response.registryError = message;
    return response;
  }
}

function acceptDataUse() {
  PropertiesService.getUserProperties()
    .setProperty(DTI_CONSENT_KEY, 'accepted');
  return getSidebarState();
}

function createRegistry() {
  dtiRequireDataUseConsent_();
  var spreadsheet = SpreadsheetApp.create('Doc Tag Index Registry');
  dtiInitializeRegistry_(spreadsheet);
  dtiSetRegistryId_(spreadsheet.getId());
  return getSidebarState();
}

function connectRegistry(urlOrId) {
  dtiRequireDataUseConsent_();
  var id = dtiExtractGoogleFileId(urlOrId);
  var spreadsheet = dtiOpenRegistryById_(id, true);
  dtiSetRegistryId_(id);
  return getSidebarState();
}

function disconnectRegistry() {
  PropertiesService.getUserProperties().deleteProperty(DTI_USER_REGISTRY_KEY);
  var documentProperties = PropertiesService.getDocumentProperties();
  if (documentProperties) {
    documentProperties.deleteProperty(DTI_USER_REGISTRY_KEY);
  }
  return getSidebarState();
}

function savePropertyDefinition(propertyName, rawOptions, color) {
  dtiRequireDataUseConsent_();
  if (String(rawOptions || '').length > 10000) {
    throw new Error('Option input must be 10,000 characters or fewer.');
  }
  var name = dtiCleanLabel(propertyName, 'Property name');
  var options = dtiNormalizeOptions(rawOptions).map(function (option) {
    return dtiCleanLabel(option, 'Option name');
  });
  if (!options.length) {
    throw new Error('Add at least one option, separated by commas or line breaks.');
  }
  if (options.length > 100) {
    throw new Error('Add no more than 100 options at a time.');
  }

  var spreadsheet = dtiRequireRegistry_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var allDefinitions = dtiReadDefinitions_(spreadsheet, true);
    var existing = allDefinitions.properties.filter(function (property) {
      return property.name.toLocaleLowerCase() === name.toLocaleLowerCase();
    })[0];
    var propertyId = existing ? existing.id : dtiNewId_('p');
    var existingNames = {};
    if (existing) {
      existing.options.forEach(function (option) {
        existingNames[option.name.toLocaleLowerCase()] = true;
      });
    }

    var rows = [];
    var nextSort = dtiNextDefinitionSort_(allDefinitions.rawRows);
    options.forEach(function (optionName) {
      if (!existingNames[optionName.toLocaleLowerCase()]) {
        rows.push([
          propertyId,
          dtiSafeSheetText(name),
          dtiNewId_('o'),
          dtiSafeSheetText(optionName),
          dtiNormalizeColor(color),
          true,
          nextSort++,
        ]);
      }
    });
    if (!rows.length) {
      throw new Error('All of those options already exist for ' + name + '.');
    }

    var sheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES.properties);
    dtiEnsureSheetCapacity_(sheet, sheet.getLastRow() + rows.length, rows[0].length);
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    sheet.autoResizeColumns(1, DTI_HEADERS.properties.length);
  } finally {
    lock.releaseLock();
  }
  return getSidebarState();
}

function insertTag(propertyId, optionId) {
  dtiRequireDataUseConsent_();
  var spreadsheet = dtiRequireRegistry_();
  var definitions = dtiReadDefinitions_(spreadsheet, false);
  var option = definitions.byOptionId[optionId];
  if (!option || option.propertyId !== propertyId) {
    throw new Error('That property option is unavailable. Reload the sidebar and try again.');
  }

  var doc = DocumentApp.getActiveDocument();
  var cursor = doc.getCursor();
  if (!cursor) {
    throw new Error('Place the cursor in editable document text before inserting a tag.');
  }
  var documentTab = doc.getActiveTab().asDocumentTab();
  var bookmark = cursor.insertBookmark();
  var text = cursor.insertText(dtiBuildTagText(option.propertyName, option.name));
  if (!text) {
    if (bookmark) {
      bookmark.remove();
    }
    throw new Error('A tag cannot be inserted at this cursor position.');
  }

  text.setBackgroundColor(option.color)
    .setForegroundColor(dtiReadableTextColor_(option.color))
    .setBold(true);

  var occurrenceId = dtiNewId_('t');
  var rangeName = dtiEncodeManagedRange({
    occurrenceId: occurrenceId,
    propertyId: propertyId,
    optionId: optionId,
    bookmarkId: bookmark.getId(),
  });
  var range = documentTab.newRange().addElement(text).build();
  documentTab.addNamedRange(rangeName, range);

  var result = dtiSyncCurrentDocument_(spreadsheet, definitions);
  return {
    message: 'Inserted ' + text.getText() + ' and synchronized ' + result.tagCount + ' tag(s).',
    state: getSidebarState(),
  };
}

function removeTag(occurrenceId) {
  dtiRequireDataUseConsent_();
  var doc = DocumentApp.getActiveDocument();
  var tabs = dtiGetDocumentTabs_(doc);
  var removed = false;

  tabs.some(function (tab) {
    var documentTab = tab.asDocumentTab();
    return documentTab.getNamedRanges().some(function (namedRange) {
      var metadata = dtiParseManagedRange(namedRange.getName());
      if (!metadata || metadata.occurrenceId !== occurrenceId) {
        return false;
      }

      var elements = namedRange.getRange().getRangeElements().slice().reverse();
      namedRange.remove();
      elements.forEach(function (rangeElement) {
        var element = rangeElement.getElement();
        if (element.getType() !== DocumentApp.ElementType.TEXT) {
          return;
        }
        var text = element.asText();
        if (rangeElement.isPartial()) {
          text.deleteText(
            rangeElement.getStartOffset(),
            rangeElement.getEndOffsetInclusive()
          );
        } else {
          text.removeFromParent();
        }
      });

      var bookmark = documentTab.getBookmark(metadata.bookmarkId);
      if (bookmark) {
        bookmark.remove();
      }
      removed = true;
      return true;
    });
  });

  if (!removed) {
    throw new Error('The selected tag no longer exists. Reload the sidebar.');
  }

  var result = syncCurrentDocument();
  return {
    message: 'Tag removed. ' + result.tagCount + ' managed tag(s) remain.',
    state: getSidebarState(),
  };
}

function syncCurrentDocument() {
  dtiRequireDataUseConsent_();
  var spreadsheet = dtiRequireRegistry_();
  var definitions = dtiReadDefinitions_(spreadsheet, true);
  return dtiSyncCurrentDocument_(spreadsheet, definitions);
}

function syncCurrentDocumentFromMenu() {
  try {
    var result = syncCurrentDocument();
    DocumentApp.getUi().alert(
      'Doc Tag Index',
      result.message,
      DocumentApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    DocumentApp.getUi().alert(
      'Doc Tag Index',
      error.message || String(error),
      DocumentApp.getUi().ButtonSet.OK
    );
  }
}

function deleteCurrentDocumentData() {
  dtiRequireDataUseConsent_();
  var spreadsheet = dtiRequireRegistry_();
  var doc = DocumentApp.getActiveDocument();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var occurrenceSheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES.occurrences);
    var occurrenceRows = dtiReadRows_(
      occurrenceSheet,
      DTI_HEADERS.occurrences.length
    ).filter(function (row) {
      return String(row[1]) !== doc.getId();
    });
    dtiReplaceDataRows_(
      occurrenceSheet,
      occurrenceRows,
      DTI_HEADERS.occurrences.length
    );

    var documentSheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES.documents);
    var documentRows = dtiReadRows_(
      documentSheet,
      DTI_HEADERS.documents.length
    ).filter(function (row) {
      return String(row[0]) !== doc.getId();
    });
    dtiReplaceDataRows_(
      documentSheet,
      documentRows,
      DTI_HEADERS.documents.length
    );
    dtiRebuildSummary_(spreadsheet);

    var documentProperties = PropertiesService.getDocumentProperties();
    if (documentProperties) {
      documentProperties.deleteProperty(DTI_USER_REGISTRY_KEY);
    }
  } finally {
    lock.releaseLock();
  }
  return {
    message: 'Removed this document from the registry and deleted its indexed data.',
    state: getSidebarState(),
  };
}

function migrateLegacyRegistry() {
  dtiRequireDataUseConsent_();
  var id = dtiGetRegistryId_();
  if (!id) {
    throw new Error('No registry is connected to this document.');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var spreadsheet = SpreadsheetApp.openById(id);
    var occurrenceSheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES.occurrences);
    if (!dtiIsLegacyOccurrenceSheet_(occurrenceSheet)) {
      throw new Error('This registry does not need the pre-release schema migration.');
    }
    dtiMigrateOccurrenceSchema_(occurrenceSheet);
    dtiInitializeRegistry_(spreadsheet);
  } finally {
    lock.releaseLock();
  }
  return {
    message: 'Registry migrated. Legacy context excerpts and inactive-history flags were deleted.',
    state: getSidebarState(),
  };
}

function dtiSyncCurrentDocument_(spreadsheet, definitions) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var doc = DocumentApp.getActiveDocument();
    var occurrences = dtiScanCurrentDocument_(definitions);
    var now = new Date();
    dtiUpsertOccurrences_(spreadsheet, doc, occurrences, now);
    dtiUpsertDocument_(spreadsheet, doc, occurrences.length, now);
    dtiRebuildSummary_(spreadsheet);
    return {
      ok: true,
      tagCount: occurrences.length,
      registryUrl: spreadsheet.getUrl(),
      message: 'Synchronized ' + occurrences.length + ' managed tag(s).',
    };
  } finally {
    lock.releaseLock();
  }
}

function dtiScanCurrentDocument_(definitions) {
  var doc = DocumentApp.getActiveDocument();
  var documentId = doc.getId();
  var documentUrl = dtiBuildDocumentUrl(documentId);
  var tags = [];

  dtiGetDocumentTabs_(doc).forEach(function (tab) {
    var tabId = tab.getId();
    var documentTab = tab.asDocumentTab();
    documentTab.getNamedRanges().forEach(function (namedRange) {
      var metadata = dtiParseManagedRange(namedRange.getName());
      if (!metadata) {
        return;
      }
      var range = namedRange.getRange();
      var text = dtiReadRangeText_(range).trim();
      if (!text) {
        return;
      }
      var definition = definitions.byOptionId[metadata.optionId];
      var parsedDisplay = dtiParseDisplayTag(text) || {};
      var bookmark = documentTab.getBookmark(metadata.bookmarkId);
      var propertyName = definition
        ? definition.propertyName
        : (parsedDisplay.propertyName || 'Unknown property');
      var optionName = definition
        ? definition.name
        : (parsedDisplay.optionName || 'Unknown option');
      tags.push({
        occurrenceId: metadata.occurrenceId,
        documentId: documentId,
        documentTitle: doc.getName(),
        documentUrl: documentUrl,
        tagUrl: dtiBuildTagUrl(documentId, tabId, bookmark ? metadata.bookmarkId : ''),
        tabId: tabId,
        propertyId: metadata.propertyId,
        propertyName: propertyName,
        optionId: metadata.optionId,
        optionName: optionName,
        tagText: text,
        namedRangeId: namedRange.getId(),
        bookmarkId: metadata.bookmarkId,
        active: true,
      });
    });
  });

  return tags;
}

function dtiGetDocumentTabs_(doc) {
  var result = [];
  var roots = typeof doc.getTabs === 'function' ? doc.getTabs() : [doc.getActiveTab()];

  function visit(tab) {
    if (tab.getType() === DocumentApp.TabType.DOCUMENT_TAB) {
      // Keep the Tab wrapper: getId() belongs to Tab, while document content,
      // named ranges, and bookmarks belong to its DocumentTab view.
      result.push(tab);
    }
    if (typeof tab.getChildTabs === 'function') {
      tab.getChildTabs().forEach(visit);
    }
  }

  roots.forEach(visit);
  return result;
}

function dtiReadRangeText_(range) {
  return range.getRangeElements().map(function (rangeElement) {
    var element = rangeElement.getElement();
    if (element.getType() !== DocumentApp.ElementType.TEXT) {
      return '';
    }
    var value = element.asText().getText();
    return rangeElement.isPartial()
      ? value.slice(rangeElement.getStartOffset(), rangeElement.getEndOffsetInclusive() + 1)
      : value;
  }).join('');
}

function dtiTagForSidebar_(tag) {
  return {
    occurrenceId: tag.occurrenceId,
    propertyName: tag.propertyName,
    optionName: tag.optionName,
    tagText: tag.tagText,
    tagUrl: tag.tagUrl,
  };
}

function dtiUpsertOccurrences_(spreadsheet, doc, occurrences, now) {
  var sheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES.occurrences);
  var width = DTI_HEADERS.occurrences.length;
  var existingRows = dtiReadRows_(sheet, width);
  var previousForDocument = {};
  var replacementRows = [];

  existingRows.forEach(function (row) {
    if (String(row[1]) === doc.getId()) {
      previousForDocument[String(row[0])] = row;
    } else {
      replacementRows.push(row);
    }
  });

  occurrences.forEach(function (occurrence) {
    var previous = previousForDocument[occurrence.occurrenceId];
    var firstSeen = previous && previous[13] ? previous[13] : now;
    replacementRows.push([
      occurrence.occurrenceId,
      occurrence.documentId,
      dtiSafeSheetText(occurrence.documentTitle),
      occurrence.documentUrl,
      occurrence.tagUrl,
      occurrence.tabId,
      occurrence.propertyId,
      dtiSafeSheetText(occurrence.propertyName),
      occurrence.optionId,
      dtiSafeSheetText(occurrence.optionName),
      dtiSafeSheetText(occurrence.tagText),
      occurrence.namedRangeId,
      occurrence.bookmarkId,
      firstSeen,
      now,
    ]);
  });

  dtiReplaceDataRows_(sheet, replacementRows, width);
  if (replacementRows.length) {
    sheet.getRange(2, 4, replacementRows.length, 2).setShowHyperlink(true);
    sheet.getRange(2, 14, replacementRows.length, 2).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  }
}

function dtiUpsertDocument_(spreadsheet, doc, tagCount, now) {
  var sheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES.documents);
  var width = DTI_HEADERS.documents.length;
  var rows = dtiReadRows_(sheet, width);
  var index = -1;
  rows.some(function (row, rowIndex) {
    if (String(row[0]) === doc.getId()) {
      index = rowIndex;
      return true;
    }
    return false;
  });
  var replacement = [
    doc.getId(),
    dtiSafeSheetText(doc.getName()),
    dtiBuildDocumentUrl(doc.getId()),
    now,
    tagCount,
    'Synchronized',
  ];
  if (index === -1) {
    rows.push(replacement);
  } else {
    rows[index] = replacement;
  }
  dtiEnsureSheetCapacity_(sheet, rows.length + 1, width);
  sheet.getRange(2, 1, rows.length, width).setValues(rows);
  sheet.getRange(2, 3, rows.length, 1).setShowHyperlink(true);
  sheet.getRange(2, 4, rows.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
}

function dtiRebuildSummary_(spreadsheet) {
  var occurrenceSheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES.occurrences);
  var rows = dtiReadRows_(occurrenceSheet, DTI_HEADERS.occurrences.length);
  var occurrences = rows.map(function (row) {
    return {
      documentId: String(row[1]),
      propertyId: String(row[6]),
      propertyName: dtiReadSheetText(row[7]),
      optionId: String(row[8]),
      optionName: dtiReadSheetText(row[9]),
      lastSeenAt: row[14],
      active: true,
    };
  });
  var summaryRows = dtiAggregateOccurrences(occurrences).map(function (summary) {
    return [
      summary.propertyId,
      dtiSafeSheetText(summary.propertyName),
      summary.optionId,
      dtiSafeSheetText(summary.optionName),
      summary.occurrenceCount,
      summary.documentCount,
      summary.lastSeenAt,
    ];
  });
  var summarySheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES.summary);
  var existing = Math.max(summarySheet.getLastRow() - 1, 0);
  if (existing) {
    summarySheet.getRange(2, 1, existing, DTI_HEADERS.summary.length).clearContent();
  }
  if (summaryRows.length) {
    dtiEnsureSheetCapacity_(
      summarySheet,
      summaryRows.length + 1,
      DTI_HEADERS.summary.length
    );
    summarySheet.getRange(2, 1, summaryRows.length, DTI_HEADERS.summary.length)
      .setValues(summaryRows);
    summarySheet.getRange(2, 7, summaryRows.length, 1)
      .setNumberFormat('yyyy-mm-dd hh:mm:ss');
  }
}

function dtiReadDefinitions_(spreadsheet, includeInactive) {
  var sheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES.properties);
  var rows = dtiReadRows_(sheet, DTI_HEADERS.properties.length);
  var byPropertyId = {};
  var byOptionId = {};

  rows.forEach(function (row) {
    var propertyId = String(row[0] || '').trim();
    var propertyName = dtiReadSheetText(row[1]).trim();
    var optionId = String(row[2] || '').trim();
    var optionName = dtiReadSheetText(row[3]).trim();
    var active = row[5] !== false && String(row[5]).toUpperCase() !== 'FALSE';
    if (!propertyId || !propertyName || !optionId || !optionName || (!includeInactive && !active)) {
      return;
    }
    if (!byPropertyId[propertyId]) {
      byPropertyId[propertyId] = {
        id: propertyId,
        name: propertyName,
        options: [],
      };
    }
    var option = {
      id: optionId,
      name: optionName,
      color: dtiNormalizeColor(row[4]),
      active: active,
      propertyId: propertyId,
      propertyName: propertyName,
      sortOrder: Number(row[6]) || 0,
    };
    byPropertyId[propertyId].options.push(option);
    byOptionId[optionId] = option;
  });

  var properties = Object.keys(byPropertyId).map(function (id) {
    var property = byPropertyId[id];
    property.options.sort(function (left, right) {
      return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
    });
    return property;
  }).sort(function (left, right) {
    return left.name.localeCompare(right.name);
  });

  return { properties: properties, byOptionId: byOptionId, rawRows: rows };
}

function dtiInitializeRegistry_(spreadsheet) {
  dtiValidateRegistrySheets_(spreadsheet);
  if (dtiRegistryNeedsMigration_(spreadsheet)) {
    throw new Error(
      DTI_MIGRATION_REQUIRED_PREFIX +
      'This pre-release registry contains legacy context excerpts. Back up the Sheet, then use ' +
      'the migration action to delete those excerpts and update the schema.'
    );
  }
  var firstSheet = spreadsheet.getSheets()[0];
  if (!spreadsheet.getSheetByName(DTI_SHEET_NAMES.properties) &&
      spreadsheet.getSheets().length === 1 &&
      firstSheet.getLastRow() === 0) {
    firstSheet.setName(DTI_SHEET_NAMES.properties);
  }

  Object.keys(DTI_SHEET_NAMES).forEach(function (key) {
    var name = DTI_SHEET_NAMES[key];
    var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
    dtiEnsureHeaders_(sheet, DTI_HEADERS[key]);
    dtiNeutralizeManagedFormulas_(sheet, key);
  });

  var propertiesSheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES.properties);
  propertiesSheet.getRange('A1').setNote(
    'One row per option. Keep IDs stable. Use Active=FALSE to retire an option.'
  );
  var occurrenceSheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES.occurrences);
  occurrenceSheet.getRange('A1').setNote('Managed by Doc Tag Index; do not edit rows manually.');
  spreadsheet.getSheetByName(DTI_SHEET_NAMES.summary)
    .getRange('A1').setNote('Rebuilt automatically during synchronization.');
}

function dtiRegistryNeedsMigration_(spreadsheet) {
  return dtiIsLegacyOccurrenceSheet_(
    spreadsheet.getSheetByName(DTI_SHEET_NAMES.occurrences)
  );
}

function dtiIsLegacyOccurrenceSheet_(sheet) {
  if (!sheet || sheet.getLastRow() < 1 ||
      sheet.getMaxColumns() < DTI_LEGACY_OCCURRENCE_HEADERS.length) {
    return false;
  }
  var current = sheet
    .getRange(1, 1, 1, DTI_LEGACY_OCCURRENCE_HEADERS.length)
    .getValues()[0];
  return current.join('\u0000') === DTI_LEGACY_OCCURRENCE_HEADERS.join('\u0000');
}

function dtiValidateRegistrySheets_(spreadsheet) {
  Object.keys(DTI_SHEET_NAMES).forEach(function (key) {
    var sheet = spreadsheet.getSheetByName(DTI_SHEET_NAMES[key]);
    if (!sheet || sheet.getLastRow() < 1) {
      return;
    }
    var expected = DTI_HEADERS[key];
    var width = key === 'occurrences'
      ? Math.max(expected.length, DTI_LEGACY_OCCURRENCE_HEADERS.length)
      : expected.length;
    if (sheet.getMaxColumns() < width) {
      width = sheet.getMaxColumns();
    }
    var current = sheet.getRange(1, 1, 1, width).getValues()[0];
    var currentExpected = current.slice(0, expected.length).join('\u0000') ===
      expected.join('\u0000');
    var currentLegacy = key === 'occurrences' &&
      current.slice(0, DTI_LEGACY_OCCURRENCE_HEADERS.length).join('\u0000') ===
      DTI_LEGACY_OCCURRENCE_HEADERS.join('\u0000');
    if (!currentExpected && !currentLegacy) {
      throw new Error(
        'The "' + sheet.getName() + '" sheet already exists but is not a ' +
        'compatible Doc Tag Index sheet. Choose a dedicated registry Sheet.'
      );
    }
  });
}

function dtiEnsureHeaders_(sheet, headers) {
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }
  var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var hasValues = current.some(function (value) { return value !== ''; });
  if (hasValues && current.join('\u0000') !== headers.join('\u0000')) {
    throw new Error(
      'The "' + sheet.getName() + '" sheet exists but its header row does not match Doc Tag Index.'
    );
  }
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground('#1F4E78')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function dtiMigrateOccurrenceSchema_(sheet) {
  if (!dtiIsLegacyOccurrenceSheet_(sheet)) {
    return;
  }
  // Remove the former Active column first, then the stored context excerpt.
  // This intentionally deletes legacy passage excerpts during the privacy
  // migration while preserving tag identifiers and timestamps.
  sheet.deleteColumn(17);
  sheet.deleteColumn(12);
}

function dtiNeutralizeManagedFormulas_(sheet, key) {
  var columnsBySheet = {
    properties: [2, 4],
    occurrences: [3, 8, 10, 11],
    summary: [2, 4],
    documents: [2, 6],
  };
  var columns = columnsBySheet[key] || [];
  var rowCount = sheet.getLastRow() - 1;
  if (rowCount < 1) {
    return;
  }
  columns.forEach(function (column) {
    var range = sheet.getRange(2, column, rowCount, 1);
    var formulas = range.getFormulas();
    var values = range.getValues();
    var changed = false;
    formulas.forEach(function (row, index) {
      if (row[0]) {
        values[index][0] = dtiSafeSheetText(row[0]);
        changed = true;
      }
    });
    if (changed) {
      range.setValues(values);
    }
  });
}

function dtiOpenRegistryById_(id, allowLegacyMigrationPrompt) {
  try {
    var spreadsheet = SpreadsheetApp.openById(id);
    if (allowLegacyMigrationPrompt) {
      dtiValidateRegistrySheets_(spreadsheet);
      if (dtiRegistryNeedsMigration_(spreadsheet)) {
        return spreadsheet;
      }
    }
    dtiInitializeRegistry_(spreadsheet);
    return spreadsheet;
  } catch (error) {
    if ((error.message || '').indexOf(DTI_MIGRATION_REQUIRED_PREFIX) === 0) {
      throw error;
    }
    throw new Error(
      'The registry could not be opened. Check the Sheet ID and your edit access. ' +
      (error.message || String(error))
    );
  }
}

function dtiRequireRegistry_() {
  var id = dtiGetRegistryId_();
  if (!id) {
    throw new Error('Create or connect a registry spreadsheet first.');
  }
  return dtiOpenRegistryById_(id);
}

function dtiGetRegistryId_() {
  var documentProperties = PropertiesService.getDocumentProperties();
  return documentProperties
    ? documentProperties.getProperty(DTI_USER_REGISTRY_KEY)
    : null;
}

function dtiSetRegistryId_(id) {
  var documentProperties = PropertiesService.getDocumentProperties();
  if (documentProperties) {
    documentProperties.setProperty(DTI_USER_REGISTRY_KEY, id);
  }
  // Clean up the pre-release user-wide default, which could silently connect
  // unrelated documents to the last registry used.
  PropertiesService.getUserProperties().deleteProperty(DTI_USER_REGISTRY_KEY);
}

function dtiHasDataUseConsent_() {
  return PropertiesService.getUserProperties().getProperty(DTI_CONSENT_KEY) === 'accepted';
}

function dtiRequireDataUseConsent_() {
  if (!dtiHasDataUseConsent_()) {
    throw new Error(
      'Review and accept the data-use disclosure in the sidebar before continuing.'
    );
  }
}

function dtiReadRows_(sheet, width) {
  var count = sheet.getLastRow() - 1;
  return count > 0 ? sheet.getRange(2, 1, count, width).getValues() : [];
}

function dtiReplaceDataRows_(sheet, rows, width) {
  var existingCount = Math.max(sheet.getLastRow() - 1, 0);
  if (existingCount) {
    sheet.getRange(2, 1, existingCount, width).clearContent();
  }
  if (rows.length) {
    dtiEnsureSheetCapacity_(sheet, rows.length + 1, width);
    sheet.getRange(2, 1, rows.length, width).setValues(rows);
  }
}

function dtiEnsureSheetCapacity_(sheet, requiredRows, requiredColumns) {
  if (sheet.getMaxRows() < requiredRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), requiredRows - sheet.getMaxRows());
  }
  if (sheet.getMaxColumns() < requiredColumns) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      requiredColumns - sheet.getMaxColumns()
    );
  }
}

function dtiNewId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '');
}

function dtiNextDefinitionSort_(rows) {
  return rows.reduce(function (maximum, row) {
    return Math.max(maximum, Number(row[6]) || 0);
  }, 0) + 1;
}

function dtiReadableTextColor_(background) {
  var hex = dtiNormalizeColor(background).slice(1);
  var red = parseInt(hex.slice(0, 2), 16);
  var green = parseInt(hex.slice(2, 4), 16);
  var blue = parseInt(hex.slice(4, 6), 16);
  var luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance >= 145 ? '#202124' : '#FFFFFF';
}
