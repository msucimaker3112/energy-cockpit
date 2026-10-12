/* Editor der Raum-Abrechnung: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const txt = (name) => ({ name, selector: { text: {} } });
  const ent = (name, domains) => ({ name, selector: { entity: domains ? { domain: domains } : {} } });
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step || 1, mode: 'box' } } });
  const sec = (name, title, schema) => ({ type: 'expandable', name, title, schema });

  const VAL = [
    { value: 'opportunity', label: 'Entgangener Nutzen (empfohlen): Netz, Batterie und PV, die das Haus gebraucht hätte, zum Bezugspreis' },
    { value: 'mix', label: 'Feste Preise je Quelle (Netz, Batterie, PV)' },
    { value: 'grid', label: 'Alles zum Bezugspreis' },
  ];

  const LABELS = {
    title: 'Titel', subtitle: 'Untertitel', image: 'Logo (Bild-URL)', energy: 'Energiezähler (kWh)', name: 'Anzeigename', color: 'Farbe (z. B. 96,165,250)',
    price: 'Bezugspreis (Sensor oder input_number, € pro kWh)', price_ct: 'oder fester Bezugspreis (Cent pro kWh)', feed_in: 'Einspeisevergütung (Sensor oder input_number, € pro kWh)',
    price_pv: 'PV-Preis bei "feste Preise" (€ pro kWh, sonst Einspeisevergütung)', price_battery: 'Batteriepreis bei "feste Preise" (€ pro kWh, sonst PV-Preis)',
    base_fee: 'Grundgebühr je Monat (€)', valuation: 'Bewertung (entgangener Nutzen, feste Preise oder alles zum Bezugspreis)',
    pv: 'PV Gesamtertrag (Zähler, kWh)', import: 'Netzbezug gesamt (Zähler, kWh)', export: 'Einspeisung gesamt (Zähler, kWh)',
    charge: 'Batterie geladen gesamt (kWh)', discharge: 'Batterie entladen gesamt (kWh)',
  };

  WD.roomForm = () => ({
    schema: [
      txt('title'), txt('subtitle'), txt('image'),
      sec('devices', 'Bereiche / Zähler (bis zu 8)', Array.from({ length: 8 }, (_, i) => sec(String(i), `Bereich ${i + 1}`, [ent('energy', ['sensor']), txt('name'), txt('color')]))),
      sec('home_energy', 'Haus-Energiequellen (für Netz / Batterie / PV)', [ent('pv', ['sensor']), ent('import', ['sensor']), ent('export', ['sensor']), ent('charge', ['sensor']), ent('discharge', ['sensor'])]),
      { name: 'valuation', selector: { select: { mode: 'dropdown', options: VAL } } },
      ent('price', ['sensor', 'input_number']),
      numb('price_ct', 0, 200, 0.1),
      ent('feed_in', ['sensor', 'input_number']),
      ent('price_pv', ['sensor', 'input_number']),
      ent('price_battery', ['sensor', 'input_number']),
      numb('base_fee', 0, 1000, 0.5),
    ],
    computeLabel: (s) => LABELS[s.name] || s.title || s.name,
  });

  const H = (...re) => re;
  const TOTAL = /gesamt|total|lifetime|energie|energy/i;
  const steps = () => [
    { short: 'Raum', title: 'Raum', text: 'Name und Logo, die oben auf der Karte erscheinen.', fields: [
      { path: 'title', label: 'Titel', kind: 'text' },
      { path: 'subtitle', label: 'Untertitel', kind: 'text', optional: true },
      { path: 'image', label: 'Logo (Bild-URL oder Data-URI)', kind: 'text', optional: true },
    ] },
    { short: 'Zähler', title: 'Energiezähler', text: 'Wähle die Zähler (kWh) der Bereiche oder Stromkreise dieses Raums, zum Beispiel Arbeitsplätze oder Chillecke. Hinter einem Zähler dürfen beliebig viele Geräte hängen. Der Verbrauch wird je Bereich und als Summe ausgewiesen.', fields: [
      { path: 'devices', label: 'Zähler', kind: 'list', listKind: 'energy', itemKey: 'energy', max: 8 },
    ] },
    { short: 'Herkunft', title: 'Woher kommt der Strom?', text: 'Mit den Zählern des ganzen Hauses ermittelt die Karte stündlich, welcher Anteil aus Netz, Batterie und PV stammt. Jeder Verbraucher bekommt in jeder Stunde den gleichen Mix wie das Haus.', fields: [
      { path: 'home_energy.pv', label: 'PV Gesamtertrag', kind: 'energy', optional: true, hints: H(/pv|solar|inverter|wechselrichter|ertrag|yield/i, TOTAL) },
      { path: 'home_energy.import', label: 'Netzbezug gesamt', kind: 'energy', optional: true, hints: H(/import|bezug|verbrauch|consumption|grid/i, TOTAL) },
      { path: 'home_energy.export', label: 'Einspeisung gesamt', kind: 'energy', optional: true, hints: H(/export|einspeis|feed/i, TOTAL) },
      { path: 'home_energy.charge', label: 'Batterie geladen gesamt', kind: 'energy', optional: true, hints: H(/ladung|charge|geladen/i, /batter|akku/i, TOTAL) },
      { path: 'home_energy.discharge', label: 'Batterie entladen gesamt', kind: 'energy', optional: true, hints: H(/entlad|discharge/i, /batter|akku/i, TOTAL) },
    ] },
    { short: 'Preis', title: 'Preise und Bewertung', text: 'Bezugspreis und Einspeisevergütung als Sensor oder input_number (Euro pro kWh). Die Bewertung "entgangener Nutzen" rechnet Strom, den dein Haus selbst gebraucht hätte, zum Bezugspreis ab.', fields: [
      { path: 'price', label: 'Bezugspreis (€ pro kWh)', kind: 'price', optional: true, hints: H(/bezug|netz|strom|import|grid|price|preis/i) },
      { path: 'price_ct', label: 'oder fester Bezugspreis (Cent pro kWh)', kind: 'number', optional: true, step: '0.1' },
      { path: 'feed_in', label: 'Einspeisevergütung (€ pro kWh)', kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export/i) },
      { path: 'valuation', label: 'Bewertung', kind: 'choice', options: VAL },
      { path: 'base_fee', label: 'Grundgebühr je Monat (€)', kind: 'number', optional: true, step: '0.5' },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert.', summary: (c) => [
      `Raum: ${c.title || 'ohne Titel'}`,
      `Zähler: ${(Array.isArray(c.devices) ? c.devices : []).filter((x) => x && x.energy).length}`,
      `Herkunft: ${c.home_energy && c.home_energy.import ? 'aus Hauszählern' : 'nicht ermittelt'}`,
      `Bewertung: ${(VAL.find((v) => v.value === (c.valuation || 'opportunity')) || VAL[0]).label}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-room-card-editor', {
    needsSetup: (c) => !(Array.isArray(c.devices) ? c.devices : []).some((x) => x && x.energy),
    steps,
    form: () => WD.roomForm(),
  });
})();
