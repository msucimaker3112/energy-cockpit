// Testhilfe: ?theme=hell setzt das Farbschema aller Karten der Seite
(() => {
  const t = new URLSearchParams(location.search).get('theme');
  if (!t) return;
  ['flow', 'devices', 'stats', 'room'].forEach((k) => {
    const C = customElements.get('energy-cockpit-' + k + '-card');
    if (!C) return;
    const o = C.prototype.setConfig;
    C.prototype.setConfig = function (c) { return o.call(this, Object.assign({}, c, { theme: t })); };
  });
})();
