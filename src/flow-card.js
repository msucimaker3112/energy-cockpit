/* energy-cockpit-flow-card: animierter Energiefluss. Hilfsfunktionen kommen aus common.js und i18n.js. */
(() => {
WD.addStrings({ 'ban.tonet0': 'Strom fließt ins Netz' });
const { PAL, TH, rgb, num, watt, val, clock, nf, splitW, fW, fKwh, fPct, fDur, cur, esc, haNavigate, KA, T, setLocale } = WD;
const CSS = `
${WD.themeCss()}:host{display:block;--pv:${PAL.pv};--imp:${PAL.imp};--exp:${PAL.exp};--bat:${PAL.bat};--home:${PAL.home}}
ha-card{background:radial-gradient(120% 80% at 50% 0%,var(--bg1) 0%,var(--bg0) 65%);border-radius:28px;overflow:hidden;border:1px solid rgba(var(--ov),.06);color:var(--txt);font-family:Inter,var(--ha-font-family-body,system-ui),sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:22px;position:relative;transform-origin:0 0;box-sizing:border-box}
.wrap:before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;background:radial-gradient(40% 30% at 18% 18%,rgba(var(--pv),.11),transparent 70%),radial-gradient(40% 35% at 85% 40%,rgba(var(--bat),.09),transparent 70%),radial-gradient(35% 30% at 50% 45%,rgba(var(--home),.10),transparent 70%)}
header{display:flex;align-items:center;flex-wrap:wrap;margin:0 0 22px;position:relative}
header>*{margin:3px 0 3px 8px}
.title{font-size:1.05rem;font-weight:650;display:flex;align-items:center;margin:3px auto 3px 0;letter-spacing:.01em}
.live{width:8px;height:8px;border-radius:50%;background:rgb(var(--exp));margin-right:10px;animation:ping 2s infinite}
@keyframes ping{0%{box-shadow:0 0 0 0 rgba(var(--exp),.7)}100%{box-shadow:0 0 0 10px rgba(var(--exp),0)}}
.clock{font-variant-numeric:tabular-nums;color:var(--mut);font-weight:500;margin-left:12px;font-size:.95rem}
.pill{font-size:.74rem;color:rgb(var(--mut));padding:6px 11px;border-radius:999px;background:var(--glass);border:1px solid var(--stroke)}
.pill b{color:var(--txt);font-weight:650;font-variant-numeric:tabular-nums;margin-left:4px}
.ka{display:none}
.ka.show{display:block}
.ka.wait{color:#fff;border-color:rgba(var(--pv),.6);background:rgba(var(--pv),.15);animation:kapulse 1.6s ease-in-out infinite}
.ka.on{color:rgb(var(--exp));border-color:rgba(var(--exp),.35)}
@keyframes kapulse{50%{box-shadow:0 0 0 6px rgba(var(--pv),.15)}}
.wst{display:none;cursor:pointer;color:var(--txt);border-color:rgba(var(--wc),.55);background:rgba(var(--wc),.14);font-weight:650}
.wst.show{display:block}
.wst b{color:rgb(var(--wc));margin-left:0}
.wst.urgent{animation:wpulse 1.6s ease-in-out infinite}
@keyframes wpulse{50%{box-shadow:0 0 0 7px rgba(var(--wc),.18)}}
.navbtn{cursor:pointer;color:var(--txt);font-weight:650;background:rgba(var(--ov),.07);border:1px solid rgba(var(--ov),.14);padding:8px 14px;border-radius:999px;font-size:.8rem;margin-left:8px;-webkit-tap-highlight-color:transparent;transition:background .3s}
.navbtn:active{background:rgba(var(--ov),.18)}
.banner{position:relative;display:flex;align-items:center;overflow:hidden;border-radius:20px;max-height:0;opacity:0;margin:0;padding:0 18px;border:1px solid transparent;transition:max-height .6s cubic-bezier(.2,.8,.2,1),opacity .5s,margin .6s,padding .6s}
.banner.show{max-height:140px;opacity:1;margin:0 0 20px;padding:14px 18px}
.banner.sur{background:linear-gradient(100deg,rgba(var(--pv),.22),rgba(var(--pv),.06) 60%,rgba(var(--exp),.10));border-color:rgba(var(--pv),.6);box-shadow:0 0 0 1px rgba(var(--pv),.35)}
.banner.imp{background:linear-gradient(100deg,rgba(var(--imp),.2),rgba(var(--imp),.05) 70%);border-color:rgba(var(--imp),.6);box-shadow:0 0 0 1px rgba(var(--imp),.35)}
.banner:after{content:'';position:absolute;top:0;bottom:0;left:-40%;width:40%;background:linear-gradient(90deg,transparent,rgba(var(--ov),.12),transparent);animation:sweep 4.5s ease-in-out infinite;pointer-events:none}
@keyframes sweep{0%{left:-40%}60%,100%{left:120%}}
.b-ico{width:48px;height:48px;border-radius:15px;display:flex;align-items:center;justify-content:center;flex:none;margin-right:14px}
.sur .b-ico{background:rgba(var(--pv),.2);color:rgb(var(--pv))}
.imp .b-ico{background:rgba(var(--imp),.2);color:rgb(var(--imp))}
.b-ico ha-icon{--mdc-icon-size:28px;display:flex}
.sur .b-ico ha-icon{animation:spin 12s linear infinite}
.imp .b-ico ha-icon{animation:blink 1.6s ease-in-out infinite}
@keyframes blink{50%{opacity:.45}}
.b-txt{display:flex;flex-direction:column;min-width:0;margin-right:auto}
.b-title{font-size:1.15rem;font-weight:750;letter-spacing:-.01em}
.sur .b-title{color:rgb(var(--pv))}.imp .b-title{color:rgb(var(--imp))}
.b-sub{font-size:.78rem;color:rgb(var(--mut));margin-top:3px}
.b-sub b{color:var(--txt)}
.b-chips{display:flex;flex-wrap:wrap;justify-content:flex-end;margin-left:12px}
.chip{display:flex;align-items:center;font-size:.76rem;font-weight:650;padding:7px 12px;border-radius:999px;margin:3px 0 3px 8px;background:rgba(var(--ov),.07);border:1px solid rgba(var(--ov),.12);white-space:nowrap}
.chip ha-icon{--mdc-icon-size:16px;margin-right:6px;display:flex}
.chip.run{background:rgba(var(--exp),.15);border-color:rgba(var(--exp),.45);color:rgb(var(--exp))}
.wide .b-title{font-size:1.35rem}.wide .b-sub{font-size:.88rem}.wide .chip{font-size:.85rem}
.narrow .banner.show{flex-wrap:wrap}.narrow .b-chips{margin:8px 0 0;justify-content:flex-start}
.stage{position:relative}
svg.links{position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:0}
.track{fill:none;stroke:rgba(var(--ov),.07);stroke-width:2}
.glow{fill:none;stroke:rgb(var(--c));stroke-width:9;stroke-linecap:round;opacity:0;transition:opacity .6s}
.flow{fill:none;stroke:rgb(var(--c));stroke-width:4.5;stroke-linecap:round;stroke-dasharray:0 18;opacity:0;transition:opacity .6s;animation:dash var(--d,1s) linear infinite}
.link.on .flow{opacity:1}.link.on .glow{opacity:0}.link.on .track{stroke:rgba(var(--c),.28)}
.link.rev .flow{animation-direction:reverse}
@keyframes dash{from{stroke-dashoffset:0}to{stroke-dashoffset:-18}}
.layout{position:relative;z-index:1;display:grid;grid-template-columns:1fr minmax(170px,1.15fr) 1fr;grid-template-areas:"pv hub bat" "grid hub bat";grid-gap:24px 34px;gap:24px 34px;align-items:center}
.node{position:relative;padding:15px 16px;border-radius:22px;background:linear-gradient(160deg,rgba(var(--ov),.065),rgba(var(--ov),.015)),var(--panel);border:1px solid var(--stroke);cursor:pointer;transition:border-color .5s,box-shadow .5s,transform .25s,opacity .5s;min-width:0}
.node:active,.cons:active,.hub:active{transform:scale(.98)}
.node.on{border-color:rgba(var(--c),.6);box-shadow:inset 0 0 0 1px rgba(var(--c),.16),0 0 0 1px rgba(var(--c),.35);animation:breathe 4s ease-in-out infinite}
@keyframes breathe{50%{box-shadow:inset 0 0 0 1px rgba(var(--c),.26),0 0 0 1px rgba(var(--c),.35)}}
.node:not(.on){border-color:rgba(var(--ov),.05)}
.node:not(.on) .val,.node:not(.on) .n-top,.node:not(.on) .sub{opacity:.7}
.pv{grid-area:pv}.grid{grid-area:grid}.bat{grid-area:bat}
.n-top{display:flex;align-items:center;color:rgb(var(--mut));font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;font-weight:650}
.ico{width:32px;height:32px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:rgba(var(--c),.16);color:rgb(var(--c));flex:none;margin-right:9px}
.ico ha-icon{--mdc-icon-size:18px;display:flex}
.lbl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.val{margin-top:12px;display:flex;align-items:baseline}
.num{font-size:1.95rem;font-weight:750;letter-spacing:-.025em;font-variant-numeric:tabular-nums;line-height:1;color:var(--txt);transition:color .5s}
.node.on .num{color:rgb(var(--c));text-shadow:none}
.unit{font-size:.85rem;color:rgb(var(--mut));font-weight:650;margin-left:5px}
.tag{display:inline-flex;margin-top:9px;font-size:.64rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:rgba(var(--c),.15);color:rgb(var(--c))}
.tag:empty{display:none}
.sub{margin-top:9px;font-size:.74rem;color:rgb(var(--mut));line-height:1.55}
.sub:empty{display:none}
.sub b{color:var(--txt);font-weight:600;font-variant-numeric:tabular-nums}
.soc{margin-top:13px;position:relative;height:9px;border-radius:999px;background:rgba(var(--ov),.07);overflow:hidden}
.soc-fill{position:absolute;top:0;left:0;bottom:0;width:0;border-radius:inherit;background:linear-gradient(90deg,rgba(var(--sc,var(--c)),.45),rgb(var(--sc,var(--c))));box-shadow:0 0 0 1px rgba(var(--sc,var(--c)),.35);transition:width 1.2s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.bat.charging .soc-fill:after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent,rgba(var(--ov),.55),transparent);animation:shine 1.8s linear infinite}
@keyframes shine{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.soc-row{display:flex;justify-content:space-between;margin-top:7px;font-size:.72rem;color:rgb(var(--mut))}
.soc-row b{color:var(--txt);font-variant-numeric:tabular-nums}
.hub-wrap{grid-area:hub;display:flex;flex-direction:column;align-items:center}
.hub{position:relative;width:100%;max-width:250px;cursor:pointer;transition:transform .25s}
.hub:before{content:'';display:block;padding-top:100%}
.hub svg{position:absolute;top:0;left:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible}
.ring-bg{fill:none;stroke:rgba(var(--ov),.06);stroke-width:6}
.orbit{fill:none;stroke:rgba(var(--ov),.16);stroke-width:.8;stroke-dasharray:.6 3.4;transform-origin:60px 60px;animation:spin 40s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.seg{fill:none;stroke:currentColor;stroke-width:6;stroke-linecap:round;stroke-dasharray:0 100;opacity:0;transition:opacity .6s,stroke-dasharray 1.2s cubic-bezier(.2,.8,.2,1),stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)}
.core{position:absolute;top:14%;left:14%;right:14%;bottom:14%;border-radius:50%;background:radial-gradient(circle at 50% 28%,var(--bg2),var(--bg0) 72%);border:1px solid rgba(var(--ov),.08);box-shadow:0 0 0 1px rgba(var(--home),.35),inset 0 1px 0 rgba(var(--ov),.07);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;animation:pulse 3.2s ease-in-out infinite}
@keyframes pulse{50%{box-shadow:0 0 0 1px rgba(var(--home),.35),inset 0 1px 0 rgba(var(--ov),.07)}}
.core ha-icon{color:rgb(var(--home));--mdc-icon-size:26px;margin-bottom:6px}
.core .val{margin:0}
.core .num{font-size:2.15rem;color:rgb(var(--home));text-shadow:none}
.hub-lbl{font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:rgb(var(--mut));font-weight:650;margin-top:7px}
.mix{display:flex;font-size:.7rem;color:rgb(var(--mut));flex-wrap:wrap;justify-content:center;margin-top:14px}
.mix span{display:flex;align-items:center;margin:0 6px}
.mix i{width:7px;height:7px;border-radius:50%;background:rgb(var(--c));box-shadow:0 0 0 1px rgba(var(--c),.35);margin-right:5px}
.mix b{color:var(--txt);font-variant-numeric:tabular-nums;font-weight:600;margin-left:4px}
.consumers{position:relative;z-index:1;display:grid;justify-content:center;grid-template-columns:repeat(auto-fit,minmax(140px,240px));grid-gap:12px;gap:12px;margin-top:54px}
.cons{display:flex;align-items:center;padding:11px 12px;border-radius:17px;background:var(--glass);border:1px solid var(--stroke);cursor:pointer;transition:all .5s;min-width:0}
.cons .ico{margin-right:10px}
.cons.on{border-color:rgba(var(--c),.55);background:rgba(var(--c),.07);box-shadow:0 0 0 1px rgba(var(--c),.35)}
.cons.on .ico{animation:bob 2.4s ease-in-out infinite}
@keyframes bob{50%{box-shadow:0 0 0 1px rgba(var(--c),.35)}}
.cons:not(.on){opacity:.55}
.c-txt{display:flex;flex-direction:column;min-width:0}
.cons .lbl{font-size:.64rem;color:rgb(var(--mut));text-transform:uppercase;letter-spacing:.08em;font-weight:650;margin-bottom:3px}
.cons .val{margin:0}
.cons .num{font-size:1.1rem}.cons .unit{font-size:.7rem;margin-left:3px}
.cons.on .num{color:rgb(var(--c))}
.c-sec{margin-left:auto;padding-left:6px;font-size:.72rem;color:rgb(var(--mut));white-space:nowrap;font-variant-numeric:tabular-nums}
footer{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));grid-gap:10px;gap:10px;margin-top:20px;padding-top:18px;border-top:1px solid var(--stroke);position:relative}
.stat{display:flex;flex-direction:column;padding:11px 13px;border-radius:15px;background:rgba(var(--ov),.028);border:1px solid rgba(var(--ov),.04)}
.stat span{font-size:.62rem;color:rgb(var(--mut));text-transform:uppercase;letter-spacing:.09em;font-weight:650;display:flex;align-items:center;margin-bottom:5px}
.stat span i{width:6px;height:6px;border-radius:50%;background:rgb(var(--c));margin-right:6px}
.stat b{font-size:1.1rem;font-variant-numeric:tabular-nums;font-weight:700}
.stat small{color:rgb(var(--mut));font-weight:500;font-size:.72rem;margin-left:3px}
.groups{position:relative;z-index:1;display:grid;grid-gap:10px;gap:10px;margin-top:54px}
.grp{position:relative;padding:10px 10px 8px;border-radius:17px;background:linear-gradient(160deg,rgba(var(--ov),.06),rgba(var(--ov),.012)),var(--panel);border:1px solid var(--stroke);transition:border-color .5s,box-shadow .5s,opacity .5s;min-width:0}
.grp.on{border-color:rgba(var(--c),.6);box-shadow:inset 0 0 0 1px rgba(var(--c),.12),0 0 0 1px rgba(var(--c),.35)}
.grp:not(.on){opacity:.6}
.g-hd{display:flex;align-items:center;min-width:0}
.grp .ico{width:26px;height:26px;border-radius:9px;margin-right:7px}
.grp .ico ha-icon{--mdc-icon-size:15px}
.grp.on .ico{animation:bob 2.4s ease-in-out infinite}
.grp .lbl{font-size:.6rem;color:rgb(var(--mut));text-transform:uppercase;letter-spacing:.08em;font-weight:700}
.grp .val{margin-top:7px}
.grp .num{font-size:1.25rem}.grp .unit{font-size:.68rem;margin-left:3px}
.grp.on .num{color:rgb(var(--c));text-shadow:none}
.its{margin-top:6px;border-top:1px solid rgba(var(--ov),.06);padding-top:4px}
.it{display:flex;align-items:center;font-size:.64rem;color:rgb(var(--mut));line-height:1.8;min-width:0;cursor:pointer}
.it i{flex:none;width:5px;height:5px;border-radius:50%;background:rgba(var(--ov),.2);margin-right:5px;transition:background .4s,box-shadow .4s}
.it.on i{background:rgb(var(--c));box-shadow:0 0 0 1px rgba(var(--c),.35)}
.it.on{color:var(--txt)}
.it .in{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.it b{flex:none;margin-left:4px;color:var(--txt);font-weight:600;font-variant-numeric:tabular-nums}
.it.off{display:none}
.grp.rest .it{cursor:default}
.grp.rest .ico{background:rgba(var(--ov),.06)}
/* Tablet / Wandpanel */
.wide{padding:26px 30px}
.wide header{margin-bottom:26px}
.wide .title{font-size:1.25rem}
.wide .pill{font-size:.85rem;padding:8px 14px}
.wide .layout{grid-template-columns:1fr minmax(260px,1.1fr) 1fr;gap:28px 56px}
.wide .node{padding:20px 22px;border-radius:26px}
.wide .n-top{font-size:.8rem}
.wide .ico{width:40px;height:40px;border-radius:13px}
.wide .ico ha-icon{--mdc-icon-size:22px}
.wide .num{font-size:2.6rem}
.wide .unit{font-size:1rem}
.wide .sub{font-size:.86rem}
.wide .tag{font-size:.72rem;padding:4px 11px}
.wide .hub{max-width:300px}
.wide .core .num{font-size:2.8rem}
.wide .core ha-icon{--mdc-icon-size:32px}
.wide .hub-lbl{font-size:.72rem}
.wide .mix{font-size:.82rem}
.wide .consumers{grid-template-columns:repeat(auto-fit,minmax(200px,260px));gap:14px;margin-top:60px}
.wide .cons{padding:14px 16px;border-radius:20px}
.wide .cons .num{font-size:1.35rem}
.wide .cons .lbl{font-size:.72rem}
.wide .groups{gap:12px;margin-top:60px}
.wide .grp{padding:12px 12px 9px;border-radius:19px}
.wide .grp .num{font-size:1.5rem}
.wide .grp .lbl{font-size:.66rem}
.wide .it{font-size:.72rem}
.wide .stat b{font-size:1.35rem}
.wide .stat span{font-size:.7rem}
/* Smartphone */
.narrow{padding:16px}
.narrow header{margin-bottom:14px}
.narrow .layout{grid-template-columns:1fr 1fr;grid-template-areas:"hub hub" "pv bat" "grid bat";gap:16px 14px}
.narrow .hub{max-width:210px}
.narrow .num{font-size:1.5rem}
.narrow .core .num{font-size:1.8rem}
.narrow .groups{margin-top:26px;grid-template-columns:repeat(3,minmax(0,1fr))!important}
.narrow .consumers{margin-top:26px;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));justify-content:stretch}
.ico.logo,.grp .ico.logo{width:auto;height:auto;min-width:0;background:none;box-shadow:none;border-radius:6px}
.ico.logo img{display:block;height:28px;max-width:96px;object-fit:contain;border-radius:5px}
.cons .ico.logo img{height:30px;max-width:80px}
@media (prefers-reduced-motion:reduce){.flow,.orbit,.core,.node.on,.live,.cons.on .ico{animation-duration:0s!important}}
`;

class EnergyCockpitFlowCard extends HTMLElement {
  constructor() {
    super();
    this._tw = {};
    this._raf = null;
    this.attachShadow({ mode: 'open' });
  }
  static getStubConfig(hass) {
    // Erste passende Entitäten vorschlagen, damit die Karte nach dem Hinzufügen etwas zeigt
    const ids = hass && hass.states ? Object.keys(hass.states) : [];
    const find = (re) => ids.find((i) => re.test(i)) || '';
    // Bewusst leer: Die Karte startet im Einrichtungsassistenten, der Sensoren vorschlägt und den aktuellen Wert zeigt
    void find; void ids;
    return {};
  }
  static getConfigElement() { return document.createElement('energy-cockpit-flow-card-editor'); }
  setConfig(config) {
    WD.applyTheme(this, config, this._hass);
    if (!config || ((!config.pv || !config.pv.entity) && (!config.grid || !config.grid.entity))) {
      // Noch nicht eingerichtet: Hinweisfläche statt Fehlermeldung, der Assistent im Editor hilft weiter
      this._c = null;
      this.shadowRoot.innerHTML = '<style>' + WD.themeCss() + 'ha-card{padding:22px;border-radius:24px;background:var(--panel);color:var(--txt);font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit Energiefluss</b><div style="margin-top:8px;opacity:.8">Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Sensoren auszuwählen.</div></ha-card>';
      return;
    }
    this._c = JSON.parse(JSON.stringify(config));
    // Listen können als Array oder als Objekt {0:…, 1:…} vorliegen (so speichert sie das Formular von Home Assistant)
    const arr = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]) : []));
    const used = (x) => x && (x.entity || x.secondary);
    this._c.consumers = arr(this._c.consumers).filter(used);
    this._c.consumer_groups = arr(this._c.consumer_groups)
      .map((g) => Object.assign({}, g, { items: arr(g && g.items).filter(used) }))
      .filter((g) => g.name || g.items.length);
    this._build();
    if (this._hass) this._update();
  }
  set hass(h) {
      WD.applyTheme(this, null, h);
    setLocale(h);
    // Sprache aus Home Assistant erst jetzt bekannt: statische Texte neu aufbauen
    if (this._c && this._bl !== WD.state.lang) this._build();
    this._hass = h;
    this._update();
    if (this._c && this._c.waste && !this._wLoading && Date.now() - (this._wLoaded || 0) > 30 * 60 * 1000) this._loadWaste();
  }
  // Müllabfuhr aus dem Abfallkalender: Hinweis-Chip am Vortag / Abholtag
  async _loadWaste() {
    const h = this._hass, w = this._c.waste;
    if (!h || !h.callApi || !w.calendar) return;
    this._wLoading = true;
    try {
      const s = new Date(); s.setHours(0, 0, 0, 0);
      const e = new Date(s.getTime() + 3 * 864e5);
      const ev = await h.callApi('GET', `calendars/${w.calendar}?start=${encodeURIComponent(s.toISOString())}&end=${encodeURIComponent(e.toISOString())}`);
      this._waste = (ev || []).map((x) => {
        const t = document.createElement('textarea'); t.innerHTML = x.summary || '';
        const lower = t.value.toLowerCase();
        const type = (w.types || []).find((y) => lower.includes(y.match));
        const d = String((x.start && (x.start.date || x.start.dateTime)) || x.start).slice(0, 10).split('-').map(Number);
        return type ? { type, date: new Date(d[0], d[1] - 1, d[2]) } : null;
      }).filter(Boolean);
      this._wLoaded = Date.now();
    } catch (err) {
      console.warn('energy-cockpit-flow-card: waste', err);
      this._wLoaded = Date.now() - 25 * 60 * 1000;
    }
    this._wLoading = false;
    this._wasteChip();
  }
  _wasteChip() {
    const el = this._$('.wst'), W = this._waste, w = this._c.waste;
    if (!el || !W) return;
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mins = now.getHours() * 60 + now.getMinutes();
    const sw = String(w.day_switch || '10:00').split(':').map(Number), rf = String(w.remind_from || '16:00').split(':').map(Number);
    const todayEv = mins < sw[0] * 60 + (sw[1] || 0) ? W.filter((x) => +x.date === +today) : [];
    const tomorrowEv = W.filter((x) => +x.date === today.getTime() + 864e5 || +x.date === +new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
    const list = todayEv.length ? todayEv : tomorrowEv;
    if (!list.length) { el.classList.remove('show', 'urgent'); return; }
    const names = [...new Set(list.map((x) => x.type.name))].join(' + ');
    el.style.setProperty('--wc', list[0].type.color);
    el.innerHTML = `🗑 ${todayEv.length ? T('waste.today') : T('waste.tomorrow')}: <b>${names}</b>`;
    el.classList.add('show');
    el.classList.toggle('urgent', !!todayEv.length || mins >= rf[0] * 60 + (rf[1] || 0));
    if (w.nav_path) el.dataset.nav = w.nav_path;
  }
  getCardSize() { return 9; }
  getGridOptions() { return { columns: 'full', min_columns: 6 }; }
  connectedCallback() {
    if (!this._ro && window.ResizeObserver) this._ro = new ResizeObserver(() => this._schedLayout());
    this._observe();
    if (!this._onResize) { this._onResize = () => this._schedLayout(); }
    window.addEventListener('resize', this._onResize);
    if (!this._kaSub) this._kaSub = () => this._kaRender();
    KA.subs.add(this._kaSub);
    this._kaRender();
    this._clockT = setInterval(() => { this._clock(); this._wasteChip(); }, 15000);
    this._clock();
    this._schedLayout();
  }
  disconnectedCallback() {
    if (this._ro) this._ro.disconnect();
    window.removeEventListener('resize', this._onResize);
    if (this._kaSub) KA.subs.delete(this._kaSub);
    clearInterval(this._clockT);
  }
  _observe() {
    if (!this._ro || !this.shadowRoot) return;
    this._ro.disconnect();
    this.shadowRoot.querySelectorAll('.stage,.node,.hub,.cons,.grp,.banner').forEach((el) => this._ro.observe(el));
  }
  _$(s) { return this.shadowRoot.querySelector(s); }
  // keep_awake: 'auto' (nur im Silk-Browser des Echo Show, Standard) | true | false
  _kaRender() {
    const mode = this._c ? this._c.keep_awake : 'auto';
    const want = mode === true || ((mode === undefined || mode === 'auto') && KA.silk);
    if (want) KA.enabled = true;
    const el = this._$('.ka');
    if (!el) return;
    el.classList.toggle('show', want);
    el.classList.toggle('on', want && KA.active);
    el.classList.toggle('wait', want && !KA.active);
    el.textContent = KA.active ? T('ka.on') : T('ka.wait');
  }
  _clock() {
    const el = this._$('.clock');
    if (el && this._c.show_clock !== false) el.textContent = new Date().toLocaleTimeString(WD.state.loc, { hour: '2-digit', minute: '2-digit' });
  }

  _build() {
    const c = this._c;
    this._bl = WD.state.lang;
    const node = (k, cls, icon, label, color, ent, extra = '') => `
      <div class="node ${cls}" data-k="${k}" data-e="${ent || ''}" style="--c:${color}">
        <div class="n-top"><span class="ico"><ha-icon icon="${icon}"></ha-icon></span><span class="lbl">${label}</span></div>
        <div class="val"><span class="num">—</span><span class="unit"></span></div>
        <div class="tag"></div>${extra}<div class="sub"></div>
      </div>`;
    const links = [];
    let nodes = '';
    if (c.pv) { nodes += node('pv', 'pv', c.pv.icon || 'mdi:solar-power-variant', c.pv.name || T('flow.pv'), PAL.pv, c.pv.entity); links.push('pv'); }
    if (c.grid) { nodes += node('grid', 'grid', c.grid.icon || 'mdi:transmission-tower', c.grid.name || T('flow.grid'), PAL.imp, c.grid.entity); links.push('grid'); }
    if (c.battery) {
      nodes += node('bat', 'bat', c.battery.icon || 'mdi:home-battery-outline', c.battery.name || T('flow.battery'), PAL.bat, c.battery.power,
        `<div class="soc"><div class="soc-fill"></div></div><div class="soc-row"><span>${T('flow.soc')}</span><b class="soc-txt">—</b></div>`);
      links.push('bat');
    }
    const cons = c.consumers.map((x, i) => {
      if (x.entity) links.push('c' + i);
      return `<div class="cons" data-k="c${i}" data-e="${x.entity || x.secondary || ''}" style="--c:${rgb(x.color || '#a78bfa')}">
        ${x.image ? `<span class="ico logo"><img src="${esc(x.image)}" alt=""></span>` : `<span class="ico"><ha-icon icon="${x.icon || 'mdi:power-plug'}"></ha-icon></span>`}
        <div class="c-txt"><span class="lbl">${x.name || x.entity}</span><span class="val"><span class="num">—</span><span class="unit"></span></span></div>
        <span class="c-sec"></span></div>`;
    }).join('');
    const G = c.consumer_groups;
    let grps = '';
    if (G.length) {
      grps = G.map((g, i) => {
        links.push('g' + i);
        return `<div class="grp" data-k="g${i}" style="--c:${rgb(g.color || '#a78bfa')}">
          <div class="g-hd">${g.image ? `<span class="ico logo"><img src="${esc(g.image)}" alt=""></span>` : `<span class="ico"><ha-icon icon="${g.icon || 'mdi:door'}"></ha-icon></span>`}<span class="lbl">${g.name || ''}</span></div>
          <div class="val"><span class="num">—</span><span class="unit"></span></div>
          <div class="its">${(g.items || []).map((x, j) => `<div class="it" data-i="${i}-${j}" data-e="${x.entity || x.secondary || ''}"><i></i><span class="in">${x.name || x.entity}</span><b></b></div>`).join('')}</div>
        </div>`;
      }).join('');
      const showRest = c.rest !== false;
      if (showRest) {
        links.push('grest');
        grps += `<div class="grp rest" data-k="grest" style="--c:${PAL.mut}">
          <div class="g-hd"><span class="ico"><ha-icon icon="mdi:help-circle-outline"></ha-icon></span><span class="lbl">${(c.rest && c.rest.name) || T('flow.rest')}</span></div>
          <div class="val"><span class="num">—</span><span class="unit"></span></div>
          <div class="its"><div class="it"><span class="in rest-t"></span></div></div>
        </div>`;
      }
      grps = `<div class="groups" style="grid-template-columns:repeat(${G.length + (showRest ? 1 : 0)},minmax(0,1fr))">${grps}</div>`;
    }
    const d = (k, lbl, color) => `<div class="stat" data-s="${k}" style="--c:${color}"><span><i></i>${lbl}</span><b>—</b></div>`;
    let stats = '';
    if (c.pv && c.pv.daily) stats += d('pv', T('stat.pv'), PAL.pv);
    if (c.grid && c.grid.daily_import) stats += d('imp', T('stat.imp'), PAL.imp);
    if (c.grid && c.grid.daily_export) stats += d('exp', T('stat.exp'), PAL.exp);
    if (c.battery && (c.battery.daily_charge || c.battery.daily_discharge)) stats += d('bat', T('stat.bat'), PAL.bat);
    stats += d('aut', T('stat.aut'), PAL.home);

    this.shadowRoot.innerHTML = `<style>${CSS}</style>
    <ha-card><div class="wrap">
      <header>
        <div class="title"><span class="live"></span>${esc(c.title || T('flow.title'))}<span class="clock"></span></div>
        <div class="pill ka"></div>
        <div class="pill wst"></div>
        <div class="pill">${T('pill.aut')}<b data-p="aut">—</b></div>
        <div class="pill">${T('pill.self')}<b data-p="self">—</b></div>
        ${c.nav_path ? `<div class="navbtn" data-nav="${c.nav_path}">${esc(c.nav_label || T('flow.next'))}</div>` : ''}
      </header>
      <div class="banner"><div class="b-ico"><ha-icon icon="mdi:white-balance-sunny"></ha-icon></div><div class="b-txt"><span class="b-title"></span><span class="b-sub"></span></div><div class="b-chips"></div></div>
      <div class="stage">
        <svg class="links">${links.map((k) => `<g class="link" data-l="${k}"><path class="track"/><path class="glow"/><path class="flow"/></g>`).join('')}</svg>
        <div class="layout">
          ${nodes}
          <div class="hub-wrap">
            <div class="hub" data-e="${(c.home && c.home.entity) || ''}">
              <svg viewBox="0 0 120 120">
                <circle class="orbit" cx="60" cy="60" r="58.5"/>
                <circle class="ring-bg" cx="60" cy="60" r="52"/>
                <circle class="seg" data-g="pv" cx="60" cy="60" r="52" pathLength="100" style="color:rgb(${PAL.pv})"/>
                <circle class="seg" data-g="bat" cx="60" cy="60" r="52" pathLength="100" style="color:rgb(${PAL.bat})"/>
                <circle class="seg" data-g="grid" cx="60" cy="60" r="52" pathLength="100" style="color:rgb(${PAL.imp})"/>
              </svg>
              <div class="core">
                <ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon>
                <div class="val"><span class="num">—</span><span class="unit"></span></div>
                <div class="hub-lbl">${(c.home && c.home.name) || T('flow.home')}</div>
              </div>
            </div>
            <div class="mix">
              <span style="--c:${PAL.pv}"><i></i>${T('mix.pv')}<b data-m="pv">—</b></span>
              ${c.battery ? `<span style="--c:${PAL.bat}"><i></i>${T('mix.bat')}<b data-m="bat">—</b></span>` : ''}
              <span style="--c:${PAL.imp}"><i></i>${T('mix.grid')}<b data-m="grid">—</b></span>
            </div>
          </div>
        </div>
        ${cons ? `<div class="consumers">${cons}</div>` : ''}
        ${grps}
      </div>
      <footer>${stats}</footer>
    </div></ha-card>`;

    this._links = links.map((k) => ({ k, g: this._$(`g[data-l="${k}"]`), el: this._$(`[data-k="${k}"]`) }));
    this.shadowRoot.addEventListener('click', (e) => {
      const nv = e.target.closest('[data-nav]');
      if (nv) { haNavigate(nv.dataset.nav); return; }
      const t = e.target.closest('[data-e]');
      if (!t || !t.dataset.e) return;
      this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: t.dataset.e }, bubbles: true, composed: true }));
    });
    this._tw = {};
    this._observe();
    this._clock();
    this._kaRender();
    this._schedLayout();
  }


  // Auto-Fit: skaliert den Karteninhalt so, dass er in die sichtbare Bildschirmhöhe passt
  _fit() {
    const wrap = this._$('.wrap'), card = this._$('ha-card');
    if (!wrap || !card) return 1;
    wrap.style.transform = ''; wrap.style.width = ''; card.style.height = '';
    if (this._c.fit_screen === false) return (this._scale = 1);
    const top = Math.max(0, this.getBoundingClientRect().top);
    const avail = window.innerHeight - top - (this._c.fit_margin === undefined ? 8 : this._c.fit_margin);
    let s = 1;
    const cw = card.clientWidth;
    if (avail > 200 && cw && wrap.offsetHeight > avail) {
      s = Math.max(0.55, avail / wrap.offsetHeight);
      wrap.style.width = (cw / s) + 'px';
      s = Math.max(0.55, Math.min(1, avail / wrap.offsetHeight));
      wrap.style.width = (cw / s) + 'px';
      wrap.style.transform = 'scale(' + s + ')';
      card.style.height = Math.ceil(wrap.offsetHeight * s) + 'px';
    }
    return (this._scale = s);
  }

  _schedLayout() {
    if (this._lr) return;
    this._lr = requestAnimationFrame(() => { this._lr = null; this._layout(); });
  }
  _layout() {
    const wrap = this._$('.wrap'), st = this._$('.stage'), hub = this._$('.hub');
    if (!st || !hub) return;
    const w = this.getBoundingClientRect().width;
    if (!w) return;
    const mode = w >= 900 ? 'wide' : w < 600 ? 'narrow' : '';
    if (mode !== this._mode) {
      wrap.classList.remove('wide', 'narrow');
      if (mode) wrap.classList.add(mode);
      this._mode = mode;
    }
    const k0 = this._fit();
    const sr = st.getBoundingClientRect();
    const hr = hub.getBoundingClientRect();
    const cx = (hr.left + hr.width / 2 - sr.left) / k0, cy = (hr.top + hr.height / 2 - sr.top) / k0, R = hr.width * 0.465 / k0;
    for (const L of this._links) {
      if (!L.el) continue;
      if (!L.el.offsetParent) { L.g.querySelectorAll('path').forEach((p) => p.setAttribute('d', '')); continue; }
      const r = L.el.getBoundingClientRect();
      const top = (r.top - sr.top) / k0, bottom = (r.bottom - sr.top) / k0, left = (r.left - sr.left) / k0, right = (r.right - sr.left) / k0;
      const ncx = (left + right) / 2, ncy = (top + bottom) / 2;
      let ax, ay, tx, ty;
      if (top > cy + R * 0.7) { ax = ncx; ay = top; tx = 0; ty = -1; }
      else if (bottom < cy - R * 0.7) { ax = ncx; ay = bottom; tx = 0; ty = 1; }
      else if (ncx < cx) { ax = right; ay = ncy; tx = 1; ty = 0; }
      else { ax = left; ay = ncy; tx = -1; ty = 0; }
      let ang = Math.atan2(ay - cy, ax - cx);
      // Verbraucher unterhalb: Linie immer aus der Unterseite des Rings führen
      if (ty === -1) ang = Math.max(Math.PI / 2 - 0.6, Math.min(Math.PI / 2 + 0.6, ang));
      const bx = cx + Math.cos(ang) * R, by = cy + Math.sin(ang) * R;
      const k = Math.hypot(ax - bx, ay - by) * 0.45;
      const d = `M${ax.toFixed(1)},${ay.toFixed(1)} C${(ax + tx * k).toFixed(1)},${(ay + ty * k).toFixed(1)} ${(bx + Math.cos(ang) * k).toFixed(1)},${(by + Math.sin(ang) * k).toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`;
      L.g.querySelectorAll('path').forEach((p) => p.setAttribute('d', d));
    }
  }

  _anim(key, target, root) {
    const numEl = root.querySelector('.num'), unitEl = root.querySelector('.unit');
    let t = this._tw[key];
    if (target === null) {
      this._tw[key] = { target: null };
      numEl.textContent = '—'; unitEl.textContent = '';
      return;
    }
    if (!t || t.target === null || t.cur === undefined) t = this._tw[key] = { cur: target };
    if (t.target === target && t.numEl === numEl) return;
    Object.assign(t, { from: t.cur, target, t0: performance.now(), numEl, unitEl });
    if (!this._raf) this._raf = requestAnimationFrame((n) => this._tick(n));
  }
  _tick(now) {
    let running = false;
    for (const t of Object.values(this._tw)) {
      if (t.target === null || t.from === undefined || t.done) continue;
      const p = Math.min(1, (now - t.t0) / 900);
      const e = 1 - Math.pow(1 - p, 3);
      t.cur = t.from + (t.target - t.from) * e;
      const [n, u] = splitW(t.cur);
      if (t.numEl.textContent !== n) t.numEl.textContent = n;
      if (t.unitEl.textContent !== u) t.unitEl.textContent = u;
      if (p < 1) running = true;
    }
    this._raf = running ? requestAnimationFrame((n) => this._tick(n)) : null;
  }

  _link(k, active, forward, color, power) {
    const L = this._links && this._links.find((x) => x.k === k);
    if (!L) return;
    L.g.classList.toggle('on', !!active);
    L.g.classList.toggle('rev', !forward);
    L.g.style.setProperty('--c', color);
    const speed = 22 + 120 * Math.min(1, Math.sqrt(Math.abs(power || 0) / 8000));
    const dur = (18 / speed).toFixed(2) + 's';
    if (L.dur !== dur) { L.dur = dur; L.g.style.setProperty('--d', dur); }
  }

  // Akku-Prognose: geglättete Leistung (~5 min) -> Uhrzeit "voll um" / "reicht bis"
  _batForecast(bat, soc) {
    const c = this._c, h = this._hass, cap = parseFloat(c.battery.capacity_kwh);
    const now = Date.now();
    if (bat !== null) {
      const dt = this._emaT ? (now - this._emaT) / 1000 : 0;
      const a = dt > 0 ? 1 - Math.exp(-dt / 300) : 1;
      this._ema = this._ema === undefined ? bat : this._ema + a * (bat - this._ema);
      this._emaT = now;
    }
    if (!cap || soc === null) return '';
    const maxSoc = val(h, c.battery.max_soc, 100), reserve = val(h, c.battery.reserve_soc, 0);
    // Richtungswechsel oder Glättung noch nicht eingeschwungen -> aktuellen Wert nehmen
    const e = this._ema || 0;
    const p = bat !== null && (Math.sign(e) !== Math.sign(bat) || Math.abs(e) < Math.abs(bat) * 0.3) ? bat : e;
    const avail = Math.max(0, (soc - reserve) / 100 * cap);
    if (p > 50 && soc < maxSoc - 0.5) {
      const hrs = ((maxSoc - soc) / 100) * cap * 1000 / p;
      if (hrs > 24) return T('bat.usable_slow', { kwh: nf(avail, 1) });
      return T('bat.full_at', { time: clock(now + hrs * 3600e3), dur: fDur(hrs) });
    }
    if (p < -50 && soc > reserve + 0.5) {
      const hrs = avail * 1000 / -p;
      if (hrs > 24) return T('bat.last_24', { kwh: nf(avail, 1) });
      return T('bat.last_until', { time: clock(now + hrs * 3600e3), dur: fDur(hrs) });
    }
    if (soc >= maxSoc - 0.5) return T('bat.full', { kwh: nf(avail, 1) });
    return T('bat.usable', { kwh: nf(avail, 1), res: Math.round(reserve) });
  }

  // Präsenz-Banner: PV-Überschuss oder hoher Netzbezug (mit Verzögerung gegen Flackern)
  _banner(x) {
    const c = this._c, h = this._hass, el = this._$('.banner');
    if (!el) return;
    const sc = c.surplus || {}, gc = c.grid_alert || {};
    const now = Date.now();
    const price = WD.price(h, c.grid_price, c.grid_price_ct, null), feed = WD.price(h, c.feed_in, c.feed_in_ct, 0);
    const thrS = sc.threshold || 1500, thrG = gc.threshold || 1000;
    const delayS = (sc.delay === undefined ? 60 : sc.delay) * 1000, delayG = (gc.delay === undefined ? 120 : gc.delay) * 1000;
    const surOn = sc.enabled !== false && x.gExp > (this._modeB === 'sur' ? thrS * 0.7 : thrS);
    const impOn = gc.enabled !== false && x.gImp > (this._modeB === 'imp' ? thrG * 0.7 : thrG);
    this._surT = surOn ? (this._surT || now) : 0;
    this._impT = impOn ? (this._impT || now) : 0;
    let mode = null;
    if (surOn && now - this._surT >= delayS) mode = 'sur';
    else if (impOn && now - this._impT >= delayG) mode = 'imp';
    // Nachprüfen, sobald die Verzögerung abgelaufen ist (auch ohne neue Sensorwerte)
    clearTimeout(this._bT);
    if (!mode && (surOn || impOn)) this._bT = setTimeout(() => this._update(), 5000);
    this._modeB = mode;
    el.classList.toggle('show', !!mode);
    el.classList.toggle('sur', mode === 'sur');
    el.classList.toggle('imp', mode === 'imp');
    if (!mode) return;
    const icon = el.querySelector('ha-icon');
    let title, sub, chips = '';
    if (mode === 'sur') {
      icon.setAttribute('icon', 'mdi:white-balance-sunny');
      title = '☀ ' + T('ban.surplus', { w: fW(x.gExp) });
      const gain = price === null ? null : x.gExp / 1000 * Math.max(0, price - feed);
      sub = (x.soc !== null && x.soc >= 95 ? T('ban.batfull') : '') + (gain === null ? T('ban.tonet0') : T('ban.tonet', { gain: nf(gain, 2), cur: cur() }));
      chips = (sc.suggestions || []).map((s) => {
        const st = s.entity && h.states[s.entity];
        const running = st && (st.state === 'on' || (parseFloat(st.state) || 0) > 10);
        if (!running && s.power && s.power > x.gExp) return '';
        return `<span class="chip${running ? ' run' : ''}"><ha-icon icon="${s.icon || 'mdi:power-plug'}"></ha-icon>${running ? '✓ ' + (s.running || T('ban.running', { name: s.name })) : s.name}</span>`;
      }).join('');
    } else {
      icon.setAttribute('icon', 'mdi:transmission-tower-import');
      title = '⚡ ' + T('ban.fromgrid', { w: fW(x.gImp) });
      const cost = price === null ? null : x.gImp / 1000 * price;
      let why = x.soc !== null && x.soc <= val(h, c.battery && c.battery.reserve_soc, 0) + 2 ? T('ban.batempty') : (x.bat !== null && -x.bat > 3000 ? T('ban.batlimit') : '');
      let big = null;
      (c.consumers || []).concat(...(c.consumer_groups || []).map((g) => g.items || [])).forEach((s) => { const w = s.entity ? watt(h, s.entity) : null; if (w && w > 500 && (!big || w > big.w)) big = { n: s.name, w }; });
      if (big) why = (why ? why + ' · ' : '') + `${big.n}: ${fW(big.w)}`;
      sub = (cost === null ? '' : T('ban.cost', { cost: nf(cost, 2), cur: cur() }) + (why ? ' · ' : '')) + why;
    }
    this._set('.b-title', title);
    this._set('.b-sub', sub, true);
    this._set('.b-chips', chips, true);
  }

  _set(sel, txt, isHtml) {
    const el = this._$(sel);
    if (!el) return;
    if (isHtml) { if (el.innerHTML !== txt) el.innerHTML = txt; }
    else if (el.textContent !== txt) el.textContent = txt;
  }

  _update() {
    const h = this._hass, c = this._c;
    if (!h || !c || !this._$('.stage')) return;
    const pv = c.pv ? watt(h, c.pv.entity) : null;
    let grid = c.grid ? watt(h, c.grid.entity) : null;
    if (grid !== null && c.grid.invert) grid = -grid;
    let bat = c.battery ? watt(h, c.battery.power) : null;
    if (bat !== null && c.battery.invert) bat = -bat;
    const soc = c.battery ? num(h, c.battery.soc) : null;
    let home = c.home && c.home.entity ? watt(h, c.home.entity) : null;
    if (home === null) home = Math.max(0, (pv || 0) + (grid || 0) - (bat || 0));

    const gImp = Math.max(0, grid || 0), gExp = Math.max(0, -(grid || 0));
    const bDis = Math.max(0, -(bat || 0)), bChg = Math.max(0, bat || 0);
    const pvHome = Math.min(Math.max(0, pv || 0), Math.max(0, home - gImp - bDis));
    const tot = pvHome + gImp + bDis;

    this._set('[data-p="aut"]', home > TH ? fPct(1 - gImp / home) : '—');
    this._set('[data-p="self"]', (pv || 0) > TH ? fPct(1 - gExp / pv) : '—');

    if (c.pv) {
      const el = this._$('[data-k="pv"]'), on = (pv || 0) > TH;
      el.classList.toggle('on', on);
      this._anim('pv', pv, el);
      this._set('.pv .tag', pv === null ? T('tag.offline') : on ? T('tag.producing') : T('tag.idle'));
      const parts = (c.pv.strings || []).map((s) => `${s.name || s.entity} <b>${fW(watt(h, s.entity))}</b>`);
      const fc = c.pv.forecast ? watt(h, c.pv.forecast) : null;
      if (fc !== null) parts.push(`${T('forecast')} <b>${fW(fc)}</b>`);
      this._set('.pv .sub', parts.join('<br>'), true);
      this._link('pv', on, true, PAL.pv, pv);
    }
    if (c.grid) {
      const el = this._$('[data-k="grid"]'), on = Math.abs(grid || 0) > TH, imp = (grid || 0) > 0;
      const col = imp ? PAL.imp : PAL.exp;
      el.style.setProperty('--c', on ? col : PAL.mut);
      el.classList.toggle('on', on);
      this._anim('grid', grid === null ? null : Math.abs(grid), el);
      this._set('.grid .tag', grid === null ? T('tag.offline') : !on ? T('tag.balanced') : imp ? T('tag.import') : T('tag.export'));
      this._link('grid', on, imp, col, grid);
    }
    if (c.battery) {
      const el = this._$('[data-k="bat"]'), on = Math.abs(bat || 0) > TH, chg = (bat || 0) > 0;
      const col = on && chg ? PAL.chg : PAL.bat;
      el.classList.toggle('on', on);
      el.classList.toggle('charging', on && chg);
      el.style.setProperty('--c', col);
      this._anim('bat', bat === null ? null : Math.abs(bat), el);
      this._set('.bat .tag', bat === null ? T('tag.offline') : !on ? T('tag.standby') : chg ? T('tag.charging') : T('tag.discharging'));
      const fill = this._$('.soc-fill');
      fill.style.width = (soc === null ? 0 : Math.max(0, Math.min(100, soc))) + '%';
      fill.style.setProperty('--sc', soc !== null && soc < 20 ? PAL.imp : soc !== null && soc < 40 ? PAL.pv : col);
      this._set('.soc-txt', soc === null ? '—' : Math.round(soc) + ' %');
      this._set('.bat .sub', this._batForecast(bat, soc), true);
      this._link('bat', on, !chg, col, bat);
    }
    this._banner({ pv, grid, bat, soc, home, gImp, gExp });
    this._anim('home', home, this._$('.core'));
    const sh = { pv: tot ? pvHome / tot : 0, bat: tot ? bDis / tot : 0, grid: tot ? gImp / tot : 0 };
    let start = 0;
    ['pv', 'bat', 'grid'].forEach((k) => {
      const seg = this._$(`.seg[data-g="${k}"]`);
      const len = sh[k] * 100, full = len > 99.5, gap = full || len < 0.5 ? 0 : 3;
      const vis = Math.max(0, len - gap);
      seg.style.strokeDasharray = `${vis.toFixed(2)} ${(100 - vis).toFixed(2)}`;
      seg.style.strokeDashoffset = `${(-(start + gap / 2)).toFixed(2)}`;
      seg.style.opacity = vis < 0.5 ? '0' : '1';
      start += len;
      this._set(`[data-m="${k}"]`, tot ? Math.round(sh[k] * 100) + ' %' : '—');
    });
    c.consumers.forEach((x, i) => {
      const el = this._$(`[data-k="c${i}"]`);
      if (!el) return;
      const secSt = x.secondary && h.states[x.secondary];
      const dec = x.secondary_decimals === undefined ? 1 : x.secondary_decimals;
      const secTxt = secSt && !['unavailable', 'unknown'].includes(secSt.state)
        ? `${nf(parseFloat(secSt.state) || 0, dec)} ${secSt.attributes.unit_of_measurement || ''}`.trim() : '';
      if (x.entity) {
        const p = watt(h, x.entity), on = (p || 0) > TH;
        el.classList.toggle('on', on);
        this._anim('c' + i, p, el);
        this._set(`[data-k="c${i}"] .c-sec`, p === null ? T('offline') : secTxt);
        this._link('c' + i, on, false, rgb(x.color || '#a78bfa'), p);
      } else {
        el.classList.add('on');
        const parts = secTxt ? secTxt.split(' ') : ['—'];
        this._set(`[data-k="c${i}"] .num`, parts[0]);
        this._set(`[data-k="c${i}"] .unit`, parts.slice(1).join(' '));
      }
    });
    const G = c.consumer_groups || [];
    if (G.length) {
      let known = 0, vis = 0;
      G.forEach((g, i) => {
        const el = this._$(`[data-k="g${i}"]`);
        if (!el) return;
        let sum = 0, any = false;
        (g.items || []).forEach((x, j) => {
          const it = this._$(`[data-i="${i}-${j}"]`);
          if (!it) return;
          const st = x.entity ? h.states[x.entity] : null;
          it.classList.toggle('off', !!x.entity && (!st || st.state === 'unavailable'));
          const p = x.entity ? watt(h, x.entity) : null;
          let txt = '';
          if (p !== null) { sum += p; any = true; const sp = splitW(p); txt = sp[0] + ' ' + sp[1]; }
          const sec = x.secondary && h.states[x.secondary];
          if (!txt && sec && !['unavailable', 'unknown'].includes(sec.state)) {
            const dec = x.secondary_decimals === undefined ? 1 : x.secondary_decimals;
            txt = `${nf(parseFloat(sec.state) || 0, dec)} ${sec.attributes.unit_of_measurement || ''}`.trim();
          }
          it.classList.toggle('on', (p || 0) > TH);
          const b = it.querySelector('b');
          if (b.textContent !== txt) b.textContent = txt;
        });
        known += sum;
        const shown = (g.items || []).some((x) => !x.entity || (h.states[x.entity] && h.states[x.entity].state !== 'unavailable'));
        el.style.display = shown ? '' : 'none';
        if (shown) vis++;
        const on = shown && sum > TH;
        el.classList.toggle('on', on);
        this._anim('g' + i, any ? sum : null, el);
        this._link('g' + i, on, false, rgb(g.color || '#a78bfa'), sum);
      });
      const rel = this._$('[data-k="grest"]');
      if (rel) vis++;
      if (vis !== this._gVis) {
        this._gVis = vis;
        const gw = this._$('.groups');
        if (gw) gw.style.gridTemplateColumns = `repeat(${Math.max(1, vis)},minmax(0,1fr))`;
        this._schedLayout();
      }
      if (rel) {
        const rest = Math.max(0, home - known);
        const on = rest > TH;
        rel.classList.toggle('on', on);
        this._anim('grest', rest, rel);
        this._link('grest', on, false, PAL.mut, rest);
        this._set('.rest-t', home > TH ? T('flow.restpct', { n: Math.round(Math.min(1, known / home) * 100) }) : '');
      }
    }
    const dPv = c.pv ? num(h, c.pv.daily) : null;
    const dImp = c.grid ? num(h, c.grid.daily_import) : null;
    const dExp = c.grid ? num(h, c.grid.daily_export) : null;
    const dChg = c.battery ? num(h, c.battery.daily_charge) : null;
    const dDis = c.battery ? num(h, c.battery.daily_discharge) : null;
    this._set('[data-s="pv"] b', `${fKwh(dPv)}<small>kWh</small>`, true);
    this._set('[data-s="imp"] b', `${fKwh(dImp)}<small>kWh</small>`, true);
    this._set('[data-s="exp"] b', `${fKwh(dExp)}<small>kWh</small>`, true);
    this._set('[data-s="bat"] b', `+${fKwh(dChg)}<small>/</small> −${fKwh(dDis)}<small>kWh</small>`, true);
    let aut = null;
    if (dPv !== null && dImp !== null) {
      const cons = dPv + dImp - (dExp || 0) - (dChg || 0) + (dDis || 0);
      if (cons > 0) aut = 1 - dImp / cons;
    }
    this._set('[data-s="aut"] b', fPct(aut));
  }
}

if (!customElements.get('energy-cockpit-flow-card')) {
  customElements.define('energy-cockpit-flow-card', EnergyCockpitFlowCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: 'energy-cockpit-flow-card', name: 'energy-cockpit Energiefluss', description: 'Animierter Energiefluss (PV, Netz, Batterie, Verbraucher)', preview: true });
}
})();
