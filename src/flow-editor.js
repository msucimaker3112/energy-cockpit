/* Editor der Energiefluss-Karte: Formular-Beschreibung für Home Assistant (getConfigForm).
   Home Assistant baut das Formular selbst. Gruppen, Verbraucher, Abfall und Überschussvorschläge stellt man im YAML-Editor ein. */
(() => {
  const ent = (name, domains) => ({ name, selector: { entity: domains ? { domain: domains } : {} } });
  const txt = (name) => ({ name, selector: { text: {} } });
  const bool = (name, def) => ({ name, default: def, selector: { boolean: {} } });
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step || 1, mode: 'box' } } });
  const sec = (name, title, schema) => ({ type: 'expandable', name, title, schema });

  const LABELS = {
    title: 'Titel', name: 'Anzeigename', icon: 'Symbol',
    entity: 'Sensor (Leistung)', daily: 'Tagesertrag (kWh)', forecast: 'Prognose (Leistung)',
    invert: 'Vorzeichen umkehren', daily_import: 'Bezug heute (kWh)', daily_export: 'Einspeisung heute (kWh)',
    power: 'Sensor Lade-/Entladeleistung', soc: 'Sensor Ladestand (%)', capacity_kwh: 'Kapazität (kWh)',
    reserve_soc: 'Reserve-Ladestand (%)', max_soc: 'Maximaler Ladestand (%)',
    daily_charge: 'Geladen heute (kWh)', daily_discharge: 'Entladen heute (kWh)',
    grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)',
    show_clock: 'Uhr anzeigen', fit_screen: 'Auf Bildschirmhöhe skalieren',
    nav_path: 'Weiter-Schaltfläche: Pfad (z. B. /lovelace/geraete)', nav_label: 'Weiter-Schaltfläche: Text',
  };

  WD.flowForm = () => ({
    schema: [
      txt('title'),
      sec('pv', 'Solar', [ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor']), ent('forecast', ['sensor'])]),
      sec('grid', 'Netz', [ent('entity', ['sensor']), txt('name'), bool('invert', false), ent('daily_import', ['sensor']), ent('daily_export', ['sensor'])]),
      sec('battery', 'Batterie', [
        ent('power', ['sensor']), ent('soc', ['sensor']), txt('name'), bool('invert', false),
        numb('capacity_kwh', 0, 200, 0.1), numb('reserve_soc', 0, 100, 1), numb('max_soc', 0, 100, 1),
        ent('daily_charge', ['sensor']), ent('daily_discharge', ['sensor']),
      ]),
      sec('home', 'Haus (optional)', [ent('entity', ['sensor']), txt('name')]),
      ent('grid_price', ['sensor', 'input_number']),
      ent('feed_in', ['sensor', 'input_number']),
      bool('show_clock', true),
      bool('fit_screen', true),
      txt('nav_path'),
      txt('nav_label'),
    ],
    computeLabel: (s) => LABELS[s.name] || s.title || s.name,
    computeHelper: (s) => (s.name === 'title' ? 'Gruppen, Verbraucher, Abfallkalender und Überschussvorschläge stellst du im YAML-Editor ein.' : undefined),
  });
})();
