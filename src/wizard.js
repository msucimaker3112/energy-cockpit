/* Editor der Statistik-Karte: Assistent (Schritt für Schritt) und Formular (alle Felder). */
(() => {
  // ---------------------------------------------------------------------------
  // Texte (DE / EN / NL)
  // ed.s.f.*  = Formular-Labels (alle Felder)
  // ed.s.st.* = Schritte des Assistenten (short / title / text)
  // ed.s.w.*  = Feld-Labels im Assistenten, ed.s.h.* = Hilfetexte
  // ed.s.sum.* = Zusammenfassung
  // ---------------------------------------------------------------------------
  WD.addStrings({
    'ed.s.f.title': 'Titel', 'ed.s.f.pv_total': 'PV Gesamtertrag (Zähler, kWh)', 'ed.s.f.grid_import_total': 'Netzbezug gesamt (Zähler, kWh)', 'ed.s.f.grid_export_total': 'Einspeisung gesamt (Zähler, kWh)',
    'ed.s.f.battery_charge_total': 'Batterie geladen gesamt (kWh)', 'ed.s.f.battery_discharge_total': 'Batterie entladen gesamt (kWh)', 'ed.s.f.battery_capacity_kwh': 'Batteriekapazität (kWh)', 'ed.s.f.battery_temp': 'Batterietemperatur',
    'ed.s.f.pv_today': 'PV heute (kWh)', 'ed.s.f.import_today': 'Netzbezug heute (kWh, nicht der Gesamtverbrauch)', 'ed.s.f.export_today': 'Einspeisung heute (kWh)', 'ed.s.f.charge_today': 'Batterie geladen heute (kWh)', 'ed.s.f.discharge_today': 'Batterie entladen heute (kWh)',
    'ed.s.f.feed_in_card': 'Kachel Einspeiseerlös', 'ed.s.f.home_power': 'Hausverbrauch (Leistung, für Grundlast)', 'ed.s.f.grid_price': 'Strompreis Bezug (Sensor, pro kWh)', 'ed.s.f.feed_in': 'Einspeisevergütung (Sensor, pro kWh)', 'ed.s.f.grid_price_ct': 'oder fester Strompreis (Cent pro kWh)',
    'ed.s.f.investment_eur': 'Anschaffungskosten der PV-Anlage (Euro, fest)', 'ed.s.f.theme': 'Farbschema', 'ed.s.f.accent': 'Akzentfarbe (z. B. 34,197,94 oder #22c55e)', 'ed.s.f.feed_in_ct': 'oder feste Einspeisevergütung (Cent pro kWh)',
    'ed.s.f.investment': 'Anschaffungskosten PV-Anlage (Sensor oder input_number)', 'ed.s.f.earned_before_eur': 'Bereits erwirtschaftet vor Beginn der Zähler (Euro)', 'ed.s.f.earned_before': 'oder bereits erwirtschaftet aus Sensor oder Helfer (Euro)',
    'ed.s.f.nav_path': 'Weiter-Schaltfläche: Pfad', 'ed.s.f.nav_label': 'Weiter-Schaltfläche: Text', 'ed.s.f.fit_screen': 'Auf Bildschirmhöhe skalieren',
    'ed.s.f.cost_consumers': 'Kosten je Verbraucher (Liste, siehe Assistent)', 'ed.s.f.grid_price_history': 'Frühere Strompreise (Liste, siehe Assistent)', 'ed.s.f.pv_ac': 'PV-Zähler zählt ohne Akku-Ladung (Hybrid-Wechselrichter)',
    'ed.s.f.long_term': 'Langzeit-Ansicht (alle Jahre, Reiter "Gesamt")', 'ed.s.f.pv_history': 'Importierte PV-Historie (Statistik-ID)', 'ed.s.f.pv_history_until': 'Historie gilt bis einschließlich (JJJJ-MM)', 'ed.s.f.pv_history_name': 'Bezeichnung der Historie',
    'ed.s.fic.standard': 'Einspeiseerlös (Standard)', 'ed.s.fic.self': 'PV-Eigenverbrauch stattdessen', 'ed.s.fic.hidden': 'Ausblenden',

    'ed.s.st.meters.short': 'Zähler', 'ed.s.st.meters.title': 'Gesamtzähler', 'ed.s.st.meters.text': 'Diese drei Zähler sind Pflicht. Sie zählen dauerhaft hoch (kWh seit Inbetriebnahme).',
    'ed.s.st.battery.short': 'Batterie', 'ed.s.st.battery.title': 'Batterie (optional)', 'ed.s.st.battery.text': 'Für Wirkungsgrad, Vollzyklen und genauere Autarkie.',
    'ed.s.st.today.short': 'Heute', 'ed.s.st.today.title': 'Tageswerte (optional)', 'ed.s.st.today.text': 'Für die Ansicht "Heute".',
    'ed.s.st.prices.short': 'Preise', 'ed.s.st.prices.title': 'Preise, Haus und Anlage (optional)', 'ed.s.st.prices.text': 'Mit Preisen zeigt die Karte Geldwerte. Die Anschaffungskosten ergeben die Amortisation, der Hausverbrauch die nächtliche Grundlast.',
    'ed.s.st.costs.short': 'Kosten', 'ed.s.st.costs.title': 'Kosten je Verbraucher (optional)', 'ed.s.st.costs.text': 'Zeigt je Gerät die Netzkosten und was Solar und Akku gespart haben, heute, in dieser Woche, im Monat und im Jahr. Weitere Verbraucher gehen unter "Alle Felder" oder in YAML.',
    'ed.s.st.longterm.short': 'Langzeit', 'ed.s.st.longterm.title': 'Langzeit-Ansicht (optional)', 'ed.s.st.longterm.text': 'Standardmäßig aus. Eingeschaltet zeigt die Karte alle Jahre aus der Langzeitstatistik von Home Assistant: Jahre blättern, Reiter "Gesamt" und Hinweise auf fehlende Monate. Ausgeschaltet bleibt die Karte wie bisher.',
    'ed.s.st.look.short': 'Aussehen', 'ed.s.st.look.title': 'Farbschema', 'ed.s.st.look.text': 'Dunkel ist die Voreinstellung. Mit "Automatisch" folgt die Karte dem hellen oder dunklen Design von Home Assistant, "Home Assistant" übernimmt dessen Farben.',
    'ed.s.st.done.short': 'Fertig', 'ed.s.st.done.title': 'Zusammenfassung', 'ed.s.st.done.text': 'Alles ist gespeichert. Mit "Fertig" siehst du alle Felder.',
  // Liste aller passenden Entitäten (Leistung, Energie, Prozent, Preis, Schalter ...)
  const list = (hass, kind) => {
    const out = [];
    if (!hass || !hass.states) return out;
    Object.keys(hass.states).forEach((id) => {
      const s = hass.states[id], a = s.attributes || {}, u = a.unit_of_measurement || '', dc = a.device_class || '';
      const dom = id.split('.')[0];
      let ok = false;
      if (kind === 'power') ok = dom === 'sensor' && (POWER_UNITS.indexOf(u) >= 0 || dc === 'power');
      else if (kind === 'energy') ok = dom === 'sensor' && (ENERGY_UNITS.indexOf(u) >= 0 || dc === 'energy');
      // Prognose: Leistung in W/kW oder Tagesprognose in kWh (zum Beispiel Forecast.Solar "Energie Produktion heute")
      else if (kind === 'forecast') ok = dom === 'sensor' && (POWER_UNITS.indexOf(u) >= 0 || ENERGY_UNITS.indexOf(u) >= 0 || dc === 'power' || dc === 'energy');
      else if (kind === 'percent') ok = (dom === 'sensor' || dom === 'number') && (u === '%' || dc === 'battery');
      else if (kind === 'temp') ok = dom === 'sensor' && (u === '°C' || dc === 'temperature');
      else if (kind === 'price') ok = (dom === 'input_number' || dom === 'sensor' || dom === 'number') && (/\/\s*kWh|ct|€|eur/i.test(u) || /preis|price|tarif|verg/i.test(id + ' ' + (a.friendly_name || '')));
      else if (kind === 'money') ok = (dom === 'input_number' || dom === 'sensor' || dom === 'number') && (/€|eur/i.test(u) || /anschaff|invest|kosten|cost/i.test(id + ' ' + (a.friendly_name || '')));
      else if (kind === 'switch') ok = ['switch', 'light', 'input_boolean'].indexOf(dom) >= 0;
      if (ok) out.push({ id, name: a.friendly_name || id, state: s.state, unit: u });
    });
    return out.sort((x, y) => x.name.localeCompare(y.name, 'de'));
  };

    'ed.s.w.pv_total': 'PV Gesamtertrag', 'ed.s.w.grid_import_total': 'Netzbezug gesamt', 'ed.s.w.grid_export_total': 'Einspeisung gesamt',
    'ed.s.w.battery_charge_total': 'Batterie geladen gesamt', 'ed.s.w.battery_discharge_total': 'Batterie entladen gesamt', 'ed.s.w.battery_capacity_kwh': 'Kapazität (kWh)', 'ed.s.w.battery_temp': 'Batterietemperatur',
    'ed.s.w.pv_ac': 'PV-Zähler zählt ohne Akku-Ladung', 'ed.s.h.pv_ac': 'Für Hybrid-Wechselrichter, deren Zähler nur ihre Abgabe zählen. Zeichen dafür: "Autarkie" ist zu niedrig, oder der Verbrauch wirkt zu klein.',
    'ed.s.w.pv_today': 'PV heute', 'ed.s.w.import_today': 'Netzbezug heute (nicht der Gesamtverbrauch)', 'ed.s.w.export_today': 'Einspeisung heute', 'ed.s.w.charge_today': 'Batterie geladen heute', 'ed.s.w.discharge_today': 'Batterie entladen heute',
    'ed.s.w.grid_price': 'Strompreis Bezug', 'ed.s.w.grid_price_ct': 'oder fester Strompreis (Cent pro kWh)', 'ed.s.h.grid_price_ct': 'Ohne Sensor oder Helfer: einfach den Preis aus deiner Rechnung eintragen, zum Beispiel 34.',
    'ed.s.w.hist_until': 'Früherer Preis {n}: gültig bis (JJJJ-MM-TT)', 'ed.s.w.hist_ct': 'Früherer Preis {n}: Cent pro kWh',
    'ed.s.h.hist': 'Für die Kosten je Verbraucher: So rechnen vergangene Monate mit dem Preis von damals. Danach gilt der Preis oben. Ein Sensor mit Langzeitstatistik, etwa bei dynamischem Tarif, braucht das nicht.',
    'ed.s.w.feed_in': 'Einspeisevergütung', 'ed.s.w.feed_in_ct': 'oder feste Einspeisevergütung (Cent pro kWh)',
    'ed.s.w.investment_eur': 'Anschaffungskosten der PV-Anlage (Euro)', 'ed.s.h.investment_eur': 'Gesamtpreis der Anlage laut Rechnung, zum Beispiel 18000. Damit berechnet die Karte die Amortisation.',
    'ed.s.w.investment': 'oder Anschaffungskosten aus einem Sensor oder Helfer',
    'ed.s.w.earned_before_eur': 'Bereits erwirtschaftet vor Beginn der Zähler (Euro)', 'ed.s.h.earned_before_eur': 'Nur nötig, wenn die Anlage schon lief, bevor Home Assistant die Zähler erfasst hat. Der Betrag wird zur Amortisation addiert.',
    'ed.s.w.home_power': 'Hausverbrauch (Leistung)',
    'ed.s.w.cc_name': 'Verbraucher {n}: Name', 'ed.s.h.cc_name': 'Zum Beispiel E-Auto oder Wärmepumpe. Symbol und Farbe wählt die Karte selbst, in YAML gehen auch eigene.',
    'ed.s.w.cc_energy': 'Verbraucher {n}: Energie', 'ed.s.h.cc_energy': 'Gesamtzähler in kWh. Die Karte teilt ihn jede Stunde so auf, wie das Haus gerade versorgt wurde. Das ist eine Schätzung.',
    'ed.s.w.cc_power': 'Verbraucher {n}: Leistung',
    'ed.s.w.cc_grid': 'Verbraucher {n}: Energie aus dem Netz', 'ed.s.h.cc_grid': 'Nur wenn du eigene Zähler je Quelle hast, zum Beispiel von der Wallbox. Dann misst die Karte, statt zu schätzen, und braucht den Zähler oben nicht.',
    'ed.s.w.cc_battery': 'Verbraucher {n}: Energie aus dem Akku', 'ed.s.w.cc_pv': 'Verbraucher {n}: Energie aus PV',
    'ed.s.w.long_term': 'Langzeit-Ansicht einschalten',
    'ed.s.w.pv_history': 'Importierte PV-Historie (nur mit Langzeit-Ansicht)', 'ed.s.h.pv_history': 'Nur für zuvor importierte Altdaten: Statistik-ID eintragen, zum Beispiel sensor:deye_ac_historisch. Die Werte erscheinen nur in den Balken und bei "PV gesamt", Geldwerte und Autarkie bleiben unverändert.',
    'ed.s.w.pv_history_until': 'Historie gilt bis einschließlich (JJJJ-MM)', 'ed.s.h.pv_history_until': 'Zum Beispiel 2026-04. Ohne Angabe füllt die Historie nur Monate, für die dein PV-Zähler keine Werte hat.',
    'ed.s.w.pv_history_name': 'Bezeichnung der Historie', 'ed.s.h.pv_history_name': 'Steht in der Legende, zum Beispiel "AC-Abgabe". Sonst "Historie".',
    'ed.s.w.theme': 'Farbschema',

    'ed.s.sum.pv': 'PV gesamt: {v}', 'ed.s.sum.imp': 'Netzbezug gesamt: {v}', 'ed.s.sum.exp': 'Einspeisung gesamt: {v}', 'ed.s.sum.bat': 'Batterie: {v}',
    'ed.s.sum.price': 'Preise: {v}', 'ed.s.sum.cc': 'Kosten je Verbraucher: {v}', 'ed.s.sum.lt': 'Langzeit-Ansicht: {v}',
    'ed.s.sum.unset': 'nicht gewählt', 'ed.s.sum.yes': 'ja', 'ed.s.sum.no': 'nein', 'ed.s.sum.set': 'gesetzt', 'ed.s.sum.none': 'keine', 'ed.s.sum.on': 'ein', 'ed.s.sum.off': 'aus',
  }, 'de');

  WD.addStrings({
    'ed.s.f.title': 'Title', 'ed.s.f.pv_total': 'PV total yield (meter, kWh)', 'ed.s.f.grid_import_total': 'Grid import total (meter, kWh)', 'ed.s.f.grid_export_total': 'Grid export total (meter, kWh)',
    'ed.s.f.battery_charge_total': 'Battery charged total (kWh)', 'ed.s.f.battery_discharge_total': 'Battery discharged total (kWh)', 'ed.s.f.battery_capacity_kwh': 'Battery capacity (kWh)', 'ed.s.f.battery_temp': 'Battery temperature',
    'ed.s.f.pv_today': 'PV today (kWh)', 'ed.s.f.import_today': 'Grid import today (kWh, not total consumption)', 'ed.s.f.export_today': 'Grid export today (kWh)', 'ed.s.f.charge_today': 'Battery charged today (kWh)', 'ed.s.f.discharge_today': 'Battery discharged today (kWh)',
    'ed.s.f.feed_in_card': 'Feed-in revenue tile', 'ed.s.f.home_power': 'Home consumption (power, for base load)', 'ed.s.f.grid_price': 'Import electricity price (sensor, per kWh)', 'ed.s.f.feed_in': 'Feed-in tariff (sensor, per kWh)', 'ed.s.f.grid_price_ct': 'or fixed electricity price (cents per kWh)',
    'ed.s.f.investment_eur': 'PV system purchase cost (euros, fixed)', 'ed.s.f.theme': 'Color scheme', 'ed.s.f.accent': 'Accent color (e.g. 34,197,94 or #22c55e)', 'ed.s.f.feed_in_ct': 'or fixed feed-in tariff (cents per kWh)',
    'ed.s.f.investment': 'PV system purchase cost (sensor or input_number)', 'ed.s.f.earned_before_eur': 'Already earned before the meters started (euros)', 'ed.s.f.earned_before': 'or already earned, from a sensor or helper (euros)',
    'ed.s.f.nav_path': 'Next button: path', 'ed.s.f.nav_label': 'Next button: text', 'ed.s.f.fit_screen': 'Scale to screen height',
    'ed.s.f.cost_consumers': 'Cost per consumer (list, see wizard)', 'ed.s.f.grid_price_history': 'Previous electricity prices (list, see wizard)', 'ed.s.f.pv_ac': 'PV meter excludes battery charging (hybrid inverter)',
    'ed.s.f.long_term': 'Long-term view (all years, "Total" tab)', 'ed.s.f.pv_history': 'Imported PV history (statistic ID)', 'ed.s.f.pv_history_until': 'History applies up to and including (YYYY-MM)', 'ed.s.f.pv_history_name': 'History label',
    'ed.s.fic.standard': 'Feed-in revenue (default)', 'ed.s.fic.self': 'PV self-consumption instead', 'ed.s.fic.hidden': 'Hide',

    'ed.s.st.meters.short': 'Meters', 'ed.s.st.meters.title': 'Total meters', 'ed.s.st.meters.text': 'These three meters are required. They count up continuously (kWh since commissioning).',
    'ed.s.st.battery.short': 'Battery', 'ed.s.st.battery.title': 'Battery (optional)', 'ed.s.st.battery.text': 'For efficiency, full cycles and more accurate self-sufficiency.',
    'ed.s.st.today.short': 'Today', 'ed.s.st.today.title': 'Daily values (optional)', 'ed.s.st.today.text': 'For the "Today" view.',
    'ed.s.st.prices.short': 'Prices', 'ed.s.st.prices.title': 'Prices, home and system (optional)', 'ed.s.st.prices.text': 'With prices, the card shows monetary values. The purchase cost gives the payback, home consumption the nightly base load.',
    'ed.s.st.costs.short': 'Costs', 'ed.s.st.costs.title': 'Cost per consumer (optional)', 'ed.s.st.costs.text': 'Shows the grid costs per device and what solar and battery saved, today, this week, this month and this year. Add more consumers under "All fields" or in YAML.',
    'ed.s.st.longterm.short': 'Long-term', 'ed.s.st.longterm.title': 'Long-term view (optional)', 'ed.s.st.longterm.text': 'Off by default. When on, the card shows all years from Home Assistant’s long-term statistics: browse years, a "Total" tab and notes on missing months. When off, the card stays as before.',
    'ed.s.st.look.short': 'Appearance', 'ed.s.st.look.title': 'Color scheme', 'ed.s.st.look.text': 'Dark is the default. With "Automatic" the card follows Home Assistant’s light or dark theme; "Home Assistant" uses its colors.',
    'ed.s.st.done.short': 'Done', 'ed.s.st.done.title': 'Summary', 'ed.s.st.done.text': 'Everything is saved. Press "Done" to see all fields.',

    'ed.s.w.pv_total': 'PV total yield', 'ed.s.w.grid_import_total': 'Grid import total', 'ed.s.w.grid_export_total': 'Grid export total',
    'ed.s.w.battery_charge_total': 'Battery charged total', 'ed.s.w.battery_discharge_total': 'Battery discharged total', 'ed.s.w.battery_capacity_kwh': 'Capacity (kWh)', 'ed.s.w.battery_temp': 'Battery temperature',
    'ed.s.w.pv_ac': 'PV meter excludes battery charging', 'ed.s.h.pv_ac': 'For hybrid inverters whose meter only counts their output. Signs of this: "Self-sufficiency" is too low, or consumption seems too small.',
    'ed.s.w.pv_today': 'PV today', 'ed.s.w.import_today': 'Grid import today (not total consumption)', 'ed.s.w.export_today': 'Grid export today', 'ed.s.w.charge_today': 'Battery charged today', 'ed.s.w.discharge_today': 'Battery discharged today',
    'ed.s.w.grid_price': 'Import electricity price', 'ed.s.w.grid_price_ct': 'or fixed electricity price (cents per kWh)', 'ed.s.h.grid_price_ct': 'Without a sensor or helper: just enter the price from your bill, for example 34.',
    'ed.s.w.hist_until': 'Previous price {n}: valid until (YYYY-MM-DD)', 'ed.s.w.hist_ct': 'Previous price {n}: cents per kWh',
    'ed.s.h.hist': 'For cost per consumer: past months are calculated with the price at that time. After that, the price above applies. A sensor with long-term statistics, such as for a dynamic tariff, does not need this.',
    'ed.s.w.feed_in': 'Feed-in tariff', 'ed.s.w.feed_in_ct': 'or fixed feed-in tariff (cents per kWh)',
    'ed.s.w.investment_eur': 'PV system purchase cost (euros)', 'ed.s.h.investment_eur': 'Total price of the system according to the invoice, for example 18000. The card uses it to calculate the payback.',
    'ed.s.w.investment': 'or purchase cost from a sensor or helper',
    'ed.s.w.earned_before_eur': 'Already earned before the meters started (euros)', 'ed.s.h.earned_before_eur': 'Only needed if the system was already running before Home Assistant recorded the meters. The amount is added to the payback.',
    'ed.s.w.home_power': 'Home consumption (power)',
    'ed.s.w.cc_name': 'Consumer {n}: name', 'ed.s.h.cc_name': 'For example EV or heat pump. The card picks the icon and color itself; you can set your own in YAML.',
    'ed.s.w.cc_energy': 'Consumer {n}: energy', 'ed.s.h.cc_energy': 'Total meter in kWh. Every hour, the card splits it according to how the home was being supplied. This is an estimate.',
    'ed.s.w.cc_power': 'Consumer {n}: power',
    'ed.s.w.cc_grid': 'Consumer {n}: energy from grid', 'ed.s.h.cc_grid': 'Only if you have separate meters per source, for example from the wallbox. The card then measures instead of estimating and does not need the meter above.',
    'ed.s.w.cc_battery': 'Consumer {n}: energy from battery', 'ed.s.w.cc_pv': 'Consumer {n}: energy from PV',
    'ed.s.w.long_term': 'Enable long-term view',
    'ed.s.w.pv_history': 'Imported PV history (long-term view only)', 'ed.s.h.pv_history': 'Only for previously imported legacy data: enter the statistic ID, for example sensor:deye_ac_historisch. The values only appear in the bars and in "PV total"; monetary values and self-sufficiency stay unchanged.',
    'ed.s.w.pv_history_until': 'History applies up to and including (YYYY-MM)', 'ed.s.h.pv_history_until': 'For example 2026-04. If left empty, the history only fills months for which your PV meter has no values.',
    'ed.s.w.pv_history_name': 'History label', 'ed.s.h.pv_history_name': 'Shown in the legend, for example "AC output". Otherwise "History".',
    'ed.s.w.theme': 'Color scheme',

    'ed.s.sum.pv': 'PV total: {v}', 'ed.s.sum.imp': 'Grid import total: {v}', 'ed.s.sum.exp': 'Grid export total: {v}', 'ed.s.sum.bat': 'Battery: {v}',
    'ed.s.sum.price': 'Prices: {v}', 'ed.s.sum.cc': 'Cost per consumer: {v}', 'ed.s.sum.lt': 'Long-term view: {v}',
    'ed.s.sum.unset': 'not selected', 'ed.s.sum.yes': 'yes', 'ed.s.sum.no': 'no', 'ed.s.sum.set': 'set', 'ed.s.sum.none': 'none', 'ed.s.sum.on': 'on', 'ed.s.sum.off': 'off',
  }, 'en');

  WD.addStrings({
    'ed.s.f.title': 'Titel', 'ed.s.f.pv_total': 'PV totale opbrengst (meter, kWh)', 'ed.s.f.grid_import_total': 'Netafname totaal (meter, kWh)', 'ed.s.f.grid_export_total': 'Teruglevering totaal (meter, kWh)',
    'ed.s.f.battery_charge_total': 'Batterij geladen totaal (kWh)', 'ed.s.f.battery_discharge_total': 'Batterij ontladen totaal (kWh)', 'ed.s.f.battery_capacity_kwh': 'Batterijcapaciteit (kWh)', 'ed.s.f.battery_temp': 'Batterijtemperatuur',
    'ed.s.f.pv_today': 'PV vandaag (kWh)', 'ed.s.f.import_today': 'Netafname vandaag (kWh, niet het totale verbruik)', 'ed.s.f.export_today': 'Teruglevering vandaag (kWh)', 'ed.s.f.charge_today': 'Batterij geladen vandaag (kWh)', 'ed.s.f.discharge_today': 'Batterij ontladen vandaag (kWh)',
    'ed.s.f.feed_in_card': 'Tegel terugleveropbrengst', 'ed.s.f.home_power': 'Huisverbruik (vermogen, voor basislast)', 'ed.s.f.grid_price': 'Stroomprijs afname (sensor, per kWh)', 'ed.s.f.feed_in': 'Terugleververgoeding (sensor, per kWh)', 'ed.s.f.grid_price_ct': 'of vaste stroomprijs (cent per kWh)',
    'ed.s.f.investment_eur': 'Aanschafkosten van de PV-installatie (euro, vast)', 'ed.s.f.theme': 'Kleurenschema', 'ed.s.f.accent': 'Accentkleur (bijv. 34,197,94 of #22c55e)', 'ed.s.f.feed_in_ct': 'of vaste terugleververgoeding (cent per kWh)',
    'ed.s.f.investment': 'Aanschafkosten PV-installatie (sensor of input_number)', 'ed.s.f.earned_before_eur': 'Al opgebracht vóór de start van de meters (euro)', 'ed.s.f.earned_before': 'of al opgebracht, uit sensor of helper (euro)',
    'ed.s.f.nav_path': 'Volgende-knop: pad', 'ed.s.f.nav_label': 'Volgende-knop: tekst', 'ed.s.f.fit_screen': 'Schalen naar schermhoogte',
    'ed.s.f.cost_consumers': 'Kosten per verbruiker (lijst, zie assistent)', 'ed.s.f.grid_price_history': 'Eerdere stroomprijzen (lijst, zie assistent)', 'ed.s.f.pv_ac': 'PV-meter telt zonder acculaden (hybride omvormer)',
    'ed.s.f.long_term': 'Langetermijnweergave (alle jaren, tabblad "Totaal")', 'ed.s.f.pv_history': 'Geïmporteerde PV-geschiedenis (statistiek-ID)', 'ed.s.f.pv_history_until': 'Geschiedenis geldt tot en met (JJJJ-MM)', 'ed.s.f.pv_history_name': 'Naam van de geschiedenis',
    'ed.s.fic.standard': 'Terugleveropbrengst (standaard)', 'ed.s.fic.self': 'In plaats daarvan PV-eigen verbruik', 'ed.s.fic.hidden': 'Verbergen',

    'ed.s.st.meters.short': 'Meters', 'ed.s.st.meters.title': 'Totaalmeters', 'ed.s.st.meters.text': 'Deze drie meters zijn verplicht. Ze tellen continu op (kWh sinds ingebruikname).',
    'ed.s.st.battery.short': 'Batterij', 'ed.s.st.battery.title': 'Batterij (optioneel)', 'ed.s.st.battery.text': 'Voor rendement, volledige cycli en een nauwkeurigere zelfvoorziening.',
    'ed.s.st.today.short': 'Vandaag', 'ed.s.st.today.title': 'Dagwaarden (optioneel)', 'ed.s.st.today.text': 'Voor de weergave "Vandaag".',
    'ed.s.st.prices.short': 'Prijzen', 'ed.s.st.prices.title': 'Prijzen, huis en installatie (optioneel)', 'ed.s.st.prices.text': 'Met prijzen toont de kaart geldbedragen. De aanschafkosten geven de terugverdientijd, het huisverbruik de nachtelijke basislast.',
    'ed.s.st.costs.short': 'Kosten', 'ed.s.st.costs.title': 'Kosten per verbruiker (optioneel)', 'ed.s.st.costs.text': 'Toont per apparaat de netkosten en wat zon en accu hebben bespaard, vandaag, deze week, deze maand en dit jaar. Meer verbruikers voeg je toe onder "Alle velden" of in YAML.',
    'ed.s.st.longterm.short': 'Lange termijn', 'ed.s.st.longterm.title': 'Langetermijnweergave (optioneel)', 'ed.s.st.longterm.text': 'Standaard uit. Ingeschakeld toont de kaart alle jaren uit de langetermijnstatistieken van Home Assistant: door jaren bladeren, een tabblad "Totaal" en meldingen over ontbrekende maanden. Uitgeschakeld blijft de kaart zoals voorheen.',
    'ed.s.st.look.short': 'Uiterlijk', 'ed.s.st.look.title': 'Kleurenschema', 'ed.s.st.look.text': 'Donker is de standaard. Met "Automatisch" volgt de kaart het lichte of donkere thema van Home Assistant, "Home Assistant" neemt de kleuren daarvan over.',
    'ed.s.st.done.short': 'Klaar', 'ed.s.st.done.title': 'Samenvatting', 'ed.s.st.done.text': 'Alles is opgeslagen. Met "Klaar" zie je alle velden.',

    'ed.s.w.pv_total': 'PV totale opbrengst', 'ed.s.w.grid_import_total': 'Netafname totaal', 'ed.s.w.grid_export_total': 'Teruglevering totaal',
    'ed.s.w.battery_charge_total': 'Batterij geladen totaal', 'ed.s.w.battery_discharge_total': 'Batterij ontladen totaal', 'ed.s.w.battery_capacity_kwh': 'Capaciteit (kWh)', 'ed.s.w.battery_temp': 'Batterijtemperatuur',
    'ed.s.w.pv_ac': 'PV-meter telt zonder acculaden', 'ed.s.h.pv_ac': 'Voor hybride omvormers waarvan de meter alleen hun eigen afgifte telt. Kenmerken: "Zelfvoorziening" is te laag, of het verbruik lijkt te klein.',
    'ed.s.w.pv_today': 'PV vandaag', 'ed.s.w.import_today': 'Netafname vandaag (niet het totale verbruik)', 'ed.s.w.export_today': 'Teruglevering vandaag', 'ed.s.w.charge_today': 'Batterij geladen vandaag', 'ed.s.w.discharge_today': 'Batterij ontladen vandaag',
    'ed.s.w.grid_price': 'Stroomprijs afname', 'ed.s.w.grid_price_ct': 'of vaste stroomprijs (cent per kWh)', 'ed.s.h.grid_price_ct': 'Zonder sensor of helper: vul gewoon de prijs van je rekening in, bijvoorbeeld 34.',
    'ed.s.w.hist_until': 'Eerdere prijs {n}: geldig tot (JJJJ-MM-DD)', 'ed.s.w.hist_ct': 'Eerdere prijs {n}: cent per kWh',
    'ed.s.h.hist': 'Voor de kosten per verbruiker: zo rekenen voorbije maanden met de prijs van toen. Daarna geldt de prijs hierboven. Een sensor met langetermijnstatistieken, bijvoorbeeld bij een dynamisch tarief, heeft dit niet nodig.',
    'ed.s.w.feed_in': 'Terugleververgoeding', 'ed.s.w.feed_in_ct': 'of vaste terugleververgoeding (cent per kWh)',
    'ed.s.w.investment_eur': 'Aanschafkosten van de PV-installatie (euro)', 'ed.s.h.investment_eur': 'Totaalprijs van de installatie volgens de factuur, bijvoorbeeld 18000. Daarmee berekent de kaart de terugverdientijd.',
    'ed.s.w.investment': 'of aanschafkosten uit een sensor of helper',
    'ed.s.w.earned_before_eur': 'Al opgebracht vóór de start van de meters (euro)', 'ed.s.h.earned_before_eur': 'Alleen nodig als de installatie al draaide voordat Home Assistant de meters bijhield. Het bedrag wordt bij de terugverdiening opgeteld.',
    'ed.s.w.home_power': 'Huisverbruik (vermogen)',
    'ed.s.w.cc_name': 'Verbruiker {n}: naam', 'ed.s.h.cc_name': 'Bijvoorbeeld elektrische auto of warmtepomp. Pictogram en kleur kiest de kaart zelf; in YAML kun je ook eigen instellen.',
    'ed.s.w.cc_energy': 'Verbruiker {n}: energie', 'ed.s.h.cc_energy': 'Totaalmeter in kWh. De kaart verdeelt die elk uur op basis van hoe het huis op dat moment werd gevoed. Dit is een schatting.',
    'ed.s.w.cc_power': 'Verbruiker {n}: vermogen',
    'ed.s.w.cc_grid': 'Verbruiker {n}: energie uit het net', 'ed.s.h.cc_grid': 'Alleen als je aparte meters per bron hebt, bijvoorbeeld van de laadpaal. Dan meet de kaart in plaats van te schatten en is de meter hierboven niet nodig.',
    'ed.s.w.cc_battery': 'Verbruiker {n}: energie uit de accu', 'ed.s.w.cc_pv': 'Verbruiker {n}: energie uit PV',
    'ed.s.w.long_term': 'Langetermijnweergave inschakelen',
    'ed.s.w.pv_history': 'Geïmporteerde PV-geschiedenis (alleen met langetermijnweergave)', 'ed.s.h.pv_history': 'Alleen voor eerder geïmporteerde oude gegevens: vul het statistiek-ID in, bijvoorbeeld sensor:deye_ac_historisch. De waarden verschijnen alleen in de staven en bij "PV totaal"; geldbedragen en zelfvoorziening blijven ongewijzigd.',
    'ed.s.w.pv_history_until': 'Geschiedenis geldt tot en met (JJJJ-MM)', 'ed.s.h.pv_history_until': 'Bijvoorbeeld 2026-04. Zonder waarde vult de geschiedenis alleen maanden waarvoor je PV-meter geen waarden heeft.',
    'ed.s.w.pv_history_name': 'Naam van de geschiedenis', 'ed.s.h.pv_history_name': 'Staat in de legenda, bijvoorbeeld "AC-afgifte". Anders "Geschiedenis".',
    'ed.s.w.theme': 'Kleurenschema',

    'ed.s.sum.pv': 'PV totaal: {v}', 'ed.s.sum.imp': 'Netafname totaal: {v}', 'ed.s.sum.exp': 'Teruglevering totaal: {v}', 'ed.s.sum.bat': 'Batterij: {v}',
    'ed.s.sum.price': 'Prijzen: {v}', 'ed.s.sum.cc': 'Kosten per verbruiker: {v}', 'ed.s.sum.lt': 'Langetermijnweergave: {v}',
    'ed.s.sum.unset': 'niet gekozen', 'ed.s.sum.yes': 'ja', 'ed.s.sum.no': 'nee', 'ed.s.sum.set': 'ingesteld', 'ed.s.sum.none': 'geen', 'ed.s.sum.on': 'aan', 'ed.s.sum.off': 'uit',
  }, 'nl');

  // ---------------------------------------------------------------------------
  // Hilfsfunktionen
  // ---------------------------------------------------------------------------
  const T = (k, v) => WD.T(k, v);
  // Formular-Label; ohne Übersetzung bleibt der Feldname stehen
  const LBL = (name) => { const k = 'ed.s.f.' + name, s = T(k); return s === k ? name : s; };
  const W = (key, vars) => T('ed.s.w.' + key, vars);
  const help = (on, key) => (on ? { help: T('ed.s.h.' + key) } : {});
  const step = (id, extra) => ({ short: T(`ed.s.st.${id}.short`), title: T(`ed.s.st.${id}.title`), text: T(`ed.s.st.${id}.text`), ...extra });

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
      { name: 'feed_in_card', selector: { select: { mode: 'dropdown', options: [
        { value: 'standard', label: T('ed.s.fic.standard') },
        { value: 'pv_self_consumption', label: T('ed.s.fic.self') },
        { value: 'hidden', label: T('ed.s.fic.hidden') },
      ] } } },
      { name: 'investment_eur', selector: { number: { min: 0, max: 1000000, step: 50, mode: 'box' } } },
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
    computeLabel: (s) => LBL(s.name),
  });

  // Suchmuster für Vorschläge im Assistenten (Deutsch, Englisch, Niederländisch)
  const H = (...re) => re;
  const TOTAL = /gesamt|total|totaal|lifetime|energie|energy/i;
  const DAY = /tag|dag|daily|today|heute/i;
  const BAT = /batter|akku|accu/i;
  const PV = /pv|solar|inverter|wechselrichter|omvormer|ertrag|opbrengst|yield/i;

  const steps = () => [
    step('meters', { fields: [
      { path: 'pv_total', label: W('pv_total'), kind: 'energy', hints: H(PV, TOTAL) },
      { path: 'grid_import_total', label: W('grid_import_total'), kind: 'energy', hints: H(/import|bezug|verbrauch|consumption|grid|afname|verbruik/i, TOTAL) },
      { path: 'grid_export_total', label: W('grid_export_total'), kind: 'energy', hints: H(/export|einspeis|feed|teruglever/i, TOTAL) },
    ] }),
    step('battery', { fields: [
      { path: 'battery_charge_total', label: W('battery_charge_total'), kind: 'energy', optional: true, hints: H(/ladung|charge|geladen|laad/i, BAT, TOTAL) },
      { path: 'battery_discharge_total', label: W('battery_discharge_total'), kind: 'energy', optional: true, hints: H(/entlad|ontlaad|discharge/i, BAT, TOTAL) },
      { path: 'battery_capacity_kwh', label: W('battery_capacity_kwh'), kind: 'number', optional: true },
      { path: 'battery_temp', label: W('battery_temp'), kind: 'temp', optional: true, hints: H(BAT, /temp/i) },
    ] }),
    step('today', { fields: [
      { path: 'pv_ac', label: W('pv_ac'), kind: 'bool', ...help(true, 'pv_ac') },
      { path: 'pv_today', label: W('pv_today'), kind: 'energy', optional: true, hints: H(DAY, PV) },
      { path: 'import_today', label: W('import_today'), kind: 'energy', optional: true, hints: H(DAY, /import|bezug|verbrauch|afname|verbruik/i) },
      { path: 'export_today', label: W('export_today'), kind: 'energy', optional: true, hints: H(DAY, /export|einspeis|teruglever/i) },
      { path: 'charge_today', label: W('charge_today'), kind: 'energy', optional: true, hints: H(DAY, /lad|laad|charge/i) },
      { path: 'discharge_today', label: W('discharge_today'), kind: 'energy', optional: true, hints: H(DAY, /entlad|ontlaad|discharge/i) },
    ] }),
    step('prices', { fields: [
      { path: 'grid_price', label: W('grid_price'), kind: 'price', optional: true, hints: H(/bezug|netz|strom|stroom|import|grid|price|preis|prijs|tarief/i) },
      { path: 'grid_price_ct', label: W('grid_price_ct'), kind: 'number', optional: true, step: '0.1', ...help(true, 'grid_price_ct') },
      ...[0, 1, 2].flatMap((i) => [
        { path: `grid_price_history.${i}.until`, label: W('hist_until', { n: i + 1 }), kind: 'text', optional: true, ...help(i === 0, 'hist') },
        { path: `grid_price_history.${i}.ct`, label: W('hist_ct', { n: i + 1 }), kind: 'number', optional: true, step: '0.01' },
      ]),
      { path: 'feed_in', label: W('feed_in'), kind: 'price', optional: true, hints: H(/einspeis|vergüt|verguet|feed|export|teruglever|vergoeding/i) },
      { path: 'feed_in_ct', label: W('feed_in_ct'), kind: 'number', optional: true, step: '0.1' },
      { path: 'investment_eur', label: W('investment_eur'), kind: 'number', optional: true, step: '50', ...help(true, 'investment_eur') },
      { path: 'investment', label: W('investment'), kind: 'money', optional: true, hints: H(/anschaff|aanschaf|invest|kosten|cost/i) },
      { path: 'earned_before_eur', label: W('earned_before_eur'), kind: 'number', optional: true, step: '1', ...help(true, 'earned_before_eur') },
      { path: 'home_power', label: W('home_power'), kind: 'power', optional: true, hints: H(/haus|huis|home|house|verbrauch|verbruik|consumption|load/i) },
    ] }),
    step('costs', { fields: [0, 1, 2, 3].flatMap((i) => {
      const n = { n: i + 1 }, p = `cost_consumers.${i}`, first = i === 0;
      return [
        { path: `${p}.name`, label: W('cc_name', n), kind: 'text', optional: true, ...help(first, 'cc_name') },
        { path: `${p}.energy`, label: W('cc_energy', n), kind: 'energy', optional: true, ...help(first, 'cc_energy') },
        { path: `${p}.power`, label: W('cc_power', n), kind: 'power', optional: true },
        { path: `${p}.grid`, label: W('cc_grid', n), kind: 'energy', optional: true, ...help(first, 'cc_grid') },
        { path: `${p}.battery`, label: W('cc_battery', n), kind: 'energy', optional: true },
        { path: `${p}.pv`, label: W('cc_pv', n), kind: 'energy', optional: true },
      ];
    }) }),
    step('longterm', { fields: [
      { path: 'long_term', label: W('long_term'), kind: 'bool' },
      { path: 'pv_history', label: W('pv_history'), kind: 'text', optional: true, ...help(true, 'pv_history') },
      { path: 'pv_history_until', label: W('pv_history_until'), kind: 'text', optional: true, ...help(true, 'pv_history_until') },
      { path: 'pv_history_name', label: W('pv_history_name'), kind: 'text', optional: true, ...help(true, 'pv_history_name') },
    ] }),
    step('look', { fields: [
      { path: 'theme', label: W('theme'), kind: 'theme' },
    ] }),
    step('done', { summary: (c) => {
      const S = (k) => T('ed.s.sum.' + k);
      return [
        T('ed.s.sum.pv', { v: c.pv_total || S('unset') }),
        T('ed.s.sum.imp', { v: c.grid_import_total || S('unset') }),
        T('ed.s.sum.exp', { v: c.grid_export_total || S('unset') }),
        T('ed.s.sum.bat', { v: c.battery_charge_total ? S('yes') : S('no') }),
        T('ed.s.sum.price', { v: c.grid_price || typeof c.grid_price_ct === 'number' ? S('set') : S('none') }),
        T('ed.s.sum.cc', { v: c.cost_consumers ? Object.keys(c.cost_consumers).length : S('none') }),
        T('ed.s.sum.lt', { v: c.long_term ? S('on') : S('off') }),
      ];
    } }),
  ];

  WD.defineEditor('energy-cockpit-stats-card-editor', {
    needsSetup: (c) => !c.pv_total || !c.grid_import_total || !c.grid_export_total,
    steps,
    form: () => WD.statsForm(),
  });
})();