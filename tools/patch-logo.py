"""Einmalig: Logo-Unterstützung (Option `image`) für Gruppen, Verbraucher, Räume und Geräte."""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent


def sub(path, old, new):
    p = root / 'src' / path
    s = p.read_text(encoding='utf-8')
    assert old in s, f'{path}: nicht gefunden: {old[:70]!r}'
    p.write_text(s.replace(old, new, 1), encoding='utf-8')


# --- Energiefluss: Gruppen und Einzelverbraucher
sub('flow-card.js',
    "          <div class=\"g-hd\"><span class=\"ico\"><ha-icon icon=\"${g.icon || 'mdi:door'}\"></ha-icon></span><span class=\"lbl\">${g.name || ''}</span></div>",
    "          <div class=\"g-hd\">${g.image ? `<span class=\"ico logo\"><img src=\"${esc(g.image)}\" alt=\"\"></span>` : `<span class=\"ico\"><ha-icon icon=\"${g.icon || 'mdi:door'}\"></ha-icon></span>`}<span class=\"lbl\">${g.name || ''}</span></div>")
sub('flow-card.js',
    "        <span class=\"ico\"><ha-icon icon=\"${x.icon || 'mdi:power-plug'}\"></ha-icon></span>",
    "        ${x.image ? `<span class=\"ico logo\"><img src=\"${esc(x.image)}\" alt=\"\"></span>` : `<span class=\"ico\"><ha-icon icon=\"${x.icon || 'mdi:power-plug'}\"></ha-icon></span>`}")
sub('flow-card.js',
    "@media (prefers-reduced-motion:reduce){.flow,.orbit,.core,.node.on,.live,.cons.on .ico{animation-duration:0s!important}}",
    ".ico.logo,.grp .ico.logo{width:auto;height:auto;min-width:0;background:none;box-shadow:none;border-radius:6px}\n"
    ".ico.logo img{display:block;height:28px;max-width:96px;object-fit:contain;border-radius:5px}\n"
    ".cons .ico.logo img{height:30px;max-width:80px}\n"
    "@media (prefers-reduced-motion:reduce){.flow,.orbit,.core,.node.on,.live,.cons.on .ico{animation-duration:0s!important}}")

# --- Geräte: Raum-Logo und Geräte-Logo
sub('devices-card.js',
    "            <div class=\"rh\"><ha-icon icon=\"${esc(x.r.icon || 'mdi:door')}\"></ha-icon><b>${esc(x.r.name)}</b><span class=\"rw\"></span></div>",
    "            <div class=\"rh\">${x.r.image ? `<img class=\"rlogo\" src=\"${esc(x.r.image)}\" alt=\"\">` : `<ha-icon icon=\"${esc(x.r.icon || 'mdi:door')}\"></ha-icon>`}<b>${esc(x.r.name)}</b><span class=\"rw\"></span></div>")
sub('devices-card.js',
    "<ha-icon icon=\"${esc(d.icon || t.i)}\"></ha-icon></div>",
    "${d.image ? `<img class=\"dlogo\" src=\"${esc(d.image)}\" alt=\"\">` : `<ha-icon icon=\"${esc(d.icon || t.i)}\"></ha-icon>`}</div>")
sub('devices-card.js',
    "@media (prefers-reduced-motion:reduce){*{animation:none!important}.room{opacity:1;transform:none}}",
    ".rlogo{height:22px;max-width:76px;object-fit:contain;border-radius:5px;margin-right:8px;flex:none}\n"
    ".dlogo{width:78%;height:78%;object-fit:contain;border-radius:6px}\n"
    "@media (prefers-reduced-motion:reduce){*{animation:none!important}.room{opacity:1;transform:none}}")

# --- Editor: Feld "Logo" bei Gruppen, Verbrauchern (Formular), Räumen und Geräten
sub('flow-editor.js',
    "    secondary: 'Zusatzwert (Sensor, z. B. Temperatur)', color: 'Farbe (z. B. #a78bfa)',",
    "    secondary: 'Zusatzwert (Sensor, z. B. Temperatur)', color: 'Farbe (z. B. #a78bfa)', image: 'Logo (Bild-URL, ersetzt das Symbol)',")
sub('flow-editor.js',
    "  const consumerFields = () => [ent('entity', ['sensor']), txt('name'), { name: 'icon', selector: { icon: {} } }, txt('color'), ent('secondary', ['sensor'])];",
    "  const consumerFields = () => [ent('entity', ['sensor']), txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'), ent('secondary', ['sensor'])];")
sub('flow-editor.js',
    "    txt('name'), { name: 'icon', selector: { icon: {} } }, txt('color'),\n    sec('items',",
    "    txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'),\n    sec('items',")

sub('devices-editor.js',
    "'ed.d.color': 'Farbe (z. B. 248,113,113)',",
    "'ed.d.color': 'Farbe (z. B. 248,113,113)', 'ed.d.image': 'Logo (Bild-URL, ersetzt das Symbol)',")
sub('devices-editor.js',
    "fit_screen: 'ed.d.fit', nav_path: 'ed.d.nav_path', nav_label: 'ed.d.nav_label', icon: 'ed.d.icon', color: 'ed.d.color', type: 'ed.d.type',",
    "fit_screen: 'ed.d.fit', nav_path: 'ed.d.nav_path', nav_label: 'ed.d.nav_label', icon: 'ed.d.icon', color: 'ed.d.color', image: 'ed.d.image', type: 'ed.d.type',")
sub('devices-editor.js',
    "box.appendChild(this._form([txt('name'), { name: 'icon', selector: { icon: {} } }, txt('color')],\n          { name: room.name || '', icon: room.icon || '', color: room.color || '' },\n          (v) => { Object.assign(room, prune({ name: v.name, icon: v.icon, color: v.color })); ['name', 'icon', 'color'].forEach((k) => { if (!v[k]) delete room[k]; }); this._emit(); }, label));",
    "box.appendChild(this._form([txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color')],\n          { name: room.name || '', icon: room.icon || '', image: room.image || '', color: room.color || '' },\n          (v) => { Object.assign(room, prune({ name: v.name, icon: v.icon, image: v.image, color: v.color })); ['name', 'icon', 'image', 'color'].forEach((k) => { if (!v[k]) delete room[k]; }); this._emit(); }, label));")
print('ok')
