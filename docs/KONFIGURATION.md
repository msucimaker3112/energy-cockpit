# Konfiguration

Alle Karten lassen sich im grafischen Editor einstellen. Erweiterte Optionen stehen nur im YAML-Editor. Beim Speichern aus dem Editor bleiben unbekannte YAML-Schlüssel erhalten.

Konventionen: `entity` = Sensor-ID (z. B. `sensor.pv_leistung`). Leistung in W, kW oder MW, Energie in Wh, kWh oder MWh: Die Karten lesen die Einheit des Sensors und rechnen selbst in W und kWh um. Sensoren ohne Einheit gelten als W bzw. kWh.

`energy_unit` (alle Karten, Standard `auto`): Mit `energy_unit: kwh` nimmt die Karte Energiewerte ungeprüft als kWh, wie vor Version 0.12.2. Nur nötig, wenn ein Sensor eine falsche Einheit meldet.

---

## Energiefluss: `custom:energy-cockpit-flow-card`

Mindestens `pv` **oder** `grid` ist nötig.

### Quellen

| Schlüssel | Typ | Beschreibung |
|---|---|---|
| `title` | Text | Überschrift (Standard "Energiefluss") |
| `pv.entity` | Sensor | PV-Leistung |
| `pv.name`, `pv.icon` | Text | Anzeigename, Symbol (`mdi:…`) |
| `pv.daily` | Sensor | Tagesertrag in kWh |
| `pv.forecast` | Sensor | Prognose-Leistung (z. B. Solcast) |
| `pv.strings` | Liste | Teilstränge `{entity, name}` |
| `grid.entity` | Sensor | Netzleistung (Bezug positiv) |
| `grid.invert` | Ja/Nein | Vorzeichen umkehren |
| `grid.daily_import`, `grid.daily_export` | Sensor | Bezug / Einspeisung heute (kWh) |
| `battery.tap` | `power` (Standard) / `soc` | Was ein Klick auf die Kachel öffnet: Verlauf der Leistung oder des Ladestands. Ein Klick auf Balken und Prozentzahl öffnet immer den Ladestand |
| `battery.power` | Sensor | Laden positiv, Entladen negativ |
| `battery.power_charge`, `battery.power_discharge` | Sensoren | Statt `power`: zwei getrennte Sensoren für Laden und Entladen (beide positiv). Die Karte rechnet Laden minus Entladen |
| `pv.forecast` | Sensor | Prognose in W/kW (zeigt "Prognose 6,0 kW") oder Tagesprognose in kWh (zeigt "Prognose heute 6,0 kWh"), z. B. Solcast |
| `battery.soc` | Sensor | Ladestand in % |
| `battery.invert` | Ja/Nein | Vorzeichen umkehren |
| `battery.capacity_kwh` | Zahl | Kapazität für die Prognose "voll um / reicht bis" |
| `battery.reserve_soc`, `battery.max_soc` | Sensor oder Helfer (Zahl-Entität) | Entladegrenze und Maximalladung der Batterie in %. Der Sensor heißt bei jedem Wechselrichter anders, deshalb frei wählbar (zum Beispiel "Entlade-Ende-Ladestand") |
| `battery.reserve_pct`, `battery.max_pct` | Zahl | Alternative ohne Sensor: fester Wert in %, zum Beispiel `10`, wenn die Batterie nur bis 10 % entladen wird. Ein Sensor hat Vorrang |
| `animations` | `auto` (Standard), `always` | `auto`: Ist am Gerät "Bewegung reduzieren" eingeschaltet, stehen Linien und Ring still. `always`: immer animieren |
| `text_size` | `normal` (Standard), `gross`, `sehr_gross` | Vergrößert die kleinen Texte (Ladestand, Kennzahlen oben rechts, Beschriftungen). Gut für Handy und Tablet |
| `rest_min` | Zahl in % | Zeigt die Kachel "Nicht erfasst" erst, wenn mindestens so viel Prozent des Hausverbrauchs keiner Gruppe zugeordnet sind (zum Beispiel `10`). Standard: immer anzeigen |
| `hide_rest` | `true` / `false` | Blendet die Kachel "Nicht erfasst" unter den Gruppen aus. Sie zeigt den Hausverbrauch, der keiner Gruppe zugeordnet ist (Hausverbrauch minus Summe der Gruppen). Mit `rest.name` lässt sich ihre Beschriftung ändern |
| `groups_columns` | Zahl | Gruppen pro Reihe. Standard: alle Gruppen nebeneinander in einer Reihe (auf dem Handy drei). `1` stellt jede Gruppe in eine eigene Reihe über die volle Breite, die Einträge verteilen sich dann auf mehrere Spalten und die Namen bleiben lesbar. Stehen Gruppen untereinander und ist `groups_lines` nicht gesetzt, zeichnet die Karte die Sammel-Linie, damit keine Linie durch andere Gruppen läuft |
| `groups_lines` | `direkt` (Standard) oder `sammel` | Linien zu Einzelverbrauchern und Gruppen. `sammel` zeichnet nur **eine** Linie vom Ring zu einer Plakette "Verbraucher" mit der Summe und fasst den Bereich in einem Rahmen zusammen. Die Kacheln zeigen ihre Aktivität weiter mit Farbrand und Wert, bekommen aber keine eigene Linie. Gut bei vielen Geräten, auch auf dem Handy |
| `battery.soc_display` | `brutto` (Standard) oder `nutzbar` | `nutzbar` zeigt den Ladestand relativ zum nutzbaren Bereich (0 % = Entladegrenze, 100 % = Maximalladung). Mit `brutto` bleibt die Anzeige wie die Batterie, die Grenzen erscheinen als schraffierte Bereiche auf dem Balken |
| `battery.daily_charge`, `battery.daily_discharge` | Sensor | geladen / entladen heute (kWh) |
| `home.entity`, `home.name` | Sensor, Text | Hausverbrauch (sonst berechnet) |
| `home.daily` | Sensor | Hausverbrauch heute (kWh) für die Kachel "Haus heute". Ohne Angabe berechnet die Karte ihn aus PV-Ertrag, Bezug, Einspeisung und Batterie heute (sobald `pv.daily` und `grid.daily_import` gesetzt sind) |
| `grid_price`, `feed_in` | Sensor, `input_number` oder Zahl | Preis je kWh (Euro) für Kostenangaben |
| `theme` | Text | Farbschema: `dunkel` (Standard), `graphit`, `hell`, `warm`, `auto` (folgt dem Home-Assistant-Design hell/dunkel) oder `ha` (Farben des HA-Designs). Gilt für alle vier Karten |
| `accent` | Text | Nur Raum-Abrechnung: Akzentfarbe als `R,G,B` oder `#rrggbb` |
| `grid_price_ct`, `feed_in_ct` | Zahl | Alternative ohne Sensor: fester Preis in **Cent** pro kWh, zum Beispiel `34`. Gilt, wenn `grid_price` oder `feed_in` nicht gesetzt ist (Energiefluss, Geräte & Verbrauch, Statistik) |

### Verbraucher

Im grafischen Editor findest du die Abschnitte **Einzelverbraucher** (bis zu 8) und **Gruppen** (bis zu 6 mit je bis zu 8 Verbrauchern). Gespeichert werden sie als Liste oder als nummerierte Einträge, beides funktioniert. Mehr Einträge sind im YAML-Editor möglich.

```yaml
consumers:
  - entity: sensor.waermepumpe_leistung
    name: Wärmepumpe
    icon: mdi:heat-pump
    color: "#a78bfa"
    secondary: sensor.waermepumpe_temperatur   # Zusatzwert
    secondary_decimals: 1
    on_w: 3                                    # aktiv (Rahmen, Linie) ab 3 W, Standard 10 W
```

`on_w` gibt es auch für Gruppen und ihre Einträge. Damit bekommt zum Beispiel eine Zirkulationspumpe mit 6 W einen Rahmen.

Zweite Solaranlage, zum Beispiel ein Balkonkraftwerk mit eigenem Sensor:

```yaml
pv:
  entity: sensor.pv_leistung        # große Anlage (lädt die Batterie)
  name: Dach
pv2:
  entity: sensor.bkw_leistung       # Balkonkraftwerk (speist direkt ins Hausnetz)
  name: Balkonkraftwerk
  daily: sensor.bkw_heute           # optional, wird zum Tagesertrag addiert
  add_to_home: false                # true, wenn dein Hausverbrauchs-Sensor das BKW NICHT enthält
```

Die Karte zeigt eine eigene Kachel mit eigener Linie. Autarkie, Eigenverbrauch und die Herkunft im Ring rechnen mit der Summe beider Anlagen. Die zweite Anlage deckt zuerst das Haus, die erste lädt danach die Batterie und speist ein.

Gruppen (mehrere Verbraucher je Raum) und der Rest "nicht erfasst":

```yaml
consumer_groups:
  - name: Keller
    icon: mdi:pipe-valve
    color: "#f87171"
    items:
      - entity: sensor.umwaelzpumpe_leistung
        name: Umwälzpumpe
      - name: Warmwasser            # nur Zusatzwert
        secondary: sensor.boiler_temperatur
rest:                               # false = ausblenden
  name: Nicht erfasst
```

Gruppen untereinander, eine pro Reihe (`groups_columns: 1`):

```yaml
groups_columns: 1      # 2 = zwei Gruppen pro Reihe; ohne Angabe alle nebeneinander
```

| Standard | `groups_columns: 1` |
|---|---|
| ![Gruppen nebeneinander](img/gruppen-vorher-handy.png) | ![Eine Gruppe pro Reihe](img/gruppen-reihe-handy.png) |

Textgröße und Kachel "Nicht erfasst" (Bilder: `docs/img/text-*.png`, `docs/img/rest-ab-10.png`):

```yaml
text_size: gross       # normal | gross | sehr_gross
rest_min: 10           # "Nicht erfasst" erst ab 10 % des Hausverbrauchs
hide_rest: false       # true blendet die Kachel immer aus
```

Die Netz-Kachel zeigt "Bezug" oder "Einspeisung" ab 0,5 W Leistung und "Ausgeglichen" nur, wenn praktisch nichts fließt.

### Überschuss und Netzalarm

```yaml
surplus:
  enabled: true
  threshold: 1500      # W Überschuss, ab dem das Banner erscheint
  delay: 60            # Sekunden stabil, bevor es erscheint
  suggestions:
    - name: Waschmaschine
      icon: mdi:washing-machine
      power: 2000      # nur anzeigen, wenn genug Überschuss
    - name: Auto laden
      icon: mdi:car-electric
      entity: sensor.wallbox_leistung
      running: Auto lädt
grid_alert:
  enabled: true
  threshold: 1000
  delay: 120
```

### Abfallkalender-Hinweis

```yaml
waste:
  calendar: calendar.abfall
  day_switch: "10:00"     # ab dann Hinweis für morgen
  remind_from: "16:00"    # ab dann auffällig
  nav_path: /lovelace/abfall
  types:
    - { match: rest, name: Restmüll, color: "156,163,175" }
    - { match: gelb, name: Gelber Sack, color: "250,204,21" }
```

### Darstellung

| Schlüssel | Standard | Beschreibung |
|---|---|---|
| `show_clock` | `true` | Uhr im Kopf |
| `fit_screen` | `true` | auf Bildschirmhöhe skalieren (Statistik: nicht auf dem Handy) |
| `compact` | `false` | Kurzansicht für den schnellen Blick: Solar, Netz und Batterie stehen neben dem Ring, Gruppen ohne Geräteliste, ohne Zusatztexte (Aufteilung, Prognose, Herkunft). `auto`: nur auf schmalen Bildschirmen unter 600 px (Handy), Tablet und PC zeigen weiter alles. `true` (oder `immer`): überall. Ein Tipp auf eine Gruppe öffnet ein Fenster mit allen Geräten der Gruppe und ihren aktuellen Werten. Ist `groups_lines` nicht gesetzt, zeichnet die Kurzansicht die Sammel-Linie, `groups_columns` gilt in der Kurzansicht nicht |
| `watt_only` | `false` | `true`: Leistung immer in Watt (zum Beispiel 2.350 W) statt ab 1000 W in kW |
| `fit_margin` | `8` | Abstand unten in Pixel |
| `keep_awake` | `auto` | `true`/`false`/`auto`: Bildschirm wach halten (Echo Show, Silk) |
| `nav_path`, `nav_label` | | Schaltfläche zur nächsten Ansicht |

---

## Geräte & Verbrauch: `custom:energy-cockpit-devices-card`

```yaml
type: custom:energy-cockpit-devices-card
title: Geräte & Verbrauch
home: sensor.hausverbrauch
grid_price: input_number.strompreis
feed_in: input_number.einspeiseverguetung
surplus: sensor.pv_ueberschuss
standby_w: 15
home_energy:                       # für Strommix je Zeitraum
  pv: sensor.pv_gesamt_kwh
  import: sensor.netzbezug_gesamt_kwh
  export: sensor.einspeisung_gesamt_kwh
  charge: sensor.batterie_geladen_kwh
  discharge: sensor.batterie_entladen_kwh
rooms:
  - name: Küche
    icon: mdi:silverware-fork-knife
    devices:
      - name: Kühlschrank
        type: fridge
        entity: switch.kuehlschrank
        power: sensor.kuehlschrank_leistung
        energy: sensor.kuehlschrank_energie
        lock: true                 # nur Anzeige
```

### Geräteoptionen

| Schlüssel | Beschreibung |
|---|---|
| `name`, `icon`, `color` | Anzeige |
| `type` | `plug` (Standard), `light`, `pump`, `fridge`, `dryer`, `ac`, `strip`, `tv`, `media`, `console`, `coffee`, `heat` |
| `entity` | Schalter (`switch`, `light`, `input_boolean`) oder Binärsensor |
| `power`, `energy` | Leistungs- und Energiesensor (kWh) |
| `max_w` | Leistung für voll ausgeschlagenen Balken |
| `run_w` | ab dieser Leistung gilt das Gerät als laufend (Standard 3 W) |
| `run_state` | Sensor, dessen Zustand `run` bedeutet "läuft" |
| `lock` | `true`: nicht schaltbar |
| `shared` | `true`: nicht in die Summe aufnehmen |
| `since` | Startdatum des Zählers (ISO), falls die Steckdose früher etwas anderes maß |
| `pv_w` | Leistung, ab der "jetzt mit Sonne laufen lassen" angezeigt wird |
| `channels` | Mehrere Schalter hinter einem Gerät `[{name, entity}]` |
| `info`, `extra`, `extra_unit` | Zusatzzustände anzeigen |
| `on_w`, `toggle`, `mute`, `tv`, `players`, `ambilight` | Mediencenter-Funktionen (TV, Ambilight, Szenen) |

Zusätzliche Verbraucher ohne Kachel, die in Summe und Rangliste zählen:

```yaml
extra_consumers:
  - name: Wallbox
    entity: sensor.wallbox_leistung
    energy: sensor.wallbox_energie
    color: "167,139,250"
```

---

## Statistik: `custom:energy-cockpit-stats-card`

```yaml
type: custom:energy-cockpit-stats-card
title: Statistik
pv_total: sensor.pv_gesamt_kwh
grid_import_total: sensor.netzbezug_gesamt_kwh
grid_export_total: sensor.einspeisung_gesamt_kwh
battery_charge_total: sensor.batterie_geladen_kwh
battery_discharge_total: sensor.batterie_entladen_kwh
battery_capacity_kwh: 7.5
battery_temp: sensor.batterie_temperatur
pv_today: sensor.pv_heute
import_today: sensor.bezug_heute
export_today: sensor.einspeisung_heute
charge_today: sensor.batterie_geladen_heute
discharge_today: sensor.batterie_entladen_heute
home_power: sensor.hausverbrauch          # für die Grundlast nachts
grid_price: input_number.strompreis
feed_in: input_number.einspeiseverguetung
investment_eur: 18000                      # Anschaffungskosten in Euro für die Amortisation ...
# investment: input_number.anschaffung_pv  # ... oder aus einem Sensor oder Helfer
# earned_before_eur: 1200                  # vor Beginn der Zähler bereits erwirtschaftet (wird addiert)
# earned_before: input_number.pv_vorher     # ... oder aus einem Sensor oder Helfer
```

Pflicht sind `pv_total`, `grid_import_total` und `grid_export_total`. Alles andere blendet die jeweilige Anzeige ein. Ohne Preise zeigt die Karte keine Geldwerte, ohne `investment_eur` (fester Betrag) oder `investment` (Sensor oder Helfer) keine Amortisation.

---

## Raum-Abrechnung: `custom:energy-cockpit-room-card`

Zeigt Verbrauch und Kosten eines Raums für **Woche, Monat, Jahr und Vorjahr**, getrennt nach **Bereichen** (jeder Zähler kann beliebig viele Geräte versorgen) und nach **Herkunft der Energie (Netz, Batterie, PV)**, mit Tagesbalken, Tabellen und CSV-Export. Gedacht für die Abrechnung der Strommiete eines vermieteten oder getrennt zu bewertenden Raums.

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
| `devices` | Liste der Bereiche mit je einem Energiezähler (kWh, mit Langzeitstatistik), zum Beispiel `Arbeitsplätze` oder `Chillecke`. `name` und `color` sind optional. |
| `home_energy` | Haus-Zähler für Netz, Batterie und PV. Ohne `import` wird alles zum Bezugspreis bewertet. |
| `price` / `price_ct` | Bezugspreis je kWh als Sensor/Helfer oder fester Wert in Cent. |
| `feed_in` | Einspeisevergütung je kWh. |
| `price_pv`, `price_battery` | Nur für `valuation: mix`. |
| `base_fee` | Grundgebühr je Monat; wird für alle Monate ab dem ersten Messwert addiert. |
| `advance` | Monatlicher Abschlag in Euro (Zahl oder `input_number`). Aktiviert Fortschrittsbalken, Saldo und Jahresbilanz. |
| `devices[].items` | Optional: Unterposten des Bereichs, zum Beispiel ein einzelnes Gerät in der "Chillecke". Je Eintrag `energy` (kWh-Zähler, mit Langzeitstatistik), optional `name` und `power`. Die Summe bleibt der Zähler des Bereichs, die Unterposten erscheinen als "↳"-Zeilen in der Tabelle "Je Bereich" mit kWh, Quellen und Kosten, dazu "↳ übrige Geräte" (Bereich minus Unterposten) und die Live-Leistung in der Kachel. Nur im YAML-Editor |
| `devices[].power` | Optional: Leistungssensor (W) des Bereichs für die Live-Anzeige. |
| `watt_warn`, `watt_high` | Schwellen der Live-Anzeige in Watt (Standard 300 und 800). |
| `standby_w` | Schwelle für die nächtliche Grundlast (0 bis 5 Uhr) in Watt (Zahl oder `input_number`, Standard 80). |
| `active_w` | Ab dieser Leistung gilt eine Stunde als aktiv (Standard 100 W). |
| `archive` | Optional: Sensor mit dem Attribut `monate` (Monatsarchiv). Siehe unten. |

**Hinweise:** Die Kosten werden mit den **aktuellen** Preisen berechnet. Ändert sich ein Preis, ändern sich auch die Werte vergangener Zeiträume. Für eine rechtssichere Abrechnung die Monatswerte (Tabelle oder CSV) am Monatsende festhalten und die Bewertungsregel mit dem Mieter schriftlich vereinbaren.


### Zusatzfunktionen der Raum-Abrechnung

- **Abrechnung und Hochrechnung:** Kosten des laufenden Monats gegen den Abschlag, Hochrechnung bis Monatsende, Saldo (Guthaben oder Nachzahlung), Vergleich mit Vormonat und gleichem Monat im Vorjahr, Jahresbilanz.
- **Jetzt und heute:** aktuelle Leistung je Bereich mit Ampelfarbe und Tageskurve je Stunde.
- **Herkunft heute:** Ring aus Netz, Batterie und PV und das Zeitfenster mit dem im Mittel geringsten Netzanteil (letzte 30 Tage).
- **Grundlast nachts:** mittlere Leistung zwischen 0 und 5 Uhr (letzte 14 Nächte), hochgerechnet auf kWh und Kosten pro Monat.
- **Betriebszeiten:** aktive Stunden heute, Woche und je Wochentag sowie eine Heatmap Wochentag mal Stunde (letzte 8 Wochen).
- **Monatsarchiv:** zeigt festgehaltene Monate mit Zählerständen, Mengen, Preisen und Saldo. Das Archiv füllt eine Automation; die Karte liest nur das Attribut `monate` (Liste mit `k` als `JJJJ-MM`, `kwh`, `g`, `b`, `p`, `cost`, `pg`, `pf`, `ab` und `dev` mit `n`, `a`, `e`, `kwh`).


### Kurzansicht fürs Handy: `compact`

Eine Karte, zwei Ansichten: Mit `compact: auto` zeigt die Energiefluss-Karte auf dem Handy eine kompakte Übersicht und auf Tablet und PC weiter alle Details. Du brauchst dafür kein zweites Dashboard.

```yaml
type: custom:energy-cockpit-flow-card
compact: auto    # nur auf schmalen Bildschirmen (unter 600 px), z. B. iPhone
# compact: true  # Kurzansicht überall
```

| Handy: ausführlich (Standard) | Handy: `compact: auto` | Raum angetippt |
|---|---|---|
| ![Ausführlich](img/gruppen-vorher-handy.png) | ![Kurzansicht](img/kompakt-handy.png) | ![Alle Geräte eines Raums](img/kompakt-fenster.png) |

Was die Kurzansicht anders macht:

- Solar, Netz und Batterie stehen neben dem Ring statt darunter. Die Karte ist etwa halb so hoch.
- Gruppen zeigen nur Name und Summe. Ein **Tipp auf eine Gruppe** (Pfeil „›“) öffnet ein Fenster mit allen Geräten, ihren aktuellen Werten und der Summe. Die Werte laufen live mit, ein Tipp auf ein Gerät öffnet dessen Verlauf, „ד oder ein Tipp daneben schließt das Fenster.
- Zusatztexte entfallen: Aufteilung des Solarstroms, Prognose, Akku-Prognose, Herkunft unter dem Ring.
- Zu den Verbrauchern führt die Sammel-Linie, sofern `groups_lines` nicht gesetzt ist. `groups_columns` gilt in der Kurzansicht nicht, die Gruppen verteilen sich selbst auf die Breite.

Die Umschaltung richtet sich nach der Breite der Karte, nicht nach dem Gerätetyp. Sie gilt also auch für Android und für ein schmales Browserfenster.

### Linien zu den Verbrauchern: `groups_lines`

Mit vielen Verbrauchern laufen die einzelnen Linien eng nebeneinander und teils hinter anderen Kacheln. Die Option `groups_lines: sammel` ersetzt sie durch **eine** Linie zum ganzen Verbraucherbereich.

| Standard (`direkt`) | `sammel` |
|---|---|
| ![Eine Linie je Gruppe](img/sammel-vorher.png) | ![Eine Sammel-Linie](img/sammel-breit.png) |

```yaml
type: custom:energy-cockpit-flow-card
groups_lines: sammel
```

Auf dem Handy bleibt die Linie in der Lücke zwischen den Kacheln:

![Sammel-Linie, schmale Ansicht](img/sammel-schmal.png)

Die Summe in der Plakette ist die Summe der Messwerte der Einzelverbraucher und Gruppen. Der Anteil "nicht erfasst" ist nicht enthalten.
