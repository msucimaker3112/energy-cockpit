"""Einmalig: baut Assistent und Reiter-Editor in die Energiefluss-Karte ein."""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent

# 1) Build-Reihenfolge
b = root / 'tools' / 'build.mjs'
t = b.read_text(encoding='utf-8')
if 'wizard.js' not in t:
    t = t.replace("  'i18n.js',", "  'i18n.js',\n  'wizard.js',\n  'editor-kit.js',")
    b.write_text(t, encoding='utf-8')

# 2) Flow-Karte: Editor-Element statt getConfigForm; nicht eingerichtet -> Hinweis statt Fehler
p = root / 'src' / 'flow-card.js'
s = p.read_text(encoding='utf-8')
old = "  static getConfigForm() { return WD.flowForm(); }"
assert old in s
s = s.replace(old, "  static getConfigElement() { return document.createElement('energy-cockpit-flow-card-editor'); }")
old = "    if (!config || (!config.pv && !config.grid)) throw new Error(T('flow.error'));"
assert old in s, 'setConfig-Zeile nicht gefunden'
new = """    if (!config || ((!config.pv || !config.pv.entity) && (!config.grid || !config.grid.entity))) {
      // Noch nicht eingerichtet: Hinweisfläche statt Fehlermeldung, der Assistent im Editor hilft weiter
      this._c = null;
      this.shadowRoot.innerHTML = '<style>ha-card{padding:22px;border-radius:24px;background:#0c1322;color:#e8eefc;font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit Energiefluss</b><div style="margin-top:8px;opacity:.8">Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Sensoren auszuwählen.</div></ha-card>';
      return;
    }"""
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('flow-card ok')
