// Testhilfe: ?theme=hell setzt das Farbschema aller Karten der Seite
(() => {
  const q = new URLSearchParams(location.search);
  const t = q.get('theme');
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
  if (!t) return;
  ['flow', 'devices', 'stats', 'room'].forEach((k) => {
    const C = customElements.get('energy-cockpit-' + k + '-card');
    if (!C) return;
    const o = C.prototype.setConfig;
    C.prototype.setConfig = function (c) { return o.call(this, Object.assign({}, c, { theme: t })); };
  });
})();
