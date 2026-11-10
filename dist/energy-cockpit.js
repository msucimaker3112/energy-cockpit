/*! energy-cockpit v0.25.3 - MIT License */
/* ---- common.js ---- */
/* Gemeinsame Helfer für alle energy-cockpit-Karten. Wird im Bundle als globales Objekt WD bereitgestellt. */
const WD = (() => {
  const state = { loc: 'de-DE', lang: 'de', currency: 'EUR' };

  // Währung aus Home Assistant übernehmen (Sprache ist fest Deutsch)
  const setLocale = (hass) => {
    if (!hass) return;
    // Entscheidung: komplett deutsch (Texte und Zahlenformat), nur die Währung kommt aus Home Assistant
    state.currency = (hass.config && hass.config.currency) || state.currency;
  };

  const PAL = { pv: '255,197,61', imp: '255,92,122', exp: '52,211,153', bat: '96,165,250', chg: '56,189,248', home: '34,211,238', mut: '139,151,179' };
  const TH = 10;

  // Farbe "#hex" oder "r,g,b" -> "r,g,b"; alles andere wird verworfen
  const accentRgb = (a) => {
    if (typeof a !== 'string') return '';
    const s = a.trim();
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
    }
    return /^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}$/.test(s) ? s.replace(/\s+/g, '') : '';
  };
  // Sichere Farbe für style-Attribute: Palettenname, "#hex" oder "r,g,b", sonst Standardwert
  const rgb = (c, def) => {
    if (c && PAL[c]) return PAL[c];
    return accentRgb(c) || def || PAL.bat;
  };
  const num = (h, id) => {
    if (!id) return null;
    const s = h.states[id];
    if (!s || ['unavailable', 'unknown', ''].includes(s.state)) return null;
    const v = parseFloat(s.state);
    return isNaN(v) ? null : v;
  };
  // Leistung in W (kW und MW werden umgerechnet)
  const watt = (h, id) => {
    const v = num(h, id);
    if (v === null) return null;
    const u = h.states[id].attributes.unit_of_measurement || 'W';
    const ul = String(u).toLowerCase();
    return ul === 'kw' ? v * 1000 : ul === 'mw' ? v * 1e6 : v;
  };
  // Energie in kWh (Wh und MWh werden umgerechnet, ohne Einheit gilt kWh). raw: Wert ungeprüft übernehmen (energy_unit: kwh)
  const kwh = (h, id, raw) => {
    if (!h || !id) return null;
    const v = num(h, id);
    if (v === null || raw) return v;
    const ul = String(h.states[id].attributes.unit_of_measurement || '').toLowerCase();
    return ul === 'wh' ? v / 1000 : ul === 'mwh' ? v * 1000 : v;
  };
  const rawUnits = (c) => !!c && String(c.energy_unit || '').toLowerCase() === 'kwh';
  // Zusatz für recorder/statistics_during_period: Home Assistant liefert Energie in kWh und Leistung in W
  const statUnits = (c) => (rawUnits(c) ? {} : { units: { energy: 'kWh', power: 'W' } });
  // Zahl oder Entität; sonst Standardwert
  const val = (h, v, def) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') { const x = num(h, v); return x === null ? def : x; }
    return def;
  };
  // Preis in Euro pro kWh: Sensor, Helfer oder Zahl, sonst fester Preis in Cent (…_ct), sonst Standardwert
  const price = (h, v, ct, def) => { const x = val(h, v, null); if (x !== null) return x; return typeof ct === 'number' && ct >= 0 ? ct / 100 : def; };

  // Farbschemen: alle Karten färben sich über CSS-Variablen. Standard ist "dunkel" (bisheriges Design).
  const THEMES = {
    dunkel: { n: 'Dunkel', d: 'Mitternachtsblau (Standard)', ov: '255,255,255', bg0: '#070b14', bg1: '#121b30', bg2: '#172440', panel: '#0c1322', txt: '#e8eefc', mut: '139,151,179', stroke: 'rgba(255,255,255,.08)', glass: 'rgba(255,255,255,.035)', y1: '#fef08a', o1: '#fed7aa', y0: '#fff7c2' },
    graphit: { n: 'Graphit', d: 'Neutrales Dunkelgrau', ov: '255,255,255', bg0: '#101011', bg1: '#242427', bg2: '#2e2e32', panel: '#1b1b1e', txt: '#ececee', mut: '152,152,162', stroke: 'rgba(255,255,255,.09)', glass: 'rgba(255,255,255,.04)', y1: '#fef08a', o1: '#fed7aa', y0: '#fff7c2' },
    hell: { n: 'Hell', d: 'Weiß mit kühlem Grau', ov: '15,23,42', bg0: '#e6ecf5', bg1: '#ffffff', bg2: '#f1f5f9', panel: '#ffffff', txt: '#0f172a', mut: '71,85,105', stroke: 'rgba(15,23,42,.12)', glass: 'rgba(15,23,42,.04)', y1: '#a16207', o1: '#c2410c', y0: '#854d0e' },
    warm: { n: 'Warm', d: 'Helles Papier', ov: '60,40,20', bg0: '#ece2d2', bg1: '#fbf6ec', bg2: '#f5ecdc', panel: '#fffaf0', txt: '#2b2118', mut: '115,98,82', stroke: 'rgba(60,40,20,.15)', glass: 'rgba(60,40,20,.05)', y1: '#a16207', o1: '#c2410c', y0: '#854d0e' },
    ha: { n: 'Home Assistant', d: 'Farben deines HA-Designs', ov: '128,128,128', bg0: 'var(--card-background-color,#1c1c1c)', bg1: 'var(--card-background-color,#1c1c1c)', bg2: 'var(--secondary-background-color,#2b2b2b)', panel: 'var(--secondary-background-color,#222)', txt: 'var(--primary-text-color,#e1e1e1)', mut: '128,128,128', stroke: 'rgba(128,128,128,.28)', glass: 'rgba(128,128,128,.08)', y1: 'var(--warning-color,#d97706)', o1: 'var(--warning-color,#d97706)', y0: 'var(--warning-color,#d97706)' },
  };
  const THEME_LABELS = { dunkel: 'Dunkel (Mitternacht, Standard)', graphit: 'Graphit (neutrales Dunkelgrau)', hell: 'Hell', warm: 'Warm (helles Papier)', auto: 'Automatisch (hell oder dunkel wie Home Assistant)', ha: 'Farben des Home-Assistant-Designs' };
  const THEME_OPTIONS = ['dunkel', 'graphit', 'hell', 'warm', 'auto', 'ha'].map((v) => ({ value: v, label: THEME_LABELS[v] }));
  const themeVars = (t) => `--ov:${t.ov};--bg0:${t.bg0};--bg1:${t.bg1};--bg2:${t.bg2};--panel:${t.panel};--txt:${t.txt};--mut:${t.mut};--stroke:${t.stroke};--glass:${t.glass};--y1:${t.y1};--o1:${t.o1};--y0:${t.y0}`;
  const themeCss = () => ':host{' + themeVars(THEMES.dunkel) + '}\n'
    + Object.keys(THEMES).filter((k) => k !== 'dunkel').map((k) => `:host([data-theme="${k}"]){${themeVars(THEMES[k])}}`).join('\n') + '\n';
  // Setzt data-theme (und optional --acc) am Kartenelement. cfg = Kartenkonfiguration, hass für "auto".
  const applyTheme = (el, cfg, hass) => {
    if (cfg) { el._ecTheme = cfg.theme; el._ecAccent = cfg.accent; }
    let t = el._ecTheme || 'dunkel';
    if (t === 'auto') {
      let dark = true;
      if (hass && hass.themes && typeof hass.themes.darkMode === 'boolean') dark = hass.themes.darkMode;
      else if (window.matchMedia) dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      t = dark ? 'dunkel' : 'hell';
    }
    if (!THEMES[t]) t = 'dunkel';
    if (el.getAttribute('data-theme') !== t) el.setAttribute('data-theme', t);
    const a = accentRgb(el._ecAccent);
    if (a) el.style.setProperty('--acc', a); else el.style.removeProperty('--acc');
  };
  const clock = (ms) => new Date(ms).toLocaleTimeString(state.loc, { hour: '2-digit', minute: '2-digit' });
  const nf = (v, d) => Number(v).toLocaleString(state.loc, { minimumFractionDigits: d, maximumFractionDigits: d });
  // onlyW: immer in Watt, nie in kW umschalten (Option watt_only)
  // d (optional): feste Nachkommastellen aus der Option decimals; ohne d bleibt die bisherige Darstellung. Watt bleiben immer ganzzahlig
  const splitW = (w, onlyW, d) => {
    if (w === null || w === undefined || isNaN(w)) return ['—', ''];
    const a = Math.abs(w);
    if (a >= 999.5 && !onlyW) return [nf(a / 1000, typeof d === 'number' ? d : a >= 10000 ? 1 : 2), 'kW'];
    return [nf(Math.round(a), 0), 'W'];
  };
  const fW = (w, onlyW, d) => splitW(w, onlyW, d).join(' ');
  const fKwh = (v, d) => (v === null || v === undefined || !isFinite(v) ? '—' : nf(v, typeof d === 'number' ? d : v >= 100 ? 0 : 1));
  const fPct = (v, d) => (v === null || !isFinite(v) ? '—' : (typeof d === 'number' ? nf(Math.max(0, Math.min(1, v)) * 100, d) : Math.round(Math.max(0, Math.min(1, v)) * 100)) + ' %');
  // Option decimals (#25): Zahl = Nachkommastellen für Energie (kWh); Objekt { energy, power, percentage } einzeln. power gilt für kW-Werte
  const decOf = (c) => {
    const n = (v) => { const x = parseInt(v, 10); return isNaN(x) ? undefined : Math.max(0, Math.min(3, x)); };
    const v = c && c.decimals;
    if (v === undefined || v === null || v === '') return {};
    if (typeof v === 'object') return { e: n(v.energy), p: n(v.power), q: n(v.percentage) };
    return { e: n(v) };
  };
  // Währungssymbol aus Home Assistant (€, $, £ …)
  const cur = () => {
    try {
      const p = new Intl.NumberFormat(state.loc, { style: 'currency', currency: state.currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0);
      const x = p.find((q) => q.type === 'currency');
      return x ? x.value : state.currency;
    } catch (e) { return state.currency; }
  };
  const esc = (s) => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Navigation innerhalb von Home Assistant (funktioniert auch im Kiosk-Modus ohne Kopfzeile)
  const haNavigate = (path) => {
    const url = path + (location.search.includes('kiosk') && !path.includes('?') ? '?kiosk' : '');
    history.pushState(null, '', url);
    window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
  };

  // Keep-Awake für Echo Show (Silk): spielt nach einer Berührung eine lautlose Audiodatei in Schleife,
  // damit Silk den Browser nicht wegen Inaktivität schließt. Global, läuft über alle Ansichten weiter.
  const KA = (() => {
    if (window.__energyCockpitKA) return window.__energyCockpitKA;
    const ka = { enabled: false, active: false, silk: /Silk/i.test(navigator.userAgent), subs: new Set() };
    const silentWav = () => {
      const n = 8000, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
      const str = (o, t) => { for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
      str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVE'); str(12, 'fmt ');
      v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
      str(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
      let bin = '';
      for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
      return 'data:audio/wav;base64,' + btoa(bin);
    };
    ka.notify = () => ka.subs.forEach((f) => { try { f(ka); } catch (e) { /* ignore */ } });
    ka.start = () => {
      if (ka.active || ka.starting) return;
      ka.starting = true;
      const a = ka.audio || (ka.audio = new Audio(silentWav()));
      a.loop = true;
      const ok = () => {
        ka.starting = false; ka.active = true; ka.notify();
        if (!ka.timer) ka.timer = setInterval(() => { try { a.load(); a.play().catch(() => {}); } catch (e) { /* ignore */ } }, 60000);
      };
      const fail = () => { ka.starting = false; ka.active = false; ka.notify(); };
      try { const p = a.play(); if (p && p.then) p.then(ok).catch(fail); else ok(); } catch (e) { fail(); }
    };
    const onTouch = () => { if (ka.enabled) ka.start(); };
    window.addEventListener('pointerdown', onTouch, true);
    window.addEventListener('touchstart', onTouch, true);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && ka.active && ka.audio) ka.audio.play().catch(() => { ka.active = false; ka.notify(); });
    });
    window.__energyCockpitKA = ka;
    return ka;
  })();

  return { state, setLocale, PAL, TH, rgb, num, watt, kwh, rawUnits, statUnits, val, price, THEMES, THEME_OPTIONS, themeCss, applyTheme, clock, nf, splitW, fW, fKwh, fPct, decOf, cur, esc, accentRgb, haNavigate, KA };
})();


/* ---- i18n.js ---- */
/* Texte (nur Deutsch). */
(() => {
  const L = {
    de: {
      'flow.title': 'Energiefluss', 'flow.pv': 'PV-Anlage', 'flow.pv2': 'PV 2', 'flow.grid2': 'Zweiter Zähler', 'flow.grid': 'Netz', 'flow.battery': 'Batterie', 'flow.home': 'Hausverbrauch',
      'flow.cons_total': 'Verbraucher', 'flow.rest': 'Nicht erfasst', 'flow.restpct': '{n} % gemessen', 'flow.soc': 'Ladestand', 'flow.temp': 'Temperatur',
      'flow.next': 'Weiter →', 'flow.error': 'Mindestens pv oder grid konfigurieren',
      'pill.aut': 'Autarkie jetzt', 'pill.self': 'Eigenverbrauch jetzt', 'pv.use.home': 'Haus', 'pv.use.bat': 'Batterie', 'pv.use.grid': 'Netz', 'pv.use.store': 'Speicher',
      'stat.pv': 'PV heute', 'stat.fc1': 'PV morgen', 'stat.fc2': 'PV übermorgen', 'stat.imp': 'Bezug heute', 'stat.exp': 'Einspeisung', 'stat.bat': 'Batterie ± heute', 'stat.aut': 'Autarkie heute',
      'mix.pv': 'Solar', 'mix.bat': 'Akku', 'mix.grid': 'Netz',
      'tag.offline': 'Offline', 'tag.producing': 'Erzeugt', 'tag.idle': 'Inaktiv', 'tag.balanced': 'Ausgeglichen',
      'tag.import': 'Bezug', 'tag.export': 'Einspeisung', 'tag.standby': 'Standby', 'tag.charging': 'Lädt', 'tag.discharging': 'Entlädt', 'tag.passthrough': 'Durchleitung',
      'bat.io': 'Eingang <b>{in}</b> · Ausgang <b>{out}</b>', 'bat.split': ' (Haus <b>{home}</b> · Netz <b>{grid}</b>)', 'bat.shared': 'Gemeinsamer Sensor mit <b>{name}</b>',
      'forecast': 'Prognose', 'forecast.day': 'Prognose heute', 'offline': 'offline',
      'ka.on': '● Wach', 'ka.wait': '☝ Einmal tippen – Bildschirm bleibt an',
      'waste.today': 'Heute', 'waste.tomorrow': 'Morgen',
      'bat.usable_pct': 'nutzbar', 'bat.usable_slow': '<b>{kwh} kWh</b> nutzbar · lädt langsam', 'bat.full_at': 'Voll um <b>{time}</b> · in {dur}',
      'bat.last_24': 'Reicht <b>über 24 h</b> · {kwh} kWh nutzbar', 'bat.last_until': 'Reicht bis <b>{time}</b> · noch {dur}',
      'bat.full': 'Voll · <b>{kwh} kWh</b> nutzbar', 'bat.usable': '<b>{kwh} kWh</b> nutzbar (bis {res} %)',
      'dur.2days': '> 2 Tage',
      'ban.surplus': '{w} Überschuss', 'ban.batfull': 'Akku voll – ', 'ban.tonet': 'Strom fließt ins Netz · selbst nutzen spart <b>{gain} {cur}/h</b>',
      'ban.running': '{name} läuft', 'ban.fromgrid': '{w} aus dem Netz', 'ban.cost': 'kostet gerade <b>{cost} {cur}/h</b>',
      'ban.batempty': 'Akku leer', 'ban.batlimit': 'Akku am Limit',
    },
  };
  // T('key', { n: 5 }) ersetzt {n}; fehlende Schlüssel fallen auf Englisch, dann auf den Schlüssel zurück
  WD.T = (k, vars) => {
    let s = L.de[k] || k;
    if (vars) Object.keys(vars).forEach((v) => { s = s.split('{' + v + '}').join(vars[v]); });
    return s;
  };
  WD.addStrings = (de) => { Object.assign(L.de, de); };
  WD.fDur = (hrs) => {
    if (!isFinite(hrs) || hrs <= 0) return '';
    if (hrs > 48) return WD.T('dur.2days');
    const m = Math.round(hrs * 60), hh = Math.floor(m / 60), mm = m % 60;
    return hh ? `${hh} h ${String(mm).padStart(2, '0')} min` : `${mm} min`;
  };
})();


/* ---- wizard.js ---- */
/* Einrichtungsassistent: Schritt für Schritt Sensoren auswählen, mit Vorschlägen aus den vorhandenen Entitäten.
   Verwendet nur Standard-HTML (select, input), damit er auch dann funktioniert, wenn Home Assistant seine Formular-Bausteine nicht geladen hat. */
(() => {
  const POWER_UNITS = ['W', 'kW', 'MW'];
  const ENERGY_UNITS = ['Wh', 'kWh', 'MWh'];

  // Liste aller passenden Entitäten (Leistung, Energie, Prozent, Preis, Schalter ...)
  const list = (hass, kind) => {
    const out = [];
    if (!hass || !hass.states) return out;
    Object.keys(hass.states).forEach((id) => {
      const s = hass.states[id], a = s.attributes || {}, u = a.unit_of_measurement || '', dc = a.device_class || '';
      const dom = id.split('.')[0];
      let ok = false;
      if (kind === 'power') ok = dom === 'sensor' && (POWER_UNITS.indexOf(u) >= 0 || dc === 'power');
      else if (kind === 'energy') ok = dom === 'sensor' && (ENERGY_UNITS.indexOf(u) >= 0 || dc === 'energy');
      // Prognose: Leistung in W/kW oder Tagesprognose in kWh (zum Beispiel Forecast.Solar "Energie Produktion heute")
      else if (kind === 'forecast') ok = dom === 'sensor' && (POWER_UNITS.indexOf(u) >= 0 || ENERGY_UNITS.indexOf(u) >= 0 || dc === 'power' || dc === 'energy');
      else if (kind === 'percent') ok = (dom === 'sensor' || dom === 'number') && (u === '%' || dc === 'battery');
      else if (kind === 'temp') ok = dom === 'sensor' && (u === '°C' || dc === 'temperature');
      else if (kind === 'price') ok = (dom === 'input_number' || dom === 'sensor' || dom === 'number') && (/\/\s*kWh|ct|€|eur/i.test(u) || /preis|price|tarif|verg/i.test(id + ' ' + (a.friendly_name || '')));
      else if (kind === 'money') ok = (dom === 'input_number' || dom === 'sensor' || dom === 'number') && (/€|eur/i.test(u) || /anschaff|invest|kosten|cost/i.test(id + ' ' + (a.friendly_name || '')));
      else if (kind === 'switch') ok = ['switch', 'light', 'input_boolean'].indexOf(dom) >= 0;
      if (ok) out.push({ id, name: a.friendly_name || id, state: s.state, unit: u });
    });
    return out.sort((x, y) => x.name.localeCompare(y.name, 'de'));
  };

  // Treffer nach Stichwörtern sortieren: Vorschläge zuerst
  const score = (e, hints) => {
    const t = (e.id + ' ' + e.name).toLowerCase();
    let s = 0;
    (hints || []).forEach((re, i) => { if (re.test(t)) s += 10 - i; });
    return s;
  };

  const getPath = (o, p) => p.split('.').reduce((a, k) => (a === undefined || a === null ? undefined : a[k]), o);
  const setPath = (o, p, v) => {
    const ks = p.split('.');
    let c = o;
    ks.slice(0, -1).forEach((k) => { if (typeof c[k] !== 'object' || c[k] === null) c[k] = {}; c = c[k]; });
    const last = ks[ks.length - 1];
    if (v === '' || v === undefined || v === null || v === false) delete c[last]; else c[last] = v;
  };
  const prune = (o) => {
    Object.keys(o).forEach((k) => {
      if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) { prune(o[k]); if (!Object.keys(o[k]).length) delete o[k]; }
    });
    return o;
  };

  // Entität, die nicht zum Filter passt (z. B. im YAML eingetragen), mit Name und Wert
  const own = (hass, id) => {
    const s = hass && id && hass.states[id];
    return s ? { id, name: (s.attributes && s.attributes.friendly_name) || id, state: s.state, unit: (s.attributes && s.attributes.unit_of_measurement) || '' } : null;
  };
  const fmtState = (e) => (e ? `${e.state}${e.unit ? ' ' + e.unit : ''}` : '');
  // Listen können als Array oder als Objekt {0:…, 1:…} vorliegen (so speichert sie das Formular von Home Assistant)
  const arr = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]) : []));

  // Baut den Assistenten. opts: { steps, hass, config, onChange(config), done }
  WD.createWizard = (opts) => {
    const root = document.createElement('div');
    root.style.cssText = 'font:inherit;color:var(--primary-text-color,inherit)';
    let cfg = JSON.parse(JSON.stringify(opts.config || {}));
    let hass = opts.hass;
    let step = 0;
    const steps = opts.steps;

    const emit = () => { prune(cfg); opts.onChange(JSON.parse(JSON.stringify(cfg))); };
    const css = {
      box: 'padding:10px 12px;margin:8px 0;border:1px solid var(--divider-color,#444);border-radius:10px',
      btn: 'cursor:pointer;margin:4px 6px 4px 0;padding:8px 14px;border-radius:8px;border:1px solid var(--divider-color,#555);background:var(--secondary-background-color,#222);color:var(--primary-text-color,#fff);font:inherit',
      primary: 'cursor:pointer;margin:4px 6px 4px 0;padding:8px 14px;border-radius:8px;border:0;background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff);font:inherit;font-weight:600',
      input: 'width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid var(--divider-color,#555);background:var(--card-background-color,#111);color:var(--primary-text-color,#fff);font:inherit',
      label: 'display:block;font-weight:600;margin:12px 0 4px',
      help: 'font-size:.85em;opacity:.7;margin:2px 0 4px',
    };
    const el = (tag, style, text) => { const e = document.createElement(tag); if (style) e.style.cssText = style; if (text !== undefined) e.textContent = text; return e; };

    const fieldSelect = (f) => {
      const wrap = el('div');
      wrap.appendChild(el('label', css.label, f.label + (f.optional ? ' (optional)' : '')));
      if (f.help) wrap.appendChild(el('div', css.help, f.help));
      const sel = el('select', css.input);
      const all = list(hass, f.kind || 'power');
      const cur = getPath(cfg, f.path) || '';
      const sug = all.filter((e) => score(e, f.hints) > 0).sort((a, b) => score(b, f.hints) - score(a, f.hints));
      // Nur die ersten 12 Vorschläge stehen oben, alle übrigen Treffer bleiben unten wählbar
      const top = sug.slice(0, 12);
      const rest = all.filter((e) => top.indexOf(e) < 0);
      const opt = (v, t) => { const o = document.createElement('option'); o.value = v; o.textContent = t; return o; };
      sel.appendChild(opt('', '— nicht verwenden —'));
      const mine = cur && !all.find((e) => e.id === cur) ? own(hass, cur) : null;
      if (mine) {
        const g0 = document.createElement('optgroup'); g0.label = 'Eigene Auswahl';
        g0.appendChild(opt(cur, `${mine.name} (${fmtState(mine)})`));
        sel.appendChild(g0);
      } else if (cur && !all.find((e) => e.id === cur)) sel.appendChild(opt(cur, cur + ' (nicht gefunden)'));
      const pool = mine ? all.concat([mine]) : all;
      if (top.length) {
        const g = document.createElement('optgroup'); g.label = 'Vorschläge';
        top.forEach((e) => g.appendChild(opt(e.id, `${e.name} (${fmtState(e)})`)));
        sel.appendChild(g);
      }
      const g2 = document.createElement('optgroup'); g2.label = 'Alle passenden Sensoren';
      rest.forEach((e) => g2.appendChild(opt(e.id, `${e.name} (${fmtState(e)})`)));
      sel.appendChild(g2);
      sel.value = cur;
      const live = el('div', css.help, '');
      const upd = () => { const e = pool.find((x) => x.id === sel.value); live.textContent = e ? `Aktueller Wert: ${fmtState(e)}  ·  ${e.id}` : ''; };
      sel.addEventListener('change', () => { setPath(cfg, f.path, sel.value); upd(); emit(); });
      upd();
      wrap.appendChild(sel);
      wrap.appendChild(live);
      if (!cur && sug.length && f.auto !== false && !f.optional) {
        const b = el('button', css.btn, `Vorschlag übernehmen: ${sug[0].name}`);
        b.type = 'button';
        b.addEventListener('click', () => { setPath(cfg, f.path, sug[0].id); emit(); render(); });
        wrap.appendChild(b);
      }
      return wrap;
    };

    const fieldBool = (f) => {
      const wrap = el('div');
      const l = el('label', css.label + ';display:flex;align-items:center;gap:8px;font-weight:500');
      const c = document.createElement('input'); c.type = 'checkbox'; c.checked = !!getPath(cfg, f.path);
      c.addEventListener('change', () => { setPath(cfg, f.path, c.checked ? true : ''); emit(); });
      l.appendChild(c); l.appendChild(document.createTextNode(f.label));
      wrap.appendChild(l);
      if (f.help) wrap.appendChild(el('div', css.help, f.help));
      return wrap;
    };

    // Farbschema: Kacheln mit Vorschau
    const fieldTheme = (f) => {
      const wrap = el('div');
      wrap.appendChild(el('label', css.label, f.label));
      if (f.help) wrap.appendChild(el('div', css.help, f.help));
      const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px');
      const cur = getPath(cfg, f.path) || 'dunkel';
      const T = WD.THEMES;
      const mix = (a, b) => `linear-gradient(110deg,${a.bg1} 0 50%,${b.bg1} 50% 100%)`;
      ['dunkel', 'graphit', 'hell', 'warm', 'auto', 'ha'].forEach((k) => {
        const t = k === 'auto' ? { n: 'Automatisch', bg: mix(T.dunkel, T.hell), txt: '#8b97b3', dot: true } : Object.assign({ bg: T[k].bg1, dot: true }, T[k]);
        const tile = el('button', `cursor:pointer;text-align:left;padding:10px;border-radius:10px;font:inherit;border:2px solid ${cur === k ? 'var(--primary-color,#03a9f4)' : 'var(--divider-color,#555)'};background:${k === 'auto' ? t.bg : (k === 'ha' ? 'var(--card-background-color,#222)' : T[k].bg1)};color:${k === 'auto' ? '#8b97b3' : T[k].txt}`);
        tile.type = 'button';
        tile.appendChild(el('div', k === 'auto' ? 'font-weight:700;display:inline-block;padding:1px 7px;border-radius:6px;background:rgba(15,23,42,.8);color:#fff' : 'font-weight:700', t.n));
        const dots = el('div', 'display:flex;gap:4px;margin-top:6px');
        ['255,197,61', '255,92,122', '96,165,250'].forEach((c) => dots.appendChild(el('span', `width:14px;height:14px;border-radius:50%;background:rgb(${c})`)));
        tile.appendChild(dots);
        tile.addEventListener('click', () => { setPath(cfg, f.path, k === 'dunkel' ? '' : k); emit(); render(); });
        grid.appendChild(tile);
      });
      wrap.appendChild(grid);
      return wrap;
    };

    const fieldChoice = (f) => {
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

    const fieldInput = (f, type) => {
      const wrap = el('div');
      wrap.appendChild(el('label', css.label, f.label + (f.optional ? ' (optional)' : '')));
      if (f.help) wrap.appendChild(el('div', css.help, f.help));
      const i = el('input', css.input);
      i.type = type;
      if (type === 'number') { i.step = f.step || '0.1'; i.min = f.min !== undefined ? f.min : '0'; }
      const cur = getPath(cfg, f.path);
      i.value = cur === undefined ? '' : cur;
      i.addEventListener('change', () => { const v = type === 'number' ? (i.value === '' ? '' : parseFloat(i.value)) : i.value; setPath(cfg, f.path, v); emit(); });
      wrap.appendChild(i);
      return wrap;
    };

    // Dynamische Liste (z. B. Einzelverbraucher): Sensor + Name je Zeile
    const fieldList = (f) => {
      const wrap = el('div');
      wrap.appendChild(el('label', css.label, f.label));
      if (f.help) wrap.appendChild(el('div', css.help, f.help));
      const KEY = f.itemKey || 'entity';
      const all = list(hass, f.listKind || 'power');
      const items = arr(cfg[f.path]).filter((x) => x && typeof x === 'object');
      const used = items.map((x) => x[KEY]);
      const sugs = all.filter((e) => used.indexOf(e.id) < 0 && getPath(cfg, 'pv.entity') !== e.id && getPath(cfg, 'grid.entity') !== e.id && getPath(cfg, 'battery.power') !== e.id && getPath(cfg, 'home.entity') !== e.id);
      const write = (arr) => { cfg[f.path] = arr.filter((x) => x[KEY]); emit(); };
      items.forEach((it, i) => {
        const row = el('div', css.box);
        const sel = el('select', css.input);
        const o0 = document.createElement('option'); o0.value = it[KEY] || ''; o0.textContent = (all.find((e) => e.id === it[KEY]) || own(hass, it[KEY]) || { name: it[KEY] || '—' }).name;
        sel.appendChild(o0);
        all.forEach((e) => { if (e.id !== it[KEY]) { const o = document.createElement('option'); o.value = e.id; o.textContent = `${e.name} (${fmtState(e)})`; sel.appendChild(o); } });
        sel.value = it[KEY] || '';
        sel.addEventListener('change', () => { it[KEY] = sel.value; if (!it.name) { const e = all.find((x) => x.id === sel.value); if (e) it.name = e.name.replace(/\s*(leistung|power|energy power)\s*$/i, ''); } write(items); render(); });
        const nm = el('input', css.input + ';margin-top:6px');
        nm.placeholder = 'Anzeigename';
        nm.value = it.name || '';
        nm.addEventListener('change', () => { it.name = nm.value; write(items); });
        const rm = el('button', css.btn, 'Entfernen'); rm.type = 'button';
        rm.addEventListener('click', () => { items.splice(i, 1); write(items); render(); });
        row.appendChild(sel); row.appendChild(nm);
        // Optional: Differenz (Hauptzähler minus Unterzähler, z. B. Zählerkaskade) und eigener Preis
        if (f.minusKey) {
          row.appendChild(el('div', css.help + ';margin-top:8px', f.minusLabel || 'Davon abziehen (Differenz, optional):'));
          const ms = el('select', css.input);
          const m0 = document.createElement('option'); m0.value = ''; m0.textContent = '— nichts abziehen —'; ms.appendChild(m0);
          const cur = Array.isArray(it[f.minusKey]) ? it[f.minusKey][0] : it[f.minusKey];
          all.forEach((e) => { if (e.id !== it[KEY]) { const o = document.createElement('option'); o.value = e.id; o.textContent = `${e.name} (${fmtState(e)})`; ms.appendChild(o); } });
          ms.value = cur || '';
          ms.addEventListener('change', () => { if (ms.value) it[f.minusKey] = ms.value; else delete it[f.minusKey]; write(items); });
          row.appendChild(ms);
        }
        if (f.priceKey) {
          const pr = el('input', css.input + ';margin-top:6px');
          pr.type = 'number'; pr.step = '0.1';
          pr.placeholder = f.priceLabel || 'Eigener Preis in Cent pro kWh (optional)';
          pr.value = typeof it[f.priceKey] === 'number' ? it[f.priceKey] : '';
          pr.addEventListener('change', () => { const v = parseFloat(pr.value); if (isNaN(v)) delete it[f.priceKey]; else it[f.priceKey] = v; write(items); });
          row.appendChild(pr);
        }
        row.appendChild(rm);
        wrap.appendChild(row);
      });
      if (items.length < (f.max || 8)) {
        const add = el('div', css.box);
        add.appendChild(el('div', css.help, 'Verbraucher hinzufügen:'));
        const sel = el('select', css.input);
        const o0 = document.createElement('option'); o0.value = ''; o0.textContent = '— Sensor wählen —'; sel.appendChild(o0);
        sugs.forEach((e) => { const o = document.createElement('option'); o.value = e.id; o.textContent = `${e.name} (${fmtState(e)})`; sel.appendChild(o); });
        sel.addEventListener('change', () => {
          if (!sel.value) return;
          const e = all.find((x) => x.id === sel.value);
          items.push({ [KEY]: sel.value, name: e ? e.name.replace(/\s*(leistung|power|energy power)\s*$/i, '') : '' });
          write(items); render();
        });
        add.appendChild(sel);
        wrap.appendChild(add);
      }
      return wrap;
    };

    function render() {
      root.innerHTML = '';
      const st = steps[step];
      // Fortschritt
      const prog = el('div', 'display:flex;gap:6px;margin:4px 0 10px;flex-wrap:wrap');
      steps.forEach((s, i) => {
        const b = el('button', 'cursor:pointer;padding:4px 10px;border-radius:999px;border:1px solid var(--divider-color,#555);background:' + (i === step ? 'var(--primary-color,#03a9f4)' : 'transparent') + ';color:' + (i === step ? 'var(--text-primary-color,#fff)' : 'inherit') + ';font:inherit;font-size:.85em', `${i + 1}. ${s.short || s.title}`);
        b.type = 'button';
        b.addEventListener('click', () => { step = i; render(); });
        prog.appendChild(b);
      });
      root.appendChild(prog);
      root.appendChild(el('div', 'font-size:1.15em;font-weight:700;margin:6px 0', st.title));
      if (st.text) root.appendChild(el('div', css.help + ';font-size:.95em', st.text));
      (st.fields || []).forEach((f) => {
        if (f.kind === 'bool') root.appendChild(fieldBool(f));
        else if (f.kind === 'number') root.appendChild(fieldInput(f, 'number'));
        else if (f.kind === 'text') root.appendChild(fieldInput(f, 'text'));
        else if (f.kind === 'list') root.appendChild(fieldList(f));
        else if (f.kind === 'choice') root.appendChild(fieldChoice(f));
        else if (f.kind === 'theme') root.appendChild(fieldTheme(f));
        else root.appendChild(fieldSelect(f));
      });
      if (st.summary) {
        const rows = st.summary(cfg, hass);
        const b = el('div', css.box);
        rows.forEach((r) => b.appendChild(el('div', 'margin:2px 0', r)));
        root.appendChild(b);
      }
      const nav = el('div', 'margin-top:14px');
      if (step > 0) { const b = el('button', css.btn, '← Zurück'); b.type = 'button'; b.addEventListener('click', () => { step--; render(); }); nav.appendChild(b); }
      if (step < steps.length - 1) { const b = el('button', css.primary, 'Weiter →'); b.type = 'button'; b.addEventListener('click', () => { step++; render(); }); nav.appendChild(b); }
      else if (opts.done) { const b = el('button', css.primary, 'Fertig: alle Felder anzeigen'); b.type = 'button'; b.addEventListener('click', () => opts.done()); nav.appendChild(b); }
      root.appendChild(nav);
    }
    render();
    return {
      el: root,
      // Kommen die Entitäten erst nach dem Aufbau (Home Assistant setzt oft zuerst die Konfiguration), einmal neu zeichnen
      setHass(h) { const first = !hass || !hass.states; hass = h; if (first && h && h.states) render(); },
      setConfig(c) { cfg = JSON.parse(JSON.stringify(c || {})); render(); },
    };
  };

  WD.wizardList = list;
  WD.toList = arr;
  WD.wizardScore = score;
})();


/* ---- editor-kit.js ---- */
/* Gemeinsamer Editor-Baukasten: Reiter "Assistent" (Schritt für Schritt) und "Alle Felder" (Formular von Home Assistant). */
(() => {
  // ha-form ist in Home Assistant nicht immer geladen: über die Karten-Helfer nachladen
  WD.ensureForm = async () => {
    if (customElements.get('ha-form')) return true;
    try {
      const h = await window.loadCardHelpers();
      const c = await h.createCardElement({ type: 'entities', entities: [] });
      if (c && c.constructor && c.constructor.getConfigElement) await c.constructor.getConfigElement();
    } catch (e) { /* weiter mit Wartezeit */ }
    await Promise.race([customElements.whenDefined('ha-form'), new Promise((r) => setTimeout(r, 4000))]);
    return !!customElements.get('ha-form');
  };

  // def: { needsSetup(config), steps(), form(), extra?(root, api) }
  WD.defineEditor = (tag, def) => {
    class Editor extends HTMLElement {
      setConfig(c) {
        const s = JSON.stringify(c || {});
        if (this._last === s) return; // eigene Änderung: nicht neu aufbauen (Eingabefokus bleibt erhalten)
        this._c = JSON.parse(s);
        if (!this._tab) this._tab = def.needsSetup(this._c) ? 'wiz' : 'form';
        this._wiz = null;
        this._render();
      }
      set hass(h) {
        this._hass = h;
        if (this._wiz) this._wiz.setHass(h);
        if (this._form) this._form.hass = h;
      }
      _emit(cfg) {
        this._c = cfg;
        this._last = JSON.stringify(cfg);
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: JSON.parse(this._last) }, bubbles: true, composed: true }));
      }
      _render() {
        if (!this._root) { this._root = document.createElement('div'); this.appendChild(this._root); }
        const root = this._root;
        root.innerHTML = '';
        const bar = document.createElement('div');
        bar.style.cssText = 'display:flex;gap:6px;margin-bottom:10px';
        [['wiz', 'Assistent'], ['form', 'Alle Felder']].forEach(([k, t]) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = t;
          b.style.cssText = 'cursor:pointer;padding:8px 14px;border-radius:8px;font:inherit;border:1px solid var(--divider-color,#555);background:' + (this._tab === k ? 'var(--primary-color,#03a9f4)' : 'var(--secondary-background-color,#222)') + ';color:' + (this._tab === k ? 'var(--text-primary-color,#fff)' : 'var(--primary-text-color,#fff)');
          b.addEventListener('click', () => { this._tab = k; this._wiz = null; this._form = null; this._render(); });
          bar.appendChild(b);
        });
        root.appendChild(bar);
        if (this._tab === 'wiz') {
          this._wiz = WD.createWizard({
            steps: def.steps(), hass: this._hass, config: this._c,
            onChange: (cfg) => this._emit(Object.assign({}, cfg, { type: this._c.type })),
            done: () => { this._tab = 'form'; this._wiz = null; this._render(); },
          });
          root.appendChild(this._wiz.el);
          return;
        }
        if (def.extra) def.extra(root, { config: () => this._c, hass: () => this._hass, emit: (c) => { this._emit(c); this._render(); } });
        const holder = document.createElement('div');
        root.appendChild(holder);
        holder.textContent = 'Formular wird geladen …';
        WD.ensureForm().then((ok) => {
          holder.textContent = '';
          if (!ok) { holder.textContent = 'Das Formular konnte nicht geladen werden. Bitte den Assistenten oder den YAML-Editor verwenden.'; return; }
          const f = def.form();
          const form = document.createElement('ha-form');
          form.schema = f.schema;
          form.computeLabel = f.computeLabel;
          if (f.computeHelper) form.computeHelper = f.computeHelper;
          form.data = this._c;
          if (this._hass) form.hass = this._hass;
          form.addEventListener('value-changed', (ev) => { ev.stopPropagation(); this._emit(ev.detail.value); });
          this._form = form;
          holder.appendChild(form);
        });
      }
    }
    if (!customElements.get(tag)) customElements.define(tag, Editor);
  };
})();


/* ---- flow-3d.js ---- */
/* energy-cockpit: 3D-Optik der Energiefluss-Karte (style: 3d). Isometrische SVG-Zeichnungen aus den Live-Werten, ohne Bibliothek. */
(() => {
const { PAL, TH, nf } = WD;
const C=.866,S=.5;
const P=(x,y,z)=>[(x-y)*C,(x+y)*S-z];
const pts=(a)=>a.map((q)=>P(q[0],q[1],q[2]).map((n)=>n.toFixed(1)).join(',')).join(' ');
const poly=(a,style)=>`<polygon points="${pts(a)}" style="${style}"/>`;
const seg=(a,b,style)=>{const p=P(a[0],a[1],a[2]),q=P(b[0],b[1],b[2]);return `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" style="${style}"/>`;};
const grad=(id,a,b,x2=0,y2=1)=>`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" style="stop-color:${a}"/><stop offset="1" style="stop-color:${b}"/></linearGradient>`;
const glow=(id,col,op)=>`<radialGradient id="${id}"><stop offset="0" style="stop-color:${col};stop-opacity:${op}"/><stop offset="1" style="stop-color:${col};stop-opacity:0"/></radialGradient>`;

/* Speicher: Gehäuse mit Sichtfenster */
function stack(socs,p,pre,large,label){
  const W=118,D=84,REV=30,MX=13;
  const n=socs.length,H=n===1?124:n===2?72:n===3?54:44,GAP=3,BASE=6;
  const chg=p>TH,dis=p<-TH,run=chg||dis,accent=chg?PAL.chg:PAL.bat;
  const dur=Math.max(1.2,3.4-Math.abs(p)/800).toFixed(2)+'s';
  const lampCol=run?accent:'139,151,179';
  const zT=BASE+n*H+(n-1)*GAP,CAPH=5;
  let body='';
  let defs=grad(pre+'hl','var(--hl0)','var(--hl1)')+grad(pre+'hr','var(--hr0)','var(--hr1)')+grad(pre+'ht','var(--ht0)','var(--ht1)',1,1)+glow(pre+'sh','var(--shadow)',1)+glow(pre+'gl',`rgb(${accent})`,.42);
  const ctr=P(W/2,D/2,0);
  body+=`<ellipse cx="${ctr[0]+6}" cy="${ctr[1]+7}" rx="122" ry="68" fill="url(#${pre}sh)"/>`;
  if(run)body+=`<ellipse cx="${ctr[0]}" cy="${ctr[1]+3}" rx="124" ry="70" fill="url(#${pre}gl)"/>`;
  // Füße
  [[8,D-8],[W-8,D-8],[W-8,8]].forEach((f)=>{body+=poly([[f[0]-5,f[1]+4,0],[f[0]+5,f[1]+4,0],[f[0]+5,f[1]+4,BASE],[f[0]-5,f[1]+4,BASE]],'fill:var(--slot)');});

  // Von unten nach oben zeichnen; der erste Speicher steht oben, wie in der Zeile "Ladestand" (4 % / 22 %)
  socs.slice().reverse().forEach((soc,k)=>{
    const z0=BASE+k*(H+GAP),z1=z0+H,wz0=z0+(n>=3?7:9),wz1=z1-(n>=3?7:9),wH=wz1-wz0;
    const lvl=soc>0?Math.max(1.5,wH*soc/100):0,top=wz0+lvl,col=soc<20?PAL.imp:soc<40?PAL.pv:accent;
    const x0=MX,x1=W-MX,yB=D-REV;
    // Gehäuse
    body+=poly([[0,D,z0],[W,D,z0],[W,D,z1],[0,D,z1]],`fill:url(#${pre}hl)`);
    body+=poly([[W,D,z0],[W,0,z0],[W,0,z1],[W,D,z1]],`fill:url(#${pre}hr)`);
    if(k<n-1)body+=poly([[0,0,z1],[W,0,z1],[W,D,z1],[0,D,z1]],'fill:var(--hr1)');
    // Lüftungsschlitze an der Seite
    const rows=n===1?7:n===2?4:3;
    for(let r=0;r<rows;r++){const z=z0+H*.5+(r-(rows-1)/2)*(n===1?8:7);body+=poly([[W,D-26,z-1.5],[W,D-66,z-1.5],[W,D-66,z+1.5],[W,D-26,z+1.5]],'fill:var(--slot);fill-opacity:.75');}
    // Statusleiste an der Seite
    body+=`<g class="${run?'d3-lamp':''}">${poly([[W,D-11,z0+H*.22],[W,D-15,z0+H*.22],[W,D-15,z1-H*.22],[W,D-11,z1-H*.22]],`fill:rgb(${lampCol})`)}</g>`;
    // Sichtfenster: Innenraum
    const win=[[x0,D,wz0],[x1,D,wz0],[x1,D,wz1],[x0,D,wz1]];
    defs+=`<clipPath id="${pre}w${k}"><polygon points="${pts(win)}"/></clipPath>`;
    defs+=`<linearGradient id="${pre}f${k}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="rgb(${col})" stop-opacity=".66"/><stop offset="1" stop-color="rgb(${col})"/></linearGradient>`;
    body+=`<g clip-path="url(#${pre}w${k})">`+poly(win,'fill:var(--hole)');
    body+=poly([[x0,yB,wz0],[x1,yB,wz0],[x1,yB,wz1+40],[x0,yB,wz1+40]],'fill:var(--wall)');
    body+=poly([[x0,D,wz0],[x0,yB,wz0],[x0,yB,wz1+40],[x0,D,wz1+40]],'fill:var(--hole)');
    if(lvl>0){
      body+=poly([[x0,yB,top],[x1,yB,top],[x1,D,top],[x0,D,top]],`fill:rgb(${col});fill-opacity:.55`);
      body+=poly([[x0,D,wz0],[x1,D,wz0],[x1,D,top],[x0,D,top]],`fill:url(#${pre}f${k})`);
      body+=seg([x0,D,top],[x1,D,top],'stroke:#fff;stroke-opacity:.75;stroke-width:1.2');
      if(run&&lvl>8){
        defs+=`<clipPath id="${pre}b${k}"><polygon points="${pts([[x0,D,wz0],[x1,D,wz0],[x1,D,top],[x0,D,top]])}"/></clipPath>`;
        body+=`<g clip-path="url(#${pre}b${k})">`+[0,1,2].map((j)=>{const a=P(x0,D,wz0),b=P(x1,D,wz0);return `<line class="d3-band${dis?' rev':''}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#fff" stroke-width="2.2" style="--d:${(-lvl).toFixed(1)}px;--dur:${dur};--dl:${(-j/3*parseFloat(dur)).toFixed(2)}s"/>`;}).join('')+'</g>';
      }
    }
    body+='</g>';
    // Skala, Glas und Fensterrahmen
    [.25,.5,.75].forEach((f)=>{const z=wz0+wH*f;body+=seg([x0,D,z],[x0+7,D,z],'stroke:#fff;stroke-opacity:.55;stroke-width:1');});
    body+=poly([[x0+14,D,wz1],[x0+32,D,wz1],[x0+22,D,wz0],[x0+4,D,wz0]],'fill:#fff;fill-opacity:.07');
    body+=`<polygon points="${pts(win)}" style="fill:none;stroke:var(--edge);stroke-width:1.4;stroke-linejoin:round"/>`;
    if(k>0)body+=seg([0,D,z0],[W,D,z0],'stroke:var(--slot);stroke-width:1.6')+seg([W,D,z0],[W,0,z0],'stroke:var(--slot);stroke-width:1.6');
    // Fuge zum nächsten Akku
    if(k<n-1)body+=poly([[4,D-3,z1],[W-3,D-3,z1],[W-3,D-3,z1+GAP],[4,D-3,z1+GAP]],'fill:var(--slot)')+poly([[W-3,D-3,z1],[W-3,4,z1],[W-3,4,z1+GAP],[W-3,D-3,z1+GAP]],'fill:var(--slot)');
    if(large){
      const o=P(0,D,z0),fs=n>=3?17:n===2?20:22;
      body+=`<g transform="matrix(${C},${S},0,1,${o[0].toFixed(1)},${o[1].toFixed(1)})"><text x="${W/2}" y="${-(H/2)+fs*.35}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#fff" stroke="var(--ink)" stroke-width="3.2" paint-order="stroke" style="font-family:inherit;font-variant-numeric:tabular-nums">${soc===null?'—':Math.round(soc)+' %'}</text></g>`;
    }
  });

  // Deckel
  const zC=zT+CAPH;
  body+=poly([[-1.5,D+1.5,zT],[W+1.5,D+1.5,zT],[W+1.5,D+1.5,zC],[-1.5,D+1.5,zC]],`fill:url(#${pre}hl)`);
  body+=poly([[W+1.5,D+1.5,zT],[W+1.5,-1.5,zT],[W+1.5,-1.5,zC],[W+1.5,D+1.5,zC]],`fill:url(#${pre}hr)`);
  body+=poly([[-1.5,-1.5,zC],[W+1.5,-1.5,zC],[W+1.5,D+1.5,zC],[-1.5,D+1.5,zC]],`fill:url(#${pre}ht)`);
  body+=`<polyline points="${pts([[-1.5,D+1.5,zC],[W+1.5,D+1.5,zC],[W+1.5,-1.5,zC]])}" style="fill:none;stroke:var(--edge);stroke-width:1.1"/>`;
  const circ=(r)=>Array.from({length:32},(_,i)=>{const t=i/32*Math.PI*2;return [W/2+Math.cos(t)*r,D/2+Math.sin(t)*r,zC];});
  body+=poly(circ(15),'fill:var(--slot);fill-opacity:.55');
  body+=`<g class="${run?'d3-lamp':''}">${poly(circ(15),`fill:none;stroke:rgb(${lampCol});stroke-width:2.2`)}</g>`;

  const xMin=P(-1.5,D+1.5,0)[0]-6,xMax=P(W+1.5,-1.5,0)[0]+6,yMin=P(-1.5,-1.5,zC)[1]-6,yMax=P(W,D,0)[1]+12;
  return `<svg viewBox="${xMin.toFixed(1)} ${yMin.toFixed(1)} ${(xMax-xMin).toFixed(1)} ${(yMax-yMin).toFixed(1)}" role="img" aria-label="${WD.esc(label)}"><defs>${defs}</defs>${body}</svg>`;
}

/* Solar: aufgeständerte Module, je String eines */
function solar(strs,pre,large,PEAK,label){
  const n=strs.length,PW=50,PD=74,GAP=4,RISE=40,ZF=13,TW=n*PW+(n-1)*GAP;
  const tot=strs.reduce((a,b)=>a+b,0),ratio=Math.min(1,tot/(n*PEAK));
  const zAt=(y)=>ZF+(PD-y)/PD*RISE;
  const Q=(x,y,lift=0)=>[x,y,zAt(y)+lift];
  let defs=glow(pre+'sh','var(--shadow)',1)+glow(pre+'sun','rgb(255,197,61)',.85*Math.sqrt(ratio))+glow(pre+'dsk','#fff4cf',ratio>0?1:0)+grad(pre+'alu','var(--alu0)','var(--alu1)')+
    `<linearGradient id="${pre}cell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c3f86"/><stop offset=".55" stop-color="#0d2354"/><stop offset="1" stop-color="#091a3f"/></linearGradient>`+
    `<linearGradient id="${pre}lit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fb2ff"/><stop offset="1" stop-color="#2a66d6"/></linearGradient>`;
  let body='';
  const ctr=P(TW/2,PD/2,0);
  body+=`<ellipse cx="${ctr[0]+4}" cy="${ctr[1]+8}" rx="${(TW+PD)*.68}" ry="${(TW+PD)*.34}" fill="url(#${pre}sh)"/>`;
  // Gestell
  const al='stroke:var(--alu1);stroke-width:3;stroke-linecap:round';
  const posts=n<3?[8,TW-8]:[8,TW/2,TW-8];
  body+=seg([0,8,0],[TW,8,0],al)+seg([0,PD-8,0],[TW,PD-8,0],al);
  posts.forEach((x)=>{body+=seg([x,8,0],Q(x,8,-3),al)+seg([x,PD-8,0],Q(x,PD-8,-3),al)+seg([x,PD-8,0],Q(x,8,-3),'stroke:var(--alu1);stroke-width:1.8;stroke-linecap:round;opacity:.8');});
  // Module
  strs.forEach((w,i)=>{
    const x0=i*(PW+GAP),x1=x0+PW,r=Math.min(1,w/PEAK);
    const surf=[Q(x0,0),Q(x1,0),Q(x1,PD),Q(x0,PD)];
    // Rahmen: Vorderkante und rechte Kante
    body+=poly([Q(x0,PD),Q(x1,PD),Q(x1,PD,-4),Q(x0,PD,-4)],`fill:url(#${pre}alu)`);
    body+=poly([Q(x1,PD),Q(x1,0),Q(x1,0,-4),Q(x1,PD,-4)],'fill:var(--alu1)');
    body+=poly(surf,`fill:url(#${pre}cell)`);
    body+=poly(surf,`fill:url(#${pre}lit);fill-opacity:${(.05+r*.62).toFixed(2)}`);
    // Zellen
    const cols=6,rows=10,ins=2.4;
    let lines='';
    for(let c=1;c<cols;c++){const x=x0+ins+(PW-2*ins)*c/cols;lines+=seg(Q(x,ins),Q(x,PD-ins),'stroke:#c9dcff;stroke-opacity:.32;stroke-width:.7');}
    for(let c=1;c<rows;c++){const y=ins+(PD-2*ins)*c/rows;lines+=seg(Q(x0+ins,y),Q(x1-ins,y),'stroke:#c9dcff;stroke-opacity:.32;stroke-width:.7');}
    body+=lines;
    body+=`<polygon points="${pts(surf)}" style="fill:none;stroke:var(--alu0);stroke-width:2;stroke-linejoin:round"/>`;
    if(large){
      const o=P(x0+PW/2,PD/2,zAt(PD/2)),up=[C,-(S+RISE/PD)],fs=11;
      body+=`<g transform="matrix(${C},${S},${(-up[0]).toFixed(3)},${(-up[1]).toFixed(3)},${o[0].toFixed(1)},${o[1].toFixed(1)})"><text x="0" y="${fs*.3}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#fff" stroke="#061126" stroke-width="3" paint-order="stroke" style="font-family:inherit;font-variant-numeric:tabular-nums">${nf(Math.round(w),0)} W</text></g>`;
    }
  });
  // Reflexion
  if(ratio>.02){
    const full=[Q(0,0),Q(TW,0),Q(TW,PD),Q(0,PD)];
    defs+=`<clipPath id="${pre}sc"><polygon points="${pts(full)}"/></clipPath>`;
    const dist=TW+70,dur=(8-ratio*3).toFixed(1)+'s';
    body+=`<g clip-path="url(#${pre}sc)"><polygon class="d3-sheen" points="${pts([Q(-46,0),Q(-16,0),Q(-40,PD),Q(-70,PD)])}" style="fill:#fff;fill-opacity:${(.1+ratio*.22).toFixed(2)};--dx:${(dist*C).toFixed(1)}px;--dy:${(dist*S).toFixed(1)}px;--dur:${dur}"/></g>`;
  }
  // Sonne
  const xMin=P(0,PD,0)[0]-8,xMax=P(TW,0,0)[0]+8,yMin=P(0,0,ZF+RISE)[1]-30,yMax=P(TW,PD,0)[1]+12;
  let sun='';
  if(ratio>.02)sun=`<circle cx="${xMax-22}" cy="${yMin+24}" r="46" fill="url(#${pre}sun)"/><circle cx="${xMax-22}" cy="${yMin+24}" r="${(5+ratio*5).toFixed(1)}" fill="url(#${pre}dsk)"/>`;
  return `<svg viewBox="${xMin.toFixed(1)} ${yMin.toFixed(1)} ${(xMax-xMin).toFixed(1)} ${(yMax-yMin).toFixed(1)}" role="img" aria-label="${WD.esc(label)}"><defs>${defs}</defs>${sun}${body}</svg>`;
}

/* Netz: Zählerschrank mit Sichtfenster */
function meter(grid,pre,large,text,label){
  const W=84,D=46,H=118,BASE=9,CABLE=40;
  const imp=grid>TH,exp=grid<-TH,run=imp||exp,col=imp?PAL.imp:exp?PAL.exp:'139,151,179';
  const speed=Math.max(.35,1.6-Math.abs(grid)/1500).toFixed(2)+'s';
  const z1=BASE+H,zC=z1+4,o=P(0,D,BASE);
  const defs=grad(pre+'hl','var(--hl0)','var(--hl1)')+grad(pre+'hr','var(--hr0)','var(--hr1)')+grad(pre+'ht','var(--ht0)','var(--ht1)',1,1)+glow(pre+'sh','var(--shadow)',1)+glow(pre+'gl',`rgb(${col})`,.4);
  let body='';
  const ctr=P(W/2,D/2,0);
  body+=`<ellipse cx="${ctr[0]+5}" cy="${ctr[1]+6}" rx="88" ry="50" fill="url(#${pre}sh)"/>`;
  if(run)body+=`<ellipse cx="${ctr[0]}" cy="${ctr[1]+3}" rx="92" ry="54" fill="url(#${pre}gl)"/>`;
  // Hausanschluss: Kabel im Boden, die Punkte zeigen die Richtung
  const out=P(W/2,D+CABLE,0),inn=P(W/2,D+1,0);
  body+=`<line x1="${out[0].toFixed(1)}" y1="${out[1].toFixed(1)}" x2="${inn[0].toFixed(1)}" y2="${inn[1].toFixed(1)}" style="stroke:var(--slot);stroke-width:6;stroke-linecap:round"/>`;
  if(run){const a=imp?out:inn,b=imp?inn:out;body+=`<line class="d3-fl" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgb(${col})" style="animation-duration:${speed}"/>`;}
  // Sockel
  body+=poly([[-3,D+3,0],[W+3,D+3,0],[W+3,D+3,BASE],[-3,D+3,BASE]],'fill:var(--hr0)');
  body+=poly([[W+3,D+3,0],[W+3,-3,0],[W+3,-3,BASE],[W+3,D+3,BASE]],'fill:var(--hr1)');
  body+=poly([[-3,-3,BASE],[W+3,-3,BASE],[W+3,D+3,BASE],[-3,D+3,BASE]],'fill:var(--ht1)');
  // Gehäuse
  body+=poly([[0,D,BASE],[W,D,BASE],[W,D,z1],[0,D,z1]],`fill:url(#${pre}hl)`);
  body+=poly([[W,D,BASE],[W,0,BASE],[W,0,z1],[W,D,z1]],`fill:url(#${pre}hr)`);
  for(let r=0;r<3;r++){const z=z1-16-r*6;body+=poly([[W,D-10,z-1.2],[W,D-36,z-1.2],[W,D-36,z+1.2],[W,D-10,z+1.2]],'fill:var(--slot);fill-opacity:.75');}
  // Dach
  body+=poly([[-2,D+3,z1],[W+3,D+3,z1],[W+3,D+3,zC],[-2,D+3,zC]],`fill:url(#${pre}hl)`);
  body+=poly([[W+3,D+3,z1],[W+3,-2,z1],[W+3,-2,zC],[W+3,D+3,zC]],`fill:url(#${pre}hr)`);
  body+=poly([[-2,-2,zC],[W+3,-2,zC],[W+3,D+3,zC],[-2,D+3,zC]],`fill:url(#${pre}ht)`);
  body+=`<polyline points="${pts([[-2,D+3,zC],[W+3,D+3,zC],[W+3,-2,zC]])}" style="fill:none;stroke:var(--edge);stroke-width:1.1"/>`;
  // Tür mit Fenster und Zähler
  const y=(v)=>-H+v;
  let f=`<rect x="5" y="${y(5)}" width="${W-10}" height="${H-10}" rx="2" style="fill:none;stroke:var(--slot);stroke-width:1.2"/>`;
  f+=`<rect x="12" y="${y(12)}" width="${W-24}" height="58" rx="1.5" style="fill:var(--hole);stroke:var(--edge);stroke-width:1.2"/>`;
  f+=`<rect x="16" y="${y(16)}" width="${W-32}" height="50" rx="1.5" fill="#d6dde8"/>`;
  f+=`<rect x="19" y="${y(20)}" width="${W-38}" height="20" rx="1" fill="#0a1410"/>`;
  if(large)f+=`<text x="${W/2}" y="${y(34)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="rgb(${col})" style="font-family:inherit;font-variant-numeric:tabular-nums">${text}</text>`;
  f+=`<circle class="${run?'d3-lamp':''}" cx="24" cy="${y(52)}" r="3" fill="rgb(${col})" style="animation-duration:${speed}"/>`;
  if(large)f+=`<text x="${W-20}" y="${y(55)}" text-anchor="end" font-size="8.5" font-weight="800" fill="#334155" style="font-family:var(--font)">${imp?'+A':exp?'−A':'0'}</text>`;
  f+=`<polygon points="26,${y(12)} 40,${y(12)} 30,${y(70)} 16,${y(70)}" fill="#fff" fill-opacity=".09"/>`;
  f+=`<polygon points="${W/2},-42 ${W/2-12},-20 ${W/2+12},-20" fill="#f5c542" stroke="#1b1b1b" stroke-width="1" stroke-linejoin="round"/><polygon points="${W/2+1.5},-36 ${W/2-3.5},-28 ${W/2-.5},-28 ${W/2-1.5},-23 ${W/2+3.5},-30 ${W/2+.5},-30" fill="#1b1b1b"/>`;
  f+=`<circle cx="${W-11}" cy="-30" r="2.4" style="fill:var(--slot)"/>`;
  body+=`<g transform="matrix(${C},${S},0,1,${o[0].toFixed(1)},${o[1].toFixed(1)})">${f}</g>`;
  const xMin=P(-3,D+3,0)[0]-8,xMax=P(W+3,-3,0)[0]+8,yMin=P(-2,-2,zC)[1]-6,yMax=P(W/2,D+CABLE,0)[1]+10;
  return `<svg viewBox="${xMin.toFixed(1)} ${yMin.toFixed(1)} ${(xMax-xMin).toFixed(1)} ${(yMax-yMin).toFixed(1)}" role="img" aria-label="${WD.esc(label)}"><defs>${defs}</defs>${body}</svg>`;
}

/* Haus: Herkunfts-Ring am Boden, Fenster leuchten mit dem Verbrauch */
function house(home,src,pre,form,detail,label){
  const modern=form==='modern',W=modern?104:96,D=modern?78:76,R=92,cx=W/2,cy=D/2;
  const tot=src.pv+src.bat+src.imp,ratio=Math.min(1,home/2500);
  const lit=home>TH?Math.max(1,Math.round(ratio*5)):0;
  const defs=grad(pre+'wl','var(--wl0)','var(--wl1)')+grad(pre+'wr','var(--wr0)','var(--wr1)')+grad(pre+'rf','var(--rf0)','var(--rf1)')+grad(pre+'on','#ffe9b0','#f5b54e')+grad(pre+'off','#4f6888','#1a2533')+grad(pre+'wd','#a9744a','#6f4629')+glow(pre+'sh','var(--shadow)',1)+glow(pre+'lt','rgb(255,205,120)',.5*Math.sqrt(ratio))+`<radialGradient id="${pre}gr" cx=".38" cy=".3"><stop offset="0" stop-color="#7cab63"/><stop offset="1" stop-color="#2c5a34"/></radialGradient>`;
  const wl=`fill:url(#${pre}wl)`,wr=`fill:url(#${pre}wr)`;
  const FR=modern?'#2b3038':'#f4f1e8';
  const front=(x0,x1,z0,z1,y=D)=>[[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]];
  const side=(y0,y1,z0,z1,x=W)=>[[x,y0,z0],[x,y1,z0],[x,y1,z1],[x,y0,z1]];
  const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
  // Fenster mit Rahmen, Mittelsprosse und Fensterbank; i bestimmt, ab welchem Verbrauch es leuchtet
  const pane=(i,a)=>poly(a,`fill:url(#${pre}${i<lit?'on':'off'});stroke:${FR};stroke-width:1.5`)+(detail?seg(mid(a[0],a[1]),mid(a[3],a[2]),`stroke:${FR};stroke-width:1.1`):'')+(modern?'':seg(a[0],a[1],'stroke:#f4f1e8;stroke-width:2.6'));
  const blob=(x,y,z,r)=>{const q=P(x,y,z);return `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${r}" fill="url(#${pre}gr)"/>`;};
  const box=(x0,x1,y0,y1,z0,z1,t,l,r)=>poly(front(x0,x1,z0,z1,y1),l)+poly(side(y1,y0,z0,z1,x1),r)+poly([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],t);
  let body='';
  const c=P(cx,cy,0);
  const arc=(a0,a1)=>{const k=Math.max(2,Math.ceil((a1-a0)/.09));return Array.from({length:k+1},(_,i)=>{const t=a0+(a1-a0)*i/k;return [cx+Math.cos(t)*R,cy+Math.sin(t)*R,0];});};
  // Boden und Ring
  body+=`<polygon points="${pts(arc(0,Math.PI*2))}" style="fill:rgba(var(--ov),.035)"/>`;
  body+=`<polyline points="${pts(arc(0,Math.PI*2))}" style="fill:none;stroke:rgba(var(--ov),.1);stroke-width:8"/>`;
  let a=Math.PI*.75;
  [[src.pv,PAL.pv],[src.bat,PAL.bat],[src.imp,PAL.imp]].forEach(([v,col])=>{if(!tot||v<=0)return;const e=a+v/tot*Math.PI*2;body+=`<polyline points="${pts(arc(a,e))}" style="fill:none;stroke:rgb(${col});stroke-width:8"/>`;a=e;});
  body+=`<ellipse cx="${c[0]+5}" cy="${c[1]+6}" rx="80" ry="46" fill="url(#${pre}sh)"/>`;
  if(lit)body+=`<ellipse cx="${c[0]}" cy="${c[1]+4}" rx="88" ry="50" fill="url(#${pre}lt)"/>`;
  // Baum hinter dem Haus, Weg zur Tür
  if(detail){
    const t0=P(-6,D-14,0),t1=P(-6,D-14,62);
    body+=`<line x1="${t0[0].toFixed(1)}" y1="${t0[1].toFixed(1)}" x2="${t1[0].toFixed(1)}" y2="${t1[1].toFixed(1)}" stroke="#5a4030" stroke-width="4"/>`;
    body+=blob(-6,D-14,62,17)+blob(-16,D-8,76,13)+blob(2,D-20,80,14);
    const dx0=modern?76:66,dx1=modern?96:86;
    body+=poly([[dx0,D,0],[dx1,D,0],[dx1,D+36,0],[dx0,D+36,0]],'fill:var(--path)');
  }
  let top;
  if(modern){
    const H1=42,LIP=3,xU=70,yU=58,H2=H1+LIP+33;
    // Sockel und Erdgeschoss
    body+=poly(front(0,W,0,3),'fill:var(--plinth)')+poly(side(D,0,0,3),'fill:var(--plinth)');
    body+=poly(front(0,W,3,H1),wl)+poly(side(D,0,3,H1),wr);
    body+=pane(0,front(7,37,6,37))+pane(1,front(42,70,6,37));
    body+=poly(front(79,96,3,35),`fill:url(#${pre}wd);stroke:${FR};stroke-width:1.3`);
    body+=pane(2,side(68,38,14,36));
    body+=poly(side(30,10,14,36),'fill:#000;fill-opacity:.1');
    // Dachterrasse mit Attika
    body+=box(-1,W+1,-1,D+1,H1,H1+LIP,'fill:var(--terrace)','fill:var(--wl0)','fill:var(--wr1)');
    // Obergeschoss mit Holzverkleidung
    body+=poly(front(6,xU,H1+LIP,H2,yU),wl);
    body+=poly(side(yU,6,H1+LIP,H2,xU),`fill:url(#${pre}wd)`);
    if(detail)for(let y=10;y<yU;y+=7)body+=seg([xU,y,H1+LIP],[xU,y,H2],'stroke:#000;stroke-opacity:.22;stroke-width:.8');
    body+=pane(3,front(13,62,H1+LIP+4,H2-4,yU))+pane(4,side(50,24,H1+LIP+7,H2-6,xU));
    body+=box(4,xU+2,4,yU+2,H2,H2+3,'fill:var(--wr0)','fill:var(--wl0)','fill:var(--wr1)');
    // Glasgeländer
    if(detail){
      body+=poly(front(1,W-1,H1+LIP,H1+LIP+10,D-1),'fill:#cfe6ff;fill-opacity:.18;stroke:#e8f2ff;stroke-opacity:.7;stroke-width:.8');
      body+=poly(side(D-1,1,H1+LIP,H1+LIP+10,W-1),'fill:#cfe6ff;fill-opacity:.1;stroke:#e8f2ff;stroke-opacity:.7;stroke-width:.8');
    }
    top=P(4,4,H2+3)[1];
  }else{
    const H=44,RF=34,OV=6,PL=5,zE=H-OV*RF/(D/2),zR=H+RF;
    const zS=(y)=>zR-(y-D/2)/(D/2)*RF;
    // Rückseite des Dachs, Sockel und Wände
    body+=poly([[-OV,-OV,zE],[W+OV,-OV,zE],[W+OV,D/2,zR],[-OV,D/2,zR]],'fill:var(--rf1)');
    body+=poly(front(0,W,0,PL),'fill:var(--plinth)')+poly(side(D,0,0,PL),'fill:var(--plinth)');
    body+=poly(front(0,W,PL,H),wl);
    body+=poly([[W,D,PL],[W,0,PL],[W,0,H],[W,D/2,zR],[W,D,H]],wr);
    // Schatten unter dem Dachüberstand
    body+=poly(front(0,W,H-5,H),'fill:#000;fill-opacity:.2');
    body+=poly([[W,D,H],[W,D/2,zR],[W,0,H],[W,0,H-6],[W,D/2,zR-6],[W,D,H-6]],'fill:#000;fill-opacity:.22');
    // Fenster und Tür
    body+=pane(0,front(9,29,16,36))+pane(1,front(35,55,16,36));
    body+=pane(2,side(66,46,16,36))+pane(3,side(30,10,16,36));
    body+=pane(4,side(D/2+7,D/2-7,H+2,H+18));
    body+=poly(front(66,86,PL,37),'fill:#f4f1e8');
    body+=poly(front(68,84,PL,35),`fill:url(#${pre}wd)`);
    const hd=P(81,D,20);body+=`<circle cx="${hd[0].toFixed(1)}" cy="${hd[1].toFixed(1)}" r="1.1" fill="#e8d9a8"/>`;
    // Stufe und Vordach
    body+=box(62,90,D,D+9,0,PL,'fill:var(--step)','fill:var(--plinth)','fill:var(--plinth)');
    body+=poly([[63,D,40],[89,D,40],[89,D+8,40],[63,D+8,40]],'fill:var(--wr0)')+poly(front(63,89,38.5,40,D+8),'fill:var(--wl1)')+poly(side(D+8,D,38.5,40,89),'fill:var(--wr1)');
    // Ortgang, Traufe und Dachfläche
    const FB='#efece3';
    body+=poly([[W+OV,-OV,zE],[W+OV,D/2,zR],[W+OV,D/2,zR-3],[W+OV,-OV,zE-3]],`fill:${FB}`);
    body+=poly([[W+OV,D+OV,zE],[W+OV,D/2,zR],[W+OV,D/2,zR-3],[W+OV,D+OV,zE-3]],`fill:${FB}`);
    body+=poly(front(-OV,W+OV,zE-3,zE,D+OV),`fill:${FB}`);
    body+=poly([[-OV,D+OV,zE],[W+OV,D+OV,zE],[W+OV,D/2,zR],[-OV,D/2,zR]],`fill:url(#${pre}rf)`);
    if(detail)for(let i=1;i<9;i++){const t=i/9,y=D+OV-(D/2+OV)*t,z=zE+(zR-zE)*t;body+=seg([-OV,y,z],[W+OV,y,z],'stroke:#000;stroke-opacity:.2;stroke-width:.9');}
    // Dachfenster
    const sk=[[14,D/2+28,zS(D/2+28)],[32,D/2+28,zS(D/2+28)],[32,D/2+10,zS(D/2+10)],[14,D/2+10,zS(D/2+10)]];
    body+=poly(sk,`fill:url(#${pre}off);stroke:#2b3038;stroke-width:1.6`);
    // First
    body+=poly(front(-OV,W+OV,zR-1,zR+1.5,D/2+2),'fill:var(--rf1)');
    // Schornstein: steht auf der vorderen Dachfläche, sein Fuß folgt der Neigung
    const xa=64,xb=75,ya=D/2+5,yb=D/2+15,zt=zR+13;
    body+=poly([[xa,yb,zS(yb)],[xb,yb,zS(yb)],[xb,yb,zt],[xa,yb,zt]],'fill:#a0553f');
    body+=poly([[xb,yb,zS(yb)],[xb,ya,zS(ya)],[xb,ya,zt],[xb,yb,zt]],'fill:#6b3527');
    if(detail)[.25,.5,.75].forEach((f)=>{const z=zS(yb)+(zt-zS(yb))*f;body+=seg([xa,yb,z],[xb,yb,z],'stroke:#000;stroke-opacity:.18;stroke-width:.7');});
    body+=box(xa-1.5,xb+1.5,ya-1.5,yb+1.5,zt,zt+2.5,'fill:#3a3f49','fill:#59606c','fill:#3f4550');
    top=P(xa,ya,zt+3)[1];
  }
  // Büsche vor dem Haus
  if(detail){body+=blob(8,D+9,7,9)+blob(22,D+11,6,8)+blob(W+9,20,7,9)+blob(W+10,36,6,7);}
  const xMin=c[0]-R*1.23-6,xMax=c[0]+R*1.23+6,yMin=Math.min(top,c[1]-R*.71,detail?P(2,D-20,80)[1]-14:0)-6,yMax=c[1]+R*.71+8;
  return `<svg viewBox="${xMin.toFixed(1)} ${yMin.toFixed(1)} ${(xMax-xMin).toFixed(1)} ${(yMax-yMin).toFixed(1)}" role="img" aria-label="${WD.esc(label)}"><defs>${defs}</defs>${body}</svg>`;
}

const css = '.s3d{--hl0:#46536b;--hl1:#262f42;--hr0:#2a3448;--hr1:#161d2b;--ht0:#5a6880;--ht1:#3c485e;--edge:rgba(255,255,255,.34);--slot:#080c14;--hole:#05080f;--wall:#111827;--alu0:#aeb9ca;--alu1:#5c6a80;--ink:#06101f;--shadow:rgba(0,0,0,.6);--rf0:#8a4a3c;--rf1:#54291f;--wl0:#d9d5ca;--wl1:#b4b0a5;--wr0:#8d8a81;--wr1:#6f6c64;--plinth:#4a4d55;--path:rgba(255,255,255,.14);--terrace:#6a6e76;--step:#7c8089}\n:host([data-theme="hell"]) .s3d,:host([data-theme="warm"]) .s3d{--hl0:#fbfcfe;--hl1:#d4dbe6;--hr0:#c2ccd9;--hr1:#9aa6b8;--ht0:#ffffff;--ht1:#e8ecf3;--edge:rgba(255,255,255,.9);--slot:#5d6a7e;--hole:#1a2233;--wall:#2a3448;--alu0:#c9d2de;--alu1:#7d8a9e;--shadow:rgba(15,23,42,.3);--rf0:#a8574a;--rf1:#7c3d33;--wl0:#fffdf7;--wl1:#e4dfd3;--wr0:#bdb8ac;--wr1:#a09b8f;--plinth:#737780;--path:rgba(15,23,42,.14);--terrace:#a7abb3;--step:#b8bcc4}\n.s3d .node{display:grid;grid-template-columns:minmax(0,132px) minmax(0,1fr);column-gap:14px;align-content:center}\n.s3d .node>*{grid-column:2}\n.s3d .node>.o3d{grid-column:1;grid-row:1 / span 7;align-self:center;min-width:0}\n.s3d .o3d svg{display:block;width:100%;height:auto;overflow:visible}\n.s3d .node .ico,.s3d .soc{display:none}\n.s3d .tag{justify-self:start}\n.s3d .soc-row{gap:6px}\n.s3d .soc-row b{white-space:nowrap}\n.s3d.cmp .node{grid-template-columns:52px minmax(0,1fr);column-gap:9px}\n.s3d.cmp .node>*{grid-column:2}\n.s3d.cmp .node>.o3d{grid-column:1;grid-row:1 / span 7}\n.s3d.cmp .node>.o3d svg{height:auto;margin-bottom:0}\n.s3d .node.d3tall{grid-template-columns:minmax(0,1fr)}\n.s3d .node.d3tall>*,.s3d .node.d3tall>.o3d{grid-column:1;grid-row:auto}\n.s3d .node.d3tall>.o3d svg{height:112px;margin-bottom:6px}\n.s3d.cmp .node.d3tall>.o3d svg{height:60px;margin-bottom:4px}\n.s3d .hub{display:flex;flex-direction:column;max-width:340px}\n.wide.s3d .hub{max-width:460px}\n.wide.s3d .layout{row-gap:72px}\n.s3d .hub:before,.s3d .hub>svg{display:none}\n.s3d .hub .o3d svg{position:static;transform:none;height:auto}\n.s3d.cmp .hub{max-width:240px}\n.s3d .core{position:static;order:-1;background:none;border:0;box-shadow:none;animation:none;padding:0;margin-bottom:2px}\n.s3d .core ha-icon{display:none}\n.s3d .hub-wrap .mix{order:-1;margin:0 0 6px}\n.s3d .link[data-l^="r:"]:not(.on){display:none}\n.d3-band{animation:d3rise var(--dur) linear infinite;animation-delay:var(--dl)}\n@keyframes d3rise{0%{transform:translateY(0);opacity:0}12%{opacity:.75}88%{opacity:.75}100%{transform:translateY(var(--d));opacity:0}}\n.d3-band.rev{animation-direction:reverse}\n.d3-lamp{animation:d3lamp 2.2s ease-in-out infinite}\n@keyframes d3lamp{50%{opacity:.4}}\n.d3-sheen{animation:d3sheen var(--dur) ease-in-out infinite}\n@keyframes d3sheen{from{transform:translate(0,0)}to{transform:translate(var(--dx),var(--dy))}}\n.d3-fl{fill:none;stroke-width:2.2;stroke-linecap:round;stroke-dasharray:1.5 11;animation:d3flow 1.1s linear infinite}\n@keyframes d3flow{to{stroke-dashoffset:-12.5}}\n@media (prefers-reduced-motion:reduce){.wrap:not(.anim-on) .d3-band,.wrap:not(.anim-on) .d3-lamp,.wrap:not(.anim-on) .d3-sheen,.wrap:not(.anim-on) .d3-fl{animation:none}.wrap:not(.anim-on) .d3-band,.wrap:not(.anim-on) .d3-sheen{opacity:0}}';
// Überträgt nur die Unterschiede in das vorhandene SVG, damit laufende Animationen nicht neu starten
const tpl = document.createElement('template');
const patch = (a, b) => {
  for (const n of [...a.attributes]) if (!b.hasAttribute(n.name)) a.removeAttribute(n.name);
  for (const n of [...b.attributes]) if (a.getAttribute(n.name) !== n.value) a.setAttribute(n.name, n.value);
  const ca = a.children, cb = [...b.children];
  if (!cb.length && !ca.length) { if (a.textContent !== b.textContent) a.textContent = b.textContent; return; }
  if (ca.length !== cb.length || cb.some((n, i) => n.tagName !== ca[i].tagName)) { a.replaceChildren(...cb); return; }
  cb.forEach((n, i) => patch(ca[i], n));
};
const draw = (el, html) => {
  tpl.innerHTML = html;
  const n = tpl.content.firstElementChild, o = el.firstElementChild;
  if (o && o.tagName === n.tagName) patch(o, n); else el.replaceChildren(n);
};
// roof_color (#28): Dachfarbe der 3D-Ansicht. Name oder "#hex"; liefert die CSS-Variablen für die Dachfläche (hell, dunkel), sonst ''
const ROOF = { rot: ['#8a4a3c', '#54291f'], anthrazit: ['#4b5059', '#2a2d33'], schwarz: ['#33363c', '#17191d'], grau: ['#7a7f87', '#4c5057'], braun: ['#6e4a33', '#43291b'], gruen: ['#4f6b4a', '#2e4029'], grün: ['#4f6b4a', '#2e4029'], blau: ['#4a5d7a', '#2a3850'] };
const roof = (v) => {
  if (typeof v !== 'string' || !v.trim()) return '';
  const k = v.trim().toLowerCase();
  let pair = ROOF[k];
  if (!pair) {
    const m = /^#([0-9a-f]{6})$/i.exec(k);
    if (!m) return '';
    const n = parseInt(m[1], 16), dk = (s) => Math.round(((n >> s) & 255) * 0.6);
    pair = ['#' + m[1], `rgb(${dk(16)},${dk(8)},${dk(0)})`];
  }
  return `--rf0:${pair[0]};--rf1:${pair[1]}`;
};
// Maße des Rings aus house() (R = 92): für den Anschluss der Linien in der Karte
const ring = { w: 2 * (92 * 1.23 + 6), bottom: 92 * 0.71 + 8, rx: 92 * Math.SQRT2 * C, ry: 92 * Math.SQRT2 * S };
WD.D3 = { stack, solar, meter, house, css, draw, ring, roof };
})();


/* ---- flow-card.js ---- */
/* energy-cockpit-flow-card: animierter Energiefluss. Hilfsfunktionen kommen aus common.js und i18n.js. */
(() => {
WD.addStrings({ 'ban.tonet0': 'Strom fließt ins Netz', 'stat.home': 'Haus heute', 'close': 'Schließen' });
const { PAL, TH, rgb, num, watt, kwh, rawUnits, val, clock, nf, splitW, fW, fKwh, fPct, fDur, cur, esc, haNavigate, KA, T, setLocale } = WD;
// Ab welcher Leistung ein Verbraucher oder eine Gruppe als aktiv gilt (Rahmen, Linie): on_w, sonst 10 W
const onW = (x) => { const v = parseFloat(x && x.on_w); return isNaN(v) || v < 0 ? TH : v; };
const CSS = `
${WD.themeCss()}${WD.D3.css}
:host{display:block;--pv:${PAL.pv};--imp:${PAL.imp};--exp:${PAL.exp};--bat:${PAL.bat};--home:${PAL.home}}
ha-card{background:radial-gradient(120% 80% at 50% 0%,var(--bg1) 0%,var(--bg0) 65%);border-radius:28px;overflow:hidden;border:1px solid rgba(var(--ov),.06);color:var(--txt);font-family:Inter,var(--ha-font-family-body,system-ui),sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:22px;position:relative;transform-origin:0 0;box-sizing:border-box}
.wrap:before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;background:radial-gradient(40% 30% at 18% 18%,rgba(var(--pv),.11),transparent 70%),radial-gradient(40% 35% at 85% 40%,rgba(var(--bat),.09),transparent 70%),radial-gradient(35% 30% at 50% 45%,rgba(var(--home),.10),transparent 70%)}
header{display:flex;align-items:center;flex-wrap:wrap;margin:0 0 22px;position:relative}
header>*{margin:3px 0 3px 8px}
.title{font-size:calc(1.05rem*var(--ts,1));font-weight:650;display:flex;align-items:center;margin:3px auto 3px 0;letter-spacing:.01em}
.live{width:8px;height:8px;border-radius:50%;background:rgb(var(--exp));margin-right:10px;position:relative}
.live:after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;border-radius:50%;background:rgb(var(--exp));opacity:0;pointer-events:none;animation:ping 2s infinite}
@keyframes ping{0%{transform:scale(1);opacity:.7}100%{transform:scale(3.5);opacity:0}}
.clock{font-variant-numeric:tabular-nums;color:var(--mut);font-weight:500;margin-left:12px;font-size:.95rem}
.pill{font-size:calc(.74rem*var(--ts,1));color:rgb(var(--mut));padding:6px 11px;border-radius:999px;background:var(--glass);border:1px solid var(--stroke)}
.pill b{color:var(--txt);font-weight:650;font-variant-numeric:tabular-nums;margin-left:4px}
.ka{display:none}
.ka.show{display:block}
.ka.wait{color:#fff;border-color:rgba(var(--pv),.6);background:rgba(var(--pv),.15);position:relative}
.ka.wait:after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;border-radius:inherit;box-shadow:0 0 0 6px rgba(var(--pv),.15);opacity:0;pointer-events:none;animation:kapulse 1.6s ease-in-out infinite}
.ka.on{color:rgb(var(--exp));border-color:rgba(var(--exp),.35)}
@keyframes kapulse{50%{opacity:1}}
.wst{display:none;cursor:pointer;color:var(--txt);border-color:rgba(var(--wc),.55);background:rgba(var(--wc),.14);font-weight:650}
.wst.show{display:block}
.wst b{color:rgb(var(--wc));margin-left:0}
.wst.urgent{position:relative}
.wst.urgent:after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;border-radius:inherit;box-shadow:0 0 0 7px rgba(var(--wc),.18);opacity:0;pointer-events:none;animation:wpulse 1.6s ease-in-out infinite}
@keyframes wpulse{50%{opacity:1}}
.navbtn{cursor:pointer;color:var(--txt);font-weight:650;background:rgba(var(--ov),.07);border:1px solid rgba(var(--ov),.14);padding:8px 14px;border-radius:999px;font-size:calc(.8rem*var(--ts,1));margin-left:8px;-webkit-tap-highlight-color:transparent;transition:background .3s}
.navbtn:active{background:rgba(var(--ov),.18)}
.banner{position:relative;display:flex;align-items:center;overflow:hidden;border-radius:20px;max-height:0;opacity:0;margin:0;padding:0 18px;border:1px solid transparent;transition:max-height .6s cubic-bezier(.2,.8,.2,1),opacity .5s,margin .6s,padding .6s}
.banner.show{max-height:140px;opacity:1;margin:0 0 20px;padding:14px 18px}
.banner.sur{background:linear-gradient(100deg,rgba(var(--pv),.22),rgba(var(--pv),.06) 60%,rgba(var(--exp),.10));border-color:rgba(var(--pv),.6);box-shadow:0 0 0 1px rgba(var(--pv),.35)}
.banner.imp{background:linear-gradient(100deg,rgba(var(--imp),.2),rgba(var(--imp),.05) 70%);border-color:rgba(var(--imp),.6);box-shadow:0 0 0 1px rgba(var(--imp),.35)}
.banner:after{content:'';position:absolute;top:0;bottom:0;left:-40%;width:40%;background:linear-gradient(90deg,transparent,rgba(var(--ov),.12),transparent);animation:sweep 4.5s ease-in-out infinite;pointer-events:none}
@keyframes sweep{0%{transform:translateX(0)}60%,100%{transform:translateX(400%)}}
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
.b-sub{font-size:calc(.78rem*var(--ts,1));color:rgb(var(--mut));margin-top:3px}
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
.node.on{border-color:rgba(var(--c),.6);box-shadow:inset 0 0 0 1px rgba(var(--c),.16),0 0 0 1px rgba(var(--c),.35)}
.node.on:after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(var(--c),.12);opacity:0;pointer-events:none;animation:breathe 4s ease-in-out infinite}
@keyframes breathe{50%{opacity:1}}
.node:not(.on){border-color:rgba(var(--ov),.05)}
.node:not(.on) .val,.node:not(.on) .n-top,.node:not(.on) .sub{opacity:.7}
.pv{grid-area:pv}.pv2{grid-area:pv2}.grid{grid-area:grid}.bat{grid-area:bat}
.bats{grid-area:bat;display:flex;flex-direction:column;justify-content:center;gap:24px 0;min-width:0}.bats .bat{grid-area:auto}
.narrow .bats{gap:16px 0}
.layout.has-pv2{grid-template-areas:"pv hub bat" "pv2 hub bat" "grid hub bat"}
/* pv_to_battery: direkt: Solar steht über dem Speicher (der Strom läuft durch ihn), das Netz wechselt auf die rechte Seite */
.layout.via-bat{grid-template-areas:"pv hub grid" "bat hub grid";row-gap:44px}
.layout.via-bat.has-pv2{grid-template-areas:"pv2 hub grid" "pv hub grid" "bat hub grid"}
.n-top{display:flex;align-items:center;color:rgb(var(--mut));font-size:calc(.7rem*var(--ts,1));text-transform:uppercase;letter-spacing:.1em;font-weight:650}
.ico{width:32px;height:32px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:rgba(var(--c),.16);color:rgb(var(--c));flex:none;margin-right:9px}
.ico ha-icon{--mdc-icon-size:18px;display:flex}
.lbl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.val{margin-top:12px;display:flex;align-items:baseline}
.num{font-size:1.95rem;font-weight:750;letter-spacing:-.025em;font-variant-numeric:tabular-nums;line-height:1;color:var(--txt);transition:color .5s}
.node.on .num{color:rgb(var(--c));text-shadow:none}
.unit{font-size:.85rem;color:rgb(var(--mut));font-weight:650;margin-left:5px}
.tag{display:inline-flex;margin-top:9px;font-size:calc(.64rem*var(--ts,1));font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:rgba(var(--c),.15);color:rgb(var(--c))}
.tag:empty{display:none}
.sub{margin-top:9px;font-size:calc(.74rem*var(--ts,1));color:rgb(var(--mut));line-height:1.55}
.sub:empty{display:none}
.sub b{color:var(--txt);font-weight:600;font-variant-numeric:tabular-nums}
.soc{margin-top:13px;position:relative;height:9px;border-radius:999px;background:rgba(var(--ov),.07);overflow:hidden}
.soc-fill{position:absolute;top:0;left:0;bottom:0;width:0;border-radius:inherit;background:linear-gradient(90deg,rgba(var(--sc,var(--c)),.45),rgb(var(--sc,var(--c))));box-shadow:0 0 0 1px rgba(var(--sc,var(--c)),.35);transition:width 1.2s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.bat.charging .soc-fill:after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent,rgba(var(--ov),.55),transparent);animation:shine 1.8s linear infinite}
@keyframes shine{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.soc-low,.soc-high{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(-45deg,rgba(var(--ov),.22) 0 3px,rgba(var(--ov),.06) 3px 6px);pointer-events:none}
.soc-low{left:0;border-right:1px solid rgba(var(--ov),.5)}
.soc-high{right:0;border-left:1px solid rgba(var(--ov),.5)}
.soc-row{display:flex;justify-content:space-between;margin-top:7px;font-size:calc(.72rem*var(--ts,1));color:rgb(var(--mut))}
.soc-row b{color:var(--txt);font-variant-numeric:tabular-nums}
.hub-wrap{grid-area:hub;display:flex;flex-direction:column;align-items:center}
.hub{position:relative;width:100%;max-width:250px;cursor:pointer;transition:transform .25s}
.hub:before{content:'';display:block;padding-top:100%}
.hub svg{position:absolute;top:0;left:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible}
.ring-bg{fill:none;stroke:rgba(var(--ov),.06);stroke-width:6}
/* Punkte aus runden Linienenden (wie bei .flow): bleiben auch klein und auf dem iPhone sichtbar */
.orbit{fill:none;stroke:rgba(var(--ov),.22);stroke-width:1.1;stroke-linecap:round;stroke-dasharray:0 4;transform-origin:60px 60px;animation:spin 40s linear infinite}
.narrow .orbit,.cmp .orbit{stroke:rgba(var(--ov),.3);stroke-width:1.9;stroke-dasharray:0 5.2}
@keyframes spin{to{transform:rotate(360deg)}}
.seg{fill:none;stroke:currentColor;stroke-width:6;stroke-linecap:round;stroke-dasharray:0 100;opacity:0;transition:opacity .6s,stroke-dasharray 1.2s cubic-bezier(.2,.8,.2,1),stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)}
.core{position:absolute;top:14%;left:14%;right:14%;bottom:14%;border-radius:50%;background:radial-gradient(circle at 50% 28%,var(--bg2),var(--bg0) 72%);border:1px solid rgba(var(--ov),.08);box-shadow:0 0 0 1px rgba(var(--home),.35),inset 0 1px 0 rgba(var(--ov),.07);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.core ha-icon{color:rgb(var(--home));--mdc-icon-size:26px;margin-bottom:6px}
.core .val{margin:0}
.core .num{font-size:2.15rem;color:rgb(var(--home));text-shadow:none}
.hub-lbl{font-size:calc(.62rem*var(--ts,1));letter-spacing:.16em;text-transform:uppercase;color:rgb(var(--mut));font-weight:650;margin-top:7px}
.mix{display:flex;font-size:calc(.7rem*var(--ts,1));color:rgb(var(--mut));flex-wrap:wrap;justify-content:center;margin-top:14px}
.mix span{display:flex;align-items:center;margin:0 6px}
.mix i{width:7px;height:7px;border-radius:50%;background:rgb(var(--c));box-shadow:0 0 0 1px rgba(var(--c),.35);margin-right:5px}
.mix b{color:var(--txt);font-variant-numeric:tabular-nums;font-weight:600;margin-left:4px}
.consumers{position:relative;z-index:1;display:grid;justify-content:center;grid-template-columns:repeat(auto-fit,minmax(140px,240px));grid-gap:12px;gap:12px;margin-top:54px}
.cons{display:flex;align-items:center;padding:11px 12px;border-radius:17px;background:var(--glass);border:1px solid var(--stroke);cursor:pointer;transition:all .5s;min-width:0}
.cons .ico{margin-right:10px}
.cons.on{border-color:rgba(var(--c),.55);background:rgba(var(--c),.07);box-shadow:0 0 0 1px rgba(var(--c),.35)}
.cons.on .ico,.grp.on .ico{position:relative}
.cons.on .ico:after,.grp.on .ico:after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;border-radius:inherit;box-shadow:0 0 0 1px rgba(var(--c),.35);opacity:0;pointer-events:none;animation:bob 2.4s ease-in-out infinite}
@keyframes bob{50%{opacity:1}}
.cons:not(.on){opacity:.55}
.c-txt{display:flex;flex-direction:column;min-width:0}
.cons .lbl{font-size:calc(.64rem*var(--ts,1));color:rgb(var(--mut));text-transform:uppercase;letter-spacing:.08em;font-weight:650;margin-bottom:3px}
.cons .val{margin:0}
.cons .num{font-size:1.1rem}.cons .unit{font-size:.7rem;margin-left:3px}
.cons.on .num{color:rgb(var(--c))}
.c-sec{margin-left:auto;padding-left:6px;font-size:calc(.72rem*var(--ts,1));color:rgb(var(--mut));white-space:nowrap;font-variant-numeric:tabular-nums}
footer{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));grid-gap:10px;gap:10px;margin-top:20px;padding-top:18px;border-top:1px solid var(--stroke);position:relative}
.stat{display:flex;flex-direction:column;padding:11px 13px;border-radius:15px;background:rgba(var(--ov),.028);border:1px solid rgba(var(--ov),.04)}
.stat span{font-size:calc(.62rem*var(--ts,1));color:rgb(var(--mut));text-transform:uppercase;letter-spacing:.09em;font-weight:650;display:flex;align-items:center;margin-bottom:5px}
.stat span i{flex:none;width:6px;height:6px;border-radius:50%;background:rgb(var(--c));margin-right:6px}
.stat span{min-width:0;overflow-wrap:anywhere}
.stat.fc{cursor:pointer}
.stat.fc span i{background:none;box-shadow:inset 0 0 0 1.5px rgb(var(--c))}
.stat b{font-size:1.1rem;font-variant-numeric:tabular-nums;font-weight:700}
.stat small{color:rgb(var(--mut));font-weight:500;font-size:.72rem;margin-left:3px}
.groups{position:relative;z-index:1;display:grid;grid-gap:10px;gap:10px;margin-top:54px}
.grp{position:relative;padding:10px 10px 8px;border-radius:17px;background:linear-gradient(160deg,rgba(var(--ov),.06),rgba(var(--ov),.012)),var(--panel);border:1px solid var(--stroke);transition:border-color .5s,box-shadow .5s,opacity .5s;min-width:0}
.grp.on{border-color:rgba(var(--c),.6);box-shadow:inset 0 0 0 1px rgba(var(--c),.12),0 0 0 1px rgba(var(--c),.35)}
.grp:not(.on){opacity:.6}
.g-hd{display:flex;align-items:center;min-width:0}
.grp .ico{width:26px;height:26px;border-radius:9px;margin-right:7px}
.grp .ico ha-icon{--mdc-icon-size:15px}
.grp .lbl{font-size:calc(.6rem*var(--ts,1));color:rgb(var(--mut));text-transform:uppercase;letter-spacing:.08em;font-weight:700}
.grp .val{margin-top:7px}
.grp .num{font-size:1.25rem}.grp .unit{font-size:.68rem;margin-left:3px}
.grp.on .num{color:rgb(var(--c));text-shadow:none}
.its{margin-top:6px;border-top:1px solid rgba(var(--ov),.06);padding-top:4px;display:flex;flex-direction:column}
.it{display:flex;align-items:center;font-size:calc(.64rem*var(--ts,1));color:rgb(var(--mut));line-height:1.8;min-width:0;cursor:pointer}
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
.wide .title{font-size:calc(1.25rem*var(--ts,1))}
.wide .pill{font-size:calc(.85rem*var(--ts,1));padding:8px 14px}
.wide .layout{grid-template-columns:1fr minmax(260px,1.1fr) 1fr;gap:28px 56px}
.wide .node{padding:20px 22px;border-radius:26px}
.wide .n-top{font-size:calc(.8rem*var(--ts,1))}
.wide .ico{width:40px;height:40px;border-radius:13px}
.wide .ico ha-icon{--mdc-icon-size:22px}
.wide .num{font-size:2.6rem}
.wide .unit{font-size:1rem}
.wide .sub{font-size:calc(.86rem*var(--ts,1))}
.wide .tag{font-size:calc(.72rem*var(--ts,1));padding:4px 11px}
.wide .hub{max-width:300px}
.wide .core .num{font-size:2.8rem}
.wide .core ha-icon{--mdc-icon-size:32px}
.wide .hub-lbl{font-size:calc(.72rem*var(--ts,1))}
.wide .mix{font-size:calc(.82rem*var(--ts,1))}
.wide .consumers{grid-template-columns:repeat(auto-fit,minmax(200px,260px));gap:14px;margin-top:60px}
.wide .cons{padding:14px 16px;border-radius:20px}
.wide .cons .num{font-size:1.35rem}
.wide .cons .lbl{font-size:calc(.72rem*var(--ts,1))}
.wide .groups{gap:12px;margin-top:60px}
.wide .grp{padding:12px 12px 9px;border-radius:19px}
.wide .grp .num{font-size:1.5rem}
.wide .grp .lbl{font-size:calc(.66rem*var(--ts,1))}
.wide .it{font-size:calc(.72rem*var(--ts,1))}
.wide .stat b{font-size:1.35rem}
.wide .stat span{font-size:calc(.7rem*var(--ts,1))}
/* groups_lines: sammel: eine Linie zum ganzen Verbraucherbereich */
.sam-on .mix{order:-1;margin:0 0 12px}
/* Klassische Ansicht: Legende über dem Ring, dort kommt keine Linie an (unten laufen die Linien zu den Verbrauchern, auf dem Handy zu Solar, Netz und Akku) */
.wrap:not(.s3d) .mix{order:-1;margin:0 0 12px}
.sambox{position:relative;z-index:1;margin-top:46px;padding:30px 12px 12px;border:1px solid var(--stroke);border-radius:26px;background:rgba(var(--ov),.018)}
.wrap .sambox .consumers,.wrap .sambox .groups{margin-top:0}
.wrap .sambox .consumers+.groups{margin-top:12px}
.sam{position:absolute;top:0;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:9px;padding:7px 16px;border-radius:999px;background:var(--panel);border:1px solid var(--stroke);white-space:nowrap;z-index:2;transition:border-color .5s,box-shadow .5s}
.sam.on{border-color:rgba(var(--home),.6);box-shadow:0 0 0 1px rgba(var(--home),.3)}
.sam-t{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:rgb(var(--mut));font-weight:650}
.sam-w{font-size:1rem;font-weight:700;font-variant-numeric:tabular-nums;color:var(--txt)}
/* text_size: gross | sehr_gross vergrößert die kleinen Texte (Tablet, Handy) */
.ts-l{--ts:1.25}
.ts-xl{--ts:1.5}
.ts-l .soc-row b,.ts-xl .soc-row b{font-size:1.05rem}
/* Smartphone */
.narrow{padding:16px}
.narrow header{margin-bottom:14px}
.narrow .layout{grid-template-columns:1fr 1fr;grid-template-areas:"hub hub" "pv bat" "grid bat";gap:16px 14px}
.narrow .layout.has-pv2{grid-template-areas:"hub hub" "pv bat" "pv2 bat" "grid bat"}
/* pv_to_battery: direkt auf dem Handy: Solar und Netz nebeneinander, der Speicher darunter (Solar fließt senkrecht in ihn) */
.narrow .layout.via-bat{grid-template-areas:"hub hub" "pv grid" "bat bat";row-gap:34px}
.narrow .layout.via-bat.has-pv2{grid-template-areas:"hub hub" "pv pv2" "bat bat" "grid grid"}
.narrow .via-bat .mix{order:-1;margin:0 0 12px}
.narrow .hub{max-width:210px}
.narrow .num{font-size:1.5rem}
.narrow .core .num{font-size:1.8rem}
.narrow .groups{margin-top:26px}
.narrow .groups:not(.gc-fixed){grid-template-columns:repeat(3,minmax(0,1fr))!important}
/* groups_columns: breite Gruppen verteilen ihre Einträge auf mehrere Spalten */
.groups.gc-fixed .its{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));column-gap:16px}
.narrow .consumers{margin-top:26px;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));justify-content:stretch}
/* compact: Kurzansicht fürs Handy, alles Wichtige auf einen Blick (Erzeuger neben dem Ring, Gruppen ohne Geräteliste) */
.cmp{padding:14px}
.cmp header{margin-bottom:10px}
.cmp .pill{font-size:calc(.66rem*var(--ts,1));padding:4px 9px}
.cmp .banner.show{padding:9px 12px;margin-bottom:12px}
.cmp .b-ico{width:34px;height:34px;border-radius:11px;margin-right:10px}
.cmp .b-ico ha-icon{--mdc-icon-size:20px}
.cmp .b-title{font-size:.92rem}
.wrap.cmp .layout{grid-template-columns:1fr minmax(88px,.8fr) 1fr;grid-template-areas:"pv hub bat" "grid hub bat";gap:10px 12px}
.wrap.cmp .layout.has-pv2{grid-template-areas:"pv hub bat" "pv2 hub bat" "grid hub bat"}
.wrap.cmp .layout.via-bat{grid-template-areas:"pv hub grid" "bat hub grid"}
.wrap.cmp .layout.via-bat.has-pv2{grid-template-areas:"pv2 hub grid" "pv hub grid" "bat hub grid"}
.cmp .node{padding:10px 11px;border-radius:17px}
.cmp .n-top{font-size:calc(.58rem*var(--ts,1));letter-spacing:.06em}
.cmp .ico{width:24px;height:24px;border-radius:8px;margin-right:6px}
.cmp .ico ha-icon{--mdc-icon-size:14px}
.cmp .val{margin-top:7px}
.cmp .num{font-size:1.2rem}
.cmp .unit{font-size:.68rem;margin-left:3px}
.cmp .tag{margin-top:6px;font-size:calc(.54rem*var(--ts,1));padding:2px 7px}
.cmp .soc{margin-top:8px;height:7px}
.cmp .soc-row{margin-top:4px;font-size:calc(.66rem*var(--ts,1))}
.cmp .sub,.cmp .soc-row span,.cmp .mix,.cmp .hub-lbl,.cmp .b-sub,.cmp .b-chips,.wrap.cmp .groups .its,.cmp .c-sec{display:none}
.cmp .hub{max-width:130px}
.cmp .core ha-icon{--mdc-icon-size:16px;margin-bottom:2px}
.cmp .core .num{font-size:1.1rem}
.cmp .sambox{margin-top:30px;padding:24px 8px 8px;border-radius:20px}
.cmp .sam{padding:5px 12px}
.wrap.cmp .consumers,.wrap.cmp .groups{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))!important;gap:8px;justify-content:stretch}
.cmp .cons{padding:8px 10px;border-radius:14px}
.cmp .cons .num{font-size:1rem}
.cmp .grp{padding:8px 10px;border-radius:14px}
.cmp .grp:not(.rest){cursor:pointer}
.cmp .grp:not(.rest) .g-hd:after{content:'›';margin-left:auto;padding-left:6px;color:rgb(var(--mut));font-size:1.1rem;line-height:1}
/* Kurzansicht: Tipp auf eine Gruppe öffnet ein Fenster mit allen Geräten */
.gdlg{padding:0;width:min(92vw,440px);max-height:80vh;border-radius:24px;border:1px solid rgba(var(--c),.5);box-shadow:0 0 0 1px rgba(var(--c),.25),0 24px 60px rgba(0,0,0,.5);background:linear-gradient(160deg,rgba(var(--ov),.06),rgba(var(--ov),.012)),var(--panel);color:var(--txt);font-family:Inter,var(--ha-font-family-body,system-ui),sans-serif;overflow:hidden}
.gdlg::backdrop{background:rgba(0,0,0,.55)}
.d-hd{display:flex;align-items:center;padding:16px 16px 14px 18px;border-bottom:1px solid var(--stroke)}
.d-name{flex:1;min-width:0;font-weight:700;font-size:1.05rem;overflow-wrap:anywhere}
.d-sum{margin-left:10px;font-size:1.35rem;font-weight:750;color:rgb(var(--c));font-variant-numeric:tabular-nums;white-space:nowrap}
.d-x{margin-left:12px;flex:none;width:36px;height:36px;border-radius:50%;border:1px solid var(--stroke);background:rgba(var(--ov),.06);color:var(--txt);font-size:1.2rem;line-height:1;cursor:pointer}
.d-its{padding:8px 10px 14px;overflow:auto;max-height:calc(80vh - 72px);display:flex;flex-direction:column}
.d-it{display:flex;align-items:center;padding:11px 8px;border-radius:12px;font-size:.95rem;color:rgb(var(--mut));cursor:pointer}
.d-it:active{background:rgba(var(--ov),.07)}
.d-it i{flex:none;width:8px;height:8px;border-radius:50%;background:rgba(var(--ov),.2);margin-right:10px}
.d-it.on{color:var(--txt)}
.d-it.on i{background:rgb(var(--c));box-shadow:0 0 0 2px rgba(var(--c),.3)}
.d-it .in{flex:1;min-width:0;overflow-wrap:anywhere}
.d-it b{margin-left:12px;color:var(--txt);font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap}
.cmp .grp .val{margin-top:4px}
.cmp .grp .num{font-size:1.05rem}
.cmp footer{grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:6px;margin-top:12px;padding-top:12px}
.cmp .stat{padding:7px 8px;border-radius:12px}
.cmp .stat span{font-size:calc(.52rem*var(--ts,1));letter-spacing:.05em;margin-bottom:3px}
.cmp .stat b{font-size:.9rem}
.ico.logo,.grp .ico.logo{width:auto;height:auto;min-width:0;background:none;box-shadow:none;border-radius:6px}
.ico.logo img{display:block;height:28px;max-width:96px;object-fit:contain;border-radius:5px}
.cons .ico.logo img{height:30px;max-width:80px}
/* animations: always (oder immer) animiert auch bei "Bewegung reduzieren" am Gerät */
@media (prefers-reduced-motion:reduce){.wrap:not(.anim-on) .flow,.wrap:not(.anim-on) .orbit,.wrap:not(.anim-on) .node.on:after,.wrap:not(.anim-on) .live:after,.wrap:not(.anim-on) .cons.on .ico:after,.wrap:not(.anim-on) .grp.on .ico:after{animation-duration:0s!important}}
`;

class EnergyCockpitFlowCard extends HTMLElement {
  constructor() {
    super();
    this._dec = {};
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
    this._dec = WD.decOf(this._c);
    // consumer_groups_sort: leistung (#24): Geräte einer Gruppe nach aktueller Leistung, aktive oben. Reihenfolge je Gruppe merken
    this._gSort = this._c.consumer_groups_sort === 'leistung' || this._c.consumer_groups_sort === 'power';
    this._gOrd = {}; this._gSortT = 0;
    this._dTot = null; this._dLoaded = 0; this._dErr = false;
    // Listen können als Array oder als Objekt {0:…, 1:…} vorliegen (so speichert sie das Formular von Home Assistant)
    const arr = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]) : []));
    const used = (x) => x && (x.entity || x.secondary);
    // Speicher: batteries (Liste) hat Vorrang, sonst der einzelne Eintrag battery
    const usedB = (b) => b && (b.power || b.power_charge || b.power_discharge || b.soc);
    // battery ist der erste Speicher, batteries enthält die weiteren (ohne battery: batteries allein)
    const more = arr(this._c.batteries).filter(usedB);
    const first = this._c.battery;
    const bl = more.length ? (usedB(first) ? [first].concat(more) : more) : (first ? [first] : []);
    this._c.batteries = bl;
    if (bl.length) this._c.battery = bl[0];
    // pv_to_battery: direkt (Speicher vor dem Wechselrichter, z. B. Marstek B2500): nur mit PV-Sensor und Ausgangsleistung des ersten Speichers
    const vb = this._c.pv_to_battery;
    this._via = (vb === 'direkt' || vb === true) && !!(this._c.pv && this._c.pv.entity) && !!(bl[0] && bl[0].power_out);
    this._s3d = this._c.style === '3d';
    this._c.consumers = arr(this._c.consumers).filter(used);
    // grid2 (optional, #29): zweiter Netzzähler, z. B. Wärmepumpe mit eigenem Zähler und Tarif (nur Bezug). Erscheint als Kachel bei den Verbrauchern,
    // zählt zum Hausverbrauch und im Ring zum Netz. Der Preis (price oder price_ct) steht als Kosten pro Stunde in der Kachel
    const g2 = this._c.grid2;
    this._c.grid2 = g2 && typeof g2 === 'object' && typeof g2.entity === 'string' && g2.entity ? g2 : null;
    if (this._c.grid2) this._c.consumers.unshift({ entity: g2.entity, name: g2.name || T('flow.grid2'), icon: g2.icon || 'mdi:heat-pump-outline', color: '#ff5c7a', _g2: true });
    this._c.consumer_groups = arr(this._c.consumer_groups)
      .map((g) => Object.assign({}, g, { items: arr(g && g.items).filter(used) }))
      .filter((g) => g.name || g.items.length);
    this._build();
    if (this._hass) this._update();
  }
  // Höchstens ein Durchlauf je Sekunde: Sensoren melden oft mehrmals pro Sekunde, die Anzeige gewinnt dadurch nichts
  set hass(h) {
    this._hNext = h;
    if (this._hT) return;
    const wait = (WD.flowUpdateMs === undefined ? 1000 : WD.flowUpdateMs) - (Date.now() - (this._hLast || 0));
    if (wait > 0) { this._hT = setTimeout(() => { this._hT = null; this._applyHass(this._hNext); }, wait); return; }
    this._applyHass(h);
  }
  _applyHass(h) {
    this._hLast = Date.now();
      WD.applyTheme(this, null, h);
    setLocale(h);
    // Sprache aus Home Assistant erst jetzt bekannt: statische Texte neu aufbauen
    if (this._c && this._bl !== WD.state.lang) this._build();
    this._hass = h;
    this._update();
    this._loadDaily();
    if (this._c && this._c.waste && !this._wLoading && Date.now() - (this._wLoaded || 0) > 30 * 60 * 1000) this._loadWaste();
  }
  // daily_from_total (optional): Tageswerte aus Gesamtzählern wie im Energie-Dashboard, Änderung seit Mitternacht aus der Langzeitstatistik
  _dailyIds() {
    const c = this._c, ids = [];
    const add = (id) => { if (id && ids.indexOf(id) < 0) ids.push(id); };
    if (c.pv) add(c.pv.daily);
    if (c.pv2) add(c.pv2.daily);
    if (c.grid) { add(c.grid.daily_import); add(c.grid.daily_export); }
    c.batteries.forEach((b) => { add(b.daily_charge); add(b.daily_discharge); });
    if (c.home) add(c.home.daily);
    return ids;
  }
  async _loadDaily() {
    const c = this._c, h = this._hass;
    if (!c || !c.daily_from_total || !h || !h.callWS || this._dLoading) return;
    const now = new Date(), day = now.toDateString();
    if (this._dDay === day && Date.now() - (this._dLoaded || 0) < 120000) return;
    const ids = this._dailyIds();
    if (!ids.length) return;
    this._dLoading = true;
    try {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      const r = await h.callWS({ type: 'recorder/statistics_during_period', start_time: s.toISOString(), period: '5minute', statistic_ids: ids, types: ['change'], ...WD.statUnits(c) });
      const t = {};
      ids.forEach((id) => { const rows = (r && r[id]) || []; t[id] = rows.length ? rows.reduce((a, x) => a + (x.change > 0 ? x.change : 0), 0) : null; });
      this._dTot = t; this._dErr = false;
    } catch (e) { this._dErr = true; }
    this._dDay = day; this._dLoaded = Date.now(); this._dLoading = false;
    this._update();
  }
  // Müllabfuhr aus dem Abfallkalender: Hinweis-Chip am Vortag / Abholtag
  async _loadWaste() {
    const h = this._hass, w = this._c.waste;
    if (!h || !h.callApi || !w.calendar) return;
    this._wLoading = true;
    try {
      const s = new Date(); s.setHours(0, 0, 0, 0);
      const e = new Date(s.getTime() + 3 * 864e5);
      const ev = await h.callApi('GET', `calendars/${encodeURIComponent(w.calendar)}?start=${encodeURIComponent(s.toISOString())}&end=${encodeURIComponent(e.toISOString())}`);
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
    el.style.setProperty('--wc', rgb(list[0].type.color, PAL.mut));
    el.innerHTML = `🗑 ${todayEv.length ? T('waste.today') : T('waste.tomorrow')}: <b>${esc(names)}</b>`;
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
    clearTimeout(this._hT); this._hT = null;
    if (this._ro) this._ro.disconnect();
    window.removeEventListener('resize', this._onResize);
    if (this._kaSub) KA.subs.delete(this._kaSub);
    clearInterval(this._clockT);
    clearTimeout(this._fitT);
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
    // Nach dem Laden der Schrift und nach der Anlaufzeit einmal sicher neu einpassen, auch wenn der Maßstab gerade gehalten wird
    const refit = () => { this._forceFit = true; this._schedLayout(); };
    clearTimeout(this._fitT);
    this._fitT = setTimeout(refit, 2500);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
    const node = (k, cls, icon, label, color, ent, extra = '') => `
      <div class="node ${cls}" data-k="${k}" data-e="${esc(ent)}" style="--c:${color}">
        ${this._s3d ? `<div class="o3d" data-o="${k}"></div>` : ''}<div class="n-top"><span class="ico"><ha-icon icon="${esc(icon)}"></ha-icon></span><span class="lbl">${esc(label)}</span></div>
        <div class="val"><span class="num">—</span><span class="unit"></span></div>
        <div class="tag"></div>${extra}<div class="sub"></div>
      </div>`;
    const links = [];
    let nodes = '';
    if (c.pv) { nodes += node('pv', 'pv', c.pv.icon || 'mdi:solar-power-variant', c.pv.name || T('flow.pv'), PAL.pv, c.pv.entity); if (!this._via) links.push('pv'); }
    const hasPv2 = !!(c.pv2 && c.pv2.entity);
    if (hasPv2) { nodes += node('pv2', 'pv2', c.pv2.icon || 'mdi:solar-panel', c.pv2.name || T('flow.pv2'), PAL.pv, c.pv2.entity); links.push('pv2'); }
    if (c.grid) { nodes += node('grid', 'grid', c.grid.icon || 'mdi:transmission-tower', c.grid.name || T('flow.grid'), PAL.imp, c.grid.entity); links.push('grid'); }
    if (c.batteries.length) {
      const nB = c.batteries.length;
      const bHtml = c.batteries.map((b, i) => node(this._bk(i), 'bat', b.icon || 'mdi:home-battery-outline', b.name || (T('flow.battery') + (nB > 1 ? ' ' + (i + 1) : '')), PAL.bat, (b.tap === 'soc' && b.soc) || b.power || b.power_charge || b.power_discharge,
        // Klick auf Balken und Prozentzahl öffnet den Verlauf des Ladestands, der Rest der Kachel den der Leistung
        `<div class="socbox"${b.soc ? ` data-e="${esc(b.soc)}"` : ''}><div class="soc"><div class="soc-fill"></div><div class="soc-low"></div><div class="soc-high"></div></div><div class="soc-row"><span>${T('flow.soc')}</span><b class="soc-txt">—</b></div></div>${b.temp ? `<div class="socbox" data-e="${esc(b.temp)}"><div class="soc-row"><span>${T('flow.temp')}</span><b class="temp-txt">—</b></div></div>` : ''}`)).join('');
      nodes += nB > 1 ? `<div class="bats">${bHtml}</div>` : bHtml;
      c.batteries.forEach((b, i) => links.push(this._bk(i)));
      if (this._via) links.push('pvbat');
      // 3D: echte Wege zwischen den Geräten, nicht über das Haus (Speicher hinter dem Zähler hängen am Haus)
      if (this._s3d) c.batteries.forEach((b, i) => {
        if (b.behind_meter === true) return;
        const k = this._bk(i);
        if (c.grid) links.push(`r:${k}:grid`);
        if (this._via && i === 0) return;
        if (c.pv) links.push(`r:pv:${k}`);
        if (c.grid) links.push(`r:grid:${k}`);
      });
    }
    if (this._s3d && c.grid) { if (c.pv) links.push('r:pv:grid'); if (hasPv2) links.push('r:pv2:grid'); }
    // groups_columns: Gruppen pro Reihe (Standard: alle in einer Reihe). Stehen Gruppen untereinander,
    // liefen einzelne Linien durch die oberen Gruppen; ohne ausdrückliches groups_lines gilt dann die Sammel-Linie.
    const gc = Math.max(0, parseInt(c.groups_columns, 10) || 0);
    this._gc = gc;
    const nGrp = (c.consumer_groups || []).length + (c.rest !== false && !c.hide_rest && (c.consumer_groups || []).length ? 1 : 0);
    // In der Kurzansicht (compact) brechen Gruppen und Geräte frei um: ebenfalls Sammel-Linie, sofern groups_lines nicht gesetzt ist
    const cmp = !!this._cmp;
    const sam = (c.groups_lines === 'sammel' || (!c.groups_lines && ((gc > 0 && gc < nGrp) || cmp))) &&(c.consumers.length > 0 || (c.consumer_groups || []).length > 0);
    this._sam = sam;
    if (sam) links.push('bundle');
    const cons = c.consumers.map((x, i) => {
      if (x.entity && !sam) links.push('c' + i);
      return `<div class="cons" data-k="c${i}" data-e="${esc(x.entity || x.secondary)}" style="--c:${rgb(x.color, '167,139,250')}">
        ${x.image ? `<span class="ico logo"><img src="${esc(x.image)}" alt=""></span>` : `<span class="ico"><ha-icon icon="${esc(x.icon || 'mdi:power-plug')}"></ha-icon></span>`}
        <div class="c-txt"><span class="lbl">${esc(x.name || x.entity)}</span><span class="val"><span class="num">—</span><span class="unit"></span></span></div>
        <span class="c-sec"></span></div>`;
    }).join('');
    // Kachel "Nicht erfasst" auch bei einzelnen Verbrauchern ohne Gruppen, aber nur wenn hide_rest: false ausdrücklich gesetzt ist (#34)
    const restC = c.consumers.length > 0 && !(c.consumer_groups || []).length && c.hide_rest === false && c.rest !== false;
    if (restC && !sam) links.push('crest');
    const consRest = restC ? `<div class="cons rest" data-k="crest" style="--c:${PAL.mut}">
        <span class="ico"><ha-icon icon="mdi:help-circle-outline"></ha-icon></span>
        <div class="c-txt"><span class="lbl">${esc((c.rest && c.rest.name) || T('flow.rest'))}</span><span class="val"><span class="num">—</span><span class="unit"></span></span></div></div>` : '';
    const G = c.consumer_groups;
    let grps = '';
    if (G.length) {
      grps = G.map((g, i) => {
        if (!sam) links.push('g' + i);
        return `<div class="grp" data-k="g${i}" style="--c:${rgb(g.color, '167,139,250')}">
          <div class="g-hd">${g.image ? `<span class="ico logo"><img src="${esc(g.image)}" alt=""></span>` : `<span class="ico"><ha-icon icon="${esc(g.icon || 'mdi:door')}"></ha-icon></span>`}<span class="lbl">${esc(g.name)}</span></div>
          <div class="val"><span class="num">—</span><span class="unit"></span></div>
          <div class="its">${(g.items || []).map((x, j) => `<div class="it" data-i="${i}-${j}" data-e="${esc(x.entity || x.secondary)}"><i></i><span class="in">${esc(x.name || x.entity)}</span><b></b></div>`).join('')}</div>
        </div>`;
      }).join('');
      const showRest = c.rest !== false && !c.hide_rest;
      if (showRest) {
        if (!sam) links.push('grest');
        grps += `<div class="grp rest" data-k="grest" style="--c:${PAL.mut}">
          <div class="g-hd"><span class="ico"><ha-icon icon="mdi:help-circle-outline"></ha-icon></span><span class="lbl">${esc((c.rest && c.rest.name) || T('flow.rest'))}</span></div>
          <div class="val"><span class="num">—</span><span class="unit"></span></div>
          <div class="its"><div class="it"><span class="in rest-t"></span></div></div>
        </div>`;
      }
      const nCol = G.length + (showRest ? 1 : 0);
      grps = `<div class="groups${gc ? ' gc-fixed' : ''}" style="grid-template-columns:repeat(${gc ? Math.min(gc, nCol) : nCol},minmax(0,1fr))">${grps}</div>`;
    }
    const d = (k, lbl, color, e) => `<div class="stat${e ? ' fc' : ''}" data-s="${k}"${e ? ` data-e="${esc(e)}" role="button"` : ''} style="--c:${color}"><span><i></i>${lbl}</span><b>—</b></div>`;
    let stats = '';
    if ((c.pv && c.pv.daily) || (c.pv2 && c.pv2.daily)) stats += d('pv', T('stat.pv'), PAL.pv);
    // PV-Prognose für morgen und übermorgen (optional, z. B. Forecast.Solar oder Solcast). Antippen öffnet den Verlauf. Wunsch aus #22
    if (c.pv && c.pv.forecast_tomorrow) stats += d('fc1', T('stat.fc1'), PAL.pv, c.pv.forecast_tomorrow);
    if (c.pv && c.pv.forecast_day_after) stats += d('fc2', T('stat.fc2'), PAL.pv, c.pv.forecast_day_after);
    if (c.grid && c.grid.daily_import) stats += d('imp', T('stat.imp'), PAL.imp);
    if (c.grid && c.grid.daily_export) stats += d('exp', T('stat.exp'), PAL.exp);
    if (c.batteries.some((b) => b.daily_charge || b.daily_discharge)) stats += d('bat', T('stat.bat'), PAL.bat);
    // Hausverbrauch heute: eigener Sensor (home.daily) oder berechnet wie die Autarkie
    if ((c.home && c.home.daily) || (((c.pv && c.pv.daily) || (c.pv2 && c.pv2.daily)) && c.grid && c.grid.daily_import)) stats += d('home', T('stat.home'), PAL.home);
    stats += d('aut', T('stat.aut'), PAL.home);

    this.shadowRoot.innerHTML = `<style>${CSS}</style>
    <ha-card><div class="wrap${this._mode ? ' ' + this._mode : ''}${cmp ? ' cmp' : ''}${this._s3d ? ' s3d' : ''}${sam ? ' sam-on' : ''}${c.text_size === 'gross' ? ' ts-l' : c.text_size === 'sehr_gross' ? ' ts-xl' : ''}${c.animations === 'always' || c.animations === 'immer' ? ' anim-on' : ''}"${this._s3d && WD.D3.roof(c.roof_color) ? ` style="${WD.D3.roof(c.roof_color)}"` : ''}>
      <header>
        <div class="title"><span class="live"></span>${esc(c.title || T('flow.title'))}<span class="clock"></span></div>
        <div class="pill ka"></div>
        <div class="pill wst"></div>
        <div class="pill">${T('pill.aut')}<b data-p="aut">—</b></div>
        <div class="pill">${T('pill.self')}<b data-p="self">—</b></div>
        ${c.nav_path ? `<div class="navbtn" data-nav="${esc(c.nav_path)}">${esc(c.nav_label || T('flow.next'))}</div>` : ''}
      </header>
      <div class="banner"><div class="b-ico"><ha-icon icon="mdi:white-balance-sunny"></ha-icon></div><div class="b-txt"><span class="b-title"></span><span class="b-sub"></span></div><div class="b-chips"></div></div>
      <div class="stage">
        <svg class="links">${links.map((k) => `<g class="link" data-l="${k}"><path class="track"/><path class="glow"/><path class="flow"/></g>`).join('')}</svg>
        <div class="layout${hasPv2 ? ' has-pv2' : ''}${this._via ? ' via-bat' : ''}">
          ${nodes}
          <div class="hub-wrap">
            <div class="hub" data-e="${esc(c.home && c.home.entity)}">
              ${this._s3d ? '<div class="o3d" data-o="home"></div>' : ''}<svg viewBox="0 0 120 120">
                <circle class="orbit" cx="60" cy="60" r="58.5"/>
                <circle class="ring-bg" cx="60" cy="60" r="52"/>
                <circle class="seg" data-g="pv" cx="60" cy="60" r="52" pathLength="100" style="color:rgb(${PAL.pv})"/>
                <circle class="seg" data-g="bat" cx="60" cy="60" r="52" pathLength="100" style="color:rgb(${PAL.bat})"/>
                <circle class="seg" data-g="grid" cx="60" cy="60" r="52" pathLength="100" style="color:rgb(${PAL.imp})"/>
              </svg>
              <div class="core">
                <ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon>
                <div class="val"><span class="num">—</span><span class="unit"></span></div>
                <div class="hub-lbl">${esc((c.home && c.home.name) || T('flow.home'))}</div>
              </div>
            </div>
            <div class="mix">
              <span style="--c:${PAL.pv}"><i></i>${T('mix.pv')}<b data-m="pv">—</b></span>
              ${c.battery ? `<span style="--c:${PAL.bat}"><i></i>${T('mix.bat')}<b data-m="bat">—</b></span>` : ''}
              <span style="--c:${PAL.imp}"><i></i>${T('mix.grid')}<b data-m="grid">—</b></span>
            </div>
          </div>
        </div>
        ${sam ? `<div class="sambox"><div class="sam" data-k="bundle"><span class="sam-t">${T('flow.cons_total')}</span><b class="sam-w">—</b></div>` : ''}${cons ? `<div class="consumers">${cons}${consRest}</div>` : ''}
        ${grps}${sam ? '</div>' : ''}
      </div>
      <footer>${stats}</footer>
    </div></ha-card>${cmp ? '<dialog class="gdlg"></dialog>' : ''}`;

    this._links = links.map((k) => ({ k, g: this._$(`g[data-l="${k}"]`), el: this._$(`[data-k="${k}"]`) }));
    this._3k = {};
    this._dlg = null;
    const dl = this._$('.gdlg');
    if (dl) dl.addEventListener('close', () => { this._dlg = null; });
    // Nur einmal registrieren: _build läuft bei jeder Konfigurationsänderung erneut
    if (!this._clk) {
      this._clk = true;
      this.shadowRoot.addEventListener('click', (e) => {
        const dlg = this._$('.gdlg');
        if (dlg && dlg.open && (e.target === dlg || e.target.closest('.d-x'))) { dlg.close(); return; }
        const nv = e.target.closest('[data-nav]');
        if (nv) { haNavigate(nv.dataset.nav); return; }
        const t = e.target.closest('[data-e]');
        if (t && t.dataset.e) {
          // Eigenes Fenster liegt ganz oben: vor dem Verlauf von Home Assistant schließen
          if (dlg && dlg.open) dlg.close();
          this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: t.dataset.e }, bubbles: true, composed: true }));
          return;
        }
        const g = this._cmp && e.target.closest('.grp[data-k^="g"]:not(.rest)');
        if (g) this._openGroup(+g.dataset.k.slice(1));
      });
    }
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
    // Banner fährt ein oder aus, Zahlen zählen hoch: Maßstab halten, danach einmal neu anpassen (sonst zuckt die Karte bei jedem Frame).
    // Laufen ständig neue Werte ein, höchstens alle 5 Sekunden neu anpassen.
    // Nicht halten, wenn sich Breite oder verfügbare Höhe geändert haben oder die Schrift gerade fertig geladen ist,
    // sonst bleibt ein falscher erster Maßstab stehen (iPad: erst klein links, dann groß).
    const now = Date.now();
    const top0 = Math.max(0, this.getBoundingClientRect().top);
    const avail0 = window.innerHeight - top0 - (this._c.fit_margin === undefined ? 8 : this._c.fit_margin);
    const settled = !this._forceFit && card.clientWidth === this._fitW && avail0 === this._fitA;
    this._forceFit = false;
    if (this._scale && settled && now < (this._bUntil || 0)) {
      if (now - (this._holdSince || now) < 5000) return this._scale;
      this._holdSince = now;
    }
    const prev = this._scale;
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
    }
    // Kleine Abweichungen ignorieren: Jede Breitenänderung bricht Kacheln anders um und löst sonst die nächste Anpassung aus.
    // Vergrößern erst ab 4 %, Verkleinern ab 1,5 % (dann läuft wirklich etwas über).
    if (prev && cw === this._fitW && avail === this._fitA && ((s > prev && s - prev < 0.04) || (s < prev && prev - s < 0.015))) s = prev;
    if (s < 1) {
      wrap.style.width = (cw / s) + 'px';
      wrap.style.transform = 'scale(' + s + ')';
      card.style.height = Math.ceil(wrap.offsetHeight * s) + 'px';
    } else wrap.style.width = '';
    this._fitW = cw;
    this._fitA = avail;
    return (this._scale = s);
  }

  // Maßstab für ms Millisekunden festhalten und danach einmal neu einpassen
  _holdFit(ms) {
    const now = Date.now();
    if (now >= (this._bUntil || 0)) this._holdSince = now;
    this._bUntil = Math.max(this._bUntil || 0, now + ms);
    clearTimeout(this._bFit);
    this._bFit = setTimeout(() => this._schedLayout(), this._bUntil - now + 20);
  }
  _schedLayout() {
    if (this._lr) return;
    this._lr = requestAnimationFrame(() => { this._lr = null; this._layout(); });
  }
  // 3D: Das Bild steht nur neben dem Text, wenn dort genug Platz bleibt, sonst darüber. Gemessen wird in natürlicher Größe und nur bei neuer Breite, sonst springt die Karte
  _tall3d(wrap, w, mode) {
    const key = `${w}|${mode}`;
    if (wrap._d3Key === key) return;
    wrap._d3Key = key;
    const sw = wrap.style.width;
    wrap.style.width = '';
    const nodes = [...wrap.querySelectorAll('.node[data-k]')];
    nodes.forEach((n) => n.classList.remove('d3tall'));
    const ts = parseFloat(getComputedStyle(wrap).getPropertyValue('--ts')) || 1;
    const need = (this._cmp ? 185 : mode === 'wide' ? 320 : mode === 'narrow' ? 280 : 300) + (ts - 1) * 120;
    nodes.map((n) => n.offsetWidth).forEach((nw, i) => nodes[i].classList.toggle('d3tall', nw > 0 && nw < need));
    wrap.style.width = sw;
    this._forceFit = true;
  }
  _layout() {
    // 3D: Die Linien enden am Ring um das Haus, nicht an der ganzen Hub-Fläche mit der Zahl
    const wrap = this._$('.wrap'), st = this._$('.stage'), hub = this._$(this._s3d ? '.hub .o3d' : '.hub');
    if (!st || !hub) return;
    const w = this.getBoundingClientRect().width;
    if (!w) return;
    const mode = w >= 900 ? 'wide' : w < 600 ? 'narrow' : '';
    if (mode !== this._mode) {
      wrap.classList.remove('wide', 'narrow');
      if (mode) wrap.classList.add(mode);
      this._mode = mode;
    }
    // compact: true/immer | auto (nur auf schmalen Bildschirmen, z. B. Handy) | false/aus (Standard)
    const cm = this._c.compact, cmp = cm === true || cm === 'immer' || (cm === 'auto' && mode === 'narrow');
    if (cmp !== !!this._cmp) {
      this._cmp = cmp;
      this._build();
      if (this._hass) this._update();
      return;
    }
    if (this._s3d) this._tall3d(wrap, w, mode);
    const k0 = this._fit();
    const sr = st.getBoundingClientRect();
    const hr = hub.getBoundingClientRect();
    const cx = (hr.left + hr.width / 2 - sr.left) / k0;
    // 3D: Der Ring liegt als Ellipse am Boden, sein Mittelpunkt sitzt am unteren Rand der Zeichnung (Maße aus WD.D3.ring)
    const rs = this._s3d ? hr.width / WD.D3.ring.w / k0 : 0;
    const cy = this._s3d ? (hr.bottom - sr.top) / k0 - WD.D3.ring.bottom * rs : (hr.top + hr.height / 2 - sr.top) / k0;
    const R = this._s3d ? WD.D3.ring.rx * rs : hr.width * 0.465 / k0;
    const Ry = this._s3d ? WD.D3.ring.ry * rs : R;
    // 3D: Die Kacheln neben dem Haus reichen unter den Ring, Linien zu den Verbrauchern müssen unter ihnen durch
    const walls = this._s3d ? [...this.shadowRoot.querySelectorAll('[data-k]')].filter((e) => /^(pv2?|grid|bat\d*)$/.test(e.dataset.k) && e.offsetParent).map((e) => e.getBoundingClientRect()).map((b) => ({ l: (b.left - sr.left) / k0, r: (b.right - sr.left) / k0, b: (b.bottom - sr.top) / k0 })) : [];
    for (const L of this._links) {
      if (L.k === 'pvbat') {
        // Solar -> Speicher: gerade Verbindung zwischen den beiden Kacheln (untereinander oder nebeneinander)
        const a = this._$('[data-k="pv"]'), b = this._$('[data-k="bat"]');
        const set = (d) => L.g.querySelectorAll('path').forEach((p) => p.setAttribute('d', d));
        if (!a || !b || !a.offsetParent || !b.offsetParent) { set(''); continue; }
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const A = { t: (ra.top - sr.top) / k0, b: (ra.bottom - sr.top) / k0, l: (ra.left - sr.left) / k0, r: (ra.right - sr.left) / k0 };
        const B = { t: (rb.top - sr.top) / k0, b: (rb.bottom - sr.top) / k0, l: (rb.left - sr.left) / k0, r: (rb.right - sr.left) / k0 };
        const ox = Math.min(A.r, B.r) - Math.max(A.l, B.l);
        let d;
        if (B.t >= A.b - 2 && ox > 20) { const x = (Math.max(A.l, B.l) + Math.min(A.r, B.r)) / 2; d = `M${x.toFixed(1)},${A.b.toFixed(1)} L${x.toFixed(1)},${B.t.toFixed(1)}`; }
        else if (B.l >= A.r - 2) { const y = Math.max(B.t + 12, Math.min(B.b - 12, (A.t + A.b) / 2)); d = `M${A.r.toFixed(1)},${y.toFixed(1)} L${B.l.toFixed(1)},${y.toFixed(1)}`; }
        else { set(''); continue; }
        set(d);
        continue;
      }
      if (L.k.startsWith('r:')) {
        const [, from, to] = L.k.split(':');
        const ea = this._$(`[data-k="${from}"]`), eb = this._$(`[data-k="${to}"]`);
        const set = (d) => L.g.querySelectorAll('path').forEach((p) => p.setAttribute('d', d));
        if (!ea || !eb || !ea.offsetParent || !eb.offsetParent) { set(''); continue; }
        const box = (e) => { const b = e.getBoundingClientRect(); return { t: (b.top - sr.top) / k0, b: (b.bottom - sr.top) / k0, l: (b.left - sr.left) / k0, r: (b.right - sr.left) / k0 }; };
        const A = box(ea), B = box(eb), f = (n) => n.toFixed(1);
        const ox = Math.min(A.r, B.r) - Math.max(A.l, B.l), oy = Math.min(A.b, B.b) - Math.max(A.t, B.t);
        // Zwei Linien zum selben Speicher enden versetzt
        const shift = from === 'pv' ? -9 : from === 'grid' ? 9 : 0;
        if (ox > 20 && B.t >= A.b - 2) { const x = (Math.max(A.l, B.l) + Math.min(A.r, B.r)) / 2 + shift; set(`M${f(x)},${f(A.b)} L${f(x)},${f(B.t)}`); continue; }
        if (ox > 20 && A.t >= B.b - 2) { const x = (Math.max(A.l, B.l) + Math.min(A.r, B.r)) / 2 + shift; set(`M${f(x)},${f(A.t)} L${f(x)},${f(B.b)}`); continue; }
        const dir = A.l < B.l ? 1 : -1, ax = dir > 0 ? A.r : A.l, ex = dir > 0 ? B.l : B.r;
        if (oy > 20 && Math.abs(ex - ax) < 90) { const y = (Math.max(A.t, B.t) + Math.min(A.b, B.b)) / 2 + shift; set(`M${f(ax)},${f(y)} L${f(ex)},${f(y)}`); continue; }
        // Quer über die Karte: außen um den Ring herum, als Bogen unter dem Haus
        const clamp = (v, a, b) => Math.max(a + 14, Math.min(b - 14, v));
        const ay = clamp(cy, A.t, A.b), ey = clamp(cy, B.t, B.b) + shift;
        const rx = Math.min(R + 14, Math.abs(cx - ax) - 8, Math.abs(ex - cx) - 8), ry = Ry + 14;
        const lx = cx - dir * rx, hx = cx + dir * rx;
        set(`M${f(ax)},${f(ay)} C${f(ax + dir * 30)},${f(ay)} ${f(lx)},${f(cy - 30)} ${f(lx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 ${dir > 0 ? 0 : 1} ${f(hx)},${f(cy)} C${f(hx)},${f(cy - 30)} ${f(ex - dir * 30)},${f(ey)} ${f(ex)},${f(ey)}`);
        continue;
      }
      if (!L.el) continue;
      if (!L.el.offsetParent) { L.g.querySelectorAll('path').forEach((p) => p.setAttribute('d', '')); continue; }
      const r = L.el.getBoundingClientRect();
      const top = (r.top - sr.top) / k0, bottom = (r.bottom - sr.top) / k0, left = (r.left - sr.left) / k0, right = (r.right - sr.left) / k0;
      const ncx = (left + right) / 2, ncy = (top + bottom) / 2;
      let ax, ay, tx, ty;
      // Erzeuger, Netz und Batterie stehen neben dem Ring: Linie immer seitlich anschließen (nie hinter anderen Kacheln)
      const sideOnly = (this._mode !== 'narrow' || this._cmp) && (['pv', 'pv2', 'grid'].includes(L.k) || /^bat\d*$/.test(L.k));
      if (!sideOnly && top > cy + R * 0.7) { ax = ncx; ay = top; tx = 0; ty = -1; }
      else if (!sideOnly && bottom < cy - R * 0.7) { ax = ncx; ay = bottom; tx = 0; ty = 1; }
      else if (ncx < cx) { ax = right; ay = ncy; tx = 1; ty = 0; }
      else { ax = left; ay = ncy; tx = -1; ty = 0; }
      let ang = Math.atan2(ay - cy, ax - cx);
      // Verbraucher unterhalb: Linie immer aus der Unterseite des Rings führen
      if (ty === -1) ang = Math.max(Math.PI / 2 - 0.6, Math.min(Math.PI / 2 + 0.6, ang));
      const bx = cx + Math.cos(ang) * R, by = cy + Math.sin(ang) * Ry;
      if (ty === -1 && walls.length && (this._mode !== 'narrow' || this._cmp)) {
        const lo = Math.min(ax, bx), hi = Math.max(ax, bx), dir = bx > ax ? 1 : -1;
        const near = walls.filter((w) => w.l < hi && w.r > lo && w.b <= ay), wall = Math.max(-Infinity, ...near.map((w) => w.b));
        if (wall > by) {
          // Waagerecht unter der Kachel bis hinter ihre Kante, dann hoch zum Ring. Weiter entfernte Verbraucher laufen etwas höher, so überlagern sich die Linien weniger
          const rail = wall + (ay - wall) * (0.62 - 0.3 * Math.min(1, (hi - lo) / cx));
          const qx = (dir > 0 ? Math.max(...near.map((w) => w.r)) : Math.min(...near.map((w) => w.l))) + dir * 8;
          const mx = ax + dir * Math.min(60, Math.abs(qx - ax)), f = (n) => n.toFixed(1);
          const d = `M${f(ax)},${f(ay)} C${f(ax)},${f(rail)} ${f(mx - dir * 10)},${f(rail)} ${f(mx)},${f(rail)} L${f(qx)},${f(rail)} C${f(qx + (bx - qx) * 0.5)},${f(rail)} ${f(bx)},${f(by + (rail - by) * 0.6)} ${f(bx)},${f(by)}`;
          L.g.querySelectorAll('path').forEach((p) => p.setAttribute('d', d));
          continue;
        }
      }
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
    // Nur große Sprünge zählen hoch. Jedes Hochzählen schreibt in jedem Bild Text und zwingt das Gerät, neu zu messen und zu zeichnen
    const calm = !['always', 'immer'].includes(this._c.animations) && window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (calm || Math.abs(target - t.cur) < Math.max(50, Math.abs(t.cur) * 0.15)) {
      Object.assign(t, { cur: target, from: undefined, target, numEl, unitEl });
      const [n, u] = this._sw(target);
      if (numEl.textContent !== n) numEl.textContent = n;
      if (unitEl.textContent !== u) unitEl.textContent = u;
      return;
    }
    Object.assign(t, { from: t.cur, target, t0: performance.now(), numEl, unitEl });
    this._holdFit(950);
    if (!this._raf) this._raf = requestAnimationFrame((n) => this._tick(n));
  }
  _tick(now) {
    let running = false;
    for (const t of Object.values(this._tw)) {
      if (t.target === null || t.from === undefined || t.done) continue;
      const p = Math.min(1, (now - t.t0) / 900);
      const e = 1 - Math.pow(1 - p, 3);
      t.cur = t.from + (t.target - t.from) * e;
      const [n, u] = this._sw(t.cur);
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
  _batForecast(bat, soc, b, idx) {
    const c = this._c, h = this._hass, cap = parseFloat((b || c.battery).capacity_kwh);
    const now = Date.now();
    const S = ((this._emaS = this._emaS || [])[idx || 0] = (this._emaS[idx || 0] || {}));
    if (bat !== null) {
      const dt = S.t ? (now - S.t) / 1000 : 0;
      const a = dt > 0 ? 1 - Math.exp(-dt / 300) : 1;
      S.v = S.v === undefined ? bat : S.v + a * (bat - S.v);
      S.t = now;
    }
    if (!cap || soc === null) return '';
    const { reserve, maxSoc } = this._limits(b);
    // Richtungswechsel oder Glättung noch nicht eingeschwungen -> aktuellen Wert nehmen
    const e = S.v || 0;
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

  // Entladegrenze und Maximalladung der Batterie in Prozent: Sensor, Helfer oder fester Wert
  _bk(i) { return i ? 'bat' + (i + 1) : 'bat'; }
  // 3D: Linien nach den echten Wegen. Das Haus bekommt nur, was dort ankommt; Solar lädt direkt den Speicher und speist direkt ein.
  _routes3d(v) {
    const via = this._via && v.bats[0] && v.bats[0].out !== null;
    let solar = via ? 0 : v.p1Bat + v.pv2Bat, gridLeft = v.gImp;
    const pvGrid = via ? 0 : v.p1Exp, pv2Grid = via ? 0 : v.p2Exp;
    let expLeft = Math.max(0, v.gExp - pvGrid - pv2Grid);
    this._link('pv', v.p1Home > TH, true, PAL.pv, v.p1Home);
    this._link('pv2', v.p2Home > TH, true, PAL.pv, v.p2Home);
    this._link('r:pv:grid', pvGrid > TH, true, PAL.pv, pvGrid);
    this._link('r:pv2:grid', pv2Grid > TH, true, PAL.pv, pv2Grid);
    v.bats.filter((x) => !x.lead && x.b.behind_meter !== true).forEach((x) => {
      const k = this._bk(x.i);
      if (via && x.i === 0) {
        const d = Math.min(x.out, expLeft);
        expLeft -= d;
        this._link(`r:${k}:grid`, d > TH, true, PAL.pv, d);
        this._link(k, x.out - d > TH, true, x.p !== null && x.p < -TH ? PAL.bat : PAL.pv, x.out - d);
        return;
      }
      const chg = Math.max(0, x.p || 0), dis = Math.max(0, -(x.p || 0));
      const fromPv = Math.min(chg, solar), fromGrid = Math.min(chg - fromPv, gridLeft), toGrid = Math.min(dis, expLeft);
      solar -= fromPv; gridLeft -= fromGrid; expLeft -= toGrid;
      this._link(`r:pv:${k}`, fromPv > TH, true, PAL.pv, fromPv);
      this._link(`r:grid:${k}`, fromGrid > TH, true, PAL.imp, fromGrid);
      this._link(`r:${k}:grid`, toGrid > TH, true, PAL.bat, toGrid);
      this._link(k, dis - toGrid > TH, true, PAL.bat, dis - toGrid);
    });
    // Rest der Einspeisung, den kein Gerät erklärt (zum Beispiel zeitversetzte Sensoren), bleibt an der Hauslinie
    if (gridLeft > TH) this._link('grid', true, true, PAL.imp, gridLeft);
    else if (expLeft > TH) this._link('grid', true, false, PAL.exp, expLeft);
    else this._link('grid', false, true, PAL.imp, 0);
  }
  // 3D-Objekte: nur neu zeichnen, wenn sich die gerundeten Werte ändern
  _draw3d(v) {
    const D3 = WD.D3, c = this._c, large = !this._cmp, q = (w) => (w === null || w === undefined ? 'x' : Math.round(w / (Math.abs(w) < 200 ? 5 : 25)));
    const put = (k, key, fn) => {
      const el = this._$(`[data-o="${k}"]`);
      if (!el || this._3k[k] === key) return;
      this._3k[k] = key;
      D3.draw(el, fn());
    };
    const solar = (k, cfg, w) => {
      const list = (cfg.strings || []).map((s) => watt(this._hass, s.entity) || 0);
      const strs = list.length ? list : [w / 3, w / 3, w / 3];
      // Ohne peak_w gilt die höchste bisher gesehene Leistung als Maßstab für die Helligkeit
      this._pvMax = Math.max(this._pvMax || 1000, w);
      const peak = (parseFloat(cfg.peak_w) || this._pvMax) / strs.length;
      put(k, [strs.map(q).join(), Math.round(peak), large].join(), () => D3.solar(strs, k, large && !!list.length, peak, cfg.name || T('flow.pv')));
    };
    if (c.pv) solar('pv', c.pv, Math.max(0, v.pv1 || 0));
    if (c.pv2 && c.pv2.entity) solar('pv2', c.pv2, Math.max(0, v.pv2 || 0));
    if (c.grid) { const g = v.grid || 0; put('grid', [q(g), large].join(), () => D3.meter(g, 'grid', large, this._fW(g), c.grid.name || T('flow.grid'))); }
    v.bats.filter((x) => !x.lead).forEach((x) => {
      const k = this._bk(x.i), p = x.p || 0, grp = [x].concat(x.shared || []);
      const socs = grp.map((o) => (o.soc === null ? null : Math.round(o.soc)));
      const name = grp.map((o, i) => o.b.name || T('flow.battery') + ' ' + (o.i + 1)).join(' · ');
      put(k, [socs.join(), q(p), large].join(), () => D3.stack(socs, p, k, large, name));
      if (grp.length > 1) {
        const el = this._$(`[data-k="${k}"]`);
        el.querySelector('.lbl').textContent = name;
        el.querySelector('.soc-txt').textContent = socs.map((s) => (s === null ? '—' : s + ' %')).join(' / ');
        // Turm: Die zweite Kachel ist ausgeblendet, also stehen beide Temperaturen in der ersten. Ein Tipp öffnet den ersten Sensor.
        const withTemp = grp.filter((o) => o.b.temp);
        if (withTemp.length) {
          if (!el.querySelector('.temp-txt')) el.querySelector('.socbox').insertAdjacentHTML('afterend', `<div class="socbox" data-e="${esc(withTemp[0].b.temp)}"><div class="soc-row"><span>${T('flow.temp')}</span><b class="temp-txt">—</b></div></div>`);
          el.querySelector('.temp-txt').textContent = grp.map((o) => this._temp(o.b.temp)).join(' / ');
        }
      }
    });
    const form = c.house_style === 'flach' ? 'modern' : 'sattel', s = v.src;
    put('home', [q(v.home), q(s.pv), q(s.bat), q(s.imp), form, large].join(), () => D3.house(v.home, s, 'home', form, large, (c.home && c.home.name) || T('flow.home')));
  }
  _temp(id) {
    const ts = id && this._hass.states[id], tv = ts ? parseFloat(ts.state) : NaN;
    return isNaN(tv) ? '—' : `${nf(tv, 1)} ${ts.attributes.unit_of_measurement || '°C'}`;
  }
  _limits(bb) {
    const h = this._hass, b = bb || (this._c && this._c.battery) || {};
    const lim = (sensor, fixed, def) => {
      const v = val(h, sensor, null);
      if (v !== null && !isNaN(v)) return Math.max(0, Math.min(100, v));
      return typeof fixed === 'number' ? Math.max(0, Math.min(100, fixed)) : def;
    };
    const reserve = lim(b.reserve_soc, b.reserve_pct, 0);
    const maxSoc = Math.max(reserve + 1, lim(b.max_soc, b.max_pct, 100));
    return { reserve, maxSoc };
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
    if (!!mode !== el.classList.contains('show')) {
      // Ein- und Ausblenden dauert 0,6 s: so lange nicht neu skalieren, danach einmal
      this._holdFit(700);
    }
    this._modeB = mode;
    el.classList.toggle('show', !!mode);
    el.classList.toggle('sur', mode === 'sur');
    el.classList.toggle('imp', mode === 'imp');
    if (!mode) return;
    const icon = el.querySelector('ha-icon');
    let title, sub, chips = '';
    if (mode === 'sur') {
      icon.setAttribute('icon', 'mdi:white-balance-sunny');
      title = '☀ ' + T('ban.surplus', { w: this._fW(x.gExp) });
      const gain = price === null ? null : x.gExp / 1000 * Math.max(0, price - feed);
      sub = (x.soc !== null && x.soc >= 95 ? T('ban.batfull') : '') + (gain === null ? T('ban.tonet0') : T('ban.tonet', { gain: nf(gain, 2), cur: cur() }));
      chips = (sc.suggestions || []).map((s) => {
        const st = s.entity && h.states[s.entity];
        const running = st && (st.state === 'on' || (parseFloat(st.state) || 0) > 10);
        if (!running && s.power && s.power > x.gExp) return '';
        return `<span class="chip${running ? ' run' : ''}"><ha-icon icon="${esc(s.icon || 'mdi:power-plug')}"></ha-icon>${running ? '✓ ' + (s.running ? esc(s.running) : T('ban.running', { name: esc(s.name) })) : esc(s.name)}</span>`;
      }).join('');
    } else {
      icon.setAttribute('icon', 'mdi:transmission-tower-import');
      title = '⚡ ' + T('ban.fromgrid', { w: this._fW(x.gImp) });
      const cost = price === null ? null : x.gImp / 1000 * price;
      let why = x.soc !== null && x.soc <= this._limits().reserve + 2 ? T('ban.batempty') : (x.bat !== null && -x.bat > 3000 ? T('ban.batlimit') : '');
      let big = null;
      (c.consumers || []).concat(...(c.consumer_groups || []).map((g) => g.items || [])).forEach((s) => { const w = s.entity ? this._cw(s) : null; if (w && w > 500 && (!big || w > big.w)) big = { n: s.name, w }; });
      if (big) why = (why ? why + ' · ' : '') + `${esc(big.n)}: ${this._fW(big.w)}`;
      sub = (cost === null ? '' : T('ban.cost', { cost: nf(cost, 2), cur: cur() }) + (why ? ' · ' : '')) + why;
    }
    this._set('.b-title', title);
    this._set('.b-sub', sub, true);
    this._set('.b-chips', chips, true);
  }

  // consumer_groups_sort: leistung. Aktive Geräte (über on_w) nach Leistung absteigend, darunter die übrigen in eingetragener Reihenfolge.
  // Gegen Springen: höchstens alle 10 s neu ordnen, und ein Gerät überholt seinen Vordermann nur mit deutlich mehr Leistung (10 % und 20 W)
  _sortGroup(i, g) {
    const items = g.items || [], now = Date.now();
    let ord = this._gOrd[i];
    if (ord && ord.length === items.length && now - (ord.t || 0) < 10000) return;
    const p = items.map((x) => { const w = x.entity ? this._cw(x) : null; return w !== null && w > onW(x) ? w : -1; });
    ord = ord && ord.length === items.length ? ord.slice() : items.map((x, j) => j);
    const ahead = (a, b) => (p[b] < 0 ? p[a] >= 0 || false : p[a] >= 0 && p[a] > p[b] * 1.1 && p[a] - p[b] > 20);
    for (let pass = 0; pass < items.length; pass++) {
      let moved = false;
      for (let k = 0; k + 1 < ord.length; k++) {
        const a = ord[k], b = ord[k + 1];
        // Inaktive untereinander: zurück in die eingetragene Reihenfolge
        if (ahead(b, a) || (p[a] < 0 && p[b] < 0 && b < a)) { ord[k] = b; ord[k + 1] = a; moved = true; }
      }
      if (!moved) break;
    }
    ord.t = now;
    this._gOrd[i] = ord;
    ord.forEach((j, n) => { const it = this._$(`[data-i="${i}-${j}"]`); if (it && it.style.order !== String(n)) it.style.order = String(n); });
  }

  // Kurzansicht: Fenster mit allen Geräten einer Gruppe, Werte laufen live mit
  _openGroup(i) {
    const g = (this._c.consumer_groups || [])[i], dl = this._$('.gdlg'), h = this._hass;
    if (!g || !dl || !h) return;
    const rows = (g.items || []).map((x, j) => {
      const st = x.entity ? h.states[x.entity] : null;
      if (x.entity && (!st || st.state === 'unavailable')) return '';
      const o = this._gSort && this._gOrd[i] ? this._gOrd[i].indexOf(j) : -1;
      return `<div class="d-it" data-j="${j}" data-e="${esc(x.entity || x.secondary)}"${o >= 0 ? ` style="order:${o}"` : ''}><i></i><span class="in">${esc(x.name || x.entity)}</span><b></b></div>`;
    }).join('');
    const ico = g.image ? `<span class="ico logo"><img src="${esc(g.image)}" alt=""></span>` : `<span class="ico"><ha-icon icon="${esc(g.icon || 'mdi:door')}"></ha-icon></span>`;
    dl.style.setProperty('--c', rgb(g.color, '167,139,250'));
    dl.innerHTML = `<div class="d-hd">${ico}<span class="d-name">${esc(g.name)}</span><b class="d-sum"></b><button class="d-x" aria-label="${T('close')}">×</button></div><div class="d-its">${rows}</div>`;
    this._dlg = i;
    this._dlgUpd();
    if (dl.showModal) dl.showModal(); else dl.setAttribute('open', '');
  }
  _dlgUpd() {
    const g = (this._c.consumer_groups || [])[this._dlg], dl = this._$('.gdlg'), h = this._hass;
    if (!g || !dl || !h) return;
    let sum = 0, any = false;
    (g.items || []).forEach((x, j) => {
      const p = x.entity ? this._cw(x) : null;
      if (p !== null) { sum += p; any = true; }
      const it = dl.querySelector(`[data-j="${j}"]`);
      if (!it) return;
      let txt = p === null ? '' : this._fW(p);
      const sec = x.secondary && h.states[x.secondary];
      if (!txt && sec && !['unavailable', 'unknown'].includes(sec.state)) {
        txt = `${nf(parseFloat(sec.state) || 0, x.secondary_decimals === undefined ? 1 : x.secondary_decimals)} ${sec.attributes.unit_of_measurement || ''}`.trim();
      }
      it.classList.toggle('on', (p || 0) > onW(x));
      const b = it.querySelector('b');
      if (b.textContent !== txt) b.textContent = txt;
    });
    const s = dl.querySelector('.d-sum');
    if (s) s.textContent = any ? this._fW(sum) : '';
  }

  // Leistung eines Verbrauchers. Mit minus (Differenz, z. B. Zählerkaskade): entity - minus (+ plus), nie negativ. Ohne minus unverändert.
  _cw(x) {
    if (!x || !x.entity) return null;
    const h = this._hass, L = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    const p = watt(h, x.entity), mi = L(x.minus);
    if (!mi.length || p === null) return p;
    // mehrere Unterzähler möglich: Hauptzähler minus Summe der Unterzähler (plus Summe der Zusatzwerte)
    let s = 0;
    for (let i = 0; i < mi.length; i++) { const m = watt(h, mi[i]); if (m === null) return null; s += m; }
    return Math.max(0, p - s + L(x.plus).reduce((a, id) => a + (watt(h, id) || 0), 0));
  }

  // Leistung formatieren; watt_only: true zeigt immer Watt statt ab 1000 W kW
  _sw(w) { return splitW(w, !!(this._c && this._c.watt_only), this._dec.p); }
  _fW(w) { return fW(w, !!(this._c && this._c.watt_only), this._dec.p); }
  _fk(v) { return fKwh(v, this._dec.e); }
  _fp(v) { return fPct(v, this._dec.q); }

  _set(sel, txt, isHtml, root) {
    const el = root ? root.querySelector(sel) : this._$(sel);
    if (!el) return;
    if (isHtml) { if (el.innerHTML !== txt) el.innerHTML = txt; }
    else if (el.textContent !== txt) el.textContent = txt;
  }

  _update() {
    const h = this._hass, c = this._c;
    if (!h || !c || !this._$('.stage')) return;
    const pv1 = c.pv ? watt(h, c.pv.entity) : null;
    const pv2 = c.pv2 && c.pv2.entity ? watt(h, c.pv2.entity) : null;
    // Summe aller Erzeuger. Mit pv2 gilt: PV 2 (z. B. Balkonkraftwerk) speist zuerst ins Haus.
    const pv = pv1 === null && pv2 === null ? null : (pv1 || 0) + (pv2 || 0);
    let grid = c.grid ? watt(h, c.grid.entity) : null;
    if (grid !== null && c.grid.invert) grid = -grid;
    // Je Speicher Leistung (Laden positiv) und Ladestand; Summe bzw. nach Kapazität gewichteter Mittelwert für Ring und Banner
    const bats = c.batteries.map((b, i) => {
      let p = b.power ? watt(h, b.power) : null;
      // Getrennte Sensoren für Laden und Entladen (z. B. SunEnergyXT): Laden positiv, Entladen negativ
      if (!b.power && (b.power_charge || b.power_discharge)) {
        const pc = b.power_charge ? watt(h, b.power_charge) : null, pd = b.power_discharge ? watt(h, b.power_discharge) : null;
        p = pc === null && pd === null ? null : (pc || 0) - (pd || 0);
      }
      if (p !== null && b.invert) p = -p;
      // pv_to_battery: direkt: Ausgang des vorgeschalteten Speichers; ohne eigenen Leistungssensor ergibt sich Laden = PV-Eingang - Ausgang
      let out = null;
      if (this._via && i === 0) {
        out = watt(h, b.power_out);
        if (out !== null) out = Math.max(0, out);
        if (p === null && out !== null) p = Math.max(0, pv1 || 0) - out;
      }
      return { b, i, p, out, soc: num(h, b.soc), cap: parseFloat(b.capacity_kwh) || 0 };
    });
    // Gemeinsamer Leistungssensor (übereinander gestapelte Akkus): zählt nur einmal, beim ersten Speicher mit diesem Sensor
    const sensorSeen = {};
    bats.forEach((x) => {
      const id = x.b.power || (x.b.power_charge || x.b.power_discharge ? `${x.b.power_charge}|${x.b.power_discharge}` : '');
      if (!id) return;
      if (sensorSeen[id]) { x.lead = sensorSeen[id]; x.p = null; (x.lead.shared = x.lead.shared || []).push(x); } else sensorSeen[id] = x;
    });
    // behind_meter: Speicher hinter dem Zähler steht nicht in der Bilanz (eigene Kachel bleibt). Seine Ladung zählt wie ein Gerät im Haus, seine Abgabe als Quelle
    const inBal = bats.filter((x) => x.b.behind_meter !== true);
    const bmChg = bats.reduce((a, x) => (x.b.behind_meter === true ? a + Math.max(0, x.p || 0) : a), 0);
    const bat = inBal.some((x) => x.p !== null) ? inBal.reduce((a, x) => a + (x.p || 0), 0) : null;
    const withSoc = bats.filter((x) => x.soc !== null);
    const wSum = withSoc.reduce((a, x) => a + (x.cap || 1), 0);
    const soc = withSoc.length ? withSoc.reduce((a, x) => a + x.soc * (x.cap || 1), 0) / wSum : null;
    let home = c.home && c.home.entity ? watt(h, c.home.entity) : null;
    // Negativer Verbrauch ist nicht möglich, dann gilt die eigene Berechnung
    if (home !== null && home < 0) home = null;
    // Mit eigenem Sensor gilt dessen Wert, die Abgabe käme sonst im Ring dazu, nicht aber in der Zahl
    const bmDis = home === null ? bats.reduce((a, x) => (x.b.behind_meter === true ? a + Math.max(0, -(x.p || 0)) : a), 0) : 0;
    if (home === null) home = Math.max(0, (pv || 0) + (grid || 0) - (bat || 0) + bmDis);
    else if (c.pv2 && c.pv2.add_to_home) home += Math.max(0, pv2 || 0);

    // grid2: Bezug des zweiten Zählers. Er steckt nicht im Hauptzähler: Hausverbrauch und Netzanteil im Ring werden um ihn größer
    const g2w = c.grid2 ? Math.max(0, watt(h, c.grid2.entity) || 0) : 0;
    home += g2w;
    const gImpM = Math.max(0, grid || 0), gImp = gImpM + g2w, gExp = Math.max(0, -(grid || 0));
    // Herkunft und Aufteilung je Speicher: lädt der eine, während der andere entlädt, zählt beides
    const bDis = inBal.reduce((acc, x) => acc + Math.max(0, -(x.p || 0)), bmDis), bChg = inBal.reduce((acc, x) => acc + Math.max(0, x.p || 0), 0);
    const pvHome = Math.min(Math.max(0, pv || 0), Math.max(0, home - gImp - bDis));
    const tot = pvHome + gImp + bDis;

    this._set('[data-p="aut"]', home > TH ? this._fp(1 - gImp / home) : '—');
    this._set('[data-p="self"]', (pv || 0) > TH ? this._fp(1 - gExp / pv) : '—');

    // Aufteilung je Quelle: PV 2 (Balkonkraftwerk) deckt zuerst das Haus, PV 1 lädt danach die Batterie und speist ein
    const need = Math.max(0, home - gImp - bDis);
    const p2 = Math.max(0, pv2 || 0), p1 = Math.max(0, pv1 || 0);
    const p2Home = Math.min(p2, need);
    const p1Home = Math.min(p1, Math.max(0, need - p2Home));
    const p1Bat = Math.min(bChg, Math.max(0, p1 - p1Home));
    const p1Exp = Math.min(gExp, Math.max(0, p1 - p1Home - p1Bat));
    const p2Exp = Math.min(Math.max(0, gExp - p1Exp), Math.max(0, p2 - p2Home));
    const p2Bat = Math.min(Math.max(0, p2 - p2Home - p2Exp), Math.max(0, bChg - p1Bat));
    // Rest ohne Ziel: Hausverbrauch-Sensor, Netz und PV passen kurz nicht zusammen (zeitversetzte Werte). Er bleibt beim Haus, wie der Netz-Rest in 3D (#23)
    const viaOn = this._via && bats[0] && bats[0].out !== null;
    const p1Rest = viaOn ? 0 : Math.max(0, p1 - p1Home - p1Bat - p1Exp), p2Rest = Math.max(0, p2 - p2Home - p2Exp - p2Bat);
    const useText = (home_, bat_, exp_) => {
      const use = [];
      if (home_ > TH) use.push(`${T('pv.use.home')} <b>${this._fW(home_)}</b>`);
      if (bat_ > TH) use.push(`${T('pv.use.bat')} <b>${this._fW(bat_)}</b>`);
      if (exp_ > TH) use.push(`${T('pv.use.grid')} <b>${this._fW(exp_)}</b>`);
      return use.length ? '→ ' + use.join(' · ') : '';
    };
    if (c.pv2 && c.pv2.entity) {
      const el = this._$('[data-k="pv2"]'), on = p2 > TH;
      el.classList.toggle('on', on);
      this._anim('pv2', pv2, el);
      this._set('.pv2 .tag', pv2 === null ? T('tag.offline') : on ? T('tag.producing') : T('tag.idle'));
      const parts2 = [];
      const u2 = on ? useText(p2Home + p2Rest, 0, p2Exp) : '';
      if (u2) parts2.push(u2);
      (c.pv2.strings || []).forEach((s) => parts2.push(`${esc(s.name || s.entity)} <b>${this._fW(watt(h, s.entity))}</b>`));
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
        // pv_to_battery: direkt: Der ganze Solarstrom geht in den Speicher, die Aufteilung steht beim Ausgang des Speichers
        const u1 = this._via && bats[0].out !== null ? `→ ${T('pv.use.store')} <b>${this._fW(p1)}</b>` : useText(p1Home + p1Rest, p1Bat, p1Exp);
        if (u1) parts.push(u1);
      }
      (c.pv.strings || []).forEach((s) => parts.push(`${esc(s.name || s.entity)} <b>${this._fW(watt(h, s.entity))}</b>`));
      // Prognose: Leistung (W, kW) oder Tagesprognose in kWh (z. B. Solcast "heute")
      const fst = c.pv.forecast ? h.states[c.pv.forecast] : null;
      const fUnit = fst ? String(fst.attributes.unit_of_measurement || '') : '';
      if (/^(k|m)?wh$/i.test(fUnit)) {
        const e = num(h, c.pv.forecast);
        const kwh = e === null ? null : /^mwh$/i.test(fUnit) ? e * 1000 : /^kwh$/i.test(fUnit) ? e : e / 1000;
        if (kwh !== null) parts.push(`${T('forecast.day')} <b>${this._fk(kwh)} kWh</b>`);
      } else {
        const fc = c.pv.forecast ? watt(h, c.pv.forecast) : null;
        if (fc !== null) parts.push(`${T('forecast')} <b>${this._fW(fc)}</b>`);
      }
      this._set('.pv .sub', parts.join('<br>'), true);
      this._link('pv', on, true, PAL.pv, pv1);
    }
    if (c.grid) {
      const el = this._$('[data-k="grid"]'), on = Math.abs(grid || 0) > TH, imp = (grid || 0) > 0;
      const col = imp ? PAL.imp : PAL.exp;
      el.style.setProperty('--c', on ? col : PAL.mut);
      el.classList.toggle('on', on);
      this._anim('grid', grid === null ? null : Math.abs(grid), el);
      this._set('.grid .tag', grid === null ? T('tag.offline') : Math.abs(grid) < 0.5 ? T('tag.balanced') : imp ? T('tag.import') : T('tag.export'));
      this._link('grid', on, imp, col, grid);
    }
    bats.forEach((x) => {
      const key = this._bk(x.i), el = this._$(`[data-k="${key}"]`);
      if (!el) return;
      // 3D: Akkus an einem gemeinsamen Sensor stehen als Turm in der Kachel des ersten
      if (this._s3d && x.lead) {
        if (el.style.display !== 'none') { el.style.display = 'none'; this._schedLayout(); }
        this._link(key, false, false, PAL.bat, 0);
        return;
      }
      const lead = x.lead || x, grp = [lead].concat(lead.shared || []);
      const bp = lead.p, bs = x.soc, chg = (bp || 0) > 0;
      // Vorgeschalteter Speicher (pv_to_battery: direkt): Strom läuft durch ihn, auch wenn er weder lädt noch entlädt (Durchleitung)
      const via = this._via && x.i === 0 && x.out !== null;
      const pin = via ? Math.max(0, pv1 || 0) : 0, out = via ? x.out : 0;
      const net = Math.abs(bp || 0) > TH;
      const through = via && !net && Math.max(pin, out) > TH;
      const on = net || through;
      const col = through ? PAL.pv : on && chg ? PAL.chg : PAL.bat;
      el.classList.toggle('on', on);
      el.classList.toggle('charging', net && chg);
      el.style.setProperty('--c', col);
      this._anim(key, bp === null || x.lead ? null : Math.abs(bp), el);
      this._set('.tag', bp === null ? T('tag.offline') : through ? T('tag.passthrough') : !net ? T('tag.standby') : chg ? T('tag.charging') : T('tag.discharging'), false, el);
      const fill = el.querySelector('.soc-fill');
      const lm = this._limits(x.b);
      const usable = x.b.soc_display === 'nutzbar' && lm.maxSoc > lm.reserve;
      // nutzbar: 0 % = Entladegrenze, 100 % = Maximalladung
      const shown = bs === null ? null : usable ? Math.max(0, Math.min(100, (bs - lm.reserve) / (lm.maxSoc - lm.reserve) * 100)) : Math.max(0, Math.min(100, bs));
      fill.style.width = (shown === null ? 0 : shown) + '%';
      fill.style.setProperty('--sc', shown !== null && shown < 20 ? PAL.imp : shown !== null && shown < 40 ? PAL.pv : col);
      this._set('.soc-txt', shown === null ? '—' : Math.round(shown) + ' %' + (usable ? ' ' + T('bat.usable_pct') : ''), false, el);
      if (x.b.temp) this._set('.temp-txt', this._temp(x.b.temp), false, el);
      const lo = el.querySelector('.soc-low'), hi = el.querySelector('.soc-high');
      if (lo) { lo.style.width = (usable ? 0 : lm.reserve) + '%'; lo.style.display = !usable && lm.reserve > 0 ? '' : 'none'; }
      if (hi) { hi.style.width = (usable ? 0 : 100 - lm.maxSoc) + '%'; hi.style.display = !usable && lm.maxSoc < 100 ? '' : 'none'; }
      // Prognose bei gemeinsamem Sensor: Leistung nach Kapazität aufgeteilt
      const capSum = grp.reduce((a, o) => a + o.cap, 0);
      const share = grp.length < 2 ? 1 : capSum > 0 && x.cap > 0 ? x.cap / capSum : 1 / grp.length;
      const tower = this._s3d && grp.length > 1;
      const towerSoc = tower && grp.every((o) => o.soc !== null) ? grp.reduce((a, o) => a + o.soc * (o.cap || 1), 0) / grp.reduce((a, o) => a + (o.cap || 1), 0) : bs;
      const fc = tower ? this._batForecast(bp, towerSoc, Object.assign({}, x.b, { capacity_kwh: capSum }), x.i) : this._batForecast(bp === null ? null : bp * share, bs, x.b, x.i);
      // Ausgang = Haus + Einspeisung; ohne Einspeisung geht alles ins Haus, dann genügt der Ausgang allein
      const outExp = via ? Math.min(out, gExp) : 0;
      const split = outExp > TH && out - outExp > TH ? T('bat.split', { home: this._fW(out - outExp), grid: this._fW(outExp) }) : '';
      const subT = via ? T('bat.io', { in: this._fW(pin), out: this._fW(out) }) + split + (fc ? '<br>' + fc : '') : fc;
      const mates = tower ? '' : grp.filter((o) => o !== x).map((o) => esc(o.b.name || T('flow.battery') + ' ' + (o.i + 1))).join(', ');
      this._set('.sub', mates ? T('bat.shared', { name: mates }) + (subT ? '<br>' + subT : '') : subT, true, el);
      if (via) {
        // Solar -> Speicher (Eingang) und Speicher -> Haus (Ausgang); Ausgang in Batteriefarbe, sobald der Speicher entlädt
        this._link('pvbat', pin > TH, true, PAL.pv, pin);
        this._link(key, out > TH, true, bp !== null && bp < -TH ? PAL.bat : PAL.pv, out);
      } else this._link(key, on && !x.lead, !chg, col, bp);
    });
    if (this._s3d) {
      this._routes3d({ bats, gImp: gImpM, gExp, p1Home: p1Home + p1Rest, p2Home: p2Home + p2Rest, p1Bat, p1Exp, p2Exp, pv2Bat: p2Bat });
      this._draw3d({ pv1, pv2, grid, home, bats, src: { pv: pvHome, bat: bDis, imp: gImp } });
    }
    this._banner({ pv, grid, bat, soc, home, gImp: gImpM, gExp });
    this._anim('home', home, this._$('.core'));
    const sh = { pv: tot ? pvHome / tot : 0, bat: tot ? bDis / tot : 0, grid: tot ? gImp / tot : 0 };
    // home_color: source (optional): Die Zahl über dem Haus nimmt die Farbe der Quelle mit dem größten Anteil. Erst ab 5 Punkten Vorsprung wechselt die Farbe
    const hn = this._$('.core .num');
    if (hn) {
      let col = '';
      if (c.home_color === 'source' && tot > 0) {
        const lead = ['pv', 'bat', 'grid'].reduce((a, k) => (sh[k] > sh[a] ? k : a), 'pv');
        const keep = this._hc && sh[this._hc] >= sh[lead] - 0.05 ? this._hc : lead;
        this._hc = keep;
        col = `rgb(${keep === 'pv' ? PAL.pv : keep === 'bat' ? PAL.bat : PAL.imp})`;
      } else this._hc = null;
      if (hn.style.color !== col) hn.style.color = col;
    }
    let start = 0;
    ['pv', 'bat', 'grid'].forEach((k) => {
      const seg = this._$(`.seg[data-g="${k}"]`);
      // Der Abstand zum Nachbarn darf einen kleinen Anteil nicht aufbrauchen: Was in der Legende mit mindestens 1 % steht, bleibt als Punkt sichtbar
      const len = sh[k] * 100, full = len > 99.5, gap = full || len < 0.5 ? 0 : Math.min(3, len - 0.05);
      const vis = Math.max(0, len - gap);
      seg.style.strokeDasharray = `${vis.toFixed(2)} ${(100 - vis).toFixed(2)}`;
      seg.style.strokeDashoffset = `${(-(start + gap / 2)).toFixed(2)}`;
      seg.style.opacity = len < 0.5 ? '0' : '1';
      start += len;
      this._set(`[data-m="${k}"]`, tot ? Math.round(sh[k] * 100) + ' %' : '—');
    });
    let sumAll = 0;
    c.consumers.forEach((x, i) => {
      const el = this._$(`[data-k="c${i}"]`);
      if (!el) return;
      const secSt = x.secondary && h.states[x.secondary];
      const dec = x.secondary_decimals === undefined ? 1 : x.secondary_decimals;
      let secTxt = secSt && !['unavailable', 'unknown'].includes(secSt.state)
        ? `${nf(parseFloat(secSt.state) || 0, dec)} ${secSt.attributes.unit_of_measurement || ''}`.trim() : '';
      if (x.entity) {
        const p = this._cw(x), on = (p || 0) > onW(x);
        // grid2: Kosten pro Stunde mit dem eigenen Preis
        if (x._g2 && on) { const pr = WD.price(h, c.grid2.price, c.grid2.price_ct, 0); if (pr > 0) secTxt = `${nf(p / 1000 * pr, 2)} ${cur()}/h`; }
        sumAll += p || 0;
        el.classList.toggle('on', on);
        this._anim('c' + i, p, el);
        this._set(`[data-k="c${i}"] .c-sec`, p === null ? T('offline') : secTxt);
        this._link('c' + i, on, false, rgb(x.color, '167,139,250'), p);
      } else {
        el.classList.add('on');
        const parts = secTxt ? secTxt.split(' ') : ['—'];
        this._set(`[data-k="c${i}"] .num`, parts[0]);
        this._set(`[data-k="c${i}"] .unit`, parts.slice(1).join(' '));
      }
    });
    // Kachel "Nicht erfasst" bei einzelnen Verbrauchern (hide_rest: false): Hausverbrauch minus Summe der Verbraucher
    const crel = this._$('[data-k="crest"]');
    if (crel) {
      const restW = Math.max(0, home - sumAll - bmChg), restMin = parseFloat(c.rest_min) || 0;
      const show = restMin <= 0 || (home > TH && restW / home * 100 >= restMin), on = show && restW > TH;
      crel.style.display = show ? '' : 'none';
      crel.classList.toggle('on', on);
      this._anim('crest', restW, crel);
      this._link('crest', on, false, PAL.mut, restW);
    }
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
          const p = x.entity ? this._cw(x) : null;
          let txt = '';
          if (p !== null) { sum += p; any = true; const sp = this._sw(p); txt = sp[0] + ' ' + sp[1]; }
          const sec = x.secondary && h.states[x.secondary];
          if (!txt && sec && !['unavailable', 'unknown'].includes(sec.state)) {
            const dec = x.secondary_decimals === undefined ? 1 : x.secondary_decimals;
            txt = `${nf(parseFloat(sec.state) || 0, dec)} ${sec.attributes.unit_of_measurement || ''}`.trim();
          }
          it.classList.toggle('on', (p || 0) > onW(x));
          const b = it.querySelector('b');
          if (b.textContent !== txt) b.textContent = txt;
        });
        if (this._gSort) this._sortGroup(i, g);
        known += sum;
        sumAll += sum;
        const shown = (g.items || []).some((x) => !x.entity || (h.states[x.entity] && h.states[x.entity].state !== 'unavailable'));
        el.style.display = shown ? '' : 'none';
        if (shown) vis++;
        const on = shown && sum > onW(g);
        el.classList.toggle('on', on);
        this._anim('g' + i, any ? sum : null, el);
        this._link('g' + i, on, false, rgb(g.color, '167,139,250'), sum);
      });
      const rel = this._$('[data-k="grest"]');
      const restW = Math.max(0, home - known - bmChg);
      const restMin = parseFloat(c.rest_min) || 0;
      const restShow = !!rel && (restMin <= 0 || (home > TH && restW / home * 100 >= restMin));
      if (rel) { rel.style.display = restShow ? '' : 'none'; if (restShow) vis++; }
      if (vis !== this._gVis) {
        this._gVis = vis;
        const gw = this._$('.groups');
        if (gw) gw.style.gridTemplateColumns = `repeat(${Math.max(1, this._gc ? Math.min(this._gc, vis) : vis)},minmax(0,1fr))`;
        this._schedLayout();
      }
      if (rel) {
        const rest = Math.max(0, home - known - bmChg);
        const on = rest > TH;
        rel.classList.toggle('on', on);
        this._anim('grest', rest, rel);
        this._link('grest', on, false, PAL.mut, rest);
        this._set('.rest-t', home > TH ? T('flow.restpct', { n: Math.round(Math.min(1, (known + bmChg) / home) * 100) }) : '');
      }
    }
    if (this._sam) {
      const bel = this._$('[data-k="bundle"]');
      if (bel) {
        const on = sumAll > TH;
        bel.classList.toggle('on', on);
        this._set('.sam-w', this._fW(sumAll), true);
        this._link('bundle', on, false, PAL.home, sumAll);
      }
    }
    // daily_from_total: Tageswert aus der Statistik des Gesamtzählers (this._dTot); fällt die Abfrage aus, gilt der Sensorwert wie bisher
    const raw = rawUnits(c), en = (id) => (c.daily_from_total && !this._dErr && id ? (this._dTot && id in this._dTot ? this._dTot[id] : null) : kwh(h, id, raw));
    let dPv = c.pv ? en(c.pv.daily) : null;
    if (c.pv2 && c.pv2.daily) { const d2 = en(c.pv2.daily); if (d2 !== null) dPv = (dPv || 0) + d2; }
    const dImp = c.grid ? en(c.grid.daily_import) : null;
    const dExp = c.grid ? en(c.grid.daily_export) : null;
    // Derselbe Sensor bei mehreren Speichern zählt nur einmal
    const sumBat = (f, list) => [...new Set((list || c.batteries).map((b) => b[f]))].reduce((a, id) => { const v = en(id); return v === null ? a : (a || 0) + v; }, null);
    const dChg = sumBat('daily_charge');
    const dDis = sumBat('daily_discharge');
    const balB = c.batteries.filter((b) => b.behind_meter !== true);
    // pv.daily_ac: Der Tagesertrag zählt nur die Abgabe des Wechselrichters. Die Akku-Ladung fehlt darin, die Entladung steckt darin
    if (c.pv && c.pv.daily_ac === true && dPv !== null) dPv = Math.max(0, dPv + (sumBat('daily_charge', balB) || 0) - (sumBat('daily_discharge', balB) || 0));
    this._set('[data-s="pv"] b', `${this._fk(dPv)}<small>kWh</small>`, true);
    if (c.pv && c.pv.forecast_tomorrow) this._set('[data-s="fc1"] b', `${this._fk(kwh(h, c.pv.forecast_tomorrow, raw))}<small>kWh</small>`, true);
    if (c.pv && c.pv.forecast_day_after) this._set('[data-s="fc2"] b', `${this._fk(kwh(h, c.pv.forecast_day_after, raw))}<small>kWh</small>`, true);
    this._set('[data-s="imp"] b', `${this._fk(dImp)}<small>kWh</small>`, true);
    this._set('[data-s="exp"] b', `${this._fk(dExp)}<small>kWh</small>`, true);
    this._set('[data-s="bat"] b', `+${this._fk(dChg)}<small>/</small> −${this._fk(dDis)}<small>kWh</small>`, true);
    let aut = null, dHome = c.home && c.home.daily ? en(c.home.daily) : null;
    if (dPv !== null && dImp !== null) {
      const cons = dPv + dImp - (dExp || 0) - (sumBat('daily_charge', balB) || 0) + (sumBat('daily_discharge', balB) || 0);
      if (cons > 0) aut = 1 - dImp / cons;
      if (dHome === null && !(c.home && c.home.daily)) dHome = Math.max(0, cons);
    }
    this._set('[data-s="home"] b', `${this._fk(dHome)}<small>kWh</small>`, true);
    this._set('[data-s="aut"] b', this._fp(aut));
    if (this._dlg !== null && this._dlg !== undefined) this._dlgUpd();
  }
}

if (!customElements.get('energy-cockpit-flow-card')) {
  customElements.define('energy-cockpit-flow-card', EnergyCockpitFlowCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: 'energy-cockpit-flow-card', name: 'energy-cockpit Energiefluss', description: 'Animierter Energiefluss (PV, Netz, Batterie, Verbraucher)', preview: true });
}
})();


/* ---- flow-editor.js ---- */
/* Editor der Energiefluss-Karte: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const ent = (name, domains) => ({ name, selector: { entity: domains ? { domain: domains } : {} } });
  const txt = (name) => ({ name, selector: { text: {} } });
  // Mehrere Sensoren (z. B. mehrere Unterzähler zum Abziehen)
  const entm = (name, domains) => ({ name, selector: { entity: Object.assign({ multiple: true }, domains ? { domain: domains } : {}) } });
  const bool = (name, def) => ({ name, default: def, selector: { boolean: {} } });
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step || 1, mode: 'box' } } });
  const sec = (name, title, schema) => ({ type: 'expandable', name, title, schema });

  const LABELS = {
    title: 'Titel', name: 'Anzeigename', icon: 'Symbol', minus: 'Differenz: abziehen (Sensor, W), z. B. Zähler 2 einer Zählerkaskade', plus: 'Differenz: dazurechnen (Sensor, W, optional)',
    entity: 'Sensor (Leistung)', daily: 'Tagesertrag (kWh)', daily_ac: 'Tagesertrag zählt ohne Akku-Ladung (Hybrid-Wechselrichter)', forecast: 'Prognose (Leistung in W/kW oder Tagesprognose in kWh)', forecast_tomorrow: 'Prognose morgen (kWh, z. B. Forecast.Solar)', forecast_day_after: 'Prognose übermorgen (kWh, optional)',
    price: 'Preis (Sensor oder Helfer, pro kWh)', price_ct: 'oder fester Preis (Cent pro kWh)',
    invert: 'Vorzeichen umkehren', daily_import: 'Bezug heute (kWh)', daily_export: 'Einspeisung heute (kWh)',
    power_charge: 'oder getrennt: Ladeleistung (Sensor)', power_discharge: 'oder getrennt: Entladeleistung (Sensor)', power: 'Sensor Lade-/Entladeleistung', soc: 'Sensor Ladestand (%)', capacity_kwh: 'Kapazität (kWh)',
    reserve_soc: 'Entladegrenze (Sensor oder Helfer, %)', max_soc: 'Maximalladung (Sensor oder Helfer, %)', groups_lines: 'Linien zu den Verbrauchern', hide_rest: 'Kachel "Nicht erfasst" ausblenden', add_to_home: 'Hausverbrauch enthält die zweite Anlage nicht', rest_min: 'Kachel "Nicht erfasst" erst ab (%)', text_size: 'Textgröße', reserve_pct: 'oder feste Entladegrenze (%)', max_pct: 'oder feste Maximalladung (%)', soc_display: 'Ladestand anzeigen als', tap: 'Klick auf die Batterie-Kachel öffnet',
    power_out: 'Ausgangsleistung ins Haus (Sensor, nur für Speicher mit angeschlossenen Modulen)', pv_to_battery: 'Solar läuft durch den Speicher (z. B. Marstek B2500)',
    temp: 'Temperatur (Sensor, optional)', daily_charge: 'Geladen heute (kWh)', daily_discharge: 'Entladen heute (kWh)', behind_meter: 'Speicher hinter dem Zähler (zählt wie ein Gerät im Haus)',
    grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)', grid_price_ct: 'oder fester Strompreis (Cent pro kWh)', theme: 'Farbschema', accent: 'Akzentfarbe (z. B. 34,197,94 oder #22c55e)', feed_in_ct: 'oder feste Einspeisevergütung (Cent pro kWh)',
    daily_from_total: 'Tageswerte aus Gesamtzählern berechnen (wie das Energie-Dashboard)', show_clock: 'Uhr anzeigen', home_color: 'Farbe der Zahl beim Haus', style: 'Darstellung', house_style: 'Haus in der 3D-Ansicht', compact: 'Kurzansicht (kompakt)', watt_only: 'Leistung immer in Watt (nie kW)', animations: 'Animationen', groups_columns: 'Gruppen pro Reihe (leer = alle nebeneinander)', on_w: 'Aktiv ab (W, Standard 10)', fit_screen: 'Auf Bildschirmhöhe skalieren',
    roof_color: 'Dachfarbe in der 3D-Ansicht', consumer_groups_sort: 'Reihenfolge der Geräte in Gruppen', decimals: 'Nachkommastellen bei kWh (leer = automatisch)',
    nav_path: 'Weiter-Schaltfläche: Pfad (z. B. /lovelace/geraete)', nav_label: 'Weiter-Schaltfläche: Text',
    secondary: 'Zusatzwert (Sensor, z. B. Temperatur)', color: 'Farbe (z. B. #a78bfa)', image: 'Logo (Bild-URL, ersetzt das Symbol)',
  };

  const PV_VIA = [{ value: 'aus', label: 'Aus: Solar speist das Haus (Standard)' }, { value: 'direkt', label: 'Direkt: Solar läuft durch den Speicher (braucht die Ausgangsleistung)' }];
  const HOMECOL = [{ value: 'standard', label: 'Standard (Türkis)' }, { value: 'source', label: 'Farbe der größten Quelle (PV gelb, Speicher blau, Netz rot)' }];
  const STYLE = [{ value: 'flach', label: 'Flach: Kacheln und Ring (Standard)' }, { value: '3d', label: '3D: Haus, Solar, Netz und Speicher als Objekte' }];
  const HOUSE = [{ value: 'sattel', label: 'Satteldach (Standard)' }, { value: 'flach', label: 'Flachdach' }];
  const COMPACT = [{ value: 'aus', label: 'Aus: ausführliche Ansicht (Standard)' }, { value: 'auto', label: 'Nur auf dem Handy' }, { value: 'immer', label: 'Immer' }];

  // Listen als Platzhalter-Abschnitte "0", "1", ...: Home Assistant speichert sie als Objekt, die Karte macht daraus wieder eine Liste
  const slots = (n, titleOf, schemaOf) => Array.from({ length: n }, (_, i) => sec(String(i), titleOf(i + 1), schemaOf(i)));
  const consumerFields = () => [ent('entity', ['sensor']), entm('minus', ['sensor']), entm('plus', ['sensor']), txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'), ent('secondary', ['sensor']), numb('on_w', 0, 100000, 1)];
  const itemFields = () => [ent('entity', ['sensor']), entm('minus', ['sensor']), entm('plus', ['sensor']), txt('name'), ent('secondary', ['sensor']), numb('on_w', 0, 100000, 1)];
  const groupFields = () => [
    txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'), numb('on_w', 0, 100000, 1),
    sec('items', 'Verbraucher der Gruppe', slots(10, (n) => `Verbraucher ${n}`, itemFields)),
  ];

  // Weitere Speicher (ab dem zweiten): jeder mit eigener Kachel
  const batteryFields = () => [
    txt('name'), ent('power', ['sensor']), ent('power_charge', ['sensor']), ent('power_discharge', ['sensor']), ent('soc', ['sensor']), bool('invert', false),
    numb('capacity_kwh', 0, 200, 0.1), numb('reserve_pct', 0, 100, 1), numb('max_pct', 0, 100, 1), ent('temp', ['sensor']),
    ent('daily_charge', ['sensor']), ent('daily_discharge', ['sensor']), bool('behind_meter', false),
  ];

  WD.flowForm = () => ({
    schema: [
      txt('title'),
      sec('pv', 'Solar', [ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor']), bool('daily_ac', false), ent('forecast', ['sensor']), ent('forecast_tomorrow', ['sensor']), ent('forecast_day_after', ['sensor'])]),
      sec('pv2', 'Zweite Solaranlage (z. B. Balkonkraftwerk)', [ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor']), bool('add_to_home', false)]),
      sec('grid', 'Netz', [ent('entity', ['sensor']), txt('name'), bool('invert', false), ent('daily_import', ['sensor']), ent('daily_export', ['sensor'])]),
      sec('grid2', 'Zweiter Netzzähler (z. B. Wärmepumpe mit eigenem Zähler)', [ent('entity', ['sensor']), txt('name'), ent('price', ['sensor', 'input_number', 'number']), numb('price_ct', 0, 200, 0.01)]),
      sec('battery', 'Batterie', [
        ent('power', ['sensor']), ent('power_charge', ['sensor']), ent('power_discharge', ['sensor']), ent('power_out', ['sensor']), ent('soc', ['sensor']), txt('name'), bool('invert', false),
        numb('capacity_kwh', 0, 200, 0.1), ent('reserve_soc', ['sensor', 'number', 'input_number']), numb('reserve_pct', 0, 100, 1),
        ent('max_soc', ['sensor', 'number', 'input_number']), numb('max_pct', 0, 100, 1),
        { name: 'tap', selector: { select: { mode: 'dropdown', options: [{ value: 'power', label: 'Verlauf der Lade-/Entladeleistung (Standard)' }, { value: 'soc', label: 'Verlauf des Ladestands in %' }] } } },
      { name: 'soc_display', selector: { select: { mode: 'dropdown', options: [{ value: 'brutto', label: 'Ladestand der Batterie (Standard)' }, { value: 'nutzbar', label: 'Nutzbarer Anteil (0 % = Entladegrenze)' }] } } },
        ent('temp', ['sensor']), ent('daily_charge', ['sensor']), ent('daily_discharge', ['sensor']), bool('behind_meter', false),
      ]),
      { name: 'pv_to_battery', selector: { select: { mode: 'dropdown', options: PV_VIA } } },
      sec('batteries', 'Weitere Speicher (2. bis 5.)', slots(4, (n) => `Speicher ${n + 1}`, batteryFields)),
      sec('home', 'Haus (optional)', [ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor'])]),
      sec('consumers', 'Einzelverbraucher (bis zu 12)', slots(12, (n) => `Verbraucher ${n}`, consumerFields)),
      sec('consumer_groups', 'Gruppen (bis zu 10)', slots(10, (n) => `Gruppe ${n}`, groupFields)),
      ent('grid_price', ['sensor', 'input_number']),
      numb('grid_price_ct', 0, 200, 0.1),
      ent('feed_in', ['sensor', 'input_number']),
      numb('feed_in_ct', 0, 200, 0.1),
      bool('daily_from_total', false),
      bool('show_clock', true),
      bool('fit_screen', true),
      bool('watt_only', false),
      bool('hide_rest', false),
      numb('groups_columns', 1, 12, 1),
      numb('rest_min', 0, 100, 1),
      { name: 'style', selector: { select: { mode: 'dropdown', options: STYLE } } },
      { name: 'house_style', selector: { select: { mode: 'dropdown', options: HOUSE } } },
      { name: 'home_color', selector: { select: { mode: 'dropdown', options: HOMECOL } } },
      { name: 'roof_color', selector: { select: { mode: 'dropdown', custom_value: true, options: [{ value: 'rot', label: 'Ziegelrot (Standard)' }, { value: 'anthrazit', label: 'Anthrazit' }, { value: 'schwarz', label: 'Schwarz' }, { value: 'grau', label: 'Grau' }, { value: 'braun', label: 'Braun' }, { value: 'gruen', label: 'Grün' }, { value: 'blau', label: 'Blau' }] } } },
      { name: 'consumer_groups_sort', selector: { select: { mode: 'dropdown', options: [{ value: 'konfiguriert', label: 'Wie eingetragen (Standard)' }, { value: 'leistung', label: 'Nach Leistung, aktive Geräte oben' }] } } },
      numb('decimals', 0, 3, 1),
      { name: 'compact', selector: { select: { mode: 'dropdown', options: COMPACT } } },
      { name: 'text_size', selector: { select: { mode: 'dropdown', options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }] } } },
      { name: 'animations', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Wie am Gerät eingestellt (Standard)' }, { value: 'always', label: 'Immer, auch bei "Bewegung reduzieren"' }] } } },
      { name: 'groups_lines', selector: { select: { mode: 'dropdown', options: [{ value: 'direkt', label: 'Eine Linie je Gerät oder Gruppe (Standard)' }, { value: 'sammel', label: 'Eine Sammel-Linie zum ganzen Verbraucherbereich' }] } } },
      { name: 'theme', selector: { select: { mode: 'dropdown', options: WD.THEME_OPTIONS } } },
      txt('nav_path'),
      txt('nav_label'),
    ],
    computeLabel: (s) => LABELS[s.name] || s.title || s.name,
    computeHelper: (s) => (s.name === 'title' ? 'Abfallkalender, Überschussvorschläge und Netzalarm stellst du im YAML-Editor ein.' : s.name === 'daily_from_total' ? 'Optional. Trage bei den Tageswerten (Bezug, Einspeisung, Ertrag, Batterie) Gesamtzähler ein, auch in Wh. Die Karte rechnet den Wert von heute selbst, aus der Langzeitstatistik.' : undefined),
  });

  // Assistent: Schritte mit Sensor-Vorschlägen
  const H = (...re) => re;
  const steps = () => [
    { short: 'Solar', title: 'Solaranlage', text: 'Wähle den Sensor, der die aktuelle Erzeugung der PV-Anlage in Watt anzeigt.', fields: [
      { path: 'pv.entity', label: 'PV-Leistung', kind: 'power', hints: H(/pv|solar|photovolt|inverter|wechselrichter|erzeugung/i, /input|eingang|power|leistung/i) },
      { path: 'pv.daily', label: 'Tagesertrag (kWh)', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute|yield|ertrag/i, /pv|solar|inverter/i) },
      { path: 'pv.daily_ac', label: 'Tagesertrag zählt ohne Akku-Ladung', kind: 'bool', help: 'Für Hybrid-Wechselrichter, deren Tagesertrag nur die Abgabe des Wechselrichters zählt. Zeichen dafür: "Autarkie heute" steht bei 0 %, und "Haus heute" ist viel zu niedrig. Braucht "Geladen heute" und "Entladen heute" beim Speicher.' },
      { path: 'pv.forecast', label: 'Prognose heute (kWh oder Leistung in W/kW)', kind: 'forecast', optional: true, hints: H(/forecast|prognose|solcast|production|produktion/i, /today|heute|now|jetzt/i), help: 'Eine Tagesprognose in kWh (zum Beispiel Forecast.Solar "Energie Produktion heute" oder Solcast "Prognose heute") erscheint als "Prognose heute" in kWh. Eine Leistungsprognose in W/kW zeigt "Prognose" in Watt.' },
      { path: 'pv.forecast_tomorrow', label: 'Prognose morgen (kWh)', kind: 'energy', optional: true, hints: H(/tomorrow|morgen/i, /forecast|prognose|solcast|production|produktion|ertrag/i), help: 'Erwartete Produktion für morgen, zum Beispiel von Forecast.Solar oder Solcast. Erscheint als Kachel "PV morgen" unten in der Karte.' },
      { path: 'pv.forecast_day_after', label: 'Prognose übermorgen (kWh)', kind: 'energy', optional: true, hints: H(/day.?after|d2|uebermorgen|übermorgen|day_3|day3/i), help: 'Nicht jede Integration hat diesen Wert, Forecast.Solar zum Beispiel nicht.' },
      { path: 'pv2.entity', label: 'Zweite Anlage, z. B. Balkonkraftwerk (Leistung)', kind: 'power', optional: true, hints: H(/bkw|balkon|pv2|solar2|plug|steckdose|shelly/i), help: 'Eigene Kachel und Linie. Die Bilanz (Autarkie, Eigenverbrauch, Herkunft) rechnet mit der Summe beider Anlagen.' },
      { path: 'pv2.name', label: 'Name der zweiten Anlage', kind: 'text', optional: true },
      { path: 'pv2.daily', label: 'Tagesertrag der zweiten Anlage (kWh)', kind: 'energy', optional: true },
      { path: 'pv2.add_to_home', label: 'Hausverbrauch enthält die zweite Anlage nicht', kind: 'bool', help: 'Nur aktivieren, wenn dein Hausverbrauchs-Sensor den Ertrag der zweiten Anlage NICHT enthält. Dann addiert die Karte ihn dazu.' },
    ] },
    { short: 'Netz', title: 'Stromnetz', text: 'Der Netzsensor zeigt Bezug und Einspeisung. Wenn später Bezug als Einspeisung angezeigt wird, setze "Vorzeichen umkehren".', fields: [
      { path: 'grid.entity', label: 'Netzleistung', kind: 'power', hints: H(/grid|netz|meter|zähler|zaehler|wirkleistung|smart.?meter/i, /power|leistung/i) },
      { path: 'grid.invert', label: 'Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn der Sensor bei Einspeisung positive Werte liefert.' },
      { path: 'grid.daily_import', label: 'Netzbezug heute (kWh)', kind: 'energy', optional: true, hints: H(/import|bezug|verbrauch|consumption/i, /tag|daily|today|heute/i) },
      { path: 'grid.daily_export', label: 'Einspeisung heute (kWh)', kind: 'energy', optional: true, hints: H(/export|einspeis|feed/i, /tag|daily|today|heute/i) },
      { path: 'grid2.entity', label: 'Zweiter Netzzähler, z. B. Wärmepumpe (Leistung in Watt)', kind: 'power', optional: true, help: 'Nur für einen zweiten Zähler mit eigenem Tarif, der nur Strom bezieht. Er erscheint als Kachel bei den Verbrauchern, zählt zum Hausverbrauch und im Ring zum Netz. Bei drei Phasen den Summen-Sensor nehmen.' },
      { path: 'grid2.name', label: 'Name des zweiten Zählers', kind: 'text', optional: true },
      { path: 'grid2.price', label: 'Preis des zweiten Zählers (Sensor oder Helfer, pro kWh)', kind: 'price', optional: true },
      { path: 'grid2.price_ct', label: 'oder fester Preis (Cent pro kWh)', kind: 'number', optional: true, step: '0.01', help: 'Zum Beispiel 25.45. Der Preis zeigt die Kosten pro Stunde in der Kachel.' },
    ] },
    { short: 'Batterie', title: 'Batteriespeicher', text: 'Überspringen, wenn du keine Batterie hast.', fields: [
      { path: 'battery.power', label: 'Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i) },
      { path: 'battery.power_charge', label: 'oder getrennt: Ladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|input|eingang/i), help: 'Nur wenn dein System zwei Sensoren hat (Laden und Entladen getrennt). Dann das Feld oben leer lassen.' },
      { path: 'battery.power_discharge', label: 'oder getrennt: Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /entlade|discharge|output|ausgang/i) },
      { path: 'battery.soc', label: 'Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level|batterieladung/i, /batter|akku/i) },
      { path: 'battery.reserve_soc', label: 'Entladegrenze der Batterie (Sensor oder Helfer, %)', kind: 'percent', optional: true, help: 'Bis zu diesem Ladestand wird die Batterie entladen. Viele Wechselrichter bieten dafür eine Zahl-Entität an (zum Beispiel "Entlade-Ende-Ladestand"). Die Karte zeigt die Grenze auf dem Ladebalken und rechnet die nutzbare Kapazität.', hints: H(/entlad|reserve|min.*soc|discharge.*(end|cut|limit)|ende/i, /soc|ladestand|ladung/i) },
      { path: 'battery.reserve_pct', label: 'oder feste Entladegrenze (%)', kind: 'number', optional: true, step: '1', help: 'Zum Beispiel 10, wenn die Batterie nur bis 10 % entladen wird.' },
      { path: 'battery.max_soc', label: 'Maximalladung der Batterie (Sensor oder Helfer, %)', kind: 'percent', optional: true, hints: H(/lade.*ende|max|charge.*(end|cut|limit)|ende/i, /soc|ladestand|ladung/i) },
      { path: 'battery.max_pct', label: 'oder feste Maximalladung (%)', kind: 'number', optional: true, step: '1' },
      { path: 'battery.soc_display', label: 'Ladestand anzeigen als', kind: 'choice', options: [{ value: 'brutto', label: 'Ladestand der Batterie (Standard)' }, { value: 'nutzbar', label: 'Nutzbarer Anteil (0 % = Entladegrenze)' }] },
      { path: 'battery.power_out', label: 'Nur Speicher mit angeschlossenen Modulen (z. B. Marstek B2500): Ausgangsleistung', kind: 'power', optional: true, hints: H(/ausgang|output|abgabe|ac.?out/i, /batter|akku|speicher|storage|b2500|marstek/i), help: 'Hängen die Solarmodule direkt am Speicher, trägst du hier die Leistung ein, die der Speicher ans Haus abgibt. Danach unten Solar läuft durch den Speicher auf Direkt stellen. Als Solar-Sensor dient die Eingangsleistung der Module.' },
      { path: 'pv_to_battery', label: 'Solar läuft durch den Speicher', kind: 'choice', options: PV_VIA, help: 'Nur für Speicher vor dem Wechselrichter. Die Karte zeichnet dann Solar -> Speicher -> Haus und zeigt Durchleitung, wenn der Speicher weder lädt noch entlädt.' },
      { path: 'battery.invert', label: 'Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn Laden negativ und Entladen positiv gemeldet wird.' },
      { path: 'battery.capacity_kwh', label: 'Kapazität (kWh)', kind: 'number', optional: true, help: 'Für die Prognose "voll um / reicht bis".' },
      { path: 'battery.temp', label: 'Temperatur', kind: 'temp', optional: true, hints: H(/batter|akku|speicher|storage|bat\d/i, /temp/i), help: 'Optional. Steht in der Kachel unter dem Ladestand.' },
      { path: 'battery.daily_charge', label: 'Geladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /geladen|lade|charge/i), help: 'Für "Autarkie heute" und "Haus heute". Ohne diese beiden Werte zählt der Akku dort nicht als eigener Strom.' },
      { path: 'battery.daily_discharge', label: 'Entladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /entlad|discharge/i) },
      { path: 'battery.behind_meter', label: 'Speicher hinter dem Zähler', kind: 'bool', help: 'Nur für Speicher, die der Wechselrichter oder Netzzähler nicht kennt, zum Beispiel an der Steckdose. Seine Ladung zählt als Verbrauch, seine Abgabe als Quelle im Ring und im Hausverbrauch.' },
    ] },
    { short: 'Speicher', title: 'Weitere Speicher', text: 'Optional. Hast du mehr als einen Speicher, trage hier den zweiten und dritten ein. Jeder bekommt eine eigene Kachel, Ring und Tageswerte rechnen mit der Summe. Der erste Speicher steht im Schritt davor.', fields: [
      { path: 'batteries.0.name', label: 'Name von Speicher 2', kind: 'text', optional: true },
      { path: 'batteries.0.power', label: 'Speicher 2: Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i), help: 'Hat dein System getrennte Sensoren für Laden und Entladen, trägst du sie unter Alle Felder ein.' },
      { path: 'batteries.0.soc', label: 'Speicher 2: Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level/i, /batter|akku/i) },
      { path: 'batteries.0.capacity_kwh', label: 'Speicher 2: Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'batteries.0.temp', label: 'Speicher 2: Temperatur', kind: 'temp', optional: true, hints: H(/batter|akku|speicher|storage|bat\d/i, /temp/i) },
      { path: 'batteries.0.daily_charge', label: 'Speicher 2: Geladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /geladen|lade|charge/i) },
      { path: 'batteries.0.daily_discharge', label: 'Speicher 2: Entladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /entlad|discharge/i) },
      { path: 'batteries.0.behind_meter', label: 'Speicher 2: hinter dem Zähler', kind: 'bool', help: 'Nur für Speicher, die der Wechselrichter oder Netzzähler nicht kennt, zum Beispiel an der Steckdose. Seine Ladung zählt als Verbrauch, seine Abgabe als Quelle im Ring und im Hausverbrauch.' },
      { path: 'batteries.1.name', label: 'Name von Speicher 3', kind: 'text', optional: true },
      { path: 'batteries.1.power', label: 'Speicher 3: Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i) },
      { path: 'batteries.1.soc', label: 'Speicher 3: Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level/i, /batter|akku/i) },
      { path: 'batteries.1.capacity_kwh', label: 'Speicher 3: Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'batteries.1.temp', label: 'Speicher 3: Temperatur', kind: 'temp', optional: true, hints: H(/batter|akku|speicher|storage|bat\d/i, /temp/i) },
      { path: 'batteries.1.daily_charge', label: 'Speicher 3: Geladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /geladen|lade|charge/i) },
      { path: 'batteries.1.daily_discharge', label: 'Speicher 3: Entladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /entlad|discharge/i) },
      { path: 'batteries.1.behind_meter', label: 'Speicher 3: hinter dem Zähler', kind: 'bool', help: 'Nur für Speicher, die der Wechselrichter oder Netzzähler nicht kennt, zum Beispiel an der Steckdose. Seine Ladung zählt als Verbrauch, seine Abgabe als Quelle im Ring und im Hausverbrauch.' },
    ] },
    { short: 'Haus', title: 'Hausverbrauch', text: 'Optional. Ohne Angabe wird der Verbrauch aus Solar, Netz und Batterie berechnet.', fields: [
      { path: 'home.entity', label: 'Hausverbrauch', kind: 'power', optional: true, hints: H(/haus|home|house|verbrauch|consumption|load/i) },
      { path: 'home.daily', label: 'Hausverbrauch heute (kWh)', kind: 'energy', optional: true, help: 'Optional. Ohne Angabe berechnet die Karte den Wert aus PV-Ertrag, Netzbezug, Einspeisung und Batterie heute.' },
    ] },
    { short: 'Verbraucher', title: 'Einzelverbraucher', text: 'Wähle Geräte mit eigenem Leistungssensor, zum Beispiel Wärmepumpe, Wallbox oder Trockner. Gruppen (z. B. je Raum) findest du unter "Alle Felder".', fields: [
      { path: 'consumers', label: 'Verbraucher', kind: 'list', max: 12, minusKey: 'minus', minusLabel: 'Optional, nur bei zwei Zählern hintereinander: Davon abziehen (Differenz, z. B. Haushaltszähler):' },
      { path: 'rest_min', label: 'Kachel "Nicht erfasst" erst anzeigen ab (% vom Hausverbrauch)', kind: 'number', optional: true, step: '1', help: 'Zum Beispiel 10: Die Kachel erscheint nur, wenn mindestens 10 % des Hausverbrauchs keiner Gruppe zugeordnet sind.' },
      { path: 'groups_columns', label: 'Gruppen pro Reihe', kind: 'number', optional: true, step: '1', help: 'Leer: alle Gruppen nebeneinander in einer Reihe. 1: jede Gruppe in einer eigenen Reihe über die volle Breite, die Namen sind dann besser lesbar. Stehen Gruppen untereinander, zeichnet die Karte eine Sammel-Linie.' },
      { path: 'hide_rest', label: 'Kachel "Nicht erfasst" ausblenden', kind: 'bool', help: 'Die Kachel zeigt den Teil des Hausverbrauchs, der keinem Gerät und keiner Gruppe zugeordnet ist (Hausverbrauch minus Summe der Gruppen).' },
      { path: 'groups_lines', label: 'Linien zu den Verbrauchern', kind: 'choice', options: [{ value: 'direkt', label: 'Eine Linie je Gerät oder Gruppe (Standard)' }, { value: 'sammel', label: 'Eine Sammel-Linie zum ganzen Verbraucherbereich' }], help: 'Bei vielen Geräten wirkt eine einzelne Sammel-Linie zum ganzen Bereich ruhiger.' },
    ] },
    { short: 'Preise', title: 'Strompreise (optional)', text: 'Mit Preisen zeigt die Karte Kosten und Ersparnis. Wähle Sensoren oder input_number-Helfer in Euro pro kWh.', fields: [
      { path: 'grid_price', label: 'Strompreis Bezug', kind: 'price', optional: true, hints: H(/bezug|netz|strom|import|grid|price|preis/i) },
      { path: 'grid_price_ct', label: 'oder fester Strompreis (Cent pro kWh)', kind: 'number', optional: true, step: '0.1', help: 'Ohne Sensor oder Helfer: einfach den Preis aus deiner Rechnung eintragen, zum Beispiel 34.' },
      { path: 'feed_in', label: 'Einspeisevergütung', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },
      { path: 'feed_in_ct', label: 'oder feste Einspeisevergütung (Cent pro kWh)', kind: 'number', optional: true, step: '0.1' },
    ] },
    { short: 'Aussehen', title: 'Farbschema', text: 'Dunkel ist die Voreinstellung. Mit "Automatisch" folgt die Karte dem hellen oder dunklen Design von Home Assistant, "Home Assistant" übernimmt dessen Farben.', fields: [
      { path: 'theme', label: 'Farbschema', kind: 'theme' },
      { path: 'watt_only', label: 'Leistung immer in Watt anzeigen', kind: 'bool', help: 'Standard: ab 1000 W wird auf kW umgeschaltet. Aktiviert: immer Watt, zum Beispiel 2.350 W.' },
      { path: 'style', label: 'Darstellung', kind: 'choice', options: STYLE, help: 'Mit 3D zeigt die Karte Haus, Solar, Netz und Speicher als Objekte. Die Werte bleiben gleich.' },
      { path: 'house_style', label: 'Haus in der 3D-Ansicht', kind: 'choice', options: HOUSE },
      { path: 'home_color', label: 'Farbe der Zahl beim Haus', kind: 'choice', options: HOMECOL, help: 'Mit "Farbe der größten Quelle" nimmt die Zahl über dem Haus die Farbe des größten Anteils im Ring an.' },
      { path: 'compact', label: 'Kurzansicht', kind: 'choice', options: COMPACT, help: 'Kompakte Übersicht auf einen Blick: Solar, Netz und Batterie neben dem Ring, Gruppen ohne Geräteliste, ohne Zusatztexte. Ein Tipp auf eine Gruppe zeigt alle ihre Geräte. "Nur auf dem Handy" zeigt auf dem Tablet weiter die ausführliche Ansicht.' },
      { path: 'animations', label: 'Animationen', kind: 'choice', options: [{ value: 'auto', label: 'Wie am Gerät eingestellt (Standard)' }, { value: 'always', label: 'Immer, auch bei "Bewegung reduzieren"' }], help: 'Ist am Handy oder Tablet "Bewegung reduzieren" eingeschaltet (iPhone: Einstellungen → Bedienungshilfen → Bewegung), stehen Linien und Ring still. "Immer" animiert trotzdem.' },
      { path: 'text_size', label: 'Textgröße', kind: 'choice', options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }], help: 'Vergrößert die kleinen Texte, zum Beispiel Ladestand, Kennzahlen oben rechts und Beschriftungen.' },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert. Mit "Fertig" siehst du alle Felder, zum Beispiel für Gruppen. Abfallkalender, Überschussvorschläge und Netzalarm stellst du im YAML-Editor ein.', summary: (c) => [
      `Solar: ${(c.pv && c.pv.entity) || 'nicht gewählt'}`,
      `Netz: ${(c.grid && c.grid.entity) || 'nicht gewählt'}${c.grid && c.grid.invert ? ' (umgekehrt)' : ''}`,
      `Batterie: ${(c.battery && (c.battery.power || c.battery.power_charge)) || 'keine'}${WD.toList(c.batteries).filter((b) => b && (b.power || b.power_charge || b.soc)).length ? ' und ' + WD.toList(c.batteries).filter((b) => b && (b.power || b.power_charge || b.soc)).length + ' weitere' : ''}`,
      `Haus: ${(c.home && c.home.entity) || 'berechnet'}`,
      `Einzelverbraucher: ${WD.toList(c.consumers).filter((x) => x && x.entity).length}`,
      `Preise: ${c.grid_price || typeof c.grid_price_ct === 'number' ? 'Bezug gesetzt' : 'keine'}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-flow-card-editor', {
    needsSetup: (c) => !(c.pv && c.pv.entity) && !(c.grid && c.grid.entity),
    steps,
    form: () => WD.flowForm(),
  });
})();


/* ---- devices-i18n.js ---- */
/* Übersetzungen der Geräte-Karte */
WD.addStrings({
  'dev.title': 'Geräte & Verbrauch', 'dev.room': 'Raum', 'dev.err': 'rooms fehlt: mindestens einen Raum konfigurieren', 'dev.next': 'Weiter →',
  'dev.days': 'Tagen', 'dev.p.day': 'Heute', 'dev.p.week': 'Woche', 'dev.p.month': 'Monat', 'dev.p.year': 'Jahr',
  'dev.l.day': 'Heute', 'dev.l.week': 'Diese Woche', 'dev.l.month': 'Dieser Monat', 'dev.l.year': 'Dieses Jahr', 'dev.measured': 'gemessen',
  'dev.cost': 'Kosten', 'dev.home_total': 'Haus gesamt', 'dev.none': 'Keine erreichbaren Geräte', 'dev.locked': 'geschützt – nur Anzeige', 'dev.now': 'JETZT',
  'dev.ambilight': 'Ambilight', 'dev.music': 'Musik', 'dev.mute': 'Ton aus', 'dev.light': 'Licht',
  'dev.on': 'an', 'dev.off': 'aus', 'dev.tv_on': 'TV läuft', 'dev.tv_off': 'TV aus', 'dev.extra': 'Zusatzgerät', 'dev.cooling': 'kühlt', 'dev.pause': 'Pause', 'dev.since': 'seit',
  'dev.unmeasured': 'nicht erfasst', 'dev.live': 'Jetzt · davon <b>{n} %</b> gemessen', 'dev.sub': '{on} von {all} Geräten an · {w} gemessen',
  'dev.cent': 'ct/kWh', 'dev.grid': 'Netz', 'dev.selfsup': 'PV/Akku', 'dev.standby': 'Standby', 'dev.year': 'Jahr', 'dev.tap_off': 'antippen = aus', 'dev.surplus': 'Überschuss',
  'dev.playing': 'läuft',
  'dev.st.ready': 'bereit', 'dev.st.brewing': 'brüht', 'dev.st.inactive': 'inaktiv', 'dev.st.finished': 'fertig', 'dev.st.pause': 'Pause',
  'dev.st.action': 'Aktion nötig', 'dev.st.error': 'Fehler', 'dev.st.playing': 'spielt', 'dev.st.standby': 'Standby',
});


/* ---- devices-card.js ---- */
/* energy-cockpit-devices-card (abgeleitet aus devices-card v1.4.0) – Geräte & Verbrauch: Raum-Kacheln mit Live-Leistung, Schalten, Standby-Detektiv, Statistik Tag/Woche/Monat/Jahr mit stündlichem Strommix (PV/Akku vs. Netz) */
(() => {
  const { nf, esc, rgb, haNavigate, T, setLocale, cur } = WD;
  // Leistung in W (kW und MW werden umgerechnet)
  const num = (h, id) => (h && id ? WD.watt(h, id) : null);
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
        const r = await h.callWS({ type: 'recorder/statistics_during_period', start_time: s.toISOString(), period: per === 'year' ? 'day' : 'hour', statistic_ids: ids, types: ['change'], ...WD.statUnits(c) });
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


/* ---- devices-editor.js ---- */
/* energy-cockpit-devices-card-editor: Räume und Geräte per Formular anlegen (ha-form je Raum und Gerät).
   Erweiterte Optionen (Kanäle, Ambilight, Zusatzverbraucher, home_energy ...) bleiben im YAML und gehen nicht verloren. */
(() => {
  const { T, setLocale } = WD;

  WD.addStrings({
    'ed.d.title': 'Titel', 'ed.d.home': 'Hausverbrauch (Leistung)', 'ed.d.price': 'Strompreis Bezug (Sensor, pro kWh)', 'ed.d.feed': 'Einspeisevergütung (Sensor, pro kWh)', 'ed.d.theme': 'Farbschema', 'ed.d.price_ct': 'oder fester Strompreis (Cent pro kWh)', 'ed.d.feed_ct': 'oder feste Einspeisevergütung (Cent pro kWh)',
    'ed.d.surplus': 'PV-Überschuss (Leistung)', 'ed.d.standby': 'Standby-Schwelle (W)', 'ed.d.fit': 'Auf Bildschirmhöhe skalieren',
    'ed.d.nav_path': 'Weiter-Schaltfläche: Pfad', 'ed.d.nav_label': 'Weiter-Schaltfläche: Text',
    'ed.d.room': 'Raum', 'ed.d.room_name': 'Name', 'ed.d.icon': 'Symbol', 'ed.d.color': 'Farbe (z. B. 248,113,113)', 'ed.d.image': 'Logo (Bild-URL, ersetzt das Symbol)',
    'ed.d.dev': 'Gerät', 'ed.d.dev_name': 'Name', 'ed.d.type': 'Typ', 'ed.d.entity': 'Schalter (zum Ein- und Ausschalten)', 'ed.d.power': 'Leistung (Sensor)',
    'ed.d.energy': 'Energie (Zähler in kWh)', 'ed.d.max_w': 'Maximale Leistung für Balken (W)', 'ed.d.run_w': 'Läuft ab Leistung (W)', 'ed.d.lock': 'Gesperrt (nur Anzeige)',
    'ed.d.add_room': '+ Raum hinzufügen', 'ed.d.add_dev': '+ Gerät hinzufügen', 'ed.d.del': 'Entfernen', 'ed.d.up': '▲', 'ed.d.down': '▼',
    'ed.d.hint': 'Kanäle, Ambilight, Zusatzverbraucher und Statistikquellen (home_energy) stellst du im YAML-Editor ein.',
    'ed.d.t.light': 'Licht', 'ed.d.t.pump': 'Pumpe', 'ed.d.t.fridge': 'Kühlschrank', 'ed.d.t.dryer': 'Trockner', 'ed.d.t.ac': 'Klimaanlage', 'ed.d.t.strip': 'Steckdosenleiste',
    'ed.d.t.tv': 'Fernseher', 'ed.d.t.media': 'Mediencenter', 'ed.d.t.console': 'Spielkonsole', 'ed.d.t.coffee': 'Kaffeemaschine', 'ed.d.t.heat': 'Heizung', 'ed.d.t.plug': 'Steckdose',
  });

  // ha-form ist in Home Assistant nicht immer geladen: über die Karten-Helfer nachladen
  const ensureForm = async () => {
    if (customElements.get('ha-form')) return true;
    try {
      const h = await window.loadCardHelpers();
      const c = await h.createCardElement({ type: 'entities', entities: [] });
      if (c && c.constructor && c.constructor.getConfigElement) await c.constructor.getConfigElement();
    } catch (e) { /* weiter mit Wartezeit */ }
    await Promise.race([customElements.whenDefined('ha-form'), new Promise((r) => setTimeout(r, 4000))]);
    return !!customElements.get('ha-form');
  };


  // Räume und Geräte aus den Bereichen von Home Assistant vorschlagen
  const typeOf = (n) => {
    if (/k.hl|fridge|gefrier/i.test(n)) return 'fridge';
    if (/licht|light|lampe/i.test(n)) return 'light';
    if (/trockner|dryer|waschmaschine/i.test(n)) return 'dryer';
    if (/klima|air.?cond/i.test(n)) return 'ac';
    if (/pumpe|pump/i.test(n)) return 'pump';
    if (/\btv\b|fernseh/i.test(n)) return 'tv';
    if (/heiz|heat/i.test(n)) return 'heat';
    if (/kaffee|coffee/i.test(n)) return 'coffee';
    if (/konsole|playstation|xbox/i.test(n)) return 'console';
    if (/leiste|strip/i.test(n)) return 'strip';
    return 'plug';
  };
  const suggestRooms = (hass) => {
    const reg = hass.entities || {}, devs = hass.devices || {}, areas = hass.areas || {};
    const power = WD.wizardList(hass, 'power'), energy = WD.wizardList(hass, 'energy'), sw = WD.wizardList(hass, 'switch');
    const devOf = (id) => (reg[id] && reg[id].device_id) || '';
    const areaOf = (id) => {
      const r = reg[id];
      if (!r) return '';
      return r.area_id || (r.device_id && devs[r.device_id] && devs[r.device_id].area_id) || '';
    };
    const groups = {};
    power.forEach((e) => {
      const dk = devOf(e.id) || e.id;
      if (!groups[dk]) groups[dk] = { power: e, area: areaOf(e.id), dev: devOf(e.id) };
    });
    const rooms = {};
    Object.keys(groups).slice(0, 80).forEach((k) => {
      const g = groups[k], d = g.dev && devs[g.dev];
      const name = String((d && (d.name_by_user || d.name)) || g.power.name).replace(/\s*(leistung|power|energy power)\s*$/i, '');
      const dev = { name, power: g.power.id };
      const t = typeOf(name);
      if (t !== 'plug') dev.type = t;
      let sws = null;
      if (g.dev) {
        const en = energy.find((e) => devOf(e.id) === g.dev);
        if (en) dev.energy = en.id;
        sws = sw.find((e) => devOf(e.id) === g.dev && /^(switch|light)\./.test(e.id));
      }
      if (sws) dev.entity = sws.id; else { dev.entity = g.power.id; dev.lock = true; }
      const ar = areas[g.area];
      const rn = ar ? ar.name : 'Sonstiges';
      if (!rooms[rn]) rooms[rn] = { name: rn, devices: [] };
      if (ar && ar.icon && !rooms[rn].icon) rooms[rn].icon = ar.icon;
      rooms[rn].devices.push(dev);
    });
    return Object.keys(rooms).sort((a, b) => (a === 'Sonstiges') - (b === 'Sonstiges') || a.localeCompare(b, 'de')).map((k) => {
      rooms[k].devices.sort((a, b) => a.name.localeCompare(b.name, 'de'));
      return rooms[k];
    });
  };

  const TYPES = ['plug', 'light', 'pump', 'fridge', 'dryer', 'ac', 'strip', 'tv', 'media', 'console', 'coffee', 'heat'];
  const ent = (name, domains) => ({ name, selector: { entity: domains ? { domain: domains } : {} } });
  const txt = (name) => ({ name, selector: { text: {} } });
  const bool = (name) => ({ name, selector: { boolean: {} } });
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step || 1, mode: 'box' } } });
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const prune = (o) => {
    Object.keys(o).forEach((k) => { if (o[k] === '' || o[k] === undefined || o[k] === null || o[k] === false) delete o[k]; });
    return o;
  };

  class EnergyCockpitDevicesEditor extends HTMLElement {
    setConfig(c) {
      const s = JSON.stringify(c || {});
      if (this._last === s) return; // eigene Änderung, nicht neu aufbauen (Eingabefokus bleibt erhalten)
      this._c = clone(c || {});
      this._c.rooms = this._c.rooms || [];
      ensureForm().then(() => this._render());
    }
    set hass(h) {
      this._hass = h;
      setLocale(h);
      (this._forms || []).forEach((f) => { f.hass = h; });
    }
    _emit() {
      this._last = JSON.stringify(this._c);
      this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: clone(this._c) }, bubbles: true, composed: true }));
    }
    _form(schema, data, onChange, labelFn) {
      const f = document.createElement('ha-form');
      f.schema = schema;
      f.data = data;
      f.computeLabel = labelFn;
      if (this._hass) f.hass = this._hass;
      f.addEventListener('value-changed', (ev) => { ev.stopPropagation(); onChange(ev.detail.value); });
      this._forms.push(f);
      return f;
    }
    _btn(label, onClick, danger) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'cursor:pointer;margin:4px 6px 4px 0;padding:6px 12px;border-radius:8px;border:1px solid var(--divider-color,#555);background:' + (danger ? 'rgba(244,67,54,.12)' : 'var(--secondary-background-color,#222)') + ';color:var(--primary-text-color,#fff);font:inherit';
      b.addEventListener('click', onClick);
      return b;
    }
    _assist(w) {
      const c = this._c;
      // Assistent: Räume und Geräte aus den Bereichen vorschlagen
      const ab = document.createElement('div');
      ab.style.cssText = 'margin:0 0 14px;padding:12px;border:1px solid var(--primary-color,#03a9f4);border-radius:12px';
      const at = document.createElement('div');
      at.style.cssText = 'font-weight:700;margin-bottom:4px';
      at.textContent = 'Assistent';
      const ax = document.createElement('div');
      ax.style.cssText = 'font-size:.9em;opacity:.8;margin-bottom:8px';
      ax.textContent = 'Legt Räume anhand der Bereiche in Home Assistant an und ordnet alle Geräte mit Leistungssensor zu (Schalter und Energiezähler desselben Geräts werden mit übernommen). Danach kannst du alles anpassen.';
      ab.appendChild(at);
      ab.appendChild(ax);
      ab.appendChild(this._btn('Räume und Geräte aus Bereichen vorschlagen', () => {
        if (!this._hass) return;
        const sug = suggestRooms(this._hass);
        if (!sug.length) { window.alert('Es wurden keine Geräte mit Leistungssensor gefunden.'); return; }
        const n = sug.reduce((a, r) => a + r.devices.length, 0);
        if (c.rooms.length) {
          if (window.confirm(`${n} Geräte in ${sug.length} Räumen gefunden. Bestehende Räume ersetzen?\nOK = ersetzen, Abbrechen = anhängen`)) c.rooms = sug;
          else c.rooms = c.rooms.concat(sug);
        } else c.rooms = sug;
        this._emit();
        this._render();
      }));
      w.appendChild(ab);
    }
    _render() {
      if (!this._wrap) {
        this._wrap = document.createElement('div');
        this.appendChild(this._wrap);
      }
      this._forms = [];
      const w = this._wrap;
      w.innerHTML = '';
      if (!customElements.get('ha-form')) {
        this._assist(w);
        const m = document.createElement('div');
        m.textContent = 'Das Formular konnte nicht geladen werden. Bitte die Seite neu laden (Strg + F5) oder die Karte im YAML-Editor bearbeiten.';
        w.appendChild(m);
        return;
      }
      const c = this._c;
      const lbl = {
        title: 'ed.d.title', home: 'ed.d.home', grid_price: 'ed.d.price', feed_in: 'ed.d.feed', grid_price_ct: 'ed.d.price_ct', feed_in_ct: 'ed.d.feed_ct', theme: 'ed.d.theme', surplus: 'ed.d.surplus', standby_w: 'ed.d.standby',
        fit_screen: 'ed.d.fit', nav_path: 'ed.d.nav_path', nav_label: 'ed.d.nav_label', icon: 'ed.d.icon', color: 'ed.d.color', image: 'ed.d.image', type: 'ed.d.type',
        entity: 'ed.d.entity', power: 'ed.d.power', energy: 'ed.d.energy', max_w: 'ed.d.max_w', run_w: 'ed.d.run_w', lock: 'ed.d.lock',
      };
      const label = (s) => (s.name === 'name' ? T('ed.d.room_name') : lbl[s.name] ? T(lbl[s.name]) : s.name);

      // Allgemein
      const top = this._form([
        txt('title'), ent('home', ['sensor']), ent('grid_price', ['sensor', 'input_number']), numb('grid_price_ct', 0, 200, 0.1), ent('feed_in', ['sensor', 'input_number']), numb('feed_in_ct', 0, 200, 0.1),
        ent('surplus', ['sensor']), numb('standby_w', 0, 200, 1), bool('fit_screen'), { name: 'theme', selector: { select: { mode: 'dropdown', options: WD.THEME_OPTIONS } } }, txt('nav_path'), txt('nav_label'),
      ], {
        title: c.title || '', home: c.home || '', grid_price: c.grid_price || '', feed_in: c.feed_in || '', surplus: c.surplus || '', grid_price_ct: c.grid_price_ct === undefined ? '' : c.grid_price_ct, feed_in_ct: c.feed_in_ct === undefined ? '' : c.feed_in_ct,
        standby_w: c.standby_w === undefined ? 15 : c.standby_w, theme: c.theme || 'dunkel', fit_screen: c.fit_screen !== false, nav_path: c.nav_path || '', nav_label: c.nav_label || '',
      }, (v) => {
        ['title', 'home', 'grid_price', 'feed_in', 'surplus', 'nav_path', 'nav_label'].forEach((k) => { if (v[k]) c[k] = v[k]; else delete c[k]; });
        ['grid_price_ct', 'feed_in_ct'].forEach((k) => { if (typeof v[k] === 'number') c[k] = v[k]; else delete c[k]; });
        if (v.standby_w === undefined || v.standby_w === 15) delete c.standby_w; else c.standby_w = v.standby_w;
        if (v.theme && v.theme !== 'dunkel') c.theme = v.theme; else delete c.theme;
        if (v.fit_screen === false) c.fit_screen = false; else delete c.fit_screen;
        this._emit();
      }, label);
      this._assist(w);
      w.appendChild(top);

      // Räume und Geräte
      c.rooms.forEach((room, ri) => {
        const box = document.createElement('div');
        box.style.cssText = 'margin:16px 0;padding:12px;border:1px solid var(--divider-color,#444);border-radius:12px';
        const head = document.createElement('div');
        head.style.cssText = 'font-weight:600;margin-bottom:6px';
        head.textContent = `${T('ed.d.room')} ${ri + 1}`;
        box.appendChild(head);
        box.appendChild(this._form([txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color')],
          { name: room.name || '', icon: room.icon || '', image: room.image || '', color: room.color || '' },
          (v) => { Object.assign(room, prune({ name: v.name, icon: v.icon, image: v.image, color: v.color })); ['name', 'icon', 'image', 'color'].forEach((k) => { if (!v[k]) delete room[k]; }); this._emit(); }, label));
        (room.devices = room.devices || []).forEach((dev, di) => {
          const dbox = document.createElement('div');
          dbox.style.cssText = 'margin:10px 0 0 8px;padding:8px 10px;border-left:3px solid var(--primary-color,#03a9f4)';
          const dh = document.createElement('div');
          dh.style.cssText = 'font-weight:500;opacity:.8';
          dh.textContent = `${T('ed.d.dev')} ${di + 1}`;
          dbox.appendChild(dh);
          dbox.appendChild(this._form([
            txt('name'),
            { name: 'type', selector: { select: { mode: 'dropdown', options: TYPES.map((t) => ({ value: t, label: T('ed.d.t.' + t) })) } } },
            ent('entity', ['switch', 'light', 'input_boolean', 'binary_sensor']), ent('power', ['sensor']), ent('energy', ['sensor']),
            numb('max_w', 1, 20000, 10), numb('run_w', 0, 5000, 1), bool('lock'), { name: 'icon', selector: { icon: {} } }, txt('color'),
          ], {
            name: dev.name || '', type: dev.type || 'plug', entity: dev.entity || '', power: dev.power || '', energy: dev.energy || '',
            max_w: dev.max_w, run_w: dev.run_w, lock: !!dev.lock, icon: dev.icon || '', color: dev.color || '',
          }, (v) => {
            ['name', 'type', 'entity', 'power', 'energy', 'icon', 'color'].forEach((k) => { if (v[k]) dev[k] = v[k]; else delete dev[k]; });
            ['max_w', 'run_w'].forEach((k) => { if (v[k] === undefined || v[k] === null || v[k] === '') delete dev[k]; else dev[k] = v[k]; });
            if (v.lock) dev.lock = true; else delete dev.lock;
            if (dev.type === 'plug') delete dev.type;
            this._emit();
          }, label));
          dbox.appendChild(this._btn(T('ed.d.up'), () => { if (di > 0) { room.devices.splice(di - 1, 0, room.devices.splice(di, 1)[0]); this._emit(); this._render(); } }));
          dbox.appendChild(this._btn(T('ed.d.down'), () => { if (di < room.devices.length - 1) { room.devices.splice(di + 1, 0, room.devices.splice(di, 1)[0]); this._emit(); this._render(); } }));
          dbox.appendChild(this._btn(T('ed.d.del'), () => { room.devices.splice(di, 1); this._emit(); this._render(); }, true));
          box.appendChild(dbox);
        });
        box.appendChild(this._btn(T('ed.d.add_dev'), () => { room.devices.push({ name: '' }); this._emit(); this._render(); }));
        box.appendChild(this._btn(T('ed.d.up') + ' ' + T('ed.d.room'), () => { if (ri > 0) { c.rooms.splice(ri - 1, 0, c.rooms.splice(ri, 1)[0]); this._emit(); this._render(); } }));
        box.appendChild(this._btn(T('ed.d.down') + ' ' + T('ed.d.room'), () => { if (ri < c.rooms.length - 1) { c.rooms.splice(ri + 1, 0, c.rooms.splice(ri, 1)[0]); this._emit(); this._render(); } }));
        box.appendChild(this._btn(T('ed.d.del') + ' ' + T('ed.d.room'), () => { c.rooms.splice(ri, 1); this._emit(); this._render(); }, true));
        w.appendChild(box);
      });
      w.appendChild(this._btn(T('ed.d.add_room'), () => { c.rooms.push({ name: T('ed.d.room') + ' ' + (c.rooms.length + 1), devices: [] }); this._emit(); this._render(); }));
      const hint = document.createElement('p');
      hint.style.cssText = 'margin:12px 4px 0;font-size:.85rem;opacity:.7';
      hint.textContent = T('ed.d.hint');
      w.appendChild(hint);
    }
  }

  if (!customElements.get('energy-cockpit-devices-card-editor')) customElements.define('energy-cockpit-devices-card-editor', EnergyCockpitDevicesEditor);
})();


/* ---- room-card.js ---- */
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
      const w = WD.watt(h, d.power);
      // power_minus (Differenz, z. B. Zählerkaskade): power - power_minus (+ power_plus), nie negativ
      const L = (v) => (Array.isArray(v) ? v : v ? [v] : []), mi = L(d.power_minus);
      if (!mi.length || w === null) return w;
      let s = 0;
      for (let i = 0; i < mi.length; i++) { const m = WD.watt(h, mi[i]); if (m === null) return null; s += m; }
      return Math.max(0, w - s + L(d.power_plus).reduce((a, id) => a + (WD.watt(h, id) || 0), 0));
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
        // Differenz-Messstellen (z. B. Zählerkaskade): energy_minus / energy_plus werden zusätzlich geladen
        const allD = c.devices.concat(c.items);
        const L = (v) => (Array.isArray(v) ? v : v ? [v] : []);
        const sumRow = (row, list) => L(list).reduce((a, id) => a + (row[id] || 0), 0);
        const extraIds = [];
        allD.forEach((d) => L(d.energy_minus).concat(L(d.energy_plus)).forEach((e) => { if (e && extraIds.indexOf(e) < 0 && ids.indexOf(e) < 0 && iids.indexOf(e) < 0) extraIds.push(e); }));
        const hasDiff = allD.some((d) => L(d.energy_minus).length);
        // Wert eines Geräts in einer Zeile: ohne energy_minus unverändert row[energy]; sonst energy - Summe(minus) + Summe(plus), nie negativ
        const rowVal = (d, row) => (L(d.energy_minus).length ? Math.max(0, (row[d.energy] || 0) - sumRow(row, d.energy_minus) + sumRow(row, d.energy_plus)) : (row[d.energy] || 0));
        const y = new Date().getFullYear();
        const start = new Date(y - 1, 0, 1);
        const ts = (x) => (typeof x.start === 'number' ? x.start : Date.parse(x.start));
        // 1) Tageswerte der Geräte: erster Messtag, Gesamtverbrauch
        const dr = await h.callWS({ type: 'recorder/statistics_during_period', start_time: start.toISOString(), period: 'day', statistic_ids: ids.concat(iids, extraIds), types: ['change'], ...WD.statUnits(c) });
        let firstTs = null;
        ids.forEach((id) => (dr[id] || []).forEach((x) => { const t = ts(x); if (x.change !== null && x.change !== undefined && (firstTs === null || t < firstTs)) firstTs = t; }));
        const days = {};
        const he = c.home_energy || {};
        const srcIds = ['pv', 'import', 'export', 'charge', 'discharge'].map((k) => he[k]).filter(Boolean);
        this._hasMix = !!(he.import && (he.pv || he.discharge));
        if (firstTs === null) {
          this._first = null;
        } else if (!this._hasMix) {
          if (!hasDiff) {
            ids.concat(iids).forEach((id, di) => (dr[id] || []).forEach((x) => {
              const k = key(new Date(ts(x)));
              (days[k] = days[k] || ids.concat(iids).map(() => [0, 0, 0, 0]))[di][0] += x.change > 0 ? x.change : 0;
            }));
          } else {
            // mit Differenz-Messstellen: erst alle Zähler je Tag sammeln, dann je Gerät rechnen
            const per = {};
            ids.concat(iids, extraIds).forEach((id) => (dr[id] || []).forEach((x) => { (per[ts(x)] = per[ts(x)] || {})[id] = x.change > 0 ? x.change : 0; }));
            Object.keys(per).forEach((tt) => {
              const k = key(new Date(+tt));
              allD.forEach((d, di) => { if (per[tt][d.energy] === undefined) return; (days[k] = days[k] || allD.map(() => [0, 0, 0, 0]))[di][0] += rowVal(d, per[tt]); });
            });
          }
          this._first = key(new Date(firstTs));
        } else {
          // 2) Stundenwerte: Geräte und Haus-Mix (PV, Bezug, Einspeisung, Batterie laden/entladen)
          const from = new Date(firstTs);
          from.setHours(0, 0, 0, 0);
          const all = ids.concat(iids, srcIds, extraIds);
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
            const dev = c.devices.map((d) => rowVal(d, row));
            const idev = c.items.map((d) => rowVal(d, row));
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
      // Eigener Netzpreis je Gerät oder Unterposten (price_ct in Cent oder price als Sensor/Helfer, z. B. Wärmepumpentarif); ohne Angabe der allgemeine Bezugspreis
      const own = (o) => (o && typeof o.price_ct === 'number' ? o.price_ct / 100 : (o && o.price ? this._rate(o.price, null) : null));
      // Unterposten erben den Preis ihres Bereichs, wenn sie keinen eigenen haben
      const gp = (o, par) => { const a = own(o); if (a !== null) return a; const b = own(par); return b !== null ? b : P.grid; };
      const price = (d, pg) => {
        if (mode === 'grid') return (d[0] + d[1] + d[2] + d[3]) * pg;
        if (mode === 'mix') return d[0] * pg + d[1] * P.batt + (d[2] + d[3]) * P.pv;
        return (d[0] + d[1] + d[2]) * pg + d[3] * P.feed;
      };
      const dev = raw.map((d) => [d[0], d[1], d[2] + d[3]]);
      const src = [0, 0, 0];
      dev.forEach((d) => d.forEach((v, i) => { src[i] += v; }));
      const surplus = raw.reduce((a, d) => a + d[3], 0);
      const kwh = src[0] + src[1] + src[2];
      const fee = withFee ? this._fee(from, to) : 0;
      const devCost = raw.map((d, i) => price(d, gp(this._c.devices[i])));
      const cost = devCost.reduce((a, v) => a + v, 0) + fee;
      const costFull = kwh * P.grid + fee;
      const items = rawI.map((d) => [d[0], d[1], d[2] + d[3]]);
      const itemCost = rawI.map((d, j) => price(d, gp(this._c.items[j], this._c.devices[this._c.items[j].parent])));
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


/* ---- room-editor.js ---- */
/* Editor der Raum-Abrechnung: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const txt = (name) => ({ name, selector: { text: {} } });
  const ent = (name, domains) => ({ name, selector: { entity: domains ? { domain: domains } : {} } });
  // Mehrere Sensoren (z. B. mehrere Unterzähler zum Abziehen)
  const entm = (name, domains) => ({ name, selector: { entity: Object.assign({ multiple: true }, domains ? { domain: domains } : {}) } });
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step || 1, mode: 'box' } } });
  const sec = (name, title, schema) => ({ type: 'expandable', name, title, schema });

  const VAL = [
    { value: 'opportunity', label: 'Entgangener Nutzen (empfohlen): Netz, Batterie und PV, die das Haus gebraucht hätte, zum Bezugspreis' },
    { value: 'mix', label: 'Feste Preise je Quelle (Netz, Batterie, PV)' },
    { value: 'grid', label: 'Alles zum Bezugspreis' },
  ];

  const LABELS = {
    title: 'Titel', subtitle: 'Untertitel', image: 'Logo (Bild-URL)', energy: 'Energiezähler (kWh)', name: 'Anzeigename', color: 'Farbe (z. B. 96,165,250)',
    price: 'Bezugspreis (Sensor oder input_number, € pro kWh)', price_ct: 'oder fester Bezugspreis (Cent pro kWh)', feed_in: 'Einspeisevergütung (Sensor oder input_number, € pro kWh)',
    price_pv: 'PV-Preis bei "feste Preise" (€ pro kWh, sonst Einspeisevergütung)', price_battery: 'Batteriepreis bei "feste Preise" (€ pro kWh, sonst PV-Preis)',
    base_fee: 'Grundgebühr je Monat (€)', valuation: 'Bewertung (entgangener Nutzen, feste Preise oder alles zum Bezugspreis)',
    pv: 'PV Gesamtertrag (Zähler, kWh)', import: 'Netzbezug gesamt (Zähler, kWh)', export: 'Einspeisung gesamt (Zähler, kWh)',
    charge: 'Batterie geladen gesamt (kWh)', discharge: 'Batterie entladen gesamt (kWh)',
    energy_minus: 'Differenz: abziehen (Zähler, kWh), z. B. Zähler 2 einer Zählerkaskade', energy_plus: 'Differenz: dazurechnen (Zähler, kWh, optional)', power_minus: 'Differenz live: abziehen (Sensor, W)', power_plus: 'Differenz live: dazurechnen (Sensor, W, optional)',
    power: 'Leistungssensor (W, für die Live-Anzeige)', advance: 'Abschlag je Monat (Zahl in € oder input_number)', archive: 'Monatsarchiv (Sensor, optional)',
    standby_w: 'Standby-Schwelle nachts (W, Zahl oder input_number)', active_w: 'Ab wie viel Watt gilt ein Bereich als aktiv (W)',
    theme: 'Farbschema', accent: 'Akzentfarbe (z. B. 245,158,11 oder #f59e0b)',
    watt_warn: 'Live-Anzeige: erhöht ab (W)', watt_high: 'Live-Anzeige: hoch ab (W)',
  };

  WD.roomForm = () => ({
    schema: [
      txt('title'), txt('subtitle'), txt('image'),
      sec('devices', 'Bereiche / Zähler (bis zu 8)', Array.from({ length: 8 }, (_, i) => sec(String(i), `Bereich ${i + 1}`, [ent('energy', ['sensor']), ent('power', ['sensor']), txt('name'), txt('color'), entm('energy_minus', ['sensor']), entm('energy_plus', ['sensor']), entm('power_minus', ['sensor']), entm('power_plus', ['sensor']), ent('price', ['sensor', 'input_number']), numb('price_ct', 0, 200, 0.1)]))),
      sec('home_energy', 'Haus-Energiequellen (für Netz / Batterie / PV)', [ent('pv', ['sensor']), ent('import', ['sensor']), ent('export', ['sensor']), ent('charge', ['sensor']), ent('discharge', ['sensor'])]),
      { name: 'valuation', selector: { select: { mode: 'dropdown', options: VAL } } },
      ent('price', ['sensor', 'input_number']),
      numb('price_ct', 0, 200, 0.1),
      ent('feed_in', ['sensor', 'input_number']),
      ent('price_pv', ['sensor', 'input_number']),
      ent('price_battery', ['sensor', 'input_number']),
      numb('base_fee', 0, 1000, 0.5),
      ent('advance', ['input_number', 'sensor']),
      ent('archive', ['sensor']),
      numb('standby_w', 0, 5000, 5),
      numb('active_w', 0, 5000, 5),
      numb('watt_warn', 0, 20000, 10),
      numb('watt_high', 0, 20000, 10),
      { name: 'theme', selector: { select: { mode: 'dropdown', options: WD.THEME_OPTIONS } } },
      txt('accent'),
    ],
    computeLabel: (s) => LABELS[s.name] || s.title || s.name,
  });

  const H = (...re) => re;
  const TOTAL = /gesamt|total|lifetime|energie|energy/i;
  const steps = () => [
    { short: 'Raum', title: 'Raum', text: 'Name und Logo, die oben auf der Karte erscheinen.', fields: [
      { path: 'title', label: 'Titel', kind: 'text' },
      { path: 'subtitle', label: 'Untertitel', kind: 'text', optional: true },
      { path: 'image', label: 'Logo (Bild-URL oder Data-URI)', kind: 'text', optional: true },
    ] },
    { short: 'Zähler', title: 'Energiezähler', text: 'Wähle die Zähler (kWh) der Bereiche oder Stromkreise dieses Raums, zum Beispiel Arbeitsplätze oder Chillecke. Hinter einem Zähler dürfen beliebig viele Geräte hängen. Der Verbrauch wird je Bereich und als Summe ausgewiesen.', fields: [
      { path: 'devices', label: 'Zähler', kind: 'list', listKind: 'energy', itemKey: 'energy', max: 8, minusKey: 'energy_minus', minusLabel: 'Optional, nur bei zwei Zählern hintereinander: Davon abziehen (Differenz, z. B. Zähler 2):', priceKey: 'price_ct', priceLabel: 'Eigener Bezugspreis dieses Bereichs in Cent pro kWh (optional, z. B. Wärmestromtarif)' },
    ] },
    { short: 'Herkunft', title: 'Woher kommt der Strom?', text: 'Mit den Zählern des ganzen Hauses ermittelt die Karte stündlich, welcher Anteil aus Netz, Batterie und PV stammt. Jeder Verbraucher bekommt in jeder Stunde den gleichen Mix wie das Haus.', fields: [
      { path: 'home_energy.pv', label: 'PV Gesamtertrag', kind: 'energy', optional: true, hints: H(/pv|solar|inverter|wechselrichter|ertrag|yield/i, TOTAL) },
      { path: 'home_energy.import', label: 'Netzbezug gesamt', kind: 'energy', optional: true, hints: H(/import|bezug|verbrauch|consumption|grid/i, TOTAL) },
      { path: 'home_energy.export', label: 'Einspeisung gesamt', kind: 'energy', optional: true, hints: H(/export|einspeis|feed/i, TOTAL) },
      { path: 'home_energy.charge', label: 'Batterie geladen gesamt', kind: 'energy', optional: true, hints: H(/ladung|charge|geladen/i, /batter|akku/i, TOTAL) },
      { path: 'home_energy.discharge', label: 'Batterie entladen gesamt', kind: 'energy', optional: true, hints: H(/entlad|discharge/i, /batter|akku/i, TOTAL) },
    ] },
    { short: 'Preis', title: 'Preise und Bewertung', text: 'Bezugspreis und Einspeisevergütung als Sensor oder input_number (Euro pro kWh). Die Bewertung "entgangener Nutzen" rechnet Strom, den dein Haus selbst gebraucht hätte, zum Bezugspreis ab.', fields: [
      { path: 'price', label: 'Bezugspreis (€ pro kWh)', kind: 'price', optional: true, hints: H(/bezug|netz|strom|import|grid|price|preis/i) },
      { path: 'price_ct', label: 'oder fester Bezugspreis (Cent pro kWh)', kind: 'number', optional: true, step: '0.1' },
      { path: 'feed_in', label: 'Einspeisevergütung (€ pro kWh)', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },
      { path: 'valuation', label: 'Bewertung', kind: 'choice', options: VAL },
      { path: 'base_fee', label: 'Grundgebühr je Monat (€)', kind: 'number', optional: true, step: '0.5' },
    ] },
    { short: 'Auswertung', title: 'Abschlag, Live und Archiv', text: 'Alles hier ist optional. Mit einem Abschlag zeigt die Karte Fortschritt, Hochrechnung und Saldo. Für die Live-Anzeige trägst du je Bereich im Reiter "Alle Felder" einen Leistungssensor (W) ein.', fields: [
      { path: 'advance', label: 'Abschlag je Monat (€)', kind: 'price', optional: true, hints: H(/abschlag|miete|advance/i) },
      { path: 'standby_w', label: 'Standby-Schwelle nachts (W)', kind: 'number', optional: true, step: '5' },
      { path: 'active_w', label: 'Aktiv ab (W)', kind: 'number', optional: true, step: '5' },
      { path: 'archive', label: 'Monatsarchiv (Sensor)', kind: 'text', optional: true },
    ] },
    { short: 'Aussehen', title: 'Farbschema', text: 'Dunkel ist die Voreinstellung. Mit "Automatisch" folgt die Karte dem hellen oder dunklen Design von Home Assistant, "Home Assistant" übernimmt dessen Farben.', fields: [
      { path: 'theme', label: 'Farbschema', kind: 'theme' },
      { path: 'accent', label: 'Akzentfarbe (optional, z. B. 34,197,94 oder #22c55e)', kind: 'text', optional: true },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert.', summary: (c) => [
      `Raum: ${c.title || 'ohne Titel'}`,
      `Zähler: ${(Array.isArray(c.devices) ? c.devices : []).filter((x) => x && x.energy).length}`,
      `Herkunft: ${c.home_energy && c.home_energy.import ? 'aus Hauszählern' : 'nicht ermittelt'}`,
      `Bewertung: ${(VAL.find((v) => v.value === (c.valuation || 'opportunity')) || VAL[0]).label}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-room-card-editor', {
    needsSetup: (c) => !(Array.isArray(c.devices) ? c.devices : []).some((x) => x && x.energy),
    steps,
    form: () => WD.roomForm(),
  });
})();


/* ---- stats-i18n.js ---- */
/* Texte der Statistik-Karte */
WD.addStrings({
  'st.title': 'Statistik', 'st.err': 'pv_total, grid_import_total und grid_export_total sind nötig', 'st.today': 'Heute', 'st.next': 'Weiter →',
  'st.pvsav': 'PV-Ersparnis', 'st.feed': 'Einspeiseerlös', 'st.selfc': 'PV-Eigenverbrauch', 'st.cost': 'Stromkosten Netz', 'st.aut': 'Autarkie',
  'st.amo': 'Amortisation PV-Anlage', 'st.base': 'Grundlast (nachts)', 'st.monthly': 'PV-Ertrag pro Monat', 'st.record': 'Rekordtag',
  'st.eff': 'Akku-Wirkungsgrad', 'st.cycles': 'Vollzyklen', 'st.temp': 'Akku-Temperatur', 'st.pvall': 'PV gesamt',
  'st.self': '<b>{kwh} kWh</b> PV selbst genutzt', 'st.fed': '<b>{kwh} kWh</b> eingespeist', 'st.drawn': '<b>{kwh} kWh</b> bezogen',
  'st.autsub': 'Eigenverbrauch <b>{self}</b> · Verbrauch <b>{cons} kWh</b>',
  'st.earned': '<b>{e} {cur}</b> von {i} {cur} zurückverdient', 'st.eta': '<b>{y} {cur}/Jahr</b> · fertig ca. <b>{yr}</b>', 'st.paid': '<b>Anlage hat sich bezahlt gemacht 🎉</b>', 'st.eta.far': 'Prognose noch nicht aussagekräftig', 'st.price.warn': '⚠ Strompreis nur {p} ct/kWh: Das Feld erwartet <b>Cent</b> (zum Beispiel 23.88), nicht Euro.',
  'st.glcost': '≈ <b>{x} {cur}/Jahr</b>', 'st.gltip': 'Niedrigster Stundenmittelwert 0–5 Uhr, Median der letzten {n} Nächte', 'st.gl100': '100 W weniger ≈ {x} {cur}/Jahr',
  'st.full': '× voll', 'st.note': 'Netzstrom {p} ct/kWh · Einspeisung {f} ct/kWh · reine Energiekosten ohne Grundgebühr · Amortisation mit heutigen Preisen geschätzt',
  'st.noprice': 'Preise (grid_price, feed_in) konfigurieren, um Kosten und Ersparnis zu sehen', 'st.nodata': 'noch keine Daten', 'st.vsprev': 'ggü. Vorjahr',
  'st.import': 'Bezug', 'st.export': 'Einspeisung',
  'st.week': 'Woche', 'st.g2name': 'Zweiter Zähler', 'st.g2of': 'davon {n} {eur} {cur}', 'st.bud.title': 'Jahresbudget Netzbezug', 'st.bud.of': '{ist} von {goal} kWh Netzbezug', 'st.bud.soll': 'Soll bis heute', 'st.bud.abw': 'Abweichung Ist − Soll', 'st.bud.fc': 'Hochrechnung', 'st.bud.fcabw': 'Abweichung zum Ziel', 'st.bud.lin': 'Soll gleichmäßig übers Jahr', 'st.bud.hist': 'Soll folgt dem Verlauf von {y}', 'st.bud.goal': 'Jahresziel', 'st.bud.since': 'Messdaten erst seit {d}: Soll und Hochrechnung gelten für diesen Zeitraum und sind vorläufig', 'st.cc.title': 'Kosten je Verbraucher', 'st.cc.meas': 'gemessen', 'st.cc.est': 'nach Haus-Mix', 'st.cc.cost': 'Netzkosten', 'st.cc.saved': 'gespart', 'st.cc.nohist': 'Nur für Heute, Woche, Monat und das laufende Jahr. Für „Gesamt“ gibt es hier keine Werte', 'st.cc.grid': 'Netz', 'st.cc.bat': 'Akku', 'st.cc.pv': 'PV', 'st.cc.upto': 'bis {x} {cur}/h', 'st.cc.unitW': '{id} misst Leistung ({u}). Nötig ist ein Zähler in kWh.', 'st.cc.nostat': 'Keine kWh-Statistik für {id}. Nötig ist ein Zähler mit state_class total_increasing.', 'st.cc.missing': '{id} gibt es nicht.',
  'st.n.pv': 'PV heute', 'st.n.imp': 'Netzbezug heute', 'st.n.exp': 'Einspeisung heute', 'st.n.chg': 'Akku geladen heute', 'st.n.dis': 'Akku entladen heute',
  'st.d.none': '{n}: {id} liefert gerade keinen Wert.', 'st.d.nonefb': '{n}: {id} liefert gerade keinen Wert. Die Karte rechnet ihn aus dem Gesamtzähler.',
  'st.d.big': '{n}: {id} zeigt {v} kWh. Das ist mehr als der Gesamtzähler seit Mitternacht. Steckt dort ein Gesamtzähler statt eines Tageswerts?',
  'st.d.exp': 'Heute mehr eingespeist ({e} kWh) als erzeugt ({p} kWh). Prüfe den Sensor für die Einspeisung.',
  'st.all': 'Gesamt', 'st.hist': 'Historie', 'st.nodata2': 'keine Daten',
  'st.lt.from': 'Daten ab {d}', 'st.lt.gaps': 'Keine Daten für: {m}', 'st.lt.skip': 'In den Summen fehlen {n} Monat(e) ohne vollständige Daten',
  'st.lt.hist': 'Historie: nur PV-Ertrag, ohne Netz- und Speicherwerte', 'st.lt.price': 'Geldwerte mit den heutigen Preisen gerechnet',
});


/* ---- stats-card.js ---- */
/* energy-cockpit-stats-card (abgeleitet aus energy-stats-card v1.0.1) – Statistik: Geld, Amortisation, Grundlast, Monatsvergleich, Akku */
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
.duo.one{grid-template-columns:1fr}
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
.bud{margin-top:14px;--q:var(--exp)}
.bud.s-warn{--q:var(--pv)}
.bud.s-bad{--q:var(--imp)}
.bud .big{display:flex;align-items:baseline;flex-wrap:wrap;margin-top:10px}
.bud .big .num{font-size:2.3rem;font-weight:800;color:rgb(var(--q));text-shadow:none;font-variant-numeric:tabular-nums}
.bud .big .unit{font-size:1rem;color:rgb(var(--q));font-weight:700;margin-left:6px}
.bud .big small{font-size:.78rem;color:rgb(var(--mut));margin-left:12px}
.bud .pfill{background:linear-gradient(90deg,rgba(var(--q),.5),rgb(var(--q)));box-shadow:0 0 0 1px rgba(var(--q),.35)}
.bud .mk{position:absolute;top:0;bottom:0;left:0;width:3px;margin-left:-1px;background:var(--txt);opacity:.85;border-radius:2px;transition:left 1.6s cubic-bezier(.2,.8,.2,1)}
.bgrid{display:grid;grid-template-columns:repeat(4,1fr);grid-gap:12px;gap:12px;margin-top:14px}
.bgrid small{display:block;font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;color:rgb(var(--mut));margin-bottom:3px}
.bgrid b{font-size:1.05rem;font-weight:750;font-variant-numeric:tabular-nums}
.bgrid em{display:block;font-style:normal;font-size:.7rem;color:rgb(var(--mut));margin-top:2px}
.c-ok{color:rgb(var(--exp))}.c-warn{color:rgb(var(--pv))}.c-bad{color:rgb(var(--imp))}
.bud .hint{font-size:.72rem;color:rgb(var(--mut));margin-top:10px}
.narrow .bgrid{grid-template-columns:1fr 1fr}
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
.dhint{display:flex;flex-direction:column;gap:4px;margin:-6px 0 14px;font-size:.72rem;color:#fbbf24;position:relative}
.dhint span{display:flex;align-items:flex-start;gap:6px;line-height:1.35}
.dhint ha-icon{--mdc-icon-size:15px;flex:none;margin-top:1px}
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
      if (!c.pv_total || !c.grid_import_total || !c.grid_export_total) {
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
      // grid2_total (optional, #29): zweiter Netzzähler (z. B. Wärmepumpe mit eigenem Tarif, nur Bezug) in kWh. Eigener Preis: grid2_price oder grid2_price_ct, sonst der normale
      this._c._g2 = typeof c.grid2_total === 'string' && c.grid2_total ? c.grid2_total : '';
      this._c._g2n = typeof c.grid2_name === 'string' && c.grid2_name.trim() ? c.grid2_name.trim() : T('st.g2name');
      // budget_kwh (optional): Jahresziel für den Netzbezug in kWh (Zahl oder Sensor). budget_profile: linear (Standard) oder history (Soll folgt dem Verlauf des Vorjahres)
      this._c._bud = typeof c.budget_kwh === 'number' ? c.budget_kwh : typeof c.budget_kwh === 'string' && c.budget_kwh.trim() ? c.budget_kwh.trim() : null;
      this._c._budHist = c.budget_profile === 'history';
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
      setLocale(h);
      // Sprache erst jetzt bekannt: Monatsnamen und statische Texte neu aufbauen
      if (this._c && this._bl !== WD.state.lang) { this._bl = WD.state.lang; fillMon(); this._build(); }
      this._hass = h;
      // Neuer Tag: Stunden seit Mitternacht neu laden, sonst fehlt "Heute" aus den Gesamtzählern bis zum nächsten Laden
      const dn = new Date(), today = new Date(dn.getFullYear(), dn.getMonth(), dn.getDate()).getTime();
      if (!this._loading && (Date.now() - (this._loaded || 0) > 30 * 60 * 1000 || (this._loaded && this._tdDay !== today))) { this._tdDay = today; this._load(); return; }
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
        <div class="dhint" data-f="dHint" style="display:none"></div>
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
        return { pv: lsum(M.pv), imp: lsum(M.imp), exp: lsum(M.exp), chg: lsum(M.chg), dis: lsum(M.dis), g2: lsum(M.g2 || {}), label: this._period === 'all' ? T('st.all') : String(yr) };
      }
      const ks = this._period === 'month' ? [key(now.getFullYear(), now.getMonth())] : Array.from({ length: now.getMonth() + 1 }, (x, i) => key(now.getFullYear(), i));
      const sum = (o) => ks.reduce((a, k) => a + (o[k] || 0), 0);
      return { pv: sum(M.pv), imp: sum(M.imp), exp: sum(M.exp), chg: sum(M.chg), dis: sum(M.dis), g2: sum(M.g2 || {}), label: this._period === 'month' ? MONL[now.getMonth()] : String(now.getFullYear()) };
    }

    _render() {
      const c = this._c, h = this._hass;
      if (!h) return;
      const price = WD.price(h, c.grid_price, c.grid_price_ct, 0), feed = WD.price(h, c.feed_in, c.feed_in_ct, 0), CUR = cur();
      this.shadowRoot.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.p === this._period));
      this._renderCC(price);
      this._renderBud(price);
      // Geld
      const p = this._periodVals();
      if (p && p.pv !== null && p.imp !== null && p.exp !== null) {
        const self = Math.max(0, p.pv - p.exp);
        // grid2: Bezug des zweiten Zählers zählt zum Netzbezug und zum Verbrauch, zu seinem eigenen Preis
        const g2 = p.g2 || 0, price2 = WD.price(h, c.grid2_price, c.grid2_price_ct, price), impT = p.imp + g2, costT = p.imp * price + g2 * price2;
        const cons = c._ac ? p.pv + impT - p.exp : p.pv + impT - p.exp - p.chg + p.dis;
        this._count('pvsav', price > 0 ? self * price : null, self * price < 100 ? 2 : 0);
        this._count('feed', feed > 0 ? p.exp * feed : null, p.exp * feed < 100 ? 2 : 0);
        this._count('cost', price > 0 ? costT : null, costT < 100 ? 2 : 0);
        this._count('aut', cons > 0 ? Math.max(0, Math.min(1, 1 - impT / cons)) * 100 : null, this._dec.q || 0);
        this._f('pvsavSub', T('st.self', { kwh: this._fk(self) }));
        this._f('feedSub', T('st.fed', { kwh: this._fk(p.exp) }));
        this._count('selfc', p.pv > 0 ? Math.max(0, Math.min(1, 1 - p.exp / p.pv)) * 100 : null, this._dec.q || 0);
        this._f('selfcSub', T('st.self', { kwh: this._fk(self) }));
        this._f('costSub', T('st.drawn', { kwh: this._fk(impT) }) + (g2 > 0 && price2 > 0 ? ' · ' + T('st.g2of', { n: esc(c._g2n), eur: fEur(g2 * price2), cur: CUR }) : ''));
        this._f('autSub', T('st.autsub', { self: p.pv > 0 ? this._fp(1 - p.exp / p.pv) : '—', cons: this._fk(cons) }));
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
      const pvT = WD.kwh(h, c.pv_lifetime || c.pv_total, WD.rawUnits(c)), expT = WD.kwh(h, c.grid_export_total, WD.rawUnits(c));
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
      if (M.hist[k]) { el.innerHTML = `<b>${MONL[i]} ${cy}</b> · PV <b>${this._fk(M.pvC[k])} kWh</b> (${esc(this._c.pv_history_name || T('st.hist'))})`; return; }
      const cons = M.pv[k] + (M.imp[k] || 0) - (M.exp[k] || 0) - (this._c._ac ? 0 : (M.chg[k] || 0) - (M.dis[k] || 0));
      const aut = cons > 0 ? 1 - (M.imp[k] || 0) / cons : null;
      // Im laufenden Monat stünden angefangene Tage gegen den ganzen Vorjahresmonat (#14)
      const running = k === key(new Date().getFullYear(), new Date().getMonth());
      const d = M.pvC[kp] && !running ? (M.pv[k] - M.pvC[kp]) / M.pvC[kp] : null;
      el.innerHTML = `<b>${MONL[i]} ${cy}</b> · PV <b>${this._fk(M.pv[k])} kWh</b>${d !== null ? ` (${d >= 0 ? '+' : '−'}${nf(Math.abs(d) * 100, 0)} % ${T('st.vsprev')})` : ''} · ${T('st.import')} ${this._fk(M.imp[k])} kWh · ${T('st.export')} ${this._fk(M.exp[k])} kWh · ${T('st.aut')} <b>${this._fp(aut)}</b>`;
    }
  }

  if (!customElements.get('energy-cockpit-stats-card')) {
    customElements.define('energy-cockpit-stats-card', EnergyCockpitStatsCard);
    window.customCards = window.customCards || [];
    window.customCards.push({ type: 'energy-cockpit-stats-card', name: 'energy-cockpit Statistik', description: 'Geld, Amortisation, Grundlast, Monatsvergleich, Akku', preview: true });
  }
})();


/* ---- stats-editor.js ---- */
/* Editor der Statistik-Karte: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const LABELS = {
    title: 'Titel', pv_total: 'PV Gesamtertrag (Zähler, kWh)', pv_lifetime: 'PV-Zähler ohne Zurücksetzen für Amortisation (optional, wenn der PV-Zähler täglich auf 0 geht)', decimals: 'Nachkommastellen bei kWh (leer = automatisch)', grid_import_total: 'Netzbezug gesamt (Zähler, kWh)', grid_export_total: 'Einspeisung gesamt (Zähler, kWh)',
    battery_charge_total: 'Batterie geladen gesamt (kWh)', battery_discharge_total: 'Batterie entladen gesamt (kWh)', battery_capacity_kwh: 'Batteriekapazität (kWh)', battery_temp: 'Batterietemperatur',
    pv_today: 'PV heute (kWh)', import_today: 'Netzbezug heute (kWh, nicht der Gesamtverbrauch)', export_today: 'Einspeisung heute (kWh)', charge_today: 'Batterie geladen heute (kWh)', discharge_today: 'Batterie entladen heute (kWh)',
    feed_in_card: 'Kachel Einspeiseerlös', start_period: 'Reiter beim Öffnen', grid2_total: 'Zweiter Zähler gesamt (kWh, optional, z. B. Wärmepumpe)', grid2_name: 'Name des zweiten Zählers', grid2_price: 'Preis des zweiten Zählers (Sensor oder Helfer, pro kWh)', grid2_price_ct: 'oder fester Preis des zweiten Zählers (Cent pro kWh)', budget_kwh: 'Jahresziel Netzbezug (kWh)', budget_profile: 'Soll im Jahresbudget', home_power: 'Hausverbrauch (Leistung, für Grundlast)', grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)', grid_price_ct: 'oder fester Strompreis (Cent pro kWh)', investment_eur: 'Anschaffungskosten der PV-Anlage (Euro, fest)', theme: 'Farbschema', accent: 'Akzentfarbe (z. B. 34,197,94 oder #22c55e)', feed_in_ct: 'oder feste Einspeisevergütung (Cent pro kWh)', investment: 'Anschaffungskosten PV-Anlage (Sensor oder input_number)', earned_before_eur: 'Bereits erwirtschaftet vor Beginn der Zähler (Euro)', earned_before: 'oder bereits erwirtschaftet aus Sensor oder Helfer (Euro)',
    nav_path: 'Weiter-Schaltfläche: Pfad', nav_label: 'Weiter-Schaltfläche: Text', fit_screen: 'Auf Bildschirmhöhe skalieren',
    cost_consumers: 'Kosten je Verbraucher (Liste, siehe Assistent)', grid_price_history: 'Frühere Strompreise (Liste, siehe Assistent)', pv_ac: 'PV-Zähler zählt ohne Akku-Ladung (Hybrid-Wechselrichter)', long_term: 'Langzeit-Ansicht (alle Jahre, Reiter "Gesamt")', pv_history: 'Importierte PV-Historie (Statistik-ID)', pv_history_until: 'Historie gilt bis einschließlich (JJJJ-MM)', pv_history_name: 'Bezeichnung der Historie',
  };
  const ent = (name, d) => ({ name, selector: { entity: d ? { domain: d } : {} } });
  const KEYS = ['pv_total', 'grid_import_total', 'grid_export_total', 'battery_charge_total', 'battery_discharge_total', 'battery_temp', 'pv_today', 'import_today', 'export_today',
    'charge_today', 'discharge_today', 'home_power', 'pv_lifetime', 'grid2_total', 'grid2_price'];

  WD.statsForm = () => ({
    schema: [
      { name: 'title', selector: { text: {} } },
      ...KEYS.map((k) => ent(k, ['sensor'])),
      { name: 'battery_capacity_kwh', selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } } },
      ent('grid_price', ['sensor', 'input_number']), { name: 'grid_price_ct', selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } } },
      ent('feed_in', ['sensor', 'input_number']), { name: 'feed_in_ct', selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } } },
      { name: 'budget_kwh', selector: { number: { min: 0, step: 100, mode: 'box', unit_of_measurement: 'kWh' } } },
      { name: 'budget_profile', selector: { select: { mode: 'dropdown', options: [{ value: 'linear', label: 'Gleichmäßig übers Jahr (Standard)' }, { value: 'history', label: 'Nach dem Verlauf des Vorjahres' }] } } },
      ent('grid2_total', ['sensor']), { name: 'grid2_name', selector: { text: {} } }, ent('grid2_price', ['sensor', 'input_number']), { name: 'grid2_price_ct', selector: { number: { min: 0, max: 200, step: 0.01, mode: 'box' } } },
      { name: 'start_period', selector: { select: { mode: 'dropdown', options: [{ value: 'month', label: 'Monat (Standard)' }, { value: 'day', label: 'Heute' }, { value: 'week', label: 'Woche (mit Verbrauchern)' }, { value: 'year', label: 'Jahr' }] } } },
      { name: 'feed_in_card', selector: { select: { mode: 'dropdown', options: [{ value: 'standard', label: 'Einspeiseerlös (Standard)' }, { value: 'pv_self_consumption', label: 'PV-Eigenverbrauch stattdessen' }, { value: 'hidden', label: 'Ausblenden' }] } } },
      { name: 'investment_eur', selector: { number: { min: 0, max: 1000000, step: 50, mode: 'box' } } },
      { name: 'decimals', selector: { number: { min: 0, max: 3, step: 1, mode: 'box' } } },
      ent('investment', ['sensor', 'input_number']),
      { name: 'earned_before_eur', selector: { number: { min: 0, max: 1000000, step: 1, mode: 'box' } } },
      ent('earned_before', ['sensor', 'input_number']),
      { name: 'pv_ac', selector: { boolean: {} } },
      { name: 'cost_consumers', selector: { object: {} } },
      { name: 'grid_price_history', selector: { object: {} } },
      { name: 'long_term', selector: { boolean: {} } },
      { name: 'pv_history', selector: { text: {} } }, { name: 'pv_history_until', selector: { text: {} } }, { name: 'pv_history_name', selector: { text: {} } },
      { name: 'fit_screen', default: true, selector: { boolean: {} } },
      { name: 'theme', selector: { select: { mode: 'dropdown', options: WD.THEME_OPTIONS } } },
      { name: 'nav_path', selector: { text: {} } }, { name: 'nav_label', selector: { text: {} } },
    ],
    computeLabel: (s) => LABELS[s.name] || s.name,
  });

  const H = (...re) => re;
  const TOTAL = /gesamt|total|lifetime|energie|energy/i;
  const steps = () => [
    { short: 'Zähler', title: 'Gesamtzähler', text: 'Diese drei Zähler sind Pflicht. Sie zählen dauerhaft hoch (kWh seit Inbetriebnahme).', fields: [
      { path: 'pv_total', label: 'PV Gesamtertrag', kind: 'energy', hints: H(/pv|solar|inverter|wechselrichter|ertrag|yield/i, TOTAL) },
      { path: 'grid_import_total', label: 'Netzbezug gesamt', kind: 'energy', hints: H(/import|bezug|verbrauch|consumption|grid/i, TOTAL) },
      { path: 'grid_export_total', label: 'Einspeisung gesamt', kind: 'energy', hints: H(/export|einspeis|feed/i, TOTAL) },
    ] },
    { short: 'Zähler 2', title: 'Zweiter Netzzähler (optional)', text: 'Nur für einen zweiten Zähler mit eigenem Tarif, der Strom bezieht, zum Beispiel eine Wärmepumpe. Sein Bezug zählt zum Netzbezug und zu den Kosten, zu seinem eigenen Preis.', fields: [
      { path: 'grid2_total', label: 'Zweiter Zähler gesamt (kWh)', kind: 'energy', optional: true, hints: H(/waerme|wärme|heiz|pump|zaehler|zähler|energie|energy/i, TOTAL), help: 'Bei drei Phasen den Summen-Sensor nehmen.' },
      { path: 'grid2_name', label: 'Name des zweiten Zählers', kind: 'text', optional: true, help: 'Zum Beispiel Wärmepumpe.' },
      { path: 'grid2_price', label: 'Preis des zweiten Zählers (Sensor oder Helfer, pro kWh)', kind: 'price', optional: true },
      { path: 'grid2_price_ct', label: 'oder fester Preis (Cent pro kWh)', kind: 'number', optional: true, step: '0.01', help: 'Zum Beispiel 25.45. Ohne Preis gilt der normale Strompreis.' },
    ] },
    { short: 'Batterie', title: 'Batterie (optional)', text: 'Für Wirkungsgrad, Vollzyklen und genauere Autarkie.', fields: [
      { path: 'battery_charge_total', label: 'Batterie geladen gesamt', kind: 'energy', optional: true, hints: H(/ladung|charge|geladen/i, /batter|akku/i, TOTAL) },
      { path: 'battery_discharge_total', label: 'Batterie entladen gesamt', kind: 'energy', optional: true, hints: H(/entlad|discharge/i, /batter|akku/i, TOTAL) },
      { path: 'battery_capacity_kwh', label: 'Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'battery_temp', label: 'Batterietemperatur', kind: 'temp', optional: true, hints: H(/batter|akku/i, /temp/i) },
    ] },
    { short: 'Heute', title: 'Tageswerte (optional)', text: 'Für die Ansicht "Heute".', fields: [
      { path: 'pv_ac', label: 'PV-Zähler zählt ohne Akku-Ladung', kind: 'bool', help: 'Für Hybrid-Wechselrichter, deren Zähler nur ihre Abgabe zählen. Zeichen dafür: "Autarkie" ist zu niedrig, oder der Verbrauch wirkt zu klein.' },
      { path: 'pv_today', label: 'PV heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /pv|solar|inverter|ertrag|yield/i) },
      { path: 'import_today', label: 'Netzbezug heute (nicht der Gesamtverbrauch)', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /import|bezug|verbrauch/i) },
      { path: 'export_today', label: 'Einspeisung heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /export|einspeis/i) },
      { path: 'charge_today', label: 'Batterie geladen heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /lad|charge/i) },
      { path: 'discharge_today', label: 'Batterie entladen heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /entlad|discharge/i) },
    ] },
    { short: 'Preise', title: 'Preise, Haus und Anlage (optional)', text: 'Mit Preisen zeigt die Karte Geldwerte. Die Anschaffungskosten ergeben die Amortisation, der Hausverbrauch die nächtliche Grundlast.', fields: [
      { path: 'grid_price', label: 'Strompreis Bezug', kind: 'price', optional: true, hints: H(/bezug|netz|strom|import|grid|price|preis/i) },
      { path: 'grid_price_ct', label: 'oder fester Strompreis (Cent pro kWh)', kind: 'number', optional: true, step: '0.1', help: 'Ohne Sensor oder Helfer: einfach den Preis aus deiner Rechnung eintragen, zum Beispiel 34.' },
      { path: 'grid_price_history.0.until', label: 'Früherer Preis 1: gültig bis (JJJJ-MM-TT)', kind: 'text', optional: true, help: 'Für die Kosten je Verbraucher: So rechnen vergangene Monate mit dem Preis von damals. Danach gilt der Preis oben. Ein Sensor mit Langzeitstatistik, etwa bei dynamischem Tarif, braucht das nicht.' },
      { path: 'grid_price_history.0.ct', label: 'Früherer Preis 1: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_price_history.1.until', label: 'Früherer Preis 2: gültig bis (JJJJ-MM-TT)', kind: 'text', optional: true },
      { path: 'grid_price_history.1.ct', label: 'Früherer Preis 2: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_price_history.2.until', label: 'Früherer Preis 3: gültig bis (JJJJ-MM-TT)', kind: 'text', optional: true },
      { path: 'grid_price_history.2.ct', label: 'Früherer Preis 3: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'feed_in', label: 'Einspeisevergütung', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },
      { path: 'feed_in_ct', label: 'oder feste Einspeisevergütung (Cent pro kWh)', kind: 'number', optional: true, step: '0.1' },
      { path: 'investment_eur', label: 'Anschaffungskosten der PV-Anlage (Euro)', kind: 'number', optional: true, step: '50', help: 'Gesamtpreis der Anlage laut Rechnung, zum Beispiel 18000. Damit berechnet die Karte die Amortisation.' },
      { path: 'investment', label: 'oder Anschaffungskosten aus einem Sensor oder Helfer', kind: 'money', optional: true, hints: H(/anschaff|invest|kosten|cost/i) },
      { path: 'budget_kwh', label: 'Jahresziel für den Netzbezug (kWh)', kind: 'number', optional: true, step: '100', help: 'Optional, zum Beispiel 8000. Die Karte zeigt dann, wie viel vom Jahresziel verbraucht ist, das Soll bis heute und die Hochrechnung.' },
      { path: 'budget_profile', label: 'Soll im Jahresbudget', kind: 'choice', optional: true, options: [{ value: 'linear', label: 'Gleichmäßig übers Jahr (Standard)' }, { value: 'history', label: 'Nach dem Verlauf des Vorjahres' }], help: 'Mit dem Verlauf des Vorjahres steigt das Soll im Winter schneller als im Sommer. Fehlt ein volles Vorjahr, rechnet die Karte gleichmäßig.' },
      { path: 'earned_before_eur', label: 'Bereits erwirtschaftet vor Beginn der Zähler (Euro)', kind: 'number', optional: true, step: '1', help: 'Nur nötig, wenn die Anlage schon lief, bevor Home Assistant die Zähler erfasst hat. Der Betrag wird zur Amortisation addiert.' },
      { path: 'home_power', label: 'Hausverbrauch (Leistung)', kind: 'power', optional: true, hints: H(/haus|home|house|verbrauch|consumption|load/i) },
    ] },
    { short: 'Kosten', title: 'Kosten je Verbraucher (optional)', text: 'Zeigt je Gerät die Netzkosten und was Solar und Akku gespart haben, heute, in dieser Woche, im Monat und im Jahr. Weitere Verbraucher gehen unter "Alle Felder" oder in YAML.', fields: [
      { path: 'cost_consumers.0.name', label: 'Verbraucher 1: Name', kind: 'text', optional: true, help: 'Zum Beispiel E-Auto oder Wärmepumpe. Symbol und Farbe wählt die Karte selbst, in YAML gehen auch eigene.' },
      { path: 'cost_consumers.0.energy', label: 'Verbraucher 1: Energie', kind: 'energy', optional: true, help: 'Gesamtzähler in kWh. Die Karte teilt ihn jede Stunde so auf, wie das Haus gerade versorgt wurde. Das ist eine Schätzung.' },
      { path: 'cost_consumers.0.power', label: 'Verbraucher 1: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.0.grid', label: 'Verbraucher 1: Energie aus dem Netz', kind: 'energy', optional: true, help: 'Nur wenn du eigene Zähler je Quelle hast, zum Beispiel von der Wallbox. Dann misst die Karte, statt zu schätzen, und braucht den Zähler oben nicht.' },
      { path: 'cost_consumers.0.battery', label: 'Verbraucher 1: Energie aus dem Akku', kind: 'energy', optional: true },
      { path: 'cost_consumers.0.pv', label: 'Verbraucher 1: Energie aus PV', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.name', label: 'Verbraucher 2: Name', kind: 'text', optional: true },
      { path: 'cost_consumers.1.energy', label: 'Verbraucher 2: Energie', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.power', label: 'Verbraucher 2: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.1.grid', label: 'Verbraucher 2: Energie aus dem Netz', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.battery', label: 'Verbraucher 2: Energie aus dem Akku', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.pv', label: 'Verbraucher 2: Energie aus PV', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.name', label: 'Verbraucher 3: Name', kind: 'text', optional: true },
      { path: 'cost_consumers.2.energy', label: 'Verbraucher 3: Energie', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.power', label: 'Verbraucher 3: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.2.grid', label: 'Verbraucher 3: Energie aus dem Netz', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.battery', label: 'Verbraucher 3: Energie aus dem Akku', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.pv', label: 'Verbraucher 3: Energie aus PV', kind: 'energy', optional: true },
      { path: 'cost_consumers.3.name', label: 'Verbraucher 4: Name', kind: 'text', optional: true },
      { path: 'cost_consumers.3.energy', label: 'Verbraucher 4: Energie', kind: 'energy', optional: true },
      { path: 'cost_consumers.3.power', label: 'Verbraucher 4: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.3.grid', label: 'Verbraucher 4: Energie aus dem Netz', kind: 'energy', optional: true },
      { path: 'cost_consumers.3.battery', label: 'Verbraucher 4: Energie aus dem Akku', kind: 'energy', optional: true },
      { path: 'cost_consumers.3.pv', label: 'Verbraucher 4: Energie aus PV', kind: 'energy', optional: true },
    ] },
    { short: 'Langzeit', title: 'Langzeit-Ansicht (optional)', text: 'Standardmäßig aus. Eingeschaltet zeigt die Karte alle Jahre aus der Langzeitstatistik von Home Assistant: Jahre blättern, Reiter "Gesamt" und Hinweise auf fehlende Monate. Ausgeschaltet bleibt die Karte wie bisher.', fields: [
      { path: 'long_term', label: 'Langzeit-Ansicht einschalten', kind: 'bool' },
      { path: 'pv_history', label: 'Importierte PV-Historie (nur mit Langzeit-Ansicht)', kind: 'text', optional: true, help: 'Nur für zuvor importierte Altdaten: Statistik-ID eintragen, zum Beispiel sensor:deye_ac_historisch. Die Werte erscheinen nur in den Balken und bei "PV gesamt", Geldwerte und Autarkie bleiben unverändert.' },
      { path: 'pv_history_until', label: 'Historie gilt bis einschließlich (JJJJ-MM)', kind: 'text', optional: true, help: 'Zum Beispiel 2026-04. Ohne Angabe füllt die Historie nur Monate, für die dein PV-Zähler keine Werte hat.' },
      { path: 'pv_history_name', label: 'Bezeichnung der Historie', kind: 'text', optional: true, help: 'Steht in der Legende, zum Beispiel "AC-Abgabe". Sonst "Historie".' },
    ] },
    { short: 'Aussehen', title: 'Farbschema', text: 'Dunkel ist die Voreinstellung. Mit "Automatisch" folgt die Karte dem hellen oder dunklen Design von Home Assistant, "Home Assistant" übernimmt dessen Farben.', fields: [
      { path: 'theme', label: 'Farbschema', kind: 'theme' },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert. Mit "Fertig" siehst du alle Felder.', summary: (c) => [
      `PV gesamt: ${c.pv_total || 'nicht gewählt'}`,
      `Netzbezug gesamt: ${c.grid_import_total || 'nicht gewählt'}`,
      `Einspeisung gesamt: ${c.grid_export_total || 'nicht gewählt'}`,
      `Batterie: ${c.battery_charge_total ? 'ja' : 'nein'}`,
      `Preise: ${c.grid_price || typeof c.grid_price_ct === 'number' ? 'gesetzt' : 'keine'}`,
      `Kosten je Verbraucher: ${c.cost_consumers ? Object.keys(c.cost_consumers).length : 'keine'}`,
      `Langzeit-Ansicht: ${c.long_term ? 'ein' : 'aus'}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-stats-card-editor', {
    needsSetup: (c) => !c.pv_total || !c.grid_import_total || !c.grid_export_total,
    steps,
    form: () => WD.statsForm(),
  });
})();

