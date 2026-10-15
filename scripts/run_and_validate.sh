#!/usr/bin/env bash
# Run generator then validate its stdout.
#
# Usage:
#   ./scripts/run_and_validate.sh 10
#   ./scripts/run_and_validate.sh 9 90   # N=9, timeout 90s
#
# Exit: 0 pass, 1 fail/validate error, 124 timeout (GNU timeout)

set -euo pipefail

N="${1:?usage: $0 N [timeout_sec]}"
TIMEOUT_SEC="${2:-60}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GEN="$ROOT/scripts/generate_region_map.py"
VAL="$ROOT/scripts/validate_region_map.py"
OUT="$(mktemp)"
trap 'rm -f "$OUT"' EXIT

if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
  echo "python not found" >&2
  exit 1
fi
PY="$(command -v python3 || command -v python)"

run_gen() {
  if command -v timeout >/dev/null 2>&1; then
    timeout --signal=KILL "${TIMEOUT_SEC}s" "$PY" "$GEN" "$N"
  elif command -v gtimeout >/dev/null 2>&1; then
    gtimeout --signal=KILL "${TIMEOUT_SEC}s" "$PY" "$GEN" "$N"
  else
    # No timeout binary: still run, but cannot enforce wall clock.
    "$PY" "$GEN" "$N"
  fi
}

set +e
run_gen >"$OUT" 2>/dev/null
GEN_EC=$?
set -e

if [[ "$GEN_EC" -eq 124 ]]; then
  echo "FAIL"
  echo "- generator timed out after ${TIMEOUT_SEC}s"
  exit 124
fi
if [[ "$GEN_EC" -ne 0 ]]; then
  echo "FAIL"
  echo "- generator exited with code $GEN_EC"
  exit 1
fi
if [[ ! -s "$OUT" ]]; then
  echo "FAIL"
  echo "- empty output"
  exit 1
fi

"$PY" "$VAL" "$N" "$OUT"
