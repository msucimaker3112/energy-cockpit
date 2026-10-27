/* energy-cockpit-room-card: Raum-Abrechnung. Verbrauch und Kosten eines Raums (z. B. vermietetes Büro) je Woche, Monat, Jahr und Vorjahr,
   getrennt nach Bereichen (Zählern) UND nach Herkunft der Energie (Netz, Batterie, PV). Der Herkunfts-Mix wird stundenweise aus dem Haus-Mix bestimmt:
   in jeder Stunde bekommt jeder Verbraucher denselben Anteil aus Netz, Batterie und PV wie das ganze Haus. */
(() => {
  const { nf, esc, rgb, T, setLocale, cur } = WD;
  const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const SRC = [['Netz', '255,92,122'], ['Batterie', '96,165,250'], ['PV', '255,197,61']];
  const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const fk = (v) => nf(v, v < 10 ? 2 : v < 100 ? 1 : 0);
  const fe = (v) => nf(v, 2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const CSS = `
${WD.themeCss()}:host{display:block;--acc:245,158,11}
ha-card{display:block;background:radial-gradient(120% 80% at 50% 0%,var(--bg1) 0%,var(--bg0) 65%);border-radius:28px;overflow:hidden;border:1px solid rgba(var(--ov),.06);color:var(--txt);font-family:Inter,var(--ha-font-family-body,system-ui),sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:22px;box-sizing:border-box}
header{display:flex;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.title{display:flex;align-items:center;font-size:1.1rem;font-weight:700;margin-right:auto}
.title img{height:34px;max-width:110px;object-fit:contain;border-radius:6px;margin-right:12px}
.title small{display:block;font-size:.74rem;color:rgb(var(--mut));font-weight:500;margin-top:2px}
.tabs{display:flex;background:rgba(var(--ov),.05);border:1px solid var(--stroke);border-radius:999px;padding:3px}
.tab{padding:7px 14px;border-radius:999px;font-size:.8rem;font-weight:650;color:rgb(var(--mut));cursor:pointer;-webkit-tap-highlight-color:transparent}
.tab.on{background:rgba(var(--acc),.2);color:rgb(var(--acc));box-shadow:0 0 0 1px rgba(var(--acc),.4)}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);grid-gap:12px;gap:12px}
.kpi{padding:14px 16px;border-radius:20px;background:linear-gradient(160deg,rgba(var(--ov),.065),rgba(var(--ov),.015)),var(--panel);border:1px solid var(--stroke);cursor:pointer}
.kpi.on{border-color:rgba(var(--acc),.55);box-shadow:0 0 0 1px rgba(var(--acc),.3)}
.kpi .l{font-size:.66rem;text-transform:uppercase;letter-spacing:.1em;font-weight:650;color:rgb(var(--mut))}
.kpi .k{font-size:1.7rem;font-weight:800;margin-top:6px;font-variant-numeric:tabular-nums}
.kpi .k small{font-size:.8rem;opacity:.7;margin-left:3px}
.kpi .e{font-size:1rem;font-weight:700;color:rgb(var(--acc));margin-top:2px;font-variant-numeric:tabular-nums}
.kpi .s{font-size:.68rem;color:rgb(var(--mut));margin-top:3px;line-height:1.5}
.mixbar{display:flex;height:6px;border-radius:99px;overflow:hidden;background:rgba(var(--ov),.07);margin-top:8px}
.mixbar i{display:block;height:100%;background:rgb(var(--c))}
.panel{margin-top:16px;padding:16px 18px;border-radius:22px;background:linear-gradient(160deg,rgba(var(--ov),.05),rgba(var(--ov),.012)),var(--panel);border:1px solid var(--stroke)}
.ph{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap}
.lbl{font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;font-weight:650;color:rgb(var(--mut))}
.leg{display:flex;flex-wrap:wrap;font-size:.74rem;color:rgb(var(--mut))}
.leg span{display:flex;align-items:center;margin-left:12px}
.leg i{width:8px;height:8px;border-radius:50%;margin-right:5px;background:rgb(var(--c))}
.bars{display:flex;align-items:flex-end;height:130px;margin-top:14px;gap:4px}
.col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;min-width:0}
.col .st{display:flex;flex-direction:column-reverse;border-radius:6px 6px 0 0;overflow:hidden;min-height:2px}
.col .st i{display:block;background:rgb(var(--c))}
.col.cur .st{box-shadow:0 0 0 1px rgba(var(--ov),.55)}
.xl{display:flex;margin-top:6px;gap:4px}
.xl span{flex:1;text-align:center;font-size:.64rem;color:rgb(var(--mut));font-weight:600;min-width:0;overflow:hidden}
.xl span.cur{color:rgb(var(--acc))}
.tw{max-height:320px;overflow:auto;margin-top:12px}
table{width:100%;border-collapse:collapse;font-size:.84rem;font-variant-numeric:tabular-nums}
th{font-size:.64rem;text-transform:uppercase;letter-spacing:.08em;color:rgb(var(--mut));text-align:right;padding:6px 8px;position:sticky;top:0;background:var(--panel)}
td{padding:7px 8px;text-align:right;border-top:1px solid rgba(var(--ov),.05)}
th:first-child,td:first-child{text-align:left}
tr.cur td{color:rgb(var(--acc));font-weight:700}
tr.sum td{border-top:2px solid rgba(var(--ov),.2);font-weight:800}
td.z{opacity:.35}
.note{margin-top:12px;font-size:.72rem;color:rgb(var(--mut));line-height:1.55}
.note b{color:var(--txt)}
.foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:12px;font-size:.72rem;color:rgb(var(--mut))}
.btn{cursor:pointer;padding:7px 14px;border-radius:999px;font-size:.78rem;font-weight:650;color:var(--txt);background:rgba(var(--ov),.07);border:1px solid rgba(var(--ov),.14);-webkit-tap-highlight-color:transparent}
.empty{padding:26px;text-align:center;color:rgb(var(--mut))}
.big{font-size:2.1rem;font-weight:800;margin-top:8px;font-variant-numeric:tabular-nums}
.big small{font-size:.9rem;opacity:.7}
.pbar{height:10px;border-radius:99px;background:rgba(var(--ov),.08);margin-top:10px;overflow:hidden}
.pbar i{display:block;height:100%;border-radius:99px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.mini{padding:10px 12px;border-radius:14px;background:rgba(var(--ov),.04);border:1px solid var(--stroke)}
.mini .l,.tile .l{font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;font-weight:650;color:rgb(var(--mut))}
.mini .v{font-size:1.15rem;font-weight:800;margin-top:4px;font-variant-numeric:tabular-nums}
.mini .s,.tile .s,.s2{font-size:.7rem;color:rgb(var(--mut));margin-top:4px;line-height:1.5}
.s2{margin-top:12px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:12px}
.tile{padding:12px 14px;border-radius:16px;background:rgba(var(--ov),.04);border:1px solid var(--stroke);border-top:2px solid rgb(var(--c))}
.wl{margin-top:4px;font-variant-numeric:tabular-nums}
.wv{font-size:1.9rem;font-weight:800}
.wl small{font-size:.8rem;opacity:.7;margin-left:4px}
.wv.lo{color:#34d399}.wv.mid{color:#ffc53d}.wv.hi{color:#ff5c7a}.wv.na{color:rgb(var(--mut))}
.spark{display:flex;align-items:flex-end;height:44px;gap:2px;margin-top:8px}
.spark i{flex:1;background:rgba(var(--c),.55);border-radius:2px 2px 0 0;min-height:0}
.spark i.now{background:rgb(var(--c))}
.herk{display:flex;align-items:center;margin-top:10px}
.donut{width:112px;height:112px;flex:none}
.hl{margin-left:18px;font-size:.86rem;line-height:1.9}
.hl .dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:rgb(var(--c));margin-right:7px}
.hl .mut{color:rgb(var(--mut));font-size:.74rem}
.heat{margin-top:14px;overflow-x:auto}
.hm{display:grid;grid-template-columns:30px repeat(24,minmax(8px,1fr)) 44px;gap:2px;margin-bottom:2px;align-items:center}
.hm span{font-size:.58rem;color:rgb(var(--mut));text-align:center}
.hm .cell{height:18px;border-radius:3px}
.hm .dl{text-align:left;font-weight:650;font-size:.7rem}
.hm .ah{text-align:right;font-size:.68rem;font-weight:650;color:var(--txt)}
.tile .s .wv{font-size:1em;font-weight:700}
tr.ch td{font-size:.86em;color:rgb(var(--mut))}tr.ch td:first-child{text-align:left;padding-left:18px}
tr.sub td{font-size:.68rem;color:rgb(var(--mut));text-align:left;border-top:0;padding-top:0}
.narrow .kpis{grid-template-columns:1fr 1fr}
.narrow .grid3{grid-template-columns:1fr}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`;

  WD.addStrings({
    'room.title': 'Raum-Abrechnung', 'room.week': 'Diese Woche', 'room.month': 'Dieser Monat', 'room.year': 'Dieses Jahr', 'room.prev': 'Vorjahr',
    'room.tab.week': 'Woche', 'room.tab.month': 'Monat', 'room.tab.year': 'Jahr', 'room.tab.prev': 'Vorjahr',
    'room.sum': 'Summe', 'room.loading': 'Daten werden geladen …',
    'room.noprice': 'Kein Preis eingestellt: Es werden nur kWh angezeigt.', 'room.csv': 'Als CSV kopieren', 'room.copied': 'Kopiert',
    'room.since': 'Daten seit', 'room.unconf': 'Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Zähler auszuwählen.',
  });

  class EnergyCockpitRoomCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._tab = 'month';
      this._days = null;
    }
    static getStubConfig(hass) {
      const ids = hass && hass.states ? Object.keys(hass.states) : [];
      void ids;
      return { title: 'Raum' }; // Die Karte startet im Einrichtungsassistenten
    }
    static getConfigElement() { return document.createElement('energy-cockpit-room-card-editor'); }
    setConfig(c) {
      WD.applyTheme(this, c, this._hass);
      const arr = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]) : []));
      const devs = arr(c && c.devices).filter((d) => d && d.energy);
      if (!devs.length) {
        this._c = null;
        this.shadowRoot.innerHTML = '<style>' + WD.themeCss() + 'ha-card{padding:22px;border-radius:24px;background:var(--panel);color:var(--txt);font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit Raum-Abrechnung</b><div style="margin-top:8px;opacity:.8">' + T('room.unconf') + '</div></ha-card>';
        return;
      }
      // Unterposten (devices[].items): eigener Zähler innerhalb eines Bereichs, zählt nicht doppelt zur Summe
      const items = [];
      devs.forEach((d, pi) => arr(d.items).filter((x) => x && x.energy).forEach((x) => items.push(Object.assign({}, x, { parent: pi }))));
      this._c = Object.assign({}, c, { devices: devs, items });
      this._days = null;
      this._loadedAt = 0;
      this._render();
      if (this._hass) this._load();
    }
    set hass(h) {
      WD.applyTheme(this, null, h);
      setLocale(h);
      this._hass = h;
      if (!this._c) return;
      if (!this._loading && Date.now() - this._loadedAt > 15 * 60 * 1000) this._load();
      this._liveUpd();
    }
    // Aktuelle Leistung je Bereich (Sensor "power"), sonst null
    _watt(d) {
      const h = this._hass;
      if (!d || !d.power || !h || !h.states[d.power]) return null;
      return WD.watt(h, d.power);
    }
    _wcls(w) {
      const warn = this._rate(this._c.watt_warn, 300), high = this._rate(this._c.watt_high, 800);
      return w === null ? 'na' : w >= high ? 'hi' : w >= warn ? 'mid' : 'lo';
    }
    _liveUpd() {
      if (!this._c) return;
      this.shadowRoot.querySelectorAll('[data-w]').forEach((el) => {
        const w = this._watt(this._c.devices[+el.dataset.w]);
        el.textContent = w === null ? '–' : nf(w, 0);
        el.className = 'wv ' + this._wcls(w);
      });
      this.shadowRoot.querySelectorAll('[data-wi]').forEach((el) => {
        const w = this._watt(this._c.items[+el.dataset.wi]);
        el.textContent = w === null ? '–' : nf(w, 0);
        el.className = 'wv ' + this._wcls(w);
      });
    }
    getCardSize() { return 9; }
    getGridOptions() { return { columns: 'full', min_columns: 6 }; }
    connectedCallback() {
      if (!this._ro && window.ResizeObserver) this._ro = new ResizeObserver(() => this._narrow());
      if (this._ro) this._ro.observe(this);
    }
    disconnectedCallback() { if (this._ro) this._ro.disconnect(); }
    _narrow() {
      const w = this.getBoundingClientRect().width, el = this.shadowRoot.querySelector('.wrap');
      if (el && w) el.classList.toggle('narrow', w < 640);
    }
    // Zahl, Sensor-/Helferwert (€ pro kWh) oder 0
    _rate(v, fallback) {
      const h = this._hass;
      if (typeof v === 'number') return v;
      if (typeof v === 'string' && h && h.states[v]) { const x = parseFloat(h.states[v].state); if (!isNaN(x)) return x; }
      return fallback;
    }
    _prices() {
      const c = this._c;
      let grid = this._rate(c.price, null);
      if (grid === null) grid = typeof c.price_ct === 'number' ? c.price_ct / 100 : 0;
      const feed = this._rate(c.feed_in, 0);
      const pv = this._rate(c.price_pv, feed);
      const batt = this._rate(c.price_battery, pv);
      return { grid, pv, batt, feed };
    }
    async _load() {
      const h = this._hass, c = this._c;
      if (!h || !h.callWS || !c) return;
      this._loading = true;
      try {
        const ids = c.devices.map((d) => d.energy);
        const nd = ids.length;
        const iids = c.items.map((x) => x.energy);
        const ni = iids.length;
        const y = new Date().getFullYear();
        const start = new Date(y - 1, 0, 1);
        const ts = (x) => (typeof x.start === 'number' ? x.start : Date.parse(x.start));
        // 1) Tageswerte der Geräte: erster Messtag, Gesamtverbrauch
        const dr = await h.callWS({ type: 'recorder/statistics_during_period', start_time: start.toISOString(), period: 'day', statistic_ids: ids.concat(iids), types: ['change'], ...WD.statUnits(c) });
        let firstTs = null;
        ids.forEach((id) => (dr[id] || []).forEach((x) => { const t = ts(x); if (x.change !== null && x.change !== undefined && (firstTs === null || t < firstTs)) firstTs = t; }));
        const days = {};
        const he = c.home_energy || {};
        const srcIds = ['pv', 'import', 'export', 'charge', 'discharge'].map((k) => he[k]).filter(Boolean);
        this._hasMix = !!(he.import && (he.pv || he.discharge));
        if (firstTs === null) {
          this._first = null;
        } else if (!this._hasMix) {
          ids.concat(iids).forEach((id, di) => (dr[id] || []).forEach((x) => {
            const k = key(new Date(ts(x)));
            (days[k] = days[k] || ids.concat(iids).map(() => [0, 0, 0, 0]))[di][0] += x.change > 0 ? x.change : 0;
          }));
          this._first = key(new Date(firstTs));
        } else {
          // 2) Stundenwerte: Geräte und Haus-Mix (PV, Bezug, Einspeisung, Batterie laden/entladen)
          const from = new Date(firstTs);
          from.setHours(0, 0, 0, 0);
          const all = ids.concat(iids, srcIds);
          const hr = await h.callWS({ type: 'recorder/statistics_during_period', start_time: from.toISOString(), period: 'hour', statistic_ids: all, types: ['change'], ...WD.statUnits(c) });
          const at = {};
          all.forEach((id, i) => (hr[id] || []).forEach((x) => {
            const t = ts(x);
            (at[t] = at[t] || {})[id] = x.change > 0 ? x.change : 0;
          }));
          this._hrs = [];
          this._mixH = Array.from({ length: 24 }, () => ({ n: 0, g: 0, b: 0, p: 0 }));
          const mixFrom = Date.now() - 30 * 864e5;
          Object.keys(at).forEach((t) => {
            const row = at[t];
            const dev = ids.map((id) => row[id] || 0);
            const idev = iids.map((id) => row[id] || 0);
            const pv = row[he.pv] || 0, imp = row[he.import] || 0, exp = row[he.export] || 0, chg = row[he.charge] || 0, dis = row[he.discharge] || 0;
            const home = pv + imp - exp - chg + dis;
            let g = 1, b = 0;
            if (home > 0.0001) { g = clamp(imp / home, 0, 1); b = clamp(dis / home, 0, 1 - g); }
            const p = 1 - g - b;
            // Stundenwerte (auch Stunden ohne Verbrauch) für Grundlast, Betriebszeiten und beste Zeit
            if (ids.some((id) => row[id] !== undefined)) this._hrs.push({ t: +t, dev, idev });
            if (row[he.import] !== undefined && home > 0.0001 && +t >= mixFrom) {
              const m = this._mixH[new Date(+t).getHours()];
              m.n++; m.g += g; m.b += b; m.p += p;
            }
            if (!dev.some((v) => v > 0)) return;
            const k = key(new Date(+t));
            const a = (days[k] = days[k] || ids.concat(iids).map(() => [0, 0, 0, 0]));
            const sur = exp > 0.0001; // in dieser Stunde wurde eingespeist: PV-Anteil hätte sonst Einspeisevergütung gebracht
            dev.forEach((v, di) => { a[di][0] += v * g; a[di][1] += v * b; a[di][sur ? 3 : 2] += v * p; });
            idev.forEach((v, j) => { const q = a[nd + j]; q[0] += v * g; q[1] += v * b; q[sur ? 3 : 2] += v * p; });
          });
          this._first = key(new Date(firstTs));
        }
        this._firstTs = firstTs;
        this._days = days;
        this._nd = nd + ni;
        this._loadedAt = Date.now();
      } catch (e) {
        console.warn('energy-cockpit-room-card: load failed', e);
        this._loadedAt = Date.now() - 12 * 60 * 1000;
        this._days = this._days || {};
      }
      this._loading = false;
      this._render();
    }
    // Summe über [from, to]: je Gerät [Netz, Batterie, PV]
    _sum(from, to) {
      const nd = this._c.devices.length + this._c.items.length;
      const out = Array.from({ length: nd }, () => [0, 0, 0, 0]);
      const f = key(from), t = key(to);
      Object.keys(this._days).forEach((k) => {
        if (k >= f && k <= t) this._days[k].forEach((v, i) => { out[i][0] += v[0]; out[i][1] += v[1]; out[i][2] += v[2]; out[i][3] += v[3]; });
      });
      return out;
    }
    _buckets(tab) {
      const now = new Date(), y = now.getFullYear(), m = now.getMonth();
      const out = [];
      if (tab === 'week') {
        const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
        for (let i = 0; i < 7; i++) {
          const d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
          out.push({ label: DAYS[d.getDay()] + ' ' + d.getDate() + '.', from: d, to: d, cur: key(d) === key(now), fee: false });
        }
      } else if (tab === 'month') {
        const dim = new Date(y, m + 1, 0).getDate();
        for (let i = 1; i <= dim; i++) {
          const d = new Date(y, m, i);
          out.push({ label: String(i), from: d, to: d, cur: i === now.getDate(), fee: false });
        }
      } else {
        const yy = tab === 'year' ? y : y - 1;
        for (let i = 0; i < 12; i++) {
          out.push({ label: MONTHS[i], from: new Date(yy, i, 1), to: new Date(yy, i + 1, 0), cur: tab === 'year' && i === m, fee: true });
        }
      }
      return out;
    }
    // Grundgebühr je Monat nur für Monate ab dem ersten Messwert (und nicht in der Zukunft)
    _fee(from, to) {
      const base = parseFloat(this._c.base_fee) || 0;
      if (!base || !this._first) return 0;
      let n = 0;
      const d = new Date(from.getFullYear(), from.getMonth(), 1);
      const fm = this._first.slice(0, 7), now = new Date();
      while (d <= to) {
        const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        if (k >= fm && d <= now) n++;
        d.setMonth(d.getMonth() + 1);
      }
      return base * n;
    }
    // Aufbereitung eines Zeitraums: Mengen je Quelle, je Gerät, Kosten
    // valuation: 'opportunity' (Standard), 'mix' oder 'grid'
    //  opportunity: Was die Energie das Haus gekostet hat bzw. entgangen ist. Netz, Batterie und PV, die das Haus selbst gebraucht hätte,
    //               zum Bezugspreis (sonst hätte das Haus Strom kaufen müssen). PV aus Überschussstunden zur Einspeisevergütung.
    //  mix:         Netz zum Bezugspreis, Batterie zum Batteriepreis, PV zum PV-Preis (feste Preise je Quelle).
    //  grid:        alles zum Bezugspreis.
    _calc(from, to, withFee) {
      const P = this._prices(), mode = this._c.valuation || 'opportunity';
      const rawAll = this._sum(from, to), nDev = this._c.devices.length;
      const raw = rawAll.slice(0, nDev), rawI = rawAll.slice(nDev);
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
      const items = rawI.map((d) => [d[0], d[1], d[2] + d[3]]);
      const itemCost = rawI.map(price);
      return { dev, src, kwh, fee, cost, costFull, devCost, surplus, items, itemCost };
    }
    _period(tab) {
      const now = new Date(), y = now.getFullYear();
      let from, to;
      if (tab === 'week') { from = new Date(y, now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)); to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6); }
      else if (tab === 'month') { from = new Date(y, now.getMonth(), 1); to = new Date(y, now.getMonth() + 1, 0); }
      else if (tab === 'year') { from = new Date(y, 0, 1); to = new Date(y, 11, 31); }
      else { from = new Date(y - 1, 0, 1); to = new Date(y - 1, 11, 31); }
      return Object.assign({ from, to }, this._calc(from, to, tab !== 'week'));
    }
    _csv() {
      const c = this._c, tab = this._tab, b = this._buckets(tab);
      const num = (v) => v.toFixed(3).replace('.', ',');
      const head = ['Zeitraum', 'Summe kWh', 'Netz kWh', 'Batterie kWh', 'PV kWh', 'Kosten ' + cur(), 'bei Bezugspreis ' + cur()].concat(c.devices.map((d) => (d.name || d.energy) + ' kWh'), c.items.map((x) => (c.devices[x.parent].name || c.devices[x.parent].energy) + ': ' + (x.name || x.energy) + ' kWh'));
      const rows = b.map((x) => {
        const r = this._calc(x.from, x.to, x.fee);
        return [x.label, num(r.kwh), num(r.src[0]), num(r.src[1]), num(r.src[2]), r.cost.toFixed(2).replace('.', ','), r.costFull.toFixed(2).replace('.', ',')]
          .concat(r.dev.map((d) => num(d[0] + d[1] + d[2])), r.items.map((d) => num(d[0] + d[1] + d[2])));
      });
      return [head].concat(rows).map((r) => r.join(';')).join('\n');
    }
    // Zusatzbereiche: Abrechnung/Hochrechnung, Live, Herkunft heute, Grundlast, Betriebszeiten (top) und Monatsarchiv (bottom)
    _extra(P, CUR, mix) {
      const c = this._c, now = new Date(), y = now.getFullYear(), m = now.getMonth();
      const hrs = this._hrs || [];
      const adv = this._rate(c.advance, 0), sb = this._rate(c.standby_w, 80), act = this._rate(c.active_w, 100);
      const sumW = (x) => x.dev.reduce((a, v) => a + v, 0) * 1000;
      let top = '';

      // 1 + 2: Abschlag, Hochrechnung, Vergleich
      if (P.grid > 0 || adv > 0) {
        const m0 = new Date(y, m, 1), m1 = new Date(y, m + 1, 0);
        const cm = this._calc(m0, m1, true), pm = this._calc(new Date(y, m - 1, 1), new Date(y, m, 0), true), ly = this._calc(new Date(y - 1, m, 1), new Date(y - 1, m + 1, 0), true);
        const fd = this._first ? new Date(this._first + 'T00:00:00') : null;
        const st = fd && fd > m0 ? fd : m0;
        const el = (now - st) / 864e5, rem = (new Date(y, m + 1, 1) - now) / 864e5;
        const vc = cm.cost - cm.fee;
        const proj = el >= 1 ? cm.fee + vc + vc / el * rem : null;
        const pct = adv > 0 ? clamp(cm.cost / adv * 100, 0, 100) : 0;
        const col = !adv ? '96,165,250' : cm.cost >= adv ? '255,92,122' : cm.cost >= adv * 0.8 ? '255,197,61' : '52,211,153';
        const saldo = (v) => (v >= 0 ? `<b style="color:rgb(52,211,153)">Guthaben ${fe(v)} ${CUR}</b>` : `<b style="color:rgb(255,92,122)">Nachzahlung ${fe(-v)} ${CUR}</b>`);
        let yr = '';
        if (adv > 0 && this._first) {
          const f = new Date(this._first + 'T00:00:00');
          const n = f.getFullYear() === y ? m - f.getMonth() + 1 : m + 1;
          const cy = this._calc(new Date(y, 0, 1), new Date(y, 11, 31), true);
          yr = `<div class="s2">Jahr ${y}: ${fe(cy.cost)} ${CUR} verbraucht, ${n} × ${fe(adv)} ${CUR} = ${fe(adv * n)} ${CUR} Abschlag, aktuell ${saldo(adv * n - cy.cost)}</div>`;
        }
        const dpct = proj !== null && pm.cost > 0 ? Math.round((proj / pm.cost - 1) * 100) : null;
        top += `<div class="panel"><div class="ph"><span class="lbl">Abrechnung ${MONTHS_LONG[m]} ${y}</span><span class="lbl">${adv ? 'Abschlag ' + fe(adv) + ' ' + CUR : 'ohne Abschlag'}</span></div>
          <div class="big">${fe(cm.cost)} <small>${CUR}</small></div>
          ${adv ? `<div class="pbar"><i style="width:${pct}%;background:rgb(${col})"></i></div>` : ''}
          <div class="grid3">
            <div class="mini"><div class="l">Hochrechnung Monatsende</div><div class="v">${proj === null ? '–' : fe(proj) + ' ' + CUR}</div><div class="s">${proj === null ? 'ab dem 2. Messtag' : (adv ? saldo(adv - proj) : (dpct === null ? '' : (dpct >= 0 ? '+' : '') + dpct + ' % zum Vormonat'))}</div></div>
            <div class="mini"><div class="l">Vormonat</div><div class="v">${pm.kwh > 0 ? fe(pm.cost) + ' ' + CUR : '–'}</div><div class="s">${pm.kwh > 0 ? fk(pm.kwh) + ' kWh' : 'keine Daten'}</div></div>
            <div class="mini"><div class="l">${MONTHS[m]} ${y - 1}</div><div class="v">${ly.kwh > 0 ? fe(ly.cost) + ' ' + CUR : '–'}</div><div class="s">${ly.kwh > 0 ? fk(ly.kwh) + ' kWh' : 'keine Daten'}</div></div>
          </div>${yr}</div>`;
      }

      // 5: Live-Leistung mit Tageskurve
      const todayK = key(now);
      const tiles = c.devices.map((d, i) => {
        const w = this._watt(d);
        const arr = Array.from({ length: 24 }, () => null);
        hrs.forEach((x) => { const dt = new Date(x.t); if (key(dt) === todayK) arr[dt.getHours()] = x.dev[i] * 1000; });
        const mx = Math.max(1, ...arr.map((v) => v || 0));
        const bars = arr.map((v, hh) => `<i class="${hh === now.getHours() ? 'now' : ''}" style="height:${v === null ? 0 : Math.max(3, v / mx * 100)}%"></i>`).join('');
        const todayKwh = arr.reduce((a, v) => a + (v || 0), 0) / 1000;
        const sub = c.items.map((x, j) => ({ x, j })).filter((o) => o.x.parent === i).map((o) => {
          const wi = this._watt(o.x);
          const tk = hrs.reduce((a, h2) => (key(new Date(h2.t)) === todayK ? a + (h2.idev ? h2.idev[o.j] || 0 : 0) : a), 0);
          return `<div class="s">↳ ${esc(o.x.name || o.x.energy)}: <span class="wv ${this._wcls(wi)}" data-wi="${o.j}">${wi === null ? '–' : nf(wi, 0)}</span> W · heute ${fk(tk)} kWh</div>`;
        }).join('');
        return `<div class="tile" style="--c:${rgb(d.color, '96,165,250')}"><div class="l">${esc(d.name || d.energy)}</div>
          <div class="wl"><span class="wv ${this._wcls(w)}" data-w="${i}">${w === null ? '–' : nf(w, 0)}</span><small>W</small></div>
          <div class="spark">${bars}</div><div class="s">heute ${fk(todayKwh)} kWh · Kurve je Stunde</div>${sub}</div>`;
      }).join('');
      top += `<div class="panel"><div class="ph"><span class="lbl">Jetzt und heute</span><span class="leg"><span style="--c:52,211,153"><i></i>ruhig</span><span style="--c:255,197,61"><i></i>erhöht</span><span style="--c:255,92,122"><i></i>hoch</span></span></div><div class="tiles">${tiles}</div></div>`;

      // 6: Herkunft heute und beste Zeit
      if (mix) {
        const t = this._calc(new Date(y, m, now.getDate()), new Date(y, m, now.getDate()), false);
        const tot = t.kwh;
        let donut = '<div class="empty" style="padding:10px">heute noch kein Verbrauch</div>';
        if (tot > 0) {
          let off = 0;
          const R = 38, C = 2 * Math.PI * R;
          const seg = t.src.map((v, i) => { const len = v / tot * C; const s = `<circle r="${R}" cx="50" cy="50" fill="none" stroke="rgb(${SRC[i][1]})" stroke-width="14" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 50 50)"/>`; off += len; return s; }).join('');
          donut = `<svg viewBox="0 0 100 100" class="donut"><circle r="${R}" cx="50" cy="50" fill="none" stroke="rgba(var(--ov),.07)" stroke-width="14"/>${seg}<text x="50" y="54" text-anchor="middle" fill="var(--txt)" font-size="14" font-weight="800">${fk(tot)}</text></svg>`;
        }
        const legend = t.src.map((v, i) => `<div><span style="--c:${SRC[i][1]}" class="dot"></span>${SRC[i][0]} <b>${tot > 0 ? nf(v / tot * 100, 0) : 0} %</b> <span class="mut">${fk(v)} kWh</span></div>`).join('');
        const mh = this._mixH || [];
        let best = null;
        for (let s = 0; s < 22; s++) {
          const w = [mh[s], mh[s + 1], mh[s + 2]];
          if (w.some((x) => !x || x.n < 5)) continue;
          const g = w.reduce((a, x) => a + x.g / x.n, 0) / 3;
          if (best === null || g < best.g) best = { s, g };
        }
        const tip = best ? `Am wenigsten Netzstrom brauchst du im Schnitt zwischen <b>${best.s} und ${best.s + 3} Uhr</b> (Ø ${nf(best.g * 100, 0)} % aus dem Netz). Große Lasten legst du am besten dorthin.` : 'Für eine Empfehlung fehlen noch Tage mit Daten.';
        top += `<div class="panel"><span class="lbl">Herkunft heute</span><div class="herk">${donut}<div class="hl">${legend}</div></div><div class="note">${tip}</div></div>`;
      }

      // 3: Grundlast nachts
      const lo = Date.now() - 14 * 864e5;
      const nightRows = hrs.filter((x) => x.t >= lo && new Date(x.t).getHours() < 5);
      let sbHtml;
      if (nightRows.length >= 6) {
        const per = c.devices.map((d, i) => nightRows.reduce((a, x) => a + x.dev[i] * 1000, 0) / nightRows.length);
        const totW = per.reduce((a, v) => a + v, 0);
        const kwhM = totW * 24 * 30 / 1000;
        const cls = totW > sb ? 'hi' : 'lo';
        sbHtml = `<div class="tiles">${c.devices.map((d, i) => `<div class="tile" style="--c:${rgb(d.color, '96,165,250')}"><div class="l">${esc(d.name || d.energy)}</div><div class="wl"><span class="wv ${per[i] > sb ? 'hi' : 'lo'}">${nf(per[i], 0)}</span><small>W nachts</small></div></div>`).join('')}
          <div class="tile"><div class="l">Gesamt, 0 bis 5 Uhr</div><div class="wl"><span class="wv ${cls}">${nf(totW, 0)}</span><small>W</small></div><div class="s">Schwelle ${nf(sb, 0)} W · ${totW > sb ? 'liegt darüber' : 'in Ordnung'}</div></div></div>
          <div class="note">Läuft das Tag und Nacht so weiter, sind das etwa <b>${fk(kwhM)} kWh${P.grid > 0 ? ' und ' + fe(kwhM * P.grid) + ' ' + CUR : ''} pro Monat</b> im Leerlauf (Mittel der letzten 14 Nächte).</div>`;
      } else sbHtml = '<div class="note">Noch zu wenig Nachtstunden mit Daten (mindestens eine Nacht nötig).</div>';
      top += `<div class="panel"><span class="lbl">Grundlast nachts (Standby)</span>${sbHtml}</div>`;

      // 4: Betriebszeiten
      const since = Math.max(Date.now() - 56 * 864e5, this._firstTs || Date.now());
      const d0 = new Date(since); d0.setHours(0, 0, 0, 0);
      const cnt = [0, 0, 0, 0, 0, 0, 0];
      for (let d = new Date(d0); d <= now; d.setDate(d.getDate() + 1)) cnt[d.getDay()]++;
      const heat = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
      const actDay = {};
      hrs.forEach((x) => {
        if (x.t < d0.getTime()) return;
        const dt = new Date(x.t), w = sumW(x);
        heat[dt.getDay()][dt.getHours()] += w;
        if (w > act) actDay[key(dt)] = (actDay[key(dt)] || 0) + 1;
      });
      if (hrs.length >= 3) {
        const order = [1, 2, 3, 4, 5, 6, 0];
        const hm = heat.map((r, wd) => r.map((v) => (cnt[wd] ? v / cnt[wd] : 0)));
        const hmax = Math.max(1, ...hm.flat());
        const wdAct = order.map((wd) => {
          let s = 0; Object.keys(actDay).forEach((k) => { if (new Date(k + 'T12:00:00').getDay() === wd) s += actDay[k]; });
          return cnt[wd] ? s / cnt[wd] : 0;
        });
        const topIdx = wdAct.indexOf(Math.max(...wdAct));
        const mon = new Date(y, m, now.getDate() - ((now.getDay() + 6) % 7));
        const sumAct = (from) => Object.keys(actDay).filter((k) => k >= key(from) && k <= todayK).reduce((a, k) => a + actDay[k], 0);
        const head = `<div class="hm hh"><span></span>${Array.from({ length: 24 }, (_, i) => `<span>${i % 3 ? '' : i}</span>`).join('')}</div>`;
        const rowsH = order.map((wd, ri) => `<div class="hm"><span class="dl">${DAYS[wd]}</span>${hm[wd].map((v, hh) => `<span class="cell" title="${DAYS[wd]} ${hh}:00 · Ø ${nf(v, 0)} W" style="background:rgba(245,158,11,${v <= 0 ? 0.04 : 0.1 + v / hmax * 0.9})"></span>`).join('')}<span class="ah">${nf(wdAct[ri], 1)} h</span></div>`).join('');
        top += `<div class="panel"><div class="ph"><span class="lbl">Betriebszeiten</span><span class="lbl">aktiv = über ${nf(act, 0)} W</span></div>
          <div class="grid3"><div class="mini"><div class="l">Aktive Stunden heute</div><div class="v">${nf(actDay[todayK] || 0, 0)} h</div></div>
            <div class="mini"><div class="l">Diese Woche</div><div class="v">${nf(sumAct(mon), 0)} h</div></div>
            <div class="mini"><div class="l">Aktivster Tag</div><div class="v">${wdAct[topIdx] > 0 ? DAYS[order[topIdx]] + ' · ' + nf(wdAct[topIdx], 1) + ' h' : '–'}</div></div></div>
          <div class="heat">${head}${rowsH}</div><div class="note">Mittlere Leistung je Wochentag und Stunde (letzte 8 Wochen). Hell bis kräftig orange: wenig bis viel. Die rechte Spalte nennt die aktiven Stunden pro Tag.</div></div>`;
      }

      // 8: Monatsarchiv (eingefrorene Werte, wird am 1. des Monats geschrieben)
      let bottom = '';
      if (c.archive) {
        const st = this._hass && this._hass.states[c.archive];
        const arr = st && Array.isArray(st.attributes.monate) ? st.attributes.monate.slice().sort((a, b) => (a.k < b.k ? 1 : -1)) : [];
        let rows = '';
        arr.forEach((r) => {
          const [yy, mm] = String(r.k).split('-');
          const saldo = typeof r.ab === 'number' && r.ab > 0 ? r.ab - r.cost : null;
          rows += `<tr><td>${esc(MONTHS[+mm - 1] || mm)} ${esc(yy)}</td><td>${fk(r.kwh)}</td><td>${fk(r.g)}</td><td>${fk(r.b)}</td><td>${fk(r.p)}</td><td>${fe(r.cost)}</td><td>${saldo === null ? '–' : (saldo >= 0 ? '+' : '−') + fe(Math.abs(saldo))}</td></tr>`
            + `<tr class="sub"><td colspan="7">${(r.dev || []).map((d) => `${esc(d.n)}: Zähler ${nf(d.a, 2)} → ${nf(d.e, 2)} kWh (${fk(d.kwh)} kWh)`).join(' · ')} · Bezug ${nf((r.pg || 0) * 100, 1)} ct, Einspeisung ${nf((r.pf || 0) * 100, 1)} ct</td></tr>`;
        });
        bottom = `<div class="panel"><span class="lbl">Monatsarchiv (Zählerstände und Beträge, festgehalten am Monatsersten)</span>${arr.length
          ? `<div class="tw"><table><thead><tr><th>Monat</th><th>kWh</th><th>Netz</th><th>Batt.</th><th>PV</th><th>${CUR}</th><th>Saldo</th></tr></thead><tbody>${rows}</tbody></table></div><div class="note">Saldo = Abschlag minus Kosten (positiv: Guthaben). Die Werte sind eingefroren und ändern sich nicht, wenn sich später Preise ändern.</div>`
          : '<div class="note">Noch keine Einträge. Der erste Monat wird am 1. des nächsten Monats um 07:00 festgehalten.</div>'}</div>`;
      }
      return { top, bottom };
    }
    _render() {
      const c = this._c;
      if (!c) return;
      const tab = this._tab, CUR = cur(), P = this._prices();
      const nd = c.devices.length;
      const mix = this._hasMix;
      let body = '';
      if (!this._days) body = '<div class="panel"><div class="empty">' + T('room.loading') + '</div></div>';
      else {
        const per = {};
        ['week', 'month', 'year', 'prev'].forEach((k) => { per[k] = this._period(k); });
        const kp = ['week', 'month', 'year', 'prev'].map((k) => {
          const p = per[k];
          const tot = p.kwh || 1;
          const mb = mix && p.kwh > 0 ? `<div class="mixbar">${p.src.map((v, i) => `<i style="--c:${SRC[i][1]};width:${v / tot * 100}%"></i>`).join('')}</div>` : '';
          const sline = mix && p.kwh > 0 ? `Netz ${fk(p.src[0])} · Batt. ${fk(p.src[1])} · PV ${fk(p.src[2])} kWh` : '';
          return `<div class="kpi${tab === k ? ' on' : ''}" data-t="${k}"><div class="l">${T('room.' + k)}</div><div class="k">${fk(p.kwh)}<small>kWh</small></div>`
            + `<div class="e">${P.grid > 0 || p.fee ? fe(p.cost) + ' ' + CUR : '—'}</div>${mb}<div class="s">${sline}${p.fee ? `<br>inkl. ${fe(p.fee)} ${CUR} Grundgebühr` : ''}</div></div>`;
        }).join('');
        const b = this._buckets(tab);
        const rows = b.map((x) => Object.assign({ x }, this._calc(x.from, x.to, x.fee)));
        const mx = Math.max(0.001, ...rows.map((r) => r.kwh));
        const bars = rows.map((r) => `<div class="col${r.x.cur ? ' cur' : ''}"><div class="st" style="height:${Math.max(0, r.kwh / mx * 100)}%">${r.src.map((v, i) => `<i style="--c:${SRC[i][1]};height:${r.kwh ? v / r.kwh * 100 : 0}%"></i>`).join('')}</div></div>`).join('');
        const xl = rows.map((r) => `<span class="${r.x.cur ? 'cur' : ''}">${esc(tab === 'month' && r.x.label % 5 && r.x.label !== String(b.length) ? '' : r.x.label)}</span>`).join('');
        const sum = rows.reduce((a, r) => { a.kwh += r.kwh; a.cost += r.cost; a.full += r.costFull; r.src.forEach((v, i) => { a.src[i] += v; }); return a; }, { kwh: 0, cost: 0, full: 0, src: [0, 0, 0] });
        const cell = (v) => `<td class="${v ? '' : 'z'}">${v ? fk(v) : '–'}</td>`;
        const trs = rows.map((r) => `<tr class="${r.x.cur ? 'cur' : ''}"><td>${esc(r.x.label)}</td><td>${r.kwh ? fk(r.kwh) : '–'}</td>${mix ? r.src.map(cell).join('') : ''}<td>${r.cost ? fe(r.cost) : '–'}</td></tr>`).join('');
        const th = `<tr><th>${tab === 'year' || tab === 'prev' ? 'Monat' : 'Tag'}</th><th>kWh</th>${mix ? '<th>Netz</th><th>Batterie</th><th>PV</th>' : ''}<th>${CUR}</th></tr>`;
        const sumRow = `<tr class="sum"><td>${T('room.sum')}</td><td>${fk(sum.kwh)}</td>${mix ? sum.src.map((v) => `<td>${fk(v)}</td>`).join('') : ''}<td>${fe(sum.cost)}</td></tr>`;
        // Je Gerät (im gewählten Zeitraum)
        const cur_ = per[tab];
        const devRows = c.devices.map((d, i) => {
          const dv = cur_.dev[i], t = dv[0] + dv[1] + dv[2];
          let out = `<tr><td>${esc(d.name || d.energy)}</td><td>${fk(t)}</td>${mix ? dv.map(cell).join('') : ''}<td>${fe(cur_.devCost[i])}</td></tr>`;
          const its = c.items.map((x, j) => ({ x, j })).filter((o) => o.x.parent === i);
          if (its.length) {
            const rest = dv.slice(), restCost = [cur_.devCost[i]];
            its.forEach((o) => {
              const iv = cur_.items[o.j];
              out += `<tr class="ch"><td>↳ ${esc(o.x.name || o.x.energy)}</td><td>${fk(iv[0] + iv[1] + iv[2])}</td>${mix ? iv.map(cell).join('') : ''}<td>${fe(cur_.itemCost[o.j])}</td></tr>`;
              iv.forEach((v, k) => { rest[k] -= v; });
              restCost[0] -= cur_.itemCost[o.j];
            });
            const rv = rest.map((v) => Math.max(0, v));
            out += `<tr class="ch"><td>↳ übrige Geräte</td><td>${fk(rv[0] + rv[1] + rv[2])}</td>${mix ? rv.map(cell).join('') : ''}<td>${fe(Math.max(0, restCost[0]))}</td></tr>`;
          }
          return out;
        }).join('');
        const title = { week: 'Diese Woche', month: MONTHS_LONG[new Date().getMonth()] + ' ' + new Date().getFullYear(), year: String(new Date().getFullYear()), prev: String(new Date().getFullYear() - 1) }[tab];
        const leg = mix ? SRC.map((s) => `<span style="--c:${s[1]}"><i></i>${s[0]}</span>`).join('') : '';
        const mode = c.valuation || 'opportunity';
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
        }
        const full = P.grid > 0 ? `<br>Zum Vergleich, <b>alles zum Netzpreis</b> (${nf(P.grid * 100, 2)} ct/kWh): <b>${fe(sum.full)} ${CUR}</b>.` : '';
        const ex = this._extra(P, CUR, mix);
        body = `<div class="kpis">${kp}</div>${ex.top}
          <div class="panel"><div class="ph"><span class="lbl">${esc(title)}</span><span class="leg">${leg}</span></div>
            <div class="bars">${bars}</div><div class="xl">${xl}</div></div>
          <div class="panel"><span class="lbl">Verlauf und Kosten</span><div class="tw"><table><thead>${th}</thead><tbody>${trs}${sumRow}</tbody></table></div></div>
          <div class="panel"><span class="lbl">Je Bereich</span><div class="tw"><table><thead><tr><th>Bereich</th><th>kWh</th>${mix ? '<th>Netz</th><th>Batterie</th><th>PV</th>' : ''}<th>${CUR}</th></tr></thead><tbody>${devRows}</tbody></table></div>
            <div class="note">${priceTxt}${full}<br>${explain}</div>
            <div class="foot"><span>${this._first ? `${T('room.since')} ${this._first.split('-').reverse().join('.')}` : ''}</span><span class="btn" data-csv="1">${T('room.csv')}</span></div></div>${ex.bottom}`;
      }
      const sub = c.subtitle !== undefined ? c.subtitle : 'Stromverbrauch und Kosten';
      this.shadowRoot.innerHTML = `<style>${CSS}</style><ha-card><div class="wrap">
        <header><div class="title">${c.image ? `<img src="${esc(c.image)}" alt="">` : ''}<div>${esc(c.title || T('room.title'))}<small>${esc(sub)}</small></div></div>
          <div class="tabs">${['week', 'month', 'year', 'prev'].map((k) => `<div class="tab${tab === k ? ' on' : ''}" data-t="${k}">${T('room.tab.' + k)}</div>`).join('')}</div></header>
        ${body}</div></ha-card>`;
      void nd;
      this.shadowRoot.querySelectorAll('[data-t]').forEach((el) => el.addEventListener('click', () => { this._tab = el.dataset.t; this._render(); }));
      const csv = this.shadowRoot.querySelector('[data-csv]');
      if (csv) csv.addEventListener('click', () => {
        const txt = this._csv();
        const done = () => { csv.textContent = T('room.copied'); setTimeout(() => { csv.textContent = T('room.csv'); }, 1500); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(() => window.prompt('CSV', txt));
        else window.prompt('CSV', txt);
      });
      this._narrow();
    }
  }

  if (!customElements.get('energy-cockpit-room-card')) {
    customElements.define('energy-cockpit-room-card', EnergyCockpitRoomCard);
    window.customCards = window.customCards || [];
    window.customCards.push({ type: 'energy-cockpit-room-card', name: 'Energy-Cockpit Raum-Abrechnung', description: 'Verbrauch und Kosten eines Raums je Woche, Monat, Jahr und Vorjahr, je Bereich und mit Herkunft Netz, Batterie und PV (z. B. Strommiete)', preview: false });
  }
})();
