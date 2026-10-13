"""Einmalig: Entladegrenze (Reserve) und Maximalladung der Batterie als Sensor ODER fester Wert,
Anzeige des nutzbaren Ladestands (Issue #1)."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:70]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


# Karte: Grenzen aus Sensor (reserve_soc / max_soc) oder festem Wert (reserve_pct / max_pct)
sub('src/flow-card.js', [
    ("    const maxSoc = val(h, c.battery.max_soc, 100), reserve = val(h, c.battery.reserve_soc, 0);",
     "    const { reserve, maxSoc } = this._limits();"),
    ("val(h, c.battery && c.battery.reserve_soc, 0) + 2 ? T('ban.batempty')",
     "this._limits().reserve + 2 ? T('ban.batempty')"),
    ("  // Präsenz-Banner: PV-Überschuss oder hoher Netzbezug (mit Verzögerung gegen Flackern)",
     """  // Entladegrenze und Maximalladung der Batterie in Prozent: Sensor, Helfer oder fester Wert
  _limits() {
    const h = this._hass, b = (this._c && this._c.battery) || {};
    const lim = (sensor, fixed, def) => {
      const v = val(h, sensor, null);
      if (v !== null && !isNaN(v)) return Math.max(0, Math.min(100, v));
      return typeof fixed === 'number' ? Math.max(0, Math.min(100, fixed)) : def;
    };
    const reserve = lim(b.reserve_soc, b.reserve_pct, 0);
    const maxSoc = Math.max(reserve + 1, lim(b.max_soc, b.max_pct, 100));
    return { reserve, maxSoc };
  }

  // Präsenz-Banner: PV-Überschuss oder hoher Netzbezug (mit Verzögerung gegen Flackern)"""),
    ("""      const fill = this._$('.soc-fill');
      fill.style.width = (soc === null ? 0 : Math.max(0, Math.min(100, soc))) + '%';
      fill.style.setProperty('--sc', soc !== null && soc < 20 ? PAL.imp : soc !== null && soc < 40 ? PAL.pv : col);
      this._set('.soc-txt', soc === null ? '—' : Math.round(soc) + ' %');""",
     """      const fill = this._$('.soc-fill');
      const lm = this._limits();
      const usable = c.battery.soc_display === 'nutzbar' && lm.maxSoc > lm.reserve;
      // nutzbar: 0 % = Entladegrenze, 100 % = Maximalladung
      const shown = soc === null ? null : usable ? Math.max(0, Math.min(100, (soc - lm.reserve) / (lm.maxSoc - lm.reserve) * 100)) : Math.max(0, Math.min(100, soc));
      fill.style.width = (shown === null ? 0 : shown) + '%';
      fill.style.setProperty('--sc', shown !== null && shown < 20 ? PAL.imp : shown !== null && shown < 40 ? PAL.pv : col);
      this._set('.soc-txt', shown === null ? '—' : Math.round(shown) + ' %' + (usable ? ' ' + T('bat.usable_pct') : ''));
      const lo = this._$('.soc-low'), hi = this._$('.soc-high');
      if (lo) { lo.style.width = (usable ? 0 : lm.reserve) + '%'; lo.style.display = !usable && lm.reserve > 0 ? '' : 'none'; }
      if (hi) { hi.style.width = (usable ? 0 : 100 - lm.maxSoc) + '%'; hi.style.display = !usable && lm.maxSoc < 100 ? '' : 'none'; }"""),
    ("""        `<div class="soc"><div class="soc-fill"></div></div><div class="soc-row">""",
     """        `<div class="soc"><div class="soc-fill"></div><div class="soc-low"></div><div class="soc-high"></div></div><div class="soc-row">"""),
    (".soc-row{display:flex;",
     ".soc-low,.soc-high{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(-45deg,rgba(var(--ov),.22) 0 3px,rgba(var(--ov),.06) 3px 6px);pointer-events:none}\n.soc-low{left:0;border-right:1px solid rgba(var(--ov),.5)}\n.soc-high{right:0;border-left:1px solid rgba(var(--ov),.5)}\n.soc-row{display:flex;"),
])

sub('src/i18n.js', [
    ("'bat.usable_slow':", "'bat.usable_pct': 'nutzbar', 'bat.usable_slow':"),
])

# Editor: Assistent und Formular
sub('src/flow-editor.js', [
    ("      { path: 'battery.invert', label: 'Vorzeichen umkehren', kind: 'bool',",
     "      { path: 'battery.reserve_soc', label: 'Entladegrenze der Batterie (Sensor oder Helfer, %)', kind: 'percent', optional: true, help: 'Bis zu diesem Ladestand wird die Batterie entladen. Viele Wechselrichter bieten dafür eine Zahl-Entität an (zum Beispiel \"Entlade-Ende-Ladestand\"). Die Karte zeigt die Grenze auf dem Ladebalken und rechnet die nutzbare Kapazität.', hints: H(/entlad|reserve|min.*soc|discharge.*(end|cut|limit)|ende/i, /soc|ladestand|ladung/i) },\n"
     "      { path: 'battery.reserve_pct', label: 'oder feste Entladegrenze (%)', kind: 'number', optional: true, step: '1', help: 'Zum Beispiel 10, wenn die Batterie nur bis 10 % entladen wird.' },\n"
     "      { path: 'battery.max_soc', label: 'Maximalladung der Batterie (Sensor oder Helfer, %)', kind: 'percent', optional: true, hints: H(/lade.*ende|max|charge.*(end|cut|limit)|ende/i, /soc|ladestand|ladung/i) },\n"
     "      { path: 'battery.max_pct', label: 'oder feste Maximalladung (%)', kind: 'number', optional: true, step: '1' },\n"
     "      { path: 'battery.soc_display', label: 'Ladestand anzeigen als', kind: 'choice', options: [{ value: 'brutto', label: 'Ladestand der Batterie (Standard)' }, { value: 'nutzbar', label: 'Nutzbarer Anteil (0 % = Entladegrenze)' }] },\n"
     "      { path: 'battery.invert', label: 'Vorzeichen umkehren', kind: 'bool',"),
    ("numb('capacity_kwh', 0, 200, 0.1), numb('reserve_soc', 0, 100, 1), numb('max_soc', 0, 100, 1),",
     "numb('capacity_kwh', 0, 200, 0.1), ent('reserve_soc', ['sensor', 'number', 'input_number']), numb('reserve_pct', 0, 100, 1),\n        ent('max_soc', ['sensor', 'number', 'input_number']), numb('max_pct', 0, 100, 1),\n        { name: 'soc_display', selector: { select: { mode: 'dropdown', options: [{ value: 'brutto', label: 'Ladestand der Batterie (Standard)' }, { value: 'nutzbar', label: 'Nutzbarer Anteil (0 % = Entladegrenze)' }] } } },"),
    ("    reserve_soc: 'Reserve-Ladestand (%)', max_soc: 'Maximaler Ladestand (%)',",
     "    reserve_soc: 'Entladegrenze (Sensor oder Helfer, %)', max_soc: 'Maximalladung (Sensor oder Helfer, %)', reserve_pct: 'oder feste Entladegrenze (%)', max_pct: 'oder feste Maximalladung (%)', soc_display: 'Ladestand anzeigen als',"),
])
print('ok')
