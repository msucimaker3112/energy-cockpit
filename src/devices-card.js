/* energy-cockpit-devices-card (abgeleitet aus devices-card v1.4.0) – Geräte & Verbrauch: Raum-Kacheln mit Live-Leistung, Schalten, Standby-Detektiv, Statistik Tag/Woche/Monat/Jahr mit stündlichem Strommix (PV/Akku vs. Netz) */
(() => {
  const { nf, esc, rgb, haNavigate, T, setLocale, cur } = WD;
  const num = (h, id) => {
    const s = h && id && h.states[id];
    if (!s || ['unavailable', 'unknown', ''].indexOf(s.state) >= 0) return null;
    const v = parseFloat(s.state);
    if (isNaN(v)) return null;
    const u = s.attributes.unit_of_measurement;
    return u === 'kW' ? v * 1000 : v;
  };
  const fW = (w) => (w === null ? '—' : w >= 1000 ? nf(w / 1000, 2) + ' kW' : nf(w, w < 10 && w % 1 ? 1 : 0) + ' W');
  const dur = (ms) => { const m = Math.max(1, Math.round(ms / 60000)); if (m < 60) return m + ' min'; const h = Math.floor(m / 60); if (h < 48) return h + ' h' + (m % 60 && h < 10 ? ' ' + (m % 60) + ' min' : ''); return Math.round(h / 24) + ' ' + T('dev.days'); };
  // Gerätetypen: Farbe, Icon, Animation
  const TYPES = {
    light: { c: '250,204,21', i: 'mdi:lightbulb' },
    pump: { c: '56,189,248', i: 'mdi:pump', spin: 1 },
    fridge: { c: '125,211,252', i: 'mdi:fridge-outline' },
    dryer: { c: '192,132,252', i: 'mdi:tumble-dryer', spin: 1 },
    ac: { c: '34,211,238', i: 'mdi:air-conditioner', spin: 1 },
    strip: { c: '251,146,60', i: 'mdi:power-socket-eu' },
    tv: { c: '129,140,248', i: 'mdi:television' },
    media: { c: '129,140,248', i: 'mdi:television-ambient-light' },
    console: { c: '96,165,250', i: 'mdi:sony-playstation' },
    coffee: { c: '217,151,84', i: 'mdi:coffee-maker-outline' },
    heat: { c: '248,113,113', i: 'mdi:radiator' },
    plug: { c: '148,163,184', i: 'mdi:power-plug-outline' },
  };
  const PERIODS = [['day', 'dev.p.day'], ['week', 'dev.p.week'], ['month', 'dev.p.month'], ['year', 'dev.p.year']];
  const PLBL = { day: 'dev.l.day', week: 'dev.l.week', month: 'dev.l.month', year: 'dev.l.year' };
  const perStart = (k) => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    if (k === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    if (k === 'month') d.setDate(1);
    if (k === 'year') { d.setMonth(0); d.setDate(1); }
    return d;
  };
  const fK = (v) => nf(v, v < 10 ? 2 : v < 100 ? 1 : 0);
  const PAL = ['250,204,21', '56,189,248', '192,132,252', '34,211,238', '251,146,60', '129,140,248', '248,113,113', '52,211,153', '244,114,182', '217,151,84'];

  const CSS = `
${WD.themeCss()}:host{display:block;--ok:52,211,153;--sun:250,204,21}
ha-card{background:radial-gradient(130% 90% at 50% 0%,var(--bg1) 0%,var(--bg0) 62%);border-radius:28px;overflow:hidden;border:1px solid rgba(var(--ov),.06);color:var(--txt);font-family:Inter,var(--ha-font-family-body,system-ui),sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:22px 26px;position:relative;transform-origin:0 0;box-sizing:border-box;display:flex;flex-direction:column}
.wrap:before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;background:radial-gradient(35% 30% at 12% 8%,rgba(250,204,21,.07),transparent 70%),radial-gradient(40% 35% at 90% 85%,rgba(56,189,248,.07),transparent 70%)}
header{display:flex;align-items:center;flex-wrap:wrap;position:relative;margin-bottom:16px}
.title{display:flex;align-items:center;font-size:1.25rem;font-weight:750;letter-spacing:-.01em}
.title .ico{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(251,146,60,.16);color:rgb(251,146,60);margin-right:12px}
.title .ico ha-icon{--mdc-icon-size:20px;display:flex}
.title small{display:block;font-size:.74rem;font-weight:550;color:rgb(var(--mut));margin-top:2px;letter-spacing:0}
.navbtn{margin-left:auto;cursor:pointer;color:var(--txt);font-weight:650;background:rgba(var(--ov),.07);border:1px solid rgba(var(--ov),.14);padding:8px 14px;border-radius:999px;font-size:.8rem;-webkit-tap-highlight-color:transparent}
.navbtn:active{background:rgba(var(--ov),.18)}
.hero{position:relative;display:flex;align-items:center;padding:16px 20px;border-radius:22px;background:linear-gradient(160deg,rgba(var(--ov),.07),rgba(var(--ov),.015)),var(--panel);border:1px solid var(--stroke);margin-bottom:16px}
.kpi{flex:none;margin-right:22px;min-width:150px}
.kpi .big{font-size:2.5rem;font-weight:850;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.kpi .big u{text-decoration:none;font-size:1.05rem;font-weight:700;color:rgb(var(--mut));margin-left:5px}
.kpi .l{font-size:.72rem;color:rgb(var(--mut));margin-top:5px}
.kpi .l b{color:var(--txt);font-weight:650}
.hb{flex:1;min-width:0}
.bar{position:relative;display:flex;height:18px;border-radius:999px;overflow:hidden;background:rgba(var(--ov),.05)}
.seg{height:100%;width:0;transition:width 1.2s cubic-bezier(.2,.8,.2,1);background:linear-gradient(180deg,rgba(var(--c),1),rgba(var(--c),.65));position:relative}
.seg+.seg{box-shadow:inset 2px 0 0 var(--panel)}
.seg.rest{background:repeating-linear-gradient(-45deg,rgba(var(--ov),.13) 0 6px,rgba(var(--ov),.05) 6px 12px)}
.seg:after{content:'';position:absolute;top:0;left:0;right:0;height:45%;background:linear-gradient(180deg,rgba(var(--ov),.35),rgba(var(--ov),0))}
.seg.rest:after{display:none}
.leg{display:flex;flex-wrap:wrap;margin-top:10px;font-size:.72rem;color:rgb(var(--mut))}
.leg span{display:flex;align-items:center;margin:0 14px 4px 0;white-space:nowrap}
.leg i{width:9px;height:9px;border-radius:3px;margin-right:6px;background:rgb(var(--c))}
.leg i.rest{background:repeating-linear-gradient(-45deg,rgba(var(--ov),.35) 0 2px,rgba(var(--ov),.1) 2px 4px)}
.leg b{color:var(--txt);font-weight:650;margin-left:4px}
.pills{display:flex;flex-wrap:wrap;margin-top:6px}
.pill{display:flex;align-items:center;font-size:.72rem;font-weight:600;padding:6px 11px;border-radius:999px;background:rgba(var(--ov),.05);border:1px solid var(--stroke);margin:4px 8px 0 0;color:rgb(var(--mut))}
.pill b{color:var(--txt);margin:0 3px}
.pill.sb{border-color:rgba(251,146,60,.45);background:rgba(251,146,60,.1);color:var(--o1);cursor:pointer}
.pill.sun{border-color:rgba(var(--sun),.45);background:rgba(var(--sun),.1);color:var(--y1)}
.per{display:flex;margin-bottom:10px}
.per span{flex:1;text-align:center;font-size:.72rem;font-weight:700;padding:7px 0;color:rgb(var(--mut));background:rgba(var(--ov),.04);border:1px solid var(--stroke);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .3s,color .3s}
.per span:first-child{border-radius:999px 0 0 999px}.per span:last-child{border-radius:0 999px 999px 0}
.per span+span{border-left:0}
.per span.sel{background:rgba(var(--sun),.16);color:var(--y1);border-color:rgba(var(--sun),.45)}
.psum{display:flex;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid var(--stroke)}
.psum div{margin-right:22px}
.psum small{display:block;font-size:.62rem;text-transform:uppercase;letter-spacing:.09em;color:rgb(var(--mut));font-weight:700}
.psum b{font-size:1.05rem;font-weight:800;font-variant-numeric:tabular-nums}
.psum b u{text-decoration:none;font-size:.7rem;color:rgb(var(--mut));font-weight:650;margin-left:3px}
.psum b u.mx{display:block;margin:2px 0 0}
.psum .sun{color:rgb(var(--sun))}.psum .grd{color:rgb(255,92,122)}
.rows{display:flex;flex-wrap:wrap;margin-top:8px}
.rk{display:flex;align-items:center;font-size:.7rem;color:rgb(var(--mut));margin:3px 14px 0 0;white-space:nowrap}
.rk i{font-style:normal;font-weight:800;color:rgb(var(--c));margin-right:5px}
.rk b{color:var(--txt);margin-left:5px;font-variant-numeric:tabular-nums}
.rooms{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-gap:14px;gap:14px;flex:1;align-content:stretch;position:relative}
.room{position:relative;border-radius:22px;padding:14px 14px 8px;background:linear-gradient(160deg,rgba(var(--ov),.06),rgba(var(--ov),.012)),var(--panel);border:1px solid var(--stroke);overflow:hidden;opacity:0;transform:translateY(10px);animation:rin .7s cubic-bezier(.2,.8,.2,1) forwards;transition:border-color .6s,box-shadow .6s}
@keyframes rin{to{opacity:1;transform:none}}
.room:before{content:'';position:absolute;top:-40%;right:-30%;width:80%;height:80%;border-radius:50%;background:radial-gradient(circle,rgba(var(--rc),.22),transparent 70%);opacity:0;transition:opacity .8s;pointer-events:none}
.room.act{border-color:rgba(var(--rc),.35);box-shadow:0 0 0 1px rgba(var(--rc),.35)}
.room.act:before{opacity:0}
.rh{display:flex;align-items:center;margin-bottom:8px;position:relative}
.rh ha-icon{--mdc-icon-size:17px;color:rgb(var(--mut));margin-right:7px;display:flex}
.rh b{font-size:.78rem;text-transform:uppercase;letter-spacing:.12em;font-weight:800}
.rh .rw{margin-left:auto;font-size:.74rem;font-weight:700;color:rgb(var(--mut));font-variant-numeric:tabular-nums}
.room.act .rh .rw{color:rgb(var(--rc))}
.dv{position:relative;display:flex;align-items:center;padding:9px 8px;margin:0 -6px 4px;border-radius:16px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .3s}
.dv:active{background:rgba(var(--ov),.06)}
.dv .ic{position:relative;flex:none;width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(var(--ov),.05);margin-right:11px;transition:background .5s,box-shadow .5s}
.dv .ic ha-icon{--mdc-icon-size:22px;color:rgba(var(--ov),.45);display:flex;position:relative;z-index:2;transition:color .5s}
.dv .fx{position:absolute;top:3px;left:3px;right:3px;bottom:3px;border-radius:50%;opacity:0;transition:opacity .5s}
.dv.on .ic{background:rgba(var(--c),.16);box-shadow:inset 0 0 0 1px rgba(var(--c),.35)}
.dv.on .ic ha-icon{color:rgb(var(--c))}
.dv.on.t-light .ic{background:radial-gradient(circle at 50% 45%,rgba(var(--c),.55),rgba(var(--c),.1) 72%);box-shadow:0 0 0 1px rgba(var(--c),.35),inset 0 0 0 1px rgba(var(--c),.5)}
.dv.on.t-light .ic ha-icon{color:var(--y0);filter:none}
.dv.run.spin .fx{opacity:1;border:2px dashed rgba(var(--c),.75);animation:spin var(--sp,2.4s) linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.dv.run.t-fridge .fx,.dv.run.t-heat .fx{opacity:1;border:1.5px solid rgba(var(--c),.7);animation:ping 2.2s ease-out infinite}
@keyframes ping{0%{transform:scale(.7);opacity:.9}100%{transform:scale(1.35);opacity:0}}
.dv.on.t-tv .ic,.dv.on.t-console .ic{animation:flick 3.2s ease-in-out infinite}
@keyframes flick{0%,100%{box-shadow:0 0 0 1px rgba(var(--c),.35),inset 0 0 0 1px rgba(var(--c),.35)}50%{box-shadow:0 0 0 1px rgba(var(--c),.35),inset 0 0 0 1px rgba(var(--c),.5)}}
.steam{position:absolute;top:-6px;left:0;right:0;height:14px;z-index:3;opacity:0}
.steam i{position:absolute;bottom:0;width:3px;height:10px;border-radius:3px;background:rgba(var(--ov),.55);filter:blur(1px);animation:steam 1.8s ease-out infinite}
.steam i:nth-child(1){left:13px}.steam i:nth-child(2){left:19px;animation-delay:.6s}.steam i:nth-child(3){left:25px;animation-delay:1.2s}
@keyframes steam{0%{transform:translateY(4px) scaleY(.6);opacity:0}30%{opacity:.8}100%{transform:translateY(-10px) scaleY(1.2);opacity:0}}
.dv.run.t-coffee .steam{opacity:1}
.dv .tx{flex:1;min-width:0}
.dv .nm{font-size:.92rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dv .sb{font-size:.7rem;color:rgb(var(--mut));margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dv .sb b{color:var(--txt);font-weight:700;font-variant-numeric:tabular-nums}
.dv.on .sb b{color:rgb(var(--c))}
.dv .sunb{display:none;font-size:.62rem;font-weight:800;color:#111;background:rgb(var(--sun));border-radius:6px;padding:1px 5px;margin-left:5px;vertical-align:1px}
.dv.sunok .sunb{display:inline}
.tg{position:relative;flex:none;width:44px;height:26px;border-radius:999px;background:rgba(var(--ov),.1);border:1px solid rgba(var(--ov),.12);margin-left:8px;transition:background .35s,border-color .35s}
.tg:after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#cbd5e1;box-shadow:0 2px 6px rgba(0,0,0,.5);transition:transform .35s cubic-bezier(.2,.8,.2,1),background .35s}
.dv.on .tg{background:rgba(var(--c),.85);border-color:rgba(var(--c),1);box-shadow:0 0 0 1px rgba(var(--c),.35)}
.dv.on .tg:after{transform:translateX(18px);background:#fff}
.lk{flex:none;margin-left:8px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(var(--c),.12);color:rgba(var(--c),.9);--mdc-icon-size:17px}
.dv.lock{cursor:default}
.dv.nope{animation:nope .4s ease}
@keyframes nope{20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}
.dv.pend .tg:after{animation:pend .8s ease-in-out infinite}
@keyframes pend{50%{opacity:.4}}
.dv .pbar{position:absolute;left:58px;right:60px;bottom:3px;height:2px;border-radius:2px;background:rgba(var(--ov),.04);overflow:hidden}
.dv .pbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,rgba(var(--c),.3),rgb(var(--c)));transition:width 1s}
.chs{display:flex;flex-wrap:wrap;margin:-2px 0 6px 47px}
.ch{font-size:.68rem;font-weight:650;padding:5px 10px;border-radius:999px;margin:4px 6px 0 0;background:rgba(var(--ov),.05);border:1px solid rgba(var(--ov),.1);color:rgb(var(--mut));cursor:pointer;-webkit-tap-highlight-color:transparent;transition:all .35s}
.ch.on{background:rgba(251,146,60,.18);border-color:rgba(251,146,60,.55);color:var(--o1)}
.ch.pend{animation:pend .8s ease-in-out infinite}
.empty{grid-column:1/-1;text-align:center;color:rgb(var(--mut));padding:40px}
.wide .rooms{grid-template-columns:repeat(4,minmax(0,1fr))}
.mid .rooms{grid-template-columns:repeat(3,minmax(0,1fr))}
.narrow{padding:16px}
.narrow .rooms{grid-template-columns:1fr 1fr}
.narrow .hero{flex-direction:column;align-items:stretch}
.narrow .kpi{margin:0 0 12px}
.dv.tvon.t-media .ic{animation:flick 3.2s ease-in-out infinite}
.dv.on.t-media .ic{background:radial-gradient(circle,rgba(var(--amb,129,140,248),.45),rgba(var(--amb,129,140,248),.08) 72%)}
.dv.on.t-media .ic ha-icon{color:rgb(var(--amb,129,140,248))}
.seg15{display:flex;margin:2px 0 4px 47px;height:8px}
.seg15 i{flex:1;margin-right:3px;border-radius:4px;background:rgba(var(--ov),.07);transition:background .8s,box-shadow .8s}
.seg15.lit i{background:rgb(var(--sc));box-shadow:0 0 0 1px rgba(var(--sc),.35)}
.seg15.dream i{animation:dream 6s linear infinite}
.seg15.music i{animation:beat .9s ease-in-out infinite}
.seg15 i:nth-child(odd){animation-delay:-.45s}
@keyframes dream{0%{background:rgb(255,80,80);box-shadow:0 0 0 1px rgba(255,80,80,.35)}25%{background:rgb(255,200,60)}50%{background:rgb(60,220,160);box-shadow:0 0 0 1px rgba(60,220,160,.35)}75%{background:rgb(80,130,255)}100%{background:rgb(255,80,80)}}
@keyframes beat{50%{transform:scaleY(.4);opacity:.6}}
.np{margin:0 0 4px 47px;font-size:.7rem;color:rgb(var(--mut));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.np b{color:var(--txt)}
.chs.lt .ch.on{background:rgba(var(--amb,129,140,248),.2);border-color:rgba(var(--amb,129,140,248),.6);color:var(--txt)}
.chs.sc .ch.on{background:rgba(250,204,21,.18);border-color:rgba(250,204,21,.55);color:var(--y1)}
.rlogo{height:22px;max-width:76px;object-fit:contain;border-radius:5px;margin-right:8px;flex:none}
.dlogo{width:78%;height:78%;object-fit:contain;border-radius:6px}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.room{opacity:1;transform:none}}
`;

  class DevicesCard extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._energy = {}; this._cost = {}; this._gridk = {}; this._pend = {}; }
    static getStubConfig() { return { rooms: [] }; }
    static getConfigElement() { return document.createElement('energy-cockpit-devices-card-editor'); }
    setConfig(c) {
      WD.applyTheme(this, c, this._hass);
      if (!c.rooms || !c.rooms.some((r) => r && r.devices && r.devices.length)) {
        this._c = null;
        this.shadowRoot.innerHTML = '<style>' + WD.themeCss() + 'ha-card{padding:22px;border-radius:24px;background:var(--panel);color:var(--txt);font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit Geräte &amp; Verbrauch</b><div style="margin-top:8px;opacity:.8">Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Sensoren auszuwählen.</div></ha-card>';
        return;
      }
      this._c = Object.assign({ standby_w: 15 }, c);
      this._sig = null;
      if (this._hass) this._update();
    }
    set hass(h) {
      WD.applyTheme(this, null, h);
      setLocale(h);
      if (!this._c) { this._hass = h; return; }
      // Sprache erst jetzt bekannt: statische Texte neu aufbauen
      if (this._bl !== WD.state.lang) { this._bl = WD.state.lang; this._sig = null; }
      this._hass = h;
      this._update();
      if (!this._eLoading && Date.now() - (this._eLoaded || 0) > 5 * 60e3) this._loadEnergy();
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
      clearInterval(this._tick);
      this._tick = setInterval(() => this._render(true), 30000);
      this._sched();
    }
    disconnectedCallback() { if (this._ro) this._ro.disconnect(); window.removeEventListener('resize', this._onResize); clearInterval(this._tick); }
    _$(s) { return this.shadowRoot.querySelector(s); }
    _sched() { if (this._lr) return; this._lr = requestAnimationFrame(() => { this._lr = null; this._mode(); }); }
    _mode() {
      const w = this.getBoundingClientRect().width, wrap = this._$('.wrap');
      if (!w || !wrap) return;
      wrap.classList.toggle('wide', w >= 1100);
      wrap.classList.toggle('mid', w >= 700 && w < 1100);
      wrap.classList.toggle('narrow', w < 700);
      this._fit();
    }
    // Füllt die sichtbare Höhe; zu viel Inhalt wird verkleinert, zu wenig leicht vergrößert
    _fit() {
      const wrap = this._$('.wrap'), card = this._$('ha-card');
      if (!wrap || !card) return;
      wrap.style.transform = ''; wrap.style.width = ''; wrap.style.minHeight = ''; card.style.height = '';
      this._fs = null;
      if (this._c.fit_screen === false) return;
      const top = Math.max(0, this.getBoundingClientRect().top);
      const avail = window.innerHeight - top - (this._c.fit_margin === undefined ? 8 : this._c.fit_margin);
      const cw = card.clientWidth;
      if (avail < 200 || !cw) return;
      const cl = (v) => Math.max(0.55, Math.min(this._c.fit_grow === false ? 1 : 1.2, v));
      let s = 1;
      const h0 = wrap.offsetHeight;
      if (h0 > avail || h0 < avail * 0.95) {
        s = cl(avail / h0);
        wrap.style.width = (cw / s) + 'px';
        s = cl(avail / wrap.offsetHeight);
        if (Math.abs(s - 1) < 0.01) s = 1;
        wrap.style.width = s === 1 ? '' : (cw / s) + 'px';
      }
      wrap.style.minHeight = (avail / s) + 'px';
      if (s !== 1) wrap.style.transform = 'scale(' + s + ')';
      this._fs = { s, avail };
      this._fitH();
    }
    // Nach einem Wechsel des Zeitraums: Maßstab bleibt, nur die Kartenhöhe folgt dem Inhalt
    _fitH() {
      const wrap = this._$('.wrap'), card = this._$('ha-card'), f = this._fs;
      if (!wrap || !card || !f || this._c.fit_screen === false) return;
      const hh = Math.ceil(Math.max(f.avail, wrap.offsetHeight * f.s)) + 'px';
      if (card.style.height !== hh) card.style.height = hh;
    }

    // Geräte, die gerade erreichbar sind (offline wird weggelassen)
    _devices() {
      const h = this._hass, out = [];
      const ok = (id) => { const s = id && h.states[id]; return s && s.state !== 'unavailable'; };
      this._c.rooms.forEach((r, ri) => {
        (r.devices || []).forEach((d, di) => {
          const chans = (d.channels || []).filter((x) => ok(x.entity));
          if (d.channels ? !chans.length : !ok(d.entity)) return;
          out.push(Object.assign({}, d, { key: ri + '-' + di, room: ri, chans }));
        });
      });
      return out;
    }
    _update() {
      if (!this._c || !this._hass) return;
      const devs = this._devices();
      const sig = devs.map((d) => d.key + ':' + d.chans.length).join(',');
      if (sig !== this._sig) { this._sig = sig; this._devs = devs; this._build(); }
      const now = Date.now();
      if (now - (this._lastR || 0) > 900) { this._lastR = now; this._render(); } else if (!this._rq) { this._rq = setTimeout(() => { this._rq = null; this._lastR = Date.now(); this._render(); }, 950); }
    }

    _build() {
      const c = this._c, devs = this._devs;
      const rooms = c.rooms.map((r, ri) => ({ r, ri, d: devs.filter((x) => x.room === ri) })).filter((x) => x.d.length);
      this.shadowRoot.innerHTML = `<style>${CSS}</style>
      <ha-card><div class="wrap">
        <header>
          <div class="title"><span class="ico"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon></span><div>${esc(c.title || T('dev.title'))}<small class="hsub"></small></div></div>
          ${c.nav_path ? `<div class="navbtn" data-nav="${esc(c.nav_path)}">${esc(c.nav_label || T('dev.next'))}</div>` : ''}
        </header>
        <div class="hero">
          <div class="kpi"><div class="big"><span class="tot">—</span><u>W</u></div><div class="l lt"></div>
            <div class="psum"><div><small class="pl"></small><b class="pk">—</b></div><div><small>${T('dev.cost')}</small><b class="pe">—</b></div><div><small>${T('dev.home_total')}</small><b class="ph">—</b></div></div></div>
          <div class="hb"><div class="per">${PERIODS.map((x) => `<span data-p="${x[0]}">${T(x[1])}</span>`).join('')}</div><div class="bar"></div><div class="leg"></div><div class="rows"></div><div class="pills"></div></div>
        </div>
        <div class="rooms">${rooms.length ? rooms.map((x, i) => {
          const col = TYPES[(x.d[0] && x.d[0].type) || 'plug'] || TYPES.plug;
          return `<div class="room" data-r="${x.ri}" style="--rc:${rgb(x.r.color, col.c)};animation-delay:${i * 70}ms">
            <div class="rh">${x.r.image ? `<img class="rlogo" src="${esc(x.r.image)}" alt="">` : `<ha-icon icon="${esc(x.r.icon || 'mdi:door')}"></ha-icon>`}<b>${esc(x.r.name)}</b><span class="rw"></span></div>
            ${x.d.map((d) => this._devHtml(d)).join('')}
          </div>`;
        }).join('') : `<div class="empty">${T('dev.none')}</div>`}</div>
      </div></ha-card>`;
      const nb = this._$('[data-nav]');
      if (nb) nb.addEventListener('click', () => haNavigate(nb.dataset.nav));
      this.shadowRoot.querySelectorAll('.per span').forEach((el) => el.addEventListener('click', () => this._setPer(el.dataset.p)));
      this._perUi();
      this.shadowRoot.querySelectorAll('.dv').forEach((el) => el.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('.ch')) return;
        this._toggle(this._devs.filter((d) => d.key === el.dataset.k)[0]);
      }));
      this.shadowRoot.querySelectorAll('.ch').forEach((el) => el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (el.dataset.scene) {
          el.classList.add('pend'); clearTimeout(el._pt); el._pt = setTimeout(() => el.classList.remove('pend'), 6000);
          this._hass.callService('select', 'select_option', { entity_id: el.dataset.sel, option: el.dataset.scene }).catch((err) => console.warn('energy-cockpit-devices-card', err));
          return;
        }
        this._call(el.dataset.e, el.classList.contains('on') ? 'turn_off' : 'turn_on', el);
      }));
      this._sched();
    }
    _devHtml(d) {
      const t = TYPES[d.type] || TYPES.plug;
      return `<div class="dv t-${esc(d.type || 'plug')}${t.spin ? ' spin' : ''}${d.lock ? ' lock' : ''}" data-k="${d.key}" style="--c:${rgb(d.color, t.c)}">
        <div class="ic"><div class="fx"></div>${d.type === 'coffee' ? '<div class="steam"><i></i><i></i><i></i></div>' : ''}${d.image ? `<img class="dlogo" src="${esc(d.image)}" alt="">` : `<ha-icon icon="${esc(d.icon || t.i)}"></ha-icon>`}</div>
        <div class="tx"><div class="nm">${esc(d.name)}<span class="sunb">☀ ${T('dev.now')}</span></div><div class="sb"></div></div>
        ${d.lock ? '<div class="lk" title="' + esc(T('dev.locked')) + '"><ha-icon icon="mdi:shield-lock-outline"></ha-icon></div>' : '<div class="tg"></div>'}
        ${d.power ? '<div class="pbar"><i></i></div>' : ''}
      </div>${d.type === 'media' && d.ambilight ? `<div class="seg15">${'<i></i>'.repeat(d.ambilight.segments || 15)}</div><div class="np" style="display:none"></div>` : ''}${d.chans.length ? `<div class="chs">${d.chans.map((x) => `<span class="ch" data-e="${esc(x.entity)}">${esc(x.name)}</span>`).join('')}</div>` : ''}${this._mediaChips(d)}`;
    }
    // Zusatz-Chips fürs Mediencenter: Ambilight, DreamView, Musik, Ton aus + Szenen-Schnellwahl
    _mediaChips(d) {
      if (d.type !== 'media') return '';
      const h = this._hass, a = d.ambilight || {}, ok = (id) => id && h.states[id] && h.states[id].state !== 'unavailable';
      const lt = [];
      if (ok(a.light) && d.toggle !== a.light) lt.push(['💡 ' + T('dev.ambilight'), a.light]);
      if (ok(a.dreamview)) lt.push(['🌈 DreamView', a.dreamview]);
      if (ok(a.music)) lt.push(['🎵 ' + T('dev.music'), a.music]);
      if (ok(d.mute)) lt.push(['🔇 ' + T('dev.mute'), d.mute]);
      const sc = ok(a.scene) ? (a.scenes || []) : [];
      return (lt.length ? `<div class="chs lt">${lt.map((x) => `<span class="ch" data-e="${esc(x[1])}">${esc(x[0])}</span>`).join('')}</div>` : '')
        + (sc.length ? `<div class="chs sc">${sc.map((x) => `<span class="ch" data-scene="${esc(x.option)}" data-sel="${esc(a.scene)}" data-light="${esc(a.light || '')}">${esc(x.name)}</span>`).join('')}</div>` : '');
    }
    _isOn(d) {
      const h = this._hass;
      if (d.type === 'media') { if (d.toggle) return !!(h.states[d.toggle] && h.states[d.toggle].state === 'on'); return this._tvOn(d); }
      if (d.chans.length) return d.chans.some((x) => h.states[x.entity].state === 'on');
      if (d.entity && d.entity.indexOf('sensor.') === 0) {
        const pw = num(h, d.power || d.entity);
        return pw !== null && pw > (d.run_w === undefined ? 3 : d.run_w);
      }
      const s = h.states[d.entity];
      return !!s && s.state === 'on';
    }
    _tvOn(d) {
      const h = this._hass, w = num(h, d.power);
      return w !== null ? w > (d.on_w || 30) : !!(d.entity && h.states[d.entity] && h.states[d.entity].state === 'on');
    }
    _toggle(d) {
      if (!d) return;
      if (d.lock) {
        const le = this.shadowRoot.querySelector(`.dv[data-k="${d.key}"]`);
        if (le) { le.classList.remove('nope'); void le.offsetWidth; le.classList.add('nope'); }
        return;
      }
      const on = this._isOn(d);
      const el = this.shadowRoot.querySelector(`.dv[data-k="${d.key}"]`);
      if (d.type === 'media' && (d.toggle || d.entity)) this._call(d.toggle || d.entity, on ? 'turn_off' : 'turn_on');
      else if (d.chans.length) d.chans.forEach((x) => this._call(x.entity, on ? 'turn_off' : 'turn_on'));
      else this._call(d.entity, on ? 'turn_off' : 'turn_on');
      if (el) { el.classList.add('pend'); clearTimeout(el._pt); el._pt = setTimeout(() => el.classList.remove('pend'), 6000); }
    }
    _call(entity, svc, el) {
      const dom = entity.split('.')[0];
      if (el) { el.classList.add('pend'); clearTimeout(el._pt); el._pt = setTimeout(() => el.classList.remove('pend'), 6000); }
      this._hass.callService(dom === 'light' ? 'light' : dom === 'switch' ? 'switch' : 'homeassistant', svc, { entity_id: entity })
        .catch((e) => { console.warn('energy-cockpit-devices-card', e); if (el) el.classList.remove('pend'); });
    }

    get _per() {
      if (!this.__per) { try { this.__per = localStorage.getItem('energy-cockpit-devices-period') || 'day'; } catch (e) { this.__per = 'day'; } }
      return this.__per;
    }
    _setPer(k) {
      if (k === this._per) return;
      this.__per = k;
      try { localStorage.setItem('energy-cockpit-devices-period', k); } catch (e) { /* ignore */ }
      this._energy = {}; this._cost = {}; this._gridk = {}; this._home = null; this._homeGrid = null;
      this._perUi();
      this._render(true);
      this._loadEnergy();
    }
    _perUi() {
      this.shadowRoot.querySelectorAll('.per span').forEach((el) => el.classList.toggle('sel', el.dataset.p === this._per));
      const pl = this._$('.pl'); if (pl) pl.textContent = T(PLBL[this._per]) + ' ' + T('dev.measured');
    }
    async _loadEnergy() {
      const h = this._hass, c = this._c;
      const ids = [];
      c.rooms.forEach((r) => (r.devices || []).forEach((d) => { if (d.energy && ids.indexOf(d.energy) < 0) ids.push(d.energy); }));
      (c.extra_consumers || []).forEach((x) => { if (x.energy && ids.indexOf(x.energy) < 0) ids.push(x.energy); });
      const he = c.home_energy || {};
      ['pv', 'import', 'export', 'charge', 'discharge'].forEach((k) => { if (he[k] && ids.indexOf(he[k]) < 0) ids.push(he[k]); });
      if (!ids.length || !h.callWS) return;
      // Startdatum je Zähler (z. B. Steckdose, die vorher ein anderes Gerät gemessen hat)
      const since = {};
      c.rooms.forEach((r) => (r.devices || []).forEach((d) => { if (d.energy && d.since) since[d.energy] = new Date(d.since).getTime(); }));
      (c.extra_consumers || []).forEach((x) => { if (x.energy && x.since) since[x.energy] = new Date(x.since).getTime(); });
      this._eLoading = true;
      const per = this._per;
      try {
        const s = perStart(per);
        const r = await h.callWS({ type: 'recorder/statistics_during_period', start_time: s.toISOString(), period: per === 'year' ? 'day' : 'hour', statistic_ids: ids, types: ['change'] });
        if (per !== this._per) { this._eLoading = false; return; }
        const ts = (x) => (typeof x.start === 'number' ? x.start : Date.parse(x.start));
        const pos = (v) => (v > 0 ? v : 0);
        // Hausverbrauch und Netzanteil je Intervall: Haus = PV + Bezug - Einspeisung - Akku laden + Akku entladen
        const slot = {};
        const add = (k, f) => (r[he[k]] || []).forEach((x) => { const t = ts(x); (slot[t] = slot[t] || { pv: 0, imp: 0, exp: 0, chg: 0, dis: 0 })[f] += pos(x.change); });
        add('pv', 'pv'); add('import', 'imp'); add('export', 'exp'); add('charge', 'chg'); add('discharge', 'dis');
        let hImp = 0, hHome = 0;
        Object.keys(slot).forEach((t) => {
          const o = slot[t];
          o.home = Math.max(0, o.pv + o.imp - o.exp - o.chg + o.dis);
          o.g = o.home > 0.001 ? Math.min(1, o.imp / o.home) : (o.imp > 0 ? 1 : 0);
          hImp += o.imp; hHome += o.home;
        });
        const gAvg = hHome > 0 ? Math.min(1, hImp / hHome) : 1;
        const price = WD.price(h, c.grid_price, c.grid_price_ct, 0), feed = WD.price(h, c.feed_in, c.feed_in_ct, 0);
        this._hasP = price > 0;
        const e = {}, cost = {}, grid = {};
        ids.forEach((id) => {
          const rows = r[id] || [];
          let v = 0, eur = 0, gk = 0;
          rows.forEach((x) => {
            const t = ts(x), ch = pos(x.change);
            if (!ch || (since[id] && t < since[id])) return;
            const g = slot[t] ? slot[t].g : gAvg;
            v += ch; gk += ch * g; eur += ch * (g * price + (1 - g) * feed);
          });
          e[id] = rows.length ? v : null; cost[id] = eur; grid[id] = gk;
        });
        this._energy = e; this._cost = cost; this._gridk = grid;
        this._home = he.import ? hHome : null;
        this._homeGrid = he.import ? hImp : null;
        this._eLoaded = Date.now();
        this._render(true);
      } catch (err) {
        console.warn('energy-cockpit-devices-card: energy', err);
        this._eLoaded = Date.now() - 4 * 60e3;
      }
      this._eLoading = false;
    }

    _render() {
      const h = this._hass, c = this._c, devs = this._devs;
      if (!h || !devs || !this._$('.rooms')) return;
      const price = WD.price(h, c.grid_price, c.grid_price_ct, 0);
      this._hasP = price > 0;
      const CUR = cur();
      const now = Date.now();
      const surplus = Math.max(0, num(h, c.surplus) || 0);
      const roomW = {}, roomOn = {};
      const segs = [];
      let sum = 0, onCount = 0, kwh = 0, eur = 0, gk = 0, standby = null;
      devs.forEach((d, i) => {
        const el = this.shadowRoot.querySelector(`.dv[data-k="${d.key}"]`);
        if (!el) return;
        const on = this._isOn(d);
        const w = d.power ? num(h, d.power) : null;
        const t = TYPES[d.type] || TYPES.plug;
        const run = on && (d.run_state ? (h.states[d.run_state] && h.states[d.run_state].state === 'run') : w === null ? true : w > (d.run_w === undefined ? 3 : d.run_w));
        if (on) onCount++;
        if (w !== null && !d.shared) { sum += w; roomW[d.room] = (roomW[d.room] || 0) + w; if (w > 0.5) segs.push({ n: /^(licht|light)$/i.test(d.name) ? T('dev.light') + ' ' + c.rooms[d.room].name : d.name, w, c: rgb(d.color, t.c) }); }
        if (on) roomOn[d.room] = true;
        el.classList.toggle('on', on);
        el.classList.toggle('run', !!run);
        if (t.spin && w !== null) el.style.setProperty('--sp', Math.max(0.6, 3 - Math.log10(Math.max(1, w)) * 0.8) + 's');
        if (el._was !== undefined && el._was !== on) el.classList.remove('pend');
        el._was = on;
        // Untertitel: Leistung · heute · Laufzeit
        const parts = [];
        const tvOn = d.type === 'media' ? this._tvOn(d) : false;
        if (d.type === 'media') parts.push((d.toggle ? (on ? '💡 ' + T('dev.on') + ' · ' : '💡 ' + T('dev.off') + ' · ') : '') + (tvOn ? T('dev.tv_on') : T('dev.tv_off')));
        if (w !== null) parts.push(`<b>${fW(w)}</b>`);
        else if (d.info && h.states[d.info]) parts.push(`<b>${esc(this._info(d, h.states[d.info]))}</b>`);
        const e = d.energy ? this._energy[d.energy] : null;
        if (e !== null && e !== undefined) { kwh += e; eur += this._cost[d.energy] || 0; gk += this._gridk[d.energy] || 0; parts.push(`${nf(e, e < 10 ? 2 : 1)} kWh` + (this._hasP ? ` · ${nf(this._cost[d.energy] || 0, 2)} ${CUR}` : '')); }
        if (d.extra && h.states[d.extra]) parts.push(esc(h.states[d.extra].state + (d.extra_unit || '')));
        const ref = d.chans.length ? h.states[d.chans[0].entity] : h.states[d.entity];
        if (d.type === 'fridge' && w !== null) parts.push(d.alt_w && w > d.alt_w ? (d.alt_label ? esc(d.alt_label) : T('dev.extra')) : run ? '❄ ' + T('dev.cooling') : T('dev.pause'));
        else if (ref && d.type !== 'media') parts.push(on ? T('dev.since') + ' ' + dur(now - new Date(ref.last_changed).getTime()) : T('dev.off'));
        const sb = el.querySelector('.sb'), html = parts.join('  ·  ');
        if (sb.innerHTML !== html) sb.innerHTML = html;
        const pb = el.querySelector('.pbar i');
        if (pb) pb.style.width = (w ? Math.min(100, w / (d.max_w || 2000) * 100) : 0) + '%';
        // PV-Überschuss: dieses Gerät könnte jetzt mit Sonnenstrom laufen
        el.classList.toggle('sunok', !!(d.pv_w && !run && surplus >= d.pv_w));
        // Standby-Detektiv: an, aber kaum Leistung
        if (!d.lock && (d.type === 'media' ? !tvOn : on) && w !== null && w > 0.5 && w < c.standby_w && ['plug', 'strip', 'tv', 'console', 'media'].indexOf(d.type || 'plug') >= 0 && (!standby || w > standby.w)) standby = { d, w };
        if (d.type === 'media') { el.classList.toggle('tvon', tvOn); this._renderMedia(d, el, w, tvOn); }
      });
      // Schalter-Chips (Steckdosen-Kanäle, Ambilight, Ton aus …) und Szenen
      this.shadowRoot.querySelectorAll('.ch[data-e]').forEach((ch) => {
        const st = h.states[ch.dataset.e];
        const con = !!st && st.state === 'on';
        if (ch._was !== undefined && ch._was !== con) ch.classList.remove('pend');
        ch._was = con;
        ch.classList.toggle('on', con);
      });
      this.shadowRoot.querySelectorAll('.ch[data-scene]').forEach((ch) => {
        const sel = h.states[ch.dataset.sel], li = h.states[ch.dataset.light];
        const con = !!sel && sel.state === ch.dataset.scene && (!li || li.state === 'on');
        if (ch._was !== undefined && ch._was !== con) ch.classList.remove('pend');
        ch._was = con;
        ch.classList.toggle('on', con);
      });
      const roomE = {};
      devs.forEach((d) => { const e = d.energy ? this._energy[d.energy] : null; if (e) roomE[d.room] = (roomE[d.room] || 0) + e; });
      this.shadowRoot.querySelectorAll('.room').forEach((r) => {
        const ri = +r.dataset.r, w = roomW[ri];
        r.classList.toggle('act', !!roomOn[ri]);
        const rw = r.querySelector('.rw'), txt = (w !== undefined ? fW(w) : '') + (roomE[ri] ? (w !== undefined ? ' · ' : '') + fK(roomE[ri]) + ' kWh' : '');
        if (rw.textContent !== txt) rw.textContent = txt;
      });
      // Hero: Anteil am Hausverbrauch
      const home = num(h, c.home);
      const extra = (c.extra_consumers || []).map((x) => ({ n: x.name, w: num(h, x.entity), c: rgb(x.color, '167,139,250') })).filter((x) => x.w && x.w > 0.5);
      extra.forEach((x) => { segs.push(x); });
      const known = sum + extra.reduce((a, x) => a + x.w, 0);
      const total = Math.max(home || 0, known, 1);
      segs.sort((a, b) => b.w - a.w);
      const rest = home !== null ? Math.max(0, home - known) : 0;
      const bar = this._$('.bar');
      const list = segs.slice(0, 8);
      if (rest > 1) list.push({ n: T('dev.unmeasured'), w: rest, rest: 1 });
      const key = list.map((x) => x.n).join('|');
      if (bar._key !== key) {
        bar._key = key;
        bar.innerHTML = list.map((x) => `<div class="seg${x.rest ? ' rest' : ''}" style="--c:${x.c || '255,255,255'}"></div>`).join('');
      }
      requestAnimationFrame(() => list.forEach((x, i) => { const s = bar.children[i]; if (s) s.style.width = (x.w / total * 100) + '%'; }));
      const leg = list.filter((x) => !x.rest).slice(0, 5).concat(list.filter((x) => x.rest)).map((x) => `<span><i class="${x.rest ? 'rest' : ''}" style="--c:${x.c || '255,255,255'}"></i>${esc(x.n)}<b>${fW(x.w)}</b></span>`).join('');
      const lg = this._$('.leg'); if (lg.innerHTML !== leg) lg.innerHTML = leg;
      this._$('.tot').textContent = nf(Math.round(home !== null ? home : known), 0);
      const lt = T('dev.live', { n: home ? Math.round(Math.min(1, known / home) * 100) : 100 });
      if (this._$('.lt').innerHTML !== lt) this._$('.lt').innerHTML = lt;
      const sub = T('dev.sub', { on: onCount, all: devs.length, w: fW(sum) });
      if (this._$('.hsub').textContent !== sub) this._$('.hsub').textContent = sub;
      const ex = (c.extra_consumers || []).filter((x) => x.energy && this._energy[x.energy]);
      ex.forEach((x) => { kwh += this._energy[x.energy]; eur += this._cost[x.energy] || 0; gk += this._gridk[x.energy] || 0; });
      const loaded = Object.keys(this._energy).length > 0;
      const gs = kwh > 0 ? gk / kwh : 0;
      this._$('.pk').innerHTML = loaded ? `${fK(kwh)}<u>kWh</u><u class="mx"><span class="sun">☀ ${fK(kwh - gk)}</span> · <span class="grd">⚡ ${fK(gk)}</span></u>` : '…';
      this._$('.pe').innerHTML = loaded ? (this._hasP ? `${nf(eur, 2)}<u>${CUR}</u><u class="mx">Ø ${nf(kwh > 0 ? eur / kwh * 100 : 0, 1)} ${T('dev.cent')} · ${Math.round(gs * 100)} % ${T('dev.grid')}</u>` : '—') : '…';
      this._$('.ph').innerHTML = this._home ? `${fK(this._home)}<u>kWh · ${Math.round(Math.min(1, kwh / this._home) * 100)} % ${T('dev.measured')}</u><u class="mx"><span class="sun">☀ ${Math.round((1 - this._homeGrid / this._home) * 100)} % ${T('dev.selfsup')}</span> · <span class="grd">⚡ ${Math.round(this._homeGrid / this._home * 100)} % ${T('dev.grid')}</span></u>` : '—';
      const rank = devs.filter((d) => d.energy && this._energy[d.energy]).map((d) => ({ n: /^(licht|light)$/i.test(d.name) ? T('dev.light') + ' ' + c.rooms[d.room].name : d.name, e: this._energy[d.energy], k: this._cost[d.energy] || 0, c: rgb(d.color, (TYPES[d.type] || TYPES.plug).c) }))
        .concat(ex.map((x) => ({ n: x.name, e: this._energy[x.energy], k: this._cost[x.energy] || 0, c: rgb(x.color, '167,139,250') }))).sort((a, b) => b.e - a.e).slice(0, 5);
      const rk = rank.map((x, i) => `<span class="rk" style="--c:${x.c}"><i>${i + 1}.</i>${esc(x.n)}<b>${fK(x.e)} kWh${this._hasP ? ' · ' + nf(x.k, 2) + ' ' + CUR : ''}</b></span>`).join('');
      const rkEl = this._$('.rows'); if (rkEl.innerHTML !== rk) rkEl.innerHTML = rk;
      const pills = [];
      if (standby) pills.push(`<span class="pill sb" data-k="${standby.d.key}">💤 ${T('dev.standby')}: ${esc(standby.d.name)}<b>${fW(standby.w)}</b>${this._hasP ? '≈ ' + nf(standby.w * 8.76 * price, 0) + ' ' + CUR + '/' + T('dev.year') + ' · ' : ''}${T('dev.tap_off')}</span>`);
      if (surplus > 300) pills.push(`<span class="pill sun">☀️ ${T('dev.surplus')}<b>${fW(surplus)}</b></span>`);
      const pl = this._$('.pills'), ph = pills.join('');
      if (pl._h !== ph) {
        pl._h = ph; pl.innerHTML = ph;
        const sp = pl.querySelector('.pill.sb');
        if (sp) sp.addEventListener('click', () => {
          const d = this._devs.filter((x) => x.key === sp.dataset.k)[0];
          if (!d) return;
          if (d.chans.length) d.chans.forEach((x) => { if (this._hass.states[x.entity].state === 'on') this._call(x.entity, 'turn_off'); });
          else if (this._isOn(d)) this._toggle(d);
        });
      }
      this._fitH();
    }
    _renderMedia(d, el, w, on) {
      const h = this._hass, a = d.ambilight || {};
      const li = a.light && h.states[a.light];
      const lon = !!li && li.state === 'on';
      const rgb = lon && li.attributes.rgb_color ? li.attributes.rgb_color.join(',') : '129,140,248';
      el.style.setProperty('--amb', rgb);
      const card = el.parentNode;
      card.style.setProperty('--amb', rgb);
      const seg = card.querySelector('.seg15');
      if (seg) {
        const dream = lon && a.dreamview && h.states[a.dreamview] && h.states[a.dreamview].state === 'on';
        const music = lon && a.music && h.states[a.music] && h.states[a.music].state === 'on';
        seg.classList.toggle('lit', lon && !dream);
        seg.classList.toggle('dream', !!dream);
        seg.classList.toggle('music', !!music);
        const n = seg.children.length;
        for (let i = 0; i < n; i++) {
          const ss = a.segment_prefix && h.states[a.segment_prefix + (i + 1)];
          const c = ss && ss.state === 'on' && ss.attributes.rgb_color && !(ss.attributes.rgb_color[0] === 255 && ss.attributes.rgb_color[1] === 255 && ss.attributes.rgb_color[2] === 255) ? ss.attributes.rgb_color.join(',') : rgb;
          seg.children[i].style.setProperty('--sc', c);
        }
      }
      // Status: Quelle des TVs und was der Fire-TV-Stick spielt
      const np = card.querySelector('.np');
      if (np) {
        const parts = [];
        const tv = d.tv && h.states[d.tv];
        if (on && tv && tv.state === 'on' && tv.attributes.source) parts.push('📺 <b>' + esc(tv.attributes.source) + '</b>');
        (d.players || []).forEach((pid) => {
          const p = h.states[pid];
          if (p && p.state === 'playing') parts.push('▶ <b>' + esc(p.attributes.media_title || p.attributes.app_name || T('dev.playing')) + '</b>' + (p.attributes.app_name && p.attributes.media_title ? ' · ' + esc(p.attributes.app_name) : ''));
        });
        if (lon && a.scene && h.states[a.scene] && h.states[a.scene].state && ['None', 'unknown', 'unavailable'].indexOf(h.states[a.scene].state) < 0) { const sv = h.states[a.scene].state, hit = (a.scenes || []).filter((x) => x.option === sv)[0]; parts.push(hit ? esc(hit.name) : '✨ ' + esc(sv)); }
        const html = parts.join('  ·  ');
        np.style.display = html ? '' : 'none';
        if (np.innerHTML !== html) np.innerHTML = html;
      }
    }
    _info(d, s) {
      const map = { ready: 'ready', run: 'brewing', inactive: 'inactive', finished: 'finished', pause: 'pause', actionrequired: 'action', error: 'error', idle: 'ready', playing: 'playing', standby: 'standby' };
      return map[s.state] ? T('dev.st.' + map[s.state]) : s.state;
    }
  }

  if (!customElements.get('energy-cockpit-devices-card')) {
    customElements.define('energy-cockpit-devices-card', DevicesCard);
    window.customCards = window.customCards || [];
    window.customCards.push({ type: 'energy-cockpit-devices-card', name: 'energy-cockpit Geräte & Verbrauch', description: 'Raum-Kacheln mit Live-Leistung, Schalten, Standby-Detektiv und Statistik', preview: true });
  }
})();
