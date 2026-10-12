/*! energy-cockpit v0.5.0 - MIT License */
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

  return { state, setLocale, PAL, TH, rgb, num, watt, val, clock, nf, splitW, fW, fKwh, fPct, cur, esc, haNavigate, KA };
})();


/* ---- i18n.js ---- */
/* Texte (nur Deutsch). */
(() => {
  const L = {
    de: {
      'flow.title': 'Energiefluss', 'flow.pv': 'PV-Anlage', 'flow.grid': 'Netz', 'flow.battery': 'Batterie', 'flow.home': 'Hausverbrauch',
      'flow.rest': 'Nicht erfasst', 'flow.restpct': '{n} % gemessen', 'flow.soc': 'Ladestand',
      'flow.next': 'Weiter →', 'flow.error': 'Mindestens pv oder grid konfigurieren',
      'pill.aut': 'Autarkie', 'pill.self': 'Eigenverbrauch',
      'stat.pv': 'PV heute', 'stat.imp': 'Bezug heute', 'stat.exp': 'Einspeisung', 'stat.bat': 'Batterie ± heute', 'stat.aut': 'Autarkie heute',
      'mix.pv': 'Solar', 'mix.bat': 'Akku', 'mix.grid': 'Netz',
      'tag.offline': 'Offline', 'tag.producing': 'Erzeugt', 'tag.idle': 'Inaktiv', 'tag.balanced': 'Ausgeglichen',
      'tag.import': 'Bezug', 'tag.export': 'Einspeisung', 'tag.standby': 'Standby', 'tag.charging': 'Lädt', 'tag.discharging': 'Entlädt',
      'forecast': 'Prognose', 'offline': 'offline',
      'ka.on': '● Wach', 'ka.wait': '☝ Einmal tippen – Bildschirm bleibt an',
      'waste.today': 'Heute', 'waste.tomorrow': 'Morgen',
      'bat.usable_slow': '<b>{kwh} kWh</b> nutzbar · lädt langsam', 'bat.full_at': 'Voll um <b>{time}</b> · in {dur}',
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

  const fmtState = (e) => (e ? `${e.state}${e.unit ? ' ' + e.unit : ''}` : '');

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
      const rest = all.filter((e) => sug.indexOf(e) < 0);
      const opt = (v, t) => { const o = document.createElement('option'); o.value = v; o.textContent = t; return o; };
      sel.appendChild(opt('', '— nicht verwenden —'));
      if (cur && !all.find((e) => e.id === cur)) sel.appendChild(opt(cur, cur + ' (nicht gefunden)'));
      if (sug.length) {
        const g = document.createElement('optgroup'); g.label = 'Vorschläge';
        sug.slice(0, 12).forEach((e) => g.appendChild(opt(e.id, `${e.name} (${fmtState(e)})`)));
        sel.appendChild(g);
      }
      const g2 = document.createElement('optgroup'); g2.label = 'Alle passenden Sensoren';
      rest.forEach((e) => g2.appendChild(opt(e.id, `${e.name} (${fmtState(e)})`)));
      sel.appendChild(g2);
      sel.value = cur;
      const live = el('div', css.help, '');
      const upd = () => { const e = all.find((x) => x.id === sel.value); live.textContent = e ? `Aktueller Wert: ${fmtState(e)}  ·  ${e.id}` : ''; };
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
      const items = Array.isArray(cfg[f.path]) ? cfg[f.path] : [];
      const used = items.map((x) => x[KEY]);
      const sugs = all.filter((e) => used.indexOf(e.id) < 0 && getPath(cfg, 'pv.entity') !== e.id && getPath(cfg, 'grid.entity') !== e.id && getPath(cfg, 'battery.power') !== e.id && getPath(cfg, 'home.entity') !== e.id);
      const write = (arr) => { cfg[f.path] = arr.filter((x) => x[KEY]); emit(); };
      items.forEach((it, i) => {
        const row = el('div', css.box);
        const sel = el('select', css.input);
        const o0 = document.createElement('option'); o0.value = it[KEY] || ''; o0.textContent = (all.find((e) => e.id === it[KEY]) || { name: it[KEY] || '—' }).name;
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
        row.appendChild(sel); row.appendChild(nm); row.appendChild(rm);
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
      setHass(h) { hass = h; },
      setConfig(c) { cfg = JSON.parse(JSON.stringify(c || {})); render(); },
    };
  };

  WD.wizardList = list;
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


/* ---- flow-card.js ---- */
/* energy-cockpit-flow-card: animierter Energiefluss. Hilfsfunktionen kommen aus common.js und i18n.js. */
(() => {
WD.addStrings({ 'ban.tonet0': 'Strom fließt ins Netz' });
const { PAL, TH, rgb, num, watt, val, clock, nf, splitW, fW, fKwh, fPct, fDur, cur, esc, haNavigate, KA, T, setLocale } = WD;
const CSS = `
:host{display:block;--pv:${PAL.pv};--imp:${PAL.imp};--exp:${PAL.exp};--bat:${PAL.bat};--home:${PAL.home};--mut:${PAL.mut};--txt:#e8eefc;--stroke:rgba(255,255,255,.08);--glass:rgba(255,255,255,.035)}
ha-card{background:radial-gradient(120% 80% at 50% 0%,#121b30 0%,#070b14 65%);border-radius:28px;overflow:hidden;border:1px solid rgba(255,255,255,.06);color:var(--txt);font-family:Inter,var(--ha-font-family-body,system-ui),sans-serif;-webkit-font-smoothing:antialiased}
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
.navbtn{cursor:pointer;color:var(--txt);font-weight:650;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);padding:8px 14px;border-radius:999px;font-size:.8rem;margin-left:8px;-webkit-tap-highlight-color:transparent;transition:background .3s}
.navbtn:active{background:rgba(255,255,255,.18)}
.banner{position:relative;display:flex;align-items:center;overflow:hidden;border-radius:20px;max-height:0;opacity:0;margin:0;padding:0 18px;border:1px solid transparent;transition:max-height .6s cubic-bezier(.2,.8,.2,1),opacity .5s,margin .6s,padding .6s}
.banner.show{max-height:140px;opacity:1;margin:0 0 20px;padding:14px 18px}
.banner.sur{background:linear-gradient(100deg,rgba(var(--pv),.22),rgba(var(--pv),.06) 60%,rgba(var(--exp),.10));border-color:rgba(var(--pv),.6);box-shadow:0 0 0 1px rgba(var(--pv),.35)}
.banner.imp{background:linear-gradient(100deg,rgba(var(--imp),.2),rgba(var(--imp),.05) 70%);border-color:rgba(var(--imp),.6);box-shadow:0 0 0 1px rgba(var(--imp),.35)}
.banner:after{content:'';position:absolute;top:0;bottom:0;left:-40%;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);animation:sweep 4.5s ease-in-out infinite;pointer-events:none}
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
.chip{display:flex;align-items:center;font-size:.76rem;font-weight:650;padding:7px 12px;border-radius:999px;margin:3px 0 3px 8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);white-space:nowrap}
.chip ha-icon{--mdc-icon-size:16px;margin-right:6px;display:flex}
.chip.run{background:rgba(var(--exp),.15);border-color:rgba(var(--exp),.45);color:rgb(var(--exp))}
.wide .b-title{font-size:1.35rem}.wide .b-sub{font-size:.88rem}.wide .chip{font-size:.85rem}
.narrow .banner.show{flex-wrap:wrap}.narrow .b-chips{margin:8px 0 0;justify-content:flex-start}
.stage{position:relative}
svg.links{position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:0}
.track{fill:none;stroke:rgba(255,255,255,.07);stroke-width:2}
.glow{fill:none;stroke:rgb(var(--c));stroke-width:9;stroke-linecap:round;opacity:0;transition:opacity .6s}
.flow{fill:none;stroke:rgb(var(--c));stroke-width:4.5;stroke-linecap:round;stroke-dasharray:0 18;opacity:0;transition:opacity .6s;animation:dash var(--d,1s) linear infinite}
.link.on .flow{opacity:1}.link.on .glow{opacity:0}.link.on .track{stroke:rgba(var(--c),.28)}
.link.rev .flow{animation-direction:reverse}
@keyframes dash{from{stroke-dashoffset:0}to{stroke-dashoffset:-18}}
.layout{position:relative;z-index:1;display:grid;grid-template-columns:1fr minmax(170px,1.15fr) 1fr;grid-template-areas:"pv hub bat" "grid hub bat";grid-gap:24px 34px;gap:24px 34px;align-items:center}
.node{position:relative;padding:15px 16px;border-radius:22px;background:linear-gradient(160deg,rgba(255,255,255,.065),rgba(255,255,255,.015)),#0c1322;border:1px solid var(--stroke);cursor:pointer;transition:border-color .5s,box-shadow .5s,transform .25s,opacity .5s;min-width:0}
.node:active,.cons:active,.hub:active{transform:scale(.98)}
.node.on{border-color:rgba(var(--c),.6);box-shadow:inset 0 0 0 1px rgba(var(--c),.16),0 0 0 1px rgba(var(--c),.35);animation:breathe 4s ease-in-out infinite}
@keyframes breathe{50%{box-shadow:inset 0 0 0 1px rgba(var(--c),.26),0 0 0 1px rgba(var(--c),.35)}}
.node:not(.on){border-color:rgba(255,255,255,.05)}
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
.soc{margin-top:13px;position:relative;height:9px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden}
.soc-fill{position:absolute;top:0;left:0;bottom:0;width:0;border-radius:inherit;background:linear-gradient(90deg,rgba(var(--sc,var(--c)),.45),rgb(var(--sc,var(--c))));box-shadow:0 0 0 1px rgba(var(--sc,var(--c)),.35);transition:width 1.2s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.bat.charging .soc-fill:after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:shine 1.8s linear infinite}
@keyframes shine{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.soc-row{display:flex;justify-content:space-between;margin-top:7px;font-size:.72rem;color:rgb(var(--mut))}
.soc-row b{color:var(--txt);font-variant-numeric:tabular-nums}
.hub-wrap{grid-area:hub;display:flex;flex-direction:column;align-items:center}
.hub{position:relative;width:100%;max-width:250px;cursor:pointer;transition:transform .25s}
.hub:before{content:'';display:block;padding-top:100%}
.hub svg{position:absolute;top:0;left:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible}
.ring-bg{fill:none;stroke:rgba(255,255,255,.06);stroke-width:6}
.orbit{fill:none;stroke:rgba(255,255,255,.16);stroke-width:.8;stroke-dasharray:.6 3.4;transform-origin:60px 60px;animation:spin 40s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.seg{fill:none;stroke:currentColor;stroke-width:6;stroke-linecap:round;stroke-dasharray:0 100;opacity:0;transition:opacity .6s,stroke-dasharray 1.2s cubic-bezier(.2,.8,.2,1),stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)}
.core{position:absolute;top:14%;left:14%;right:14%;bottom:14%;border-radius:50%;background:radial-gradient(circle at 50% 28%,#172440,#0a1120 72%);border:1px solid rgba(255,255,255,.08);box-shadow:0 0 0 1px rgba(var(--home),.35),inset 0 1px 0 rgba(255,255,255,.07);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;animation:pulse 3.2s ease-in-out infinite}
@keyframes pulse{50%{box-shadow:0 0 0 1px rgba(var(--home),.35),inset 0 1px 0 rgba(255,255,255,.07)}}
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
.stat{display:flex;flex-direction:column;padding:11px 13px;border-radius:15px;background:rgba(255,255,255,.028);border:1px solid rgba(255,255,255,.04)}
.stat span{font-size:.62rem;color:rgb(var(--mut));text-transform:uppercase;letter-spacing:.09em;font-weight:650;display:flex;align-items:center;margin-bottom:5px}
.stat span i{width:6px;height:6px;border-radius:50%;background:rgb(var(--c));margin-right:6px}
.stat b{font-size:1.1rem;font-variant-numeric:tabular-nums;font-weight:700}
.stat small{color:rgb(var(--mut));font-weight:500;font-size:.72rem;margin-left:3px}
.groups{position:relative;z-index:1;display:grid;grid-gap:10px;gap:10px;margin-top:54px}
.grp{position:relative;padding:10px 10px 8px;border-radius:17px;background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.012)),#0c1322;border:1px solid var(--stroke);transition:border-color .5s,box-shadow .5s,opacity .5s;min-width:0}
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
.its{margin-top:6px;border-top:1px solid rgba(255,255,255,.06);padding-top:4px}
.it{display:flex;align-items:center;font-size:.64rem;color:rgb(var(--mut));line-height:1.8;min-width:0;cursor:pointer}
.it i{flex:none;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.2);margin-right:5px;transition:background .4s,box-shadow .4s}
.it.on i{background:rgb(var(--c));box-shadow:0 0 0 1px rgba(var(--c),.35)}
.it.on{color:var(--txt)}
.it .in{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.it b{flex:none;margin-left:4px;color:var(--txt);font-weight:600;font-variant-numeric:tabular-nums}
.it.off{display:none}
.grp.rest .it{cursor:default}
.grp.rest .ico{background:rgba(255,255,255,.06)}
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
    return {
      pv: { entity: find(/^sensor\..*(pv|solar).*(power|leistung)/i) },
      grid: { entity: find(/^sensor\..*(grid|netz).*(power|leistung)/i) },
      battery: { power: find(/^sensor\..*batter.*(power|leistung)/i), soc: find(/^sensor\..*batter.*(soc|ladung|level)/i) },
    };
  }
  static getConfigElement() { return document.createElement('energy-cockpit-flow-card-editor'); }
  setConfig(config) {
    if (!config || ((!config.pv || !config.pv.entity) && (!config.grid || !config.grid.entity))) {
      // Noch nicht eingerichtet: Hinweisfläche statt Fehlermeldung, der Assistent im Editor hilft weiter
      this._c = null;
      this.shadowRoot.innerHTML = '<style>ha-card{padding:22px;border-radius:24px;background:#0c1322;color:#e8eefc;font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit Energiefluss</b><div style="margin-top:8px;opacity:.8">Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Sensoren auszuwählen.</div></ha-card>';
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
    const price = val(h, c.grid_price, null), feed = val(h, c.feed_in, 0);
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


/* ---- flow-editor.js ---- */
/* Editor der Energiefluss-Karte: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const ent = (name, domains) => ({ name, selector: { entity: domains ? { domain: domains } : {} } });
  const txt = (name) => ({ name, selector: { text: {} } });
  const bool = (name, def) => ({ name, default: def, selector: { boolean: {} } });
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step || 1, mode: 'box' } } });
  const sec = (name, title, schema) => ({ type: 'expandable', name, title, schema });

  const LABELS = {
    title: 'Titel', name: 'Anzeigename', icon: 'Symbol',
    entity: 'Sensor (Leistung)', daily: 'Tagesertrag (kWh)', forecast: 'Prognose (Leistung)',
    invert: 'Vorzeichen umkehren', daily_import: 'Bezug heute (kWh)', daily_export: 'Einspeisung heute (kWh)',
    power: 'Sensor Lade-/Entladeleistung', soc: 'Sensor Ladestand (%)', capacity_kwh: 'Kapazität (kWh)',
    reserve_soc: 'Reserve-Ladestand (%)', max_soc: 'Maximaler Ladestand (%)',
    daily_charge: 'Geladen heute (kWh)', daily_discharge: 'Entladen heute (kWh)',
    grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)',
    show_clock: 'Uhr anzeigen', fit_screen: 'Auf Bildschirmhöhe skalieren',
    nav_path: 'Weiter-Schaltfläche: Pfad (z. B. /lovelace/geraete)', nav_label: 'Weiter-Schaltfläche: Text',
    secondary: 'Zusatzwert (Sensor, z. B. Temperatur)', color: 'Farbe (z. B. #a78bfa)', image: 'Logo (Bild-URL, ersetzt das Symbol)',
  };

  // Listen als Platzhalter-Abschnitte "0", "1", ...: Home Assistant speichert sie als Objekt, die Karte macht daraus wieder eine Liste
  const slots = (n, titleOf, schemaOf) => Array.from({ length: n }, (_, i) => sec(String(i), titleOf(i + 1), schemaOf(i)));
  const consumerFields = () => [ent('entity', ['sensor']), txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'), ent('secondary', ['sensor'])];
  const itemFields = () => [ent('entity', ['sensor']), txt('name'), ent('secondary', ['sensor'])];
  const groupFields = () => [
    txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'),
    sec('items', 'Verbraucher der Gruppe', slots(10, (n) => `Verbraucher ${n}`, itemFields)),
  ];

  WD.flowForm = () => ({
    schema: [
      txt('title'),
      sec('pv', 'Solar', [ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor']), ent('forecast', ['sensor'])]),
      sec('grid', 'Netz', [ent('entity', ['sensor']), txt('name'), bool('invert', false), ent('daily_import', ['sensor']), ent('daily_export', ['sensor'])]),
      sec('battery', 'Batterie', [
        ent('power', ['sensor']), ent('soc', ['sensor']), txt('name'), bool('invert', false),
        numb('capacity_kwh', 0, 200, 0.1), numb('reserve_soc', 0, 100, 1), numb('max_soc', 0, 100, 1),
        ent('daily_charge', ['sensor']), ent('daily_discharge', ['sensor']),
      ]),
      sec('home', 'Haus (optional)', [ent('entity', ['sensor']), txt('name')]),
      sec('consumers', 'Einzelverbraucher (bis zu 12)', slots(12, (n) => `Verbraucher ${n}`, consumerFields)),
      sec('consumer_groups', 'Gruppen (bis zu 10)', slots(10, (n) => `Gruppe ${n}`, groupFields)),
      ent('grid_price', ['sensor', 'input_number']),
      ent('feed_in', ['sensor', 'input_number']),
      bool('show_clock', true),
      bool('fit_screen', true),
      txt('nav_path'),
      txt('nav_label'),
    ],
    computeLabel: (s) => LABELS[s.name] || s.title || s.name,
    computeHelper: (s) => (s.name === 'title' ? 'Abfallkalender, Überschussvorschläge und Netzalarm stellst du im YAML-Editor ein.' : undefined),
  });

  // Assistent: Schritte mit Sensor-Vorschlägen
  const H = (...re) => re;
  const steps = () => [
    { short: 'Solar', title: 'Solaranlage', text: 'Wähle den Sensor, der die aktuelle Erzeugung der PV-Anlage in Watt anzeigt.', fields: [
      { path: 'pv.entity', label: 'PV-Leistung', kind: 'power', hints: H(/pv|solar|photovolt|inverter|wechselrichter|erzeugung/i, /input|eingang|power|leistung/i) },
      { path: 'pv.daily', label: 'Tagesertrag (kWh)', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute|yield|ertrag/i, /pv|solar|inverter/i) },
      { path: 'pv.forecast', label: 'Prognose der Leistung (z. B. Solcast)', kind: 'power', optional: true, hints: H(/forecast|prognose|solcast/i) },
    ] },
    { short: 'Netz', title: 'Stromnetz', text: 'Der Netzsensor zeigt Bezug und Einspeisung. Wenn später Bezug als Einspeisung angezeigt wird, setze "Vorzeichen umkehren".', fields: [
      { path: 'grid.entity', label: 'Netzleistung', kind: 'power', hints: H(/grid|netz|meter|zähler|zaehler|wirkleistung|smart.?meter/i, /power|leistung/i) },
      { path: 'grid.invert', label: 'Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn der Sensor bei Einspeisung positive Werte liefert.' },
      { path: 'grid.daily_import', label: 'Netzbezug heute (kWh)', kind: 'energy', optional: true, hints: H(/import|bezug|verbrauch|consumption/i, /tag|daily|today|heute/i) },
      { path: 'grid.daily_export', label: 'Einspeisung heute (kWh)', kind: 'energy', optional: true, hints: H(/export|einspeis|feed/i, /tag|daily|today|heute/i) },
    ] },
    { short: 'Batterie', title: 'Batteriespeicher', text: 'Überspringen, wenn du keine Batterie hast.', fields: [
      { path: 'battery.power', label: 'Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i) },
      { path: 'battery.soc', label: 'Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level|batterieladung/i, /batter|akku/i) },
      { path: 'battery.invert', label: 'Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn Laden negativ und Entladen positiv gemeldet wird.' },
      { path: 'battery.capacity_kwh', label: 'Kapazität (kWh)', kind: 'number', optional: true, help: 'Für die Prognose "voll um / reicht bis".' },
    ] },
    { short: 'Haus', title: 'Hausverbrauch', text: 'Optional. Ohne Angabe wird der Verbrauch aus Solar, Netz und Batterie berechnet.', fields: [
      { path: 'home.entity', label: 'Hausverbrauch', kind: 'power', optional: true, hints: H(/haus|home|house|verbrauch|consumption|load/i) },
    ] },
    { short: 'Verbraucher', title: 'Einzelverbraucher', text: 'Wähle Geräte mit eigenem Leistungssensor, zum Beispiel Wärmepumpe, Wallbox oder Trockner. Gruppen (z. B. je Raum) findest du unter "Alle Felder".', fields: [
      { path: 'consumers', label: 'Verbraucher', kind: 'list', max: 12 },
    ] },
    { short: 'Preise', title: 'Strompreise (optional)', text: 'Mit Preisen zeigt die Karte Kosten und Ersparnis. Wähle Sensoren oder input_number-Helfer in Euro pro kWh.', fields: [
      { path: 'grid_price', label: 'Strompreis Bezug', kind: 'price', optional: true, hints: H(/bezug|netz|strom|import|grid|price|preis/i) },
      { path: 'feed_in', label: 'Einspeisevergütung', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert. Mit "Fertig" siehst du alle Felder, zum Beispiel für Gruppen. Abfallkalender, Überschussvorschläge und Netzalarm stellst du im YAML-Editor ein.', summary: (c) => [
      `Solar: ${(c.pv && c.pv.entity) || 'nicht gewählt'}`,
      `Netz: ${(c.grid && c.grid.entity) || 'nicht gewählt'}${c.grid && c.grid.invert ? ' (umgekehrt)' : ''}`,
      `Batterie: ${(c.battery && c.battery.power) || 'keine'}`,
      `Haus: ${(c.home && c.home.entity) || 'berechnet'}`,
      `Einzelverbraucher: ${(Array.isArray(c.consumers) ? c.consumers : []).filter((x) => x && x.entity).length}`,
      `Preise: ${c.grid_price ? 'Bezug gesetzt' : 'keine'}`,
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
  const { nf, esc, haNavigate, T, setLocale, cur } = WD;
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
:host{display:block;--mut:139,151,179;--txt:#eef2fb;--ok:52,211,153;--sun:250,204,21;--stroke:rgba(255,255,255,.08)}
ha-card{background:radial-gradient(130% 90% at 50% 0%,#141d33 0%,#070b14 62%);border-radius:28px;overflow:hidden;border:1px solid rgba(255,255,255,.06);color:var(--txt);font-family:Inter,var(--ha-font-family-body,system-ui),sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:22px 26px;position:relative;transform-origin:0 0;box-sizing:border-box;display:flex;flex-direction:column}
.wrap:before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;background:radial-gradient(35% 30% at 12% 8%,rgba(250,204,21,.07),transparent 70%),radial-gradient(40% 35% at 90% 85%,rgba(56,189,248,.07),transparent 70%)}
header{display:flex;align-items:center;flex-wrap:wrap;position:relative;margin-bottom:16px}
.title{display:flex;align-items:center;font-size:1.25rem;font-weight:750;letter-spacing:-.01em}
.title .ico{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(251,146,60,.16);color:rgb(251,146,60);margin-right:12px}
.title .ico ha-icon{--mdc-icon-size:20px;display:flex}
.title small{display:block;font-size:.74rem;font-weight:550;color:rgb(var(--mut));margin-top:2px;letter-spacing:0}
.navbtn{margin-left:auto;cursor:pointer;color:var(--txt);font-weight:650;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);padding:8px 14px;border-radius:999px;font-size:.8rem;-webkit-tap-highlight-color:transparent}
.navbtn:active{background:rgba(255,255,255,.18)}
.hero{position:relative;display:flex;align-items:center;padding:16px 20px;border-radius:22px;background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.015)),#0c1322;border:1px solid var(--stroke);margin-bottom:16px}
.kpi{flex:none;margin-right:22px;min-width:150px}
.kpi .big{font-size:2.5rem;font-weight:850;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.kpi .big u{text-decoration:none;font-size:1.05rem;font-weight:700;color:rgb(var(--mut));margin-left:5px}
.kpi .l{font-size:.72rem;color:rgb(var(--mut));margin-top:5px}
.kpi .l b{color:var(--txt);font-weight:650}
.hb{flex:1;min-width:0}
.bar{position:relative;display:flex;height:18px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.05)}
.seg{height:100%;width:0;transition:width 1.2s cubic-bezier(.2,.8,.2,1);background:linear-gradient(180deg,rgba(var(--c),1),rgba(var(--c),.65));position:relative}
.seg+.seg{box-shadow:inset 2px 0 0 #0c1322}
.seg.rest{background:repeating-linear-gradient(-45deg,rgba(255,255,255,.13) 0 6px,rgba(255,255,255,.05) 6px 12px)}
.seg:after{content:'';position:absolute;top:0;left:0;right:0;height:45%;background:linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,0))}
.seg.rest:after{display:none}
.leg{display:flex;flex-wrap:wrap;margin-top:10px;font-size:.72rem;color:rgb(var(--mut))}
.leg span{display:flex;align-items:center;margin:0 14px 4px 0;white-space:nowrap}
.leg i{width:9px;height:9px;border-radius:3px;margin-right:6px;background:rgb(var(--c))}
.leg i.rest{background:repeating-linear-gradient(-45deg,rgba(255,255,255,.35) 0 2px,rgba(255,255,255,.1) 2px 4px)}
.leg b{color:var(--txt);font-weight:650;margin-left:4px}
.pills{display:flex;flex-wrap:wrap;margin-top:6px}
.pill{display:flex;align-items:center;font-size:.72rem;font-weight:600;padding:6px 11px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid var(--stroke);margin:4px 8px 0 0;color:rgb(var(--mut))}
.pill b{color:var(--txt);margin:0 3px}
.pill.sb{border-color:rgba(251,146,60,.45);background:rgba(251,146,60,.1);color:#fed7aa;cursor:pointer}
.pill.sun{border-color:rgba(var(--sun),.45);background:rgba(var(--sun),.1);color:#fef08a}
.per{display:flex;margin-bottom:10px}
.per span{flex:1;text-align:center;font-size:.72rem;font-weight:700;padding:7px 0;color:rgb(var(--mut));background:rgba(255,255,255,.04);border:1px solid var(--stroke);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .3s,color .3s}
.per span:first-child{border-radius:999px 0 0 999px}.per span:last-child{border-radius:0 999px 999px 0}
.per span+span{border-left:0}
.per span.sel{background:rgba(var(--sun),.16);color:#fef08a;border-color:rgba(var(--sun),.45)}
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
.room{position:relative;border-radius:22px;padding:14px 14px 8px;background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.012)),#0b1120;border:1px solid var(--stroke);overflow:hidden;opacity:0;transform:translateY(10px);animation:rin .7s cubic-bezier(.2,.8,.2,1) forwards;transition:border-color .6s,box-shadow .6s}
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
.dv:active{background:rgba(255,255,255,.06)}
.dv .ic{position:relative;flex:none;width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.05);margin-right:11px;transition:background .5s,box-shadow .5s}
.dv .ic ha-icon{--mdc-icon-size:22px;color:rgba(255,255,255,.45);display:flex;position:relative;z-index:2;transition:color .5s}
.dv .fx{position:absolute;top:3px;left:3px;right:3px;bottom:3px;border-radius:50%;opacity:0;transition:opacity .5s}
.dv.on .ic{background:rgba(var(--c),.16);box-shadow:inset 0 0 0 1px rgba(var(--c),.35)}
.dv.on .ic ha-icon{color:rgb(var(--c))}
.dv.on.t-light .ic{background:radial-gradient(circle at 50% 45%,rgba(var(--c),.55),rgba(var(--c),.1) 72%);box-shadow:0 0 0 1px rgba(var(--c),.35),inset 0 0 0 1px rgba(var(--c),.5)}
.dv.on.t-light .ic ha-icon{color:#fff7c2;filter:none}
.dv.run.spin .fx{opacity:1;border:2px dashed rgba(var(--c),.75);animation:spin var(--sp,2.4s) linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.dv.run.t-fridge .fx,.dv.run.t-heat .fx{opacity:1;border:1.5px solid rgba(var(--c),.7);animation:ping 2.2s ease-out infinite}
@keyframes ping{0%{transform:scale(.7);opacity:.9}100%{transform:scale(1.35);opacity:0}}
.dv.on.t-tv .ic,.dv.on.t-console .ic{animation:flick 3.2s ease-in-out infinite}
@keyframes flick{0%,100%{box-shadow:0 0 0 1px rgba(var(--c),.35),inset 0 0 0 1px rgba(var(--c),.35)}50%{box-shadow:0 0 0 1px rgba(var(--c),.35),inset 0 0 0 1px rgba(var(--c),.5)}}
.steam{position:absolute;top:-6px;left:0;right:0;height:14px;z-index:3;opacity:0}
.steam i{position:absolute;bottom:0;width:3px;height:10px;border-radius:3px;background:rgba(255,255,255,.55);filter:blur(1px);animation:steam 1.8s ease-out infinite}
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
.tg{position:relative;flex:none;width:44px;height:26px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);margin-left:8px;transition:background .35s,border-color .35s}
.tg:after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#cbd5e1;box-shadow:0 2px 6px rgba(0,0,0,.5);transition:transform .35s cubic-bezier(.2,.8,.2,1),background .35s}
.dv.on .tg{background:rgba(var(--c),.85);border-color:rgba(var(--c),1);box-shadow:0 0 0 1px rgba(var(--c),.35)}
.dv.on .tg:after{transform:translateX(18px);background:#fff}
.lk{flex:none;margin-left:8px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(var(--c),.12);color:rgba(var(--c),.9);--mdc-icon-size:17px}
.dv.lock{cursor:default}
.dv.nope{animation:nope .4s ease}
@keyframes nope{20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}
.dv.pend .tg:after{animation:pend .8s ease-in-out infinite}
@keyframes pend{50%{opacity:.4}}
.dv .pbar{position:absolute;left:58px;right:60px;bottom:3px;height:2px;border-radius:2px;background:rgba(255,255,255,.04);overflow:hidden}
.dv .pbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,rgba(var(--c),.3),rgb(var(--c)));transition:width 1s}
.chs{display:flex;flex-wrap:wrap;margin:-2px 0 6px 47px}
.ch{font-size:.68rem;font-weight:650;padding:5px 10px;border-radius:999px;margin:4px 6px 0 0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgb(var(--mut));cursor:pointer;-webkit-tap-highlight-color:transparent;transition:all .35s}
.ch.on{background:rgba(251,146,60,.18);border-color:rgba(251,146,60,.55);color:#fed7aa}
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
.seg15 i{flex:1;margin-right:3px;border-radius:4px;background:rgba(255,255,255,.07);transition:background .8s,box-shadow .8s}
.seg15.lit i{background:rgb(var(--sc));box-shadow:0 0 0 1px rgba(var(--sc),.35)}
.seg15.dream i{animation:dream 6s linear infinite}
.seg15.music i{animation:beat .9s ease-in-out infinite}
.seg15 i:nth-child(odd){animation-delay:-.45s}
@keyframes dream{0%{background:rgb(255,80,80);box-shadow:0 0 0 1px rgba(255,80,80,.35)}25%{background:rgb(255,200,60)}50%{background:rgb(60,220,160);box-shadow:0 0 0 1px rgba(60,220,160,.35)}75%{background:rgb(80,130,255)}100%{background:rgb(255,80,80)}}
@keyframes beat{50%{transform:scaleY(.4);opacity:.6}}
.np{margin:0 0 4px 47px;font-size:.7rem;color:rgb(var(--mut));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.np b{color:var(--txt)}
.chs.lt .ch.on{background:rgba(var(--amb,129,140,248),.2);border-color:rgba(var(--amb,129,140,248),.6);color:#e0e7ff}
.chs.sc .ch.on{background:rgba(250,204,21,.18);border-color:rgba(250,204,21,.55);color:#fef08a}
.rlogo{height:22px;max-width:76px;object-fit:contain;border-radius:5px;margin-right:8px;flex:none}
.dlogo{width:78%;height:78%;object-fit:contain;border-radius:6px}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.room{opacity:1;transform:none}}
`;

  class DevicesCard extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._energy = {}; this._cost = {}; this._gridk = {}; this._pend = {}; }
    static getStubConfig() { return { rooms: [{ name: T('dev.room'), devices: [] }] }; }
    static getConfigElement() { return document.createElement('energy-cockpit-devices-card-editor'); }
    setConfig(c) {
      if (!c.rooms || !c.rooms.length) {
        this._c = null;
        this.shadowRoot.innerHTML = '<style>ha-card{padding:22px;border-radius:24px;background:#0c1322;color:#e8eefc;font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit Geräte &amp; Verbrauch</b><div style="margin-top:8px;opacity:.8">Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Sensoren auszuwählen.</div></ha-card>';
        return;
      }
      this._c = Object.assign({ standby_w: 15 }, c);
      this._sig = null;
      if (this._hass) this._update();
    }
    set hass(h) {
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
      if (!this._ro && window.ResizeObserver) this._ro = new ResizeObserver(() => this._sched());
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
      card.style.height = Math.ceil(Math.max(avail, wrap.offsetHeight * s)) + 'px';
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
          return `<div class="room" data-r="${x.ri}" style="--rc:${x.r.color || col.c};animation-delay:${i * 70}ms">
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
      return `<div class="dv t-${d.type || 'plug'}${t.spin ? ' spin' : ''}${d.lock ? ' lock' : ''}" data-k="${d.key}" style="--c:${d.color || t.c}">
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
        const price = num(h, c.grid_price) || 0, feed = num(h, c.feed_in) || 0;
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
      const price = num(h, c.grid_price) || 0;
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
        if (w !== null && !d.shared) { sum += w; roomW[d.room] = (roomW[d.room] || 0) + w; if (w > 0.5) segs.push({ n: /^(licht|light)$/i.test(d.name) ? T('dev.light') + ' ' + c.rooms[d.room].name : d.name, w, c: d.color || t.c }); }
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
        if (d.type === 'fridge' && w !== null) parts.push(d.alt_w && w > d.alt_w ? (d.alt_label || T('dev.extra')) : run ? '❄ ' + T('dev.cooling') : T('dev.pause'));
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
      const extra = (c.extra_consumers || []).map((x) => ({ n: x.name, w: num(h, x.entity), c: x.color || '167,139,250' })).filter((x) => x.w && x.w > 0.5);
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
      const rank = devs.filter((d) => d.energy && this._energy[d.energy]).map((d) => ({ n: /^(licht|light)$/i.test(d.name) ? T('dev.light') + ' ' + c.rooms[d.room].name : d.name, e: this._energy[d.energy], k: this._cost[d.energy] || 0, c: d.color || (TYPES[d.type] || TYPES.plug).c }))
        .concat(ex.map((x) => ({ n: x.name, e: this._energy[x.energy], k: this._cost[x.energy] || 0, c: x.color || '167,139,250' }))).sort((a, b) => b.e - a.e).slice(0, 5);
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
    'ed.d.title': 'Titel', 'ed.d.home': 'Hausverbrauch (Leistung)', 'ed.d.price': 'Strompreis Bezug (Sensor, pro kWh)', 'ed.d.feed': 'Einspeisevergütung (Sensor, pro kWh)',
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
        title: 'ed.d.title', home: 'ed.d.home', grid_price: 'ed.d.price', feed_in: 'ed.d.feed', surplus: 'ed.d.surplus', standby_w: 'ed.d.standby',
        fit_screen: 'ed.d.fit', nav_path: 'ed.d.nav_path', nav_label: 'ed.d.nav_label', icon: 'ed.d.icon', color: 'ed.d.color', image: 'ed.d.image', type: 'ed.d.type',
        entity: 'ed.d.entity', power: 'ed.d.power', energy: 'ed.d.energy', max_w: 'ed.d.max_w', run_w: 'ed.d.run_w', lock: 'ed.d.lock',
      };
      const label = (s) => (s.name === 'name' ? T('ed.d.room_name') : lbl[s.name] ? T(lbl[s.name]) : s.name);

      // Allgemein
      const top = this._form([
        txt('title'), ent('home', ['sensor']), ent('grid_price', ['sensor', 'input_number']), ent('feed_in', ['sensor', 'input_number']),
        ent('surplus', ['sensor']), numb('standby_w', 0, 200, 1), bool('fit_screen'), txt('nav_path'), txt('nav_label'),
      ], {
        title: c.title || '', home: c.home || '', grid_price: c.grid_price || '', feed_in: c.feed_in || '', surplus: c.surplus || '',
        standby_w: c.standby_w === undefined ? 15 : c.standby_w, fit_screen: c.fit_screen !== false, nav_path: c.nav_path || '', nav_label: c.nav_label || '',
      }, (v) => {
        ['title', 'home', 'grid_price', 'feed_in', 'surplus', 'nav_path', 'nav_label'].forEach((k) => { if (v[k]) c[k] = v[k]; else delete c[k]; });
        if (v.standby_w === undefined || v.standby_w === 15) delete c.standby_w; else c.standby_w = v.standby_w;
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
  const { nf, esc, T, setLocale, cur } = WD;
  const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const SRC = [['Netz', '255,92,122'], ['Batterie', '96,165,250'], ['PV', '255,197,61']];
  const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const fk = (v) => nf(v, v < 10 ? 2 : v < 100 ? 1 : 0);
  const fe = (v) => nf(v, 2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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
.kpi .s{font-size:.68rem;color:rgb(var(--mut));margin-top:3px;line-height:1.5}
.mixbar{display:flex;height:6px;border-radius:99px;overflow:hidden;background:rgba(255,255,255,.07);margin-top:8px}
.mixbar i{display:block;height:100%;background:rgb(var(--c))}
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
.tw{max-height:320px;overflow:auto;margin-top:12px}
table{width:100%;border-collapse:collapse;font-size:.84rem;font-variant-numeric:tabular-nums}
th{font-size:.64rem;text-transform:uppercase;letter-spacing:.08em;color:rgb(var(--mut));text-align:right;padding:6px 8px;position:sticky;top:0;background:#0c1322}
td{padding:7px 8px;text-align:right;border-top:1px solid rgba(255,255,255,.05)}
th:first-child,td:first-child{text-align:left}
tr.cur td{color:rgb(var(--acc));font-weight:700}
tr.sum td{border-top:2px solid rgba(255,255,255,.2);font-weight:800}
td.z{opacity:.35}
.note{margin-top:12px;font-size:.72rem;color:rgb(var(--mut));line-height:1.55}
.note b{color:var(--txt)}
.foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:12px;font-size:.72rem;color:rgb(var(--mut))}
.btn{cursor:pointer;padding:7px 14px;border-radius:999px;font-size:.78rem;font-weight:650;color:var(--txt);background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);-webkit-tap-highlight-color:transparent}
.empty{padding:26px;text-align:center;color:rgb(var(--mut))}
.big{font-size:2.1rem;font-weight:800;margin-top:8px;font-variant-numeric:tabular-nums}
.big small{font-size:.9rem;opacity:.7}
.pbar{height:10px;border-radius:99px;background:rgba(255,255,255,.08);margin-top:10px;overflow:hidden}
.pbar i{display:block;height:100%;border-radius:99px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.mini{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid var(--stroke)}
.mini .l,.tile .l{font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;font-weight:650;color:rgb(var(--mut))}
.mini .v{font-size:1.15rem;font-weight:800;margin-top:4px;font-variant-numeric:tabular-nums}
.mini .s,.tile .s,.s2{font-size:.7rem;color:rgb(var(--mut));margin-top:4px;line-height:1.5}
.s2{margin-top:12px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:12px}
.tile{padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid var(--stroke);border-top:2px solid rgb(var(--c))}
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
      this._liveUpd();
    }
    // Aktuelle Leistung je Bereich (Sensor "power"), sonst null
    _watt(d) {
      const h = this._hass;
      if (!d || !d.power || !h || !h.states[d.power]) return null;
      const x = parseFloat(h.states[d.power].state);
      return isNaN(x) ? null : x;
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
        const y = new Date().getFullYear();
        const start = new Date(y - 1, 0, 1);
        const ts = (x) => (typeof x.start === 'number' ? x.start : Date.parse(x.start));
        // 1) Tageswerte der Geräte: erster Messtag, Gesamtverbrauch
        const dr = await h.callWS({ type: 'recorder/statistics_during_period', start_time: start.toISOString(), period: 'day', statistic_ids: ids, types: ['change'] });
        let firstTs = null;
        ids.forEach((id) => (dr[id] || []).forEach((x) => { const t = ts(x); if (x.change !== null && x.change !== undefined && (firstTs === null || t < firstTs)) firstTs = t; }));
        const days = {};
        const he = c.home_energy || {};
        const srcIds = ['pv', 'import', 'export', 'charge', 'discharge'].map((k) => he[k]).filter(Boolean);
        this._hasMix = !!(he.import && (he.pv || he.discharge));
        if (firstTs === null) {
          this._first = null;
        } else if (!this._hasMix) {
          ids.forEach((id, di) => (dr[id] || []).forEach((x) => {
            const k = key(new Date(ts(x)));
            (days[k] = days[k] || ids.map(() => [0, 0, 0, 0]))[di][0] += x.change > 0 ? x.change : 0;
          }));
          this._first = key(new Date(firstTs));
        } else {
          // 2) Stundenwerte: Geräte und Haus-Mix (PV, Bezug, Einspeisung, Batterie laden/entladen)
          const from = new Date(firstTs);
          from.setHours(0, 0, 0, 0);
          const all = ids.concat(srcIds);
          const hr = await h.callWS({ type: 'recorder/statistics_during_period', start_time: from.toISOString(), period: 'hour', statistic_ids: all, types: ['change'] });
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
            const dev = ids.map((id) => row[id] || 0);
            const pv = row[he.pv] || 0, imp = row[he.import] || 0, exp = row[he.export] || 0, chg = row[he.charge] || 0, dis = row[he.discharge] || 0;
            const home = pv + imp - exp - chg + dis;
            let g = 1, b = 0;
            if (home > 0.0001) { g = clamp(imp / home, 0, 1); b = clamp(dis / home, 0, 1 - g); }
            const p = 1 - g - b;
            // Stundenwerte (auch Stunden ohne Verbrauch) für Grundlast, Betriebszeiten und beste Zeit
            if (ids.some((id) => row[id] !== undefined)) this._hrs.push({ t: +t, dev });
            if (row[he.import] !== undefined && home > 0.0001 && +t >= mixFrom) {
              const m = this._mixH[new Date(+t).getHours()];
              m.n++; m.g += g; m.b += b; m.p += p;
            }
            if (!dev.some((v) => v > 0)) return;
            const k = key(new Date(+t));
            const a = (days[k] = days[k] || ids.map(() => [0, 0, 0, 0]));
            const sur = exp > 0.0001; // in dieser Stunde wurde eingespeist: PV-Anteil hätte sonst Einspeisevergütung gebracht
            dev.forEach((v, di) => { a[di][0] += v * g; a[di][1] += v * b; a[di][sur ? 3 : 2] += v * p; });
          });
          this._first = key(new Date(firstTs));
        }
        this._firstTs = firstTs;
        this._days = days;
        this._nd = nd;
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
      const nd = this._c.devices.length;
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
      const raw = this._sum(from, to);
      const price = (d) => {
        if (mode === 'grid') return (d[0] + d[1] + d[2] + d[3]) * P.grid;
        if (mode === 'mix') return d[0] * P.grid + d[1] * P.batt + (d[2] + d[3]) * P.pv;
        return (d[0] + d[1] + d[2]) * P.grid + d[3] * P.feed;
      };
      const dev = raw.map((d) => [d[0], d[1], d[2] + d[3]]);
      const src = [0, 0, 0];
      dev.forEach((d) => d.forEach((v, i) => { src[i] += v; }));
      const surplus = raw.reduce((a, d) => a + d[3], 0);
      const kwh = src[0] + src[1] + src[2];
      const fee = withFee ? this._fee(from, to) : 0;
      const devCost = raw.map(price);
      const cost = devCost.reduce((a, v) => a + v, 0) + fee;
      const costFull = kwh * P.grid + fee;
      return { dev, src, kwh, fee, cost, costFull, devCost, surplus };
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
      const head = ['Zeitraum', 'Summe kWh', 'Netz kWh', 'Batterie kWh', 'PV kWh', 'Kosten ' + cur(), 'bei Bezugspreis ' + cur()].concat(c.devices.map((d) => (d.name || d.energy) + ' kWh'));
      const rows = b.map((x) => {
        const r = this._calc(x.from, x.to, x.fee);
        return [x.label, num(r.kwh), num(r.src[0]), num(r.src[1]), num(r.src[2]), r.cost.toFixed(2).replace('.', ','), r.costFull.toFixed(2).replace('.', ',')]
          .concat(r.dev.map((d) => num(d[0] + d[1] + d[2])));
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
        return `<div class="tile" style="--c:${d.color || '96,165,250'}"><div class="l">${esc(d.name || d.energy)}</div>
          <div class="wl"><span class="wv ${this._wcls(w)}" data-w="${i}">${w === null ? '–' : nf(w, 0)}</span><small>W</small></div>
          <div class="spark">${bars}</div><div class="s">heute ${fk(todayKwh)} kWh · Kurve je Stunde</div></div>`;
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
          donut = `<svg viewBox="0 0 100 100" class="donut"><circle r="${R}" cx="50" cy="50" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="14"/>${seg}<text x="50" y="54" text-anchor="middle" fill="#e8eefc" font-size="14" font-weight="800">${fk(tot)}</text></svg>`;
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
        sbHtml = `<div class="tiles">${c.devices.map((d, i) => `<div class="tile" style="--c:${d.color || '96,165,250'}"><div class="l">${esc(d.name || d.energy)}</div><div class="wl"><span class="wv ${per[i] > sb ? 'hi' : 'lo'}">${nf(per[i], 0)}</span><small>W nachts</small></div></div>`).join('')}
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
          rows += `<tr><td>${MONTHS[+mm - 1] || mm} ${yy}</td><td>${fk(r.kwh)}</td><td>${fk(r.g)}</td><td>${fk(r.b)}</td><td>${fk(r.p)}</td><td>${fe(r.cost)}</td><td>${saldo === null ? '–' : (saldo >= 0 ? '+' : '−') + fe(Math.abs(saldo))}</td></tr>`
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
          return `<tr><td>${esc(d.name || d.energy)}</td><td>${fk(t)}</td>${mix ? dv.map(cell).join('') : ''}<td>${fe(cur_.devCost[i])}</td></tr>`;
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
    power: 'Leistungssensor (W, für die Live-Anzeige)', advance: 'Abschlag je Monat (Zahl in € oder input_number)', archive: 'Monatsarchiv (Sensor, optional)',
    standby_w: 'Standby-Schwelle nachts (W, Zahl oder input_number)', active_w: 'Ab wie viel Watt gilt ein Bereich als aktiv (W)',
    watt_warn: 'Live-Anzeige: erhöht ab (W)', watt_high: 'Live-Anzeige: hoch ab (W)',
  };

  WD.roomForm = () => ({
    schema: [
      txt('title'), txt('subtitle'), txt('image'),
      sec('devices', 'Bereiche / Zähler (bis zu 8)', Array.from({ length: 8 }, (_, i) => sec(String(i), `Bereich ${i + 1}`, [ent('energy', ['sensor']), ent('power', ['sensor']), txt('name'), txt('color')]))),
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
      { path: 'devices', label: 'Zähler', kind: 'list', listKind: 'energy', itemKey: 'energy', max: 8 },
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
  'st.pvsav': 'PV-Ersparnis', 'st.feed': 'Einspeiseerlös', 'st.cost': 'Stromkosten Netz', 'st.aut': 'Autarkie',
  'st.amo': 'Amortisation PV-Anlage', 'st.base': 'Grundlast (nachts)', 'st.monthly': 'PV-Ertrag pro Monat', 'st.record': 'Rekordtag',
  'st.eff': 'Akku-Wirkungsgrad', 'st.cycles': 'Vollzyklen', 'st.temp': 'Akku-Temperatur', 'st.pvall': 'PV gesamt',
  'st.self': '<b>{kwh} kWh</b> PV selbst genutzt', 'st.fed': '<b>{kwh} kWh</b> eingespeist', 'st.drawn': '<b>{kwh} kWh</b> bezogen',
  'st.autsub': 'Eigenverbrauch <b>{self}</b> · Verbrauch <b>{cons} kWh</b>',
  'st.earned': '<b>{e} {cur}</b> von {i} {cur} zurückverdient', 'st.eta': '<b>{y} {cur}/Jahr</b> · fertig ca. <b>{yr}</b>', 'st.paid': '<b>Anlage hat sich bezahlt gemacht 🎉</b>',
  'st.glcost': '≈ <b>{x} {cur}/Jahr</b>', 'st.gltip': 'Niedrigster Stundenmittelwert 0–5 Uhr, Median der letzten {n} Nächte', 'st.gl100': '100 W weniger ≈ {x} {cur}/Jahr',
  'st.full': '× voll', 'st.note': 'Netzstrom {p} ct/kWh · Einspeisung {f} ct/kWh · reine Energiekosten ohne Grundgebühr · Amortisation mit heutigen Preisen geschätzt',
  'st.noprice': 'Preise (grid_price, feed_in) konfigurieren, um Kosten und Ersparnis zu sehen', 'st.nodata': 'noch keine Daten', 'st.vsprev': 'ggü. Vorjahr',
  'st.import': 'Bezug', 'st.export': 'Einspeisung',
});


/* ---- stats-card.js ---- */
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
:host{display:block;--pv:255,197,61;--imp:255,92,122;--exp:52,211,153;--bat:96,165,250;--home:34,211,238;--sav:52,211,153;--mut:139,151,179;--txt:#e8eefc;--stroke:rgba(255,255,255,.08)}
ha-card{background:radial-gradient(120% 80% at 50% 0%,#121b30 0%,#070b14 65%);border-radius:28px;overflow:hidden;border:1px solid rgba(255,255,255,.06);color:var(--txt);font-family:Inter,var(--ha-font-family-body,system-ui),sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:22px;position:relative;transform-origin:0 0;box-sizing:border-box}
.wrap:before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;background:radial-gradient(40% 30% at 15% 15%,rgba(var(--pv),.09),transparent 70%),radial-gradient(40% 35% at 85% 60%,rgba(var(--home),.08),transparent 70%)}
header{display:flex;align-items:center;flex-wrap:wrap;position:relative;margin-bottom:18px}
.title{font-size:1.05rem;font-weight:650;margin-right:auto;display:flex;align-items:center}
.title .ico{margin-right:10px}
.ico{width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:rgba(var(--c,var(--home)),.16);color:rgb(var(--c,var(--home)));flex:none}
.ico ha-icon{--mdc-icon-size:19px;display:flex}
.tabs{display:flex;background:rgba(255,255,255,.05);border:1px solid var(--stroke);border-radius:999px;padding:3px;margin-left:8px}
.tab{padding:7px 14px;border-radius:999px;font-size:.8rem;font-weight:650;color:rgb(var(--mut));cursor:pointer;transition:all .35s;-webkit-tap-highlight-color:transparent}
.tab.on{background:rgba(var(--home),.18);color:rgb(var(--home));box-shadow:0 0 0 1px rgba(var(--home),.35)}
.navbtn{cursor:pointer;color:var(--txt);font-weight:650;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);padding:8px 14px;border-radius:999px;font-size:.8rem;margin-left:8px;-webkit-tap-highlight-color:transparent}
.navbtn:active{background:rgba(255,255,255,.18)}
.panel{position:relative;padding:16px 18px;border-radius:22px;background:linear-gradient(160deg,rgba(255,255,255,.065),rgba(255,255,255,.015)),#0c1322;border:1px solid var(--stroke)}
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
.pbar{position:relative;height:16px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden;margin-top:12px}
.pfill{position:absolute;top:0;left:0;bottom:0;width:0;border-radius:inherit;background:linear-gradient(90deg,rgba(var(--sav),.5),rgb(var(--sav)));box-shadow:0 0 0 1px rgba(var(--sav),.35);transition:width 1.6s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.pfill:after{content:'';position:absolute;top:0;bottom:0;left:0;right:0;background:repeating-linear-gradient(-45deg,rgba(255,255,255,.14) 0 10px,transparent 10px 20px);animation:stripes 1.2s linear infinite}
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
.leg i.prev{background:transparent;border:1.5px dashed rgba(255,255,255,.35)}
.bars{display:flex;align-items:flex-end;height:130px;border-bottom:1px solid var(--stroke)}
.col{flex:1;display:flex;align-items:flex-end;justify-content:center;height:100%;cursor:pointer;position:relative}
.b{width:36%;max-width:24px;border-radius:7px 7px 3px 3px;height:0;transition:height 1.2s cubic-bezier(.2,.8,.2,1)}
.b.cur{background:linear-gradient(180deg,rgb(var(--pv)),rgba(var(--pv),.3));box-shadow:0 0 0 1px rgba(var(--pv),.35)}
.b.prev{border:1.5px dashed rgba(255,255,255,.3);border-bottom:none;margin-right:3px;background:rgba(255,255,255,.03)}
.col.now .b.cur{animation:glowbar 2.4s ease-in-out infinite}
@keyframes glowbar{50%{box-shadow:0 0 0 1px rgba(var(--pv),.35)}}
.col.sel .b.cur{outline:2px solid rgba(255,255,255,.6);outline-offset:2px}
.mlabels{display:flex;margin-top:6px}
.mlabels span{flex:1;text-align:center;font-size:.64rem;color:rgb(var(--mut));font-weight:600}
.mlabels span.now{color:rgb(var(--pv))}
.detail{margin-top:10px;font-size:.78rem;color:rgb(var(--mut));text-align:center;min-height:18px}
.detail b{color:var(--txt);font-weight:600}
footer{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));grid-gap:10px;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--stroke)}
.stat{padding:10px 13px;border-radius:15px;background:rgba(255,255,255,.028);border:1px solid rgba(255,255,255,.04)}
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
      return {
        pv_total: find(/^sensor\..*(pv|solar|inverter).*(total|gesamt|lifetime)/i),
        grid_import_total: find(/^sensor\..*(import|bezug|verbrauch).*(total|gesamt)/i),
        grid_export_total: find(/^sensor\..*(export|einspeis).*(total|gesamt)/i),
      };
    }
    static getConfigElement() { return document.createElement('energy-cockpit-stats-card-editor'); }
    setConfig(c) {
      if (!c.pv_total || !c.grid_import_total || !c.grid_export_total) {
        this._c = null;
        this.shadowRoot.innerHTML = '<style>ha-card{padding:22px;border-radius:24px;background:#0c1322;color:#e8eefc;font-family:system-ui,sans-serif}b{color:#60a5fa}</style><ha-card><b>Energy-Cockpit Statistik</b><div style="margin-top:8px;opacity:.8">Noch nicht eingerichtet. Karte bearbeiten (Stift): Der <b>Assistent</b> hilft dir, die Sensoren auszuwählen.</div></ha-card>';
        return;
      }
      this._c = Object.assign({ battery_capacity_kwh: 0 }, c);
      this._build();
      this._loaded = 0;
      if (this._hass) this._load();
    }
    set hass(h) {
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
      if (!this._ro && window.ResizeObserver) this._ro = new ResizeObserver(() => this._sched());
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
      if (this._c.fit_screen === false) return 1;
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
        card.style.height = Math.ceil(wrap.offsetHeight * s) + 'px';
      }
      return s;
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
          ${c.nav_path ? `<div class="navbtn" data-nav="${c.nav_path}">${esc(c.nav_label || T('st.next'))}</div>` : ''}
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
          h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(now.getFullYear() - 1, 0, 1).toISOString(), period: 'month', statistic_ids: ids, types: ['change'] }),
          h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(now.getFullYear(), 0, 1).toISOString(), period: 'day', statistic_ids: [c.pv_today || c.pv_total], types: ['change'] }),
          c.home_power ? h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(Date.now() - 8 * 864e5).toISOString(), period: 'hour', statistic_ids: [c.home_power], types: ['mean'] }) : Promise.resolve({}),
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
        return { pv: live(h, c.pv_today), imp: live(h, c.import_today), exp: live(h, c.export_today), chg: live(h, c.charge_today) || 0, dis: live(h, c.discharge_today) || 0, label: T('st.today') };
      }
      if (!M) return null;
      const ks = this._period === 'month' ? [key(now.getFullYear(), now.getMonth())] : Array.from({ length: now.getMonth() + 1 }, (x, i) => key(now.getFullYear(), i));
      const sum = (o) => ks.reduce((a, k) => a + (o[k] || 0), 0);
      return { pv: sum(M.pv), imp: sum(M.imp), exp: sum(M.exp), chg: sum(M.chg), dis: sum(M.dis), label: this._period === 'month' ? MONL[now.getMonth()] : String(now.getFullYear()) };
    }

    _render() {
      const c = this._c, h = this._hass;
      if (!h) return;
      const price = val(h, c.grid_price, 0), feed = val(h, c.feed_in, 0), CUR = cur();
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
      const inv = val(h, c.investment, 0);
      const pvT = live(h, c.pv_total), expT = live(h, c.grid_export_total);
      if (inv > 0 && price > 0 && pvT !== null && expT !== null) {
        const earned = Math.max(0, pvT - expT) * price + expT * feed;
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
      const chT = live(h, c.battery_charge_total), diT = live(h, c.battery_discharge_total);
      if (chT && diT) this._f('eff', `${nf(diT / chT * 100, 1)}<small>%</small>`);
      if (chT && c.battery_capacity_kwh) this._f('cyc', `${nf(chT / c.battery_capacity_kwh, 0)}<small>${T('st.full')}</small>`);
      const tmp = live(h, c.battery_temp);
      if (tmp !== null) this._f('temp', `${nf(tmp, 1)}<small>°C</small>`);
      if (pvT !== null) this._f('pvAll', `${nf(pvT / 1000, 1)}<small>MWh</small>`);
      this._f('note', price > 0 ? T('st.note', { p: nf(price * 100, 1), f: nf(feed * 100, 1) }) : T('st.noprice'));
      this._sched();
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


/* ---- stats-editor.js ---- */
/* Editor der Statistik-Karte: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const LABELS = {
    title: 'Titel', pv_total: 'PV Gesamtertrag (Zähler, kWh)', grid_import_total: 'Netzbezug gesamt (Zähler, kWh)', grid_export_total: 'Einspeisung gesamt (Zähler, kWh)',
    battery_charge_total: 'Batterie geladen gesamt (kWh)', battery_discharge_total: 'Batterie entladen gesamt (kWh)', battery_capacity_kwh: 'Batteriekapazität (kWh)', battery_temp: 'Batterietemperatur',
    pv_today: 'PV heute (kWh)', import_today: 'Bezug heute (kWh)', export_today: 'Einspeisung heute (kWh)', charge_today: 'Batterie geladen heute (kWh)', discharge_today: 'Batterie entladen heute (kWh)',
    home_power: 'Hausverbrauch (Leistung, für Grundlast)', grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)', investment: 'Anschaffungskosten PV-Anlage (Sensor oder input_number)',
    nav_path: 'Weiter-Schaltfläche: Pfad', nav_label: 'Weiter-Schaltfläche: Text', fit_screen: 'Auf Bildschirmhöhe skalieren',
  };
  const ent = (name, d) => ({ name, selector: { entity: d ? { domain: d } : {} } });
  const KEYS = ['pv_total', 'grid_import_total', 'grid_export_total', 'battery_charge_total', 'battery_discharge_total', 'battery_temp', 'pv_today', 'import_today', 'export_today',
    'charge_today', 'discharge_today', 'home_power'];

  WD.statsForm = () => ({
    schema: [
      { name: 'title', selector: { text: {} } },
      ...KEYS.map((k) => ent(k, ['sensor'])),
      { name: 'battery_capacity_kwh', selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } } },
      ent('grid_price', ['sensor', 'input_number']), ent('feed_in', ['sensor', 'input_number']), ent('investment', ['sensor', 'input_number']),
      { name: 'fit_screen', default: true, selector: { boolean: {} } },
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
    { short: 'Batterie', title: 'Batterie (optional)', text: 'Für Wirkungsgrad, Vollzyklen und genauere Autarkie.', fields: [
      { path: 'battery_charge_total', label: 'Batterie geladen gesamt', kind: 'energy', optional: true, hints: H(/ladung|charge|geladen/i, /batter|akku/i, TOTAL) },
      { path: 'battery_discharge_total', label: 'Batterie entladen gesamt', kind: 'energy', optional: true, hints: H(/entlad|discharge/i, /batter|akku/i, TOTAL) },
      { path: 'battery_capacity_kwh', label: 'Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'battery_temp', label: 'Batterietemperatur', kind: 'temp', optional: true, hints: H(/batter|akku/i, /temp/i) },
    ] },
    { short: 'Heute', title: 'Tageswerte (optional)', text: 'Für die Ansicht "Heute".', fields: [
      { path: 'pv_today', label: 'PV heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /pv|solar|inverter|ertrag|yield/i) },
      { path: 'import_today', label: 'Netzbezug heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /import|bezug|verbrauch/i) },
      { path: 'export_today', label: 'Einspeisung heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /export|einspeis/i) },
      { path: 'charge_today', label: 'Batterie geladen heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /lad|charge/i) },
      { path: 'discharge_today', label: 'Batterie entladen heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /entlad|discharge/i) },
    ] },
    { short: 'Preise', title: 'Preise, Haus und Anlage (optional)', text: 'Mit Preisen zeigt die Karte Geldwerte. Die Anschaffungskosten ergeben die Amortisation, der Hausverbrauch die nächtliche Grundlast.', fields: [
      { path: 'grid_price', label: 'Strompreis Bezug', kind: 'price', optional: true, hints: H(/bezug|netz|strom|import|grid|price|preis/i) },
      { path: 'feed_in', label: 'Einspeisevergütung', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },
      { path: 'investment', label: 'Anschaffungskosten der PV-Anlage', kind: 'money', optional: true, hints: H(/anschaff|invest|kosten|cost/i) },
      { path: 'home_power', label: 'Hausverbrauch (Leistung)', kind: 'power', optional: true, hints: H(/haus|home|house|verbrauch|consumption|load/i) },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert. Mit "Fertig" siehst du alle Felder.', summary: (c) => [
      `PV gesamt: ${c.pv_total || 'nicht gewählt'}`,
      `Netzbezug gesamt: ${c.grid_import_total || 'nicht gewählt'}`,
      `Einspeisung gesamt: ${c.grid_export_total || 'nicht gewählt'}`,
      `Batterie: ${c.battery_charge_total ? 'ja' : 'nein'}`,
      `Preise: ${c.grid_price ? 'gesetzt' : 'keine'}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-stats-card-editor', {
    needsSetup: (c) => !c.pv_total || !c.grid_import_total || !c.grid_export_total,
    steps,
    form: () => WD.statsForm(),
  });
})();

