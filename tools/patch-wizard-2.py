"""Einmalig: Statistik-Karte auf Editor-Element, Platzhalter für nicht eingerichtete Karten (Statistik, Geräte)."""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent


def sub(path, old, new):
    p = root / 'src' / path
    s = p.read_text(encoding='utf-8')
    assert old in s, f'{path}: nicht gefunden: {old[:60]!r}'
    p.write_text(s.replace(old, new, 1), encoding='utf-8')


PLACE = ("this.shadowRoot.innerHTML = '<style>ha-card{padding:22px;border-radius:24px;background:#0c1322;color:#e8eefc;font-family:system-ui,sans-serif}b{color:#60a5fa}</style>"
         "<ha-card><b>%s</b><div style=\"margin-top:8px;opacity:.8\">Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Sensoren auszuwählen.</div></ha-card>';")

# Statistik
sub('stats-card.js', "    static getConfigForm() { return WD.statsForm(); }",
    "    static getConfigElement() { return document.createElement('energy-cockpit-stats-card-editor'); }")
sub('stats-card.js', "      if (!c.pv_total || !c.grid_import_total || !c.grid_export_total) throw new Error(T('st.err'));",
    "      if (!c.pv_total || !c.grid_import_total || !c.grid_export_total) {\n        this._c = null;\n        " + PLACE % 'Energy-Cockpit Statistik' + "\n        return;\n      }")
sub('stats-card.js', "    set hass(h) {\n      const first = !this._hass;",
    "    set hass(h) {\n      if (!this._c) { this._hass = h; return; }\n      const first = !this._hass;")

# Geräte
sub('devices-card.js', "      if (!c.rooms || !c.rooms.length) throw new Error(T('dev.err'));",
    "      if (!c.rooms || !c.rooms.length) {\n        this._c = null;\n        " + PLACE % 'Energy-Cockpit Geräte &amp; Verbrauch' + "\n        return;\n      }")
sub('devices-card.js', "    set hass(h) {\n      setLocale(h);",
    "    set hass(h) {\n      setLocale(h);\n      if (!this._c) { this._hass = h; return; }")
print('ok')
