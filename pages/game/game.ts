import { getLevels } from '../../data/levels'
import { colorsForSize } from '../../utils/colors'
import { findUniqueSolution } from '../../utils/levelValidate'
import { isSolutionCell } from '../../utils/placementCheck'
import {
  autoMarkDeadCells,
  cloneBoard,
  createEmptyBoard,
  applyCellTap,
  getConflicts,
  getForcedHint,
  isSolved,
  listPlacements,
} from '../../utils/rules'
import { canUseAutoMarkDeadCells, isAutoMarkDeadCellsUnlocked } from '../../utils/features'
import { loadSettings, setAutoMarkDeadCells, setColorWeakMode } from '../../utils/settings'
import { createWxStorage, markLevelCompleted } from '../../utils/storage'
import {
  findLevel,
  getNextNormalId,
  onTutorialLevelSolved,
  skipTutorial,
} from '../../utils/tutorialFlow'
import type { Board, CellPos, CellState, Level } from '../../utils/types'

const DBL_TAP_MS = 320
const MAX_LIVES = 2

function placedCountOf(board: Board): number {
  return listPlacements(board).length
}

function livesTextOf(lives: number): string {
  if (lives <= 0) return '无'
  return '♥'.repeat(lives)
}

function overlayWrongCells(source: Board, target: Board): Board {
  const next = cloneBoard(target)
  for (let r = 0; r < source.length; r++) {
    for (let c = 0; c < source[r].length; c++) {
      if (source[r][c] === 'wrong') next[r][c] = 'wrong'
    }
  }
  return next
}

interface HistoryEntry {
  board: Board
  tipIndex: number
}

function keyOf(p: CellPos): string {
  return `${p.r}-${p.c}`
}

function toConflictMap(cells: CellPos[]): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  for (const p of cells) map[keyOf(p)] = true
  return map
}

Page({
  data: {
    levelId: '',
    title: '',
    isTutorial: false,
    size: 0,
    regions: [] as number[][],
    board: [] as Board,
    colors: [] as string[],
    conflictMap: {} as Record<string, boolean>,
    tipText: '',
    highlight: null as CellPos | null | Record<string, never>,
    tipIndex: 0,
    hasHint: false,
    autoMarkEnabled: false,
    autoMarkUnlocked: true,
    colorWeak: false,
    placedCount: 0,
    lives: MAX_LIVES,
    livesText: '♥♥',
    showLives: false,
  },

  level: null as Level | null,
  history: [] as HistoryEntry[],
  tipIndex: 0,
  paintStrokeActive: false,
  lastTapR: -1,
  lastTapC: -1,
  lastTapAt: 0,
  lastTapStart: 'empty' as CellState,
  solutionCols: null as number[] | null,
  failModalOpen: false,

  onLoad(query: Record<string, string | undefined>) {
    const id = query.id
    if (!id) {
      wx.showToast({ title: '关卡不存在', icon: 'none' })
      return
    }
    this.loadLevel(id)
  },

  onShow() {
    this.refreshAssistSettings()
  },

  refreshAssistSettings() {
    const adapter = createWxStorage()
    const settings = loadSettings(adapter)
    const autoMarkEnabled = canUseAutoMarkDeadCells(
      adapter,
      settings.autoMarkDeadCells,
    )
    const colorWeak = Boolean(settings.colorWeakMode)
    const size = Number(this.data.size) || 0
    this.setData({
      autoMarkEnabled,
      autoMarkUnlocked: isAutoMarkDeadCellsUnlocked(adapter),
      colorWeak,
      colors: size > 0 ? colorsForSize(size, colorWeak) : this.data.colors,
    })
  },

  loadLevel(id: string) {
    const level = findLevel(getLevels(), id)
    if (!level) {
      wx.showToast({ title: '关卡不存在', icon: 'none' })
      return
    }
    this.level = level
    this.history = []
    this.tipIndex = 0
    this.paintStrokeActive = false
    this.lastTapR = -1
    this.lastTapC = -1
    this.lastTapAt = 0
    this.lastTapStart = 'empty'
    this.solutionCols =
      level.kind === 'normal' ? findUniqueSolution(level.regions) : null
    this.failModalOpen = false
    const board = createEmptyBoard(level.size)
    const tip = level.tips?.[0]
    this.setData({
      levelId: level.id,
      title: level.name,
      isTutorial: level.kind === 'tutorial',
      size: level.size,
      regions: level.regions,
      board,
      colors: colorsForSize(level.size, Boolean(this.data.colorWeak)),
      conflictMap: {},
      tipText: tip?.text ?? '',
      highlight: tip?.highlight ?? null,
      tipIndex: 0,
      hasHint: false,
      placedCount: 0,
      lives: MAX_LIVES,
      livesText: livesTextOf(MAX_LIVES),
      showLives: level.kind === 'normal',
    })
    this.refreshAssistSettings()
    wx.setNavigationBarTitle({ title: level.name })
  },

  pushHistory() {
    this.history.push({
      board: cloneBoard(this.data.board as Board),
      tipIndex: this.tipIndex,
    })
    if (this.history.length > 80) this.history.shift()
  },

  /** 应用盘面并自动清死格、刷新冲突/教学、判定胜利 */
  commitBoard(board: Board, opts?: { skipAutoMark?: boolean }) {
    const level = this.level
    if (!level) return

    let next = board
    const shouldAutoMark = !opts?.skipAutoMark && this.data.autoMarkEnabled
    if (shouldAutoMark) {
      next = autoMarkDeadCells(next, level.regions)
    }

    // 教学：若当前 tip 目标已被满足（含自动标 ×），推进提示
    this.syncTutorialTipsWithBoard(next)

    const conflicts = getConflicts(next, level.regions)
    const tip = level.tips?.[this.tipIndex]
    const lives = Number(this.data.lives)
    this.setData({
      board: next,
      conflictMap: toConflictMap(conflicts.cells),
      hasHint: false,
      tipText: tip?.text ?? '',
      highlight: tip?.highlight ?? null,
      tipIndex: this.tipIndex,
      placedCount: placedCountOf(next),
      livesText: livesTextOf(lives),
    })

    if (isSolved(next, level.regions)) {
      this.onSolved()
    }
  },

  lockWrongCell(board: Board, r: number, c: number) {
    if (!this.level || this.level.kind !== 'normal') return
    board[r][c] = 'wrong'
    const lives = Math.max(0, Number(this.data.lives) - 1)
    this.setData({ lives, livesText: livesTextOf(lives) })
    this.commitBoard(board, { skipAutoMark: true })
    if (lives <= 0) this.onChallengeFailed()
  },

  onChallengeFailed() {
    if (this.failModalOpen || !this.level) return
    this.failModalOpen = true
    const id = this.level.id
    wx.showModal({
      title: '挑战失败',
      content: '错放两次，本关将重新开始。',
      showCancel: false,
      confirmText: '重开',
      success: () => {
        this.failModalOpen = false
        this.loadLevel(id)
      },
    })
  },

  syncTutorialTipsWithBoard(board: Board) {
    const level = this.level
    if (!level?.tips || level.kind !== 'tutorial') return
    while (this.tipIndex < level.tips.length) {
      const tip = level.tips[this.tipIndex]
      if (!tip.highlight || !tip.expect) break
      const { r, c } = tip.highlight
      if (board[r][c] === tip.expect) {
        if (this.tipIndex + 1 < level.tips.length) {
          this.tipIndex += 1
          continue
        }
      }
      break
    }
  },

  onCellTap(e: WechatMiniprogram.CustomEvent) {
    const { r, c } = e.detail as { r: number; c: number }
    const level = this.level
    if (!level) return

    if (level.kind === 'tutorial') {
      const tip = level.tips?.[this.tipIndex]
      if (tip?.highlight && tip.expect) {
        if (tip.highlight.r !== r || tip.highlight.c !== c) {
          wx.showToast({ title: '先点高亮格哦', icon: 'none' })
          return
        }
      }
    }

    const now = Date.now()
    const isDouble =
      this.lastTapR === r &&
      this.lastTapC === c &&
      now - this.lastTapAt > 0 &&
      now - this.lastTapAt <= DBL_TAP_MS &&
      (this.lastTapStart === 'empty' || this.lastTapStart === 'mark')

    const board = cloneBoard(this.data.board as Board)
    if (board[r][c] === 'wrong') return

    if (isDouble) {
      this.lastTapAt = 0
      this.lastTapR = -1
      this.lastTapC = -1
      const next = applyCellTap(board[r][c], 'double')
      if (next === board[r][c]) return
      if (
        next === 'place' &&
        level.kind === 'normal' &&
        !isSolutionCell(this.solutionCols, r, c)
      ) {
        this.lockWrongCell(board, r, c)
        return
      }
      board[r][c] = next
      this.commitBoard(board)
      return
    }

    this.lastTapR = r
    this.lastTapC = c
    this.lastTapAt = now
    this.lastTapStart = board[r][c]
    this.pushHistory()
    board[r][c] = applyCellTap(board[r][c], 'single')
    this.commitBoard(board)
  },

  onPaintStart() {
    if (!this.level) return
    this.lastTapAt = 0
    this.lastTapR = -1
    this.lastTapC = -1
    if (this.level.kind === 'tutorial') {
      // 教学关仍允许长按标 ×，但不强制高亮约束（降低挫败）
    }
    this.pushHistory()
    this.paintStrokeActive = true
  },

  onPaintMark(e: WechatMiniprogram.CustomEvent) {
    const { r, c } = e.detail as { r: number; c: number }
    const level = this.level
    if (!level || !this.paintStrokeActive) return

    const board = cloneBoard(this.data.board as Board)
    if (board[r][c] === 'place' || board[r][c] === 'mark' || board[r][c] === 'wrong') {
      return
    }
    board[r][c] = 'mark'

    // 涂抹过程中不反复 auto（无新增 place）；结束时再统一处理
    const conflicts = getConflicts(board, level.regions)
    this.syncTutorialTipsWithBoard(board)
    const tip = level.tips?.[this.tipIndex]
    this.setData({
      board,
      conflictMap: toConflictMap(conflicts.cells),
      tipText: tip?.text ?? this.data.tipText,
      highlight: level.kind === 'tutorial' ? tip?.highlight ?? null : this.data.highlight,
      tipIndex: this.tipIndex,
      placedCount: placedCountOf(board),
    })
  },

  onPaintEnd() {
    if (!this.paintStrokeActive || !this.level) return
    this.paintStrokeActive = false
    // 笔画结束：仅在开启自动清死格时再跑一遍
    if (this.data.autoMarkEnabled) {
      const board = autoMarkDeadCells(
        this.data.board as Board,
        this.level.regions,
      )
      this.commitBoard(board, { skipAutoMark: true })
    }
  },

  onUndo() {
    const prev = this.history.pop()
    if (!prev || !this.level) return
    this.tipIndex = prev.tipIndex
    const board = overlayWrongCells(this.data.board as Board, prev.board)
    const conflicts = getConflicts(board, this.level.regions)
    const tip = this.level.tips?.[this.tipIndex]
    const lives = Number(this.data.lives)
    this.setData({
      board,
      conflictMap: toConflictMap(conflicts.cells),
      tipIndex: this.tipIndex,
      tipText: tip?.text ?? '',
      highlight: tip?.highlight ?? null,
      hasHint: false,
      placedCount: placedCountOf(board),
      livesText: livesTextOf(lives),
    })
  },

  onClear() {
    if (!this.level) return
    this.pushHistory()
    const empty = createEmptyBoard(this.level.size)
    const board =
      this.level.kind === 'normal'
        ? overlayWrongCells(this.data.board as Board, empty)
        : empty
    this.tipIndex = 0
    const tip = this.level.tips?.[0]
    this.setData({
      board,
      conflictMap: {},
      tipIndex: 0,
      tipText: tip?.text ?? '',
      highlight: tip?.highlight ?? null,
      hasHint: false,
      placedCount: placedCountOf(board),
    })
  },

  onHint() {
    if (!this.level || this.level.kind === 'tutorial') return
    const pos = getForcedHint(this.data.board as Board, this.level.regions)
    if (!pos || this.data.board[pos.r][pos.c] === 'wrong') {
      wx.showToast({ title: '暂无强制格，再想想', icon: 'none' })
      return
    }
    this.setData({
      hasHint: true,
      highlight: pos,
    })
  },

  onAutoMarkChange(e: WechatMiniprogram.TouchEvent) {
    const adapter = createWxStorage()
    if (!isAutoMarkDeadCellsUnlocked(adapter)) return
    const enabled = Boolean((e.detail as { value?: boolean }).value)
    setAutoMarkDeadCells(adapter, enabled)
    const autoMarkEnabled = canUseAutoMarkDeadCells(adapter, enabled)
    this.setData({ autoMarkEnabled })
    if (autoMarkEnabled && this.level) {
      const next = autoMarkDeadCells(
        this.data.board as Board,
        this.level.regions,
      )
      this.commitBoard(next, { skipAutoMark: true })
    }
  },

  onColorWeakChange(e: WechatMiniprogram.TouchEvent) {
    const enabled = Boolean((e.detail as { value?: boolean }).value)
    setColorWeakMode(createWxStorage(), enabled)
    const size = Number(this.data.size) || 0
    this.setData({
      colorWeak: enabled,
      colors: size > 0 ? colorsForSize(size, enabled) : this.data.colors,
    })
  },

  onSkipTutorial() {
    wx.showModal({
      title: '跳过教学？',
      content: '可以直接去玩正式关卡，之后仍可从首页重玩教学。',
      confirmText: '跳过',
      cancelText: '继续',
      success: (res) => {
        if (!res.confirm) return
        skipTutorial(createWxStorage())
        wx.redirectTo({ url: '/pages/levels/levels' })
      },
    })
  },

  onSolved() {
    const level = this.level
    if (!level) return
    const adapter = createWxStorage()

    if (level.kind === 'tutorial') {
      const { nextTutorialId } = onTutorialLevelSolved(
        adapter,
        getLevels(),
        level.id,
      )
      if (nextTutorialId) {
        wx.showModal({
          title: '咕叽叫了一声！',
          content: '教学过关，继续下一关？',
          showCancel: false,
          confirmText: '继续',
          success: () => {
            this.loadLevel(nextTutorialId)
          },
        })
        return
      }
      wx.showModal({
        title: '教学完成',
        content: '已学会规则，去挑战正式关卡吧！',
        showCancel: false,
        confirmText: '关卡列表',
        success: () => {
          wx.redirectTo({ url: '/pages/levels/levels' })
        },
      })
      return
    }

    markLevelCompleted(adapter, level.id)
    const nextId = getNextNormalId(getLevels(), level.id)
    wx.showModal({
      title: '过关！',
      content: `${level.name} 完成了`,
      confirmText: '下一关',
      cancelText: '关卡列表',
      success: (res) => {
        if (res.confirm) {
          if (nextId) {
            this.loadLevel(nextId)
            return
          }
          wx.showToast({ title: '已经是最后一关', icon: 'none' })
          wx.redirectTo({ url: '/pages/levels/levels' })
          return
        }
        wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/levels/levels' }) })
      },
    })
  },
})
