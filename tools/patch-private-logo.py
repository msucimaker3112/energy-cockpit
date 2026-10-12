"""Einmalig: Logo-Option `image` in die PRIVATEN Karten (energy-flow-pro-card, devices-card) einbauen.
Arbeitet auf Kopien im Scratchpad, die Originale bleiben als .v172 / .v140 erhalten."""
import pathlib
import shutil

sp = pathlib.Path(r'C:\Users\fstei\AppData\Local\Temp\claude\C--Users-fstei-Documents-Viking\b862c7e4-1ea4-4513-b4d0-b42531c950dd\scratchpad')


def patch(name, backup, edits):
    p = sp / name
    b = sp / backup
    if not b.exists():
        shutil.copy(p, b)
    s = b.read_text(encoding='utf-8')  # immer vom Original ausgehen
    for old, new in edits:
        assert s.count(old) == 1, f'{name}: {s.count(old)}x gefunden: {old[:70]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')
    print('ok', name, len(s))


patch('energy-flow-pro-card.js', 'energy-flow-pro-card.v172.js', [
    ("/* energy-flow-pro-card v1.7.2 – tablet-safe (no color-mix / container queries) */\nconst TH = 10;",
     "/* energy-flow-pro-card v1.8.0 – tablet-safe (no color-mix / container queries), Logo-Option image */\nconst TH = 10;\nconst escA = (s) => String(s).replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/</g, '&lt;');"),
    ("<span class=\"ico\"><ha-icon icon=\"${x.icon || 'mdi:power-plug'}\"></ha-icon></span>",
     "${x.image ? `<span class=\"ico logo\"><img src=\"${escA(x.image)}\" alt=\"\"></span>` : `<span class=\"ico\"><ha-icon icon=\"${x.icon || 'mdi:power-plug'}\"></ha-icon></span>`}"),
    ("<div class=\"g-hd\"><span class=\"ico\"><ha-icon icon=\"${g.icon || 'mdi:door'}\"></ha-icon></span><span class=\"lbl\">${g.name || ''}</span></div>",
     "<div class=\"g-hd\">${g.image ? `<span class=\"ico logo\"><img src=\"${escA(g.image)}\" alt=\"\"></span>` : `<span class=\"ico\"><ha-icon icon=\"${g.icon || 'mdi:door'}\"></ha-icon></span>`}<span class=\"lbl\">${g.name || ''}</span></div>"),
    ("@media (prefers-reduced-motion:reduce){.flow,.orbit,.core,.node.on,.live,.cons.on .ico{animation-duration:0s!important}}",
     ".ico.logo,.grp .ico.logo{width:auto;height:auto;min-width:0;background:none;box-shadow:none;border-radius:6px}\n"
     ".ico.logo img{display:block;height:28px;max-width:96px;object-fit:contain;border-radius:5px}\n"
     ".cons .ico.logo img{height:30px;max-width:80px}\n"
     "@media (prefers-reduced-motion:reduce){.flow,.orbit,.core,.node.on,.live,.cons.on .ico{animation-duration:0s!important}}"),
])

patch('devices-card.js', 'devices-card.v140.js', [
    ("/* devices-card v1.4.0 –", "/* devices-card v1.5.0 (Logo-Option image) –"),
    ("<div class=\"rh\"><ha-icon icon=\"${esc(x.r.icon || 'mdi:door')}\"></ha-icon><b>${esc(x.r.name)}</b><span class=\"rw\"></span></div>",
     "<div class=\"rh\">${x.r.image ? `<img class=\"rlogo\" src=\"${esc(x.r.image)}\" alt=\"\">` : `<ha-icon icon=\"${esc(x.r.icon || 'mdi:door')}\"></ha-icon>`}<b>${esc(x.r.name)}</b><span class=\"rw\"></span></div>"),
    ("<ha-icon icon=\"${esc(d.icon || t.i)}\"></ha-icon></div>",
     "${d.image ? `<img class=\"dlogo\" src=\"${esc(d.image)}\" alt=\"\">` : `<ha-icon icon=\"${esc(d.icon || t.i)}\"></ha-icon>`}</div>"),
    ("@media (prefers-reduced-motion:reduce){*{animation:none!important}.room{opacity:1;transform:none}}",
     ".rlogo{height:22px;max-width:76px;object-fit:contain;border-radius:5px;margin-right:8px;flex:none}\n"
     ".dlogo{width:78%;height:78%;object-fit:contain;border-radius:6px}\n"
     "@media (prefers-reduced-motion:reduce){*{animation:none!important}.room{opacity:1;transform:none}}"),
])
