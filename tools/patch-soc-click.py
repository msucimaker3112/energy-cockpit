"""v0.9.2: Klick auf den Ladestand (Balken, Prozent) öffnet den Verlauf des Ladestand-Sensors; Option battery.tap: soc für die ganze Kachel."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:70]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


sub('src/flow-card.js', [
    ("PAL.bat, c.battery.power || c.battery.power_charge || c.battery.power_discharge,\n"
     "        `<div class=\"soc\"><div class=\"soc-fill\"></div><div class=\"soc-low\"></div><div class=\"soc-high\"></div></div><div class=\"soc-row\"><span>${T('flow.soc')}</span><b class=\"soc-txt\">—</b></div>`);",
     "PAL.bat, (c.battery.tap === 'soc' && c.battery.soc) || c.battery.power || c.battery.power_charge || c.battery.power_discharge,\n"
     "        // Klick auf Balken und Prozentzahl öffnet den Verlauf des Ladestands, der Rest der Kachel den der Leistung\n"
     "        `<div class=\"socbox\"${c.battery.soc ? ` data-e=\"${esc(c.battery.soc)}\"` : ''}><div class=\"soc\"><div class=\"soc-fill\"></div><div class=\"soc-low\"></div><div class=\"soc-high\"></div></div><div class=\"soc-row\"><span>${T('flow.soc')}</span><b class=\"soc-txt\">—</b></div></div>`);"),
])
sub('src/flow-editor.js', [
    ("      { name: 'soc_display',",
     "      { name: 'tap', selector: { select: { mode: 'dropdown', options: [{ value: 'power', label: 'Verlauf der Lade-/Entladeleistung (Standard)' }, { value: 'soc', label: 'Verlauf des Ladestands in %' }] } } },\n      { name: 'soc_display',"),
    ("soc_display: 'Ladestand anzeigen als',", "soc_display: 'Ladestand anzeigen als', tap: 'Klick auf die Batterie-Kachel öffnet',"),
])
sub('docs/KONFIGURATION.md', [
    ("| `battery.power` | Sensor |",
     "| `battery.tap` | `power` (Standard) / `soc` | Was ein Klick auf die Kachel öffnet: Verlauf der Leistung oder des Ladestands. Ein Klick auf Balken und Prozentzahl öffnet immer den Ladestand |\n| `battery.power` | Sensor |"),
])
c = R / 'CHANGELOG.md'
u = c.read_text(encoding='utf-8')
u = u.replace("# Änderungsprotokoll\n", """# Änderungsprotokoll

## 0.9.2
- **Batterie: Ladestand als Verlauf:** Ein Klick auf Ladebalken oder Prozentzahl öffnet den Verlauf des Ladestands (%). Der Rest der Kachel öffnet wie bisher den Verlauf der Lade-/Entladeleistung. Mit `battery.tap: soc` öffnet die ganze Kachel den Ladestand.
""", 1)
c.write_text(u, encoding='utf-8')
pk = R / 'package.json'
pk.write_text(pk.read_text(encoding='utf-8').replace('"version": "0.9.1"', '"version": "0.9.2"'), encoding='utf-8')
hd = R / 'docs' / 'handout.html'
hd.write_text(hd.read_text(encoding='utf-8').replace('Version 0.9.1', 'Version 0.9.2'), encoding='utf-8')
print('ok')
