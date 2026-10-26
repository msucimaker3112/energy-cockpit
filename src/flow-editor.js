/* Editor der Energiefluss-Karte: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const ent = (name, domains) => ({ name, selector: { entity: domains ? { domain: domains } : {} } });
  const txt = (name) => ({ name, selector: { text: {} } });
  const bool = (name, def) => ({ name, default: def, selector: { boolean: {} } });
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step || 1, mode: 'box' } } });
  const sec = (name, title, schema) => ({ type: 'expandable', name, title, schema });

  const LABELS = {
    title: 'Titel', name: 'Anzeigename', icon: 'Symbol',
    entity: 'Sensor (Leistung)', daily: 'Tagesertrag (kWh)', forecast: 'Prognose (Leistung in W/kW oder Tagesprognose in kWh)',
    invert: 'Vorzeichen umkehren', daily_import: 'Bezug heute (kWh)', daily_export: 'Einspeisung heute (kWh)',
    power_charge: 'oder getrennt: Ladeleistung (Sensor)', power_discharge: 'oder getrennt: Entladeleistung (Sensor)', power: 'Sensor Lade-/Entladeleistung', soc: 'Sensor Ladestand (%)', capacity_kwh: 'Kapazität (kWh)',
    reserve_soc: 'Entladegrenze (Sensor oder Helfer, %)', max_soc: 'Maximalladung (Sensor oder Helfer, %)', groups_lines: 'Linien zu den Verbrauchern', hide_rest: 'Kachel "Nicht erfasst" ausblenden', add_to_home: 'Hausverbrauch enthält die zweite Anlage nicht', rest_min: 'Kachel "Nicht erfasst" erst ab (%)', text_size: 'Textgröße', reserve_pct: 'oder feste Entladegrenze (%)', max_pct: 'oder feste Maximalladung (%)', soc_display: 'Ladestand anzeigen als', tap: 'Klick auf die Batterie-Kachel öffnet',
    daily_charge: 'Geladen heute (kWh)', daily_discharge: 'Entladen heute (kWh)',
    grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)', grid_price_ct: 'oder fester Strompreis (Cent pro kWh)', theme: 'Farbschema', accent: 'Akzentfarbe (z. B. 34,197,94 oder #22c55e)', feed_in_ct: 'oder feste Einspeisevergütung (Cent pro kWh)',
    show_clock: 'Uhr anzeigen', compact: 'Kurzansicht (kompakt)', watt_only: 'Leistung immer in Watt (nie kW)', groups_columns: 'Gruppen pro Reihe (leer = alle nebeneinander)', on_w: 'Aktiv ab (W, Standard 10)', fit_screen: 'Auf Bildschirmhöhe skalieren',
    nav_path: 'Weiter-Schaltfläche: Pfad (z. B. /lovelace/geraete)', nav_label: 'Weiter-Schaltfläche: Text',
    secondary: 'Zusatzwert (Sensor, z. B. Temperatur)', color: 'Farbe (z. B. #a78bfa)', image: 'Logo (Bild-URL, ersetzt das Symbol)',
  };

  const COMPACT = [{ value: 'aus', label: 'Aus: ausführliche Ansicht (Standard)' }, { value: 'auto', label: 'Nur auf dem Handy' }, { value: 'immer', label: 'Immer' }];

  // Listen als Platzhalter-Abschnitte "0", "1", ...: Home Assistant speichert sie als Objekt, die Karte macht daraus wieder eine Liste
  const slots = (n, titleOf, schemaOf) => Array.from({ length: n }, (_, i) => sec(String(i), titleOf(i + 1), schemaOf(i)));
  const consumerFields = () => [ent('entity', ['sensor']), txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'), ent('secondary', ['sensor']), numb('on_w', 0, 100000, 1)];
  const itemFields = () => [ent('entity', ['sensor']), txt('name'), ent('secondary', ['sensor']), numb('on_w', 0, 100000, 1)];
  const groupFields = () => [
    txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'), numb('on_w', 0, 100000, 1),
    sec('items', 'Verbraucher der Gruppe', slots(10, (n) => `Verbraucher ${n}`, itemFields)),
  ];

  WD.flowForm = () => ({
    schema: [
      txt('title'),
      sec('pv', 'Solar', [ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor']), ent('forecast', ['sensor'])]),
      sec('pv2', 'Zweite Solaranlage (z. B. Balkonkraftwerk)', [ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor']), bool('add_to_home', false)]),
      sec('grid', 'Netz', [ent('entity', ['sensor']), txt('name'), bool('invert', false), ent('daily_import', ['sensor']), ent('daily_export', ['sensor'])]),
      sec('battery', 'Batterie', [
        ent('power', ['sensor']), ent('power_charge', ['sensor']), ent('power_discharge', ['sensor']), ent('soc', ['sensor']), txt('name'), bool('invert', false),
        numb('capacity_kwh', 0, 200, 0.1), ent('reserve_soc', ['sensor', 'number', 'input_number']), numb('reserve_pct', 0, 100, 1),
        ent('max_soc', ['sensor', 'number', 'input_number']), numb('max_pct', 0, 100, 1),
        { name: 'tap', selector: { select: { mode: 'dropdown', options: [{ value: 'power', label: 'Verlauf der Lade-/Entladeleistung (Standard)' }, { value: 'soc', label: 'Verlauf des Ladestands in %' }] } } },
      { name: 'soc_display', selector: { select: { mode: 'dropdown', options: [{ value: 'brutto', label: 'Ladestand der Batterie (Standard)' }, { value: 'nutzbar', label: 'Nutzbarer Anteil (0 % = Entladegrenze)' }] } } },
        ent('daily_charge', ['sensor']), ent('daily_discharge', ['sensor']),
      ]),
      sec('home', 'Haus (optional)', [ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor'])]),
      sec('consumers', 'Einzelverbraucher (bis zu 12)', slots(12, (n) => `Verbraucher ${n}`, consumerFields)),
      sec('consumer_groups', 'Gruppen (bis zu 10)', slots(10, (n) => `Gruppe ${n}`, groupFields)),
      ent('grid_price', ['sensor', 'input_number']),
      numb('grid_price_ct', 0, 200, 0.1),
      ent('feed_in', ['sensor', 'input_number']),
      numb('feed_in_ct', 0, 200, 0.1),
      bool('show_clock', true),
      bool('fit_screen', true),
      bool('watt_only', false),
      bool('hide_rest', false),
      numb('groups_columns', 1, 12, 1),
      numb('rest_min', 0, 100, 1),
      { name: 'compact', selector: { select: { mode: 'dropdown', options: COMPACT } } },
      { name: 'text_size', selector: { select: { mode: 'dropdown', options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }] } } },
      { name: 'groups_lines', selector: { select: { mode: 'dropdown', options: [{ value: 'direkt', label: 'Eine Linie je Gerät oder Gruppe (Standard)' }, { value: 'sammel', label: 'Eine Sammel-Linie zum ganzen Verbraucherbereich' }] } } },
      { name: 'theme', selector: { select: { mode: 'dropdown', options: WD.THEME_OPTIONS } } },
      txt('nav_path'),
      txt('nav_label'),
    ],
    computeLabel: (s) => LABELS[s.name] || s.title || s.name,
    computeHelper: (s) => (s.name === 'title' ? 'Abfallkalender, Überschussvorschläge und Netzalarm stellst du im YAML-Editor ein.' : undefined),
  });

  // Assistent: Schritte mit Sensor-Vorschlägen
  const H = (...re) => re;
  const steps = () => [
    { short: 'Solar', title: 'Solaranlage', text: 'Wähle den Sensor, der die aktuelle Erzeugung der PV-Anlage in Watt anzeigt.', fields: [
      { path: 'pv.entity', label: 'PV-Leistung', kind: 'power', hints: H(/pv|solar|photovolt|inverter|wechselrichter|erzeugung/i, /input|eingang|power|leistung/i) },
      { path: 'pv.daily', label: 'Tagesertrag (kWh)', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute|yield|ertrag/i, /pv|solar|inverter/i) },
      { path: 'pv.forecast', label: 'Prognose (z. B. Solcast, Leistung in W/kW)', kind: 'power', optional: true, hints: H(/forecast|prognose|solcast/i), help: 'Eine Tagesprognose in kWh (Solcast "Prognose heute") wählst du im Formular, sie wird als kWh angezeigt.' },
      { path: 'pv2.entity', label: 'Zweite Anlage, z. B. Balkonkraftwerk (Leistung)', kind: 'power', optional: true, hints: H(/bkw|balkon|pv2|solar2|plug|steckdose|shelly/i), help: 'Eigene Kachel und Linie. Die Bilanz (Autarkie, Eigenverbrauch, Herkunft) rechnet mit der Summe beider Anlagen.' },
      { path: 'pv2.name', label: 'Name der zweiten Anlage', kind: 'text', optional: true },
      { path: 'pv2.daily', label: 'Tagesertrag der zweiten Anlage (kWh)', kind: 'energy', optional: true },
      { path: 'pv2.add_to_home', label: 'Hausverbrauch enthält die zweite Anlage nicht', kind: 'bool', help: 'Nur aktivieren, wenn dein Hausverbrauchs-Sensor den Ertrag der zweiten Anlage NICHT enthält. Dann addiert die Karte ihn dazu.' },
    ] },
    { short: 'Netz', title: 'Stromnetz', text: 'Der Netzsensor zeigt Bezug und Einspeisung. Wenn später Bezug als Einspeisung angezeigt wird, setze "Vorzeichen umkehren".', fields: [
      { path: 'grid.entity', label: 'Netzleistung', kind: 'power', hints: H(/grid|netz|meter|zähler|zaehler|wirkleistung|smart.?meter/i, /power|leistung/i) },
      { path: 'grid.invert', label: 'Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn der Sensor bei Einspeisung positive Werte liefert.' },
      { path: 'grid.daily_import', label: 'Netzbezug heute (kWh)', kind: 'energy', optional: true, hints: H(/import|bezug|verbrauch|consumption/i, /tag|daily|today|heute/i) },
      { path: 'grid.daily_export', label: 'Einspeisung heute (kWh)', kind: 'energy', optional: true, hints: H(/export|einspeis|feed/i, /tag|daily|today|heute/i) },
    ] },
    { short: 'Batterie', title: 'Batteriespeicher', text: 'Überspringen, wenn du keine Batterie hast.', fields: [
      { path: 'battery.power', label: 'Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i) },
      { path: 'battery.power_charge', label: 'oder getrennt: Ladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|input|eingang/i), help: 'Nur wenn dein System zwei Sensoren hat (Laden und Entladen getrennt). Dann das Feld oben leer lassen.' },
      { path: 'battery.power_discharge', label: 'oder getrennt: Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /entlade|discharge|output|ausgang/i) },
      { path: 'battery.soc', label: 'Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level|batterieladung/i, /batter|akku/i) },
      { path: 'battery.reserve_soc', label: 'Entladegrenze der Batterie (Sensor oder Helfer, %)', kind: 'percent', optional: true, help: 'Bis zu diesem Ladestand wird die Batterie entladen. Viele Wechselrichter bieten dafür eine Zahl-Entität an (zum Beispiel "Entlade-Ende-Ladestand"). Die Karte zeigt die Grenze auf dem Ladebalken und rechnet die nutzbare Kapazität.', hints: H(/entlad|reserve|min.*soc|discharge.*(end|cut|limit)|ende/i, /soc|ladestand|ladung/i) },
      { path: 'battery.reserve_pct', label: 'oder feste Entladegrenze (%)', kind: 'number', optional: true, step: '1', help: 'Zum Beispiel 10, wenn die Batterie nur bis 10 % entladen wird.' },
      { path: 'battery.max_soc', label: 'Maximalladung der Batterie (Sensor oder Helfer, %)', kind: 'percent', optional: true, hints: H(/lade.*ende|max|charge.*(end|cut|limit)|ende/i, /soc|ladestand|ladung/i) },
      { path: 'battery.max_pct', label: 'oder feste Maximalladung (%)', kind: 'number', optional: true, step: '1' },
      { path: 'battery.soc_display', label: 'Ladestand anzeigen als', kind: 'choice', options: [{ value: 'brutto', label: 'Ladestand der Batterie (Standard)' }, { value: 'nutzbar', label: 'Nutzbarer Anteil (0 % = Entladegrenze)' }] },
      { path: 'battery.invert', label: 'Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn Laden negativ und Entladen positiv gemeldet wird.' },
      { path: 'battery.capacity_kwh', label: 'Kapazität (kWh)', kind: 'number', optional: true, help: 'Für die Prognose "voll um / reicht bis".' },
    ] },
    { short: 'Haus', title: 'Hausverbrauch', text: 'Optional. Ohne Angabe wird der Verbrauch aus Solar, Netz und Batterie berechnet.', fields: [
      { path: 'home.entity', label: 'Hausverbrauch', kind: 'power', optional: true, hints: H(/haus|home|house|verbrauch|consumption|load/i) },
      { path: 'home.daily', label: 'Hausverbrauch heute (kWh)', kind: 'energy', optional: true, help: 'Optional. Ohne Angabe berechnet die Karte den Wert aus PV-Ertrag, Netzbezug, Einspeisung und Batterie heute.' },
    ] },
    { short: 'Verbraucher', title: 'Einzelverbraucher', text: 'Wähle Geräte mit eigenem Leistungssensor, zum Beispiel Wärmepumpe, Wallbox oder Trockner. Gruppen (z. B. je Raum) findest du unter "Alle Felder".', fields: [
      { path: 'consumers', label: 'Verbraucher', kind: 'list', max: 12 },
      { path: 'rest_min', label: 'Kachel "Nicht erfasst" erst anzeigen ab (% vom Hausverbrauch)', kind: 'number', optional: true, step: '1', help: 'Zum Beispiel 10: Die Kachel erscheint nur, wenn mindestens 10 % des Hausverbrauchs keiner Gruppe zugeordnet sind.' },
      { path: 'groups_columns', label: 'Gruppen pro Reihe', kind: 'number', optional: true, step: '1', help: 'Leer: alle Gruppen nebeneinander in einer Reihe. 1: jede Gruppe in einer eigenen Reihe über die volle Breite, die Namen sind dann besser lesbar. Stehen Gruppen untereinander, zeichnet die Karte eine Sammel-Linie.' },
      { path: 'hide_rest', label: 'Kachel "Nicht erfasst" ausblenden', kind: 'bool', help: 'Die Kachel zeigt den Teil des Hausverbrauchs, der keinem Gerät und keiner Gruppe zugeordnet ist (Hausverbrauch minus Summe der Gruppen).' },
      { path: 'groups_lines', label: 'Linien zu den Verbrauchern', kind: 'choice', options: [{ value: 'direkt', label: 'Eine Linie je Gerät oder Gruppe (Standard)' }, { value: 'sammel', label: 'Eine Sammel-Linie zum ganzen Verbraucherbereich' }], help: 'Bei vielen Geräten wirkt eine einzelne Sammel-Linie zum ganzen Bereich ruhiger.' },
    ] },
    { short: 'Preise', title: 'Strompreise (optional)', text: 'Mit Preisen zeigt die Karte Kosten und Ersparnis. Wähle Sensoren oder input_number-Helfer in Euro pro kWh.', fields: [
      { path: 'grid_price', label: 'Strompreis Bezug', kind: 'price', optional: true, hints: H(/bezug|netz|strom|import|grid|price|preis/i) },
      { path: 'grid_price_ct', label: 'oder fester Strompreis (Cent pro kWh)', kind: 'number', optional: true, step: '0.1', help: 'Ohne Sensor oder Helfer: einfach den Preis aus deiner Rechnung eintragen, zum Beispiel 34.' },
      { path: 'feed_in', label: 'Einspeisevergütung', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },
      { path: 'feed_in_ct', label: 'oder feste Einspeisevergütung (Cent pro kWh)', kind: 'number', optional: true, step: '0.1' },
    ] },
    { short: 'Aussehen', title: 'Farbschema', text: 'Dunkel ist die Voreinstellung. Mit "Automatisch" folgt die Karte dem hellen oder dunklen Design von Home Assistant, "Home Assistant" übernimmt dessen Farben.', fields: [
      { path: 'theme', label: 'Farbschema', kind: 'theme' },
      { path: 'watt_only', label: 'Leistung immer in Watt anzeigen', kind: 'bool', help: 'Standard: ab 1000 W wird auf kW umgeschaltet. Aktiviert: immer Watt, zum Beispiel 2.350 W.' },
      { path: 'compact', label: 'Kurzansicht', kind: 'choice', options: COMPACT, help: 'Kompakte Übersicht auf einen Blick: Solar, Netz und Batterie neben dem Ring, Gruppen ohne Geräteliste, ohne Zusatztexte. Ein Tipp auf eine Gruppe zeigt alle ihre Geräte. "Nur auf dem Handy" zeigt auf dem Tablet weiter die ausführliche Ansicht.' },
      { path: 'text_size', label: 'Textgröße', kind: 'choice', options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }], help: 'Vergrößert die kleinen Texte, zum Beispiel Ladestand, Kennzahlen oben rechts und Beschriftungen.' },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert. Mit "Fertig" siehst du alle Felder, zum Beispiel für Gruppen. Abfallkalender, Überschussvorschläge und Netzalarm stellst du im YAML-Editor ein.', summary: (c) => [
      `Solar: ${(c.pv && c.pv.entity) || 'nicht gewählt'}`,
      `Netz: ${(c.grid && c.grid.entity) || 'nicht gewählt'}${c.grid && c.grid.invert ? ' (umgekehrt)' : ''}`,
      `Batterie: ${(c.battery && c.battery.power) || 'keine'}`,
      `Haus: ${(c.home && c.home.entity) || 'berechnet'}`,
      `Einzelverbraucher: ${(Array.isArray(c.consumers) ? c.consumers : []).filter((x) => x && x.entity).length}`,
      `Preise: ${c.grid_price || typeof c.grid_price_ct === 'number' ? 'Bezug gesetzt' : 'keine'}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-flow-card-editor', {
    needsSetup: (c) => !(c.pv && c.pv.entity) && !(c.grid && c.grid.entity),
    steps,
    form: () => WD.flowForm(),
  });
})();
