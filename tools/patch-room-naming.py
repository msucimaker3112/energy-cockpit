"""Einmalig: In der Raum-Abrechnung "Gerät" durch "Bereich" ersetzen (ein Zähler misst mehrere Geräte)."""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = root / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:70]!r}'
        s = s.replace(old, new)
    p.write_text(s, encoding='utf-8')


sub('src/room-card.js', [
    ('<span class="lbl">Je Gerät</span>', '<span class="lbl">Je Bereich</span>'),
    ('<thead><tr><th>Gerät</th><th>kWh</th>', '<thead><tr><th>Bereich</th><th>kWh</th>'),
    ('getrennt nach Geräten UND nach Herkunft der Energie', 'getrennt nach Bereichen (Zählern) UND nach Herkunft der Energie'),
    ("description: 'Verbrauch und Kosten eines Raums je Woche, Monat, Jahr und Vorjahr, mit Herkunft Netz, Batterie und PV (z. B. Strommiete)'",
     "description: 'Verbrauch und Kosten eines Raums je Woche, Monat, Jahr und Vorjahr, je Bereich und mit Herkunft Netz, Batterie und PV (z. B. Strommiete)'"),
])
sub('src/room-editor.js', [
    ("sec('devices', 'Geräte / Zähler (bis zu 8)', Array.from({ length: 8 }, (_, i) => sec(String(i), `Gerät ${i + 1}`,",
     "sec('devices', 'Bereiche / Zähler (bis zu 8)', Array.from({ length: 8 }, (_, i) => sec(String(i), `Bereich ${i + 1}`,"),
    ("text: 'Wähle die Zähler (kWh) der Geräte oder Stromkreise dieses Raums. Der Verbrauch wird je Gerät und als Summe ausgewiesen.'",
     "text: 'Wähle die Zähler (kWh) der Bereiche oder Stromkreise dieses Raums, zum Beispiel Arbeitsplätze oder Chillecke. Hinter einem Zähler dürfen beliebig viele Geräte hängen. Der Verbrauch wird je Bereich und als Summe ausgewiesen.'"),
    ("name: 'Anzeigename'", "name: 'Anzeigename'") if False else ("title: 'Titel', subtitle: 'Untertitel'", "title: 'Titel', subtitle: 'Untertitel'"),
])
sub('docs/KONFIGURATION.md', [
    ("getrennt nach Geräten und nach **Herkunft der Energie (Netz, Batterie, PV)**", "getrennt nach **Bereichen** (jeder Zähler kann beliebig viele Geräte versorgen) und nach **Herkunft der Energie (Netz, Batterie, PV)**"),
    ("| `devices` | Liste der Energiezähler (kWh, mit Langzeitstatistik). `name` und `color` sind optional. |",
     "| `devices` | Liste der Bereiche mit je einem Energiezähler (kWh, mit Langzeitstatistik), zum Beispiel `Arbeitsplätze` oder `Chillecke`. `name` und `color` sind optional. |"),
])
sub('README.md', [("getrennt nach Geräten und nach Herkunft", "je Bereich (Zähler) und nach Herkunft")])
sub('docs/handout.html', [("Raum-Abrechnung: Verbrauch und Kosten je Woche, Monat, Jahr, Vorjahr", "Raum-Abrechnung: Verbrauch und Kosten je Bereich, Woche, Monat, Jahr, Vorjahr")])
pkg = root / 'package.json'
pkg.write_text(pkg.read_text(encoding='utf-8').replace('"version": "0.4.0"', '"version": "0.4.1"'), encoding='utf-8')
print('ok')
