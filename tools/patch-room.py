"""Einmalig: Raum-Abrechnung einbinden (Wizard-Liste für Zähler, Preis in Cent, Build-Reihenfolge)."""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent


def sub(path, old, new, count=1):
    p = root / path
    s = p.read_text(encoding='utf-8')
    assert s.count(old) >= 1, f'{path}: nicht gefunden: {old[:70]!r}'
    p.write_text(s.replace(old, new, count), encoding='utf-8')


# Wizard: Listen mit beliebigem Schlüssel und Sensorart (Standard: entity / power)
w = root / 'src' / 'wizard.js'
s = w.read_text(encoding='utf-8')
a = s.index('    const fieldList = (f) => {')
b = s.index('    function render() {')
blk = s[a:b]
blk = blk.replace("const all = list(hass, 'power');", "const KEY = f.itemKey || 'entity';\n      const all = list(hass, f.listKind || 'power');")
blk = blk.replace("items.map((x) => x.entity)", "items.map((x) => x[KEY])")
blk = blk.replace("arr.filter((x) => x.entity)", "arr.filter((x) => x[KEY])")
blk = blk.replace("it.entity", "it[KEY]")
blk = blk.replace("items.push({ entity: sel.value,", "items.push({ [KEY]: sel.value,")
s = s[:a] + blk + s[b:]
w.write_text(s, encoding='utf-8')

# Raum-Karte: fester Preis in Cent als Alternative
sub('src/room-card.js',
    "      const c = this._c, h = this._hass;\n      if (typeof c.price === 'number') return c.price;",
    "      const c = this._c, h = this._hass;\n      if (typeof c.price === 'number') return c.price;\n      if (!c.price && typeof c.price_ct === 'number') return c.price_ct / 100;")

# Build-Reihenfolge
b = root / 'tools' / 'build.mjs'
t = b.read_text(encoding='utf-8')
if 'room-card.js' not in t:
    t = t.replace("  'stats-i18n.js',", "  'room-card.js',\n  'room-editor.js',\n  'stats-i18n.js',")
    b.write_text(t, encoding='utf-8')
print('ok')
