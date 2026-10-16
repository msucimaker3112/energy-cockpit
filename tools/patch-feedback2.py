"""v0.9.1: Prognose in kWh (Tagesprognose) richtig anzeigen, getrennte Lade-/Entladesensoren der Batterie."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:70]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


sub('src/common.js', [
    ("    return u === 'kW' ? v * 1000 : u === 'MW' ? v * 1e6 : v;\n  };",
     "    const ul = String(u).toLowerCase();\n    return ul === 'kw' ? v * 1000 : ul === 'mw' ? v * 1e6 : v;\n  };"),
])

sub('src/flow-card.js', [
    ("      const fc = c.pv.forecast ? watt(h, c.pv.forecast) : null;\n      if (fc !== null) parts.push(`${T('forecast')} <b>${fW(fc)}</b>`);",
     "      // Prognose: Leistung (W, kW) oder Tagesprognose in kWh (z. B. Solcast \"heute\")\n"
     "      const fst = c.pv.forecast ? h.states[c.pv.forecast] : null;\n"
     "      const fUnit = fst ? String(fst.attributes.unit_of_measurement || '') : '';\n"
     "      if (/^(k|m)?wh$/i.test(fUnit)) {\n"
     "        const e = num(h, c.pv.forecast);\n"
     "        const kwh = e === null ? null : /^mwh$/i.test(fUnit) ? e * 1000 : /^kwh$/i.test(fUnit) ? e : e / 1000;\n"
     "        if (kwh !== null) parts.push(`${T('forecast.day')} <b>${fKwh(kwh)} kWh</b>`);\n"
     "      } else {\n"
     "        const fc = c.pv.forecast ? watt(h, c.pv.forecast) : null;\n"
     "        if (fc !== null) parts.push(`${T('forecast')} <b>${fW(fc)}</b>`);\n"
     "      }"),
    ("    let bat = c.battery ? watt(h, c.battery.power) : null;\n",
     "    let bat = c.battery ? watt(h, c.battery.power) : null;\n"
     "    // Getrennte Sensoren für Laden und Entladen (z. B. SunEnergyXT): Laden positiv, Entladen negativ\n"
     "    if (c.battery && !c.battery.power && (c.battery.power_charge || c.battery.power_discharge)) {\n"
     "      const pc = c.battery.power_charge ? watt(h, c.battery.power_charge) : null, pd = c.battery.power_discharge ? watt(h, c.battery.power_discharge) : null;\n"
     "      bat = pc === null && pd === null ? null : (pc || 0) - (pd || 0);\n"
     "    }\n"),
    ("PAL.bat, c.battery.power,", "PAL.bat, c.battery.power || c.battery.power_charge || c.battery.power_discharge,"),
])

sub('src/i18n.js', [
    ("'forecast': 'Prognose',", "'forecast': 'Prognose', 'forecast.day': 'Prognose heute',"),
])

sub('src/flow-editor.js', [
    ("      { path: 'pv.forecast', label: 'Prognose der Leistung (z. B. Solcast)', kind: 'power', optional: true, hints: H(/forecast|prognose|solcast/i) },",
     "      { path: 'pv.forecast', label: 'Prognose (z. B. Solcast, Leistung in W/kW)', kind: 'power', optional: true, hints: H(/forecast|prognose|solcast/i), help: 'Eine Tagesprognose in kWh (Solcast \"Prognose heute\") wählst du im Formular, sie wird als kWh angezeigt.' },"),
    ("      { path: 'battery.power', label: 'Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i) },\n",
     "      { path: 'battery.power', label: 'Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i) },\n"
     "      { path: 'battery.power_charge', label: 'oder getrennt: Ladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|input|eingang/i), help: 'Nur wenn dein System zwei Sensoren hat (Laden und Entladen getrennt). Dann das Feld oben leer lassen.' },\n"
     "      { path: 'battery.power_discharge', label: 'oder getrennt: Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /entlade|discharge|output|ausgang/i) },\n"),
    ("ent('power', ['sensor']), ent('soc', ['sensor']),", "ent('power', ['sensor']), ent('power_charge', ['sensor']), ent('power_discharge', ['sensor']), ent('soc', ['sensor']),"),
    ("    power: 'Sensor Lade-/Entladeleistung',", "    power_charge: 'oder getrennt: Ladeleistung (Sensor)', power_discharge: 'oder getrennt: Entladeleistung (Sensor)', power: 'Sensor Lade-/Entladeleistung',"),
    ("forecast: 'Prognose (Leistung)',", "forecast: 'Prognose (Leistung in W/kW oder Tagesprognose in kWh)',"),
])

sub('docs/KONFIGURATION.md', [
    ("| `battery.power` | Sensor | Laden positiv, Entladen negativ |",
     "| `battery.power` | Sensor | Laden positiv, Entladen negativ |\n"
     "| `battery.power_charge`, `battery.power_discharge` | Sensoren | Statt `power`: zwei getrennte Sensoren für Laden und Entladen (beide positiv). Die Karte rechnet Laden minus Entladen |\n"
     "| `pv.forecast` | Sensor | Prognose in W/kW (zeigt \"Prognose 6,0 kW\") oder Tagesprognose in kWh (zeigt \"Prognose heute 6,0 kWh\"), z. B. Solcast |"),
])

c = R / 'CHANGELOG.md'
u = c.read_text(encoding='utf-8')
u = u.replace("# Änderungsprotokoll\n", """# Änderungsprotokoll

## 0.9.1
- **Prognose in kWh:** Ein Prognose-Sensor mit der Einheit kWh (zum Beispiel Solcast "Prognose heute") wird jetzt als "Prognose heute 6,0 kWh" angezeigt. Vorher erschien aus 6 kWh fälschlich "6 W". Einheiten werden außerdem unabhängig von der Groß-/Kleinschreibung erkannt.
- **Batterie mit zwei Sensoren:** neue Optionen `battery.power_charge` und `battery.power_discharge` für Systeme, die Laden und Entladen getrennt melden (zum Beispiel SunEnergyXT). Im Assistenten (Schritt *Batterie*) und im Formular.
""", 1)
c.write_text(u, encoding='utf-8')
pk = R / 'package.json'
pk.write_text(pk.read_text(encoding='utf-8').replace('"version": "0.9.0"', '"version": "0.9.1"'), encoding='utf-8')
hd = R / 'docs' / 'handout.html'
hd.write_text(hd.read_text(encoding='utf-8').replace('Version 0.9.0', 'Version 0.9.1'), encoding='utf-8')

# Testszene und Testparameter
t = R / 'test' / 'flow.html'
u = t.read_text(encoding='utf-8')
if "'sensor.fc_kwh'" not in u:
    u = u.replace("bkw:{'sensor.c_kueche'", "bkw:{'sensor.fc_kwh':S(6,{unit_of_measurement:'kWh'}),'sensor.bat_in':S(0),'sensor.bat_out':S(152),'sensor.c_kueche'", 1)
    t.write_text(u, encoding='utf-8')
h = R / 'test' / '_theme.js'
s = h.read_text(encoding='utf-8')
if 'batsplit' not in s:
    s = s.replace("  const ts = q.get('textsize'), rm = q.get('restmin');", """  if (q.get('batsplit') || q.get('fc')) {
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
  const ts = q.get('textsize'), rm = q.get('restmin');""", 1)
    h.write_text(s, encoding='utf-8')
print('ok')
