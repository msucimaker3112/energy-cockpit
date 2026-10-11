/* energy-cockpit-stats-card-editor: grafischer Editor (ha-form, flache Felder). */
(() => {
  const { setLocale } = WD;
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
  const SCHEMA = [
    { name: 'title', selector: { text: {} } },
    ...KEYS.map((k) => ent(k, ['sensor'])),
    { name: 'battery_capacity_kwh', selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } } },
    ent('grid_price', ['sensor', 'input_number']), ent('feed_in', ['sensor', 'input_number']), ent('investment', ['sensor', 'input_number']),
    { name: 'fit_screen', selector: { boolean: {} } },
    { name: 'nav_path', selector: { text: {} } }, { name: 'nav_label', selector: { text: {} } },
  ];

  class EnergyCockpitStatsEditor extends HTMLElement {
    setConfig(c) {
      const s = JSON.stringify(c || {});
      if (this._last === s) return; // eigene Änderung, nicht neu aufbauen (Eingabefokus bleibt erhalten)
      this._c = JSON.parse(s);
      this._render();
    }
    set hass(h) { this._hass = h; setLocale(h); if (this._form) this._form.hass = h; }
    _render() {
      if (!this._form) {
        this._form = document.createElement('ha-form');
        this._form.schema = SCHEMA;
        this._form.computeLabel = (s) => LABELS[s.name] || s.name;
        this._form.addEventListener('value-changed', (ev) => {
          ev.stopPropagation();
          const v = ev.detail.value, c = Object.assign({}, this._c);
          SCHEMA.forEach((f) => {
            const x = v[f.name];
            if (f.name === 'fit_screen') { if (x === false) c.fit_screen = false; else delete c.fit_screen; }
            else if (x === '' || x === undefined || x === null || (x === 0 && f.name === 'battery_capacity_kwh')) delete c[f.name];
            else c[f.name] = x;
          });
          this._c = c;
          this._last = JSON.stringify(c);
          this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: c }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
        if (this._hass) this._form.hass = this._hass;
      }
      const d = {};
      SCHEMA.forEach((f) => { d[f.name] = this._c[f.name] === undefined ? (f.name === 'fit_screen' ? true : '') : this._c[f.name]; });
      this._form.data = d;
    }
  }
  if (!customElements.get('energy-cockpit-stats-card-editor')) customElements.define('energy-cockpit-stats-card-editor', EnergyCockpitStatsEditor);
})();
