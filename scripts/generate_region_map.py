#!/usr/bin/env python3
"""Construct an N×N region map with unique Color-Queens-style solution.

Usage:
  python generate_region_map.py 8
  echo 9 | python generate_region_map.py

Prints one line: a 2D list. On failure prints nothing. Time budget ~60s.
"""

from __future__ import annotations

import random
import sys
import time
from typing import Callable, Optional

ORTHO = ((0, 1), (1, 0), (0, -1), (-1, 0))


def region_sizes(regions: list[list[int]]) -> list[int]:
    n = len(regions)
    sizes = [0] * n
    for row in regions:
        for v in row:
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
            nr, nc = r + dr, c + dc
            key = (nr, nc)
            if key in cell_set and key not in seen:
                seen.add(key)
                q.append(key)
    return len(seen) == len(cells)


def are_all_regions_connected(regions: list[list[int]]) -> bool:
    n = len(regions)
    return all(is_region_connected(regions, i) for i in range(n))


def find_solutions(
    regions: list[list[int]],
    limit: int,
    deadline: float,
) -> Optional[list[list[int]]]:
    n = len(regions)
    used_cols = [False] * n
    used_regions = [False] * n
    placed: list[int] = []
    sols: list[list[int]] = []
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
            region_id = regions[row][c]
            if used_regions[region_id]:
                continue
            if row > 0 and abs(placed[row - 1] - c) <= 1:
                continue
            used_cols[c] = True
            used_regions[region_id] = True
            placed.append(c)
            dfs(row + 1)
            placed.pop()
            used_cols[c] = False
            used_regions[region_id] = False

    dfs(0)
    return None if timed_out else sols


def random_placement(n: int, rng: random.Random) -> Optional[list[int]]:
    cols: list[int] = []
    used = [False] * n

    def dfs(row: int) -> bool:
        if row == n:
            return True
        order = list(range(n))
        rng.shuffle(order)
        for c in order:
            if used[c]:
                continue
            if row > 0 and abs(cols[row - 1] - c) <= 1:
                continue
            used[c] = True
            cols.append(c)
            if dfs(row + 1):
                return True
            cols.pop()
            used[c] = False
        return False

    return cols if dfs(0) else None


def grow_regions(
    n: int,
    cols: list[int],
    keep_single: list[int],
    max_region: int,
    rng: random.Random,
) -> Optional[list[list[int]]]:
    regions = [[-1] * n for _ in range(n)]
    sizes = [0] * n
    for r in range(n):
        regions[r][cols[r]] = r
        sizes[r] = 1
    frozen = set(keep_single)
    remaining = n * n - n
    guard = n * n * 80

    def fill_pool(allow_frozen: bool, ignore_max: bool) -> list[tuple[int, int, int]]:
        next_opts: list[tuple[int, int, int]] = []
        for r in range(n):
            for c in range(n):
                if regions[r][c] != -1:
                    continue
                seen: set[int] = set()
                for dr, dc in ORTHO:
                    nr, nc = r + dr, c + dc
                    if nr < 0 or nc < 0 or nr >= n or nc >= n:
                        continue
                    rid = regions[nr][nc]
                    if rid < 0:
                        continue
                    if not allow_frozen and rid in frozen:
                        continue
                    if not ignore_max and sizes[rid] >= max_region:
                        continue
                    if rid not in seen:
                        seen.add(rid)
                        next_opts.append((r, c, rid))
        return next_opts

    while remaining > 0 and guard > 0:
        guard -= 1
        options: list[tuple[int, int, int]] = []
        for r in range(n):
            for c in range(n):
                if regions[r][c] != -1:
                    continue
                seen: set[int] = set()
                for dr, dc in ORTHO:
                    nr, nc = r + dr, c + dc
                    if nr < 0 or nc < 0 or nr >= n or nc >= n:
                        continue
                    rid = regions[nr][nc]
                    if rid < 0:
                        continue
                    if rid in frozen and remaining > n:
                        continue
                    if sizes[rid] >= max_region:
                        continue
                    if rid not in seen:
                        seen.add(rid)
                        options.append((r, c, rid))
        pool = options
        if not pool:
            pool = fill_pool(False, True)
        if not pool:
            pool = fill_pool(True, True)
        if not pool:
            return None
        pool.sort(key=lambda x: sizes[x[2]])
        cut = max(6, len(pool) * 4 // 10)
        pick = pool[rng.randrange(min(cut, len(pool)))]
        pr, pc, pid = pick
        if regions[pr][pc] != -1:
            continue
        regions[pr][pc] = pid
        sizes[pid] += 1
        remaining -= 1
    return None if remaining > 0 else regions


def clone_regions(regions: list[list[int]]) -> list[list[int]]:
    return [row[:] for row in regions]


def mutate_regions(
    regions: list[list[int]],
    seed_cells: set[tuple[int, int]],
    rng: random.Random,
) -> bool:
    n = len(regions)
    sizes = region_sizes(regions)
    moves: list[tuple[int, int, int, int]] = []
    for r in range(n):
        for c in range(n):
            if (r, c) in seed_cells:
                continue
            frm = regions[r][c]
            if sizes[frm] <= 1:
                continue
            seen: set[int] = set()
            for dr, dc in ORTHO:
                nr, nc = r + dr, c + dc
                if nr < 0 or nc < 0 or nr >= n or nc >= n:
                    continue
                to = regions[nr][nc]
                if to == frm or to in seen:
                    continue
                seen.add(to)
                moves.append((r, c, frm, to))
    if not moves:
        return False
    rng.shuffle(moves)
    for r, c, _frm, to in moves[:24]:
        nxt = clone_regions(regions)
        nxt[r][c] = to
        if not are_all_regions_connected(nxt):
            continue
        if sum(1 for s in region_sizes(nxt) if s == 1) < 1:
            continue
        regions[r][c] = to
        return True
    return False


def peel_to_singleton(
    regions: list[list[int]],
    cols: list[int],
    rng: random.Random,
) -> bool:
    n = len(regions)
    order = list(range(n))
    rng.shuffle(order)
    for rid in order:
        sr, sc = rid, cols[rid]
        guard = n * n
        while guard > 0:
            guard -= 1
            sizes = region_sizes(regions)
            if sizes[rid] == 1:
                return True
            leaves: list[tuple[int, int, int]] = []
            for r in range(n):
                for c in range(n):
                    if regions[r][c] != rid:
                        continue
                    if r == sr and c == sc:
                        continue
                    for dr, dc in ORTHO:
                        nr, nc = r + dr, c + dc
                        if nr < 0 or nc < 0 or nr >= n or nc >= n:
                            continue
                        to = regions[nr][nc]
                        if to != rid and to >= 0:
                            leaves.append((r, c, to))
                            break
            if not leaves:
                break
            r, c, to = leaves[rng.randrange(len(leaves))]
            nxt = clone_regions(regions)
            nxt[r][c] = to
            if not are_all_regions_connected(nxt):
                continue
            regions[r][c] = to
    return any(s == 1 for s in region_sizes(regions))


def kill_alternate(
    regions: list[list[int]],
    sol1: list[int],
    sol2: list[int],
    seed_cells: set[tuple[int, int]],
    rng: random.Random,
) -> bool:
    n = len(regions)
    targets = [(r, sol2[r]) for r in range(n) if sol2[r] != sol1[r]]
    rng.shuffle(targets)
    for r, c in targets:
        if (r, c) in seed_cells:
            continue
        frm = regions[r][c]
        sizes = region_sizes(regions)
        if sizes[frm] <= 1:
            continue
        tos: list[int] = []
        for dr, dc in ORTHO:
            nr, nc = r + dr, c + dc
            if nr < 0 or nc < 0 or nr >= n or nc >= n:
                continue
            to = regions[nr][nc]
            if to != frm and to not in tos:
                tos.append(to)
        rng.shuffle(tos)
        for to in tos:
            nxt = clone_regions(regions)
            nxt[r][c] = to
            if not are_all_regions_connected(nxt):
                continue
            if not any(s == 1 for s in region_sizes(nxt)):
                continue
            regions[r][c] = to
            return True
    return mutate_regions(regions, seed_cells, rng)


def params_for(n: int) -> tuple[int, int, int, int, int]:
    """max_single, max_region, unique_ms, mutates, tries."""
    if n <= 8:
        return 2, 22, 1500, 0, 8000
    if n == 9:
        return 2, 18, 1200, 48, 300
    return 2, 18, 2000, 64, 400


def generate_one(n: int, seed: int) -> Optional[list[list[int]]]:
    max_single, max_region, unique_ms, mutates, _tries = params_for(n)
    rng = random.Random(seed)
    cols = random_placement(n, rng)
    if not cols:
        return None
    ids = list(range(n))
    rng.shuffle(ids)
    keep_n = 0 if n >= 9 else max_single
    keep_single = ids[:keep_n]
    regions = grow_regions(n, cols, keep_single, max_region, rng)
    if not regions:
        return None
    if not are_all_regions_connected(regions):
        return None
    if n >= 9 and not peel_to_singleton(regions, cols, rng):
        return None
    singles = sum(1 for s in region_sizes(regions) if s == 1)
    if singles < 1 or singles > max_single:
        return None
    seed_cells = {(r, cols[r]) for r in range(n)}
    for m in range(mutates + 1):
        sols = find_solutions(regions, 2, time.time() + unique_ms / 1000.0)
        if sols is None:
            return None
        if len(sols) == 1:
            return regions
        if len(sols) == 0:
            return None
        if m == mutates:
            return None
        if not kill_alternate(regions, sols[0], sols[1], seed_cells, rng):
            return None
        singles = sum(1 for s in region_sizes(regions) if s == 1)
        if singles < 1 or singles > max_single:
            return None
    return None


def generate(n: int, base_seed: int = 20261015, deadline: Optional[float] = None) -> Optional[list[list[int]]]:
    if deadline is None:
        deadline = time.time() + 60.0
    _ms, _mr, _um, _mut, tries = params_for(n)
    seed = base_seed
    seen: set[str] = set()
    for t in range(tries):
        if time.time() > deadline:
            return None
        seed += 19 + n * 5 + (t % 97)
        regions = generate_one(n, seed)
        if regions is None:
            continue
        key = str(regions)
        if key in seen:
            continue
        seen.add(key)
        return regions
    return None


def main() -> None:
    if len(sys.argv) >= 2:
        raw = sys.argv[1]
    else:
        line = sys.stdin.readline()
        if not line:
            return
        raw = line.strip()
    try:
        n = int(raw)
    except ValueError:
        return
    if n < 2 or n > 12:
        return
    board = generate(n)
    if board is None:
        return
    print(board)


if __name__ == "__main__":
    main()
