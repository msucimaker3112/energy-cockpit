const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({
  window: { addEventListener() {} },
  document: { addEventListener() {} },
  navigator: { userAgent: '' },
});

const load = (file) => vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
load('src/common.js');
vm.runInContext('globalThis.WD = WD', context);
load('src/i18n.js');
load('src/i18n-en.js');
load('src/i18n-nl.js');
const { WD } = context;

test('selects Dutch from a regional Home Assistant language and formats numbers accordingly', () => {
  WD.setLocale({ language: 'nl-NL', config: { currency: 'EUR' } });

  assert.equal(WD.state.lang, 'nl');
  assert.equal(WD.state.loc, 'nl-NL');
  assert.equal(WD.T('flow.home'), 'Huisverbruik');
  assert.equal(WD.T('stat.imp'), 'Netafname vandaag');
  assert.equal(WD.T('dev.title'), 'Apparaten en verbruik');
  assert.equal(WD.T('st.n.imp'), 'Netafname vandaag');
  assert.equal(WD.T('why.q.bal'), 'Waarom is er geen netafname?');
  assert.equal(WD.T('room.month_label'), 'Maand');
  assert.equal(WD.nf(1234.5, 1), '1.234,5');
});

test('selects English from a regional language tag and preserves placeholders', () => {
  WD.setLocale({ language: 'en-GB' });

  assert.equal(WD.state.lang, 'en');
  assert.equal(WD.T('flow.home'), 'House consumption');
  assert.equal(WD.T('st.n.imp'), 'Grid import today');
  assert.equal(WD.T('room.month_label'), 'Month');
  assert.equal(WD.T('bat.io', { in: '1 kW', out: '2 kW' }), 'Input <b>1 kW</b> · output <b>2 kW</b>');
  assert.equal(WD.nf(1234.5, 1), '1,234.5');
});

test('uses German translations for unsupported languages while formatting with the HA locale', () => {
  WD.addStrings({ 'test.german-only': 'Nur auf Deutsch' });
  WD.setLocale({ language: 'fr-FR' });

  assert.equal(WD.state.lang, 'de');
  assert.equal(WD.state.loc, 'fr-FR');
  assert.equal(WD.T('flow.home'), 'Hausverbrauch');
  assert.equal(WD.T('test.german-only'), 'Nur auf Deutsch');
  assert.equal(WD.nf(1234.5, 1), new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(1234.5));
});

test('falls back to German locale for an invalid Home Assistant language tag', () => {
  WD.setLocale({ language: 'not_a_locale' });

  assert.equal(WD.state.lang, 'de');
  assert.equal(WD.state.loc, 'de-DE');
});
