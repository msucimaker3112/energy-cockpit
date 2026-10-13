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

  return { state, setLocale, PAL, TH, rgb, num, watt, val, price, clock, nf, splitW, fW, fKwh, fPct, cur, esc, haNavigate, KA };
})();
