"""Einmalig: feste Preise (Cent pro kWh) in allen Karten, Karten starten ohne Vorbelegung im Assistenten."""
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
    ("  const clock = (ms) =>",
     "  // Preis in Euro pro kWh: Sensor, Helfer oder Zahl, sonst fester Preis in Cent (…_ct), sonst Standardwert\n"
     "  const price = (h, v, ct, def) => { const x = val(h, v, null); if (x !== null) return x; return typeof ct === 'number' && ct >= 0 ? ct / 100 : def; };\n"
     "  const clock = (ms) =>"),
    ("return { state, setLocale, PAL, TH, rgb, num, watt, val,", "return { state, setLocale, PAL, TH, rgb, num, watt, val, price,"),
])

sub('src/flow-card.js', [
    ("const price = val(h, c.grid_price, null), feed = val(h, c.feed_in, 0);",
     "const price = WD.price(h, c.grid_price, c.grid_price_ct, null), feed = WD.price(h, c.feed_in, c.feed_in_ct, 0);"),
    ("""    return {
      pv: { entity: find(/^sensor\\..*(pv|solar).*(power|leistung)/i) },
      grid: { entity: find(/^sensor\\..*(grid|netz).*(power|leistung)/i) },
      battery: { power: find(/^sensor\\..*batter.*(power|leistung)/i), soc: find(/^sensor\\..*batter.*(soc|ladung|level)/i) },
    };""",
     """    // Bewusst leer: Die Karte startet im Einrichtungsassistenten, der Sensoren vorschlägt und den aktuellen Wert zeigt
    void find; void ids;
    return {};"""),
])

sub('src/devices-card.js', [
    ("const price = num(h, c.grid_price) || 0, feed = num(h, c.feed_in) || 0;",
     "const price = WD.price(h, c.grid_price, c.grid_price_ct, 0), feed = WD.price(h, c.feed_in, c.feed_in_ct, 0);"),
    ("const price = num(h, c.grid_price) || 0;\n      this._hasP = price > 0;\n      const CUR = cur();",
     "const price = WD.price(h, c.grid_price, c.grid_price_ct, 0);\n      this._hasP = price > 0;\n      const CUR = cur();"),
    ("if (!c.rooms || !c.rooms.length) {",
     "if (!c.rooms || !c.rooms.some((r) => r && r.devices && r.devices.length)) {"),
    ("static getStubConfig() { return { rooms: [{ name: T('dev.room'), devices: [] }] }; }",
     "static getStubConfig() { return { rooms: [] }; }"),
])

sub('src/stats-card.js', [
    ("const price = val(h, c.grid_price, 0), feed = val(h, c.feed_in, 0), CUR = cur();",
     "const price = WD.price(h, c.grid_price, c.grid_price_ct, 0), feed = WD.price(h, c.feed_in, c.feed_in_ct, 0), CUR = cur();"),
    ("""      return {
        pv_total: find(/^sensor\\..*(pv|solar|inverter).*(total|gesamt|lifetime)/i),
        grid_import_total: find(/^sensor\\..*(import|bezug|verbrauch).*(total|gesamt)/i),
        grid_export_total: find(/^sensor\\..*(export|einspeis).*(total|gesamt)/i),
      };""",
     """      // Bewusst leer: Die Karte startet im Einrichtungsassistenten
      void find; void ids;
      return {};"""),
])

sub('src/room-card.js', [
    ("return { title: 'Raum', devices: ids.filter((i) => /^sensor\\..*(energy|energie)/i.test(i)).slice(0, 2).map((i) => ({ energy: i, name: i })) };",
     "void ids;\n      return { title: 'Raum' }; // Die Karte startet im Einrichtungsassistenten"),
])

CT_FLOW = ("      { path: 'feed_in', label: 'Einspeisevergütung', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },")
CT_NEW = ("      { path: 'grid_price_ct', label: 'oder fester Strompreis (Cent pro kWh)', kind: 'number', optional: true, step: '0.1', help: 'Ohne Sensor oder Helfer: einfach den Preis aus deiner Rechnung eintragen, zum Beispiel 34.' },\n"
          "      { path: 'feed_in', label: 'Einspeisevergütung', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },\n"
          "      { path: 'feed_in_ct', label: 'oder feste Einspeisevergütung (Cent pro kWh)', kind: 'number', optional: true, step: '0.1' },")
LAB = "grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)',"
LAB_NEW = LAB + " grid_price_ct: 'oder fester Strompreis (Cent pro kWh)', feed_in_ct: 'oder feste Einspeisevergütung (Cent pro kWh)',"

sub('src/flow-editor.js', [
    ("      ent('grid_price', ['sensor', 'input_number']),\n      ent('feed_in', ['sensor', 'input_number']),\n",
     "      ent('grid_price', ['sensor', 'input_number']),\n      numb('grid_price_ct', 0, 200, 0.1),\n      ent('feed_in', ['sensor', 'input_number']),\n      numb('feed_in_ct', 0, 200, 0.1),\n"),
    (LAB, LAB_NEW),
    (CT_FLOW, CT_NEW),
    ("`Preise: ${c.grid_price ? 'Bezug gesetzt' : 'keine'}`",
     "`Preise: ${c.grid_price || typeof c.grid_price_ct === 'number' ? 'Bezug gesetzt' : 'keine'}`"),
])

NUM = "selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } }"
sub('src/stats-editor.js', [
    (LAB, LAB_NEW),
    ("      ent('grid_price', ['sensor', 'input_number']), ent('feed_in', ['sensor', 'input_number']), ent('investment', ['sensor', 'input_number']),",
     "      ent('grid_price', ['sensor', 'input_number']), { name: 'grid_price_ct', " + NUM + " },\n"
     "      ent('feed_in', ['sensor', 'input_number']), { name: 'feed_in_ct', " + NUM + " },\n"
     "      ent('investment', ['sensor', 'input_number']),"),
    (CT_FLOW, CT_NEW),
    ("`Preise: ${c.grid_price ? 'gesetzt' : 'keine'}`",
     "`Preise: ${c.grid_price || typeof c.grid_price_ct === 'number' ? 'gesetzt' : 'keine'}`"),
])

sub('src/devices-editor.js', [
    ("title: 'ed.d.title', home: 'ed.d.home', grid_price: 'ed.d.price', feed_in: 'ed.d.feed',",
     "title: 'ed.d.title', home: 'ed.d.home', grid_price: 'ed.d.price', feed_in: 'ed.d.feed', grid_price_ct: 'ed.d.price_ct', feed_in_ct: 'ed.d.feed_ct',"),
    ("txt('title'), ent('home', ['sensor']), ent('grid_price', ['sensor', 'input_number']), ent('feed_in', ['sensor', 'input_number']),",
     "txt('title'), ent('home', ['sensor']), ent('grid_price', ['sensor', 'input_number']), numb('grid_price_ct', 0, 200, 0.1), ent('feed_in', ['sensor', 'input_number']), numb('feed_in_ct', 0, 200, 0.1),"),
    ("surplus: c.surplus || '',\n        standby_w:",
     "surplus: c.surplus || '', grid_price_ct: c.grid_price_ct === undefined ? '' : c.grid_price_ct, feed_in_ct: c.feed_in_ct === undefined ? '' : c.feed_in_ct,\n        standby_w:"),
    ("        if (v.standby_w === undefined || v.standby_w === 15) delete c.standby_w;",
     "        ['grid_price_ct', 'feed_in_ct'].forEach((k) => { if (typeof v[k] === 'number') c[k] = v[k]; else delete c[k]; });\n        if (v.standby_w === undefined || v.standby_w === 15) delete c.standby_w;"),
])
print('ok')
