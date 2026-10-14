"""v0.8.3: Netz-Anzeige "Bezug" auch bei kleinen Werten, Textgröße (text_size), Nicht erfasst erst ab x % (rest_min)."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:70]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


CSS = """/* text_size: gross | sehr_gross vergrößert die kleinen Texte (Tablet, Handy) */
.ts-l .pill,.ts-l .tag,.ts-l .sub,.ts-l .mix,.ts-l .n-top,.ts-l .hub-lbl,.ts-l .clock,.ts-l .navbtn,.ts-l .it,.ts-l .c-sec,.ts-l .cons .lbl,.ts-l .grp .lbl,.ts-l .b-sub,.ts-l .stat span,.ts-l .soc-row{zoom:1.25}
.ts-xl .pill,.ts-xl .tag,.ts-xl .sub,.ts-xl .mix,.ts-xl .n-top,.ts-xl .hub-lbl,.ts-xl .clock,.ts-xl .navbtn,.ts-xl .it,.ts-xl .c-sec,.ts-xl .cons .lbl,.ts-xl .grp .lbl,.ts-xl .b-sub,.ts-xl .stat span,.ts-xl .soc-row{zoom:1.5}
.ts-l .soc-row b,.ts-xl .soc-row b{font-size:1.05rem}
"""

sub('src/flow-card.js', [
    ("/* Smartphone */", CSS + "/* Smartphone */"),
    # Netz-Beschriftung: Bezug/Einspeisung auch bei kleinen Werten (die Linie bleibt erst ab 10 W aktiv)
    ("grid === null ? T('tag.offline') : !on ? T('tag.balanced') : imp ? T('tag.import') : T('tag.export'));",
     "grid === null ? T('tag.offline') : Math.abs(grid) < 0.5 ? T('tag.balanced') : imp ? T('tag.import') : T('tag.export'));"),
    ("<ha-card><div class=\"wrap${sam ? ' sam-on' : ''}\">",
     "<ha-card><div class=\"wrap${sam ? ' sam-on' : ''}${c.text_size === 'gross' ? ' ts-l' : c.text_size === 'sehr_gross' ? ' ts-xl' : ''}\">"),
    ("      const rel = this._$('[data-k=\"grest\"]');\n      if (rel) vis++;",
     "      const rel = this._$('[data-k=\"grest\"]');\n"
     "      const restW = Math.max(0, home - known);\n"
     "      const restMin = parseFloat(c.rest_min) || 0;\n"
     "      const restShow = !!rel && (restMin <= 0 || (home > TH && restW / home * 100 >= restMin));\n"
     "      if (rel) { rel.style.display = restShow ? '' : 'none'; if (restShow) vis++; }"),
])

CHOICE = "[{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }]"
sub('src/flow-editor.js', [
    ("      { path: 'theme', label: 'Farbschema', kind: 'theme' },\n",
     "      { path: 'theme', label: 'Farbschema', kind: 'theme' },\n"
     "      { path: 'text_size', label: 'Textgröße', kind: 'choice', options: " + CHOICE + ", help: 'Vergrößert die kleinen Texte, zum Beispiel Ladestand, Kennzahlen oben rechts und Beschriftungen.' },\n"),
    ("      { path: 'hide_rest', label: 'Kachel \"Nicht erfasst\" ausblenden', kind: 'bool',",
     "      { path: 'rest_min', label: 'Kachel \"Nicht erfasst\" erst anzeigen ab (% vom Hausverbrauch)', kind: 'number', optional: true, step: '1', help: 'Zum Beispiel 10: Die Kachel erscheint nur, wenn mindestens 10 % des Hausverbrauchs keiner Gruppe zugeordnet sind.' },\n"
     "      { path: 'hide_rest', label: 'Kachel \"Nicht erfasst\" ausblenden', kind: 'bool',"),
    ("      bool('hide_rest', false),\n",
     "      bool('hide_rest', false),\n      numb('rest_min', 0, 100, 1),\n"
     "      { name: 'text_size', selector: { select: { mode: 'dropdown', options: " + CHOICE + " } } },\n"),
    ("hide_rest: 'Kachel \"Nicht erfasst\" ausblenden',",
     "hide_rest: 'Kachel \"Nicht erfasst\" ausblenden', rest_min: 'Kachel \"Nicht erfasst\" erst ab (%)', text_size: 'Textgröße',"),
])

sub('docs/KONFIGURATION.md', [
    ("| `hide_rest` |",
     "| `text_size` | `normal` (Standard), `gross`, `sehr_gross` | Vergrößert die kleinen Texte (Ladestand, Kennzahlen oben rechts, Beschriftungen). Gut für Handy und Tablet |\n"
     "| `rest_min` | Zahl in % | Zeigt die Kachel \"Nicht erfasst\" erst, wenn mindestens so viel Prozent des Hausverbrauchs keiner Gruppe zugeordnet sind (zum Beispiel `10`). Standard: immer anzeigen |\n"
     "| `hide_rest` |"),
])
c = R / 'CHANGELOG.md'
u = c.read_text(encoding='utf-8')
u = u.replace("# Änderungsprotokoll\n", """# Änderungsprotokoll

## 0.8.3
- **Netz:** Die Beschriftung zeigt "Bezug" oder "Einspeisung" ab 0,5 W. "Ausgeglichen" erscheint nur noch, wenn praktisch nichts fließt. Die animierte Linie bleibt wie bisher ab 10 W aktiv.
- **Textgröße:** neue Option `text_size` (`normal`, `gross`, `sehr_gross`). Vergrößert Ladestand, Kennzahlen oben rechts und Beschriftungen, gedacht für Handy und Tablet.
- **Nicht erfasst erst ab x %:** neue Option `rest_min`, zum Beispiel `10`.
""", 1)
c.write_text(u, encoding='utf-8')
pk = R / 'package.json'
pk.write_text(pk.read_text(encoding='utf-8').replace('"version": "0.8.2"', '"version": "0.8.3"'), encoding='utf-8')
hd = R / 'docs' / 'handout.html'
hd.write_text(hd.read_text(encoding='utf-8').replace('Version 0.8.2', 'Version 0.8.3'), encoding='utf-8')
print('ok')
