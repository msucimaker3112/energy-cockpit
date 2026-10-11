// Baut dist/energy-cockpit.js aus den Dateien in src/ (Reihenfolge siehe ORDER).
// Aufruf: node tools/build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// Reihenfolge: gemeinsame Teile zuerst, dann die Karten.
const ORDER = [
  'common.js',
  'i18n.js',
  'flow-card.js',
  'flow-editor.js',
  'devices-i18n.js',
  'devices-card.js',
  'devices-editor.js',
  'stats-i18n.js',
  'stats-card.js',
  'stats-editor.js',
];

const parts = ORDER.filter((f) => existsSync(join(root, 'src', f))).map((f) => `/* ---- ${f} ---- */\n` + readFileSync(join(root, 'src', f), 'utf8'));
if (!parts.length) {
  console.error('Keine Quelldateien in src/ gefunden.');
  process.exit(1);
}
const banner = `/*! energy-cockpit v${pkg.version} - MIT License */\n`;
writeFileSync(join(root, 'dist', 'energy-cockpit.js'), banner + parts.join('\n\n') + '\n');
console.log(`dist/energy-cockpit.js gebaut (${parts.length} Teile, v${pkg.version})`);
