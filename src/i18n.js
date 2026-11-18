/* Texte (nur Deutsch). */
(() => {
  const L = {
    de: {
      'flow.title': 'Energiefluss', 'flow.pv': 'Solar', 'flow.pv2': 'Solar 2', 'flow.grid2': 'Zweiter Zähler', 'flow.grid': 'Netz', 'flow.battery': 'Batterie', 'flow.home': 'Hausverbrauch',
      'flow.cons_total': 'Verbraucher', 'flow.rest': 'Nicht erfasst', 'flow.restpct': '{n} % gemessen', 'flow.soc': 'Ladestand', 'flow.temp': 'Temperatur',
      'flow.next': 'Weiter →', 'flow.error': 'Mindestens pv oder grid konfigurieren',
      'pill.aut': 'Autarkie jetzt', 'pill.self': 'Eigenverbrauch jetzt', 'pv.use.home': 'Haus', 'pv.use.bat': 'Batterie', 'pv.use.grid': 'Netz', 'pv.use.store': 'Speicher',
      'stat.pv': 'Solar heute', 'stat.fc1': 'Solar morgen', 'stat.fc2': 'Solar übermorgen', 'stat.imp': 'Bezug heute', 'stat.exp': 'Einspeisung', 'stat.bat': 'Batterie ± heute', 'stat.aut': 'Autarkie heute',
      'mix.pv': 'Solar', 'mix.bat': 'Batterie', 'mix.grid': 'Netz',
      'tag.offline': 'Offline', 'tag.producing': 'Erzeugung', 'tag.idle': 'Inaktiv', 'tag.balanced': 'Ausgeglichen',
      'tag.import': 'Bezug', 'tag.export': 'Einspeisung', 'tag.standby': 'Inaktiv', 'tag.charging': 'Ladung', 'tag.discharging': 'Entladung', 'tag.passthrough': 'Durchleitung',
      'bat.io': 'Eingang <b>{in}</b> · Ausgang <b>{out}</b>', 'bat.split': ' (Haus <b>{home}</b> · Netz <b>{grid}</b>)', 'bat.shared': 'Gemeinsamer Sensor mit <b>{name}</b>',
      'forecast': 'Prognose', 'forecast.day': 'Prognose heute', 'offline': 'offline',
      'ka.on': '● Wach', 'ka.wait': '☝ Einmal tippen – Bildschirm bleibt an',
      'waste.today': 'Heute', 'waste.tomorrow': 'Morgen',
      'bat.usable_pct': 'nutzbar', 'bat.usable_slow': '<div class="sr"><span>Nutzbar</span> <b>{kwh} kWh</b></div><div class="sr"><span>Laden</span> <b>langsam</b></div>', 'bat.full_at': '<div class="sr"><span>Voll um</span> <b>{time}</b></div><div class="sr"><span>Voll in</span> <b>{dur}</b></div>',
      'bat.last_24': '<div class="sr"><span>Reicht</span> <b>über 24 h</b></div><div class="sr"><span>Nutzbar</span> <b>{kwh} kWh</b></div>', 'bat.last_until': '<div class="sr"><span>Leer um</span> <b>{time}</b></div><div class="sr"><span>Leer in</span> <b>{dur}</b></div>',
      'bat.full': '<div class="sr"><span>Nutzbar</span> <b>{kwh} kWh</b></div>', 'bat.usable': '<div class="sr"><span>Nutzbar</span> <b>{kwh} kWh</b></div><div class="sr"><span>Reserve</span> <b>{res} %</b></div>', 'bat.usable0': '<div class="sr"><span>Nutzbar</span> <b>{kwh} kWh</b></div>',
      'dur.2days': '> 2 Tage',
      'ban.surplus': '{w} Überschuss', 'ban.batfull': 'Batterie voll – ', 'ban.tonet': 'Strom fließt ins Netz · selbst nutzen spart <b>{gain} {cur}/h</b>',
      'ban.running': '{name} läuft', 'ban.fromgrid': '{w} aus dem Netz', 'ban.cost': 'kostet gerade <b>{cost} {cur}/h</b>',
      'ban.batempty': 'Batterie leer', 'ban.batlimit': 'Batterie am Limit',
    },
  };
  // T('key', { n: 5 }) ersetzt {n}; fehlende Schlüssel fallen auf Englisch, dann auf den Schlüssel zurück
  WD.T = (k, vars) => {
    let s = L.de[k] || k;
    if (vars) Object.keys(vars).forEach((v) => { s = s.split('{' + v + '}').join(vars[v]); });
    return s;
  };
  WD.addStrings = (de) => { Object.assign(L.de, de); };
  WD.fDur = (hrs) => {
    if (!isFinite(hrs) || hrs <= 0) return '';
    if (hrs > 48) return WD.T('dur.2days');
    const m = Math.round(hrs * 60), hh = Math.floor(m / 60), mm = m % 60;
    return hh ? `${hh} h ${String(mm).padStart(2, '0')} min` : `${mm} min`;
  };
})();
