# Änderungsprotokoll

## 0.12.4
- **Behoben: Energiefluss erschien auf dem iPad erst klein am linken Rand und zoomte dann auf Seitenbreite** ([#10](https://github.com/msucimaker3112/energy-cockpit/issues/10)). Seit 0.12.3 hielt die Karte ihren Maßstab fest, solange neue Werte einliefen. Ein falscher erster Maßstab, etwa solange Schrift und Seite noch laden, blieb deshalb stehen. Jetzt passt sich die Karte sofort neu an, wenn sich Breite oder verfügbare Höhe ändern, und noch einmal, sobald die Schrift geladen ist. Gegen das Zittern beim Hochzählen hilft weiterhin das Halten des Maßstabs.
- **Gepunkteter Ring um den Hausverbrauch auf dem iPhone sichtbar.** Der Ring besteht jetzt aus runden Punkten statt aus sehr feinen Strichen. Auf dem Handy und in der Kurzansicht sind die Punkte größer und kräftiger. Vorher waren sie dort kleiner als ein Pixel, und Safari hat sie verschluckt.
- **Assistent:** Kommen die Entitäten von Home Assistant erst nach der Konfiguration an, baut sich der Assistent einmal neu auf. So erscheinen eingetragene Sensoren zuverlässig mit Namen und Wert.

## 0.12.3
- **Energiefluss: kein Zittern mehr beim Hochzählen der Werte.** Solange die Zahlen auf einen neuen Wert hochzählen, hält die Karte ihren Maßstab und passt sich danach einmal an, bei ständig neuen Werten höchstens alle 5 Sekunden. Kleine Größenänderungen werden ignoriert: Vergrößert wird erst ab 4 %, verkleinert ab 1,5 %. Betraf vor allem Safari auf dem iPhone und die Vorschau im Editor bei vergrößerter Schrift.
- **Textgröße (`text_size`) über echte Schriftgrößen.** "Groß" und "Sehr groß" vergrößern die Schrift jetzt um genau 25 % bzw. 50 % statt über die CSS-Eigenschaft `zoom`, die Browser unterschiedlich messen.
- **Neu: `animations: always`.** Ist am Gerät "Bewegung reduzieren" eingeschaltet (iPhone: Einstellungen → Bedienungshilfen → Bewegung), stehen Linien und der gepunktete Ring um den Hausverbrauch still. Mit `animations: always` animiert die Karte trotzdem. Standard bleibt, die Einstellung des Geräts zu beachten. Einstellbar im Assistenten (Schritt *Aussehen*) und im Formular.
- **Assistent: eigene Entitäten sichtbar.** Eine Entität, die nicht in der Vorschlagsliste steht (zum Beispiel im YAML eingetragen), erscheint im Auswahlfeld unter "Eigene Auswahl" mit Namen und aktuellem Wert statt als "(nicht gefunden)".

## 0.12.2
- **Energiesensoren in Wh oder MWh werden umgerechnet** ([#13](https://github.com/msucimaker3112/energy-cockpit/issues/13)). Die Karten lesen die Einheit jedes Energiesensors und rechnen intern immer in kWh: Wh wird durch 1000 geteilt, MWh mit 1000 malgenommen. Das gilt für die Tageswerte im Energiefluss, die Statistik und die Raum-Abrechnung. Bisher erschienen Wh-Werte 1000-mal zu groß. Bei Sensoren in kWh oder ohne Einheit ändert sich nichts.
- **Leistung in kW oder MW** wird jetzt in allen Karten gleich umgerechnet, auch in "Geräte & Verbrauch" und der Raum-Abrechnung.
- **Notausschalter:** Mit `energy_unit: kwh` in der Kartenkonfiguration nimmt die Karte die Werte wie bisher ungeprüft als kWh. Standard ist `auto`.

## 0.12.1
- **Kurzansicht: Gruppe antippen zeigt alle Geräte.** In der Kurzansicht (`compact`) öffnet ein Tipp auf eine Gruppe ein Fenster mit allen Geräten dieser Gruppe, ihren aktuellen Werten und der Summe. Die Werte laufen live mit, ein Tipp auf ein Gerät öffnet dessen Verlauf. Ein Pfeil "›" an der Gruppe zeigt, dass sie sich öffnen lässt.
- **Behoben: Kurzansicht mit `groups_columns`.** Mit "Gruppen pro Reihe" (zum Beispiel `1`) zeigte die Kurzansicht die Geräteliste trotzdem an, die Einträge ragten über die Kacheln hinaus.
- **Behoben:** Nach mehrfachem Neuaufbau der Karte (zum Beispiel beim Bearbeiten im Editor) konnte ein Klick den Verlauf mehrfach öffnen.

## 0.12.0
- **Energiefluss: Kurzansicht (`compact`).** Eine kompakte Übersicht auf einen Blick, etwa halb so hoch: Solar, Netz und Batterie stehen neben dem Ring, Gruppen zeigen nur Name und Summe, Zusatztexte (Aufteilung, Prognose, Herkunft) entfallen. Mit `compact: auto` gilt das nur auf dem Handy, Tablet und PC zeigen weiter die ausführliche Ansicht. `compact: true` nutzt die Kurzansicht überall. Einstellbar im Assistenten (Schritt *Aussehen*) und im Formular. Standard bleibt die ausführliche Ansicht.

## 0.11.0
- **Energiefluss: kein Zucken mehr bei Netzbezug.** Während das Hinweis-Banner ein- oder ausfährt, bleibt die Skalierung stehen und wird danach einmal angepasst. Kleine Schwankungen unter 2 % werden ignoriert.
- **Geräte & Verbrauch: gleiche Größe in allen Zeiträumen.** Der Wechsel zwischen Heute, Woche, Monat und Jahr verkleinert die Karte nicht mehr. Neu skaliert wird nur, wenn sich Breite oder Bildschirmhöhe ändern.
- **Energiefluss: Option `watt_only`.** Zeigt alle Leistungen in Watt statt ab 1000 W in kW. Standard bleibt kW.
- **Energiefluss: Kachel "Haus heute".** Hausverbrauch des Tages in kWh in der unteren Zeile. Berechnet aus PV-Ertrag, Bezug, Einspeisung und Batterie oder aus einem eigenen Sensor (`home.daily`).
- **Energiefluss: Schwelle je Verbraucher (`on_w`).** Ab welcher Leistung ein Verbraucher oder eine Gruppe als aktiv gilt (Rahmen, Linie). Standard bleibt 10 W.
- **Energiefluss: Gruppen pro Reihe (`groups_columns`).** Mit `1` steht jede Gruppe in einer eigenen Reihe über die volle Breite, die Verbrauchernamen sind besser lesbar. Standard bleibt: alle Gruppen nebeneinander.
- **Statistik: bereits erwirtschaftet (`earned_before_eur` oder `earned_before`).** Wird zur Amortisation addiert, wenn die Anlage schon lief, bevor Home Assistant die Zähler erfasst hat.

## 0.10.1
- **Sicherheit:** Namen, Symbole, Entitäten, Navigationspfade und Texte aus der Konfiguration sowie Attribute von Entitäten (zum Beispiel das Monatsarchiv der Raum-Abrechnung) werden vor der Anzeige maskiert. Ein `<`, `'` oder `"` in einem Namen bricht die Karte nicht mehr, und HTML darin wird nicht mehr ausgeführt. Farben (`color`) werden geprüft: Erlaubt sind `#rrggbb`, `#rgb` und `r,g,b`, andere Werte fallen auf die Standardfarbe zurück.

## 0.10.0
- **Raum-Abrechnung: Unterposten (`devices[].items`):** Ein Bereich kann einzelne Geräte mit eigenem Zähler ausweisen (zum Beispiel ein Kühlschrank in der "Chillecke"). Die Abrechnung des Bereichs bleibt unverändert, die Unterposten erscheinen als "↳"-Zeilen mit kWh, Quellen (Netz, Batterie, PV) und Kosten, dazu "↳ übrige Geräte". In der Live-Kachel steht die aktuelle Leistung und der Verbrauch heute, im CSV eigene Spalten.

## 0.9.3
- **HACS-Validierung:** Eine GitHub-Action prüft das Repository bei jeder Änderung automatisch (Voraussetzung für die Aufnahme in den HACS-Standard). Die Karten selbst sind unverändert.

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
