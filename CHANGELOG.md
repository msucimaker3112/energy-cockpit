# Änderungsprotokoll

## 0.19.0
- **Energiefluss, 3D-Ansicht (optional, `style: 3d`):** Haus, Solar, Netz und Speicher erscheinen als kleine 3D-Objekte statt als Kacheln mit Symbolen. Das Haus steht auf dem Ring mit dem Mix aus Solar, Akku und Netz, der Ladestand steht auf der Front des Speichers, das Netz zeigt die Leistung auf dem Display des Zählerkastens. Die Linien laufen nach den echten Wegen: Solar lädt den Speicher direkt, Solar speist direkt ein, das Netz lädt den Akku, der Speicher speist ein. Das Haus bekommt nur, was dort ankommt. Mehrere Speicher, Balkonkraftwerk, PV-Strings, Gruppen, Kurzansicht, Handy-Layout und alle Farbschemen funktionieren auch in 3D. Das Haus gibt es mit Satteldach oder Flachdach (`house_style`). Ohne `style` ändert sich nichts. Einstellbar im Schritt "Aussehen" des Assistenten.
- **Statistik, Kosten je Verbraucher (optional, `cost_consumers`):** Zeigt je Gerät, etwa E-Auto, Wärmepumpe oder Warmwasser, die Netzkosten und was Solar und Akku gespart haben, in den Reitern Heute, Woche, Monat und Jahr. Mit je einem Zähler für Netz, Akku und PV misst die Karte, mit nur einem Zähler teilt sie den Verbrauch jeder Stunde nach dem Mix des Hauses auf. Läuft das Gerät, steht die Leistung mit den Kosten pro Stunde dabei. Symbol und Farbe wählt die Karte selbst, das Symbol nach dem Namen. Einrichten im neuen Assistenten-Schritt "Kosten" (bis zu vier Verbraucher, weitere unter "Alle Felder" oder in YAML). Wunsch aus [#19](https://github.com/msucimaker3112/energy-cockpit/issues/19).
- **Statistik, neuer Reiter "Woche":** Er zählt ab Montag und zeigt auch die Geldwerte und die Autarkie oben für diese Woche. Er erscheint nur, wenn Verbraucher eingetragen sind.
- **Statistik, Preisverlauf (optional, `grid_price_history`):** Jede Stunde rechnet mit ihrem eigenen Strompreis, aus der Langzeitstatistik des Preis-Sensors (dynamischer Tarif), aus einer Liste früherer Preise oder mit dem heutigen Preis. Gilt für die Kosten je Verbraucher.
- **Statistik, Hybrid-Wechselrichter (optional, `pv_ac`):** Zählt der Gesamtertrag nur die Abgabe des Wechselrichters, rechnet die Karte den Hausverbrauch als PV + Bezug - Einspeisung. Das gilt für die Autarkie und die Aufteilung nach Haus-Mix.
- **Statistik, Kosten-Kärtchen:** Das Badge mit Leistung und Kosten pro Stunde rutscht bei langen Namen in die nächste Zeile, statt den Namen abzuschneiden.

Alles Neue ist optional, bestehende Einstellungen bleiben unverändert.

## 0.18.2
- **Energiefluss, weniger Rechenlast:** Das Leuchten von Kacheln, Symbolen und Titelpunkt sowie der Glanz im Banner laufen jetzt über Deckkraft und Verschiebung statt über Schatten und Position. Das Gerät muss dafür nicht mehr in jedem Bild neu zeichnen, die Optik bleibt praktisch gleich. Eine Animation im Ring, die nicht zu sehen war, ist entfernt.
- **Energiefluss, deutlich weniger Rechenlast bei laufenden Sensoren:** Die Karte rechnet höchstens einmal pro Sekunde neu. Zahlen zählen nur noch bei großen Sprüngen hoch, kleine Änderungen stehen sofort da. Das Hochzählen hat bisher bei jeder kleinen Änderung in jedem Bild Text geschrieben, das kann Handys spürbar wärmen.
- **Energiefluss, "Bewegung reduzieren":** Am Gerät eingestellt, stehen jetzt auch die Symbole in den Gruppen still.

## 0.18.1
- **Energiefluss, Tagesertrag von Hybrid-Wechselrichtern (optional, `pv.daily_ac`):** Manche Wechselrichter zählen im Tagesertrag nur ihre Abgabe, die Ladung des Akkus direkt aus den Modulen fehlt darin. Die Karte zog sie trotzdem ab, deshalb stand "Autarkie heute" bei 0 % und "Haus heute" war viel zu niedrig. Mit der neuen Einstellung stimmen "PV heute", "Haus heute" und "Autarkie heute". Ohne Eintrag ändert sich nichts.

## 0.18.0
- **Energiefluss, Temperatur je Speicher (optional, `temp`):** Jeder Speicher kann einen eigenen Temperatur-Sensor bekommen, im Assistenten (Schritte "Batterie" und "Weitere Speicher"), im Formular oder in YAML. Der Wert steht in der Kachel unter dem Ladestand, ein Tipp öffnet den Verlauf. Ohne Eintrag ändert sich nichts. Wunsch aus [#17](https://github.com/msucimaker3112/energy-cockpit/issues/17).

## 0.17.0
- **Statistik: Langzeit-Ansicht (optional, `long_term: true`).** Einschaltbar im Assistenten (Schritt "Langzeit") und im Formular, standardmäßig aus. Ohne die Option bleibt die Karte unverändert. Eingeschaltet liest die Karte alle Jahre aus der Langzeitstatistik von Home Assistant: Jahre blättern mit ‹ ›, neuer Reiter "Gesamt", Hinweis "Daten ab …". Fehlende Monate zählen nicht als 0: Sie sind im Diagramm markiert und werden genannt. Summen für ein Jahr und "Gesamt" enthalten nur Monate mit PV, Bezug und Einspeisung.
- **Statistik: importierte PV-Historie (`pv_history`, nur mit `long_term`).** Eine Statistik-ID, auch eine extern importierte wie `sensor:deye_ac_historisch`, füllt die Monatsbalken und "PV gesamt". `pv_history_until: 2026-04` legt fest, bis wann die Historie gilt, `pv_history_name` die Bezeichnung in der Legende. Jeder Monat hat genau eine Quelle, nichts zählt doppelt. Geldwerte, Autarkie, Akku und Amortisation rechnen weiter nur mit `pv_total`. Anregung aus [#14](https://github.com/msucimaker3112/energy-cockpit/issues/14).
- **Hinweis:** Geldwerte älterer Zeiträume rechnen mit den heutigen Preisen, die Karte weist darauf hin.
- **Energiefluss, Speicher vor dem Wechselrichter (`pv_to_battery: direkt`):** Die Solar-Kachel zeigt jetzt `→ Speicher` statt `→ Haus`, denn der Solarstrom geht zuerst in den Speicher. Bei Einspeisung zeigt der Speicher, wie sich sein Ausgang aufteilt, zum Beispiel `Ausgang 331 W (Haus 315 W · Netz 16 W)`. Auf dem Handy steht die Legende Solar/Akku/Netz über dem Ring, damit keine Linie durch sie läuft. Rückmeldungen aus [#15](https://github.com/msucimaker3112/energy-cockpit/issues/15).
- **Energiefluss, Speicher hinter dem Zähler (optional, `behind_meter: true` je Speicher):** Für Speicher, die an der Steckdose hängen und die der Wechselrichter oder Netzzähler nicht kennt (zum Beispiel ein Zendure neben einer Viessmann-Anlage). Der Speicher behält seine Kachel, die Karte rechnet ihn aber nicht aus dem Hausverbrauch heraus. Seine Ladung zählt also als Verbrauch, seine Abgabe senkt ihn, sobald Netz- und Wechselrichterwerte das zeigen. Ring, Autarkie und die Tageswerte für Autarkie und Haus rechnen ohne ihn. Ohne die Option ändert sich nichts. Anregung aus [#15](https://github.com/msucimaker3112/energy-cockpit/issues/15).
- **Energiefluss, gestapelte Akkus:** Tragen mehrere Speicher denselben Leistungssensor (`power` oder `power_charge` und `power_discharge`), zählt die Karte die Leistung nur noch einmal. Der erste Speicher zeigt den Wert, die übrigen zeigen `—` mit dem Status des ersten, beide den Hinweis "Gemeinsamer Sensor mit …". Die Prognose teilt die Leistung nach Kapazität auf. Auch derselbe Sensor bei `daily_charge` oder `daily_discharge` zählt nur einmal. Rückmeldung aus [#17](https://github.com/msucimaker3112/energy-cockpit/issues/17).
- **Energiefluss, Hausverbrauch:** Liefert der Sensor `home.entity` einen negativen Wert, rechnet die Karte den Verbrauch selbst aus Solar, Netz und Batterie. Bisher erschien der Betrag als positiver Verbrauch, zum Beispiel 71 W bei −71 W ([#15](https://github.com/msucimaker3112/energy-cockpit/issues/15)).
- **Assistent:** Fragt jetzt die Tageswerte der Batterie ab (geladen und entladen heute), auch für Speicher 2 und 3. Ohne sie zählt der Akku bei "Autarkie heute" nicht als eigener Strom ([#18](https://github.com/msucimaker3112/energy-cockpit/issues/18)).

## 0.16.0
- **Differenz-Messstellen allgemeiner:** `minus` und `plus` (Energiefluss) sowie `energy_minus`, `energy_plus`, `power_minus`, `power_plus` (Raum-Abrechnung) dürfen **Listen** sein: Hauptzähler minus mehrere Unterzähler. Im **Assistenten** gibt es dafür bei den Verbrauchern (Energiefluss) und den Zählern (Raum-Abrechnung) das optionale Feld "Davon abziehen", in der Raum-Abrechnung zusätzlich einen eigenen Preis je Bereich. Unterposten (`items`) erben den Preis ihres Bereichs. Ohne diese Felder ändert sich nichts. Anleitung mit mehreren Aufbauten: [Zähler in Reihe](docs/ZWEI-ZAEHLER.md#direkt-in-der-karte-option).
- **Tageswerte aus Gesamtzählern (optional, `daily_from_total: true`):** Die Energiefluss-Karte zeigt bei Bezug, Einspeisung, Ertrag und Batterie "heute" bisher den Sensorwert unverändert, dafür brauchte man Tageszähler. Mit der Option trägst du stattdessen Gesamtzähler ein (auch in Wh, zum Beispiel von Viessmann). Die Karte berechnet den Wert von heute selbst aus der Langzeitstatistik, wie das Energie-Dashboard von Home Assistant. Fällt die Statistik aus, gilt der Sensorwert wie bisher. Ohne die Option ändert sich nichts. Anregung aus [#15](https://github.com/msucimaker3112/energy-cockpit/issues/15).
- **Statistik:** Hinweis bei einem Strompreis unter 1 Cent ("Das Feld erwartet Cent, zum Beispiel 23.88", [#16](https://github.com/msucimaker3112/energy-cockpit/issues/16)). Liegt das Amortisationsziel mehr als 60 Jahre entfernt, steht "Prognose noch nicht aussagekräftig" statt einer Jahreszahl. Das Feld für den Netzbezug heute heißt jetzt "Netzbezug heute (nicht der Gesamtverbrauch)".

## 0.15.0
- **Zählerkaskade (optional):** Differenz-Verbraucher ohne eigene Helfer. Energiefluss: `consumers[].minus` (und `plus`) rechnen `entity − minus (+ plus)`, auch für Einträge in Gruppen. Raum-Abrechnung: `devices[].energy_minus` / `energy_plus` für Energie (je Stunde aus den Statistik-Änderungen), `power_minus` / `power_plus` für die Live-Leistung. Dazu ein **eigener Bezugspreis je Bereich** (`devices[].price_ct` oder `price`, auch für `items`), zum Beispiel für einen Wärmepumpentarif. Alles ist ohne diese Felder ohne Wirkung: bestehende Karten rechnen unverändert. Beschreibung in [Zähler in Reihe](docs/ZWEI-ZAEHLER.md#direkt-in-der-karte-option). Anregung aus der Facebook-Gruppe (Zähler-Kaskaden, Messkonzept 8) und Issue #9.

## 0.14.0
- **Speicher vor dem Wechselrichter (`pv_to_battery: direkt`):** Für Balkonkraftwerke mit Speicher (zum Beispiel Marstek B2500), bei denen der Solarstrom immer durch den Speicher läuft. Die Karte zeichnet Solar → Speicher → Haus (Solar über dem Speicher, das Netz rechts), zeigt am Speicher Eingang und Ausgang und `Durchleitung`, wenn er weder lädt noch entlädt. Neu: `battery.power_out` (Ausgangsleistung ins Haus). Laden und Entladen ergeben sich aus Solar-Eingang minus Ausgang, die Herkunft des Hausstroms zählt als Solar, soweit der Ausgang vom Solar-Eingang gedeckt ist. Einstellbar im Assistenten (Schritt "Batterie") und im Formular. Ohne die Option ändert sich nichts. Anregung von Michael Laske und aus [#15](https://github.com/msucimaker3112/energy-cockpit/issues/15).

## 0.13.0
- **Mehrere Speicher (`batteries`):** `battery` ist der erste Speicher, `batteries` enthält die weiteren. Im Assistenten gibt es dafür den Schritt "Weitere Speicher", im Formular den Bereich "Weitere Speicher". Jeder Speicher bekommt eine eigene Kachel rechts (Name, Leistung, Status lädt/entlädt/Standby, Ladebalken, Prognose "voll um / reicht bis", eigene Entladegrenze). Ring (Herkunft), Autarkie, Banner und Tageswerte rechnen mit der Summe: Lädt der eine Speicher, während der andere entlädt, zählt beides. Der Ladestand für Banner und Statistik ist der nach Kapazität gewichtete Mittelwert. Ohne `batteries` bleibt alles wie bisher (`battery`). Für das Handy empfiehlt sich die Kurzansicht (`compact: auto`).
- **Statistik-Karte:** `battery_charge_total`, `battery_discharge_total`, `charge_today`, `discharge_today` und `battery_capacity_kwh` dürfen Listen sein und werden summiert.

## Doku
- **Neue Anleitung "Zwei Zähler in Reihe"** ([docs/ZWEI-ZAEHLER.md](docs/ZWEI-ZAEHLER.md)): Verbrauch zwischen zwei hintereinander geschalteten Zählern (Z1/Z2) als Differenz bilden und in der Karte anzeigen. Keine neue Funktion, nur Beispiel mit Home-Assistant-Helfern.

## 0.12.6
- **Behoben: Statistik wurde auf dem Handy nach Tipp auf "Heute" kleiner.** Die Karte hat sich bei jedem Neuaufbau auf die Bildschirmhöhe eingepasst. Auf dem Handy schrumpfte dadurch der ganze Inhalt auf etwa 55 bis 60 %, sobald man den Zeitraum wechselte. Auf dem Handy (unter 600 px Breite) bleibt die Statistik jetzt immer in voller Größe und lässt sich scrollen. Auf Tablet und PC bleibt der Maßstab beim Wechsel zwischen Heute, Monat und Jahr gleich und wird nur neu berechnet, wenn sich die Breite ändert oder neue Daten geladen sind, wie bei "Geräte & Verbrauch" seit 0.11.0.

## 0.12.5
- **Behoben: Assistent zeigte eingetragene Sensoren nicht an** ([#10](https://github.com/msucimaker3112/energy-cockpit/issues/10)). Oben stehen höchstens 12 Vorschläge. Weitere Treffer fehlten bisher auch in der Liste "Alle passenden Sensoren". Gab es viele passende Sensoren, etwa mehrere Leistungswerte eines Speichers, blieb das Auswahlfeld deshalb leer, obwohl der Sensor eingetragen war. Jetzt stehen alle übrigen Treffer unten in der Liste.
- **Behoben: Assistent zeigte "Einzelverbraucher: 0".** Das Formular "Alle Felder" speichert Verbraucher als nummerierte Einträge (`'0':`, `'1':` …). Der Assistent erkennt diese Form jetzt, zeigt die Verbraucher an und behält sie beim Hinzufügen weiterer Geräte.

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
