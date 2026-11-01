"""v0.13.0: Editor für mehrere Speicher. Regel: battery = erster Speicher, batteries = weitere."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:90]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


# 1) Karte: battery ist der erste Speicher, batteries enthält die weiteren
sub('src/flow-card.js', [
    ("    let bl = arr(this._c.batteries).filter(usedB);\n    if (!bl.length && this._c.battery) bl = [this._c.battery];\n",
     "    // battery ist der erste Speicher, batteries enthält die weiteren (ohne battery: batteries allein)\n"
     "    const more = arr(this._c.batteries).filter(usedB);\n"
     "    const first = this._c.battery;\n"
     "    const bl = more.length ? (usedB(first) ? [first].concat(more) : more) : (first ? [first] : []);\n"),
])

# 2) Formular und Assistent
wiz = []
for i in range(2):
    n = i + 2
    wiz.append(f"      {{ path: 'batteries.{i}.name', label: 'Name von Speicher {n}', kind: 'text', optional: true }},")
    helptxt = ", help: 'Hat dein System getrennte Sensoren für Laden und Entladen, trägst du sie unter Alle Felder ein.'" if i == 0 else ''
    wiz.append(f"      {{ path: 'batteries.{i}.power', label: 'Speicher {n}: Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i){helptxt} }},")
    wiz.append(f"      {{ path: 'batteries.{i}.soc', label: 'Speicher {n}: Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level/i, /batter|akku/i) }},")
    wiz.append(f"      {{ path: 'batteries.{i}.capacity_kwh', label: 'Speicher {n}: Kapazität (kWh)', kind: 'number', optional: true }},")
step_fields = '\n'.join(wiz)

sub('src/flow-editor.js', [
    ("  WD.flowForm = () => ({",
     "  // Weitere Speicher (ab dem zweiten): jeder mit eigener Kachel\n"
     "  const batteryFields = () => [\n"
     "    txt('name'), ent('power', ['sensor']), ent('power_charge', ['sensor']), ent('power_discharge', ['sensor']), ent('soc', ['sensor']), bool('invert', false),\n"
     "    numb('capacity_kwh', 0, 200, 0.1), numb('reserve_pct', 0, 100, 1), numb('max_pct', 0, 100, 1),\n"
     "    ent('daily_charge', ['sensor']), ent('daily_discharge', ['sensor']),\n"
     "  ];\n\n  WD.flowForm = () => ({"),
    ("      sec('home', 'Haus (optional)',",
     "      sec('batteries', 'Weitere Speicher (2. bis 5.)', slots(4, (n) => `Speicher ${n + 1}`, batteryFields)),\n      sec('home', 'Haus (optional)',"),
    ("    { short: 'Haus', title: 'Hausverbrauch',",
     "    { short: 'Speicher', title: 'Weitere Speicher', text: 'Optional. Hast du mehr als einen Speicher, trage hier den zweiten und dritten ein. Jeder bekommt eine eigene Kachel, Ring und Tageswerte rechnen mit der Summe. Der erste Speicher steht im Schritt davor.', fields: [\n"
     + step_fields + "\n    ] },\n    { short: 'Haus', title: 'Hausverbrauch',"),
    ("      `Batterie: ${(c.battery && c.battery.power) || 'keine'}`,",
     "      `Batterie: ${(c.battery && (c.battery.power || c.battery.power_charge)) || 'keine'}${WD.toList(c.batteries).filter((b) => b && (b.power || b.power_charge || b.soc)).length ? ' und ' + WD.toList(c.batteries).filter((b) => b && (b.power || b.power_charge || b.soc)).length + ' weitere' : ''}`,"),
])

# 3) Screenshots und Doku
sub('tools/make-screenshots.py', [
    ("    ('wizard.html', 'wiz-flow-5-verbraucher', '?card=flow&step=4&cfg=flow&tab=Assistent'),",
     "    ('wizard.html', 'wiz-flow-4-weitere-speicher', '?card=flow&step=3&cfg=flow&tab=Assistent'),\n    ('wizard.html', 'wiz-flow-5-verbraucher', '?card=flow&step=5&cfg=flow&tab=Assistent'),"),
    ("'wiz-flow-6-preise', '?card=flow&step=5&", "'wiz-flow-6-preise', '?card=flow&step=6&"),
    ("'wiz-flow-7-aussehen', '?card=flow&step=6&", "'wiz-flow-7-aussehen', '?card=flow&step=7&"),
    ("'wiz-flow-8-fertig', '?card=flow&step=7&", "'wiz-flow-8-fertig', '?card=flow&step=8&"),
])

sub('docs/INSTALLATION.md', [
    ("| 4. Haus |", "| 4. Weitere Speicher | Optional. Hast du mehr als einen Speicher, trägst du hier den zweiten und dritten ein, jeder bekommt eine eigene Kachel. |\n| 5. Haus |"),
    ("| 5. Verbraucher |", "| 6. Verbraucher |"),
    ("| 6. Preise |", "| 7. Preise |"),
    ("| 7. Aussehen |", "| 8. Aussehen |"),
    ("| 8. Fertig |", "| 9. Fertig |"),
])

sub('docs/KONFIGURATION.md', [
    ("| `batteries` | Liste von Speichern | Mehrere Speicher: Jeder Eintrag hat dieselben Felder wie `battery`",
     "| `batteries` | Liste von Speichern | Weitere Speicher: `battery` ist der erste Speicher, `batteries` enthält die weiteren (zweiter, dritter …). Wer alle Speicher in `batteries` führen will, lässt `battery` weg. Jeder Eintrag hat dieselben Felder wie `battery`"),
    (" Ohne `batteries` gilt der einzelne Eintrag `battery` wie bisher. Nur im YAML-Editor. Auf dem Handy:",
     " Ohne `batteries` gilt der einzelne Eintrag `battery` wie bisher. Im Assistenten (Schritt \"Weitere Speicher\") und im Formular (Alle Felder) einstellbar. Auf dem Handy:"),
])

sub('CHANGELOG.md', [
    ("- **Mehrere Speicher (`batteries`):** Jeder Speicher bekommt",
     "- **Mehrere Speicher (`batteries`):** `battery` ist der erste Speicher, `batteries` enthält die weiteren. Im Assistenten gibt es dafür den Schritt \"Weitere Speicher\", im Formular den Bereich \"Weitere Speicher\". Jeder Speicher bekommt"),
])
print('ok')
