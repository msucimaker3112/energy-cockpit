/* energy-cockpit-flow-card-editor: grafischer Editor (ha-form). Erweiterte Optionen (Gruppen, Abfall, Vorschläge) bleiben im YAML. */
(() => {
  const { T, setLocale } = WD;
  const MAXC = 6; // Anzahl Einzelverbraucher im Editor

  WD.addStrings({
    'ed.title': 'Titel', 'ed.name': 'Anzeigename', 'ed.entity': 'Sensor (Leistung)', 'ed.icon': 'Symbol', 'ed.color': 'Farbe (z. B. #a78bfa)',
    'ed.sec.pv': 'Solar', 'ed.sec.grid': 'Netz', 'ed.sec.battery': 'Batterie', 'ed.sec.home': 'Haus', 'ed.sec.price': 'Preise', 'ed.sec.consumers': 'Verbraucher', 'ed.sec.display': 'Darstellung',
    'ed.pv.daily': 'Tagesertrag (kWh)', 'ed.pv.forecast': 'Prognose (Leistung)',
    'ed.grid.invert': 'Vorzeichen umkehren (Einspeisung positiv)', 'ed.grid.daily_import': 'Bezug heute (kWh)', 'ed.grid.daily_export': 'Einspeisung heute (kWh)',
    'ed.bat.power': 'Sensor Lade-/Entladeleistung', 'ed.bat.soc': 'Sensor Ladestand (%)', 'ed.bat.invert': 'Vorzeichen umkehren (Laden negativ)',
    'ed.bat.capacity': 'Kapazität (kWh)', 'ed.bat.reserve': 'Reserve-Ladestand (%)', 'ed.bat.max': 'Maximaler Ladestand (%)',
    'ed.bat.daily_charge': 'Geladen heute (kWh)', 'ed.bat.daily_discharge': 'Entladen heute (kWh)',
    'ed.home.entity': 'Hausverbrauch (Leistung, optional)',
    'ed.price.grid': 'Strompreis Bezug (Sensor, pro kWh)', 'ed.price.feed': 'Einspeisevergütung (Sensor, pro kWh)',
    'ed.secondary': 'Zusatzwert (Sensor)',
    'ed.show_clock': 'Uhr anzeigen', 'ed.fit_screen': 'Auf Bildschirmhöhe skalieren', 'ed.nav_path': 'Weiter-Schaltfläche: Pfad (z. B. /lovelace/geraete)', 'ed.nav_label': 'Weiter-Schaltfläche: Text',
    'ed.hint': 'Gruppen, Abfallkalender und Überschussvorschläge stellst du im YAML-Editor ein.',
  });

  const ent = (name, labelKey, domains) => ({ name, selector: { entity: domains ? { domain: domains } : {} } });
  const txt = (name) => ({ name, selector: { text: {} } });
  const bool = (name) => ({ name, selector: { boolean: {} } });
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step || 1, mode: 'box' } } });
  const sec = (name, title, schema) => ({ type: 'expandable', name, title, schema });

  const clean = (o) => {
    Object.keys(o).forEach((k) => {
      const v = o[k];
      if (v === '' || v === undefined || v === null || v === false && k !== 'show_clock' && k !== 'fit_screen') delete o[k];
      else if (v && typeof v === 'object' && !Array.isArray(v)) { clean(v); if (!Object.keys(v).length) delete o[k]; }
    });
    return o;
  };

  class EnergyCockpitFlowEditor extends HTMLElement {
    setConfig(c) {
      this._c = JSON.parse(JSON.stringify(c || {}));
      this._render();
    }
    set hass(h) {
      this._hass = h;
      setLocale(h);
      if (this._form) { this._form.hass = h; this._schema(); }
    }
    _schema() {
      const L = (k) => T(k);
      const consumers = [];
      for (let i = 0; i < MAXC; i++) {
        consumers.push(sec('c' + i, `${L('ed.sec.consumers')} ${i + 1}`, [
          ent('entity', 'ed.entity', ['sensor']), txt('name'), { name: 'icon', selector: { icon: {} } }, txt('color'), ent('secondary', 'ed.secondary', ['sensor']),
        ]));
      }
      this._schemaDef = [
        txt('title'),
        sec('pv', L('ed.sec.pv'), [ent('entity', '', ['sensor']), txt('name'), ent('daily', '', ['sensor']), ent('forecast', '', ['sensor'])]),
        sec('grid', L('ed.sec.grid'), [ent('entity', '', ['sensor']), txt('name'), bool('invert'), ent('daily_import', '', ['sensor']), ent('daily_export', '', ['sensor'])]),
        sec('battery', L('ed.sec.battery'), [
          ent('power', '', ['sensor']), ent('soc', '', ['sensor']), txt('name'), bool('invert'),
          numb('capacity_kwh', 0, 200, 0.1), numb('reserve_soc', 0, 100, 1), numb('max_soc', 0, 100, 1),
          ent('daily_charge', '', ['sensor']), ent('daily_discharge', '', ['sensor']),
        ]),
        sec('home', L('ed.sec.home'), [ent('entity', '', ['sensor']), txt('name')]),
        sec('price', L('ed.sec.price'), [ent('grid_price', '', ['sensor', 'input_number']), ent('feed_in', '', ['sensor', 'input_number'])]),
        ...consumers,
        sec('display', L('ed.sec.display'), [bool('show_clock'), bool('fit_screen'), txt('nav_path'), txt('nav_label')]),
      ];
      this._form.schema = this._schemaDef;
    }
    _label(s) {
      const parent = s.name;
      const map = {
        title: 'ed.title', name: 'ed.name', icon: 'ed.icon', color: 'ed.color', secondary: 'ed.secondary',
        daily: 'ed.pv.daily', forecast: 'ed.pv.forecast', invert: 'ed.grid.invert', daily_import: 'ed.grid.daily_import', daily_export: 'ed.grid.daily_export',
        power: 'ed.bat.power', soc: 'ed.bat.soc', capacity_kwh: 'ed.bat.capacity', reserve_soc: 'ed.bat.reserve', max_soc: 'ed.bat.max',
        daily_charge: 'ed.bat.daily_charge', daily_discharge: 'ed.bat.daily_discharge', grid_price: 'ed.price.grid', feed_in: 'ed.price.feed',
        show_clock: 'ed.show_clock', fit_screen: 'ed.fit_screen', nav_path: 'ed.nav_path', nav_label: 'ed.nav_label', entity: 'ed.entity',
      };
      return map[parent] ? T(map[parent]) : (s.title || parent);
    }
    // Konfiguration -> Formulardaten
    _toData() {
      const c = this._c, d = { title: c.title || '' };
      d.pv = Object.assign({}, c.pv);
      d.grid = Object.assign({}, c.grid);
      d.battery = Object.assign({}, c.battery);
      d.home = Object.assign({}, c.home);
      d.price = { grid_price: typeof c.grid_price === 'string' ? c.grid_price : '', feed_in: typeof c.feed_in === 'string' ? c.feed_in : '' };
      for (let i = 0; i < MAXC; i++) d['c' + i] = Object.assign({}, (c.consumers || [])[i]);
      d.display = { show_clock: c.show_clock !== false, fit_screen: c.fit_screen !== false, nav_path: c.nav_path || '', nav_label: c.nav_label || '' };
      return d;
    }
    // Formulardaten -> Konfiguration (unbekannte Schlüssel wie consumer_groups, waste, surplus bleiben erhalten)
    _fromData(d) {
      const c = Object.assign({}, this._c);
      const part = (key, src) => {
        const merged = Object.assign({}, c[key], src);
        Object.keys(merged).forEach((k) => { if (merged[k] === '' || merged[k] === undefined || merged[k] === null || merged[k] === false) delete merged[k]; });
        if (Object.keys(merged).length) c[key] = merged; else delete c[key];
      };
      if (d.title) c.title = d.title; else delete c.title;
      part('pv', d.pv); part('grid', d.grid); part('battery', d.battery); part('home', d.home);
      if (d.price) {
        ['grid_price', 'feed_in'].forEach((k) => { if (d.price[k]) c[k] = d.price[k]; else if (typeof c[k] === 'string') delete c[k]; });
      }
      const list = [];
      for (let i = 0; i < MAXC; i++) {
        const x = clean(Object.assign({}, d['c' + i]));
        if (x.entity || x.secondary) list.push(x);
      }
      const keep = (this._c.consumers || []).slice(MAXC);
      if (list.length || keep.length) c.consumers = list.concat(keep); else delete c.consumers;
      const dp = d.display || {};
      if (dp.show_clock === false) c.show_clock = false; else delete c.show_clock;
      if (dp.fit_screen === false) c.fit_screen = false; else delete c.fit_screen;
      if (dp.nav_path) c.nav_path = dp.nav_path; else delete c.nav_path;
      if (dp.nav_label) c.nav_label = dp.nav_label; else delete c.nav_label;
      return c;
    }
    _render() {
      if (!this._form) {
        this._wrap = document.createElement('div');
        this._form = document.createElement('ha-form');
        this._form.computeLabel = (s) => this._label(s);
        this._form.addEventListener('value-changed', (ev) => {
          ev.stopPropagation();
          const cfg = this._fromData(ev.detail.value);
          this._c = cfg;
          this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true }));
        });
        const hint = document.createElement('p');
        hint.style.cssText = 'margin:12px 4px 0;font-size:.85rem;opacity:.7';
        this._hint = hint;
        this._wrap.appendChild(this._form);
        this._wrap.appendChild(hint);
        this.appendChild(this._wrap);
        if (this._hass) this._form.hass = this._hass;
      }
      if (this._hass) setLocale(this._hass);
      this._schema();
      this._hint.textContent = T('ed.hint');
      this._form.data = this._toData();
    }
  }

  if (!customElements.get('energy-cockpit-flow-card-editor')) customElements.define('energy-cockpit-flow-card-editor', EnergyCockpitFlowEditor);
})();
