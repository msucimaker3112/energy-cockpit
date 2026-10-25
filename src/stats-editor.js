/* Editor der Statistik-Karte: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const LABELS = {
    title: 'Titel', pv_total: 'PV Gesamtertrag (Zähler, kWh)', grid_import_total: 'Netzbezug gesamt (Zähler, kWh)', grid_export_total: 'Einspeisung gesamt (Zähler, kWh)',
    battery_charge_total: 'Batterie geladen gesamt (kWh)', battery_discharge_total: 'Batterie entladen gesamt (kWh)', battery_capacity_kwh: 'Batteriekapazität (kWh)', battery_temp: 'Batterietemperatur',
    pv_today: 'PV heute (kWh)', import_today: 'Bezug heute (kWh)', export_today: 'Einspeisung heute (kWh)', charge_today: 'Batterie geladen heute (kWh)', discharge_today: 'Batterie entladen heute (kWh)',
    home_power: 'Hausverbrauch (Leistung, für Grundlast)', grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)', grid_price_ct: 'oder fester Strompreis (Cent pro kWh)', investment_eur: 'Anschaffungskosten der PV-Anlage (Euro, fest)', theme: 'Farbschema', accent: 'Akzentfarbe (z. B. 34,197,94 oder #22c55e)', feed_in_ct: 'oder feste Einspeisevergütung (Cent pro kWh)', investment: 'Anschaffungskosten PV-Anlage (Sensor oder input_number)', earned_before_eur: 'Bereits erwirtschaftet vor Beginn der Zähler (Euro)', earned_before: 'oder bereits erwirtschaftet aus Sensor oder Helfer (Euro)',
    nav_path: 'Weiter-Schaltfläche: Pfad', nav_label: 'Weiter-Schaltfläche: Text', fit_screen: 'Auf Bildschirmhöhe skalieren',
  };
  const ent = (name, d) => ({ name, selector: { entity: d ? { domain: d } : {} } });
  const KEYS = ['pv_total', 'grid_import_total', 'grid_export_total', 'battery_charge_total', 'battery_discharge_total', 'battery_temp', 'pv_today', 'import_today', 'export_today',
    'charge_today', 'discharge_today', 'home_power'];

  WD.statsForm = () => ({
    schema: [
      { name: 'title', selector: { text: {} } },
      ...KEYS.map((k) => ent(k, ['sensor'])),
      { name: 'battery_capacity_kwh', selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } } },
      ent('grid_price', ['sensor', 'input_number']), { name: 'grid_price_ct', selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } } },
      ent('feed_in', ['sensor', 'input_number']), { name: 'feed_in_ct', selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } } },
      { name: 'investment_eur', selector: { number: { min: 0, max: 1000000, step: 50, mode: 'box' } } },
      ent('investment', ['sensor', 'input_number']),
      { name: 'earned_before_eur', selector: { number: { min: 0, max: 1000000, step: 1, mode: 'box' } } },
      ent('earned_before', ['sensor', 'input_number']),
      { name: 'fit_screen', default: true, selector: { boolean: {} } },
      { name: 'theme', selector: { select: { mode: 'dropdown', options: WD.THEME_OPTIONS } } },
      { name: 'nav_path', selector: { text: {} } }, { name: 'nav_label', selector: { text: {} } },
    ],
    computeLabel: (s) => LABELS[s.name] || s.name,
  });

  const H = (...re) => re;
  const TOTAL = /gesamt|total|lifetime|energie|energy/i;
  const steps = () => [
    { short: 'Zähler', title: 'Gesamtzähler', text: 'Diese drei Zähler sind Pflicht. Sie zählen dauerhaft hoch (kWh seit Inbetriebnahme).', fields: [
      { path: 'pv_total', label: 'PV Gesamtertrag', kind: 'energy', hints: H(/pv|solar|inverter|wechselrichter|ertrag|yield/i, TOTAL) },
      { path: 'grid_import_total', label: 'Netzbezug gesamt', kind: 'energy', hints: H(/import|bezug|verbrauch|consumption|grid/i, TOTAL) },
      { path: 'grid_export_total', label: 'Einspeisung gesamt', kind: 'energy', hints: H(/export|einspeis|feed/i, TOTAL) },
    ] },
    { short: 'Batterie', title: 'Batterie (optional)', text: 'Für Wirkungsgrad, Vollzyklen und genauere Autarkie.', fields: [
      { path: 'battery_charge_total', label: 'Batterie geladen gesamt', kind: 'energy', optional: true, hints: H(/ladung|charge|geladen/i, /batter|akku/i, TOTAL) },
      { path: 'battery_discharge_total', label: 'Batterie entladen gesamt', kind: 'energy', optional: true, hints: H(/entlad|discharge/i, /batter|akku/i, TOTAL) },
      { path: 'battery_capacity_kwh', label: 'Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'battery_temp', label: 'Batterietemperatur', kind: 'temp', optional: true, hints: H(/batter|akku/i, /temp/i) },
    ] },
    { short: 'Heute', title: 'Tageswerte (optional)', text: 'Für die Ansicht "Heute".', fields: [
      { path: 'pv_today', label: 'PV heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /pv|solar|inverter|ertrag|yield/i) },
      { path: 'import_today', label: 'Netzbezug heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /import|bezug|verbrauch/i) },
      { path: 'export_today', label: 'Einspeisung heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /export|einspeis/i) },
      { path: 'charge_today', label: 'Batterie geladen heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /lad|charge/i) },
      { path: 'discharge_today', label: 'Batterie entladen heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /entlad|discharge/i) },
    ] },
    { short: 'Preise', title: 'Preise, Haus und Anlage (optional)', text: 'Mit Preisen zeigt die Karte Geldwerte. Die Anschaffungskosten ergeben die Amortisation, der Hausverbrauch die nächtliche Grundlast.', fields: [
      { path: 'grid_price', label: 'Strompreis Bezug', kind: 'price', optional: true, hints: H(/bezug|netz|strom|import|grid|price|preis/i) },
      { path: 'grid_price_ct', label: 'oder fester Strompreis (Cent pro kWh)', kind: 'number', optional: true, step: '0.1', help: 'Ohne Sensor oder Helfer: einfach den Preis aus deiner Rechnung eintragen, zum Beispiel 34.' },
      { path: 'feed_in', label: 'Einspeisevergütung', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },
      { path: 'feed_in_ct', label: 'oder feste Einspeisevergütung (Cent pro kWh)', kind: 'number', optional: true, step: '0.1' },
      { path: 'investment_eur', label: 'Anschaffungskosten der PV-Anlage (Euro)', kind: 'number', optional: true, step: '50', help: 'Gesamtpreis der Anlage laut Rechnung, zum Beispiel 18000. Damit berechnet die Karte die Amortisation.' },
      { path: 'investment', label: 'oder Anschaffungskosten aus einem Sensor oder Helfer', kind: 'money', optional: true, hints: H(/anschaff|invest|kosten|cost/i) },
      { path: 'earned_before_eur', label: 'Bereits erwirtschaftet vor Beginn der Zähler (Euro)', kind: 'number', optional: true, step: '1', help: 'Nur nötig, wenn die Anlage schon lief, bevor Home Assistant die Zähler erfasst hat. Der Betrag wird zur Amortisation addiert.' },
      { path: 'home_power', label: 'Hausverbrauch (Leistung)', kind: 'power', optional: true, hints: H(/haus|home|house|verbrauch|consumption|load/i) },
    ] },
    { short: 'Aussehen', title: 'Farbschema', text: 'Dunkel ist die Voreinstellung. Mit "Automatisch" folgt die Karte dem hellen oder dunklen Design von Home Assistant, "Home Assistant" übernimmt dessen Farben.', fields: [
      { path: 'theme', label: 'Farbschema', kind: 'theme' },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert. Mit "Fertig" siehst du alle Felder.', summary: (c) => [
      `PV gesamt: ${c.pv_total || 'nicht gewählt'}`,
      `Netzbezug gesamt: ${c.grid_import_total || 'nicht gewählt'}`,
      `Einspeisung gesamt: ${c.grid_export_total || 'nicht gewählt'}`,
      `Batterie: ${c.battery_charge_total ? 'ja' : 'nein'}`,
      `Preise: ${c.grid_price || typeof c.grid_price_ct === 'number' ? 'gesetzt' : 'keine'}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-stats-card-editor', {
    needsSetup: (c) => !c.pv_total || !c.grid_import_total || !c.grid_export_total,
    steps,
    form: () => WD.statsForm(),
  });
})();
