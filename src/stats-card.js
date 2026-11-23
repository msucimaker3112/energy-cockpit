/* energy-cockpit-stats-card (abgeleitet aus energy-stats-card v1.0.1) – Statistik: Geld, Amortisation, Grundlast, Monatsvergleich, Batterie */
(() => {
  const { nf, haNavigate, T, setLocale, cur, esc } = WD;
  const fEur = (v) => (v === null || v === undefined || !isFinite(v) ? '—' : nf(v, Math.abs(v) < 100 ? 2 : 0));
  const fKwh = (v, d) => (v === null || v === undefined || !isFinite(v) ? '—' : nf(v, typeof d === 'number' ? d : Math.abs(v) >= 100 ? 0 : 1));
  const fPct = (v, d) => (v === null || !isFinite(v) ? '—' : (typeof d === 'number' ? nf(Math.max(0, Math.min(1, v)) * 100, d) : Math.round(Math.max(0, Math.min(1, v)) * 100)) + ' %');
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
header{display:flex;align-items:center;flex-wrap:wrap;position:relative;margin-bottom:18px;row-gap:18px}
.title{font-size:calc(1.05rem*var(--ts,1));font-weight:650;margin-right:auto;display:flex;align-items:center}
.title .ico{margin-right:10px}
.ico{width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:rgba(var(--c,var(--home)),.16);color:rgb(var(--c,var(--home)));flex:none}
.ico ha-icon{--mdc-icon-size:19px;display:flex}
.tabs{display:flex;background:rgba(var(--ov),.05);border:1px solid var(--stroke);border-radius:999px;padding:3px;margin-left:8px}
.tab{padding:7px 14px;border-radius:999px;font-size:calc(.8rem*var(--ts,1));font-weight:650;color:rgb(var(--mut));cursor:pointer;transition:all .35s;-webkit-tap-highlight-color:transparent}
.tab.on{background:rgba(var(--home),.18);color:rgb(var(--home));box-shadow:0 0 0 1px rgba(var(--home),.35)}
.navbtn{cursor:pointer;color:var(--txt);font-weight:650;background:rgba(var(--ov),.07);border:1px solid rgba(var(--ov),.14);padding:8px 14px;border-radius:999px;font-size:calc(.8rem*var(--ts,1));margin-left:8px;-webkit-tap-highlight-color:transparent}
.navbtn:active{background:rgba(var(--ov),.18)}
.panel{position:relative;padding:16px 18px;border-radius:22px;background:linear-gradient(160deg,rgba(var(--ov),.065),rgba(var(--ov),.015)),var(--panel);border:1px solid var(--stroke)}
.lbl{font-size:calc(.68rem*var(--ts,1));text-transform:uppercase;letter-spacing:.1em;font-weight:650;color:rgb(var(--mut));display:flex;align-items:center}
.lbl i{width:7px;height:7px;border-radius:50%;background:rgb(var(--c));box-shadow:0 0 0 1px rgba(var(--c),.35);margin-right:7px}
.money{display:grid;grid-template-columns:repeat(4,1fr);grid-gap:14px;gap:14px}
.money.three{grid-template-columns:repeat(3,1fr)}
.m .v{display:flex;align-items:baseline;margin-top:10px}
.m .num{font-size:calc(2rem*var(--vs,1));font-weight:800;letter-spacing:-.025em;line-height:1;font-variant-numeric:tabular-nums;color:rgb(var(--c));text-shadow:none}
.m .unit{font-size:calc(.95rem*var(--ts,1));font-weight:700;color:rgb(var(--c));opacity:.8;margin-left:5px}
.m .sub{font-size:calc(.74rem*var(--ts,1));color:rgb(var(--mut));margin-top:7px}
.m .sub b{color:var(--txt);font-weight:600}
.m .sub .kv{display:flex;justify-content:space-between;align-items:baseline;column-gap:10px;min-width:0}
.m .sub .kv+.kv{margin-top:3px}
.m .sub .kv>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.m .sub .kv>b{flex:none;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.m.aut .num{color:rgb(var(--home))}
.m.selfc .num{color:rgb(var(--sav))}
.ring2{display:flex;margin-top:8px}
.ring2 div{flex:1}
.duo.one{grid-template-columns:1fr}
.duo{display:grid;grid-template-columns:1.25fr 1fr;grid-gap:14px;gap:14px;margin-top:14px}
.amo .big{display:flex;align-items:baseline;flex-wrap:wrap;margin-top:10px}
.amo .big .earn{margin-left:auto;padding-left:12px;text-align:right;font-size:calc(.76rem*var(--ts,1));color:rgb(var(--mut));font-variant-numeric:tabular-nums}
.amo .big .earn b{color:rgb(var(--sav));font-weight:800;font-size:calc(2.3rem*var(--vs,1))}
.amo .big .earn i{font-style:normal;color:rgb(var(--sav));font-weight:700;font-size:calc(1rem*var(--ts,1));margin-left:6px}
.amo .big .earn small{display:block;font-size:calc(.76rem*var(--ts,1));color:rgb(var(--mut));margin-top:2px}
.amo .big .num{font-size:calc(2.3rem*var(--vs,1));font-weight:800;color:rgb(var(--sav));text-shadow:none;font-variant-numeric:tabular-nums}
.amo .big .unit{font-size:calc(1rem*var(--ts,1));color:rgb(var(--sav));font-weight:700;margin-left:6px}
.pbar{position:relative;height:16px;border-radius:999px;background:rgba(var(--ov),.06);overflow:hidden;margin-top:12px}
.pfill{position:absolute;top:0;left:0;bottom:0;width:0;border-radius:inherit;background:linear-gradient(90deg,rgba(var(--sav),.5),rgb(var(--sav)));box-shadow:0 0 0 1px rgba(var(--sav),.35);transition:width 1.6s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.pfill:after{content:'';position:absolute;top:0;bottom:0;left:0;right:0;background:repeating-linear-gradient(-45deg,rgba(var(--ov),.14) 0 10px,transparent 10px 20px);animation:stripes 1.2s linear infinite}
@keyframes stripes{from{background-position:0 0}to{background-position:28px 0}}
.amo .meta{display:flex;justify-content:space-between;flex-wrap:wrap;font-size:calc(.76rem*var(--ts,1));color:rgb(var(--mut));margin-top:9px}
.amo .meta b{color:var(--txt);font-weight:600}
.bud{margin-top:14px;--q:var(--exp)}
.bud.s-warn{--q:var(--pv)}
.bud.s-bad{--q:var(--imp)}
.bud .big{display:flex;align-items:baseline;flex-wrap:wrap;margin-top:10px}
.bud .big .num{font-size:calc(2.3rem*var(--vs,1));font-weight:800;color:rgb(var(--q));text-shadow:none;font-variant-numeric:tabular-nums}
.bud .big .unit{font-size:calc(1rem*var(--ts,1));color:rgb(var(--q));font-weight:700;margin-left:6px}
.bud .big small{font-size:calc(.78rem*var(--ts,1));color:rgb(var(--mut));margin-left:12px}
.bud .pfill{background:linear-gradient(90deg,rgba(var(--q),.5),rgb(var(--q)));box-shadow:0 0 0 1px rgba(var(--q),.35)}
.bud .mk{position:absolute;top:0;bottom:0;left:0;width:3px;margin-left:-1px;background:var(--txt);opacity:.85;border-radius:2px;transition:left 1.6s cubic-bezier(.2,.8,.2,1)}
.bgrid{display:grid;grid-template-columns:repeat(4,1fr);grid-gap:12px;gap:12px;margin-top:14px}
.bgrid small{display:block;font-size:calc(.62rem*var(--ts,1));text-transform:uppercase;letter-spacing:.08em;color:rgb(var(--mut));margin-bottom:3px}
.bgrid b{font-size:calc(1.05rem*var(--ts,1));font-weight:750;font-variant-numeric:tabular-nums}
.bgrid em{display:block;font-style:normal;font-size:calc(.7rem*var(--ts,1));color:rgb(var(--mut));margin-top:2px}
.c-ok{color:rgb(var(--exp))}.c-warn{color:rgb(var(--pv))}.c-bad{color:rgb(var(--imp))}
.bud .hint{font-size:calc(.72rem*var(--ts,1));color:rgb(var(--mut));margin-top:10px}
.h-money .money{display:none}
.h-amo .amo,.h-gl .gl{display:none!important}
.h-amo.h-gl .duo,.h-gl .duo.one{display:none}
.h-amo:not(.h-gl) .duo,.h-gl:not(.h-amo) .duo{grid-template-columns:1fr}
.h-chart .chart{display:none}
.h-footer footer{display:none}
.narrow .bgrid{grid-template-columns:1fr 1fr}
.gl .big{display:flex;align-items:baseline;margin-top:10px}
.gl .big{flex-wrap:wrap}
.gl .big .num{font-size:calc(2.3rem*var(--vs,1));font-weight:800;color:rgb(var(--home));font-variant-numeric:tabular-nums}
.gl .big .unit{font-size:calc(1rem*var(--ts,1));color:rgb(var(--home));font-weight:700;margin-left:6px;margin-right:12px}
.gl .big .cost{margin-left:auto;padding-left:12px;text-align:right;color:rgb(var(--mut));font-variant-numeric:tabular-nums}
.gl .big .cost b{font-size:calc(2.3rem*var(--vs,1));font-weight:800;color:rgb(var(--home))}
.gl .big .cost i{font-style:normal;font-weight:700;font-size:calc(1rem*var(--ts,1));margin-left:6px;color:rgb(var(--home))}
.gl .big .cost small{display:block;font-size:calc(.76rem*var(--ts,1));margin-top:2px}
.nights{display:flex;align-items:flex-end;height:46px;margin-top:12px}
.nights div{flex:1;margin:0 3px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,rgba(var(--home),.9),rgba(var(--home),.25));height:0;transition:height 1.2s cubic-bezier(.2,.8,.2,1)}
.nl{display:flex;margin-top:4px}.nl span{flex:1;text-align:center;font-size:calc(.6rem*var(--ts,1));color:rgb(var(--mut))}
.gl .tip{font-size:calc(.72rem*var(--ts,1));color:rgb(var(--mut));margin-top:8px}
.chart{margin-top:14px}
.chart-head{display:flex;align-items:center;flex-wrap:wrap;margin-bottom:10px}
.chart-head .lbl{margin-right:auto}
.leg{display:flex;align-items:center;font-size:calc(.72rem*var(--ts,1));color:rgb(var(--mut));margin-left:14px}
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
.mlabels span{flex:1;text-align:center;font-size:calc(.64rem*var(--ts,1));color:rgb(var(--mut));font-weight:600}
.mlabels span.now{color:rgb(var(--pv))}
.detail{margin-top:10px;font-size:calc(.78rem*var(--ts,1));color:rgb(var(--mut));text-align:center;min-height:18px}
.detail b{color:var(--txt);font-weight:600}
footer{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));grid-gap:10px;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--stroke)}
.stat{display:flex;flex-direction:column;padding:10px 13px;border-radius:15px;background:rgba(var(--ov),.028);border:1px solid rgba(var(--ov),.04);min-width:0}
.sv{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;column-gap:10px;margin-top:auto;padding-top:6px;min-width:0}
.sv>span{color:rgb(var(--mut));font-size:calc(.74rem*var(--ts,1));font-weight:500}
.stat b{margin-left:auto;text-align:right;font-size:calc(1.1rem*var(--ts,1));font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.stat small{color:rgb(var(--mut));font-weight:500;font-size:calc(.72rem*var(--ts,1));margin-left:3px}
.note{margin-top:10px;font-size:calc(.64rem*var(--ts,1));color:rgba(139,151,179,.7);text-align:center}
.dhint{display:flex;flex-direction:column;gap:4px;margin:-6px 0 14px;font-size:calc(.72rem*var(--ts,1));color:#fbbf24;position:relative}
.dhint span{display:flex;align-items:flex-start;gap:6px;line-height:1.35}
.dhint ha-icon{--mdc-icon-size:15px;flex:none;margin-top:1px}
.yrnav{display:flex;align-items:center;margin-left:12px}
.yb{cursor:pointer;padding:5px 12px;border-radius:999px;background:rgba(var(--ov),.07);border:1px solid rgba(var(--ov),.14);font-size:calc(.8rem*var(--ts,1));font-weight:700;line-height:1.2;user-select:none;-webkit-tap-highlight-color:transparent}
.yb.off{opacity:.3;pointer-events:none}
.yv{margin:0 8px;font-size:calc(.8rem*var(--ts,1));font-weight:700;font-variant-numeric:tabular-nums}
.leg i.hist{background:rgb(var(--bat))}
.b.cur.hist{background:linear-gradient(180deg,rgb(var(--bat)),rgba(var(--bat),.3));box-shadow:0 0 0 1px rgba(var(--bat),.35)}
.col.gap:after{content:'';position:absolute;left:32%;right:32%;bottom:0;height:6px;border-radius:2px;background:repeating-linear-gradient(-45deg,rgba(var(--ov),.35) 0 3px,transparent 3px 6px)}
.cover{margin-top:6px;font-size:calc(.7rem*var(--ts,1));line-height:1.45;min-height:2.9em;color:rgb(var(--mut));text-align:center}
.detail b{font-weight:700}
.detail i.dd,.cover i.dd{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px;vertical-align:middle;position:relative;top:-1px;background:rgb(var(--c));box-shadow:0 0 0 1px rgba(var(--c),.35)}
.cc{margin-top:14px}
.cc-head{display:flex;align-items:center;flex-wrap:wrap;margin-bottom:12px}
.cc-head .lbl{margin-right:auto}
.cc-sum{flex:1 0 100%;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-top:8px;line-height:1.3;min-height:calc(1.3em + 12px);font-size:calc(.76rem*var(--ts,1));color:rgb(var(--mut));font-variant-numeric:tabular-nums}
.cc-sum .cc-p{padding:5px 12px;border-radius:999px;background:rgba(var(--ov),.06);border:1px solid var(--stroke)}
.cc-sum b{color:rgb(var(--imp));font-weight:700}
.cc-sum b.s{color:rgb(var(--sav))}
.cc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));grid-gap:12px;gap:12px}
.ccard{position:relative;min-width:0;padding:14px 15px 13px;border-radius:18px;background:linear-gradient(150deg,rgba(var(--c),.11),rgba(var(--c),.015) 62%);border:1px solid rgba(var(--c),.2);transition:opacity .4s}
.ccard.idle{opacity:.62}
.cc-top{display:flex;flex-wrap:wrap;align-items:center;min-width:0}
.cc-top .ico{width:36px;height:36px;border-radius:12px;margin-right:10px}
.cc-name{min-width:0;margin-right:auto}
.cc-name b{display:block;font-size:calc(.92rem*var(--ts,1));font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cc-name small{display:block;white-space:nowrap;font-size:calc(.62rem*var(--ts,1));font-weight:650;letter-spacing:.07em;text-transform:uppercase;color:rgb(var(--mut));margin-top:2px}
.cc-live{display:none;align-items:center;flex:none;margin:4px 0 0 auto;padding:4px 9px;border-radius:999px;font-size:calc(.68rem*var(--ts,1));font-weight:650;white-space:nowrap;font-variant-numeric:tabular-nums;color:rgb(var(--c));background:rgba(var(--c),.13)}
.cc-live.on{display:flex}
.cc-live:before{content:'';width:6px;height:6px;border-radius:50%;background:rgb(var(--c));margin-right:6px;animation:ccdot 2s ease-in-out infinite}
@keyframes ccdot{50%{opacity:.3}}
.cc-main{display:flex;align-items:flex-end;justify-content:space-between;margin-top:13px}
.cc-val{display:flex;align-items:baseline;font-variant-numeric:tabular-nums}
.cc-val .num{font-size:calc(1.95rem*var(--vs,1));font-weight:800;letter-spacing:-.025em;line-height:1;color:rgb(var(--imp))}
.cc-val .unit{font-size:calc(.95rem*var(--ts,1));font-weight:700;color:rgb(var(--imp));opacity:.8;margin-left:4px}
.cc-cap{display:block;font-size:calc(.74rem*var(--ts,1));font-weight:500;color:rgb(var(--mut));margin-top:5px}
.cc-sav{text-align:right;font-variant-numeric:tabular-nums}
.cc-sav .cc-val{justify-content:flex-end}.cc-val.s .num,.cc-val.s .unit{color:rgb(var(--sav))}
.cc-bar{display:flex;height:9px;border-radius:999px;overflow:hidden;background:rgba(var(--ov),.07);margin-top:12px}
.cc-bar i{display:block;width:0;background:rgb(var(--s));transition:width 1.1s cubic-bezier(.2,.8,.2,1)}
.cc-bar i+i{box-shadow:-1.5px 0 0 var(--panel)}
.cc-leg{display:flex;flex-wrap:wrap;margin-top:8px;font-size:calc(.7rem*var(--ts,1));color:rgb(var(--mut));font-variant-numeric:tabular-nums}
.cc-leg span{display:flex;align-items:center;margin-right:11px}
.cc-leg i{width:6px;height:6px;border-radius:50%;background:rgb(var(--s));margin-right:5px}
.cc-leg b{color:var(--txt);font-weight:600;margin-left:3px}
.ccard.bad{border-color:rgba(251,191,36,.45)}
.cc-parts{margin-top:10px;padding-top:9px;border-top:1px solid rgba(var(--c),.16);display:grid;grid-template-columns:minmax(0,1fr) auto auto;column-gap:12px;row-gap:5px;font-size:calc(.74rem*var(--ts,1));font-variant-numeric:tabular-nums;color:rgb(var(--mut))}
.cc-parts span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cc-parts b{color:var(--txt);font-weight:600;text-align:right;white-space:nowrap}
.cc-parts b.k{color:rgb(var(--mut));font-weight:500}
.cc-leg .cc-warn{display:block;margin:0;color:#fbbf24;font-weight:600;line-height:1.35;overflow-wrap:anywhere}
.cc-warn ha-icon{--mdc-icon-size:14px;width:14px;height:14px;vertical-align:-2px;margin-right:5px}
.wide{padding:24px 30px}
.wide .title{font-size:calc(1.25rem*var(--vs,1))}
.wide .m .num{font-size:calc(2.4rem*var(--vs,1))}
.wide .bars{height:140px}
.narrow{padding:16px}
.narrow .money{grid-template-columns:1fr 1fr}
.narrow .m .lbl{min-height:3em;align-items:flex-start}
.narrow .m .lbl i{margin-top:.28em;flex:none}
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
      this._dec = {};
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
      // #85: grid_export_total ist optional (Inselanlage ohne Einspeisung), fehlt er, zählt die Einspeisung als 0 kWh
      if (!c.pv_total || !c.grid_import_total) {
        this._c = null;
        this.shadowRoot.innerHTML = '<style>' + WD.themeCss() + 'ha-card{padding:22px;border-radius:24px;background:var(--panel);color:var(--txt);font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit Statistik</b><div style="margin-top:8px;opacity:.8">Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Sensoren auszuwählen.</div></ha-card>';
        return;
      }
      this._c = Object.assign({ battery_capacity_kwh: 0 }, c);
      this._dec = WD.decOf(c);
      // Mehrere Speicher: Zähler dürfen als Liste angegeben werden, die Karte summiert sie
      const lst = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]) : (v ? [v] : []))).filter(Boolean);
      this._c._chg = lst(c.battery_charge_total); this._c._dis = lst(c.battery_discharge_total);
      this._c._chgD = lst(c.charge_today); this._c._disD = lst(c.discharge_today);
      this._c.battery_capacity_kwh = lst(c.battery_capacity_kwh).reduce((a, v) => a + (parseFloat(v) || 0), 0);
      // long_term (optional): ganze Historie, Jahre blättern, Reiter "Gesamt", pv_history. Ohne die Option bleibt alles wie bisher
      this._c._lt = c.long_term === true;
      // pv_ac: Die PV-Zähler zählen nur die Abgabe des Wechselrichters, also ohne Batterie-Ladung und mit Batterie-Entladung
      this._c._ac = c.pv_ac === true;
      // battery_losses (optional, #97): Ersparnis und Amortisation ziehen die Verluste der Batterie ab (Ladung mal Verlustanteil). Nicht mit pv_ac (dort zählen die PV-Zähler nur die Abgabe des Wechselrichters, die Verluste sind schon heraus)
      this._c._bl = c.battery_losses === true || String(c.battery_losses).toLowerCase() === 'true';
      // battery_efficiency: Zahl in Prozent oder ein Sensor/Helfer mit dem Wirkungsgrad (Prozent, auch als Anteil 0 bis 1)
      { const be = String(c.battery_efficiency === undefined ? '' : c.battery_efficiency).trim(), ef = parseFloat(be.replace(',', '.')); this._c._ef = ef >= 50 && ef <= 100 ? ef / 100 : null; this._c._efE = isNaN(ef) && /^[a-z_]+\.[\w.]+$/i.test(be) ? be : ''; }
      // feed_in_card (optional): Für Anlagen ohne Vergütung die Kachel "Einspeiseerlös" ausblenden oder durch den PV-Eigenverbrauch ersetzen
      this._c._feedCard = ['hidden', 'pv_self_consumption'].includes(c.feed_in_card) ? c.feed_in_card : '';
      // cost_consumers (optional): Kosten je Verbraucher. Mit grid/battery/pv gemessen, sonst nach dem Mix des Hauses je Stunde
      const ccIcon = (n) => (/auto|kfz|\bev\b|wallbox|lade/i.test(n) ? 'mdi:car-electric' : /wärmepumpe|waermepumpe|\bwp\b/i.test(n) ? 'mdi:heat-pump-outline' : /wasser|boiler/i.test(n) ? 'mdi:water-boiler' : /heiz/i.test(n) ? 'mdi:radiator' : /klima/i.test(n) ? 'mdi:air-conditioner' : 'mdi:flash');
      const ccCol = ['#a78bfa', '#38bdf8', '#fb923c', '#34d399', '#f472b6', '#facc15'];
      // #42: energy darf auch eine Liste sein (Zähler als Text oder { entity, name }). Die Karte addiert sie und zeigt die Teile mit Namen darunter
      const ccParts = (e) => (Array.isArray(e) ? e : []).map((v) => (typeof v === 'string' ? { entity: v } : v && typeof v === 'object' && typeof v.entity === 'string' ? { entity: v.entity, name: v.name } : null)).filter((v) => v && v.entity);
      this._c._cc = lst(c.cost_consumers).filter((x) => x && (x.energy || x.grid)).map((x, i) => {
        const parts = x.grid ? [] : ccParts(x.energy);
        return { icon: ccIcon(x.name || ''), color: ccCol[i % ccCol.length], ...x, _parts: parts.length ? parts : null, energy: parts.length ? '' : x.energy };
      }).filter((x) => x.grid || x._parts || (typeof x.energy === 'string' && x.energy));
      // grid_price_history (optional): frühere Preise. "until" ist JJJJ-MM-TT oder JJJJ-MM, sortiert gilt der erste passende Eintrag
      this._c._ph = lst(c.grid_price_history).filter((x) => x && x.until && typeof x.ct === 'number').map((x) => ({ until: String(x.until), eur: x.ct / 100 })).sort((a, b) => (a.until < b.until ? -1 : 1));
      // grid_base_fee (optional, #57): Grundpreis in Euro pro Monat. grid_base_fee_history: frühere Grundpreise {until, eur}, "until" wie bei grid_price_history
      { const bf = parseFloat(String(c.grid_base_fee).replace(',', '.')); this._c._bf = bf > 0 ? bf : 0; }
      this._c._bfh = lst(c.grid_base_fee_history).filter((x) => x && x.until && !isNaN(parseFloat(String(x.eur).replace(',', '.')))).map((x) => ({ until: String(x.until), eur: Math.max(0, parseFloat(String(x.eur).replace(',', '.'))) })).sort((a, b) => (a.until < b.until ? -1 : 1));
      // hourly_pricing (optional): Geldkacheln Stunde für Stunde mit dem Stundenmittel des Preis-Sensors. Standard: aus, nur mit true und grid_price als Sensor
      this._c._hp = c.hourly_pricing === true && typeof c.grid_price === 'string' && !!c.grid_price.trim();
      this._ccY = null; this._ccV = null; this._hpV = null; this._hpOld = null; this._h5 = {};
      // grid2_total (optional, #29): zweiter Netzzähler (z. B. Wärmepumpe mit eigenem Tarif, nur Bezug) in kWh. Eigener Preis: grid2_price oder grid2_price_ct, sonst der normale
      this._c._g2 = typeof c.grid2_total === 'string' && c.grid2_total ? c.grid2_total : '';
      this._c._g2n = typeof c.grid2_name === 'string' ? c.grid2_name.trim() : '';
      // budget_kwh (optional): Jahresziel für den Netzbezug in kWh (Zahl oder Sensor). budget_profile: linear (Standard) oder history (Soll folgt dem Verlauf des Vorjahres)
      this._c._bud = typeof c.budget_kwh === 'number' ? c.budget_kwh : typeof c.budget_kwh === 'string' && c.budget_kwh.trim() ? c.budget_kwh.trim() : null;
      this._c._budHist = c.budget_profile === 'history';
      // hide (optional, #35): einzelne Bereiche ausblenden. monthly (Diagramm PV-Ertrag pro Monat), amortisation, baseload (Grundlast), footer (Rekordtag, Wirkungsgrad ...), money (die vier Kacheln oben)
      const HIDE = { monthly: 'chart', chart: 'chart', amortisation: 'amo', amortization: 'amo', amortisierung: 'amo', baseload: 'gl', grundlast: 'gl', footer: 'footer', fusszeile: 'footer', money: 'money', kacheln: 'money' };
      this._c._hc = [...new Set(lst(c.hide).reduce((a, x) => a.concat(String(x).split(/[,;\s]+/)), []).map((x) => HIDE[x.trim().toLowerCase()]).filter(Boolean))].map((k) => 'h-' + k).join(' ');
      // start_period (optional): Reiter beim Öffnen. Standard ist der Monat
      this._c._start = ['day', 'week', 'month', 'year'].includes(c.start_period) ? c.start_period : '';
      if (this._c._start && this._startSet !== this._c._start) { this._startSet = this._c._start; this._period = this._c._start === 'week' && !this._c._cc.length ? 'month' : this._c._start; }
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
      setLocale(h, this._c);
      // Sprache erst jetzt bekannt: Monatsnamen und statische Texte neu aufbauen
      const languageChanged = this._bl !== WD.state.lang;
      if (languageChanged) { this._bl = WD.state.lang; fillMon(); this._build(); }
      this._hass = h;
      // Neuer Tag: Stunden seit Mitternacht neu laden, sonst fehlt "Heute" aus den Gesamtzählern bis zum nächsten Laden
      const dn = new Date(), today = new Date(dn.getFullYear(), dn.getMonth(), dn.getDate()).getTime();
      if (!this._loading && (Date.now() - (this._loaded || 0) > 30 * 60 * 1000 || (this._loaded && this._tdDay !== today))) { this._tdDay = today; this._load(); return; }
      if (first || languageChanged || Date.now() - (this._lastR || 0) > 30000) { this._lastR = Date.now(); this._render(); }
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
      <ha-card><div class="wrap${c._hc ? ' ' + c._hc : ''}"${this._tsStyle()}>
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
        <div class="dhint" data-f="dHint" style="display:none"></div>
        <div class="duo">
          <div class="panel amo"><span class="lbl" style="--c:var(--sav)"><i></i>${T('st.amo')}</span>
            <div class="big"><span class="num" data-t="amo">—</span><span class="unit">%</span><span class="earn" data-f="amoEarned">—</span></div>
            <div class="pbar"><div class="pfill"></div></div>
            <div class="meta"><span data-f="amoEta">—</span><span data-f="amoDone"></span></div>
          </div>
          <div class="panel gl"><span class="lbl" style="--c:var(--home)"><i></i>${T('st.base')}</span>
            <div class="big"><span class="num" data-t="gl">—</span><span class="unit">W</span><span class="cost" data-f="glCost"></span></div>
            <div class="nights"></div><div class="nl"></div>
            <div class="tip" data-f="glTip"></div>
          </div>
        </div>
        ${c._bud ? `<div class="panel bud s-ok" style="display:none">
          <span class="lbl" style="--c:var(--imp)"><i></i>${T('st.bud.title')}</span>
          <div class="big"><span class="num" data-t="bud">—</span><span class="unit">%</span><small data-f="budOf"></small></div>
          <div class="pbar"><div class="pfill" data-f="budFill"></div><div class="mk" data-f="budMk"></div></div>
          <div class="bgrid">
            <div><small>${T('st.bud.soll')}</small><b data-f="budSoll">—</b></div>
            <div><small>${T('st.bud.abw')}</small><b data-f="budAbw">—</b><em data-f="budAbwE"></em></div>
            <div><small>${T('st.bud.fc')}</small><b data-f="budFc">—</b></div>
            <div><small>${T('st.bud.fcabw')}</small><b data-f="budFcAbw">—</b><em data-f="budFcAbwE"></em></div>
          </div>
          <div class="hint" data-f="budHint"></div>
        </div>` : ''}
        ${c._cc.length ? `<div class="panel cc" style="display:none">
          <div class="cc-head"><span class="lbl" style="--c:var(--imp)"><i></i>${T('st.cc.title')} · <span data-f="ccP" style="margin-left:4px"></span></span><span class="cc-sum" data-f="ccSum"></span></div>
          <div class="cc-grid">${c._cc.map((x, i) => `<div class="ccard" data-c="${i}" style="--c:${WD.rgb(x.color, '167,139,250')}">
            <div class="cc-top"><span class="ico"><ha-icon icon="${esc(x.icon || 'mdi:flash')}"></ha-icon></span><div class="cc-name"><b>${esc(x.name || x.energy || x.grid || T('st.cc.group'))}</b><small>${T(x.grid ? 'st.cc.meas' : 'st.cc.est')}</small></div><span class="cc-live" data-f="ccL${i}"></span></div>
            <div class="cc-main"><div><div class="cc-val"><span class="num" data-t="ccC${i}">—</span><span class="unit">${cur()}</span></div><span class="cc-cap">${T('st.cc.cost')}</span></div><div class="cc-sav"><div class="cc-val s"><span class="num" data-t="ccS${i}">—</span><span class="unit">${cur()}</span></div><span class="cc-cap">${T('st.cc.saved')}</span></div></div>
            <div class="cc-bar">${['--imp', '--bat', '--pv'].map((s) => `<i style="--s:var(${s})"></i>`).join('')}</div>
            <div class="cc-leg" data-f="ccK${i}"></div>${x._parts ? `<div class="cc-parts" data-f="ccD${i}"></div>` : ''}
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
          <div class="stat"><span class="lbl" style="--c:var(--pv)"><i></i>${T('st.record')} ${now.getFullYear()}</span><div class="sv"><span data-f="recD"></span><b data-f="rec">—</b></div></div>
          <div class="stat"><span class="lbl" style="--c:var(--bat)"><i></i>${T('st.bat')}</span><div class="sv"><span>${T('st.eff')}</span><b data-f="eff">—</b></div></div>
          <div class="stat"><span class="lbl" style="--c:var(--bat)"><i></i>${T('st.cycles')}</span><div class="sv"><span>${T('st.sum')}</span><b data-f="cyc">—</b></div></div>
          <div class="stat"><span class="lbl" style="--c:var(--bat)"><i></i>${T('st.bat')}</span><div class="sv"><span>${T('st.temp')}</span><b data-f="temp">—</b></div></div>
          ${c.battery_soh ? `<div class="stat"><span class="lbl" style="--c:var(--bat)"><i></i>${T('st.bat')}</span><div class="sv"><span>${T('st.soh')}</span><b data-f="soh">—</b></div></div>` : ''}
          <div class="stat"><span class="lbl" style="--c:var(--pv)"><i></i>${T('st.solar')}</span><div class="sv"><span>${T('st.sum')}</span><b data-f="pvAll">—</b></div></div>
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
      if ((!c._cc.length && !c._hp) || !h || !h.callWS) return;
      const now = new Date(), y0 = new Date(now.getFullYear(), 0, 1), m0 = new Date(now.getFullYear(), now.getMonth(), 1), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const w0 = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() - (d0.getDay() + 6) % 7), first = w0 < m0 ? w0 : m0;
      const house = [c.pv_total, c.grid_import_total, c.grid_export_total].concat(c._chg, c._dis).filter(Boolean);
      const mine = (x) => (x.grid ? [x.grid, x.battery, x.pv] : x._parts ? x._parts.map((q) => q.entity) : [x.energy]).filter(Boolean);
      const ids = [...new Set(house.concat(c._g2 ? [c._g2] : [], ...c._cc.map(mine)))];
      const priceId = typeof c.grid_price === 'string' ? c.grid_price : null, nowEur = WD.price(h, c.grid_price, c.grid_price_ct, 0);
      // grid2_total (z. B. Niedertarif-Zaehler): Bezug zaehlt zum Netzbezug, bewertet mit grid2_price, sonst mit dem normalen Preis
      const price2 = WD.price(h, c.grid2_price, c.grid2_price_ct, nowEur);
      const stat = (period, types, list, start, end) => h.callWS({ type: 'recorder/statistics_during_period', start_time: start.toISOString(), ...(end ? { end_time: end.toISOString() } : {}), period, statistic_ids: list, types, ...WD.statUnits(c) });
      const stamp = (r) => (typeof r.start === 'number' ? r.start : Date.parse(r.start));
      const ymd = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
      // je Eintrag: Netz, Batterie, Solar (kWh), Kosten, gespart; bei Teilen (#42) je Teil dazu kWh, Kosten, gespart
      const zero = () => c._cc.map((x) => new Array(5 + (x._parts ? x._parts.length * 3 : 0)).fill(0));
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
          const t = +k, v = at[k], sum = (l) => l.reduce((a, id) => a + (v[id] || 0), 0), pv = v[c.pv_total] || 0, imp0 = v[c.grid_import_total] || 0, g2 = c._g2 ? (v[c._g2] || 0) : 0, imp = imp0 + g2, exp = v[c.grid_export_total] || 0, chg = sum(c._chg), dis = sum(c._dis);
          if (onHour) onHour(t, { pv, imp, exp, chg, dis, imp0 });
          const home = c._ac ? pv + imp - exp : pv + imp - exp - chg + dis, pr0 = rate(t, means), pr = imp > 0 && g2 > 0 ? (imp0 * pr0 + g2 * price2) / imp : pr0;
          const g = home > 0 ? Math.min(1, imp / home) : (imp > 0 ? 1 : 0), b = home > 0 ? Math.min(1 - g, dis / home) : 0;
          c._cc.forEach((x, i) => {
            const en = x._parts ? x._parts.reduce((a2, q) => a2 + (v[q.entity] || 0), 0) : (v[x.energy] || 0);
            const part = x.grid ? [v[x.grid] || 0, v[x.battery] || 0, v[x.pv] || 0] : [en * g, en * b, en * (1 - g - b)];
            const line = [part[0], part[1], part[2], part[0] * pr, (part[1] + part[2]) * pr];
            if (x._parts) x._parts.forEach((q) => { const e1 = v[q.entity] || 0; line.push(e1, e1 * g * pr, e1 * (1 - g) * pr); });
            slots(t).forEach((s) => { for (let n = 0; n < line.length; n++) s[i][n] += line[n]; });
          });
        });
      };
      // split (optional): sammelt die Stunden, in denen der Preis gewechselt hat (Minimum ungleich Maximum)
      const means = async (start, end, id = priceId, split = null) => {
        const out = {};
        if (!id) return out;
        const r = await stat('hour', split ? ['mean', 'min', 'max'] : ['mean'], [id], start, end).catch(() => ({}));
        (r[id] || []).forEach((x) => {
          if (typeof x.mean === 'number') out[stamp(x)] = x.mean;
          if (split && typeof x.min === 'number' && typeof x.max === 'number' && x.max - x.min > 1e-9) split.add(stamp(x));
        });
        return out;
      };
      // hourly_pricing: Geldkacheln je Stunde. Bezug (ohne grid2) und selbst genutzter Solarstrom zum Preis der Stunde, Einspeisung zur Vergütung der Stunde.
      // n zählt die Stunden mit Preisstatistik, ohne sie bleibt die Karte bei der Rechnung je Monat. fn: Stunden mit Statistik der Vergütung
      const feedId = c._hp && typeof c.feed_in === 'string' && c.feed_in ? c.feed_in : null, feedNow = WD.price(h, c.feed_in, c.feed_in_ct, 0);
      const hz = () => ({ imp: 0, cost: 0, self: 0, sav: 0, exp: 0, feed: 0, n: 0, fn: 0 });
      const hMon = (o, t) => { const d = new Date(t), k = key(d.getFullYear(), d.getMonth()); return o[k] || (o[k] = hz()); };
      // Stunden mit Preiswechsel (z. B. Tarifwechsel um 23:30): Bezug und Einspeisung in 5-Minuten-Scheiben bewerten. Ergebnis je Stunde: pi, pf
      // (nach kWh gewichteter Preis), null ohne Bezug bzw. Einspeisung. Die Kurzzeitstatistik gibt es nur purge_keep_days lang (Standard 10 Tage),
      // ältere Stunden behalten das Stundenmittel. Abgeschlossene Stunden merkt sich die Karte (_h5). Neueste zuerst, nahe Stunden in einer Abfrage;
      // ist ein Abschnitt älter als alle mit Daten leer, ist der Rest schon gelöscht
      const HR = 36e5, ids5 = [c.grid_import_total, c.grid_export_total, priceId, feedId].filter(Boolean);
      const slice5 = async (split, m, fm) => {
        const out = {}, todo = [], done = (t) => t + HR <= Date.now();
        [...split].sort((a, b) => b - a).forEach((t) => { const x = this._h5[t]; if (x === undefined || !done(t)) todo.push(t); else if (x) out[t] = x; });
        const ranges = [];
        todo.forEach((t) => { const r = ranges[ranges.length - 1]; if (r && r.a - (t + HR) <= 3 * HR && r.b - t <= 24 * HR) { r.a = t; r.ts.push(t); } else ranges.push({ a: t, b: t + HR, ts: [t] }); });
        for (let i = 0; i < ranges.length; i += 4) {
          const part = ranges.slice(i, i + 4), res = await Promise.all(part.map((r) => stat('5minute', ['mean', 'change'], ids5, new Date(r.a), new Date(r.b)).catch(() => null)));
          const has = res.map((rows) => !!rows && ids5.some((id) => (rows[id] || []).length > 0)), last = has.lastIndexOf(true);
          let gone = false;
          part.forEach((r, j) => {
            const rows = res[j];
            if (!has[j]) {
              // Leer und älter als alles mit Daten: gelöscht. Leer dazwischen (z. B. Recorder aus): nicht merken, nächstes Mal neu versuchen
              if (rows && j > last) { gone = true; r.ts.forEach((t) => { this._h5[t] = null; }); }
              return;
            }
            const at = (id, f) => { const o = {}; (rows[id] || []).forEach((x) => { if (typeof x[f] === 'number') o[stamp(x)] = x[f]; }); return o; };
            const pM = at(priceId, 'mean'), fM = feedId ? at(feedId, 'mean') : {}, iC = at(c.grid_import_total, 'change'), eC = at(c.grid_export_total, 'change');
            const w = (t, C, P, def) => {
              let e = 0, v = 0;
              Object.keys(C).forEach((k) => { const k1 = +k; if (k1 >= t && k1 < t + HR) { const q = Math.max(0, C[k]); e += q; v += q * (P[k] !== undefined ? P[k] : def); } });
              return e > 0 ? v / e : null;
            };
            r.ts.forEach((t) => {
              const x = { pi: w(t, iC, pM, rate(t, m)), pf: feedId ? w(t, eC, fM, fm[t] !== undefined ? fm[t] : feedNow) : null };
              out[t] = x;
              if (done(t)) this._h5[t] = x;
            });
          });
          if (gone) { ranges.slice(i + 4).forEach((r) => r.ts.forEach((t) => { this._h5[t] = null; })); break; }
        }
        return out;
      };
      const hAdd = (b, t, x, m, fm, s5) => {
        const pr = rate(t, m), q = s5 && s5[t], pi = q && typeof q.pi === 'number' ? q.pi : pr, s = Math.max(0, x.pv - x.exp);
        const pf = q && typeof q.pf === 'number' ? q.pf : fm[t] !== undefined ? fm[t] : feedNow;
        b.imp += x.imp0; b.cost += x.imp0 * pi; b.self += s; b.sav += s * pr; b.exp += x.exp; b.feed += x.exp * pf;
        if (m[t] !== undefined) b.n++;
        if (fm[t] !== undefined) b.fn++;
      };
      try {
        const mk = key(now.getFullYear(), now.getMonth());
        let hasStat = false;
        // Langzeit-Ansicht: Jahre vor dem laufenden einmal je Jahr laden, erst ab der ersten Stunde mit Preisstatistik
        if (c._hp && c._lt && (!this._hpOld || this._hpOld.y !== y0.getFullYear())) {
          const ho = {}, sp = new Set(), m = await means(new Date(2000, 0, 1), y0, priceId, sp), t1 = Object.keys(m).reduce((a, k) => Math.min(a, +k), Infinity);
          if (isFinite(t1)) {
            const s0 = new Date(t1), a0 = new Date(s0.getFullYear(), s0.getMonth(), 1), fm = feedId ? await means(a0, y0, feedId, sp) : {}, s5 = await slice5(sp, m, fm);
            add(await stat('hour', ['change'], house.concat(c._g2 ? [c._g2] : []), a0, y0), m, () => [], (t, x) => hAdd(hMon(ho, t), t, x, m, fm, s5));
          }
          this._hpOld = { y: y0.getFullYear(), h: ho };
        }
        if (!this._ccY || this._ccY.k !== mk) {
          const past = zero(), hp = {};
          if (m0 > y0) {
            const sp = c._hp ? new Set() : null, m = await means(y0, m0, priceId, sp), fm = feedId ? await means(y0, m0, feedId, sp) : {}, s5 = sp ? await slice5(sp, m, fm) : {};
            hasStat = Object.keys(m).length > 0;
            add(await stat('hour', ['change'], ids, y0, m0), m, () => [past], c._hp ? (t, x) => hAdd(hMon(hp, t), t, x, m, fm, s5) : null);
          }
          this._ccY = { k: mk, past, hasStat, h: hp };
        }
        const day = zero(), week = zero(), month = zero(), wk = { pv: 0, imp: 0, exp: 0, chg: 0, dis: 0 };
        const hd = hz(), hw = hz(), hm = {};
        const sp = c._hp ? new Set() : null, m = await means(first, null, priceId, sp), fm = feedId ? await means(first, null, feedId, sp) : {}, s5 = sp ? await slice5(sp, m, fm) : {};
        add(await stat('hour', ['change'], ids, first), m, (t) => [t >= m0 && month, t >= w0 && week, t >= d0 && day].filter(Boolean), (t, x) => {
          if (t >= w0) Object.keys(wk).forEach((n) => { wk[n] += x[n]; });
          if (c._hp) { if (t >= m0) hAdd(hMon(hm, t), t, x, m, fm, s5); if (t >= w0) hAdd(hw, t, x, m, fm, s5); if (t >= d0) hAdd(hd, t, x, m, fm, s5); }
        });
        this._ccW = wk;
        this._hpV = c._hp ? { day: hd, week: hw, mon: Object.assign({}, this._hpOld ? this._hpOld.h : {}, this._ccY.h, hm) } : null;
        if (this._hpV) this._hpV.any = hd.n > 0 || hw.n > 0 || Object.keys(this._hpV.mon).some((k) => this._hpV.mon[k].n > 0);
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

    // Jahresbudget (budget_kwh): Netzbezug seit 1. Januar gegen das Jahresziel, Soll bis heute, Hochrechnung
    _renderBud(price) {
      const c = this._c, el = this._$('.bud');
      if (!el) return;
      const M = this._m, goal = val(this._hass, c._bud, 0);
      if (!(goal > 0) || !M || !M.imp) { el.style.display = 'none'; return; }
      const now = new Date(), y = now.getFullYear(), CUR = cur();
      const months = Array.from({ length: now.getMonth() + 1 }, (x, i) => M.imp[key(y, i)]);
      if (months.every((v) => v === undefined)) { el.style.display = 'none'; return; }
      const g2m = (M.g2 || {}), ist = months.reduce((a, v) => a + (v || 0), 0) + Array.from({ length: now.getMonth() + 1 }, (x, i) => g2m[key(y, i)] || 0).reduce((a, v) => a + v, 0);
      // Anteil des Jahres, der bis jetzt vergangen ist: gleichmäßig oder nach dem Verlauf des Vorjahres
      const y0 = new Date(y, 0, 1).getTime(), yl = new Date(y + 1, 0, 1).getTime() - y0;
      let cum = (t) => (t - y0) / yl, mode = 'lin';
      if (c._budHist) {
        const prev = Array.from({ length: 12 }, (x, i) => (M.imp[key(y - 1, i)] === undefined ? undefined : M.imp[key(y - 1, i)] + ((M.g2 || {})[key(y - 1, i)] || 0))), tot = prev.reduce((a, v) => a + (v || 0), 0);
        if (prev.every((v) => typeof v === 'number') && tot > 0) {
          cum = (t) => { const m = new Date(t).getMonth(), m0 = new Date(y, m, 1).getTime(), mf = (t - m0) / (new Date(y, m + 1, 1).getTime() - m0); return (prev.slice(0, m).reduce((a, v) => a + v, 0) + prev[m] * mf) / tot; };
          mode = 'hist';
        }
      }
      // Messdaten erst seit später im Jahr (Zähler spät eingerichtet): Soll und Hochrechnung gelten für den erfassten Zeitraum
      const t0 = this._impStart, late = typeof t0 === 'number' && t0 > y0 + 2 * 864e5 && t0 < now.getTime();
      const share = cum(now.getTime()) - (late ? cum(t0) : 0);
      const soll = goal * share, abw = ist - soll, fc = share > 0.03 ? ist / share : null, fcAbw = fc === null ? null : fc - goal;
      // Farbe: im Soll grün, bis 10 % darüber gelb, darüber rot
      const cls = (d, ref) => (d <= 0 ? 'ok' : ref > 0 && d / ref <= 0.1 ? 'warn' : 'bad');
      const sgn = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + this._fk(Math.abs(v));
      const eur = (v) => (price > 0 ? (v > 0 ? '+' : v < 0 ? '−' : '') + fEur(Math.abs(v * price)) + ' ' + CUR : '');
      el.style.display = '';
      el.className = 'panel bud s-' + cls(abw, soll);
      this._count('bud', ist / goal * 100, 0);
      this._f('budOf', T('st.bud.of', { ist: this._fk(ist), goal: this._fk(goal) }));
      this._f('budSoll', this._fk(soll) + ' kWh');
      this._f('budAbw', `<span class="c-${cls(abw, soll)}">${sgn(abw)} kWh</span>`);
      this._f('budAbwE', eur(abw));
      this._f('budFc', fc === null ? '—' : this._fk(fc) + ' kWh');
      this._f('budFcAbw', fcAbw === null ? '—' : `<span class="c-${cls(fcAbw, goal)}">${sgn(fcAbw)} kWh</span>`);
      this._f('budFcAbwE', fcAbw === null ? '' : eur(fcAbw));
      this._f('budHint', (mode === 'hist' ? T('st.bud.hist', { y: y - 1 }) : T('st.bud.lin')) + (late ? ' · ' + T('st.bud.since', { d: new Date(t0).toLocaleDateString(WD.state.loc, { day: 'numeric', month: 'long', year: 'numeric' }) }) : ''));
      requestAnimationFrame(() => {
        const f = this._$('[data-f="budFill"]'), k = this._$('[data-f="budMk"]');
        if (f) f.style.width = Math.min(100, ist / goal * 100) + '%';
        if (k) k.style.left = Math.min(100, soll / goal * 100) + '%';
      });
    }

    _renderCC(price) {
      const c = this._c, el = this._$('.cc'), V = this._ccV;
      if (!el) return;
      // Nur das aktuelle Jahr: Für "Gesamt" und frühere Jahre gibt es keine Stundenwerte
      const set = V && ['day', 'week', 'month', 'year'].includes(this._period) && !(c._lt && this._period === 'year' && this._years().cur !== new Date().getFullYear()) ? V[this._period] : null;
      // Ohne Stundenwerte bleibt der Bereich stehen und nennt den Grund: Verschwindet er, springen Höhe und Maßstab der ganzen Karte
      el.style.display = V ? '' : 'none';
      if (!V) return;
      const CUR = cur(), dec = (v) => (Math.abs(v) < 100 ? 2 : 0), fk = (v) => (set ? this._fk(v) : '—'), tab = this._$('.tab.on'), priced = set && this._ccPriced;
      this._f('ccP', tab ? esc(tab.textContent) : '');
      let cost = 0, sav = 0;
      c._cc.forEach((x, i) => {
        const [g, b, p, cost1, sav1] = set ? set[i] : [0, 0, 0, 0, 0], tot = g + b + p, card = this._$(`.ccard[data-c="${i}"]`);
        const bad = this._ccBad && this._ccBad[i];
        if (!bad) { cost += cost1; sav += sav1; }
        this._count(`ccC${i}`, priced && !bad ? cost1 : null, dec(cost1));
        this._count(`ccS${i}`, priced && !bad ? sav1 : null, dec(sav1));
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
        if (x._parts) {
          const st = this._hass && this._hass.states;
          this._f(`ccD${i}`, x._parts.map((q, j) => {
            const o = set ? set[i].slice(5 + j * 3, 8 + j * 3) : [0, 0, 0], nm = q.name || (st && st[q.entity] && st[q.entity].attributes && st[q.entity].attributes.friendly_name) || q.entity;
            return `<span title="${esc(q.entity)}">${esc(nm)}</span><b class="k">${fk(o[0])} kWh</b><b>${priced ? `${nf(o[1], dec(o[1]))} ${CUR}` : '—'}</b>`;
          }).join(''));
        }
        const w = live(this._hass, x.power), on = w !== null && w > (x.on_w === undefined ? 10 : x.on_w), lv = this._$(`[data-f="ccL${i}"]`);
        lv.classList.toggle('on', on);
        if (on) this._f(`ccL${i}`, `${nf(w, 0)} W${price > 0 ? ' · ' + T('st.cc.upto', { x: nf(w / 1000 * price, 2), cur: CUR }) : ''}`);
      });
      this._f('ccSum', !set ? T('st.cc.nohist') : priced ? `<span class="cc-p">${T('st.cc.cost')} <b>${nf(cost, dec(cost))} ${CUR}</b></span><span class="cc-p">${T('st.cc.saved')} <b class="s">${nf(sav, dec(sav))} ${CUR}</b></span>` : '');
    }

    async _load() {
      const h = this._hass, c = this._c;
      if (!h || !h.callWS) return;
      this._loading = true;
      try {
        const now = new Date();
        const ids = [c.pv_total, c.grid_import_total, c.grid_export_total, c._hist, c._g2].concat(c._chg, c._dis).filter(Boolean);
        const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()), recIds = [...new Set([c.pv_today, c.pv_total].filter(Boolean))];
        const totIds = [c.pv_total, c.grid_import_total, c.grid_export_total, c._g2].concat(c._chg, c._dis).filter(Boolean);
        const [mon, day, hr, tdy] = await Promise.all([
          h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(c._lt ? 2000 : now.getFullYear() - 1, 0, 1).toISOString(), period: 'month', statistic_ids: ids, types: ['change'], ...WD.statUnits(c) }),
          h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(now.getFullYear(), 0, 1).toISOString(), period: 'day', statistic_ids: [...new Set([...recIds, c.grid_import_total].filter(Boolean))], types: ['change'], ...WD.statUnits(c) }),
          c.home_power ? h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(Date.now() - 8 * 864e5).toISOString(), period: 'hour', statistic_ids: [c.home_power], types: ['mean'], ...WD.statUnits(c) }) : Promise.resolve({}),
          // ab 23 Uhr gestern: die letzte Stunde vor Mitternacht liefert den Zählerstand zum Tagesbeginn
          h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(d0.getTime() - 36e5).toISOString(), period: 'hour', statistic_ids: totIds, types: ['change', 'state'], ...WD.statUnits(c) }).catch(() => ({})),
        ]);
        // "Heute" aus den Gesamtzählern: Summe der Stunden seit Mitternacht und Zählerstand am Ende der letzten Stunde (dazu kommt beim Anzeigen der Live-Wert)
        this._td = {}; this._tdDay = d0.getTime();
        totIds.forEach((id) => {
          const rows = (tdy && tdy[id]) || [];
          if (!rows.length) return;
          let sum = 0, last = null;
          rows.forEach((r) => {
            const t = typeof r.start === 'number' ? r.start : Date.parse(r.start);
            if (t >= d0.getTime() && typeof r.change === 'number') sum += Math.max(0, r.change);
            if (typeof r.state === 'number') last = r.state;
          });
          this._td[id] = { sum, last, day: d0.getTime() };
        });
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
        this._m = { pv: byMonth(c.pv_total), imp: byMonth(c.grid_import_total), exp: byMonth(c.grid_export_total), chg: sumM(c._chg), dis: sumM(c._dis), g2: c._g2 ? byMonth(c._g2) : {} };
        // Beginn der Messdaten des Netzbezugs im laufenden Jahr (Jahresbudget: erst später eingerichtete Zähler)
        const ir = (day && day[c.grid_import_total]) || [];
        this._impStart = ir.length ? (typeof ir[0].start === 'number' ? ir[0].start : Date.parse(ir[0].start)) : null;
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
        // Beide Quellen werten, der höhere Wert gewinnt: Ein neuer Tagessensor hat oft erst wenige Tage Verlauf, der Gesamtzähler reicht weiter zurück (#26)
        recIds.forEach((id) => {
          let prevT = null;
          const daily = id === c.pv_today;
          (day[id] || []).forEach((r) => {
            const t = typeof r.start === 'number' ? r.start : Date.parse(r.start);
            const ok = daily || (prevT !== null && Math.abs(t - prevT - 864e5) < 3 * 36e5);
            prevT = t;
            if (ok && r.change > 0 && r.change < 500 && (!rec || r.change > rec.v)) rec = { v: r.change, t };
          });
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
    _fk(v) { return fKwh(v, this._dec.e); }
    _fp(v) { return fPct(v, this._dec.q); }
    // #40: text_size wie in der Energiefluss-Karte. gross/sehr_gross vergrößern die kleinen Texte, eine Zahl (z. B. 2) auch die großen Werte. #73: dazu eigene Farben (colors)
    _tsStyle() {
      const v = String(this._c.text_size == null ? '' : this._c.text_size).trim();
      // #81: ohne colors.battery gilt colors.battery_charge (wie die Ladefarbe im Energiefluss)
      const col = this._c.colors && typeof this._c.colors === 'object' && !this._c.colors.battery && this._c.colors.battery_charge ? Object.assign({}, this._c.colors, { battery: this._c.colors.battery_charge }) : this._c.colors;
      let st = WD.colorVars(col, { pv: '--pv', grid_import: '--imp', grid_export: '--exp', battery: '--bat', home: '--home' });
      if (v === 'gross') st += '--ts:1.25;';
      else if (v === 'sehr_gross') st += '--ts:1.5;';
      else if (v && v !== 'normal') {
        const n = parseFloat(v.replace(',', '.'));
        if (!isNaN(n) && n > 0) { const f = Math.min(4, Math.max(0.5, n)); st += `--ts:${f};--vs:${f};`; }
      }
      return st ? ` style="${st}"` : '';
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
      if (this._period === 'all' || (this._period === 'year' && yr !== new Date().getFullYear())) lines.push(T(this._hpUsed ? 'st.lt.price.h' : 'st.lt.price'));
      return lines.join(' · ');
    }

    // Seit Mitternacht laut Gesamtzähler: Stunden aus der Statistik plus Zuwachs seit der letzten Stunde (Live-Wert). null ohne Statistik von heute
    _tot(id) {
      const x = this._td && this._td[id], n = new Date();
      if (!id || !x || x.day !== new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()) return null;
      const v = WD.kwh(this._hass, id, WD.rawUnits(this._c));
      let extra = 0;
      if (v !== null && x.last !== null) extra = v >= x.last ? v - x.last : v; // kleiner als zuletzt: Zähler wurde zurückgesetzt
      return x.sum + extra;
    }
    // "Heute": Tagessensor, wenn eingetragen und mit Wert, sonst aus dem Gesamtzähler gerechnet. this._dHints nennt fehlende oder unpassende Sensoren
    _dayVals() {
      const c = this._c, h = this._hass, raw = WD.rawUnits(c), en = (id) => WD.kwh(h, id, raw), hints = [];
      const sumL = (l, f) => { let t = null; for (const id of l) { const v = f(id); if (v === null) return null; t = (t || 0) + v; } return t; };
      const one = (k, daily, totals) => {
        const dl = daily.filter(Boolean), tl = totals.filter(Boolean);
        const tv = tl.length ? sumL(tl, (id) => this._tot(id)) : null;
        if (!dl.length) return tv;
        const dv = sumL(dl, en);
        if (dv === null) {
          const bad = dl.find((id) => en(id) === null);
          hints.push(T(tv === null ? 'st.d.none' : 'st.d.nonefb', { n: T('st.n.' + k), id: esc(bad) }));
          return tv;
        }
        // Tageswert viel größer als der Zuwachs des Gesamtzählers seit Mitternacht, oder ohne Vergleich unmöglich groß: vermutlich ein Gesamtzähler
        if ((tv !== null && dv > tv + Math.max(5, tv * 2)) || (tv === null && dv > 1000)) hints.push(T('st.d.big', { n: T('st.n.' + k), id: esc(dl.join(', ')), v: fKwh(dv) }));
        return dv;
      };
      const v = {
        pv: one('pv', [c.pv_today], [c.pv_total]), imp: one('imp', [c.import_today], [c.grid_import_total]), exp: one('exp', [c.export_today], [c.grid_export_total]),
        chg: one('chg', c._chgD, c._chg) || 0, dis: one('dis', c._disD, c._dis) || 0, label: T('st.today'),
      };
      v.g2 = c._g2 ? this._tot(c._g2) || 0 : 0;
      if (v.pv !== null && v.exp !== null && v.exp > v.pv + v.dis + 0.5 && !hints.some((x) => x.includes(T('st.n.exp')))) hints.push(T('st.d.exp', { e: fKwh(v.exp), p: fKwh(v.pv) }));
      this._dHints = hints;
      return v;
    }
    // #53: Preis eines Monats (Schlüssel JJJJ-MM) aus grid_price_history, Mittel über seine Tage (laufender Monat bis heute).
    // Tage nach dem letzten Eintrag kosten den heutigen Preis. Ohne grid_price_history: null, dann gilt überall der heutige Preis
    _monthPrice(k, nowEur) {
      const ph = this._c._ph;
      if (!ph.length) return null;
      const [y, m] = k.split('-').map(Number), now = new Date();
      const last = y === now.getFullYear() && m === now.getMonth() + 1 ? now.getDate() : new Date(y, m, 0).getDate();
      let sum = 0;
      for (let d = 1; d <= last; d++) {
        const day = `${k}-${String(d).padStart(2, '0')}`, hit = ph.find((x) => day.slice(0, x.until.length) <= x.until);
        sum += hit ? hit.eur : nowEur;
      }
      return sum / last;
    }
    // #57: Grundpreis (Euro pro Monat) anteilig je Tag, mit grid_base_fee_history wie beim Arbeitspreis. Laufender Monat bis heute.
    // Gilt für Heute, Woche (ab Montag), Monat, Jahr und Gesamt in Stromkosten Netz. Ohne Eintrag: 0
    _baseFee(p) {
      const c = this._c;
      if (!(c._bf > 0) && !c._bfh.length) return 0;
      const now = new Date(), pad = (n) => String(n).padStart(2, '0');
      const dayFee = (y, m, d) => {
        const ds = `${y}-${pad(m)}-${pad(d)}`, hit = c._bfh.find((x) => ds.slice(0, x.until.length) <= x.until);
        return (hit ? hit.eur : c._bf) / new Date(y, m, 0).getDate();
      };
      const monthFee = (k) => {
        const [y, m] = k.split('-').map(Number), last = y === now.getFullYear() && m === now.getMonth() + 1 ? now.getDate() : new Date(y, m, 0).getDate();
        let s = 0;
        for (let d = 1; d <= last; d++) s += dayFee(y, m, d);
        return s;
      };
      if (this._period === 'day') return dayFee(now.getFullYear(), now.getMonth() + 1, now.getDate());
      if (this._period === 'week') {
        const back = (now.getDay() + 6) % 7;
        let s = 0;
        for (let i = 0; i <= back; i++) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i); s += dayFee(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
        return s;
      }
      return (p && p.ks ? p.ks : []).reduce((a, k) => a + monthFee(k), 0);
    }
    // hourly_pricing: Geldwerte aus den Stundensummen. Was die Stunden noch nicht enthalten (laufende Stunde, Lücken), zählt zum heutigen Preis,
    // Monate ohne Preisstatistik wie bisher. null, wenn im Zeitraum keine Stunde eine Preisstatistik hat
    _hourly(p, price, feed) {
      const V = this._hpV;
      if (!V || !this._c._hp) return null;
      const one = (b, imp, self, exp, pr) => (b && b.n ? { cost: b.cost + Math.max(0, imp - b.imp) * pr, sav: b.sav + Math.max(0, self - b.self) * pr, feed: b.feed + Math.max(0, exp - b.exp) * feed, fs: b.fn > 0, self: Math.max(b.self, self) } : null);
      if (!p.ks) return one(this._period === 'day' ? V.day : this._period === 'week' ? V.week : null, p.imp, Math.max(0, p.pv - p.exp), p.exp, price);
      const M = this._m, out = { cost: 0, sav: 0, feed: 0, fs: false, self: 0 };
      let any = false;
      p.ks.forEach((k) => {
        const mp = this._monthPrice(k, price), pr = mp === null ? price : mp, imp = M.imp[k] || 0, exp = M.exp[k] || 0, self = Math.max(0, (M.pv[k] || 0) - exp);
        const r = one(V.mon[k], imp, self, exp, pr) || { cost: imp * pr, sav: self * pr, feed: exp * feed, self };
        if (V.mon[k] && V.mon[k].n) any = true;
        if (V.mon[k] && V.mon[k].fn) out.fs = true;
        out.cost += r.cost; out.sav += r.sav; out.feed += r.feed; out.self += r.self;
      });
      return any ? out : null;
    }
    // Werte für einen Zeitraum: pv, imp, exp, chg, dis (kWh)
    _periodVals() {
      const c = this._c, h = this._hass, M = this._m, now = new Date();
      if (this._period === 'day') return this._dayVals();
      if (this._period === 'week') return this._ccW ? { ...this._ccW, label: T('st.week') } : null;
      if (!M) return null;
      if (c._lt && this._period !== 'month') {
        const yr = this._years().cur;
        const lks = this._complete().filter((k) => this._period === 'all' || k.startsWith(yr + '-'));
        if (!lks.length) return null;
        const lsum = (o) => lks.reduce((a, k) => a + (o[k] || 0), 0);
        return { ks: lks, pv: lsum(M.pv), imp: lsum(M.imp), exp: lsum(M.exp), chg: lsum(M.chg), dis: lsum(M.dis), g2: lsum(M.g2 || {}), label: this._period === 'all' ? T('st.all') : String(yr) };
      }
      const ks = this._period === 'month' ? [key(now.getFullYear(), now.getMonth())] : Array.from({ length: now.getMonth() + 1 }, (x, i) => key(now.getFullYear(), i));
      const sum = (o) => ks.reduce((a, k) => a + (o[k] || 0), 0);
      return { ks, pv: sum(M.pv), imp: sum(M.imp), exp: sum(M.exp), chg: sum(M.chg), dis: sum(M.dis), g2: sum(M.g2 || {}), label: this._period === 'month' ? MONL[now.getMonth()] : String(now.getFullYear()) };
    }

    // Anteil der geladenen Energie, der in der Batterie verloren geht (0 bis 1): battery_efficiency, sonst aus den Gesamtzählern (Entladung durch Ladung, wie die Anzeige "Wirkungsgrad"). null: Option aus, pv_ac oder keine Daten
    _lossK(h) {
      const c = this._c;
      if (!c._bl || c._ac) return null;
      if (c._ef !== null) return 1 - c._ef;
      if (c._efE) {
        const st = h.states && h.states[c._efE], v = st ? parseFloat(String(st.state).replace(',', '.')) : NaN, f = v > 1 ? v / 100 : v;
        if (f >= 0.5 && f <= 1) return 1 - f;
      }
      const ch = this._sumKwh(h, c._chg), di = this._sumKwh(h, c._dis);
      return ch > 0 && di > 0 ? Math.max(0, 1 - di / ch) : null;
    }
    _sumKwh(h, list) { let t = null; (list || []).forEach((id) => { const v = WD.kwh(h, id, WD.rawUnits(this._c)); if (v !== null && v !== undefined) t = (t || 0) + v; }); return t; }

    _render() {
      const c = this._c, h = this._hass;
      if (!h) return;
      const price = WD.price(h, c.grid_price, c.grid_price_ct, 0), feed = WD.price(h, c.feed_in, c.feed_in_ct, 0), CUR = cur();
      this.shadowRoot.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.p === this._period));
      this._renderCC(price);
      this._renderBud(price);
      // Geld
      const p = this._periodVals();
      this._hpUsed = false;
      if (p && p.pv !== null && p.imp !== null && p.exp !== null) {
        const self = Math.max(0, p.pv - p.exp);
        // grid2: Bezug des zweiten Zählers zählt zum Netzbezug und zum Verbrauch, zu seinem eigenen Preis
        const g2 = p.g2 || 0, price2 = WD.price(h, c.grid2_price, c.grid2_price_ct, price), impT = p.imp + g2;
        // #53: Mit grid_price_history zählt jeder Monat mit seinem damaligen Preis (Bezug und selbst genutzter Solarstrom), sonst der heutige Preis
        let impEur = p.imp * price, savEur = self * price, feedEur = p.exp * feed;
        const hr = this._hourly(p, price, feed);
        this._hpUsed = !!hr;
        if (hr) { impEur = hr.cost; savEur = hr.sav; feedEur = hr.feed; } else if (p.ks && c._ph.length && price > 0) {
          const M = this._m;
          let ie = 0, se = 0, sk = 0;
          p.ks.forEach((k) => { const pr = this._monthPrice(k, price), s1 = Math.max(0, (M.pv[k] || 0) - (M.exp[k] || 0)); ie += (M.imp[k] || 0) * pr; se += s1 * pr; sk += s1; });
          impEur = ie; savEur = sk > 0 ? se / sk * self : savEur;
        }
        // battery_losses: Die in der Batterie verlorene Energie hat nichts gespart (Ladung des Zeitraums mal Verlustanteil), anteilig vom Geldwert abziehen
        { const kL = this._lossK(h); if (kL && self > 0) { const lost = Math.min(self, (p.chg || 0) * kL); savEur *= (self - lost) / self; } }
        const baseFee = this._baseFee(p), costT = impEur + g2 * price2 + baseFee;
        const cons = c._ac ? p.pv + impT - p.exp : p.pv + impT - p.exp - p.chg + p.dis;
        // Mit Stundenpreisen auch bei heutigem Preis 0 oder darunter zeigen (dynamische Tarife), sonst wie bisher ausblenden
        this._count('pvsav', hr || price > 0 ? savEur : null, savEur < 100 ? 2 : 0);
        this._count('feed', (hr && hr.fs) || feed > 0 ? feedEur : null, feedEur < 100 ? 2 : 0);
        this._count('cost', hr || price > 0 || baseFee > 0 ? costT : null, costT < 100 ? 2 : 0);
        this._count('aut', cons > 0 ? Math.max(0, Math.min(1, 1 - impT / cons)) * 100 : null, this._dec.q || 0);
        // #66: Zeilen wie die Fußzeile, Text links, Wert rechts
        const kv = (l, v) => `<div class="kv"><span>${l}</span><b>${v}</b></div>`;
        // Mit Stundenwerten die selbst genutzten kWh, auf denen die Ersparnis beruht: Einspeisung aus der Batterie außerhalb der Solarstunden zieht dann nichts ab
        this._f('pvsavSub', kv(T('st.r.pv'), this._fk(p.pv) + ' kWh') + kv(T('st.r.self'), this._fk(hr ? hr.self : self) + ' kWh')); // #72: auch die Erzeugung
        this._f('feedSub', kv(T('st.r.fed'), this._fk(p.exp) + ' kWh'));
        this._count('selfc', p.pv > 0 ? Math.max(0, Math.min(1, 1 - p.exp / p.pv)) * 100 : null, this._dec.q || 0);
        this._f('selfcSub', kv(T('st.r.pv'), this._fk(p.pv) + ' kWh') + kv(T('st.r.self'), this._fk(self) + ' kWh'));
        this._f('costSub', kv(T('st.r.drawn'), this._fk(impT) + ' kWh') + (g2 > 0 && price2 > 0 ? kv(T('st.g2of', { n: esc(c._g2n || T('st.g2name')) }), fEur(g2 * price2) + ' ' + CUR) : '') + (baseFee > 0 ? kv(T('st.basefee'), fEur(baseFee) + ' ' + CUR) : ''));
        this._f('autSub', kv(T('st.r.selfq'), p.pv > 0 ? this._fp(1 - p.exp / p.pv) : '—') + kv(T('st.r.cons'), this._fk(cons) + ' kWh'));
      } else if (this._period === 'day' || (this._m && (c._lt || this._period === 'week'))) {
        // Zeitraum ohne Werte: keine 0 und keinen Wert aus dem vorigen Zeitraum stehen lassen (#28: "Heute" zeigte sonst den Monat)
        ['pvsav', 'feed', 'selfc', 'cost', 'aut'].forEach((k) => { this._count(k, null); this._f(k + 'Sub', T('st.nodata2')); });
      }
      const hn = this._$('[data-f="dHint"]'), hl = this._period === 'day' ? this._dHints || [] : [];
      if (hn) { hn.style.display = hl.length ? '' : 'none'; this._f('dHint', hl.map((x) => `<span><ha-icon icon="mdi:alert-outline"></ha-icon>${x}</span>`).join('')); }
      // Amortisation (Lebensdauer-Zähler, heutige Preise)
      const inv = val(h, c.investment, typeof c.investment_eur === 'number' ? c.investment_eur : 0);
      // Ohne Anschaffungskosten gibt es keine Amortisation: Kachel ausblenden, Grundlast nimmt die ganze Breite
      const noInv = !c.investment && !(c.investment_eur > 0);
      const amoP = this._$('.amo'), duo = this._$('.duo');
      if (amoP) amoP.style.display = noInv ? 'none' : '';
      if (duo) duo.classList.toggle('one', noInv);
      // pv_lifetime (optional, #28): durchlaufender Zähler für Amortisation und "PV gesamt", wenn pv_total täglich auf 0 geht
      const pvT = WD.kwh(h, c.pv_lifetime || c.pv_total, WD.rawUnits(c)), expT = c.grid_export_total ? WD.kwh(h, c.grid_export_total, WD.rawUnits(c)) : 0;
      if (inv > 0 && price > 0 && pvT !== null && expT !== null) {
        // earned_before(_eur): vor Beginn der Zähler bereits erwirtschaftet (z. B. Anlage älter als die Home-Assistant-Daten)
        const before = Math.max(0, val(h, c.earned_before, typeof c.earned_before_eur === 'number' ? c.earned_before_eur : 0));
        const kL = this._lossK(h), lossLife = kL ? (this._sumKwh(h, c._chg) || 0) * kL : 0;
        const earned = Math.max(0, pvT - expT - lossLife) * price + expT * feed + before;
        const pct = earned / inv;
        this._count('amo', Math.min(100, pct * 100), 0);
        requestAnimationFrame(() => { const f = this._$('.pfill'); if (f) f.style.width = Math.min(100, pct * 100) + '%'; });
        this._f('amoEarned', T('st.earned', { e: fEur(earned), i: fEur(inv), cur: CUR }));
        let eta = '', done = '';
        if (this._m && pct < 1) {
          const now = new Date();
          let pv12 = 0, ex12 = 0, ch12 = 0, n = 0;
          for (let i = 1; i <= 12; i++) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const k = key(d.getFullYear(), d.getMonth()); if (this._m.pv[k] !== undefined) { pv12 += this._m.pv[k]; ex12 += this._m.exp[k] || 0; ch12 += (this._m.chg && this._m.chg[k]) || 0; n++; } }
          if (n >= 6) {
            const perYear = (Math.max(0, pv12 - ex12 - (kL ? ch12 * kL : 0)) * price + ex12 * feed) * 12 / n;
            const yrs = (inv - earned) / perYear;
            // unrealistisch weit weg (oder kein Ertrag): keine Jahreszahl nennen
            if (!isFinite(yrs) || yrs > 60) eta = T('st.eta.far');
            else { eta = T('st.eta', { y: fEur(perYear), cur: CUR }); done = T('st.eta.d', { yr: now.getFullYear() + Math.ceil(yrs) }); }
          }
        } else if (pct >= 1) eta = T('st.paid');
        this._f('amoEta', eta);
        this._f('amoDone', done);
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
      if (this._rec) { this._f('rec', `${nf(this._rec.v, 1)}<small>kWh</small>`); this._f('recD', T('st.recon', { d: new Date(this._rec.t).toLocaleDateString(WD.state.loc, { day: '2-digit', month: '2-digit' }) })); }
      const sumT = (list) => { let t = null; list.forEach((id) => { const v = WD.kwh(h, id, WD.rawUnits(c)); if (v !== null && v !== undefined) t = (t || 0) + v; }); return t; };
      const chT = sumT(c._chg), diT = sumT(c._dis);
      if (chT && diT) this._f('eff', `${nf(diT / chT * 100, 1)}<small>%</small>`);
      if (chT && c.battery_capacity_kwh) this._f('cyc', nf(chT / c.battery_capacity_kwh, 0));
      const tmp = live(h, c.battery_temp);
      if (tmp !== null) this._f('temp', `${nf(tmp, 1)}<small>°C</small>`);
      // battery_soh (optional, #100): Gesundheit der Batterie in Prozent, direkt aus dem Sensor
      if (c.battery_soh) { const soh = live(h, c.battery_soh); if (soh !== null) this._f('soh', `${nf(soh, soh % 1 ? 1 : 0)}<small>%</small>`); }
      const pvAll = this._m && this._m.pvAll !== undefined ? this._m.pvAll : pvT;
      if (pvAll !== null) this._f('pvAll', `${nf(pvAll / 1000, 1)}<small>MWh</small>`);
      // Preis unter 1 Cent: vermutlich in Euro statt Cent eingetragen (grid_price_ct erwartet Cent, z. B. 23.88)
      // Mit Stundenpreisen ist ein heutiger Preis von 0 oder darunter kein fehlender Preis, und der Hinweis auf Cent passt nicht
      const hpAny = !!(this._c._hp && this._hpV && this._hpV.any);
      this._f('note', price > 0 || hpAny ? T('st.note', { p: nf(price * 100, 1), f: nf(feed * 100, 1), g: T(this._c._bf > 0 || this._c._bfh.length ? 'st.note.fee' : 'st.note.nofee') }) + (price < 0.01 && !hpAny ? '<br>' + T('st.price.warn', { p: nf(price * 100, 2) }) : '') : T('st.noprice'));
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
      if (M.hist[k]) { el.innerHTML = `<b>${MONL[i]} ${cy}</b> · <i class="dd" style="--c:var(--pv)"></i>${T('st.cc.pv')} <b>${this._fk(M.pvC[k])} kWh</b> (${esc(this._c.pv_history_name || T('st.hist'))})`; return; }
      const cons = M.pv[k] + (M.imp[k] || 0) - (M.exp[k] || 0) - (this._c._ac ? 0 : (M.chg[k] || 0) - (M.dis[k] || 0));
      const aut = cons > 0 ? 1 - (M.imp[k] || 0) / cons : null;
      // Im laufenden Monat stünden angefangene Tage gegen den ganzen Vorjahresmonat (#14)
      const running = k === key(new Date().getFullYear(), new Date().getMonth());
      const d = M.pvC[kp] && !running ? (M.pv[k] - M.pvC[kp]) / M.pvC[kp] : null;
      const dd = (col) => `<i class="dd" style="--c:var(${col})"></i>`;
      el.innerHTML = `<b>${MONL[i]} ${cy}</b> · ${dd('--pv')}${T('st.cc.pv')} <b>${this._fk(M.pv[k])} kWh</b>${d !== null ? ` (${d >= 0 ? '+' : '−'}${nf(Math.abs(d) * 100, 0)} % ${T('st.vsprev')})` : ''} · ${dd('--imp')}${T('st.import')} <b>${this._fk(M.imp[k])} kWh</b> · ${dd('--exp')}${T('st.export')} <b>${this._fk(M.exp[k])} kWh</b> · ${dd('--home')}${T('st.aut')} <b>${this._fp(aut)}</b>`;
    }
  }

  if (!customElements.get('energy-cockpit-stats-card')) {
    customElements.define('energy-cockpit-stats-card', EnergyCockpitStatsCard);
    window.customCards = window.customCards || [];
    window.customCards.push({ type: 'energy-cockpit-stats-card', name: 'energy-cockpit Statistik', description: 'Geld, Amortisation, Grundlast, Monatsvergleich, Batterie', preview: true });
  }
})();
