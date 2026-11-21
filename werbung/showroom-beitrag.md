# Beitrag für das simon42-Forum (Showroom) und Texte für Gruppen

Entwurf, nichts davon ist veröffentlicht. Die Bilder liegen in `C:\Users\fstei\Documents\Viking\wattdeck\docs\img\`.

---

## 1. Forum simon42, Kategorie „Showroom“

Adresse: https://community.simon42.com/c/home-assistant-showroom/14

**Titel:**
[Karte] Energy-Cockpit: Energiefluss in 3D, Statistik, Kosten je Verbraucher, deutsch und ohne YAML

**Text:**

Hallo zusammen,

ich habe in den letzten Wochen an Lovelace-Karten für Home Assistant gebaut und möchte sie euch zeigen: **Energy-Cockpit**. Es ist kostenlos (MIT-Lizenz), komplett auf Deutsch und im HACS-Store zu finden (einfach nach „energy-cockpit“ suchen).

**Was ist drin?** Vier Karten:

- **Energiefluss:** Solar, Netz, Speicher, Haus und Verbraucher als animierter Fluss, auf Wunsch als kleines **3D-Haus** (Haus, Solarmodule, Zählerkasten, Speicher). Mehrere Speicher, Balkonkraftwerk, Räume und Geräte mit eigener Linie.
- **Statistik:** Ersparnis, Autarkie, Amortisation, Grundlast, Monatsvergleich. Optional **Kosten je Verbraucher** (zum Beispiel E-Auto oder Wärmepumpe), ein **Jahresbudget** für den Netzbezug und alle Jahre aus der Langzeitstatistik.
- **Geräte & Verbrauch:** Räume mit Live-Leistung, Schalten und Kosten je Gerät.
- **Raum-Abrechnung:** Verbrauch und Kosten eines Raums mit Abschlag und Hochrechnung.

**Einrichten ohne YAML:** Ein Assistent führt durch die Karte, schlägt passende Sensoren vor und zeigt zu jeder Auswahl den **aktuellen Wert**. So siehst du gleich, ob es der richtige Sensor ist.

**Warum noch eine Energiekarte?** Ich wollte eine Karte, die auf Deutsch ist, bis zum einzelnen Gerät geht und Kosten zeigt. Viele Funktionen kamen direkt von Nutzern, die mir Fragen und Wünsche geschickt haben: Speicher hinter dem Zähler (zum Beispiel Zendure), Speicher vor dem Wechselrichter (zum Beispiel Marstek B2500), Hybrid-Wechselrichter, ein zweiter Zähler mit eigenem Tarif für die Wärmepumpe, Handy-Kurzansicht.

[Bilder: Energiefluss in 3D, Statistik mit Jahresbudget, Kosten je Verbraucher]

**Was du brauchst:** Leistungssensoren (W oder kW) und für Statistik und Kosten Energiezähler in kWh mit Langzeitstatistik (`state_class: total_increasing`). Die Karten erkennen die Einheit und rechnen selbst um.

**Wo gibt es das?**
- HACS: nach **energy-cockpit** suchen
- GitHub (Anleitung, Bilder, Änderungsprotokoll): https://github.com/msucimaker3112/energy-cockpit

**Ehrlich dazu:** Das ist ein Hobbyprojekt. Es ist bisher nur auf Deutsch, eine englische Oberfläche ist geplant. Vieles habe ich mit nachgestellten Sensoren getestet, nicht an jeder Anlage. Wenn bei euch etwas nicht passt oder euch etwas fehlt, schreibt mir gern hier oder direkt auf GitHub unter „Issues“. Ich freue mich über Rückmeldungen!

Viele Grüße
Flo

**Bilder zum Hochladen** (Forum: Bild in das Textfeld ziehen):
1. `docs\img\flow-3d-zwei.png` (Energiefluss in 3D mit zwei Speichern und Balkonkraftwerk)
2. `docs\img\budget-linear.png` (Jahresbudget) oder `docs\img\stats.png`
3. `docs\img\kosten-woche.png` (Kosten je Verbraucher)
4. optional `docs\img\flow-haus.png` (Räume und Geräte)

---

## 2. Kurzer Text für Gruppen nach Anlage (Vorlage)

Gruppenregeln beachten, manche Gruppen erlauben Eigenwerbung nur an bestimmten Tagen oder gar nicht. In `[…]` den Teil für die Anlage der Gruppe einsetzen.

**Vorlage:**

Für alle mit [Anlage, zum Beispiel „Zendure“]: Ich habe eine kostenlose Karte für Home Assistant gebaut, die [passende Funktion] zeigt. Energy-Cockpit gibt es im HACS-Store (nach „energy-cockpit“ suchen). Deutsch, ein Assistent richtet alles ein, kein YAML nötig.

[Bild]

GitHub mit Anleitung: https://github.com/msucimaker3112/energy-cockpit

**Bausteine je Anlage** (nur nehmen, was zur Gruppe passt):

- **Zendure / Speicher an der Steckdose:** „Der Speicher kann hinter dem Zähler stehen (Einstellung `behind_meter`): Ladung zählt als Verbrauch, Abgabe als Quelle, mit eigener Kachel.“
- **Marstek B2500 / Speicher vor dem Wechselrichter:** „Der Weg Solar → Speicher → Haus mit Eingang, Ausgang und Durchleitung (`pv_to_battery: direkt`).“
- **Hybrid-Wechselrichter (zum Beispiel SMA, Huawei):** „Optionen für Wechselrichter, deren Tagesertrag die Akku-Ladung nicht zählt, damit Haus heute und Autarkie stimmen.“
- **Wärmepumpe mit eigenem Zähler:** „Ein zweiter Netzzähler mit eigenem Tarif (zum Beispiel Wärmepumpenstrom), mit Kosten pro Stunde und Anteil in den Stromkosten.“
- **Balkonkraftwerk:** „Eigene Kachel und Linie, die Bilanz rechnet mit der Summe beider Anlagen.“
- **Viessmann:** „Auch bei einem Speicher, den die Viessmann-App nicht kennt, kann der Hausverbrauch aus Netz, PV und Speichern berechnet werden.“

**Hinweis:** Die Aussagen oben stammen aus Rückmeldungen von Nutzern mit diesen Anlagen. Ich habe sie nicht an jeder Anlage selbst geprüft. Wenn du etwas versprichst, dann nur, was in der Anleitung steht.
