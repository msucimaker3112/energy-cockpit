/* Texte (nur Deutsch). */
(() => {
  const L = {
    de: {
      'flow.title': 'Energiefluss', 'flow.pv': 'PV-Anlage', 'flow.pv2': 'PV 2', 'flow.grid': 'Netz', 'flow.battery': 'Batterie', 'flow.home': 'Hausverbrauch',
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
      'months': ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
      'months_long': ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      'days': ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    },
    en: {
      'flow.title': 'Energy flow', 'flow.pv': 'PV system', 'flow.pv2': 'PV 2', 'flow.grid': 'Grid', 'flow.battery': 'Battery', 'flow.home': 'Home consumption',
      'flow.cons_total': 'Consumers', 'flow.rest': 'Unmeasured', 'flow.restpct': '{n}% measured', 'flow.soc': 'State of charge', 'flow.temp': 'Temperature',
      'flow.next': 'Next →', 'flow.error': 'Configure at least pv or grid',
      'pill.aut': 'Self-sufficiency now', 'pill.self': 'Self-consumption now', 'pv.use.home': 'Home', 'pv.use.bat': 'Battery', 'pv.use.grid': 'Grid', 'pv.use.store': 'Storage',
      'stat.pv': 'PV today', 'stat.fc1': 'PV tomorrow', 'stat.fc2': 'PV day after tomorrow', 'stat.imp': 'Import today', 'stat.exp': 'Export', 'stat.bat': 'Battery ± today', 'stat.aut': 'Self-sufficiency today',
      'mix.pv': 'Solar', 'mix.bat': 'Battery', 'mix.grid': 'Grid',
      'tag.offline': 'Offline', 'tag.producing': 'Producing', 'tag.idle': 'Idle', 'tag.balanced': 'Balanced',
      'tag.import': 'Importing', 'tag.export': 'Exporting', 'tag.standby': 'Standby', 'tag.charging': 'Charging', 'tag.discharging': 'Discharging', 'tag.passthrough': 'Pass-through',
      'bat.io': 'In <b>{in}</b> · Out <b>{out}</b>', 'bat.split': ' (Home <b>{home}</b> · Grid <b>{grid}</b>)', 'bat.shared': 'Shared sensor with <b>{name}</b>',
      'forecast': 'Forecast', 'forecast.day': 'Forecast today', 'offline': 'offline',
      'ka.on': '● Awake', 'ka.wait': '☝ Tap once – screen stays on',
      'waste.today': 'Today', 'waste.tomorrow': 'Tomorrow',
      'bat.usable_pct': 'usable', 'bat.usable_slow': '<b>{kwh} kWh</b> usable · charging slowly', 'bat.full_at': 'Full at <b>{time}</b> · in {dur}',
      'bat.last_24': 'Lasts <b>over 24 h</b> · {kwh} kWh usable', 'bat.last_until': 'Lasts until <b>{time}</b> · {dur} left',
      'bat.full': 'Full · <b>{kwh} kWh</b> usable', 'bat.usable': '<b>{kwh} kWh</b> usable (down to {res}%)',
      'dur.2days': '> 2 days',
      'ban.surplus': '{w} surplus', 'ban.batfull': 'Battery full – ', 'ban.tonet': 'Power is flowing to the grid · using it yourself saves <b>{gain} {cur}/h</b>',
      'ban.running': '{name} running', 'ban.fromgrid': '{w} from the grid', 'ban.cost': 'currently costs <b>{cost} {cur}/h</b>',
      'ban.batempty': 'Battery empty', 'ban.batlimit': 'Battery at limit',
      'months': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      'months_long': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      'days': ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    },
    nl: {
      'flow.title': 'Energiestroom', 'flow.pv': 'PV-installatie', 'flow.pv2': 'PV 2', 'flow.grid': 'Net', 'flow.battery': 'Batterij', 'flow.home': 'Huisverbruik',
      'flow.cons_total': 'Verbruikers', 'flow.rest': 'Niet gemeten', 'flow.restpct': '{n}% gemeten', 'flow.soc': 'Laadniveau', 'flow.temp': 'Temperatuur',
      'flow.next': 'Volgende →', 'flow.error': 'Configureer minimaal pv of grid',
      'pill.aut': 'Zelfvoorziening nu', 'pill.self': 'Eigen verbruik nu', 'pv.use.home': 'Huis', 'pv.use.bat': 'Batterij', 'pv.use.grid': 'Net', 'pv.use.store': 'Opslag',
      'stat.pv': 'PV vandaag', 'stat.fc1': 'PV morgen', 'stat.fc2': 'PV overmorgen', 'stat.imp': 'Afname vandaag', 'stat.exp': 'Teruglevering', 'stat.bat': 'Batterij ± vandaag', 'stat.aut': 'Zelfvoorziening vandaag',
      'mix.pv': 'Zon', 'mix.bat': 'Accu', 'mix.grid': 'Net',
      'tag.offline': 'Offline', 'tag.producing': 'Produceert', 'tag.idle': 'Inactief', 'tag.balanced': 'In balans',
      'tag.import': 'Afname', 'tag.export': 'Teruglevering', 'tag.standby': 'Stand-by', 'tag.charging': 'Laadt', 'tag.discharging': 'Ontlaadt', 'tag.passthrough': 'Doorvoer',
      'bat.io': 'In <b>{in}</b> · Uit <b>{out}</b>', 'bat.split': ' (Huis <b>{home}</b> · Net <b>{grid}</b>)', 'bat.shared': 'Gedeelde sensor met <b>{name}</b>',
      'forecast': 'Verwachting', 'forecast.day': 'Verwachting vandaag', 'offline': 'offline',
      'ka.on': '● Wakker', 'ka.wait': '☝ Tik één keer – scherm blijft aan',
      'waste.today': 'Vandaag', 'waste.tomorrow': 'Morgen',
      'bat.usable_pct': 'bruikbaar', 'bat.usable_slow': '<b>{kwh} kWh</b> bruikbaar · laadt langzaam', 'bat.full_at': 'Vol om <b>{time}</b> · over {dur}',
      'bat.last_24': 'Gaat <b>ruim 24 u</b> mee · {kwh} kWh bruikbaar', 'bat.last_until': 'Gaat mee tot <b>{time}</b> · nog {dur}',
      'bat.full': 'Vol · <b>{kwh} kWh</b> bruikbaar', 'bat.usable': '<b>{kwh} kWh</b> bruikbaar (tot {res}%)',
      'dur.2days': '> 2 dagen',
      'ban.surplus': '{w} overschot', 'ban.batfull': 'Accu vol – ', 'ban.tonet': 'Stroom gaat naar het net · zelf gebruiken bespaart <b>{gain} {cur}/u</b>',
      'ban.running': '{name} draait', 'ban.fromgrid': '{w} uit het net', 'ban.cost': 'kost nu <b>{cost} {cur}/u</b>',
      'ban.batempty': 'Accu leeg', 'ban.batlimit': 'Accu op limiet',
      'months': ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
      'months_long': ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
      'days': ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
    },
  };
  
  WD.lang = 'en';
  WD.setLang = (lang) => {
    const l = String(lang || '').toLowerCase().split(/[-_]/)[0];
    WD.lang = L[l] ? l : 'en';
  };

  // T('key', { n: 5 }) ersetzt {n}; fehlende Schlüssel fallen auf Englisch, dann auf den Schlüssel zurück
  WD.T = (k, vars) => {
    let s = (L[WD.lang] && L[WD.lang][k]) ?? L.en[k] ?? k;
    if (vars) Object.keys(vars).forEach((v) => { s = s.split('{' + v + '}').join(vars[v]); });
    return s;
  };
  
  WD.addStrings = (strings, lang = 'de') => { L[lang] = Object.assign(L[lang] || {}, strings); };

  WD.fDur = (hrs) => {
    if (!isFinite(hrs) || hrs <= 0) return '';
    if (hrs > 48) return WD.T('dur.2days');
    const m = Math.round(hrs * 60), hh = Math.floor(m / 60), mm = m % 60;
    const h = WD.T('dur.h'), min = WD.T('dur.min');
    return hh ? `${hh} ${h} ${String(mm).padStart(2, '0')} ${min}` : `${mm} ${min}`;
  };
})();

