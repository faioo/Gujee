import { getLevels } from '../../data/levels'
import { colorsForSize } from '../../utils/colors'
import {
  cloneBoard,
  createEmptyBoard,
  cycleCellState,
  getConflicts,
  getForcedHint,
  isSolved,
} from '../../utils/rules'
import { createWxStorage, markLevelCompleted } from '../../utils/storage'
import {
  findLevel,
  onTutorialLevelSolved,
  skipTutorial,
} from '../../utils/tutorialFlow'
import type { Board, CellPos, Level } from '../../utils/types'

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
  },

  level: null as Level | null,
  history: [] as HistoryEntry[],
  tipIndex: 0,

  onLoad(query: Record<string, string | undefined>) {
    const id = query.id
    if (!id) {
      wx.showToast({ title: '关卡不存在', icon: 'none' })
      return
    }
    this.loadLevel(id)
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
    const board = createEmptyBoard(level.size)
    const tip = level.tips?.[0]
    this.setData({
      levelId: level.id,
      title: level.name,
      isTutorial: level.kind === 'tutorial',
      size: level.size,
      regions: level.regions,
      board,
      colors: colorsForSize(level.size),
      conflictMap: {},
      tipText: tip?.text ?? '',
      highlight: tip?.highlight ?? null,
      tipIndex: 0,
      hasHint: false,
    })
    wx.setNavigationBarTitle({ title: level.name })
  },

  pushHistory() {
    this.history.push({
      board: cloneBoard(this.data.board as Board),
      tipIndex: this.tipIndex,
    })
    if (this.history.length > 80) this.history.shift()
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

    this.pushHistory()
    const board = cloneBoard(this.data.board as Board)
    const nextState = cycleCellState(board[r][c])
    board[r][c] = nextState

    if (level.kind === 'tutorial') {
      this.advanceTutorialTip(board, r, c, nextState)
    }

    const conflicts = getConflicts(board, level.regions)
    this.setData({
      board,
      conflictMap: toConflictMap(conflicts.cells),
      hasHint: false,
      tipText: level.tips?.[this.tipIndex]?.text ?? this.data.tipText,
      highlight: level.tips?.[this.tipIndex]?.highlight ?? null,
      tipIndex: this.tipIndex,
    })

    if (isSolved(board, level.regions)) {
      this.onSolved()
    }
  },

  advanceTutorialTip(
    board: Board,
    r: number,
    c: number,
    state: string,
  ) {
    const level = this.level
    if (!level?.tips) return
    const tip = level.tips[this.tipIndex]
    if (!tip?.highlight || !tip.expect) return
    if (tip.highlight.r === r && tip.highlight.c === c && state === tip.expect) {
      if (this.tipIndex + 1 < level.tips.length) {
        this.tipIndex += 1
      }
    }
    void board
  },

  onUndo() {
    const prev = this.history.pop()
    if (!prev || !this.level) return
    this.tipIndex = prev.tipIndex
    const conflicts = getConflicts(prev.board, this.level.regions)
    const tip = this.level.tips?.[this.tipIndex]
    this.setData({
      board: prev.board,
      conflictMap: toConflictMap(conflicts.cells),
      tipIndex: this.tipIndex,
      tipText: tip?.text ?? '',
      highlight: tip?.highlight ?? null,
      hasHint: false,
    })
  },

  onClear() {
    if (!this.level) return
    this.pushHistory()
    const board = createEmptyBoard(this.level.size)
    this.tipIndex = 0
    const tip = this.level.tips?.[0]
    this.setData({
      board,
      conflictMap: {},
      tipIndex: 0,
      tipText: tip?.text ?? '',
      highlight: tip?.highlight ?? null,
      hasHint: false,
    })
  },

  onHint() {
    if (!this.level || this.level.kind === 'tutorial') return
    const pos = getForcedHint(this.data.board as Board, this.level.regions)
    if (!pos) {
      wx.showToast({ title: '暂无强制格，再想想', icon: 'none' })
      return
    }
    this.setData({
      hasHint: true,
      highlight: pos,
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
    wx.showModal({
      title: '过关！',
      content: `${level.name} 完成了`,
      confirmText: '关卡列表',
      cancelText: '再看一眼',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/levels/levels' }) })
        }
      },
    })
  },
})
