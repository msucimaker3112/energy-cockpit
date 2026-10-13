# Energy-Cockpit

Vier Karten für Home Assistant, die zusammen ein **Energie-Cockpit** für das Haus ergeben. Alle Sensoren sind frei wählbar, es gibt keine festen Gerätenamen im Code. Die Texte sind komplett deutsch, die Währung kommt aus Home Assistant.

| Karte | Zeigt |
|---|---|
| `energy-cockpit-flow-card` | Animierter **Energiefluss**: Solar, Netz, Batterie mit Entladegrenze, Haus, Verbraucher (eine Linie je Gerät oder eine Sammel-Linie), Überschuss-Hinweis, Akku-Prognose |
| `energy-cockpit-devices-card` | **Geräte & Verbrauch**: Raum-Kacheln mit Live-Leistung, Schalten, Kosten pro Gerät, Standby-Detektiv |
| `energy-cockpit-stats-card` | **Statistik**: Ersparnis, Einspeiseerlös, Autarkie, Amortisation (mit Anschaffungskosten), Grundlast, Monatsvergleich, Akku |
| `energy-cockpit-room-card` | **Raum-Abrechnung**: Verbrauch und Kosten eines Raums mit Abschlag, Hochrechnung, Live-Leistung, Herkunft (Netz, Batterie, PV), Grundlast, Betriebszeiten und Monatsarchiv |

![Energiefluss](docs/img/flow.png)

![Geräte und Verbrauch](docs/img/devices.png)

![Statistik](docs/img/stats.png)

## Der Einrichtungsassistent

Nach dem Hinzufügen einer Karte öffnet sich der Editor im Reiter **Assistent**. Er führt Schritt für Schritt durch die Karte, schlägt passende Sensoren aus deinen vorhandenen Entitäten vor und zeigt zu jeder Auswahl den **aktuellen Wert**, damit du sofort siehst, ob es der richtige Sensor ist. Alles wird sofort gespeichert. Im Reiter **Alle Felder** stehen danach alle Optionen für Feinheiten.

| 1. Schritt wählen und Vorschlag übernehmen | 2. Verbraucher hinzufügen | 3. Farbschema wählen |
|---|---|---|
| ![Assistent: Solar](docs/img/wiz-flow-1-solar.png) | ![Assistent: Verbraucher](docs/img/wiz-flow-5-verbraucher.png) | ![Assistent: Farbschema](docs/img/wiz-flow-7-aussehen.png) |

Bei **Geräte & Verbrauch** legt der Assistent auf Wunsch Räume und Geräte aus den **Bereichen** von Home Assistant an:

![Assistent: Räume aus Bereichen](docs/img/wiz-devices-assistent.png)

Die Schritte der einzelnen Karten sind in der [Installationsanleitung](docs/INSTALLATION.md#5-einrichtungsassistent) mit Bildern erklärt.

## Strompreis, Batterie und Linien

| Thema | Was du einstellen kannst |
|---|---|
| **Strompreis** | Fester Preis in Cent pro kWh (`grid_price_ct`, `feed_in_ct`) oder ein Sensor bzw. `input_number` (`grid_price`, `feed_in`). Es gibt keinen voreingestellten Preis. |
| **Batterie** | Entladegrenze und Maximalladung als Sensor/Helfer oder fester Prozentwert. Die Grenzen erscheinen schraffiert auf dem Ladebalken, die nutzbare Kapazität fließt in die Prognose ein. Optional zeigt `battery.soc_display: nutzbar` den Ladestand relativ zum nutzbaren Bereich. |
| **Linien zu den Verbrauchern** | `groups_lines: direkt` (Standard) zeichnet eine Linie je Gerät oder Gruppe, `groups_lines: sammel` nur eine Linie zum ganzen Verbraucherbereich mit der Summe. |
| **Anschaffungskosten** | `investment_eur` (fester Betrag) oder `investment` (Sensor) für die Amortisation in der Statistik. |

| Batterie mit Entladegrenze | Sammel-Linie zu den Verbrauchern |
|---|---|
| ![Batterie](docs/img/batterie-grenze.png) | ![Sammel-Linie](docs/img/sammel-breit.png) |

Alle Optionen mit Beispielen: [docs/KONFIGURATION.md](docs/KONFIGURATION.md). Die Änderungen je Version: [CHANGELOG.md](CHANGELOG.md).

## Farbschemen

Alle vier Karten gibt es in mehreren Farbschemen. Gewählt wird im Assistenten (Schritt *Aussehen*) oder mit `theme` im YAML. Ohne Angabe bleibt das dunkle Standarddesign.

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
| ![Hell](docs/img/theme-hell-flow.png) | ![Warm](docs/img/theme-warm-flow.png) | ![Graphit](docs/img/theme-graphit-flow.png) |

Die Raum-Abrechnung kennt zusätzlich `accent` (Akzentfarbe, etwa `34,197,94` oder `#22c55e`). Die Farben der Quellen (Netz rot, Batterie blau, PV gelb) bleiben in allen Schemen gleich.

## Neu: Raum-Abrechnung

Für einen Raum mit eigenen Zählern, zum Beispiel ein vermietetes Büro oder eine Werkstatt. Die Karte rechnet nach der **Herkunft** der Energie (Netz, Batterie, PV) und bewertet nach dem **entgangenen Nutzen**: PV-Strom, den das Haus selbst gebraucht hätte, kostet so viel wie Netzstrom.

![Raum-Abrechnung: Übersicht](docs/img/room-kpis.png)

| Bereich | Bild |
|---|---|
| **Abrechnung und Hochrechnung:** Kosten gegen Abschlag, Hochrechnung bis Monatsende, Saldo, Vergleich mit Vormonat und Vorjahr | ![Abrechnung](docs/img/room-abrechnung.png) |
| **Jetzt und heute:** aktuelle Leistung je Bereich mit Ampelfarbe und Tageskurve | ![Live](docs/img/room-live.png) |
| **Herkunft heute:** Anteile Netz, Batterie, PV und das Zeitfenster mit dem geringsten Netzanteil | ![Herkunft](docs/img/room-herkunft.png) |
| **Grundlast nachts:** Leerlauf zwischen 0 und 5 Uhr, hochgerechnet auf kWh und Kosten pro Monat | ![Grundlast](docs/img/room-grundlast.png) |
| **Betriebszeiten:** aktive Stunden und Heatmap Wochentag × Stunde | ![Betriebszeiten](docs/img/room-betriebszeiten.png) |
| **Monatsarchiv:** eingefrorene Monatswerte mit Zählerständen | ![Archiv](docs/img/room-archiv.png) |

Einrichtung der Raum-Karte, der Mitteilung am Monatsersten und der Standby-Warnung: [docs/ABRECHNUNG.md](docs/ABRECHNUNG.md).

## Schnellstart (mit HACS)

1. HACS öffnen → Menü (⋮) oben rechts → **Benutzerdefinierte Repositories**.
2. Repository `https://github.com/msucimaker3112/energy-cockpit` eintragen, Kategorie **Dashboard** wählen, **Hinzufügen**.
3. "Energy-Cockpit" in HACS suchen, **Herunterladen**, Browser-Cache leeren (Strg+F5).
4. Im Dashboard eine Karte hinzufügen: **Energy-Cockpit Energiefluss**, **… Geräte & Verbrauch**, **… Statistik** oder **… Raum-Abrechnung**. Der Assistent führt dich durch die Einrichtung.

Ausführlich, mit manueller Installation und Fehlerbehebung: [docs/INSTALLATION.md](docs/INSTALLATION.md).
Alle Optionen mit Beispielen: [docs/KONFIGURATION.md](docs/KONFIGURATION.md).
Zum Ausdrucken: [docs/Energy-Cockpit-Handout.pdf](docs/Energy-Cockpit-Handout.pdf).

## Minimalbeispiele

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

```yaml
type: custom:energy-cockpit-room-card
title: Büro
devices:
  - name: Arbeitsplätze
    energy: sensor.buero_1_energie
    power: sensor.buero_1_leistung
price_ct: 34
advance: 35
```

Die meisten Einstellungen erledigt der grafische Editor. Abfallkalender, Überschussvorschläge und Netzalarm stellst du im YAML-Editor ein.

## Voraussetzungen

- Home Assistant mit Lovelace-Dashboards. Die Karten brauchen Platz: Ansichtstyp **Panel** (eine Karte, volle Breite) ist empfohlen. In *Abschnitte*-Ansichten füllt die Karte nur die Breite des Abschnitts.
- Leistungssensoren in W oder kW, Energiesensoren in kWh.
- Für Verlauf, Kosten und die Raum-Abrechnung: Energiezähler mit Langzeitstatistik (`state_class: total_increasing`).

## Hinweise

- Kosten werden nur angezeigt, wenn ein Strompreis konfiguriert ist.
- Die Karten skalieren sich auf die sichtbare Bildschirmhöhe (Wandtablet-Betrieb). Abschaltbar mit `fit_screen: false`.
- Die Raum-Abrechnung braucht ein bis zwei volle Stunden Daten, bevor Betriebszeiten und Grundlast Werte zeigen. Für die Hochrechnung ist mindestens ein ganzer Messtag nötig.
- Getestet mit Chromium-basierten Browsern und dem Silk-Browser des Echo Show (ältere Browser: keine Container-Queries, kein `color-mix`).

## Lizenz

MIT, siehe [LICENSE](LICENSE).
