"""v0.10.0: Raum-Karte: Unterposten (devices[].items), z. B. ein Kühlschrank innerhalb des Bereichs "Chillecke"."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:80]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


sub('src/room-card.js', [
    # CSS: Unterposten-Zeilen
    ("tr.sub td{font-size:.68rem;",
     "tr.ch td{font-size:.86em;color:rgb(var(--mut))}tr.ch td:first-child{text-align:left;padding-left:18px}\n"
     "tr.sub td{font-size:.68rem;"),
    # Konfiguration: Unterposten einsammeln
    ("      this._c = Object.assign({}, c, { devices: devs });",
     "      // Unterposten (devices[].items): eigener Zähler innerhalb eines Bereichs, zählt nicht doppelt zur Summe\n"
     "      const items = [];\n"
     "      devs.forEach((d, pi) => arr(d.items).filter((x) => x && x.energy).forEach((x) => items.push(Object.assign({}, x, { parent: pi }))));\n"
     "      this._c = Object.assign({}, c, { devices: devs, items });"),
    # Live-Aktualisierung der Unterposten
    ("        el.className = 'wv ' + this._wcls(w);\n      });\n    }",
     "        el.className = 'wv ' + this._wcls(w);\n      });\n"
     "      this.shadowRoot.querySelectorAll('[data-wi]').forEach((el) => {\n"
     "        const w = this._watt(this._c.items[+el.dataset.wi]);\n"
     "        el.textContent = w === null ? '–' : nf(w, 0);\n"
     "        el.className = 'wv ' + this._wcls(w);\n"
     "      });\n    }"),
    # Laden: Zähler der Unterposten mitladen
    ("        const ids = c.devices.map((d) => d.energy);\n        const nd = ids.length;",
     "        const ids = c.devices.map((d) => d.energy);\n        const nd = ids.length;\n"
     "        const iids = c.items.map((x) => x.energy);\n        const ni = iids.length;"),
    ("period: 'day', statistic_ids: ids, types: ['change'] });",
     "period: 'day', statistic_ids: ids.concat(iids), types: ['change'] });"),
    ("          ids.forEach((id, di) => (dr[id] || []).forEach((x) => {\n            const k = key(new Date(ts(x)));\n            (days[k] = days[k] || ids.map(() => [0, 0, 0, 0]))[di][0] += x.change > 0 ? x.change : 0;\n          }));",
     "          ids.concat(iids).forEach((id, di) => (dr[id] || []).forEach((x) => {\n            const k = key(new Date(ts(x)));\n            (days[k] = days[k] || ids.concat(iids).map(() => [0, 0, 0, 0]))[di][0] += x.change > 0 ? x.change : 0;\n          }));"),
    ("          const all = ids.concat(srcIds);", "          const all = ids.concat(iids, srcIds);"),
    ("            const dev = ids.map((id) => row[id] || 0);\n",
     "            const dev = ids.map((id) => row[id] || 0);\n            const idev = iids.map((id) => row[id] || 0);\n"),
    ("            if (ids.some((id) => row[id] !== undefined)) this._hrs.push({ t: +t, dev });",
     "            if (ids.some((id) => row[id] !== undefined)) this._hrs.push({ t: +t, dev, idev });"),
    ("            const a = (days[k] = days[k] || ids.map(() => [0, 0, 0, 0]));",
     "            const a = (days[k] = days[k] || ids.concat(iids).map(() => [0, 0, 0, 0]));"),
    ("            dev.forEach((v, di) => { a[di][0] += v * g; a[di][1] += v * b; a[di][sur ? 3 : 2] += v * p; });",
     "            dev.forEach((v, di) => { a[di][0] += v * g; a[di][1] += v * b; a[di][sur ? 3 : 2] += v * p; });\n"
     "            idev.forEach((v, j) => { const q = a[nd + j]; q[0] += v * g; q[1] += v * b; q[sur ? 3 : 2] += v * p; });"),
    ("        this._nd = nd;", "        this._nd = nd + ni;"),
    # Summe und Berechnung
    ("      const nd = this._c.devices.length;\n      const out = Array.from({ length: nd }, () => [0, 0, 0, 0]);",
     "      const nd = this._c.devices.length + this._c.items.length;\n      const out = Array.from({ length: nd }, () => [0, 0, 0, 0]);"),
    ("      const raw = this._sum(from, to);\n      const price",
     "      const rawAll = this._sum(from, to), nDev = this._c.devices.length;\n      const raw = rawAll.slice(0, nDev), rawI = rawAll.slice(nDev);\n      const price"),
    ("      return { dev, src, kwh, fee, cost, costFull, devCost, surplus };",
     "      const items = rawI.map((d) => [d[0], d[1], d[2] + d[3]]);\n      const itemCost = rawI.map(price);\n      return { dev, src, kwh, fee, cost, costFull, devCost, surplus, items, itemCost };"),
    # CSV
    ("'bei Bezugspreis ' + cur()].concat(c.devices.map((d) => (d.name || d.energy) + ' kWh'));",
     "'bei Bezugspreis ' + cur()].concat(c.devices.map((d) => (d.name || d.energy) + ' kWh'), c.items.map((x) => (c.devices[x.parent].name || c.devices[x.parent].energy) + ': ' + (x.name || x.energy) + ' kWh'));"),
    ("          .concat(r.dev.map((d) => num(d[0] + d[1] + d[2])));",
     "          .concat(r.dev.map((d) => num(d[0] + d[1] + d[2])), r.items.map((d) => num(d[0] + d[1] + d[2])));"),
    # Live-Kacheln: Unterposten unter dem Bereich
    ("        return `<div class=\"tile\" style=\"--c:${d.color || '96,165,250'}\"><div class=\"l\">${esc(d.name || d.energy)}</div>\n          <div class=\"wl\"><span class=\"wv ${this._wcls(w)}\" data-w=\"${i}\">${w === null ? '–' : nf(w, 0)}</span><small>W</small></div>\n          <div class=\"spark\">${bars}</div><div class=\"s\">heute ${fk(todayKwh)} kWh · Kurve je Stunde</div></div>`;",
     "        const sub = c.items.map((x, j) => ({ x, j })).filter((o) => o.x.parent === i).map((o) => {\n"
     "          const wi = this._watt(o.x);\n"
     "          const tk = hrs.reduce((a, h2) => (key(new Date(h2.t)) === todayK ? a + (h2.idev ? h2.idev[o.j] || 0 : 0) : a), 0);\n"
     "          return `<div class=\"s\">↳ ${esc(o.x.name || o.x.energy)}: <span class=\"wv ${this._wcls(wi)}\" data-wi=\"${o.j}\">${wi === null ? '–' : nf(wi, 0)}</span> W · heute ${fk(tk)} kWh</div>`;\n"
     "        }).join('');\n"
     "        return `<div class=\"tile\" style=\"--c:${d.color || '96,165,250'}\"><div class=\"l\">${esc(d.name || d.energy)}</div>\n          <div class=\"wl\"><span class=\"wv ${this._wcls(w)}\" data-w=\"${i}\">${w === null ? '–' : nf(w, 0)}</span><small>W</small></div>\n          <div class=\"spark\">${bars}</div><div class=\"s\">heute ${fk(todayKwh)} kWh · Kurve je Stunde</div>${sub}</div>`;"),
    # Je Bereich: Unterposten und übrige Geräte
    ("          return `<tr><td>${esc(d.name || d.energy)}</td><td>${fk(t)}</td>${mix ? dv.map(cell).join('') : ''}<td>${fe(cur_.devCost[i])}</td></tr>`;\n        }).join('');",
     "          let out = `<tr><td>${esc(d.name || d.energy)}</td><td>${fk(t)}</td>${mix ? dv.map(cell).join('') : ''}<td>${fe(cur_.devCost[i])}</td></tr>`;\n"
     "          const its = c.items.map((x, j) => ({ x, j })).filter((o) => o.x.parent === i);\n"
     "          if (its.length) {\n"
     "            const rest = dv.slice(), restCost = [cur_.devCost[i]];\n"
     "            its.forEach((o) => {\n"
     "              const iv = cur_.items[o.j];\n"
     "              out += `<tr class=\"ch\"><td>↳ ${esc(o.x.name || o.x.energy)}</td><td>${fk(iv[0] + iv[1] + iv[2])}</td>${mix ? iv.map(cell).join('') : ''}<td>${fe(cur_.itemCost[o.j])}</td></tr>`;\n"
     "              iv.forEach((v, k) => { rest[k] -= v; });\n"
     "              restCost[0] -= cur_.itemCost[o.j];\n"
     "            });\n"
     "            const rv = rest.map((v) => Math.max(0, v));\n"
     "            out += `<tr class=\"ch\"><td>↳ übrige Geräte</td><td>${fk(rv[0] + rv[1] + rv[2])}</td>${mix ? rv.map(cell).join('') : ''}<td>${fe(Math.max(0, restCost[0]))}</td></tr>`;\n"
     "          }\n"
     "          return out;\n        }).join('');"),
])

sub('docs/KONFIGURATION.md', [
    ("| `devices[].power` |",
     "| `devices[].items` | Optional: Unterposten des Bereichs, zum Beispiel ein einzelnes Gerät in der \"Chillecke\". Je Eintrag `energy` (kWh-Zähler, mit Langzeitstatistik), optional `name` und `power`. Die Summe bleibt der Zähler des Bereichs, die Unterposten erscheinen als \"↳\"-Zeilen in der Tabelle \"Je Bereich\" mit kWh, Quellen und Kosten, dazu \"↳ übrige Geräte\" (Bereich minus Unterposten) und die Live-Leistung in der Kachel. Nur im YAML-Editor |\n| `devices[].power` |"),
])

c = R / 'CHANGELOG.md'
u = c.read_text(encoding='utf-8')
u = u.replace("# Änderungsprotokoll\n", """# Änderungsprotokoll

## 0.10.0
- **Raum-Abrechnung: Unterposten (`devices[].items`):** Ein Bereich kann einzelne Geräte mit eigenem Zähler ausweisen (zum Beispiel ein Kühlschrank in der "Chillecke"). Die Abrechnung des Bereichs bleibt unverändert, die Unterposten erscheinen als "↳"-Zeilen mit kWh, Quellen (Netz, Batterie, PV) und Kosten, dazu "↳ übrige Geräte". In der Live-Kachel steht die aktuelle Leistung und der Verbrauch heute, im CSV eigene Spalten.
""", 1)
c.write_text(u, encoding='utf-8')
pk = R / 'package.json'
pk.write_text(pk.read_text(encoding='utf-8').replace('"version": "0.9.3"', '"version": "0.10.0"'), encoding='utf-8')
hd = R / 'docs' / 'handout.html'
hd.write_text(hd.read_text(encoding='utf-8').replace('Version 0.9.3', 'Version 0.10.0'), encoding='utf-8')
print('ok')
