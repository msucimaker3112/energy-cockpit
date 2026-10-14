# Änderungsprotokoll

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
