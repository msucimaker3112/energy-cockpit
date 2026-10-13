/* Texte (nur Deutsch). */
(() => {
  const L = {
    de: {
      'flow.title': 'Energiefluss', 'flow.pv': 'PV-Anlage', 'flow.grid': 'Netz', 'flow.battery': 'Batterie', 'flow.home': 'Hausverbrauch',
      'flow.rest': 'Nicht erfasst', 'flow.restpct': '{n} % gemessen', 'flow.soc': 'Ladestand',
      'flow.next': 'Weiter →', 'flow.error': 'Mindestens pv oder grid konfigurieren',
      'pill.aut': 'Autarkie', 'pill.self': 'Eigenverbrauch',
      'stat.pv': 'PV heute', 'stat.imp': 'Bezug heute', 'stat.exp': 'Einspeisung', 'stat.bat': 'Batterie ± heute', 'stat.aut': 'Autarkie heute',
      'mix.pv': 'Solar', 'mix.bat': 'Akku', 'mix.grid': 'Netz',
      'tag.offline': 'Offline', 'tag.producing': 'Erzeugt', 'tag.idle': 'Inaktiv', 'tag.balanced': 'Ausgeglichen',
      'tag.import': 'Bezug', 'tag.export': 'Einspeisung', 'tag.standby': 'Standby', 'tag.charging': 'Lädt', 'tag.discharging': 'Entlädt',
      'forecast': 'Prognose', 'offline': 'offline',
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
