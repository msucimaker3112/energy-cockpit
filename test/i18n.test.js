const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const elements = new Map();
class HTMLElement {
  constructor() {
    this.style = { setProperty() {}, removeProperty() {} };
  }
  attachShadow() {
    this.shadowRoot = { innerHTML: '', querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} };
  }
  getAttribute() { return null; }
  setAttribute() {}
}
const context = vm.createContext({
  window: { addEventListener() {} },
  document: { addEventListener() {} },
  navigator: { userAgent: '' },
  HTMLElement,
  customElements: { get: (name) => elements.get(name), define: (name, value) => elements.set(name, value) },
  setTimeout() {},
  clearTimeout() {},
});

const load = (file) => vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
load('src/common.js');
vm.runInContext('globalThis.WD = WD', context);
load('src/i18n.js');
load('src/i18n-en.js');
load('src/i18n-nl.js');
context.WD.D3 = { css: '' };
load('src/flow-card.js');
load('src/room-card.js');
load('src/stats-card.js');
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

test('flow second-meter default follows language changes and preserves a configured name', () => {
  const Flow = elements.get('energy-cockpit-flow-card');
  for (const name of ['', 'Heat pump']) {
    WD.setLocale({ language: 'de-DE' });
    const card = new Flow();
    card._observe = card._clock = card._kaRender = card._schedLayout = () => {};
    card._update = card._loadDaily = () => {};
    card.setConfig({ grid: { entity: 'sensor.grid' }, grid2: { entity: 'sensor.meter', name } });
    assert.match(card.shadowRoot.innerHTML, new RegExp(name || 'Zweiter Zähler'));
    card._applyHass({ language: 'en-GB', config: { currency: 'EUR' }, states: {} });
    assert.match(card.shadowRoot.innerHTML, new RegExp(name || 'Second meter'));
    card._applyHass({ language: 'nl-NL', config: { currency: 'EUR' }, states: {} });
    assert.match(card.shadowRoot.innerHTML, new RegExp(name || 'Tweede meter'));
  }
});

test('stats second-meter default follows the rendered language and preserves a configured name', () => {
  const Stats = elements.get('energy-cockpit-stats-card');
  const stop = {};
  for (const name of ['', 'Heat pump']) {
    WD.setLocale({ language: 'de-DE' });
    const card = new Stats();
    card._build = () => {};
    card.setConfig({ pv_total: 'sensor.pv', grid_import_total: 'sensor.import', grid_export_total: 'sensor.export', grid2_total: 'sensor.meter', grid2_name: name, grid_price_ct: 30 });
    card._hass = { states: {} };
    card._renderCC = card._renderBud = card._count = () => {};
    card._periodVals = () => ({ pv: 0, imp: 1, exp: 0, chg: 0, dis: 0, g2: 1 });
    card._baseFee = () => 0;
    card._fk = (v) => String(v);
    card._f = (key, value) => { if (key === 'costSub') { card.costSub = value; throw stop; } };
    for (const [language, expected] of [['en-GB', 'Second meter'], ['nl-NL', 'Tweede meter']]) {
      WD.setLocale({ language });
      assert.throws(() => card._render(), (error) => error === stop);
      assert.match(card.costSub, new RegExp(name || expected));
    }
  }
});

test('stats renders immediately after a language rebuild even within the update throttle', () => {
  const Stats = elements.get('energy-cockpit-stats-card');
  WD.setLocale({ language: 'de-DE' });
  const card = new Stats();
  card._c = {};
  card._bl = 'de';
  card._hass = { language: 'de-DE' };
  card._lastR = Date.now();
  card._loading = true;
  let builds = 0, renders = 0;
  card._build = () => { builds++; };
  card._render = () => { renders++; };
  card.hass = { language: 'en-GB', config: { currency: 'EUR' }, states: {} };
  assert.equal(builds, 1);
  assert.equal(renders, 1);
});

test('room cards independently refresh on language, region and currency changes', () => {
  const Room = elements.get('energy-cockpit-room-card');
  WD.setLocale({ language: 'de-DE', config: { currency: 'EUR' } });
  const card = new Room();
  card._c = {};
  card._loading = true;
  card._liveUpd = () => {};
  let renders = 0;
  card._render = () => { renders++; };
  const hass = (language, currency) => ({ language, config: { currency }, states: {} });
  card.hass = hass('de-DE', 'EUR');
  WD.setLocale(hass('en-GB', 'EUR'));
  card.hass = hass('en-GB', 'EUR');
  card.hass = hass('en-GB', 'EUR');
  assert.equal(renders, 2);
  card.hass = hass('en-US', 'EUR');
  card.hass = hass('en-US', 'USD');
  assert.equal(renders, 4);
});

test('room CSV uses consistent locale-specific decimals without grouping', () => {
  const Room = elements.get('energy-cockpit-room-card');
  const card = new Room();
  card._c = { devices: [{ energy: 'sensor.energy' }], items: [] };
  card._buckets = () => [{ label: 'period' }];
  card._calc = () => ({ kwh: 1250, src: [1000, 200, 50], cost: 1234.38, costFull: 0.38, dev: [[1000, 200, 50]], items: [] });
  for (const [language, row] of [
    ['en-GB', 'period;1250.000;1000.000;200.000;50.000;1234.38;0.38;1250.000'],
    ['nl-NL', 'period;1250,000;1000,000;200,000;50,000;1234,38;0,38;1250,000'],
  ]) {
    WD.setLocale({ language, config: { currency: 'EUR' } });
    assert.equal(card._csv().split('\n')[1], row);
  }
});
