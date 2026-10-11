"""Einmalig: Assistent-Kasten im Geräte-Editor auch dann anzeigen, wenn ha-form nicht geladen ist."""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
p = root / 'src' / 'devices-editor.js'
s = p.read_text(encoding='utf-8')

start_marker = "      // Assistent: Räume und Geräte aus den Bereichen vorschlagen\n"
end_marker = "      w.appendChild(ab);\n"
a = s.index(start_marker)
b = s.index(end_marker, a) + len(end_marker)
block = s[a:b]
s = s[:a] + "      this._assist(w);\n" + s[b:]

method = "    _assist(w) {\n      const c = this._c;\n" + block + "    }\n"
anchor = "    _render() {"
assert anchor in s
s = s.replace(anchor, method + anchor, 1)

old = "        w.textContent = 'Das Formular konnte nicht geladen werden. Bitte die Seite neu laden (Strg + F5) oder die Karte im YAML-Editor bearbeiten.';\n        return;"
assert old in s
new = "        this._assist(w);\n        const m = document.createElement('div');\n        m.textContent = 'Das Formular konnte nicht geladen werden. Bitte die Seite neu laden (Strg + F5) oder die Karte im YAML-Editor bearbeiten.';\n        w.appendChild(m);\n        return;"
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('ok')
