"""v0.13.0: mehrere Speicher (batteries): je Speicher eine Kachel, Summe für Ring, Banner und Tageswerte."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:90]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


sub('src/flow-card.js', [
    # _set mit optionalem Wurzelelement (je Speicherkachel)
    ("  _set(sel, txt, isHtml) {\n    const el = this._$(sel);",
     "  _set(sel, txt, isHtml, root) {\n    const el = root ? root.querySelector(sel) : this._$(sel);"),
    # CSS: Container für mehrere Speicherkacheln
    (".pv{grid-area:pv}.pv2{grid-area:pv2}.grid{grid-area:grid}.bat{grid-area:bat}",
     ".pv{grid-area:pv}.pv2{grid-area:pv2}.grid{grid-area:grid}.bat{grid-area:bat}\n"
     ".bats{grid-area:bat;display:flex;flex-direction:column;justify-content:center;gap:24px 0;min-width:0}.bats .bat{grid-area:auto}\n"
     ".narrow .bats{gap:16px 0}"),
    # setConfig: Liste der Speicher bilden
    ("    this._c.consumers = arr(this._c.consumers).filter(used);",
     "    // Speicher: batteries (Liste) hat Vorrang, sonst der einzelne Eintrag battery\n"
     "    const usedB = (b) => b && (b.power || b.power_charge || b.power_discharge || b.soc);\n"
     "    let bl = arr(this._c.batteries).filter(usedB);\n"
     "    if (!bl.length && this._c.battery) bl = [this._c.battery];\n"
     "    this._c.batteries = bl;\n"
     "    if (bl.length) this._c.battery = bl[0];\n"
     "    this._c.consumers = arr(this._c.consumers).filter(used);"),
    # Aufbau: eine Kachel je Speicher
    ("""    if (c.battery) {
      nodes += node('bat', 'bat', c.battery.icon || 'mdi:home-battery-outline', c.battery.name || T('flow.battery'), PAL.bat, (c.battery.tap === 'soc' && c.battery.soc) || c.battery.power || c.battery.power_charge || c.battery.power_discharge,
        // Klick auf Balken und Prozentzahl öffnet den Verlauf des Ladestands, der Rest der Kachel den der Leistung
        `<div class="socbox"${c.battery.soc ? ` data-e="${esc(c.battery.soc)}"` : ''}><div class="soc"><div class="soc-fill"></div><div class="soc-low"></div><div class="soc-high"></div></div><div class="soc-row"><span>${T('flow.soc')}</span><b class="soc-txt">—</b></div></div>`);
      links.push('bat');
    }""",
     """    if (c.batteries.length) {
      const nB = c.batteries.length;
      const bHtml = c.batteries.map((b, i) => node(this._bk(i), 'bat', b.icon || 'mdi:home-battery-outline', b.name || (T('flow.battery') + (nB > 1 ? ' ' + (i + 1) : '')), PAL.bat, (b.tap === 'soc' && b.soc) || b.power || b.power_charge || b.power_discharge,
        // Klick auf Balken und Prozentzahl öffnet den Verlauf des Ladestands, der Rest der Kachel den der Leistung
        `<div class="socbox"${b.soc ? ` data-e="${esc(b.soc)}"` : ''}><div class="soc"><div class="soc-fill"></div><div class="soc-low"></div><div class="soc-high"></div></div><div class="soc-row"><span>${T('flow.soc')}</span><b class="soc-txt">—</b></div></div>`)).join('');
      nodes += nB > 1 ? `<div class="bats">${bHtml}</div>` : bHtml;
      c.batteries.forEach((b, i) => links.push(this._bk(i)));
    }"""),
    ("    if (c.battery && (c.battery.daily_charge || c.battery.daily_discharge)) stats += d('bat', T('stat.bat'), PAL.bat);",
     "    if (c.batteries.some((b) => b.daily_charge || b.daily_discharge)) stats += d('bat', T('stat.bat'), PAL.bat);"),
    # Linien: alle Speicherkacheln seitlich anschließen
    ("['pv', 'pv2', 'grid', 'bat'].includes(L.k)", "(['pv', 'pv2', 'grid'].includes(L.k) || /^bat\\d*$/.test(L.k))"),
    # Prognose je Speicher (eigene Glättung)
    ("  _batForecast(bat, soc) {\n    const c = this._c, h = this._hass, cap = parseFloat(c.battery.capacity_kwh);\n    const now = Date.now();\n    if (bat !== null) {\n      const dt = this._emaT ? (now - this._emaT) / 1000 : 0;\n      const a = dt > 0 ? 1 - Math.exp(-dt / 300) : 1;\n      this._ema = this._ema === undefined ? bat : this._ema + a * (bat - this._ema);\n      this._emaT = now;\n    }\n    if (!cap || soc === null) return '';\n    const { reserve, maxSoc } = this._limits();\n    // Richtungswechsel oder Glättung noch nicht eingeschwungen -> aktuellen Wert nehmen\n    const e = this._ema || 0;",
     "  _batForecast(bat, soc, b, idx) {\n    const c = this._c, h = this._hass, cap = parseFloat((b || c.battery).capacity_kwh);\n    const now = Date.now();\n    const S = ((this._emaS = this._emaS || [])[idx || 0] = (this._emaS[idx || 0] || {}));\n    if (bat !== null) {\n      const dt = S.t ? (now - S.t) / 1000 : 0;\n      const a = dt > 0 ? 1 - Math.exp(-dt / 300) : 1;\n      S.v = S.v === undefined ? bat : S.v + a * (bat - S.v);\n      S.t = now;\n    }\n    if (!cap || soc === null) return '';\n    const { reserve, maxSoc } = this._limits(b);\n    // Richtungswechsel oder Glättung noch nicht eingeschwungen -> aktuellen Wert nehmen\n    const e = S.v || 0;"),
    ("  _limits() {\n    const h = this._hass, b = (this._c && this._c.battery) || {};",
     "  _bk(i) { return i ? 'bat' + (i + 1) : 'bat'; }\n  _limits(bb) {\n    const h = this._hass, b = bb || (this._c && this._c.battery) || {};"),
    # Berechnung: Summe aller Speicher
    ("""    let bat = c.battery ? watt(h, c.battery.power) : null;
    // Getrennte Sensoren für Laden und Entladen (z. B. SunEnergyXT): Laden positiv, Entladen negativ
    if (c.battery && !c.battery.power && (c.battery.power_charge || c.battery.power_discharge)) {
      const pc = c.battery.power_charge ? watt(h, c.battery.power_charge) : null, pd = c.battery.power_discharge ? watt(h, c.battery.power_discharge) : null;
      bat = pc === null && pd === null ? null : (pc || 0) - (pd || 0);
    }
    if (bat !== null && c.battery.invert) bat = -bat;
    const soc = c.battery ? num(h, c.battery.soc) : null;
""",
     """    // Je Speicher Leistung (Laden positiv) und Ladestand; Summe bzw. nach Kapazität gewichteter Mittelwert für Ring und Banner
    const bats = c.batteries.map((b, i) => {
      let p = b.power ? watt(h, b.power) : null;
      // Getrennte Sensoren für Laden und Entladen (z. B. SunEnergyXT): Laden positiv, Entladen negativ
      if (!b.power && (b.power_charge || b.power_discharge)) {
        const pc = b.power_charge ? watt(h, b.power_charge) : null, pd = b.power_discharge ? watt(h, b.power_discharge) : null;
        p = pc === null && pd === null ? null : (pc || 0) - (pd || 0);
      }
      if (p !== null && b.invert) p = -p;
      return { b, i, p, soc: num(h, b.soc), cap: parseFloat(b.capacity_kwh) || 0 };
    });
    const bat = bats.some((x) => x.p !== null) ? bats.reduce((a, x) => a + (x.p || 0), 0) : null;
    const withSoc = bats.filter((x) => x.soc !== null);
    const wSum = withSoc.reduce((a, x) => a + (x.cap || 1), 0);
    const soc = withSoc.length ? withSoc.reduce((a, x) => a + x.soc * (x.cap || 1), 0) / wSum : null;
"""),
    # Anzeige je Speicher
    ("""    if (c.battery) {
      const el = this._$('[data-k="bat"]'), on = Math.abs(bat || 0) > TH, chg = (bat || 0) > 0;
      const col = on && chg ? PAL.chg : PAL.bat;
      el.classList.toggle('on', on);
      el.classList.toggle('charging', on && chg);
      el.style.setProperty('--c', col);
      this._anim('bat', bat === null ? null : Math.abs(bat), el);
      this._set('.bat .tag', bat === null ? T('tag.offline') : !on ? T('tag.standby') : chg ? T('tag.charging') : T('tag.discharging'));
      const fill = this._$('.soc-fill');
      const lm = this._limits();
      const usable = c.battery.soc_display === 'nutzbar' && lm.maxSoc > lm.reserve;
      // nutzbar: 0 % = Entladegrenze, 100 % = Maximalladung
      const shown = soc === null ? null : usable ? Math.max(0, Math.min(100, (soc - lm.reserve) / (lm.maxSoc - lm.reserve) * 100)) : Math.max(0, Math.min(100, soc));
      fill.style.width = (shown === null ? 0 : shown) + '%';
      fill.style.setProperty('--sc', shown !== null && shown < 20 ? PAL.imp : shown !== null && shown < 40 ? PAL.pv : col);
      this._set('.soc-txt', shown === null ? '—' : Math.round(shown) + ' %' + (usable ? ' ' + T('bat.usable_pct') : ''));
      const lo = this._$('.soc-low'), hi = this._$('.soc-high');
      if (lo) { lo.style.width = (usable ? 0 : lm.reserve) + '%'; lo.style.display = !usable && lm.reserve > 0 ? '' : 'none'; }
      if (hi) { hi.style.width = (usable ? 0 : 100 - lm.maxSoc) + '%'; hi.style.display = !usable && lm.maxSoc < 100 ? '' : 'none'; }
      this._set('.bat .sub', this._batForecast(bat, soc), true);
      this._link('bat', on, !chg, col, bat);
    }""",
     """    bats.forEach((x) => {
      const key = this._bk(x.i), el = this._$(`[data-k="${key}"]`);
      if (!el) return;
      const bp = x.p, bs = x.soc, on = Math.abs(bp || 0) > TH, chg = (bp || 0) > 0;
      const col = on && chg ? PAL.chg : PAL.bat;
      el.classList.toggle('on', on);
      el.classList.toggle('charging', on && chg);
      el.style.setProperty('--c', col);
      this._anim(key, bp === null ? null : Math.abs(bp), el);
      this._set('.tag', bp === null ? T('tag.offline') : !on ? T('tag.standby') : chg ? T('tag.charging') : T('tag.discharging'), false, el);
      const fill = el.querySelector('.soc-fill');
      const lm = this._limits(x.b);
      const usable = x.b.soc_display === 'nutzbar' && lm.maxSoc > lm.reserve;
      // nutzbar: 0 % = Entladegrenze, 100 % = Maximalladung
      const shown = bs === null ? null : usable ? Math.max(0, Math.min(100, (bs - lm.reserve) / (lm.maxSoc - lm.reserve) * 100)) : Math.max(0, Math.min(100, bs));
      fill.style.width = (shown === null ? 0 : shown) + '%';
      fill.style.setProperty('--sc', shown !== null && shown < 20 ? PAL.imp : shown !== null && shown < 40 ? PAL.pv : col);
      this._set('.soc-txt', shown === null ? '—' : Math.round(shown) + ' %' + (usable ? ' ' + T('bat.usable_pct') : ''), false, el);
      const lo = el.querySelector('.soc-low'), hi = el.querySelector('.soc-high');
      if (lo) { lo.style.width = (usable ? 0 : lm.reserve) + '%'; lo.style.display = !usable && lm.reserve > 0 ? '' : 'none'; }
      if (hi) { hi.style.width = (usable ? 0 : 100 - lm.maxSoc) + '%'; hi.style.display = !usable && lm.maxSoc < 100 ? '' : 'none'; }
      this._set('.sub', this._batForecast(bp, bs, x.b, x.i), true, el);
      this._link(key, on, !chg, col, bp);
    });"""),
    # Tageswerte: Summe über alle Speicher
    ("    const dChg = c.battery ? en(c.battery.daily_charge) : null;\n    const dDis = c.battery ? en(c.battery.daily_discharge) : null;",
     "    const sumBat = (f) => c.batteries.reduce((a, b) => { const v = en(b[f]); return v === null ? a : (a || 0) + v; }, null);\n    const dChg = sumBat('daily_charge');\n    const dDis = sumBat('daily_discharge');"),
])

print('ok')
