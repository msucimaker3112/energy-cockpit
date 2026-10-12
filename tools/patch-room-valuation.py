"""Einmalig: Bewertung nach entgangenem Nutzen (valuation) in der Raum-Abrechnung, Auswahlfeld im Assistenten."""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent


def sub(path, old, new, count=1):
    p = root / path
    s = p.read_text(encoding='utf-8')
    assert s.count(old) >= 1, f'{path}: nicht gefunden: {old[:80]!r}'
    p.write_text(s.replace(old, new, count), encoding='utf-8')


R = 'src/room-card.js'
# 4 Töpfe je Gerät: Netz, Batterie, PV (Haus hätte es gebraucht), PV (Überschuss, sonst eingespeist)
sub(R, "(days[k] = days[k] || ids.map(() => [0, 0, 0]))[di][0] += x.change > 0 ? x.change : 0;",
    "(days[k] = days[k] || ids.map(() => [0, 0, 0, 0]))[di][0] += x.change > 0 ? x.change : 0;")
sub(R, "const a = (days[k] = days[k] || ids.map(() => [0, 0, 0]));\n            dev.forEach((v, di) => { a[di][0] += v * g; a[di][1] += v * b; a[di][2] += v * p; });",
    "const a = (days[k] = days[k] || ids.map(() => [0, 0, 0, 0]));\n            const sur = exp > 0.0001; // in dieser Stunde wurde eingespeist: PV-Anteil hätte sonst Einspeisevergütung gebracht\n            dev.forEach((v, di) => { a[di][0] += v * g; a[di][1] += v * b; a[di][sur ? 3 : 2] += v * p; });")
sub(R, "const out = Array.from({ length: nd }, () => [0, 0, 0]);", "const out = Array.from({ length: nd }, () => [0, 0, 0, 0]);")
sub(R, "out[i][0] += v[0]; out[i][1] += v[1]; out[i][2] += v[2]; });",
    "out[i][0] += v[0]; out[i][1] += v[1]; out[i][2] += v[2]; out[i][3] += v[3]; });")

old_calc_start = "    // Aufbereitung eines Zeitraums: Mengen je Quelle, je Gerät, Kosten\n    _calc(from, to, withFee) {"
s = (root / R).read_text(encoding='utf-8')
a = s.index(old_calc_start)
b = s.index("    _period(tab) {")
new_calc = """    // Aufbereitung eines Zeitraums: Mengen je Quelle, je Gerät, Kosten
    // valuation: 'opportunity' (Standard), 'mix' oder 'grid'
    //  opportunity: Was die Energie das Haus gekostet hat bzw. entgangen ist. Netz, Batterie und PV, die das Haus selbst gebraucht hätte,
    //               zum Bezugspreis (sonst hätte das Haus Strom kaufen müssen). PV aus Überschussstunden zur Einspeisevergütung.
    //  mix:         Netz zum Bezugspreis, Batterie zum Batteriepreis, PV zum PV-Preis (feste Preise je Quelle).
    //  grid:        alles zum Bezugspreis.
    _calc(from, to, withFee) {
      const P = this._prices(), mode = this._c.valuation || 'opportunity';
      const raw = this._sum(from, to);
      const price = (d) => {
        if (mode === 'grid') return (d[0] + d[1] + d[2] + d[3]) * P.grid;
        if (mode === 'mix') return d[0] * P.grid + d[1] * P.batt + (d[2] + d[3]) * P.pv;
        return (d[0] + d[1] + d[2]) * P.grid + d[3] * P.feed;
      };
      const dev = raw.map((d) => [d[0], d[1], d[2] + d[3]]);
      const src = [0, 0, 0];
      dev.forEach((d) => d.forEach((v, i) => { src[i] += v; }));
      const surplus = raw.reduce((a, d) => a + d[3], 0);
      const kwh = src[0] + src[1] + src[2];
      const fee = withFee ? this._fee(from, to) : 0;
      const devCost = raw.map(price);
      const cost = devCost.reduce((a, v) => a + v, 0) + fee;
      const costFull = kwh * P.grid + fee;
      return { dev, src, kwh, fee, cost, costFull, devCost, surplus };
    }
"""
s = s[:a] + new_calc + s[b:]
(root / R).write_text(s, encoding='utf-8')

# Texte zur Bewertung
sub(R, """        const priceTxt = P.grid > 0
          ? `Netz <b>${nf(P.grid * 100, 2)} ct/kWh</b>${mix ? ` · PV <b>${nf(P.pv * 100, 2)} ct/kWh</b> · Batterie <b>${nf(P.batt * 100, 2)} ct/kWh</b>` : ''}${c.base_fee ? ` · Grundgebühr <b>${fe(parseFloat(c.base_fee))} ${CUR}</b>/Monat` : ''}`
          : T('room.noprice');
        const explain = mix
          ? 'Herkunft: Je Stunde bekommt jeder Verbraucher den gleichen Mix aus Netz, Batterie und PV wie das ganze Haus. Kosten = Netz × Bezugspreis + PV × PV-Preis + Batterie × Batterie-Preis.'
          : 'Ohne Haus-Energiequellen (home_energy) wird der gesamte Verbrauch zum Netzpreis bewertet.';""",
    """        const mode = c.valuation || 'opportunity';
        const fee = c.base_fee ? ` · Grundgebühr <b>${fe(parseFloat(c.base_fee))} ${CUR}</b>/Monat` : '';
        let priceTxt, explain;
        if (!(P.grid > 0)) { priceTxt = T('room.noprice'); explain = ''; }
        else if (!mix || mode === 'grid') {
          priceTxt = `Alles zum Bezugspreis <b>${nf(P.grid * 100, 2)} ct/kWh</b>${fee}`;
          explain = mix ? 'Bewertung: Jede kWh kostet den Bezugspreis, egal woher sie kam.' : 'Ohne Haus-Energiequellen (home_energy) wird der gesamte Verbrauch zum Netzpreis bewertet.';
        } else if (mode === 'mix') {
          priceTxt = `Netz <b>${nf(P.grid * 100, 2)} ct</b> · Batterie <b>${nf(P.batt * 100, 2)} ct</b> · PV <b>${nf(P.pv * 100, 2)} ct/kWh</b>${fee}`;
          explain = 'Bewertung: Je Quelle ein fester Preis (Netz zum Bezugspreis, Batterie und PV zu den eingestellten Preisen).';
        } else {
          priceTxt = `Netz, Batterie und PV, die das Haus gebraucht hätte: <b>${nf(P.grid * 100, 2)} ct/kWh</b> · PV aus Überschuss (sonst eingespeist): <b>${nf(P.feed * 100, 2)} ct/kWh</b>${fee}`;
          explain = 'Bewertung nach entgangenem Nutzen: Strom aus Netz und Batterie sowie PV-Strom, den dein Haus selbst hätte verbrauchen können, kostet den Bezugspreis. Nur PV-Strom aus Stunden mit Einspeisung wird zur Einspeisevergütung bewertet.';
        }""")
sub(R, "  * `${full}", "  * `${full}") if False else None
sub(R, "<br>Zum Vergleich, <b>alles zum Netzpreis</b> (${nf(P.grid * 100, 2)} ct/kWh): <b>${fe(sum.full)} ${CUR}</b>.`",
    "<br>Zum Vergleich, <b>alles zum Netzpreis</b>: <b>${fe(sum.full)} ${CUR}</b>.`") if False else None

# Wizard: Auswahlfeld (kind: 'choice')
W = 'src/wizard.js'
sub(W, "    const fieldInput = (f, type) => {",
    """    const fieldChoice = (f) => {
      const wrap = el('div');
      wrap.appendChild(el('label', css.label, f.label));
      if (f.help) wrap.appendChild(el('div', css.help, f.help));
      const sel = el('select', css.input);
      f.options.forEach((o) => { const x = document.createElement('option'); x.value = o.value; x.textContent = o.label; sel.appendChild(x); });
      sel.value = getPath(cfg, f.path) || f.options[0].value;
      sel.addEventListener('change', () => { setPath(cfg, f.path, sel.value); emit(); });
      wrap.appendChild(sel);
      return wrap;
    };

    const fieldInput = (f, type) => {""")
sub(W, "        else if (f.kind === 'list') root.appendChild(fieldList(f));",
    "        else if (f.kind === 'list') root.appendChild(fieldList(f));\n        else if (f.kind === 'choice') root.appendChild(fieldChoice(f));")
print('ok')
