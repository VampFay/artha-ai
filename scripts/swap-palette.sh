#!/bin/bash
# Replace all hardcoded forest/gold/moss/clay hex values with new carbon+saffron palette
# across the entire src/ directory.

cd /home/z/my-project

# Hex replacements (case-insensitive)
FILES=$(grep -rlE '#0d3b2e|#062418|#031711|#1a5c47|#4a7c59|#6fa37e|#d4a017|#e8c14a|#b88810|#c65d3a|#e08866|#f4d97a' src/ 2>/dev/null)

for f in $FILES; do
  sed -i \
    -e 's/#0d3b2e/#1a1a1a/gI' \
    -e 's/#062418/#0a0a0a/gI' \
    -e 's/#031711/#050505/gI' \
    -e 's/#1a5c47/#2e2e2e/gI' \
    -e 's/#4a7c59/#6b6258/gI' \
    -e 's/#6fa37e/#8f8678/gI' \
    -e 's/#d4a017/#d97706/gI' \
    -e 's/#e8c14a/#f59e0b/gI' \
    -e 's/#b88810/#b45309/gI' \
    -e 's/#c65d3a/#b91c1c/gI' \
    -e 's/#e08866/#dc2626/gI' \
    -e 's/#f4d97a/#fbbf24/gI' \
    "$f"
  echo "updated: $f"
done

# RGBA replacements
FILES2=$(grep -rlE 'rgba\(13,59,46|rgba\(6,36,24|rgba\(3,23,17|rgba\(26,92,71|rgba\(74,124,89|rgba\(111,163,126|rgba\(212,160,23|rgba\(232,193,74|rgba\(184,136,16|rgba\(198,93,58|rgba\(224,136,102|rgba\(244,217,122' src/ 2>/dev/null)

for f in $FILES2; do
  sed -i \
    -e 's/rgba(13,59,46/rgba(26,26,26/gI' \
    -e 's/rgba(6,36,24/rgba(10,10,10/gI' \
    -e 's/rgba(3,23,17/rgba(5,5,5/gI' \
    -e 's/rgba(26,92,71/rgba(46,46,46/gI' \
    -e 's/rgba(74,124,89/rgba(107,98,88/gI' \
    -e 's/rgba(111,163,126/rgba(143,134,120/gI' \
    -e 's/rgba(212,160,23/rgba(217,119,6/gI' \
    -e 's/rgba(232,193,74/rgba(245,158,11/gI' \
    -e 's/rgba(184,136,16/rgba(180,83,9/gI' \
    -e 's/rgba(198,93,58/rgba(185,28,28/gI' \
    -e 's/rgba(224,136,102/rgba(220,38,38/gI' \
    -e 's/rgba(244,217,122/rgba(251,191,36/gI' \
    "$f"
  echo "rgba updated: $f"
done

echo "=== DONE ==="
