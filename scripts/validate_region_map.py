#!/usr/bin/env python3
"""Validate a region-map 2D array from stdin against the problem rules.

Usage:
  python scripts/generate_region_map.py 10 | python scripts/validate_region_map.py 10
  python scripts/validate_region_map.py 9 <<< "[[0,1,...],[...],...]"

Exit code 0 = pass, 1 = fail.
"""

from __future__ import annotations

import ast
import sys
import time
from typing import Optional

ORTHO = ((0, 1), (1, 0), (0, -1), (-1, 0))


def region_sizes(regions: list[list[int]]) -> list[int]:
    n = len(regions)
    sizes = [0] * n
    for row in regions:
        for v in row:
            if 0 <= v < n:
                sizes[v] += 1
    return sizes


def is_region_connected(regions: list[list[int]], region_id: int) -> bool:
    n = len(regions)
    cells: list[tuple[int, int]] = []
    for r in range(n):
        for c in range(n):
            if regions[r][c] == region_id:
                cells.append((r, c))
    if not cells:
        return False
    if len(cells) == 1:
        return True
    cell_set = set(cells)
    q = [cells[0]]
    seen = {cells[0]}
    while q:
        r, c = q.pop()
        for dr, dc in ORTHO:
            key = (r + dr, c + dc)
            if key in cell_set and key not in seen:
                seen.add(key)
                q.append(key)
    return len(seen) == len(cells)


def find_solutions(
    regions: list[list[int]],
    limit: int = 2,
    timeout_sec: float = 30.0,
) -> Optional[list[list[int]]]:
    n = len(regions)
    used_cols = [False] * n
    used_regions = [False] * n
    placed: list[int] = []
    sols: list[list[int]] = []
    deadline = time.time() + timeout_sec
    timed_out = False

    def dfs(row: int) -> None:
        nonlocal timed_out
        if time.time() > deadline:
            timed_out = True
            return
        if len(sols) >= limit:
            return
        if row == n:
            sols.append(placed[:])
            return
        for c in range(n):
            if timed_out or len(sols) >= limit:
                return
            if used_cols[c]:
                continue
            rid = regions[row][c]
            if used_regions[rid]:
                continue
            if row > 0 and abs(placed[row - 1] - c) <= 1:
                continue
            used_cols[c] = True
            used_regions[rid] = True
            placed.append(c)
            dfs(row + 1)
            placed.pop()
            used_cols[c] = False
            used_regions[rid] = False

    dfs(0)
    return None if timed_out else sols


def validate(n: int, text: str) -> list[str]:
    errors: list[str] = []
    raw = text.strip()
    if not raw:
        return ["empty output"]

    try:
        board = ast.literal_eval(raw)
    except (SyntaxError, ValueError) as exc:
        return [f"cannot parse output as Python literal: {exc}"]

    if not isinstance(board, list):
        return ["output is not a list"]
    if len(board) != n:
        errors.append(f"row count {len(board)} != N={n}")
    for i, row in enumerate(board):
        if not isinstance(row, list):
            errors.append(f"row {i} is not a list")
            continue
        if len(row) != n:
            errors.append(f"row {i} length {len(row)} != N={n}")
        for j, v in enumerate(row):
            if not isinstance(v, int) or isinstance(v, bool):
                errors.append(f"cell ({i},{j}) is not int: {v!r}")
            elif v < 0 or v >= n:
                errors.append(f"cell ({i},{j}) id {v} out of range 0..{n - 1}")
    if errors:
        return errors

    typed = [[int(v) for v in row] for row in board]
    sizes = region_sizes(typed)
    for rid, size in enumerate(sizes):
        if size == 0:
            errors.append(f"missing region id {rid}")
    if any(s == 1 for s in sizes):
        pass
    else:
        errors.append("no singleton region (need at least one size-1 color)")

    for rid in range(n):
        if sizes[rid] > 0 and not is_region_connected(typed, rid):
            errors.append(f"region {rid} is not 4-connected")

    sols = find_solutions(typed, limit=2, timeout_sec=30.0)
    if sols is None:
        errors.append("solution search timed out")
    elif len(sols) == 0:
        errors.append("no legal placement")
    elif len(sols) >= 2:
        errors.append("not unique (found at least 2 solutions)")

    return errors


def main() -> None:
    if len(sys.argv) < 2:
        print(
            "usage: validate_region_map.py N [board_file]\n"
            "  board from stdin, or from board_file if given",
            file=sys.stderr,
        )
        sys.exit(1)
    try:
        n = int(sys.argv[1])
    except ValueError:
        print("N must be an integer", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) >= 3:
        with open(sys.argv[2], "r", encoding="utf-8-sig") as f:
            text = f.read()
    else:
        text = sys.stdin.read()
        if text.startswith("\ufeff"):
            text = text.lstrip("\ufeff")
    errors = validate(n, text)
    if errors:
        print("FAIL")
        for e in errors:
            print(f"- {e}")
        sys.exit(1)
    print("PASS")
    sys.exit(0)


if __name__ == "__main__":
    main()
