// Listet die Texte, die in einer Sprache noch fehlen (sie erscheinen dann auf Deutsch), samt deutscher Vorlage.
// Aufruf: npm run missing -- fr   (oder en, nl, fi). Die Ausgabe ist tabulatorgetrennt: Schlüssel, deutscher Text.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lang = (process.argv[2] || '').toLowerCase();
if (!/^[a-z]{2}$/.test(lang)) { console.error('Aufruf: npm run missing -- <Sprache>, zum Beispiel fr, fi, nl oder en'); process.exit(1); }

const elements = new Map();
class HTMLElement {
  constructor() { this.style = { setProperty() {}, removeProperty() {} }; }
  attachShadow() { this.shadowRoot = { innerHTML: '', querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} }; }
  getAttribute() { return null; }
  setAttribute() {}
}
const ctx = vm.createContext({
  window: { addEventListener() {} }, document: { addEventListener() {} }, navigator: { userAgent: '' }, HTMLElement,
  customElements: { get: (n) => elements.get(n), define: (n, v) => elements.set(n, v) }, setTimeout() {}, clearTimeout() {},
});
const load = (f) => vm.runInContext(readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
load('src/common.js');
vm.runInContext('globalThis.WD = WD', ctx);
load('src/i18n.js');
const WD = ctx.WD;
const de = new Set();
const addStrings = WD.addStrings;
WD.addStrings = (o) => { Object.keys(o).forEach((k) => de.add(k)); addStrings(o); };
const have = new Set();
const addTranslations = WD.addTranslations;
WD.addTranslations = (l, o) => { if (l === lang) Object.keys(o).forEach((k) => have.add(k)); addTranslations(l, o); };
WD.D3 = { css: '' };
const base = readFileSync(path.join(root, 'src/i18n.js'), 'utf8').match(/de: \{([\s\S]*?)\n    \},\n    en:/);
(base[1].match(/'([^']+)':/g) || []).forEach((k) => de.add(k.slice(1, -2)));
for (const f of ['devices-i18n.js', 'stats-i18n.js', 'flow-card.js', 'room-card.js', 'stats-card.js', 'i18n-en.js', 'i18n-nl.js', 'i18n-fr.js', 'i18n-fi.js']) {
  try { load('src/' + f); } catch (e) { /* Datei fehlt oder gehört einer anderen Sprache */ }
}
WD.setLocale({ language: 'de-DE' });
const missing = [...de].filter((k) => !have.has(k));
console.log(`# ${lang}: ${missing.length} von ${de.size} Texten fehlen (Rest ist übersetzt). Schlüssel<TAB>deutscher Text`);
missing.forEach((k) => console.log(k + '\t' + WD.T(k).replace(/\s+/g, ' ')));
