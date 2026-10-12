/* energy-cockpit-room-card: Raum-Abrechnung. Verbrauch und Kosten eines Raums (z. B. vermietetes Büro) je Woche, Monat, Jahr und Vorjahr,
   getrennt nach Geräten, mit Tabelle und CSV-Export für die Strommiete. */
(() => {
  const { nf, esc, T, setLocale, cur } = WD;
  const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const COLORS = ['96,165,250', '52,211,153', '251,191,36', '244,114,182', '167,139,250', '34,211,238'];
  const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const fk = (v) => nf(v, v < 10 ? 2 : v < 100 ? 1 : 0);
  const fe = (v) => nf(v, 2);

  const CSS = `
:host{display:block;--txt:#e8eefc;--mut:139,151,179;--acc:245,158,11;--stroke:rgba(255,255,255,.08)}
ha-card{display:block;background:radial-gradient(120% 80% at 50% 0%,#121b30 0%,#070b14 65%);border-radius:28px;overflow:hidden;border:1px solid rgba(255,255,255,.06);color:var(--txt);font-family:Inter,var(--ha-font-family-body,system-ui),sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:22px;box-sizing:border-box}
header{display:flex;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.title{display:flex;align-items:center;font-size:1.1rem;font-weight:700;margin-right:auto}
.title img{height:34px;max-width:110px;object-fit:contain;border-radius:6px;margin-right:12px}
.title small{display:block;font-size:.74rem;color:rgb(var(--mut));font-weight:500;margin-top:2px}
.tabs{display:flex;background:rgba(255,255,255,.05);border:1px solid var(--stroke);border-radius:999px;padding:3px}
.tab{padding:7px 14px;border-radius:999px;font-size:.8rem;font-weight:650;color:rgb(var(--mut));cursor:pointer;-webkit-tap-highlight-color:transparent}
.tab.on{background:rgba(var(--acc),.2);color:rgb(var(--acc));box-shadow:0 0 0 1px rgba(var(--acc),.4)}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);grid-gap:12px;gap:12px}
.kpi{padding:14px 16px;border-radius:20px;background:linear-gradient(160deg,rgba(255,255,255,.065),rgba(255,255,255,.015)),#0c1322;border:1px solid var(--stroke);cursor:pointer}
.kpi.on{border-color:rgba(var(--acc),.55);box-shadow:0 0 0 1px rgba(var(--acc),.3)}
.kpi .l{font-size:.66rem;text-transform:uppercase;letter-spacing:.1em;font-weight:650;color:rgb(var(--mut))}
.kpi .k{font-size:1.7rem;font-weight:800;margin-top:6px;font-variant-numeric:tabular-nums}
.kpi .k small{font-size:.8rem;opacity:.7;margin-left:3px}
.kpi .e{font-size:1rem;font-weight:700;color:rgb(var(--acc));margin-top:2px;font-variant-numeric:tabular-nums}
.kpi .s{font-size:.7rem;color:rgb(var(--mut));margin-top:3px}
.panel{margin-top:16px;padding:16px 18px;border-radius:22px;background:linear-gradient(160deg,rgba(255,255,255,.05),rgba(255,255,255,.012)),#0c1322;border:1px solid var(--stroke)}
.ph{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap}
.lbl{font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;font-weight:650;color:rgb(var(--mut))}
.leg{display:flex;flex-wrap:wrap;font-size:.74rem;color:rgb(var(--mut))}
.leg span{display:flex;align-items:center;margin-left:12px}
.leg i{width:8px;height:8px;border-radius:50%;margin-right:5px;background:rgb(var(--c))}
.bars{display:flex;align-items:flex-end;height:130px;margin-top:14px;gap:4px}
.col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;min-width:0}
.col .st{display:flex;flex-direction:column-reverse;border-radius:6px 6px 0 0;overflow:hidden;min-height:2px}
.col .st i{display:block;background:rgb(var(--c))}
.col.cur .st{box-shadow:0 0 0 1px rgba(255,255,255,.55)}
.xl{display:flex;margin-top:6px;gap:4px}
.xl span{flex:1;text-align:center;font-size:.64rem;color:rgb(var(--mut));font-weight:600;min-width:0;overflow:hidden}
.xl span.cur{color:rgb(var(--acc))}
.tw{max-height:320px;overflow:auto;margin-top:14px}
table{width:100%;border-collapse:collapse;font-size:.84rem;font-variant-numeric:tabular-nums}
th{font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:rgb(var(--mut));text-align:right;padding:6px 8px;position:sticky;top:0;background:#0c1322}
td{padding:7px 8px;text-align:right;border-top:1px solid rgba(255,255,255,.05)}
th:first-child,td:first-child{text-align:left}
tr.cur td{color:rgb(var(--acc));font-weight:700}
tr.sum td{border-top:2px solid rgba(255,255,255,.2);font-weight:800}
td.z{opacity:.35}
.foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:12px;font-size:.72rem;color:rgb(var(--mut))}
.btn{cursor:pointer;padding:7px 14px;border-radius:999px;font-size:.78rem;font-weight:650;color:var(--txt);background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);-webkit-tap-highlight-color:transparent}
.empty{padding:26px;text-align:center;color:rgb(var(--mut))}
.narrow .kpis{grid-template-columns:1fr 1fr}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`;

  WD.addStrings({
    'room.title': 'Raum-Abrechnung', 'room.week': 'Diese Woche', 'room.month': 'Dieser Monat', 'room.year': 'Dieses Jahr', 'room.prev': 'Vorjahr',
    'room.tab.week': 'Woche', 'room.tab.month': 'Monat', 'room.tab.year': 'Jahr', 'room.tab.prev': 'Vorjahr',
    'room.sum': 'Summe', 'room.total': 'Gesamt', 'room.cost': 'Kosten', 'room.loading': 'Daten werden geladen …',
    'room.noprice': 'Kein Preis eingestellt: Es werden nur kWh angezeigt.', 'room.csv': 'Als CSV kopieren', 'room.copied': 'Kopiert',
    'room.since': 'Daten seit', 'room.empty': 'Noch keine Verbrauchsdaten. Die Statistik füllt sich ab dem Einbau der Zähler.',
    'room.unconf': 'Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Zähler auszuwählen.',
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
      return { title: 'Raum', devices: ids.filter((i) => /^sensor\..*(energy|energie)/i.test(i)).slice(0, 2).map((i) => ({ energy: i, name: i })) };
    }
    static getConfigElement() { return document.createElement('energy-cockpit-room-card-editor'); }
    setConfig(c) {
      const arr = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]) : []));
      const devs = arr(c && c.devices).filter((d) => d && d.energy);
      if (!devs.length) {
        this._c = null;
        this.shadowRoot.innerHTML = '<style>ha-card{padding:22px;border-radius:24px;background:#0c1322;color:#e8eefc;font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit Raum-Abrechnung</b><div style="margin-top:8px;opacity:.8">' + T('room.unconf') + '</div></ha-card>';
        return;
      }
      this._c = Object.assign({}, c, { devices: devs });
      this._days = null;
      this._loadedAt = 0;
      this._render();
      if (this._hass) this._load();
    }
    set hass(h) {
      setLocale(h);
      this._hass = h;
      if (!this._c) return;
      if (!this._loading && Date.now() - this._loadedAt > 15 * 60 * 1000) this._load();
    }
    getCardSize() { return 8; }
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
    _price() {
      const c = this._c, h = this._hass;
      if (typeof c.price === 'number') return c.price;
      if (!c.price && typeof c.price_ct === 'number') return c.price_ct / 100;
      const s = typeof c.price === 'string' && h && h.states[c.price];
      const v = s ? parseFloat(s.state) : NaN;
      return isNaN(v) ? 0 : v;
    }
    async _load() {
      const h = this._hass, c = this._c;
      if (!h || !h.callWS || !c) return;
      this._loading = true;
      try {
        const ids = c.devices.map((d) => d.energy);
        const y = new Date().getFullYear();
        const r = await h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(y - 1, 0, 1).toISOString(), period: 'day', statistic_ids: ids, types: ['change'] });
        const days = {};
        let first = null;
        ids.forEach((id, di) => {
          (r[id] || []).forEach((x) => {
            const t = typeof x.start === 'number' ? x.start : Date.parse(x.start);
            const k = key(new Date(t));
            const v = x.change > 0 ? x.change : 0;
            (days[k] = days[k] || ids.map(() => 0))[di] += v;
            if (v >= 0 && (!first || k < first)) first = k;
          });
        });
        this._days = days;
        this._first = first;
        this._loadedAt = Date.now();
      } catch (e) {
        console.warn('energy-cockpit-room-card: load failed', e);
        this._loadedAt = Date.now() - 12 * 60 * 1000;
        this._days = this._days || {};
      }
      this._loading = false;
      this._render();
    }
    // Summe je Gerät über einen Zeitraum [from, to] (inklusive, lokale Tage)
    _sum(from, to) {
      const n = this._c.devices.length, out = new Array(n).fill(0);
      const f = key(from), t = key(to);
      Object.keys(this._days).forEach((k) => { if (k >= f && k <= t) this._days[k].forEach((v, i) => { out[i] += v; }); });
      return out;
    }
    _buckets(tab) {
      const now = new Date(), y = now.getFullYear(), m = now.getMonth();
      const out = [];
      if (tab === 'week') {
        const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
        for (let i = 0; i < 7; i++) {
          const d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
          out.push({ label: DAYS[d.getDay()] + ' ' + d.getDate() + '.', from: d, to: d, cur: key(d) === key(now), fee: 0 });
        }
      } else if (tab === 'month') {
        const dim = new Date(y, m + 1, 0).getDate();
        for (let i = 1; i <= dim; i++) {
          const d = new Date(y, m, i);
          out.push({ label: String(i), from: d, to: d, cur: i === now.getDate(), fee: 0 });
        }
      } else {
        const yy = tab === 'year' ? y : y - 1;
        for (let i = 0; i < 12; i++) {
          out.push({ label: MONTHS[i], from: new Date(yy, i, 1), to: new Date(yy, i + 1, 0), cur: tab === 'year' && i === m, fee: 1 });
        }
      }
      return out;
    }
    // Grundgebühr je Monat nur für Monate ab dem ersten Messwert
    _fee(from, to) {
      const base = parseFloat(this._c.base_fee) || 0;
      if (!base || !this._first) return 0;
      let n = 0;
      const d = new Date(from.getFullYear(), from.getMonth(), 1);
      const fm = this._first.slice(0, 7);
      const now = new Date();
      while (d <= to) {
        const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        if (k >= fm && d <= now) n++;
        d.setMonth(d.getMonth() + 1);
      }
      return base * n;
    }
    _period(tab) {
      const now = new Date(), y = now.getFullYear();
      let from, to;
      if (tab === 'week') { from = new Date(y, now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)); to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6); }
      else if (tab === 'month') { from = new Date(y, now.getMonth(), 1); to = new Date(y, now.getMonth() + 1, 0); }
      else if (tab === 'year') { from = new Date(y, 0, 1); to = new Date(y, 11, 31); }
      else { from = new Date(y - 1, 0, 1); to = new Date(y - 1, 11, 31); }
      const per = this._sum(from, to);
      const kwh = per.reduce((a, v) => a + v, 0);
      const fee = tab === 'week' ? 0 : this._fee(from, to);
      return { per, kwh, cost: kwh * this._price() + fee, fee };
    }
    _csv() {
      const c = this._c, tab = this._tab, b = this._buckets(tab), n = c.devices.length;
      const price = this._price();
      const head = ['Zeitraum'].concat(c.devices.map((d) => (d.name || d.energy) + ' kWh'), ['Summe kWh', 'Kosten ' + cur()]);
      const rows = b.map((x) => {
        const s = this._sum(x.from, x.to), t = s.reduce((a, v) => a + v, 0);
        const cost = t * price + (x.fee ? this._fee(x.from, x.to) : 0);
        return [x.label].concat(s.map((v) => v.toFixed(3).replace('.', ',')), [t.toFixed(3).replace('.', ','), cost.toFixed(2).replace('.', ',')]);
      });
      void n;
      return [head].concat(rows).map((r) => r.join(';')).join('\n');
    }
    _render() {
      const c = this._c;
      if (!c) return;
      const tab = this._tab, price = this._price(), CUR = cur();
      const nf0 = c.devices.length;
      const color = (i) => (c.devices[i].color || COLORS[i % COLORS.length]);
      let body = '';
      if (!this._days) body = '<div class="panel"><div class="empty">' + T('room.loading') + '</div></div>';
      else {
        const per = { week: this._period('week'), month: this._period('month'), year: this._period('year'), prev: this._period('prev') };
        const kp = ['week', 'month', 'year', 'prev'].map((k) => {
          const p = per[k];
          return `<div class="kpi${tab === k ? ' on' : ''}" data-t="${k}"><div class="l">${T('room.' + k)}</div><div class="k">${fk(p.kwh)}<small>kWh</small></div>`
            + `<div class="e">${price > 0 || p.fee ? fe(p.cost) + ' ' + CUR : '—'}</div>`
            + `<div class="s">${p.fee ? 'inkl. ' + fe(p.fee) + ' ' + CUR + ' Grundgebühr' : (price > 0 ? nf(price * 100, 1) + ' ct/kWh' : '')}</div></div>`;
        }).join('');
        const b = this._buckets(tab);
        const rows = b.map((x) => {
          const s = this._sum(x.from, x.to), t = s.reduce((a, v) => a + v, 0);
          const fee = x.fee ? this._fee(x.from, x.to) : 0;
          return { x, s, t, cost: t * price + fee };
        });
        const mx = Math.max(0.001, ...rows.map((r) => r.t));
        const bars = rows.map((r) => `<div class="col${r.x.cur ? ' cur' : ''}"><div class="st" style="height:${Math.max(0, r.t / mx * 100)}%">${r.s.map((v, i) => `<i style="--c:${color(i)};height:${r.t ? v / r.t * 100 : 0}%"></i>`).join('')}</div></div>`).join('');
        const xl = rows.map((r) => `<span class="${r.x.cur ? 'cur' : ''}">${esc(tab === 'month' && r.x.label % 5 && r.x.label !== String(b.length) ? '' : r.x.label)}</span>`).join('');
        const sumS = new Array(nf0).fill(0);
        rows.forEach((r) => r.s.forEach((v, i) => { sumS[i] += v; }));
        const sumT = sumS.reduce((a, v) => a + v, 0);
        const sumC = rows.reduce((a, r) => a + r.cost, 0);
        const cell = (v) => `<td class="${v ? '' : 'z'}">${v ? fk(v) : '–'}</td>`;
        const trs = rows.map((r) => `<tr class="${r.x.cur ? 'cur' : ''}"><td>${esc(r.x.label)}</td>${r.s.map(cell).join('')}<td>${r.t ? fk(r.t) : '–'}</td><td>${r.cost ? fe(r.cost) : '–'}</td></tr>`).join('');
        const th = `<tr><th>${tab === 'week' ? 'Tag' : tab === 'month' ? 'Tag' : 'Monat'}</th>${c.devices.map((d) => `<th>${esc(d.name || d.energy)}</th>`).join('')}<th>kWh</th><th>${CUR}</th></tr>`;
        const leg = c.devices.map((d, i) => `<span style="--c:${color(i)}"><i></i>${esc(d.name || d.energy)}</span>`).join('');
        const title = { week: 'Diese Woche', month: MONTHS_LONG[new Date().getMonth()] + ' ' + new Date().getFullYear(), year: String(new Date().getFullYear()), prev: String(new Date().getFullYear() - 1) }[tab];
        body = `<div class="kpis">${kp}</div>
          <div class="panel"><div class="ph"><span class="lbl">${esc(title)}</span><span class="leg">${leg}</span></div>
            <div class="bars">${bars}</div><div class="xl">${xl}</div></div>
          <div class="panel"><div class="tw"><table><thead>${th}</thead><tbody>${trs}<tr class="sum"><td>${T('room.sum')}</td>${sumS.map((v) => `<td>${fk(v)}</td>`).join('')}<td>${fk(sumT)}</td><td>${fe(sumC)}</td></tr></tbody></table></div>
            <div class="foot"><span>${price > 0 ? `Preis ${nf(price * 100, 2)} ct/kWh${c.base_fee ? ` + ${fe(parseFloat(c.base_fee))} ${CUR} Grundgebühr je Monat` : ''}` : T('room.noprice')}${this._first ? ` · ${T('room.since')} ${this._first.split('-').reverse().join('.')}` : ''}</span>
            <span class="btn" data-csv="1">${T('room.csv')}</span></div></div>`;
      }
      const sub = c.subtitle !== undefined ? c.subtitle : 'Stromverbrauch und Kosten';
      this.shadowRoot.innerHTML = `<style>${CSS}</style><ha-card><div class="wrap">
        <header><div class="title">${c.image ? `<img src="${esc(c.image)}" alt="">` : ''}<div>${esc(c.title || T('room.title'))}<small>${esc(sub)}</small></div></div>
          <div class="tabs">${['week', 'month', 'year', 'prev'].map((k) => `<div class="tab${tab === k ? ' on' : ''}" data-t="${k}">${T('room.tab.' + k)}</div>`).join('')}</div></header>
        ${body}</div></ha-card>`;
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
    window.customCards.push({ type: 'energy-cockpit-room-card', name: 'Energy-Cockpit Raum-Abrechnung', description: 'Verbrauch und Kosten eines Raums je Woche, Monat, Jahr und Vorjahr (z. B. Strommiete)', preview: false });
  }
})();
