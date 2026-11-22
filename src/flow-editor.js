/* Editor der Energiefluss-Karte: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  const ent = (name, domains) => ({ name, selector: { entity: domains ? { domain: domains } : {} } });
  const txt = (name) => ({ name, selector: { text: {} } });
  // Mehrere Sensoren (z. B. mehrere Unterzähler zum Abziehen)
  const entm = (name, domains) => ({ name, selector: { entity: Object.assign({ multiple: true }, domains ? { domain: domains } : {}) } });
  const bool = (name, def) => ({ name, default: def, selector: { boolean: {} } });
  const numb = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step && step % 1 ? 'any' : step || 1, mode: 'box' } } });
  const sec = (name, title, schema) => ({ type: 'expandable', name, title, schema });

  const LABELS = {
    text_muted: 'Beschriftungen (sonst grau)', text: 'Werte und Titel',
    title: 'Titel', name: 'Anzeigename', icon: 'Symbol', minus: 'Differenz: abziehen (Sensor, W), z. B. Zähler 2 einer Zählerkaskade', plus: 'Differenz: dazurechnen (Sensor, W, optional)',
    entity: 'Sensor (Leistung)', daily: 'Tagesertrag (kWh)', daily_ac: 'Tagesertrag zählt ohne Batterie-Ladung (Hybrid-Wechselrichter)', forecast: 'Prognose (Leistung in W/kW oder Tagesprognose in kWh)', forecast_tomorrow: 'Prognose morgen (kWh, z. B. Forecast.Solar)', forecast_day_after: 'Prognose übermorgen (kWh, optional)',
    price: 'Preis (Sensor oder Helfer, pro kWh)', price_ct: 'oder fester Preis (Cent pro kWh)',
    invert: 'Vorzeichen umkehren', daily_import: 'Bezug heute (kWh)', daily_export: 'Einspeisung heute (kWh)',
    power_charge: 'oder getrennt: Ladeleistung (Sensor)', power_discharge: 'oder getrennt: Entladeleistung (Sensor)', power: 'Sensor Lade-/Entladeleistung', soc: 'Sensor Ladestand (%)', capacity_kwh: 'Kapazität (kWh)',
    reserve_soc: 'Entladegrenze (Sensor oder Helfer, %)', max_soc: 'Maximalladung (Sensor oder Helfer, %)', groups_lines: 'Linien zu den Verbrauchern', hide_rest: 'Kachel "Nicht erfasst" ausblenden', hide_zero: 'Ruhende Verbraucher ausblenden (unter „Aktiv ab“)', hide_zero_delay: 'Ausblenden erst nach (Sekunden, Standard 30)', show_rest: 'Kachel "Nicht erfasst" auch bei einzelnen Verbrauchern ohne Gruppen zeigen', add_to_home: 'Hausverbrauch enthält die zweite Anlage nicht', rest_min: 'Kachel "Nicht erfasst" erst ab (%)', consumers_top: 'Nur die größten Verbraucher zeigen (Anzahl)', text_size: 'Textgröße', reserve_pct: 'oder feste Entladegrenze (%)', max_pct: 'oder feste Maximalladung (%)', soc_display: 'Ladestand anzeigen als', tap: 'Klick auf die Batterie-Kachel öffnet',
    power_out: 'Ausgangsleistung ins Haus (Sensor, nur für Speicher mit angeschlossenen Modulen, z. B. Anker Solarbank „AC-Hausabgabe“)', pv_to_battery: 'Solar läuft durch den Speicher (z. B. Marstek B2500, Anker Solarbank)',
    temp: 'Temperatur (Sensor, optional)', daily_charge: 'Geladen heute (kWh)', daily_discharge: 'Entladen heute (kWh)', behind_meter: 'Speicher hinter dem Zähler (zählt wie ein Gerät im Haus)',
    grid_price: 'Strompreis Bezug (Sensor, pro kWh)', feed_in: 'Einspeisevergütung (Sensor, pro kWh)', grid_price_ct: 'oder fester Strompreis (Cent pro kWh)', theme: 'Farbschema', language: 'Sprache der Karte', fuel: 'Brennstoff', big_value: 'Große Zahl der Batterie-Kachel (nur mit „Solar läuft durch den Speicher“)', self_consumption: 'Eigenbedarf des Speichers (Sensor, optional)', kwh_per_l: 'kWh je Liter (nur Öl, Standard 10)', no_name: 'Ohne Namen (nur der Wert)', accent: 'Akzentfarbe (z. B. 34,197,94 oder #22c55e)', feed_in_ct: 'oder feste Einspeisevergütung (Cent pro kWh)',
    daily_from_total: 'Tageswerte aus Gesamtzählern berechnen (wie das Energie-Dashboard)', show_clock: 'Uhr anzeigen', compact_forecast: 'Prognose heute: in der Solar-Kachel (Kurzansicht)', forecast_swap: 'Prognose heute: unten neben morgen und übermorgen (ausführliche Ansicht)', why: 'Warum?-Erklärung (? an Netz, Solar und Batterie)', to_battery: 'Läuft durch Speicher Nr. (0 = direkt ins Haus)', power_in: 'AC-Ladung aus dem Haus (Sensor, nur mit „Läuft durch Speicher“)', label_size: 'Größe der Beschriftungen (nur kleine Texte, Zahl z. B. 1,5)', extra: 'Zusatzwerte', alarm: 'Alarm (Sensor, schaltet die Kachel rot)', unit: 'Einheit (optional)', warn_above: 'Warnung ab (Wert wird gelb)', warn_below: 'Warnung unter (Wert wird gelb)', grid_import: 'Netzbezug', grid_export: 'Einspeisung', battery: 'Batterie (Ruhezustand)', battery_charge: 'Batterie lädt', battery_discharge: 'Batterie entlädt', size: 'Größe der Kachel', weather: 'Wetter (Entität, zeigt das Himmelsband)', home_color: 'Farbe der Zahl beim Haus', home_icon_color: 'Farbe des Haus-Symbols', grid_side: 'Netz-Kachel: Seite', style: 'Darstellung', house_style: 'Haus in der 3D-Ansicht', compact: 'Kurzansicht (kompakt)', watt_only: 'Leistung immer in Watt (nie kW)', animations: 'Animationen', groups_columns: 'Gruppen pro Reihe (leer = alle nebeneinander)', on_w: 'Aktiv ab (W, Standard 10)', fit_screen: 'Auf Bildschirmhöhe skalieren',
    roof_color: 'Dachfarbe in der 3D-Ansicht', consumer_groups_sort: 'Reihenfolge der Geräte in Gruppen', decimals: 'Nachkommastellen bei kWh (leer = automatisch)',
    nav_path: 'Weiter-Schaltfläche: Pfad (z. B. /lovelace/geraete)', nav_label: 'Weiter-Schaltfläche: Text',
    secondary: 'Zusatzwert (Sensor, z. B. Temperatur)', secondary_name: 'Name vor dem Zusatzwert (z. B. SoC eAuto)', rest_name: 'Gruppe: Name der Zeile Rest (nur mit Gesamtsensor)', color: 'Farbe (z. B. #a78bfa)', image: 'Logo (Bild-URL, ersetzt das Symbol)',
  };

  const BIGV = [{ value: 'auto', label: 'Akkuleistung (Standard)' }, { value: 'out', label: 'Ausgang ins Haus (bei Durchleitung und Entladung)' }];
  const PV_VIA = [{ value: 'aus', label: 'Aus: Solar speist das Haus (Standard)' }, { value: 'direkt', label: 'Direkt: Solar läuft durch den Speicher (braucht die Ausgangsleistung)' }];
  const GRIDSIDE = [{ value: 'left', label: 'Links, unter Solar (Standard)' }, { value: 'right', label: 'Rechts neben dem Haus (spart Höhe)' }];
  const HOMEICO = [{ value: 'standard', label: 'Standard (Türkis)' }, { value: 'autarkie', label: 'Nach Autarkie (grün bei 100 %, gelb ab 50 %, sonst rot)' }];
  const HOMECOL = [{ value: 'standard', label: 'Standard (Türkis)' }, { value: 'source', label: 'Farbe der größten Quelle (PV gelb, Speicher blau, Netz rot)' }];
  const STYLE = [{ value: 'flach', label: 'Flach: Kacheln und Ring (Standard)' }, { value: '3d', label: '3D: Haus, Solar, Netz und Speicher als Objekte' }];
  const HOUSE = [{ value: 'sattel', label: 'Satteldach (Standard)' }, { value: 'flach', label: 'Flachdach' }];
  const COMPACT = [{ value: 'aus', label: 'Aus: ausführliche Ansicht (Standard)' }, { value: 'auto', label: 'Nur auf dem Handy' }, { value: 'immer', label: 'Immer' }];

  // Listen als Platzhalter-Abschnitte "0", "1", ...: Home Assistant speichert sie als Objekt, die Karte macht daraus wieder eine Liste
  const extraFields = () => [ent('entity', ['sensor', 'binary_sensor', 'input_number', 'number']), txt('name'), txt('unit'), numb('decimals', 0, 4, 1), numb('warn_above', -1000000, 1000000, 0.1), numb('warn_below', -1000000, 1000000, 0.1), bool('no_name')];
  const slots = (n, titleOf, schemaOf) => Array.from({ length: n }, (_, i) => sec(String(i), titleOf(i + 1), schemaOf(i)));
  const consumerFields = () => [ent('entity', ['sensor']), entm('minus', ['sensor']), entm('plus', ['sensor']), txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'), ent('secondary', ['sensor']), txt('secondary_name'), numb('on_w', 0, 100000, 1), { name: 'size', selector: { select: { mode: 'dropdown', options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'mittel', label: 'Mittel (eine Spalte, größere Zahl)' }, { value: 'gross', label: 'Groß (breite Kachel mit großer Zahl)' }] } } }];
  const itemFields = () => [ent('entity', ['sensor']), entm('minus', ['sensor']), entm('plus', ['sensor']), txt('name'), ent('secondary', ['sensor']), txt('secondary_name'), numb('on_w', 0, 100000, 1)];
  const groupFields = () => [
    txt('name'), { name: 'icon', selector: { icon: {} } }, txt('image'), txt('color'), numb('on_w', 0, 100000, 1), ent('entity', ['sensor']), txt('rest_name'),
    sec('items', 'Verbraucher der Gruppe', slots(10, (n) => `Verbraucher ${n}`, itemFields)),
  ];

  // Weitere Speicher (ab dem zweiten): jeder mit eigener Kachel
  const batteryFields = () => [
    txt('name'), ent('power', ['sensor']), ent('power_charge', ['sensor']), ent('power_discharge', ['sensor']), ent('soc', ['sensor']), bool('invert', false),
    numb('capacity_kwh', 0, 200, 0.1), numb('reserve_pct', 0, 100, 1), numb('max_pct', 0, 100, 1), ent('power_out', ['sensor']), ent('power_in', ['sensor']), ent('temp', ['sensor']),
    ent('daily_charge', ['sensor']), ent('daily_discharge', ['sensor']), bool('behind_meter', false), { name: 'big_value', selector: { select: { mode: 'dropdown', options: BIGV } } }, ent('self_consumption', ['sensor']),
    sec('extra', 'Zusatzwerte (bis zu 6)', slots(6, (n) => `Zusatzwert ${n}`, extraFields)), ent('alarm', ['sensor', 'binary_sensor']),
  ];

  WD.flowForm = () => ({
    schema: [
      txt('title'),
      sec('pv', 'Solar', [sec('extra', 'Zusatzwerte (bis zu 6, z. B. Spannung, Strom, Temperatur)', slots(6, (n) => `Zusatzwert ${n}`, extraFields)), ent('alarm', ['sensor', 'binary_sensor']), ent('entity', ['sensor']), txt('name'), bool('invert', false), ent('daily', ['sensor']), bool('daily_ac', false), ent('forecast', ['sensor']), ent('forecast_tomorrow', ['sensor']), ent('forecast_day_after', ['sensor'])]),
      sec('pv2', 'Zweite Solaranlage (z. B. Balkonkraftwerk)', [numb('to_battery', 0, 6, 1), sec('extra', 'Zusatzwerte (bis zu 6, z. B. Spannung, Strom, Temperatur)', slots(6, (n) => `Zusatzwert ${n}`, extraFields)), ent('alarm', ['sensor', 'binary_sensor']), ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor']), bool('add_to_home', false)]),
      sec('grid', 'Netz', [sec('extra', 'Zusatzwerte (bis zu 6, z. B. Spannung, Strom, Temperatur)', slots(6, (n) => `Zusatzwert ${n}`, extraFields)), ent('alarm', ['sensor', 'binary_sensor']), ent('entity', ['sensor']), txt('name'), bool('invert', false), ent('daily_import', ['sensor']), ent('daily_export', ['sensor'])]),
      sec('grid2', 'Zweiter Netzzähler (z. B. Wärmepumpe mit eigenem Zähler)', [ent('entity', ['sensor']), txt('name'), ent('price', ['sensor', 'input_number', 'number']), numb('price_ct', 0, 200, 0.01)]),
      sec('battery', 'Batterie', [
        { name: 'big_value', selector: { select: { mode: 'dropdown', options: BIGV } } }, ent('self_consumption', ['sensor']),
        sec('extra', 'Zusatzwerte (bis zu 6, z. B. Spannung, Strom, Temperatur)', slots(6, (n) => `Zusatzwert ${n}`, extraFields)), ent('alarm', ['sensor', 'binary_sensor']), ent('power', ['sensor']), ent('power_charge', ['sensor']), ent('power_discharge', ['sensor']), ent('power_out', ['sensor']), ent('soc', ['sensor']), txt('name'), bool('invert', false),
        numb('capacity_kwh', 0, 200, 0.1), ent('reserve_soc', ['sensor', 'number', 'input_number']), numb('reserve_pct', 0, 100, 1),
        ent('max_soc', ['sensor', 'number', 'input_number']), numb('max_pct', 0, 100, 1),
        { name: 'tap', selector: { select: { mode: 'dropdown', options: [{ value: 'power', label: 'Verlauf der Lade-/Entladeleistung (Standard)' }, { value: 'soc', label: 'Verlauf des Ladestands in %' }] } } },
      { name: 'soc_display', selector: { select: { mode: 'dropdown', options: [{ value: 'brutto', label: 'Ladestand der Batterie (Standard)' }, { value: 'nutzbar', label: 'Nutzbarer Anteil (0 % = Entladegrenze)' }] } } },
        ent('temp', ['sensor']), ent('daily_charge', ['sensor']), ent('daily_discharge', ['sensor']), bool('behind_meter', false),
      ]),
      { name: 'pv_to_battery', selector: { select: { mode: 'dropdown', options: PV_VIA } } },
      sec('batteries', 'Weitere Speicher (2. bis 5.)', slots(4, (n) => `Speicher ${n + 1}`, batteryFields)),
      sec('home', 'Haus (optional)', [ent('entity', ['sensor']), txt('name'), ent('daily', ['sensor'])]),
      sec('gas', 'Gas oder Öl (eigene Kachel, zählt nicht zum Strom)', [{ name: 'fuel', selector: { select: { mode: 'dropdown', options: [{ value: 'gas', label: 'Gas (Standard)' }, { value: 'oil', label: 'Öl (Anzeige in Litern)' }] } } }, numb('kwh_per_l', 0, 20, 0.01), sec('extra', 'Zusatzwerte (bis zu 3, z. B. Kesseltemperatur)', slots(3, (n) => `Zusatzwert ${n}`, extraFields)), Object.assign(ent('entity', ['sensor']), { label: 'Leistung der Therme (W oder kW, optional)' }), txt('name'), Object.assign(ent('heating', ['sensor']), { label: 'Heizung heute (kWh oder m³)' }), Object.assign(ent('hot_water', ['sensor']), { label: 'Warmwasser heute (kWh oder m³)' }), Object.assign(ent('daily', ['sensor']), { label: 'oder nur: Gas heute gesamt (kWh oder m³)' }), Object.assign(numb('kwh_per_m3', 0, 20, 0.01), { label: 'kWh je m³ (Brennwert × Zustandszahl, nur bei m³)' })]),
      sec('water', 'Wasser (eigene Kachel)', [Object.assign(ent('entity', ['sensor']), { label: 'Durchfluss (l/min oder m³/h, optional)' }), txt('name'), Object.assign(ent('daily', ['sensor']), { label: 'Wasser heute (Liter oder m³)' })]),
      sec('water2', 'Zweiter Wasserzähler (eigene Kachel, z. B. Zisterne)', [Object.assign(ent('entity', ['sensor']), { label: 'Durchfluss (l/min oder m³/h, optional)' }), txt('name'), Object.assign(ent('daily', ['sensor']), { label: 'Wasser heute (Liter oder m³)' })]),
      sec('water3', 'Dritter Wasserzähler (eigene Kachel)', [Object.assign(ent('entity', ['sensor']), { label: 'Durchfluss (l/min oder m³/h, optional)' }), txt('name'), Object.assign(ent('daily', ['sensor']), { label: 'Wasser heute (Liter oder m³)' })]),
      sec('consumers', 'Einzelverbraucher (bis zu 30)', slots(30, (n) => `Verbraucher ${n}`, consumerFields)),
      sec('consumer_groups', 'Gruppen (bis zu 10)', slots(10, (n) => `Gruppe ${n}`, groupFields)),
      ent('grid_price', ['sensor', 'input_number']),
      numb('grid_price_ct', 0, 200, 0.1),
      ent('feed_in', ['sensor', 'input_number']),
      numb('feed_in_ct', 0, 200, 0.1),
      bool('daily_from_total', false),
      ent('weather', ['weather']),
      sec('colors', 'Farben (z. B. #22c55e)', [txt('pv'), txt('grid_import'), txt('grid_export'), txt('battery'), txt('battery_charge'), txt('battery_discharge'), txt('home'), txt('text_muted'), txt('text')]),
      numb('label_size', 0.5, 4, 0.1),
      bool('why', false),
      bool('show_clock', true),
      bool('fit_screen', true),
      bool('watt_only', false),
      bool('hide_rest', false),
      bool('show_rest', false),
      bool('forecast_swap', false),
      bool('compact_forecast', false),
      numb('consumers_top', 1, 30, 1),
      bool('hide_zero', false),
      numb('hide_zero_delay', 0, 3600, 1),
      numb('groups_columns', 1, 12, 1),
      numb('rest_min', 0, 100, 1),
      { name: 'style', selector: { select: { mode: 'dropdown', options: STYLE } } },
      { name: 'house_style', selector: { select: { mode: 'dropdown', options: HOUSE } } },
      { name: 'home_color', selector: { select: { mode: 'dropdown', options: HOMECOL } } },
      { name: 'home_icon_color', selector: { select: { mode: 'dropdown', options: HOMEICO } } },
      { name: 'grid_side', selector: { select: { mode: 'dropdown', options: GRIDSIDE } } },
      { name: 'roof_color', selector: { select: { mode: 'dropdown', custom_value: true, options: [{ value: 'rot', label: 'Ziegelrot (Standard)' }, { value: 'anthrazit', label: 'Anthrazit' }, { value: 'schwarz', label: 'Schwarz' }, { value: 'grau', label: 'Grau' }, { value: 'braun', label: 'Braun' }, { value: 'gruen', label: 'Grün' }, { value: 'blau', label: 'Blau' }] } } },
      { name: 'consumer_groups_sort', selector: { select: { mode: 'dropdown', options: [{ value: 'konfiguriert', label: 'Wie eingetragen (Standard)' }, { value: 'leistung', label: 'Nach Leistung, aktive Geräte oben' }] } } },
      numb('decimals', 0, 3, 1),
      { name: 'compact', selector: { select: { mode: 'dropdown', options: COMPACT } } },
      { name: 'text_size', selector: { select: { mode: 'dropdown', custom_value: true, options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }, { value: '2', label: 'Doppelt (2, auch die Zahlen in den Kacheln)' }, { value: '3', label: 'Dreifach (3)' }] } } },
      { name: 'animations', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Wie am Gerät eingestellt (Standard)' }, { value: 'always', label: 'Immer, auch bei "Bewegung reduzieren"' }] } } },
      { name: 'groups_lines', selector: { select: { mode: 'dropdown', options: [{ value: 'direkt', label: 'Eine Linie je Gerät oder Gruppe (Standard)' }, { value: 'sammel', label: 'Eine Sammel-Linie zum ganzen Verbraucherbereich' }] } } },
      { name: 'theme', selector: { select: { mode: 'dropdown', options: WD.THEME_OPTIONS } } },
      { name: 'language', selector: { select: { mode: 'dropdown', options: WD.LANG_OPTIONS } } },
      txt('nav_path'),
      txt('nav_label'),
    ],
    computeLabel: (s) => s.label || LABELS[s.name] || s.title || s.name,
    computeHelper: (s) => (s.name === 'language' ? 'Optional. Standard: Die Karte nutzt die Sprache aus deinem Home-Assistant-Profil (Deutsch, Englisch oder Niederländisch, sonst Deutsch). Hier legst du sie fest, zum Beispiel Deutsch, wenn Home Assistant auf Englisch läuft. Zahlen- und Uhrzeitformat richten sich nach deinem Profil. Die Editoren bleiben deutsch.' : s.name === 'why' ? 'Optional. Zeigt an der Netz-, der Solar- und der Batterie-Kachel ein „?“. Ein Tipp erklärt in einfachem Deutsch, woher der Netzbezug oder die Einspeisung kommt, warum Solar gerade so viel oder so wenig liefert und was die Batterie gerade tut oder warum sie nichts tut. Je mehr Verbraucher in der Karte stehen, desto genauer wird die Erklärung. Nur an einer Kachel: im YAML-Editor `why: [grid]`, `why: [pv]` oder `why: [battery]`.' : s.name === 'to_battery' ? 'Für Speicher mit eigenen Solarmodulen, zum Beispiel Anker SOLIX Solarbank: PV 2 läuft durch den Speicher, nicht direkt ins Haus. Nummer des Speichers wie in den Kacheln (1 = Batterie, 2 = erster Eintrag unter Weitere Speicher …). Der Speicher braucht „Ausgangsleistung ins Haus“ (AC-Abgabe) und gilt als hinter dem Zähler.' : s.name === 'power_in' ? 'AC-Leistung, die der Speicher aus dem Hausnetz zieht (bei Anker: „Netzbezugsleistung“). Ohne Angabe gilt 0.' : s.name === 'label_size' ? 'Optional. Vergrößert nur die kleinen Texte (Namen, Zusatzwerte, Beschriftungen) und lässt die Zahlen in den Kacheln, wie sie sind. Gut, wenn die Karte auf einen Bildschirm passen soll, die Beschriftungen aber zu klein sind. Beispiel: 1,5. Gilt vor der Textgröße.' : s.name === 'text_size' ? 'Normal, Groß, Sehr groß oder eine Zahl (zum Beispiel 2 oder 1,5). Eine Zahl vergrößert auch die Zahlen in den Kacheln. Wenn die Karte dadurch zu hoch wird, schalte „Auf Bildschirmhöhe skalieren“ aus.' : s.name === 'size' ? 'Normal, Mittel (eine Spalte, größere Zahl) oder Groß (breite Kachel mit großer Zahl). Gut für Wärmepumpe und Wallbox.' : s.name === 'weather' ? 'Zeigt unter der Kopfzeile ein Band mit dem Wetter des Tages (24 Stunden), dazu Temperatur sowie Sonnenaufgang und -untergang. Die Stundenwerte brauchen eine Wetter-Integration mit Vorhersage, zum Beispiel Met.no oder Deutscher Wetterdienst. Im YAML-Editor schaltet weather: auto die erste vorhandene Wetter-Entität ein.' : s.name === 'colors' ? 'Eigene Farben als #hex (zum Beispiel #22c55e) oder r,g,b. Leere Felder behalten die Standardfarbe. Batterie lädt und Batterie entlädt lassen sich getrennt einfärben.' : s.name === 'extra' ? 'Frei wählbare Zusatzwerte in dieser Kachel, zum Beispiel Spannung, Strom und Temperatur eines Wechselrichters. Jeder Eintrag braucht einen Sensor. Name und Einheit sind optional, ohne Angabe nimmt die Karte die des Sensors. Mit Warnung ab oder Warnung unter wird der Wert gelb.' : s.name === 'alarm' ? 'Optional. Ein Sensor, der einen Fehler meldet, zum Beispiel der Alarm oder Status des Wechselrichters. Bei einem Alarm erscheint in der Kachel ein roter Hinweis. Als Alarm gilt jeder Zustand außer off, ok, normal, none, false, idle und 0. Eigene Zustände (ok oder on) stellst du im YAML-Editor ein.' : s.name === 'title' ? 'Abfallkalender, Überschussvorschläge und Netzalarm stellst du im YAML-Editor ein.' : s.name === 'daily_from_total' ? 'Optional. Trage bei den Tageswerten (Bezug, Einspeisung, Ertrag, Batterie) Gesamtzähler ein, auch in Wh. Die Karte rechnet den Wert von heute selbst, aus der Langzeitstatistik.' : undefined),
  });

  // Assistent: Schritte mit Sensor-Vorschlägen
  const H = (...re) => re;
  const steps = () => [
    { short: 'Solar', title: 'Solaranlage', text: 'Wähle den Sensor, der die aktuelle Erzeugung der PV-Anlage in Watt anzeigt.', fields: [
      { path: 'pv.entity', label: 'PV-Leistung', kind: 'power', hints: H(/pv|solar|photovolt|inverter|wechselrichter|erzeugung/i, /input|eingang|power|leistung/i) },
      { path: 'pv.invert', label: 'Solar: Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn der Zähler die Erzeugung als negativen Wert meldet.' },
      { path: 'pv.daily', label: 'Tagesertrag (kWh)', kind: 'energy', optional: true, hints: H(/tag|daily|today|heute|yield|ertrag/i, /pv|solar|inverter/i) },
      { path: 'pv.daily_ac', label: 'Tagesertrag zählt ohne Batterie-Ladung', kind: 'bool', help: 'Für Hybrid-Wechselrichter, deren Tagesertrag nur die Abgabe des Wechselrichters zählt. Zeichen dafür: "Autarkie heute" steht bei 0 %, und "Haus heute" ist viel zu niedrig. Braucht "Geladen heute" und "Entladen heute" beim Speicher.' },
      { path: 'pv.forecast', label: 'Prognose heute (kWh oder Leistung in W/kW)', kind: 'forecast', optional: true, hints: H(/forecast|prognose|solcast|production|produktion/i, /today|heute|now|jetzt/i), help: 'Eine Tagesprognose in kWh (zum Beispiel Forecast.Solar "Energie Produktion heute" oder Solcast "Prognose heute") erscheint als "Prognose heute" in kWh. Eine Leistungsprognose in W/kW zeigt "Prognose" in Watt.' },
      { path: 'pv.forecast_tomorrow', label: 'Prognose morgen (kWh)', kind: 'energy', optional: true, hints: H(/tomorrow|morgen/i, /forecast|prognose|solcast|production|produktion|ertrag/i), help: 'Erwartete Produktion für morgen, zum Beispiel von Forecast.Solar oder Solcast. Erscheint als Kachel "PV morgen" unten in der Karte.' },
      { path: 'pv.forecast_day_after', label: 'Prognose übermorgen (kWh)', kind: 'energy', optional: true, hints: H(/day.?after|d2|uebermorgen|übermorgen|day_3|day3/i), help: 'Nicht jede Integration hat diesen Wert, Forecast.Solar zum Beispiel nicht.' },
      { path: 'forecast_swap', label: 'Prognose heute: unten neben morgen und übermorgen (ausführliche Ansicht)', kind: 'bool', help: 'Optional. Dann steht unten „Prognose heute“ neben morgen und übermorgen, und der bisherige Ertrag „Solar heute“ erscheint in der Solar-Kachel. Gilt für die ausführliche Ansicht. Für die Kurzansicht gibt es den Schalter darunter. Nur mit einer Tagesprognose in kWh als Prognose (heute).' },
      { path: 'compact_forecast', label: 'Prognose heute: in der Solar-Kachel (Kurzansicht)', kind: 'bool', help: 'Optional. Gilt nur für die Kurzansicht und mit eingetragener Prognose (pv.forecast): In der Solar-Kachel steht dann eine Zeile „Prognose heute … kWh“, alle anderen Zusatzzeilen bleiben ausgeblendet. Für die ausführliche Ansicht gibt es den Schalter darüber.' },
      { path: 'pv2.entity', label: 'Zweite Anlage, z. B. Balkonkraftwerk (Leistung)', kind: 'power', optional: true, hints: H(/bkw|balkon|pv2|solar2|plug|steckdose|shelly/i), help: 'Eigene Kachel und Linie. Die Bilanz (Autarkie, Eigenverbrauch, Herkunft) rechnet mit der Summe beider Anlagen.' },
      { path: 'pv2.name', label: 'Name der zweiten Anlage', kind: 'text', optional: true },
      { path: 'pv2.invert', label: 'Zweite Anlage: Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn der Sensor die Erzeugung als negativen Wert meldet.' },
      { path: 'pv2.daily', label: 'Tagesertrag der zweiten Anlage (kWh)', kind: 'energy', optional: true },
      { path: 'pv2.to_battery', label: 'Zweite Anlage läuft durch Speicher Nr.', kind: 'number', optional: true, help: 'Für Speicher mit eigenen Solarmodulen, zum Beispiel Anker SOLIX Solarbank. Nummer wie in den Kacheln: 1 = Batterie, 2 = der erste Speicher unter Weitere Speicher. Der Speicher braucht dann die Ausgangsleistung ins Haus (AC-Abgabe).' },
      { path: 'pv2.add_to_home', label: 'Hausverbrauch enthält die zweite Anlage nicht', kind: 'bool', help: 'Nur aktivieren, wenn dein Hausverbrauchs-Sensor den Ertrag der zweiten Anlage NICHT enthält. Dann addiert die Karte ihn dazu.' },
    ] },
    { short: 'Netz', title: 'Stromnetz', text: 'Der Netzsensor zeigt Bezug und Einspeisung. Wenn später Bezug als Einspeisung angezeigt wird, setze "Vorzeichen umkehren".', fields: [
      { path: 'grid.entity', label: 'Netzleistung', kind: 'power', hints: H(/grid|netz|meter|zähler|zaehler|wirkleistung|smart.?meter/i, /power|leistung/i) },
      { path: 'grid.invert', label: 'Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn der Sensor bei Einspeisung positive Werte liefert.' },
      { path: 'grid.daily_import', label: 'Netzbezug heute (kWh)', kind: 'energy', optional: true, hints: H(/import|bezug|verbrauch|consumption/i, /tag|daily|today|heute/i) },
      { path: 'grid.daily_export', label: 'Einspeisung heute (kWh)', kind: 'energy', optional: true, hints: H(/export|einspeis|feed/i, /tag|daily|today|heute/i) },
      { path: 'grid2.entity', label: 'Zweiter Netzzähler, z. B. Wärmepumpe (Leistung in Watt)', kind: 'power', optional: true, help: 'Nur für einen zweiten Zähler mit eigenem Tarif, der nur Strom bezieht. Er erscheint als Kachel bei den Verbrauchern, zählt zum Hausverbrauch und im Ring zum Netz. Bei drei Phasen den Summen-Sensor nehmen.' },
      { path: 'grid2.name', label: 'Name des zweiten Zählers', kind: 'text', optional: true },
      { path: 'grid2.price', label: 'Preis des zweiten Zählers (Sensor oder Helfer, pro kWh)', kind: 'price', optional: true },
      { path: 'grid2.price_ct', label: 'oder fester Preis (Cent pro kWh)', kind: 'number', optional: true, step: '0.01', help: 'Zum Beispiel 25.45. Der Preis zeigt die Kosten pro Stunde in der Kachel.' },
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
      { path: 'battery.power_out', label: 'Speicher mit eigenen Solarmodulen (z. B. Marstek B2500, Anker Solarbank): Ausgangsleistung ins Haus', kind: 'power', optional: true, hints: H(/ausgang|output|abgabe|ac.?out|hausabgabe/i, /batter|akku|speicher|storage|b2500|marstek|solarbank|solix/i), help: 'Hängen die Solarmodule direkt am Speicher, trägst du hier die Leistung ein, die der Speicher ans Haus abgibt (bei der Anker Solarbank zum Beispiel „AC-Hausabgabe“). Danach unten Solar läuft durch den Speicher auf Direkt stellen. Als Solar-Sensor dient die Eingangsleistung der Module.' },
      { path: 'pv_to_battery', label: 'Solar läuft durch den Speicher', kind: 'choice', options: PV_VIA, help: 'Nur für Speicher vor dem Wechselrichter, zum Beispiel Marstek B2500 oder Anker Solarbank. Braucht die Ausgangsleistung ins Haus (Feld darüber). Die Karte zeichnet dann Solar -> Speicher -> Haus und zeigt Durchleitung, wenn der Speicher weder lädt noch entlädt.' },
      { path: 'battery.invert', label: 'Vorzeichen umkehren', kind: 'bool', help: 'Aktivieren, wenn Laden negativ und Entladen positiv gemeldet wird.' },
      { path: 'battery.capacity_kwh', label: 'Kapazität (kWh)', kind: 'number', optional: true, help: 'Für die Prognose "voll um / reicht bis".' },
      { path: 'battery.temp', label: 'Temperatur', kind: 'temp', optional: true, hints: H(/batter|akku|speicher|storage|bat\d/i, /temp/i), help: 'Optional. Steht in der Kachel unter dem Ladestand.' },
      { path: 'battery.daily_charge', label: 'Geladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /geladen|lade|charge/i), help: 'Für "Autarkie heute" und "Haus heute". Ohne diese beiden Werte zählt der Batterie dort nicht als eigener Strom.' },
      { path: 'battery.daily_discharge', label: 'Entladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /entlad|discharge/i) },
      { path: 'battery.behind_meter', label: 'Speicher hinter dem Zähler', kind: 'bool', help: 'Nur für Speicher, die der Wechselrichter oder Netzzähler nicht kennt, zum Beispiel an der Steckdose. Seine Ladung zählt als Verbrauch, seine Abgabe als Quelle im Ring und im Hausverbrauch.' },
    ] },
    { short: 'Speicher', title: 'Weitere Speicher', text: 'Optional. Hast du mehr als einen Speicher, trage hier den zweiten und dritten ein, im nächsten Schritt den vierten und fünften. Jeder bekommt eine eigene Kachel, Ring und Tageswerte rechnen mit der Summe. Der erste Speicher steht im Schritt davor.', fields: [
      { path: 'batteries.0.name', label: 'Name von Speicher 2', kind: 'text', optional: true },
      { path: 'batteries.0.power', label: 'Speicher 2: Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i), help: 'Hat dein System getrennte Sensoren für Laden und Entladen, trägst du sie unter Alle Felder ein.' },
      { path: 'batteries.0.soc', label: 'Speicher 2: Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level/i, /batter|akku/i) },
      { path: 'batteries.0.capacity_kwh', label: 'Speicher 2: Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'batteries.0.power_out', label: 'Speicher 2: Ausgangsleistung ins Haus (AC-Abgabe)', kind: 'power', optional: true, hints: H(/ac.?aus|ausgang|output|abgabe|ac_output/i, /batter|akku|speicher|solarbank/i), help: 'Nur für Speicher mit eigenen Solarmodulen (siehe „Zweite Anlage läuft durch Speicher“). Bei der Anker Solarbank: „AC-Ausgang“.' },
      { path: 'batteries.0.power_in', label: 'Speicher 2: AC-Ladung aus dem Haus', kind: 'power', optional: true, hints: H(/netzbezug|ac.?ein|eingang|input|ac_input/i, /batter|akku|speicher|solarbank/i), help: 'Optional. Leistung, die der Speicher aus dem Hausnetz zieht. Bei der Anker Solarbank: „Netzbezugsleistung“. Ohne Angabe gilt 0.' },
      { path: 'batteries.0.temp', label: 'Speicher 2: Temperatur', kind: 'temp', optional: true, hints: H(/batter|akku|speicher|storage|bat\d/i, /temp/i) },
      { path: 'batteries.0.daily_charge', label: 'Speicher 2: Geladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /geladen|lade|charge/i) },
      { path: 'batteries.0.daily_discharge', label: 'Speicher 2: Entladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /entlad|discharge/i) },
      { path: 'batteries.0.behind_meter', label: 'Speicher 2: hinter dem Zähler', kind: 'bool', help: 'Nur für Speicher, die der Wechselrichter oder Netzzähler nicht kennt, zum Beispiel an der Steckdose. Seine Ladung zählt als Verbrauch, seine Abgabe als Quelle im Ring und im Hausverbrauch.' },
      { path: 'batteries.1.name', label: 'Name von Speicher 3', kind: 'text', optional: true },
      { path: 'batteries.1.power', label: 'Speicher 3: Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i) },
      { path: 'batteries.1.soc', label: 'Speicher 3: Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level/i, /batter|akku/i) },
      { path: 'batteries.1.capacity_kwh', label: 'Speicher 3: Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'batteries.1.temp', label: 'Speicher 3: Temperatur', kind: 'temp', optional: true, hints: H(/batter|akku|speicher|storage|bat\d/i, /temp/i) },
      { path: 'batteries.1.daily_charge', label: 'Speicher 3: Geladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /geladen|lade|charge/i) },
      { path: 'batteries.1.daily_discharge', label: 'Speicher 3: Entladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /entlad|discharge/i) },
      { path: 'batteries.1.behind_meter', label: 'Speicher 3: hinter dem Zähler', kind: 'bool', help: 'Nur für Speicher, die der Wechselrichter oder Netzzähler nicht kennt, zum Beispiel an der Steckdose. Seine Ladung zählt als Verbrauch, seine Abgabe als Quelle im Ring und im Hausverbrauch.' },
    ] },
    { short: 'Speicher 4/5', title: 'Noch mehr Speicher', text: 'Optional. Nur wenn du einen vierten oder fünften Speicher hast, zum Beispiel mehrere Solarbänke. Sonst einfach weiter. Per YAML (batteries) gehen auch mehr.', fields: [
      { path: 'batteries.2.name', label: 'Name von Speicher 4', kind: 'text', optional: true },
      { path: 'batteries.2.power', label: 'Speicher 4: Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i) },
      { path: 'batteries.2.soc', label: 'Speicher 4: Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level/i, /batter|akku/i) },
      { path: 'batteries.2.capacity_kwh', label: 'Speicher 4: Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'batteries.2.temp', label: 'Speicher 4: Temperatur', kind: 'temp', optional: true, hints: H(/batter|akku|speicher|storage|bat\d/i, /temp/i) },
      { path: 'batteries.2.daily_charge', label: 'Speicher 4: Geladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /geladen|lade|charge/i) },
      { path: 'batteries.2.daily_discharge', label: 'Speicher 4: Entladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /entlad|discharge/i) },
      { path: 'batteries.2.behind_meter', label: 'Speicher 4: hinter dem Zähler', kind: 'bool', help: 'Nur für Speicher, die der Wechselrichter oder Netzzähler nicht kennt, zum Beispiel an der Steckdose. Seine Ladung zählt als Verbrauch, seine Abgabe als Quelle im Ring und im Hausverbrauch.' },
      { path: 'batteries.3.name', label: 'Name von Speicher 5', kind: 'text', optional: true },
      { path: 'batteries.3.power', label: 'Speicher 5: Lade-/Entladeleistung', kind: 'power', optional: true, hints: H(/batter|akku|speicher|storage/i, /lade|charge|power|leistung/i) },
      { path: 'batteries.3.soc', label: 'Speicher 5: Ladestand (%)', kind: 'percent', optional: true, hints: H(/soc|ladestand|ladung|charge|level/i, /batter|akku/i) },
      { path: 'batteries.3.capacity_kwh', label: 'Speicher 5: Kapazität (kWh)', kind: 'number', optional: true },
      { path: 'batteries.3.temp', label: 'Speicher 5: Temperatur', kind: 'temp', optional: true, hints: H(/batter|akku|speicher|storage|bat\d/i, /temp/i) },
      { path: 'batteries.3.daily_charge', label: 'Speicher 5: Geladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /geladen|lade|charge/i) },
      { path: 'batteries.3.daily_discharge', label: 'Speicher 5: Entladen heute (kWh)', kind: 'energy', optional: true, hints: H(/batter|akku|speicher|storage/i, /tag|daily|today|heute/i, /entlad|discharge/i) },
      { path: 'batteries.3.behind_meter', label: 'Speicher 5: hinter dem Zähler', kind: 'bool', help: 'Nur für Speicher, die der Wechselrichter oder Netzzähler nicht kennt, zum Beispiel an der Steckdose. Seine Ladung zählt als Verbrauch, seine Abgabe als Quelle im Ring und im Hausverbrauch.' },
    ] },
    { short: 'Haus', title: 'Hausverbrauch', text: 'Optional. Ohne Angabe wird der Verbrauch aus Solar, Netz und Batterie berechnet.', fields: [
      { path: 'home.entity', label: 'Hausverbrauch', kind: 'power', optional: true, hints: H(/haus|home|house|verbrauch|consumption|load/i) },
      { path: 'home.daily', label: 'Hausverbrauch heute (kWh)', kind: 'energy', optional: true, help: 'Optional. Ohne Angabe berechnet die Karte den Wert aus PV-Ertrag, Netzbezug, Einspeisung und Batterie heute.' },
    ] },
    { short: 'Gas/Wasser', title: 'Gas, Öl und Wasser (optional)', text: 'Eigene Kacheln mit Linie zum Haus. Sie zählen nicht zum Strom: Hausverbrauch, Ring und Autarkie bleiben gleich. Überspringen, wenn du das nicht brauchst.', fields: [
      { path: 'gas.entity', label: 'Gas: Leistung der Therme (W oder kW)', kind: 'power', optional: true, hints: H(/gas|therme|heiz|boiler|brenner/i), help: 'Optional. Dann zeigt die Kachel groß die aktuelle Leistung, und die Linie läuft nur beim Heizen. Ohne steht groß der Verbrauch von heute.' },
      { path: 'gas.heating', label: 'Gas: Heizung heute (kWh oder m³)', kind: 'gas', optional: true, hints: H(/gas/i, /heiz|heating/i, /heute|today|daily|tag/i) },
      { path: 'gas.hot_water', label: 'Gas: Warmwasser heute (kWh oder m³)', kind: 'gas', optional: true, hints: H(/gas/i, /warmwasser|hot.?water|dhw|ww/i, /heute|today|daily|tag/i) },
      { path: 'gas.daily', label: 'oder nur: Gas heute gesamt (kWh oder m³)', kind: 'gas', optional: true, hints: H(/gas/i, /heute|today|daily|tag/i), help: 'Nur nötig, wenn es keine Aufteilung in Heizung und Warmwasser gibt.' },
      { path: 'gas.fuel', label: 'Brennstoff', kind: 'choice', options: [{ value: 'gas', label: 'Gas (Standard)' }, { value: 'oil', label: 'Öl (Anzeige in Litern, 1 Liter = 10 kWh)' }], help: 'Bei Öl zeigt die Kachel Liter und heißt „Öl“. Die Sensoren dürfen kWh, Liter oder m³ zählen. Die kWh je Liter stellst du im Reiter „Alle Felder“ ein.' },
      { path: 'gas.kwh_per_m3', label: 'Gas: kWh je m³', kind: 'number', optional: true, help: 'Nur bei Sensoren in m³. Steht auf der Gasrechnung als Brennwert × Zustandszahl, meist um 10. Ohne zeigt die Kachel m³.' },
      { path: 'water.entity', label: 'Wasser: Durchfluss (l/min oder m³/h)', kind: 'flow', optional: true, hints: H(/wasser|water/i, /fluss|flow|durchfluss/i) },
      { path: 'water.daily', label: 'Wasser: Verbrauch heute (Liter oder m³)', kind: 'water', optional: true, hints: H(/wasser|water/i, /heute|today|daily|tag/i) },
      { path: 'water.name', label: 'Wasser: Name der Kachel', kind: 'text', optional: true, help: 'Zum Beispiel „Trinkwasser“. Mit einem zweiten Zähler (zum Beispiel Zisterne) tragen beide einen Namen.' },
      { path: 'water2.daily', label: 'Zweiter Wasserzähler: Verbrauch heute (Liter oder m³)', kind: 'water', optional: true, hints: H(/zisterne|regen|garten|wasser.*2|water.*2/i, /heute|today|daily|tag/i), help: 'Optional. Eine eigene Kachel, zum Beispiel für Zisternenwasser. Einen dritten Zähler und Durchfluss-Sensoren gibt es im Reiter „Alle Felder“.' },
      { path: 'water2.name', label: 'Zweiter Wasserzähler: Name', kind: 'text', optional: true },
    ] },
    { short: 'Verbraucher', title: 'Einzelverbraucher', text: 'Wähle Geräte mit eigenem Leistungssensor, zum Beispiel Wärmepumpe, Wallbox oder Trockner. Gruppen (z. B. je Raum) findest du unter "Alle Felder".', fields: [
      { path: 'consumers', label: 'Verbraucher', kind: 'list', max: 30, minusKey: 'minus', minusLabel: 'Optional, nur bei zwei Zählern hintereinander: Davon abziehen (Differenz, z. B. Haushaltszähler):' },
      { path: 'rest_min', label: 'Kachel "Nicht erfasst" erst anzeigen ab (% vom Hausverbrauch)', kind: 'number', optional: true, step: '1', help: 'Zum Beispiel 10: Die Kachel erscheint nur, wenn mindestens 10 % des Hausverbrauchs keiner Gruppe zugeordnet sind.' },
      { path: 'groups_columns', label: 'Gruppen pro Reihe', kind: 'number', optional: true, step: '1', help: 'Leer: alle Gruppen nebeneinander in einer Reihe. 1: jede Gruppe in einer eigenen Reihe über die volle Breite, die Namen sind dann besser lesbar. Stehen Gruppen untereinander, zeichnet die Karte eine Sammel-Linie.' },
      { path: 'hide_zero', label: 'Ruhende Verbraucher ausblenden', kind: 'bool', help: 'Optional. Verbraucher, Gruppen und Geräte in Gruppen verschwinden, wenn sie unter „Aktiv ab“ (Standard 10 W) liegen, und erscheinen sofort wieder, sobald sie laufen. Damit nichts flackert, müssen sie 30 Sekunden ruhen (einstellbar mit „hide_zero_delay“ im YAML). Sie zählen weiter zum Hausverbrauch und zu „Nicht erfasst“.' },
      { path: 'consumers_top', label: 'Nur die größten Verbraucher zeigen (Anzahl)', kind: 'number', optional: true, step: '1', help: 'Zum Beispiel 8: Von allen eingetragenen Verbrauchern erscheinen nur die 8 mit der höchsten Leistung, nach Leistung absteigend. Die Reihenfolge wechselt erst nach 30 Sekunden, damit die Kacheln nicht springen. Leer: alle zeigen.' },
      { path: 'show_rest', label: 'Kachel "Nicht erfasst" zeigen', kind: 'bool', help: 'Zeigt bei einzelnen Verbrauchern ohne Gruppen eine Kachel mit dem Teil des Hausverbrauchs, der keinem Gerät zugeordnet ist (Hausverbrauch minus Summe der Verbraucher). Bei Gruppen erscheint sie ohnehin.' },
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
      { path: 'language', label: 'Sprache der Karte', kind: 'choice', options: WD.LANG_OPTIONS, help: 'Optional. Standard: Die Karte nutzt die Sprache aus deinem Home-Assistant-Profil (Deutsch, Englisch oder Niederländisch, sonst Deutsch). Hier legst du sie fest, zum Beispiel Deutsch, wenn Home Assistant auf Englisch läuft. Zahlen- und Uhrzeitformat richten sich nach deinem Profil. Die Editoren bleiben deutsch.' },
      { path: 'watt_only', label: 'Leistung immer in Watt anzeigen', kind: 'bool', help: 'Standard: ab 1000 W wird auf kW umgeschaltet. Aktiviert: immer Watt, zum Beispiel 2.350 W.' },
      { path: 'style', label: 'Darstellung', kind: 'choice', options: STYLE, help: 'Mit 3D zeigt die Karte Haus, Solar, Netz und Speicher als Objekte. Die Werte bleiben gleich.' },
      { path: 'house_style', label: 'Haus in der 3D-Ansicht', kind: 'choice', options: HOUSE },
      { path: 'grid_side', label: 'Netz-Kachel: Seite', kind: 'choice', options: GRIDSIDE, help: 'Optional. Mit "Rechts" steht die Netz-Kachel rechts neben dem Haus (mit Batterie darüber), links bleibt nur Solar. Das spart Höhe, besonders am Handy, in der Kurzansicht und ohne Batterie. Nicht in der 3D-Ansicht.' },
      { path: 'home_icon_color', label: 'Farbe des Haus-Symbols', kind: 'choice', options: HOMEICO, help: 'Optional. Mit "Nach Autarkie" färbt sich das Symbol im Ring: grün bei 100 % Autarkie (kein Netzbezug), gelb von 50 bis 99 %, rot darunter. Standard bleibt Türkis.' },
      { path: 'home_color', label: 'Farbe der Zahl beim Haus', kind: 'choice', options: HOMECOL, help: 'Mit "Farbe der größten Quelle" nimmt die Zahl über dem Haus die Farbe des größten Anteils im Ring an.' },
      { path: 'compact', label: 'Kurzansicht', kind: 'choice', options: COMPACT, help: 'Kompakte Übersicht auf einen Blick: Solar, Netz und Batterie neben dem Ring, Gruppen ohne Geräteliste, ohne Zusatztexte. Ein Tipp auf eine Gruppe zeigt alle ihre Geräte. "Nur auf dem Handy" zeigt auf dem Tablet weiter die ausführliche Ansicht.' },
      { path: 'weather', label: 'Wetter (Himmelsband)', kind: 'weather', optional: true, hints: H(/forecast|home|haus|zuhause|dwd|met|wetter/i), help: 'Optional. Zeigt unter der Kopfzeile ein Band mit dem Wetter der nächsten Stunden, dazu Temperatur sowie Sonnenaufgang und -untergang. Die Stundenwerte brauchen eine Wetter-Integration mit Vorhersage (zum Beispiel Met.no oder Deutscher Wetterdienst). Im YAML-Editor schaltet weather: auto die erste vorhandene Wetter-Entität ein.' },
      { path: 'why', label: 'Warum?-Erklärung (? an Netz, Solar und Batterie)', kind: 'bool', help: 'Optional. Zeigt an der Netz-, der Solar- und der Batterie-Kachel ein „?“. Ein Tipp erklärt in einfachem Deutsch, woher der Netzbezug oder die Einspeisung kommt, warum Solar gerade so viel oder so wenig liefert und was die Batterie gerade tut oder warum sie nichts tut. Je mehr Verbraucher in der Karte stehen, desto genauer wird die Erklärung. Nur an einer Kachel: im YAML-Editor `why: [grid]`, `why: [pv]` oder `why: [battery]`.' },
      { path: 'animations', label: 'Animationen', kind: 'choice', options: [{ value: 'auto', label: 'Wie am Gerät eingestellt (Standard)' }, { value: 'always', label: 'Immer, auch bei "Bewegung reduzieren"' }], help: 'Ist am Handy oder Tablet "Bewegung reduzieren" eingeschaltet (iPhone: Einstellungen → Bedienungshilfen → Bewegung), stehen Linien und Ring still. "Immer" animiert trotzdem.' },
      { path: 'text_size', label: 'Textgröße', kind: 'choice', options: [{ value: 'normal', label: 'Normal (Standard)' }, { value: 'gross', label: 'Groß' }, { value: 'sehr_gross', label: 'Sehr groß (für Handy und Tablet)' }, { value: '2', label: 'Doppelt (2, auch die Zahlen in den Kacheln)' }, { value: '3', label: 'Dreifach (3)' }], help: 'Groß und Sehr groß vergrößern die kleinen Texte, zum Beispiel Ladestand, Kennzahlen oben rechts und Beschriftungen. Doppelt und Dreifach (eine Zahl) vergrößern zusätzlich die Zahlen in den Kacheln. Im Formular unter Alle Felder kannst du auch eine eigene Zahl eintragen, zum Beispiel 1,5. Wird die Karte dadurch zu hoch, schalte Auf Bildschirmhöhe skalieren aus.' },
    ] },
    { short: 'Fertig', title: 'Zusammenfassung', text: 'Alles ist gespeichert. Mit "Fertig" siehst du alle Felder, zum Beispiel für Gruppen. Abfallkalender, Überschussvorschläge und Netzalarm stellst du im YAML-Editor ein.', summary: (c) => [
      `Solar: ${(c.pv && c.pv.entity) || 'nicht gewählt'}`,
      `Netz: ${(c.grid && c.grid.entity) || 'nicht gewählt'}${c.grid && c.grid.invert ? ' (umgekehrt)' : ''}`,
      `Batterie: ${(c.battery && (c.battery.power || c.battery.power_charge)) || 'keine'}${WD.toList(c.batteries).filter((b) => b && (b.power || b.power_charge || b.soc)).length ? ' und ' + WD.toList(c.batteries).filter((b) => b && (b.power || b.power_charge || b.soc)).length + ' weitere' : ''}`,
      `Haus: ${(c.home && c.home.entity) || 'berechnet'}`,
      `Einzelverbraucher: ${WD.toList(c.consumers).filter((x) => x && x.entity).length}`,
      `Preise: ${c.grid_price || typeof c.grid_price_ct === 'number' ? 'Bezug gesetzt' : 'keine'}`,
    ] },
  ];

  WD.defineEditor('energy-cockpit-flow-card-editor', {
    needsSetup: (c) => !(c.pv && c.pv.entity) && !(c.grid && c.grid.entity),
    steps,
    form: () => WD.flowForm(),
  });
})();
