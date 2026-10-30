/* energy-cockpit-stats-card (abgeleitet aus energy-stats-card v1.0.1) – Statistik: Geld, Amortisation, Grundlast, Monatsvergleich, Akku */
(() => {
  const { nf, haNavigate, T, setLocale, cur, esc } = WD;
  const fEur = (v) => (v === null || v === undefined || !isFinite(v) ? '—' : nf(v, Math.abs(v) < 100 ? 2 : 0));
  const fKwh = (v) => (v === null || v === undefined || !isFinite(v) ? '—' : nf(v, Math.abs(v) >= 100 ? 0 : 1));
  const fPct = (v) => (v === null || !isFinite(v) ? '—' : Math.round(Math.max(0, Math.min(1, v)) * 100) + ' %');
  const MON = [], MONL = [];
  const fillMon = () => {
    for (let i = 0; i < 12; i++) {
      const d = new Date(2000, i, 1);
      MON[i] = d.toLocaleDateString(WD.state.loc, { month: 'short' }).replace('.', '');
      MONL[i] = d.toLocaleDateString(WD.state.loc, { month: 'long' });
    }
  };
  fillMon();
  const key = (y, m) => `${y}-${String(m + 1).padStart(2, '0')}`;
  const live = (h, id) => {
    const s = h && id && h.states[id];
    if (!s || ['unavailable', 'unknown', ''].includes(s.state)) return null;
    const v = parseFloat(s.state);
    return isNaN(v) ? null : v;
  };
  const val = (h, v, def) => { if (typeof v === 'number') return v; const x = typeof v === 'string' ? live(h, v) : null; return x === null ? def : x; };

  const CSS = `
${WD.themeCss()}:host{display:block;--pv:255,197,61;--imp:255,92,122;--exp:52,211,153;--bat:96,165,250;--home:34,211,238;--sav:52,211,153}
ha-card{background:radial-gradient(120% 80% at 50% 0%,var(--bg1) 0%,var(--bg0) 65%);border-radius:28px;overflow:hidden;border:1px solid rgba(var(--ov),.06);color:var(--txt);font-family:Inter,var(--ha-font-family-body,system-ui),sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:22px;position:relative;transform-origin:0 0;box-sizing:border-box}
.wrap:before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;background:radial-gradient(40% 30% at 15% 15%,rgba(var(--pv),.09),transparent 70%),radial-gradient(40% 35% at 85% 60%,rgba(var(--home),.08),transparent 70%)}
header{display:flex;align-items:center;flex-wrap:wrap;position:relative;margin-bottom:18px}
.title{font-size:1.05rem;font-weight:650;margin-right:auto;display:flex;align-items:center}
.title .ico{margin-right:10px}
.ico{width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:rgba(var(--c,var(--home)),.16);color:rgb(var(--c,var(--home)));flex:none}
.ico ha-icon{--mdc-icon-size:19px;display:flex}
.tabs{display:flex;background:rgba(var(--ov),.05);border:1px solid var(--stroke);border-radius:999px;padding:3px;margin-left:8px}
.tab{padding:7px 14px;border-radius:999px;font-size:.8rem;font-weight:650;color:rgb(var(--mut));cursor:pointer;transition:all .35s;-webkit-tap-highlight-color:transparent}
.tab.on{background:rgba(var(--home),.18);color:rgb(var(--home));box-shadow:0 0 0 1px rgba(var(--home),.35)}
.navbtn{cursor:pointer;color:var(--txt);font-weight:650;background:rgba(var(--ov),.07);border:1px solid rgba(var(--ov),.14);padding:8px 14px;border-radius:999px;font-size:.8rem;margin-left:8px;-webkit-tap-highlight-color:transparent}
.navbtn:active{background:rgba(var(--ov),.18)}
.panel{position:relative;padding:16px 18px;border-radius:22px;background:linear-gradient(160deg,rgba(var(--ov),.065),rgba(var(--ov),.015)),var(--panel);border:1px solid var(--stroke)}
.lbl{font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;font-weight:650;color:rgb(var(--mut));display:flex;align-items:center}
.lbl i{width:7px;height:7px;border-radius:50%;background:rgb(var(--c));box-shadow:0 0 0 1px rgba(var(--c),.35);margin-right:7px}
.money{display:grid;grid-template-columns:repeat(4,1fr);grid-gap:14px;gap:14px}
.m .v{display:flex;align-items:baseline;margin-top:10px}
.m .num{font-size:2rem;font-weight:800;letter-spacing:-.025em;line-height:1;font-variant-numeric:tabular-nums;color:rgb(var(--c));text-shadow:none}
.m .unit{font-size:.95rem;font-weight:700;color:rgb(var(--c));opacity:.8;margin-left:5px}
.m .sub{font-size:.74rem;color:rgb(var(--mut));margin-top:7px}
.m .sub b{color:var(--txt);font-weight:600}
.m.aut .num{color:rgb(var(--home))}
.ring2{display:flex;margin-top:8px}
.ring2 div{flex:1}
.duo{display:grid;grid-template-columns:1.25fr 1fr;grid-gap:14px;gap:14px;margin-top:14px}
.amo .big{display:flex;align-items:baseline;margin-top:10px}
.amo .big .num{font-size:2.3rem;font-weight:800;color:rgb(var(--sav));text-shadow:none;font-variant-numeric:tabular-nums}
.amo .big .unit{font-size:1rem;color:rgb(var(--sav));font-weight:700;margin-left:6px}
.pbar{position:relative;height:16px;border-radius:999px;background:rgba(var(--ov),.06);overflow:hidden;margin-top:12px}
.pfill{position:absolute;top:0;left:0;bottom:0;width:0;border-radius:inherit;background:linear-gradient(90deg,rgba(var(--sav),.5),rgb(var(--sav)));box-shadow:0 0 0 1px rgba(var(--sav),.35);transition:width 1.6s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.pfill:after{content:'';position:absolute;top:0;bottom:0;left:0;right:0;background:repeating-linear-gradient(-45deg,rgba(var(--ov),.14) 0 10px,transparent 10px 20px);animation:stripes 1.2s linear infinite}
@keyframes stripes{from{background-position:0 0}to{background-position:28px 0}}
.amo .meta{display:flex;justify-content:space-between;flex-wrap:wrap;font-size:.76rem;color:rgb(var(--mut));margin-top:9px}
.amo .meta b{color:var(--txt);font-weight:600}
.gl .big{display:flex;align-items:baseline;margin-top:10px}
.gl .big .num{font-size:2.3rem;font-weight:800;color:rgb(var(--pv));font-variant-numeric:tabular-nums}
.gl .big .unit{font-size:1rem;color:rgb(var(--pv));font-weight:700;margin-left:6px;margin-right:12px}
.gl .big small{font-size:.85rem;color:rgb(var(--mut))}
.gl .big small b{color:var(--txt)}
.nights{display:flex;align-items:flex-end;height:46px;margin-top:12px}
.nights div{flex:1;margin:0 3px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,rgba(var(--pv),.9),rgba(var(--pv),.25));height:0;transition:height 1.2s cubic-bezier(.2,.8,.2,1)}
.nl{display:flex;margin-top:4px}.nl span{flex:1;text-align:center;font-size:.6rem;color:rgb(var(--mut))}
.gl .tip{font-size:.72rem;color:rgb(var(--mut));margin-top:8px}
.chart{margin-top:14px}
.chart-head{display:flex;align-items:center;flex-wrap:wrap;margin-bottom:10px}
.chart-head .lbl{margin-right:auto}
.leg{display:flex;align-items:center;font-size:.72rem;color:rgb(var(--mut));margin-left:14px}
.leg i{width:10px;height:10px;border-radius:3px;margin-right:6px;background:rgb(var(--pv))}
.leg i.prev{background:transparent;border:1.5px dashed rgba(var(--ov),.35)}
.bars{display:flex;align-items:flex-end;height:130px;border-bottom:1px solid var(--stroke)}
.col{flex:1;display:flex;align-items:flex-end;justify-content:center;height:100%;cursor:pointer;position:relative}
.b{width:36%;max-width:24px;border-radius:7px 7px 3px 3px;height:0;transition:height 1.2s cubic-bezier(.2,.8,.2,1)}
.b.cur{background:linear-gradient(180deg,rgb(var(--pv)),rgba(var(--pv),.3));box-shadow:0 0 0 1px rgba(var(--pv),.35)}
.b.prev{border:1.5px dashed rgba(var(--ov),.3);border-bottom:none;margin-right:3px;background:rgba(var(--ov),.03)}
.col.now .b.cur{animation:glowbar 2.4s ease-in-out infinite}
@keyframes glowbar{50%{box-shadow:0 0 0 1px rgba(var(--pv),.35)}}
.col.sel .b.cur{outline:2px solid rgba(var(--ov),.6);outline-offset:2px}
.mlabels{display:flex;margin-top:6px}
.mlabels span{flex:1;text-align:center;font-size:.64rem;color:rgb(var(--mut));font-weight:600}
.mlabels span.now{color:rgb(var(--pv))}
.detail{margin-top:10px;font-size:.78rem;color:rgb(var(--mut));text-align:center;min-height:18px}
.detail b{color:var(--txt);font-weight:600}
footer{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));grid-gap:10px;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--stroke)}
.stat{padding:10px 13px;border-radius:15px;background:rgba(var(--ov),.028);border:1px solid rgba(var(--ov),.04)}
.stat b{display:block;margin-top:5px;font-size:1.1rem;font-weight:700;font-variant-numeric:tabular-nums}
.stat small{color:rgb(var(--mut));font-weight:500;font-size:.72rem;margin-left:3px}
.note{margin-top:10px;font-size:.64rem;color:rgba(139,151,179,.7);text-align:center}
.wide{padding:24px 30px}
.wide .title{font-size:1.25rem}
.wide .m .num{font-size:2.4rem}
.wide .bars{height:140px}
.narrow{padding:16px}
.narrow .money{grid-template-columns:1fr 1fr}
.narrow .duo{grid-template-columns:1fr}
@media (prefers-reduced-motion:reduce){.pfill:after,.col.now .b.cur{animation:none}}
`;

  class EnergyCockpitStatsCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._period = 'month';
      this._sel = null;
      this._tw = {};
    }
    static getStubConfig(hass) {
      const ids = hass && hass.states ? Object.keys(hass.states) : [];
      const find = (re) => ids.find((i) => re.test(i)) || '';
      // Bewusst leer: Die Karte startet im Einrichtungsassistenten
      void find; void ids;
      return {};
    }
    static getConfigElement() { return document.createElement('energy-cockpit-stats-card-editor'); }
    setConfig(c) {
      WD.applyTheme(this, c, this._hass);
      if (!c.pv_total || !c.grid_import_total || !c.grid_export_total) {
        this._c = null;
        this.shadowRoot.innerHTML = '<style>' + WD.themeCss() + 'ha-card{padding:22px;border-radius:24px;background:var(--panel);color:var(--txt);font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit Statistik</b><div style="margin-top:8px;opacity:.8">Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Sensoren auszuwählen.</div></ha-card>';
        return;
      }
      this._c = Object.assign({ battery_capacity_kwh: 0 }, c);
      this._build();
      this._loaded = 0;
      if (this._hass) this._load();
    }
    set hass(h) {
      WD.applyTheme(this, null, h);
      if (!this._c) { this._hass = h; return; }
      const first = !this._hass;
      setLocale(h);
      // Sprache erst jetzt bekannt: Monatsnamen und statische Texte neu aufbauen
      if (this._c && this._bl !== WD.state.lang) { this._bl = WD.state.lang; fillMon(); this._build(); }
      this._hass = h;
      if (!this._loading && Date.now() - (this._loaded || 0) > 30 * 60 * 1000) { this._load(); return; }
      if (first || Date.now() - (this._lastR || 0) > 30000) { this._lastR = Date.now(); this._render(); }
    }
    getCardSize() { return 10; }
    getGridOptions() { return { columns: 'full', min_columns: 6 }; }
    connectedCallback() {
      // Nur auf Breitenänderungen reagieren: Die Höhe setzt die Karte selbst (sonst passt sie sich an den Inhalt jedes Zeitraums an)
      if (!this._ro && window.ResizeObserver) this._ro = new ResizeObserver((en) => {
        const w = en[0] && en[0].contentRect.width;
        if (w !== this._roW) { this._roW = w; this._sched(); }
      });
      if (this._ro) this._ro.observe(this);
      if (!this._onResize) this._onResize = () => this._sched();
      window.addEventListener('resize', this._onResize);
      this._sched();
    }
    disconnectedCallback() { if (this._ro) this._ro.disconnect(); window.removeEventListener('resize', this._onResize); }
    _$(s) { return this.shadowRoot.querySelector(s); }
    _sched() {
      if (this._lr) return;
      this._lr = requestAnimationFrame(() => { this._lr = null; this._mode(); });
    }
    _mode() {
      const w = this.getBoundingClientRect().width, wrap = this._$('.wrap');
      if (!w || !wrap) return;
      wrap.classList.toggle('wide', w >= 900);
      wrap.classList.toggle('narrow', w < 600);
      this._fit();
    }
    _fit() {
      const wrap = this._$('.wrap'), card = this._$('ha-card');
      if (!wrap || !card) return 1;
      wrap.style.transform = ''; wrap.style.width = ''; card.style.height = '';
      this._fs = null;
      if (this._c.fit_screen === false) return 1;
      // Handy: in voller Größe scrollen, auf eine Bildschirmhöhe verkleinert wäre die Statistik kaum lesbar
      if (wrap.classList.contains('narrow')) return 1;
      const top = Math.max(0, this.getBoundingClientRect().top);
      const avail = window.innerHeight - top - (this._c.fit_margin === undefined ? 8 : this._c.fit_margin);
      const cw = card.clientWidth;
      let s = 1;
      if (avail > 200 && cw && wrap.offsetHeight > avail) {
        s = Math.max(0.55, avail / wrap.offsetHeight);
        wrap.style.width = (cw / s) + 'px';
        s = Math.max(0.55, Math.min(1, avail / wrap.offsetHeight));
        wrap.style.width = (cw / s) + 'px';
        wrap.style.transform = 'scale(' + s + ')';
      }
      this._fs = { s };
      this._fitH();
      return s;
    }
    // Nach einem Wechsel des Zeitraums: Maßstab bleibt, nur die Kartenhöhe folgt dem Inhalt
    _fitH() {
      const wrap = this._$('.wrap'), card = this._$('ha-card'), f = this._fs;
      if (!wrap || !card || !f || f.s === 1) return;
      const hh = Math.ceil(wrap.offsetHeight * f.s) + 'px';
      if (card.style.height !== hh) card.style.height = hh;
    }

    _build() {
      const c = this._c, now = new Date();
      this._bl = WD.state.lang;
      fillMon();
      const m = (k, lbl, col, extra = '') => `<div class="panel m ${k}" style="--c:${col}"><span class="lbl"><i></i>${lbl}</span><div class="v"><span class="num" data-t="${k}">—</span><span class="unit">${k === 'aut' ? '%' : cur()}</span></div><div class="sub" data-f="${k}Sub"></div>${extra}</div>`;
      this.shadowRoot.innerHTML = `<style>${CSS}</style>
      <ha-card><div class="wrap">
        <header>
          <div class="title"><span class="ico"><ha-icon icon="mdi:chart-box-outline"></ha-icon></span>${esc(c.title || T('st.title'))}</div>
          <div class="tabs">
            <div class="tab" data-p="day">${T('st.today')}</div><div class="tab" data-p="month">${MON[now.getMonth()]}</div><div class="tab" data-p="year">${now.getFullYear()}</div>
          </div>
          ${c.nav_path ? `<div class="navbtn" data-nav="${esc(c.nav_path)}">${esc(c.nav_label || T('st.next'))}</div>` : ''}
        </header>
        <div class="money">
          ${m('pvsav', T('st.pvsav'), 'var(--pv)')}
          ${m('feed', T('st.feed'), 'var(--exp)')}
          ${m('cost', T('st.cost'), 'var(--imp)')}
          ${m('aut', T('st.aut'), 'var(--home)')}
        </div>
        <div class="duo">
          <div class="panel amo"><span class="lbl" style="--c:var(--sav)"><i></i>${T('st.amo')}</span>
            <div class="big"><span class="num" data-t="amo">—</span><span class="unit">%</span></div>
            <div class="pbar"><div class="pfill"></div></div>
            <div class="meta"><span data-f="amoEarned">—</span><span data-f="amoEta">—</span></div>
          </div>
          <div class="panel gl"><span class="lbl" style="--c:var(--pv)"><i></i>${T('st.base')}</span>
            <div class="big"><span class="num" data-t="gl">—</span><span class="unit">W</span><small data-f="glCost"></small></div>
            <div class="nights"></div><div class="nl"></div>
            <div class="tip" data-f="glTip"></div>
          </div>
        </div>
        <div class="panel chart">
          <div class="chart-head"><span class="lbl" style="--c:var(--pv)"><i></i>${T('st.monthly')}</span>
            <span class="leg"><i></i>${now.getFullYear()}</span><span class="leg"><i class="prev"></i>${now.getFullYear() - 1}</span></div>
          <div class="bars">${MON.map((x, i) => `<div class="col${i === now.getMonth() ? ' now' : ''}" data-m="${i}"><div class="b prev"></div><div class="b cur"></div></div>`).join('')}</div>
          <div class="mlabels">${MON.map((x, i) => `<span class="${i === now.getMonth() ? 'now' : ''}">${x}</span>`).join('')}</div>
          <div class="detail"></div>
        </div>
        <footer>
          <div class="stat"><span class="lbl" style="--c:var(--pv)"><i></i>${T('st.record')} ${now.getFullYear()}</span><b data-f="rec">—</b></div>
          <div class="stat"><span class="lbl" style="--c:var(--bat)"><i></i>${T('st.eff')}</span><b data-f="eff">—</b></div>
          <div class="stat"><span class="lbl" style="--c:var(--bat)"><i></i>${T('st.cycles')}</span><b data-f="cyc">—</b></div>
          <div class="stat"><span class="lbl" style="--c:var(--bat)"><i></i>${T('st.temp')}</span><b data-f="temp">—</b></div>
          <div class="stat"><span class="lbl" style="--c:var(--pv)"><i></i>${T('st.pvall')}</span><b data-f="pvAll">—</b></div>
        </footer>
        <div class="note" data-f="note"></div>
      </div></ha-card>`;
      this.shadowRoot.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => { this._period = t.dataset.p; this._render(); }));
      this.shadowRoot.querySelectorAll('.col').forEach((col) => col.addEventListener('click', () => { this._sel = +col.dataset.m; this._detail(); }));
      const nb = this._$('[data-nav]');
      if (nb) nb.addEventListener('click', () => haNavigate(nb.dataset.nav));
      this._mode();
    }

    async _load() {
      const h = this._hass, c = this._c;
      if (!h || !h.callWS) return;
      this._loading = true;
      try {
        const now = new Date();
        const ids = [c.pv_total, c.grid_import_total, c.grid_export_total, c.battery_charge_total, c.battery_discharge_total].filter(Boolean);
        const [mon, day, hr] = await Promise.all([
          h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(now.getFullYear() - 1, 0, 1).toISOString(), period: 'month', statistic_ids: ids, types: ['change'], ...WD.statUnits(c) }),
          h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(now.getFullYear(), 0, 1).toISOString(), period: 'day', statistic_ids: [c.pv_today || c.pv_total], types: ['change'], ...WD.statUnits(c) }),
          c.home_power ? h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(Date.now() - 8 * 864e5).toISOString(), period: 'hour', statistic_ids: [c.home_power], types: ['mean'], ...WD.statUnits(c) }) : Promise.resolve({}),
        ]);
        const byMonth = (id) => {
          const out = {};
          (mon[id] || []).forEach((r) => { const d = new Date(typeof r.start === 'number' ? r.start : Date.parse(r.start)); if (r.change !== null && r.change !== undefined) out[key(d.getFullYear(), d.getMonth())] = Math.max(0, r.change); });
          return out;
        };
        this._m = { pv: byMonth(c.pv_total), imp: byMonth(c.grid_import_total), exp: byMonth(c.grid_export_total), chg: c.battery_charge_total ? byMonth(c.battery_charge_total) : {}, dis: c.battery_discharge_total ? byMonth(c.battery_discharge_total) : {} };
        // Rekordtag
        let rec = null;
        // bevorzugt Tagesertrag (setzt täglich zurück); beim Gesamtzähler nur Tage direkt nach einem Vortag werten,
        // sonst sammelt sich nach Datenlücken mehrtägiger Ertrag auf einem Tag
        let prevT = null;
        (day[c.pv_today || c.pv_total] || []).forEach((r) => {
          const t = typeof r.start === 'number' ? r.start : Date.parse(r.start);
          const ok = c.pv_today || (prevT !== null && Math.abs(t - prevT - 864e5) < 3 * 36e5);
          prevT = t;
          if (ok && r.change > 0 && r.change < 500 && (!rec || r.change > rec.v)) rec = { v: r.change, t };
        });
        this._rec = rec;
        // Grundlast: niedrigster Stundenmittelwert zwischen 0 und 5 Uhr je Nacht
        const nights = {};
        (hr[c.home_power] || []).forEach((r) => {
          const t = new Date(typeof r.start === 'number' ? r.start : Date.parse(r.start));
          if (t.getHours() > 5 || r.mean === null || r.mean === undefined) return;
          const k = t.toDateString();
          if (!nights[k] || r.mean < nights[k].v) nights[k] = { v: r.mean, t };
        });
        this._nights = Object.values(nights).sort((a, b) => a.t - b.t).slice(-7);
        this._loaded = Date.now();
        this._render();
        // Neue Daten (Balken, Grundlast): einmal neu einpassen
        this._sched();
      } catch (e) {
        console.warn('energy-cockpit-stats-card: load failed', e);
        this._loaded = Date.now() - 28 * 60 * 1000;
      }
      this._loading = false;
    }

    _count(k, target, dec) {
      const el = this._$(`[data-t="${k}"]`);
      if (!el) return;
      if (target === null || !isFinite(target)) { el.textContent = '—'; return; }
      const t = this._tw[k] || (this._tw[k] = { cur: 0 });
      t.from = t.cur; t.to = target; t.t0 = performance.now();
      const step = (n) => {
        const p = Math.min(1, (n - t.t0) / 1300), e = 1 - Math.pow(1 - p, 3);
        t.cur = t.from + (t.to - t.from) * e;
        el.textContent = nf(t.cur, dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    _f(f, txt) { const el = this._$(`[data-f="${f}"]`); if (el && el.innerHTML !== txt) el.innerHTML = txt; }

    // Werte für einen Zeitraum: pv, imp, exp, chg, dis (kWh)
    _periodVals() {
      const c = this._c, h = this._hass, M = this._m, now = new Date();
      if (this._period === 'day') {
        const raw = WD.rawUnits(c), en = (id) => WD.kwh(h, id, raw);
        return { pv: en(c.pv_today), imp: en(c.import_today), exp: en(c.export_today), chg: en(c.charge_today) || 0, dis: en(c.discharge_today) || 0, label: T('st.today') };
      }
      if (!M) return null;
      const ks = this._period === 'month' ? [key(now.getFullYear(), now.getMonth())] : Array.from({ length: now.getMonth() + 1 }, (x, i) => key(now.getFullYear(), i));
      const sum = (o) => ks.reduce((a, k) => a + (o[k] || 0), 0);
      return { pv: sum(M.pv), imp: sum(M.imp), exp: sum(M.exp), chg: sum(M.chg), dis: sum(M.dis), label: this._period === 'month' ? MONL[now.getMonth()] : String(now.getFullYear()) };
    }

    _render() {
      const c = this._c, h = this._hass;
      if (!h) return;
      const price = WD.price(h, c.grid_price, c.grid_price_ct, 0), feed = WD.price(h, c.feed_in, c.feed_in_ct, 0), CUR = cur();
      this.shadowRoot.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.p === this._period));
      // Geld
      const p = this._periodVals();
      if (p && p.pv !== null && p.imp !== null && p.exp !== null) {
        const self = Math.max(0, p.pv - p.exp);
        const cons = p.pv + p.imp - p.exp - p.chg + p.dis;
        this._count('pvsav', price > 0 ? self * price : null, self * price < 100 ? 2 : 0);
        this._count('feed', feed > 0 ? p.exp * feed : null, p.exp * feed < 100 ? 2 : 0);
        this._count('cost', price > 0 ? p.imp * price : null, p.imp * price < 100 ? 2 : 0);
        this._count('aut', cons > 0 ? Math.max(0, Math.min(1, 1 - p.imp / cons)) * 100 : null, 0);
        this._f('pvsavSub', T('st.self', { kwh: fKwh(self) }));
        this._f('feedSub', T('st.fed', { kwh: fKwh(p.exp) }));
        this._f('costSub', T('st.drawn', { kwh: fKwh(p.imp) }));
        this._f('autSub', T('st.autsub', { self: p.pv > 0 ? fPct(1 - p.exp / p.pv) : '—', cons: fKwh(cons) }));
      }
      // Amortisation (Lebensdauer-Zähler, heutige Preise)
      const inv = val(h, c.investment, typeof c.investment_eur === 'number' ? c.investment_eur : 0);
      const pvT = WD.kwh(h, c.pv_total, WD.rawUnits(c)), expT = WD.kwh(h, c.grid_export_total, WD.rawUnits(c));
      if (inv > 0 && price > 0 && pvT !== null && expT !== null) {
        // earned_before(_eur): vor Beginn der Zähler bereits erwirtschaftet (z. B. Anlage älter als die Home-Assistant-Daten)
        const before = Math.max(0, val(h, c.earned_before, typeof c.earned_before_eur === 'number' ? c.earned_before_eur : 0));
        const earned = Math.max(0, pvT - expT) * price + expT * feed + before;
        const pct = earned / inv;
        this._count('amo', Math.min(100, pct * 100), 0);
        requestAnimationFrame(() => { const f = this._$('.pfill'); if (f) f.style.width = Math.min(100, pct * 100) + '%'; });
        this._f('amoEarned', T('st.earned', { e: fEur(earned), i: fEur(inv), cur: CUR }));
        let eta = '';
        if (this._m && pct < 1) {
          const now = new Date();
          let pv12 = 0, ex12 = 0, n = 0;
          for (let i = 1; i <= 12; i++) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const k = key(d.getFullYear(), d.getMonth()); if (this._m.pv[k] !== undefined) { pv12 += this._m.pv[k]; ex12 += this._m.exp[k] || 0; n++; } }
          if (n >= 6) {
            const perYear = (Math.max(0, pv12 - ex12) * price + ex12 * feed) * 12 / n;
            const yrs = (inv - earned) / perYear;
            eta = T('st.eta', { y: fEur(perYear), yr: now.getFullYear() + Math.ceil(yrs), cur: CUR });
          }
        } else if (pct >= 1) eta = T('st.paid');
        this._f('amoEta', eta);
      }
      // Grundlast
      const N = this._nights || [];
      if (N.length) {
        const vals = N.map((x) => x.v).sort((a, b) => a - b);
        const med = vals[Math.floor(vals.length / 2)];
        this._count('gl', med, 0);
        this._f('glCost', price > 0 ? T('st.glcost', { x: fEur(med / 1000 * 8760 * price), cur: CUR }) : '');
        const mx = Math.max(...N.map((x) => x.v), 1);
        const bars = this._$('.nights'), lbl = this._$('.nl');
        if (bars.children.length !== N.length) {
          bars.innerHTML = N.map(() => '<div></div>').join('');
          lbl.innerHTML = N.map((x) => `<span>${x.t.toLocaleDateString(WD.state.loc, { weekday: 'short' }).replace('.', '').slice(0, 2)}</span>`).join('');
        }
        requestAnimationFrame(() => N.forEach((x, i) => { bars.children[i].style.height = Math.max(6, x.v / mx * 100) + '%'; }));
        this._f('glTip', T('st.gltip', { n: N.length }) + (price > 0 ? ' · ' + T('st.gl100', { x: fEur(0.1 * 8760 * price), cur: CUR }) : ''));
      }
      // Monatsbalken
      if (this._m) {
        const now = new Date(), cy = now.getFullYear();
        let mx = 1;
        for (let i = 0; i < 12; i++) mx = Math.max(mx, this._m.pv[key(cy, i)] || 0, this._m.pv[key(cy - 1, i)] || 0);
        requestAnimationFrame(() => this.shadowRoot.querySelectorAll('.col').forEach((col) => {
          const i = +col.dataset.m, a = this._m.pv[key(cy, i)], b = this._m.pv[key(cy - 1, i)];
          col.querySelector('.cur').style.height = a ? Math.max(2, a / mx * 92) + '%' : '0';
          const pb = col.querySelector('.prev');
          pb.style.height = b ? Math.max(2, b / mx * 92) + '%' : '0';
          pb.style.display = b ? '' : 'none';
        }));
        if (this._sel === null) this._sel = now.getMonth();
        this._detail();
      }
      // Footer
      if (this._rec) this._f('rec', `${nf(this._rec.v, 1)}<small>kWh · ${new Date(this._rec.t).toLocaleDateString(WD.state.loc, { day: '2-digit', month: '2-digit' })}</small>`);
      const chT = WD.kwh(h, c.battery_charge_total, WD.rawUnits(c)), diT = WD.kwh(h, c.battery_discharge_total, WD.rawUnits(c));
      if (chT && diT) this._f('eff', `${nf(diT / chT * 100, 1)}<small>%</small>`);
      if (chT && c.battery_capacity_kwh) this._f('cyc', `${nf(chT / c.battery_capacity_kwh, 0)}<small>${T('st.full')}</small>`);
      const tmp = live(h, c.battery_temp);
      if (tmp !== null) this._f('temp', `${nf(tmp, 1)}<small>°C</small>`);
      if (pvT !== null) this._f('pvAll', `${nf(pvT / 1000, 1)}<small>MWh</small>`);
      this._f('note', price > 0 ? T('st.note', { p: nf(price * 100, 1), f: nf(feed * 100, 1) }) : T('st.noprice'));
      if (this._fs) this._fitH(); else this._sched();
    }

    _detail() {
      const el = this._$('.detail'), M = this._m;
      if (!el || !M) return;
      const cy = new Date().getFullYear(), i = this._sel;
      this.shadowRoot.querySelectorAll('.col').forEach((c) => c.classList.toggle('sel', +c.dataset.m === i));
      const k = key(cy, i), kp = key(cy - 1, i);
      if (M.pv[k] === undefined) { el.innerHTML = `${MONL[i]} ${cy}: ${T('st.nodata')}`; return; }
      const cons = M.pv[k] + (M.imp[k] || 0) - (M.exp[k] || 0) - (M.chg[k] || 0) + (M.dis[k] || 0);
      const aut = cons > 0 ? 1 - (M.imp[k] || 0) / cons : null;
      const d = M.pv[kp] ? (M.pv[k] - M.pv[kp]) / M.pv[kp] : null;
      el.innerHTML = `<b>${MONL[i]} ${cy}</b> · PV <b>${fKwh(M.pv[k])} kWh</b>${d !== null ? ` (${d >= 0 ? '+' : '−'}${nf(Math.abs(d) * 100, 0)} % ${T('st.vsprev')})` : ''} · ${T('st.import')} ${fKwh(M.imp[k])} kWh · ${T('st.export')} ${fKwh(M.exp[k])} kWh · ${T('st.aut')} <b>${fPct(aut)}</b>`;
    }
  }

  if (!customElements.get('energy-cockpit-stats-card')) {
    customElements.define('energy-cockpit-stats-card', EnergyCockpitStatsCard);
    window.customCards = window.customCards || [];
    window.customCards.push({ type: 'energy-cockpit-stats-card', name: 'energy-cockpit Statistik', description: 'Geld, Amortisation, Grundlast, Monatsvergleich, Akku', preview: true });
  }
})();
