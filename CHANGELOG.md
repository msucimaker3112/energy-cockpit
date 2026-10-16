# Änderungsprotokoll

## 0.9.2
- **Batterie: Ladestand als Verlauf:** Ein Klick auf Ladebalken oder Prozentzahl öffnet den Verlauf des Ladestands (%). Der Rest der Kachel öffnet wie bisher den Verlauf der Lade-/Entladeleistung. Mit `battery.tap: soc` öffnet die ganze Kachel den Ladestand.

## 0.9.1
- **Prognose in kWh:** Ein Prognose-Sensor mit der Einheit kWh (zum Beispiel Solcast "Prognose heute") wird jetzt als "Prognose heute 6,0 kWh" angezeigt. Vorher erschien aus 6 kWh fälschlich "6 W". Einheiten werden außerdem unabhängig von der Groß-/Kleinschreibung erkannt.
- **Batterie mit zwei Sensoren:** neue Optionen `battery.power_charge` und `battery.power_discharge` für Systeme, die Laden und Entladen getrennt melden (zum Beispiel SunEnergyXT). Im Assistenten (Schritt *Batterie*) und im Formular.

## 0.9.0
- **Zweite Solaranlage (`pv2`):** zum Beispiel ein Balkonkraftwerk. Eigene Kachel und Linie zum Haus, Tagesertrag wird addiert, Autarkie, Eigenverbrauch und Herkunft rechnen mit der Summe. Die zweite Anlage deckt zuerst das Haus, die erste lädt danach die Batterie. Einstellbar im Assistenten (Schritt *Solar*) und im Formular. Mit `pv2.add_to_home: true` addiert die Karte die zweite Anlage zum Hausverbrauch, falls der Sensor sie nicht enthält.

## 0.8.3
- **Netz:** Die Beschriftung zeigt "Bezug" oder "Einspeisung" ab 0,5 W. "Ausgeglichen" erscheint nur noch, wenn praktisch nichts fließt. Die animierte Linie bleibt wie bisher ab 10 W aktiv.
- **Textgröße:** neue Option `text_size` (`normal`, `gross`, `sehr_gross`). Vergrößert Ladestand, Kennzahlen oben rechts und Beschriftungen, gedacht für Handy und Tablet.
- **Nicht erfasst erst ab x %:** neue Option `rest_min`, zum Beispiel `10`.

## 0.8.2
- **Kachel "Nicht erfasst" ausblendbar:** neue Option `hide_rest: true` (Assistent, Schritt *Verbraucher*, und Formular). Vorher erschien sie bei jeder Gruppenliste und ließ sich nur über `rest: false` im YAML abschalten.

## 0.8.1
- **PV-Kachel zeigt die Aufteilung:** "→ Haus … · Batterie … · Netz …" macht sichtbar, wohin die erzeugte Leistung geht.
- **Klarere Bezeichnungen:** Die Kennzahlen oben heißen jetzt "Autarkie jetzt" und "Eigenverbrauch jetzt" und lassen sich von "Autarkie heute" unterscheiden.
- **Screenshots** zeigen Endwerte (vorher teils mitten in der Zähl-Animation) und sind als Beispieldaten gekennzeichnet.

## 0.8.0
- **Linien zu den Verbrauchern:** neue Option `groups_lines: sammel`. Statt einer Linie je Gerät oder Gruppe gibt es eine Sammel-Linie vom Ring zum ganzen Verbraucherbereich (Plakette mit der Summe, Rahmen um den Bereich). Auswahl im Assistenten (Schritt *Verbraucher*) und im Formular. Standard bleibt `direkt`.

## 0.7.0
- **Batterie:** Entladegrenze und Maximalladung als Sensor oder Helfer (`battery.reserve_soc`, `battery.max_soc`) oder als fester Wert (`battery.reserve_pct`, `battery.max_pct`). Schraffierte Bereiche auf dem Ladebalken, optional Anzeige des nutzbaren Anteils (`battery.soc_display: nutzbar`). Eingaben im Assistenten (Schritt *Batterie*).

## 0.6.1
- **Statistik:** Anschaffungskosten der PV-Anlage als fester Betrag (`investment_eur`) für die Amortisation, im Assistenten im Schritt *Preise*.

## 0.6.0
- **Farbschemen** für alle vier Karten: `dunkel` (Standard), `graphit`, `hell`, `warm`, `auto`, `ha`. Auswahl mit Vorschau im Assistenten (Schritt *Aussehen*) oder mit `theme`. Raum-Abrechnung: `accent` für die Akzentfarbe.

## 0.5.1
- **Strompreis:** fester Preis in Cent pro kWh (`grid_price_ct`, `feed_in_ct`) als Alternative zu Sensor oder Helfer, in allen Karten und im Assistenten.
- **Start im Assistenten:** Neu hinzugefügte Karten bleiben leer und öffnen den Einrichtungsassistenten, statt Sensoren zu raten.

## 0.5.0
- **Raum-Abrechnung:** Abschlag mit Saldo, Hochrechnung bis Monatsende, Live-Leistung mit Tageskurve, Herkunft heute (Netz, Batterie, PV), Grundlast nachts, Betriebszeiten mit Heatmap und Monatsarchiv.

## 0.4.x
- **Raum-Abrechnung:** Herkunft der Energie (Netz, Batterie, PV) und Bewertung nach entgangenem Nutzen, Bezeichnung "Je Bereich".

## 0.3.0
- **Neue Karte:** Raum-Abrechnung (Woche, Monat, Jahr, Vorjahr, CSV-Export).

## 0.2.x
- **Einrichtungsassistent** in allen Karten, mit Sensor-Vorschlägen und Anzeige des aktuellen Werts.
- **Logos** (`image`) für Gruppen, Verbraucher, Räume und Geräte.

## 0.1.x
- Erste Veröffentlichung: Energiefluss, Geräte & Verbrauch und Statistik als HACS-Karten, komplett deutsch.
