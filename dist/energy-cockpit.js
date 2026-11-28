/*! energy-cockpit v0.49.0 - MIT License */
/* ---- common.js ---- */
/* Gemeinsame Helfer für alle energy-cockpit-Karten. Wird im Bundle als globales Objekt WD bereitgestellt. */
const WD = (() => {
  const state = { loc: 'de-DE', lang: 'de', currency: 'EUR', nloc: 'de-DE', group: true, h12: undefined };

  // Sprache, Zahlen- und Zeitformat und Währung. Standard: wie in Home Assistant eingestellt (Profil, Allgemein).
  // cfg.language ('de', 'en', 'nl' oder 'auto') legt die Sprache der Karte fest, unabhängig von Home Assistant
  const LANG_OPTIONS = [{ value: 'auto', label: 'Automatisch, wie Home Assistant (Standard)' }, { value: 'de', label: 'Deutsch' }, { value: 'en', label: 'English' }, { value: 'nl', label: 'Nederlands' }, { value: 'fr', label: 'Français' }, { value: 'fi', label: 'Suomi' }];
  const NUMBER_LOCALES = { comma_decimal: 'en-US', decimal_comma: 'de-DE', space_comma: 'fr-FR', none: 'en-US' };
  const setLocale = (hass, cfg) => {
    if (!hass) return;
    const forced = cfg && typeof cfg.language === 'string' && cfg.language.trim().toLowerCase() !== 'auto' ? cfg.language.trim() : '';
    const requested = forced || (typeof hass.language === 'string' && hass.language ? hass.language : 'de-DE');
    try { state.loc = Intl.getCanonicalLocales(requested)[0] || 'de-DE'; } catch (e) { state.loc = 'de-DE'; }
    const language = state.loc.split('-')[0].toLowerCase();
    state.lang = ['de', 'en', 'nl', 'fr', 'fi'].includes(language) ? language : 'de';
    state.currency = (hass.config && hass.config.currency) || state.currency;
    const hl = hass.locale || {}, nav = (typeof navigator !== 'undefined' && navigator.language) || state.loc;
    state.nloc = hl.number_format === 'system' ? nav : NUMBER_LOCALES[hl.number_format] || state.loc;
    state.group = hl.number_format !== 'none';
    state.h12 = hl.time_format === 'am_pm' ? true : hl.time_format === 'twenty_four' ? false : hl.time_format === 'system' ? new Intl.DateTimeFormat(nav, { hour: 'numeric' }).resolvedOptions().hour12 : undefined;
  };

  const PAL = { pv: '255,197,61', imp: '255,92,122', exp: '52,211,153', bat: '96,165,250', chg: '56,189,248', dis: '96,165,250', home: '34,211,238', mut: '139,151,179', gas: '249,115,22', wat: '59,130,246' };
  const TH = 10;
  // colors (optional, Energiefluss): eigene Farben je Karte. Schluessel: pv, grid_import, grid_export, battery, battery_charge, battery_discharge, home, gas, water.
  // Ohne battery_discharge entlaedt die Batterie in der Farbe der Batterie. Ungueltige Werte werden ignoriert
  const COLOR_KEYS = { pv: 'pv', grid_import: 'imp', grid_export: 'exp', battery: 'bat', battery_charge: 'chg', battery_discharge: 'dis', home: 'home', gas: 'gas', water: 'wat' };
  const palFor = (colors) => {
    const p = Object.assign({}, PAL), o = {};
    if (colors && typeof colors === 'object') {
      Object.keys(COLOR_KEYS).forEach((k) => { const v = accentRgb(colors[k]); if (v) o[COLOR_KEYS[k]] = v; });
    }
    Object.assign(p, o);
    if (o.bat && !o.dis) p.dis = o.bat;
    return { pal: p, set: Object.keys(o).length > 0 };
  };

  // #73: colors auch in Statistik und Geräten: CSS-Variablen nur für gesetzte Schlüssel, z. B. { pv: '--pv' } -> "--pv:r,g,b;"
  const colorVars = (colors, map) => {
    if (!colors || typeof colors !== 'object') return '';
    return Object.keys(map).map((k) => { const v = accentRgb(colors[k]); return v ? map[k] + ':' + v + ';' : ''; }).join('');
  };
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

  // grid_price_times (optional, #105): Preise nach Uhrzeit in ganzen Stunden, jeden Tag gleich. Liste {from, to, ct} (Uhrzeit als Zahl oder "HH:MM"), auch über Mitternacht
  // (zum Beispiel 22 bis 6). Der erste passende Eintrag gilt, sonst der normale Preis. Gibt eine Liste {from, to, eur} zurück, ungültige Einträge fallen weg
  const hourOf = (v) => { if (typeof v === 'number') return v; const m = String(v).trim().match(/^(\d{1,2})(?::(\d{2}))?$/); return m ? +m[1] + (m[2] ? +m[2] / 60 : 0) : NaN; };
  const priceTimes = (l) => (Array.isArray(l) ? l : l && typeof l === 'object' ? Object.keys(l).sort((a, b) => a - b).map((k) => l[k]) : [])
    .filter((x) => x && typeof x === 'object')
    .map((x) => ({ from: hourOf(x.from), to: hourOf(x.to), eur: parseFloat(String(x.ct).replace(',', '.')) / 100 }))
    .filter((x) => isFinite(x.from) && isFinite(x.to) && x.from >= 0 && x.from <= 24 && x.to >= 0 && x.to <= 24 && x.from !== x.to && isFinite(x.eur) && x.eur >= 0);
  // Preis zu einer Uhrzeit (Stunde als Zahl, zum Beispiel 5,5 für 5:30), null außerhalb aller Zeiten
  const timesPrice = (times, hr) => { for (let i = 0; i < times.length; i++) { const t = times[i]; if (t.from < t.to ? hr >= t.from && hr < t.to : hr >= t.from || hr < t.to) return t.eur; } return null; };
  // Preis jetzt: Preis der aktuellen Uhrzeit aus grid_price_times, sonst der normale Preis (Sensor, Helfer oder fester Preis)
  const priceNow = (h, c, def, d) => {
    const t = priceTimes(c && c.grid_price_times), x = d || new Date(), hit = t.length ? timesPrice(t, x.getHours() + x.getMinutes() / 60) : null;
    return hit !== null ? hit : price(h, c && c.grid_price, c && c.grid_price_ct, def);
  };

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
    if (cfg) { el._ecTheme = cfg.theme; el._ecAccent = cfg.accent; el._ecCol = cfg.colors && typeof cfg.colors === 'object' ? cfg.colors : null; }
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
    // #73: colors.text_muted (graue Beschriftungen) und colors.text (Werte, Titel) für jedes Farbschema, z. B. dunkler im hellen Schema
    const col = el._ecCol || {};
    const mu = accentRgb(col.text_muted), tx = accentRgb(col.text);
    if (mu) el.style.setProperty('--mut', mu); else el.style.removeProperty('--mut');
    if (tx) el.style.setProperty('--txt', 'rgb(' + tx + ')'); else el.style.removeProperty('--txt');
  };
  const hhmm = (d) => new Date(d).toLocaleTimeString(state.loc, state.h12 === undefined ? { hour: '2-digit', minute: '2-digit' } : { hour: '2-digit', minute: '2-digit', hour12: state.h12 });
  const clock = (ms) => hhmm(ms);
  const nf = (v, d) => Number(v).toLocaleString(state.nloc, { minimumFractionDigits: d, maximumFractionDigits: d, ...(state.group ? {} : { useGrouping: false }) });
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
      const p = new Intl.NumberFormat(state.nloc, { style: 'currency', currency: state.currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0);
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

  return { state, setLocale, hhmm, LANG_OPTIONS, PAL, palFor, colorVars, TH, rgb, num, watt, kwh, rawUnits, statUnits, val, price, priceTimes, timesPrice, priceNow, THEMES, THEME_OPTIONS, themeCss, applyTheme, clock, nf, splitW, fW, fKwh, fPct, decOf, cur, esc, accentRgb, haNavigate, KA };
})();


/* ---- i18n.js ---- */
/* Texte für Karten; Deutsch ist die Rückfallsprache. */
(() => {
  const L = {
    de: {
      'flow.title': 'Energiefluss', 'flow.pv': 'Solar', 'flow.pv2': 'Solar 2', 'flow.grid2': 'Zweiter Zähler', 'flow.grid': 'Netz', 'flow.battery': 'Batterie', 'flow.home': 'Hausverbrauch',
      'flow.cons_total': 'Verbraucher', 'flow.rest': 'Nicht erfasst', 'flow.grest': 'Rest', 'flow.restpct': '{n} % gemessen', 'flow.soc': 'Ladestand', 'flow.temp': 'Temperatur',
      'flow.next': 'Weiter →', 'flow.error': 'Mindestens pv oder grid konfigurieren',
      'pill.aut': 'Autarkie jetzt', 'pill.self': 'Eigenverbrauch jetzt', 'pv.use.home': 'Haus', 'pv.use.bat': 'Batterie', 'pv.use.grid': 'Netz', 'pv.use.store': 'Speicher',
      'stat.pv': 'Solar heute', 'stat.fc1': 'Solar morgen', 'stat.fc2': 'Solar übermorgen', 'stat.fc0': 'Prognose heute', 'stat.fc1p': 'Prognose morgen', 'stat.fc2p': 'Prognose übermorgen', 'stat.imp': 'Bezug heute', 'stat.exp': 'Einspeisung', 'stat.bat': 'Batterie ± heute', 'stat.aut': 'Autarkie heute',
      'mix.pv': 'Solar', 'mix.bat': 'Batterie', 'mix.grid': 'Netz',
      'tag.offline': 'Offline', 'tag.producing': 'Erzeugung', 'tag.idle': 'Inaktiv', 'tag.balanced': 'Ausgeglichen',
      'tag.import': 'Bezug', 'tag.export': 'Einspeisung', 'tag.standby': 'Inaktiv', 'tag.charging': 'Ladung', 'tag.discharging': 'Entladung', 'tag.passthrough': 'Durchleitung',
      'bat.io': 'Eingang <b>{in}</b> · Ausgang <b>{out}</b>', 'bat.split': ' (Haus <b>{home}</b> · Netz <b>{grid}</b>)', 'bat.shared': 'Gemeinsamer Sensor mit <b>{name}</b>',
      'forecast': 'Prognose', 'forecast.day': 'Prognose heute', 'offline': 'offline',
      'ka.on': '● Wach', 'ka.wait': '☝ Einmal tippen – Bildschirm bleibt an',
      'waste.today': 'Heute', 'waste.tomorrow': 'Morgen',
      'bat.usable_pct': 'nutzbar', 'bat.usable_slow': '<div class="sr"><span>Nutzbar</span> <b>{kwh} kWh</b></div><div class="sr"><span>Laden</span> <b>langsam</b></div>', 'bat.full_at': '<div class="sr"><span>Voll um</span> <b>{time}</b></div><div class="sr"><span>Voll in</span> <b>{dur}</b></div>',
      'bat.last_24': '<div class="sr"><span>Reicht</span> <b>über 24 h</b></div><div class="sr"><span>Nutzbar</span> <b>{kwh} kWh</b></div>', 'bat.last_until': '<div class="sr"><span>Leer um</span> <b>{time}</b></div><div class="sr"><span>Leer in</span> <b>{dur}</b></div>',
      'bat.full': '<div class="sr"><span>Nutzbar</span> <b>{kwh} kWh</b></div>', 'bat.usable': '<div class="sr"><span>Nutzbar</span> <b>{kwh} kWh</b></div><div class="sr"><span>Reserve</span> <b>{res} %</b></div>', 'bat.usable0': '<div class="sr"><span>Nutzbar</span> <b>{kwh} kWh</b></div>',
      'dur.2days': '> 2 Tage',
      'ban.surplus': '{w} Überschuss', 'ban.batfull': 'Batterie voll – ', 'ban.tonet': 'Strom fließt ins Netz · selbst nutzen spart <b>{gain} {cur}/h</b>',
      'ban.running': '{name} läuft', 'ban.fromgrid': '{w} aus dem Netz', 'ban.cost': 'kostet gerade <b>{cost} {cur}/h</b>',
      'ban.batempty': 'Batterie leer', 'ban.batlimit': 'Batterie am Limit',
    },
    en: {},
    nl: {},
  };
  // T('key', { n: 5 }) ersetzt {n}; fehlende Übersetzungen fallen auf Deutsch zurück.
  WD.T = (k, vars) => {
    let s = (L[WD.state.lang] && L[WD.state.lang][k]) || L.de[k] || k;
    if (vars) Object.keys(vars).forEach((v) => { s = s.split('{' + v + '}').join(vars[v]); });
    return s;
  };
  WD.addStrings = (de) => { Object.assign(L.de, de); };
  WD.addTranslations = (language, strings) => {
    if (!L[language]) L[language] = {};
    Object.assign(L[language], strings);
  };
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
      // CO2-Intensitaet (#115), zum Beispiel Electricity Maps: g CO2eq/kWh
      else if (kind === 'co2') ok = dom === 'sensor' && /co2|co₂/i.test(u);
      else if (kind === 'temp') ok = dom === 'sensor' && (u === '°C' || dc === 'temperature');
      else if (kind === 'price') ok = (dom === 'input_number' || dom === 'sensor' || dom === 'number') && (/\/\s*kWh|ct|€|eur/i.test(u) || /preis|price|tarif|verg/i.test(id + ' ' + (a.friendly_name || '')));
      else if (kind === 'money') ok = (dom === 'input_number' || dom === 'sensor' || dom === 'number') && (/€|eur/i.test(u) || /anschaff|invest|kosten|cost/i.test(id + ' ' + (a.friendly_name || '')));
      // Gas: kWh oder m³, Wasser: Liter oder m³, Durchfluss: l/min, m³/h (#65)
      else if (kind === 'gas') ok = dom === 'sensor' && (ENERGY_UNITS.indexOf(u) >= 0 || /^m(³|3)$/.test(u) || dc === 'gas' || dc === 'energy');
      else if (kind === 'water') ok = dom === 'sensor' && (/^(l|L|m³|m3)$/.test(u) || dc === 'water');
      else if (kind === 'flow') ok = dom === 'sensor' && (/^(l|L)\/(min|h|s)$|^m(³|3)\/h$/.test(u) || dc === 'volume_flow_rate');
      else if (kind === 'weather') ok = dom === 'weather';
      else if (kind === 'switch') ok = ['switch', 'light', 'input_boolean'].indexOf(dom) >= 0;
      // Statuskachel (#108): Schalter und Binärsensoren ohne Leistungsmessung
      else if (kind === 'status') ok = ['input_boolean', 'binary_sensor', 'switch', 'light', 'fan', 'lock', 'cover'].indexOf(dom) >= 0;
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
      const write = (arr) => { cfg[f.path] = arr.filter((x) => x[KEY] || (f.statusKey && x[f.statusKey])); emit(); };
      items.forEach((it, i) => {
        const row = el('div', css.box);
        // Statuskachel (ohne Leistungssensor): nur Name und Entfernen
        if (f.statusKey && !it[KEY] && it[f.statusKey]) {
          row.appendChild(el('div', css.help, 'Statuskachel (EIN oder AUS): ' + ((own(hass, it[f.statusKey]) || { name: it[f.statusKey] }).name)));
          const nm0 = el('input', css.input + ';margin-top:6px');
          nm0.placeholder = 'Anzeigename'; nm0.value = it.name || '';
          nm0.addEventListener('change', () => { it.name = nm0.value; write(items); });
          const rm0 = el('button', css.btn, 'Entfernen'); rm0.type = 'button';
          rm0.addEventListener('click', () => { items.splice(i, 1); write(items); render(); });
          row.appendChild(nm0); row.appendChild(rm0); wrap.appendChild(row);
          return;
        }
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
        if (f.invertKey) {
          const ir = el('label', css.help + ';margin-top:8px;display:flex;gap:8px;align-items:center'), ic = document.createElement('input');
          ic.type = 'checkbox'; ic.checked = it[f.invertKey] === true;
          ic.addEventListener('change', () => { if (ic.checked) it[f.invertKey] = true; else delete it[f.invertKey]; write(items); });
          ir.appendChild(ic); ir.appendChild(document.createTextNode(f.invertLabel || 'Vorzeichen umkehren (der Sensor meldet den Verbrauch negativ)'));
          row.appendChild(ir);
        }
        if (f.dailyKey) {
          row.appendChild(el('div', css.help + ';margin-top:8px', f.dailyLabel || 'Tagesverbrauch heute (kWh, optional): eigene Kachel unten in der Karte'));
          const ds = el('select', css.input), d0 = document.createElement('option'); d0.value = ''; d0.textContent = '— keiner —'; ds.appendChild(d0);
          const eall = list(hass, 'energy');
          if (it[f.dailyKey] && !eall.some((e) => e.id === it[f.dailyKey])) { const o = document.createElement('option'); o.value = it[f.dailyKey]; o.textContent = it[f.dailyKey]; ds.appendChild(o); }
          eall.forEach((e) => { const o = document.createElement('option'); o.value = e.id; o.textContent = `${e.name} (${fmtState(e)})`; ds.appendChild(o); });
          ds.value = it[f.dailyKey] || '';
          ds.addEventListener('change', () => { if (ds.value) it[f.dailyKey] = ds.value; else { delete it[f.dailyKey]; delete it[f.dailyFromHomeKey]; } write(items); render(); });
          row.appendChild(ds);
          if (it[f.dailyKey] && f.dailyFromHomeKey) {
            const fr = el('label', css.help + ';margin-top:6px;display:flex;gap:8px;align-items:center'), fc = document.createElement('input');
            fc.type = 'checkbox'; fc.checked = it[f.dailyFromHomeKey] === true;
            fc.addEventListener('change', () => { if (fc.checked) it[f.dailyFromHomeKey] = true; else delete it[f.dailyFromHomeKey]; write(items); });
            fr.appendChild(fc); fr.appendChild(document.createTextNode('Von „Haus heute“ abziehen'));
            row.appendChild(fr);
          }
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
        if (f.statusKey) {
          add.appendChild(el('div', css.help + ';margin-top:10px', f.statusLabel || 'Statuskachel ohne Leistungssensor hinzufügen (zeigt EIN oder AUS, zählt nicht zum Verbrauch):'));
          const ss = el('select', css.input), s0 = document.createElement('option'); s0.value = ''; s0.textContent = '— Schalter oder Binärsensor wählen —'; ss.appendChild(s0);
          list(hass, 'status').forEach((e) => { const o = document.createElement('option'); o.value = e.id; o.textContent = `${e.name} (${fmtState(e)})`; ss.appendChild(o); });
          ss.addEventListener('change', () => {
            if (!ss.value) return;
            const e = list(hass, 'status').find((x) => x.id === ss.value);
            items.push({ name: e ? e.name : '', [f.statusKey]: ss.value, secondary_mode: 'status' });
            write(items); render();
          });
          add.appendChild(ss);
        }
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
  const chg=p>TH,dis=p<-TH,run=chg||dis,accent=chg?PAL.chg:dis?PAL.dis:PAL.bat;
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
    // Fuge zum nächsten Batterie
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
  [[src.pv,PAL.pv],[src.bat,PAL.dis],[src.imp,PAL.imp]].forEach(([v,col])=>{if(!tot||v<=0)return;const e=a+v/tot*Math.PI*2;body+=`<polyline points="${pts(arc(a,e))}" style="fill:none;stroke:rgb(${col});stroke-width:8"/>`;a=e;});
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

/* Gas (#65): Wandtherme mit Flammenfenster. Leuchtet orange, solange sie heizt */
function boiler(on,pre,large,text,label){
  const W=70,D=34,H=100,BASE=34,z1=BASE+H,col=PAL.gas;
  const defs=grad(pre+'bl','#e4e8ee','#bcc4cf')+grad(pre+'br','#a7b0bd','#87919f')+grad(pre+'bt','#f3f5f8','#d7dce3',1,1)+glow(pre+'sh','var(--shadow)',1)+glow(pre+'gl',`rgb(${col})`,.45)+grad(pre+'fo','#ffd27a',`rgb(${col})`);
  let body='';
  const ctr=P(W/2,D/2,0);
  body+=`<ellipse cx="${ctr[0]+4}" cy="${ctr[1]+5}" rx="70" ry="40" fill="url(#${pre}sh)"/>`;
  if(on)body+=`<ellipse cx="${ctr[0]}" cy="${ctr[1]-40}" rx="84" ry="70" fill="url(#${pre}gl)"/>`;
  // Rohre nach unten
  [16,30,44,56].forEach((x,i)=>{body+=seg([x,D/2,0],[x,D/2,BASE],`stroke:${i===1?'#b87333':'var(--alu1)'};stroke-width:4;stroke-linecap:round`);});
  // Gehäuse
  body+=poly([[0,D,BASE],[W,D,BASE],[W,D,z1],[0,D,z1]],`fill:url(#${pre}bl)`);
  body+=poly([[W,D,BASE],[W,0,BASE],[W,0,z1],[W,D,z1]],`fill:url(#${pre}br)`);
  body+=poly([[0,0,z1],[W,0,z1],[W,D,z1],[0,D,z1]],`fill:url(#${pre}bt)`);
  body+=`<polyline points="${pts([[0,D,z1],[W,D,z1],[W,0,z1]])}" style="fill:none;stroke:#fff;stroke-opacity:.7;stroke-width:1"/>`;
  // Front: Fenster mit Flamme, Anzeige
  const o=P(0,D,BASE),y=(v)=>-H+v,fc=on?`url(#${pre}fo)`:'#7b8594';
  let f=`<rect x="4" y="${y(4)}" width="${W-8}" height="${H-8}" rx="3" style="fill:none;stroke:#9aa3b0;stroke-width:1"/>`;
  f+=`<rect x="${W/2-15}" y="${y(18)}" width="30" height="34" rx="4" style="fill:#141a24;stroke:#8d96a3;stroke-width:1.2"/>`;
  f+=`<g transform="translate(${W/2},${y(44)})"${on?' class="d3-lamp" style="animation-duration:1.3s"':''}><path d="M0,-21 C8,-12 11,-5 7,2 C5,6 2,8 0,8 C-2,8 -5,6 -7,2 C-11,-5 -6,-10 -3,-15 C-2,-9 0,-8 1,-9 C3,-12 1,-17 0,-21Z" fill="${fc}"/>${on?'<path d="M0,-6 C3,-2 4,1 2,4 C1,6 -1,6 -2,4 C-4,1 -2,-2 0,-6Z" fill="#fff3c4"/>':''}</g>`;
  f+=`<rect x="12" y="${y(64)}" width="${W-24}" height="16" rx="2" fill="#0a1410"/>`;
  if(large&&text)f+=`<text x="${W/2}" y="${y(75.5)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="rgb(${on?col:'139,151,179'})" style="font-family:inherit;font-variant-numeric:tabular-nums">${text}</text>`;
  f+=`<circle cx="${W-16}" cy="${y(88)}" r="3.2" fill="#55606f"/><circle cx="16" cy="${y(88)}" r="2.4" class="${on?'d3-lamp':''}" fill="${on?`rgb(${col})`:'#55606f'}"/>`;
  body+=`<g transform="matrix(${C},${S},0,1,${o[0].toFixed(1)},${o[1].toFixed(1)})">${f}</g>`;
  const xMin=P(0,D,0)[0]-14,xMax=P(W,0,0)[0]+14,yMin=P(0,0,z1)[1]-8,yMax=P(W,D,0)[1]+14;
  return `<svg viewBox="${xMin.toFixed(1)} ${yMin.toFixed(1)} ${(xMax-xMin).toFixed(1)} ${(yMax-yMin).toFixed(1)}" role="img" aria-label="${WD.esc(label)}"><defs>${defs}</defs>${body}</svg>`;
}

/* Wasser (#65): Wasserzähler in der Leitung. Der Zeiger dreht sich und die Punkte laufen, solange Wasser fließt */
function wmeter(fl,pre,large,text,label){
  const L=92,Y=26,Z=22,R=27,Z1=Z+30,run=fl>0.05,col=PAL.wat;
  const dur=Math.max(.6,4-fl/4).toFixed(2)+'s';
  const defs=grad(pre+'ms','#d9a65a','#8c5a22',1,0)+grad(pre+'mt','#f2c879','#b67a33',1,1)+glow(pre+'sh','var(--shadow)',1)+glow(pre+'gl',`rgb(${col})`,.4);
  let body='';
  const ctr=P(L/2,Y,0);
  body+=`<ellipse cx="${ctr[0]+4}" cy="${ctr[1]+4}" rx="84" ry="42" fill="url(#${pre}sh)"/>`;
  if(run)body+=`<ellipse cx="${ctr[0]}" cy="${ctr[1]-22}" rx="84" ry="60" fill="url(#${pre}gl)"/>`;
  // Stützen und Leitung
  [10,L-10].forEach((x)=>{body+=seg([x,Y,0],[x,Y,Z],'stroke:var(--alu1);stroke-width:4;stroke-linecap:round');});
  body+=seg([0,Y,Z],[L,Y,Z],'stroke:#3b4a60;stroke-width:14;stroke-linecap:round');
  body+=seg([0,Y,Z+2],[L,Y,Z+2],'stroke:#7d8da3;stroke-width:3;stroke-linecap:round;stroke-opacity:.8');
  if(run){const a=P(0,Y,Z+3),b=P(L,Y,Z+3);body+=`<line class="d3-fl" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgb(${col})" style="animation-duration:${(parseFloat(dur)/3).toFixed(2)}s"/>`;}
  // Zählergehäuse: Zylinder aus Messing mit Zifferblatt
  const rx=R*1.2247,ry=R*.7071,b0=P(L/2,Y,Z-6),t0=P(L/2,Y,Z1);
  body+=`<ellipse cx="${b0[0].toFixed(1)}" cy="${b0[1].toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="#6e4618"/>`;
  body+=`<rect x="${(b0[0]-rx).toFixed(1)}" y="${t0[1].toFixed(1)}" width="${(2*rx).toFixed(1)}" height="${(b0[1]-t0[1]).toFixed(1)}" fill="url(#${pre}ms)"/>`;
  body+=`<ellipse cx="${t0[0].toFixed(1)}" cy="${t0[1].toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="url(#${pre}mt)"/>`;
  body+=`<ellipse cx="${t0[0].toFixed(1)}" cy="${t0[1].toFixed(1)}" rx="${(rx*.78).toFixed(1)}" ry="${(ry*.78).toFixed(1)}" fill="#e9eef5" stroke="#5b4320" stroke-width="1"/>`;
  // Zeiger in der Ebene des Zifferblatts
  body+=`<g transform="translate(${t0[0].toFixed(1)},${t0[1].toFixed(1)}) scale(1.2247,.7071)"><g${run?` class="d3-spin" style="animation-duration:${dur}"`:''}><polygon points="0,-12 2.2,0 -2.2,0" fill="#d23c3c"/><circle r="2.2" fill="#2b2f36"/></g>${[0,1,2,3,4,5,6,7].map((i)=>{const a=i*Math.PI/4;return `<line x1="${(Math.cos(a)*13).toFixed(1)}" y1="${(Math.sin(a)*13).toFixed(1)}" x2="${(Math.cos(a)*15).toFixed(1)}" y2="${(Math.sin(a)*15).toFixed(1)}" stroke="#5b6472" stroke-width="1.2"/>`;}).join('')}</g>`;
  const xMin=Math.min(P(0,Y+8,Z)[0],t0[0]-rx)-12,xMax=Math.max(P(L,Y-8,Z)[0],t0[0]+rx)+12,yMin=t0[1]-ry-10,yMax=Math.max(P(L,Y,0)[1],b0[1]+ry)+14;
  return `<svg viewBox="${xMin.toFixed(1)} ${yMin.toFixed(1)} ${(xMax-xMin).toFixed(1)} ${(yMax-yMin).toFixed(1)}" role="img" aria-label="${WD.esc(label)}"><defs>${defs}</defs>${body}</svg>`;
}

const css = '.s3d{--hl0:#46536b;--hl1:#262f42;--hr0:#2a3448;--hr1:#161d2b;--ht0:#5a6880;--ht1:#3c485e;--edge:rgba(255,255,255,.34);--slot:#080c14;--hole:#05080f;--wall:#111827;--alu0:#aeb9ca;--alu1:#5c6a80;--ink:#06101f;--shadow:rgba(0,0,0,.6);--rf0:#8a4a3c;--rf1:#54291f;--wl0:#d9d5ca;--wl1:#b4b0a5;--wr0:#8d8a81;--wr1:#6f6c64;--plinth:#4a4d55;--path:rgba(255,255,255,.14);--terrace:#6a6e76;--step:#7c8089}\n:host([data-theme="hell"]) .s3d,:host([data-theme="warm"]) .s3d{--hl0:#fbfcfe;--hl1:#d4dbe6;--hr0:#c2ccd9;--hr1:#9aa6b8;--ht0:#ffffff;--ht1:#e8ecf3;--edge:rgba(255,255,255,.9);--slot:#5d6a7e;--hole:#1a2233;--wall:#2a3448;--alu0:#c9d2de;--alu1:#7d8a9e;--shadow:rgba(15,23,42,.3);--rf0:#a8574a;--rf1:#7c3d33;--wl0:#fffdf7;--wl1:#e4dfd3;--wr0:#bdb8ac;--wr1:#a09b8f;--plinth:#737780;--path:rgba(15,23,42,.14);--terrace:#a7abb3;--step:#b8bcc4}\n.s3d .node{display:grid;grid-template-columns:minmax(0,calc(132px*min(var(--ts,1),1.4))) minmax(0,1fr);column-gap:14px;align-content:center}\n.s3d .node>*{grid-column:2}\n.s3d .node>.o3d{grid-column:1;grid-row:1 / span 7;align-self:center;min-width:0}\n.s3d .o3d svg{display:block;width:100%;height:auto;overflow:visible}\n.s3d .node .ico,.s3d .soc{display:none}\n.s3d .tag{justify-self:start}\n.s3d .soc-row{gap:6px}\n.s3d .soc-row b{white-space:nowrap}\n.s3d.cmp .node{grid-template-columns:calc(52px*min(var(--ts,1),1.4)) minmax(0,1fr);column-gap:9px}\n.s3d.cmp .node>*{grid-column:2}\n.s3d.cmp .node>.o3d{grid-column:1;grid-row:1 / span 7}\n.s3d.cmp .node>.o3d svg{height:auto;margin-bottom:0}\n.s3d .node.d3tall{grid-template-columns:minmax(0,1fr)}\n.s3d .node.d3tall>*,.s3d .node.d3tall>.o3d{grid-column:1;grid-row:auto}\n.s3d .node.d3tall>.o3d svg{height:calc(112px*min(var(--ts,1),1.9));margin-bottom:6px}\n.s3d.cmp .node.d3tall>.o3d svg{height:calc(60px*min(var(--ts,1),1.9));margin-bottom:4px}\n.s3d .hub{display:flex;flex-direction:column;max-width:340px}\n.wide.s3d .hub{max-width:460px}\n.wide.s3d .layout{row-gap:72px}\n.s3d .hub:before,.s3d .hub>svg{display:none}\n.s3d .hub .o3d svg{position:static;transform:none;height:auto}\n.s3d.cmp .hub{max-width:240px}\n.s3d .core{position:static;order:-1;background:none;border:0;box-shadow:none;animation:none;padding:0;margin-bottom:2px}\n.s3d .core ha-icon{display:none}\n.s3d .hub-wrap .mix{order:-1;margin:0 0 6px}\n.s3d .link[data-l^="r:"]:not(.on){display:none}\n.d3-band{animation:d3rise var(--dur) linear infinite;animation-delay:var(--dl)}\n@keyframes d3rise{0%{transform:translateY(0);opacity:0}12%{opacity:.75}88%{opacity:.75}100%{transform:translateY(var(--d));opacity:0}}\n.d3-band.rev{animation-direction:reverse}\n.d3-lamp{animation:d3lamp 2.2s ease-in-out infinite}\n.d3-spin{animation:d3spin 2s linear infinite;transform-origin:0 0}\n@keyframes d3spin{to{transform:rotate(360deg)}}\n@keyframes d3lamp{50%{opacity:.4}}\n.d3-sheen{animation:d3sheen var(--dur) ease-in-out infinite}\n@keyframes d3sheen{from{transform:translate(0,0)}to{transform:translate(var(--dx),var(--dy))}}\n.d3-fl{fill:none;stroke-width:2.2;stroke-linecap:round;stroke-dasharray:1.5 11;animation:d3flow 1.1s linear infinite}\n@keyframes d3flow{to{stroke-dashoffset:-12.5}}\n.anim-off .d3-band,.anim-off .d3-lamp,.anim-off .d3-sheen,.anim-off .d3-fl,.anim-off .d3-spin{animation:none}.anim-off .d3-band,.anim-off .d3-sheen{opacity:0}@media (prefers-reduced-motion:reduce){.wrap:not(.anim-on) .d3-band,.wrap:not(.anim-on) .d3-lamp,.wrap:not(.anim-on) .d3-sheen,.wrap:not(.anim-on) .d3-fl,.wrap:not(.anim-on) .d3-spin{animation:none}.wrap:not(.anim-on) .d3-band,.wrap:not(.anim-on) .d3-sheen{opacity:0}}';
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
  return `--rf0:${pair[0]};--rf1:${pair[1]};`;
};
// Maße des Rings aus house() (R = 92): für den Anschluss der Linien in der Karte
const ring = { w: 2 * (92 * 1.23 + 6), bottom: 92 * 0.71 + 8, rx: 92 * Math.SQRT2 * C, ry: 92 * Math.SQRT2 * S };
WD.D3 = { stack, solar, meter, house, boiler, wmeter, css, draw, ring, roof };
})();


/* ---- flow-card.js ---- */
/* energy-cockpit-flow-card: animierter Energiefluss. Hilfsfunktionen kommen aus common.js und i18n.js. */
(() => {
WD.addStrings({ 'stat.cdaily': '{n} heute', 'pv.wkwp': 'Je kWp', 'grid.fossil': 'Fossil', 'stat.home.excl': 'Haus heute ohne {n}', 'status.on': 'EIN', 'status.off': 'AUS', 'status.unknown': 'Unbekannt', 'why.q.bal': 'Warum kein Netzbezug?', 'why.q.baldis': 'Warum entlädt die Batterie?', 'why.q.balchg': 'Warum lädt die Batterie?', 'why.bal.both': 'Solar liefert {pv} und die Batterie {bat}. Zusammen decken sie das Haus ({home}).', 'why.bal.sun': 'Solar liefert {pv} und deckt das Haus ({home}) allein.', 'why.bal.bat': 'Die Batterie ({soc} %) liefert {bat} und deckt das Haus ({home}) allein.', 'why.bal.low': 'Das Haus braucht gerade kaum Strom ({home}).', 'why.bal.dis': 'Solar reicht allein nicht für {home}. Die Batterie liefert den Rest ({bat}), Ladestand {soc} %.', 'why.bal.chg': 'Solar liefert mehr, als das Haus braucht. Der Überschuss ({w}) lädt die Batterie.', 'why.imp': 'Warum {w} Netzbezug?', 'why.exp': 'Warum {w} Einspeisung?', 'why.bal': 'Netz ausgeglichen', 'why.asof': 'Stand {t} Uhr', 'why.cover': 'Das Haus braucht {home}. Gedeckt von: {parts}', 'why.solar': 'Solar', 'why.batt': 'Batterie', 'why.grid': 'Netz', 'why.bm': 'Speicher lädt', 'why.row.pv': 'Solar erzeugt', 'why.row.home': 'Haus braucht', 'why.row.chg': 'Batterie lädt', 'why.row.exp': 'Einspeisung', 'why.q.bat': 'Warum nicht aus der Batterie?', 'why.q.sun': 'Warum nicht Solar?', 'why.q.feed': 'Warum nicht in die Batterie?', 'why.q.tip': 'Tipp', 'why.q.hint': 'Hinweis', 'why.bat.empty': 'Die Batterie ist leer ({soc} %, Entladegrenze {res} %).', 'why.bat.idle': 'Die Batterie hat {soc} %, gibt aber gerade keinen Strom ab. Betriebsart oder Sperrzeit im Speicher prüfen.', 'why.bat.dis': 'Die Batterie liefert bereits {w}.', 'why.sun.night': 'Es ist Nacht. Sonnenaufgang um {t} Uhr.', 'why.sun.fc': ' Prognose morgen {kwh} kWh.', 'why.sun.low': 'Solar liefert gerade nur {w}.', 'why.sun.zero': 'Solar liefert gerade nichts.', 'why.sun.wx': ' Wetter: {cnd}.', 'why.sun.part': 'Solar liefert {pv}, das reicht nicht für {home}.', 'why.rest': 'Ein großer Teil ({w}) ist keinem Verbraucher zugeordnet. Trage weitere Verbraucher in die Karte ein.', 'why.full': 'Die Batterie ist voll ({soc} %) und lädt nicht mehr.', 'why.notfull': 'Die Batterie lädt gerade nicht, obwohl noch Platz ist ({soc} %). Betriebsart im Speicher prüfen.', 'why.charging': 'Die Batterie lädt bereits mit {w}.', 'why.tip.sug': '{w} Überschuss: Jetzt passt {names}.', 'why.bal.txt': 'Solar und Batterie decken das Haus ({home}), ohne Netz.', 'why.none': 'Gerade keine Daten für eine Erklärung.', 'why.top': 'davon {n} {w}', 'bat.in2': ' (Solar 2 <b>{pv}</b> · Haus <b>{ac}</b>)', 'xt.alarm': 'Alarm', 'sky.sunny': 'Sonnig', 'sky.clear-night': 'Klare Nacht', 'sky.partlycloudy': 'Teils bewölkt', 'sky.cloudy': 'Bewölkt', 'sky.fog': 'Nebel', 'sky.rainy': 'Regen', 'sky.pouring': 'Starkregen', 'sky.snowy': 'Schnee', 'sky.snowy-rainy': 'Schneeregen', 'sky.lightning': 'Gewitter', 'sky.lightning-rainy': 'Gewitter mit Regen', 'sky.hail': 'Hagel', 'sky.windy': 'Windig', 'sky.windy-variant': 'Windig und bewölkt', 'sky.exceptional': 'Ausnahmewetter', 'sky.cloud': 'Bewölkung', 'sky.wind': 'Wind', 'sky.nofc': 'Keine Vorhersage von der Wetter-Entität', 'ban.tonet0': 'Strom fließt ins Netz', 'stat.home': 'Haus heute', 'close': 'Schließen' });
// Warum? für Solar und Batterie (#50)
WD.addStrings({
  'why.aria.pv': 'Warum liefert Solar gerade so viel?', 'why.aria.bat': 'Was macht die Batterie gerade?',
  'why.pv.t': 'Solar liefert gerade {w}', 'why.pv.t0': 'Solar liefert gerade nichts',
  'why.pv.q.low': 'Warum so wenig?', 'why.pv.q.day': 'Wie viel ist das heute?', 'why.pv.q.full': 'Warum geht Solar ins Netz?', 'why.pv.q.part': 'Reicht Solar fürs Haus?',
  'why.pv.elev': 'Die Sonne steht nur {deg}° über dem Horizont, die Module bekommen wenig Licht.',
  'why.pv.cloud': ' Der Himmel ist zu {pct} % bewölkt.',
  'why.pv.day': 'Heute bisher {kwh} kWh.', 'why.pv.dayfc': 'Heute bisher {kwh} kWh, Prognose für den ganzen Tag {fc} kWh.',
  'why.pv.full': 'Das Haus braucht weniger, als Solar liefert, und die Batterie nimmt nichts mehr auf. Der Rest geht ins Netz.',
  'why.pv.nobat': 'Das Haus braucht weniger, als Solar liefert. Der Rest geht ins Netz.',
  'why.bt.chg': '{n} lädt mit {w}', 'why.bt.dis': '{n} liefert {w}', 'why.bt.idle': '{n} ist gerade inaktiv',
  'why.bt.lim': 'Ladestand {soc} %, Entladegrenze {res} %, Maximalladung {max} %',
  'why.bt.q.src': 'Woher kommt die Ladung?', 'why.bt.q.idle': 'Warum tut die Batterie nichts?',
  'why.bt.src.sun': 'Die Ladung kommt aus dem Solarüberschuss.', 'why.bt.src.grid': 'Solar reicht nicht für Haus und Batterie, die Batterie lädt auch aus dem Netz. Das ist gewollt, wenn du im Speicher eine Netzladung oder einen günstigen Tarif eingestellt hast.',
  'why.bt.nothing': 'Es gibt gerade weder Solarüberschuss noch Strombedarf, den die Batterie decken müsste.',
  'why.bt.row.pv': 'aus Solar', 'why.bt.row.grid': 'aus dem Netz',
});
// Gas und Wasser (#65): eigene Kacheln mit Linie zum Haus, zählen nicht zum Strom
WD.addStrings({ 'flow.via.miss': '⚠ „Solar läuft durch den Speicher“ braucht noch die Ausgangsleistung ins Haus (<b>battery.power_out</b>), bis dahin gilt die normale Darstellung.' });
WD.addStrings({ 'bat.io.pv': 'Solar-Eingang <b>{in}</b> · Ausgang <b>{out}</b>', 'bat.gridchg': 'Laden vom Netz', 'bat.selfuse': 'Eigenbedarf', 'flow.gas': 'Gas', 'flow.oil': 'Öl', 'flow.water': 'Wasser', 'gas.heat': 'Heizung', 'gas.hw': 'Warmwasser', 'gas.today': 'Heute', 'tag.gas.on': 'Heizt', 'tag.water.on': 'Fließt', 'tag.today': 'Heute' });
const { PAL, TH, rgb, num, watt, kwh, rawUnits, val, clock, nf, splitW, fW, fKwh, fPct, fDur, cur, esc, haNavigate, KA, T, setLocale } = WD;
// Gas in kWh: kWh, Wh, MWh direkt, m³ nur mit kwh_per_m3 (sonst null und die Karte zeigt m³)
// Heizöl (oil): Liter statt m³. kWh-Sensoren werden mit kwh_per_l (Standard 10) in Liter umgerechnet, m3 trägt dann die Liter
const gasVal = (h, id, f, oil) => {
  const s = id && h.states[id];
  if (!s) return null;
  const v = parseFloat(s.state);
  if (isNaN(v)) return null;
  const u = String(s.attributes.unit_of_measurement || '').trim();
  if (oil) {
    if (/^(l|liter|litre|liters|litres)$/i.test(u)) return { kwh: f > 0 ? v * f : null, m3: v };
    if (/^(m³|m3|m\^3)$/i.test(u)) return { kwh: f > 0 ? v * 1000 * f : null, m3: v * 1000 };
    const kwh = /^wh$/i.test(u) ? v / 1000 : /^mwh$/i.test(u) ? v * 1000 : v;
    return { kwh, m3: f > 0 ? kwh / f : null };
  }
  if (/^kwh$/i.test(u)) return { kwh: v, m3: null };
  if (/^wh$/i.test(u)) return { kwh: v / 1000, m3: null };
  if (/^mwh$/i.test(u)) return { kwh: v * 1000, m3: null };
  if (/^(m³|m3|m\^3)$/i.test(u)) return { kwh: f > 0 ? v * f : null, m3: v };
  return { kwh: v, m3: null };
};
// Wasser in Litern (L, l, m³) und Durchfluss in l/min (l/min, L/h, m³/h)
const waterL = (h, id) => {
  const s = id && h.states[id];
  if (!s) return null;
  const v = parseFloat(s.state);
  if (isNaN(v)) return null;
  const u = String(s.attributes.unit_of_measurement || '').trim();
  return /^(m³|m3|m\^3)$/i.test(u) ? v * 1000 : v;
};
const flowLmin = (h, id) => {
  const s = id && h.states[id];
  if (!s) return null;
  const v = parseFloat(s.state);
  if (isNaN(v)) return null;
  const u = String(s.attributes.unit_of_measurement || '').trim().toLowerCase();
  if (/^(m³|m3)\/h$/.test(u)) return v * 1000 / 60;
  if (/^l\/h$/.test(u)) return v / 60;
  if (/^l\/s$/.test(u)) return v * 60;
  return v;
};
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
.clock{font-variant-numeric:tabular-nums;color:var(--mut);font-weight:500;margin-left:12px;font-size:1em}
.pill{font-size:calc(.74rem*var(--ts,1));color:rgb(var(--mut));padding:6px 11px;border-radius:999px;background:var(--glass);border:1px solid var(--stroke)}
.pill b{color:var(--txt);font-weight:650;font-variant-numeric:tabular-nums;margin-left:4px}
.pill.pd:before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:7px;vertical-align:middle;position:relative;top:-1px;background:rgb(var(--c));box-shadow:0 0 0 1px rgba(var(--c),.35)}
.sky{margin:-12px 0 18px;padding:0 2px;cursor:pointer;position:relative;-webkit-tap-highlight-color:transparent}
.sky[hidden]{display:none}
.sky-bar{position:relative;display:flex;gap:1px;height:6px}
.sky-bar i{flex:1;display:block}
.sky-bar i:first-child{border-radius:4px 0 0 4px}
.sky-bar i:last-child{border-radius:0 4px 4px 0}
.sky-now{position:absolute;top:-3px;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:var(--txt);box-shadow:0 0 0 3px rgba(var(--ov),.18)}
.sky-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:7px;font-size:calc(.7rem*var(--ts,1));color:var(--txt);font-variant-numeric:tabular-nums}
.sky-lw{display:inline-flex;align-items:center;min-width:0}
.sky-q{display:inline-flex;align-items:center;justify-content:center;flex:none;width:17px;height:17px;margin-left:7px;border-radius:50%;border:1px solid rgba(var(--home),.4);background:rgba(var(--home),.14);color:rgb(var(--home));font-size:.62rem;font-weight:700;line-height:1}
.sky.open .sky-q{background:rgba(var(--home),.26);border-color:rgba(var(--home),.7)}
.sky-det{display:none;margin-top:10px;padding:10px 12px;border-radius:14px;background:var(--glass);border:1px solid var(--stroke);font-size:calc(.74rem*var(--ts,1));color:rgb(var(--mut))}
.sky.open .sky-det{display:block}
.sky-det b{color:var(--txt);font-weight:650}
.sky-det .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px 12px;margin-top:8px}
.sky-det .g>span{display:flex;flex-direction:column;gap:2px}
.sky-det .g .ht{font-variant-numeric:tabular-nums}
.cmp .sky-bar{display:none}
.cmp .sky{margin:-14px 0 12px}
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
.node:not(.on) .val,.node:not(.on) .n-top>:not(.why){opacity:.7}
.pv{grid-area:pv}.pv2{grid-area:pv2}.grid{grid-area:grid}.bat{grid-area:bat}
.bats{grid-area:bat;display:flex;flex-direction:column;justify-content:center;gap:24px 0;min-width:0}.bats .bat{grid-area:auto}
.narrow .bats{gap:16px 0}
.side{display:flex;flex-direction:column;justify-content:center;gap:24px 0;min-width:0}.side-bat{grid-area:bat}.side-grid{grid-area:grid}.side>.node,.side>.bats{grid-area:auto}
.narrow .side{gap:16px 0}.wrap.cmp .side{gap:10px 0}
.util .sub .sr{flex-wrap:nowrap;column-gap:8px}.util .sub .sr>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.util .sub .sr b{white-space:nowrap;flex:none}
.layout.has-pv2{grid-template-areas:"pv hub bat" "pv2 hub bat" "grid hub bat"}
/* pv_to_battery: direkt: Solar steht über dem Speicher (der Strom läuft durch ihn), das Netz wechselt auf die rechte Seite */
.layout.via-bat{grid-template-areas:"pv hub grid" "bat hub grid";row-gap:44px}
.layout.via-bat.has-pv2{grid-template-areas:"pv2 hub grid" "pv hub grid" "bat hub grid"}
/* grid_side: right: Das Netz steht rechts neben dem Haus (bei Batterie darüber), links bleibt nur Solar. Spart Höhe, wenn rechts sonst nichts steht */
.layout.gr{grid-template-areas:"pv hub grid"}
.layout.gr.has-pv2{grid-template-areas:"pv hub grid" "pv2 hub grid"}
.layout.gr.gr-bat{grid-template-areas:"pv hub grid" "pv hub bat"}
.layout.gr.gr-bat.has-pv2{grid-template-areas:"pv hub grid" "pv2 hub bat"}
.n-top{display:flex;align-items:center;color:rgb(var(--mut));font-size:calc(.7rem*var(--ts,1));text-transform:uppercase;letter-spacing:.1em;font-weight:650}
.ico{width:32px;height:32px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:rgba(var(--c),.16);color:rgb(var(--c));flex:none;margin-right:9px}
.ico ha-icon{--mdc-icon-size:18px;display:flex}
.lbl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.val{margin-top:12px;display:flex;align-items:baseline}
.num{font-size:calc(1.95rem*var(--vs,1));font-weight:750;letter-spacing:-.025em;font-variant-numeric:tabular-nums;line-height:1;color:var(--txt);transition:color .5s}
.node.on .num{color:rgb(var(--c));text-shadow:none}
.unit{font-size:calc(.85rem*var(--vs,1));color:rgb(var(--mut));font-weight:650;margin-left:5px}
.tag{display:inline-flex;margin-top:9px;font-size:calc(.64rem*var(--ts,1));font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:rgba(var(--c),.15);color:rgb(var(--c))}
.tag:empty{display:none}
.sub{margin-top:9px;font-size:calc(.74rem*var(--ts,1));color:rgb(var(--mut));line-height:1.55}
.sub .sr{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;column-gap:12px;min-width:0}
.sub .sr b{color:var(--txt);font-weight:650;font-variant-numeric:tabular-nums;margin-left:auto;max-width:100%;text-align:right;overflow-wrap:anywhere}
.sub:empty{display:none}
.sub b{color:var(--txt);font-weight:600;font-variant-numeric:tabular-nums}
.soc{margin-top:13px;position:relative;height:9px;border-radius:999px;background:rgba(var(--ov),.07);overflow:hidden}
.soc-fill{position:absolute;top:0;left:0;bottom:0;width:0;border-radius:inherit;background:linear-gradient(90deg,rgba(var(--sc,var(--c)),.45),rgb(var(--sc,var(--c))));box-shadow:0 0 0 1px rgba(var(--sc,var(--c)),.35);transition:width 1.2s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.bat.charging .soc-fill:after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent,rgba(var(--ov),.55),transparent);animation:shine 1.8s linear infinite}
@keyframes shine{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.soc-low,.soc-high{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(-45deg,rgba(var(--ov),.22) 0 3px,rgba(var(--ov),.06) 3px 6px);pointer-events:none}
.soc-low{left:0;border-right:1px solid rgba(var(--ov),.5)}
.soc-high{right:0;border-left:1px solid rgba(var(--ov),.5)}
.soc-row{display:flex;flex-wrap:wrap;justify-content:space-between;column-gap:12px;margin-top:7px;font-size:calc(.74rem*var(--ts,1));color:rgb(var(--mut))}
.soc-row b{color:var(--txt);font-weight:650;font-variant-numeric:tabular-nums;margin-left:auto;text-align:right}
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
.core .hico{display:flex;align-items:center;justify-content:center;width:50px;height:50px;border-radius:16px;margin-bottom:6px;color:rgb(var(--hic,var(--home)));background:rgba(var(--hic,var(--home)),.16);transition:color .6s,background .6s}
.core .hico ha-icon{color:inherit;--mdc-icon-size:32px;margin:0;display:flex}
.core .val{margin:0}
.core .num{font-size:calc(2.15rem*var(--vs,1)*var(--hs,1));color:rgb(var(--home));text-shadow:none}
.hub-lbl{font-size:calc(.62rem*var(--ts,1)*var(--hls,1));letter-spacing:.16em;text-transform:uppercase;color:rgb(var(--mut));font-weight:650;margin-top:7px}
.mix{display:flex;font-size:calc(.7rem*var(--ts,1)*var(--hps,1));color:rgb(var(--mut));flex-wrap:wrap;justify-content:center;margin-top:14px}
.mix span{display:flex;align-items:center;margin:0 6px}
.mix i{width:calc(7px*var(--hps,1));height:calc(7px*var(--hps,1));border-radius:50%;background:rgb(var(--c));box-shadow:0 0 0 1px rgba(var(--c),.35);margin-right:5px}
.mix b{color:var(--txt);font-variant-numeric:tabular-nums;font-weight:600;margin-left:4px}
.consumers{position:relative;z-index:1;display:grid;justify-content:center;grid-template-columns:repeat(auto-fit,minmax(max(140px,calc(140px*var(--ts,1))),max(240px,calc(240px*var(--ts,1)))));grid-gap:12px;gap:12px;margin-top:54px}
.cons{display:flex;align-items:center;padding:11px 12px;border-radius:17px;background:var(--glass);border:1px solid var(--stroke);cursor:pointer;transition:all .5s,order 0s;min-width:0}
.cons .ico{margin-right:10px}
.cons.on{border-color:rgba(var(--c),.55);background:rgba(var(--c),.07);box-shadow:0 0 0 1px rgba(var(--c),.35)}
.cons.on .ico,.grp.on .ico{position:relative}
.cons.on .ico:after,.grp.on .ico:after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;border-radius:inherit;box-shadow:0 0 0 1px rgba(var(--c),.35);opacity:0;pointer-events:none;animation:bob 2.4s ease-in-out infinite}
@keyframes bob{50%{opacity:1}}
.cons:not(.on){opacity:.55}
.c-txt{display:flex;flex-direction:column;min-width:0}
.cons .lbl{font-size:calc(.64rem*var(--ts,1));color:rgb(var(--mut));text-transform:uppercase;letter-spacing:.08em;font-weight:650;margin-bottom:3px}
.cons .val{margin:0}
.cons .num{font-size:calc(1.1rem*var(--vs,1))}.cons .unit{font-size:calc(.7rem*var(--vs,1));margin-left:3px}
/* show_share / show_soc: Zahl rechts in der Zeile des Wertes, gleiche Größe und Farbe (Anteil am Hausverbrauch bzw. Ladestand der Batterie) */
.shr{margin-left:auto;padding-left:10px;display:inline-flex;align-items:baseline;white-space:nowrap}
.cons.sh .c-txt{flex:1}
.node.on .shr .num{color:rgb(var(--c))}
.cmp .cons .shr{padding-left:6px}
.cons.on .num{color:rgb(var(--c))}
.c-sec{margin-left:auto;padding-left:6px;font-size:calc(.72rem*var(--ts,1));color:rgb(var(--mut));white-space:nowrap;font-variant-numeric:tabular-nums}
footer{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,max(118px,calc(118px*var(--ts,1)))),1fr));grid-gap:10px;gap:10px;margin-top:20px;padding-top:18px;border-top:1px solid var(--stroke);position:relative}
.stat{display:flex;flex-direction:column;padding:11px 13px;border-radius:15px;background:rgba(var(--ov),.028);border:1px solid rgba(var(--ov),.04)}
.stat span{font-size:calc(.62rem*var(--ts,1));color:rgb(var(--mut));text-transform:uppercase;letter-spacing:.09em;font-weight:650;display:flex;align-items:center;margin-bottom:5px}
.stat span i{flex:none;width:6px;height:6px;border-radius:50%;background:rgb(var(--c));margin-right:6px}
.stat span{min-width:0;overflow-wrap:anywhere;-webkit-hyphens:auto;hyphens:auto}
.stat.fc{cursor:pointer}
.stat.fc span i{background:none;box-shadow:inset 0 0 0 1.5px rgb(var(--c))}
.stat b{font-size:calc(1.1rem*var(--ts,1));font-variant-numeric:tabular-nums;font-weight:700;margin-top:auto}
.stat small{color:rgb(var(--mut));font-weight:500;font-size:.65em;margin-left:3px}
.groups{position:relative;z-index:1;display:grid;grid-gap:10px;gap:10px;margin-top:54px}
.grp{position:relative;padding:10px 10px 8px;border-radius:17px;background:linear-gradient(160deg,rgba(var(--ov),.06),rgba(var(--ov),.012)),var(--panel);border:1px solid var(--stroke);transition:border-color .5s,box-shadow .5s,opacity .5s;min-width:0}
.grp.on{border-color:rgba(var(--c),.6);box-shadow:inset 0 0 0 1px rgba(var(--c),.12),0 0 0 1px rgba(var(--c),.35)}
.grp:not(.on){opacity:.6}
.g-hd{display:flex;align-items:center;min-width:0}
.grp .ico{width:26px;height:26px;border-radius:9px;margin-right:7px}
.grp .ico ha-icon{--mdc-icon-size:15px}
.grp .lbl{font-size:calc(.6rem*var(--ts,1));color:rgb(var(--mut));text-transform:uppercase;letter-spacing:.08em;font-weight:700}
.grp .val{margin-top:7px}
.grp .num{font-size:calc(1.25rem*var(--vs,1))}.grp .unit{font-size:calc(.68rem*var(--vs,1));margin-left:3px}
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
.wide .num{font-size:calc(2.6rem*var(--vs,1))}
.wide .unit{font-size:calc(1rem*var(--vs,1))}
.wide .sub{font-size:calc(.86rem*var(--ts,1))}
.wide .soc-row{font-size:calc(.86rem*var(--ts,1))}
.wide .tag{font-size:calc(.72rem*var(--ts,1));padding:4px 11px}
.wide .hub{max-width:300px}
.wide .core .num{font-size:calc(2.8rem*var(--vs,1)*var(--hs,1))}
.wide .core .hico{width:62px;height:62px;border-radius:19px}
.wide .core .hico ha-icon{--mdc-icon-size:40px}
.wide .hub-lbl{font-size:calc(.72rem*var(--ts,1)*var(--hls,1))}
.wide .mix{font-size:calc(.82rem*var(--ts,1)*var(--hps,1))}
.wide .consumers{grid-template-columns:repeat(auto-fit,minmax(max(200px,calc(200px*var(--ts,1))),max(260px,calc(260px*var(--ts,1)))));gap:14px;margin-top:60px}
.wide .cons{padding:14px 16px;border-radius:20px}
.wide .cons .num{font-size:calc(1.35rem*var(--vs,1))}
.wide .cons .lbl{font-size:calc(.72rem*var(--ts,1))}
.wide .groups{gap:12px;margin-top:60px}
.wide .grp{padding:12px 12px 9px;border-radius:19px}
.wide .grp .num{font-size:calc(1.5rem*var(--vs,1))}
.wide .grp .lbl{font-size:calc(.66rem*var(--ts,1))}
.wide .it{font-size:calc(.72rem*var(--ts,1))}
.wide .stat b{font-size:calc(1.35rem*var(--ts,1))}
.wide .stat span{font-size:calc(.7rem*var(--ts,1))}
/* groups_lines: sammel: eine Linie zum ganzen Verbraucherbereich */
.sam-on .mix{order:-1;margin:0 0 12px}
/* Klassische Ansicht: Legende über dem Ring, dort kommt keine Linie an (unten laufen die Linien zu den Verbrauchern, auf dem Handy zu Solar, Netz und Batterie) */
.wrap:not(.s3d) .mix{order:-1;margin:0 0 12px}
.sambox{position:relative;z-index:1;margin-top:46px;padding:30px 12px 12px;border:1px solid var(--stroke);border-radius:26px;background:rgba(var(--ov),.018)}
.wrap .sambox .consumers,.wrap .sambox .groups{margin-top:0}
.wrap .sambox .consumers+.groups{margin-top:12px}
.sam{position:absolute;top:0;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:9px;padding:7px 16px;border-radius:999px;background:var(--panel);border:1px solid var(--stroke);white-space:nowrap;z-index:2;transition:border-color .5s,box-shadow .5s}
.sam.on{border-color:rgba(var(--home),.6);box-shadow:0 0 0 1px rgba(var(--home),.3)}
.sam-t{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:rgb(var(--mut));font-weight:650}
.sam-w{font-size:1rem;font-weight:700;font-variant-numeric:tabular-nums;color:var(--txt)}
/* Verbraucher-Kacheln decken die Linien ab, die dahinter zum Haus laufen */
.cons{background:linear-gradient(var(--glass),var(--glass)),var(--bg0)}
.cons.on{background:linear-gradient(rgba(var(--c),.07),rgba(var(--c),.07)),linear-gradient(var(--glass),var(--glass)),var(--bg0)}
/* size: gross (je Verbraucher): breite, hervorgehobene Kachel mit grosser Zahl, z. B. Waermepumpe oder Wallbox */
.cons.big{grid-column:span 2;padding:18px 20px;border-radius:22px}
.cons.big .ico{transform:scale(1.4);margin:0 20px 0 6px}
.cons.big .lbl{font-size:calc(.95rem*var(--ts,1));margin-bottom:6px;white-space:normal}
.cons.big .c-sec{font-size:calc(1.1rem*var(--ts,1))}
.cons.big .num{font-size:calc(1.95rem*var(--vs,1))}
.cons.big .unit{font-size:calc(.95rem*var(--vs,1));margin-left:5px}
.wide .cons.big{padding:22px 26px;border-radius:26px}
.wide .cons.big .num{font-size:calc(2.5rem*var(--vs,1))}
.wide .cons.big .unit{font-size:calc(1.1rem*var(--vs,1))}
.wide .cons.big .lbl{font-size:calc(1.05rem*var(--ts,1))}
.wide .cons.big .c-sec{font-size:calc(1.2rem*var(--ts,1))}
/* size: mittel (je Verbraucher): eine Spalte breit, aber mit groesserer Zahl und groesserem Namen */
.cons.mid{padding:14px 16px;border-radius:20px}
.cons.mid .ico{transform:scale(1.2);margin:0 14px 0 4px}
.cons.mid .lbl{font-size:calc(.82rem*var(--ts,1));white-space:normal}
.cons.mid .c-sec{font-size:calc(.95rem*var(--ts,1))}
.cons.mid .num{font-size:calc(1.7rem*var(--vs,1))}
.cons.mid .unit{font-size:calc(.85rem*var(--vs,1))}
.wide .cons.mid{padding:16px 20px;border-radius:22px}
.wide .cons.mid .num{font-size:calc(2rem*var(--vs,1))}
.wide .cons.mid .lbl{font-size:calc(.9rem*var(--ts,1))}
.cmp .cons.mid{padding:8px 10px;border-radius:14px}
.cmp .cons.mid .ico{transform:none;margin:0 10px 0 0}
.cmp .cons.mid .num{font-size:calc(1rem*var(--vs,1))}
.cmp .cons.mid .lbl{font-size:calc(.64rem*var(--ts,1))}
.consumers.hm{grid-template-columns:repeat(auto-fit,minmax(min(100%,max(190px,calc(190px*var(--ts,1)))),max(300px,calc(300px*var(--ts,1)))))}
.wide .consumers.hm{grid-template-columns:repeat(auto-fit,minmax(min(100%,max(250px,calc(250px*var(--ts,1)))),max(340px,calc(340px*var(--ts,1)))))}
.narrow .consumers.hm{grid-template-columns:repeat(auto-fit,minmax(130px,1fr))}
.wrap.cmp .consumers.hm{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))!important}
.narrow .cons.big,.cmp .cons.big{grid-column:auto}
.narrow .cons.big .num{font-size:calc(1.6rem*var(--vs,1))}
.cmp .cons.big{padding:10px 12px}
.cmp .cons.big .num{font-size:calc(1.2rem*var(--vs,1))}
.cmp .cons.big .ico{transform:none;margin:0 10px 0 0}
/* extra / alarm (optional, je Kachel): frei waehlbare Zusatzwerte und ein Alarm, z. B. Spannung, Strom, Temperatur eines Wechselrichters */
.xt{margin-top:10px;font-size:calc(.74rem*var(--ts,1));color:rgb(var(--mut))}
.wide .xt{font-size:calc(.86rem*var(--ts,1))}
.xr{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:3px 0;cursor:pointer;min-width:0}
.xr .xl{display:flex;align-items:center;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.xr .xl ha-icon{--mdc-icon-size:calc(14px*var(--ts,1));margin-right:5px;flex:none}
.xr b{color:var(--txt);font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap}
.xr.warn b{color:rgb(var(--pv))}
.cfgw{margin-top:8px;padding:6px 9px;border-radius:10px;font-size:calc(.7rem*var(--ts,1));line-height:1.35;color:var(--txt);background:rgba(var(--pv),.14);border:1px solid rgba(var(--pv),.45)}
.xa{display:flex;align-items:center;margin-bottom:6px;padding:5px 10px;border-radius:999px;font-size:calc(.7rem*var(--ts,1));font-weight:700;letter-spacing:.04em;color:rgb(var(--imp));background:rgba(var(--imp),.14);border:1px solid rgba(var(--imp),.5);cursor:pointer;width:fit-content;max-width:100%;box-sizing:border-box}
.xa[hidden]{display:none}
.xa:before{content:'';flex:none;width:7px;height:7px;border-radius:50%;background:rgb(var(--imp));margin-right:7px}
.node.alarm{border-color:rgba(var(--imp),.75)!important;box-shadow:0 0 0 1px rgba(var(--imp),.4)!important}
.cmp .xt .xr{display:none}
.cmp .xt{margin-top:6px}
/* why (optional): "?" an der Netz-Kachel, Fenster erklaert Netzbezug oder Einspeisung in Klartext */
.why{position:relative;flex:none;margin-left:auto;width:1.9em;height:1.9em;box-sizing:border-box;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1em;letter-spacing:0;text-transform:none;color:rgb(var(--home));background:rgba(var(--home),.14);border:1px solid rgba(var(--home),.5);cursor:pointer;-webkit-tap-highlight-color:transparent;outline:none}
.why:focus-visible{box-shadow:0 0 0 2px rgba(var(--home),.7)}
.has-why .n-top .lbl{min-width:0;margin-right:8px}
.why:hover{background:rgba(var(--home),.26)}
.why:before{content:'';position:absolute;top:-8px;left:-8px;right:-8px;bottom:-8px}

.wdlg{padding:0;width:min(92vw,470px);max-height:84vh;border-radius:24px;border:1px solid rgba(var(--home),.5);box-shadow:0 0 0 1px rgba(var(--home),.25),0 24px 60px rgba(0,0,0,.5);background:linear-gradient(160deg,rgba(var(--ov),.06),rgba(var(--ov),.012)),var(--panel);color:var(--txt);font-family:inherit}
.wdlg::backdrop{background:rgba(0,0,0,.55)}
.wdlg .wb{padding:6px 18px 18px;overflow:auto;max-height:calc(84vh - 70px)}
.wdlg .wsub{font-size:.8rem;color:rgb(var(--mut));margin:6px 0 10px;line-height:1.45}
.wr{display:flex;align-items:center;gap:10px;margin:8px 0;font-size:.9rem}
.wr .wn{width:36%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wr .wn small{display:block;font-size:.72rem;color:rgb(var(--mut));overflow:hidden;text-overflow:ellipsis}
.wr .wbar{flex:1;height:8px;border-radius:5px;background:rgba(var(--ov),.1);overflow:hidden}
.wr .wbar i{display:block;height:100%;border-radius:5px}
.wr .wv{width:78px;text-align:right;font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap}
.wh{margin-top:14px;padding-top:11px;border-top:1px solid var(--stroke)}
.wh b{display:block;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:rgb(var(--home));margin-bottom:3px}
.wh span{font-size:.88rem;line-height:1.5;color:var(--txt)}
.wh.tip b{color:rgb(var(--exp))}
/* text_size: gross | sehr_gross vergrößert die kleinen Texte (Tablet, Handy). Eine Zahl (z. B. 2) vergrößert zusätzlich die Zahlen in den Kacheln */
.ts-l{--ts:1.25}
.ts-xl{--ts:1.5}
.ts-l .soc-row b,.ts-xl .soc-row b,.ts-l .sub .sr b,.ts-xl .sub .sr b,.ts-l .xr b,.ts-xl .xr b{font-size:1.15em}
.ts-l .cons .lbl,.ts-xl .cons .lbl{white-space:normal;overflow-wrap:anywhere}
/* Smartphone */
.narrow{padding:16px}
.narrow header{margin-bottom:14px;row-gap:8px}
.narrow header .title{flex:1 0 100%;margin-right:0}
.narrow header .pill.pd{flex:1 1 0;min-width:0;text-align:center;margin-left:0;white-space:nowrap}
.narrow header .pill.pd+.pill.pd{margin-left:8px}
.narrow .sky{margin-top:4px}
.narrow .layout{grid-template-columns:1fr 1fr;grid-template-areas:"hub hub" "pv bat" "grid bat";gap:16px 14px}
.narrow .layout.has-pv2{grid-template-areas:"hub hub" "pv bat" "pv2 bat" "grid bat"}
.narrow .layout.gr{grid-template-areas:"hub hub" "pv grid"}
.narrow .layout.gr.has-pv2{grid-template-areas:"hub hub" "pv grid" "pv2 grid"}
.narrow .layout.gr.gr-bat{grid-template-areas:"hub hub" "pv grid" "pv bat"}
.narrow .layout.gr.gr-bat.has-pv2{grid-template-areas:"hub hub" "pv grid" "pv2 bat"}
/* pv_to_battery: direkt auf dem Handy: Solar und Netz nebeneinander, der Speicher darunter (Solar fließt senkrecht in ihn) */
.narrow .layout.via-bat{grid-template-areas:"hub hub" "pv grid" "bat bat";row-gap:34px}
.narrow .layout.via-bat.has-pv2{grid-template-areas:"hub hub" "pv pv2" "bat bat" "grid grid"}
.narrow .via-bat .mix{order:-1;margin:0 0 12px}
.narrow .hub{max-width:210px}
.narrow .num{font-size:calc(1.5rem*var(--vs,1))}
.narrow .core .num{font-size:calc(1.8rem*var(--vs,1)*var(--hs,1))}
.narrow .core .hico{width:40px;height:40px;border-radius:13px}
.narrow .core .hico ha-icon{--mdc-icon-size:26px}
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
.wrap.cmp .layout.gr{grid-template-areas:"pv hub grid"}
.wrap.cmp .layout.gr.has-pv2{grid-template-areas:"pv hub grid" "pv2 hub grid"}
.wrap.cmp .layout.gr.gr-bat{grid-template-areas:"pv hub grid" "pv hub bat"}
.wrap.cmp .layout.gr.gr-bat.has-pv2{grid-template-areas:"pv hub grid" "pv2 hub bat"}
.cmp .node{padding:10px 11px;border-radius:17px}
.cmp .n-top{font-size:calc(.58rem*var(--ts,1));letter-spacing:.06em}
.cmp .ico{width:24px;height:24px;border-radius:8px;margin-right:6px}
.cmp .ico ha-icon{--mdc-icon-size:14px}
.cmp .val{margin-top:7px}
.cmp .num{font-size:calc(1.2rem*var(--vs,1))}
.cmp .unit{font-size:calc(.68rem*var(--vs,1));margin-left:3px}
.cmp .tag{margin-top:6px;font-size:calc(.54rem*var(--ts,1));padding:2px 7px}
.cmp .soc{margin-top:8px;height:7px}
.cmp .soc-row{margin-top:4px;font-size:calc(.66rem*var(--ts,1))}
.cmp .sub:not(.fco),.cmp .soc-row span,.cmp .mix,.cmp .hub-lbl,.cmp .b-sub,.cmp .b-chips,.wrap.cmp .groups .its,.cmp .c-sec{display:none}
.cmp .hub{max-width:130px}
.cmp .core .hico{width:24px;height:24px;border-radius:8px;margin-bottom:2px}
.cmp .core .hico ha-icon{--mdc-icon-size:16px}
.cmp .core .num{font-size:calc(1.1rem*var(--vs,1)*var(--hs,1))}
.cmp .sambox{margin-top:30px;padding:24px 8px 8px;border-radius:20px}
.cmp .sam{padding:5px 12px}
.wrap.cmp .consumers,.wrap.cmp .groups{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))!important;gap:8px;justify-content:stretch}
.cmp .cons{padding:8px 10px;border-radius:14px}
.cmp .cons .num{font-size:calc(1rem*var(--vs,1))}
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
.cmp .grp .num{font-size:calc(1.05rem*var(--vs,1))}
.cmp footer{grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:6px;margin-top:12px;padding-top:12px}
.cmp .stat{padding:7px 8px;border-radius:12px}
.cmp .stat span{font-size:calc(.52rem*var(--ts,1));letter-spacing:.05em;margin-bottom:3px}
.cmp .stat b{font-size:calc(.9rem*var(--ts,1))}
.ico.logo,.grp .ico.logo{width:auto;height:auto;min-width:0;background:none;box-shadow:none;border-radius:6px}
.ico.logo img{display:block;height:28px;max-width:96px;object-fit:contain;border-radius:5px}
.cons .ico.logo img{height:30px;max-width:80px}
/* animations: always (oder immer) animiert auch bei "Bewegung reduzieren" am Gerät */
@media (prefers-reduced-motion:reduce){.wrap:not(.anim-on) .flow,.wrap:not(.anim-on) .orbit,.wrap:not(.anim-on) .node.on:after,.wrap:not(.anim-on) .live:after,.wrap:not(.anim-on) .cons.on .ico:after,.wrap:not(.anim-on) .grp.on .ico:after{animation-duration:0s!important}}
.anim-off .flow,.anim-off .orbit,.anim-off .node.on:after,.anim-off .live:after,.anim-off .cons.on .ico:after,.anim-off .grp.on .ico:after{animation-duration:0s!important}
.ec-paused,.ec-paused *,.ec-paused *::before,.ec-paused *::after{animation-play-state:paused!important}
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
    const gridSet = (g) => !!(g && (g.entity || g.power_import || g.power_export));
    if (!config || ((!config.pv || !config.pv.entity) && !gridSet(config.grid))) {
      // Noch nicht eingerichtet: Hinweisfläche statt Fehlermeldung, der Assistent im Editor hilft weiter
      this._c = null;
      this.shadowRoot.innerHTML = '<style>' + WD.themeCss() + 'ha-card{padding:22px;border-radius:24px;background:var(--panel);color:var(--txt);font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit Energiefluss</b><div style="margin-top:8px;opacity:.8">Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Sensoren auszuwählen.</div></ha-card>';
      return;
    }
    this._c = JSON.parse(JSON.stringify(config));
    // grid.power_import / grid.power_export (optional, #111): zwei Sensoren statt einem mit Vorzeichen. Die Karte rechnet Bezug minus Einspeisung.
    // Für Tippen (Verlauf) und alle Stellen, die nur nach grid.entity fragen, gilt der Bezugssensor als Netz-Sensor
    const gc = this._c.grid;
    if (gc && typeof gc === 'object' && !gc.entity && (gc.power_import || gc.power_export)) { gc._split = true; gc.entity = gc.power_import || gc.power_export; }
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
    // pv.strings und pv2.strings (#101): Lücken aus dem Editor (leere Einträge) fallen weg, die Liste darf auch als Objekt {0:…} vorliegen
    ['pv', 'pv2'].forEach((k) => { const o = this._c[k]; if (o && typeof o === 'object' && o.strings !== undefined) this._c[k] = Object.assign({}, o, { strings: arr(o.strings).filter(used) }); });
    if (bl.length) this._c.battery = bl[0];
    // pv_to_battery: direkt (Speicher vor dem Wechselrichter, z. B. Marstek B2500): nur mit PV-Sensor und Ausgangsleistung des ersten Speichers
    const vb = this._c.pv_to_battery;
    this._via = (vb === 'direkt' || vb === true) && !!(this._c.pv && this._c.pv.entity) && !!(bl[0] && bl[0].power_out);
    this._viaMiss = (vb === 'direkt' || vb === true) && !!(this._c.pv && this._c.pv.entity) && !!bl[0] && !bl[0].power_out;
    // pv2.to_battery: Nummer des Speichers, durch den PV 2 läuft (1 = battery, 2 = erster Eintrag unter batteries, …), z. B. Anker SOLIX Solarbank mit eigenen Modulen
    // und AC-Ladung aus dem Haus (power_in). Der Speicher braucht power_out (AC-Abgabe ins Haus) und gilt als hinter dem Zähler
    const tb = parseInt(this._c.pv2 && this._c.pv2.to_battery, 10);
    this._via2 = this._c.pv2 && this._c.pv2.entity && tb >= 1 && bl[tb - 1] && bl[tb - 1].power_out && !(this._via && tb === 1) ? tb - 1 : -1;
    if (this._via2 >= 0) bl[this._via2].behind_meter = true;
    this._s3d = this._c.style === '3d';
    const pf = WD.palFor(this._c.colors);
    this._pal = pf.pal; this._palSet = pf.set;
    // text_size als Zahl (z. B. 2): Faktor fuer alle Texte und die Zahlen in den Kacheln. gross/sehr_gross bleiben wie bisher
    const tsn = parseFloat(String(this._c.text_size).replace(',', '.'));
    // label_size (optional): Faktor nur fuer die kleinen Texte (Namen, Zusatzwerte, Beschriftungen), unabhaengig von den Zahlen in den Kacheln
    const lsn = parseFloat(String(this._c.label_size).replace(',', '.'));
    this._lsn = !isNaN(lsn) && lsn > 0 ? Math.min(4, Math.max(0.5, lsn)) : 0;
    // home_size (optional, #102): Faktor nur fuer die Zahl ueber dem Haus (und ihre Einheit)
    const hsn = parseFloat(String(this._c.home_size).replace(',', '.'));
    this._hsn = !isNaN(hsn) && hsn > 0 ? Math.min(4, Math.max(0.5, hsn)) : 0;
    // home_label_size / home_percentage_size (optional, #102): Faktor fuer "Hausverbrauch" unter der Zahl bzw. die Prozente (Solar, Batterie, Netz) darueber
    const fac = (v) => { const n = parseFloat(String(v).replace(',', '.')); return !isNaN(n) && n > 0 ? Math.min(4, Math.max(0.5, n)) : 0; };
    this._hls = fac(this._c.home_label_size);
    this._hps = fac(this._c.home_percentage_size);
    this._tsn = !isNaN(tsn) && !/^(normal|gross|sehr_gross)$/.test(String(this._c.text_size)) ? Math.min(4, Math.max(0.5, tsn)) : 0;
    this._c.consumers = arr(this._c.consumers).filter(used);
    this._topCur = null; this._topPend = 0;
    // grid2 (optional, #29): zweiter Netzzähler, z. B. Wärmepumpe mit eigenem Zähler und Tarif (nur Bezug). Erscheint als Kachel bei den Verbrauchern,
    // zählt zum Hausverbrauch und im Ring zum Netz. Der Preis (price oder price_ct) steht als Kosten pro Stunde in der Kachel
    const g2 = this._c.grid2;
    this._c.grid2 = g2 && typeof g2 === 'object' && typeof g2.entity === 'string' && g2.entity ? g2 : null;
    // Derselbe Sensor bei grid und grid2 würde den Bezug doppelt zählen (zum Beispiel bei einer Zählerkaskade): grid2 gilt dann nicht
    if (this._c.grid2 && this._c.grid && this._c.grid.entity && this._c.grid2.entity === this._c.grid.entity) {
      console.warn('energy-cockpit: grid2 nutzt denselben Sensor wie grid (' + this._c.grid2.entity + ') und wird ignoriert, sonst zählt der Bezug doppelt. Bei zwei Zählern in Reihe siehe docs/ZWEI-ZAEHLER.md.');
      this._c.grid2 = null;
    }
    if (this._c.grid2) this._c.consumers.unshift({ entity: g2.entity, name: g2.name || '', icon: g2.icon || 'mdi:heat-pump-outline', color: '#ff5c7a', _g2: true });
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
    setLocale(h, this._c);
    // Sprache aus Home Assistant erst jetzt bekannt: statische Texte neu aufbauen
    if (this._c && this._bl !== WD.state.lang) this._build();
    this._hass = h;
    // #80: Erst mit hass ist die Einheit von pv.forecast bekannt; passt die Anordnung nicht, neu aufbauen
    if (this._c && this._fsw !== undefined && this._fcSwap() !== this._fsw) this._build();
    this._clock();
    this._update();
    this._loadDaily();
    if (this._c && this._c.weather) { if (!this._skyLoading && Date.now() - (this._skyLoaded || 0) > 30 * 60 * 1000) this._loadSky(); this._sky(true); }
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
    c.consumers.forEach((x) => { if (x && x.daily) add(x.daily); });
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
  // Himmelsband (optional, weather): 24 Stunden als Farbstreifen, Punkt = jetzt. Stundenwerte aus weather.get_forecasts, Tageslicht aus sun.sun
  _skyEnt() {
    const w = this._c && this._c.weather, h = this._hass;
    if (!w || !h || !h.states) return null;
    if (typeof w === 'string' && w !== 'auto') return h.states[w] ? w : null;
    return Object.keys(h.states).find((i) => i.indexOf('weather.') === 0) || null;
  }
  async _loadSky() {
    const h = this._hass, id = this._skyEnt();
    if (!h || !id) return;
    this._skyLoading = true;
    let fc = null;
    try {
      const r = await h.callWS({ type: 'call_service', domain: 'weather', service: 'get_forecasts', service_data: { type: 'hourly' }, target: { entity_id: id }, return_response: true });
      const x = r && r.response && r.response[id];
      if (x && Array.isArray(x.forecast)) fc = x.forecast;
    } catch (e) { fc = null; }
    // Ältere Integrationen liefern die Vorhersage noch als Attribut
    if (!fc) { const a = h.states[id] && h.states[id].attributes; if (a && Array.isArray(a.forecast)) fc = a.forecast; }
    this._skyFc = fc; this._skyLoaded = fc ? Date.now() : Date.now() - 25 * 60 * 1000; this._skyLoading = false;
    this._skyKey = null;
    this._sky();
  }
  _sky(onlyIfChanged) {
    const el = this._$('.sky'), h = this._hass, id = this._skyEnt();
    if (!el || !h) return;
    const ws = id && h.states[id];
    if (!ws) { el.hidden = true; return; }
    const sun = h.states['sun.sun'], sa = (sun && sun.attributes) || {};
    const key = [ws.state, ws.attributes.temperature, sa.next_rising, sa.next_setting, this._skyFc && this._skyFc.length].join('|');
    const now = new Date(), minute = now.getHours() * 60 + now.getMinutes();
    if (onlyIfChanged && key === this._skyKey && this._skyMin === minute) return;
    this._skyKey = key; this._skyMin = minute;
    const tod = (v) => { const d = new Date(v); return v && !isNaN(d) ? d.getHours() + d.getMinutes() / 60 : null; };
    const sr = tod(sa.next_rising), ss = tod(sa.next_setting);
    const fmtT = (x) => { let hh = Math.floor(x), mm = Math.round((x - hh) * 60); if (mm === 60) { hh += 1; mm = 0; } return WD.hhmm(new Date(2000, 0, 1, hh, mm)); };
    const COL = { sunny: '#ffc93d', 'clear-night': '#3a4a7a', partlycloudy: 'linear-gradient(#ffc93d 50%,#8d9ab3 50%)', cloudy: '#8d9ab3', fog: '#b7c0cf', rainy: '#4f86d9', pouring: '#2f63c4', snowy: '#cfe3ff', 'snowy-rainy': 'linear-gradient(#cfe3ff 50%,#4f86d9 50%)', lightning: '#8b6fd6', 'lightning-rainy': '#8b6fd6', hail: '#9fc3e8', windy: '#7f95b3', 'windy-variant': '#7f95b3', exceptional: '#e07a5f' };
    const lab = (cnd) => { const k = 'sky.' + cnd, v = T(k); return v === k ? String(cnd || '') : v; };
    const today = now.toDateString(), byHour = {};
    (this._skyFc || []).forEach((f) => { const d = new Date(f.datetime); if (!isNaN(d) && d.toDateString() === today) byHour[d.getHours()] = f; });
    const hasFc = Object.keys(byHour).length > 0;
    const dark = (hr) => sr !== null && ss !== null && (hr + 1 <= sr || hr >= ss);
    let segs = '';
    for (let hr = 0; hr < 24; hr++) {
      const f = byHour[hr], cur = hr === now.getHours();
      let bg;
      if (cur) bg = COL[ws.state] || 'rgba(var(--ov),.3)';
      else if (f && f.condition) bg = COL[f.condition] || 'rgba(var(--ov),.25)';
      else bg = dark(hr) ? 'rgba(var(--ov),.07)' : 'rgba(var(--ov),.2)';
      const op = (cur || f) && dark(hr) ? 0.4 : 1;
      segs += `<i style="background:${bg};opacity:${op}"></i>`;
    }
    this._$('.sky-bar').innerHTML = segs + `<span class="sky-now" style="left:${(minute / 14.4).toFixed(2)}%"></span>`;
    const a = ws.attributes, tu = a.temperature_unit || (h.config && h.config.unit_system && h.config.unit_system.temperature) || '°C';
    const tv = parseFloat(a.temperature);
    this._$('.sky-l').textContent = lab(ws.state) + (isNaN(tv) ? '' : ` · ${nf(tv, 0)} ${tu}`);
    this._$('.sky-r').textContent = sr !== null && ss !== null ? `↑ ${fmtT(sr)}   ↓ ${fmtT(ss)}` : '';
    // Details: Bewölkung, Wind und die nächsten Stunden
    const bits = [];
    if (!isNaN(parseFloat(a.cloud_coverage))) bits.push(`${T('sky.cloud')} <b>${nf(parseFloat(a.cloud_coverage), 0)} %</b>`);
    if (!isNaN(parseFloat(a.wind_speed))) bits.push(`${T('sky.wind')} <b>${nf(parseFloat(a.wind_speed), 0)} ${esc(a.wind_speed_unit || 'km/h')}</b>`);
    const nextH = (this._skyFc || []).filter((f) => new Date(f.datetime) > new Date(now.getTime() - 36e5)).slice(0, 6);
    const rows = nextH.map((f) => {
      const d = new Date(f.datetime), pr = parseFloat(f.precipitation), p = pr > 0 ? ` · ${nf(pr, 1)} mm` : '';
      return `<span><span class="ht">${WD.hhmm(d)}</span><span><b>${isNaN(parseFloat(f.temperature)) ? '' : nf(parseFloat(f.temperature), 0) + '°'}</b> ${esc(lab(f.condition))}${p}</span></span>`;
    }).join('');
    this._$('.sky-det').innerHTML = bits.join(' &nbsp;·&nbsp; ') + (rows ? `<div class="g">${rows}</div>` : (hasFc ? '' : `<div>${T('sky.nofc')}</div>`));
    el.hidden = false;
  }
  // extra / alarm je Kachel (pv, pv2, grid, Speicher): Liste frei waehlbarer Werte und ein Alarm-Sensor
  _xtList(v) { return (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]) : [])).map((x) => (typeof x === 'string' ? { entity: x } : x)).filter((x) => x && typeof x.entity === 'string' && x.entity); }
  _xtAlarm(a) { const x = typeof a === 'string' ? { entity: a } : a; return x && typeof x.entity === 'string' && x.entity ? x : null; }
  _xtHtml(conf) {
    if (!conf || !this._xtC) return '';
    const rows = this._xtList(conf.extra).slice(0, 8), al = this._xtAlarm(conf.alarm);
    if (!rows.length && !al) return '';
    this._xtC.push({ rows, al });
    return `<div class="xt" data-x="${this._xtC.length - 1}">${al ? `<div class="xa" data-e="${esc(al.entity)}" hidden><span class="xat"></span></div>` : ''}${rows.map((r, i) => `<div class="xr" data-i="${i}" data-e="${esc(r.entity)}"><span class="xl">${r.icon ? `<ha-icon icon="${esc(r.icon)}"></ha-icon>` : ''}<span class="xn">${esc(r.name || '')}</span></span><b class="xv">—</b></div>`).join('')}</div>`;
  }
  _xtUpdate() {
    const h = this._hass;
    if (!h || !this._xtC || !this._xtC.length) return;
    this.shadowRoot.querySelectorAll('.xt').forEach((el) => {
      const cfg = this._xtC[+el.dataset.x];
      if (!cfg) return;
      cfg.rows.forEach((r, i) => {
        const row = el.querySelector(`.xr[data-i="${i}"]`), st = h.states && h.states[r.entity];
        if (!row) return;
        // no_name: true oder name: "" zeigt nur den Wert
        const nm = r.no_name === true || r.name === '' ? '' : (r.name || (st && st.attributes && st.attributes.friendly_name) || r.entity);
        if (row.querySelector('.xn').textContent !== nm) row.querySelector('.xn').textContent = nm;
        let txt = '—', warn = false;
        if (st && !['unavailable', 'unknown', ''].includes(st.state)) {
          const v = parseFloat(String(st.state).replace(',', '.'));
          const unit = r.unit !== undefined ? String(r.unit) : (st.attributes && st.attributes.unit_of_measurement) || '';
          if (!isNaN(v) && isFinite(st.state)) {
            const d = r.decimals !== undefined && !isNaN(parseInt(r.decimals)) ? Math.max(0, Math.min(6, parseInt(r.decimals))) : (Number.isInteger(v) ? 0 : (Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2));
            txt = nf(v, d) + (unit ? ' ' + unit : '');
            const wa = parseFloat(r.warn_above), wb = parseFloat(r.warn_below);
            warn = (!isNaN(wa) && v > wa) || (!isNaN(wb) && v < wb);
          } else txt = String(st.state) + (r.unit ? ' ' + r.unit : '');
        }
        const b = row.querySelector('.xv');
        if (b.textContent !== txt) b.textContent = txt;
        row.classList.toggle('warn', warn);
      });
      const chip = el.querySelector('.xa'), node = el.closest('.node');
      if (chip && cfg.al) {
        const st = h.states && h.states[cfg.al.entity], s0 = st ? String(st.state) : '';
        let on = false;
        if (st && !['unavailable', 'unknown'].includes(s0)) {
          const list = (v) => (Array.isArray(v) ? v : (v === undefined || v === null ? null : [v])), norm = (x) => String(x).toLowerCase();
          const onL = list(cfg.al.on), okL = list(cfg.al.ok);
          if (onL) on = onL.map(norm).includes(norm(s0));
          else {
            const ok = (okL || ['off', 'ok', 'normal', 'none', 'false', '0', '', 'idle']).map(norm);
            const n = parseFloat(s0);
            on = !ok.includes(norm(s0)) && !(okL === null && !isNaN(n) && n === 0);
          }
        }
        const bin = ['on', 'off', 'true', 'false'].includes(s0.toLowerCase());
        const name = cfg.al.name || T('xt.alarm');
        chip.hidden = !on;
        const txt = on && !bin ? `${name}: ${(st.attributes && st.attributes.friendly_name && cfg.al.show_name) || s0}` : name;
        const at = chip.querySelector('.xat');
        if (at.textContent !== txt) at.textContent = txt;
        if (node) node.classList.toggle('alarm', on);
      }
    });
  }
  // why: Erklaerung in Klartext, regelbasiert. Wer verursacht den Netzbezug, warum liefert die Batterie nichts, warum kein Solar, warum Einspeisung
  _skyLab(cnd) { const k = 'sky.' + cnd, v = T(k); return v === k ? String(cnd || '') : v; }
  _whyOpen(kind, i) {
    const dl = this._$('.wdlg');
    if (!dl || !this._wy) return;
    this._whyK = { k: kind === 'pv' || kind === 'bat' ? kind : 'grid', i: i || 0 };
    this._whyRender();
    if (dl.showModal) dl.showModal(); else dl.setAttribute('open', '');
  }
  _whyRender() {
    const dl = this._$('.wdlg');
    if (!dl) return;
    const html = this._whyHtml();
    if (dl.dataset.h !== html) { dl.dataset.h = html; dl.innerHTML = html; }
  }
  _whyHtml() {
    const c = this._c, h = this._hass, y = this._wy, fW = (v) => this._fW(v), pct = (v) => Math.round(v);
    if (!y || !h) return `<div class="d-hd"><span class="d-name">${T('why.none')}</span><button class="d-x" aria-label="${T('close')}">×</button></div>`;
    const wk = this._whyK || { k: 'grid', i: 0 };
    if (wk.k === 'pv') return this._whyPv();
    if (wk.k === 'bat') return this._whyBat(wk.i);
    const imp = y.gImp > TH, exp = !imp && y.gExp > TH;
    const items = (this._wyItems || []).filter((x) => x.w >= 5).slice().sort((a, b) => b.w - a.w);
    const known = (this._wyItems || []).reduce((a, x) => a + x.w, 0);
    const rest = Math.max(0, y.home - known - y.bmChg);
    const now = new Date(), clk = WD.hhmm(now);
    const rowsHtml = (rows) => { const max = Math.max(1, ...rows.map((r) => r.w)); return rows.map((r) => `<div class="wr"><span class="wn">${esc(r.n)}${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span><span class="wbar"><i style="width:${Math.max(2, Math.round(r.w / max * 100))}%;background:${r.c}"></i></span><span class="wv">${fW(r.w)}</span></div>`).join(''); };
    const col = (x, d) => `rgb(${rgb(x, d)})`;
    const hint = (q, txt, cls) => (txt ? `<div class="wh${cls ? ' ' + cls : ''}"><b>${q}</b><span>${txt}</span></div>` : '');
    let title, sub = '', rows = [], hints = '';
    const bats = y.bats || [];
    const sunSt = h.states['sun.sun'], night = sunSt && sunSt.state === 'below_horizon';
    const wxId = this._skyEnt(), wx = wxId && h.states[wxId];
    const fcT = this._fcSum('forecast_tomorrow');
    const fmtT = (v) => { const d = new Date(v); return isNaN(d) ? '' : WD.hhmm(d); };
    const consRows = () => {
      const r = items.map((x) => ({ n: x.n, w: x.w, c: col(x.c, '167,139,250'), sub: x.top ? T('why.top', { n: x.top.n, w: fW(x.top.w) }) : '' }));
      if (y.bmChg > TH) r.push({ n: T('why.bm'), w: y.bmChg, c: `rgb(${PAL.chg})` });
      if (rest > TH) r.push({ n: T('flow.rest'), w: rest, c: `rgb(${PAL.mut})` });
      return r;
    };
    const coverParts = (withGrid) => {
      const parts = [];
      if (y.pvHome > TH) parts.push(`${T('why.solar')} ${fW(y.pvHome)}`);
      if (y.bDis > TH) parts.push(`${T('why.batt')} ${fW(y.bDis)}`);
      if (withGrid || y.gImp > 0) parts.push(`${T('why.grid')} ${fW(y.gImp)}`);
      return parts.join(' · ');
    };
    if (imp) {
      title = T('why.imp', { w: fW(y.gImp) });
      rows = consRows();
      sub = T('why.cover', { home: fW(y.home), parts: coverParts(true) });
      // Batterie
      if (bats.length) {
        const b = bats.find((x) => x.soc !== null) || bats[0];
        let t = '';
        if (y.bDis > TH && b) t = T('why.bat.dis', { w: fW(y.bDis) });
        else if (b && b.soc !== null && b.soc <= b.reserve + 1) t = T('why.bat.empty', { soc: pct(b.soc), res: pct(b.reserve) });
        else if (b && b.soc !== null) t = T('why.bat.idle', { soc: pct(b.soc) });
        hints += hint(T('why.q.bat'), t);
      }
      // Solar
      if (c.pv) {
        let t = '';
        if (night) {
          const nr = sunSt.attributes && sunSt.attributes.next_rising;
          t = T('why.sun.night', { t: fmtT(nr) }) + (fcT !== null ? T('why.sun.fc', { kwh: nf(fcT, 0) }) : '');
        } else if (y.pv <= 30) {
          t = (y.pv <= TH ? T('why.sun.zero') : T('why.sun.low', { w: fW(y.pv) })) + (wx ? T('why.sun.wx', { cnd: this._skyLab(wx.state) }) : '');
        } else if (y.pvHome < y.home) {
          t = T('why.sun.part', { pv: fW(y.pv), home: fW(y.home) }) + (wx ? T('why.sun.wx', { cnd: this._skyLab(wx.state) }) : '');
        }
        hints += hint(T('why.q.sun'), t);
      }
      if (rest >= 150 && y.home > 0 && rest / y.home >= 0.25) hints += hint(T('why.q.hint'), T('why.rest', { w: fW(rest) }));
    } else if (exp) {
      title = T('why.exp', { w: fW(y.gExp) });
      const chg = bats.reduce((a, x) => a + Math.max(0, x.p || 0), 0);
      rows = [{ n: T('why.row.pv'), w: y.pv, c: `rgb(${PAL.pv})` }, { n: T('why.row.home'), w: y.home, c: `rgb(${PAL.home})` }];
      if (chg > TH) rows.push({ n: T('why.row.chg'), w: chg, c: `rgb(${PAL.chg})` });
      rows.push({ n: T('why.row.exp'), w: y.gExp, c: `rgb(${PAL.exp})` });
      sub = `${T('why.solar')} ${fW(y.pv)} − ${T('why.row.home')} ${fW(y.home)}${chg > TH ? ` − ${T('why.row.chg')} ${fW(chg)}` : ''} = ${T('why.row.exp')} ${fW(y.gExp)}`;
      if (bats.length) {
        const b = bats.find((x) => x.soc !== null) || bats[0];
        let t = '';
        if (chg > TH) t = T('why.charging', { w: fW(chg) });
        else if (b && b.soc !== null && b.soc >= b.maxSoc - 0.5) t = T('why.full', { soc: pct(b.soc) });
        else if (b && b.soc !== null) t = T('why.notfull', { soc: pct(b.soc) });
        hints += hint(T('why.q.feed'), t);
      }
      const sug = ((c.surplus && c.surplus.suggestions) || []).filter((x) => x && x.name && x.power && x.power <= y.gExp);
      if (sug.length) hints += hint(T('why.q.tip'), T('why.tip.sug', { w: fW(y.gExp), names: sug.map((x) => esc(x.name)).join(' / ') }), 'tip');
    } else {
      title = T('why.bal');
      sub = T('why.cover', { home: fW(y.home), parts: coverParts(false) || T('why.solar') + ' ' + fW(y.home) });
      rows = consRows();
      const b0 = bats.find((x) => x.soc !== null) || bats[0], chgB = bats.reduce((a, x) => a + Math.max(0, x.p || 0), 0);
      const pvN = fW(y.pvHome), batN = fW(y.bDis);
      let tb = '';
      if (y.pvHome > TH && y.bDis > TH) tb = T('why.bal.both', { pv: pvN, bat: batN, home: fW(y.home) });
      else if (y.pvHome > TH) tb = T('why.bal.sun', { pv: pvN, home: fW(y.home) });
      else if (y.bDis > TH) tb = T('why.bal.bat', { soc: b0 && b0.soc !== null ? pct(b0.soc) : '–', bat: batN, home: fW(y.home) });
      else tb = T('why.bal.low', { home: fW(y.home) });
      hints += hint(T('why.q.bal'), tb);
      if (y.pvHome > TH && y.bDis > TH) hints += hint(T('why.q.baldis'), T('why.bal.dis', { home: fW(y.home), bat: batN, soc: b0 && b0.soc !== null ? pct(b0.soc) : '–' }));
      if (chgB > TH) hints += hint(T('why.q.balchg'), T('why.bal.chg', { w: fW(chgB) }));
      if (rest >= 150 && y.home > 0 && rest / y.home >= 0.25) hints += hint(T('why.q.hint'), T('why.rest', { w: fW(rest) }));
    }
    return `<div class="d-hd"><span class="d-name">${esc(title)}</span><button class="d-x" aria-label="${T('close')}">×</button></div><div class="wb"><div class="wsub">${esc(T('why.asof', { t: clk }))}${sub ? ' · ' + esc(sub) : ''}</div>${rowsHtml(rows)}${hints}</div>`;
  }
  // --- Warum? fuer Solar und Batterie (#50): derselbe Dialog wie am Netz, regelbasiert aus den Werten der Karte
  _whyFrame(title, sub, rows, hints) {
    const fW = (v) => this._fW(v), clk = WD.hhmm(new Date());
    const max = Math.max(1, ...rows.map((r) => r.w));
    const rowsHtml = rows.map((r) => `<div class="wr"><span class="wn">${esc(r.n)}</span><span class="wbar"><i style="width:${Math.max(2, Math.round(r.w / max * 100))}%;background:${r.c}"></i></span><span class="wv">${fW(r.w)}</span></div>`).join('');
    return `<div class="d-hd"><span class="d-name">${esc(title)}</span><button class="d-x" aria-label="${T('close')}">×</button></div><div class="wb"><div class="wsub">${esc(T('why.asof', { t: clk }))}${sub ? ' · ' + esc(sub) : ''}</div>${rowsHtml}${hints}</div>`;
  }
  _whyHint(q, txt, cls) { return txt ? `<div class="wh${cls ? ' ' + cls : ''}"><b>${q}</b><span>${txt}</span></div>` : ''; }
  _whyPv() {
    const c = this._c, h = this._hass, y = this._wy, fW = (v) => this._fW(v), pct = (v) => Math.round(v);
    const bats = y.bats || [], pv = y.pv || 0;
    const sunSt = h.states['sun.sun'], night = sunSt && sunSt.state === 'below_horizon';
    const wxId = this._skyEnt(), wx = wxId && h.states[wxId];
    const fmtT = (v) => { const d = new Date(v); return isNaN(d) ? '' : WD.hhmm(d); };
    const chg = bats.reduce((a, x) => a + Math.max(0, x.p || 0), 0);
    const toBat = Math.min(chg, Math.max(0, pv - y.pvHome)), toGrid = Math.max(0, Math.min(y.gExp, pv - y.pvHome - toBat));
    const rows = [];
    if (y.pvHome > TH) rows.push({ n: T('why.row.home'), w: y.pvHome, c: `rgb(${PAL.home})` });
    if (toBat > TH) rows.push({ n: T('why.row.chg'), w: toBat, c: `rgb(${PAL.chg})` });
    if (toGrid > TH) rows.push({ n: T('why.row.exp'), w: toGrid, c: `rgb(${PAL.exp})` });
    const title = pv > TH ? T('why.pv.t', { w: fW(pv) }) : T('why.pv.t0');
    const hint = (q, t, cls) => this._whyHint(q, t, cls);
    let hints = '';
    const wxTxt = wx ? T('why.sun.wx', { cnd: this._skyLab(wx.state) }).trim() : '';
    const cloud = wx && wx.attributes && parseFloat(wx.attributes.cloud_coverage);
    const elev = sunSt && sunSt.attributes ? parseFloat(sunSt.attributes.elevation) : NaN;
    const daily = c.pv && c.pv.daily ? kwh(h, c.pv.daily, rawUnits(c)) : null, fcDay = c.pv && c.pv.forecast ? kwh(h, c.pv.forecast, rawUnits(c)) : null;
    const fcT = this._fcSum('forecast_tomorrow');
    if (night) {
      const nr = sunSt.attributes && sunSt.attributes.next_rising;
      hints += hint(T('why.pv.q.low'), T('why.sun.night', { t: fmtT(nr) }) + (fcT !== null ? T('why.sun.fc', { kwh: nf(fcT, 0) }) : ''));
    } else if (pv <= 30 || (daily !== null && fcDay !== null && fcDay > 0 && pv < 150)) {
      const parts = [];
      if (!isNaN(elev) && elev < 10) parts.push(T('why.pv.elev', { deg: nf(Math.max(0, elev), 0) }));
      if (wxTxt) parts.push(wxTxt + (!isNaN(cloud) && cloud > 0 ? T('why.pv.cloud', { pct: nf(cloud, 0) }) : ''));
      hints += hint(T('why.pv.q.low'), (pv <= TH ? T('why.sun.zero') : T('why.sun.low', { w: fW(pv) })) + (parts.length ? ' ' + parts.join(' ') : ''));
    } else if (y.pvHome < y.home && pv > TH && !bats.some((x) => x.p < -TH) && y.gImp > TH) {
      hints += hint(T('why.pv.q.part'), T('why.sun.part', { pv: fW(pv), home: fW(y.home) }) + (wxTxt ? ' ' + wxTxt : ''));
    }
    if (daily !== null) hints += hint(T('why.pv.q.day'), fcDay !== null && fcDay > 0 ? T('why.pv.dayfc', { kwh: nf(daily, 1), fc: nf(fcDay, 0) }) : T('why.pv.day', { kwh: nf(daily, 1) }));
    if (!night && y.gExp > TH && pv > TH) {
      const full = bats.length && bats.every((x) => x.soc !== null && x.soc >= x.maxSoc - 0.5);
      hints += hint(T('why.pv.q.full'), bats.length ? (full ? T('why.pv.full') : '') : T('why.pv.nobat'));
    }
    return this._whyFrame(title, '', rows, hints);
  }
  _whyBat(i) {
    const c = this._c, h = this._hass, y = this._wy, fW = (v) => this._fW(v), pct = (v) => Math.round(v);
    const bats = y.bats || [], b = bats[Math.min(i || 0, Math.max(0, bats.length - 1))];
    if (!b) return `<div class="d-hd"><span class="d-name">${T('why.none')}</span><button class="d-x" aria-label="${T('close')}">×</button></div>`;
    const p = b.p || 0, chg = Math.max(0, p), dis = Math.max(0, -p), pv = y.pv || 0;
    const hint = (q, t, cls) => this._whyHint(q, t, cls);
    const name = b.n || T('flow.battery');
    const title = chg > TH ? T('why.bt.chg', { n: name, w: fW(chg) }) : dis > TH ? T('why.bt.dis', { n: name, w: fW(dis) }) : T('why.bt.idle', { n: name });
    const sub = b.soc !== null ? T('why.bt.lim', { soc: pct(b.soc), res: pct(b.reserve), max: pct(b.maxSoc) }) : '';
    const rows = [];
    let hints = '';
    if (chg > TH) {
      const sun = Math.min(chg, Math.max(0, pv - y.pvHome)), grid = Math.max(0, chg - sun);
      if (sun > TH) rows.push({ n: T('why.bt.row.pv'), w: sun, c: `rgb(${PAL.pv})` });
      if (grid > TH) rows.push({ n: T('why.bt.row.grid'), w: grid, c: `rgb(${PAL.imp})` });
      hints += hint(T('why.bt.q.src'), grid > TH && y.gImp > TH ? T('why.bt.src.grid') : T('why.bt.src.sun'));
    } else if (dis > TH) {
      const items = (this._wyItems || []).filter((x) => x.w >= 5).slice().sort((a, b2) => b2.w - a.w);
      items.slice(0, 6).forEach((x) => rows.push({ n: x.n, w: x.w, c: `rgb(${rgb(x.c, '167,139,250')})` }));
      if (!rows.length) rows.push({ n: T('why.row.home'), w: Math.min(dis, y.home), c: `rgb(${PAL.home})` });
    } else {
      let t = '';
      if (b.soc !== null && b.soc <= b.reserve + 1) t = T('why.bat.empty', { soc: pct(b.soc), res: pct(b.reserve) });
      else if (b.soc !== null && b.soc >= b.maxSoc - 0.5) t = T('why.full', { soc: pct(b.soc) });
      else if (b.soc !== null && y.gExp > TH) t = T('why.notfull', { soc: pct(b.soc) });
      else if (b.soc !== null && y.gImp > TH) t = T('why.bat.idle', { soc: pct(b.soc) });
      else t = T('why.bt.nothing');
      hints += hint(T('why.bt.q.idle'), t);
    }
    return this._whyFrame(title, sub, rows, hints);
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
    this._clockT = setInterval(() => { this._clock(); this._wasteChip(); this._sky(); }, 15000);
    this._clock();
    this._schedLayout();
    // Nicht sichtbar (weggescrollt, anderer Tab, Bildschirm aus): Animationen anhalten, das spart auf Wandtablets Rechenleistung und Akku
    if (!this._io && window.IntersectionObserver) this._io = new IntersectionObserver((en) => { const e = en[en.length - 1]; this._setVis(!!(e && e.isIntersecting)); });
    if (this._io) this._io.observe(this);
    if (!this._onVis) this._onVis = () => this._setVis(this._ioVis !== false, true);
    document.addEventListener('visibilitychange', this._onVis);
  }
  _animOff() { return !!this._c && ['off', 'aus', 'none', false].includes(this._c.animations); }
  // fromDoc: Aufruf durch visibilitychange (Sichtbarkeit im Fenster bleibt, nur der Tab wechselt)
  _setVis(inView, fromDoc) {
    if (!fromDoc) this._ioVis = inView;
    const vis = inView && document.visibilityState !== 'hidden';
    if (vis === this._vis) return;
    this._vis = vis;
    const w = this._$ && this._$('.wrap');
    if (w) w.classList.toggle('ec-paused', !vis);
    if (!vis) {
      // Laufendes Hochzählen sofort auf den Zielwert setzen
      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
      Object.values(this._tw || {}).forEach((t) => { if (t.from !== undefined && t.target !== null && t.numEl) { t.cur = t.target; t.from = undefined; const [n, u] = this._sw(t.target); t.numEl.textContent = n; t.unitEl.textContent = u; } });
    } else this._schedLayout();
  }
  disconnectedCallback() {
    clearTimeout(this._hT); this._hT = null;
    if (this._io) this._io.disconnect();
    if (this._onVis) document.removeEventListener('visibilitychange', this._onVis);
    if (this._ro) this._ro.disconnect();
    window.removeEventListener('resize', this._onResize);
    if (this._kaSub) KA.subs.delete(this._kaSub);
    clearInterval(this._clockT);
    clearTimeout(this._fitT);
  }
  _observe() {
    if (!this._ro || !this.shadowRoot) return;
    this._ro.disconnect();
    this.shadowRoot.querySelectorAll('.stage,.node,.hub,.cons,.grp,.banner,.sky').forEach((el) => this._ro.observe(el));
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
    if (el && this._c.show_clock !== false) el.textContent = WD.hhmm(new Date());
  }

  // Eigene Farben (colors) gelten nur waehrend _build und _update dieser Karte, danach steht die Standardpalette wieder
  _withPal(fn) {
    if (!this._pal) return fn();
    const keep = Object.assign({}, PAL);
    Object.assign(PAL, this._pal);
    try { return fn(); } finally { Object.assign(PAL, keep); }
  }
  _build() { return this._withPal(() => this._build0()); }
  _update() { return this._withPal(() => { this._update0(); this._xtUpdate(); const w = this._$('.wdlg'); if (w && w.open) this._whyRender(); }); }
  _build0() {
    this._xtC = [];
    const c = this._c;
    this._bl = WD.state.lang;
    if (c.grid2 && c.consumers[0] && c.consumers[0]._g2) c.consumers[0].name = c.grid2.name || T('flow.grid2');
    // Nach dem Laden der Schrift und nach der Anlaufzeit einmal sicher neu einpassen, auch wenn der Maßstab gerade gehalten wird
    const refit = () => { this._forceFit = true; this._schedLayout(); };
    clearTimeout(this._fitT);
    this._fitT = setTimeout(refit, 2500);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
    const node = (k, cls, icon, label, color, ent, extra = '', conf = null, top = '') => `
      <div class="node ${cls}" data-k="${k}" data-e="${esc(ent)}" style="--c:${color}">
        ${this._s3d ? `<div class="o3d" data-o="${k}"></div>` : ''}<div class="n-top"><span class="ico"><ha-icon icon="${esc(icon)}"></ha-icon></span><span class="lbl">${esc(label)}</span>${top}</div>
        <div class="val"><span class="num">—</span><span class="unit"></span></div>
        <div class="tag"></div>${extra}<div class="sub"></div>${this._xtHtml(conf)}
      </div>`;
    const links = [];
    let nodes = '';
    const whySet0 = (c.why === true ? ['pv'] : (Array.isArray(c.why) ? c.why : typeof c.why === 'string' ? [c.why] : [])).map((x) => String(x).toLowerCase());
    const pvWhy = whySet0.includes('pv') || whySet0.includes('solar');
    if (c.pv) { nodes += node('pv', 'pv' + (pvWhy ? ' has-why' : ''), c.pv.icon || 'mdi:solar-power-variant', c.pv.name || T('flow.pv'), PAL.pv, c.pv.entity, '', c.pv, pvWhy ? `<span class="why" data-w="pv" data-i="0" role="button" tabindex="0" aria-label="${esc(T('why.aria.pv'))}">?</span>` : ''); if (!this._via) links.push('pv'); }
    const hasPv2 = !!(c.pv2 && c.pv2.entity);
    if (hasPv2) { nodes += node('pv2', 'pv2', c.pv2.icon || 'mdi:solar-panel', c.pv2.name || T('flow.pv2'), PAL.pv, c.pv2.entity, '', c.pv2); if (this._via2 < 0) links.push('pv2'); }
    let gridH = '', batH = '';
    // why: true zeigt das "?" an Netz, Solar und Batterie. why: [grid, pv, battery] (oder ein einzelner Name) nur dort
    const whySet = (c.why === true ? ['grid', 'pv', 'bat'] : (Array.isArray(c.why) ? c.why : typeof c.why === 'string' ? [c.why] : [])).map((x) => ({ netz: 'grid', solar: 'pv', battery: 'bat', batterie: 'bat' }[String(x).toLowerCase()] || String(x).toLowerCase()));
    const whyBtn = (k, i) => (whySet.includes(k) ? `<span class="why" data-w="${k}" data-i="${i || 0}" role="button" tabindex="0" aria-label="${esc(k === 'grid' ? T('why.imp', { w: '' }).replace(/\s+/g, ' ').trim() : T('why.aria.' + k))}">?</span>` : '');
    const hw = (k) => (whySet.includes(k) ? ' has-why' : '');
    this._whyOn = whySet.length > 0;
    if (c.grid) { nodes += (gridH = node('grid', 'grid' + hw('grid'), c.grid.icon || 'mdi:transmission-tower', c.grid.name || T('flow.grid'), PAL.imp, c.grid.entity, '', c.grid, whyBtn('grid'))); links.push('grid'); }
    if (c.batteries.length) {
      const nB = c.batteries.length;
      const bHtml0 = c.batteries.map((b, i) => node(this._bk(i), 'bat' + hw('bat'), b.icon || 'mdi:home-battery-outline', b.name || (T('flow.battery') + (nB > 1 ? ' ' + (i + 1) : '')), PAL.bat, (b.tap === 'soc' && b.soc) || b.power || b.power_charge || b.power_discharge,
        // Klick auf Balken und Prozentzahl öffnet den Verlauf des Ladestands, der Rest der Kachel den der Leistung
        `<div class="socbox"${b.soc ? ` data-e="${esc(b.soc)}"` : ''}><div class="soc"><div class="soc-fill"></div><div class="soc-low"></div><div class="soc-high"></div></div><div class="soc-row"><span>${T('flow.soc')}</span><b class="soc-txt">—</b></div></div>${b.temp ? `<div class="socbox" data-e="${esc(b.temp)}"><div class="soc-row"><span>${T('flow.temp')}</span><b class="temp-txt">—</b></div></div>` : ''}`, b, whyBtn('bat', i))).join('');
      // #75: pv_to_battery ohne power_out wird nicht angewendet, die erste Batterie-Kachel sagt, was fehlt
      const bHtml = this._viaMiss ? bHtml0.replace('<div class="sub"></div>', `<div class="cfgw">${T('flow.via.miss')}</div><div class="sub"></div>`) : bHtml0;
      nodes += (batH = nB > 1 ? `<div class="bats">${bHtml}</div>` : bHtml);
      c.batteries.forEach((b, i) => links.push(this._bk(i)));
      if (this._via) links.push('pvbat');
      if (this._via2 >= 0) links.push(`r:pv2:${this._bk(this._via2)}`);
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
    // #65: Gas und Wasser stehen rechts unter der Batterie (mit pv_to_battery: direkt unter dem Netz), ohne Batterie an ihrer Stelle
    const gas = c.gas && typeof c.gas === 'object' && (c.gas.entity || c.gas.daily || c.gas.heating || c.gas.hot_water) ? c.gas : null;
    // Heizöl statt Gas: gas.fuel: oil. Gleiche Kachel, Liter statt m³ und Öl als Name
    const oil = !!gas && /^(oil|öl|oel|heizöl|heizoel)$/i.test(String(gas.fuel || '').trim());
    // Wasser: ein Zähler (water: {...}) oder mehrere (water: [{...}, {...}]), dazu water2 und water3 für den Editor. Höchstens 4, je eine Kachel
    const asList = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? (Object.keys(v).length && Object.keys(v).every((k) => /^\d+$/.test(k)) ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]) : [v]) : []));
    const WK = ['water', 'water2', 'water3', 'water4'];
    const wats = asList(c.water).concat(asList(c.water2), asList(c.water3)).filter((w) => w && typeof w === 'object' && (w.entity || w.daily)).slice(0, 4).map((w, i) => Object.assign({}, w, { _k: WK[i], _i: i }));
    this._gas = gas; this._oil = oil; this._wats = wats;
    // grid_side: right (optional): Netz rechts neben dem Haus, auch in 3D. Nicht mit pv_to_battery: direkt (dort steht das Netz schon rechts)
    const gridRight = !this._via && /^(right|rechts)$/i.test(String(c.grid_side || '').trim());
    let util = '';
    if (gas) { util += node('gas', 'util gas', gas.icon || (oil ? 'mdi:oil' : 'mdi:fire'), gas.name || T(oil ? 'flow.oil' : 'flow.gas'), PAL.gas, gas.entity || gas.daily || gas.heating || gas.hot_water, '', gas); links.push('gas'); }
    wats.forEach((w) => { util += node(w._k, 'util water', w.icon || 'mdi:water', w.name || (T('flow.water') + (w._i ? ' ' + (w._i + 1) : '')), PAL.wat, w.entity || w.daily, '', w); links.push(w._k); });
    if (util) {
      const tgt = this._via && gridH ? gridH : !this._via && batH ? batH : '';
      if (tgt) nodes = nodes.replace(tgt, () => `<div class="side side-${this._via ? 'grid' : 'bat'}">${tgt}${util}</div>`);
      else nodes += `<div class="side side-${this._via ? 'grid' : 'bat'}">${util}</div>`;
    }
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
    // show_share (optional): Anteil jedes Verbrauchers am Hausverbrauch in Prozent, rechts neben dem Wert
    const showShare = c.show_share === true || String(c.show_share).toLowerCase() === 'true';
    const cons = c.consumers.map((x, i) => {
      if (x.entity && !sam) links.push('c' + i);
      return `<div class="cons${x.size === 'gross' || x.size === 'big' ? ' big' : (x.size === 'mittel' || x.size === 'mid' ? ' mid' : '')}${showShare && x.entity ? ' sh' : ''}" data-k="c${i}" data-e="${esc(x.entity || x.secondary)}" style="--c:${rgb(x.color, '167,139,250')}">
        ${x.image ? `<span class="ico logo"><img src="${esc(x.image)}" alt=""></span>` : `<span class="ico"><ha-icon icon="${esc(x.icon || 'mdi:power-plug')}"></ha-icon></span>`}
        <div class="c-txt"><span class="lbl">${esc(x.name || x.entity)}</span><span class="val"><span class="num">—</span><span class="unit"></span>${showShare && x.entity ? '<span class="shr"><span class="num">—</span><span class="unit">%</span></span>' : ''}</span></div>
        <span class="c-sec"></span></div>`;
    }).join('');
    this._topDirty = true;
    // Kachel "Nicht erfasst" auch bei einzelnen Verbrauchern ohne Gruppen, aber nur wenn show_rest: true oder hide_rest: false ausdrücklich gesetzt ist (#34, #58)
    const restC = c.consumers.length > 0 && !(c.consumer_groups || []).length && (c.hide_rest === false || (c.show_rest === true && c.hide_rest !== true)) && c.rest !== false;
    if (restC && !sam) links.push('crest');
    // #95 (PV-Joe): show_share auch bei "Nicht erfasst" und in der Kurzansicht
    const consRest = restC ? `<div class="cons rest${showShare ? ' sh' : ''}" data-k="crest" style="--c:${PAL.mut}">
        <span class="ico"><ha-icon icon="mdi:help-circle-outline"></ha-icon></span>
        <div class="c-txt"><span class="lbl">${esc((c.rest && c.rest.name) || T('flow.rest'))}</span><span class="val"><span class="num">—</span><span class="unit"></span>${showShare ? '<span class="shr"><span class="num">—</span><span class="unit">%</span></span>' : ''}</span></div></div>` : '';
    const G = c.consumer_groups;
    let grps = '';
    if (G.length) {
      grps = G.map((g, i) => {
        if (!sam) links.push('g' + i);
        return `<div class="grp" data-k="g${i}" style="--c:${rgb(g.color, '167,139,250')}">
          <div class="g-hd">${g.image ? `<span class="ico logo"><img src="${esc(g.image)}" alt=""></span>` : `<span class="ico"><ha-icon icon="${esc(g.icon || 'mdi:door')}"></ha-icon></span>`}<span class="lbl">${esc(g.name)}</span></div>
          <div class="val"><span class="num">—</span><span class="unit"></span></div>
          <div class="its">${(g.items || []).map((x, j) => `<div class="it" data-i="${i}-${j}" data-e="${esc(x.entity || x.secondary)}"><i></i><span class="in">${esc(x.name || x.entity)}</span><b></b></div>`).join('')}${g.entity ? `<div class="it grr" data-gr="${i}" data-e="${esc(g.entity)}" style="order:999"><i></i><span class="in">${esc(g.rest_name || T('flow.grest'))}</span><b></b></div>` : ''}</div>
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
    // #80 forecast_swap: Unten stehen die Prognosen für heute, morgen und übermorgen nebeneinander, der bisherige Ertrag "Solar heute" wandert
    // in die Solar-Kachel. Nur wenn pv.forecast eine Tagesprognose in kWh (oder Wh) ist
    const fsw = this._fsw = this._fcSwap();
    if (fsw) stats += d('fc0', T('stat.fc0'), PAL.pv, c.pv.forecast);
    else if ((c.pv && c.pv.daily) || (c.pv2 && c.pv2.daily)) stats += d('pv', T('stat.pv'), PAL.pv);
    // PV-Prognose für morgen und übermorgen (optional, z. B. Forecast.Solar oder Solcast). Antippen öffnet den Verlauf. Wunsch aus #22
    // #104: Mit Prognosen für die zweite Anlage (pv2.forecast_tomorrow, pv2.forecast_day_after) steht hier die Summe beider Anlagen
    const fe = (k) => (c.pv && c.pv[k]) || (c.pv2 && c.pv2[k]) || '';
    if (fe('forecast_tomorrow')) stats += d('fc1', T(fsw ? 'stat.fc1p' : 'stat.fc1'), PAL.pv, fe('forecast_tomorrow'));
    if (fe('forecast_day_after')) stats += d('fc2', T(fsw ? 'stat.fc2p' : 'stat.fc2'), PAL.pv, fe('forecast_day_after'));
    if (c.grid && c.grid.daily_import) stats += d('imp', T('stat.imp'), PAL.imp);
    if (c.grid && c.grid.daily_export) stats += d('exp', T('stat.exp'), PAL.exp);
    // Tageswert je Verbraucher (optional, #106): eigene Kachel "<Name> heute" mit dem Sensor consumers[].daily (kWh)
    c.consumers.forEach((x, i) => { if (x && x.daily) stats += d('cd' + i, T('stat.cdaily', { n: x.daily_name || x.name || x.entity || x.daily }), rgb(x.color, '167,139,250'), x.daily); });
    if (c.batteries.some((b) => b.daily_charge || b.daily_discharge)) stats += d('bat', T('stat.bat'), PAL.bat);
    // Hausverbrauch heute: eigener Sensor (home.daily) oder berechnet wie die Autarkie
    if ((c.home && c.home.daily) || (((c.pv && c.pv.daily) || (c.pv2 && c.pv2.daily)) && c.grid && c.grid.daily_import)) stats += d('home', T('stat.home'), PAL.home);
    stats += d('aut', T('stat.aut'), PAL.home);

    this.shadowRoot.innerHTML = `<style>${CSS}</style>
    <ha-card><div class="wrap${this._mode ? ' ' + this._mode : ''}${cmp ? ' cmp' : ''}${this._s3d ? ' s3d' : ''}${sam ? ' sam-on' : ''}${c.text_size === 'gross' ? ' ts-l' : c.text_size === 'sehr_gross' ? ' ts-xl' : ((this._lsn || this._tsn) > 1.2 ? ' ts-l' : '')}${c.animations === 'always' || c.animations === 'immer' ? ' anim-on' : this._animOff() ? ' anim-off' : ''}${this._vis === false ? ' ec-paused' : ''}"${(this._s3d && WD.D3.roof(c.roof_color)) || this._tsn || this._lsn || this._hsn || this._hls || this._hps || this._palSet ? ` style="${(this._s3d && WD.D3.roof(c.roof_color)) || ''}${this._lsn || this._tsn ? `--ts:${this._lsn || this._tsn};` : ''}${this._tsn ? `--vs:${this._tsn};` : ''}${this._hsn ? `--hs:${this._hsn};` : ''}${this._hls ? `--hls:${this._hls};` : ''}${this._hps ? `--hps:${this._hps};` : ''}${this._palSet ? `--pv:${PAL.pv};--imp:${PAL.imp};--exp:${PAL.exp};--bat:${PAL.bat};--home:${PAL.home};` : ''}"` : ''}>
      <header>
        <div class="title"><span class="live"></span>${esc(c.title || T('flow.title'))}<span class="clock"></span></div>
        <div class="pill ka"></div>
        <div class="pill wst"></div>
        <div class="pill pd" style="--c:${PAL.home}">${T('pill.aut')}<b data-p="aut">—</b></div>
        <div class="pill pd" style="--c:${PAL.exp}">${T('pill.self')}<b data-p="self">—</b></div>
        ${c.nav_path ? `<div class="navbtn" data-nav="${esc(c.nav_path)}">${esc(c.nav_label || T('flow.next'))}</div>` : ''}
      </header>
      ${c.weather ? '<div class="sky" role="button" tabindex="0" hidden><div class="sky-bar"></div><div class="sky-row"><span class="sky-lw"><span class="sky-l"></span><span class="sky-q" aria-hidden="true">?</span></span><span class="sky-r"></span></div><div class="sky-det"></div></div>' : ''}
      <div class="banner"><div class="b-ico"><ha-icon icon="mdi:white-balance-sunny"></ha-icon></div><div class="b-txt"><span class="b-title"></span><span class="b-sub"></span></div><div class="b-chips"></div></div>
      <div class="stage">
        <svg class="links">${links.map((k) => `<g class="link" data-l="${k}"><path class="track"/><path class="glow"/><path class="flow"/></g>`).join('')}</svg>
        <div class="layout${hasPv2 ? ' has-pv2' : ''}${this._via ? ' via-bat' : ''}${gridRight ? ' gr' : ''}${gridRight && (batH || util) ? ' gr-bat' : ''}">
          ${nodes}
          <div class="hub-wrap">
            <div class="hub" data-e="${esc(c.home && c.home.entity)}">
              ${this._s3d ? '<div class="o3d" data-o="home"></div>' : ''}<svg viewBox="0 0 120 120">
                <circle class="orbit" cx="60" cy="60" r="58.5"/>
                <circle class="ring-bg" cx="60" cy="60" r="52"/>
                <circle class="seg" data-g="pv" cx="60" cy="60" r="52" pathLength="100" style="color:rgb(${PAL.pv})"/>
                <circle class="seg" data-g="bat" cx="60" cy="60" r="52" pathLength="100" style="color:rgb(${PAL.dis})"/>
                <circle class="seg" data-g="grid" cx="60" cy="60" r="52" pathLength="100" style="color:rgb(${PAL.imp})"/>
              </svg>
              <div class="core">
                <span class="hico"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon></span>
                <div class="val"><span class="num">—</span><span class="unit"></span></div>
                <div class="hub-lbl">${esc((c.home && c.home.name) || T('flow.home'))}</div>
              </div>
            </div>
            <div class="mix">
              <span style="--c:${PAL.pv}"><i></i>${T('mix.pv')}<b data-m="pv">—</b></span>
              ${c.battery ? `<span style="--c:${PAL.dis}"><i></i>${T('mix.bat')}<b data-m="bat">—</b></span>` : ''}
              <span style="--c:${PAL.imp}"><i></i>${T('mix.grid')}<b data-m="grid">—</b></span>
            </div>
          </div>
        </div>
        ${sam ? `<div class="sambox"><div class="sam" data-k="bundle"><span class="sam-t">${T('flow.cons_total')}</span><b class="sam-w">—</b></div>` : ''}${cons ? `<div class="consumers${c.consumers.some((x) => x.size === 'mittel' || x.size === 'mid') ? ' hm' : ''}">${cons}${consRest}</div>` : ''}
        ${grps}${sam ? '</div>' : ''}
      </div>
      <footer>${stats}</footer>
    </div></ha-card>${cmp ? '<dialog class="gdlg"></dialog>' : ''}${this._whyOn ? '<dialog class="wdlg"></dialog>' : ''}`;

    // pv.kwp / pv2.kwp (optional, #103): Anlagenleistung in kWp. Die Solar-Kachel zeigt rechts neben der Leistung, wie viel Prozent davon gerade erzeugt werden
    [['pv', 'pv'], ['pv2', 'pv2']].forEach(([k, cl]) => { if (this._kwp(c[k]) > 0) this.shadowRoot.querySelectorAll('.node.' + cl + ' .val').forEach((v) => { v.insertAdjacentHTML('beforeend', '<span class="shr kwp-big"><span class="num">—</span><span class="unit">%</span></span>'); }); });
    // show_soc (optional): Ladestand der Batterie (gesamt, nicht "nutzbar") rechts neben der Leistung
    if (c.show_soc === true || String(c.show_soc).toLowerCase() === 'true') this.shadowRoot.querySelectorAll('.node.bat .val').forEach((v) => { v.insertAdjacentHTML('beforeend', '<span class="shr soc-big"><span class="num">—</span><span class="unit">%</span></span>'); });
    this._links = links.map((k) => ({ k, g: this._$(`g[data-l="${k}"]`), el: this._$(`[data-k="${k}"]`) }));
    this._3k = {};
    this._dlg = null;
    const dl = this._$('.gdlg');
    if (dl) dl.addEventListener('close', () => { this._dlg = null; });
    // Nur einmal registrieren: _build läuft bei jeder Konfigurationsänderung erneut
    if (!this._clk) {
      this._clk = true;
      this.shadowRoot.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.why')) { e.preventDefault(); const b = e.target.closest('.why'); this._whyOpen(b.dataset.w, +b.dataset.i || 0); } });
      this.shadowRoot.addEventListener('click', (e) => {
        const dlg = this._$('.gdlg');
        if (dlg && dlg.open && (e.target === dlg || e.target.closest('.d-x'))) { dlg.close(); return; }
        const wy = e.target.closest('.why');
        if (wy) { e.stopPropagation(); this._whyOpen(wy.dataset.w, +wy.dataset.i || 0); return; }
        const wdl = this._$('.wdlg');
        if (wdl && wdl.open && (e.target === wdl || e.target.closest('.d-x'))) { wdl.close(); return; }
        const sk = e.target.closest('.sky');
        if (sk) { sk.classList.toggle('open'); return; }
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
    // #67: Das Bild neben dem Text wächst mit der Schrift (bis 1,4×), also braucht die Kachel entsprechend mehr Breite
    const need = (this._cmp ? 185 : mode === 'wide' ? 320 : mode === 'narrow' ? 280 : 300) + (ts - 1) * 120 + (Math.min(ts, 1.4) - 1) * (this._cmp ? 52 : 132);
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
      const sideOnly = (this._mode !== 'narrow' || this._cmp) && (['pv', 'pv2', 'grid', 'gas'].includes(L.k) || /^water\d*$/.test(L.k) || /^bat\d*$/.test(L.k));
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
    // Nicht hochzählen: Animationen aus, Karte nicht sichtbar oder "Bewegung reduzieren" am Gerät
    const calm = this._animOff() || this._vis === false || (!['always', 'immer'].includes(this._c.animations) && window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches);
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

  // Tagesprognose aus pv.forecast (oder pv2.forecast mit k = 'pv2') in kWh (Einheit Wh, kWh oder MWh), sonst null
  _fcDay(k) {
    const c = this._c, h = this._hass, o = c[k || 'pv'], id = o && o.forecast, st = id && h ? h.states[id] : null;
    const u = st ? String(st.attributes.unit_of_measurement || '') : '';
    if (!/^(k|m)?wh$/i.test(u)) return null;
    const e = num(h, id);
    return e === null ? null : /^mwh$/i.test(u) ? e * 1000 : /^kwh$/i.test(u) ? e : e / 1000;
  }
  // #104: Summe der Tagesprognosen beider Anlagen (nur kWh-Prognosen), sonst null
  _fcDaySum() { const a = this._fcDay('pv'), b = this._fcDay('pv2'); return a === null && b === null ? null : (a || 0) + (b || 0); }
  // #104: Prognose morgen oder übermorgen (key = forecast_tomorrow / forecast_day_after): Summe aus pv und pv2, soweit vorhanden, sonst null
  _fcSum(key) {
    const c = this._c, h = this._hass, raw = rawUnits(c); let t = null;
    ['pv', 'pv2'].forEach((k) => { if (c[k] && c[k][key]) { const v = kwh(h, c[k][key], raw); if (v !== null && v !== undefined) t = (t || 0) + v; } });
    return t;
  }
  // #80: forecast_swap gilt nur mit einer Tagesprognose in Wh/kWh/MWh. Ohne hass (erster Aufbau) zählt die Einstellung allein
  _fcSwap() {
    const c = this._c;
    if (c.forecast_swap !== true || !c.pv || !c.pv.forecast) return false;
    const st = this._hass && this._hass.states[c.pv.forecast];
    return !st || /^(k|m)?wh$/i.test(String(st.attributes.unit_of_measurement || ''));
  }

  // consumers_top (#76): Von den Einzelverbrauchern nur die N mit der höchsten Leistung zeigen, absteigend sortiert. Damit die Kacheln nicht springen,
  // wechselt die Auswahl oder Reihenfolge erst, wenn sie consumers_top_delay Sekunden (Standard 30) anders bleibt, sofort dagegen, wenn ein
  // ausgeblendeter Verbraucher den kleinsten sichtbaren deutlich übertrifft (mehr als doppelt so viel und mindestens 100 W mehr).
  // Ausgeblendete Verbraucher zählen weiter zum Hausverbrauch und zu "Nicht erfasst"; ihre Linien verschwinden mit der Kachel (_layout)
  // hide_zero: Verbraucher, Gruppen und Gruppeneinträge unter ihrer Schwelle (on_w, Standard 10 W) ausblenden. Damit nichts flackert, muss ein Eintrag
  // hide_zero_delay Sekunden (Standard 30) darunter bleiben, bevor er verschwindet. Er erscheint sofort, sobald er wieder läuft.
  // Beim Laden der Seite verschwinden ruhende Einträge gleich. Ausgeblendete zählen weiter zum Hausverbrauch und zu "Nicht erfasst"
  _hzOn() { return this._c && (this._c.hide_zero === true || String(this._c.hide_zero).toLowerCase() === 'true'); }
  _hz(key, below) {
    const m = this._hzS || (this._hzS = {}), now = Date.now();
    let s = m[key];
    if (!s) { s = m[key] = { t: below ? now : 0, h: below }; if (below) this._hzDirty = true; return s.h; }
    const d0 = parseFloat(this._c.hide_zero_delay), dl = (isNaN(d0) ? 30 : Math.max(0, d0)) * 1000;
    if (!below) { s.t = 0; if (s.h) { s.h = false; this._hzDirty = true; } }
    else { if (!s.t) s.t = now; if (!s.h && now - s.t >= dl) { s.h = true; this._hzDirty = true; } }
    return s.h;
  }
  _topCons(pw) {
    const n = parseInt(this._c.consumers_top, 10);
    if (!pw.length) return;
    const hzs = this._hzOn() ? (this._hzS || {}) : null;
    const hzHide = (i) => !!(hzs && hzs['c' + i] && hzs['c' + i].h);
    if (!(n > 0)) {
      // #99: nach einem Neuaufbau (_build setzt _topDirty, z. B. Wechsel in die Kurzansicht) die Ausblendung wieder anwenden
      if (!this._hzOn() || (!this._hzDirty && !this._topDirty)) return;
      this._hzDirty = false; this._topDirty = false;
      pw.forEach((w, i) => { const el = this._$(`[data-k="c${i}"]`); if (el) el.style.display = hzHide(i) ? 'none' : ''; });
      this._schedLayout();
      return;
    }
    const want = pw.map((w, i) => i).sort((a, b) => pw[b] - pw[a] || a - b).slice(0, n);
    const cur = this._topCur, now = Date.now();
    let changed = false;
    if (cur && cur.length === want.length && cur.every((v, j) => v === want[j])) this._topPend = 0;
    else {
      const d0 = parseFloat(this._c.consumers_top_delay), dl = (isNaN(d0) ? 30 : Math.max(0, d0)) * 1000;
      const minShown = cur ? Math.min(...cur.map((i) => Math.max(0, pw[i] === undefined ? 0 : pw[i]))) : 0;
      const jump = !!cur && want.some((i) => !cur.includes(i) && pw[i] > minShown * 2 && pw[i] - minShown >= 100);
      if (!this._topPend) this._topPend = now;
      if (!cur || cur.some((i) => i >= pw.length) || jump || now - this._topPend >= dl) { this._topCur = want; this._topPend = 0; changed = true; }
    }
    if (!changed && !this._topDirty && !(this._hzOn() && this._hzDirty)) return;
    this._topDirty = false; this._hzDirty = false;
    pw.forEach((w, i) => {
      const el = this._$(`[data-k="c${i}"]`);
      if (!el) return;
      const pos = this._topCur.indexOf(i);
      el.style.display = pos < 0 || hzHide(i) ? 'none' : '';
      el.style.order = pos < 0 ? '' : String(pos);
    });
    const rest = this._$('[data-k="crest"]');
    if (rest) rest.style.order = '999';
    this._schedLayout();
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

  // Batterie-Prognose: geglättete Leistung (~5 min) -> Uhrzeit "voll um" / "reicht bis"
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
    // #52: Reserve als eigene Zeile (vorher "x kWh (bis 15 %)" in einer Zeile, lief auf dem iPad aus der Kachel)
    return reserve > 0 ? T('bat.usable', { kwh: nf(avail, 1), res: Math.round(reserve) }) : T('bat.usable0', { kwh: nf(avail, 1) });
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
        this._link(k, x.out - d > TH, true, x.p !== null && x.p < -TH ? PAL.dis : PAL.pv, x.out - d);
        return;
      }
      const chg = Math.max(0, x.p || 0), dis = Math.max(0, -(x.p || 0));
      const fromPv = Math.min(chg, solar), fromGrid = Math.min(chg - fromPv, gridLeft), toGrid = Math.min(dis, expLeft);
      solar -= fromPv; gridLeft -= fromGrid; expLeft -= toGrid;
      this._link(`r:pv:${k}`, fromPv > TH, true, PAL.pv, fromPv);
      this._link(`r:grid:${k}`, fromGrid > TH, true, PAL.imp, fromGrid);
      this._link(`r:${k}:grid`, toGrid > TH, true, PAL.dis, toGrid);
      this._link(k, dis - toGrid > TH, true, PAL.dis, dis - toGrid);
    });
    // Rest der Einspeisung, den kein Gerät erklärt (zum Beispiel zeitversetzte Sensoren), bleibt an der Hauslinie
    if (gridLeft > TH) this._link('grid', true, true, PAL.imp, gridLeft);
    else if (expLeft > TH) this._link('grid', true, false, PAL.exp, expLeft);
    else this._link('grid', false, true, PAL.imp, 0);
  }
  // #65: Gas und Wasser. Großer Wert: Leistung bzw. Durchfluss (entity), sonst der Verbrauch heute. Zählt nicht zum Strom
  _utilUpdate() {
    const h = this._hass, out = {};
    const row = (label, v) => `<div class="sr"><span>${label}</span> <b>${v}</b></div>`;
    const big = (el, n, u) => { const ne = el.querySelector('.num'), ue = el.querySelector('.unit'); if (ne.textContent !== n) ne.textContent = n; if (ue.textContent !== u) ue.textContent = u; };
    const g = this._gas;
    if (g) {
      const oil = this._oil, el = this._$('[data-k="gas"]'), f = parseFloat(String(oil ? (g.kwh_per_l === undefined ? 10 : g.kwh_per_l) : g.kwh_per_m3 || '').replace(',', '.')) || 0;
      const p = g.entity ? watt(h, g.entity) : null;
      const hv = g.heating ? gasVal(h, g.heating, f, oil) : null, wv = g.hot_water ? gasVal(h, g.hot_water, f, oil) : null, dv = g.daily ? gasVal(h, g.daily, f, oil) : null;
      const parts = [hv, wv].filter(Boolean), tot = dv || (parts.length ? { kwh: parts.some((x) => x.kwh === null) ? null : parts.reduce((a, x) => a + x.kwh, 0), m3: parts.every((x) => x.m3 !== null) ? parts.reduce((a, x) => a + x.m3, 0) : null } : null);
      // m³ ohne kwh_per_m3: Anzeige in m³
      const lit = (v) => nf(v, v < 10 ? 1 : 0);
      const fmt = (x) => (!x ? '—' : oil && x.m3 !== null ? lit(x.m3) + ' L' : x.kwh !== null ? this._fk(x.kwh) + ' kWh' : x.m3 !== null ? nf(x.m3, 2) + ' m³' : '—');
      const on = p !== null ? p > TH : !!(tot && ((tot.kwh || 0) > 0 || (tot.m3 || 0) > 0));
      el.classList.toggle('on', on);
      el.style.setProperty('--c', on ? PAL.gas : PAL.mut);
      if (p !== null) this._anim('gas', p, el);
      else if (!tot) big(el, '—', '');
      else if (oil && tot.m3 !== null) big(el, lit(tot.m3), 'L');
      else if (tot.kwh !== null) { const t = this._fk(tot.kwh); big(el, t, 'kWh'); }
      else big(el, nf(tot.m3, 2), 'm³');
      this._set('.gas .tag', p !== null ? (p > TH ? T('tag.gas.on') : T('tag.idle')) : T('tag.today'));
      const rows = [];
      if (g.heating) rows.push(row(T('gas.heat'), fmt(hv)));
      if (g.hot_water) rows.push(row(T('gas.hw'), fmt(wv)));
      // Mit Leistung oben: Summe heute als Zeile, außer sie stünde schon als einzige Aufteilung da
      if (p !== null && tot && (g.daily || rows.length !== 1)) rows.push(row(T('gas.today'), fmt(tot)));
      this._set('.gas .sub', rows.join(''), true);
      this._link('gas', on, true, PAL.gas, p !== null ? p : 0);
      out.gas = { p, on };
    }
    out.waters = [];
    (this._wats || []).forEach((w) => {
      const k = w._k, el = this._$(`[data-k="${k}"]`);
      if (!el) return;
      const fl = w.entity ? flowLmin(h, w.entity) : null, dl = w.daily ? waterL(h, w.daily) : null;
      const fmtL = (l) => (l === null ? '—' : l >= 1000 ? nf(l / 1000, 2) + ' m³' : nf(l, 0) + ' L');
      const on = fl !== null ? fl > 0.05 : (dl || 0) > 0;
      el.classList.toggle('on', on);
      el.style.setProperty('--c', on ? PAL.wat : PAL.mut);
      if (fl !== null) big(el, nf(fl, fl < 10 ? 1 : 0), 'l/min');
      else if (dl !== null) { const [n, u] = fmtL(dl).split(' '); big(el, n, u); }
      else big(el, '—', '');
      this._set(`[data-k="${k}"] .tag`, fl !== null ? (fl > 0.05 ? T('tag.water.on') : T('tag.idle')) : T('tag.today'));
      this._set(`[data-k="${k}"] .sub`, fl !== null && dl !== null ? row(T('gas.today'), fmtL(dl)) : '', true);
      this._link(k, on, true, PAL.wat, fl !== null ? fl * 100 : 0);
      out.waters.push({ k, fl, on, name: w.name || (T('flow.water') + (w._i ? ' ' + (w._i + 1) : '')) });
    });
    return out;
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
    // #65: Gastherme und Wasserzähler
    const u = v.util || {};
    if (u.gas) { const gp = u.gas.p; put('gas', [u.gas.on, q(gp), large].join(), () => D3.boiler(u.gas.on, 'gas', large, gp !== null ? this._fW(gp) : '', (this._gas && this._gas.name) || T(this._oil ? 'flow.oil' : 'flow.gas'))); }
    (u.waters || []).forEach((wm) => { const fl = wm.fl; put(wm.k, [wm.on, fl === null ? 'x' : Math.round(fl * 2), large].join(), () => D3.wmeter(fl || 0, wm.k, large, fl !== null ? nf(fl, fl < 10 ? 1 : 0) + ' l/min' : '', wm.name)); });
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
    const price = WD.priceNow(h, c, null), feed = WD.price(h, c.feed_in, c.feed_in_ct, 0);
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
    const rr = g.entity ? `<div class="d-it" data-j="r" data-e="${esc(g.entity)}" style="order:999"><i></i><span class="in">${esc(g.rest_name || T('flow.grest'))}</span><b></b></div>` : '';
    dl.innerHTML = `<div class="d-hd">${ico}<span class="d-name">${esc(g.name)}</span><b class="d-sum"></b><button class="d-x" aria-label="${T('close')}">×</button></div><div class="d-its">${rows}${rr}</div>`;
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
        if (x.secondary_name) txt = x.secondary_name + ' ' + txt;
      }
      it.classList.toggle('on', (p || 0) > onW(x));
      const b = it.querySelector('b');
      if (b.textContent !== txt) b.textContent = txt;
    });
    const tot = g.entity ? watt(h, g.entity) : null, rr = dl.querySelector('[data-j="r"]');
    if (rr) {
      const rw = tot === null ? null : Math.max(0, tot - sum);
      rr.style.display = rw === null ? 'none' : '';
      rr.classList.toggle('on', (rw || 0) > TH);
      rr.querySelector('b').textContent = rw === null ? '' : this._fW(rw);
    }
    const s = dl.querySelector('.d-sum');
    if (s) s.textContent = tot !== null ? this._fW(tot) : any ? this._fW(sum) : '';
  }

  // Statuskachel (#108): secondary_mode: status, oder ohne Leistungssensor mit einem Schalter oder Binärsensor als secondary
  _statusMode(x) {
    if (!x || x.entity || !x.secondary) return false;
    if (x.secondary_mode === 'status') return true;
    return x.secondary_mode === undefined && /^(input_boolean|binary_sensor|switch|light|fan|lock|cover)\./.test(String(x.secondary));
  }

  // Leistung eines Verbrauchers. Mit minus (Differenz, z. B. Zählerkaskade): entity - minus (+ plus), nie negativ. Ohne minus unverändert.
  _cw(x) {
    if (!x || !x.entity) return null;
    const h = this._hass, L = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    let p = watt(h, x.entity);
    // invert (optional): Vorzeichen des Hauptsensors umkehren, wenn er den Verbrauch negativ meldet
    if (p !== null && (x.invert === true || String(x.invert).toLowerCase() === 'true')) p = -p;
    const mi = L(x.minus);
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

  // kWp aus der Konfiguration (Zahl oder Text mit Komma), 0 = nicht gesetzt
  _kwp(o) { const v = o && typeof o === 'object' ? parseFloat(String(o.kwp).replace(',', '.')) : NaN; return isNaN(v) || v <= 0 ? 0 : v; }
  _set(sel, txt, isHtml, root) {
    const el = root ? root.querySelector(sel) : this._$(sel);
    if (!el) return;
    if (isHtml) { if (el.innerHTML !== txt) el.innerHTML = txt; }
    else if (el.textContent !== txt) el.textContent = txt;
  }

  _update0() {
    const h = this._hass, c = this._c;
    if (!h || !c || !this._$('.stage')) return;
    // invert: Zähler, die Erzeugung als negativen Wert melden (#96)
    const inv = (o) => !!o && (o.invert === true || String(o.invert).toLowerCase() === 'true');
    let pv1 = c.pv ? watt(h, c.pv.entity) : null;
    if (pv1 !== null && inv(c.pv)) pv1 = -pv1;
    let pv2 = c.pv2 && c.pv2.entity ? watt(h, c.pv2.entity) : null;
    if (pv2 !== null && inv(c.pv2)) pv2 = -pv2;
    // Summe aller Erzeuger. Mit pv2 gilt: PV 2 (z. B. Balkonkraftwerk) speist zuerst ins Haus.
    const pv = pv1 === null && pv2 === null ? null : (pv1 || 0) + (pv2 || 0);
    let grid = c.grid ? watt(h, c.grid.entity) : null;
    if (c.grid && c.grid._split) {
      const gi = c.grid.power_import ? watt(h, c.grid.power_import) : null, ge = c.grid.power_export ? watt(h, c.grid.power_export) : null;
      grid = gi === null && ge === null ? null : Math.max(0, gi || 0) - Math.max(0, ge || 0);
    }
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
      let out = null, inAc = null;
      if ((this._via && i === 0) || i === this._via2) {
        out = watt(h, b.power_out);
        if (out !== null) out = Math.max(0, out);
        // pv2.to_battery: AC-Ladung aus dem Haus (power_in), ohne Sensor 0
        if (i === this._via2) { const ai = b.power_in ? watt(h, b.power_in) : null; inAc = ai === null ? 0 : Math.max(0, ai); }
        if (p === null && out !== null) p = i === this._via2 ? Math.max(0, pv2 || 0) + inAc - out : Math.max(0, pv1 || 0) - out;
      }
      return { b, i, p, out, inAc, soc: num(h, b.soc), cap: parseFloat(b.capacity_kwh) || 0 };
    });
    // Gemeinsamer Leistungssensor (übereinander gestapelte Batterien): zählt nur einmal, beim ersten Speicher mit diesem Sensor
    const sensorSeen = {};
    bats.forEach((x) => {
      const id = x.b.power || (x.b.power_charge || x.b.power_discharge ? `${x.b.power_charge}|${x.b.power_discharge}` : '');
      if (!id) return;
      if (sensorSeen[id]) { x.lead = sensorSeen[id]; x.p = null; (x.lead.shared = x.lead.shared || []).push(x); } else sensorSeen[id] = x;
    });
    // behind_meter: Speicher hinter dem Zähler steht nicht in der Bilanz (eigene Kachel bleibt). Seine Ladung zählt wie ein Gerät im Haus, seine Abgabe als Quelle
    const inBal = bats.filter((x) => x.b.behind_meter !== true);
    const bmChg = bats.reduce((a, x) => (x.b.behind_meter === true ? a + (x.i === this._via2 ? (x.inAc || 0) : Math.max(0, x.p || 0)) : a), 0);
    // pv2.to_battery: PV 2 speist den Speicher, nicht das Haus
    const pv2Via = this._via2 >= 0 ? Math.max(0, pv2 || 0) : 0;
    const bat = inBal.some((x) => x.p !== null) ? inBal.reduce((a, x) => a + (x.p || 0), 0) : null;
    const withSoc = bats.filter((x) => x.soc !== null);
    const wSum = withSoc.reduce((a, x) => a + (x.cap || 1), 0);
    const soc = withSoc.length ? withSoc.reduce((a, x) => a + x.soc * (x.cap || 1), 0) / wSum : null;
    let home = c.home && c.home.entity ? watt(h, c.home.entity) : null;
    // Negativer Verbrauch ist nicht möglich, dann gilt die eigene Berechnung
    if (home !== null && home < 0) home = null;
    // Mit eigenem Sensor gilt dessen Wert, die Abgabe käme sonst im Ring dazu, nicht aber in der Zahl
    const bmDis = home === null ? bats.reduce((a, x) => (x.b.behind_meter === true ? a + (x.i === this._via2 ? (x.out || 0) : Math.max(0, -(x.p || 0))) : a), 0) : 0;
    if (home === null) home = Math.max(0, (pv || 0) - pv2Via + (grid || 0) - (bat || 0) + bmDis);
    else if (c.pv2 && c.pv2.add_to_home) home += Math.max(0, pv2 || 0);

    // grid2: Bezug des zweiten Zählers. Er steckt nicht im Hauptzähler: Hausverbrauch und Netzanteil im Ring werden um ihn größer
    const g2w = c.grid2 ? Math.max(0, watt(h, c.grid2.entity) || 0) : 0;
    home += g2w;
    const gImpM = Math.max(0, grid || 0), gImp = gImpM + g2w, gExp = Math.max(0, -(grid || 0));
    // Herkunft und Aufteilung je Speicher: lädt der eine, während der andere entlädt, zählt beides
    const bDis = inBal.reduce((acc, x) => acc + Math.max(0, -(x.p || 0)), bmDis), bChg = inBal.reduce((acc, x) => acc + Math.max(0, x.p || 0), 0);
    const pvHome = Math.min(Math.max(0, (pv || 0) - pv2Via), Math.max(0, home - gImp - bDis));
    const tot = pvHome + gImp + bDis;

    this._set('[data-p="aut"]', home > TH ? this._fp(1 - gImp / home) : '—');
    this._set('[data-p="self"]', (pv || 0) > TH ? this._fp(1 - gExp / pv) : '—');

    // Aufteilung je Quelle: PV 2 (Balkonkraftwerk) deckt zuerst das Haus, PV 1 lädt danach die Batterie und speist ein
    const need = Math.max(0, home - gImp - bDis);
    const p2raw = Math.max(0, pv2 || 0), p2 = this._via2 >= 0 ? 0 : p2raw, p1 = Math.max(0, pv1 || 0);
    const p2Home = Math.min(p2, need);
    const p1Home = Math.min(p1, Math.max(0, need - p2Home));
    const p1Bat = Math.min(bChg, Math.max(0, p1 - p1Home));
    const p1Exp = Math.min(gExp, Math.max(0, p1 - p1Home - p1Bat));
    const p2Exp = Math.min(Math.max(0, gExp - p1Exp), Math.max(0, p2 - p2Home));
    const p2Bat = Math.min(Math.max(0, p2 - p2Home - p2Exp), Math.max(0, bChg - p1Bat));
    // Rest ohne Ziel: Hausverbrauch-Sensor, Netz und PV passen kurz nicht zusammen (zeitversetzte Werte). Er bleibt beim Haus, wie der Netz-Rest in 3D (#23)
    const viaOn = this._via && bats[0] && bats[0].out !== null;
    const p1Rest = viaOn ? 0 : Math.max(0, p1 - p1Home - p1Bat - p1Exp), p2Rest = Math.max(0, p2 - p2Home - p2Exp - p2Bat);
    // Zeilen untereinander (Name links, Wert rechts): Haus, Batterie, Netz, Strings, Prognose
    const row = (label, val) => `<div class="sr"><span>${label}</span> <b>${val}</b></div>`;
    const useText = (home_, bat_, exp_) => {
      const use = [];
      if (home_ > TH) use.push(row(T('pv.use.home'), this._fW(home_)));
      if (bat_ > TH) use.push(row(T('pv.use.bat'), this._fW(bat_)));
      if (exp_ > TH) use.push(row(T('pv.use.grid'), this._fW(exp_)));
      return use.join('');
    };
    if (c.pv2 && c.pv2.entity) {
      const el = this._$('[data-k="pv2"]'), on = p2raw > TH;
      el.classList.toggle('on', on);
      this._anim('pv2', pv2, el);
      { const kw = this._kwp(c.pv2); if (kw > 0) this._set('.kwp-big .num', pv2 === null ? '—' : String(Math.min(999, Math.round(Math.max(0, pv2) / (kw * 1000) * 100))), false, el); }
      this._set('.pv2 .tag', pv2 === null ? T('tag.offline') : on ? T('tag.producing') : T('tag.idle'));
      const parts2 = [];
      const u2 = on ? (this._via2 >= 0 ? row(T('pv.use.store'), this._fW(p2raw)) : useText(p2Home + p2Rest, 0, p2Exp)) : '';
      if (u2) parts2.push(u2);
      (c.pv2.strings || []).forEach((s) => parts2.push(row(esc(s.name || s.entity), this._fW(watt(h, s.entity)))));
      // show_wkwp (#114): erzeugte Watt je installiertem kWp, zusaetzlich zu den Prozent
      if (c.pv2.show_wkwp === true && this._kwp(c.pv2) > 0 && pv2 !== null) parts2.push(row(T('pv.wkwp'), String(Math.round(Math.max(0, pv2) / this._kwp(c.pv2))) + ' W'));
      // #104: Prognose heute der zweiten Anlage, wie bei der ersten
      if (c.pv2.forecast) {
        const f2 = h.states[c.pv2.forecast], u2f = f2 ? String(f2.attributes.unit_of_measurement || '') : '';
        if (/^(k|m)?wh$/i.test(u2f)) { const k2 = this._fcDay('pv2'); if (k2 !== null) parts2.push(row(T('forecast.day'), this._fk(k2) + ' kWh')); }
        else { const w2 = watt(h, c.pv2.forecast); if (w2 !== null) parts2.push(row(T('forecast'), this._fW(w2))); }
      }
      this._set('.pv2 .sub', parts2.join(''), true);
      if (this._via2 < 0) this._link('pv2', on, true, PAL.pv, pv2);
    }
    if (c.pv) {
      const el = this._$('[data-k="pv"]'), on = p1 > TH;
      el.classList.toggle('on', on);
      this._anim('pv', pv1, el);
      { const kw = this._kwp(c.pv); if (kw > 0) this._set('.kwp-big .num', pv1 === null ? '—' : String(Math.min(999, Math.round(Math.max(0, pv1) / (kw * 1000) * 100))), false, el); }
      this._set('.pv .tag', pv1 === null ? T('tag.offline') : on ? T('tag.producing') : T('tag.idle'));
      const parts = [];
      // Wohin die erzeugte Leistung geht: Haus, Batterie, Netz
      if (on) {
        // pv_to_battery: direkt: Der ganze Solarstrom geht in den Speicher, die Aufteilung steht beim Ausgang des Speichers
        const u1 = this._via && bats[0].out !== null ? row(T('pv.use.store'), this._fW(p1)) : useText(p1Home + p1Rest, p1Bat, p1Exp);
        if (u1) parts.push(u1);
      }
      (c.pv.strings || []).forEach((s) => parts.push(row(esc(s.name || s.entity), this._fW(watt(h, s.entity)))));
      if (c.pv.show_wkwp === true && this._kwp(c.pv) > 0 && pv1 !== null) parts.push(row(T('pv.wkwp'), String(Math.round(Math.max(0, pv1) / this._kwp(c.pv))) + ' W'));
      // Prognose: Leistung (W, kW) oder Tagesprognose in kWh (z. B. Solcast "heute")
      // #69: compact_forecast zeigt in der Kurzansicht nur diese Zeile
      const fco = this._cmp && c.compact_forecast === true;
      if (fco) parts.length = 0;
      const fst = c.pv.forecast ? h.states[c.pv.forecast] : null;
      const fUnit = fst ? String(fst.attributes.unit_of_measurement || '') : '';
      if (this._fsw) {
        // #80: Prognose steht unten, hier der bisherige Ertrag von heute
        if (this._dPv !== null && this._dPv !== undefined) parts.push(row(T('stat.pv'), this._fk(this._dPv) + ' kWh'));
      } else if (/^(k|m)?wh$/i.test(fUnit)) {
        const kwh = this._fcDay();
        if (kwh !== null) parts.push(row(T('forecast.day'), this._fk(kwh) + ' kWh'));
      } else {
        const fc = c.pv.forecast ? watt(h, c.pv.forecast) : null;
        if (fc !== null) parts.push(row(T('forecast'), this._fW(fc)));
      }
      this._set('.pv .sub', parts.join(''), true);
      { const se = this._$('.pv .sub'); if (se) se.classList.toggle('fco', fco && parts.length > 0); }
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
      // co2_intensity (g/kWh, z. B. Electricity Maps) und co2_fossil (%): CO2 des laufenden Netzbezugs (#115)
      if (c.grid.co2_intensity || c.grid.co2_fossil) {
        const num = (id) => { const st = id && h.states[id], v = st ? parseFloat(st.state) : NaN; return isNaN(v) ? null : v; };
        const ci = num(c.grid.co2_intensity), cf = num(c.grid.co2_fossil), g = [];
        if (ci !== null && on && imp) { const gh = Math.abs(grid) / 1000 * ci; g.push(row('CO\u2082', '\u2248 ' + (gh < 1000 ? Math.round(gh) + ' g/h' : this._fk(gh / 1000) + ' kg/h'))); }
        if (cf !== null) g.push(row(T('grid.fossil'), Math.round(cf) + ' %'));
        this._set('.grid .sub', g.join(''), true);
      }
    }
    bats.forEach((x) => {
      const key = this._bk(x.i), el = this._$(`[data-k="${key}"]`);
      if (!el) return;
      // 3D: Batterien an einem gemeinsamen Sensor stehen als Turm in der Kachel des ersten
      if (this._s3d && x.lead) {
        if (el.style.display !== 'none') { el.style.display = 'none'; this._schedLayout(); }
        this._link(key, false, false, PAL.bat, 0);
        return;
      }
      const lead = x.lead || x, grp = [lead].concat(lead.shared || []);
      const bp = lead.p, bs = x.soc, chg = (bp || 0) > 0;
      // Vorgeschalteter Speicher (pv_to_battery: direkt): Strom läuft durch ihn, auch wenn er weder lädt noch entlädt (Durchleitung)
      const via2 = x.i === this._via2 && x.out !== null;
      const via = (this._via && x.i === 0 && x.out !== null) || via2;
      const pin = via2 ? p2raw : via ? Math.max(0, pv1 || 0) : 0, out = via ? x.out : 0, inAc = via2 ? (x.inAc || 0) : 0;
      const net = Math.abs(bp || 0) > TH;
      const through = via && !net && Math.max(pin, out, inAc) > TH;
      const on = net || through;
      const col = through ? PAL.pv : on && chg ? PAL.chg : on ? PAL.dis : PAL.bat;
      el.classList.toggle('on', on);
      el.classList.toggle('charging', net && chg);
      el.style.setProperty('--c', col);
      // big_value: out (nur mit pv_to_battery: direkt): große Zahl ist der Ausgang ins Haus, außer der Speicher lädt (dann die Ladeleistung)
      const bigOut = via && String(x.b.big_value || '').trim().toLowerCase() === 'out' && !(net && chg);
      this._anim(key, bp === null || x.lead ? null : bigOut ? out : Math.abs(bp), el);
      this._set('.tag', bp === null ? T('tag.offline') : through ? T('tag.passthrough') : !net ? T('tag.standby') : chg ? T('tag.charging') : T('tag.discharging'), false, el);
      const fill = el.querySelector('.soc-fill');
      const lm = this._limits(x.b);
      const usable = x.b.soc_display === 'nutzbar' && lm.maxSoc > lm.reserve;
      // nutzbar: 0 % = Entladegrenze, 100 % = Maximalladung
      const shown = bs === null ? null : usable ? Math.max(0, Math.min(100, (bs - lm.reserve) / (lm.maxSoc - lm.reserve) * 100)) : Math.max(0, Math.min(100, bs));
      fill.style.width = (shown === null ? 0 : shown) + '%';
      fill.style.setProperty('--sc', shown !== null && shown < 20 ? PAL.imp : shown !== null && shown < 40 ? PAL.pv : col);
      // show_soc: Gesamt-Ladestand (nicht "nutzbar") rechts neben der Leistung
      if (c.show_soc === true || String(c.show_soc).toLowerCase() === 'true') this._set('.soc-big .num', bs === null ? '—' : String(Math.round(Math.max(0, Math.min(100, bs)))), false, el);
      this._set('.soc-txt', shown === null ? '—' : Math.round(shown) + ' %' + (usable ? ' ' + T('bat.usable_pct') : ''), false, el);
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
      const outExp = via && !via2 ? Math.min(out, gExp) : 0;
      const split = outExp > TH && out - outExp > TH ? T('bat.split', { home: this._fW(out - outExp), grid: this._fW(outExp) }) : '';
      const subT = via ? T(via2 && x.b.power_in ? 'bat.io' : 'bat.io.pv', { in: this._fW(pin + inAc), out: this._fW(out) }) + (via2 && inAc > TH ? T('bat.in2', { pv: this._fW(pin), ac: this._fW(inAc) }) : '') + split + (fc ? '<br>' + fc : '') : fc;
      const mates = tower ? '' : grp.filter((o) => o !== x).map((o) => esc(o.b.name || T('flow.battery') + ' ' + (o.i + 1))).join(', ');
      // Eigenbedarf des Speichers (self_consumption: Sensor, oder true = berechnet aus Eingang, Entladung, Ausgang und Ladung, nur mit pv_to_battery: direkt)
      const sr = (l, v) => `<div class="sr"><span>${l}</span> <b>${v}</b></div>`;
      const sc0 = x.b.self_consumption;
      let selfW = null;
      if (typeof sc0 === 'string' && sc0.trim() && sc0.trim().toLowerCase() !== 'true') selfW = watt(h, sc0.trim());
      else if ((sc0 === true || String(sc0).toLowerCase() === 'true') && via && bp !== null) selfW = Math.max(0, pin + inAc + Math.max(0, -bp) - out - Math.max(0, bp));
      // #94: Speicher vor dem Wechselrichter lädt aus dem Netz (AC): eigener Sensor (power_in) oder aus der Ladeleistung geschätzt (Ladung minus Solar-Überschuss)
      let acG = 0;
      if (via && !via2) {
        const pi = x.b.power_in ? watt(h, x.b.power_in) : null;
        if (pi !== null) acG = Math.max(0, pi);
        else if ((x.b.power || x.b.power_charge) && bp !== null && bp > TH) acG = Math.max(0, bp - Math.max(0, pin - out));
        if (acG <= TH) acG = 0;
      }
      // #95 (Wunni73): "Entladung" nur, wenn sie vom Ausgang abweicht, sonst doppelt sie die große Zahl
      const rowsX = (acG ? sr(T('bat.gridchg'), this._fW(acG)) : '') + (bigOut && net && !chg && Math.abs(Math.abs(bp) - out) > TH ? sr(T('tag.discharging'), this._fW(Math.abs(bp))) : '') + (selfW !== null && selfW >= 1 ? sr(T('bat.selfuse'), this._fW(selfW)) : '');
      const subF = rowsX ? (subT ? subT + rowsX : rowsX) : subT;
      this._set('.sub', mates ? T('bat.shared', { name: mates }) + (subF ? '<br>' + subF : '') : subF, true, el);
      if (via2) {
        // PV 2 -> Speicher (Eingang) und Speicher <-> Haus: netzseitig (AC) Abgabe minus Ladung aus dem Haus
        const acNet = out - inAc;
        this._link(`r:pv2:${key}`, pin > TH, true, PAL.pv, pin);
        this._link(key, Math.abs(acNet) > TH, acNet >= 0, acNet >= 0 ? (bp !== null && bp < -TH ? PAL.dis : PAL.pv) : PAL.imp, Math.abs(acNet));
      } else if (via) {
        // Solar -> Speicher (Eingang) und Speicher -> Haus (Ausgang); Ausgang in Batteriefarbe, sobald der Speicher entlädt
        this._link('pvbat', pin > TH, true, PAL.pv, pin);
        // Laden aus dem Netz: Linie läuft vom Haus zum Speicher (Netzfarbe), sonst wie bisher vom Speicher ins Haus
        const acNet1 = out - acG;
        if (acG > TH) this._link(key, Math.abs(acNet1) > TH, acNet1 >= 0, acNet1 >= 0 ? (bp !== null && bp < -TH ? PAL.dis : PAL.pv) : PAL.imp, Math.abs(acNet1));
        else this._link(key, out > TH, true, bp !== null && bp < -TH ? PAL.dis : PAL.pv, out);
      } else this._link(key, on && !x.lead, !chg, col, bp);
    });
    const util = this._utilUpdate();
    if (this._s3d) {
      this._routes3d({ bats, gImp: gImpM, gExp, p1Home: p1Home + p1Rest, p2Home: p2Home + p2Rest, p1Bat, p1Exp, p2Exp, pv2Bat: p2Bat });
      this._draw3d({ pv1, pv2, grid, home, bats, src: { pv: pvHome, bat: bDis, imp: gImp }, util });
    }
    this._banner({ pv, grid, bat, soc, home, gImp: gImpM, gExp });
    // Momentaufnahme fuer die "Warum?"-Erklaerung (why)
    this._wy = { home, pv: pv || 0, pvHome, bDis, bmChg, gImp, gExp, bats: bats.filter((x) => !x.lead).map((x) => Object.assign({ n: x.b.name || T('flow.battery'), p: x.p, soc: x.soc }, this._limits(x.b))) };
    this._anim('home', home, this._$('.core'));
    const sh = { pv: tot ? pvHome / tot : 0, bat: tot ? bDis / tot : 0, grid: tot ? gImp / tot : 0 };
    // home_icon_color: autarkie (optional, #93): Das Haus-Symbol im Ring ist grün bei 100 % Autarkie, gelb von 50 bis 99 %, rot darunter. Ohne Verbrauch bleibt es türkis
    {
      const hi = this._$('.core .hico');
      if (hi) {
        const on = /^(autarkie|autarky|autark)$/i.test(String(c.home_icon_color || '').trim());
        const aut = home > TH ? 1 - gImp / home : null;
        const rgbv = !on || aut === null ? '' : aut >= 0.995 ? PAL.exp : aut >= 0.5 ? PAL.pv : PAL.imp;
        if (rgbv) { if (hi.style.getPropertyValue('--hic') !== rgbv) hi.style.setProperty('--hic', rgbv); } else if (hi.style.getPropertyValue('--hic')) hi.style.removeProperty('--hic');
      }
    }
    // home_color: source (optional): Die Zahl über dem Haus nimmt die Farbe der Quelle mit dem größten Anteil. Erst ab 5 Punkten Vorsprung wechselt die Farbe
    const hn = this._$('.core .num');
    if (hn) {
      let col = '';
      if (c.home_color === 'source' && tot > 0) {
        const lead = ['pv', 'bat', 'grid'].reduce((a, k) => (sh[k] > sh[a] ? k : a), 'pv');
        const keep = this._hc && sh[this._hc] >= sh[lead] - 0.05 ? this._hc : lead;
        this._hc = keep;
        col = `rgb(${keep === 'pv' ? PAL.pv : keep === 'bat' ? PAL.dis : PAL.imp})`;
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
    const showShare = c.show_share === true || String(c.show_share).toLowerCase() === 'true';
    this._wyItems = [];
    const pw = c.consumers.map(() => -1);
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
        // eigener Preis je Verbraucher (optional): price (Sensor, Euro pro kWh) oder price_ct (Cent pro kWh), zum Beispiel ein Wärmepumpentarif. Ein eigener Zusatzwert (secondary) hat Vorrang
        else if (!x._g2 && !secTxt && on && (x.price || typeof x.price_ct === 'number')) { const pr = WD.price(h, x.price, x.price_ct, 0); if (pr > 0) secTxt = `${nf(p / 1000 * pr, 2)} ${cur()}/h`; }
        sumAll += p || 0;
        pw[i] = p || 0;
        if (this._hzOn()) this._hz('c' + i, p === null || p <= onW(x));
        this._wyItems.push({ n: x.name || x.entity, w: p || 0, c: x.color });
        el.classList.toggle('on', on);
        this._anim('c' + i, p, el);
        if (showShare) this._set(`[data-k="c${i}"] .shr .num`, p === null || !(home > TH) ? '—' : String(Math.min(999, Math.round(p / home * 100))));
        // #83: secondary_name steht vor dem Wert des Zusatzsensors, z. B. "SoC eAuto 80 %"
        this._set(`[data-k="c${i}"] .c-sec`, p === null ? T('offline') : secTxt && x.secondary_name ? x.secondary_name + ' ' + secTxt : secTxt);
        this._link('c' + i, on, false, rgb(x.color, '167,139,250'), p);
      } else if (this._statusMode(x)) {
        // Statuskachel (#108): kein Leistungssensor, zeigt EIN, AUS oder Unbekannt. Geht nicht in die Leistungsrechnung ein
        const sv = secSt ? String(secSt.state).trim().toLowerCase() : '';
        const ON = ['on', 'true', 'ein', 'an', 'open', 'offen', 'yes', 'ja', 'active', 'aktiv', 'running', 'heat', 'cool', 'home', 'unlocked'], OFF = ['off', 'false', 'aus', 'closed', 'geschlossen', 'no', 'nein', 'inactive', 'idle', 'standby', 'not_home', 'locked'];
        const isNum = sv !== '' && !isNaN(parseFloat(sv)) && isFinite(sv), unk = !secSt || ['unavailable', 'unknown', 'none', ''].includes(sv);
        const isOn = !unk && (ON.includes(sv) || (isNum && parseFloat(sv) > 0)), isOff = !unk && (OFF.includes(sv) || (isNum && parseFloat(sv) <= 0));
        const txt = unk ? T('status.unknown') : isOn ? T('status.on') : isOff ? T('status.off') : String(secSt.state);
        el.classList.toggle('on', isOn);
        el.style.setProperty('--c', isOn ? PAL.exp : rgb(x.color, '167,139,250'));
        this._set(`[data-k="c${i}"] .num`, txt);
        this._set(`[data-k="c${i}"] .unit`, '');
        this._set(`[data-k="c${i}"] .c-sec`, x.secondary_name || '');
      } else {
        el.classList.add('on');
        const parts = secTxt ? secTxt.split(' ') : ['—'];
        this._set(`[data-k="c${i}"] .num`, parts[0]);
        this._set(`[data-k="c${i}"] .unit`, parts.slice(1).join(' '));
      }
    });
    this._topCons(pw);
    // Kachel "Nicht erfasst" bei einzelnen Verbrauchern (show_rest: true): Hausverbrauch minus Summe der Verbraucher
    const crel = this._$('[data-k="crest"]');
    if (crel) {
      const restW = Math.max(0, home - sumAll - bmChg), restMin = parseFloat(c.rest_min) || 0;
      const show = restMin <= 0 || (home > TH && restW / home * 100 >= restMin), on = show && restW > TH;
      crel.style.display = show ? '' : 'none';
      crel.classList.toggle('on', on);
      this._anim('crest', restW, crel);
      if (showShare) this._set('[data-k="crest"] .shr .num', !(home > TH) ? '—' : String(Math.min(999, Math.round(restW / home * 100))));
      this._link('crest', on, false, PAL.mut, restW);
    }
    const G = c.consumer_groups || [];
    if (G.length) {
      // Einzelverbraucher neben den Gruppen zaehlen ebenfalls als erfasst (sumAll enthaelt hier erst die Einzelverbraucher)
      let known = sumAll, vis = 0;
      G.forEach((g, i) => {
        const el = this._$(`[data-k="g${i}"]`);
        if (!el) return;
        let sum = 0, any = false;
        (g.items || []).forEach((x, j) => {
          const it = this._$(`[data-i="${i}-${j}"]`);
          if (!it) return;
          const st = x.entity ? h.states[x.entity] : null;
          const p = x.entity ? this._cw(x) : null;
          const hzItem = this._hzOn() && !!x.entity && this._hz(`i${i}-${j}`, p === null || p <= onW(x));
          it.classList.toggle('off', (!!x.entity && (!st || st.state === 'unavailable')) || hzItem);
          let txt = '';
          if (p !== null) { sum += p; any = true; const sp = this._sw(p); txt = sp[0] + ' ' + sp[1]; }
          const sec = x.secondary && h.states[x.secondary];
          if (!txt && sec && !['unavailable', 'unknown'].includes(sec.state)) {
            const dec = x.secondary_decimals === undefined ? 1 : x.secondary_decimals;
            txt = `${nf(parseFloat(sec.state) || 0, dec)} ${sec.attributes.unit_of_measurement || ''}`.trim();
            if (x.secondary_name) txt = x.secondary_name + ' ' + txt;
          }
          it.classList.toggle('on', (p || 0) > onW(x));
          const b = it.querySelector('b');
          if (b.textContent !== txt) b.textContent = txt;
        });
        if (this._gSort) this._sortGroup(i, g);
        // #79: Gesamtsensor der Gruppe (entity, z. B. Zwischenzähler). Die Gruppe zeigt dann dessen Wert, die Zeile "Rest" die Differenz
        // zur Summe der Geräte (nie negativ). Erfasst ist dann der Messwert, nicht die Summe: So zählt nichts doppelt
        const tot = g.entity ? watt(h, g.entity) : null, gv = tot !== null ? tot : sum;
        const rr = g.entity ? this._$(`[data-gr="${i}"]`) : null;
        if (rr) {
          const rw = tot === null ? null : Math.max(0, tot - sum), sp = rw === null ? null : this._sw(rw), txt = sp ? sp[0] + ' ' + sp[1] : '';
          rr.style.display = rw === null ? 'none' : '';
          rr.classList.toggle('on', (rw || 0) > TH);
          const b = rr.querySelector('b');
          if (b.textContent !== txt) b.textContent = txt;
        }
        known += gv;
        sumAll += gv;
        const wi = (g.items || []).map((x) => ({ n: x.name || x.entity, w: x.entity ? (this._cw(x) || 0) : 0 })).filter((x) => x.w > TH).sort((a, b) => b.w - a.w);
        this._wyItems.push({ n: g.name, w: gv, c: g.color, top: wi.length > 1 && wi[0].w >= gv * 0.5 ? wi[0] : null });
        let shown = tot !== null || (g.items || []).some((x) => !x.entity || (h.states[x.entity] && h.states[x.entity].state !== 'unavailable'));
        if (this._hzOn() && shown && this._hz('g' + i, !(gv > onW(g)))) shown = false;
        el.style.display = shown ? '' : 'none';
        if (shown) vis++;
        const on = shown && gv > onW(g);
        el.classList.toggle('on', on);
        this._anim('g' + i, any || tot !== null ? gv : null, el);
        this._link('g' + i, on, false, rgb(g.color, '167,139,250'), gv);
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
    // pv.daily_ac: Der Tagesertrag zählt nur die Abgabe des Wechselrichters. Die Batterie-Ladung fehlt darin, die Entladung steckt darin
    if (c.pv && c.pv.daily_ac === true && dPv !== null) dPv = Math.max(0, dPv + (sumBat('daily_charge', balB) || 0) - (sumBat('daily_discharge', balB) || 0));
    this._set('[data-s="pv"] b', `${this._fk(dPv)}<small>kWh</small>`, true);
    this._dPv = dPv;
    if (this._fsw) { const f0 = this._fcDaySum(); this._set('[data-s="fc0"] b', `${this._fk(f0)}<small>kWh</small>`, true); }
    if ((c.pv && c.pv.forecast_tomorrow) || (c.pv2 && c.pv2.forecast_tomorrow)) this._set('[data-s="fc1"] b', `${this._fk(this._fcSum('forecast_tomorrow'))}<small>kWh</small>`, true);
    if ((c.pv && c.pv.forecast_day_after) || (c.pv2 && c.pv2.forecast_day_after)) this._set('[data-s="fc2"] b', `${this._fk(this._fcSum('forecast_day_after'))}<small>kWh</small>`, true);
    this._set('[data-s="imp"] b', `${this._fk(dImp)}<small>kWh</small>`, true);
    this._set('[data-s="exp"] b', `${this._fk(dExp)}<small>kWh</small>`, true);
    this._set('[data-s="bat"] b', `+${this._fk(dChg)}<small>/</small> −${this._fk(dDis)}<small>kWh</small>`, true);
    let aut = null, dHome = c.home && c.home.daily ? en(c.home.daily) : null;
    if (dPv !== null && dImp !== null) {
      const cons = dPv + dImp - (dExp || 0) - (sumBat('daily_charge', balB) || 0) + (sumBat('daily_discharge', balB) || 0);
      if (cons > 0) aut = 1 - dImp / cons;
      if (dHome === null && !(c.home && c.home.daily)) dHome = Math.max(0, cons);
    }
    // consumers[].daily: Kachel je Verbraucher. daily_from_home: true zieht den Wert von "Haus heute" ab (zum Beispiel die Wallbox)
    const subN = [];
    let subV = 0;
    c.consumers.forEach((x, i) => {
      if (!x || !x.daily) return;
      const dv = en(x.daily);
      this._set(`[data-s="cd${i}"] b`, `${this._fk(dv)}<small>kWh</small>`, true);
      if (x.daily_from_home === true || String(x.daily_from_home).toLowerCase() === 'true') { subN.push(x.daily_name || x.name || x.entity || x.daily); subV += dv || 0; }
    });
    if (subN.length && dHome !== null) {
      dHome = Math.max(0, dHome - subV);
      this._set('[data-s="home"] > span', '<i></i>' + esc(T('stat.home.excl', { n: subN.join(', ') })), true);
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
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step && step % 1 ? 'any' : step || 1, mode: 'box' } } });
  const sec = (name, title, schema) => ({ type: 'expandable', name, title, schema });

  const LABELS = {
    text_muted: 'Beschriftungen (sonst grau)', text: 'Werte und Titel',
    title: 'Titel', name: 'Anzeigename', icon: 'Symbol', minus: 'Differenz: abziehen (Sensor, W), z. B. Zähler 2 einer Zählerkaskade', plus: 'Differenz: dazurechnen (Sensor, W, optional)',
    entity: 'Sensor (Leistung)', show_wkwp: 'Zusätzlich Watt je kWp anzeigen', co2_intensity: 'CO₂-Intensität (g/kWh, z. B. Electricity Maps)', co2_fossil: 'Anteil fossiler Energie (%)', daily: 'Tageswert heute (kWh)', daily_name: 'Name der Tageswert-Kachel (optional)', daily_from_home: 'Tageswert von „Haus heute“ abziehen', price_ct: 'Eigener Preis (Cent pro kWh, zeigt Kosten pro Stunde)', secondary_mode: 'Zusatzwert anzeigen als', daily_ac: 'Tagesertrag zählt ohne Batterie-Ladung (Hybrid-Wechselrichter)', forecast: 'Prognose (Leistung in W/kW oder Tagesprognose in kWh)', forecast_tomorrow: 'Prognose morgen (kWh, z. B. Forecast.Solar)', forecast_day_after: 'Prognose übermorgen (kWh, optional)',
    price: 'Preis (Sensor oder Helfer, pro kWh)', price_ct: 'oder fester Preis (Cent pro kWh)',
    invert: 'Vorzeichen umkehren', daily_import: 'Bezug heute (kWh)', daily_export: 'Einspeisung heute (kWh)',
    power_import: 'oder getrennt: Bezug aus dem Netz (Sensor, W)', power_export: 'oder getrennt: Einspeisung ins Netz (Sensor, W)', power_charge: 'oder getrennt: Ladeleistung (Sensor)', power_discharge: 'oder getrennt: Entladeleistung (Sensor)', power: 'Sensor Lade-/Entladeleistung', soc: 'Sensor Ladestand (%)', capacity_kwh: 'Kapazität (kWh)',
    reserve_soc: 'Entladegrenze (Sensor oder Helfer, %)', max_soc: 'Maximalladung (Sensor oder Helfer, %)', groups_lines: 'Linien zu den Verbrauchern', hide_rest: 'Kachel "Nicht erfasst" ausblenden', hide_zero: 'Ruhende Verbraucher ausblenden (unter „Aktiv ab“)', hide_zero_delay: 'Ausblenden erst nach (Sekunden, Standard 30)', show_rest: 'Kachel "Nicht erfasst" auch bei einzelnen Verbrauchern ohne Gruppen zeigen', add_to_home: 'Hausverbrauch enthält die zweite Anlage nicht', rest_min: 'Kachel "Nicht erfasst" erst ab (%)', consumers_top: 'Nur die größten Verbraucher zeigen (Anzahl)', text_size: 'Textgröße', reserve_pct: 'oder feste Entladegrenze (%)', max_pct: 'oder feste Maximalladung (%)', soc_display: 'Ladestand anzeigen als', tap: 'Klick auf die Batterie-Kachel öffnet',
    power_out: 'Ausgangsleistung ins Haus (Sensor, nur für Speicher mit angeschlossenen Modulen, z. B. Anker Solarbank „AC-Hausabgabe“)', pv_to_battery: 'Solar läuft durch den Speicher (z. B. Marstek B2500, Anker Solarbank)',
    temp: 'Temperatur (Sensor, optional)', daily_charge: 'Geladen heute (kWh)', daily_discharge: 'Entladen heute (kWh)', behind_meter: 'Speicher hinter dem Zähler (zählt wie ein Gerät im Haus)',
    grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)', grid_price_ct: 'oder fester Strompreis (Cent pro kWh)', grid_price_times: 'Preise nach Uhrzeit (Liste, siehe Assistent)', theme: 'Farbschema', language: 'Sprache der Karte', fuel: 'Brennstoff', big_value: 'Große Zahl der Batterie-Kachel (nur mit „Solar läuft durch den Speicher“)', self_consumption: 'Eigenbedarf des Speichers (Sensor, optional)', kwh_per_l: 'kWh je Liter (nur Öl, Standard 10)', no_name: 'Ohne Namen (nur der Wert)', accent: 'Akzentfarbe (z. B. 34,197,94 oder #22c55e)', feed_in_ct: 'oder feste Einspeisevergütung (Cent pro kWh)',
    daily_from_total: 'Tageswerte aus Gesamtzählern berechnen (wie das Energie-Dashboard)', show_clock: 'Uhr anzeigen', compact_forecast: 'Prognose heute: in der Solar-Kachel (Kurzansicht)', forecast_swap: 'Prognose heute: unten neben morgen und übermorgen (ausführliche Ansicht)', why: 'Warum?-Erklärung (? an Netz, Solar und Batterie)', to_battery: 'Läuft durch Speicher Nr. (0 = direkt ins Haus)', power_in: 'AC-Ladung aus dem Haus (Sensor, nur mit „Läuft durch Speicher“)', label_size: 'Größe der Beschriftungen (nur kleine Texte, Zahl z. B. 1,5)', home_size: 'Größe der Zahl über dem Haus (Faktor, z. B. 1,5)', home_label_size: 'Größe von „Hausverbrauch“ unter der Zahl (Faktor)', home_percentage_size: 'Größe der Prozente über der Zahl (Faktor)', kwp: 'Anlagenleistung (kWp): zeigt die aktuelle Erzeugung in % davon', extra: 'Zusatzwerte', alarm: 'Alarm (Sensor, schaltet die Kachel rot)', unit: 'Einheit (optional)', warn_above: 'Warnung ab (Wert wird gelb)', warn_below: 'Warnung unter (Wert wird gelb)', grid_import: 'Netzbezug', grid_export: 'Einspeisung', battery: 'Batterie (Ruhezustand)', battery_charge: 'Batterie lädt', battery_discharge: 'Batterie entlädt', size: 'Größe der Kachel', weather: 'Wetter (Entität, zeigt das Himmelsband)', home_color: 'Farbe der Zahl beim Haus', home_icon_color: 'Farbe des Haus-Symbols', grid_side: 'Netz-Kachel: Seite', show_share: 'Verbraucher: Anteil am Hausverbrauch in % anzeigen', show_soc: 'Batterie: Ladestand in % neben der Leistung anzeigen', style: 'Darstellung', house_style: 'Haus in der 3D-Ansicht', compact: 'Kurzansicht (kompakt)', watt_only: 'Leistung immer in Watt (nie kW)', animations: 'Animationen', groups_columns: 'Gruppen pro Reihe (leer = alle nebeneinander)', on_w: 'Aktiv ab (W, Standard 10)', fit_screen: 'Auf Bildschirmhöhe skalieren',
    roof_color: 'Dachfarbe in der 3D-Ansicht', consumer_groups_sort: 'Reihenfolge der Geräte in Gruppen', decimals: 'Nachkommastellen bei kWh (leer = automatisch)',
    nav_path: 'Weiter-Schaltfläche: Pfad (z. B. /lovelace/geraete)', nav_label: 'Weiter-Schaltfläche: Text',
    secondary: 'Zusatzwert (Sensor, z. B. Temperatur)', secondary_name: 'Name vor dem Zusatzwert (z. B. SoC eAuto)', rest_name: 'Gruppe: Name der Zeile Rest (nur mit Gesamtsensor)', color: 'Farbe (z. B. #a78bfa)', image: 'Logo (Bild-URL, ersetzt das Symbol)',
  };

  const BIGV = [{ value: 'auto', label: 'Akkuleistung (Standard)' }, { value: 'out', label: 'Ausgang ins Haus (bei Durchleitung und Entladung)' }];
  const PV_VIA = [{ value: 'aus', label: 'Aus: Solar speist das Haus (Standard)' }, { value: 'direkt', label: 'Direkt: Solar läuft durch den Speicher (braucht die Ausgangsleistung)' }];
  const GRIDSIDE = [{ value: 'left', label: 'Links, unter Solar (Standard)' }, { value: 'right', label: 'Rechts neben dem Haus (spart Höhe)' }];
  const HOMEICO = [{ value: 'standard', label: 'Standard (Türkis)' }, { value: 'autarkie', label: 'Nach Autarkie (grün bei 100 %, gelb ab 50 %, sonst rot)' }];
  const HOMECOL = [{ value: 'standard', label: 'Standard (Türkis)' }, { value: 'source', label: 'Farbe der größten Quelle (PV gelb, Speicher blau, Netz rot)' }];
  const STYLE = [{ value: 'flach', label: 'Flach: Kacheln und Ring (Standard)' }, { value: '3d', label: '3D: Haus, Solar, Netz und Speicher als Objekte' }];
  const HOUSE = [{ value: 'sattel', label: 'Satteldach (Standard)' }, { value: 'flach', label: 'Flachdach' }];
  const COMPACT = [{ value: 'aus', label: 'Aus: ausführliche Ansicht (Standard)' }, { value: 'auto', label: 'Nur auf dem Handy' }, { value: 'immer', label: 'Immer' }];

  // Listen als Platzhalter-Abschnitte "0", "1", ...: Home Assistant speichert sie als Objekt, die Karte macht daraus wieder eine Liste
  const extraFields = () => [ent('entity', ['sensor', 'binary_sensor', 'input_number', 'number']), txt('name'), txt('unit'), numb('decimals', 0, 4, 1), numb('warn_above', -1000000, 1000000, 0.1), numb('warn_below', -1000000, 1000000, 0.1), bool('no_name')];
  const slots = (n, titleOf, schemaOf) => Array.from({ length: n }, (_, i) => sec(String(i), titleOf(i + 1), schemaOf(i)));
  const consumerFields = () => [ent('entity', ['sensor']), bool('invert', false), entm('minus', ['sensor']), entm('plus', ['sensor']), ent('daily', ['sensor']), txt('daily_name'), bool('daily_from_home', false), numb('price_ct', 0, 200, 0.01), { name: 'secondary_mode', selector: { select: { mode: 'dropdown', options: [{ value: 'zahl', label: 'Zahl (Standard)' }, { value: 'status', label: 'Status: EIN, AUS oder Unbekannt' }] } } }, txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'), ent('secondary', ['sensor']), txt('secondary_name'), numb('on_w', 0, 100000, 1), { name: 'size', selector: { select: { mode: 'dropdown', options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'mittel', label: 'Mittel (eine Spalte, größere Zahl)' }, { value: 'gross', label: 'Groß (breite Kachel mit großer Zahl)' }] } } }];
  const itemFields = () => [ent('entity', ['sensor']), bool('invert', false), entm('minus', ['sensor']), entm('plus', ['sensor']), txt('name'), ent('secondary', ['sensor']), txt('secondary_name'), numb('on_w', 0, 100000, 1)];
  const groupFields = () => [
    txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'), numb('on_w', 0, 100000, 1), ent('entity', ['sensor']), txt('rest_name'),
    sec('items', 'Verbraucher der Gruppe', slots(10, (n) => `Verbraucher ${n}`, itemFields)),
  ];

  // Weitere Speicher (ab dem zweiten): jeder mit eigener Kachel
  const batteryFields = () => [
    txt('name'), ent('power', ['sensor']), ent('power_charge', ['sensor']), ent('power_discharge', ['sensor']), ent('soc', ['sensor']), bool('invert', false),
    numb('capacity_kwh', 0, 200, 0.1), numb('reserve_pct', 0, 100, 1), numb('max_pct', 0, 100, 1), ent('power_out', ['sensor']), ent('power_in', ['sensor']), ent('temp', ['sensor']),
    ent('daily_charge', ['sensor']), ent('daily_discharge', ['sensor']), bool('behind_meter', false), { name: 'big_value', selector: { select: { mode: 'dropdown', options: BIGV } } }, ent('self_consumption', ['sensor']),
    sec('extra', 'Zusatzwerte (bis zu 6)', slots(6, (n) => `Zusatzwert ${n}`, extraFields)), ent('alarm', ['sensor', 'binary_sensor']),
  ];

  WD.flowForm = () => ({
    schema: [
      txt('title'),
      sec('pv', 'Solar', [sec('strings', 'Einzelne Strings (bis zu 8, mit Name und Leistung)', slots(8, (n) => `String ${n}`, () => [ent('entity', ['sensor']), txt('name')])), numb('kwp', 0, 1000, 0.01), bool('show_wkwp', false), sec('extra', 'Zusatzwerte (bis zu 6, z. B. Spannung, Strom, Temperatur)', slots(6, (n) => `Zusatzwert ${n}`, extraFields)), ent('alarm', ['sensor', 'binary_sensor']), ent('entity', ['sensor']), txt('name'), bool('invert', false), ent('daily', ['sensor']), bool('daily_ac', false), ent('forecast', ['sensor']), ent('forecast_tomorrow', ['sensor']), ent('forecast_day_after', ['sensor'])]),
      sec('pv2', 'Zweite Solaranlage (z. B. Balkonkraftwerk)', [sec('strings', 'Einzelne Strings (bis zu 8, mit Name und Leistung)', slots(8, (n) => `String ${n}`, () => [ent('entity', ['sensor']), txt('name')])), numb('kwp', 0, 1000, 0.01), bool('show_wkwp', false), numb('to_battery', 0, 6, 1), sec('extra', 'Zusatzwerte (bis zu 6, z. B. Spannung, Strom, Temperatur)', slots(6, (n) => `Zusatzwert ${n}`, extraFields)), ent('alarm', ['sensor', 'binary_sensor']), ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor']), ent('forecast', ['sensor']), ent('forecast_tomorrow', ['sensor']), ent('forecast_day_after', ['sensor']), bool('add_to_home', false)]),
      sec('grid', 'Netz', [sec('extra', 'Zusatzwerte (bis zu 6, z. B. Spannung, Strom, Temperatur)', slots(6, (n) => `Zusatzwert ${n}`, extraFields)), ent('alarm', ['sensor', 'binary_sensor']), ent('entity', ['sensor']), ent('power_import', ['sensor']), ent('power_export', ['sensor']), txt('name'), bool('invert', false), ent('daily_import', ['sensor']), ent('daily_export', ['sensor']), ent('co2_intensity', ['sensor']), ent('co2_fossil', ['sensor'])]),
      sec('grid2', 'Zweiter Netzzähler (z. B. Wärmepumpe mit eigenem Zähler)', [ent('entity', ['sensor']), txt('name'), ent('price', ['sensor', 'input_number', 'number']), numb('price_ct', 0, 200, 0.01)]),
      sec('battery', 'Batterie', [
        { name: 'big_value', selector: { select: { mode: 'dropdown', options: BIGV } } }, ent('self_consumption', ['sensor']),
        sec('extra', 'Zusatzwerte (bis zu 6, z. B. Spannung, Strom, Temperatur)', slots(6, (n) => `Zusatzwert ${n}`, extraFields)), ent('alarm', ['sensor', 'binary_sensor']), ent('power', ['sensor']), ent('power_charge', ['sensor']), ent('power_discharge', ['sensor']), ent('power_out', ['sensor']), ent('soc', ['sensor']), txt('name'), bool('invert', false),
        numb('capacity_kwh', 0, 200, 0.1), ent('reserve_soc', ['sensor', 'number', 'input_number']), numb('reserve_pct', 0, 100, 1),
        ent('max_soc', ['sensor', 'number', 'input_number']), numb('max_pct', 0, 100, 1),
        { name: 'tap', selector: { select: { mode: 'dropdown', options: [{ value: 'power', label: 'Verlauf der Lade-/Entladeleistung (Standard)' }, { value: 'soc', label: 'Verlauf des Ladestands in %' }] } } },
      { name: 'soc_display', selector: { select: { mode: 'dropdown', options: [{ value: 'brutto', label: 'Ladestand der Batterie (Standard)' }, { value: 'nutzbar', label: 'Nutzbarer Anteil (0 % = Entladegrenze)' }] } } },
        ent('temp', ['sensor']), ent('daily_charge', ['sensor']), ent('daily_discharge', ['sensor']), bool('behind_meter', false),
      ]),
      { name: 'pv_to_battery', selector: { select: { mode: 'dropdown', options: PV_VIA } } },
      sec('batteries', 'Weitere Speicher (2. bis 5.)', slots(4, (n) => `Speicher ${n + 1}`, batteryFields)),
      sec('home', 'Haus (optional)', [ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor'])]),
      sec('gas', 'Gas oder Öl (eigene Kachel, zählt nicht zum Strom)', [{ name: 'fuel', selector: { select: { mode: 'dropdown', options: [{ value: 'gas', label: 'Gas (Standard)' }, { value: 'oil', label: 'Öl (Anzeige in Litern)' }] } } }, numb('kwh_per_l', 0, 20, 0.01), sec('extra', 'Zusatzwerte (bis zu 3, z. B. Kesseltemperatur)', slots(3, (n) => `Zusatzwert ${n}`, extraFields)), Object.assign(ent('entity', ['sensor']), { label: 'Leistung der Therme (W oder kW, optional)' }), txt('name'), Object.assign(ent('heating', ['sensor']), { label: 'Heizung heute (kWh oder m³)' }), Object.assign(ent('hot_water', ['sensor']), { label: 'Warmwasser heute (kWh oder m³)' }), Object.assign(ent('daily', ['sensor']), { label: 'oder nur: Gas heute gesamt (kWh oder m³)' }), Object.assign(numb('kwh_per_m3', 0, 20, 0.01), { label: 'kWh je m³ (Brennwert × Zustandszahl, nur bei m³)' })]),
      sec('water', 'Wasser (eigene Kachel)', [Object.assign(ent('entity', ['sensor']), { label: 'Durchfluss (l/min oder m³/h, optional)' }), txt('name'), Object.assign(ent('daily', ['sensor']), { label: 'Wasser heute (Liter oder m³)' })]),
      sec('water2', 'Zweiter Wasserzähler (eigene Kachel, z. B. Zisterne)', [Object.assign(ent('entity', ['sensor']), { label: 'Durchfluss (l/min oder m³/h, optional)' }), txt('name'), Object.assign(ent('daily', ['sensor']), { label: 'Wasser heute (Liter oder m³)' })]),
      sec('water3', 'Dritter Wasserzähler (eigene Kachel)', [Object.assign(ent('entity', ['sensor']), { label: 'Durchfluss (l/min oder m³/h, optional)' }), txt('name'), Object.assign(ent('daily', ['sensor']), { label: 'Wasser heute (Liter oder m³)' })]),
      sec('consumers', 'Einzelverbraucher (bis zu 30)', slots(30, (n) => `Verbraucher ${n}`, consumerFields)),
      sec('consumer_groups', 'Gruppen (bis zu 10)', slots(10, (n) => `Gruppe ${n}`, groupFields)),
      ent('grid_price', ['sensor', 'input_number']),
      numb('grid_price_ct', 0, 200, 0.1),
      { name: 'grid_price_times', selector: { object: {} } },
      ent('feed_in', ['sensor', 'input_number']),
      numb('feed_in_ct', 0, 200, 0.1),
      bool('daily_from_total', false),
      ent('weather', ['weather']),
      sec('colors', 'Farben (z. B. #22c55e)', [txt('pv'), txt('grid_import'), txt('grid_export'), txt('battery'), txt('battery_charge'), txt('battery_discharge'), txt('home'), txt('text_muted'), txt('text')]),
      numb('label_size', 0.5, 4, 0.1),
      numb('home_size', 0.5, 4, 0.1),
      numb('home_label_size', 0.5, 4, 0.1),
      numb('home_percentage_size', 0.5, 4, 0.1),
      bool('why', false),
      bool('show_clock', true),
      bool('fit_screen', true),
      bool('watt_only', false),
      bool('hide_rest', false),
      bool('show_rest', false),
      bool('forecast_swap', false),
      bool('show_share', false),
      bool('show_soc', false),
      bool('compact_forecast', false),
      numb('consumers_top', 1, 30, 1),
      bool('hide_zero', false),
      numb('hide_zero_delay', 0, 3600, 1),
      numb('groups_columns', 1, 12, 1),
      numb('rest_min', 0, 100, 1),
      { name: 'style', selector: { select: { mode: 'dropdown', options: STYLE } } },
      { name: 'house_style', selector: { select: { mode: 'dropdown', options: HOUSE } } },
      { name: 'home_color', selector: { select: { mode: 'dropdown', options: HOMECOL } } },
      { name: 'home_icon_color', selector: { select: { mode: 'dropdown', options: HOMEICO } } },
      { name: 'grid_side', selector: { select: { mode: 'dropdown', options: GRIDSIDE } } },
      { name: 'roof_color', selector: { select: { mode: 'dropdown', custom_value: true, options: [{ value: 'rot', label: 'Ziegelrot (Standard)' }, { value: 'anthrazit', label: 'Anthrazit' }, { value: 'schwarz', label: 'Schwarz' }, { value: 'grau', label: 'Grau' }, { value: 'braun', label: 'Braun' }, { value: 'gruen', label: 'Grün' }, { value: 'blau', label: 'Blau' }] } } },
      { name: 'consumer_groups_sort', selector: { select: { mode: 'dropdown', options: [{ value: 'konfiguriert', label: 'Wie eingetragen (Standard)' }, { value: 'leistung', label: 'Nach Leistung, aktive Geräte oben' }] } } },
      numb('decimals', 0, 3, 1),
      { name: 'compact', selector: { select: { mode: 'dropdown', options: COMPACT } } },
      { name: 'text_size', selector: { select: { mode: 'dropdown', custom_value: true, options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }, { value: '2', label: 'Doppelt (2, auch die Zahlen in den Kacheln)' }, { value: '3', label: 'Dreifach (3)' }] } } },
      { name: 'animations', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Wie am Gerät eingestellt (Standard)' }, { value: 'always', label: 'Immer, auch bei "Bewegung reduzieren"' }, { value: 'off', label: 'Aus (spart Rechenleistung, z. B. ältere Wandtablets)' }] } } },
      { name: 'groups_lines', selector: { select: { mode: 'dropdown', options: [{ value: 'direkt', label: 'Eine Linie je Gerät oder Gruppe (Standard)' }, { value: 'sammel', label: 'Eine Sammel-Linie zum ganzen Verbraucherbereich' }] } } },
      { name: 'theme', selector: { select: { mode: 'dropdown', options: WD.THEME_OPTIONS } } },
      { name: 'language', selector: { select: { mode: 'dropdown', options: WD.LANG_OPTIONS } } },
      txt('nav_path'),
      txt('nav_label'),
    ],
    computeLabel: (s) => s.label || LABELS[s.name] || s.title || s.name,
    computeHelper: (s) => (s.name === 'language' ? 'Optional. Standard: Die Karte nutzt die Sprache aus deinem Home-Assistant-Profil (Deutsch, Englisch oder Niederländisch, sonst Deutsch). Hier legst du sie fest, zum Beispiel Deutsch, wenn Home Assistant auf Englisch läuft. Zahlen- und Uhrzeitformat richten sich nach deinem Profil. Die Editoren bleiben deutsch.' : s.name === 'why' ? 'Optional. Zeigt an der Netz-, der Solar- und der Batterie-Kachel ein „?“. Ein Tipp erklärt in einfachem Deutsch, woher der Netzbezug oder die Einspeisung kommt, warum Solar gerade so viel oder so wenig liefert und was die Batterie gerade tut oder warum sie nichts tut. Je mehr Verbraucher in der Karte stehen, desto genauer wird die Erklärung. Nur an einer Kachel: im YAML-Editor `why: [grid]`, `why: [pv]` oder `why: [battery]`.' : s.name === 'to_battery' ? 'Für Speicher mit eigenen Solarmodulen, zum Beispiel Anker SOLIX Solarbank: PV 2 läuft durch den Speicher, nicht direkt ins Haus. Nummer des Speichers wie in den Kacheln (1 = Batterie, 2 = erster Eintrag unter Weitere Speicher …). Der Speicher braucht „Ausgangsleistung ins Haus“ (AC-Abgabe) und gilt als hinter dem Zähler.' : s.name === 'power_in' ? 'AC-Leistung, die der Speicher aus dem Hausnetz zieht (bei Anker: „Netzbezugsleistung“). Ohne Angabe gilt 0.' : s.name === 'label_size' ? 'Optional. Vergrößert nur die kleinen Texte (Namen, Zusatzwerte, Beschriftungen) und lässt die Zahlen in den Kacheln, wie sie sind. Gut, wenn die Karte auf einen Bildschirm passen soll, die Beschriftungen aber zu klein sind. Beispiel: 1,5. Gilt vor der Textgröße.' : s.name === 'text_size' ? 'Normal, Groß, Sehr groß oder eine Zahl (zum Beispiel 2 oder 1,5). Eine Zahl vergrößert auch die Zahlen in den Kacheln. Wenn die Karte dadurch zu hoch wird, schalte „Auf Bildschirmhöhe skalieren“ aus.' : s.name === 'size' ? 'Normal, Mittel (eine Spalte, größere Zahl) oder Groß (breite Kachel mit großer Zahl). Gut für Wärmepumpe und Wallbox.' : s.name === 'weather' ? 'Zeigt unter der Kopfzeile ein Band mit dem Wetter des Tages (24 Stunden), dazu Temperatur sowie Sonnenaufgang und -untergang. Die Stundenwerte brauchen eine Wetter-Integration mit Vorhersage, zum Beispiel Met.no oder Deutscher Wetterdienst. Im YAML-Editor schaltet weather: auto die erste vorhandene Wetter-Entität ein.' : s.name === 'colors' ? 'Eigene Farben als #hex (zum Beispiel #22c55e) oder r,g,b. Leere Felder behalten die Standardfarbe. Batterie lädt und Batterie entlädt lassen sich getrennt einfärben.' : s.name === 'extra' ? 'Frei wählbare Zusatzwerte in dieser Kachel, zum Beispiel Spannung, Strom und Temperatur eines Wechselrichters. Jeder Eintrag braucht einen Sensor. Name und Einheit sind optional, ohne Angabe nimmt die Karte die des Sensors. Mit Warnung ab oder Warnung unter wird der Wert gelb.' : s.name === 'alarm' ? 'Optional. Ein Sensor, der einen Fehler meldet, zum Beispiel der Alarm oder Status des Wechselrichters. Bei einem Alarm erscheint in der Kachel ein roter Hinweis. Als Alarm gilt jeder Zustand außer off, ok, normal, none, false, idle und 0. Eigene Zustände (ok oder on) stellst du im YAML-Editor ein.' : s.name === 'title' ? 'Abfallkalender, Überschussvorschläge und Netzalarm stellst du im YAML-Editor ein.' : s.name === 'daily_from_total' ? 'Optional. Trage bei den Tageswerten (Bezug, Einspeisung, Ertrag, Batterie) Gesamtzähler ein, auch in Wh. Die Karte rechnet den Wert von heute selbst, aus der Langzeitstatistik.' : undefined),
  });

  // Assistent: Schritte mit Sensor-Vorschlägen
  const H = (...re) => re;
  const steps = () => [
    { short: 'Solar', title: 'Solaranlage', text: 'Wähle den Sensor, der die aktuelle Erzeugung der PV-Anlage in Watt anzeigt.', fields: [
      { path: 'pv.entity', label: 'PV-Leistung', kind: 'power', hints: H(/pv|solar|photovolt|inverter|wechselrichter|erzeugung/i, /input|eingang|power|leistung/i) },
      { path: 'pv.kwp', label: 'Anlagenleistung (kWp)', kind: 'number', optional: true, step: '0.01', help: 'Optional. Zum Beispiel 9.8 für 9,8 kWp. Die Solar-Kachel zeigt dann rechts neben der Leistung in Prozent, wie viel von der Anlagenleistung gerade erzeugt wird (bei 4,9 kW und 9,8 kWp also 50 %).' },
      { path: 'pv.show_wkwp', label: 'Zusätzlich Watt je kWp anzeigen', kind: 'bool', help: 'Optional, braucht die Anlagenleistung (kWp). Zeigt in der Solar-Kachel eine Zeile mit der erzeugten Leistung je installiertem kWp.' },
      { path: 'pv.strings.0.entity', label: 'String 1: Leistung', kind: 'power', optional: true, help: 'Optional. Einzelne Strings, zum Beispiel Süd und West. Die Solar-Kachel zeigt pro String eine Zeile mit Name und Leistung. Die Gesamtleistung oben bleibt der Sensor „PV-Leistung“.' },
      { path: 'pv.strings.0.name', label: 'String 1: Name', kind: 'text', optional: true },
      { path: 'pv.strings.1.entity', label: 'String 2: Leistung', kind: 'power', optional: true },
      { path: 'pv.strings.1.name', label: 'String 2: Name', kind: 'text', optional: true },
      { path: 'pv.strings.2.entity', label: 'String 3: Leistung', kind: 'power', optional: true },
      { path: 'pv.strings.2.name', label: 'String 3: Name', kind: 'text', optional: true },
      { path: 'pv.strings.3.entity', label: 'String 4: Leistung', kind: 'power', optional: true },
      { path: 'pv.strings.3.name', label: 'String 4: Name', kind: 'text', optional: true },
      { path: 'pv.strings.4.entity', label: 'String 5: Leistung', kind: 'power', optional: true },
      { path: 'pv.strings.4.name', label: 'String 5: Name', kind: 'text', optional: true },
      { path: 'pv.strings.5.entity', label: 'String 6: Leistung', kind: 'power', optional: true },
      { path: 'pv.strings.5.name', label: 'String 6: Name', kind: 'text', optional: true },
      { path: 'pv.strings.6.entity', label: 'String 7: Leistung', kind: 'power', optional: true },
      { path: 'pv.strings.6.name', label: 'String 7: Name', kind: 'text', optional: true },
      { path: 'pv.strings.7.entity', label: 'String 8: Leistung', kind: 'power', optional: true },
      { path: 'pv.strings.7.name', label: 'String 8: Name', kind: 'text', optional: true },
      { path: 'pv.invert', label: 'Solar: Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn der Zähler die Erzeugung als negativen Wert meldet.' },
      { path: 'pv.daily', label: 'Tagesertrag (kWh)', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute|yield|ertrag/i, /pv|solar|inverter/i) },
      { path: 'pv.daily_ac', label: 'Tagesertrag zählt ohne Batterie-Ladung', kind: 'bool', help: 'Für Hybrid-Wechselrichter, deren Tagesertrag nur die Abgabe des Wechselrichters zählt. Zeichen dafür: "Autarkie heute" steht bei 0 %, und "Haus heute" ist viel zu niedrig. Braucht "Geladen heute" und "Entladen heute" beim Speicher.' },
      { path: 'pv.forecast', label: 'Prognose heute (kWh oder Leistung in W/kW)', kind: 'forecast', optional: true, hints: H(/forecast|prognose|solcast|production|produktion/i, /today|heute|now|jetzt/i), help: 'Eine Tagesprognose in kWh (zum Beispiel Forecast.Solar "Energie Produktion heute" oder Solcast "Prognose heute") erscheint als "Prognose heute" in kWh. Eine Leistungsprognose in W/kW zeigt "Prognose" in Watt.' },
      { path: 'pv.forecast_tomorrow', label: 'Prognose morgen (kWh)', kind: 'energy', optional: true, hints: H(/tomorrow|morgen/i, /forecast|prognose|solcast|production|produktion|ertrag/i), help: 'Erwartete Produktion für morgen, zum Beispiel von Forecast.Solar oder Solcast. Erscheint als Kachel "PV morgen" unten in der Karte.' },
      { path: 'pv.forecast_day_after', label: 'Prognose übermorgen (kWh)', kind: 'energy', optional: true, hints: H(/day.?after|d2|uebermorgen|übermorgen|day_3|day3/i), help: 'Nicht jede Integration hat diesen Wert, Forecast.Solar zum Beispiel nicht.' },
      { path: 'forecast_swap', label: 'Prognose heute: unten neben morgen und übermorgen (ausführliche Ansicht)', kind: 'bool', help: 'Optional. Dann steht unten „Prognose heute“ neben morgen und übermorgen, und der bisherige Ertrag „Solar heute“ erscheint in der Solar-Kachel. Gilt für die ausführliche Ansicht. Für die Kurzansicht gibt es den Schalter darunter. Nur mit einer Tagesprognose in kWh als Prognose (heute).' },
      { path: 'compact_forecast', label: 'Prognose heute: in der Solar-Kachel (Kurzansicht)', kind: 'bool', help: 'Optional. Gilt nur für die Kurzansicht und mit eingetragener Prognose (pv.forecast): In der Solar-Kachel steht dann eine Zeile „Prognose heute … kWh“, alle anderen Zusatzzeilen bleiben ausgeblendet. Für die ausführliche Ansicht gibt es den Schalter darüber.' },
      { path: 'pv2.entity', label: 'Zweite Anlage, z. B. Balkonkraftwerk (Leistung)', kind: 'power', optional: true, hints: H(/bkw|balkon|pv2|solar2|plug|steckdose|shelly/i), help: 'Eigene Kachel und Linie. Die Bilanz (Autarkie, Eigenverbrauch, Herkunft) rechnet mit der Summe beider Anlagen.' },
      { path: 'pv2.name', label: 'Name der zweiten Anlage', kind: 'text', optional: true },
      { path: 'pv2.invert', label: 'Zweite Anlage: Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn der Sensor die Erzeugung als negativen Wert meldet.' },
      { path: 'pv2.daily', label: 'Tagesertrag der zweiten Anlage (kWh)', kind: 'energy', optional: true },
      { path: 'pv2.forecast', label: 'Zweite Anlage: Prognose heute (kWh oder Leistung in W/kW)', kind: 'forecast', optional: true, help: 'Optional, wie bei der ersten Anlage. Erscheint in der Kachel der zweiten Anlage. Mit „Prognose heute“ in der Kachel „Solar heute“ unten (Prognose-Tausch) zählen beide Anlagen zusammen.' },
      { path: 'pv2.forecast_tomorrow', label: 'Zweite Anlage: Prognose morgen (kWh)', kind: 'energy', optional: true, help: 'Optional. Die Kachel „PV morgen“ unten zeigt dann die Summe beider Anlagen.' },
      { path: 'pv2.forecast_day_after', label: 'Zweite Anlage: Prognose übermorgen (kWh)', kind: 'energy', optional: true, help: 'Optional. Die Kachel „PV übermorgen“ unten zeigt dann die Summe beider Anlagen.' },
      { path: 'pv2.to_battery', label: 'Zweite Anlage läuft durch Speicher Nr.', kind: 'number', optional: true, help: 'Für Speicher mit eigenen Solarmodulen, zum Beispiel Anker SOLIX Solarbank. Nummer wie in den Kacheln: 1 = Batterie, 2 = der erste Speicher unter Weitere Speicher. Der Speicher braucht dann die Ausgangsleistung ins Haus (AC-Abgabe).' },
      { path: 'pv2.add_to_home', label: 'Hausverbrauch enthält die zweite Anlage nicht', kind: 'bool', help: 'Nur aktivieren, wenn dein Hausverbrauchs-Sensor den Ertrag der zweiten Anlage NICHT enthält. Dann addiert die Karte ihn dazu.' },
    ] },
    { short: 'Netz', title: 'Stromnetz', text: 'Der Netzsensor zeigt Bezug und Einspeisung. Wenn später Bezug als Einspeisung angezeigt wird, setze "Vorzeichen umkehren".', fields: [
      { path: 'grid.entity', label: 'Netzleistung', kind: 'power', hints: H(/grid|netz|meter|zähler|zaehler|wirkleistung|smart.?meter/i, /power|leistung/i) },
      { path: 'grid.invert', label: 'Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn der Sensor bei Einspeisung positive Werte liefert.' },
      { path: 'grid.power_import', label: 'oder getrennt: Bezug aus dem Netz', kind: 'power', optional: true, hints: H(/grid|netz|meter|zähler|zaehler/i, /import|bezug|consum|purchase|buy/i), help: 'Nur wenn dein System zwei Sensoren hat (Bezug und Einspeisung, beide positiv). Dann das Feld "Netzleistung" leer lassen.' },
      { path: 'grid.power_export', label: 'oder getrennt: Einspeisung ins Netz', kind: 'power', optional: true, hints: H(/grid|netz|meter|zähler|zaehler/i, /export|einspeis|feed|sell/i) },
      { path: 'grid.daily_import', label: 'Netzbezug heute (kWh)', kind: 'energy', optional: true, hints: H(/import|bezug|verbrauch|consumption/i, /tag|daily|today|heute/i) },
      { path: 'grid.daily_export', label: 'Einspeisung heute (kWh)', kind: 'energy', optional: true, hints: H(/export|einspeis|feed/i, /tag|daily|today|heute/i) },
      { path: 'grid.co2_intensity', label: 'CO₂-Intensität (g/kWh)', kind: 'co2', optional: true, hints: H(/co2|co₂|carbon|electricity.?maps/i, /intens/i), help: 'Optional, zum Beispiel aus der Integration „Electricity Maps“. Beim Netzbezug zeigt die Netz-Kachel, wie viel CO₂ dabei pro Stunde entsteht.' },
      { path: 'grid.co2_fossil', label: 'Anteil fossiler Energie (%)', kind: 'percent', optional: true, hints: H(/fossil/i), help: 'Optional. Zeigt den fossilen Anteil im Netzstrom.' },
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
      { path: 'battery.power_out', label: 'Speicher mit eigenen Solarmodulen (z. B. Marstek B2500, Anker Solarbank): Ausgangsleistung ins Haus', kind: 'power', optional: true, hints: H(/ausgang|output|abgabe|ac.?out|hausabgabe/i, /batter|akku|speicher|storage|b2500|marstek|solarbank|solix/i), help: 'Hängen die Solarmodule direkt am Speicher, trägst du hier die Leistung ein, die der Speicher ans Haus abgibt (bei der Anker Solarbank zum Beispiel „AC-Hausabgabe“). Danach unten Solar läuft durch den Speicher auf Direkt stellen. Als Solar-Sensor dient die Eingangsleistung der Module.' },
      { path: 'pv_to_battery', label: 'Solar läuft durch den Speicher', kind: 'choice', options: PV_VIA, help: 'Nur für Speicher vor dem Wechselrichter, zum Beispiel Marstek B2500 oder Anker Solarbank. Braucht die Ausgangsleistung ins Haus (Feld darüber). Die Karte zeichnet dann Solar -> Speicher -> Haus und zeigt Durchleitung, wenn der Speicher weder lädt noch entlädt.' },
      { path: 'battery.invert', label: 'Laden und Entladen vertauschen (Vorzeichen umkehren)', kind: 'bool', help: 'Zeigt die Karte beim Laden „Entladung“ (oder umgekehrt), aktiviere das. Das gilt, wenn dein Sensor Laden negativ und Entladen positiv meldet.' },
      { path: 'battery.capacity_kwh', label: 'Kapazität (kWh)', kind: 'number', optional: true, help: 'Für die Prognose "voll um / reicht bis".' },
      { path: 'battery.temp', label: 'Temperatur', kind: 'temp', optional: true, hints: H(/batter|akku|speicher|storage|bat\d/i, /temp/i), help: 'Optional. Steht in der Kachel unter dem Ladestand.' },
      { path: 'battery.daily_charge', label: 'Geladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /geladen|lade|charge/i), help: 'Für "Autarkie heute" und "Haus heute". Ohne diese beiden Werte zählt der Batterie dort nicht als eigener Strom.' },
      { path: 'battery.daily_discharge', label: 'Entladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /entlad|discharge/i) },
      { path: 'battery.behind_meter', label: 'Speicher hinter dem Zähler', kind: 'bool', help: 'Nur für Speicher, die der Wechselrichter oder Netzzähler nicht kennt, zum Beispiel an der Steckdose. Seine Ladung zählt als Verbrauch, seine Abgabe als Quelle im Ring und im Hausverbrauch.' },
    ] },
    { short: 'Speicher', title: 'Weitere Speicher', text: 'Optional. Hast du mehr als einen Speicher, trage hier den zweiten und dritten ein, im nächsten Schritt den vierten und fünften. Jeder bekommt eine eigene Kachel, Ring und Tageswerte rechnen mit der Summe. Der erste Speicher steht im Schritt davor.', fields: [
      { path: 'batteries.0.name', label: 'Name von Speicher 2', kind: 'text', optional: true },
      { path: 'batteries.0.power', label: 'Speicher 2: Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i), help: 'Hat dein System getrennte Sensoren für Laden und Entladen, trägst du sie unter Alle Felder ein.' },
      { path: 'batteries.0.soc', label: 'Speicher 2: Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level/i, /batter|akku/i) },
      { path: 'batteries.0.capacity_kwh', label: 'Speicher 2: Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'batteries.0.power_out', label: 'Speicher 2: Ausgangsleistung ins Haus (AC-Abgabe)', kind: 'power', optional: true, hints: H(/ac.?aus|ausgang|output|abgabe|ac_output/i, /batter|akku|speicher|solarbank/i), help: 'Nur für Speicher mit eigenen Solarmodulen (siehe „Zweite Anlage läuft durch Speicher“). Bei der Anker Solarbank: „AC-Ausgang“.' },
      { path: 'batteries.0.power_in', label: 'Speicher 2: AC-Ladung aus dem Haus', kind: 'power', optional: true, hints: H(/netzbezug|ac.?ein|eingang|input|ac_input/i, /batter|akku|speicher|solarbank/i), help: 'Optional. Leistung, die der Speicher aus dem Hausnetz zieht. Bei der Anker Solarbank: „Netzbezugsleistung“. Ohne Angabe gilt 0.' },
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
    { short: 'Speicher 4/5', title: 'Noch mehr Speicher', text: 'Optional. Nur wenn du einen vierten oder fünften Speicher hast, zum Beispiel mehrere Solarbänke. Sonst einfach weiter. Per YAML (batteries) gehen auch mehr.', fields: [
      { path: 'batteries.2.name', label: 'Name von Speicher 4', kind: 'text', optional: true },
      { path: 'batteries.2.power', label: 'Speicher 4: Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i) },
      { path: 'batteries.2.soc', label: 'Speicher 4: Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level/i, /batter|akku/i) },
      { path: 'batteries.2.capacity_kwh', label: 'Speicher 4: Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'batteries.2.temp', label: 'Speicher 4: Temperatur', kind: 'temp', optional: true, hints: H(/batter|akku|speicher|storage|bat\d/i, /temp/i) },
      { path: 'batteries.2.daily_charge', label: 'Speicher 4: Geladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /geladen|lade|charge/i) },
      { path: 'batteries.2.daily_discharge', label: 'Speicher 4: Entladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /entlad|discharge/i) },
      { path: 'batteries.2.behind_meter', label: 'Speicher 4: hinter dem Zähler', kind: 'bool', help: 'Nur für Speicher, die der Wechselrichter oder Netzzähler nicht kennt, zum Beispiel an der Steckdose. Seine Ladung zählt als Verbrauch, seine Abgabe als Quelle im Ring und im Hausverbrauch.' },
      { path: 'batteries.3.name', label: 'Name von Speicher 5', kind: 'text', optional: true },
      { path: 'batteries.3.power', label: 'Speicher 5: Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i) },
      { path: 'batteries.3.soc', label: 'Speicher 5: Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level/i, /batter|akku/i) },
      { path: 'batteries.3.capacity_kwh', label: 'Speicher 5: Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'batteries.3.temp', label: 'Speicher 5: Temperatur', kind: 'temp', optional: true, hints: H(/batter|akku|speicher|storage|bat\d/i, /temp/i) },
      { path: 'batteries.3.daily_charge', label: 'Speicher 5: Geladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /geladen|lade|charge/i) },
      { path: 'batteries.3.daily_discharge', label: 'Speicher 5: Entladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /entlad|discharge/i) },
      { path: 'batteries.3.behind_meter', label: 'Speicher 5: hinter dem Zähler', kind: 'bool', help: 'Nur für Speicher, die der Wechselrichter oder Netzzähler nicht kennt, zum Beispiel an der Steckdose. Seine Ladung zählt als Verbrauch, seine Abgabe als Quelle im Ring und im Hausverbrauch.' },
    ] },
    { short: 'Haus', title: 'Hausverbrauch', text: 'Optional. Ohne Angabe wird der Verbrauch aus Solar, Netz und Batterie berechnet.', fields: [
      { path: 'home.entity', label: 'Hausverbrauch', kind: 'power', optional: true, hints: H(/haus|home|house|verbrauch|consumption|load/i) },
      { path: 'home.daily', label: 'Hausverbrauch heute (kWh)', kind: 'energy', optional: true, help: 'Optional. Ohne Angabe berechnet die Karte den Wert aus PV-Ertrag, Netzbezug, Einspeisung und Batterie heute.' },
    ] },
    { short: 'Gas/Wasser', title: 'Gas, Öl und Wasser (optional)', text: 'Eigene Kacheln mit Linie zum Haus. Sie zählen nicht zum Strom: Hausverbrauch, Ring und Autarkie bleiben gleich. Überspringen, wenn du das nicht brauchst.', fields: [
      { path: 'gas.entity', label: 'Gas: Leistung der Therme (W oder kW)', kind: 'power', optional: true, hints: H(/gas|therme|heiz|boiler|brenner/i), help: 'Optional. Dann zeigt die Kachel groß die aktuelle Leistung, und die Linie läuft nur beim Heizen. Ohne steht groß der Verbrauch von heute.' },
      { path: 'gas.heating', label: 'Gas: Heizung heute (kWh oder m³)', kind: 'gas', optional: true, hints: H(/gas/i, /heiz|heating/i, /heute|today|daily|tag/i) },
      { path: 'gas.hot_water', label: 'Gas: Warmwasser heute (kWh oder m³)', kind: 'gas', optional: true, hints: H(/gas/i, /warmwasser|hot.?water|dhw|ww/i, /heute|today|daily|tag/i) },
      { path: 'gas.daily', label: 'oder nur: Gas heute gesamt (kWh oder m³)', kind: 'gas', optional: true, hints: H(/gas/i, /heute|today|daily|tag/i), help: 'Nur nötig, wenn es keine Aufteilung in Heizung und Warmwasser gibt.' },
      { path: 'gas.fuel', label: 'Brennstoff', kind: 'choice', options: [{ value: 'gas', label: 'Gas (Standard)' }, { value: 'oil', label: 'Öl (Anzeige in Litern, 1 Liter = 10 kWh)' }], help: 'Bei Öl zeigt die Kachel Liter und heißt „Öl“. Die Sensoren dürfen kWh, Liter oder m³ zählen. Die kWh je Liter stellst du im Reiter „Alle Felder“ ein.' },
      { path: 'gas.kwh_per_m3', label: 'Gas: kWh je m³', kind: 'number', optional: true, help: 'Nur bei Sensoren in m³. Steht auf der Gasrechnung als Brennwert × Zustandszahl, meist um 10. Ohne zeigt die Kachel m³.' },
      { path: 'water.entity', label: 'Wasser: Durchfluss (l/min oder m³/h)', kind: 'flow', optional: true, hints: H(/wasser|water/i, /fluss|flow|durchfluss/i) },
      { path: 'water.daily', label: 'Wasser: Verbrauch heute (Liter oder m³)', kind: 'water', optional: true, hints: H(/wasser|water/i, /heute|today|daily|tag/i) },
      { path: 'water.name', label: 'Wasser: Name der Kachel', kind: 'text', optional: true, help: 'Zum Beispiel „Trinkwasser“. Mit einem zweiten Zähler (zum Beispiel Zisterne) tragen beide einen Namen.' },
      { path: 'water2.daily', label: 'Zweiter Wasserzähler: Verbrauch heute (Liter oder m³)', kind: 'water', optional: true, hints: H(/zisterne|regen|garten|wasser.*2|water.*2/i, /heute|today|daily|tag/i), help: 'Optional. Eine eigene Kachel, zum Beispiel für Zisternenwasser. Einen dritten Zähler und Durchfluss-Sensoren gibt es im Reiter „Alle Felder“.' },
      { path: 'water2.name', label: 'Zweiter Wasserzähler: Name', kind: 'text', optional: true },
    ] },
    { short: 'Verbraucher', title: 'Einzelverbraucher', text: 'Wähle Geräte mit eigenem Leistungssensor, zum Beispiel Wärmepumpe, Wallbox oder Trockner. Geräte ohne Leistungssensor (zum Beispiel eine Boiler-Freigabe) zeigst du als Statuskachel mit EIN oder AUS. Gruppen (z. B. je Raum) findest du unter "Alle Felder".', fields: [
      { path: 'consumers', label: 'Verbraucher', kind: 'list', max: 30, minusKey: 'minus', minusLabel: 'Optional, nur bei zwei Zählern hintereinander: Davon abziehen (Differenz, z. B. Haushaltszähler):', invertKey: 'invert', dailyKey: 'daily', dailyFromHomeKey: 'daily_from_home', priceKey: 'price_ct', priceLabel: 'Eigener Preis in Cent pro kWh (optional): zeigt die Kosten pro Stunde in der Kachel', statusKey: 'secondary' },
      { path: 'rest_min', label: 'Kachel "Nicht erfasst" erst anzeigen ab (% vom Hausverbrauch)', kind: 'number', optional: true, step: '1', help: 'Zum Beispiel 10: Die Kachel erscheint nur, wenn mindestens 10 % des Hausverbrauchs keiner Gruppe zugeordnet sind.' },
      { path: 'groups_columns', label: 'Gruppen pro Reihe', kind: 'number', optional: true, step: '1', help: 'Leer: alle Gruppen nebeneinander in einer Reihe. 1: jede Gruppe in einer eigenen Reihe über die volle Breite, die Namen sind dann besser lesbar. Stehen Gruppen untereinander, zeichnet die Karte eine Sammel-Linie.' },
      { path: 'hide_zero', label: 'Ruhende Verbraucher ausblenden', kind: 'bool', help: 'Optional. Verbraucher, Gruppen und Geräte in Gruppen verschwinden, wenn sie unter „Aktiv ab“ (Standard 10 W) liegen, und erscheinen sofort wieder, sobald sie laufen. Damit nichts flackert, müssen sie 30 Sekunden ruhen (einstellbar mit „hide_zero_delay“ im YAML). Sie zählen weiter zum Hausverbrauch und zu „Nicht erfasst“.' },
      { path: 'consumers_top', label: 'Nur die größten Verbraucher zeigen (Anzahl)', kind: 'number', optional: true, step: '1', help: 'Zum Beispiel 8: Von allen eingetragenen Verbrauchern erscheinen nur die 8 mit der höchsten Leistung, nach Leistung absteigend. Die Reihenfolge wechselt erst nach 30 Sekunden, damit die Kacheln nicht springen. Leer: alle zeigen.' },
      { path: 'show_rest', label: 'Kachel "Nicht erfasst" zeigen', kind: 'bool', help: 'Zeigt bei einzelnen Verbrauchern ohne Gruppen eine Kachel mit dem Teil des Hausverbrauchs, der keinem Gerät zugeordnet ist (Hausverbrauch minus Summe der Verbraucher). Bei Gruppen erscheint sie ohnehin.' },
      { path: 'hide_rest', label: 'Kachel "Nicht erfasst" ausblenden', kind: 'bool', help: 'Die Kachel zeigt den Teil des Hausverbrauchs, der keinem Gerät und keiner Gruppe zugeordnet ist (Hausverbrauch minus Summe der Gruppen).' },
      { path: 'groups_lines', label: 'Linien zu den Verbrauchern', kind: 'choice', options: [{ value: 'direkt', label: 'Eine Linie je Gerät oder Gruppe (Standard)' }, { value: 'sammel', label: 'Eine Sammel-Linie zum ganzen Verbraucherbereich' }], help: 'Bei vielen Geräten wirkt eine einzelne Sammel-Linie zum ganzen Bereich ruhiger.' },
    ] },
    { short: 'Preise', title: 'Strompreise (optional)', text: 'Mit Preisen zeigt die Karte Kosten und Ersparnis. Wähle Sensoren oder input_number-Helfer in Euro pro kWh.', fields: [
      { path: 'grid_price', label: 'Strompreis Bezug', kind: 'price', optional: true, hints: H(/bezug|netz|strom|import|grid|price|preis/i) },
      { path: 'grid_price_ct', label: 'oder fester Strompreis (Cent pro kWh)', kind: 'number', optional: true, step: '0.1', help: 'Ohne Sensor oder Helfer: einfach den Preis aus deiner Rechnung eintragen, zum Beispiel 34.' },
      { path: 'grid_price_times.0.from', label: 'Preis nach Uhrzeit 1: von (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1', help: 'Für einen Tarif mit zwei Preisen am Tag, zum Beispiel 0 bis 5 Uhr günstiger. Zeiten in ganzen Stunden, jeden Tag gleich, auch über Mitternacht (22 bis 6). Alle anderen Stunden zählen zum normalen Preis oben. Die Statistik rechnet Stunde für Stunde, der Energiefluss nimmt den Preis der aktuellen Stunde.' },
      { path: 'grid_price_times.0.to', label: 'Preis nach Uhrzeit 1: bis (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1' },
      { path: 'grid_price_times.0.ct', label: 'Preis nach Uhrzeit 1: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_price_times.1.from', label: 'Preis nach Uhrzeit 2: von (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1' },
      { path: 'grid_price_times.1.to', label: 'Preis nach Uhrzeit 2: bis (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1' },
      { path: 'grid_price_times.1.ct', label: 'Preis nach Uhrzeit 2: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_price_times.2.from', label: 'Preis nach Uhrzeit 3: von (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1' },
      { path: 'grid_price_times.2.to', label: 'Preis nach Uhrzeit 3: bis (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1' },
      { path: 'grid_price_times.2.ct', label: 'Preis nach Uhrzeit 3: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'feed_in', label: 'Einspeisevergütung', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },
      { path: 'feed_in_ct', label: 'oder feste Einspeisevergütung (Cent pro kWh)', kind: 'number', optional: true, step: '0.1' },
    ] },
    { short: 'Aussehen', title: 'Farbschema', text: 'Dunkel ist die Voreinstellung. Mit "Automatisch" folgt die Karte dem hellen oder dunklen Design von Home Assistant, "Home Assistant" übernimmt dessen Farben.', fields: [
      { path: 'theme', label: 'Farbschema', kind: 'theme' },
      { path: 'language', label: 'Sprache der Karte', kind: 'choice', options: WD.LANG_OPTIONS, help: 'Optional. Standard: Die Karte nutzt die Sprache aus deinem Home-Assistant-Profil (Deutsch, Englisch oder Niederländisch, sonst Deutsch). Hier legst du sie fest, zum Beispiel Deutsch, wenn Home Assistant auf Englisch läuft. Zahlen- und Uhrzeitformat richten sich nach deinem Profil. Die Editoren bleiben deutsch.' },
      { path: 'watt_only', label: 'Leistung immer in Watt anzeigen', kind: 'bool', help: 'Standard: ab 1000 W wird auf kW umgeschaltet. Aktiviert: immer Watt, zum Beispiel 2.350 W.' },
      { path: 'style', label: 'Darstellung', kind: 'choice', options: STYLE, help: 'Mit 3D zeigt die Karte Haus, Solar, Netz und Speicher als Objekte. Die Werte bleiben gleich.' },
      { path: 'house_style', label: 'Haus in der 3D-Ansicht', kind: 'choice', options: HOUSE },
      { path: 'show_share', label: 'Verbraucher: Anteil am Hausverbrauch in %', kind: 'bool', help: 'Optional. Zeigt bei jedem Verbraucher rechts neben der Leistung den Anteil am Hausverbrauch in Prozent, in derselben Farbe und Größe. Nicht in der Kurzansicht.' },
      { path: 'show_soc', label: 'Batterie: Ladestand in % neben der Leistung', kind: 'bool', help: 'Optional. Zeigt in der Batterie-Kachel rechts neben der Leistung den Ladestand in Prozent (gesamt, nicht "nutzbar"), in derselben Farbe und Größe.' },
      { path: 'grid_side', label: 'Netz-Kachel: Seite', kind: 'choice', options: GRIDSIDE, help: 'Optional. Mit "Rechts" steht die Netz-Kachel rechts neben dem Haus (mit Batterie darüber), links bleibt nur Solar. Das spart Höhe, besonders am Handy, in der Kurzansicht und ohne Batterie. Gilt auch in der 3D-Ansicht.' },
      { path: 'home_icon_color', label: 'Farbe des Haus-Symbols', kind: 'choice', options: HOMEICO, help: 'Optional. Mit "Nach Autarkie" färbt sich das Symbol im Ring: grün bei 100 % Autarkie (kein Netzbezug), gelb von 50 bis 99 %, rot darunter. Standard bleibt Türkis.' },
      { path: 'home_color', label: 'Farbe der Zahl beim Haus', kind: 'choice', options: HOMECOL, help: 'Mit "Farbe der größten Quelle" nimmt die Zahl über dem Haus die Farbe des größten Anteils im Ring an.' },
      { path: 'home_size', label: 'Größe der Zahl über dem Haus', kind: 'number', optional: true, step: '0.1', help: 'Optional. Ein Faktor von 0,5 bis 4: 1,5 macht die Zahl über dem Haus anderthalbmal so groß, zum Beispiel für ein Wandtablet. Leer lassen heißt Standardgröße. Wirkt auch in der 3D-Ansicht.' },
      { path: 'home_label_size', label: 'Größe von „Hausverbrauch“ unter der Zahl', kind: 'number', optional: true, step: '0.1', help: 'Optional. Ein Faktor von 0,5 bis 4 nur für die Beschriftung unter der Zahl am Haus. Leer lassen heißt Standardgröße. Wirkt auch in der 3D-Ansicht.' },
      { path: 'home_percentage_size', label: 'Größe der Prozente über der Zahl', kind: 'number', optional: true, step: '0.1', help: 'Optional. Ein Faktor von 0,5 bis 4 für die Anteile Solar, Batterie und Netz am Haus. Leer lassen heißt Standardgröße. Wirkt auch in der 3D-Ansicht.' },
      { path: 'compact', label: 'Kurzansicht', kind: 'choice', options: COMPACT, help: 'Kompakte Übersicht auf einen Blick: Solar, Netz und Batterie neben dem Ring, Gruppen ohne Geräteliste, ohne Zusatztexte. Ein Tipp auf eine Gruppe zeigt alle ihre Geräte. "Nur auf dem Handy" zeigt auf dem Tablet weiter die ausführliche Ansicht.' },
      { path: 'weather', label: 'Wetter (Himmelsband)', kind: 'weather', optional: true, hints: H(/forecast|home|haus|zuhause|dwd|met|wetter/i), help: 'Optional. Zeigt unter der Kopfzeile ein Band mit dem Wetter der nächsten Stunden, dazu Temperatur sowie Sonnenaufgang und -untergang. Die Stundenwerte brauchen eine Wetter-Integration mit Vorhersage (zum Beispiel Met.no oder Deutscher Wetterdienst). Im YAML-Editor schaltet weather: auto die erste vorhandene Wetter-Entität ein.' },
      { path: 'why', label: 'Warum?-Erklärung (? an Netz, Solar und Batterie)', kind: 'bool', help: 'Optional. Zeigt an der Netz-, der Solar- und der Batterie-Kachel ein „?“. Ein Tipp erklärt in einfachem Deutsch, woher der Netzbezug oder die Einspeisung kommt, warum Solar gerade so viel oder so wenig liefert und was die Batterie gerade tut oder warum sie nichts tut. Je mehr Verbraucher in der Karte stehen, desto genauer wird die Erklärung. Nur an einer Kachel: im YAML-Editor `why: [grid]`, `why: [pv]` oder `why: [battery]`.' },
      { path: 'animations', label: 'Animationen', kind: 'choice', options: [{ value: 'auto', label: 'Wie am Gerät eingestellt (Standard)' }, { value: 'always', label: 'Immer, auch bei "Bewegung reduzieren"' }, { value: 'off', label: 'Aus (spart Rechenleistung, z. B. ältere Wandtablets)' }], help: 'Ist am Handy oder Tablet "Bewegung reduzieren" eingeschaltet (iPhone: Einstellungen → Bedienungshilfen → Bewegung), stehen Linien und Ring still. "Immer" animiert trotzdem. "Aus" hält alle Bewegungen an, auch das Hochzählen der Zahlen, und entlastet schwache Geräte.' },
      { path: 'text_size', label: 'Textgröße', kind: 'choice', options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }, { value: '2', label: 'Doppelt (2, auch die Zahlen in den Kacheln)' }, { value: '3', label: 'Dreifach (3)' }], help: 'Groß und Sehr groß vergrößern die kleinen Texte, zum Beispiel Ladestand, Kennzahlen oben rechts und Beschriftungen. Doppelt und Dreifach (eine Zahl) vergrößern zusätzlich die Zahlen in den Kacheln. Im Formular unter Alle Felder kannst du auch eine eigene Zahl eintragen, zum Beispiel 1,5. Wird die Karte dadurch zu hoch, schalte Auf Bildschirmhöhe skalieren aus.' },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert. Mit "Fertig" siehst du alle Felder, zum Beispiel für Gruppen. Abfallkalender, Überschussvorschläge und Netzalarm stellst du im YAML-Editor ein.', summary: (c) => [
      `Solar: ${(c.pv && c.pv.entity) || 'nicht gewählt'}`,
      `Netz: ${(c.grid && (c.grid.entity || [c.grid.power_import, c.grid.power_export].filter(Boolean).join(' / '))) || 'nicht gewählt'}${c.grid && c.grid.invert ? ' (umgekehrt)' : ''}`,
      `Batterie: ${(c.battery && (c.battery.power || c.battery.power_charge)) || 'keine'}${WD.toList(c.batteries).filter((b) => b && (b.power || b.power_charge || b.soc)).length ? ' und ' + WD.toList(c.batteries).filter((b) => b && (b.power || b.power_charge || b.soc)).length + ' weitere' : ''}`,
      `Haus: ${(c.home && c.home.entity) || 'berechnet'}`,
      `Einzelverbraucher: ${WD.toList(c.consumers).filter((x) => x && x.entity).length}`,
      `Preise: ${c.grid_price || typeof c.grid_price_ct === 'number' ? 'Bezug gesetzt' : 'keine'}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-flow-card-editor', {
    needsSetup: (c) => !(c.pv && c.pv.entity) && !(c.grid && (c.grid.entity || c.grid.power_import || c.grid.power_export)),
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
  'dev.cent': 'ct/kWh', 'dev.grid': 'Netz', 'dev.selfsup': 'PV/Batterie', 'dev.standby': 'Standby', 'dev.year': 'Jahr', 'dev.tap_off': 'antippen = aus', 'dev.surplus': 'Überschuss',
  'dev.playing': 'läuft',
  'dev.st.ready': 'bereit', 'dev.st.brewing': 'brüht', 'dev.st.inactive': 'inaktiv', 'dev.st.finished': 'fertig', 'dev.st.pause': 'Pause',
  'dev.st.action': 'Aktion nötig', 'dev.st.error': 'Fehler', 'dev.st.playing': 'spielt', 'dev.st.standby': 'Standby',
});


/* ---- devices-card.js ---- */
/* energy-cockpit-devices-card (abgeleitet aus devices-card v1.4.0) – Geräte & Verbrauch: Raum-Kacheln mit Live-Leistung, Schalten, Standby-Detektiv, Statistik Tag/Woche/Monat/Jahr mit stündlichem Strommix (PV/Batterie vs. Netz) */
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
${WD.themeCss()}:host{display:block;--ok:52,211,153;--sun:250,204,21;--imp:255,92,122}
ha-card{background:radial-gradient(130% 90% at 50% 0%,var(--bg1) 0%,var(--bg0) 62%);border-radius:28px;overflow:hidden;border:1px solid rgba(var(--ov),.06);color:var(--txt);font-family:Inter,var(--ha-font-family-body,system-ui),sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:22px 26px;position:relative;transform-origin:0 0;box-sizing:border-box;display:flex;flex-direction:column}
.wrap:before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;background:radial-gradient(35% 30% at 12% 8%,rgba(250,204,21,.07),transparent 70%),radial-gradient(40% 35% at 90% 85%,rgba(56,189,248,.07),transparent 70%)}
header{display:flex;align-items:center;flex-wrap:wrap;position:relative;margin-bottom:16px}
.title{display:flex;align-items:center;font-size:calc(1.25rem*var(--ts,1));font-weight:750;letter-spacing:-.01em}
.title .ico{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(251,146,60,.16);color:rgb(251,146,60);margin-right:12px}
.title .ico ha-icon{--mdc-icon-size:20px;display:flex}
.title small{display:block;font-size:calc(.74rem*var(--ts,1));font-weight:550;color:rgb(var(--mut));margin-top:2px;letter-spacing:0}
.navbtn{margin-left:auto;cursor:pointer;color:var(--txt);font-weight:650;background:rgba(var(--ov),.07);border:1px solid rgba(var(--ov),.14);padding:8px 14px;border-radius:999px;font-size:calc(.8rem*var(--ts,1));-webkit-tap-highlight-color:transparent}
.navbtn:active{background:rgba(var(--ov),.18)}
.hero{position:relative;display:flex;align-items:center;padding:16px 20px;border-radius:22px;background:linear-gradient(160deg,rgba(var(--ov),.07),rgba(var(--ov),.015)),var(--panel);border:1px solid var(--stroke);margin-bottom:16px}
.kpi{flex:none;margin-right:22px;min-width:150px}
.kpi .big{font-size:calc(2.5rem*var(--vs,1));font-weight:850;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.kpi .big u{text-decoration:none;font-size:calc(1.05rem*var(--vs,1));font-weight:700;color:rgb(var(--mut));margin-left:5px}
.kpi .l{font-size:calc(.72rem*var(--ts,1));color:rgb(var(--mut));margin-top:5px}
.kpi .l b{color:var(--txt);font-weight:650}
.hb{flex:1;min-width:0}
.bar{position:relative;display:flex;height:18px;border-radius:999px;overflow:hidden;background:rgba(var(--ov),.05)}
.seg{height:100%;width:0;transition:width 1.2s cubic-bezier(.2,.8,.2,1);background:linear-gradient(180deg,rgba(var(--c),1),rgba(var(--c),.65));position:relative}
.seg+.seg{box-shadow:inset 2px 0 0 var(--panel)}
.seg.rest{background:repeating-linear-gradient(-45deg,rgba(var(--ov),.13) 0 6px,rgba(var(--ov),.05) 6px 12px)}
.seg:after{content:'';position:absolute;top:0;left:0;right:0;height:45%;background:linear-gradient(180deg,rgba(var(--ov),.35),rgba(var(--ov),0))}
.seg.rest:after{display:none}
.leg{display:flex;flex-wrap:wrap;margin-top:10px;font-size:calc(.72rem*var(--ts,1));color:rgb(var(--mut))}
.leg span{display:flex;align-items:center;margin:0 14px 4px 0;white-space:nowrap}
.leg i{width:9px;height:9px;border-radius:3px;margin-right:6px;background:rgb(var(--c))}
.leg i.rest{background:repeating-linear-gradient(-45deg,rgba(var(--ov),.35) 0 2px,rgba(var(--ov),.1) 2px 4px)}
.leg b{color:var(--txt);font-weight:650;margin-left:4px}
.pills{display:flex;flex-wrap:wrap;margin-top:6px}
.pill{display:flex;align-items:center;font-size:calc(.72rem*var(--ts,1));font-weight:600;padding:6px 11px;border-radius:999px;background:rgba(var(--ov),.05);border:1px solid var(--stroke);margin:4px 8px 0 0;color:rgb(var(--mut))}
.pill b{color:var(--txt);margin:0 3px}
.pill.sb{border-color:rgba(251,146,60,.45);background:rgba(251,146,60,.1);color:var(--o1);cursor:pointer}
.pill.sun{border-color:rgba(var(--sun),.45);background:rgba(var(--sun),.1);color:var(--y1)}
.per{display:flex;margin-bottom:10px}
.per span{flex:1;text-align:center;font-size:calc(.72rem*var(--ts,1));font-weight:700;padding:7px 0;color:rgb(var(--mut));background:rgba(var(--ov),.04);border:1px solid var(--stroke);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .3s,color .3s}
.per span:first-child{border-radius:999px 0 0 999px}.per span:last-child{border-radius:0 999px 999px 0}
.per span+span{border-left:0}
.per span.sel{background:rgba(var(--sun),.16);color:var(--y1);border-color:rgba(var(--sun),.45)}
.psum{display:flex;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid var(--stroke)}
.psum div{margin-right:22px}
.psum small{display:block;font-size:calc(.62rem*var(--ts,1));text-transform:uppercase;letter-spacing:.09em;color:rgb(var(--mut));font-weight:700}
.psum b{font-size:calc(1.05rem*var(--vs,1));font-weight:800;font-variant-numeric:tabular-nums}
.psum b u{text-decoration:none;font-size:calc(.7rem*var(--vs,1));color:rgb(var(--mut));font-weight:650;margin-left:3px}
.psum b u.mx{display:block;margin:2px 0 0}
.psum .sun{color:rgb(var(--sun))}.psum .grd{color:rgb(var(--imp))}
.rows{display:flex;flex-wrap:wrap;margin-top:8px}
.rk{display:flex;align-items:center;font-size:calc(.7rem*var(--ts,1));color:rgb(var(--mut));margin:3px 14px 0 0;white-space:nowrap}
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
.rh b{font-size:calc(.78rem*var(--ts,1));text-transform:uppercase;letter-spacing:.12em;font-weight:800}
.rh .rw{margin-left:auto;font-size:calc(.74rem*var(--ts,1));font-weight:700;color:rgb(var(--mut));font-variant-numeric:tabular-nums}
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
.dv .nm{font-size:calc(.92rem*var(--ts,1));font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dv .sb{font-size:calc(.7rem*var(--ts,1));color:rgb(var(--mut));margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dv .sb b{color:var(--txt);font-weight:700;font-variant-numeric:tabular-nums}
.dv.on .sb b{color:rgb(var(--c))}
.dv .sunb{display:none;font-size:calc(.62rem*var(--ts,1));font-weight:800;color:#111;background:rgb(var(--sun));border-radius:6px;padding:1px 5px;margin-left:5px;vertical-align:1px}
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
.ch{font-size:calc(.68rem*var(--ts,1));font-weight:650;padding:5px 10px;border-radius:999px;margin:4px 6px 0 0;background:rgba(var(--ov),.05);border:1px solid rgba(var(--ov),.1);color:rgb(var(--mut));cursor:pointer;-webkit-tap-highlight-color:transparent;transition:all .35s}
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
.np{margin:0 0 4px 47px;font-size:calc(.7rem*var(--ts,1));color:rgb(var(--mut));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
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
      setLocale(h, this._c);
      if (!this._c) { this._hass = h; return; }
      // Sprache erst jetzt bekannt: statische Texte neu aufbauen
      if (this._bl !== WD.state.lang) { this._bl = WD.state.lang; this._sig = null; }
      this._hass = h;
      this._update();
      if (!this._eLoading && Date.now() - (this._eLoaded || 0) > 5 * 60e3) this._loadEnergy();
    }
    // text_size (gross, sehr_gross oder eine Zahl) und label_size (nur die Texte): wie in Energiefluss und Statistik.
    // gross/sehr_gross vergrößern die Texte, eine Zahl auch die großen Werte. label_size gilt vor text_size, aber nur für die Texte
    _tsStyle() {
      const num = (x) => parseFloat(String(x == null ? '' : x).replace(',', '.'));
      const clamp = (f) => Math.min(4, Math.max(0.5, f));
      const v = String(this._c.text_size == null ? '' : this._c.text_size).trim();
      let ts = 0, vs = 0;
      if (v === 'gross') ts = 1.25;
      else if (v === 'sehr_gross') ts = 1.5;
      else if (v && v !== 'normal' && num(v) > 0) ts = vs = clamp(num(v));
      const ln = num(this._c.label_size);
      if (ln > 0) ts = clamp(ln);
      return (ts ? `--ts:${ts};` : '') + (vs ? `--vs:${vs};` : '');
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
          // #71: Ohne entity (reine Messgeräte, z. B. Shelly EM) zählt der Leistungs- oder Energiesensor. Sensoren lassen sich nicht schalten
          const entity = d.entity || (d.channels ? undefined : d.power || d.energy);
          if (d.channels ? !chans.length : !ok(entity)) return;
          const ro = !d.channels && d.type !== 'media' && /^sensor\./.test(entity || '');
          out.push(Object.assign({}, d, { key: ri + '-' + di, room: ri, chans, entity, ro }));
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
      <ha-card><div class="wrap"${(() => { const st = WD.colorVars(this._c.colors, { pv: '--sun', grid_import: '--imp' }) + this._tsStyle(); return st ? ` style="${st}"` : ''; })()}>
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
      return `<div class="dv t-${esc(d.type || 'plug')}${t.spin ? ' spin' : ''}${d.lock || d.ro ? ' lock' : ''}" data-k="${d.key}" style="--c:${rgb(d.color, t.c)}">
        <div class="ic"><div class="fx"></div>${d.type === 'coffee' ? '<div class="steam"><i></i><i></i><i></i></div>' : ''}${d.image ? `<img class="dlogo" src="${esc(d.image)}" alt="">` : `<ha-icon icon="${esc(d.icon || t.i)}"></ha-icon>`}</div>
        <div class="tx"><div class="nm">${esc(d.name)}<span class="sunb">☀ ${T('dev.now')}</span></div><div class="sb"></div></div>
        ${d.lock ? '<div class="lk" title="' + esc(T('dev.locked')) + '"><ha-icon icon="mdi:shield-lock-outline"></ha-icon></div>' : d.ro ? '' : '<div class="tg"></div>'}
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
        if (!d.power && d.entity === d.energy) return false;
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
      if (d.lock || d.ro) {
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
        // Hausverbrauch und Netzanteil je Intervall: Haus = PV + Bezug - Einspeisung - Batterie laden + Batterie entladen
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
        if (!d.lock && !d.ro && (d.type === 'media' ? !tvOn : on) && w !== null && w > 0.5 && w < c.standby_w && ['plug', 'strip', 'tv', 'console', 'media'].indexOf(d.type || 'plug') >= 0 && (!standby || w > standby.w)) standby = { d, w };
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
    'ed.d.title': 'Titel', 'ed.d.home': 'Hausverbrauch (Leistung)', 'ed.d.price': 'Strompreis Bezug (Sensor, pro kWh)', 'ed.d.feed': 'Einspeisevergütung (Sensor, pro kWh)', 'ed.d.theme': 'Farbschema', 'ed.d.language': 'Sprache der Karte', 'ed.d.text_size': 'Textgröße', 'ed.d.label_size': 'Größe der Beschriftungen (nur kleine Texte, Zahl z. B. 1,5)', 'ed.d.price_ct': 'oder fester Strompreis (Cent pro kWh)', 'ed.d.feed_ct': 'oder feste Einspeisevergütung (Cent pro kWh)',
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
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step && step % 1 ? 'any' : step || 1, mode: 'box' } } });
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
        title: 'ed.d.title', home: 'ed.d.home', grid_price: 'ed.d.price', feed_in: 'ed.d.feed', grid_price_ct: 'ed.d.price_ct', feed_in_ct: 'ed.d.feed_ct', theme: 'ed.d.theme', language: 'ed.d.language', text_size: 'ed.d.text_size', label_size: 'ed.d.label_size', surplus: 'ed.d.surplus', standby_w: 'ed.d.standby',
        fit_screen: 'ed.d.fit', nav_path: 'ed.d.nav_path', nav_label: 'ed.d.nav_label', icon: 'ed.d.icon', color: 'ed.d.color', image: 'ed.d.image', type: 'ed.d.type',
        entity: 'ed.d.entity', power: 'ed.d.power', energy: 'ed.d.energy', max_w: 'ed.d.max_w', run_w: 'ed.d.run_w', lock: 'ed.d.lock',
      };
      const label = (s) => (s.name === 'name' ? T('ed.d.room_name') : lbl[s.name] ? T(lbl[s.name]) : s.name);

      // Allgemein
      const top = this._form([
        txt('title'), ent('home', ['sensor']), ent('grid_price', ['sensor', 'input_number']), numb('grid_price_ct', 0, 200, 0.1), ent('feed_in', ['sensor', 'input_number']), numb('feed_in_ct', 0, 200, 0.1),
        ent('surplus', ['sensor']), numb('standby_w', 0, 200, 1), bool('fit_screen'), { name: 'theme', selector: { select: { mode: 'dropdown', options: WD.THEME_OPTIONS } } }, { name: 'language', selector: { select: { mode: 'dropdown', options: WD.LANG_OPTIONS } } }, { name: 'text_size', selector: { select: { mode: 'dropdown', custom_value: true, options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }, { value: '2', label: 'Doppelt (2, auch die großen Werte)' }, { value: '3', label: 'Dreifach (3)' }] } } }, numb('label_size', 0.5, 4, 0.1), txt('nav_path'), txt('nav_label'),
      ], {
        title: c.title || '', home: c.home || '', grid_price: c.grid_price || '', feed_in: c.feed_in || '', surplus: c.surplus || '', grid_price_ct: c.grid_price_ct === undefined ? '' : c.grid_price_ct, feed_in_ct: c.feed_in_ct === undefined ? '' : c.feed_in_ct,
        standby_w: c.standby_w === undefined ? 15 : c.standby_w, theme: c.theme || 'dunkel', language: c.language || 'auto', text_size: c.text_size === undefined ? 'normal' : String(c.text_size), label_size: c.label_size === undefined ? '' : c.label_size, fit_screen: c.fit_screen !== false, nav_path: c.nav_path || '', nav_label: c.nav_label || '',
      }, (v) => {
        ['title', 'home', 'grid_price', 'feed_in', 'surplus', 'nav_path', 'nav_label'].forEach((k) => { if (v[k]) c[k] = v[k]; else delete c[k]; });
        ['grid_price_ct', 'feed_in_ct'].forEach((k) => { if (typeof v[k] === 'number') c[k] = v[k]; else delete c[k]; });
        if (v.standby_w === undefined || v.standby_w === 15) delete c.standby_w; else c.standby_w = v.standby_w;
        if (v.theme && v.theme !== 'dunkel') c.theme = v.theme; else delete c.theme;
        if (v.language && v.language !== 'auto') c.language = v.language; else delete c.language;
        if (v.text_size && v.text_size !== 'normal') c.text_size = /^[0-9.,]+$/.test(String(v.text_size)) ? Number(String(v.text_size).replace(',', '.')) : v.text_size; else delete c.text_size;
        if (typeof v.label_size === 'number' && v.label_size > 0) c.label_size = v.label_size; else delete c.label_size;
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
  const monthShort = (m) => new Date(2020, m, 1).toLocaleDateString(WD.state.loc, { month: 'short' }).replace(/\.$/, '');
  const monthLong = (m) => new Date(2020, m, 1).toLocaleDateString(WD.state.loc, { month: 'long' });
  const dayShort = (d) => new Date(2020, 0, 5 + d).toLocaleDateString(WD.state.loc, { weekday: 'short' }).replace(/\.$/, '');
  const SRC = [['room.grid', '255,92,122'], ['room.battery', '96,165,250'], ['room.pv', '255,197,61']];
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
    'room.grid': 'Netz', 'room.battery': 'Batterie', 'room.pv': 'PV', 'room.csv.period': 'Zeitraum', 'room.csv.total': 'Summe kWh', 'room.csv.grid': 'Netz kWh', 'room.csv.battery': 'Batterie kWh', 'room.csv.pv': 'PV kWh', 'room.csv.cost': 'Kosten', 'room.csv.import_cost': 'bei Bezugspreis',
    'room.credit': 'Guthaben {amount} {cur}', 'room.payment': 'Nachzahlung {amount} {cur}', 'room.year_summary': 'Jahr {year}: {cost} {cur} verbraucht, {count} × {advance} {cur} = {total} {cur} Abschlag, aktuell {balance}',
    'room.invoice': 'Abrechnung', 'room.advance': 'Abschlag', 'room.no_advance': 'ohne Abschlag', 'room.month_forecast': 'Hochrechnung Monatsende', 'room.from_day2': 'ab dem 2. Messtag', 'room.previous_month': 'Vormonat', 'room.no_data': 'keine Daten',
    'room.night_w': 'W nachts', 'room.night_total': 'Gesamt, 0 bis 5 Uhr', 'room.threshold': 'Schwelle {w} W', 'room.above': 'liegt darüber', 'room.ok': 'in Ordnung', 'room.night_note': 'Läuft das Tag und Nacht so weiter, sind das etwa <b>{energy} kWh{cost} pro Monat</b> im Leerlauf (Mittel der letzten 14 Nächte).',
    'room.night_no_data': 'Noch zu wenig Nachtstunden mit Daten (mindestens eine Nacht nötig).', 'room.night_base': 'Grundlast nachts (Standby)',
    'room.activity': 'Betriebszeiten', 'room.active_above': 'aktiv = über {w} W', 'room.active_today': 'Aktive Stunden heute', 'room.active_day': 'Aktivster Tag',
    'room.activity_note': 'Mittlere Leistung je Wochentag und Stunde (letzte 8 Wochen). Hell bis kräftig orange: wenig bis viel. Die rechte Spalte nennt die aktiven Stunden pro Tag.',
    'room.archive': 'Monatsarchiv (Zählerstände und Beträge, festgehalten am Monatsersten)', 'room.month_label': 'Monat', 'room.grid_label': 'Netz', 'room.battery_label': 'Batterie', 'room.balance': 'Saldo',
    'room.meter': 'Zähler', 'room.import': 'Bezug', 'room.feed': 'Einspeisung', 'room.archive.note': 'Saldo = Abschlag minus Kosten (positiv: Guthaben). Die Werte sind eingefroren und ändern sich nicht, wenn sich später Preise ändern.',
    'room.archive.empty': 'Noch keine Einträge. Der erste Monat wird am 1. des nächsten Monats um 07:00 festgehalten.',
    'room.day': 'Tag', 'room.chart': 'Verlauf und Kosten', 'room.area': 'Bereich', 'room.by_area': 'Je Bereich', 'room.included': 'inkl. {amount} {cur} Grundgebühr',
    'room.fee': ' · Grundgebühr <b>{amount} {cur}</b>/Monat', 'room.price.all': 'Alles zum Bezugspreis <b>{price} ct/kWh</b>{fee}',
    'room.explain.fixed': 'Bewertung: Jede kWh kostet den Bezugspreis, egal woher sie kam.',
    'room.explain.no_sources': 'Ohne Haus-Energiequellen (home_energy) wird der gesamte Verbrauch zum Netzpreis bewertet.',
    'room.price.mix': 'Netz <b>{grid} ct</b> · Batterie <b>{battery} ct</b> · PV <b>{pv} ct/kWh</b>{fee}',
    'room.explain.mix': 'Bewertung: Je Quelle ein fester Preis (Netz zum Bezugspreis, Batterie und PV zu den eingestellten Preisen).',
    'room.price.opportunity': 'Netz, Batterie und PV, die das Haus gebraucht hätte: <b>{grid} ct/kWh</b> · PV aus Überschuss (sonst eingespeist): <b>{feed} ct/kWh</b>{fee}',
    'room.explain.opportunity': 'Bewertung nach entgangenem Nutzen: Strom aus Netz und Batterie sowie PV-Strom, den dein Haus selbst hätte verbrauchen können, kostet den Bezugspreis. Nur PV-Strom aus Stunden mit Einspeisung wird zur Einspeisevergütung bewertet.',
    'room.full': '<br>Zum Vergleich, <b>alles zum Netzpreis</b> ({price} ct/kWh): <b>{cost} {cur}</b>.',
    'room.subtitle': 'Stromverbrauch und Kosten', 'room.others': 'übrige Geräte', 'room.vs_previous_month': 'zum Vormonat',
    'room.today': 'heute', 'room.hourly_curve': 'Kurve je Stunde', 'room.now_today': 'Jetzt und heute', 'room.low': 'ruhig', 'room.elevated': 'erhöht', 'room.high': 'hoch',
    'room.no_use_today': 'heute noch kein Verbrauch', 'room.source_today': 'Herkunft heute',
    'room.mix_tip': 'Am wenigsten Netzstrom brauchst du im Schnitt zwischen <b>{from} und {to} Uhr</b> (Ø {share} % aus dem Netz). Große Lasten legst du am besten dorthin.',
    'room.mix_tip_missing': 'Für eine Empfehlung fehlen noch Tage mit Daten.', 'room.and_cost': ' und {amount} {cur}',
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
        this.shadowRoot.innerHTML = '<style>' + WD.themeCss() + 'ha-card{padding:22px;border-radius:24px;background:var(--panel);color:var(--txt);font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit ' + T('room.title') + '</b><div style="margin-top:8px;opacity:.8">' + T('room.unconf') + '</div></ha-card>';
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
      setLocale(h, this._c);
      const localeSignature = [WD.state.loc, WD.state.nloc, WD.state.lang, WD.state.currency, WD.state.h12].join('|');
      const localeChanged = this._localeSignature !== localeSignature;
      this._localeSignature = localeSignature;
      this._hass = h;
      if (localeChanged && this._c) this._render();
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
          out.push({ label: dayShort(d.getDay()) + ' ' + d.getDate() + '.', from: d, to: d, cur: key(d) === key(now), fee: false });
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
          out.push({ label: monthShort(i), from: new Date(yy, i, 1), to: new Date(yy, i + 1, 0), cur: tab === 'year' && i === m, fee: true });
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
      const num = (v) => v.toLocaleString(WD.state.nloc, { minimumFractionDigits: 3, maximumFractionDigits: 3, useGrouping: false });
      const money = (v) => v.toLocaleString(WD.state.nloc, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
      const head = [T('room.csv.period'), T('room.csv.total'), T('room.csv.grid'), T('room.csv.battery'), T('room.csv.pv'), T('room.csv.cost') + ' ' + cur(), T('room.csv.import_cost') + ' ' + cur()].concat(c.devices.map((d) => (d.name || d.energy) + ' kWh'), c.items.map((x) => (c.devices[x.parent].name || c.devices[x.parent].energy) + ': ' + (x.name || x.energy) + ' kWh'));
      const rows = b.map((x) => {
        const r = this._calc(x.from, x.to, x.fee);
        return [x.label, num(r.kwh), num(r.src[0]), num(r.src[1]), num(r.src[2]), money(r.cost), money(r.costFull)]
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
        const saldo = (v) => (v >= 0 ? `<b style="color:rgb(52,211,153)">${T('room.credit', { amount: fe(v), cur: CUR })}</b>` : `<b style="color:rgb(255,92,122)">${T('room.payment', { amount: fe(-v), cur: CUR })}</b>`);
        let yr = '';
        if (adv > 0 && this._first) {
          const f = new Date(this._first + 'T00:00:00');
          const n = f.getFullYear() === y ? m - f.getMonth() + 1 : m + 1;
          const cy = this._calc(new Date(y, 0, 1), new Date(y, 11, 31), true);
          yr = `<div class="s2">${T('room.year_summary', { year: y, cost: fe(cy.cost), cur: CUR, count: n, advance: fe(adv), total: fe(adv * n), balance: saldo(adv * n - cy.cost) })}</div>`;
        }
        const dpct = proj !== null && pm.cost > 0 ? Math.round((proj / pm.cost - 1) * 100) : null;
        top += `<div class="panel"><div class="ph"><span class="lbl">${T('room.invoice')} ${monthLong(m)} ${y}</span><span class="lbl">${adv ? T('room.advance') + ' ' + fe(adv) + ' ' + CUR : T('room.no_advance')}</span></div>
          <div class="big">${fe(cm.cost)} <small>${CUR}</small></div>
          ${adv ? `<div class="pbar"><i style="width:${pct}%;background:rgb(${col})"></i></div>` : ''}
          <div class="grid3">
            <div class="mini"><div class="l">${T('room.month_forecast')}</div><div class="v">${proj === null ? '–' : fe(proj) + ' ' + CUR}</div><div class="s">${proj === null ? T('room.from_day2') : (adv ? saldo(adv - proj) : (dpct === null ? '' : (dpct >= 0 ? '+' : '') + dpct + ' % ' + T('room.vs_previous_month')))}</div></div>
            <div class="mini"><div class="l">${T('room.previous_month')}</div><div class="v">${pm.kwh > 0 ? fe(pm.cost) + ' ' + CUR : '–'}</div><div class="s">${pm.kwh > 0 ? fk(pm.kwh) + ' kWh' : T('room.no_data')}</div></div>
            <div class="mini"><div class="l">${monthShort(m)} ${y - 1}</div><div class="v">${ly.kwh > 0 ? fe(ly.cost) + ' ' + CUR : '–'}</div><div class="s">${ly.kwh > 0 ? fk(ly.kwh) + ' kWh' : T('room.no_data')}</div></div>
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
          return `<div class="s">↳ ${esc(o.x.name || o.x.energy)}: <span class="wv ${this._wcls(wi)}" data-wi="${o.j}">${wi === null ? '–' : nf(wi, 0)}</span> W · ${T('room.today')} ${fk(tk)} kWh</div>`;
        }).join('');
        return `<div class="tile" style="--c:${rgb(d.color, '96,165,250')}"><div class="l">${esc(d.name || d.energy)}</div>
        <div class="wl"><span class="wv ${this._wcls(w)}" data-w="${i}">${w === null ? '–' : nf(w, 0)}</span><small>W</small></div>
        <div class="spark">${bars}</div><div class="s">${T('room.today')} ${fk(todayKwh)} kWh · ${T('room.hourly_curve')}</div>${sub}</div>`;
      }).join('');
      top += `<div class="panel"><div class="ph"><span class="lbl">${T('room.now_today')}</span><span class="leg"><span style="--c:52,211,153"><i></i>${T('room.low')}</span><span style="--c:255,197,61"><i></i>${T('room.elevated')}</span><span style="--c:255,92,122"><i></i>${T('room.high')}</span></span></div><div class="tiles">${tiles}</div></div>`;

      // 6: Herkunft heute und beste Zeit
      if (mix) {
        const t = this._calc(new Date(y, m, now.getDate()), new Date(y, m, now.getDate()), false);
        const tot = t.kwh;
        let donut = `<div class="empty" style="padding:10px">${T('room.no_use_today')}</div>`;
        if (tot > 0) {
          let off = 0;
          const R = 38, C = 2 * Math.PI * R;
          const seg = t.src.map((v, i) => { const len = v / tot * C; const s = `<circle r="${R}" cx="50" cy="50" fill="none" stroke="rgb(${SRC[i][1]})" stroke-width="14" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 50 50)"/>`; off += len; return s; }).join('');
          donut = `<svg viewBox="0 0 100 100" class="donut"><circle r="${R}" cx="50" cy="50" fill="none" stroke="rgba(var(--ov),.07)" stroke-width="14"/>${seg}<text x="50" y="54" text-anchor="middle" fill="var(--txt)" font-size="14" font-weight="800">${fk(tot)}</text></svg>`;
        }
        const legend = t.src.map((v, i) => `<div><span style="--c:${SRC[i][1]}" class="dot"></span>${T(SRC[i][0])} <b>${tot > 0 ? nf(v / tot * 100, 0) : 0} %</b> <span class="mut">${fk(v)} kWh</span></div>`).join('');
        const mh = this._mixH || [];
        let best = null;
        for (let s = 0; s < 22; s++) {
          const w = [mh[s], mh[s + 1], mh[s + 2]];
          if (w.some((x) => !x || x.n < 5)) continue;
          const g = w.reduce((a, x) => a + x.g / x.n, 0) / 3;
          if (best === null || g < best.g) best = { s, g };
        }
        const tip = best ? T('room.mix_tip', { from: best.s, to: best.s + 3, share: nf(best.g * 100, 0) }) : T('room.mix_tip_missing');
        top += `<div class="panel"><span class="lbl">${T('room.source_today')}</span><div class="herk">${donut}<div class="hl">${legend}</div></div><div class="note">${tip}</div></div>`;
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
        sbHtml = `<div class="tiles">${c.devices.map((d, i) => `<div class="tile" style="--c:${rgb(d.color, '96,165,250')}"><div class="l">${esc(d.name || d.energy)}</div><div class="wl"><span class="wv ${per[i] > sb ? 'hi' : 'lo'}">${nf(per[i], 0)}</span><small>${T('room.night_w')}</small></div></div>`).join('')}
          <div class="tile"><div class="l">${T('room.night_total')}</div><div class="wl"><span class="wv ${cls}">${nf(totW, 0)}</span><small>W</small></div><div class="s">${T('room.threshold', { w: nf(sb, 0) })} · ${totW > sb ? T('room.above') : T('room.ok')}</div></div></div>
          <div class="note">${T('room.night_note', { energy: fk(kwhM), cost: P.grid > 0 ? T('room.and_cost', { amount: fe(kwhM * P.grid), cur: CUR }) : '' })}</div>`;
      } else sbHtml = `<div class="note">${T('room.night_no_data')}</div>`;
      top += `<div class="panel"><span class="lbl">${T('room.night_base')}</span>${sbHtml}</div>`;

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
        const rowsH = order.map((wd, ri) => `<div class="hm"><span class="dl">${dayShort(wd)}</span>${hm[wd].map((v, hh) => `<span class="cell" title="${dayShort(wd)} ${hh}:00 · Ø ${nf(v, 0)} W" style="background:rgba(245,158,11,${v <= 0 ? 0.04 : 0.1 + v / hmax * 0.9})"></span>`).join('')}<span class="ah">${nf(wdAct[ri], 1)} h</span></div>`).join('');
        top += `<div class="panel"><div class="ph"><span class="lbl">${T('room.activity')}</span><span class="lbl">${T('room.active_above', { w: nf(act, 0) })}</span></div>
          <div class="grid3"><div class="mini"><div class="l">${T('room.active_today')}</div><div class="v">${nf(actDay[todayK] || 0, 0)} h</div></div>
            <div class="mini"><div class="l">${T('room.week')}</div><div class="v">${nf(sumAct(mon), 0)} h</div></div>
            <div class="mini"><div class="l">${T('room.active_day')}</div><div class="v">${wdAct[topIdx] > 0 ? dayShort(order[topIdx]) + ' · ' + nf(wdAct[topIdx], 1) + ' h' : '–'}</div></div></div>
          <div class="heat">${head}${rowsH}</div><div class="note">${T('room.activity_note')}</div></div>`;
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
          rows += `<tr><td>${esc(monthShort(+mm - 1) || mm)} ${esc(yy)}</td><td>${fk(r.kwh)}</td><td>${fk(r.g)}</td><td>${fk(r.b)}</td><td>${fk(r.p)}</td><td>${fe(r.cost)}</td><td>${saldo === null ? '–' : (saldo >= 0 ? '+' : '−') + fe(Math.abs(saldo))}</td></tr>`
            + `<tr class="sub"><td colspan="7">${(r.dev || []).map((d) => `${esc(d.n)}: ${T('room.meter')} ${nf(d.a, 2)} → ${nf(d.e, 2)} kWh (${fk(d.kwh)} kWh)`).join(' · ')} · ${T('room.import')} ${nf((r.pg || 0) * 100, 1)} ct, ${T('room.feed')} ${nf((r.pf || 0) * 100, 1)} ct</td></tr>`;
        });
        bottom = `<div class="panel"><span class="lbl">${T('room.archive')}</span>${arr.length
          ? `<div class="tw"><table><thead><tr><th>${T('room.month_label')}</th><th>kWh</th><th>${T('room.grid_label')}</th><th>${T('room.battery_label')}</th><th>${T('room.pv')}</th><th>${CUR}</th><th>${T('room.balance')}</th></tr></thead><tbody>${rows}</tbody></table></div><div class="note">${T('room.archive.note')}</div>`
          : `<div class="note">${T('room.archive.empty')}</div>`}</div>`;
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
          const sline = mix && p.kwh > 0 ? `${T('room.grid')} ${fk(p.src[0])} · ${T('room.battery')} ${fk(p.src[1])} · ${T('room.pv')} ${fk(p.src[2])} kWh` : '';
          return `<div class="kpi${tab === k ? ' on' : ''}" data-t="${k}"><div class="l">${T('room.' + k)}</div><div class="k">${fk(p.kwh)}<small>kWh</small></div>`
            + `<div class="e">${P.grid > 0 || p.fee ? fe(p.cost) + ' ' + CUR : '—'}</div>${mb}<div class="s">${sline}${p.fee ? `<br>${T('room.included', { amount: fe(p.fee), cur: CUR })}` : ''}</div></div>`;
        }).join('');
        const b = this._buckets(tab);
        const rows = b.map((x) => Object.assign({ x }, this._calc(x.from, x.to, x.fee)));
        const mx = Math.max(0.001, ...rows.map((r) => r.kwh));
        const bars = rows.map((r) => `<div class="col${r.x.cur ? ' cur' : ''}"><div class="st" style="height:${Math.max(0, r.kwh / mx * 100)}%">${r.src.map((v, i) => `<i style="--c:${SRC[i][1]};height:${r.kwh ? v / r.kwh * 100 : 0}%"></i>`).join('')}</div></div>`).join('');
        const xl = rows.map((r) => `<span class="${r.x.cur ? 'cur' : ''}">${esc(tab === 'month' && r.x.label % 5 && r.x.label !== String(b.length) ? '' : r.x.label)}</span>`).join('');
        const sum = rows.reduce((a, r) => { a.kwh += r.kwh; a.cost += r.cost; a.full += r.costFull; r.src.forEach((v, i) => { a.src[i] += v; }); return a; }, { kwh: 0, cost: 0, full: 0, src: [0, 0, 0] });
        const cell = (v) => `<td class="${v ? '' : 'z'}">${v ? fk(v) : '–'}</td>`;
        const trs = rows.map((r) => `<tr class="${r.x.cur ? 'cur' : ''}"><td>${esc(r.x.label)}</td><td>${r.kwh ? fk(r.kwh) : '–'}</td>${mix ? r.src.map(cell).join('') : ''}<td>${r.cost ? fe(r.cost) : '–'}</td></tr>`).join('');
        const th = `<tr><th>${T(tab === 'year' || tab === 'prev' ? 'room.month_label' : 'room.day')}</th><th>kWh</th>${mix ? `<th>${T('room.grid_label')}</th><th>${T('room.battery_label')}</th><th>${T('room.pv')}</th>` : ''}<th>${CUR}</th></tr>`;
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
            out += `<tr class="ch"><td>↳ ${T('room.others')}</td><td>${fk(rv[0] + rv[1] + rv[2])}</td>${mix ? rv.map(cell).join('') : ''}<td>${fe(Math.max(0, restCost[0]))}</td></tr>`;
          }
          return out;
        }).join('');
        const title = { week: T('room.week'), month: monthLong(new Date().getMonth()) + ' ' + new Date().getFullYear(), year: String(new Date().getFullYear()), prev: String(new Date().getFullYear() - 1) }[tab];
        const leg = mix ? SRC.map((s) => `<span style="--c:${s[1]}"><i></i>${T(s[0])}</span>`).join('') : '';
        const mode = c.valuation || 'opportunity';
        const fee = c.base_fee ? T('room.fee', { amount: fe(parseFloat(c.base_fee)), cur: CUR }) : '';
        let priceTxt, explain;
        if (!(P.grid > 0)) { priceTxt = T('room.noprice'); explain = ''; }
        else if (!mix || mode === 'grid') {
          priceTxt = T('room.price.all', { price: nf(P.grid * 100, 2), fee });
          explain = T(mix ? 'room.explain.fixed' : 'room.explain.no_sources');
        } else if (mode === 'mix') {
          priceTxt = T('room.price.mix', { grid: nf(P.grid * 100, 2), battery: nf(P.batt * 100, 2), pv: nf(P.pv * 100, 2), fee });
          explain = T('room.explain.mix');
        } else {
          priceTxt = T('room.price.opportunity', { grid: nf(P.grid * 100, 2), feed: nf(P.feed * 100, 2), fee });
          explain = T('room.explain.opportunity');
        }
        const full = P.grid > 0 ? T('room.full', { price: nf(P.grid * 100, 2), cost: fe(sum.full), cur: CUR }) : '';
        const ex = this._extra(P, CUR, mix);
        body = `<div class="kpis">${kp}</div>${ex.top}
          <div class="panel"><div class="ph"><span class="lbl">${esc(title)}</span><span class="leg">${leg}</span></div>
            <div class="bars">${bars}</div><div class="xl">${xl}</div></div>
          <div class="panel"><span class="lbl">${T('room.chart')}</span><div class="tw"><table><thead>${th}</thead><tbody>${trs}${sumRow}</tbody></table></div></div>
          <div class="panel"><span class="lbl">${T('room.by_area')}</span><div class="tw"><table><thead><tr><th>${T('room.area')}</th><th>kWh</th>${mix ? `<th>${T('room.grid_label')}</th><th>${T('room.battery_label')}</th><th>${T('room.pv')}</th>` : ''}<th>${CUR}</th></tr></thead><tbody>${devRows}</tbody></table></div>
            <div class="note">${priceTxt}${full}<br>${explain}</div>
            <div class="foot"><span>${this._first ? `${T('room.since')} ${new Date(this._first + 'T00:00:00').toLocaleDateString(WD.state.loc, { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}</span><span class="btn" data-csv="1">${T('room.csv')}</span></div></div>${ex.bottom}`;
      }
      const sub = c.subtitle !== undefined ? c.subtitle : T('room.subtitle');
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
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step && step % 1 ? 'any' : step || 1, mode: 'box' } } });
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
    theme: 'Farbschema', language: 'Sprache der Karte', accent: 'Akzentfarbe (z. B. 245,158,11 oder #f59e0b)',
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
      { name: 'language', selector: { select: { mode: 'dropdown', options: WD.LANG_OPTIONS } } },
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
      { path: 'language', label: 'Sprache der Karte', kind: 'choice', options: WD.LANG_OPTIONS, help: 'Optional. Standard: Die Karte nutzt die Sprache aus deinem Home-Assistant-Profil (Deutsch, Englisch oder Niederländisch, sonst Deutsch). Hier legst du sie fest, zum Beispiel Deutsch, wenn Home Assistant auf Englisch läuft. Zahlen- und Uhrzeitformat richten sich nach deinem Profil. Die Editoren bleiben deutsch.' },
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
  'st.title': 'Statistik', 'st.err': 'pv_total und grid_import_total sind nötig', 'st.today': 'Heute', 'st.next': 'Weiter →',
  'st.pvsav': 'Solar-Ersparnis', 'st.feed': 'Einspeiseerlös', 'st.selfc': 'Solar-Eigenverbrauch', 'st.cost': 'Stromkosten Netz', 'st.aut': 'Autarkie',
  'st.amo': 'Amortisation Solaranlage', 'st.base': 'Grundlast (nachts)', 'st.monthly': 'Solarertrag pro Monat', 'st.record': 'Rekordtag',
  'st.eff': 'Wirkungsgrad', 'st.bat': 'Batterie', 'st.sum': 'Gesamt', 'st.solar': 'Solar', 'st.recon': 'am {d}', 'st.cycles': 'Batteriezyklen', 'st.temp': 'Temperatur', 'st.soh': 'Gesundheit', 'st.pvall': 'Solar gesamt',
  'st.r.pv': 'Erzeugung', 'st.r.self': 'Selbst genutzt', 'st.r.fed': 'Einspeisung', 'st.r.drawn': 'Bezug', 'st.r.selfq': 'Eigenverbrauch', 'st.r.cons': 'Verbrauch',
  'st.earned': "<b>{e}</b><i>{cur}</i><small>von {i} {cur} Investition</small>", 'st.eta': "Amortisation ca. <b>{y} {cur}</b> pro Jahr", "st.eta.d": "fertig ca. <b>{yr}</b>", 'st.paid': '<b>Anlage hat sich bezahlt gemacht 🎉</b>', 'st.eta.far': 'Prognose noch nicht aussagekräftig', 'st.price.warn': '⚠ Strompreis nur {p} ct/kWh: Das Feld erwartet <b>Cent</b> (zum Beispiel 23.88), nicht Euro.',
  'st.glcost': "<b>{x}</b><i>{cur}</i><small>pro Jahr</small>", 'st.gltip': 'Niedrigster Stundenmittelwert 0–5 Uhr, Median der letzten {n} Nächte', 'st.gl100': "100 W weniger ≈ {x} {cur} pro Jahr", 'st.glcost.avg': "<b>{x}</b><i>{cur}</i><small>pro Jahr zum 7-Tage-Durchschnittspreis</small>", 'st.gl100.avg': "100 W weniger ≈ {x} {cur} pro Jahr zum 7-Tage-Durchschnittspreis",
  'st.full': '× voll', 'st.note': 'Netzstrom {p} ct/kWh · Einspeisung {f} ct/kWh · {g} · Amortisation mit heutigen Preisen geschätzt', 'st.note.nofee': 'reine Energiekosten ohne Grundgebühr', 'st.note.fee': 'Stromkosten Netz mit Grundpreis',
  'st.noprice': 'Preise (grid_price, feed_in) konfigurieren, um Kosten und Ersparnis zu sehen', 'st.nodata': 'noch keine Daten', 'st.vsprev': 'ggü. Vorjahr',
  'st.import': 'Bezug', 'st.export': 'Einspeisung',
  'st.week': 'Woche', 'st.g2name': 'Zweiter Zähler', 'st.g2of': 'davon {n}', 'st.basefee': 'Anteil Grundpreis', 'st.cc.rest': 'Nicht erfasst', 'st.co2.grid': 'Aus dem Netz', 'st.co2.avoid': 'Durch Solar vermieden', 'st.co2.fossil': 'Fossiler Anteil im Netzbezug', 'st.co2.since': 'CO₂-Werte seit {d}', 'st.bud.title': 'Jahresbudget Netzbezug', 'st.bud.of': '{ist} von {goal} kWh Netzbezug', 'st.bud.soll': 'Soll bis heute', 'st.bud.abw': 'Abweichung Ist − Soll', 'st.bud.fc': 'Hochrechnung', 'st.bud.fcabw': 'Abweichung zum Ziel', 'st.bud.lin': 'Soll gleichmäßig übers Jahr', 'st.bud.hist': 'Soll folgt dem Verlauf von {y}', 'st.bud.goal': 'Jahresziel', 'st.bud.since': 'Messdaten erst seit {d}: Soll und Hochrechnung gelten für diesen Zeitraum und sind vorläufig', 'st.cc.group': 'Gruppe', 'st.cc.title': "Kosten pro Verbraucher", 'st.cc.meas': 'gemessen', 'st.cc.est': 'nach Haus-Mix', 'st.cc.cost': 'Netzkosten', 'st.cc.saved': 'Ersparnis', 'st.cc.nohist': 'Nur für Heute, Woche, Monat und das laufende Jahr. Für „Gesamt“ gibt es hier keine Werte', 'st.cc.grid': 'Netz', 'st.cc.bat': 'Batterie', 'st.cc.pv': 'Solar', 'st.cc.upto': 'bis {x} {cur}/h', 'st.cc.unitW': '{id} misst Leistung ({u}). Nötig ist ein Zähler in kWh.', 'st.cc.nostat': 'Keine kWh-Statistik für {id}. Nötig ist ein Zähler mit state_class total_increasing.', 'st.cc.missing': '{id} gibt es nicht.',
  'st.n.pv': 'Solar heute', 'st.n.imp': 'Netzbezug heute', 'st.n.exp': 'Einspeisung heute', 'st.n.chg': 'Batterie geladen heute', 'st.n.dis': 'Batterie entladen heute',
  'st.d.none': '{n}: {id} liefert gerade keinen Wert.', 'st.d.nonefb': '{n}: {id} liefert gerade keinen Wert. Die Karte rechnet ihn aus dem Gesamtzähler.',
  'st.d.big': '{n}: {id} zeigt {v} kWh. Das ist mehr als der Gesamtzähler seit Mitternacht. Steckt dort ein Gesamtzähler statt eines Tageswerts?',
  'st.d.exp': 'Heute mehr eingespeist ({e} kWh) als erzeugt ({p} kWh). Prüfe den Sensor für die Einspeisung.',
  'st.all': 'Gesamt', 'st.hist': 'Historie', 'st.nodata2': 'keine Daten',
  'st.lt.from': 'Daten ab {d}', 'st.lt.gaps': 'Keine Daten für: {m}', 'st.lt.skip': 'In den Summen fehlen {n} Monat(e) ohne vollständige Daten',
  'st.lt.hist': 'Historie: nur Solarertrag, ohne Netz- und Speicherwerte', 'st.lt.price': 'Geldwerte mit den heutigen Preisen gerechnet', 'st.lt.price.h': 'Geldwerte, soweit vorhanden, mit den Stundenpreisen aus der Statistik gerechnet',
});


/* ---- stats-card.js ---- */
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
.h-temp .stat-temp{display:none}
.co2{margin-top:12px}
.co2 .cg{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:8px}
.co2 .cg small{display:block;color:rgb(var(--mut));font-size:calc(.72rem*var(--ts,1))}
.co2 .cg b{font-size:calc(1.35rem*var(--ts,1));font-weight:750}
.co2 .hint{color:rgb(var(--mut));font-size:calc(.7rem*var(--ts,1));margin-top:6px}
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
      // cost_rest (optional, #95): bei "Kosten pro Verbraucher" zusaetzlich "Nicht erfasst" = Hausverbrauch minus alle Verbraucher, je Stunde
      if (c.cost_rest === true && this._c._cc.length) this._c._cc.push({ _rest: true, icon: 'mdi:help-circle-outline', color: '148,163,184' });
      // month_select (optional, #117): Monatsbalken antippen, dann zeigen die Geldkacheln diesen Monat
      this._c._msel = c.month_select === true;
      this._msel = null;
      // co2_intensity (g/kWh) und co2_fossil (%), z. B. Electricity Maps (#115)
      this._c._co2 = typeof c.co2_intensity === 'string' ? c.co2_intensity.trim() : '';
      this._c._co2f = this._c._co2 && typeof c.co2_fossil === 'string' ? c.co2_fossil.trim() : '';
      this._co2 = null; this._co2Past = null;
      // grid_base_fee (optional, #57): Grundpreis in Euro pro Monat. grid_base_fee_history: frühere Grundpreise {until, eur}, "until" wie bei grid_price_history
      { const bf = parseFloat(String(c.grid_base_fee).replace(',', '.')); this._c._bf = bf > 0 ? bf : 0; }
      this._c._bfh = lst(c.grid_base_fee_history).filter((x) => x && x.until && !isNaN(parseFloat(String(x.eur).replace(',', '.')))).map((x) => ({ until: String(x.until), eur: Math.max(0, parseFloat(String(x.eur).replace(',', '.'))) })).sort((a, b) => (a.until < b.until ? -1 : 1));
      // hourly_pricing (optional): Geldkacheln Stunde für Stunde mit dem Stundenmittel des Preis-Sensors. Standard: aus, nur mit true und grid_price als Sensor
      // grid_price_times (optional, #105): Preise nach Uhrzeit. Schaltet die Rechnung Stunde für Stunde ein, auch ohne Preis-Sensor
      this._c._pt = WD.priceTimes(c.grid_price_times);
      this._c._hp = (c.hourly_pricing === true && typeof c.grid_price === 'string' && !!c.grid_price.trim()) || this._c._pt.length > 0;
      // baseload_avg_price (optional): Grundlast-Kachel zum Mittel der Stundenpreise der letzten 7 Tage statt zum Preis dieser Stunde. Standard: aus, nur zusammen mit hourly_pricing
      this._c._gla = c.baseload_avg_price === true && this._c._hp;
      this._ccY = null; this._ccV = null; this._hpV = null; this._hpOld = null; this._h5 = {}; this._glAvg = null;
      // grid2_total (optional, #29): zweiter Netzzähler (z. B. Wärmepumpe mit eigenem Tarif, nur Bezug) in kWh. Eigener Preis: grid2_price oder grid2_price_ct, sonst der normale
      this._c._g2 = typeof c.grid2_total === 'string' && c.grid2_total ? c.grid2_total : '';
      this._c._g2n = typeof c.grid2_name === 'string' ? c.grid2_name.trim() : '';
      // budget_kwh (optional): Jahresziel für den Netzbezug in kWh (Zahl oder Sensor). budget_profile: linear (Standard) oder history (Soll folgt dem Verlauf des Vorjahres)
      this._c._bud = typeof c.budget_kwh === 'number' ? c.budget_kwh : typeof c.budget_kwh === 'string' && c.budget_kwh.trim() ? c.budget_kwh.trim() : null;
      this._c._budHist = c.budget_profile === 'history';
      // hide (optional, #35): einzelne Bereiche ausblenden. monthly (Diagramm PV-Ertrag pro Monat), amortisation, baseload (Grundlast), footer (Rekordtag, Wirkungsgrad ...), money (die vier Kacheln oben)
      const HIDE = { monthly: 'chart', chart: 'chart', amortisation: 'amo', amortization: 'amo', amortisierung: 'amo', baseload: 'gl', grundlast: 'gl', footer: 'footer', fusszeile: 'footer', money: 'money', kacheln: 'money', battery_temp: 'temp', batterietemperatur: 'temp' };
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
        ${c._co2 ? `<div class="panel co2" style="display:none"><span class="lbl" style="--c:var(--sav)"><i></i>CO\u2082 · <span data-f="co2P" style="margin-left:4px"></span></span>
          <div class="cg"><div><small>${T('st.co2.grid')}</small><b data-f="co2G">—</b></div><div><small>${T('st.co2.avoid')}</small><b data-f="co2A">—</b></div>${c._co2f ? `<div><small>${T('st.co2.fossil')}</small><b data-f="co2F">—</b></div>` : ''}</div>
          <div class="hint" data-f="co2H"></div></div>` : ''}
        ${c._cc.length ? `<div class="panel cc" style="display:none">
          <div class="cc-head"><span class="lbl" style="--c:var(--imp)"><i></i>${T('st.cc.title')} · <span data-f="ccP" style="margin-left:4px"></span></span><span class="cc-sum" data-f="ccSum"></span></div>
          <div class="cc-grid">${c._cc.map((x, i) => `<div class="ccard" data-c="${i}" style="--c:${WD.rgb(x.color, '167,139,250')}">
            <div class="cc-top"><span class="ico"><ha-icon icon="${esc(x.icon || 'mdi:flash')}"></ha-icon></span><div class="cc-name"><b>${esc(x._rest ? T('st.cc.rest') : x.name || x.energy || x.grid || T('st.cc.group'))}</b><small>${T(x.grid ? 'st.cc.meas' : 'st.cc.est')}</small></div><span class="cc-live" data-f="ccL${i}"></span></div>
            <div class="cc-main"><div><div class="cc-val"><span class="num" data-t="ccC${i}">—</span><span class="unit">${cur()}</span></div><span class="cc-cap">${T('st.cc.cost')}</span></div><div class="cc-sav"><div class="cc-val s"><span class="num" data-t="ccS${i}">—</span><span class="unit">${cur()}</span></div><span class="cc-cap">${T('st.cc.saved')}</span></div></div>
            <div class="cc-bar">${['--imp', '--bat', '--pv'].map((s) => `<i style="--s:var(${s})"></i>`).join('')}</div>
            <div class="cc-leg" data-f="ccK${i}"></div>${x._parts ? `<div class="cc-parts" data-f="ccD${i}"></div>` : ''}
          </div>`).join('')}</div>
        </div>` : ''}
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
          <div class="stat"><span class="lbl" style="--c:var(--pv)"><i></i>${T('st.solar')}</span><div class="sv"><span>${T('st.sum')}</span><b data-f="pvAll">—</b></div></div>
          <div class="stat"><span class="lbl" style="--c:var(--pv)"><i></i>${T('st.record')} ${now.getFullYear()}</span><div class="sv"><span data-f="recD"></span><b data-f="rec">—</b></div></div>
          <div class="stat"><span class="lbl" style="--c:var(--bat)"><i></i>${T('st.bat')}</span><div class="sv"><span>${T('st.eff')}</span><b data-f="eff">—</b></div></div>
          <div class="stat"><span class="lbl" style="--c:var(--bat)"><i></i>${T('st.cycles')}</span><div class="sv"><span>${T('st.sum')}</span><b data-f="cyc">—</b></div></div>
          <div class="stat stat-temp"><span class="lbl" style="--c:var(--bat)"><i></i>${T('st.bat')}</span><div class="sv"><span>${T('st.temp')}</span><b data-f="temp">—</b></div></div>
          ${c.battery_soh ? `<div class="stat"><span class="lbl" style="--c:var(--bat)"><i></i>${T('st.bat')} (SOH)</span><div class="sv"><span>${T('st.soh')}</span><b data-f="soh">—</b></div></div>` : ''}
        </footer>
        <div class="note" data-f="note"></div>
      </div></ha-card>`;
      this.shadowRoot.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => { this._msel = null; this._period = t.dataset.p; this._render(); }));
      this.shadowRoot.querySelectorAll('.col').forEach((col) => col.addEventListener('click', () => {
        this._sel = +col.dataset.m;
        if (c._msel && this._m) {
          const cy = c._lt ? this._years().cur : new Date().getFullYear(), k = key(cy, this._sel);
          // Nur Monate mit Zaehlerwerten (nicht nur pv_history); der laufende Monat ist wie der Reiter "Monat"
          if (this._m.pvC[k] !== undefined && !this._m.hist[k]) {
            this._msel = k === key(new Date().getFullYear(), new Date().getMonth()) ? null : { k, y: cy, i: this._sel };
            this._period = 'month';
            this._render();
            return;
          }
        }
        this._detail();
      }));
      this.shadowRoot.querySelectorAll('.yb').forEach((b) => b.addEventListener('click', () => {
        const y = this._years();
        this._yr = Math.max(y.min, Math.min(y.max, y.cur + Number(b.dataset.yr)));
        this._msel = null;
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
      const mine = (x) => (x._rest ? [] : x.grid ? [x.grid, x.battery, x.pv] : x._parts ? x._parts.map((q) => q.entity) : [x.energy]).filter(Boolean);
      const ids = [...new Set(house.concat(c._g2 ? [c._g2] : [], ...c._cc.map(mine)))];
      // grid_price_times (#105): der Preis kommt aus den Uhrzeiten, nicht aus einem Sensor. VP steht für diesen berechneten Preis je Stunde
      const VP = '__grid_price_times__', pt = c._pt || [];
      const priceId = pt.length ? VP : typeof c.grid_price === 'string' ? c.grid_price : null, nowEur = WD.price(h, c.grid_price, c.grid_price_ct, 0);
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
          let used = 0;
          c._cc.forEach((x, i) => {
            const en = x._rest ? Math.max(0, home - used) : x._parts ? x._parts.reduce((a2, q) => a2 + (v[q.entity] || 0), 0) : (v[x.energy] || 0);
            const part = x.grid ? [v[x.grid] || 0, v[x.battery] || 0, v[x.pv] || 0] : [en * g, en * b, en * (1 - g - b)];
            used += part[0] + part[1] + part[2];
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
        if (id === VP) {
          // Preis je Stunde aus den Uhrzeiten, sonst früherer Preis (grid_price_history), sonst der normale Preis. Bis einschließlich der laufenden Stunde
          const e = end ? +end : Date.now();
          for (let t = Math.floor(+start / 36e5) * 36e5; t <= e; t += 36e5) {
            const hit = WD.timesPrice(pt, new Date(t).getHours()), day = ymd(t), ph = c._ph.find((x) => day.slice(0, x.until.length) <= x.until);
            out[t] = hit !== null ? hit : ph ? ph.eur : nowEur;
          }
          return out;
        }
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
      const HR = 36e5, ids5 = [c.grid_import_total, c.grid_export_total, priceId === VP ? null : priceId, feedId].filter(Boolean);
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
        // baseload_avg_price: Grundlast läuft rund um die Uhr, dort gilt der einfache Mittelwert der Stundenpreise der letzten 7 Tage statt des Preises
        // dieser Stunde. Reichen die schon geladenen Stunden nicht 7 Tage zurück, einmal nachladen. Unter 24 Stunden mit Preis: null, dann der heutige Preis
        if (c._gla) {
          const g0 = Math.floor((Date.now() - 7 * 864e5) / HR) * HR, gm = first.getTime() <= g0 ? m : await means(new Date(g0), null, priceId);
          const gv = Object.keys(gm).filter((k) => +k >= g0).map((k) => gm[k]);
          this._glAvg = gv.length >= 24 ? gv.reduce((a, v) => a + v, 0) / gv.length : null;
        } else this._glAvg = null;
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

    // CO2 (#115): Netzbezug und selbst genutzter Solarstrom je Stunde mal Stundenmittel der CO2-Intensitaet. Abgeschlossene Monate nur einmal laden
    async _loadCO2() {
      const c = this._c, h = this._hass;
      if (!c._co2 || !h || !h.callWS) return;
      const now = new Date(), y0 = new Date(now.getFullYear(), 0, 1), m0 = new Date(now.getFullYear(), now.getMonth(), 1), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const w0 = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() - (d0.getDay() + 6) % 7), first = w0 < m0 ? w0 : m0;
      const ids = [c.pv_total, c.grid_import_total, c.grid_export_total, c._g2].filter(Boolean);
      const stat = (types, list, start, end) => h.callWS({ type: 'recorder/statistics_during_period', start_time: start.toISOString(), ...(end ? { end_time: end.toISOString() } : {}), period: 'hour', statistic_ids: list, types, ...WD.statUnits(c) });
      const stamp = (r) => (typeof r.start === 'number' ? r.start : Date.parse(r.start));
      const zero = () => ({ imp: 0, g: 0, a: 0, fk: 0, f: 0, n: 0 });
      const load = async (start, end, each) => {
        const [rows, mean] = await Promise.all([stat(['change'], ids, start, end), stat(['mean'], [c._co2, c._co2f].filter(Boolean), start, end)]);
        const at = {}, mv = (id) => { const o = {}; ((mean && mean[id]) || []).forEach((x) => { if (typeof x.mean === 'number') o[stamp(x)] = x.mean; }); return o; };
        const ci = mv(c._co2), cf = c._co2f ? mv(c._co2f) : {};
        ids.forEach((id) => ((rows && rows[id]) || []).forEach((r) => { if (r.change === null || r.change === undefined) return; const t = stamp(r); (at[t] = at[t] || {})[id] = Math.max(0, r.change); }));
        Object.keys(at).forEach((k) => {
          const t = +k, v = at[k];
          if (ci[t] === undefined) return; // ohne CO2-Wert zaehlt die Stunde nicht
          const imp = (v[c.grid_import_total] || 0) + (c._g2 ? v[c._g2] || 0 : 0), self = Math.max(0, (v[c.pv_total] || 0) - (v[c.grid_export_total] || 0));
          each(t, { imp, g: imp * ci[t] / 1000, a: self * ci[t] / 1000, f: cf[t] !== undefined ? imp * cf[t] : 0, fk: cf[t] !== undefined ? imp : 0, n: 1 });
        });
      };
      const add = (o, x) => { Object.keys(x).forEach((k) => { o[k] += x[k]; }); };
      try {
        const pk = key(now.getFullYear(), now.getMonth());
        if (!this._co2Past || this._co2Past.k !== pk) {
          const months = {};
          let t1 = Infinity;
          if (first > y0) await load(y0, first, (t, x) => { const d = new Date(t), k = key(d.getFullYear(), d.getMonth()); if (!months[k]) months[k] = zero(); add(months[k], x); t1 = Math.min(t1, t); });
          this._co2Past = { k: pk, months, t1 };
        }
        const months = {}, day = zero(), week = zero();
        Object.keys(this._co2Past.months).forEach((k) => { months[k] = Object.assign({}, this._co2Past.months[k]); });
        let t1 = this._co2Past.t1;
        await load(first, null, (t, x) => {
          const d = new Date(t), k = key(d.getFullYear(), d.getMonth());
          if (d.getFullYear() === now.getFullYear()) { if (!months[k]) months[k] = zero(); add(months[k], x); }
          if (t >= d0.getTime()) add(day, x);
          if (t >= w0.getTime()) add(week, x);
          t1 = Math.min(t1, t);
        });
        this._co2 = { day, week, months, t1, y: now.getFullYear() };
      } catch (e) {
        console.warn('energy-cockpit-stats-card: co2', e);
      }
    }
    _renderCO2() {
      const c = this._c, el = this._$('.co2');
      if (!el) return;
      const V = this._co2, now = new Date();
      el.style.display = V ? '' : 'none';
      if (!V) return;
      const p = this._period;
      let set = null;
      if (p === 'day') set = V.day;
      else if (p === 'week') set = V.week;
      else if (p === 'month') set = V.months[this._msel ? this._msel.k : key(now.getFullYear(), now.getMonth())] || null;
      else if (p === 'year' && !(c._lt && this._years().cur !== V.y)) set = Object.keys(V.months).reduce((a, k) => { Object.keys(a).forEach((n) => { a[n] += V.months[k][n]; }); return a; }, { imp: 0, g: 0, a: 0, fk: 0, f: 0, n: 0 });
      const kg = (v) => (v >= 1000 ? nf(v / 1000, 2) + '<small>t</small>' : nf(v, v < 100 ? 1 : 0) + '<small>kg</small>');
      const has = set && set.n > 0, tab = this._$('.tab.on');
      this._f('co2P', tab ? esc(tab.textContent) : '');
      this._f('co2G', has ? kg(set.g) : '—');
      this._f('co2A', has ? kg(set.a) : '—');
      if (c._co2f) this._f('co2F', has && set.fk > 0 ? nf(set.f / set.fk, 0) + '<small>%</small>' : '—');
      // Zeitraum beginnt vor dem ersten CO2-Wert: sagen, ab wann gerechnet wird
      const start = p === 'year' ? new Date(V.y, 0, 1).getTime() : null;
      this._f('co2H', has && start !== null && V.t1 > start + 2 * 864e5 ? T('st.co2.since', { d: new Date(V.t1).toLocaleDateString(WD.state.loc, { day: '2-digit', month: '2-digit' }) }) : !has ? T('st.nodata2') : '');
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
      const set = V && ['day', 'week', 'month', 'year'].includes(this._period) && !(this._period === 'month' && this._msel) && !(c._lt && this._period === 'year' && this._years().cur !== new Date().getFullYear()) ? V[this._period] : null;
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
        await this._loadCO2();
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
      const msel = this._period === 'month' ? this._msel : null;
      const ks = this._period === 'month' ? [msel ? msel.k : key(now.getFullYear(), now.getMonth())] : Array.from({ length: now.getMonth() + 1 }, (x, i) => key(now.getFullYear(), i));
      const sum = (o) => ks.reduce((a, k) => a + (o[k] || 0), 0);
      return { ks, pv: sum(M.pv), imp: sum(M.imp), exp: sum(M.exp), chg: sum(M.chg), dis: sum(M.dis), g2: sum(M.g2 || {}), label: this._period === 'month' ? (msel ? MONL[msel.i] + (msel.y !== now.getFullYear() ? ' ' + msel.y : '') : MONL[now.getMonth()]) : String(now.getFullYear()) };
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
      const price = WD.priceNow(h, c, 0), feed = WD.price(h, c.feed_in, c.feed_in_ct, 0), CUR = cur();
      this.shadowRoot.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.p === this._period));
      if (c._msel) {
        const mt = this._$('.tab[data-p="month"]'), s = this._msel, ny = new Date().getFullYear();
        if (mt) mt.textContent = s ? MON[s.i] + (s.y !== ny ? ' ' + String(s.y).slice(2) : '') : MON[new Date().getMonth()];
      }
      this._renderCO2();
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
        // baseload_avg_price: Mittel der Stundenpreise der letzten 7 Tage (aus _loadCC), sonst der heutige Preis
        const glAvg = c._gla && typeof this._glAvg === 'number' ? this._glAvg : null, glPrice = glAvg !== null ? glAvg : price, glK = glAvg !== null ? '.avg' : '';
        this._f('glCost', glPrice > 0 ? T('st.glcost' + glK, { x: fEur(med / 1000 * 8760 * glPrice), cur: CUR }) : '');
        const mx = Math.max(...N.map((x) => x.v), 1);
        const bars = this._$('.nights'), lbl = this._$('.nl');
        if (bars.children.length !== N.length) {
          bars.innerHTML = N.map(() => '<div></div>').join('');
          lbl.innerHTML = N.map((x) => `<span>${x.t.toLocaleDateString(WD.state.loc, { weekday: 'short' }).replace('.', '').slice(0, 2)}</span>`).join('');
        }
        requestAnimationFrame(() => N.forEach((x, i) => { bars.children[i].style.height = Math.max(6, x.v / mx * 100) + '%'; }));
        this._f('glTip', T('st.gltip', { n: N.length }) + (glPrice > 0 ? ' · ' + T('st.gl100' + glK, { x: fEur(0.1 * 8760 * glPrice), cur: CUR }) : ''));
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


/* ---- stats-editor.js ---- */
/* Editor der Statistik-Karte: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const LABELS = {
    title: 'Titel', pv_total: 'PV Gesamtertrag (Zähler, kWh)', pv_lifetime: 'PV-Zähler ohne Zurücksetzen für Amortisation (optional, wenn der PV-Zähler täglich auf 0 geht)', decimals: 'Nachkommastellen bei kWh (leer = automatisch)', grid_import_total: 'Netzbezug gesamt (Zähler, kWh)', grid_export_total: 'Einspeisung gesamt (Zähler, kWh, optional: leer bei Inselanlage)',
    battery_charge_total: 'Batterie geladen gesamt (kWh)', battery_discharge_total: 'Batterie entladen gesamt (kWh)', battery_capacity_kwh: 'Batteriekapazität (kWh)', battery_temp: 'Batterietemperatur', cost_rest: 'Kosten pro Verbraucher: auch „Nicht erfasst“', month_select: 'Monatsbalken antippen: Kacheln zeigen diesen Monat', baseload_avg_price: 'Grundlast zum 7-Tage-Durchschnittspreis', co2_intensity: 'CO₂-Intensität (g/kWh, z. B. Electricity Maps)', co2_fossil: 'Anteil fossiler Energie (%)', battery_soh: 'Gesundheit der Batterie (SOH, Sensor in Prozent)',
    pv_today: 'PV heute (kWh)', import_today: 'Netzbezug heute (kWh, nicht der Gesamtverbrauch)', export_today: 'Einspeisung heute (kWh)', charge_today: 'Batterie geladen heute (kWh)', discharge_today: 'Batterie entladen heute (kWh)',
    language: 'Sprache der Karte', pv: 'Solar', grid_import: 'Netzbezug', grid_export: 'Einspeisung', battery: 'Batterie', battery_charge: 'Batterie lädt (gilt, wenn „Batterie“ leer ist)', home: 'Haus', feed_in_card: 'Kachel Einspeiseerlös', start_period: 'Reiter beim Öffnen', hide: 'Bereiche ausblenden', grid2_total: 'Zweiter Zähler gesamt (kWh, optional, z. B. Wärmepumpe)', grid2_name: 'Name des zweiten Zählers', grid2_price: 'Preis des zweiten Zählers (Sensor oder Helfer, pro kWh)', grid2_price_ct: 'oder fester Preis des zweiten Zählers (Cent pro kWh)', budget_kwh: 'Jahresziel Netzbezug (kWh)', budget_profile: 'Soll im Jahresbudget', home_power: 'Hausverbrauch (Leistung, für Grundlast)', grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)', grid_price_ct: 'oder fester Strompreis (Cent pro kWh)', investment_eur: 'Anschaffungskosten der PV-Anlage (Euro, fest)', theme: 'Farbschema', accent: 'Akzentfarbe (z. B. 34,197,94 oder #22c55e)', feed_in_ct: 'oder feste Einspeisevergütung (Cent pro kWh)', investment: 'Anschaffungskosten PV-Anlage (Sensor oder input_number)', earned_before_eur: 'Bereits erwirtschaftet vor Beginn der Zähler (Euro)', earned_before: 'oder bereits erwirtschaftet aus Sensor oder Helfer (Euro)',
    text_size: 'Textgröße', nav_path: 'Weiter-Schaltfläche: Pfad', nav_label: 'Weiter-Schaltfläche: Text', fit_screen: 'Auf Bildschirmhöhe skalieren',
    battery_losses: 'Batterieverluste bei Ersparnis und Amortisation abziehen', battery_efficiency: 'Wirkungsgrad der Batterie in % (optional, sonst aus den Zählern)', cost_consumers: 'Kosten pro Verbraucher (Liste, siehe Assistent)', grid_price_history: 'Frühere Strompreise (Liste, siehe Assistent)', grid_price_times: 'Preise nach Uhrzeit (Liste, siehe Assistent)', hourly_pricing: 'Geldwerte Stunde für Stunde mit dem Preis-Sensor (Zeittarife, dynamische Tarife)', baseload_avg_price: 'Grundlast zum 7-Tage-Durchschnittspreis (nur mit Geldwerten Stunde für Stunde)',grid_base_fee: 'Grundpreis Strom (Euro pro Monat, optional)', grid_base_fee_history: 'Frühere Grundpreise (Liste, siehe Assistent)', pv_ac: 'PV-Zähler zählt ohne Batterie-Ladung (Hybrid-Wechselrichter)', long_term: 'Langzeit-Ansicht (alle Jahre, Reiter "Gesamt")', pv_history: 'Importierte PV-Historie (Statistik-ID)', pv_history_until: 'Historie gilt bis einschließlich (JJJJ-MM)', pv_history_name: 'Bezeichnung der Historie',
  };
  const ent = (name, d) => ({ name, selector: { entity: d ? { domain: d } : {} } });
  const txt = (name) => ({ name, selector: { text: {} } });
  const KEYS = ['pv_total', 'grid_import_total', 'grid_export_total', 'battery_charge_total', 'battery_discharge_total', 'battery_temp', 'battery_soh', 'pv_today', 'import_today', 'export_today',
    'charge_today', 'discharge_today', 'home_power', 'pv_lifetime', 'grid2_total', 'grid2_price'];

  WD.statsForm = () => ({
    schema: [
      { name: 'title', selector: { text: {} } },
      ...KEYS.map((k) => ent(k, ['sensor'])),
      { name: 'battery_capacity_kwh', selector: { number: { min: 0, max: 200, step: 'any', mode: 'box' } } },
      ent('grid_price', ['sensor', 'input_number']), { name: 'grid_price_ct', selector: { number: { min: 0, max: 200, step: 'any', mode: 'box' } } },
      ent('feed_in', ['sensor', 'input_number']), { name: 'feed_in_ct', selector: { number: { min: 0, max: 200, step: 'any', mode: 'box' } } },
      { name: 'budget_kwh', selector: { number: { min: 0, step: 100, mode: 'box', unit_of_measurement: 'kWh' } } },
      { name: 'budget_profile', selector: { select: { mode: 'dropdown', options: [{ value: 'linear', label: 'Gleichmäßig übers Jahr (Standard)' }, { value: 'history', label: 'Nach dem Verlauf des Vorjahres' }] } } },
      ent('grid2_total', ['sensor']), { name: 'grid2_name', selector: { text: {} } }, ent('grid2_price', ['sensor', 'input_number']), { name: 'grid2_price_ct', selector: { number: { min: 0, max: 200, step: 'any', mode: 'box' } } },
      { name: 'hide', selector: { select: { multiple: true, mode: 'list', options: [{ value: 'monthly', label: 'Diagramm PV-Ertrag pro Monat' }, { value: 'amortisation', label: 'Amortisation' }, { value: 'baseload', label: 'Grundlast (nachts)' }, { value: 'battery_temp', label: 'Batterietemperatur' }, { value: 'footer', label: 'Fußzeile (Rekordtag, Wirkungsgrad, Zyklen ...)' }, { value: 'money', label: 'Die vier Kacheln oben' }] } } },
      { name: 'start_period', selector: { select: { mode: 'dropdown', options: [{ value: 'month', label: 'Monat (Standard)' }, { value: 'day', label: 'Heute' }, { value: 'week', label: 'Woche (mit Verbrauchern)' }, { value: 'year', label: 'Jahr' }] } } },
      { name: 'feed_in_card', selector: { select: { mode: 'dropdown', options: [{ value: 'standard', label: 'Einspeiseerlös (Standard)' }, { value: 'pv_self_consumption', label: 'PV-Eigenverbrauch stattdessen' }, { value: 'hidden', label: 'Ausblenden' }] } } },
      { name: 'investment_eur', selector: { number: { min: 0, max: 1000000, step: 50, mode: 'box' } } },
      { name: 'decimals', selector: { number: { min: 0, max: 3, step: 1, mode: 'box' } } },
      ent('investment', ['sensor', 'input_number']),
      { name: 'earned_before_eur', selector: { number: { min: 0, max: 1000000, step: 1, mode: 'box' } } },
      ent('earned_before', ['sensor', 'input_number']),
      { name: 'pv_ac', selector: { boolean: {} } },
      { name: 'battery_losses', selector: { boolean: {} } },
      ent('battery_efficiency', ['sensor', 'input_number']),
      { name: 'cost_consumers', selector: { object: {} } },
      { name: 'grid_price_history', selector: { object: {} } },
      { name: 'grid_price_times', selector: { object: {} } },
      { name: 'hourly_pricing', default: false, selector: { boolean: {} } },
      { name: 'baseload_avg_price', default: false, selector: { boolean: {} } },
      { name: 'cost_rest', default: false, selector: { boolean: {} } },
      { name: 'month_select', default: false, selector: { boolean: {} } },
      ent('co2_intensity', ['sensor']), ent('co2_fossil', ['sensor']),
      { name: 'grid_base_fee', selector: { number: { min: 0, max: 1000, step: 'any', mode: 'box' } } },
      { name: 'grid_base_fee_history', selector: { object: {} } },
      { name: 'long_term', selector: { boolean: {} } },
      { name: 'pv_history', selector: { text: {} } }, { name: 'pv_history_until', selector: { text: {} } }, { name: 'pv_history_name', selector: { text: {} } },
      { name: 'fit_screen', default: true, selector: { boolean: {} } },
      { name: 'theme', selector: { select: { mode: 'dropdown', options: WD.THEME_OPTIONS } } },
      { name: 'language', selector: { select: { mode: 'dropdown', options: WD.LANG_OPTIONS } } },
      { name: 'text_size', selector: { select: { mode: 'dropdown', custom_value: true, options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }, { value: '2', label: 'Doppelt (2, auch die großen Werte)' }, { value: '3', label: 'Dreifach (3)' }] } } },
      { name: 'nav_path', selector: { text: {} } }, { name: 'nav_label', selector: { text: {} } },
      { type: 'expandable', name: 'colors', title: 'Farben (z. B. #22c55e)', schema: [txt('pv'), txt('grid_import'), txt('grid_export'), txt('battery'), txt('battery_charge'), txt('home')] },
    ],
    computeLabel: (s) => LABELS[s.name] || s.name,
    computeHelper: (s) => (s.name === 'battery_charge' ? 'Optional. Dieselbe Farbe wie die Ladefarbe im Energiefluss. Sie gilt hier für die Batterie, wenn „Batterie“ leer bleibt. Die Karten übernehmen Farben nicht voneinander, trage sie in jeder Karte ein.' : undefined),
  });

  const H = (...re) => re;
  const TOTAL = /gesamt|total|lifetime|energie|energy/i;
  const steps = () => [
    { short: 'Zähler', title: 'Gesamtzähler', text: 'PV und Netzbezug sind Pflicht, die Einspeisung ist optional (leer bei einer Inselanlage). Alle zählen dauerhaft hoch (kWh seit Inbetriebnahme).', fields: [
      { path: 'pv_total', label: 'PV Gesamtertrag', kind: 'energy', hints: H(/pv|solar|inverter|wechselrichter|ertrag|yield/i, TOTAL) },
      { path: 'grid_import_total', label: 'Netzbezug gesamt', kind: 'energy', hints: H(/import|bezug|verbrauch|consumption|grid/i, TOTAL) },
      { path: 'grid_export_total', label: 'Einspeisung gesamt (leer lassen bei einer Inselanlage ohne Einspeisung)', kind: 'energy', optional: true, hints: H(/export|einspeis|feed/i, TOTAL) },
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
      { path: 'co2_intensity', label: 'CO₂-Intensität (g/kWh)', kind: 'co2', optional: true, hints: H(/co2|co₂|carbon|electricity.?maps/i, /intens/i), help: 'Optional, zum Beispiel aus „Electricity Maps“. Zeigt CO₂ aus dem Netzbezug und die durch Solar vermiedene Menge. Der Sensor braucht eine Langzeitstatistik.' },
      { path: 'co2_fossil', label: 'Anteil fossiler Energie (%)', kind: 'percent', optional: true, hints: H(/fossil/i) },
      { path: 'battery_soh', label: 'Gesundheit der Batterie (SOH, in Prozent)', kind: 'percent', optional: true, hints: H(/soh|health|gesund|zustand/i), help: 'Ein Sensor mit dem Gesundheitszustand der Batterie in Prozent (State of Health). Er erscheint als eigene Kachel in der Fußzeile.' },
    ] },
    { short: 'Heute', title: 'Tageswerte (optional)', text: 'Für die Ansicht "Heute".', fields: [
      { path: 'pv_ac', label: 'PV-Zähler zählt ohne Batterie-Ladung', kind: 'bool', help: 'Für Hybrid-Wechselrichter, deren Zähler nur ihre Abgabe zählen. Zeichen dafür: "Autarkie" ist zu niedrig, oder der Verbrauch wirkt zu klein.' },
      { path: 'battery_losses', label: 'Batterieverluste bei Ersparnis und Amortisation abziehen', kind: 'bool', help: 'Optional. Von der Batterie kommen nur etwa 90 % der geladenen Energie wieder heraus, der Rest ist Verlust und hat nichts gespart. Mit dieser Option zieht die Karte den Verlust von der Solar-Ersparnis und der Amortisation ab (Ladung mal Verlustanteil). Der Wirkungsgrad kommt aus den Gesamtzählern für Ladung und Entladung (wie die Anzeige "Wirkungsgrad") oder aus dem Feld darunter. Nicht mit "PV-Zähler zählt ohne Batterie-Ladung", dort sind die Verluste schon heraus.' },
      { path: 'month_select', label: 'Monatsbalken antippen: Kacheln zeigen diesen Monat', kind: 'bool', help: 'Optional. Ein Tipp auf einen früheren Monat im Diagramm zeigt Ersparnis, Kosten und Autarkie dieses Monats. Ein Tipp auf den Reiter führt zurück.' },
      { path: 'cost_rest', label: 'Kosten pro Verbraucher: auch „Nicht erfasst“', kind: 'bool', help: 'Optional. Ergänzt den Teil des Hausverbrauchs, der keinem Verbraucher zugeordnet ist.' },
      { path: 'battery_efficiency', label: 'Wirkungsgrad der Batterie (optional)', kind: 'text', optional: true, help: 'Nur mit "Batterieverluste abziehen". Ein Sensor oder Helfer mit dem Wirkungsgrad in Prozent (zum Beispiel sensor.batterie_wirkungsgrad) oder direkt eine Zahl (zum Beispiel 90). Ohne Angabe rechnet die Karte mit dem Verhältnis von Entladung zu Ladung aus den Gesamtzählern.' },
      { path: 'pv_today', label: 'PV heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /pv|solar|inverter|ertrag|yield/i) },
      { path: 'import_today', label: 'Netzbezug heute (nicht der Gesamtverbrauch)', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /import|bezug|verbrauch/i) },
      { path: 'export_today', label: 'Einspeisung heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /export|einspeis/i) },
      { path: 'charge_today', label: 'Batterie geladen heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /lad|charge/i) },
      { path: 'discharge_today', label: 'Batterie entladen heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /entlad|discharge/i) },
    ] },
    { short: 'Preise', title: 'Preise, Haus und Anlage (optional)', text: 'Mit Preisen zeigt die Karte Geldwerte. Die Anschaffungskosten ergeben die Amortisation, der Hausverbrauch die nächtliche Grundlast.', fields: [
      { path: 'grid_price', label: 'Strompreis Bezug', kind: 'price', optional: true, hints: H(/bezug|netz|strom|import|grid|price|preis/i) },
      { path: 'grid_price_ct', label: 'oder fester Strompreis (Cent pro kWh)', kind: 'number', optional: true, step: '0.1', help: 'Ohne Sensor oder Helfer: einfach den Preis aus deiner Rechnung eintragen, zum Beispiel 34.' },
      { path: 'grid_price_times.0.from', label: 'Preis nach Uhrzeit 1: von (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1', help: 'Für einen Tarif mit zwei Preisen am Tag, zum Beispiel 0 bis 5 Uhr günstiger. Zeiten in ganzen Stunden, jeden Tag gleich, auch über Mitternacht (22 bis 6). Alle anderen Stunden zählen zum normalen Preis oben. Die Statistik rechnet dann Stunde für Stunde, auch rückwirkend, der Energiefluss nimmt den Preis der aktuellen Stunde.' },
      { path: 'grid_price_times.0.to', label: 'Preis nach Uhrzeit 1: bis (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1' },
      { path: 'grid_price_times.0.ct', label: 'Preis nach Uhrzeit 1: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_price_times.1.from', label: 'Preis nach Uhrzeit 2: von (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1' },
      { path: 'grid_price_times.1.to', label: 'Preis nach Uhrzeit 2: bis (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1' },
      { path: 'grid_price_times.1.ct', label: 'Preis nach Uhrzeit 2: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_price_times.2.from', label: 'Preis nach Uhrzeit 3: von (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1' },
      { path: 'grid_price_times.2.to', label: 'Preis nach Uhrzeit 3: bis (ganze Stunde, 0 bis 24)', kind: 'number', optional: true, step: '1' },
      { path: 'grid_price_times.2.ct', label: 'Preis nach Uhrzeit 3: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_price_history.0.until', label: 'Früherer Preis 1: gültig bis (JJJJ-MM-TT)', kind: 'text', optional: true, help: 'Für Stromkosten, PV-Ersparnis und Kosten pro Verbraucher: So rechnen vergangene Monate mit dem Preis von damals. Danach gilt der Preis oben. Ein Sensor mit Langzeitstatistik, etwa bei dynamischem Tarif, braucht das nicht.' },
      { path: 'grid_price_history.0.ct', label: 'Früherer Preis 1: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_price_history.1.until', label: 'Früherer Preis 2: gültig bis (JJJJ-MM-TT)', kind: 'text', optional: true },
      { path: 'grid_price_history.1.ct', label: 'Früherer Preis 2: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_price_history.2.until', label: 'Früherer Preis 3: gültig bis (JJJJ-MM-TT)', kind: 'text', optional: true },
      { path: 'grid_price_history.2.ct', label: 'Früherer Preis 3: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_base_fee', label: 'Grundpreis Strom (Euro pro Monat)', kind: 'number', optional: true, step: '0.01', help: 'Optional. Den Grundpreis aus deiner Rechnung eintragen, zum Beispiel 12,50 pro Monat (Jahresbetrag durch 12 teilen). Er zählt anteilig je Tag in „Stromkosten Netz“ mit, für Heute, Woche, Monat, Jahr und Gesamt. Einmalige Anschlusskosten und Boni gehören nicht hierher.' },
      { path: 'grid_base_fee_history.0.until', label: 'Früherer Grundpreis 1: gültig bis (JJJJ-MM-TT)', kind: 'text', optional: true, help: 'Wie bei den früheren Strompreisen: Bis zu diesem Tag gilt der frühere Grundpreis, danach der Grundpreis oben.' },
      { path: 'grid_base_fee_history.0.eur', label: 'Früherer Grundpreis 1: Euro pro Monat', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_base_fee_history.1.until', label: 'Früherer Grundpreis 2: gültig bis (JJJJ-MM-TT)', kind: 'text', optional: true },
      { path: 'grid_base_fee_history.1.eur', label: 'Früherer Grundpreis 2: Euro pro Monat', kind: 'number', optional: true, step: '0.01' },
      { path: 'feed_in', label: 'Einspeisevergütung', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },
      { path: 'feed_in_ct', label: 'oder feste Einspeisevergütung (Cent pro kWh)', kind: 'number', optional: true, step: '0.1' },
      { path: 'investment_eur', label: 'Anschaffungskosten der PV-Anlage (Euro)', kind: 'number', optional: true, step: '50', help: 'Gesamtpreis der Anlage laut Rechnung, zum Beispiel 18000. Damit berechnet die Karte die Amortisation.' },
      { path: 'investment', label: 'oder Anschaffungskosten aus einem Sensor oder Helfer', kind: 'money', optional: true, hints: H(/anschaff|invest|kosten|cost/i) },
      { path: 'budget_kwh', label: 'Jahresziel für den Netzbezug (kWh)', kind: 'number', optional: true, step: '100', help: 'Optional, zum Beispiel 8000. Die Karte zeigt dann, wie viel vom Jahresziel verbraucht ist, das Soll bis heute und die Hochrechnung.' },
      { path: 'budget_profile', label: 'Soll im Jahresbudget', kind: 'choice', optional: true, options: [{ value: 'linear', label: 'Gleichmäßig übers Jahr (Standard)' }, { value: 'history', label: 'Nach dem Verlauf des Vorjahres' }], help: 'Mit dem Verlauf des Vorjahres steigt das Soll im Winter schneller als im Sommer. Fehlt ein volles Vorjahr, rechnet die Karte gleichmäßig.' },
      { path: 'earned_before_eur', label: 'Bereits erwirtschaftet vor Beginn der Zähler (Euro)', kind: 'number', optional: true, step: '1', help: 'Nur nötig, wenn die Anlage schon lief, bevor Home Assistant die Zähler erfasst hat. Der Betrag wird zur Amortisation addiert.' },
      { path: 'home_power', label: 'Hausverbrauch (Leistung)', kind: 'power', optional: true, hints: H(/haus|home|house|verbrauch|consumption|load/i) },
    ] },
    { short: 'Kosten', title: 'Kosten pro Verbraucher (optional)', text: 'Zeigt je Gerät die Netzkosten und was Solar und Batterie gespart haben, heute, in dieser Woche, im Monat und im Jahr. Weitere Verbraucher gehen unter "Alle Felder" oder in YAML.', fields: [
      { path: 'cost_consumers.0.name', label: 'Verbraucher 1: Name', kind: 'text', optional: true, help: 'Zum Beispiel E-Auto oder Wärmepumpe. Symbol und Farbe wählt die Karte selbst, in YAML gehen auch eigene.' },
      { path: 'cost_consumers.0.energy', label: 'Verbraucher 1: Energie', kind: 'energy', optional: true, help: 'Gesamtzähler in kWh. Die Karte teilt ihn jede Stunde so auf, wie das Haus gerade versorgt wurde. Das ist eine Schätzung.' },
      { path: 'cost_consumers.0.power', label: 'Verbraucher 1: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.0.grid', label: 'Verbraucher 1: Energie aus dem Netz', kind: 'energy', optional: true, help: 'Nur wenn du eigene Zähler je Quelle hast, zum Beispiel von der Wallbox. Dann misst die Karte, statt zu schätzen, und braucht den Zähler oben nicht.' },
      { path: 'cost_consumers.0.battery', label: 'Verbraucher 1: Energie aus der Batterie', kind: 'energy', optional: true },
      { path: 'cost_consumers.0.pv', label: 'Verbraucher 1: Energie aus PV', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.name', label: 'Verbraucher 2: Name', kind: 'text', optional: true },
      { path: 'cost_consumers.1.energy', label: 'Verbraucher 2: Energie', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.power', label: 'Verbraucher 2: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.1.grid', label: 'Verbraucher 2: Energie aus dem Netz', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.battery', label: 'Verbraucher 2: Energie aus der Batterie', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.pv', label: 'Verbraucher 2: Energie aus PV', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.name', label: 'Verbraucher 3: Name', kind: 'text', optional: true },
      { path: 'cost_consumers.2.energy', label: 'Verbraucher 3: Energie', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.power', label: 'Verbraucher 3: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.2.grid', label: 'Verbraucher 3: Energie aus dem Netz', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.battery', label: 'Verbraucher 3: Energie aus der Batterie', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.pv', label: 'Verbraucher 3: Energie aus PV', kind: 'energy', optional: true },
      { path: 'cost_consumers.3.name', label: 'Verbraucher 4: Name', kind: 'text', optional: true },
      { path: 'cost_consumers.3.energy', label: 'Verbraucher 4: Energie', kind: 'energy', optional: true },
      { path: 'cost_consumers.3.power', label: 'Verbraucher 4: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.3.grid', label: 'Verbraucher 4: Energie aus dem Netz', kind: 'energy', optional: true },
      { path: 'cost_consumers.3.battery', label: 'Verbraucher 4: Energie aus der Batterie', kind: 'energy', optional: true },
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
      { path: 'language', label: 'Sprache der Karte', kind: 'choice', options: WD.LANG_OPTIONS, help: 'Optional. Standard: Die Karte nutzt die Sprache aus deinem Home-Assistant-Profil (Deutsch, Englisch oder Niederländisch, sonst Deutsch). Hier legst du sie fest, zum Beispiel Deutsch, wenn Home Assistant auf Englisch läuft. Zahlen- und Uhrzeitformat richten sich nach deinem Profil. Die Editoren bleiben deutsch.' },
      { path: 'text_size', label: 'Textgröße', kind: 'choice', options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }, { value: '2', label: 'Doppelt (2, auch die großen Werte)' }, { value: '3', label: 'Dreifach (3)' }], help: 'Groß und Sehr groß vergrößern die kleinen Texte (Beschriftungen, Zeilen unter den Werten, Fußzeile). Doppelt und Dreifach vergrößern auch die großen Werte.' },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert. Mit "Fertig" siehst du alle Felder.', summary: (c) => [
      `PV gesamt: ${c.pv_total || 'nicht gewählt'}`,
      `Netzbezug gesamt: ${c.grid_import_total || 'nicht gewählt'}`,
      `Einspeisung gesamt: ${c.grid_export_total || 'nicht gewählt'}`,
      `Batterie: ${c.battery_charge_total ? 'ja' : 'nein'}`,
      `Preise: ${c.grid_price || typeof c.grid_price_ct === 'number' ? 'gesetzt' : 'keine'}`,
      `Kosten pro Verbraucher: ${c.cost_consumers ? Object.keys(c.cost_consumers).length : 'keine'}`,
      `Langzeit-Ansicht: ${c.long_term ? 'ein' : 'aus'}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-stats-card-editor', {
    needsSetup: (c) => !c.pv_total || !c.grid_import_total,
    steps,
    form: () => WD.statsForm(),
  });
})();


/* ---- i18n-en.js ---- */
/* Englische Übersetzungen für Kartentexte während der Laufzeit. */
WD.addTranslations('en', {
  'flow.title': 'Energy flow', 'flow.pv': 'Solar', 'flow.pv2': 'Solar 2', 'flow.grid2': 'Second meter', 'flow.grid': 'Grid', 'flow.battery': 'Battery', 'flow.home': 'House consumption',
  'flow.cons_total': 'Consumers', 'flow.rest': 'Unaccounted', 'flow.grest': 'Other', 'flow.restpct': '{n} % measured', 'flow.soc': 'Charge level', 'flow.temp': 'Temperature',
  'flow.next': 'Next →', 'flow.error': 'Configure at least pv or grid',
  'flow.via.miss': '⚠ “Solar runs through the battery” also needs the output power to the house (<b>battery.power_out</b>); until then the normal layout is used.', 'flow.gas': 'Gas', 'flow.oil': 'Oil', 'flow.water': 'Water', 'gas.heat': 'Heating', 'gas.hw': 'Hot water', 'gas.today': 'Today', 'tag.gas.on': 'Heating', 'tag.water.on': 'Flowing', 'tag.today': 'Today',
  'pill.aut': 'Current energy independence', 'pill.self': 'Current self-consumption', 'pv.use.home': 'Home', 'pv.use.bat': 'Battery', 'pv.use.grid': 'Grid', 'pv.use.store': 'Storage',
  'stat.pv': 'Solar today', 'stat.fc1': 'Solar tomorrow', 'stat.fc2': 'Solar the day after tomorrow', 'stat.fc0': 'Forecast today', 'stat.fc1p': 'Forecast tomorrow', 'stat.fc2p': 'Forecast day after tomorrow', 'stat.imp': 'Grid import today', 'stat.exp': 'Grid export', 'stat.bat': 'Battery ± today', 'stat.aut': 'Energy independence today',
  'mix.pv': 'Solar', 'mix.bat': 'Battery', 'mix.grid': 'Grid',
  'tag.offline': 'Offline', 'tag.producing': 'Producing', 'tag.idle': 'Idle', 'tag.balanced': 'Balanced',
  'tag.import': 'Importing', 'tag.export': 'Exporting', 'tag.standby': 'Standby', 'tag.charging': 'Charging', 'tag.discharging': 'Discharging', 'tag.passthrough': 'Passing through',
  'bat.io': 'Input <b>{in}</b> · output <b>{out}</b>', 'bat.split': ' (home <b>{home}</b> · grid <b>{grid}</b>)', 'bat.shared': 'Shared sensor with <b>{name}</b>',
  'forecast': 'Forecast', 'forecast.day': 'Forecast today', 'offline': 'offline',
  'ka.on': '● Awake', 'ka.wait': '☝ Tap once to keep the screen on',
  'waste.today': 'Today', 'waste.tomorrow': 'Tomorrow',
  'bat.usable_pct': 'usable', 'bat.usable_slow': '<div class="sr"><span>Usable</span> <b>{kwh} kWh</b></div><div class="sr"><span>Charging</span> <b>slowly</b></div>', 'bat.full_at': '<div class="sr"><span>Full at</span> <b>{time}</b></div><div class="sr"><span>Full in</span> <b>{dur}</b></div>',
  'bat.last_24': '<div class="sr"><span>Lasts</span> <b>over 24 h</b></div><div class="sr"><span>Usable</span> <b>{kwh} kWh</b></div>', 'bat.last_until': '<div class="sr"><span>Empty at</span> <b>{time}</b></div><div class="sr"><span>Empty in</span> <b>{dur}</b></div>',
  'bat.full': '<div class="sr"><span>Usable</span> <b>{kwh} kWh</b></div>', 'bat.usable': '<div class="sr"><span>Usable</span> <b>{kwh} kWh</b></div><div class="sr"><span>Reserve</span> <b>{res} %</b></div>', 'bat.usable0': '<div class="sr"><span>Usable</span> <b>{kwh} kWh</b></div>',
  'dur.2days': '> 2 days',
  'ban.surplus': '{w} surplus', 'ban.batfull': 'Battery full – ', 'ban.tonet': 'Power is flowing to the grid · using it yourself saves <b>{gain} {cur}/h</b>',
  'ban.running': '{name} is running', 'ban.fromgrid': '{w} from the grid', 'ban.cost': 'currently costs <b>{cost} {cur}/h</b>',
  'ban.batempty': 'Battery empty', 'ban.batlimit': 'Battery at its limit',

  'why.q.bal': 'Why is there no grid import?', 'why.q.baldis': 'Why is the battery discharging?', 'why.q.balchg': 'Why is the battery charging?',
  'why.bal.both': 'Solar produces {pv} and the battery supplies {bat}. Together they cover the home ({home}).',
  'why.bal.sun': 'Solar produces {pv} and covers the home ({home}) on its own.',
  'why.bal.bat': 'The battery ({soc} %) supplies {bat} and covers the home ({home}) on its own.',
  'why.bal.low': 'The home is currently using very little power ({home}).',
  'why.bal.dis': 'Solar alone is not enough for {home}. The battery supplies the rest ({bat}); charge level {soc} %.',
  'why.bal.chg': 'Solar is producing more than the home needs. The surplus ({w}) is charging the battery.',
  'why.imp': 'Why {w} of grid import?', 'why.exp': 'Why {w} of grid export?', 'why.bal': 'Grid balanced', 'why.asof': 'As of {t}',
  'why.cover': 'The home needs {home}. Supplied by: {parts}', 'why.solar': 'Solar', 'why.batt': 'Battery', 'why.grid': 'Grid', 'why.bm': 'Battery charging',
  'why.row.pv': 'Solar production', 'why.row.home': 'Home consumption', 'why.row.chg': 'Battery charging', 'why.row.exp': 'Grid export',
  'why.q.bat': 'Why not use the battery?', 'why.q.sun': 'Why not use solar?', 'why.q.feed': 'Why not charge the battery?', 'why.q.tip': 'Tip', 'why.q.hint': 'Note',
  'why.bat.empty': 'The battery is empty ({soc} %, discharge limit {res} %).',
  'why.bat.idle': 'The battery is at {soc} % but is not supplying power. Check its operating mode or scheduled lockout.',
  'why.bat.dis': 'The battery is already supplying {w}.',
  'why.sun.night': 'It is night. Sunrise is at {t}.', 'why.sun.fc': ' Forecast for tomorrow: {kwh} kWh.', 'why.sun.low': 'Solar is currently producing only {w}.', 'why.sun.zero': 'Solar is not producing anything right now.', 'why.sun.wx': ' Weather: {cnd}.',
  'why.sun.part': 'Solar is producing {pv}, which is not enough for {home}.',
  'why.rest': 'A large amount ({w}) is not assigned to a consumer. Add more consumers to the card.',
  'why.full': 'The battery is full ({soc} %) and is no longer charging.',
  'why.notfull': 'The battery is not charging, although it has room ({soc} %). Check its operating mode.',
  'why.charging': 'The battery is already charging at {w}.', 'why.tip.sug': '{w} surplus: {names} would be a good fit now.',
  'why.bal.txt': 'Solar and the battery cover the home ({home}) without using the grid.',
  'why.none': 'There is no data to explain this right now.', 'why.top': 'including {n} {w}', 'bat.in2': ' (solar 2 <b>{pv}</b> · home <b>{ac}</b>)',
  'xt.alarm': 'Alarm',
  'sky.sunny': 'Sunny', 'sky.clear-night': 'Clear night', 'sky.partlycloudy': 'Partly cloudy', 'sky.cloudy': 'Cloudy', 'sky.fog': 'Fog', 'sky.rainy': 'Rain', 'sky.pouring': 'Heavy rain', 'sky.snowy': 'Snow', 'sky.snowy-rainy': 'Sleet', 'sky.lightning': 'Thunderstorm', 'sky.lightning-rainy': 'Thunderstorm with rain', 'sky.hail': 'Hail', 'sky.windy': 'Windy', 'sky.windy-variant': 'Windy and cloudy', 'sky.exceptional': 'Exceptional weather', 'sky.cloud': 'Cloud cover', 'sky.wind': 'Wind', 'sky.nofc': 'No forecast available from the weather entity',
  'ban.tonet0': 'Power is flowing to the grid', 'stat.home': 'Home today', 'stat.cdaily': '{n} today', 'stat.home.excl': 'Home today without {n}', 'status.on': 'ON', 'status.off': 'OFF', 'status.unknown': 'Unknown', 'close': 'Close',

  'dev.title': 'Devices & consumption', 'dev.room': 'Room', 'dev.err': 'rooms is missing: configure at least one room', 'dev.next': 'Next →',
  'dev.days': 'days', 'dev.p.day': 'Today', 'dev.p.week': 'Week', 'dev.p.month': 'Month', 'dev.p.year': 'Year',
  'dev.l.day': 'Today', 'dev.l.week': 'This week', 'dev.l.month': 'This month', 'dev.l.year': 'This year', 'dev.measured': 'measured',
  'dev.cost': 'Cost', 'dev.home_total': 'Home total', 'dev.none': 'No reachable devices', 'dev.locked': 'protected – display only', 'dev.now': 'NOW',
  'dev.ambilight': 'Ambilight', 'dev.music': 'Music', 'dev.mute': 'Muted', 'dev.light': 'Light',
  'dev.on': 'on', 'dev.off': 'off', 'dev.tv_on': 'TV on', 'dev.tv_off': 'TV off', 'dev.extra': 'Extra device', 'dev.cooling': 'cooling', 'dev.pause': 'Paused', 'dev.since': 'since',
  'dev.unmeasured': 'unaccounted', 'dev.live': 'Now · <b>{n} %</b> measured', 'dev.sub': '{on} of {all} devices on · {w} measured',
  'dev.cent': '¢/kWh', 'dev.grid': 'Grid', 'dev.selfsup': 'Solar/battery', 'dev.standby': 'Standby', 'dev.year': 'year', 'dev.tap_off': 'tap to turn off', 'dev.surplus': 'Surplus',
  'dev.playing': 'playing',
  'dev.st.ready': 'ready', 'dev.st.brewing': 'brewing', 'dev.st.inactive': 'inactive', 'dev.st.finished': 'finished', 'dev.st.pause': 'paused',
  'dev.st.action': 'Action required', 'dev.st.error': 'Error', 'dev.st.playing': 'playing', 'dev.st.standby': 'standby',

  'st.title': 'Statistics', 'st.err': 'pv_total and grid_import_total are required', 'st.today': 'Today', 'st.next': 'Next →',
  'st.pvsav': 'Solar savings', 'st.feed': 'Export revenue', 'st.selfc': 'Solar self-consumption', 'st.cost': 'Grid electricity costs', 'st.aut': 'Energy independence',
  'st.amo': 'Solar system payback', 'st.base': 'Base load (overnight)', 'st.monthly': 'Solar yield per month', 'st.record': 'Record day',
  'st.eff': 'Efficiency', 'st.bat': 'Battery', 'st.sum': 'Total', 'st.solar': 'Solar', 'st.recon': 'on {d}', 'st.cycles': 'Battery cycles', 'st.temp': 'Temperature', 'st.soh': 'Health', 'st.pvall': 'Total solar',
  'st.r.pv': 'Production', 'st.r.self': 'Used directly', 'st.r.fed': 'Exported', 'st.r.drawn': 'Imported', 'st.r.selfq': 'Self-consumption', 'st.r.cons': 'Consumption',
  'st.earned': "<b>{e}</b><i>{cur}</i><small>of {i} {cur} investment</small>", 'st.eta': "Return approx. <b>{y} {cur}</b> per year", 'st.paid': '<b>System has paid for itself 🎉</b>', 'st.eta.far': 'Not enough data for a meaningful forecast', 'st.price.warn': '⚠ Electricity price is only {p} ¢/kWh: this field expects <b>cents</b> (for example 23.88), not euros.',
  'st.glcost': "<b>{x}</b><i>{cur}</i><small>per year</small>", 'st.gltip': 'Lowest hourly average from 00:00–05:00, median of the last {n} nights', 'st.gl100': "100 W less ≈ {x} {cur} per year", 'st.glcost.avg': "<b>{x}</b><i>{cur}</i><small>per year at 7-day avg price</small>", 'st.gl100.avg': "100 W less ≈ {x} {cur} per year at 7-day avg price",
  'st.full': '× full', 'st.note': 'Grid electricity {p} ¢/kWh · export {f} ¢/kWh · {g} · payback estimated using today’s prices', 'st.note.nofee': 'energy costs only, excluding fixed charges', 'st.note.fee': 'grid electricity costs including fixed charges',
  'st.noprice': 'Configure prices (grid_price, feed_in) to see costs and savings', 'st.nodata': 'no data yet', 'st.vsprev': 'vs. previous year',
  'st.import': 'Grid import', 'st.export': 'Grid export',
  'pv.wkwp': "Per kWp", 'grid.fossil': "Fossil", 'st.cc.rest': "Not assigned", 'st.co2.grid': "From the grid", 'st.co2.avoid': "Avoided by solar", 'st.co2.fossil': "Fossil share of grid import", 'st.co2.since': "CO₂ values since {d}",
  'st.week': 'Week', 'st.g2name': 'Second meter', 'st.g2of': 'including {n}', 'st.basefee': 'including fixed charge', 'st.bud.title': 'Annual grid import budget', 'st.bud.of': '{ist} of {goal} kWh grid import', 'st.bud.soll': 'Target by today', 'st.bud.abw': 'Actual − target', 'st.bud.fc': 'Projection', 'st.bud.fcabw': 'Difference from target', 'st.bud.lin': 'Target spread evenly over the year', 'st.bud.hist': 'Target follows {y} usage', 'st.bud.goal': 'Annual target', 'st.bud.since': 'Measurements only available since {d}: target and projection cover this period and are provisional',
  'st.cc.group': 'Group', 'st.cc.title': 'Cost per consumer', 'st.cc.meas': 'measured', 'st.cc.est': 'estimated from home mix', 'st.cc.cost': 'Grid cost', 'st.cc.saved': 'Savings', 'st.cc.nohist': 'Only available for today, week, month, and the current year. No values are available for “Total”.', 'st.cc.grid': 'Grid', 'st.cc.bat': 'Battery', 'st.cc.pv': 'Solar', 'st.cc.upto': 'up to {x} {cur}/h', 'st.cc.unitW': '{id} measures power ({u}). An energy meter in kWh is required.', 'st.cc.nostat': 'No kWh statistics for {id}. A meter with state_class total_increasing is required.', 'st.cc.missing': '{id} does not exist.',
  'st.n.pv': 'Solar today', 'st.n.imp': 'Grid import today', 'st.n.exp': 'Grid export today', 'st.n.chg': 'Battery charged today', 'st.n.dis': 'Battery discharged today',
  'st.d.none': '{n}: {id} is not providing a value right now.', 'st.d.nonefb': '{n}: {id} is not providing a value right now. The card calculates it from the total meter.',
  'st.d.big': '{n}: {id} shows {v} kWh, more than the total meter since midnight. Is this a total meter rather than a daily meter?',
  'st.d.exp': 'More energy was exported ({e} kWh) than generated ({p} kWh) today. Check the export sensor.',
  'st.all': 'Total', 'st.hist': 'History', 'st.nodata2': 'no data',
  'st.lt.from': 'Data from {d}', 'st.lt.gaps': 'No data for: {m}', 'st.lt.skip': '{n} month(s) without complete data are excluded from totals',
  'st.lt.hist': 'History: solar yield only, without grid or battery values', 'st.lt.price': 'Financial values calculated using today’s prices', 'st.lt.price.h': 'Financial values calculated using hourly prices from statistics where available',

  'room.title': 'Room billing', 'room.week': 'This week', 'room.month': 'This month', 'room.year': 'This year', 'room.prev': 'Previous year',
  'room.tab.week': 'Week', 'room.tab.month': 'Month', 'room.tab.year': 'Year', 'room.tab.prev': 'Previous year',
  'room.sum': 'Total', 'room.loading': 'Loading data …',
  'room.noprice': 'No price configured: showing kWh only.', 'room.csv': 'Copy as CSV', 'room.copied': 'Copied',
  'room.since': 'Data since', 'room.unconf': 'Not set up yet. Edit the card (pencil): the <b>wizard</b> will help you select meters.',
});

WD.addTranslations('en', {
  'room.grid': 'Grid', 'room.battery': 'Battery', 'room.pv': 'Solar',
  'room.csv.period': 'Period', 'room.csv.total': 'Total kWh', 'room.csv.grid': 'Grid kWh', 'room.csv.battery': 'Battery kWh', 'room.csv.pv': 'Solar kWh', 'room.csv.cost': 'Cost', 'room.csv.import_cost': 'at import price',
  'room.credit': 'Credit {amount} {cur}', 'room.payment': 'Additional payment {amount} {cur}', 'room.year_summary': 'Year {year}: {cost} {cur} used, {count} × {advance} {cur} = {total} {cur} in advance payments, current balance {balance}',
  'room.invoice': 'Billing', 'room.advance': 'Advance payment', 'room.no_advance': 'no advance payment', 'room.month_forecast': 'Month-end projection', 'room.from_day2': 'from the second day of measurements', 'room.previous_month': 'Previous month', 'room.no_data': 'no data',
  'room.night_w': 'W at night', 'room.night_total': 'Total, 00:00–05:00', 'room.threshold': 'Threshold {w} W', 'room.above': 'above threshold', 'room.ok': 'within range',
  'room.night_note': 'If this continues day and night, that is about <b>{energy} kWh{cost} per month</b> while idle (average of the last 14 nights).', 'room.night_no_data': 'Not enough night-time data yet (at least one night is required).', 'room.night_base': 'Overnight base load (standby)',
  'room.activity': 'Operating hours', 'room.active_above': 'active = above {w} W', 'room.active_today': 'Active hours today', 'room.active_day': 'Most active day',
  'room.activity_note': 'Average power by day of week and hour (last 8 weeks). Lighter to deeper orange indicates lower to higher usage. The right column shows active hours per day.',
  'room.archive': 'Monthly archive (meter readings and amounts saved on the first of each month)', 'room.month_label': 'Month', 'room.grid_label': 'Grid', 'room.battery_label': 'Battery', 'room.balance': 'Balance',
  'room.meter': 'Meter', 'room.import': 'Import', 'room.feed': 'Export', 'room.archive.note': 'Balance = advance payments minus costs (positive means credit). These values are fixed and will not change if prices change later.',
  'room.archive.empty': 'No entries yet. The first month will be saved at 07:00 on the first day of next month.',
  'room.day': 'Day', 'room.chart': 'History and costs', 'room.area': 'Area', 'room.by_area': 'By area', 'room.included': 'including {amount} {cur} fixed charge',
  'room.fee': ' · fixed charge <b>{amount} {cur}</b>/month', 'room.price.all': 'Everything at the import price <b>{price} ¢/kWh</b>{fee}',
  'room.explain.fixed': 'Valuation: every kWh costs the import price, regardless of its source.',
  'room.explain.no_sources': 'Without home energy sources (home_energy), all consumption is valued at the grid price.',
  'room.price.mix': 'Grid <b>{grid} ¢</b> · battery <b>{battery} ¢</b> · solar <b>{pv} ¢/kWh</b>{fee}',
  'room.explain.mix': 'Valuation: each source has a fixed price (grid at the import price, battery and solar at their configured prices).',
  'room.price.opportunity': 'Grid, battery and solar that the home would have needed: <b>{grid} ¢/kWh</b> · surplus solar (otherwise exported): <b>{feed} ¢/kWh</b>{fee}',
  'room.explain.opportunity': 'Opportunity-cost valuation: grid and battery power, plus solar power your home could have used itself, costs the import price. Only solar power from hours with exports is valued at the feed-in rate.',
  'room.full': '<br>For comparison, <b>everything at the grid price</b> ({price} ¢/kWh): <b>{cost} {cur}</b>.',
  'room.subtitle': 'Electricity use and costs', 'room.others': 'other devices', 'room.vs_previous_month': 'vs. previous month',
  'room.today': 'today', 'room.hourly_curve': 'hourly profile', 'room.now_today': 'Now and today', 'room.low': 'low', 'room.elevated': 'elevated', 'room.high': 'high',
  'room.no_use_today': 'No consumption yet today', 'room.source_today': 'Energy sources today',
  'room.mix_tip': 'On average, the least grid power is needed between <b>{from}:00 and {to}:00</b> (Ø {share} % from the grid). Schedule larger loads during that time.',
  'room.mix_tip_missing': 'More days of data are needed to make a recommendation.', 'room.and_cost': ' and {amount} {cur}',
});
WD.addTranslations('en', {
  "why.aria.pv": "Why is solar producing this much right now?",
  "why.aria.bat": "What is the battery doing right now?",
  "why.pv.t": "Solar is producing {w} right now",
  "why.pv.t0": "Solar is not producing anything right now",
  "why.pv.q.low": "Why so little?",
  "why.pv.q.day": "How much is that today?",
  "why.pv.q.full": "Why is solar going to the grid?",
  "why.pv.q.part": "Is solar enough for the house?",
  "why.pv.elev": "The sun is only {deg}° above the horizon, so the panels get little light.",
  "why.pv.cloud": " The sky is {pct} % cloudy.",
  "why.pv.day": "So far today: {kwh} kWh.",
  "why.pv.dayfc": "So far today: {kwh} kWh, forecast for the whole day: {fc} kWh.",
  "why.pv.full": "The house needs less than solar produces and the battery cannot take any more. The rest goes to the grid.",
  "why.pv.nobat": "The house needs less than solar produces. The rest goes to the grid.",
  "why.bt.chg": "{n} is charging at {w}",
  "why.bt.dis": "{n} is delivering {w}",
  "why.bt.idle": "{n} is idle right now",
  "why.bt.lim": "Charge level {soc} %, discharge limit {res} %, maximum charge {max} %",
  "why.bt.q.src": "Where does the charge come from?",
  "why.bt.q.idle": "Why is the battery doing nothing?",
  "why.bt.src.sun": "The charge comes from the solar surplus.",
  "why.bt.src.grid": "Solar is not enough for the house and the battery, so the battery also charges from the grid. That is intended if you set grid charging or a cheap tariff in the storage.",
  "why.bt.nothing": "There is currently neither a solar surplus nor a demand the battery would have to cover.",
  "why.bt.row.pv": "from solar",
  "why.bt.row.grid": "from the grid",
});
WD.addTranslations('en', {
  "bat.selfuse": "Own use",
});
WD.addTranslations('en', {
  "bat.gridchg": "Charging from grid",
});
WD.addTranslations('en', {
  "st.eta.d": "paid off around <b>{yr}</b>",
  "bat.io.pv": "Solar input <b>{in}</b> · output <b>{out}</b>",
  "st.cc.title": "Cost per consumer",
});


/* ---- i18n-nl.js ---- */
/* Niederländische Übersetzungen für Kartentexte während der Laufzeit. */
WD.addTranslations('nl', {
  'flow.title': 'Energiestroom', 'flow.pv': 'Zonne-energie', 'flow.pv2': 'Zonne-energie 2', 'flow.grid2': 'Tweede meter', 'flow.grid': 'Net', 'flow.battery': 'Batterij', 'flow.home': 'Huisverbruik',
  'flow.cons_total': 'Verbruikers', 'flow.rest': 'Niet toegewezen', 'flow.grest': 'Overig', 'flow.restpct': '{n} % gemeten', 'flow.soc': 'Laadniveau', 'flow.temp': 'Temperatuur',
  'flow.next': 'Volgende →', 'flow.error': 'Configureer ten minste pv of grid',
  'flow.via.miss': '⚠ “Zonne-energie loopt via de batterij” heeft ook het uitgangsvermogen naar het huis nodig (<b>battery.power_out</b>); tot dan geldt de normale weergave.', 'flow.gas': 'Gas', 'flow.oil': 'Olie', 'flow.water': 'Water', 'gas.heat': 'Verwarming', 'gas.hw': 'Warm water', 'gas.today': 'Vandaag', 'tag.gas.on': 'Verwarmt', 'tag.water.on': 'Stroomt', 'tag.today': 'Vandaag',
  'pill.aut': 'Zelfvoorziening nu', 'pill.self': 'Zelfverbruik nu', 'pv.use.home': 'Huis', 'pv.use.bat': 'Batterij', 'pv.use.grid': 'Net', 'pv.use.store': 'Opslag',
  'stat.pv': 'Zonne-energie vandaag', 'stat.fc1': 'Zonne-energie morgen', 'stat.fc2': 'Zonne-energie overmorgen', 'stat.fc0': 'Prognose vandaag', 'stat.fc1p': 'Prognose morgen', 'stat.fc2p': 'Prognose overmorgen', 'stat.imp': 'Netafname vandaag', 'stat.exp': 'Teruglevering', 'stat.bat': 'Batterij ± vandaag', 'stat.aut': 'Zelfvoorziening vandaag',
  'mix.pv': 'Zonne-energie', 'mix.bat': 'Batterij', 'mix.grid': 'Net',
  'tag.offline': 'Offline', 'tag.producing': 'Opwekking', 'tag.idle': 'Inactief', 'tag.balanced': 'In balans',
  'tag.import': 'Netafname', 'tag.export': 'Teruglevering', 'tag.standby': 'Stand-by', 'tag.charging': 'Laden', 'tag.discharging': 'Ontladen', 'tag.passthrough': 'Doorgifte',
  'bat.io': 'Ingang <b>{in}</b> · uitgang <b>{out}</b>', 'bat.split': ' (huis <b>{home}</b> · net <b>{grid}</b>)', 'bat.shared': 'Gedeelde sensor met <b>{name}</b>',
  'forecast': 'Prognose', 'forecast.day': 'Prognose vandaag', 'offline': 'offline',
  'ka.on': '● Actief', 'ka.wait': '☝ Tik één keer om het scherm aan te houden',
  'waste.today': 'Vandaag', 'waste.tomorrow': 'Morgen',
  'bat.usable_pct': 'bruikbaar', 'bat.usable_slow': '<div class="sr"><span>Bruikbaar</span> <b>{kwh} kWh</b></div><div class="sr"><span>Laden</span> <b>langzaam</b></div>', 'bat.full_at': '<div class="sr"><span>Vol om</span> <b>{time}</b></div><div class="sr"><span>Vol over</span> <b>{dur}</b></div>',
  'bat.last_24': '<div class="sr"><span>Gaat mee</span> <b>langer dan 24 uur</b></div><div class="sr"><span>Bruikbaar</span> <b>{kwh} kWh</b></div>', 'bat.last_until': '<div class="sr"><span>Leeg om</span> <b>{time}</b></div><div class="sr"><span>Leeg over</span> <b>{dur}</b></div>',
  'bat.full': '<div class="sr"><span>Bruikbaar</span> <b>{kwh} kWh</b></div>', 'bat.usable': '<div class="sr"><span>Bruikbaar</span> <b>{kwh} kWh</b></div><div class="sr"><span>Reserve</span> <b>{res} %</b></div>', 'bat.usable0': '<div class="sr"><span>Bruikbaar</span> <b>{kwh} kWh</b></div>',
  'dur.2days': '> 2 dagen',
  'ban.surplus': '{w} overschot', 'ban.batfull': 'Batterij vol – ', 'ban.tonet': 'Stroom gaat naar het net · zelf gebruiken bespaart <b>{gain} {cur}/uur</b>',
  'ban.running': '{name} is actief', 'ban.fromgrid': '{w} van het net', 'ban.cost': 'kost nu <b>{cost} {cur}/uur</b>',
  'ban.batempty': 'Batterij leeg', 'ban.batlimit': 'Batterij op de grens',

  'why.q.bal': 'Waarom is er geen netafname?', 'why.q.baldis': 'Waarom ontlaadt de batterij?', 'why.q.balchg': 'Waarom laadt de batterij?',
  'why.bal.both': 'Zonne-energie levert {pv} en de batterij levert {bat}. Samen voorzien ze het huis van stroom ({home}).',
  'why.bal.sun': 'Zonne-energie levert {pv} en voorziet het huis zelfstandig van stroom ({home}).',
  'why.bal.bat': 'De batterij ({soc} %) levert {bat} en voorziet het huis zelfstandig van stroom ({home}).',
  'why.bal.low': 'Het huis verbruikt op dit moment weinig stroom ({home}).',
  'why.bal.dis': 'Zonne-energie is niet genoeg voor {home}. De batterij levert de rest ({bat}); laadniveau {soc} %.',
  'why.bal.chg': 'Er wordt meer zonne-energie opgewekt dan het huis verbruikt. Het overschot ({w}) laadt de batterij op.',
  'why.imp': 'Waarom {w} netafname?', 'why.exp': 'Waarom {w} teruglevering?', 'why.bal': 'Net in balans', 'why.asof': 'Stand om {t}',
  'why.cover': 'Het huis verbruikt {home}. Afkomstig van: {parts}', 'why.solar': 'Zonne-energie', 'why.batt': 'Batterij', 'why.grid': 'Net', 'why.bm': 'Batterij laadt',
  'why.row.pv': 'Opwekking zonne-energie', 'why.row.home': 'Huisverbruik', 'why.row.chg': 'Batterij laadt', 'why.row.exp': 'Teruglevering',
  'why.q.bat': 'Waarom niet uit de batterij?', 'why.q.sun': 'Waarom niet uit zonne-energie?', 'why.q.feed': 'Waarom laadt de batterij niet?', 'why.q.tip': 'Tip', 'why.q.hint': 'Opmerking',
  'why.bat.empty': 'De batterij is leeg ({soc} %, ontlaadgrens {res} %).',
  'why.bat.idle': 'De batterij is {soc} %, maar levert op dit moment geen stroom. Controleer de bedrijfsmodus of ingestelde blokkering.',
  'why.bat.dis': 'De batterij levert al {w}.',
  'why.sun.night': 'Het is nacht. Zonsopkomst om {t}.', 'why.sun.fc': ' Prognose voor morgen: {kwh} kWh.', 'why.sun.low': 'Zonne-energie levert nu slechts {w}.', 'why.sun.zero': 'Er wordt op dit moment geen zonne-energie opgewekt.', 'why.sun.wx': ' Weer: {cnd}.',
  'why.sun.part': 'Zonne-energie levert {pv}, niet genoeg voor {home}.',
  'why.rest': 'Een groot deel ({w}) is niet aan een verbruiker toegewezen. Voeg meer verbruikers toe aan de kaart.',
  'why.full': 'De batterij is vol ({soc} %) en laadt niet verder op.',
  'why.notfull': 'De batterij laadt niet op, hoewel er nog ruimte is ({soc} %). Controleer de bedrijfsmodus.',
  'why.charging': 'De batterij laadt al met {w}.', 'why.tip.sug': '{w} overschot: {names} is nu een goede keuze.',
  'why.bal.txt': 'Zonne-energie en de batterij voorzien het huis van stroom ({home}), zonder het net te gebruiken.',
  'why.none': 'Er zijn op dit moment geen gegevens voor een uitleg.', 'why.top': 'waarvan {n} {w}', 'bat.in2': ' (zonne-energie 2 <b>{pv}</b> · huis <b>{ac}</b>)',
  'xt.alarm': 'Alarm',
  'sky.sunny': 'Zonnig', 'sky.clear-night': 'Heldere nacht', 'sky.partlycloudy': 'Half bewolkt', 'sky.cloudy': 'Bewolkt', 'sky.fog': 'Mist', 'sky.rainy': 'Regen', 'sky.pouring': 'Stortregen', 'sky.snowy': 'Sneeuw', 'sky.snowy-rainy': 'Natte sneeuw', 'sky.lightning': 'Onweer', 'sky.lightning-rainy': 'Onweer met regen', 'sky.hail': 'Hagel', 'sky.windy': 'Winderig', 'sky.windy-variant': 'Winderig en bewolkt', 'sky.exceptional': 'Uitzonderlijk weer', 'sky.cloud': 'Bewolking', 'sky.wind': 'Wind', 'sky.nofc': 'Geen prognose beschikbaar van de weerentiteit',
  'ban.tonet0': 'Stroom gaat naar het net', 'stat.home': 'Huis vandaag', 'stat.cdaily': '{n} vandaag', 'stat.home.excl': 'Huis vandaag zonder {n}', 'status.on': 'AAN', 'status.off': 'UIT', 'status.unknown': 'Onbekend', 'close': 'Sluiten',

  'dev.title': 'Apparaten en verbruik', 'dev.room': 'Ruimte', 'dev.err': 'rooms ontbreekt: configureer ten minste één ruimte', 'dev.next': 'Volgende →',
  'dev.days': 'dagen', 'dev.p.day': 'Vandaag', 'dev.p.week': 'Week', 'dev.p.month': 'Maand', 'dev.p.year': 'Jaar',
  'dev.l.day': 'Vandaag', 'dev.l.week': 'Deze week', 'dev.l.month': 'Deze maand', 'dev.l.year': 'Dit jaar', 'dev.measured': 'gemeten',
  'dev.cost': 'Kosten', 'dev.home_total': 'Huis totaal', 'dev.none': 'Geen bereikbare apparaten', 'dev.locked': 'beveiligd – alleen weergave', 'dev.now': 'NU',
  'dev.ambilight': 'Ambilight', 'dev.music': 'Muziek', 'dev.mute': 'Geluid uit', 'dev.light': 'Licht',
  'dev.on': 'aan', 'dev.off': 'uit', 'dev.tv_on': 'Tv aan', 'dev.tv_off': 'Tv uit', 'dev.extra': 'Extra apparaat', 'dev.cooling': 'koelt', 'dev.pause': 'Gepauzeerd', 'dev.since': 'sinds',
  'dev.unmeasured': 'niet toegewezen', 'dev.live': 'Nu · <b>{n} %</b> gemeten', 'dev.sub': '{on} van {all} apparaten aan · {w} gemeten',
  'dev.cent': 'ct/kWh', 'dev.grid': 'Net', 'dev.selfsup': 'Zonne-energie/batterij', 'dev.standby': 'Stand-by', 'dev.year': 'jaar', 'dev.tap_off': 'tik om uit te schakelen', 'dev.surplus': 'Overschot',
  'dev.playing': 'speelt af',
  'dev.st.ready': 'gereed', 'dev.st.brewing': 'zet koffie', 'dev.st.inactive': 'inactief', 'dev.st.finished': 'gereed', 'dev.st.pause': 'gepauzeerd',
  'dev.st.action': 'Actie nodig', 'dev.st.error': 'Fout', 'dev.st.playing': 'speelt af', 'dev.st.standby': 'stand-by',

  'st.title': 'Statistieken', 'st.err': 'pv_total en grid_import_total zijn vereist', 'st.today': 'Vandaag', 'st.next': 'Volgende →',
  'st.pvsav': 'Besparing door zonne-energie', 'st.feed': 'Opbrengst teruglevering', 'st.selfc': 'Zelfverbruik zonne-energie', 'st.cost': 'Kosten netstroom', 'st.aut': 'Zelfvoorziening',
  'st.amo': 'Terugverdientijd zonne-installatie', 'st.base': 'Basisverbruik (nacht)', 'st.monthly': 'Opbrengst zonne-energie per maand', 'st.record': 'Recorddag',
  'st.eff': 'Rendement', 'st.bat': 'Batterij', 'st.sum': 'Totaal', 'st.solar': 'Zonne-energie', 'st.recon': 'op {d}', 'st.cycles': 'Batterijcycli', 'st.temp': 'Temperatuur', 'st.soh': 'Gezondheid', 'st.pvall': 'Zonne-energie totaal',
  'st.r.pv': 'Opwekking', 'st.r.self': 'Direct gebruikt', 'st.r.fed': 'Teruggeleverd', 'st.r.drawn': 'Afgenomen', 'st.r.selfq': 'Zelfverbruik', 'st.r.cons': 'Verbruik',
  'st.earned': "<b>{e}</b><i>{cur}</i><small>van {i} {cur} investering</small>", 'st.eta': "Rendement ca. <b>{y} {cur}</b> per jaar", 'st.paid': '<b>Installatie heeft zichzelf terugverdiend 🎉</b>', 'st.eta.far': 'Nog onvoldoende gegevens voor een betrouwbare prognose', 'st.price.warn': '⚠ De stroomprijs is slechts {p} ct/kWh: dit veld verwacht <b>centen</b> (bijvoorbeeld 23.88), geen euro’s.',
  'st.glcost': "<b>{x}</b><i>{cur}</i><small>per jaar</small>", 'st.gltip': 'Laagste uurgemiddelde tussen 00:00 en 05:00, mediaan van de laatste {n} nachten', 'st.gl100': "100 W minder ≈ {x} {cur} per jaar", 'st.glcost.avg': "<b>{x}</b><i>{cur}</i><small>per jaar tegen de gemiddelde prijs van 7 dagen</small>", 'st.gl100.avg': "100 W minder ≈ {x} {cur} per jaar tegen de gemiddelde prijs van 7 dagen",
  'st.full': '× vol', 'st.note': 'Netstroom {p} ct/kWh · teruglevering {f} ct/kWh · {g} · terugverdientijd geschat met de huidige prijzen', 'st.note.nofee': 'alleen energiekosten, zonder vastrecht', 'st.note.fee': 'kosten netstroom inclusief vastrecht',
  'st.noprice': 'Configureer prijzen (grid_price, feed_in) om kosten en besparingen te zien', 'st.nodata': 'nog geen gegevens', 'st.vsprev': 't.o.v. vorig jaar',
  'st.import': 'Netafname', 'st.export': 'Teruglevering',
  'pv.wkwp': "Per kWp", 'grid.fossil': "Fossiel", 'st.cc.rest': "Niet toegewezen", 'st.co2.grid': "Uit het net", 'st.co2.avoid': "Vermeden door zon", 'st.co2.fossil': "Fossiel aandeel in netafname", 'st.co2.since': "CO₂-waarden sinds {d}",
  'st.week': 'Week', 'st.g2name': 'Tweede meter', 'st.g2of': 'waarvan {n}', 'st.basefee': 'waarvan vastrecht', 'st.bud.title': 'Jaarbudget netafname', 'st.bud.of': '{ist} van {goal} kWh netafname', 'st.bud.soll': 'Doel tot vandaag', 'st.bud.abw': 'Werkelijk − doel', 'st.bud.fc': 'Prognose', 'st.bud.fcabw': 'Afwijking van doel', 'st.bud.lin': 'Doel gelijkmatig verdeeld over het jaar', 'st.bud.hist': 'Doel volgt het verbruik van {y}', 'st.bud.goal': 'Jaardoel', 'st.bud.since': 'Meetgegevens zijn pas beschikbaar vanaf {d}: doel en prognose gelden voor deze periode en zijn voorlopig',
  'st.cc.group': 'Groep', 'st.cc.title': 'Kosten per verbruiker', 'st.cc.meas': 'gemeten', 'st.cc.est': 'geschat op basis van de huisverdeling', 'st.cc.cost': 'Netkosten', 'st.cc.saved': 'Besparing', 'st.cc.nohist': 'Alleen beschikbaar voor vandaag, week, maand en het lopende jaar. Voor “Totaal” zijn hier geen waarden.', 'st.cc.grid': 'Net', 'st.cc.bat': 'Batterij', 'st.cc.pv': 'Zonne-energie', 'st.cc.upto': 'tot {x} {cur}/uur', 'st.cc.unitW': '{id} meet vermogen ({u}). Een energiemeter in kWh is vereist.', 'st.cc.nostat': 'Geen kWh-statistieken voor {id}. Een meter met state_class total_increasing is vereist.', 'st.cc.missing': '{id} bestaat niet.',
  'st.n.pv': 'Zonne-energie vandaag', 'st.n.imp': 'Netafname vandaag', 'st.n.exp': 'Teruglevering vandaag', 'st.n.chg': 'Batterij geladen vandaag', 'st.n.dis': 'Batterij ontladen vandaag',
  'st.d.none': '{n}: {id} levert op dit moment geen waarde.', 'st.d.nonefb': '{n}: {id} levert op dit moment geen waarde. De kaart berekent dit op basis van de totaalmeter.',
  'st.d.big': '{n}: {id} toont {v} kWh. Dat is meer dan de totaalmeter sinds middernacht. Is dit een totaalmeter in plaats van een dagmeter?',
  'st.d.exp': 'Vandaag is meer teruggeleverd ({e} kWh) dan opgewekt ({p} kWh). Controleer de sensor voor teruglevering.',
  'st.all': 'Totaal', 'st.hist': 'Geschiedenis', 'st.nodata2': 'geen gegevens',
  'st.lt.from': 'Gegevens vanaf {d}', 'st.lt.gaps': 'Geen gegevens voor: {m}', 'st.lt.skip': '{n} maand(en) zonder volledige gegevens ontbreken in de totalen',
  'st.lt.hist': 'Geschiedenis: alleen opbrengst zonne-energie, zonder net- en batterijwaarden', 'st.lt.price': 'Geldbedragen berekend met de huidige prijzen', 'st.lt.price.h': 'Geldbedragen waar mogelijk berekend met de uurprijzen uit de statistieken',

  'room.title': 'Ruimteafrekening', 'room.week': 'Deze week', 'room.month': 'Deze maand', 'room.year': 'Dit jaar', 'room.prev': 'Vorig jaar',
  'room.tab.week': 'Week', 'room.tab.month': 'Maand', 'room.tab.year': 'Jaar', 'room.tab.prev': 'Vorig jaar',
  'room.sum': 'Totaal', 'room.loading': 'Gegevens laden …',
  'room.noprice': 'Geen prijs ingesteld: alleen kWh worden getoond.', 'room.csv': 'Kopiëren als CSV', 'room.copied': 'Gekopieerd',
  'room.since': 'Gegevens sinds', 'room.unconf': 'Nog niet ingesteld. Bewerk de kaart (potlood): de <b>wizard</b> helpt je de meters te selecteren.',
});

WD.addTranslations('nl', {
  'room.grid': 'Net', 'room.battery': 'Batterij', 'room.pv': 'Zonne-energie',
  'room.csv.period': 'Periode', 'room.csv.total': 'Totaal kWh', 'room.csv.grid': 'Net kWh', 'room.csv.battery': 'Batterij kWh', 'room.csv.pv': 'Zonne-energie kWh', 'room.csv.cost': 'Kosten', 'room.csv.import_cost': 'tegen afnametarief',
  'room.credit': 'Tegoed {amount} {cur}', 'room.payment': 'Bijbetaling {amount} {cur}', 'room.year_summary': 'Jaar {year}: {cost} {cur} verbruikt, {count} × {advance} {cur} = {total} {cur} voorschot, huidig saldo {balance}',
  'room.invoice': 'Afrekening', 'room.advance': 'Voorschot', 'room.no_advance': 'geen voorschot', 'room.month_forecast': 'Prognose einde maand', 'room.from_day2': 'vanaf de tweede meetdag', 'room.previous_month': 'Vorige maand', 'room.no_data': 'geen gegevens',
  'room.night_w': 'W ’s nachts', 'room.night_total': 'Totaal, 00:00–05:00', 'room.threshold': 'Grens {w} W', 'room.above': 'boven de grens', 'room.ok': 'binnen de grens',
  'room.night_note': 'Als dit dag en nacht zo doorgaat, is dat ongeveer <b>{energy} kWh{cost} per maand</b> in stand-by (gemiddelde van de laatste 14 nachten).', 'room.night_no_data': 'Nog onvoldoende nachtgegevens (ten minste één nacht is nodig).', 'room.night_base': 'Basisverbruik ’s nachts (stand-by)',
  'room.activity': 'Bedrijfsuren', 'room.active_above': 'actief = boven {w} W', 'room.active_today': 'Actieve uren vandaag', 'room.active_day': 'Actiefste dag',
  'room.activity_note': 'Gemiddeld vermogen per weekdag en uur (laatste 8 weken). Licht tot donkeroranje staat voor laag tot hoog verbruik. De rechterkolom toont het aantal actieve uren per dag.',
  'room.archive': 'Maandarchief (meterstanden en bedragen opgeslagen op de eerste dag van de maand)', 'room.month_label': 'Maand', 'room.grid_label': 'Net', 'room.battery_label': 'Batterij', 'room.balance': 'Saldo',
  'room.meter': 'Meter', 'room.import': 'Afname', 'room.feed': 'Teruglevering', 'room.archive.note': 'Saldo = voorschotten min kosten (positief betekent tegoed). Deze waarden staan vast en veranderen niet als de prijzen later wijzigen.',
  'room.archive.empty': 'Nog geen gegevens. De eerste maand wordt om 07:00 op de eerste dag van de volgende maand opgeslagen.',
  'room.day': 'Dag', 'room.chart': 'Verloop en kosten', 'room.area': 'Ruimte', 'room.by_area': 'Per ruimte', 'room.included': 'inclusief {amount} {cur} vastrecht',
  'room.fee': ' · vastrecht <b>{amount} {cur}</b>/maand', 'room.price.all': 'Alles tegen het afnametarief <b>{price} ct/kWh</b>{fee}',
  'room.explain.fixed': 'Waardering: elke kWh kost het afnametarief, ongeacht de bron.',
  'room.explain.no_sources': 'Zonder energiebronnen van het huis (home_energy) wordt al het verbruik tegen het nettarief berekend.',
  'room.price.mix': 'Net <b>{grid} ct</b> · batterij <b>{battery} ct</b> · zonne-energie <b>{pv} ct/kWh</b>{fee}',
  'room.explain.mix': 'Waardering: elke bron heeft een vast tarief (net tegen het afnametarief, batterij en zonne-energie tegen de ingestelde tarieven).',
  'room.price.opportunity': 'Net, batterij en zonne-energie die het huis nodig zou hebben: <b>{grid} ct/kWh</b> · overtollige zonne-energie (anders teruggeleverd): <b>{feed} ct/kWh</b>{fee}',
  'room.explain.opportunity': 'Waardering op basis van gemiste opbrengst: stroom van het net en de batterij, plus zonne-energie die het huis zelf had kunnen gebruiken, kost het afnametarief. Alleen zonne-energie uit uren met teruglevering wordt tegen het teruglevertarief gewaardeerd.',
  'room.full': '<br>Ter vergelijking, <b>alles tegen het nettarief</b> ({price} ct/kWh): <b>{cost} {cur}</b>.',
  'room.subtitle': 'Stroomverbruik en kosten', 'room.others': 'overige apparaten', 'room.vs_previous_month': 't.o.v. vorige maand',
  'room.today': 'vandaag', 'room.hourly_curve': 'verloop per uur', 'room.now_today': 'Nu en vandaag', 'room.low': 'laag', 'room.elevated': 'verhoogd', 'room.high': 'hoog',
  'room.no_use_today': 'Vandaag nog geen verbruik', 'room.source_today': 'Herkomst vandaag',
  'room.mix_tip': 'Gemiddeld is tussen <b>{from}:00 en {to}:00</b> de minste netstroom nodig (Ø {share} % van het net). Plan grote verbruikers bij voorkeur op dat moment.',
  'room.mix_tip_missing': 'Er zijn meer dagen met gegevens nodig voor een aanbeveling.', 'room.and_cost': ' en {amount} {cur}',
});
WD.addTranslations('nl', {
  "why.aria.pv": "Waarom levert zonne-energie nu zoveel?",
  "why.aria.bat": "Wat doet de batterij op dit moment?",
  "why.pv.t": "Zonne-energie levert nu {w}",
  "why.pv.t0": "Zonne-energie levert nu niets",
  "why.pv.q.low": "Waarom zo weinig?",
  "why.pv.q.day": "Hoeveel is dat vandaag?",
  "why.pv.q.full": "Waarom gaat zonne-energie naar het net?",
  "why.pv.q.part": "Is zonne-energie genoeg voor het huis?",
  "why.pv.elev": "De zon staat slechts {deg}° boven de horizon, de panelen krijgen weinig licht.",
  "why.pv.cloud": " De lucht is voor {pct} % bewolkt.",
  "why.pv.day": "Vandaag tot nu toe {kwh} kWh.",
  "why.pv.dayfc": "Vandaag tot nu toe {kwh} kWh, verwachting voor de hele dag {fc} kWh.",
  "why.pv.full": "Het huis heeft minder nodig dan de zonne-energie levert en de batterij kan niets meer opnemen. De rest gaat naar het net.",
  "why.pv.nobat": "Het huis heeft minder nodig dan de zonne-energie levert. De rest gaat naar het net.",
  "why.bt.chg": "{n} laadt met {w}",
  "why.bt.dis": "{n} levert {w}",
  "why.bt.idle": "{n} is nu inactief",
  "why.bt.lim": "Laadniveau {soc} %, ontlaadgrens {res} %, maximale lading {max} %",
  "why.bt.q.src": "Waar komt de lading vandaan?",
  "why.bt.q.idle": "Waarom doet de batterij niets?",
  "why.bt.src.sun": "De lading komt uit het zonne-overschot.",
  "why.bt.src.grid": "Zonne-energie is niet genoeg voor huis en batterij, daarom laadt de batterij ook uit het net. Dat is de bedoeling als je netladen of een goedkoop tarief in de opslag hebt ingesteld.",
  "why.bt.nothing": "Er is nu geen zonne-overschot en geen stroomvraag die de batterij moet dekken.",
  "why.bt.row.pv": "uit zonne-energie",
  "why.bt.row.grid": "uit het net",
});
WD.addTranslations('nl', {
  "bat.selfuse": "Eigen gebruik",
});
WD.addTranslations('nl', {
  "bat.gridchg": "Laden vanaf net",
});
WD.addTranslations('nl', {
  "st.eta.d": "terugverdiend rond <b>{yr}</b>",
  "bat.io.pv": "Zonne-ingang <b>{in}</b> · uitgang <b>{out}</b>",
  "st.cc.title": "Kosten per verbruiker",
});


/* ---- i18n-fr.js ---- */
/* Französische Übersetzungen für Kartentexte während der Laufzeit. Beitrag von Shadowspocket (Andréas), Pull Request #39.
   Fehlende Texte zeigen Deutsch. Fehlende Schlüssel auflisten: npm run missing -- fr */
WD.addTranslations('fr', {
  'dev.title': "Appareils & Consommation",
  'dev.room': "Pièce",
  'dev.err': "rooms manquant : configurer au moins une pièce",
  'dev.next': "Suite →",
  'dev.days': "jours",
  'dev.p.day': "Aujourd'hui",
  'dev.p.week': "Semaine",
  'dev.p.month': "Mois",
  'dev.p.year': "Année",
  'dev.l.day': "Aujourd'hui",
  'dev.l.week': "Cette semaine",
  'dev.l.month': "Ce mois",
  'dev.l.year': "Cette année",
  'dev.measured': "mesuré",
  'dev.cost': "Coûts",
  'dev.home_total': "Maison total",
  'dev.none': "Aucun appareil accessible",
  'dev.locked': "protégé – affichage uniquement",
  'dev.now': "MAINTENANT",
  'dev.ambilight': "Ambilight",
  'dev.music': "Musique",
  'dev.mute': "Son coupé",
  'dev.light': "Lumière",
  'dev.on': "allumé",
  'dev.off': "éteint",
  'dev.tv_on': "TV allumée",
  'dev.tv_off': "TV éteinte",
  'dev.extra': "Appareil supplémentaire",
  'dev.cooling': "refroidit",
  'dev.pause': "Pause",
  'dev.since': "depuis",
  'dev.unmeasured': "non mesuré",
  'dev.live': "Maintenant · dont <b>{n} %</b> mesuré",
  'dev.sub': "{on} sur {all} appareils allumés · {w} mesuré",
  'dev.cent': "ct/kWh",
  'dev.grid': "Réseau",
  'dev.selfsup': "PV/Batterie",
  'dev.standby': "Veille",
  'dev.year': "Année",
  'dev.tap_off': "appuyer = éteindre",
  'dev.surplus': "Surplus",
  'dev.playing': "en cours",
  'dev.st.ready': "prêt",
  'dev.st.brewing': "en préparation",
  'dev.st.inactive': "inactif",
  'dev.st.finished': "terminé",
  'dev.st.pause': "pause",
  'dev.st.action': "Action requise",
  'dev.st.error': "Erreur",
  'dev.st.playing': "en lecture",
  'dev.st.standby': "veille",
  'st.title': "Statistiques",
  'st.err': "pv_total et grid_import_total sont nécessaires",
  'st.today': "Aujourd'hui",
  'st.next': "Suite →",
  'st.pvsav': "Économies PV",
  'st.feed': "Revenu injection",
  'st.selfc': "Autoconsommation PV",
  'st.cost': "Coût électricité réseau",
  'st.aut': "Autosuffisance",
  'st.amo': "Amortissement installation PV",
  'st.base': "Charge de base (nuit)",
  'st.monthly': "Production PV par mois",
  'st.record': "Journée record",
  'st.eff': "Rendement batterie",
  'st.cycles': "Cycles complets",
  'st.temp': "Température batterie",
  'st.soh': "Santé",
  'st.pvall': "PV total",
  'st.earned': "<b>{e}</b><i>{cur}</i><small>sur {i} {cur} investis</small>",
  'st.eta': "Gain env. <b>{y} {cur}</b> par an",
  'st.paid': "<b>L'installation est amortie 🎉</b>",
  'st.eta.far': "Prévision pas encore significative",
  'st.price.warn': "⚠ Prix électricité seulement {p} ct/kWh : ce champ attend des <b>centimes</b> (par exemple 23.88), pas des euros.",
  'st.glcost': "<b>{x}</b><i>{cur}</i><small>par an</small>",
  'st.gltip': "Valeur horaire minimale 0–5 h, médiane des {n} dernières nuits",
  'st.gl100': "100 W de moins ≈ {x} {cur} par an", 'st.glcost.avg': "<b>{x}</b><i>{cur}</i><small>par an au prix moyen sur 7 jours</small>", 'st.gl100.avg': "100 W de moins ≈ {x} {cur} par an au prix moyen sur 7 jours",
  'st.full': "× complet",
  'st.noprice': "Configurer les prix (grid_price, feed_in) pour voir coûts et économies",
  'st.nodata': "pas encore de données",
  'st.vsprev': "vs année précédente",
  'st.import': "Soutirage",
  'st.export': "Injection",
  'pv.wkwp': "Par kWc", 'grid.fossil': "Fossile", 'st.cc.rest': "Non attribué", 'st.co2.grid': "Du réseau", 'st.co2.avoid': "Évité grâce au solaire", 'st.co2.fossil': "Part fossile du soutirage", 'st.co2.since': "Valeurs CO₂ depuis le {d}",
  'st.week': "Semaine",
  'st.g2name': "Deuxième compteur",
  'st.bud.title': "Budget annuel soutirage réseau",
  'st.bud.of': "{ist} sur {goal} kWh soutirés",
  'st.bud.soll': "Objectif à ce jour",
  'st.bud.abw': "Écart réel − objectif",
  'st.bud.fc': "Projection",
  'st.bud.fcabw': "Écart par rapport à l'objectif",
  'st.bud.lin': "Objectif réparti uniformément sur l'année",
  'st.bud.hist': "Objectif suit la courbe de {y}",
  'st.bud.goal': "Objectif annuel",
  'st.bud.since': "Données disponibles depuis {d} : objectif et projection valent pour cette période et sont provisoires",
  'st.cc.title': "Coûts par consommateur",
  'st.cc.meas': "mesuré",
  'st.cc.est': "selon mix maison",
  'st.cc.cost': "Coût réseau",
  'st.cc.saved': "Économie",
  'st.cc.nohist': "Uniquement pour Aujourd'hui, Semaine, Mois et l'année en cours. Pas de valeurs pour « Total »",
  'st.cc.grid': "Réseau",
  'st.cc.bat': "Batterie",
  'st.cc.pv': "PV",
  'st.cc.upto': "jusqu'à {x} {cur}/h",
  'st.cc.unitW': "{id} mesure la puissance ({u}). Un compteur en kWh est nécessaire.",
  'st.cc.nostat': "Pas de statistique kWh pour {id}. Un compteur avec state_class total_increasing est nécessaire.",
  'st.cc.missing': "{id} n'existe pas.",
  'st.n.pv': "PV aujourd'hui",
  'st.n.imp': "Soutirage réseau aujourd'hui",
  'st.n.exp': "Injection aujourd'hui",
  'st.n.chg': "Batterie chargée aujourd'hui",
  'st.n.dis': "Batterie déchargée aujourd'hui",
  'st.d.none': "{n} : {id} ne retourne pas de valeur actuellement.",
  'st.d.nonefb': "{n} : {id} ne retourne pas de valeur actuellement. La carte la calcule depuis le compteur total.",
  'st.d.big': "{n} : {id} affiche {v} kWh. C'est plus que le compteur total depuis minuit. Y a-t-il un compteur total au lieu d'une valeur journalière ?",
  'st.d.exp': "Plus injecté aujourd'hui ({e} kWh) que produit ({p} kWh). Vérifiez le capteur d'injection.",
  'st.all': "Total",
  'st.hist': "Historique",
  'st.nodata2': "pas de données",
  'st.lt.from': "Données depuis {d}",
  'st.lt.gaps': "Pas de données pour : {m}",
  'st.lt.skip': "{n} mois sans données complètes exclus des totaux",
  'st.lt.hist': "Historique : production PV uniquement, sans valeurs réseau et stockage",
  'st.lt.price': "Valeurs monétaires calculées aux prix actuels",
  'st.lt.price.h': "Valeurs monétaires calculées avec les prix horaires des statistiques lorsqu’ils sont disponibles",
  'flow.title': "Flux énergétique",
  'flow.pv': "Panneaux solaires",
  'flow.pv2': "PV 2",
  'flow.grid2': "Deuxième compteur",
  'flow.grid': "Réseau",
  'flow.battery': "Batterie",
  'flow.home': "Consommation maison",
  'flow.cons_total': "Consommateurs",
  'flow.rest': "Non mesuré",
  'flow.grest': "Reste",
  'flow.restpct': "{n} % mesuré",
  'flow.soc': "Charge",
  'flow.temp': "Température",
  'flow.next': "Suite →",
  'flow.error': "Configurer au moins pv ou grid",
  'pill.aut': "Autosuffisance",
  'pill.self': "Autoconsommation",
  'pv.use.home': "Maison",
  'pv.use.bat': "Batterie",
  'pv.use.grid': "Réseau",
  'pv.use.store': "Stockage",
  'stat.pv': "PV aujourd'hui",
  'stat.fc1': "PV demain",
  'stat.fc2': "PV après-demain", 'stat.fc0': "Prévision aujourd'hui", 'stat.fc1p': "Prévision demain", 'stat.fc2p': "Prévision après-demain",
  'stat.imp': "Soutirage aujourd'hui",
  'stat.exp': "Injection",
  'stat.bat': "Batterie ± aujourd'hui",
  'stat.aut': "Autosuffisance aujourd'hui",
  'mix.pv': "Solaire",
  'mix.bat': "Batterie",
  'mix.grid': "Réseau",
  'tag.offline': "Hors ligne",
  'tag.producing': "Production",
  'tag.idle': "Inactif",
  'tag.balanced': "Équilibré",
  'tag.import': "Soutirage",
  'tag.export': "Injection",
  'tag.standby': "Veille",
  'tag.charging': "Charge",
  'tag.discharging': "Décharge",
  'tag.passthrough': "Transit",
  'bat.io': "Entrée <b>{in}</b> · Sortie <b>{out}</b>",
  'bat.split': " (Maison <b>{home}</b> · Réseau <b>{grid}</b>)",
  'bat.shared': "Capteur partagé avec <b>{name}</b>",
  'forecast': "Prévision",
  'forecast.day': "Prévision aujourd'hui",
  'offline': "hors ligne",
  'ka.on': "● Actif",
  'ka.wait': "☝ Appuyer une fois – l'écran reste allumé",
  'waste.today': "Aujourd'hui",
  'waste.tomorrow': "Demain",
  'bat.usable_pct': "utilisable",
  'dur.2days': "> 2 jours",
  'ban.surplus': "{w} surplus",
  'ban.batfull': "Batterie pleine – ",
  'ban.tonet': "Courant injecté au réseau · l'autoconsommation économise <b>{gain} {cur}/h</b>",
  'ban.running': "{name} en marche",
  'ban.fromgrid': "{w} depuis le réseau",
  'ban.cost': "coûte actuellement <b>{cost} {cur}/h</b>",
  'ban.batempty': "Batterie vide",
  'ban.batlimit': "Batterie à la limite",
});
// Traductions françaises manquantes — à ajouter dans src/i18n-fr.js
// Contribution de Shadowspocket (Andréas), complément au PR #39

WD.addTranslations('fr', {

  // --- Flux via batterie ---
  'flow.via.miss': '⚠ « Le solaire passe par la batterie » nécessite aussi la puissance de sortie vers la maison (<b>battery.power_out</b>) ; en attendant, la disposition normale est utilisée.',

  // --- Gaz & Eau ---
  'flow.gas': 'Gaz',
  'flow.oil': 'Fioul',
  'flow.water': 'Eau',
  'gas.heat': 'Chauffage',
  'gas.hw': 'Eau chaude',
  'gas.today': "Aujourd'hui",
  'tag.gas.on': 'Chauffage',
  'tag.water.on': 'En cours',
  'tag.today': "Aujourd'hui",

  // --- Batterie (détails) ---
  'bat.usable_slow': '<div class="sr"><span>Utilisable</span> <b>{kwh} kWh</b></div><div class="sr"><span>Charge</span> <b>lente</b></div>',
  'bat.full_at': '<div class="sr"><span>Pleine à</span> <b>{time}</b></div><div class="sr"><span>Pleine dans</span> <b>{dur}</b></div>',
  'bat.last_24': '<div class="sr"><span>Dure</span> <b>plus de 24 h</b></div><div class="sr"><span>Utilisable</span> <b>{kwh} kWh</b></div>',
  'bat.last_until': '<div class="sr"><span>Vide à</span> <b>{time}</b></div><div class="sr"><span>Vide dans</span> <b>{dur}</b></div>',
  'bat.full': '<div class="sr"><span>Utilisable</span> <b>{kwh} kWh</b></div>',
  'bat.usable': '<div class="sr"><span>Utilisable</span> <b>{kwh} kWh</b></div><div class="sr"><span>Réserve</span> <b>{res} %</b></div>',
  'bat.usable0': '<div class="sr"><span>Utilisable</span> <b>{kwh} kWh</b></div>',
  'bat.in2': ' (solaire 2 <b>{pv}</b> · maison <b>{ac}</b>)',

  // --- Explications "?" (why.*) ---
  'why.q.bal': "Pourquoi pas de soutirage réseau ?",
  'why.q.baldis': "Pourquoi la batterie se décharge-t-elle ?",
  'why.q.balchg': "Pourquoi la batterie charge-t-elle ?",
  'why.bal.both': "Le solaire produit {pv} et la batterie fournit {bat}. Ensemble, ils couvrent la maison ({home}).",
  'why.bal.sun': "Le solaire produit {pv} et couvre la maison ({home}) seul.",
  'why.bal.bat': "La batterie ({soc} %) fournit {bat} et couvre la maison ({home}) seule.",
  'why.bal.low': "La maison consomme très peu en ce moment ({home}).",
  'why.bal.dis': "Le solaire seul ne suffit pas pour {home}. La batterie fournit le reste ({bat}) ; charge {soc} %.",
  'why.bal.chg': "Le solaire produit plus que la maison n'a besoin. Le surplus ({w}) charge la batterie.",
  'why.imp': "Pourquoi {w} de soutirage réseau ?",
  'why.exp': "Pourquoi {w} d'injection réseau ?",
  'why.bal': "Réseau équilibré",
  'why.asof': "À {t}",
  'why.cover': "La maison a besoin de {home}. Fourni par : {parts}",
  'why.solar': "Solaire",
  'why.batt': "Batterie",
  'why.grid': "Réseau",
  'why.bm': "Charge batterie",
  'why.row.pv': "Production solaire",
  'why.row.home': "Consommation maison",
  'why.row.chg': "Charge batterie",
  'why.row.exp': "Injection réseau",
  'why.q.bat': "Pourquoi ne pas utiliser la batterie ?",
  'why.q.sun': "Pourquoi ne pas utiliser le solaire ?",
  'why.q.feed': "Pourquoi ne pas charger la batterie ?",
  'why.q.tip': "Conseil",
  'why.q.hint': "Remarque",
  'why.bat.empty': "La batterie est vide ({soc} %, limite de décharge {res} %).",
  'why.bat.idle': "La batterie est à {soc} % mais ne fournit pas de courant. Vérifiez son mode de fonctionnement ou le blocage planifié.",
  'why.bat.dis': "La batterie fournit déjà {w}.",
  'why.sun.night': "Il fait nuit. Le lever du soleil est à {t}.",
  'why.sun.fc': " Prévision pour demain : {kwh} kWh.",
  'why.sun.low': "Le solaire ne produit que {w} en ce moment.",
  'why.sun.zero': "Le solaire ne produit rien pour l'instant.",
  'why.sun.wx': " Météo : {cnd}.",
  'why.sun.part': "Le solaire produit {pv}, ce qui ne suffit pas pour {home}.",
  'why.rest': "Une grande partie ({w}) n'est pas attribuée à un consommateur. Ajoutez des consommateurs à la carte.",
  'why.full': "La batterie est pleine ({soc} %) et ne charge plus.",
  'why.notfull': "La batterie ne charge pas alors qu'elle a de la place ({soc} %). Vérifiez son mode de fonctionnement.",
  'why.charging': "La batterie charge déjà à {w}.",
  'why.tip.sug': "{w} de surplus : {names} serait bien adapté maintenant.",
  'why.bal.txt': "Le solaire et la batterie couvrent la maison ({home}) sans utiliser le réseau.",
  'why.none': "Pas de données disponibles pour expliquer cela en ce moment.",
  'why.top': "dont {n} {w}",

  // --- Divers ---
  'xt.alarm': "Alarme",
  'ban.tonet0': "Courant injecté au réseau",
  'stat.home': "Maison aujourd'hui",
  'stat.cdaily': "{n} aujourd'hui",
  'stat.home.excl': "Maison aujourd'hui sans {n}",
  'status.on': "MARCHE",
  'status.off': "ARRÊT",
  'status.unknown': "Inconnu",
  'close': "Fermer",

  // --- Météo (sky.*) ---
  'sky.sunny': "Ensoleillé",
  'sky.clear-night': "Nuit claire",
  'sky.partlycloudy': "Partiellement nuageux",
  'sky.cloudy': "Nuageux",
  'sky.fog': "Brouillard",
  'sky.rainy': "Pluie",
  'sky.pouring': "Forte pluie",
  'sky.snowy': "Neige",
  'sky.snowy-rainy': "Neige fondue",
  'sky.lightning': "Orage",
  'sky.lightning-rainy': "Orage avec pluie",
  'sky.hail': "Grêle",
  'sky.windy': "Venteux",
  'sky.windy-variant': "Venteux et nuageux",
  'sky.exceptional': "Météo exceptionnelle",
  'sky.cloud': "Couverture nuageuse",
  'sky.wind': "Vent",
  'sky.nofc': "Aucune prévision disponible depuis l'entité météo",

  // --- Statistiques supplémentaires ---
  'st.bat': "Batterie",
  'st.sum': "Total",
  'st.solar': "Solaire",
  'st.recon': "le {d}",
  'st.r.pv': "Production",
  'st.r.self': "Autoconsommé",
  'st.r.fed': "Injecté",
  'st.r.drawn': "Soutiré",
  'st.r.selfq': "Taux d'autoconsommation",
  'st.r.cons': "Consommation",
  'st.note': "Réseau {p} ct/kWh · injection {f} ct/kWh · {g} · amortissement calculé aux prix actuels",
  'st.note.nofee': "coûts énergétiques uniquement, hors abonnement",
  'st.note.fee': "coûts réseau incluant l'abonnement fixe",
  'st.g2of': "dont {n}",
  'st.basefee': "abonnement inclus",
  'st.cc.group': "Groupe",

  // --- Carte pièce (room.*) ---
  'room.title': "Facturation par pièce",
  'room.week': "Cette semaine",
  'room.month': "Ce mois",
  'room.year': "Cette année",
  'room.prev': "Année précédente",
  'room.tab.week': "Semaine",
  'room.tab.month': "Mois",
  'room.tab.year': "Année",
  'room.tab.prev': "Année précédente",
  'room.sum': "Total",
  'room.loading': "Chargement des données…",
  'room.noprice': "Aucun prix configuré : affichage en kWh uniquement.",
  'room.csv': "Copier en CSV",
  'room.copied': "Copié",
  'room.since': "Données depuis",
  'room.unconf': "Pas encore configuré. Modifiez la carte (crayon) : l'<b>assistant</b> vous aidera à sélectionner les compteurs.",
  'room.grid': "Réseau",
  'room.battery': "Batterie",
  'room.pv': "Solaire",
  'room.csv.period': "Période",
  'room.csv.total': "Total kWh",
  'room.csv.grid': "Réseau kWh",
  'room.csv.battery': "Batterie kWh",
  'room.csv.pv': "Solaire kWh",
  'room.csv.cost': "Coût",
  'room.csv.import_cost': "au prix de soutirage",
  'room.credit': "Crédit {amount} {cur}",
  'room.payment': "Paiement complémentaire {amount} {cur}",
  'room.year_summary': "Année {year} : {cost} {cur} consommés, {count} × {advance} {cur} = {total} {cur} d'acomptes, solde actuel {balance}",
  'room.invoice': "Facturation",
  'room.advance': "Acompte",
  'room.no_advance': "sans acompte",
  'room.month_forecast': "Projection fin de mois",
  'room.from_day2': "à partir du deuxième jour de mesures",
  'room.previous_month': "Mois précédent",
  'room.no_data': "pas de données",
  'room.night_w': "W la nuit",
  'room.night_total': "Total, 00:00–05:00",
  'room.threshold': "Seuil {w} W",
  'room.above': "au-dessus du seuil",
  'room.ok': "dans la plage",
  'room.night_note': "Si cela continue jour et nuit, cela représente environ <b>{energy} kWh{cost} par mois</b> en veille (moyenne des 14 dernières nuits).",
  'room.night_no_data': "Pas encore assez de données nocturnes (au moins une nuit est nécessaire).",
  'room.night_base': "Charge de base nocturne (veille)",
  'room.activity': "Heures de fonctionnement",
  'room.active_above': "actif = au-dessus de {w} W",
  'room.active_today': "Heures actives aujourd'hui",
  'room.active_day': "Jour le plus actif",
  'room.activity_note': "Puissance moyenne par jour de la semaine et par heure (8 dernières semaines). Du plus clair au plus foncé indique une consommation plus ou moins élevée. La colonne de droite indique les heures actives par jour.",
  'room.archive': "Archive mensuelle (relevés de compteurs et montants enregistrés le premier de chaque mois)",
  'room.month_label': "Mois",
  'room.grid_label': "Réseau",
  'room.battery_label': "Batterie",
  'room.balance': "Solde",
  'room.meter': "Compteur",
  'room.import': "Soutirage",
  'room.feed': "Injection",
  'room.archive.note': "Solde = acomptes moins coûts (positif = crédit). Ces valeurs sont définitives et ne changeront pas si les prix évoluent.",
  'room.archive.empty': "Aucune entrée pour l'instant. Le premier mois sera enregistré à 07:00 le premier jour du mois prochain.",
  'room.day': "Jour",
  'room.chart': "Historique et coûts",
  'room.area': "Zone",
  'room.by_area': "Par zone",
  'room.included': "dont {amount} {cur} d'abonnement fixe",
  'room.fee': " · abonnement fixe <b>{amount} {cur}</b>/mois",
  'room.price.all': "Tout au prix de soutirage <b>{price} ct/kWh</b>{fee}",
  'room.explain.fixed': "Valorisation : chaque kWh coûte le prix de soutirage, quelle que soit sa source.",
  'room.explain.no_sources': "Sans sources d'énergie domestique (home_energy), toute la consommation est valorisée au prix réseau.",
  'room.price.mix': "Réseau <b>{grid} ct</b> · batterie <b>{battery} ct</b> · solaire <b>{pv} ct/kWh</b>{fee}",
  'room.explain.mix': "Valorisation : chaque source a un prix fixe (réseau au prix de soutirage, batterie et solaire à leurs prix configurés).",
  'room.price.opportunity': "Réseau, batterie et solaire dont la maison aurait eu besoin : <b>{grid} ct/kWh</b> · surplus solaire (sinon injecté) : <b>{feed} ct/kWh</b>{fee}",
  'room.explain.opportunity': "Valorisation au coût d'opportunité : le courant réseau et batterie, ainsi que le solaire que la maison aurait pu utiliser, coûtent le prix de soutirage. Seul le solaire des heures avec injection est valorisé au tarif de rachat.",
  'room.full': "<br>Pour comparaison, <b>tout au prix réseau</b> ({price} ct/kWh) : <b>{cost} {cur}</b>.",
  'room.subtitle': "Consommation et coûts électriques",
  'room.others': "autres appareils",
  'room.vs_previous_month': "vs. mois précédent",
  'room.today': "aujourd'hui",
  'room.hourly_curve': "profil horaire",
  'room.now_today': "Maintenant et aujourd'hui",
  'room.low': "faible",
  'room.elevated': "élevé",
  'room.high': "très élevé",
  'room.no_use_today': "Aucune consommation aujourd'hui",
  'room.source_today': "Sources d'énergie aujourd'hui",
  'room.mix_tip': "En moyenne, le moins de courant réseau est nécessaire entre <b>{from}:00 et {to}:00</b> (Ø {share} % du réseau). Planifiez les grandes charges à ce moment.",
  'room.mix_tip_missing': "Plus de jours de données sont nécessaires pour faire une recommandation.",
  'room.and_cost': " et {amount} {cur}",
});
WD.addTranslations('fr', {
  "why.aria.pv": "Pourquoi le solaire produit-il autant en ce moment ?",
  "why.aria.bat": "Que fait la batterie en ce moment ?",
  "why.pv.t": "Le solaire produit actuellement {w}",
  "why.pv.t0": "Le solaire ne produit rien en ce moment",
  "why.pv.q.low": "Pourquoi si peu ?",
  "why.pv.q.day": "Combien cela fait-il aujourd'hui ?",
  "why.pv.q.full": "Pourquoi le solaire part-il sur le réseau ?",
  "why.pv.q.part": "Le solaire suffit-il pour la maison ?",
  "why.pv.elev": "Le soleil n'est qu'à {deg}° au-dessus de l'horizon, les panneaux reçoivent peu de lumière.",
  "why.pv.cloud": " Le ciel est nuageux à {pct} %.",
  "why.pv.day": "Jusqu'à présent aujourd'hui : {kwh} kWh.",
  "why.pv.dayfc": "Jusqu'à présent aujourd'hui : {kwh} kWh, prévision pour toute la journée : {fc} kWh.",
  "why.pv.full": "La maison consomme moins que ce que produit le solaire et la batterie n'accepte plus rien. Le reste part sur le réseau.",
  "why.pv.nobat": "La maison consomme moins que ce que produit le solaire. Le reste part sur le réseau.",
  "why.bt.chg": "{n} se charge à {w}",
  "why.bt.dis": "{n} fournit {w}",
  "why.bt.idle": "{n} est actuellement inactive",
  "why.bt.lim": "Charge {soc} %, limite de décharge {res} %, charge maximale {max} %",
  "why.bt.q.src": "D'où vient la charge ?",
  "why.bt.q.idle": "Pourquoi la batterie ne fait-elle rien ?",
  "why.bt.src.sun": "La charge provient du surplus solaire.",
  "why.bt.src.grid": "Le solaire ne suffit pas pour la maison et la batterie, la batterie se charge donc aussi sur le réseau. C'est voulu si vous avez réglé une charge réseau ou un tarif avantageux dans le stockage.",
  "why.bt.nothing": "Il n'y a actuellement ni surplus solaire ni besoin que la batterie devrait couvrir.",
  "why.bt.row.pv": "du solaire",
  "why.bt.row.grid": "du réseau",
});
WD.addTranslations('fr', {
  "bat.selfuse": "Consommation propre",
});
WD.addTranslations('fr', {
  "bat.gridchg": "Charge depuis le réseau",
});
WD.addTranslations('fr', {
  "st.eta.d": "amorti vers <b>{yr}</b>",
  "bat.io.pv": "Entrée solaire <b>{in}</b> · Sortie <b>{out}</b>",
  "st.cc.title": "Coût par consommateur",
});


/* ---- i18n-fi.js ---- */
/* Finnische Übersetzungen für Kartentexte während der Laufzeit. Beitrag von omcberry, Issue #30.
   Fehlende Texte zeigen Deutsch. Fehlende Schlüssel auflisten: npm run missing -- fi */
WD.addTranslations('fi', {
  'dev.title': "Laitteet ja kulutus",
  'dev.room': "Huone",
  'dev.err': "rooms puuttuu: määritä vähintään yksi huone",
  'dev.next': "Seuraava →",
  'dev.days': "päivää",
  'dev.p.day': "Tänään",
  'dev.p.week': "Viikko",
  'dev.p.month': "Kuukausi",
  'dev.p.year': "Vuosi",
  'dev.l.day': "Tänään",
  'dev.l.week': "Tämä viikko",
  'dev.l.month': "Tämä kuukausi",
  'dev.l.year': "Tämä vuosi",
  'dev.measured': "mitattu",
  'dev.cost': "Kustannus",
  'dev.home_total': "Talo yhteensä",
  'dev.none': "Ei tavoitettavia laitteita",
  'dev.locked': "lukittu – vain tarkastelu",
  'dev.now': "NYT",
  'dev.ambilight': "Ambilight",
  'dev.music': "Musiikki",
  'dev.mute': "Äänet pois",
  'dev.light': "Valo",
  'dev.on': "päällä",
  'dev.off': "pois",
  'dev.tv_on': "TV päällä",
  'dev.tv_off': "TV pois",
  'dev.extra': "Lisälaite",
  'dev.cooling': "jäähdyttää",
  'dev.pause': "Tauko",
  'dev.since': "päällä",
  'dev.unmeasured': "mittaamaton",
  'dev.live': "Nyt · siitä <b>{n} %</b> mitattu",
  'dev.sub': "{on}/{all} laitetta päällä · {w} mitattu",
  'dev.cent': "c/kWh",
  'dev.grid': "Verkko",
  'dev.selfsup': "Aurinko/akku",
  'dev.standby': "Valmiustila",
  'dev.year': "Vuosi",
  'dev.tap_off': "napauta = pois",
  'dev.surplus': "Ylijäämä",
  'dev.playing': "toistaa",
  'dev.st.ready': "valmiina",
  'dev.st.brewing': "keittää",
  'dev.st.inactive': "ei käytössä",
  'dev.st.finished': "valmis",
  'dev.st.pause': "Tauko",
  'dev.st.action': "Vaatii toimenpiteitä",
  'dev.st.error': "Virhe",
  'dev.st.playing': "toistaa",
  'dev.st.standby': "Valmiustila",
  'st.title': "Tilastot",
  'st.err': "pv_total ja grid_import_total tarvitaan",
  'st.today': "Tänään",
  'st.next': "Seuraava →",
  'st.pvsav': "Aurinkosähkön säästö",
  'st.feed': "Myyntitulot",
  'st.selfc': "Aurinkosähkön omakäyttö",
  'st.cost': "Ostosähkön kustannus",
  'st.aut': "Omavaraisuus",
  'st.amo': "Aurinkojärjestelmän takaisinmaksu",
  'st.base': "Peruskuorma (yöllä)",
  'st.monthly': "Aurinkotuotto kuukausittain",
  'st.record': "Ennätyspäivä",
  'st.eff': "Hyötysuhde",
  'st.cycles': "Akun syklit",
  'st.temp': "Lämpötila",
  'st.soh': "Kunto",
  'st.pvall': "Aurinkotuotto yhteensä",
  'st.earned': "<b>{e}</b><i>{cur}</i><small>{i} {cur} investoinnista</small>",
  'st.eta': "Tuotto noin <b>{y} {cur}</b> vuodessa",
  'st.paid': "<b>Järjestelmä on maksanut itsensä takaisin 🎉</b>",
  'st.eta.far': "Ennuste ei ole vielä luotettava",
  'st.price.warn': "⚠ Sähkön hinta vain {p} c/kWh: kenttä odottaa <b>senttejä</b> (esimerkiksi 23.88), ei euroja.",
  'st.glcost': "<b>{x}</b><i>{cur}</i><small>vuodessa</small>",
  'st.gltip': "Pienin tuntikeskiarvo klo 0–5, {n} viimeisen yön mediaani",
  'st.gl100': "100 W vähemmän ≈ {x} {cur} vuodessa", 'st.glcost.avg': "<b>{x}</b><i>{cur}</i><small>vuodessa 7 päivän keskihinnalla</small>", 'st.gl100.avg': "100 W vähemmän ≈ {x} {cur} vuodessa 7 päivän keskihinnalla",
  'st.full': "× täynnä",
  'st.noprice': "Määritä hinnat (grid_price, feed_in), niin kustannukset ja säästöt näkyvät",
  'st.nodata': "ei vielä tietoja",
  'st.vsprev': "vrt. edellinen vuosi",
  'st.import': "Osto",
  'st.export': "Myynti",
  'pv.wkwp': "Per kWp", 'grid.fossil': "Fossiilinen", 'st.cc.rest': "Kohdistamaton", 'st.co2.grid': "Verkosta", 'st.co2.avoid': "Auringolla vältetty", 'st.co2.fossil': "Fossiilinen osuus verkkosähköstä", 'st.co2.since': "CO₂-arvot alkaen {d}",
  'st.week': "Viikko",
  'st.g2name': "Toinen mittari",
  'st.bud.title': "Ostosähkön vuosibudjetti",
  'st.bud.of': "{ist} / {goal} kWh ostosähköä",
  'st.bud.soll': "Tavoite tähän mennessä",
  'st.bud.abw': "Ero: toteuma − tavoite",
  'st.bud.fc': "Ennuste vuoden loppuun",
  'st.bud.fcabw': "Ero vuositavoitteeseen",
  'st.bud.lin': "Tavoite jaettu tasan koko vuodelle",
  'st.bud.hist': "Tavoite seuraa vuoden {y} kulutusprofiilia",
  'st.bud.goal': "Vuositavoite",
  'st.cc.title': "Kustannukset laitteittain",
  'st.cc.meas': "mitattu",
  'st.cc.est': "arvio talon sähkölähteiden jakaumasta",
  'st.cc.cost': "Ostosähkön kustannus",
  'st.cc.saved': "Säästö",
  'st.cc.nohist': "Saatavilla vain päivälle, viikolle, kuukaudelle ja kuluvalle vuodelle. Yhteensä-näkymässä arvoja ei ole.",
  'st.cc.grid': "Verkko",
  'st.cc.bat': "Akku",
  'st.cc.pv': "Aurinko",
  'st.cc.upto': "enintään {x} {cur}/h",
  'st.cc.unitW': "{id} mittaa tehoa ({u}). Tarvitaan kWh-mittari.",
  'st.cc.nostat': "Ei kWh-tilastoa anturille {id}. Tarvitaan mittari, jonka state_class on total_increasing.",
  'st.cc.missing': "{id} ei ole olemassa.",
  'st.n.pv': "Aurinko tänään",
  'st.n.imp': "Ostettu tänään",
  'st.n.exp': "Myyty tänään",
  'st.n.chg': "Akkua ladattu tänään",
  'st.n.dis': "Akkua purettu tänään",
  'st.d.none': "{n}: {id} ei anna nyt arvoa.",
  'st.d.nonefb': "{n}: {id} ei anna nyt arvoa. Kortti laskee sen kokonaismittarista.",
  'st.d.big': "{n}: {id} näyttää {v} kWh. Se on enemmän kuin kokonaismittari keskiyöstä. Onko kyseessä kokonaismittari eikä päivälukema?",
  'st.d.exp': "Tänään myyty enemmän ({e} kWh) kuin tuotettu ({p} kWh). Tarkista myynnin anturi.",
  'st.all': "Yhteensä",
  'st.hist': "Historia",
  'st.nodata2': "ei tietoja",
  'st.lt.from': "Tiedot alkaen: {d}",
  'st.lt.gaps': "Ei tietoja: {m}",
  'st.lt.skip': "Summista puuttuu {n} kk, joilta tiedot ovat vajaat",
  'st.lt.hist': "Historia: vain aurinkotuotto, ilman verkko- ja akkuarvoja",
  'st.lt.price': "Rahamäärät laskettu nykyhinnoilla",
  'st.lt.price.h': "Rahamäärät laskettu tilastojen tuntihinnoilla, kun ne ovat saatavilla",
  'ban.tonet0': "Sähköä menee verkkoon",
  'stat.home': "Kulutus tänään",
  'stat.cdaily': "{n} tänään",
  'stat.home.excl': "Kulutus tänään ilman {n}",
  'status.on': "PÄÄLLÄ",
  'status.off': "POIS",
  'status.unknown': "Tuntematon",
  'close': "Sulje",
  'room.title': "Huonekohtainen kulutus",
  'room.week': "Tämä viikko",
  'room.month': "Tämä kuukausi",
  'room.year': "Tämä vuosi",
  'room.prev': "Edellinen vuosi",
  'room.tab.week': "Viikko",
  'room.tab.month': "Kuukausi",
  'room.tab.year': "Vuosi",
  'room.tab.prev': "Ed. vuosi",
  'room.sum': "Yhteensä",
  'room.loading': "Ladataan tietoja …",
  'room.noprice': "Hintaa ei ole määritetty, joten näytetään vain kWh.",
  'room.csv': "Kopioi CSV:nä",
  'room.copied': "Kopioitu",
  'room.since': "Tiedot alkaen",
  'room.unconf': "Ei vielä määritetty. Muokkaa korttia (kynä): <b>Avustaja</b> auttaa valitsemaan mittarit.",
  'flow.title': "Energiavirta",
  'flow.pv': "Aurinko",
  'flow.pv2': "Aurinko 2",
  'flow.grid2': "Toinen mittari",
  'flow.grid': "Verkko",
  'flow.battery': "Akku",
  'flow.home': "Talon kulutus",
  'flow.cons_total': "Laitteet yhteensä",
  'flow.rest': "Muu kulutus",
  'flow.grest': "Muut",
  'flow.via.miss': "⚠ ”Aurinkosähkö kulkee akun kautta” tarvitsee myös akun lähtötehon taloon (<b>battery.power_out</b>), siihen asti käytetään tavallista näkymää.",
  'flow.restpct': "{n} % mitattu",
  'flow.soc': "Varaustaso",
  'flow.temp': "Lämpötila",
  'flow.next': "Seuraava →",
  'flow.error': "Määritä vähintään pv tai grid",
  'pill.aut': "Omavaraisuus nyt",
  'pill.self': "Omakäyttö nyt",
  'pv.use.home': "Talo",
  'pv.use.bat': "Akku",
  'pv.use.grid': "Verkko",
  'pv.use.store': "Varasto",
  'stat.pv': "Aurinko tänään",
  'stat.fc1': "Aurinko huomenna",
  'stat.fc2': "Aurinko ylihuomenna", 'stat.fc0': "Ennuste tänään", 'stat.fc1p': "Ennuste huomenna", 'stat.fc2p': "Ennuste ylihuomenna",
  'stat.imp': "Ostettu tänään",
  'stat.exp': "Myyty tänään",
  'stat.bat': "Akku ± tänään",
  'stat.aut': "Omavaraisuus tänään",
  'mix.pv': "Aurinko",
  'mix.bat': "Akku",
  'mix.grid': "Verkko",
  'tag.offline': "Ei yhteyttä",
  'tag.producing': "Tuotanto",
  'tag.idle': "Lepotila",
  'tag.balanced': "Tasapainossa",
  'tag.import': "Osto",
  'tag.export': "Myynti",
  'tag.standby': "Lepotila",
  'tag.charging': "Lataus",
  'tag.discharging': "Purku",
  'tag.passthrough': "Läpivirtaus",
  'bat.io': "Sisään <b>{in}</b> · ulos <b>{out}</b>",
  'bat.split': " (talo <b>{home}</b> · verkko <b>{grid}</b>)",
  'bat.shared': "Yhteinen anturi: <b>{name}</b>",
  'forecast': "Ennuste",
  'forecast.day': "Ennuste tänään",
  'offline': "ei yhteyttä",
  'ka.on': "● Hereillä",
  'ka.wait': "☝ Napauta kerran – näyttö pysyy päällä",
  'waste.today': "Tänään",
  'waste.tomorrow': "Huomenna",
  'bat.usable_pct': "käytettävissä",
  'dur.2days': "> 2 päivää",
  'ban.surplus': "{w} ylijäämää",
  'ban.batfull': "Akku täynnä – ",
  'ban.tonet': "Sähköä menee verkkoon · omakäyttö säästäisi <b>{gain} {cur}/h</b>",
  'ban.running': "{name} käynnissä",
  'ban.fromgrid': "{w} verkosta",
  'ban.cost': "maksaa nyt <b>{cost} {cur}/h</b>",
  'ban.batempty': "Akku tyhjä",
  'ban.batlimit': "Akku maksimiteholla",
  'bat.usable_slow': "<div class=\"sr\"><span>Käytettävissä</span> <b>{kwh} kWh</b></div><div class=\"sr\"><span>Lataus</span> <b>hidas</b></div>",
  'bat.full_at': "<div class=\"sr\"><span>Täynnä klo</span> <b>{time}</b></div><div class=\"sr\"><span>Aikaa täyteen</span> <b>{dur}</b></div>",
  'bat.last_24': "<div class=\"sr\"><span>Riittää</span> <b>yli 24 h</b></div><div class=\"sr\"><span>Käytettävissä</span> <b>{kwh} kWh</b></div>",
  'bat.last_until': "<div class=\"sr\"><span>Tyhjä klo</span> <b>{time}</b></div><div class=\"sr\"><span>Aikaa tyhjään</span> <b>{dur}</b></div>",
  'bat.full': "<div class=\"sr\"><span>Käytettävissä</span> <b>{kwh} kWh</b></div>",
  'bat.usable': "<div class=\"sr\"><span>Käytettävissä</span> <b>{kwh} kWh</b></div><div class=\"sr\"><span>Reservi</span> <b>{res} %</b></div>",
  'bat.usable0': "<div class=\"sr\"><span>Käytettävissä</span> <b>{kwh} kWh</b></div>",
  'st.bat': "Akku",
  'st.sum': "Yhteensä",
  'st.solar': "Aurinko",
  'st.recon': "{d}",
  'st.r.pv': "Tuotanto",
  'st.r.self': "Omaan käyttöön",
  'st.r.fed': "Myyty",
  'st.r.drawn': "Ostettu",
  'st.r.selfq': "Omakäyttö",
  'st.r.cons': "Kulutus",
  'st.note': "Ostosähkö {p} c/kWh · myynti {f} c/kWh · {g} · takaisinmaksu arvioitu nykyhinnoilla",
  'st.note.nofee': "vain energiakulut ilman perusmaksuja",
  'st.note.fee': "Ostosähkön kustannus perusmaksuineen",
  'st.g2of': "josta {n}",
  'st.basefee': "josta perusmaksu",
  'st.bud.since': "Mittausdata vasta {d} alkaen: tavoite ja ennuste koskevat tätä jaksoa ja ovat alustavia",
  'st.cc.group': "Ryhmä",
  'why.q.bal': "Miksi verkosta ei osteta?",
  'why.q.baldis': "Miksi akku purkautuu?",
  'why.q.balchg': "Miksi akku latautuu?",
  'why.bal.both': "Aurinko tuottaa {pv} ja akku {bat}. Yhdessä ne kattavat talon kulutuksen ({home}).",
  'why.bal.sun': "Aurinko tuottaa {pv} ja kattaa talon kulutuksen ({home}) yksin.",
  'why.bal.bat': "Akku ({soc} %) antaa {bat} ja kattaa talon kulutuksen ({home}) yksin.",
  'why.bal.low': "Talo kuluttaa juuri nyt hyvin vähän sähköä ({home}).",
  'why.bal.dis': "Aurinko ei yksin riitä kulutukseen {home}. Akku antaa loput ({bat}), varaustaso {soc} %.",
  'why.bal.chg': "Aurinko tuottaa enemmän kuin talo kuluttaa. Ylijäämä ({w}) lataa akkua.",
  'why.imp': "Miksi {w} ostoa verkosta?",
  'why.exp': "Miksi {w} myyntiä verkkoon?",
  'why.bal': "Verkko tasapainossa",
  'why.asof': "Tilanne klo {t}",
  'why.cover': "Talo kuluttaa {home}. Sähkö tulee: {parts}",
  'why.solar': "Aurinko",
  'why.batt': "Akku",
  'why.grid': "Verkko",
  'why.bm': "Akun lataus",
  'why.row.pv': "Aurinko tuottaa",
  'why.row.home': "Talo kuluttaa",
  'why.row.chg': "Akun lataus",
  'why.row.exp': "Myynti",
  'why.q.bat': "Miksi ei akusta?",
  'why.q.sun': "Miksi ei aurinkosähköä?",
  'why.q.feed': "Miksi ei akkuun?",
  'why.q.tip': "Vinkki",
  'why.q.hint': "Huomio",
  'why.bat.empty': "Akku on tyhjä ({soc} %, purkuraja {res} %).",
  'why.bat.idle': "Akussa on {soc} %, mutta se ei anna nyt sähköä. Tarkista akun toimintatila tai estoaika.",
  'why.bat.dis': "Akku antaa jo {w}.",
  'why.sun.night': "On yö. Aurinko nousee klo {t}.",
  'why.sun.fc': " Ennuste huomiselle {kwh} kWh.",
  'why.sun.low': "Aurinko tuottaa nyt vain {w}.",
  'why.sun.zero': "Aurinko ei tuota nyt mitään.",
  'why.sun.wx': " Sää: {cnd}.",
  'why.sun.part': "Aurinko tuottaa {pv}, mikä ei riitä kulutukseen {home}.",
  'why.rest': "Suurta osaa kulutuksesta ({w}) ei ole kohdistettu millekään laitteelle. Lisää laitteita korttiin.",
  'why.full': "Akku on täynnä ({soc} %) eikä enää lataudu.",
  'why.notfull': "Akku ei lataudu nyt, vaikka tilaa on vielä ({soc} %). Tarkista akun toimintatila.",
  'why.charging': "Akku latautuu jo teholla {w}.",
  'why.tip.sug': "{w} ylijäämää: nyt sopii käynnistää {names}.",
  'why.bal.txt': "Aurinko ja akku kattavat talon kulutuksen ({home}) ilman verkkoa.",
  'why.none': "Selitykseen ei ole nyt tietoja.",
  'why.top': "josta {n} {w}",
  'bat.in2': " (aurinko 2 <b>{pv}</b> · talo <b>{ac}</b>)",
  'xt.alarm': "Hälytys",
  'sky.sunny': "Aurinkoista",
  'sky.clear-night': "Selkeä yö",
  'sky.partlycloudy': "Puolipilvistä",
  'sky.cloudy': "Pilvistä",
  'sky.fog': "Sumua",
  'sky.rainy': "Sadetta",
  'sky.pouring': "Rankkasadetta",
  'sky.snowy': "Lumisadetta",
  'sky.snowy-rainy': "Räntäsadetta",
  'sky.lightning': "Ukkosta",
  'sky.lightning-rainy': "Ukkosta ja sadetta",
  'sky.hail': "Raekuuroja",
  'sky.windy': "Tuulista",
  'sky.windy-variant': "Tuulista ja pilvistä",
  'sky.exceptional': "Poikkeuksellinen sää",
  'sky.cloud': "Pilvisyys",
  'sky.wind': "Tuuli",
  'sky.nofc': "Sääentiteetti ei anna ennustetta",
  'flow.gas': "Kaasu",
  'flow.oil': "Öljy",
  'flow.water': "Vesi",
  'gas.heat': "Lämmitys",
  'gas.hw': "Lämmin vesi",
  'gas.today': "Tänään",
  'tag.gas.on': "Lämmitys",
  'tag.water.on': "Virtaus",
  'tag.today': "Tänään",
  'room.grid': "Verkko",
  'room.battery': "Akku",
  'room.pv': "Aurinko",
  'room.csv.period': "Jakso",
  'room.csv.total': "Yhteensä kWh",
  'room.csv.grid': "Verkko kWh",
  'room.csv.battery': "Akku kWh",
  'room.csv.pv': "Aurinko kWh",
  'room.csv.cost': "Kustannus",
  'room.csv.import_cost': "ostohinnalla",
  'room.credit': "Hyvitys {amount} {cur}",
  'room.payment': "Lisämaksu {amount} {cur}",
  'room.year_summary': "Vuosi {year}: kulutus {cost} {cur}, ennakkomaksut {count} × {advance} {cur} = {total} {cur}, tilanne nyt {balance}",
  'room.invoice': "Laskutus",
  'room.advance': "Ennakkomaksu",
  'room.no_advance': "ilman ennakkomaksua",
  'room.month_forecast': "Ennuste kuun loppuun",
  'room.from_day2': "2. mittauspäivästä alkaen",
  'room.previous_month': "Edellinen kuukausi",
  'room.no_data': "ei tietoja",
  'room.night_w': "W yöllä",
  'room.night_total': "Yhteensä, klo 0–5",
  'room.threshold': "Raja {w} W",
  'room.above': "yli rajan",
  'room.ok': "kunnossa",
  'room.night_note': "Jos tämä jatkuu yötä päivää, valmiustila vie noin <b>{energy} kWh{cost} kuukaudessa</b> (14 viime yön keskiarvo).",
  'room.night_no_data': "Yötunteja on vielä liian vähän (tarvitaan vähintään yksi yö).",
  'room.night_base': "Peruskuorma yöllä (valmiustila)",
  'room.activity': "Käyttöajat",
  'room.active_above': "aktiivinen = yli {w} W",
  'room.active_today': "Aktiiviset tunnit tänään",
  'room.active_day': "Aktiivisin päivä",
  'room.activity_note': "Keskiteho viikonpäivittäin ja tunneittain (viimeiset 8 viikkoa). Vaaleasta voimakkaan oranssiin: vähän – paljon. Oikea sarake kertoo aktiiviset tunnit päivässä.",
  'room.archive': "Kuukausiarkisto (mittarilukemat ja summat, tallennettu kuun 1. päivänä)",
  'room.month_label': "Kuukausi",
  'room.grid_label': "Verkko",
  'room.battery_label': "Akku",
  'room.balance': "Saldo",
  'room.meter': "Mittari",
  'room.import': "Osto",
  'room.feed': "Myynti",
  'room.archive.note': "Saldo = ennakkomaksu miinus kustannukset (positiivinen: hyvitys). Arvot on lukittu, eivätkä ne muutu, vaikka hinnat myöhemmin muuttuisivat.",
  'room.archive.empty': "Ei vielä merkintöjä. Ensimmäinen kuukausi tallennetaan seuraavan kuun 1. päivänä klo 7.00.",
  'room.day': "Päivä",
  'room.chart': "Kehitys ja kustannukset",
  'room.area': "Alue",
  'room.by_area': "Alueittain",
  'room.included': "sis. perusmaksun {amount} {cur}",
  'room.fee': " · perusmaksu <b>{amount} {cur}</b>/kk",
  'room.price.all': "Kaikki ostohinnalla <b>{price} c/kWh</b>{fee}",
  'room.explain.fixed': "Arvotus: jokainen kWh maksaa ostohinnan, tuli se mistä tahansa.",
  'room.explain.no_sources': "Ilman talon energialähteitä (home_energy) koko kulutus arvotetaan ostohinnalla.",
  'room.price.mix': "Verkko <b>{grid} c</b> · akku <b>{battery} c</b> · aurinko <b>{pv} c/kWh</b>{fee}",
  'room.explain.mix': "Arvotus: jokaisella lähteellä on kiinteä hinta (verkko ostohinnalla, akku ja aurinko asetetuilla hinnoilla).",
  'room.price.opportunity': "Verkko, akku ja aurinkosähkö, jonka talo olisi itse käyttänyt: <b>{grid} c/kWh</b> · ylijäämäaurinkosähkö (muuten myyty): <b>{feed} c/kWh</b>{fee}",
  'room.explain.opportunity': "Arvotus menetetyn hyödyn mukaan: verkosta ja akusta otettu sähkö sekä aurinkosähkö, jonka talosi olisi voinut käyttää itse, maksaa ostohinnan. Vain niiden tuntien aurinkosähkö, joina sähköä myytiin verkkoon, arvotetaan myyntihinnalla.",
  'room.full': "<br>Vertailun vuoksi <b>kaikki ostohinnalla</b> ({price} c/kWh): <b>{cost} {cur}</b>.",
  'room.subtitle': "Sähkönkulutus ja kustannukset",
  'room.others': "muut laitteet",
  'room.vs_previous_month': "edellisestä kuukaudesta",
  'room.today': "tänään",
  'room.hourly_curve': "tuntikäyrä",
  'room.now_today': "Nyt ja tänään",
  'room.low': "rauhallinen",
  'room.elevated': "koholla",
  'room.high': "korkea",
  'room.no_use_today': "ei vielä kulutusta tänään",
  'room.source_today': "Lähteet tänään",
  'room.mix_tip': "Verkkosähköä kuluu keskimäärin vähiten <b>klo {from}–{to}</b> (keskimäärin {share} % verkosta). Suuret kuormat kannattaa ajoittaa silloin.",
  'room.mix_tip_missing': "Suositukseen tarvitaan vielä useamman päivän tiedot.",
  'room.and_cost': " ja {amount} {cur}",
});
WD.addTranslations('fi', {
  "why.aria.pv": "Miksi aurinko tuottaa juuri nyt näin paljon?",
  "why.aria.bat": "Mitä akku tekee juuri nyt?",
  "why.pv.t": "Aurinko tuottaa juuri nyt {w}",
  "why.pv.t0": "Aurinko ei tuota juuri nyt mitään",
  "why.pv.q.low": "Miksi niin vähän?",
  "why.pv.q.day": "Paljonko tänään on tullut?",
  "why.pv.q.full": "Miksi aurinkosähköä menee verkkoon?",
  "why.pv.q.part": "Riittääkö aurinko taloon?",
  "why.pv.elev": "Aurinko on vain {deg}° horisontin yläpuolella, joten paneelit saavat vähän valoa.",
  "why.pv.cloud": " Taivas on {pct} % pilvessä.",
  "why.pv.day": "Tähän mennessä tänään {kwh} kWh.",
  "why.pv.dayfc": "Tähän mennessä tänään {kwh} kWh, ennuste koko päivälle {fc} kWh.",
  "why.pv.full": "Talo tarvitsee vähemmän kuin aurinko tuottaa, eikä akku ota enempää. Loput menee verkkoon.",
  "why.pv.nobat": "Talo tarvitsee vähemmän kuin aurinko tuottaa. Loput menee verkkoon.",
  "why.bt.chg": "{n} latautuu teholla {w}",
  "why.bt.dis": "{n} antaa {w}",
  "why.bt.idle": "{n} on tällä hetkellä lepotilassa",
  "why.bt.lim": "Varaustaso {soc} %, purkuraja {res} %, enimmäislataus {max} %",
  "why.bt.q.src": "Mistä lataus tulee?",
  "why.bt.q.idle": "Miksi akku ei tee mitään?",
  "why.bt.src.sun": "Lataus tulee aurinkosähkön ylijäämästä.",
  "why.bt.src.grid": "Aurinko ei riitä talolle ja akulle, joten akku latautuu myös verkosta. Se on tarkoituksellista, jos olet asettanut varastoon verkkolatauksen tai edullisen tariffin.",
  "why.bt.nothing": "Tällä hetkellä ei ole aurinkosähkön ylijäämää eikä tarvetta, jonka akun pitäisi kattaa.",
  "why.bt.row.pv": "aurinkosähköstä",
  "why.bt.row.grid": "verkosta",
});
WD.addTranslations('fi', {
  "bat.selfuse": "Oma kulutus",
});
WD.addTranslations('fi', {
  "bat.gridchg": "Lataus verkosta",
});
WD.addTranslations('fi', {
  "st.eta.d": "maksettu takaisin noin vuonna <b>{yr}</b>",
  "bat.io.pv": "Aurinko sisään <b>{in}</b> · ulos <b>{out}</b>",
  "st.cc.title": "Kustannus kuluttajaa kohti",
});

