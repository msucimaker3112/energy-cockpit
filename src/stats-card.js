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
.money.three{grid-template-columns:repeat(3,1fr)}
.m .v{display:flex;align-items:baseline;margin-top:10px}
.m .num{font-size:2rem;font-weight:800;letter-spacing:-.025em;line-height:1;font-variant-numeric:tabular-nums;color:rgb(var(--c));text-shadow:none}
.m .unit{font-size:.95rem;font-weight:700;color:rgb(var(--c));opacity:.8;margin-left:5px}
.m .sub{font-size:.74rem;color:rgb(var(--mut));margin-top:7px}
.m .sub b{color:var(--txt);font-weight:600}
.m.aut .num{color:rgb(var(--home))}
.m.selfc .num{color:rgb(var(--sav))}
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
.yrnav{display:flex;align-items:center;margin-left:12px}
.yb{cursor:pointer;padding:5px 12px;border-radius:999px;background:rgba(var(--ov),.07);border:1px solid rgba(var(--ov),.14);font-size:.8rem;font-weight:700;line-height:1.2;user-select:none;-webkit-tap-highlight-color:transparent}
.yb.off{opacity:.3;pointer-events:none}
.yv{margin:0 8px;font-size:.8rem;font-weight:700;font-variant-numeric:tabular-nums}
.leg i.hist{background:rgb(var(--bat))}
.b.cur.hist{background:linear-gradient(180deg,rgb(var(--bat)),rgba(var(--bat),.3));box-shadow:0 0 0 1px rgba(var(--bat),.35)}
.col.gap:after{content:'';position:absolute;left:32%;right:32%;bottom:0;height:6px;border-radius:2px;background:repeating-linear-gradient(-45deg,rgba(var(--ov),.35) 0 3px,transparent 3px 6px)}
.cover{margin-top:6px;font-size:.7rem;line-height:1.45;min-height:2.9em;color:rgb(var(--mut));text-align:center}
.cc{margin-top:14px}
.cc-head{display:flex;align-items:center;flex-wrap:wrap;margin-bottom:12px}
.cc-head .lbl{margin-right:auto}
.cc-sum{font-size:.76rem;color:rgb(var(--mut));font-variant-numeric:tabular-nums}
.cc-sum b{color:rgb(var(--imp));font-weight:700}
.cc-sum b.s{color:rgb(var(--sav))}
.cc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));grid-gap:12px;gap:12px}
.ccard{position:relative;min-width:0;padding:14px 15px 13px;border-radius:18px;background:linear-gradient(150deg,rgba(var(--c),.11),rgba(var(--c),.015) 62%);border:1px solid rgba(var(--c),.2);transition:opacity .4s}
.ccard.idle{opacity:.62}
.cc-top{display:flex;flex-wrap:wrap;align-items:center;min-width:0}
.cc-top .ico{width:36px;height:36px;border-radius:12px;margin-right:10px}
.cc-name{min-width:0;margin-right:auto}
.cc-name b{display:block;font-size:.92rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cc-name small{display:block;white-space:nowrap;font-size:.62rem;font-weight:650;letter-spacing:.07em;text-transform:uppercase;color:rgb(var(--mut));margin-top:2px}
.cc-live{display:none;align-items:center;flex:none;margin:4px 0 0 auto;padding:4px 9px;border-radius:999px;font-size:.68rem;font-weight:650;white-space:nowrap;font-variant-numeric:tabular-nums;color:rgb(var(--c));background:rgba(var(--c),.13)}
.cc-live.on{display:flex}
.cc-live:before{content:'';width:6px;height:6px;border-radius:50%;background:rgb(var(--c));margin-right:6px;animation:ccdot 2s ease-in-out infinite}
@keyframes ccdot{50%{opacity:.3}}
.cc-main{display:flex;align-items:flex-end;justify-content:space-between;margin-top:13px}
.cc-val{display:flex;align-items:baseline;font-variant-numeric:tabular-nums}
.cc-val .num{font-size:1.95rem;font-weight:800;letter-spacing:-.025em;line-height:1;color:rgb(var(--imp))}
.cc-val .unit{font-size:.95rem;font-weight:700;color:rgb(var(--imp));opacity:.8;margin-left:4px}
.cc-cap{display:block;font-size:.66rem;color:rgb(var(--mut));margin-top:5px}
.cc-sav{text-align:right;font-variant-numeric:tabular-nums}
.cc-sav b{font-size:1.02rem;font-weight:750;color:rgb(var(--sav))}
.cc-bar{display:flex;height:9px;border-radius:999px;overflow:hidden;background:rgba(var(--ov),.07);margin-top:12px}
.cc-bar i{display:block;width:0;background:rgb(var(--s));transition:width 1.1s cubic-bezier(.2,.8,.2,1)}
.cc-bar i+i{box-shadow:-1.5px 0 0 var(--panel)}
.cc-leg{display:flex;flex-wrap:wrap;margin-top:8px;font-size:.7rem;color:rgb(var(--mut));font-variant-numeric:tabular-nums}
.cc-leg span{display:flex;align-items:center;margin-right:11px}
.cc-leg i{width:6px;height:6px;border-radius:50%;background:rgb(var(--s));margin-right:5px}
.cc-leg b{color:var(--txt);font-weight:600;margin-left:3px}
.ccard.bad{border-color:rgba(251,191,36,.45)}
.cc-leg .cc-warn{display:block;margin:0;color:#fbbf24;font-weight:600;line-height:1.35;overflow-wrap:anywhere}
.cc-warn ha-icon{--mdc-icon-size:14px;width:14px;height:14px;vertical-align:-2px;margin-right:5px}
.wide{padding:24px 30px}
.wide .title{font-size:1.25rem}
.wide .m .num{font-size:2.4rem}
.wide .bars{height:140px}
.narrow{padding:16px}
.narrow .money{grid-template-columns:1fr 1fr}
.narrow .money.three .m:last-child{grid-column:1 / -1}
.narrow .duo{grid-template-columns:1fr}
.narrow .cc-top{flex-wrap:wrap}
.narrow .cc-live{margin:9px 0 0 46px}
@media (prefers-reduced-motion:reduce){.pfill:after,.col.now .b.cur,.cc-live:before{animation:none}}
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
      // Mehrere Speicher: Zähler dürfen als Liste angegeben werden, die Karte summiert sie
      const lst = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]) : (v ? [v] : []))).filter(Boolean);
      this._c._chg = lst(c.battery_charge_total); this._c._dis = lst(c.battery_discharge_total);
      this._c._chgD = lst(c.charge_today); this._c._disD = lst(c.discharge_today);
      this._c.battery_capacity_kwh = lst(c.battery_capacity_kwh).reduce((a, v) => a + (parseFloat(v) || 0), 0);
      // long_term (optional): ganze Historie, Jahre blättern, Reiter "Gesamt", pv_history. Ohne die Option bleibt alles wie bisher
      this._c._lt = c.long_term === true;
      // pv_ac: Die PV-Zähler zählen nur die Abgabe des Wechselrichters, also ohne Akku-Ladung und mit Akku-Entladung
      this._c._ac = c.pv_ac === true;
      // feed_in_card (optional): Für Anlagen ohne Vergütung die Kachel "Einspeiseerlös" ausblenden oder durch den PV-Eigenverbrauch ersetzen
      this._c._feedCard = ['hidden', 'pv_self_consumption'].includes(c.feed_in_card) ? c.feed_in_card : '';
      // cost_consumers (optional): Kosten je Verbraucher. Mit grid/battery/pv gemessen, sonst nach dem Mix des Hauses je Stunde
      const ccIcon = (n) => (/auto|kfz|\bev\b|wallbox|lade/i.test(n) ? 'mdi:car-electric' : /wärmepumpe|waermepumpe|\bwp\b/i.test(n) ? 'mdi:heat-pump-outline' : /wasser|boiler/i.test(n) ? 'mdi:water-boiler' : /heiz/i.test(n) ? 'mdi:radiator' : /klima/i.test(n) ? 'mdi:air-conditioner' : 'mdi:flash');
      const ccCol = ['#a78bfa', '#38bdf8', '#fb923c', '#34d399', '#f472b6', '#facc15'];
      this._c._cc = lst(c.cost_consumers).filter((x) => x && (x.energy || x.grid)).map((x, i) => ({ icon: ccIcon(x.name || ''), color: ccCol[i % ccCol.length], ...x }));
      // grid_price_history (optional): frühere Preise. "until" ist JJJJ-MM-TT oder JJJJ-MM, sortiert gilt der erste passende Eintrag
      this._c._ph = lst(c.grid_price_history).filter((x) => x && x.until && typeof x.ct === 'number').map((x) => ({ until: String(x.until), eur: x.ct / 100 })).sort((a, b) => (a.until < b.until ? -1 : 1));
      this._ccY = null; this._ccV = null;
      this._c._hist = this._c._lt && typeof c.pv_history === 'string' ? c.pv_history.trim().toLowerCase() : '';
      this._c._histUntil = /^\d{4}-\d{2}/.test(String(c.pv_history_until || '')) ? String(c.pv_history_until).slice(0, 7) : '';
      if (!this._c._lt) { this._yr = null; if (this._period === 'all') this._period = 'month'; }
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
      const m = (k, lbl, col, extra = '') => `<div class="panel m ${k}" style="--c:${col}"><span class="lbl"><i></i>${lbl}</span><div class="v"><span class="num" data-t="${k}">—</span><span class="unit">${k === 'aut' || k === 'selfc' ? '%' : cur()}</span></div><div class="sub" data-f="${k}Sub"></div>${extra}</div>`;
      this.shadowRoot.innerHTML = `<style>${CSS}</style>
      <ha-card><div class="wrap">
        <header>
          <div class="title"><span class="ico"><ha-icon icon="mdi:chart-box-outline"></ha-icon></span>${esc(c.title || T('st.title'))}</div>
          <div class="tabs">
            <div class="tab" data-p="day">${T('st.today')}</div>${c._cc.length ? `<div class="tab" data-p="week">${T('st.week')}</div>` : ''}<div class="tab" data-p="month">${MON[now.getMonth()]}</div><div class="tab" data-p="year" data-f="yrTab">${now.getFullYear()}</div>${c._lt ? `<div class="tab" data-p="all">${T('st.all')}</div>` : ''}
          </div>
          ${c.nav_path ? `<div class="navbtn" data-nav="${esc(c.nav_path)}">${esc(c.nav_label || T('st.next'))}</div>` : ''}
        </header>
        <div class="money${c._feedCard === 'hidden' ? ' three' : ''}">
          ${m('pvsav', T('st.pvsav'), 'var(--pv)')}
          ${c._feedCard === 'hidden' ? '' : c._feedCard === 'pv_self_consumption' ? m('selfc', T('st.selfc'), 'var(--sav)') : m('feed', T('st.feed'), 'var(--exp)')}
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
        ${c._cc.length ? `<div class="panel cc" style="display:none">
          <div class="cc-head"><span class="lbl" style="--c:var(--imp)"><i></i>${T('st.cc.title')} · <span data-f="ccP" style="margin-left:4px"></span></span><span class="cc-sum" data-f="ccSum"></span></div>
          <div class="cc-grid">${c._cc.map((x, i) => `<div class="ccard" data-c="${i}" style="--c:${WD.rgb(x.color, '167,139,250')}">
            <div class="cc-top"><span class="ico"><ha-icon icon="${esc(x.icon || 'mdi:flash')}"></ha-icon></span><div class="cc-name"><b>${esc(x.name || x.energy || x.grid)}</b><small>${T(x.grid ? 'st.cc.meas' : 'st.cc.est')}</small></div><span class="cc-live" data-f="ccL${i}"></span></div>
            <div class="cc-main"><div><div class="cc-val"><span class="num" data-t="ccC${i}">—</span><span class="unit">${cur()}</span></div><span class="cc-cap">${T('st.cc.cost')}</span></div><div class="cc-sav"><b data-f="ccS${i}">—</b><span class="cc-cap">${T('st.cc.saved')}</span></div></div>
            <div class="cc-bar">${['--imp', '--bat', '--pv'].map((s) => `<i style="--s:var(${s})"></i>`).join('')}</div>
            <div class="cc-leg" data-f="ccK${i}"></div>
          </div>`).join('')}</div>
        </div>` : ''}
        <div class="panel chart">
          <div class="chart-head"><span class="lbl" style="--c:var(--pv)"><i></i>${T('st.monthly')}</span>
            ${c._lt ? '<span class="yrnav"><span class="yb" data-yr="-1" role="button" aria-label="−1">‹</span><span class="yv" data-f="yrNav"></span><span class="yb" data-yr="1" role="button" aria-label="+1">›</span></span>' : ''}
            <span class="leg"><i></i><span data-f="legCur">${now.getFullYear()}</span></span><span class="leg"><i class="prev"></i><span data-f="legPrev">${now.getFullYear() - 1}</span></span>${c._hist ? `<span class="leg" data-leg="hist" style="display:none"><i class="hist"></i>${esc(c.pv_history_name || T('st.hist'))}</span>` : ''}</div>
          <div class="bars">${MON.map((x, i) => `<div class="col${i === now.getMonth() ? ' now' : ''}" data-m="${i}"><div class="b prev"></div><div class="b cur"></div></div>`).join('')}</div>
          <div class="mlabels">${MON.map((x, i) => `<span class="${i === now.getMonth() ? 'now' : ''}">${x}</span>`).join('')}</div>
          <div class="detail"></div>
          ${c._lt ? '<div class="cover" data-f="cover"></div>' : ''}
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
      this.shadowRoot.querySelectorAll('.yb').forEach((b) => b.addEventListener('click', () => {
        const y = this._years();
        this._yr = Math.max(y.min, Math.min(y.max, y.cur + Number(b.dataset.yr)));
        this._period = 'year';
        this._render();
      }));
      const nb = this._$('[data-nav]');
      if (nb) nb.addEventListener('click', () => haNavigate(nb.dataset.nav));
      this._mode();
    }

    // Kosten je Verbraucher: Stundenwerte des Jahres. Abgeschlossene Monate nur einmal laden, den laufenden bei jeder Aktualisierung
    async _loadCC() {
      const c = this._c, h = this._hass;
      if (!c._cc.length || !h || !h.callWS) return;
      const now = new Date(), y0 = new Date(now.getFullYear(), 0, 1), m0 = new Date(now.getFullYear(), now.getMonth(), 1), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const w0 = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() - (d0.getDay() + 6) % 7), first = w0 < m0 ? w0 : m0;
      const house = [c.pv_total, c.grid_import_total, c.grid_export_total].concat(c._chg, c._dis);
      const mine = (x) => (x.grid ? [x.grid, x.battery, x.pv] : [x.energy]).filter(Boolean);
      const ids = [...new Set(house.concat(...c._cc.map(mine)))];
      const priceId = typeof c.grid_price === 'string' ? c.grid_price : null, nowEur = WD.price(h, c.grid_price, c.grid_price_ct, 0);
      const stat = (period, types, list, start, end) => h.callWS({ type: 'recorder/statistics_during_period', start_time: start.toISOString(), ...(end ? { end_time: end.toISOString() } : {}), period, statistic_ids: list, types, ...WD.statUnits(c) });
      const stamp = (r) => (typeof r.start === 'number' ? r.start : Date.parse(r.start));
      const ymd = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
      const zero = () => c._cc.map(() => [0, 0, 0, 0, 0]);
      // Preis einer Stunde: Statistik des Preis-Sensors, sonst grid_price_history, sonst der heutige Preis
      const rate = (t, means) => {
        if (means[t] !== undefined) return means[t];
        const day = ymd(t), hit = c._ph.find((x) => day.slice(0, x.until.length) <= x.until);
        return hit ? hit.eur : nowEur;
      };
      const seen = new Set();
      const add = (rows, means, slots, onHour) => {
        const at = {};
        ids.forEach((id) => { if ((rows[id] || []).length) seen.add(id); });
        ids.forEach((id) => (rows[id] || []).forEach((r) => { if (r.change === null || r.change === undefined) return; const t = stamp(r); (at[t] = at[t] || {})[id] = Math.max(0, r.change); }));
        Object.keys(at).forEach((k) => {
          const t = +k, v = at[k], sum = (l) => l.reduce((a, id) => a + (v[id] || 0), 0), pv = v[c.pv_total] || 0, imp = v[c.grid_import_total] || 0, exp = v[c.grid_export_total] || 0, chg = sum(c._chg), dis = sum(c._dis);
          if (onHour) onHour(t, { pv, imp, exp, chg, dis });
          const home = c._ac ? pv + imp - exp : pv + imp - exp - chg + dis, pr = rate(t, means);
          const g = home > 0 ? Math.min(1, imp / home) : (imp > 0 ? 1 : 0), b = home > 0 ? Math.min(1 - g, dis / home) : 0;
          c._cc.forEach((x, i) => {
            const part = x.grid ? [v[x.grid] || 0, v[x.battery] || 0, v[x.pv] || 0] : [(v[x.energy] || 0) * g, (v[x.energy] || 0) * b, (v[x.energy] || 0) * (1 - g - b)];
            const line = [part[0], part[1], part[2], part[0] * pr, (part[1] + part[2]) * pr];
            slots(t).forEach((s) => { for (let n = 0; n < 5; n++) s[i][n] += line[n]; });
          });
        });
      };
      const means = async (start, end) => {
        const out = {};
        if (!priceId) return out;
        const r = await stat('hour', ['mean'], [priceId], start, end).catch(() => ({}));
        (r[priceId] || []).forEach((x) => { if (typeof x.mean === 'number') out[stamp(x)] = x.mean; });
        return out;
      };
      try {
        const mk = key(now.getFullYear(), now.getMonth());
        let hasStat = false;
        if (!this._ccY || this._ccY.k !== mk) {
          const past = zero();
          if (m0 > y0) { const m = await means(y0, m0); hasStat = Object.keys(m).length > 0; add(await stat('hour', ['change'], ids, y0, m0), m, () => [past]); }
          this._ccY = { k: mk, past, hasStat };
        }
        const day = zero(), week = zero(), month = zero(), wk = { pv: 0, imp: 0, exp: 0, chg: 0, dis: 0 };
        const m = await means(first);
        add(await stat('hour', ['change'], ids, first), m, (t) => [t >= m0 && month, t >= w0 && week, t >= d0 && day].filter(Boolean), (t, x) => { if (t >= w0) Object.keys(wk).forEach((n) => { wk[n] += x[n]; }); });
        this._ccW = wk;
        // Typische Einrichtungsfehler sichtbar machen, statt still 0 € zu zeigen: Leistungssensor statt Zähler, Sensor ohne Statistik
        // "Keine Statistik" nur melden, wenn die Zähler des Hauses Werte haben. Kurz nach Monats- oder Wochenbeginn gibt es sonst noch gar keine Stunde
        const anyHouse = house.some((id) => seen.has(id));
        this._ccBad = c._cc.map((x) => {
          for (const id of mine(x)) {
            const st = h.states && h.states[id], u = st && st.attributes ? String(st.attributes.unit_of_measurement || '') : '';
            if (/^[kMG]?W$/.test(u)) return { k: 'st.cc.unitW', id, u };
            if (seen.has(id)) continue;
            if (!st && h.states) return { k: 'st.cc.missing', id, u };
            if (anyHouse) return { k: 'st.cc.nostat', id, u };
          }
          return null;
        });
        this._ccPriced = nowEur > 0 || c._ph.length > 0 || this._ccY.hasStat || Object.keys(m).length > 0;
        this._ccV = { day, week, month, year: month.map((x, i) => x.map((v, n) => v + this._ccY.past[i][n])) };
      } catch (e) {
        console.warn('energy-cockpit-stats-card: cost_consumers', e);
      }
    }

    _renderCC(price) {
      const c = this._c, el = this._$('.cc'), V = this._ccV;
      if (!el) return;
      // Nur das aktuelle Jahr: Für "Gesamt" und frühere Jahre gibt es keine Stundenwerte
      const set = V && ['day', 'week', 'month', 'year'].includes(this._period) && !(c._lt && this._period === 'year' && this._years().cur !== new Date().getFullYear()) ? V[this._period] : null;
      // Ohne Stundenwerte bleibt der Bereich stehen und nennt den Grund: Verschwindet er, springen Höhe und Maßstab der ganzen Karte
      el.style.display = V ? '' : 'none';
      if (!V) return;
      const CUR = cur(), dec = (v) => (Math.abs(v) < 100 ? 2 : 0), fk = (v) => (set ? nf(v, v >= 100 ? 0 : 1) : '—'), tab = this._$('.tab.on'), priced = set && this._ccPriced;
      this._f('ccP', tab ? esc(tab.textContent) : '');
      let cost = 0, sav = 0;
      c._cc.forEach((x, i) => {
        const [g, b, p, cost1, sav1] = set ? set[i] : [0, 0, 0, 0, 0], tot = g + b + p, card = this._$(`.ccard[data-c="${i}"]`);
        const bad = this._ccBad && this._ccBad[i];
        if (!bad) { cost += cost1; sav += sav1; }
        this._count(`ccC${i}`, priced && !bad ? cost1 : null, dec(cost1));
        this._f(`ccS${i}`, priced && !bad ? `${nf(sav1, dec(sav1))} ${CUR}` : '—');
        card.classList.toggle('idle', tot < 0.05 && !bad);
        card.classList.toggle('bad', !!bad);
        if (bad) {
          card.querySelectorAll('.cc-bar i').forEach((s) => { s.style.width = '0'; });
          this._f(`ccK${i}`, `<span class="cc-warn" title="${esc(bad.id)}"><ha-icon icon="mdi:alert-outline"></ha-icon>${T(bad.k, { id: esc(bad.id), u: esc(bad.u) })}</span>`);
          this._$(`[data-f="ccL${i}"]`).classList.remove('on');
          return;
        }
        card.querySelectorAll('.cc-bar i').forEach((s, n) => { s.style.width = tot > 0 ? [g, b, p][n] / tot * 100 + '%' : '0'; });
        this._f(`ccK${i}`, [['--imp', 'st.cc.grid', g], ['--bat', 'st.cc.bat', b], ['--pv', 'st.cc.pv', p]].map(([s, l, v]) => `<span style="--s:var(${s})"><i></i>${T(l)}<b>${fk(v)}</b></span>`).join('') + '<span>kWh</span>');
        const w = live(this._hass, x.power), on = w !== null && w > (x.on_w === undefined ? 10 : x.on_w), lv = this._$(`[data-f="ccL${i}"]`);
        lv.classList.toggle('on', on);
        if (on) this._f(`ccL${i}`, `${nf(w, 0)} W${price > 0 ? ' · ' + T('st.cc.upto', { x: nf(w / 1000 * price, 2), cur: CUR }) : ''}`);
      });
      this._f('ccSum', !set ? T('st.cc.nohist') : priced ? `${T('st.cc.cost')} <b>${nf(cost, dec(cost))} ${CUR}</b> · ${T('st.cc.saved')} <b class="s">${nf(sav, dec(sav))} ${CUR}</b>` : '');
    }

    async _load() {
      const h = this._hass, c = this._c;
      if (!h || !h.callWS) return;
      this._loading = true;
      try {
        const now = new Date();
        const ids = [c.pv_total, c.grid_import_total, c.grid_export_total, c._hist].concat(c._chg, c._dis).filter(Boolean);
        const [mon, day, hr] = await Promise.all([
          h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(c._lt ? 2000 : now.getFullYear() - 1, 0, 1).toISOString(), period: 'month', statistic_ids: ids, types: ['change'], ...WD.statUnits(c) }),
          h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(now.getFullYear(), 0, 1).toISOString(), period: 'day', statistic_ids: [c.pv_today || c.pv_total], types: ['change'], ...WD.statUnits(c) }),
          c.home_power ? h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(Date.now() - 8 * 864e5).toISOString(), period: 'hour', statistic_ids: [c.home_power], types: ['mean'], ...WD.statUnits(c) }) : Promise.resolve({}),
        ]);
        const byMonth = (id) => {
          const out = {};
          (mon[id] || []).forEach((r) => { const d = new Date(typeof r.start === 'number' ? r.start : Date.parse(r.start)); if (r.change !== null && r.change !== undefined) out[key(d.getFullYear(), d.getMonth())] = Math.max(0, r.change); });
          // long_term: Für die älteste Zeile gibt es keinen Vorwert, Home Assistant rechnet sie gegen 0. Startet ein (importierter) Zähler
          // nicht bei 0, stünde dort sein ganzer Zählerstand. Den Monat auslassen, wenn er weit über allen abgeschlossenen Monaten liegt
          if (c._lt) {
            const nowK = key(now.getFullYear(), now.getMonth()), ks = Object.keys(out).sort(), rest = ks.slice(1).filter((k) => k !== nowK);
            if (rest.length && out[ks[0]] > 5 * Math.max(...rest.map((k) => out[k]))) delete out[ks[0]];
          }
          return out;
        };
        const sumM = (list) => list.reduce((acc, id) => { const m = byMonth(id); Object.keys(m).forEach((k) => { acc[k] = (acc[k] || 0) + m[k]; }); return acc; }, {});
        this._m = { pv: byMonth(c.pv_total), imp: byMonth(c.grid_import_total), exp: byMonth(c.grid_export_total), chg: sumM(c._chg), dis: sumM(c._dis) };
        // Diagramm-Reihe: pv_history füllt nur die Balken und "PV gesamt". Jeder Monat hat genau eine Quelle, Geldwerte und Autarkie bleiben bei pv_total
        this._m.pvC = this._m.pv; this._m.hist = {};
        if (c._hist) {
          const hist = byMonth(c._hist), cs = Object.assign({}, this._m.pv);
          Object.keys(hist).forEach((k) => { if (c._histUntil ? k <= c._histUntil : this._m.pv[k] === undefined) { cs[k] = hist[k]; this._m.hist[k] = true; } });
          this._m.pvC = cs;
          if (Object.keys(this._m.hist).length) this._m.pvAll = Object.keys(cs).reduce((a, k) => a + cs[k], 0);
        }
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
        await this._loadCC();
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
      const t = this._tw[k] || (this._tw[k] = { cur: 0 });
      // Nur die letzte Animation schreibt, sonst überschreibt eine laufende das "—" eines neuen Zeitraums
      const run = t.run = (t.run || 0) + 1;
      if (target === null || !isFinite(target)) { el.textContent = '—'; return; }
      t.from = t.cur; t.to = target; t.t0 = performance.now();
      const step = (n) => {
        if (t.run !== run) return;
        const p = Math.max(0, Math.min(1, (n - t.t0) / 1300)), e = 1 - Math.pow(1 - p, 3);
        t.cur = t.from + (t.to - t.from) * e;
        el.textContent = nf(t.cur, dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    _f(f, txt) { const el = this._$(`[data-f="${f}"]`); if (el && el.innerHTML !== txt) el.innerHTML = txt; }

    // long_term: gewähltes Jahr und blätterbarer Bereich
    _years() {
      const max = new Date().getFullYear(), ks = this._m ? Object.keys(this._m.pvC) : [];
      const min = ks.length ? Math.min(max, ...ks.map((k) => parseInt(k, 10))) : max;
      return { min, max, cur: Math.max(min, Math.min(max, this._yr || max)) };
    }
    // Nur Monate mit PV, Bezug und Einspeisung ergeben stimmige Summen; der Speicher kann später dazugekommen sein
    _complete() {
      const M = this._m;
      return Object.keys(M.pv).filter((k) => M.imp[k] !== undefined && M.exp[k] !== undefined).sort();
    }
    // Monate von first bis einschließlich zum aktuellen Monat, die in set fehlen
    _missing(first, set) {
      const out = [], now = new Date();
      let y = parseInt(first, 10), m = parseInt(first.slice(5), 10) - 1;
      while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth())) {
        if (set[key(y, m)] === undefined) out.push(key(y, m));
        if (++m > 11) { m = 0; y++; }
      }
      return out;
    }
    _cover(yr) {
      const M = this._m, cs = Object.keys(M.pvC).sort(), lines = [];
      if (!cs.length) return '';
      const name = (k) => `${MON[parseInt(k.slice(5), 10) - 1]}`;
      lines.push(T('st.lt.from', { d: `${MONL[parseInt(cs[0].slice(5), 10) - 1]} ${cs[0].slice(0, 4)}` }));
      const gaps = this._missing(cs[0], M.pvC).filter((k) => k.startsWith(yr + '-'));
      if (gaps.length) lines.push(T('st.lt.gaps', { m: gaps.map(name).join(', ') }));
      if (this._period === 'year' || this._period === 'all') {
        const done = this._complete();
        if (done.length) {
          const set = {}; done.forEach((k) => { set[k] = true; });
          const n = this._missing(done[0], set).filter((k) => this._period === 'all' || k.startsWith(yr + '-')).length;
          if (n) lines.push(T('st.lt.skip', { n }));
        }
      }
      if (cs.some((k) => M.hist[k] && k.startsWith(yr + '-'))) lines.push(T('st.lt.hist'));
      if (this._period === 'all' || (this._period === 'year' && yr !== new Date().getFullYear())) lines.push(T('st.lt.price'));
      return lines.join(' · ');
    }

    // Werte für einen Zeitraum: pv, imp, exp, chg, dis (kWh)
    _periodVals() {
      const c = this._c, h = this._hass, M = this._m, now = new Date();
      if (this._period === 'day') {
        const raw = WD.rawUnits(c), en = (id) => WD.kwh(h, id, raw);
        return { pv: en(c.pv_today), imp: en(c.import_today), exp: en(c.export_today), chg: c._chgD.reduce((a, id) => a + (en(id) || 0), 0), dis: c._disD.reduce((a, id) => a + (en(id) || 0), 0), label: T('st.today') };
      }
      if (this._period === 'week') return this._ccW ? { ...this._ccW, label: T('st.week') } : null;
      if (!M) return null;
      if (c._lt && this._period !== 'month') {
        const yr = this._years().cur;
        const lks = this._complete().filter((k) => this._period === 'all' || k.startsWith(yr + '-'));
        if (!lks.length) return null;
        const lsum = (o) => lks.reduce((a, k) => a + (o[k] || 0), 0);
        return { pv: lsum(M.pv), imp: lsum(M.imp), exp: lsum(M.exp), chg: lsum(M.chg), dis: lsum(M.dis), label: this._period === 'all' ? T('st.all') : String(yr) };
      }
      const ks = this._period === 'month' ? [key(now.getFullYear(), now.getMonth())] : Array.from({ length: now.getMonth() + 1 }, (x, i) => key(now.getFullYear(), i));
      const sum = (o) => ks.reduce((a, k) => a + (o[k] || 0), 0);
      return { pv: sum(M.pv), imp: sum(M.imp), exp: sum(M.exp), chg: sum(M.chg), dis: sum(M.dis), label: this._period === 'month' ? MONL[now.getMonth()] : String(now.getFullYear()) };
    }

    _render() {
      const c = this._c, h = this._hass;
      if (!h) return;
      const price = WD.price(h, c.grid_price, c.grid_price_ct, 0), feed = WD.price(h, c.feed_in, c.feed_in_ct, 0), CUR = cur();
      this.shadowRoot.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.p === this._period));
      this._renderCC(price);
      // Geld
      const p = this._periodVals();
      if (p && p.pv !== null && p.imp !== null && p.exp !== null) {
        const self = Math.max(0, p.pv - p.exp);
        const cons = c._ac ? p.pv + p.imp - p.exp : p.pv + p.imp - p.exp - p.chg + p.dis;
        this._count('pvsav', price > 0 ? self * price : null, self * price < 100 ? 2 : 0);
        this._count('feed', feed > 0 ? p.exp * feed : null, p.exp * feed < 100 ? 2 : 0);
        this._count('cost', price > 0 ? p.imp * price : null, p.imp * price < 100 ? 2 : 0);
        this._count('aut', cons > 0 ? Math.max(0, Math.min(1, 1 - p.imp / cons)) * 100 : null, 0);
        this._f('pvsavSub', T('st.self', { kwh: fKwh(self) }));
        this._f('feedSub', T('st.fed', { kwh: fKwh(p.exp) }));
        this._count('selfc', p.pv > 0 ? Math.max(0, Math.min(1, 1 - p.exp / p.pv)) * 100 : null, 0);
        this._f('selfcSub', T('st.self', { kwh: fKwh(self) }));
        this._f('costSub', T('st.drawn', { kwh: fKwh(p.imp) }));
        this._f('autSub', T('st.autsub', { self: p.pv > 0 ? fPct(1 - p.exp / p.pv) : '—', cons: fKwh(cons) }));
      } else if (c._lt && this._m && this._period !== 'day') {
        // Gewählter Zeitraum ohne vollständige Monate: keine 0 und kein Wert aus dem vorigen Zeitraum stehen lassen
        ['pvsav', 'feed', 'selfc', 'cost', 'aut'].forEach((k) => { this._count(k, null); this._f(k + 'Sub', T('st.nodata2')); });
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
            // unrealistisch weit weg (oder kein Ertrag): keine Jahreszahl nennen
            eta = !isFinite(yrs) || yrs > 60 ? T('st.eta.far') : T('st.eta', { y: fEur(perYear), yr: now.getFullYear() + Math.ceil(yrs), cur: CUR });
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
        const now = new Date(), M = this._m, cy = c._lt ? this._years().cur : now.getFullYear(), isNow = cy === now.getFullYear();
        let mx = 1;
        for (let i = 0; i < 12; i++) mx = Math.max(mx, M.pvC[key(cy, i)] || 0, M.pvC[key(cy - 1, i)] || 0);
        if (c._lt) {
          const y = this._years(), cs = Object.keys(M.pvC).sort(), gaps = cs.length ? this._missing(cs[0], M.pvC) : [];
          this._f('yrTab', String(cy)); this._f('yrNav', String(cy)); this._f('legCur', String(cy)); this._f('legPrev', String(cy - 1));
          this.shadowRoot.querySelectorAll('.yb').forEach((b) => b.classList.toggle('off', Number(b.dataset.yr) < 0 ? cy <= y.min : cy >= y.max));
          this.shadowRoot.querySelectorAll('.col').forEach((col) => {
            const i = +col.dataset.m;
            col.classList.toggle('now', isNow && i === now.getMonth());
            col.classList.toggle('gap', gaps.includes(key(cy, i)));
          });
          this.shadowRoot.querySelectorAll('.mlabels span').forEach((l, i) => l.classList.toggle('now', isNow && i === now.getMonth()));
          const hl = this._$('[data-leg="hist"]');
          if (hl) hl.style.display = cs.some((k) => M.hist[k]) ? '' : 'none';
          this._f('cover', this._cover(cy));
        }
        requestAnimationFrame(() => this.shadowRoot.querySelectorAll('.col').forEach((col) => {
          const i = +col.dataset.m, a = M.pvC[key(cy, i)], b = M.pvC[key(cy - 1, i)];
          col.querySelector('.cur').style.height = a ? Math.max(2, a / mx * 92) + '%' : '0';
          col.querySelector('.cur').classList.toggle('hist', !!M.hist[key(cy, i)]);
          const pb = col.querySelector('.prev');
          pb.style.height = b ? Math.max(2, b / mx * 92) + '%' : '0';
          pb.style.display = b ? '' : 'none';
        }));
        if (this._sel === null) this._sel = now.getMonth();
        this._detail();
      }
      // Footer
      if (this._rec) this._f('rec', `${nf(this._rec.v, 1)}<small>kWh · ${new Date(this._rec.t).toLocaleDateString(WD.state.loc, { day: '2-digit', month: '2-digit' })}</small>`);
      const sumT = (list) => { let t = null; list.forEach((id) => { const v = WD.kwh(h, id, WD.rawUnits(c)); if (v !== null && v !== undefined) t = (t || 0) + v; }); return t; };
      const chT = sumT(c._chg), diT = sumT(c._dis);
      if (chT && diT) this._f('eff', `${nf(diT / chT * 100, 1)}<small>%</small>`);
      if (chT && c.battery_capacity_kwh) this._f('cyc', `${nf(chT / c.battery_capacity_kwh, 0)}<small>${T('st.full')}</small>`);
      const tmp = live(h, c.battery_temp);
      if (tmp !== null) this._f('temp', `${nf(tmp, 1)}<small>°C</small>`);
      const pvAll = this._m && this._m.pvAll !== undefined ? this._m.pvAll : pvT;
      if (pvAll !== null) this._f('pvAll', `${nf(pvAll / 1000, 1)}<small>MWh</small>`);
      // Preis unter 1 Cent: vermutlich in Euro statt Cent eingetragen (grid_price_ct erwartet Cent, z. B. 23.88)
      this._f('note', price > 0 ? T('st.note', { p: nf(price * 100, 1), f: nf(feed * 100, 1) }) + (price < 0.01 ? '<br>' + T('st.price.warn', { p: nf(price * 100, 2) }) : '') : T('st.noprice'));
      if (this._fs) this._fitH(); else this._sched();
    }

    _detail() {
      const el = this._$('.detail'), M = this._m;
      if (!el || !M) return;
      const cy = this._c._lt ? this._years().cur : new Date().getFullYear(), i = this._sel;
      this.shadowRoot.querySelectorAll('.col').forEach((c) => c.classList.toggle('sel', +c.dataset.m === i));
      const k = key(cy, i), kp = key(cy - 1, i);
      if (M.pvC[k] === undefined) { el.innerHTML = `${MONL[i]} ${cy}: ${T(this._c._lt && k < key(new Date().getFullYear(), new Date().getMonth()) ? 'st.nodata2' : 'st.nodata')}`; return; }
      // Monat aus pv_history: nur der PV-Wert, Netz und Speicher fehlen dafür
      if (M.hist[k]) { el.innerHTML = `<b>${MONL[i]} ${cy}</b> · PV <b>${fKwh(M.pvC[k])} kWh</b> (${esc(this._c.pv_history_name || T('st.hist'))})`; return; }
      const cons = M.pv[k] + (M.imp[k] || 0) - (M.exp[k] || 0) - (this._c._ac ? 0 : (M.chg[k] || 0) - (M.dis[k] || 0));
      const aut = cons > 0 ? 1 - (M.imp[k] || 0) / cons : null;
      const d = M.pvC[kp] ? (M.pv[k] - M.pvC[kp]) / M.pvC[kp] : null;
      el.innerHTML = `<b>${MONL[i]} ${cy}</b> · PV <b>${fKwh(M.pv[k])} kWh</b>${d !== null ? ` (${d >= 0 ? '+' : '−'}${nf(Math.abs(d) * 100, 0)} % ${T('st.vsprev')})` : ''} · ${T('st.import')} ${fKwh(M.imp[k])} kWh · ${T('st.export')} ${fKwh(M.exp[k])} kWh · ${T('st.aut')} <b>${fPct(aut)}</b>`;
    }
  }

  if (!customElements.get('energy-cockpit-stats-card')) {
    customElements.define('energy-cockpit-stats-card', EnergyCockpitStatsCard);
    window.customCards = window.customCards || [];
    window.customCards.push({ type: 'energy-cockpit-stats-card', name: 'energy-cockpit Statistik', description: 'Geld, Amortisation, Grundlast, Monatsvergleich, Akku', preview: true });
  }
})();
