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

  const rgb = (c) => {
    if (!c) return PAL.bat;
    if (PAL[c]) return PAL[c];
    if (c[0] === '#') {
      let x = c.slice(1);
      if (x.length === 3) x = x.split('').map((y) => y + y).join('');
      const n = parseInt(x, 16);
      return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    }
    return c;
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
    return u === 'kW' ? v * 1000 : u === 'MW' ? v * 1e6 : v;
  };
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
  const splitW = (w) => {
    if (w === null || w === undefined || isNaN(w)) return ['—', ''];
    const a = Math.abs(w);
    if (a >= 999.5) return [nf(a / 1000, a >= 10000 ? 1 : 2), 'kW'];
    return [nf(Math.round(a), 0), 'W'];
  };
  const fW = (w) => splitW(w).join(' ');
  const fKwh = (v) => (v === null ? '—' : nf(v, v >= 100 ? 0 : 1));
  const fPct = (v) => (v === null || !isFinite(v) ? '—' : Math.round(Math.max(0, Math.min(1, v)) * 100) + ' %');
  // Währungssymbol aus Home Assistant (€, $, £ …)
  const cur = () => {
    try {
      const p = new Intl.NumberFormat(state.loc, { style: 'currency', currency: state.currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0);
      const x = p.find((q) => q.type === 'currency');
      return x ? x.value : state.currency;
    } catch (e) { return state.currency; }
  };
  const esc = (s) => String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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

  return { state, setLocale, PAL, TH, rgb, num, watt, val, price, THEMES, THEME_OPTIONS, themeCss, applyTheme, clock, nf, splitW, fW, fKwh, fPct, cur, esc, haNavigate, KA };
})();
