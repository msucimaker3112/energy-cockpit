"""v0.9.0: zweite PV-Anlage (pv2), z. B. Balkonkraftwerk. Eigene Kachel und Linie, Bilanz mit der Summe."""
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
    # CSS: dritte Zeile links
    (".pv{grid-area:pv}.grid{grid-area:grid}.bat{grid-area:bat}",
     ".pv{grid-area:pv}.pv2{grid-area:pv2}.grid{grid-area:grid}.bat{grid-area:bat}\n"
     ".layout.has-pv2{grid-template-areas:\"pv hub bat\" \"pv2 hub bat\" \"grid hub bat\"}"),
    (".narrow .layout{grid-template-columns:1fr 1fr;grid-template-areas:\"hub hub\" \"pv bat\" \"grid bat\";gap:16px 14px}",
     ".narrow .layout{grid-template-columns:1fr 1fr;grid-template-areas:\"hub hub\" \"pv bat\" \"grid bat\";gap:16px 14px}\n"
     ".narrow .layout.has-pv2{grid-template-areas:\"hub hub\" \"pv bat\" \"pv2 bat\" \"grid bat\"}"),
    # Kachel + Linie
    ("    if (c.grid) { nodes += node('grid', 'grid',",
     "    const hasPv2 = !!(c.pv2 && c.pv2.entity);\n"
     "    if (hasPv2) { nodes += node('pv2', 'pv2', c.pv2.icon || 'mdi:solar-panel', c.pv2.name || T('flow.pv2'), PAL.pv, c.pv2.entity); links.push('pv2'); }\n"
     "    if (c.grid) { nodes += node('grid', 'grid',"),
    ("        <div class=\"layout\">", "        <div class=\"layout${hasPv2 ? ' has-pv2' : ''}\">"),
    # Tagesertrag: Anzeige auch, wenn nur pv2 einen Tageswert hat
    ("    if (c.pv && c.pv.daily) stats += d('pv', T('stat.pv'), PAL.pv);",
     "    if ((c.pv && c.pv.daily) || (c.pv2 && c.pv2.daily)) stats += d('pv', T('stat.pv'), PAL.pv);"),
    ("    const dPv = c.pv ? num(h, c.pv.daily) : null;",
     "    let dPv = c.pv ? num(h, c.pv.daily) : null;\n"
     "    if (c.pv2 && c.pv2.daily) { const d2 = num(h, c.pv2.daily); if (d2 !== null) dPv = (dPv || 0) + d2; }"),
    # Berechnung
    ("    const pv = c.pv ? watt(h, c.pv.entity) : null;\n",
     "    const pv1 = c.pv ? watt(h, c.pv.entity) : null;\n"
     "    const pv2 = c.pv2 && c.pv2.entity ? watt(h, c.pv2.entity) : null;\n"
     "    // Summe aller Erzeuger. Mit pv2 gilt: PV 2 (z. B. Balkonkraftwerk) speist zuerst ins Haus.\n"
     "    const pv = pv1 === null && pv2 === null ? null : (pv1 || 0) + (pv2 || 0);\n"),
    ("    if (home === null) home = Math.max(0, (pv || 0) + (grid || 0) - (bat || 0));\n",
     "    if (home === null) home = Math.max(0, (pv || 0) + (grid || 0) - (bat || 0));\n"
     "    else if (c.pv2 && c.pv2.add_to_home) home += Math.max(0, pv2 || 0);\n"),
    # PV-Kachel: je Quelle aufteilen
    ("""    if (c.pv) {
      const el = this._$('[data-k="pv"]'), on = (pv || 0) > TH;
      el.classList.toggle('on', on);
      this._anim('pv', pv, el);
      this._set('.pv .tag', pv === null ? T('tag.offline') : on ? T('tag.producing') : T('tag.idle'));
      const parts = [];
      // Wohin die erzeugte Leistung geht: Haus, Batterie, Netz
      if (on) {
        const use = [];
        if (pvHome > TH) use.push(`${T('pv.use.home')} <b>${fW(pvHome)}</b>`);
        const toBat = Math.min(bChg, Math.max(0, (pv || 0) - pvHome));
        if (toBat > TH) use.push(`${T('pv.use.bat')} <b>${fW(toBat)}</b>`);
        if (gExp > TH) use.push(`${T('pv.use.grid')} <b>${fW(gExp)}</b>`);
        if (use.length) parts.push('→ ' + use.join(' · '));
      }
""", """    // Aufteilung je Quelle: PV 2 (Balkonkraftwerk) deckt zuerst das Haus, PV 1 lädt danach die Batterie und speist ein
    const need = Math.max(0, home - gImp - bDis);
    const p2 = Math.max(0, pv2 || 0), p1 = Math.max(0, pv1 || 0);
    const p2Home = Math.min(p2, need);
    const p1Home = Math.min(p1, Math.max(0, need - p2Home));
    const p1Bat = Math.min(bChg, Math.max(0, p1 - p1Home));
    const p1Exp = Math.min(gExp, Math.max(0, p1 - p1Home - p1Bat));
    const p2Exp = Math.min(Math.max(0, gExp - p1Exp), Math.max(0, p2 - p2Home));
    const useText = (home_, bat_, exp_) => {
      const use = [];
      if (home_ > TH) use.push(`${T('pv.use.home')} <b>${fW(home_)}</b>`);
      if (bat_ > TH) use.push(`${T('pv.use.bat')} <b>${fW(bat_)}</b>`);
      if (exp_ > TH) use.push(`${T('pv.use.grid')} <b>${fW(exp_)}</b>`);
      return use.length ? '→ ' + use.join(' · ') : '';
    };
    if (c.pv2 && c.pv2.entity) {
      const el = this._$('[data-k="pv2"]'), on = p2 > TH;
      el.classList.toggle('on', on);
      this._anim('pv2', pv2, el);
      this._set('.pv2 .tag', pv2 === null ? T('tag.offline') : on ? T('tag.producing') : T('tag.idle'));
      const parts2 = [];
      const u2 = on ? useText(p2Home, 0, p2Exp) : '';
      if (u2) parts2.push(u2);
      (c.pv2.strings || []).forEach((s) => parts2.push(`${s.name || s.entity} <b>${fW(watt(h, s.entity))}</b>`));
      this._set('.pv2 .sub', parts2.join('<br>'), true);
      this._link('pv2', on, true, PAL.pv, pv2);
    }
    if (c.pv) {
      const el = this._$('[data-k="pv"]'), on = p1 > TH;
      el.classList.toggle('on', on);
      this._anim('pv', pv1, el);
      this._set('.pv .tag', pv1 === null ? T('tag.offline') : on ? T('tag.producing') : T('tag.idle'));
      const parts = [];
      // Wohin die erzeugte Leistung geht: Haus, Batterie, Netz
      if (on) {
        const u1 = useText(p1Home, p1Bat, p1Exp);
        if (u1) parts.push(u1);
      }
"""),
    ("      this._link('pv', on, true, PAL.pv, pv);\n    }\n    if (c.grid) {",
     "      this._link('pv', on, true, PAL.pv, pv1);\n    }\n    if (c.grid) {"),
])

sub('src/i18n.js', [
    ("'flow.pv': 'PV-Anlage',", "'flow.pv': 'PV-Anlage', 'flow.pv2': 'PV 2',"),
])

sub('src/flow-editor.js', [
    ("      sec('grid', 'Netz', [ent('entity', ['sensor']), txt('name'), bool('invert', false),",
     "      sec('pv2', 'Zweite Solaranlage (z. B. Balkonkraftwerk)', [ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor']), bool('add_to_home', false)]),\n"
     "      sec('grid', 'Netz', [ent('entity', ['sensor']), txt('name'), bool('invert', false),"),
    ("      { path: 'pv.forecast', label: 'Prognose der Leistung (z. B. Solcast)', kind: 'power', optional: true, hints: H(/forecast|prognose|solcast/i) },\n",
     "      { path: 'pv.forecast', label: 'Prognose der Leistung (z. B. Solcast)', kind: 'power', optional: true, hints: H(/forecast|prognose|solcast/i) },\n"
     "      { path: 'pv2.entity', label: 'Zweite Anlage, z. B. Balkonkraftwerk (Leistung)', kind: 'power', optional: true, hints: H(/bkw|balkon|pv2|solar2|plug|steckdose|shelly/i), help: 'Eigene Kachel und Linie. Die Bilanz (Autarkie, Eigenverbrauch, Herkunft) rechnet mit der Summe beider Anlagen.' },\n"
     "      { path: 'pv2.name', label: 'Name der zweiten Anlage', kind: 'text', optional: true },\n"
     "      { path: 'pv2.daily', label: 'Tagesertrag der zweiten Anlage (kWh)', kind: 'energy', optional: true },\n"
     "      { path: 'pv2.add_to_home', label: 'Hausverbrauch enthält die zweite Anlage nicht', kind: 'bool', help: 'Nur aktivieren, wenn dein Hausverbrauchs-Sensor den Ertrag der zweiten Anlage NICHT enthält. Dann addiert die Karte ihn dazu.' },\n"),
    ("hide_rest: 'Kachel \"Nicht erfasst\" ausblenden',",
     "hide_rest: 'Kachel \"Nicht erfasst\" ausblenden', add_to_home: 'Hausverbrauch enthält die zweite Anlage nicht',"),
])

sub('docs/KONFIGURATION.md', [
    ("Gruppen (mehrere Verbraucher je Raum) und der Rest \"nicht erfasst\":",
     """Zweite Solaranlage, zum Beispiel ein Balkonkraftwerk mit eigenem Sensor:

```yaml
pv:
  entity: sensor.pv_leistung        # große Anlage (lädt die Batterie)
  name: Dach
pv2:
  entity: sensor.bkw_leistung       # Balkonkraftwerk (speist direkt ins Hausnetz)
  name: Balkonkraftwerk
  daily: sensor.bkw_heute           # optional, wird zum Tagesertrag addiert
  add_to_home: false                # true, wenn dein Hausverbrauchs-Sensor das BKW NICHT enthält
```

Die Karte zeigt eine eigene Kachel mit eigener Linie. Autarkie, Eigenverbrauch und die Herkunft im Ring rechnen mit der Summe beider Anlagen. Die zweite Anlage deckt zuerst das Haus, die erste lädt danach die Batterie und speist ein.

Gruppen (mehrere Verbraucher je Raum) und der Rest "nicht erfasst":"""),
])

c = R / 'CHANGELOG.md'
u = c.read_text(encoding='utf-8')
u = u.replace("# Änderungsprotokoll\n", """# Änderungsprotokoll

## 0.9.0
- **Zweite Solaranlage (`pv2`):** zum Beispiel ein Balkonkraftwerk. Eigene Kachel und Linie zum Haus, Tagesertrag wird addiert, Autarkie, Eigenverbrauch und Herkunft rechnen mit der Summe. Die zweite Anlage deckt zuerst das Haus, die erste lädt danach die Batterie. Einstellbar im Assistenten (Schritt *Solar*) und im Formular. Mit `pv2.add_to_home: true` addiert die Karte die zweite Anlage zum Hausverbrauch, falls der Sensor sie nicht enthält.
""", 1)
c.write_text(u, encoding='utf-8')
pk = R / 'package.json'
pk.write_text(pk.read_text(encoding='utf-8').replace('"version": "0.8.3"', '"version": "0.9.0"'), encoding='utf-8')
hd = R / 'docs' / 'handout.html'
hd.write_text(hd.read_text(encoding='utf-8').replace('Version 0.8.3', 'Version 0.9.0'), encoding='utf-8')
print('ok')
