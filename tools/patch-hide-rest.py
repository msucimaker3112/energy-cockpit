"""v0.8.2: Die Kachel "Nicht erfasst" lässt sich ausblenden (hide_rest), Auswahl im Assistenten und im Formular."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:70]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


sub('src/flow-card.js', [
    ("      const showRest = c.rest !== false;", "      const showRest = c.rest !== false && !c.hide_rest;"),
])
sub('src/flow-editor.js', [
    ("      { path: 'groups_lines', label: 'Linien zu den Verbrauchern', kind: 'choice',",
     "      { path: 'hide_rest', label: 'Kachel \"Nicht erfasst\" ausblenden', kind: 'bool', help: 'Die Kachel zeigt den Teil des Hausverbrauchs, der keinem Gerät und keiner Gruppe zugeordnet ist (Hausverbrauch minus Summe der Gruppen).' },\n"
     "      { path: 'groups_lines', label: 'Linien zu den Verbrauchern', kind: 'choice',"),
    ("      { name: 'groups_lines', selector:", "      bool('hide_rest', false),\n      { name: 'groups_lines', selector:"),
    ("groups_lines: 'Linien zu den Verbrauchern',", "groups_lines: 'Linien zu den Verbrauchern', hide_rest: 'Kachel \"Nicht erfasst\" ausblenden',"),
])
sub('docs/KONFIGURATION.md', [
    ("| `groups_lines` |",
     "| `hide_rest` | `true` / `false` | Blendet die Kachel \"Nicht erfasst\" unter den Gruppen aus. Sie zeigt den Hausverbrauch, der keiner Gruppe zugeordnet ist (Hausverbrauch minus Summe der Gruppen). Mit `rest.name` lässt sich ihre Beschriftung ändern |\n| `groups_lines` |"),
])
c = R / 'CHANGELOG.md'
u = c.read_text(encoding='utf-8')
u = u.replace("# Änderungsprotokoll\n", """# Änderungsprotokoll

## 0.8.2
- **Kachel "Nicht erfasst" ausblendbar:** neue Option `hide_rest: true` (Assistent, Schritt *Verbraucher*, und Formular). Vorher erschien sie bei jeder Gruppenliste und ließ sich nur über `rest: false` im YAML abschalten.
""", 1)
c.write_text(u, encoding='utf-8')
pk = R / 'package.json'
pk.write_text(pk.read_text(encoding='utf-8').replace('"version": "0.8.1"', '"version": "0.8.2"'), encoding='utf-8')
hd = R / 'docs' / 'handout.html'
hd.write_text(hd.read_text(encoding='utf-8').replace('Version 0.8.1', 'Version 0.8.2'), encoding='utf-8')
print('ok')
