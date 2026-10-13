"""Einmalig: feste Anschaffungskosten (investment_eur) für die Amortisation in der Statistik-Karte."""
import pathlib

R = pathlib.Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = R / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f'{path}: nicht gefunden: {old[:70]!r}'
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')


sub('src/stats-card.js', [
    ("const inv = val(h, c.investment, 0);",
     "const inv = val(h, c.investment, typeof c.investment_eur === 'number' ? c.investment_eur : 0);"),
])
sub('src/stats-editor.js', [
    ("      { path: 'investment', label: 'Anschaffungskosten der PV-Anlage', kind: 'money', optional: true, hints: H(/anschaff|invest|kosten|cost/i) },",
     "      { path: 'investment_eur', label: 'Anschaffungskosten der PV-Anlage (Euro)', kind: 'number', optional: true, step: '50', help: 'Gesamtpreis der Anlage laut Rechnung, zum Beispiel 18000. Damit berechnet die Karte die Amortisation.' },\n"
     "      { path: 'investment', label: 'oder Anschaffungskosten aus einem Sensor oder Helfer', kind: 'money', optional: true, hints: H(/anschaff|invest|kosten|cost/i) },"),
    ("      ent('investment', ['sensor', 'input_number']),",
     "      { name: 'investment_eur', selector: { number: { min: 0, max: 1000000, step: 50, mode: 'box' } } },\n      ent('investment', ['sensor', 'input_number']),"),
    ("grid_price_ct: 'oder fester Strompreis (Cent pro kWh)',",
     "grid_price_ct: 'oder fester Strompreis (Cent pro kWh)', investment_eur: 'Anschaffungskosten der PV-Anlage (Euro, fest)',"),
])
sub('docs/KONFIGURATION.md', [
    ("investment: input_number.anschaffung_pv    # für die Amortisation",
     "investment_eur: 18000                      # Anschaffungskosten in Euro für die Amortisation ...\n# investment: input_number.anschaffung_pv  # ... oder aus einem Sensor oder Helfer"),
])
print('ok')
