/* Editor der Statistik-Karte: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const LABELS = {
    title: 'Titel', pv_total: 'PV Gesamtertrag (Zähler, kWh)', pv_lifetime: 'PV-Zähler ohne Zurücksetzen für Amortisation (optional, wenn der PV-Zähler täglich auf 0 geht)', decimals: 'Nachkommastellen bei kWh (leer = automatisch)', grid_import_total: 'Netzbezug gesamt (Zähler, kWh)', grid_export_total: 'Einspeisung gesamt (Zähler, kWh)',
    battery_charge_total: 'Batterie geladen gesamt (kWh)', battery_discharge_total: 'Batterie entladen gesamt (kWh)', battery_capacity_kwh: 'Batteriekapazität (kWh)', battery_temp: 'Batterietemperatur',
    pv_today: 'PV heute (kWh)', import_today: 'Netzbezug heute (kWh, nicht der Gesamtverbrauch)', export_today: 'Einspeisung heute (kWh)', charge_today: 'Batterie geladen heute (kWh)', discharge_today: 'Batterie entladen heute (kWh)',
    feed_in_card: 'Kachel Einspeiseerlös', start_period: 'Reiter beim Öffnen', budget_kwh: 'Jahresziel Netzbezug (kWh)', budget_profile: 'Soll im Jahresbudget', home_power: 'Hausverbrauch (Leistung, für Grundlast)', grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)', grid_price_ct: 'oder fester Strompreis (Cent pro kWh)', investment_eur: 'Anschaffungskosten der PV-Anlage (Euro, fest)', theme: 'Farbschema', accent: 'Akzentfarbe (z. B. 34,197,94 oder #22c55e)', feed_in_ct: 'oder feste Einspeisevergütung (Cent pro kWh)', investment: 'Anschaffungskosten PV-Anlage (Sensor oder input_number)', earned_before_eur: 'Bereits erwirtschaftet vor Beginn der Zähler (Euro)', earned_before: 'oder bereits erwirtschaftet aus Sensor oder Helfer (Euro)',
    nav_path: 'Weiter-Schaltfläche: Pfad', nav_label: 'Weiter-Schaltfläche: Text', fit_screen: 'Auf Bildschirmhöhe skalieren',
    cost_consumers: 'Kosten je Verbraucher (Liste, siehe Assistent)', grid_price_history: 'Frühere Strompreise (Liste, siehe Assistent)', pv_ac: 'PV-Zähler zählt ohne Akku-Ladung (Hybrid-Wechselrichter)', long_term: 'Langzeit-Ansicht (alle Jahre, Reiter "Gesamt")', pv_history: 'Importierte PV-Historie (Statistik-ID)', pv_history_until: 'Historie gilt bis einschließlich (JJJJ-MM)', pv_history_name: 'Bezeichnung der Historie',
  };
  const ent = (name, d) => ({ name, selector: { entity: d ? { domain: d } : {} } });
  const KEYS = ['pv_total', 'grid_import_total', 'grid_export_total', 'battery_charge_total', 'battery_discharge_total', 'battery_temp', 'pv_today', 'import_today', 'export_today',
    'charge_today', 'discharge_today', 'home_power', 'pv_lifetime'];

  WD.statsForm = () => ({
    schema: [
      { name: 'title', selector: { text: {} } },
      ...KEYS.map((k) => ent(k, ['sensor'])),
      { name: 'battery_capacity_kwh', selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } } },
      ent('grid_price', ['sensor', 'input_number']), { name: 'grid_price_ct', selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } } },
      ent('feed_in', ['sensor', 'input_number']), { name: 'feed_in_ct', selector: { number: { min: 0, max: 200, step: 0.1, mode: 'box' } } },
      { name: 'budget_kwh', selector: { number: { min: 0, step: 100, mode: 'box', unit_of_measurement: 'kWh' } } },
      { name: 'budget_profile', selector: { select: { mode: 'dropdown', options: [{ value: 'linear', label: 'Gleichmäßig übers Jahr (Standard)' }, { value: 'history', label: 'Nach dem Verlauf des Vorjahres' }] } } },
      { name: 'start_period', selector: { select: { mode: 'dropdown', options: [{ value: 'month', label: 'Monat (Standard)' }, { value: 'day', label: 'Heute' }, { value: 'week', label: 'Woche (mit Verbrauchern)' }, { value: 'year', label: 'Jahr' }] } } },
      { name: 'feed_in_card', selector: { select: { mode: 'dropdown', options: [{ value: 'standard', label: 'Einspeiseerlös (Standard)' }, { value: 'pv_self_consumption', label: 'PV-Eigenverbrauch stattdessen' }, { value: 'hidden', label: 'Ausblenden' }] } } },
      { name: 'investment_eur', selector: { number: { min: 0, max: 1000000, step: 50, mode: 'box' } } },
      { name: 'decimals', selector: { number: { min: 0, max: 3, step: 1, mode: 'box' } } },
      ent('investment', ['sensor', 'input_number']),
      { name: 'earned_before_eur', selector: { number: { min: 0, max: 1000000, step: 1, mode: 'box' } } },
      ent('earned_before', ['sensor', 'input_number']),
      { name: 'pv_ac', selector: { boolean: {} } },
      { name: 'cost_consumers', selector: { object: {} } },
      { name: 'grid_price_history', selector: { object: {} } },
      { name: 'long_term', selector: { boolean: {} } },
      { name: 'pv_history', selector: { text: {} } }, { name: 'pv_history_until', selector: { text: {} } }, { name: 'pv_history_name', selector: { text: {} } },
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
      { path: 'pv_ac', label: 'PV-Zähler zählt ohne Akku-Ladung', kind: 'bool', help: 'Für Hybrid-Wechselrichter, deren Zähler nur ihre Abgabe zählen. Zeichen dafür: "Autarkie" ist zu niedrig, oder der Verbrauch wirkt zu klein.' },
      { path: 'pv_today', label: 'PV heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /pv|solar|inverter|ertrag|yield/i) },
      { path: 'import_today', label: 'Netzbezug heute (nicht der Gesamtverbrauch)', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /import|bezug|verbrauch/i) },
      { path: 'export_today', label: 'Einspeisung heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /export|einspeis/i) },
      { path: 'charge_today', label: 'Batterie geladen heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /lad|charge/i) },
      { path: 'discharge_today', label: 'Batterie entladen heute', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute/i, /entlad|discharge/i) },
    ] },
    { short: 'Preise', title: 'Preise, Haus und Anlage (optional)', text: 'Mit Preisen zeigt die Karte Geldwerte. Die Anschaffungskosten ergeben die Amortisation, der Hausverbrauch die nächtliche Grundlast.', fields: [
      { path: 'grid_price', label: 'Strompreis Bezug', kind: 'price', optional: true, hints: H(/bezug|netz|strom|import|grid|price|preis/i) },
      { path: 'grid_price_ct', label: 'oder fester Strompreis (Cent pro kWh)', kind: 'number', optional: true, step: '0.1', help: 'Ohne Sensor oder Helfer: einfach den Preis aus deiner Rechnung eintragen, zum Beispiel 34.' },
      { path: 'grid_price_history.0.until', label: 'Früherer Preis 1: gültig bis (JJJJ-MM-TT)', kind: 'text', optional: true, help: 'Für die Kosten je Verbraucher: So rechnen vergangene Monate mit dem Preis von damals. Danach gilt der Preis oben. Ein Sensor mit Langzeitstatistik, etwa bei dynamischem Tarif, braucht das nicht.' },
      { path: 'grid_price_history.0.ct', label: 'Früherer Preis 1: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_price_history.1.until', label: 'Früherer Preis 2: gültig bis (JJJJ-MM-TT)', kind: 'text', optional: true },
      { path: 'grid_price_history.1.ct', label: 'Früherer Preis 2: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'grid_price_history.2.until', label: 'Früherer Preis 3: gültig bis (JJJJ-MM-TT)', kind: 'text', optional: true },
      { path: 'grid_price_history.2.ct', label: 'Früherer Preis 3: Cent pro kWh', kind: 'number', optional: true, step: '0.01' },
      { path: 'feed_in', label: 'Einspeisevergütung', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },
      { path: 'feed_in_ct', label: 'oder feste Einspeisevergütung (Cent pro kWh)', kind: 'number', optional: true, step: '0.1' },
      { path: 'investment_eur', label: 'Anschaffungskosten der PV-Anlage (Euro)', kind: 'number', optional: true, step: '50', help: 'Gesamtpreis der Anlage laut Rechnung, zum Beispiel 18000. Damit berechnet die Karte die Amortisation.' },
      { path: 'investment', label: 'oder Anschaffungskosten aus einem Sensor oder Helfer', kind: 'money', optional: true, hints: H(/anschaff|invest|kosten|cost/i) },
      { path: 'budget_kwh', label: 'Jahresziel für den Netzbezug (kWh)', kind: 'number', optional: true, step: '100', help: 'Optional, zum Beispiel 8000. Die Karte zeigt dann, wie viel vom Jahresziel verbraucht ist, das Soll bis heute und die Hochrechnung.' },
      { path: 'budget_profile', label: 'Soll im Jahresbudget', kind: 'choice', optional: true, options: [{ value: 'linear', label: 'Gleichmäßig übers Jahr (Standard)' }, { value: 'history', label: 'Nach dem Verlauf des Vorjahres' }], help: 'Mit dem Verlauf des Vorjahres steigt das Soll im Winter schneller als im Sommer. Fehlt ein volles Vorjahr, rechnet die Karte gleichmäßig.' },
      { path: 'earned_before_eur', label: 'Bereits erwirtschaftet vor Beginn der Zähler (Euro)', kind: 'number', optional: true, step: '1', help: 'Nur nötig, wenn die Anlage schon lief, bevor Home Assistant die Zähler erfasst hat. Der Betrag wird zur Amortisation addiert.' },
      { path: 'home_power', label: 'Hausverbrauch (Leistung)', kind: 'power', optional: true, hints: H(/haus|home|house|verbrauch|consumption|load/i) },
    ] },
    { short: 'Kosten', title: 'Kosten je Verbraucher (optional)', text: 'Zeigt je Gerät die Netzkosten und was Solar und Akku gespart haben, heute, in dieser Woche, im Monat und im Jahr. Weitere Verbraucher gehen unter "Alle Felder" oder in YAML.', fields: [
      { path: 'cost_consumers.0.name', label: 'Verbraucher 1: Name', kind: 'text', optional: true, help: 'Zum Beispiel E-Auto oder Wärmepumpe. Symbol und Farbe wählt die Karte selbst, in YAML gehen auch eigene.' },
      { path: 'cost_consumers.0.energy', label: 'Verbraucher 1: Energie', kind: 'energy', optional: true, help: 'Gesamtzähler in kWh. Die Karte teilt ihn jede Stunde so auf, wie das Haus gerade versorgt wurde. Das ist eine Schätzung.' },
      { path: 'cost_consumers.0.power', label: 'Verbraucher 1: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.0.grid', label: 'Verbraucher 1: Energie aus dem Netz', kind: 'energy', optional: true, help: 'Nur wenn du eigene Zähler je Quelle hast, zum Beispiel von der Wallbox. Dann misst die Karte, statt zu schätzen, und braucht den Zähler oben nicht.' },
      { path: 'cost_consumers.0.battery', label: 'Verbraucher 1: Energie aus dem Akku', kind: 'energy', optional: true },
      { path: 'cost_consumers.0.pv', label: 'Verbraucher 1: Energie aus PV', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.name', label: 'Verbraucher 2: Name', kind: 'text', optional: true },
      { path: 'cost_consumers.1.energy', label: 'Verbraucher 2: Energie', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.power', label: 'Verbraucher 2: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.1.grid', label: 'Verbraucher 2: Energie aus dem Netz', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.battery', label: 'Verbraucher 2: Energie aus dem Akku', kind: 'energy', optional: true },
      { path: 'cost_consumers.1.pv', label: 'Verbraucher 2: Energie aus PV', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.name', label: 'Verbraucher 3: Name', kind: 'text', optional: true },
      { path: 'cost_consumers.2.energy', label: 'Verbraucher 3: Energie', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.power', label: 'Verbraucher 3: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.2.grid', label: 'Verbraucher 3: Energie aus dem Netz', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.battery', label: 'Verbraucher 3: Energie aus dem Akku', kind: 'energy', optional: true },
      { path: 'cost_consumers.2.pv', label: 'Verbraucher 3: Energie aus PV', kind: 'energy', optional: true },
      { path: 'cost_consumers.3.name', label: 'Verbraucher 4: Name', kind: 'text', optional: true },
      { path: 'cost_consumers.3.energy', label: 'Verbraucher 4: Energie', kind: 'energy', optional: true },
      { path: 'cost_consumers.3.power', label: 'Verbraucher 4: Leistung', kind: 'power', optional: true },
      { path: 'cost_consumers.3.grid', label: 'Verbraucher 4: Energie aus dem Netz', kind: 'energy', optional: true },
      { path: 'cost_consumers.3.battery', label: 'Verbraucher 4: Energie aus dem Akku', kind: 'energy', optional: true },
      { path: 'cost_consumers.3.pv', label: 'Verbraucher 4: Energie aus PV', kind: 'energy', optional: true },
    ] },
    { short: 'Langzeit', title: 'Langzeit-Ansicht (optional)', text: 'Standardmäßig aus. Eingeschaltet zeigt die Karte alle Jahre aus der Langzeitstatistik von Home Assistant: Jahre blättern, Reiter "Gesamt" und Hinweise auf fehlende Monate. Ausgeschaltet bleibt die Karte wie bisher.', fields: [
      { path: 'long_term', label: 'Langzeit-Ansicht einschalten', kind: 'bool' },
      { path: 'pv_history', label: 'Importierte PV-Historie (nur mit Langzeit-Ansicht)', kind: 'text', optional: true, help: 'Nur für zuvor importierte Altdaten: Statistik-ID eintragen, zum Beispiel sensor:deye_ac_historisch. Die Werte erscheinen nur in den Balken und bei "PV gesamt", Geldwerte und Autarkie bleiben unverändert.' },
      { path: 'pv_history_until', label: 'Historie gilt bis einschließlich (JJJJ-MM)', kind: 'text', optional: true, help: 'Zum Beispiel 2026-04. Ohne Angabe füllt die Historie nur Monate, für die dein PV-Zähler keine Werte hat.' },
      { path: 'pv_history_name', label: 'Bezeichnung der Historie', kind: 'text', optional: true, help: 'Steht in der Legende, zum Beispiel "AC-Abgabe". Sonst "Historie".' },
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
      `Kosten je Verbraucher: ${c.cost_consumers ? Object.keys(c.cost_consumers).length : 'keine'}`,
      `Langzeit-Ansicht: ${c.long_term ? 'ein' : 'aus'}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-stats-card-editor', {
    needsSetup: (c) => !c.pv_total || !c.grid_import_total || !c.grid_export_total,
    steps,
    form: () => WD.statsForm(),
  });
})();
