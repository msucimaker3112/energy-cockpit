"""Einmalig: Doku der Raum-Abrechnung um Herkunft (Netz/Batterie/PV) und Bewertung ergänzen."""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
p = root / 'docs' / 'KONFIGURATION.md'
s = p.read_text(encoding='utf-8')
a = s.index('## Raum-Abrechnung: `custom:energy-cockpit-room-card`')
new = """## Raum-Abrechnung: `custom:energy-cockpit-room-card`

Zeigt Verbrauch und Kosten eines Raums für **Woche, Monat, Jahr und Vorjahr**, getrennt nach Geräten und nach **Herkunft der Energie (Netz, Batterie, PV)**, mit Tagesbalken, Tabellen und CSV-Export. Gedacht für die Abrechnung der Strommiete eines vermieteten oder getrennt zu bewertenden Raums.

```yaml
type: custom:energy-cockpit-room-card
title: Büro Keller
subtitle: Strommiete
image: /local/logo.png                 # optional, Bild-URL oder Data-URI
devices:
  - name: Arbeitsplätze
    energy: sensor.buero_1_energie
  - name: Chillecke
    energy: sensor.buero_2_energie
home_energy:                           # Zähler des ganzen Hauses (für die Herkunft)
  pv: sensor.pv_gesamt_kwh
  import: sensor.netzbezug_gesamt_kwh
  export: sensor.einspeisung_gesamt_kwh
  charge: sensor.batterie_geladen_kwh
  discharge: sensor.batterie_entladen_kwh
price: input_number.strompreis         # Bezugspreis in € pro kWh (Sensor/Helfer) ...
# price_ct: 34                         # ... oder fest in Cent pro kWh
feed_in: input_number.einspeiseverguetung
valuation: opportunity                 # opportunity | mix | grid
base_fee: 0                            # optional: Grundgebühr je Monat in €
```

### Wie die Herkunft ermittelt wird

Für jede Stunde wird aus den Haus-Zählern der **Mix** bestimmt:

- Hausverbrauch = PV + Netzbezug − Einspeisung − Batterie laden + Batterie entladen
- Netzanteil = Netzbezug ÷ Hausverbrauch, Batterieanteil = Batterie entladen ÷ Hausverbrauch, PV-Anteil = Rest

**Jeder Verbraucher bekommt in jeder Stunde denselben Mix wie das Haus.** Der Verbrauch des Raums wird entsprechend aufgeteilt. Die Werte werden pro Tag, Woche, Monat und Jahr aufsummiert.

### Bewertung (`valuation`)

| Wert | Bedeutung |
|---|---|
| `opportunity` (Standard) | **Entgangener Nutzen.** Netz, Batterie und PV-Strom, den das Haus selbst hätte verbrauchen können (Stunde ohne Einspeisung), kosten den **Bezugspreis**. Nur PV-Strom aus Stunden mit Einspeisung wird zur **Einspeisevergütung** bewertet, denn sonst wäre er eingespeist worden. |
| `mix` | Feste Preise je Quelle: Netz zum Bezugspreis, PV zu `price_pv` (Standard: Einspeisevergütung), Batterie zu `price_battery` (Standard: PV-Preis). |
| `grid` | Alles zum Bezugspreis. |

Unterhalb der Tabelle zeigt die Karte zum Vergleich immer auch den Betrag für "alles zum Netzpreis".

| Schlüssel | Beschreibung |
|---|---|
| `devices` | Liste der Energiezähler (kWh, mit Langzeitstatistik). `name` und `color` sind optional. |
| `home_energy` | Haus-Zähler für Netz, Batterie und PV. Ohne `import` wird alles zum Bezugspreis bewertet. |
| `price` / `price_ct` | Bezugspreis je kWh als Sensor/Helfer oder fester Wert in Cent. |
| `feed_in` | Einspeisevergütung je kWh. |
| `price_pv`, `price_battery` | Nur für `valuation: mix`. |
| `base_fee` | Grundgebühr je Monat; wird für alle Monate ab dem ersten Messwert addiert. |

**Hinweise:** Die Kosten werden mit den **aktuellen** Preisen berechnet. Ändert sich ein Preis, ändern sich auch die Werte vergangener Zeiträume. Für eine rechtssichere Abrechnung die Monatswerte (Tabelle oder CSV) am Monatsende festhalten und die Bewertungsregel mit dem Mieter schriftlich vereinbaren.
"""
p.write_text(s[:a] + new, encoding='utf-8')

r = root / 'README.md'
t = r.read_text(encoding='utf-8')
t = t.replace("getrennt nach Geräten (z. B. für die Strommiete), mit CSV-Export |", "getrennt nach Geräten und nach Herkunft (Netz, Batterie, PV), mit Bewertung nach entgangenem Nutzen und CSV-Export |")
r.write_text(t, encoding='utf-8')
print('ok')
