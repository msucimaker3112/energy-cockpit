# Mitmachen bei Energy-Cockpit

Schön, dass du helfen möchtest! Fehlerberichte, Ideen, Übersetzungen und Pull Requests sind willkommen. Viele Funktionen, zum Beispiel die Kurzansicht fürs Handy, sind aus Wünschen der Nutzer entstanden.

> **English summary:** Bug reports, ideas, translations and pull requests are welcome. The source lives in `src/`, `dist/energy-cockpit.js` is generated with `node tools/build.mjs`. Open the pages in `test/` in a browser to try your changes without Home Assistant. Escape every config value or entity attribute with `esc()` before it goes into `innerHTML`. Issues and pull requests in English are fine.

## Ohne Programmieren helfen

- **Fehler melden:** Lege ein [Issue](https://github.com/msucimaker3112/energy-cockpit/issues) an. Am meisten helfen: Version der Karte (steht im CHANGELOG bzw. in HACS), Gerät und Browser (z. B. iPhone, Home-Assistant-App), ein Screenshot und der betroffene Teil deiner Kartenkonfiguration (YAML, ohne private Daten).
- **Ideen und Wünsche:** ebenfalls als Issue. Beschreib, was du erreichen willst, nicht nur wie. Dann findet sich oft eine einfachere Lösung.
- **Doku verbessern:** Tippfehler oder unklare Stellen in `README.md` und `docs/` gern direkt als Pull Request.

## Loslegen mit dem Code

Du brauchst nur [Node.js](https://nodejs.org/) (ab Version 18) und einen Browser. Home Assistant ist zum Entwickeln nicht nötig.

1. Repository **forken** (oben rechts auf GitHub) und deinen Fork klonen.
2. Im Ordner `src/` ändern.
3. Bauen:
   ```bash
   node tools/build.mjs     # erzeugt dist/energy-cockpit.js
   npm run check            # Syntaxprüfung der gebauten Datei
   ```
4. Testen: eine Seite aus `test/` direkt im Browser öffnen (Doppelklick genügt). Sie lädt `dist/energy-cockpit.js` mit Beispieldaten.
5. Pull Request stellen und kurz beschreiben, was sich ändert, am besten mit Screenshot.

## Aufbau

| Ordner / Datei | Inhalt |
|---|---|
| `src/` | Quellcode, eine Datei je Karte und Editor plus gemeinsame Teile (`common.js`, `i18n.js`, `wizard.js`, `editor-kit.js`) |
| `dist/energy-cockpit.js` | **Wird gebaut, nicht von Hand ändern.** Alle Dateien aus `src/` in der Reihenfolge aus `tools/build.mjs`. HACS lädt diese Datei. |
| `test/` | Testseiten mit Beispieldaten, siehe unten |
| `docs/` | Anleitungen (`INSTALLATION.md`, `KONFIGURATION.md`, `ABRECHNUNG.md`), Handout und Bilder in `docs/img/` |
| `tools/` | Build-Skript und Hilfsskripte für die Screenshots der Doku |

### Testseiten

| Seite | Zeigt |
|---|---|
| `test/flow.html` | Energiefluss mit Szenen (Überschuss, Nacht, ohne Batterie) |
| `test/devices.html` | Geräte & Verbrauch |
| `test/stats.html` | Statistik |
| `test/room.html`, `room-extra.html`, `room-verify.html` | Raum-Abrechnung, Zusatzfunktionen, Rechenprobe |
| `test/wizard.html` | Editor und Einrichtungsassistent |
| `test/edge.html`, `prices.html` | Randfälle, Preise und Start ohne Konfiguration |

Viele Optionen lassen sich über Parameter in der Adresse einschalten (siehe `test/_theme.js`), zum Beispiel:

```
test/flow.html?scene=night&grpdemo=1&compact=auto
test/flow.html?theme=hell&gc=1&watt=1
```

Für die Handy-Ansicht das Browserfenster schmaler als 600 px machen oder die Gerätesimulation der Entwicklertools nutzen.

## Regeln für den Code

- **Texte immer maskieren.** Alles, was aus der Konfiguration oder aus Entity-Attributen kommt (Namen, Symbole, Entitäten, Pfade), läuft durch `esc()`, bevor es in `innerHTML` landet. Farben gehen über `rgb()`. Das war eine Auflage aus dem Review für die Aufnahme in HACS.
- **Stil der Umgebung übernehmen:** reines JavaScript ohne Abhängigkeiten und ohne Build-Werkzeuge außer `tools/build.mjs`. Kommentare auf Deutsch, kurz und nur dort, wo das *Warum* nicht offensichtlich ist.
- **Neue Option vollständig anlegen:**
  1. in der Karte (`src/*-card.js`), mit einem Standard, der das bisherige Verhalten nicht ändert
  2. im Formular des Editors (`src/*-editor.js`, Abschnitt `LABELS` und Schema) und, falls sinnvoll, im passenden Schritt des Assistenten
  3. in `docs/KONFIGURATION.md` und, wenn sie für viele wichtig ist, in der `README.md`
  4. als Eintrag im `CHANGELOG.md`
- **Texte der Oberfläche** stehen in `src/i18n.js`, `src/devices-i18n.js` und `src/stats-i18n.js` und werden mit `T('schlüssel')` abgerufen.
- **`dist/energy-cockpit.js` mit committen**, nachdem du gebaut hast. HACS liefert genau diese Datei aus.

## Versionen und Releases

Versionen und Releases legt der Maintainer an (`package.json`, Tag `vX.Y.Z`, GitHub-Release). Bei jedem Push prüft die GitHub-Action `Validate` das Repository mit der HACS-Validierung.

## Lizenz

Mit einem Pull Request stellst du deinen Beitrag unter die [MIT-Lizenz](LICENSE) des Projekts.
