#!/usr/bin/env bash
# Ruft die öffentlichen Kennzahlen des Projekts von GitHub ab, hängt eine Zeile an github-stats.csv an
# und zeigt den Unterschied zur letzten Messung.
GH="/c/Program Files/GitHub CLI/gh.exe"
R=repos/msucimaker3112/energy-cockpit
cd "$(dirname "$0")/.." || exit 1
F=github-stats.csv
[ -f "$F" ] || echo "zeit;sterne;forks;issues;downloads_gesamt;downloads_neueste;aufrufe_14t;besucher_14t;klone_14t;klone_eindeutig_14t" > "$F"

repo=$("$GH" api "$R" --jq '"\(.stargazers_count);\(.forks_count);\(.open_issues_count)"')
dl=$("$GH" api "$R/releases" --jq '"\([.[].assets[].download_count] | add);\(.[0].assets | map(.download_count) | add)"')
views=$("$GH" api "$R/traffic/views" --jq '"\(.count);\(.uniques)"' 2>/dev/null || echo "0;0")
clones=$("$GH" api "$R/traffic/clones" --jq '"\(.count);\(.uniques)"' 2>/dev/null || echo "0;0")
now=$(date '+%Y-%m-%d %H:%M')
echo "$now;$repo;$dl;$views;$clones" >> "$F"

echo "Messung $now"
tail -n 2 "$F" | awk -F';' '
  NR==1 { for (i=2;i<=NF;i++) p[i]=$i; n=NF; t0=$1; next }
  { split("Sterne Forks Issues Downloads_gesamt Downloads_neueste Aufrufe_14T Besucher_14T Klone_14T Klone_eindeutig_14T", L, " ")
    for (i=2;i<=NF;i++) printf "%-22s %6s  (%+d seit %s)\n", L[i-1], $i, $i-p[i], t0 }'
