# Änderungsprotokoll

## Unveröffentlicht
- **Statistik, Geldwerte Stunde für Stunde: `hourly_pricing`.** Ist `grid_price` ein Sensor mit Langzeitstatistik, rechnen Stromkosten Netz, Solar-Ersparnis und Einspeiseerlös jetzt je Stunde mit dem Preis dieser Stunde (Einspeisung mit dem Stundenmittel von `feed_in`, wenn es ein Sensor ist), für Heute, Woche, Monat, Jahr und Gesamt. Bei Zeittarifen mit günstigem Nachtstrom zeigen die Kacheln so die echten Kosten statt Menge mal heutigem Preis. Stunden ohne Preisstatistik zählen wie bei den Kosten je Verbraucher mit `grid_price_history`, danach mit dem heutigen Preis. Wechselt der Preis innerhalb einer Stunde (etwa um 23:30), rechnen Bezug und Einspeisung dieser Stunde in 5-Minuten-Schritten, solange die Kurzzeitstatistik des Recorders noch vorhanden ist (Standard 10 Tage), sonst mit dem Stundenmittel. Die Solar-Ersparnis zählt selbst genutzten Solarstrom je Stunde, und „Selbst genutzt“ in der Kachel zeigt dieselben kWh. Einspeisung aus der Batterie außerhalb der Solarstunden verringert ihn damit nicht mehr. Die Kacheln bleiben dann auch sichtbar, wenn der Preis gerade 0 oder negativ ist, und die Fußzeile zeigt den Preis statt „Preise konfigurieren“. Der Hinweis in der Langzeit-Ansicht nennt dann die Stundenpreise statt der heutigen Preise (auch auf Englisch, Niederländisch, Französisch und Finnisch). Ohne Preisstatistik bleibt alles wie bisher. `hourly_pricing: false` schaltet es ab, auch im Editor unter „Alle Felder“.

## 0.42.1
- **Fehler behoben, Energiefluss mit `pv_to_battery: direkt`: Laden aus dem Netz wurde nicht angezeigt.** Lud der Speicher (zum Beispiel Zendure Hyper 2000) nachts oder bei wenig Sonne aus dem Netz, fehlten Linie und Hinweis. Jetzt zeigt die Batterie-Kachel die Zeile „Laden vom Netz“, und die Linie zwischen Haus und Batterie läuft in Netzfarbe zum Speicher. Mit `battery.power_in` (AC-Eingangsleistung) gilt der Sensorwert, sonst schätzt die Karte aus dem Ladesensor: Ladung minus Solar-Überschuss. Ohne Ladesensor bleibt alles wie bisher. Der Hausverbrauch war schon richtig. Anlass: [#94](https://github.com/msucimaker3112/energy-cockpit/issues/94).
- Die Versionsnummer im Bundle stimmt wieder (0.42.0 meldete intern noch 0.41.0).

## 0.42.0
- **Energiefluss, Batterie vor dem Wechselrichter: `big_value: out` und `self_consumption`.** Für Speicher wie den Zendure Hyper 2000: Mit `battery.big_value: out` zeigt die große Zahl der Batterie-Kachel den Ausgang ins Haus (bei Durchleitung und Entladung), die Entladeleistung steht darunter in einer Zeile „Entladung“. Bei Ladung bleibt die Ladeleistung. Mit `battery.self_consumption` (Sensor oder `true` für „berechnen“) zeigt die Kachel zusätzlich den Eigenbedarf des Speichers. Beides ist aus, bis du es setzt, und wirkt nur mit `pv_to_battery: direkt`. Im Editor unter „Batterie“, Texte auch in den vier Übersetzungen. Anlass: [#92](https://github.com/msucimaker3112/energy-cockpit/issues/92).
- **Statistik, „Erzeugung“ statt „Erzeugt“.** In der Tabelle der Tageswerte heißt die Zeile jetzt „Erzeugung“ (Englisch „Production“, Niederländisch „Opwekking“, Französisch „Production“, Finnisch „Tuotanto“). Anlass: [#90](https://github.com/msucimaker3112/energy-cockpit/issues/90).
- **Glossar:** Neue Seite [`docs/GLOSSAR.md`](docs/GLOSSAR.md) erklärt die Begriffe der Karten (Eigenverbrauch, Autarkie, Erzeugung, Eigenbedarf …) und die Schreibregeln der Oberfläche.

## 0.41.0
- **Energiefluss, ruhende Verbraucher ausblenden: `hide_zero`.** Mit `hide_zero: true` verschwinden Einzelverbraucher, Gruppen und Geräte in Gruppen, die unter ihrer Schwelle liegen (`on_w`, Standard 10 W), und erscheinen sofort wieder, sobald sie laufen. Damit nichts flackert, muss ein Eintrag `hide_zero_delay` Sekunden (Standard 30) ruhen, bevor er verschwindet. Beim Laden der Seite sind ruhende Einträge gleich weg. Sie zählen weiter zum Hausverbrauch und zu „Nicht erfasst“. Geht auch zusammen mit `consumers_top`. Im Editor unter „Alle Felder“.
- **Energiefluss, „Warum?“ auch für Solar und Batterie.** Mit `why: true` (nicht nur an der Netz-Kachel) erscheint ein „?“ an Solar und an jeder Batterie. Solar erklärt, wohin der Strom geht und warum er gerade so wenig ist (Nacht mit Sonnenaufgang, tiefe Sonne, Wetter und Bewölkung, Tageswert gegen Prognose) und warum es ins Netz geht. Die Batterie erklärt, woher die Ladung kommt (Solar oder Netz), wen sie versorgt, oder warum sie nichts tut (leer, voll, Betriebsart oder Sperrzeit). Nur an einzelnen Kacheln im YAML: `why: [grid]` oder `why: [pv, battery]`. Alle Texte gibt es auch auf Englisch, Niederländisch, Französisch und Finnisch (von mir übersetzt, Verbesserungen willkommen). Anlass: [#50](https://github.com/msucimaker3112/energy-cockpit/issues/50).
- **Energiefluss, Öl statt Gas: `gas.fuel: oil`.** Die Kachel heißt „Öl“, trägt das Symbol `mdi:oil` und zeigt Liter. Sensoren in kWh, Liter oder m³ sind möglich, kWh rechnet die Karte mit `kwh_per_l` (Standard 10) in Liter um. Im Editor unter „Gas oder Öl“ und im Assistenten (Schritt „Gas/Wasser“). Anlass: [#87](https://github.com/msucimaker3112/energy-cockpit/issues/87).
- **Energiefluss, Zusatzwerte an Gas und Wasser.** Wie bei Solar, Netz und Batterie gibt es `extra` jetzt auch an der Gas- und der Wasser-Kachel, zum Beispiel die Kesseltemperatur. Mit `no_name: true` (oder `name: ""`) steht nur der Wert da, ohne Namen. `no_name` gilt für alle Zusatzwerte.
- **Energiefluss, mehrere Wasserzähler.** `water` darf eine Liste sein, jeder Zähler bekommt eine eigene Kachel mit eigenem Namen (bis zu vier), auch in der 3D-Ansicht. Im Editor gibt es dafür „Zweiter Wasserzähler“ und „Dritter Wasserzähler“. Ein einzelner `water`-Eintrag bleibt unverändert. Anlass: [#82](https://github.com/msucimaker3112/energy-cockpit/issues/82).

## 0.40.0
- **Geräte & Verbrauch, Schriftgröße: `text_size` und `label_size`.** Die Geräte-Karte versteht jetzt beide Optionen wie Energiefluss und Statistik: `gross`, `sehr_gross` oder eine Zahl vergrößern die Texte, eine Zahl auch die großen Werte, `label_size` nur die Texte. Im Editor unter „Allgemein“. Anlass: [#86](https://github.com/msucimaker3112/energy-cockpit/issues/86).
- **Statistik, Amortisation: „von … zurückverdient“ in der Zeile mit der Prozentzahl.** Der Betrag steht jetzt rechtsbündig neben dem Prozentwert, in derselben Farbe, wie bei den anderen Kacheln. Anlass: [#88](https://github.com/msucimaker3112/energy-cockpit/issues/88).
- **Fehler behoben, Geräte-Editor:** Das Feld „Sprache der Karte“ (seit 0.36.0) war im Editor der Geräte-Karte nicht mit der Konfiguration verbunden, die Auswahl blieb ohne Wirkung. Jetzt wird `language` gespeichert. Im YAML ging es schon vorher.

## 0.39.1
- **Statistik, Farben im Editor:** Die Statistik-Karte versteht `colors` schon länger, im Editor gab es dafür aber kein Feld. Wer nur den Editor benutzt, konnte die Batteriefarbe deshalb nicht ändern („es bleibt blau“). Jetzt gibt es im Reiter „Alle Felder“ den Abschnitt „Farben“ mit Solar, Netzbezug, Einspeisung, Batterie, Batterie lädt und Haus. Trägt man dort die Ladefarbe aus dem Energiefluss ein, folgen Kacheln, Balken und die Zeile „Batterie“ bei den Kosten je Verbraucher. Die Karten übernehmen Farben nicht voneinander, jede Karte braucht ihren Eintrag. Anlass: [#81](https://github.com/msucimaker3112/energy-cockpit/issues/81).
- **Statistik, Beschriftungen bei den Kosten je Verbraucher:** „Netzkosten“ und „Ersparnis“ unter den großen Werten sind jetzt so groß wie die Zeilen in den anderen Kacheln.

## 0.39.0
- **Energiefluss, nur die größten Verbraucher: `consumers_top`.** Mit zum Beispiel `consumers_top: 8` zeigt die Karte von allen eingetragenen Einzelverbrauchern nur die 8 mit der höchsten Leistung, nach Leistung absteigend. Damit die Kacheln nicht ständig springen, wechselt die Reihenfolge erst, wenn sie 30 Sekunden anders bleibt (`consumers_top_delay`), sofort nur, wenn ein ausgeblendetes Gerät das kleinste sichtbare deutlich übertrifft. Ausgeblendete Geräte zählen weiter zum Hausverbrauch und zu „Nicht erfasst“. Im Editor und im Assistenten sind jetzt bis zu 30 Einzelverbraucher möglich (bisher 12). Wunsch aus [#76](https://github.com/msucimaker3112/energy-cockpit/issues/76).
- **Energiefluss, Gesamtsensor je Gruppe.** Eine Verbrauchergruppe kann jetzt einen eigenen Leistungssensor bekommen (`entity` an der Gruppe, zum Beispiel ein Zwischenzähler). Die Gruppe zeigt dessen Wert, unter den Geräten steht als letzte Zeile „Rest“ mit der Differenz zur Summe der Geräte (`rest_name` benennt sie um). Die Leistung zählt nur einmal, auch bei „Nicht erfasst“. Auch im Fenster der Kurzansicht und im Editor. Wunsch aus [#79](https://github.com/msucimaker3112/energy-cockpit/issues/79).
- **Energiefluss, Prognosen nebeneinander: `forecast_swap`.** Mit `forecast_swap: true` stehen unten „Prognose heute“, „Prognose morgen“ und „Prognose übermorgen“ in einer Reihe, der bisherige Ertrag „Solar heute“ wandert in die Solar-Kachel. Voraussetzung ist eine Tagesprognose in kWh als `pv.forecast`. Schalter im Editor und im Assistenten, Standard bleibt wie bisher. Wunsch aus [#80](https://github.com/msucimaker3112/energy-cockpit/issues/80).
- **Energiefluss, Name vor dem Zusatzwert: `secondary_name`.** Zum Beispiel `secondary_name: SoC eAuto` an der Wallbox zeigt „SoC eAuto 80 %“. Für Einzelverbraucher und Einträge in Gruppen, auch im Editor. Wunsch aus [#83](https://github.com/msucimaker3112/energy-cockpit/issues/83).
- **Statistik, Kosten je Verbraucher:** Die Ersparnis steht jetzt so groß wie die Netzkosten und heißt „Ersparnis“ statt „gespart“ (auch in der Summe oben). Ohne `colors.battery` nimmt die Statistik jetzt `colors.battery_charge`, so passt derselbe `colors`-Block wie im Energiefluss. Vorschläge aus [#81](https://github.com/msucimaker3112/energy-cockpit/issues/81).
- **Französisch vollständig.** Shadowspocket hat alle fehlenden französischen Texte ergänzt ([#78](https://github.com/msucimaker3112/energy-cockpit/pull/78)). Merci ! Auf Finnisch fehlte nur noch der Hinweis aus 0.38.0, er ist ergänzt. Alle vier Übersetzungen (Englisch, Niederländisch, Französisch, Finnisch) sind damit vollständig.

## 0.38.0
- **Finnisch vollständig.** [@omcberry](https://github.com/omcberry) hat die 167 fehlenden finnischen Texte ergänzt und einige vorhandene gekürzt ([#77](https://github.com/msucimaker3112/energy-cockpit/pull/77)). Kiitos!
- **Eigene Textfarben: `colors.text_muted` und `colors.text`.** Die grauen Beschriftungen (Kachelnamen, „Ladestand“, „Temperatur“, Zusatzwerte, Achsen) und die Werte lassen sich jetzt in jeder Karte und jedem Farbschema selbst einfärben, zum Beispiel `text_muted: "#000000"` für mehr Kontrast im hellen Schema. Im Energiefluss-Editor unter „Farben“. Wunsch aus [#73](https://github.com/msucimaker3112/energy-cockpit/issues/73).
- **Energiefluss, Hinweis bei `pv_to_battery`:** Ist „Solar läuft durch den Speicher“ eingestellt, fehlt aber die Ausgangsleistung des Speichers (`battery.power_out`), zeigt die Batterie-Kachel jetzt einen Hinweis, statt still die normale Darstellung zu zeigen. Editor und Assistent nennen die Anker Solarbank und schlagen Sensoren wie „AC-Hausabgabe“ vor. Anlass: [#75](https://github.com/msucimaker3112/energy-cockpit/issues/75).
- **Energiefluss, Gas-Kachel:** Lange Zeilen wie „Warmwasser“ brechen nicht mehr um, der Wert bleibt rechts in derselben Zeile, zu lange Beschriftungen werden mit „…“ gekürzt.

## 0.37.0
- **Französisch und Finnisch.** Die Karten sprechen jetzt auch Französisch (Beitrag von Shadowspocket, [#39](https://github.com/msucimaker3112/energy-cockpit/pull/39)) und Finnisch (Beitrag von [@omcberry](https://github.com/omcberry), [#30](https://github.com/msucimaker3112/energy-cockpit/issues/30), „Finnish translation: omcberry“). Beide Sprachen sind noch nicht vollständig: Rund die Hälfte der Texte, die seit den Beiträgen dazugekommen sind, erscheint vorerst auf Deutsch. `language: fr` oder `language: fi` legt die Sprache fest, sonst folgt die Karte dem Home-Assistant-Profil. Vielen Dank!
- **`npm run missing -- fr`** listet die Texte, die in einer Sprache noch fehlen, mit der deutschen Vorlage. So lässt sich eine Übersetzung leicht ergänzen.
- **Prüfung der Übersetzungen:** Ein neuer Test stellt sicher, dass jede Übersetzung die Platzhalter (`{n}`) und HTML-Tags des deutschen Textes behält und kein unzulässiges HTML enthält.

## 0.36.0
- **Sprache der Karten: Deutsch, Englisch, Niederländisch.** Die Karten zeigen ihre Texte in der Sprache aus dem Home-Assistant-Profil. Andere Sprachen zeigen Deutsch. Editoren und Assistent bleiben deutsch. Den Mechanismus und die englischen und niederländischen Texte hat [@aavdberg](https://github.com/aavdberg) beigesteuert ([#74](https://github.com/msucimaker3112/energy-cockpit/pull/74)). [@bartjackbakker](https://github.com/bartjackbakker) hat die niederländischen Texte geprüft, sein früherer Beitrag ([#38](https://github.com/msucimaker3112/energy-cockpit/pull/38)) war der Anstoß. Vielen Dank!
- **Neu: `language`.** Wer Home Assistant auf Englisch betreibt, die Karte aber deutsch lesen will, legt in der Karte `language: de` fest (`auto` ist der Standard, dazu `en` und `nl`). Im Assistenten steht das Feld im Schritt „Aussehen“.
- **Zahlen und Uhrzeit nach dem Profil:** Zahlenformat („1.234,5“ oder „1,234.5“) und 12-/24-Stunden-Uhr folgen den Einstellungen im Home-Assistant-Profil, unabhängig von der Sprache. Ohne eigene Einstellung bleibt für deutsche Nutzer alles wie bisher.

## 0.35.0
- **Energiefluss, Gas und Wasser:** Neu und optional sind `gas` und `water`, je eine eigene Kachel mit Linie zum Haus, rechts unter der Batterie. Gas zeigt groß die Leistung der Therme (wenn `gas.entity` eingetragen ist), sonst den Verbrauch von heute, darunter Heizung und Warmwasser getrennt (`heating`, `hot_water`) oder eine Summe (`daily`). Sensoren in m³ rechnet die Karte mit `kwh_per_m3` in kWh um, ohne Angabe zeigt sie m³. Wasser zeigt den Durchfluss in l/min und den Verbrauch von heute in Litern oder m³. Beides zählt nicht zum Strom: Hausverbrauch, Ring und Autarkie bleiben gleich. In der 3D-Ansicht stehen eine Gastherme mit Flamme und ein Wasserzähler mit drehendem Zeiger. Farben über `colors.gas` und `colors.water`, einstellbar im Editor und im Assistenten (Schritt „Gas/Wasser“). Wunsch aus [#65](https://github.com/msucimaker3112/energy-cockpit/issues/65).

## 0.34.0
- **Geräte & Verbrauch, Messgeräte ohne Schalter:** `entity` ist jetzt optional. Fehlt sie, nimmt die Karte `power` (sonst `energy`), zum Beispiel für Shelly EM, die nur messen. Solche Geräte und alle mit einem Sensor als `entity` zeigen keinen Schalter, und ein Tipp schaltet nichts. Gemeldet in [#71](https://github.com/msucimaker3112/energy-cockpit/issues/71).
- **Statistik, Erzeugung in „Solar-Ersparnis“:** Über „Selbst genutzt“ steht jetzt „Erzeugt … kWh“, die gesamte Solarproduktion im gewählten Zeitraum (auch in der Kachel Solar-Eigenverbrauch). Vorschlag aus [#72](https://github.com/msucimaker3112/energy-cockpit/issues/72).
- **Statistik, `text_size`:** Die Statistik-Karte versteht jetzt `text_size` wie die Energiefluss-Karte: `gross` und `sehr_gross` vergrößern die kleinen Texte, eine Zahl (zum Beispiel `2`) auch die großen Werte. Einstellbar auch im Assistenten unter „Aussehen“. Anlass: [#40](https://github.com/msucimaker3112/energy-cockpit/issues/40).
- **Eigene Farben auch in Statistik und Geräte-Karte:** `colors` wirkt jetzt auch dort. Statistik: `pv`, `grid_import`, `grid_export`, `battery`, `home`. Geräte & Verbrauch: `pv`, `grid_import`. Hilft zum Beispiel im hellen Farbschema mit dunkleren Tönen. Vorschlag aus [#73](https://github.com/msucimaker3112/energy-cockpit/issues/73).
- **Energiefluss, Prognose in der Kurzansicht:** Neu ist `compact_forecast: true`. In der Kurzansicht zeigt die Solar-Kachel dann die Zeile „Prognose heute … kWh“, alle anderen Zusatzzeilen bleiben ausgeblendet. Im Editor als Schalter. Vorschlag aus [#69](https://github.com/msucimaker3112/energy-cockpit/issues/69).
- **Assistent, bis zu fünf Speicher:** Ein neuer Schritt „Speicher 4/5“ fragt den vierten und fünften Speicher ab, zum Beispiel mehrere Solarbänke. Bisher ging das nur unter „Alle Felder“ oder per YAML.

## 0.33.5
- **Energiefluss, 3D-Bilder wachsen mit der Schrift:** Mit großer `label_size` oder `text_size` wurde der Text in den Kacheln groß, die 3D-Bilder (Solarmodul, Zähler, Batterie) blieben aber klein. Auf großen Wandtablets sah das verloren aus. Jetzt wachsen die Bilder mit: über dem Text bis knapp zur doppelten Höhe, neben dem Text bis 1,4-mal so breit, auch in der Kurzansicht. Ohne große Schrift bleibt alles wie bisher. Gemeldet in [#67](https://github.com/msucimaker3112/energy-cockpit/issues/67).
- **Energiefluss, „Inaktiv“ statt „Standby“:** Die Batterie-Kachel zeigt im Ruhezustand jetzt „Inaktiv“, wie die Solar-Kachel. Vorschlag aus [#68](https://github.com/msucimaker3112/energy-cockpit/issues/68).
- **Statistik, Zeilen unter den Werten aufgeräumt:** Die Zeilen unter den großen Werten stehen jetzt wie in der Fußzeile, Beschriftung links und Wert rechts: „Selbst genutzt“ (Solar-Ersparnis und Solar-Eigenverbrauch), „Einspeisung“, „Bezug“, „davon Grundpreis“ und „davon …“ für den zweiten Zähler (Stromkosten Netz), „Eigenverbrauch“ und „Verbrauch“ (Autarkie). Vorschlag aus [#66](https://github.com/msucimaker3112/energy-cockpit/issues/66).
- **Statistik, Hinweis unten mit Grundpreis:** Mit `grid_base_fee` stand unten weiter „reine Energiekosten ohne Grundgebühr“. Jetzt heißt es dann „Stromkosten Netz mit Grundpreis“.

## 0.33.4
- **Statistik, Grundpreis:** Neu und optional: `grid_base_fee` (Euro pro Monat). Der Grundpreis zählt anteilig je Tag in „Stromkosten Netz“ mit, für Heute, Woche, Monat, Jahr und Gesamt, im laufenden Monat bis heute. Unter dem Wert steht „davon Grundpreis …“. Mit `grid_base_fee_history` lassen sich frühere Grundpreise eintragen (`until` wie bei `grid_price_history`). Einmalige Anschlusskosten und Wechselboni zählen bewusst nicht mit, Solar-Ersparnis und Amortisation bleiben unverändert. Ohne Eintrag ändert sich nichts. Anlass: [#57](https://github.com/msucimaker3112/energy-cockpit/issues/57).

## 0.33.3
- **Energiefluss, Tageswerte unten wachsen mit der Schrift:** Mit großer `label_size` oder `text_size` wurden die Beschriftungen der Tageswerte (Solar heute, Bezug heute, Einspeisung …) groß, die Zahlen darunter blieben aber klein. Außerdem brachen die Beschriftungen mitten im Wort um („EIN-SPEI-SUNG“). Jetzt wachsen die Zahlen im gleichen Verhältnis mit, und die Kacheln werden breiter, statt die Wörter zu trennen. Gemeldet in [#63](https://github.com/msucimaker3112/energy-cockpit/issues/63).

## 0.33.2
- **Energiefluss, „?“ überlappt den Titel nicht mehr:** In schmalen Kacheln (iPhone, aber auch iPad oder mehrspaltige Dashboards) lag das „?“ (`why: true`) über dem Titel der Netz-Kachel. Jetzt sitzt es rechts in der Titelzeile und richtet sich nach deren Schriftgröße, statt eine feste Größe zu haben. Wird es eng, wird der Titel mit „…“ gekürzt. Die Tippfläche bleibt groß genug, und der blaue Rahmen nach dem Antippen ist weg. Gemeldet in [#50](https://github.com/msucimaker3112/energy-cockpit/issues/50).

## 0.33.1
- **Energiefluss, „Nicht erfasst“ im Editor einschaltbar:** Bei einzelnen Verbrauchern ohne Gruppen ließ sich die Kachel „Nicht erfasst“ nur per YAML mit `hide_rest: false` einschalten, im grafischen Editor gab es nur den Schalter „ausblenden“. Neu ist `show_rest: true`, im Editor „Kachel "Nicht erfasst" zeigen“. `hide_rest: false` funktioniert weiterhin. Gemeldet in [#58](https://github.com/msucimaker3112/energy-cockpit/issues/58).
- **Energiefluss, Batterie-Zeilen in einheitlicher Farbe:** Ruhte die Batterie, wurden „Nutzbar“ und „Reserve“ abgedunkelt, „Ladestand“ und „Temperatur“ aber nicht. Jetzt sehen alle Zeilen gleich aus, nur Titel und Wert der Kachel treten bei ruhender Batterie zurück (gilt auch für die Solar-Kachel). Gemeldet in [#59](https://github.com/msucimaker3112/energy-cockpit/issues/59).
- **Einheitlich „Solar“ statt „PV“:** Die Energiefluss-Karte sagte „Solar“, die Statistik „PV“. Jetzt heißt es überall Solar: „Solar-Ersparnis“, „Solarertrag pro Monat“, „Solar heute“, „Solar morgen“ usw. Die Optionsnamen in der YAML (`pv`, `pv_total` …) bleiben gleich. Gemeldet in [#60](https://github.com/msucimaker3112/energy-cockpit/issues/60).
- **Statistik, aufgeräumte Fußzeile:** Die Kacheln unten haben oben den Titel und darunter eine Zeile mit Beschriftung links und Wert rechts, alle Werte stehen auf gleicher Höhe am unteren Rand: Rekordtag (am TT.MM. / kWh), Batterie (Wirkungsgrad), Batteriezyklen (Gesamt), Batterie (Temperatur), Solar (Gesamt). Vorschlag aus [#61](https://github.com/msucimaker3112/energy-cockpit/issues/61).

## 0.33.0
- **Energiefluss, mittlere Kacheln wachsen mit der Schrift:** Der Fix aus 0.32.5 kam bei Verbrauchern mit `size: mittel` nicht an, ihre Spalten blieben bei großer `label_size` oder `text_size` gleich breit und damit zu schmal. Jetzt wachsen auch sie mit. Anlass: [#40](https://github.com/msucimaker3112/energy-cockpit/issues/40).
- **Energiefluss, Batterie-Zeilen passen in die Kachel:** „Nutzbar 5,0 kWh (bis 15 %)“ war eine einzige Zeile und lief auf dem iPad aus der Kachel. Jetzt stehen „Nutzbar“ und „Reserve“ in zwei Zeilen untereinander (ohne eingestellte Reserve nur „Nutzbar“). Bei voller Batterie heißt die Zeile „Nutzbar 8,7 kWh“ statt „Voll 8,7 kWh nutzbar“. Werte, die bei sehr großer Schrift nicht mehr in eine Zeile passen, brechen zwischen Wörtern um, Zahl und Einheit („100 %“, „5,0 kWh“) bleiben zusammen. Anlass: [#52](https://github.com/msucimaker3112/energy-cockpit/issues/52).
- **Statistik, Preisverlauf auch für Stromkosten und PV-Ersparnis:** Der Preisverlauf (`grid_price_history`) galt bisher nur für die Kosten je Verbraucher. Wer seinen Preis unterjährig geändert hat, sah bei „Stromkosten Netz“ und „PV-Ersparnis“ im Jahr alle Monate zum neuen Preis. Jetzt zählt in den Reitern Monat, Jahr und Gesamt jeder Monat mit dem Preis, der damals galt. Anlass: [#53](https://github.com/msucimaker3112/energy-cockpit/issues/53).
- **Statistik, mehrere Zähler als ein Verbraucher:** Bei „Kosten je Verbraucher“ darf `energy` jetzt eine Liste von Zählern sein, zum Beispiel für mehrere Klimaanlagen. Die Kachel zeigt die Summe und darunter jeden Zähler mit Namen, kWh und Kosten. Anlass: [#42](https://github.com/msucimaker3112/energy-cockpit/issues/42).

## 0.32.5
- **Energiefluss, große Beschriftungen bleiben lesbar:** Bei einer großen `label_size` (zum Beispiel 3) blieben die Werte in den Zeilen der Kacheln klein (Ladestand, Temperatur, „Leer um“ …) und wirkten neben der riesigen Beschriftung winzig. Jetzt wachsen sie mit. Die Spalten der Verbraucher-Kacheln werden bei großer Schrift breiter und lange Namen brechen um, statt mit „…“ abgeschnitten zu werden. Anlass: [#40](https://github.com/msucimaker3112/energy-cockpit/issues/40).

## 0.32.4
- **Energiefluss, Textgröße mit Dachfarbe:** Wer in der 3D-Ansicht eine Dachfarbe (`roof_color`) eingestellt hatte, konnte die Größe der Beschriftungen (`label_size`) und der Texte (`text_size`) nicht ändern: Die Einstellung kam nie in der Karte an, nur die Zahlen wurden größer. Ursache war ein fehlendes Semikolon in der Stil-Zeile der Karte. Jetzt wirken beide Einstellungen zusammen. Anlass: [#40](https://github.com/msucimaker3112/energy-cockpit/issues/40).
- **Himmelsband, Stunden-Vorschau aufgeräumt:** In den Details stehen Uhrzeit und Wetter jetzt untereinander („14:00“ darüber, „11° Teils bewölkt“ darunter). Vorher brach der Text hinter der Uhrzeit unordentlich um, besonders auf großen Bildschirmen. Anlass: [#49](https://github.com/msucimaker3112/energy-cockpit/issues/49).
- **Energiefluss, Tageswerte unten bündig:** Bricht die Beschriftung einer Tageswert-Kachel auf zwei Zeilen um („Bezug heute“, „Batterie ± heute“), stand die Zahl höher oder tiefer als in den Nachbar-Kacheln. Jetzt stehen die Zahlen einer Reihe immer auf einer Linie, am unteren Rand der Kachel. Lange Wörter wie „Einspeisung“ werden bei Bedarf sauber getrennt statt mitten im Wort. Anlass: [#48](https://github.com/msucimaker3112/energy-cockpit/issues/48).

## 0.32.3
- **Editor, Dezimalzahlen eingeben:** Felder wie „Kapazität (kWh)“ nahmen nur Werte in Schritten von 0,1 an. „5,12“ oder „5.12“ wurde mit „Gültigen Wert eingeben“ abgelehnt. Jetzt sind beliebige Nachkommastellen erlaubt, in allen Editoren (Energiefluss, Statistik, Geräte, Raum). Anlass: [#47](https://github.com/msucimaker3112/energy-cockpit/issues/47).

## 0.32.2
- **Energiefluss, Zusatzwerte in derselben Größe wie die anderen Zeilen:** Die Zusatzwerte (`extra`, zum Beispiel „Ladung“, „Entladung“, „SOH“, „Zyklen“ in der Batterie-Kachel) hatten immer dieselbe kleine Schrift, während „Ladestand“, „Temperatur“, „Voll um“ und „Voll in“ in der breiten Ansicht größer wurden. Auf einem Bildschirm ohne Seitenmenü sah man deshalb zwei Schriftgrößen in einer Kachel. Jetzt wachsen die Zusatzwerte mit, auch bei größerer Textgröße. Anlass: [#46](https://github.com/msucimaker3112/energy-cockpit/issues/46).

## 0.32.1
- **Energiefluss, Batterie-Kachel einheitlich:** Die Zeile „Ladestand“ und die Zeilen darunter („Voll um“, „Voll in“, „Leer um“, „Leer in“, „Nutzbar“) haben jetzt dieselbe Schriftgröße und denselben Wert-Stil, auch in der breiten Ansicht und mit größerer Textgröße. Vorher war „Ladestand“ in der breiten Ansicht kleiner als die Zeilen darunter. Anlass: [#46](https://github.com/msucimaker3112/energy-cockpit/issues/46).

## 0.32.0
- **Energiefluss, „Warum?“ erklärt Netzbezug und Einspeisung (optional, `why: true`):** An der Netz-Kachel erscheint ein „?“. Ein Tipp öffnet ein Fenster, das in einfachem Deutsch erklärt, woher der Wert kommt: Bei Netzbezug zeigen Balken, welche Verbraucher und Gruppen den Strom brauchen (bei Gruppen mit dem größten Eintrag, zum Beispiel „davon Server 1,80 kW“), dazu der nicht erfasste Rest. Darunter stehen die Antworten auf „Warum nicht aus der Batterie?“ (leer, oder gibt keinen Strom ab, Betriebsart prüfen) und „Warum nicht Solar?“ (Nacht mit Sonnenaufgang und Prognose für morgen, Wetter, oder Solar reicht nicht). Bei Einspeisung rechnet das Fenster vor (Solar minus Haus gleich Einspeisung), erklärt „Warum nicht in die Batterie?“ (voll, oder lädt gerade nicht) und nennt aus den Überschuss-Vorschlägen (`surplus`), was jetzt passt. Alles regelbasiert aus den Werten der Karte, ohne KI und ohne zusätzliche Abfragen. Das Fenster läuft live mit. Je mehr Verbraucher in der Karte stehen, desto genauer wird die Erklärung. Im Editor und im Assistenten (Schritt „Aussehen“) einschaltbar. Ohne Eintrag ändert sich nichts.
- **Energiefluss, Batterie-Kachel passend zur Solar-Kachel:** Der Zustand heißt jetzt „Ladung“ und „Entladung“ (statt „Lädt“ und „Entlädt“), passend zu „Erzeugung“, „Bezug“ und „Einspeisung“. Die Zeilen zur Prognose stehen untereinander, Name links und Wert rechts: „Voll um“ und „Voll in“ beim Laden, „Leer um“ und „Leer in“ beim Entladen (vorher „Reicht bis“ und „noch“), dazu „Nutzbar“ mit der Energie. Anlass: [#46](https://github.com/msucimaker3112/energy-cockpit/issues/46).

## 0.31.0
- **Zweite Anlage durch einen Speicher (optional, `pv2.to_battery`):** Für Speicher mit eigenen Solarmodulen, die zusätzlich per AC aus dem Haus laden können, zum Beispiel die Anker SOLIX Solarbank. Bisher ging `pv_to_battery: direkt` nur für `pv` und den ersten Speicher, `pv2` lief immer direkt ins Haus, das Bild stimmte dann nicht. Mit `pv2.to_battery: 2` läuft Solar 2 durch den zweiten Speicher (Nummer wie in den Kacheln: 1 = `battery`, 2 = erster Eintrag unter `batteries`). Die Karte rechnet dann netzseitig: Die AC-Abgabe des Speichers (`power_out`) zählt als Quelle fürs Haus, die AC-Ladung aus dem Haus (neu: `power_in`) als Verbrauch. Die DC-Werte (Lade- und Entladeleistung) bleiben für die Anzeige und müssen sich wegen der Wandlungsverluste nicht mit den AC-Werten ausgleichen. Die Linien laufen von Solar 2 zum Speicher und weiter ins Haus, bei AC-Ladung in die Gegenrichtung. Im Editor bei der zweiten Solaranlage und bei den Speichern, auch im Assistenten. Ohne `to_battery` ändert sich nichts. Anlass: [#45](https://github.com/msucimaker3112/energy-cockpit/issues/45).

## 0.30.2
- **Energiefluss, Beschriftungen getrennt von den Zahlen (optional, `label_size`):** Mit einer Zahl (zum Beispiel `label_size: 1.5`) werden nur die kleinen Texte größer, also Namen, Zusatzwerte und Beschriftungen. Die Zahlen in den Kacheln bleiben, wie sie sind, und die Karte passt weiter auf den Bildschirm. Der Wert hat Vorrang vor `text_size` bei den kleinen Texten. Im Editor unter „Alle Felder“. Anlass: [#40](https://github.com/msucimaker3112/energy-cockpit/issues/40).
- **Energiefluss, `size: mittel` breiter:** Kommt eine mittlere Kachel vor, werden die Spalten der Verbraucher etwas breiter. Anlass: [#40](https://github.com/msucimaker3112/energy-cockpit/issues/40).
- **Energiefluss, Werte der Solar-Kachel untereinander:** Haus, Batterie, Netz, die einzelnen Strings und die Prognose stehen jetzt in eigenen Zeilen, Name links und Wert rechts, statt in einer langen Zeile mit Punkten. Anlass: [#46](https://github.com/msucimaker3112/energy-cockpit/issues/46).
- **Einheitliche Begriffe:** Überall heißt es jetzt „Batterie“ statt „Akku“, die Solar-Kachel heißt „Solar“ (statt „PV-Anlage“, die zweite „Solar 2“), und im Tag steht „Erzeugung“ statt „Erzeugt“, passend zu „Bezug“ und „Einspeisung“. Anlass: [#41](https://github.com/msucimaker3112/energy-cockpit/issues/41) und [#46](https://github.com/msucimaker3112/energy-cockpit/issues/46). Eigene Namen, die du in der Konfiguration eingetragen hast, bleiben unverändert.

## 0.30.1
- **Hilfetexte im Editor und in der Anleitung ergänzt:** Im Assistenten und im Formular erklären jetzt Hilfetexte die Textgröße als Zahl (zum Beispiel 2 oder 1,5, und dass „Auf Bildschirmhöhe skalieren“ die Vergrößerung wieder aufheben kann), die Kachelgröße (normal, mittel, groß), das Wetter (Himmelsband), die eigenen Farben sowie die Zusatzwerte und den Alarm. Die Installationsanleitung nennt beim Schritt „Aussehen“ die Textgröße als Zahl und das Wetter. Die Funktion der Karte bleibt unverändert.

## 0.30.0
- **Energiefluss, Zusatzwerte und Alarm je Kachel (optional, `extra` und `alarm`):** An Solar, zweiter Anlage, Netz und jedem Speicher kannst du frei wählbare Zusatzwerte anzeigen, zum Beispiel Spannung, Strom und Temperatur eines Wechselrichters, die Netzfrequenz oder die Zelltemperatur eines Speichers. Jede Zeile hat einen Sensor, optional einen Namen, eine Einheit, Nachkommastellen und eine Warngrenze (`warn_above`, `warn_below`, der Wert wird dann gelb). Mit `alarm` wird ein beliebiger Sensor zum Alarm: Bei einem Fehler erscheint ein roter Hinweis in der Kachel und die Kachel bekommt einen roten Rahmen. Ein Tipp auf eine Zeile oder den Alarm öffnet den Verlauf des Sensors. In der Kurzansicht bleibt nur der Alarm. Im Editor in den Abschnitten Solar, Netz und Batterie unter „Zusatzwerte“. Ohne Eintrag ändert sich nichts. Wunsch aus [#41](https://github.com/msucimaker3112/energy-cockpit/issues/41).

## 0.29.1
- **Energiefluss, Einzelverbraucher neben Gruppen bei „Nicht erfasst“:** Wer Gruppen und zusätzlich Einzelverbraucher (`consumers`) eingetragen hatte, bekam die Einzelverbraucher nicht von der Kachel „Nicht erfasst“ abgezogen, nur die Gruppen. Jetzt zählen beide als erfasst, auch beim Anteil „x % gemessen“. Gemeldet in [#43](https://github.com/msucimaker3112/energy-cockpit/issues/43).
- **Statistik, zweiter Zähler bei „Kosten je Verbraucher“ (Zeittarife HT/NT):** Wer `grid2_total` (zum Beispiel den Niedertarif-Zähler) und `grid2_price` oder `grid2_price_ct` eingetragen hat, bekommt dessen Bezug jetzt auch bei den Kosten je Verbraucher. Er zählt zum Netzbezug, und die Kosten rechnen mit dem Mischpreis aus beiden Zählern, je Stunde nach den bezogenen kWh. Ohne zweiten Zähler ändert sich nichts. Die Geldwerte oben (Netzkosten, PV-Ersparnis) rechnen weiter mit dem aktuellen Preis. Anlass: [#44](https://github.com/msucimaker3112/energy-cockpit/issues/44).
- **Energiefluss, `size: mittel` und größere Namen:** Neue Stufe `size: mittel` für Einzelverbraucher: eine Spalte breit, aber mit größerer Zahl und größerem Namen, so passen vier nebeneinander. In den großen Kacheln (`size: gross`) sind Name und Zusatzwert jetzt größer. Anlass: [#40](https://github.com/msucimaker3112/energy-cockpit/issues/40).

## 0.29.0
- **Energiefluss, eigene Farben (optional, `colors`):** Du legst fest, in welcher Farbe die Batterie lädt und entlädt, zum Beispiel grün beim Laden und rot beim Entladen. Weitere Schlüssel: `pv` (Solar), `grid_import` (Netzbezug), `grid_export` (Einspeisung), `battery` (Batterie im Ruhezustand) und `home` (Haus). Die Farben gelten für Kacheln, Linien, den Ring, die Zeile „Solar / Akku / Netz“ und die 3D-Objekte, auch das Batterie-Objekt. Werte als `#hex` oder `r,g,b`, ungültige Werte werden ignoriert. Ohne `battery_discharge` entlädt die Batterie in der Farbe von `battery`. Die Farben gelten je Karte, zwei Karten mit verschiedenen Farben stören sich nicht. Im Editor unter „Farben“. Ohne Eintrag ändert sich nichts. Wunsch aus [#41](https://github.com/msucimaker3112/energy-cockpit/issues/41).

## 0.28.0
- **Energiefluss, Himmelsband (optional, `weather`):** Unter der Kopfzeile zeigt ein dünner Streifen das Wetter des Tages in 24 Stunden: Gold für Sonne, Grau für Wolken, Blau für Regen, Hellblau für Schnee, ein weißer Punkt für "jetzt". Darunter stehen Wetter, Temperatur sowie Sonnenaufgang und Sonnenuntergang. Ein Tipp auf das Band zeigt Bewölkung, Wind und die nächsten Stunden. So siehst du, warum die PV gerade so viel oder so wenig liefert und wann die Sonne wiederkommt. Keine Bewegung, keine Effekte über der Karte, die Zahlen bleiben im Mittelpunkt. Einstellung: `weather: weather.forecast_home` (im Assistenten im Schritt "Farbschema", im Formular unter "Wetter") oder `weather: auto` für die erste Wetter-Entität. Die Stundenwerte holt die Karte mit `weather.get_forecasts`, das braucht eine Wetter-Integration mit Vorhersage (zum Beispiel Met.no oder Deutscher Wetterdienst). Ohne Vorhersage zeigt das Band Tageslicht und das aktuelle Wetter. In der Kurzansicht bleibt nur die Textzeile.
- **Energiefluss, große Kacheln für einzelne Verbraucher (optional, `size: gross`):** Wärmepumpe, Wallboxen oder andere große Verbraucher erscheinen als breite, hervorgehobene Kachel mit großer Zahl, so wie Netz oder Batterie. Das geht für beliebig viele Verbraucher gleichzeitig, zum Beispiel für zwei Wallboxen. Im Editor steht das Feld „Größe der Kachel“ bei jedem Einzelverbraucher. In der Kurzansicht und auf dem Handy bleibt die Kachel einspaltig. Anlass: [#40](https://github.com/msucimaker3112/energy-cockpit/issues/40).
- **Energiefluss, Textgröße als Zahl (`text_size: 2`):** Bisher vergrößerte `sehr_gross` nur die kleinen Texte, die Zahlen in den Kacheln blieben gleich. Mit einer Zahl (0,5 bis 4, zum Beispiel `text_size: 2`) wachsen alle Texte und auch die Zahlen mit. `gross` und `sehr_gross` bleiben unverändert. Im Editor gibt es dafür die Einträge „Doppelt (2)“ und „Dreifach (3)“, im Formular auch eine eigene Zahl. Anlass: [#40](https://github.com/msucimaker3112/energy-cockpit/issues/40).
- **Energiefluss, Linien hinter den Verbraucher-Kacheln:** Linien zu weiter unten liegenden Verbrauchern schimmerten bisher durch die Kacheln davor. Die Kacheln decken sie jetzt ab, die Linien laufen dahinter.

## 0.26.0
- **Statistik, Bereiche ausblenden (optional, `hide`):** Mit einer Liste blendest du Bereiche aus, die du nicht brauchst: `monthly` (Diagramm "PV-Ertrag pro Monat"), `amortisation`, `baseload` (Grundlast), `footer` (Rekordtag, Wirkungsgrad, Zyklen, Temperatur, PV gesamt) und `money` (die vier Kacheln oben). Bleibt von der Zeile Amortisation und Grundlast nur eine Kachel, nimmt sie die ganze Breite. Auswählbar im Editor unter "Alle Felder". Ohne Eintrag ändert sich nichts. Wunsch aus [#35](https://github.com/msucimaker3112/energy-cockpit/issues/35).

## 0.25.3
- **Statistik, Jahresbudget bei spät beginnenden Messdaten:** Wer seinen Zähler erst im Laufe des Jahres eingerichtet hat, bekam ein Soll für das ganze Jahr bis heute und eine Hochrechnung, die nicht zusammenpassten (bei Messdaten ab Oktober zum Beispiel 247 kWh Netzbezug gegen 2.055 kWh Soll). Jetzt erkennt die Karte, ab wann der Netzbezug aufgezeichnet wird, und rechnet Soll und Hochrechnung für diesen Zeitraum. Unter der Kachel steht "Messdaten erst seit 10. Oktober 2026 … vorläufig". Bei vollständigen Daten ändert sich nichts. Wunsch aus [#37](https://github.com/msucimaker3112/energy-cockpit/issues/37).

## 0.25.2
- **Assistent, Prognose heute:** Im Schritt "Solar" ließ sich bei "Prognose" nur ein Sensor in Watt auswählen, obwohl der Hilfetext sagte, eine Tagesprognose in kWh gehe auch (nur im Formular). Jetzt bietet der Assistent beides an: Sensoren mit Leistung in W/kW und Sensoren mit Energie in kWh, zum Beispiel Forecast.Solar "Energie Produktion heute". Überschrift und Hilfetext sind angepasst. Gemeldet in [#36](https://github.com/msucimaker3112/energy-cockpit/issues/36).

## 0.25.1
- **Energiefluss, "Nicht erfasst" auch bei einzelnen Verbrauchern:** Wer Verbraucher unter `consumers` ohne Gruppen eingetragen hat, bekam die Kachel "Nicht erfasst" bisher nicht, sie gab es nur bei Gruppen. Mit `hide_rest: false` erscheint sie jetzt auch dort und zeigt den Hausverbrauch minus Summe der Verbraucher. `rest_min` und `rest.name` gelten ebenfalls. Ohne diese ausdrückliche Einstellung ändert sich nichts. Gemeldet in [#34](https://github.com/msucimaker3112/energy-cockpit/issues/34).

## 0.25.0
- **Zweiter Netzzähler (optional, `grid2`):** Für Haushalte mit einem zweiten Zähler und eigenem Tarif, zum Beispiel für die Wärmepumpe. Im Energiefluss erscheint der Zähler als Kachel bei den Verbrauchern, mit eigener Linie zum Haus und den Kosten pro Stunde zu seinem Preis (`price` aus einem Sensor oder Helfer, oder `price_ct` fest in Cent). Sein Bezug zählt zum Hausverbrauch und im Ring zum Netz. In der Statistik gibt es `grid2_total` (kWh-Zähler), `grid2_name`, `grid2_price` und `grid2_price_ct`: Der Bezug geht mit seinem Preis in die Stromkosten, in die Autarkie und in das Jahresbudget ein, unter „Stromkosten Netz“ steht der Anteil des zweiten Zählers. Im Assistenten gibt es dafür ein Feld im Schritt „Netz“ des Energieflusses und den neuen Schritt „Zähler 2“ in der Statistik. Ohne Eintrag ändert sich nichts. Wunsch aus [#29](https://github.com/msucimaker3112/energy-cockpit/issues/29).

## 0.24.0
- **Statistik, Jahresbudget (optional, `budget_kwh`):** Du setzt dir ein Jahresziel für den Netzbezug, zum Beispiel 8.000 kWh. Die Karte zeigt, wie viel davon verbraucht ist (Prozent und Balken), das Soll bis heute, die Abweichung in kWh und Euro, die Hochrechnung zum Jahresende und die Abweichung zum Ziel, farbig grün, gelb oder rot. Mit `budget_profile: history` folgt das Soll dem Verlauf deines Netzbezugs im Vorjahr, im Winter ist es dann höher als im Sommer. Ohne `budget_kwh` ändert sich nichts. Im Assistenten im Schritt "Preise" einstellbar. Wunsch aus der Facebook-Gruppe "Home Assistant Tipps und Tricks".
- **Statistik, Kosten je Verbraucher:** Der Hinweis bei "Gesamt" ist verständlicher: "Nur für Heute, Woche, Monat und das laufende Jahr. Für 'Gesamt' gibt es hier keine Werte". Anlass: [#27](https://github.com/msucimaker3112/energy-cockpit/issues/27).

## 0.23.0
- **Energiefluss, Farbe der Zahl beim Haus (optional, `home_color: source`):** Die Zahl über dem Haus nimmt die Farbe der Quelle mit dem größten Anteil im Ring an: gelb bei PV, blau beim Speicher, rot beim Netz. Die Farbe wechselt erst, wenn eine andere Quelle mindestens 5 Prozentpunkte vorn liegt. Ohne Angabe bleibt die Zahl türkis. Im Assistenten im Schritt "Aussehen" einstellbar. Wunsch aus [#32](https://github.com/msucimaker3112/energy-cockpit/issues/32).

## 0.22.0
- **Energiefluss, 3D-Ansicht, Speicher-Turm:** Bei zwei oder mehr gestapelten Akkus mit gemeinsamem Sensor stand der erste Akku unten und der zweite oben, in der Zeile "Ladestand" daneben aber "erster / zweiter". Jetzt steht der erste Akku oben, die Grafik passt zum Text. Gemeldet in [#33](https://github.com/msucimaker3112/energy-cockpit/issues/33).
- **Statistik, Reiter beim Öffnen (optional, `start_period`):** Mit `day`, `week`, `month` oder `year` bestimmst du, welchen Reiter die Karte beim Öffnen zeigt. Ohne Angabe bleibt es der Monat. Einstellbar unter „Alle Felder“ im Editor oder in YAML. Wunsch aus [#23](https://github.com/msucimaker3112/energy-cockpit/issues/23).
- **Statistik, Amortisation:** Ohne `investment` oder `investment_eur` blendet die Karte die Kachel "Amortisation" aus, die Grundlast nimmt die ganze Breite. Bisher stand dort nur ein Strich. Wunsch aus [#31](https://github.com/msucimaker3112/energy-cockpit/issues/31).

## 0.21.0
- **Statistik, "Heute" zeigte den Monat:** Lieferte einer der Tagessensoren (PV, Bezug, Einspeisung heute) keinen Wert, blieben unter "Heute" die Zahlen des vorher gezeigten Zeitraums stehen, meist die des Monats. Jetzt steht dort ein Strich, und ein gelber Hinweis nennt den Sensor. Fehler aus [#28](https://github.com/msucimaker3112/energy-cockpit/issues/28).
- **Statistik, "Heute" aus den Gesamtzählern:** Fehlt ein Tagessensor oder liefert er gerade nichts, rechnet die Karte den Tageswert aus dem Gesamtzähler seit Mitternacht, wie Monat und Jahr. Die Tagessensoren sind damit optional. Mit funktionierenden Tagessensoren ändert sich nichts.
- **Statistik, Hinweise bei unpassenden Sensoren:** Die Karte warnt unter den Kacheln, wenn in einem Tagesfeld offenbar ein Gesamtzähler steckt oder heute mehr eingespeist als erzeugt wurde. Anlass waren [#26](https://github.com/msucimaker3112/energy-cockpit/issues/26), [#27](https://github.com/msucimaker3112/energy-cockpit/issues/27) und [#28](https://github.com/msucimaker3112/energy-cockpit/issues/28).
- **Statistik, Rekordtag:** Er kam nur aus dem Tagessensor. War der erst seit Kurzem angelegt, stand dort ein viel zu kleiner Rekord. Jetzt wertet die Karte auch den Gesamtzähler und zeigt den höheren Wert. Rückmeldung aus [#26](https://github.com/msucimaker3112/energy-cockpit/issues/26).
- **Statistik, `pv_lifetime` (optional):** Ein durchlaufender PV-Zähler nur für Amortisation und "PV gesamt", wenn `pv_total` täglich auf 0 geht. Wunsch aus [#28](https://github.com/msucimaker3112/energy-cockpit/issues/28).
- **Energiefluss, Geräte in Gruppen nach Leistung (optional, `consumer_groups_sort: leistung`):** Aktive Geräte stehen oben, das stärkste zuerst. Die Liste ordnet sich höchstens alle 10 Sekunden neu und springt bei kleinen Schwankungen nicht. Wunsch aus [#24](https://github.com/msucimaker3112/energy-cockpit/issues/24).
- **Energiefluss, Dachfarbe in 3D (optional, `roof_color`):** zum Beispiel `anthrazit`, `schwarz`, `grau`, `braun` oder eine eigene Farbe als `#hex`. Wunsch aus [#28](https://github.com/msucimaker3112/energy-cockpit/issues/28).
- **Energiefluss und Statistik, feste Nachkommastellen (optional, `decimals`):** `decimals: 2` zeigt Energie immer mit zwei Stellen, also `10,80 kWh` und `0,00 kWh`. Einzeln für Energie, Leistung in kW und Prozent: `decimals: { energy: 2, power: 1, percentage: 1 }`. Wunsch aus [#25](https://github.com/msucimaker3112/energy-cockpit/issues/25).

Alles Neue ist optional, ohne Eintrag bleibt die Anzeige wie bisher.

## 0.20.0
- **Energiefluss, PV-Prognose für morgen und übermorgen (optional, `pv.forecast_tomorrow`, `pv.forecast_day_after`):** Zwei Kacheln unten in der Karte zeigen die erwartete Produktion, zum Beispiel von Forecast.Solar oder Solcast. Ein Tipp öffnet den Verlauf. Einstellbar im Assistenten (Schritt *Solar*). Ohne Eintrag ändert sich nichts. Wunsch aus [#22](https://github.com/msucimaker3112/energy-cockpit/issues/22).
- **Energiefluss, Solar-Linie fehlte:** Passten Hausverbrauch-Sensor, Netz und PV kurz nicht zusammen, etwa weil sie zeitversetzt melden, zeigte die 3D-Ansicht keine Solar-Linie, und die Solar-Kachel sagte nicht, wohin der Strom geht. Dieser Rest zählt jetzt zum Haus, in 3D und in der klassischen Ansicht. Passen die Werte zusammen, ändert sich nichts. Rückmeldung aus [#23](https://github.com/msucimaker3112/energy-cockpit/issues/23).
- **Energiefluss, Kacheln unten bei sehr großer Schrift:** Lange Titel wie "Einspeisung" liefen in schmalen Karten über den Rand, und der farbige Punkt davor verschwand. Jetzt bricht der Titel um, und der Punkt bleibt.
- **Statistik, laufender Monat:** "ggü. Vorjahr" entfällt im laufenden Monat, weil dort angefangene Tage gegen den ganzen Vorjahresmonat stünden. Abgeschlossene Monate zeigen den Vergleich wie bisher. Rückmeldung aus [#14](https://github.com/msucimaker3112/energy-cockpit/issues/14).

## 0.19.6
- **Nur die Anleitung:** In HACS fehlten in der Beschreibung einige Bilder, darunter das Titelbild. Bilder und Links der README stehen jetzt mit voller Adresse drin. An den Karten ändert sich nichts, das Update hat also keine Eile.

## 0.19.5
- **Statistik, Kosten je Verbraucher: Hinweis statt 0 €:** Ist für einen Verbraucher ein Leistungssensor (W) eingetragen, gibt es zu seinem Zähler keine kWh-Statistik oder den Sensor gar nicht, zeigte das Kärtchen bisher ohne Erklärung 0 €. Jetzt steht dort in Gelb der Grund und welcher Sensor gemeint ist. Die Summe oben rechnet nur mit den richtigen Sensoren. Rückmeldung aus [#21](https://github.com/msucimaker3112/energy-cockpit/issues/21).
- **Energiefluss, Legende am Ring:** In der klassischen Ansicht stand die Legende (Solar, Akku, Netz in Prozent) unter dem Ring, und die Linien zu den Verbrauchern, auf dem Handy auch zu Solar, Netz und Akku, liefen durch die Schrift. Sie steht jetzt über dem Ring, wie schon in der 3D-Ansicht.
- **Doku:** Die Installation über die HACS-Suche steht jetzt auch in der Ansicht, die HACS zur Karte zeigt.

## 0.19.4
- **Energiefluss, 3D-Ansicht:** Namen mit Anführungszeichen oder spitzen Klammern konnten die Zeichnung brechen, und Markup darin wurde als HTML gelesen. Sie werden jetzt geschützt ausgegeben.
- **Statistik, Kachel "Einspeiseerlös" wählbar (optional, `feed_in_card`):** Für Anlagen ohne Vergütung zeigt `pv_self_consumption` stattdessen den PV-Eigenverbrauch mit Quote und selbst genutzten kWh, `hidden` blendet die Kachel aus. Ohne Eintrag ändert sich nichts. Wunsch aus [#14](https://github.com/msucimaker3112/energy-cockpit/issues/14).
- **Statistik, keine Sprünge beim Blättern:** Mit Langzeit-Ansicht und Kosten je Verbraucher verschwand der Kosten-Bereich in früheren Jahren und unter "Gesamt". Dadurch änderten sich Höhe und Größe der ganzen Karte. Der Bereich bleibt jetzt stehen und zeigt, dass die Kosten nur für das aktuelle Jahr verfügbar sind.

## 0.19.3
- **Energiefluss, Ring:** Anteile unter 3,5 % fehlten im Ring, obwohl sie in der Legende standen. Jetzt erscheint jeder Anteil ab 1 %, sehr kleine als Punkt. Rückmeldung aus [#15](https://github.com/msucimaker3112/energy-cockpit/issues/15).

## 0.19.2
- **Energiefluss, Speicher hinter dem Zähler (`behind_meter`):** Gibt der Speicher Strom ab, zählt er jetzt als Quelle. Der Hausverbrauch sinkt dadurch nicht mehr, und Ring und "Autarkie jetzt" zeigen seinen Anteil. Beim Laden bleibt alles wie bisher. Die Tageswerte rechnen weiter ohne ihn. Mit eigenem `home.entity` ändert sich nichts. Wunsch aus [#15](https://github.com/msucimaker3112/energy-cockpit/issues/15).

## 0.19.1
- **Energiefluss, 3D-Ansicht:** In schmalen Kacheln, etwa in der Kurzansicht und auf dem iPad, lief der Text aus der Kachel und Namen wurden abgekürzt. Das Bild steht dort jetzt über dem Text, ist genug Platz da, bleibt es daneben. Ohne `style: 3d` ändert sich nichts. Rückmeldung aus [#20](https://github.com/msucimaker3112/energy-cockpit/issues/20).

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
