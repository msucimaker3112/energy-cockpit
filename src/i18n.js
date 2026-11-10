/* Texte (nur Deutsch). */
(() => {
  const L = {
    de: {
      'flow.title': 'Energiefluss', 'flow.pv': 'PV-Anlage', 'flow.pv2': 'PV 2', 'flow.grid2': 'Zweiter Zähler', 'flow.grid': 'Netz', 'flow.battery': 'Batterie', 'flow.home': 'Hausverbrauch',
      'flow.cons_total': 'Verbraucher', 'flow.rest': 'Nicht erfasst', 'flow.restpct': '{n} % gemessen', 'flow.soc': 'Ladestand', 'flow.temp': 'Temperatur',
      'flow.next': 'Weiter →', 'flow.error': 'Mindestens pv oder grid konfigurieren',
      'pill.aut': 'Autarkie jetzt', 'pill.self': 'Eigenverbrauch jetzt', 'pv.use.home': 'Haus', 'pv.use.bat': 'Batterie', 'pv.use.grid': 'Netz', 'pv.use.store': 'Speicher',
      'stat.pv': 'PV heute', 'stat.fc1': 'PV morgen', 'stat.fc2': 'PV übermorgen', 'stat.imp': 'Bezug heute', 'stat.exp': 'Einspeisung', 'stat.bat': 'Batterie ± heute', 'stat.aut': 'Autarkie heute',
      'mix.pv': 'Solar', 'mix.bat': 'Akku', 'mix.grid': 'Netz',
      'tag.offline': 'Offline', 'tag.producing': 'Erzeugt', 'tag.idle': 'Inaktiv', 'tag.balanced': 'Ausgeglichen',
      'tag.import': 'Bezug', 'tag.export': 'Einspeisung', 'tag.standby': 'Standby', 'tag.charging': 'Lädt', 'tag.discharging': 'Entlädt', 'tag.passthrough': 'Durchleitung',
      'bat.io': 'Eingang <b>{in}</b> · Ausgang <b>{out}</b>', 'bat.split': ' (Haus <b>{home}</b> · Netz <b>{grid}</b>)', 'bat.shared': 'Gemeinsamer Sensor mit <b>{name}</b>',
      'forecast': 'Prognose', 'forecast.day': 'Prognose heute', 'offline': 'offline',
      'ka.on': '● Wach', 'ka.wait': '☝ Einmal tippen – Bildschirm bleibt an',
      'waste.today': 'Heute', 'waste.tomorrow': 'Morgen',
      'bat.usable_pct': 'nutzbar', 'bat.usable_slow': '<b>{kwh} kWh</b> nutzbar · lädt langsam', 'bat.full_at': 'Voll um <b>{time}</b> · in {dur}',
      'bat.last_24': 'Reicht <b>über 24 h</b> · {kwh} kWh nutzbar', 'bat.last_until': 'Reicht bis <b>{time}</b> · noch {dur}',
      'bat.full': 'Voll · <b>{kwh} kWh</b> nutzbar', 'bat.usable': '<b>{kwh} kWh</b> nutzbar (bis {res} %)',
      'dur.2days': '> 2 Tage',
      'ban.surplus': '{w} Überschuss', 'ban.batfull': 'Akku voll – ', 'ban.tonet': 'Strom fließt ins Netz · selbst nutzen spart <b>{gain} {cur}/h</b>',
      'ban.running': '{name} läuft', 'ban.fromgrid': '{w} aus dem Netz', 'ban.cost': 'kostet gerade <b>{cost} {cur}/h</b>',
      'ban.batempty': 'Akku leer', 'ban.batlimit': 'Akku am Limit',
    },
   fr: {
  'flow.title': 'Flux énergétique', 'flow.pv': 'Panneaux solaires', 'flow.pv2': 'PV 2', 'flow.grid2': 'Deuxième compteur', 'flow.grid': 'Réseau', 'flow.battery': 'Batterie', 'flow.home': 'Consommation maison',
  'flow.cons_total': 'Consommateurs', 'flow.rest': 'Non mesuré', 'flow.restpct': '{n} % mesuré', 'flow.soc': 'Charge', 'flow.temp': 'Température',
  'flow.next': 'Suite →', 'flow.error': 'Configurer au moins pv ou grid',
  'pill.aut': 'Autosuffisance', 'pill.self': 'Autoconsommation', 'pv.use.home': 'Maison', 'pv.use.bat': 'Batterie', 'pv.use.grid': 'Réseau', 'pv.use.store': 'Stockage',
  'stat.pv': 'PV aujourd\'hui', 'stat.fc1': 'PV demain', 'stat.fc2': 'PV après-demain', 'stat.imp': 'Soutirage aujourd\'hui', 'stat.exp': 'Injection', 'stat.bat': 'Batterie ± aujourd\'hui', 'stat.aut': 'Autosuffisance aujourd\'hui',
  'mix.pv': 'Solaire', 'mix.bat': 'Batterie', 'mix.grid': 'Réseau',
  'tag.offline': 'Hors ligne', 'tag.producing': 'Production', 'tag.idle': 'Inactif', 'tag.balanced': 'Équilibré',
  'tag.import': 'Soutirage', 'tag.export': 'Injection', 'tag.standby': 'Veille', 'tag.charging': 'Charge', 'tag.discharging': 'Décharge', 'tag.passthrough': 'Transit',
  'bat.io': 'Entrée <b>{in}</b> · Sortie <b>{out}</b>', 'bat.split': ' (Maison <b>{home}</b> · Réseau <b>{grid}</b>)', 'bat.shared': 'Capteur partagé avec <b>{name}</b>',
  'forecast': 'Prévision', 'forecast.day': 'Prévision aujourd\'hui', 'offline': 'hors ligne',
  'ka.on': '● Actif', 'ka.wait': '☝ Appuyer une fois – l\'écran reste allumé',
  'waste.today': 'Aujourd\'hui', 'waste.tomorrow': 'Demain',
  'bat.usable_pct': 'utilisable', 'bat.usable_slow': '<b>{kwh} kWh</b> utilisable · charge lente', 'bat.full_at': 'Plein à <b>{time}</b> · dans {dur}',
  'bat.last_24': 'Suffisant <b>plus de 24 h</b> · {kwh} kWh utilisable', 'bat.last_until': 'Suffisant jusqu\'à <b>{time}</b> · encore {dur}',
  'bat.full': 'Plein · <b>{kwh} kWh</b> utilisable', 'bat.usable': '<b>{kwh} kWh</b> utilisable (jusqu\'à {res} %)',
  'dur.2days': '> 2 jours',
  'ban.surplus': '{w} surplus', 'ban.batfull': 'Batterie pleine – ', 'ban.tonet': 'Courant injecté au réseau · l\'autoconsommation économise <b>{gain} {cur}/h</b>',
  'ban.running': '{name} en marche', 'ban.fromgrid': '{w} depuis le réseau', 'ban.cost': 'coûte actuellement <b>{cost} {cur}/h</b>',
  'ban.batempty': 'Batterie vide', 'ban.batlimit': 'Batterie à la limite',
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
