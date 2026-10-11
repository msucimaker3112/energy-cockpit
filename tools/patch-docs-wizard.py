"""Einmalig: Doku um den Einrichtungsassistenten ergänzen, Version 0.2.0."""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent


def edit(path, fn):
    p = root / path
    s = p.read_text(encoding='utf-8')
    t = fn(s)
    assert t != s, f'{path}: keine Änderung'
    p.write_text(t, encoding='utf-8')


# README
def readme(s):
    s = s.replace(
        "Alle Sensoren sind frei wählbar. Es gibt keinen festen Gerätenamen im Code. Die Texte sind komplett deutsch, die Währung kommt aus Home Assistant.",
        "Alle Sensoren sind frei wählbar. Es gibt keinen festen Gerätenamen im Code. Die Texte sind komplett deutsch, die Währung kommt aus Home Assistant.\n\n**Einrichtungsassistent:** Nach dem Hinzufügen einer Karte öffnet sich der Editor im Reiter *Assistent*. Er führt Schritt für Schritt durch Solar, Netz, Batterie, Verbraucher und Preise, macht Sensor-Vorschläge aus deinen vorhandenen Entitäten und zeigt jeweils den aktuellen Wert. Bei *Geräte & Verbrauch* legt er Räume und Geräte auf Wunsch aus den Bereichen von Home Assistant an.")
    return s


# Installation
def install(s):
    old = "## 5. Erste Konfiguration (Energiefluss)"
    new = """## 5. Einrichtungsassistent

Beim ersten Hinzufügen einer Karte (oder über **Bearbeiten** an einer noch leeren Karte) öffnet sich der Editor im Reiter **Assistent**:

1. **Schritt für Schritt:** Solar, Netz, Batterie, Haus, Einzelverbraucher, Preise. Jeder Schritt zeigt Vorschläge aus deinen Sensoren und den aktuellen Wert, damit du die Auswahl gleich prüfen kannst.
2. **Vorschlag übernehmen:** Ein Klick wählt den wahrscheinlichsten Sensor.
3. **Alles wird sofort gespeichert**, du kannst jederzeit zum Reiter **Alle Felder** wechseln (Gruppen, Feinheiten).
4. **Geräte & Verbrauch:** Die Schaltfläche *Räume und Geräte aus Bereichen vorschlagen* legt Räume anhand der Bereiche in Home Assistant an und ordnet alle Geräte mit Leistungssensor zu.
5. **Statistik:** Die Gesamtzähler (PV, Bezug, Einspeisung) sind Pflicht, alles andere optional.

Solange eine Karte nicht eingerichtet ist, zeigt sie einen Hinweis statt einer Fehlermeldung.

## 6. Konfiguration im Detail (Energiefluss)"""
    assert old in s
    s = s.replace(old, new, 1)
    s = s.replace("## 6. Aktualisieren", "## 7. Aktualisieren").replace("## 7. Deinstallation", "## 8. Deinstallation")
    return s


# Handout
def handout(s):
    s = s.replace("Version 0.1.2", "Version 0.2.0")
    s = s.replace('<li>Sensoren im Editor auswählen → <b>Speichern</b></li>',
                  '<li>Im <b>Assistenten</b> Schritt für Schritt Sensoren auswählen (mit Vorschlägen) → <b>Speichern</b></li>')
    return s


edit('README.md', readme)
edit('docs/INSTALLATION.md', install)
edit('docs/handout.html', handout)
pkg = root / 'package.json'
pkg.write_text(pkg.read_text(encoding='utf-8').replace('"version": "0.1.2"', '"version": "0.2.0"'), encoding='utf-8')
print('ok')
