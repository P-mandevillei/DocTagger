/**
 * Pure helpers shared by the Apps Script runtime and local unit tests.
 * Keep this file free of Google service calls.
 */

var DTI_RANGE_PREFIX = 'GDT1|';
var DTI_SHEET_TEXT_ESCAPE = '\u200B';

function dtiExtractGoogleFileId(input) {
  var value = String(input || '').trim();
  var match = value.match(/[-\w]{25,}/);
  if (!match) {
    throw new Error('Enter a valid Google Sheet URL or file ID.');
  }
  return match[0];
}

function dtiNormalizeOptions(input) {
  var values = Array.isArray(input)
    ? input
    : String(input || '').split(/[\n,]/);
  var seen = {};
  var result = [];

  values.forEach(function (value) {
    var option = String(value || '').replace(/\s+/g, ' ').trim();
    var key = option.toLocaleLowerCase();
    if (option && !seen[key]) {
      seen[key] = true;
      result.push(option);
    }
  });

  return result;
}

function dtiCleanLabel(value, fieldName) {
  var clean = String(value || '').replace(/[\r\n\[\]|]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) {
    throw new Error((fieldName || 'Label') + ' is required.');
  }
  if (clean.length > 80) {
    throw new Error((fieldName || 'Label') + ' must be 80 characters or fewer.');
  }
  return clean;
}

function dtiNormalizeColor(value) {
  var color = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toUpperCase() : '#DCE6F1';
}

function dtiBuildTagText(propertyName, optionName) {
  return '[' + dtiCleanLabel(propertyName, 'Property name') + ': ' +
    dtiCleanLabel(optionName, 'Option name') + ']';
}

/**
 * Prevents user-controlled strings from being interpreted as formulas when
 * they are written to Google Sheets. The zero-width prefix is removed again
 * when Doc Tag Index reads its own values.
 */
function dtiSafeSheetText(value) {
  var text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? DTI_SHEET_TEXT_ESCAPE + text : text;
}

function dtiReadSheetText(value) {
  var text = String(value == null ? '' : value);
  return text.indexOf(DTI_SHEET_TEXT_ESCAPE) === 0 &&
      /^[=+\-@]/.test(text.slice(DTI_SHEET_TEXT_ESCAPE.length))
    ? text.slice(DTI_SHEET_TEXT_ESCAPE.length)
    : text;
}

function dtiEncodeManagedRange(parts) {
  var fields = [
    parts.occurrenceId,
    parts.propertyId,
    parts.optionId,
    parts.bookmarkId,
  ].map(function (value) {
    var field = String(value || '');
    if (!field || field.indexOf('|') !== -1) {
      throw new Error('Managed range identifiers must be non-empty and cannot contain a pipe.');
    }
    return field;
  });
  var name = DTI_RANGE_PREFIX + fields.join('|');
  if (name.length > 256) {
    throw new Error('Managed range metadata is too long for Google Docs.');
  }
  return name;
}

function dtiParseManagedRange(name) {
  var value = String(name || '');
  if (value.indexOf(DTI_RANGE_PREFIX) !== 0) {
    return null;
  }
  var fields = value.slice(DTI_RANGE_PREFIX.length).split('|');
  if (fields.length !== 4 || fields.some(function (field) { return !field; })) {
    return null;
  }
  return {
    occurrenceId: fields[0],
    propertyId: fields[1],
    optionId: fields[2],
    bookmarkId: fields[3],
  };
}

function dtiParseDisplayTag(text) {
  var match = String(text || '').trim().match(/^\[([^:\]]+):\s*([^\]]+)\]$/);
  return match ? { propertyName: match[1].trim(), optionName: match[2].trim() } : null;
}

function dtiBuildDocumentUrl(documentId) {
  return 'https://docs.google.com/document/d/' + encodeURIComponent(documentId) + '/edit';
}

function dtiBuildTagUrl(documentId, tabId, bookmarkId) {
  var url = dtiBuildDocumentUrl(documentId);
  if (tabId) {
    url += '?tab=' + encodeURIComponent(tabId);
  }
  if (bookmarkId) {
    url += '#bookmark=' + encodeURIComponent(bookmarkId);
  }
  return url;
}

function dtiAggregateOccurrences(occurrences) {
  var groups = {};

  (occurrences || []).forEach(function (occurrence) {
    if (occurrence.active === false) {
      return;
    }
    var key = occurrence.propertyId + '\u0000' + occurrence.optionId;
    if (!groups[key]) {
      groups[key] = {
        propertyId: occurrence.propertyId,
        propertyName: occurrence.propertyName,
        optionId: occurrence.optionId,
        optionName: occurrence.optionName,
        occurrenceCount: 0,
        documents: {},
        lastSeenAt: occurrence.lastSeenAt || '',
      };
    }
    groups[key].occurrenceCount += 1;
    groups[key].documents[occurrence.documentId] = true;
    if (occurrence.lastSeenAt && occurrence.lastSeenAt > groups[key].lastSeenAt) {
      groups[key].lastSeenAt = occurrence.lastSeenAt;
    }
  });

  return Object.keys(groups).map(function (key) {
    var group = groups[key];
    return {
      propertyId: group.propertyId,
      propertyName: group.propertyName,
      optionId: group.optionId,
      optionName: group.optionName,
      occurrenceCount: group.occurrenceCount,
      documentCount: Object.keys(group.documents).length,
      lastSeenAt: group.lastSeenAt,
    };
  }).sort(function (left, right) {
    return (left.propertyName + '\u0000' + left.optionName)
      .localeCompare(right.propertyName + '\u0000' + right.optionName);
  });
}
