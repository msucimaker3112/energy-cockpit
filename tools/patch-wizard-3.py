"""Einmalig: Geräte-Editor bekommt einen Assistenten, der Räume und Geräte aus den Bereichen von Home Assistant vorschlägt."""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
p = root / 'src' / 'devices-editor.js'
s = p.read_text(encoding='utf-8')

IMPORTER = r'''
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
'''

old = "  const TYPES = ['plug',"
assert old in s
s = s.replace(old, IMPORTER + "\n" + old, 1)

ASSIST = r'''      // Assistent: Räume und Geräte aus den Bereichen vorschlagen
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
'''
old = "      w.appendChild(top);"
assert old in s
s = s.replace(old, ASSIST + old, 1)
p.write_text(s, encoding='utf-8')

# Karte: Geräte ohne Schalter (entity ist ein Sensor) gelten als "an", wenn die Leistung über der Laufschwelle liegt
c = root / 'src' / 'devices-card.js'
t = c.read_text(encoding='utf-8')
old = "      const s = h.states[d.entity];\n      return !!s && s.state === 'on';"
assert old in t
new = """      if (d.entity && d.entity.indexOf('sensor.') === 0) {
        const pw = num(h, d.power || d.entity);
        return pw !== null && pw > (d.run_w === undefined ? 3 : d.run_w);
      }
      const s = h.states[d.entity];
      return !!s && s.state === 'on';"""
c.write_text(t.replace(old, new, 1), encoding='utf-8')
print('ok')
