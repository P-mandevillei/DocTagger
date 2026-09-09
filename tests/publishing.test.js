const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

test('sidebar and help scripts parse and use safe DOM rendering', () => {
  for (const filename of ['Sidebar.html', 'Help.html']) {
    const source = fs.readFileSync(path.join(root, 'src', filename), 'utf8');
    assert.match(source, /add-ons1\.css/);
    assert.doesNotMatch(source, /\.innerHTML\s*=/);
    const scripts = Array.from(source.matchAll(/<script>([\s\S]*?)<\/script>/g), (match) => match[1]);
    assert.ok(scripts.length > 0, `${filename} should contain a script`);
    for (const script of scripts) {
      assert.doesNotThrow(() => new Function(script));
    }
  }
});

test('manifest requests only the reviewed release scopes', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'src', 'appsscript.json'), 'utf8')
  );
  assert.equal(manifest.runtimeVersion, 'V8');
  assert.deepEqual(new Set(manifest.oauthScopes), new Set([
    'https://www.googleapis.com/auth/documents.currentonly',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/script.container.ui',
  ]));
});

test('public site includes required policy and support pages', () => {
  for (const filename of [
    'index.html', 'privacy.html', 'terms.html', 'support.html', 'delete-data.html',
  ]) {
    assert.equal(fs.existsSync(path.join(root, 'docs', filename)), true, filename);
  }
});
