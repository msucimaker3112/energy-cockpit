"""v0.8.1: PV-Aufteilung (Haus, Batterie, Netz) in der PV-Kachel, Autarkie/Eigenverbrauch als 'jetzt' benannt."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:70]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


sub('src/flow-card.js', [
    ("      const parts = (c.pv.strings || []).map((s) => `${s.name || s.entity} <b>${fW(watt(h, s.entity))}</b>`);",
     "      const parts = [];\n"
     "      // Wohin die erzeugte Leistung geht: Haus, Batterie, Netz\n"
     "      if (on) {\n"
     "        const use = [];\n"
     "        if (pvHome > TH) use.push(`${T('pv.use.home')} <b>${fW(pvHome)}</b>`);\n"
     "        const toBat = Math.min(bChg, Math.max(0, (pv || 0) - pvHome));\n"
     "        if (toBat > TH) use.push(`${T('pv.use.bat')} <b>${fW(toBat)}</b>`);\n"
     "        if (gExp > TH) use.push(`${T('pv.use.grid')} <b>${fW(gExp)}</b>`);\n"
     "        if (use.length) parts.push('→ ' + use.join(' · '));\n"
     "      }\n"
     "      (c.pv.strings || []).forEach((s) => parts.push(`${s.name || s.entity} <b>${fW(watt(h, s.entity))}</b>`));"),
])
sub('src/i18n.js', [
    ("'pill.aut': 'Autarkie', 'pill.self': 'Eigenverbrauch',",
     "'pill.aut': 'Autarkie jetzt', 'pill.self': 'Eigenverbrauch jetzt', 'pv.use.home': 'Haus', 'pv.use.bat': 'Batterie', 'pv.use.grid': 'Netz',"),
])

# Testseite: Szene "morgen" mit kleinen Werten (Watt), Aufruf mit ?scene=morgen
t = R / 'test' / 'flow.html'
u = t.read_text(encoding='utf-8')
if "morgen:" not in u:
    u = u.replace(" nobat:{", " morgen:{'sensor.pv':S(81),'sensor.grid':S(189),'sensor.bat':S(0),'sensor.soc':S(5,{unit_of_measurement:'%'}),'sensor.home':S(270),'sensor.pv_day':S(1.1,{unit_of_measurement:'kWh'}),'sensor.imp_day':S(1.6,{unit_of_measurement:'kWh'}),'sensor.exp_day':S(0,{unit_of_measurement:'kWh'}),'sensor.wp':S(34),'input_number.price':S(0.34,{unit_of_measurement:'€/kWh'}),'input_number.feed':S(0.08,{unit_of_measurement:'€/kWh'})},\n nobat:{", 1)
    u = u.replace("mount(cfg);\n// Surplus banner", "mount(cfg);\nif (new URLSearchParams(location.search).get('scene')) scen(new URLSearchParams(location.search).get('scene'));\n// Surplus banner", 1)
    t.write_text(u, encoding='utf-8')

pk = R / 'package.json'
pk.write_text(pk.read_text(encoding='utf-8').replace('"version": "0.8.0"', '"version": "0.8.1"'), encoding='utf-8')
hd = R / 'docs' / 'handout.html'
hd.write_text(hd.read_text(encoding='utf-8').replace('Version 0.8.0', 'Version 0.8.1'), encoding='utf-8')
print('ok')
