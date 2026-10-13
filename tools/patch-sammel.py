"""Variante A: groups_lines: sammel. Eine Linie vom Ring zum ganzen Verbraucherbereich statt einer je Kachel."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:70]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


CSS = """/* groups_lines: sammel: eine Linie zum ganzen Verbraucherbereich */
.sam-on .mix{order:-1;margin:0 0 12px}
.sambox{position:relative;z-index:1;margin-top:46px;padding:30px 12px 12px;border:1px solid var(--stroke);border-radius:26px;background:rgba(var(--ov),.018)}
.wrap .sambox .consumers,.wrap .sambox .groups{margin-top:0}
.wrap .sambox .consumers+.groups{margin-top:12px}
.sam{position:absolute;top:0;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:9px;padding:7px 16px;border-radius:999px;background:var(--panel);border:1px solid var(--stroke);white-space:nowrap;z-index:2;transition:border-color .5s,box-shadow .5s}
.sam.on{border-color:rgba(var(--home),.6);box-shadow:0 0 0 1px rgba(var(--home),.3)}
.sam-t{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:rgb(var(--mut));font-weight:650}
.sam-w{font-size:1rem;font-weight:700;font-variant-numeric:tabular-nums;color:var(--txt)}
"""

sub('src/flow-card.js', [
    ("/* Smartphone */", CSS + "/* Smartphone */"),
    ("    const cons = c.consumers.map((x, i) => {\n      if (x.entity) links.push('c' + i);",
     "    const sam = c.groups_lines === 'sammel' && (c.consumers.length > 0 || (c.consumer_groups || []).length > 0);\n"
     "    if (sam) links.push('bundle');\n"
     "    const cons = c.consumers.map((x, i) => {\n      if (x.entity && !sam) links.push('c' + i);"),
    ("      grps = G.map((g, i) => {\n        links.push('g' + i);",
     "      grps = G.map((g, i) => {\n        if (!sam) links.push('g' + i);"),
    ("      if (showRest) {\n        links.push('grest');",
     "      if (showRest) {\n        if (!sam) links.push('grest');"),
    ("<ha-card><div class=\"wrap\">", "<ha-card><div class=\"wrap${sam ? ' sam-on' : ''}\">"),
    ("        ${cons ? `<div class=\"consumers\">${cons}</div>` : ''}\n        ${grps}",
     "        ${sam ? `<div class=\"sambox\"><div class=\"sam\" data-k=\"bundle\"><span class=\"sam-t\">${T('flow.cons_total')}</span><b class=\"sam-w\">—</b></div>` : ''}"
     "${cons ? `<div class=\"consumers\">${cons}</div>` : ''}\n        ${grps}${sam ? '</div>' : ''}"),
    ("    c.consumers.forEach((x, i) => {\n      const el = this._$(`[data-k=\"c${i}\"]`);\n      if (!el) return;",
     "    let sumAll = 0;\n    c.consumers.forEach((x, i) => {\n      const el = this._$(`[data-k=\"c${i}\"]`);\n      if (!el) return;"),
    ("        const p = watt(h, x.entity), on = (p || 0) > TH;\n        el.classList.toggle('on', on);\n        this._anim('c' + i, p, el);",
     "        const p = watt(h, x.entity), on = (p || 0) > TH;\n        sumAll += p || 0;\n        el.classList.toggle('on', on);\n        this._anim('c' + i, p, el);"),
    ("        known += sum;\n        const shown =", "        known += sum;\n        sumAll += sum;\n        const shown ="),
    ("    const dPv = c.pv ? num(h, c.pv.daily) : null;",
     "    if (c.groups_lines === 'sammel') {\n      const bel = this._$('[data-k=\"bundle\"]');\n      if (bel) {\n        const on = sumAll > TH;\n        bel.classList.toggle('on', on);\n        this._set('.sam-w', fW(sumAll), true);\n        this._link('bundle', on, false, PAL.home, sumAll);\n      }\n    }\n    const dPv = c.pv ? num(h, c.pv.daily) : null;"),
])
sub('src/i18n.js', [("'flow.rest': 'Nicht erfasst',", "'flow.cons_total': 'Verbraucher', 'flow.rest': 'Nicht erfasst',")])

# Testhilfe: ?sammel=1 und groups=N
t = R / 'test' / '_theme.js'
u = t.read_text(encoding='utf-8')
if "q.get('sammel')" not in u:
    u = u.replace("  const t = q.get('theme');", "  const t = q.get('theme');\n  const sammel = q.get('sammel'), gr0 = q.get('groups');", 1)
    u = u.replace("  if (!t) return;", """  if (sammel || gr0) {
    const C = customElements.get('energy-cockpit-flow-card');
    if (C) {
      const o = C.prototype.setConfig;
      C.prototype.setConfig = function (c) {
        const n = gr0 ? Math.min(12, +gr0) : 0;
        const cols = ['#818cf8', '#7dd3fc', '#facc15', '#f87171', '#f59e0b', '#34d399', '#fb923c', '#22d3ee', '#a78bfa', '#f472b6', '#4ade80', '#60a5fa'];
        const names = ['Wohnzimmer', 'Küche', 'Flur & WC', 'Technik', 'Büro Keller', 'Partyraum', 'Hauswirtschaft', 'Brendan', 'Wallbox', 'Garage', 'Garten', 'Bad'];
        const g = n ? Array.from({ length: n }, (_, i) => ({ name: names[i], icon: 'mdi:sofa-outline', color: cols[i], items: [{ entity: i % 3 === 1 ? 'sensor.home' : 'sensor.pv', name: 'Gerät ' + (i + 1) }] })) : c.consumer_groups;
        return o.call(this, Object.assign({}, c, { consumer_groups: g, groups_lines: sammel ? 'sammel' : c.groups_lines }));
      };
    }
  }
  if (!t) return;""", 1)
    t.write_text(u, encoding='utf-8')

m = R / 'tools' / 'make-screenshots.py'
v = m.read_text(encoding='utf-8')
if 'sammel-breit' not in v:
    v = v.replace("only = sys.argv[1:]",
                  "JOBS.append(('flow.html', 'sammel-vorher', '?shot=1&groups=8'))\n"
                  "JOBS.append(('flow.html', 'sammel-breit', '?shot=1&groups=8&sammel=1'))\n"
                  "JOBS.append(('flow.html', 'sammel-schmal', '?shot=1&groups=8&sammel=1'))\n"
                  "only = sys.argv[1:]", 1)
    v = v.replace("w, h = (1100, 3200) if page.startswith('room')",
                  "w, h = (560, 1500) if name == 'sammel-schmal' else (1100, 1400) if name.startswith('sammel') else (1100, 3200) if page.startswith('room')", 1)
    m.write_text(v, encoding='utf-8')
print('ok')
