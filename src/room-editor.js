/* Editor der Raum-Abrechnung: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const txt = (name) => ({ name, selector: { text: {} } });
  const ent = (name, domains) => ({ name, selector: { entity: domains ? { domain: domains } : {} } });
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step || 1, mode: 'box' } } });
  const sec = (name, title, schema) => ({ type: 'expandable', name, title, schema });

  const LABELS = {
    title: 'Titel', subtitle: 'Untertitel', image: 'Logo (Bild-URL)', energy: 'Energiezähler (kWh)', name: 'Anzeigename', color: 'Farbe (z. B. 96,165,250)',
    price: 'Strompreis (Sensor oder input_number, € pro kWh)', price_ct: 'oder fester Preis (Cent pro kWh)', base_fee: 'Grundgebühr je Monat (€)',
  };

  WD.roomForm = () => ({
    schema: [
      txt('title'), txt('subtitle'), txt('image'),
      sec('devices', 'Geräte / Zähler (bis zu 8)', Array.from({ length: 8 }, (_, i) => sec(String(i), `Gerät ${i + 1}`, [ent('energy', ['sensor']), txt('name'), txt('color')]))),
      ent('price', ['sensor', 'input_number']),
      numb('price_ct', 0, 200, 0.1),
      numb('base_fee', 0, 1000, 0.5),
    ],
    computeLabel: (s) => LABELS[s.name] || s.title || s.name,
  });

  const H = (...re) => re;
  const steps = () => [
    { short: 'Raum', title: 'Raum', text: 'Name und Logo, die oben auf der Karte erscheinen.', fields: [
      { path: 'title', label: 'Titel', kind: 'text' },
      { path: 'subtitle', label: 'Untertitel', kind: 'text', optional: true },
      { path: 'image', label: 'Logo (Bild-URL oder Data-URI)', kind: 'text', optional: true },
    ] },
    { short: 'Zähler', title: 'Energiezähler', text: 'Wähle die Zähler (kWh) der Geräte oder Stromkreise dieses Raums. Der Verbrauch wird je Gerät und als Summe ausgewiesen.', fields: [
      { path: 'devices', label: 'Zähler', kind: 'list', listKind: 'energy', itemKey: 'energy', max: 8 },
    ] },
    { short: 'Preis', title: 'Preis für die Abrechnung', text: 'Wähle einen Sensor oder input_number mit dem Preis in Euro pro kWh, oder trage unten einen festen Preis in Cent ein. Eine Grundgebühr wird je Monat ab dem ersten Messwert addiert.', fields: [
      { path: 'price', label: 'Preis-Sensor (€ pro kWh)', kind: 'price', optional: true, hints: H(/strom|price|preis|netz|bezug/i) },
      { path: 'price_ct', label: 'oder fester Preis (Cent pro kWh)', kind: 'number', optional: true, step: '0.1' },
      { path: 'base_fee', label: 'Grundgebühr je Monat (€)', kind: 'number', optional: true, step: '0.5' },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert.', summary: (c) => [
      `Raum: ${c.title || 'ohne Titel'}`,
      `Zähler: ${(Array.isArray(c.devices) ? c.devices : []).filter((x) => x && x.energy).length}`,
      `Preis: ${c.price || (c.price_ct ? c.price_ct + ' ct/kWh' : 'keiner')}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-room-card-editor', {
    needsSetup: (c) => !(Array.isArray(c.devices) ? c.devices : []).some((x) => x && x.energy),
    steps,
    form: () => WD.roomForm(),
  });
})();
