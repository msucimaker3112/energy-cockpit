// Testhilfe: ?theme=hell setzt das Farbschema aller Karten der Seite
(() => {
  const q = new URLSearchParams(location.search);
  // Für Screenshots: Zähl- und Gleitanimationen sofort bis zum Endwert laufen lassen
  if (q.get('still')) window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now() + 10000), 16);
  const t = q.get('theme');
  const sammel = q.get('sammel'), gr0 = q.get('groups'), hrest = q.get('hiderest');
  const bat = q.get('battery'); // z. B. battery=reserve:10,max:95,disp:nutzbar
  if (bat) {
    const C = customElements.get('energy-cockpit-flow-card');
    if (C) {
      const o = C.prototype.setConfig;
      C.prototype.setConfig = function (c) {
        const b = Object.assign({}, c.battery || {});
        bat.split(',').forEach((kv) => { const [k, v] = kv.split(':'); if (k === 'reserve') b.reserve_pct = +v; if (k === 'max') b.max_pct = +v; if (k === 'disp') b.soc_display = v; });
        return o.call(this, Object.assign({}, c, { battery: b }));
      };
    }
  }
  if (sammel || gr0 || hrest) {
    const C = customElements.get('energy-cockpit-flow-card');
    if (C) {
      const o = C.prototype.setConfig;
      C.prototype.setConfig = function (c) {
        const n = gr0 ? Math.min(12, +gr0) : 0;
        const cols = ['#818cf8', '#7dd3fc', '#facc15', '#f87171', '#f59e0b', '#34d399', '#fb923c', '#22d3ee', '#a78bfa', '#f472b6', '#4ade80', '#60a5fa'];
        const names = ['Wohnzimmer', 'Küche', 'Flur & WC', 'Technik', 'Büro Keller', 'Partyraum', 'Hauswirtschaft', 'Brendan', 'Wallbox', 'Garage', 'Garten', 'Bad'];
        const g = n ? Array.from({ length: n }, (_, i) => ({ name: names[i], icon: 'mdi:sofa-outline', color: cols[i], items: [{ entity: i % 3 === 1 ? 'sensor.home' : 'sensor.pv', name: 'Gerät ' + (i + 1) }] })) : c.consumer_groups;
        return o.call(this, Object.assign({}, c, { consumer_groups: g, groups_lines: sammel ? 'sammel' : c.groups_lines, hide_rest: hrest ? true : c.hide_rest }));
      };
    }
  }
  if (q.get('pv2')) {
    const C = customElements.get('energy-cockpit-flow-card');
    if (C) {
      const o = C.prototype.setConfig;
      C.prototype.setConfig = function (c) {
        return o.call(this, Object.assign({}, c, { pv: Object.assign({}, c.pv, { name: 'Dach', daily: 'sensor.pv_day' }), pv2: { entity: 'sensor.bkw', name: 'Balkonkraftwerk', daily: 'sensor.bkw_day' } }, q.get('pv2') === 'cons' ? { groups_lines: 'sammel', consumer_groups: [
          { name: 'Küche', icon: 'mdi:stove', color: '#fb923c', items: [{ entity: 'sensor.c_kueche', name: 'Küche' }] },
          { name: 'Wohnzimmer', icon: 'mdi:sofa-outline', color: '#818cf8', items: [{ entity: 'sensor.c_wohn', name: 'Wohnzimmer' }] },
          { name: 'Büro', icon: 'mdi:desktop-classic', color: '#7dd3fc', items: [{ entity: 'sensor.c_buero', name: 'Büro' }] },
          { name: 'Technik', icon: 'mdi:server-network', color: '#34d399', items: [{ entity: 'sensor.c_technik', name: 'Technik' }] }] } : {}));
      };
    }
  }
  if (q.get('batsplit') || q.get('fc')) {
    const C = customElements.get('energy-cockpit-flow-card');
    if (C) {
      const o = C.prototype.setConfig;
      C.prototype.setConfig = function (c) {
        const n = Object.assign({}, c);
        if (q.get('batsplit')) n.battery = Object.assign({}, c.battery, { power: undefined, power_charge: 'sensor.bat_in', power_discharge: 'sensor.bat_out' });
        if (q.get('fc')) n.pv = Object.assign({}, c.pv, { forecast: 'sensor.fc_kwh' });
        return o.call(this, n);
      };
    }
  }
  // grpdemo=1: Gruppen mit mehreren, lang benannten Geräten; gc=1: groups_columns; watt=1: watt_only
  const gdemo = q.get('grpdemo'), gcq = q.get('gc'), wq = q.get('watt');
  if (gdemo || gcq || wq) {
    const C = customElements.get('energy-cockpit-flow-card');
    if (C) {
      const o = C.prototype.setConfig;
      C.prototype.setConfig = function (c) {
        const n = Object.assign({}, c);
        if (gdemo) {
          const G = [['Wohnzimmer', 'mdi:sofa-outline', '#818cf8', [['Fernseher Samsung', 84], ['Soundbar', 12], ['Stehlampe Ecke', 9], ['Router und Switch', 21]]],
            ['Küche', 'mdi:stove', '#fb923c', [['Kühlschrank', 64], ['Geschirrspüler', 1830], ['Kaffeemaschine', 0]]],
            ['Keller', 'mdi:home-floor-negative-1', '#7dd3fc', [['Waschmaschine', 0], ['Gefrierschrank Keller', 71], ['Zirkulationspumpe', 6]]],
            ['Büro', 'mdi:desktop-classic', '#34d399', [['Arbeitsplatz PC', 142], ['Server NAS', 38]]]];
          let k = 0;
          n.consumer_groups = G.map(([name, icon, color, its]) => ({ name, icon, color, items: its.map(([nm, w]) => {
            const id = 'sensor.demo_' + (k++);
            if (typeof scenes !== 'undefined') Object.values(scenes).forEach((s) => { s[id] = { state: String(w), attributes: { unit_of_measurement: 'W' } }; });
            return Object.assign({ entity: id, name: nm }, nm === 'Zirkulationspumpe' ? { on_w: 3 } : {});
          }) }));
          n.consumers = [];
        }
        if (gcq) n.groups_columns = +gcq;
        if (wq) n.watt_only = true;
        return o.call(this, n);
      };
    }
  }
  // compact=auto|immer: Kurzansicht
  const ts = q.get('textsize'), rm = q.get('restmin'), cq = q.get('compact');
  if (ts || rm || cq) {
    const C = customElements.get('energy-cockpit-flow-card');
    if (C) {
      const o = C.prototype.setConfig;
      C.prototype.setConfig = function (c) { return o.call(this, Object.assign({}, c, ts ? { text_size: ts } : {}, rm ? { rest_min: +rm } : {}, cq ? { compact: cq } : {})); };
    }
  }
  // dlg=1: Kurzansicht, Tipp auf die zweite Gruppe öffnet das Geräte-Fenster
  if (q.get('dlg')) window.addEventListener('load', () => setTimeout(() => {
    const card = document.querySelector('energy-cockpit-flow-card');
    const g = card && card.shadowRoot.querySelector(`.grp[data-k="g${+q.get('dlg') || 0}"]`);
    if (g) g.click();
  }, 800));
  if (!t) return;
  ['flow', 'devices', 'stats', 'room'].forEach((k) => {
    const C = customElements.get('energy-cockpit-' + k + '-card');
    if (!C) return;
    const o = C.prototype.setConfig;
    C.prototype.setConfig = function (c) { return o.call(this, Object.assign({}, c, { theme: t })); };
  });
})();
