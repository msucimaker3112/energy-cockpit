"""Editor, Doku und Version für groups_lines (direkt | sammel), v0.8.0."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:70]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


OPT = "[{ value: 'direkt', label: 'Eine Linie je Gerät oder Gruppe (Standard)' }, { value: 'sammel', label: 'Eine Sammel-Linie zum ganzen Verbraucherbereich' }]"

sub('src/flow-editor.js', [
    ("      { path: 'consumers', label: 'Verbraucher', kind: 'list', max: 12 },\n    ] },",
     "      { path: 'consumers', label: 'Verbraucher', kind: 'list', max: 12 },\n"
     "      { path: 'groups_lines', label: 'Linien zu den Verbrauchern', kind: 'choice', options: " + OPT + ", help: 'Bei vielen Geräten wirkt eine einzelne Sammel-Linie zum ganzen Bereich ruhiger.' },\n"
     "    ] },"),
    ("      bool('fit_screen', true),\n",
     "      bool('fit_screen', true),\n"
     "      { name: 'groups_lines', selector: { select: { mode: 'dropdown', options: " + OPT + " } } },\n"),
    ("reserve_pct: 'oder feste Entladegrenze (%)',",
     "groups_lines: 'Linien zu den Verbrauchern', reserve_pct: 'oder feste Entladegrenze (%)',"),
])

sub('docs/KONFIGURATION.md', [
    ("| `battery.soc_display` |",
     "| `groups_lines` | `direkt` (Standard) oder `sammel` | Linien zu Einzelverbrauchern und Gruppen. `sammel` zeichnet nur **eine** Linie vom Ring zu einer Plakette \"Verbraucher\" mit der Summe und fasst den Bereich in einem Rahmen zusammen. Die Kacheln zeigen ihre Aktivität weiter mit Farbrand und Wert, bekommen aber keine eigene Linie. Gut bei vielen Geräten, auch auf dem Handy |\n| `battery.soc_display` |"),
])

p = R / 'docs' / 'KONFIGURATION.md'
s = p.read_text(encoding='utf-8')
if 'sammel-breit.png' not in s:
    s += """

### Linien zu den Verbrauchern: `groups_lines`

Mit vielen Verbrauchern laufen die einzelnen Linien eng nebeneinander und teils hinter anderen Kacheln. Die Option `groups_lines: sammel` ersetzt sie durch **eine** Linie zum ganzen Verbraucherbereich.

| Standard (`direkt`) | `sammel` |
|---|---|
| ![Eine Linie je Gruppe](img/sammel-vorher.png) | ![Eine Sammel-Linie](img/sammel-breit.png) |

```yaml
type: custom:energy-cockpit-flow-card
groups_lines: sammel
```

Auf dem Handy bleibt die Linie in der Lücke zwischen den Kacheln:

![Sammel-Linie, schmale Ansicht](img/sammel-schmal.png)

Die Summe in der Plakette ist die Summe der Messwerte der Einzelverbraucher und Gruppen. Der Anteil "nicht erfasst" ist nicht enthalten.
"""
    p.write_text(s, encoding='utf-8')

sub('docs/INSTALLATION.md', [
    ("| 5. Verbraucher | Einzelverbraucher mit eigenem Leistungssensor hinzufügen (Wärmepumpe, Wallbox, ...). |",
     "| 5. Verbraucher | Einzelverbraucher mit eigenem Leistungssensor hinzufügen (Wärmepumpe, Wallbox, ...). Hier wählst du auch, ob jede Gruppe eine eigene Linie bekommt oder eine Sammel-Linie den ganzen Bereich speist. |"),
])

pk = R / 'package.json'
pk.write_text(pk.read_text(encoding='utf-8').replace('"version": "0.7.0"', '"version": "0.8.0"'), encoding='utf-8')
hd = R / 'docs' / 'handout.html'
hd.write_text(hd.read_text(encoding='utf-8').replace('Version 0.7.0', 'Version 0.8.0'), encoding='utf-8')
print('ok')
