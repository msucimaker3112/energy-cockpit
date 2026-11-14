<div align="center">

<h1>Energy-Cockpit</h1>

<p><b>Deine Energie auf einen Blick, auch in 3D.</b><br>
Energiefluss, Geräte, Statistik und Raum-Abrechnung für Home Assistant.<br>
Komplett deutsch und kostenlos. Ein Assistent richtet alles ein, du brauchst kein YAML.</p>

[![Version](https://img.shields.io/github/v/release/msucimaker3112/energy-cockpit?label=Version&color=22d3ee)](https://github.com/msucimaker3112/energy-cockpit/releases/latest)
[![In HACS](https://img.shields.io/badge/HACS-Default-41BDF5)](https://hacs.xyz/)
[![Lizenz MIT](https://img.shields.io/badge/Lizenz-MIT-22c55e)](https://github.com/msucimaker3112/energy-cockpit/blob/main/LICENSE)
[![Sprache Deutsch](https://img.shields.io/badge/Sprache-Deutsch-facc15)](#english)

[![In HACS öffnen](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=msucimaker3112&repository=energy-cockpit&category=plugin)

<img src="https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/hero-3d.webp" alt="Energiefluss in der 3D-Ansicht mit laufenden Linien" width="900">

<sub>Alle Bilder zeigen Beispieldaten.</sub>

**[Jedes Gerät](#jeder-raum-jedes-gerät-live)** · **[Die vier Karten](#die-vier-karten)** · **[Installation](#installation)** · **[3D-Ansicht](#3d-ansicht)** · **[Kosten je Verbraucher](#kosten-je-verbraucher)** · **[Handy und Tablet](#handy-und-tablet-eine-karte-zwei-ansichten)** · **[Anleitungen](#anleitungen)** · **[English](#english)**

</div>

## Warum Energy-Cockpit?

<table>
<tr>
<td width="33%" valign="top"><b>Jeder Raum, jedes Gerät</b><br>Nicht nur Solar, Netz und Akku: Du siehst live, wohin dein Strom wirklich fließt, bis zum einzelnen Gerät.</td>
<td width="33%" valign="top"><b>In Minuten eingerichtet</b><br>Der Assistent schlägt passende Sensoren vor und zeigt ihre aktuellen Werte. Feste Gerätenamen gibt es nicht.</td>
<td width="33%" valign="top"><b>Passt zu deiner Anlage</b><br>Balkonkraftwerk, mehrere Speicher, Hybrid-Wechselrichter, Handy oder Wandtablet: Vieles davon kam direkt von Nutzern.</td>
</tr>
</table>

## Jeder Raum, jedes Gerät, live

Die Energiefluss-Karte hört nicht beim Hausverbrauch auf. Fasse Geräte zu Räumen oder Gruppen zusammen: Jede bekommt ihre eigene Linie, die aktuelle Leistung und die Liste ihrer Geräte. Was keiner Gruppe zugeordnet ist, steht auf Wunsch als "Nicht erfasst" daneben. Ein Tipp auf ein Gerät zeigt seinen Verlauf. Das geht in der klassischen Ansicht, in 3D und auf dem Handy.

![Energiefluss mit sieben Räumen und ihren Geräten](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/flow-haus.png)

## Die vier Karten

<table>
<tr>
<td width="50%" valign="top"><b>Energiefluss</b><br>Solar, Netz, Speicher, Haus und Verbraucher als animierter Fluss, mit Akku-Prognose und Überschuss-Hinweis.<br><br><img src="https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/flow.png" alt="Energiefluss mit Kacheln und Ring"></td>
<td width="50%" valign="top"><b>Statistik</b><br>Ersparnis, Autarkie, Amortisation, Grundlast und Monatsvergleich. Optional Kosten je Verbraucher und alle Jahre im Überblick.<br><br><img src="https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/stats.png" alt="Statistik"></td>
</tr>
<tr>
<td width="50%" valign="top"><b>Geräte &amp; Verbrauch</b><br>Raum-Kacheln mit Live-Leistung, Schalten, Kosten pro Gerät und Standby-Detektiv.<br><br><img src="https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/devices.png" alt="Geräte und Verbrauch"></td>
<td width="50%" valign="top"><b>Raum-Abrechnung</b><br>Verbrauch und Kosten eines Raums mit Abschlag, Hochrechnung, Herkunft des Stroms und Monatsarchiv.<br><br><img src="https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/room-kpis.png" alt="Raum-Abrechnung"><br><br><img src="https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/room-abrechnung.png" alt="Abrechnung und Hochrechnung"></td>
</tr>
</table>

## Installation

Energy-Cockpit ist im offiziellen HACS-Store. Du brauchst Home Assistant mit [HACS](https://hacs.xyz/). Am schnellsten geht es über den Knopf oben. Sonst so:

1. HACS öffnen und nach **energy-cockpit** suchen.
2. Eintrag öffnen, **Herunterladen** und bestätigen.
3. Browser-Cache leeren (Strg+F5), in der Home-Assistant-App die App einmal ganz neu starten.
4. Im Dashboard eine Karte hinzufügen: **Energy-Cockpit Energiefluss**, **… Geräte & Verbrauch**, **… Statistik** oder **… Raum-Abrechnung**. Der Assistent führt dich durch die Einrichtung.

Mit manueller Installation und Fehlerbehebung: [Installationsanleitung](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/INSTALLATION.md).

**Das sollte vorhanden sein:**

- Leistungssensoren in W, kW oder MW und Energiesensoren in Wh, kWh oder MWh. Die Karten erkennen die Einheit und rechnen selbst um.
- Für Verlauf und Kosten: Energiezähler mit Langzeitstatistik (`state_class: total_increasing`).
- Empfohlen ist der Ansichtstyp **Panel** (eine Karte, volle Breite). In *Abschnitte*-Ansichten füllt die Karte nur die Breite des Abschnitts.

## 3D-Ansicht

Mit einer Zeile wird aus Kacheln und Ring ein kleines Haus mit Solar, Zählerkasten und Speicher. Der Ladestand steht auf dem Akku, das Netz zeigt die Leistung auf dem Display, die Linien laufen nach den echten Wegen der Energie. Mehrere Speicher, Balkonkraftwerk, Gruppen, Handy-Ansicht und alle Farbschemen gehen auch in 3D. Ohne die Zeile bleibt alles wie bisher.

```yaml
type: custom:energy-cockpit-flow-card
style: 3d
house_style: sattel   # oder flach
```

| Zwei Speicher und Balkonkraftwerk | Hell | Flachdach |
|---|---|---|
| ![Zwei Speicher und Balkonkraftwerk](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/flow-3d-zwei.png) | ![Helles Farbschema](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/flow-3d-hell.png) | ![Flachdach](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/flow-3d-flach.png) |

Mehr dazu: [3D-Ansicht in der Konfiguration](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/KONFIGURATION.md#3d-ansicht-style-3d).

## Kosten je Verbraucher

E-Auto, Wärmepumpe, Warmwasser: Die Statistik zeigt je Gerät, was der Netzstrom kostet und wie viel Solar und Akku gespart haben, für heute, die Woche, den Monat und das Jahr. Mit je einem Zähler für Netz, Akku und PV misst sie, mit nur einem Zähler teilt sie den Verbrauch nach dem Mix des Hauses auf. Ein **Preisverlauf** sorgt dafür, dass alte Stunden zum alten Preis zählen. Der Assistent hat dafür einen eigenen Schritt "Kosten".

![Kosten je Verbraucher](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/kosten-woche.png)

Die Sensoren müssen Zähler in kWh sein, ein Sensor in Watt reicht nicht. Mehr dazu: [Kosten je Verbraucher in der Konfiguration](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/KONFIGURATION.md#kosten-je-verbraucher-optional).

## Handy und Tablet: eine Karte, zwei Ansichten

Die Energiefluss-Karte erkennt, wie breit der Bildschirm ist, und zeigt die passende Ansicht. Du brauchst **kein zweites Dashboard**.

- **Handy: Kurzansicht.** Solar, Netz und Batterie stehen direkt neben dem Hausverbrauch, die Räume nur mit ihrer Summe. Die Karte ist etwa halb so hoch.
- **Raum antippen:** Ein Fenster zeigt alle Geräte des Raums mit ihren aktuellen Werten und der Summe. Ein Tipp auf ein Gerät zeigt dessen Verlauf.
- **Tablet und PC: ausführliche Ansicht** mit jedem Gerät, Prognosen und der Aufteilung des Solarstroms.

| Handy: Kurzansicht | Handy: Raum angetippt | Tablet: ausführlich |
|---|---|---|
| ![Kurzansicht auf dem Handy](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/kompakt-handy.png) | ![Alle Geräte eines Raums](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/kompakt-fenster.png) | ![Ausführliche Ansicht](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/flow.png) |

**Einschalten:** im Assistenten Schritt *Aussehen* → *Kurzansicht* → **Nur auf dem Handy**, oder im YAML:

```yaml
compact: auto    # Kurzansicht nur auf dem Handy (unter 600 px Breite)
# compact: true  # Kurzansicht überall
```

Die Umschaltung richtet sich nach der Breite, nicht nach dem Gerätetyp. Sie funktioniert also auch mit Android-Geräten.

## Der Einrichtungsassistent

Nach dem Hinzufügen einer Karte öffnet sich der Editor im Reiter **Assistent**. Er führt Schritt für Schritt durch die Karte, schlägt passende Sensoren vor und zeigt zu jeder Auswahl den **aktuellen Wert**. So siehst du sofort, ob es der richtige Sensor ist. Im Reiter **Alle Felder** stehen danach alle Optionen für Feinheiten.

| Vorschlag übernehmen | Verbraucher hinzufügen | Farbschema wählen |
|---|---|---|
| ![Assistent: Solar](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/wiz-flow-1-solar.png) | ![Assistent: Verbraucher](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/wiz-flow-5-verbraucher.png) | ![Assistent: Farbschema](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/wiz-flow-7-aussehen.png) |

Bei **Geräte & Verbrauch** legt der Assistent auf Wunsch Räume und Geräte aus den **Bereichen** von Home Assistant an. Alle Schritte mit Bildern stehen in der [Installationsanleitung](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/INSTALLATION.md#5-einrichtungsassistent).

## Passt zu deiner Anlage

Das meiste stellst du im Assistenten ein. Die genauen Einstellungen stehen in der [Konfiguration](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/KONFIGURATION.md).

| Deine Anlage | Was die Karte kann | Einstellung |
|---|---|---|
| **Balkonkraftwerk oder zweite PV-Anlage** | Eigene Kachel und Linie, Autarkie und Herkunft rechnen mit der Summe | `pv2` |
| **Mehrere Speicher** | Eine Kachel je Speicher, Ring und Tageswerte rechnen mit der Summe | `batteries` |
| **Gestapelte Akkus an einem Sensor** | Die Leistung zählt nur einmal, die Prognose teilt sie nach Kapazität auf | gleicher Sensor |
| **Speicher vor dem Wechselrichter** (zum Beispiel Marstek B2500) | Weg Solar → Speicher → Haus mit Eingang, Ausgang und Durchleitung | `pv_to_battery: direkt` |
| **Speicher hinter dem Zähler** (zum Beispiel Zendure an der Steckdose) | Ladung zählt als Verbrauch, Abgabe als Quelle | `behind_meter: true` |
| **Hybrid-Wechselrichter**, dessen Ertrag nur die Abgabe zählt | "PV heute", "Haus heute" und "Autarkie heute" stimmen, in der Statistik auch Autarkie und Aufteilung | `pv.daily_ac`, `pv_ac` |
| **Dynamischer Tarif oder wechselnde Preise** | Fester Preis, Sensor oder Preisverlauf | `grid_price`, `grid_price_ct`, `grid_price_history` |
| **Zweiter Netzzähler mit eigenem Tarif** (zum Beispiel Wärmepumpe) | Eigene Kachel mit Linie zum Haus und Kosten pro Stunde, der Bezug zählt zu Hausverbrauch, Ring und Statistik, mit eigenem Preis | `grid2`, in der Statistik `grid2_total` |
| **Jahresziel für den Netzbezug** | Kachel mit Fortschritt, Soll bis heute, Hochrechnung und Abweichung in kWh und Euro, das Soll gleichmäßig oder nach dem Vorjahr | `budget_kwh`, `budget_profile` |
| **Zwei Zähler in Reihe** | Rechnet die Differenz, auch mit eigenem Tarif | `minus`, `energy_minus`, siehe [Anleitung](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/ZWEI-ZAEHLER.md) |
| **Daten aus der Zeit vor Home Assistant** | Langzeit-Ansicht mit importierter PV-Historie, bereits erwirtschaftete Beträge | `long_term`, `pv_history`, `earned_before_eur` |
| **Wandtablet** | Die Karte passt sich der Bildschirmhöhe an | Standard, aus mit `fit_screen: false` |

<details>
<summary><b>Bilder: Speicher und Solaranlagen</b></summary>

| Batterie mit Entladegrenze | Zwei Speicher | Zwei Speicher, Kurzansicht |
|---|---|---|
| ![Batterie mit Entladegrenze](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/batterie-grenze.png) | ![Zwei Speicher](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/batterien-zwei.png) | ![Zwei Speicher, Kurzansicht](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/batterien-zwei-kurz-handy.png) |

| Zwei PV-Anlagen | Mit Verbrauchern und Sammel-Linie |
|---|---|
| ![Dach und Balkonkraftwerk](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/pv2-bkw.png) | ![Zwei PV-Anlagen mit Verbrauchern](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/pv2-bkw-verbraucher.png) |

**Speicher vor dem Wechselrichter:**

| Speicher lädt | Durchleitung (Speicher voll) | Speicher entlädt |
|---|---|---|
| ![Speicher lädt](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/batterie-vorn-laedt.png) | ![Durchleitung](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/batterie-vorn-durchleitung.png) | ![Speicher entlädt nachts](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/batterie-vorn-nachts.png) |

| Auf dem Handy | Kurzansicht |
|---|---|
| ![Speicher vor dem Wechselrichter, Handy](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/batterie-vorn-handy.png) | ![Speicher vor dem Wechselrichter, Kurzansicht](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/batterie-vorn-kurz-handy.png) |

</details>

<details>
<summary><b>Weitere Einstellungen für die Anzeige</b></summary>

| Thema | Einstellung |
|---|---|
| **Eigene Farben** für Batterie (laden und entladen), Solar, Netz und Haus | `colors` |
| **Textgröße** für Handy und Tablet, auch als Zahl für größere Kachelwerte | `text_size: gross`, `sehr_gross` oder `2` |
| **Große Kacheln** für Wärmepumpe oder Wallboxen (beliebig viele) | `consumers[].size: gross` |
| **Linien zu den Verbrauchern:** eine je Gerät oder eine Sammel-Linie | `groups_lines: direkt` oder `sammel` |
| **Gruppen pro Reihe,** damit Gerätenamen auch auf dem Handy lesbar sind | `groups_columns: 1` |
| **Alles in Watt** statt ab 1000 W in kW | `watt_only: true` |
| **Feste Nachkommastellen,** zum Beispiel immer `10,80 kWh` | `decimals: 2` |
| **Geräte in Gruppen nach Leistung,** die aktiven oben | `consumer_groups_sort: leistung` |
| **Dachfarbe** in der 3D-Ansicht | `roof_color: anthrazit` |
| **Kachel "Nicht erfasst"** ausblenden oder erst ab einem Anteil zeigen, bei einzelnen Verbrauchern ohne Gruppen mit `hide_rest: false` einschalten | `hide_rest`, `rest_min: 10` |
| **Farbe der Zahl beim Haus** nach der größten Quelle (PV gelb, Speicher blau, Netz rot) | `home_color: source` |
| **Statistik** startet mit „Heute“, der Woche oder dem Jahr | `start_period: day` |
| **Aktiv ab:** ab welcher Leistung Rahmen und Linie erscheinen | `on_w` |
| **Batterie:** Entladegrenze und Maximalladung, Ladestand im nutzbaren Bereich, Temperatur | `reserve_soc`, `max_soc`, `soc_display: nutzbar`, `temp` |
| **PV-Prognose** für morgen und übermorgen, zum Beispiel von Forecast.Solar oder Solcast | `pv.forecast_tomorrow`, `pv.forecast_day_after` |
| **Himmelsband** mit dem Wetter des Tages (24 Stunden, Sonnenaufgang und -untergang) | `weather` |
| **Haus heute** aus einem eigenen Sensor | `home.daily` |
| **Unterposten** in der Raum-Abrechnung | `devices[].items` |

Drei Zusatzfunktionen gibt es nur im YAML-Editor: **Müllabfuhr-Hinweis** aus einem HA-Kalender, **Überschuss-Vorschläge** (zum Beispiel "jetzt Waschmaschine starten") und ein **Netzalarm** bei hohem Bezug.

| Textgröße normal | `gross` | `sehr_gross` |
|---|---|---|
| ![Normal](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/text-normal.png) | ![Groß](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/text-gross.png) | ![Sehr groß](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/text-sehr-gross.png) |

| Sammel-Linie | Morgens in Watt | `watt_only: true` und "Haus heute" |
|---|---|---|
| ![Sammel-Linie](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/sammel-breit.png) | ![Energiefluss am Morgen](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/flow-watt.png) | ![Alles in Watt](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/watt-only.png) |

| Handy: Gruppen nebeneinander | Handy: `groups_columns: 1` | Tablet: `groups_columns: 1` |
|---|---|---|
| ![Gruppen nebeneinander](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/gruppen-vorher-handy.png) | ![Eine Gruppe pro Reihe](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/gruppen-reihe-handy.png) | ![Eine Gruppe pro Reihe, breit](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/gruppen-reihe-breit.png) |

</details>

## Raum-Abrechnung

Für einen Raum mit eigenen Zählern, zum Beispiel ein vermietetes Büro oder eine Werkstatt. Die Karte rechnet nach der **Herkunft** der Energie und bewertet nach dem **entgangenen Nutzen**: PV-Strom, den das Haus selbst gebraucht hätte, kostet so viel wie Netzstrom.

<details>
<summary><b>Bilder: alle Bereiche der Raum-Abrechnung</b></summary>

| Bereich | Bild |
|---|---|
| **Abrechnung und Hochrechnung:** Kosten gegen Abschlag, Hochrechnung bis Monatsende, Saldo, Vergleich mit Vormonat und Vorjahr | ![Abrechnung](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/room-abrechnung.png) |
| **Jetzt und heute:** aktuelle Leistung je Bereich mit Ampelfarbe und Tageskurve | ![Live](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/room-live.png) |
| **Herkunft heute:** Anteile Netz, Batterie, PV und das Zeitfenster mit dem geringsten Netzanteil | ![Herkunft](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/room-herkunft.png) |
| **Grundlast nachts:** Leerlauf zwischen 0 und 5 Uhr, hochgerechnet auf kWh und Kosten pro Monat | ![Grundlast](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/room-grundlast.png) |
| **Betriebszeiten:** aktive Stunden und Heatmap Wochentag × Stunde | ![Betriebszeiten](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/room-betriebszeiten.png) |
| **Monatsarchiv:** eingefrorene Monatswerte mit Zählerständen | ![Archiv](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/room-archiv.png) |

</details>

Einrichtung, Mitteilung am Monatsersten und Standby-Warnung: [Anleitung zur Abrechnung](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/ABRECHNUNG.md).

## Farbschemen

Alle vier Karten gibt es in mehreren Farbschemen, einstellbar im Assistenten (Schritt *Aussehen*) oder mit `theme` im YAML. Die Farben der Quellen (Netz rot, Batterie blau, PV gelb) bleiben überall gleich.

| `theme` | Aussehen |
|---|---|
| `dunkel` | Mitternachtsblau (Standard) |
| `graphit` | Neutrales Dunkelgrau |
| `hell` | Weiß mit kühlem Grau |
| `warm` | Helles Papier |
| `auto` | Folgt dem hellen oder dunklen Design von Home Assistant |
| `ha` | Übernimmt die Farben deines Home-Assistant-Designs |

| Hell | Warm | Graphit |
|---|---|---|
| ![Hell](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/theme-hell-flow.png) | ![Warm](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/theme-warm-flow.png) | ![Graphit](https://raw.githubusercontent.com/msucimaker3112/energy-cockpit/main/docs/img/theme-graphit-flow.png) |

## Anleitungen

| Anleitung | Inhalt |
|---|---|
| [Installation](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/INSTALLATION.md) | Installation, Assistent, Aktualisieren und Fehlerbehebung |
| [Konfiguration](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/KONFIGURATION.md) | Alle Optionen mit Beispielen |
| [Abrechnung](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/ABRECHNUNG.md) | Raum-Karte, Mitteilung am Monatsersten, Standby-Warnung |
| [Zwei Zähler in Reihe](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/ZWEI-ZAEHLER.md) | Zum Beispiel Wärmepumpe oder Wallbox zwischen zwei Zählern |
| [Handout (PDF)](https://github.com/msucimaker3112/energy-cockpit/blob/main/docs/Energy-Cockpit-Handout.pdf) | Zum Ausdrucken |
| [Änderungsprotokoll](https://github.com/msucimaker3112/energy-cockpit/blob/main/CHANGELOG.md) | Was sich je Version geändert hat |

**Kleinstes Beispiel im YAML:**

```yaml
type: custom:energy-cockpit-flow-card
pv:
  entity: sensor.pv_leistung
grid:
  entity: sensor.netz_leistung
battery:
  power: sensor.batterie_leistung
  soc: sensor.batterie_ladestand
```

**Gut zu wissen:**

- Kosten erscheinen nur, wenn ein Strompreis eingestellt ist. Es gibt keinen voreingestellten Preis.
- Die Raum-Abrechnung braucht ein bis zwei volle Stunden Daten, bevor Betriebszeiten und Grundlast Werte zeigen. Für die Hochrechnung ist mindestens ein ganzer Messtag nötig.
- Läuft in der Home-Assistant-App auf iPhone, iPad und Android sowie im Browser. Entwickelt und getestet mit Chromium-basierten Browsern (Chrome, Edge) und dem Silk-Browser des Echo Show, im Einsatz auch auf iPhone und iPad. Sehr alte Browser ohne Container-Queries und `color-mix` werden nicht unterstützt.
- Die Karte rechnet höchstens einmal pro Sekunde neu. Wird dein Gerät trotzdem warm, schalte dort "Bewegung reduzieren" ein, dann stehen die Animationen still.

## Mitmachen und unterstützen

Ein ⭐ oben rechts hilft anderen, das Projekt zu finden. Fehlt dir etwas oder passt etwas bei dir nicht? Schreib ein [Issue](https://github.com/msucimaker3112/energy-cockpit/issues). Viele Funktionen sind genau so entstanden, zuletzt die Kosten je Verbraucher.

**Unterstützen:** Energy-Cockpit ist kostenlos und bleibt es. Es steckt aber viel Zeit in Entwicklung, Tests, Doku und Antworten auf eure Fragen. Wenn du mir ein Dankeschön geben möchtest, freue ich mich sehr: [Mit PayPal spenden](https://www.paypal.com/donate/?hosted_button_id=DTCAKWGEZ23SN). Danke!

**Du kannst programmieren?** Übersetzung, neue Ideen, Fehlerbehebung: Forks und Pull Requests sind willkommen. Wie du ohne Home Assistant loslegst, steht in [CONTRIBUTING.md](https://github.com/msucimaker3112/energy-cockpit/blob/main/CONTRIBUTING.md).

## English

**Energy flow, devices, statistics and room billing cards for Home Assistant.** Free, MIT licensed, with a setup wizard that suggests matching sensors, so no YAML is needed.

- **Energy flow:** animated solar, grid, one or more batteries (with discharge limit and forecast), home and consumers, surplus hint, second PV system (e.g. balcony solar). Optional 3D view with `style: 3d`.
- **One card, two views:** with `compact: auto` the card shows a compact overview on phones and the full view on tablets and PCs. Tap a room on the phone to see all its devices.
- **Devices & consumption, statistics** (savings, self-sufficiency, payback, cost per consumer) and **room billing** (cost per room, source grid/battery/PV, base load, monthly archive).

**Install:** Energy-Cockpit is in the default HACS store. Open HACS, search for *energy-cockpit*, download it and reload the browser. Then add a card and search for *Energy-Cockpit*.

The user interface is currently **German only**. An English translation is planned and a good way to contribute, see the issues labelled [good first issue](https://github.com/msucimaker3112/energy-cockpit/labels/good%20first%20issue) and [CONTRIBUTING.md](https://github.com/msucimaker3112/energy-cockpit/blob/main/CONTRIBUTING.md). Issues and pull requests in English are welcome.

## Lizenz

MIT, siehe [LICENSE](https://github.com/msucimaker3112/energy-cockpit/blob/main/LICENSE).
