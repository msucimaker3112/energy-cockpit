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
  if (!t) return;
  ['flow', 'devices', 'stats', 'room'].forEach((k) => {
    const C = customElements.get('energy-cockpit-' + k + '-card');
    if (!C) return;
    const o = C.prototype.setConfig;
    C.prototype.setConfig = function (c) { return o.call(this, Object.assign({}, c, { theme: t })); };
  });
})();
