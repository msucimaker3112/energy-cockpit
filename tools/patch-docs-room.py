"""Einmalig: Doku um die Raum-Abrechnung ergänzen, Version 0.3.0."""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent


def edit(path, old, new):
    p = root / path
    s = p.read_text(encoding='utf-8')
    assert old in s, f'{path}: nicht gefunden: {old[:60]!r}'
    p.write_text(s.replace(old, new, 1), encoding='utf-8')


edit('README.md',
     "| `energy-cockpit-stats-card` | **Statistik**: Ersparnis, Einspeiseerlös, Autarkie, Amortisation, Grundlast, Monatsvergleich, Akku |",
     "| `energy-cockpit-stats-card` | **Statistik**: Ersparnis, Einspeiseerlös, Autarkie, Amortisation, Grundlast, Monatsvergleich, Akku |\n"
     "| `energy-cockpit-room-card` | **Raum-Abrechnung**: Verbrauch und Kosten eines Raums je Woche, Monat, Jahr und Vorjahr, getrennt nach Geräten (z. B. für die Strommiete), mit CSV-Export |")
edit('README.md', "Drei Karten für Home Assistant", "Vier Karten für Home Assistant")

with (root / 'docs' / 'KONFIGURATION.md').open('a', encoding='utf-8') as f:
    f.write("""
---

## Raum-Abrechnung: `custom:energy-cockpit-room-card`

Zeigt Verbrauch und Kosten eines Raums für **Woche, Monat, Jahr und Vorjahr**, getrennt nach Geräten, mit Tagesbalken, Tabelle und CSV-Export. Gedacht für die Abrechnung der Strommiete eines vermieteten oder getrennt zu bewertenden Raums.

```yaml
type: custom:energy-cockpit-room-card
title: Büro Keller
subtitle: Strommiete
image: /local/logo.png          # optional, Bild-URL oder Data-URI
price: input_number.strompreis  # Sensor oder input_number in € pro kWh
# price_ct: 34                  # alternativ fester Preis in Cent pro kWh
base_fee: 0                     # optional: Grundgebühr je Monat in €
devices:
  - name: Arbeitsplätze
    energy: sensor.buero_1_energie
  - name: Chillecke
    energy: sensor.buero_2_energie
```

| Schlüssel | Beschreibung |
|---|---|
| `devices` | Liste der Energiezähler (kWh, mit Langzeitstatistik). `name` und `color` sind optional. |
| `price` / `price_ct` | Preis je kWh als Sensor/Helfer oder fester Wert in Cent. Ohne Preis werden nur kWh angezeigt. |
| `base_fee` | Grundgebühr je Monat; wird für alle Monate ab dem ersten Messwert addiert. |
| `title`, `subtitle`, `image` | Kopf der Karte. |

**Hinweise:** Die Kosten werden mit dem **aktuellen** Preis berechnet. Ändert sich der Preis, ändern sich auch die Werte vergangener Zeiträume. Für eine rechtssichere Abrechnung die Monatswerte (Tabelle oder CSV) am Monatsende festhalten.
""")

edit('docs/handout.html', "<tr><td><code>energy-cockpit-stats-card</code></td><td>Ersparnis, Autarkie, Amortisation, Grundlast, Monatsvergleich</td></tr>",
     "<tr><td><code>energy-cockpit-stats-card</code></td><td>Ersparnis, Autarkie, Amortisation, Grundlast, Monatsvergleich</td></tr>\n      <tr><td><code>energy-cockpit-room-card</code></td><td>Raum-Abrechnung: Verbrauch und Kosten je Woche, Monat, Jahr, Vorjahr</td></tr>")
edit('docs/handout.html', "Version 0.2.0", "Version 0.3.0")
pkg = root / 'package.json'
pkg.write_text(pkg.read_text(encoding='utf-8').replace('"version": "0.2.1"', '"version": "0.3.0"'), encoding='utf-8')
print('ok')
