/* energy-cockpit-devices-card-editor: Räume und Geräte per Formular anlegen (ha-form je Raum und Gerät).
   Erweiterte Optionen (Kanäle, Ambilight, Zusatzverbraucher, home_energy ...) bleiben im YAML und gehen nicht verloren. */
(() => {
  const { T, setLocale } = WD;

  WD.addStrings({
    'ed.d.title': 'Titel', 'ed.d.home': 'Hausverbrauch (Leistung)', 'ed.d.price': 'Strompreis Bezug (Sensor, pro kWh)', 'ed.d.feed': 'Einspeisevergütung (Sensor, pro kWh)',
    'ed.d.surplus': 'PV-Überschuss (Leistung)', 'ed.d.standby': 'Standby-Schwelle (W)', 'ed.d.fit': 'Auf Bildschirmhöhe skalieren',
    'ed.d.nav_path': 'Weiter-Schaltfläche: Pfad', 'ed.d.nav_label': 'Weiter-Schaltfläche: Text',
    'ed.d.room': 'Raum', 'ed.d.room_name': 'Name', 'ed.d.icon': 'Symbol', 'ed.d.color': 'Farbe (z. B. 248,113,113)',
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
    _render() {
      if (!this._wrap) {
        this._wrap = document.createElement('div');
        this.appendChild(this._wrap);
      }
      this._forms = [];
      const w = this._wrap;
      w.innerHTML = '';
      if (!customElements.get('ha-form')) {
        w.textContent = 'Das Formular konnte nicht geladen werden. Bitte die Seite neu laden (Strg + F5) oder die Karte im YAML-Editor bearbeiten.';
        return;
      }
      const c = this._c;
      const lbl = {
        title: 'ed.d.title', home: 'ed.d.home', grid_price: 'ed.d.price', feed_in: 'ed.d.feed', surplus: 'ed.d.surplus', standby_w: 'ed.d.standby',
        fit_screen: 'ed.d.fit', nav_path: 'ed.d.nav_path', nav_label: 'ed.d.nav_label', icon: 'ed.d.icon', color: 'ed.d.color', type: 'ed.d.type',
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
      w.appendChild(top);

      // Räume und Geräte
      c.rooms.forEach((room, ri) => {
        const box = document.createElement('div');
        box.style.cssText = 'margin:16px 0;padding:12px;border:1px solid var(--divider-color,#444);border-radius:12px';
        const head = document.createElement('div');
        head.style.cssText = 'font-weight:600;margin-bottom:6px';
        head.textContent = `${T('ed.d.room')} ${ri + 1}`;
        box.appendChild(head);
        box.appendChild(this._form([txt('name'), { name: 'icon', selector: { icon: {} } }, txt('color')],
          { name: room.name || '', icon: room.icon || '', color: room.color || '' },
          (v) => { Object.assign(room, prune({ name: v.name, icon: v.icon, color: v.color })); ['name', 'icon', 'color'].forEach((k) => { if (!v[k]) delete room[k]; }); this._emit(); }, label));
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
