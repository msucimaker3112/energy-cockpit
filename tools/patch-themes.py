"""Einmalig: Farbschemen (theme, accent) für alle Karten. Standard bleibt das bisherige dunkle Design."""
import pathlib
import re

R = pathlib.Path(__file__).resolve().parent.parent


def rd(p):
    return (R / p).read_text(encoding='utf-8')


def wr(p, s):
    (R / p).write_text(s, encoding='utf-8')


def sub(path, pairs):
    s = rd(path)
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:80]!r}'
        s = s.replace(old, new, 1)
    wr(path, s)


# 1) common.js: Themen, CSS-Variablen, applyTheme
THEME_JS = r"""
  // Farbschemen: alle Karten färben sich über CSS-Variablen. Standard ist "dunkel" (bisheriges Design).
  const THEMES = {
    dunkel: { n: 'Dunkel', d: 'Mitternachtsblau (Standard)', ov: '255,255,255', bg0: '#070b14', bg1: '#121b30', bg2: '#172440', panel: '#0c1322', txt: '#e8eefc', mut: '139,151,179', stroke: 'rgba(255,255,255,.08)', glass: 'rgba(255,255,255,.035)', y1: '#fef08a', o1: '#fed7aa', y0: '#fff7c2' },
    graphit: { n: 'Graphit', d: 'Neutrales Dunkelgrau', ov: '255,255,255', bg0: '#101011', bg1: '#242427', bg2: '#2e2e32', panel: '#1b1b1e', txt: '#ececee', mut: '152,152,162', stroke: 'rgba(255,255,255,.09)', glass: 'rgba(255,255,255,.04)', y1: '#fef08a', o1: '#fed7aa', y0: '#fff7c2' },
    hell: { n: 'Hell', d: 'Weiß mit kühlem Grau', ov: '15,23,42', bg0: '#e6ecf5', bg1: '#ffffff', bg2: '#f1f5f9', panel: '#ffffff', txt: '#0f172a', mut: '71,85,105', stroke: 'rgba(15,23,42,.12)', glass: 'rgba(15,23,42,.04)', y1: '#a16207', o1: '#c2410c', y0: '#854d0e' },
    warm: { n: 'Warm', d: 'Helles Papier', ov: '60,40,20', bg0: '#ece2d2', bg1: '#fbf6ec', bg2: '#f5ecdc', panel: '#fffaf0', txt: '#2b2118', mut: '115,98,82', stroke: 'rgba(60,40,20,.15)', glass: 'rgba(60,40,20,.05)', y1: '#a16207', o1: '#c2410c', y0: '#854d0e' },
    ha: { n: 'Home Assistant', d: 'Farben deines HA-Designs', ov: '128,128,128', bg0: 'var(--card-background-color,#1c1c1c)', bg1: 'var(--card-background-color,#1c1c1c)', bg2: 'var(--secondary-background-color,#2b2b2b)', panel: 'var(--secondary-background-color,#222)', txt: 'var(--primary-text-color,#e1e1e1)', mut: '128,128,128', stroke: 'rgba(128,128,128,.28)', glass: 'rgba(128,128,128,.08)', y1: 'var(--warning-color,#d97706)', o1: 'var(--warning-color,#d97706)', y0: 'var(--warning-color,#d97706)' },
  };
  const THEME_LABELS = { dunkel: 'Dunkel (Mitternacht, Standard)', graphit: 'Graphit (neutrales Dunkelgrau)', hell: 'Hell', warm: 'Warm (helles Papier)', auto: 'Automatisch (hell oder dunkel wie Home Assistant)', ha: 'Farben des Home-Assistant-Designs' };
  const THEME_OPTIONS = ['dunkel', 'graphit', 'hell', 'warm', 'auto', 'ha'].map((v) => ({ value: v, label: THEME_LABELS[v] }));
  const themeVars = (t) => `--ov:${t.ov};--bg0:${t.bg0};--bg1:${t.bg1};--bg2:${t.bg2};--panel:${t.panel};--txt:${t.txt};--mut:${t.mut};--stroke:${t.stroke};--glass:${t.glass};--y1:${t.y1};--o1:${t.o1};--y0:${t.y0}`;
  const themeCss = () => ':host{' + themeVars(THEMES.dunkel) + '}\n'
    + Object.keys(THEMES).filter((k) => k !== 'dunkel').map((k) => `:host([data-theme="${k}"]){${themeVars(THEMES[k])}}`).join('\n') + '\n';
  const accentRgb = (a) => {
    if (typeof a !== 'string') return '';
    const s = a.trim();
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
    }
    return /^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}$/.test(s) ? s.replace(/\s+/g, '') : '';
  };
  // Setzt data-theme (und optional --acc) am Kartenelement. cfg = Kartenkonfiguration, hass für "auto".
  const applyTheme = (el, cfg, hass) => {
    if (cfg) { el._ecTheme = cfg.theme; el._ecAccent = cfg.accent; }
    let t = el._ecTheme || 'dunkel';
    if (t === 'auto') {
      let dark = true;
      if (hass && hass.themes && typeof hass.themes.darkMode === 'boolean') dark = hass.themes.darkMode;
      else if (window.matchMedia) dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      t = dark ? 'dunkel' : 'hell';
    }
    if (!THEMES[t]) t = 'dunkel';
    if (el.getAttribute('data-theme') !== t) el.setAttribute('data-theme', t);
    const a = accentRgb(el._ecAccent);
    if (a) el.style.setProperty('--acc', a); else el.style.removeProperty('--acc');
  };
"""
sub('src/common.js', [
    ("  const clock = (ms) =>", THEME_JS + "  const clock = (ms) =>"),
    ("return { state, setLocale, PAL, TH, rgb, num, watt, val, price,",
     "return { state, setLocale, PAL, TH, rgb, num, watt, val, price, THEMES, THEME_OPTIONS, themeCss, applyTheme,"),
])

# 2) Karten: Farben auf Variablen umstellen
FALLBACK = 'padding:22px;border-radius:24px;background:#0c1322'


def tokenize(path):
    lines = rd(path).split('\n')
    out = []
    for ln in lines:
        if FALLBACK in ln:
            out.append(ln)
            continue
        ln = ln.replace('rgba(255,255,255,', 'rgba(var(--ov),')
        for a, b in [('#0c1322', 'var(--panel)'), ('#121b30', 'var(--bg1)'), ('#141d33', 'var(--bg1)'), ('#070b14', 'var(--bg0)'),
                     ('#172440', 'var(--bg2)'), ('#0a1120', 'var(--bg0)'), ('#fef08a', 'var(--y1)'), ('#fed7aa', 'var(--o1)'), ('#fff7c2', 'var(--y0)')]:
            ln = ln.replace(a, b)
        out.append(ln)
    s = '\n'.join(out)
    wr(path, s)


for f in ['src/flow-card.js', 'src/devices-card.js', 'src/stats-card.js', 'src/room-card.js']:
    tokenize(f)

# :host-Zeilen: Farbvariablen kommen jetzt aus den Themen
sub('src/flow-card.js', [
    (":host{display:block;--pv:${PAL.pv};--imp:${PAL.imp};--exp:${PAL.exp};--bat:${PAL.bat};--home:${PAL.home};--mut:${PAL.mut};--txt:#e8eefc;--stroke:rgba(var(--ov),.08);--glass:rgba(var(--ov),.035)}",
     "${WD.themeCss()}:host{display:block;--pv:${PAL.pv};--imp:${PAL.imp};--exp:${PAL.exp};--bat:${PAL.bat};--home:${PAL.home}}"),
    ("  setConfig(config) {", "  setConfig(config) {\n    WD.applyTheme(this, config, this._hass);"),
])
sub('src/devices-card.js', [
    (":host{display:block;--mut:139,151,179;--txt:#eef2fb;--ok:52,211,153;--sun:250,204,21;--stroke:rgba(var(--ov),.08)}",
     "${WD.themeCss()}:host{display:block;--ok:52,211,153;--sun:250,204,21}"),
    ("    setConfig(c) {", "    setConfig(c) {\n      WD.applyTheme(this, c, this._hass);"),
])
sub('src/stats-card.js', [
    (":host{display:block;--pv:255,197,61;--imp:255,92,122;--exp:52,211,153;--bat:96,165,250;--home:34,211,238;--sav:52,211,153;--mut:139,151,179;--txt:#e8eefc;--stroke:rgba(var(--ov),.08)}",
     "${WD.themeCss()}:host{display:block;--pv:255,197,61;--imp:255,92,122;--exp:52,211,153;--bat:96,165,250;--home:34,211,238;--sav:52,211,153}"),
    ("    setConfig(c) {", "    setConfig(c) {\n      WD.applyTheme(this, c, this._hass);"),
])
sub('src/room-card.js', [
    (":host{display:block;--txt:#e8eefc;--mut:139,151,179;--acc:245,158,11;--stroke:rgba(var(--ov),.08)}",
     "${WD.themeCss()}:host{display:block;--acc:245,158,11}"),
    ("    setConfig(c) {", "    setConfig(c) {\n      WD.applyTheme(this, c, this._hass);"),
])
# hass-Setter: "auto" folgt dem HA-Design
for f, sig in [('src/flow-card.js', '  set hass(h) {'), ('src/devices-card.js', '    set hass(h) {'), ('src/stats-card.js', '    set hass(h) {'), ('src/room-card.js', '    set hass(h) {')]:
    sub(f, [(sig, sig + "\n      WD.applyTheme(this, null, h);")])

# 3) Assistent: Themenwahl mit Farbkacheln
sub('src/wizard.js', [
    ("    const fieldChoice = (f) => {", """    // Farbschema: Kacheln mit Vorschau
    const fieldTheme = (f) => {
      const wrap = el('div');
      wrap.appendChild(el('label', css.label, f.label));
      if (f.help) wrap.appendChild(el('div', css.help, f.help));
      const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px');
      const cur = getPath(cfg, f.path) || 'dunkel';
      const T = WD.THEMES;
      const mix = (a, b) => `linear-gradient(110deg,${a.bg1} 0 50%,${b.bg1} 50% 100%)`;
      ['dunkel', 'graphit', 'hell', 'warm', 'auto', 'ha'].forEach((k) => {
        const t = k === 'auto' ? { n: 'Automatisch', bg: mix(T.dunkel, T.hell), txt: '#8b97b3', dot: true } : Object.assign({ bg: T[k].bg1, dot: true }, T[k]);
        const tile = el('button', `cursor:pointer;text-align:left;padding:10px;border-radius:10px;font:inherit;border:2px solid ${cur === k ? 'var(--primary-color,#03a9f4)' : 'var(--divider-color,#555)'};background:${k === 'auto' ? t.bg : (k === 'ha' ? 'var(--card-background-color,#222)' : T[k].bg1)};color:${k === 'auto' ? '#8b97b3' : T[k].txt}`);
        tile.type = 'button';
        tile.appendChild(el('div', 'font-weight:700', t.n));
        const dots = el('div', 'display:flex;gap:4px;margin-top:6px');
        ['255,197,61', '255,92,122', '96,165,250'].forEach((c) => dots.appendChild(el('span', `width:14px;height:14px;border-radius:50%;background:rgb(${c})`)));
        tile.appendChild(dots);
        tile.addEventListener('click', () => { setPath(cfg, f.path, k === 'dunkel' ? '' : k); emit(); render(); });
        grid.appendChild(tile);
      });
      wrap.appendChild(grid);
      return wrap;
    };

    const fieldChoice = (f) => {"""),
    ("        else if (f.kind === 'choice') root.appendChild(fieldChoice(f));",
     "        else if (f.kind === 'choice') root.appendChild(fieldChoice(f));\n        else if (f.kind === 'theme') root.appendChild(fieldTheme(f));"),
])

THEME_STEP = ("    { short: 'Aussehen', title: 'Farbschema', text: 'Dunkel ist die Voreinstellung. Mit \"Automatisch\" folgt die Karte dem hellen oder dunklen Design von Home Assistant, \"Home Assistant\" übernimmt dessen Farben.', fields: [\n"
              "      { path: 'theme', label: 'Farbschema', kind: 'theme' },\n"
              "ACCENT    ] },\n")
ACCENT = "      { path: 'accent', label: 'Akzentfarbe (optional, z. B. 34,197,94 oder #22c55e)', kind: 'text', optional: true },\n"
NUMLAB = " theme: 'Farbschema', accent: 'Akzentfarbe (z. B. 34,197,94 oder #22c55e)',"
SEL = "{ name: 'theme', selector: { select: { mode: 'dropdown', options: WD.THEME_OPTIONS } } }"

sub('src/flow-editor.js', [
    ("    { short: 'Fertig',", THEME_STEP.replace('ACCENT', '') + "    { short: 'Fertig',"),
    ("      bool('fit_screen', true),\n", "      bool('fit_screen', true),\n      " + SEL + ",\n"),
    ("grid_price_ct: 'oder fester Strompreis (Cent pro kWh)',", "grid_price_ct: 'oder fester Strompreis (Cent pro kWh)'," + NUMLAB),
])
sub('src/stats-editor.js', [
    ("    { short: 'Fertig',", THEME_STEP.replace('ACCENT', '') + "    { short: 'Fertig',"),
    ("      { name: 'fit_screen', default: true, selector: { boolean: {} } },\n", "      { name: 'fit_screen', default: true, selector: { boolean: {} } },\n      " + SEL + ",\n"),
    ("grid_price_ct: 'oder fester Strompreis (Cent pro kWh)',", "grid_price_ct: 'oder fester Strompreis (Cent pro kWh)'," + NUMLAB),
])
sub('src/room-editor.js', [
    ("    { short: 'Fertig',", THEME_STEP.replace('ACCENT', ACCENT) + "    { short: 'Fertig',"),
    ("      numb('watt_high', 0, 20000, 10),\n", "      numb('watt_high', 0, 20000, 10),\n      " + SEL + ",\n      txt('accent'),\n"),
    ("    watt_warn: 'Live-Anzeige: erhöht ab (W)',", "    theme: 'Farbschema', accent: 'Akzentfarbe (z. B. 245,158,11 oder #f59e0b)',\n    watt_warn: 'Live-Anzeige: erhöht ab (W)',"),
])
sub('src/devices-editor.js', [
    ("grid_price_ct: 'ed.d.price_ct', feed_in_ct: 'ed.d.feed_ct',", "grid_price_ct: 'ed.d.price_ct', feed_in_ct: 'ed.d.feed_ct', theme: 'ed.d.theme',"),
    ("'ed.d.price_ct': 'oder fester Strompreis (Cent pro kWh)',", "'ed.d.theme': 'Farbschema', 'ed.d.price_ct': 'oder fester Strompreis (Cent pro kWh)',"),
    ("numb('standby_w', 0, 200, 1), bool('fit_screen'),", "numb('standby_w', 0, 200, 1), bool('fit_screen'), " + SEL + ","),
    ("standby_w: c.standby_w === undefined ? 15 : c.standby_w,", "standby_w: c.standby_w === undefined ? 15 : c.standby_w, theme: c.theme || 'dunkel',"),
    ("        if (v.fit_screen === false) c.fit_screen = false; else delete c.fit_screen;", "        if (v.theme && v.theme !== 'dunkel') c.theme = v.theme; else delete c.theme;\n        if (v.fit_screen === false) c.fit_screen = false; else delete c.fit_screen;"),
])
print('ok')

# 4) Übrige Textfarben (nicht in :host-Zeilen, nicht in den Hinweisflächen) auf --txt
for f in ['src/flow-card.js', 'src/devices-card.js', 'src/stats-card.js', 'src/room-card.js']:
    lines = rd(f).split('\n')
    lines = [ln if FALLBACK in ln else ln.replace('#e8eefc', 'var(--txt)').replace('#eef2fb', 'var(--txt)') for ln in lines]
    wr(f, '\n'.join(lines))
print('txt ok')
