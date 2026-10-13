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
      setHass(h) { hass = h; },
      setConfig(c) { cfg = JSON.parse(JSON.stringify(c || {})); render(); },
    };
  };

  WD.wizardList = list;
  WD.wizardScore = score;
})();
