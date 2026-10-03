import { cellsOnPath } from '../../utils/gridPath'

/** 进入涂抹标 × 的按住时长（微信原生 longpress 为 350ms） */
const PAINT_HOLD_MS = 180

const MOTIFS = ['✿', '★', '♥', '❋', '☽', '☘', '❁', '≈', '❄', '♪', '◆', '✤']
const MOTIF_COUNT = MOTIFS.length

Component({
  properties: {
    size: { type: Number, value: 5 },
    regions: { type: Array, value: [] },
    board: { type: Array, value: [] },
    conflictMap: { type: Object, value: {} },
    highlight: { type: Object, value: {} },
    colors: { type: Array, value: [] },
    colorWeak: { type: Boolean, value: false },
  },

  data: {
    motifGlyphs: [] as string[][],
  },

  observers: {
    regions(regions: number[][]) {
      const rows = Array.isArray(regions) ? regions : []
      const motifGlyphs = rows.map((row) =>
        (row || []).map((id) => {
          const idx = ((Number(id) % MOTIF_COUNT) + MOTIF_COUNT) % MOTIF_COUNT
          return MOTIFS[idx]
        }),
      )
      this.setData({ motifGlyphs })
    },
  },

  lifetimes: {
    attached() {
      const self = this as any
      self.painting = false
      self.strokeStarted = false
      self.skipNextTap = false
      self.boardRect = null
      self.lastPaintKey = ''
      self.lastPaintR = -1
      self.lastPaintC = -1
      self.originR = -1
      self.originC = -1
      self.holdTimer = 0
      setTimeout(() => self.measureBoard(), 80)
    },
    detached() {
      this.clearHoldTimer()
    },
  },

  methods: {
    onCellTap(e: WechatMiniprogram.TouchEvent) {
      const self = this as any
      if (self.skipNextTap || self.painting) {
        self.skipNextTap = false
        return
      }
      const { r, c } = e.currentTarget.dataset as { r: string; c: string }
      const ri = Number(r)
      const ci = Number(c)
      const board = this.data.board as string[][]
      if (board?.[ri]?.[ci] === 'wrong') return
      this.triggerEvent('celltap', { r: ri, c: ci })
    },

    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      const { r, c } = e.currentTarget.dataset as { r: string; c: string }
      const ri = Number(r)
      const ci = Number(c)
      const board = this.data.board as string[][]
      if (board?.[ri]?.[ci] === 'wrong') return
      this.beginHold(ri, ci)
    },

    beginHold(r: number, c: number) {
      const self = this as any
      this.clearHoldTimer()
      self.holdTimer = setTimeout(() => {
        self.holdTimer = 0
        self.painting = true
        self.strokeStarted = false
        self.skipNextTap = true
        self.originR = r
        self.originC = c
        self.lastPaintR = r
        self.lastPaintC = c
        self.lastPaintKey = `${r}-${c}`
        self.measureBoard()
      }, PAINT_HOLD_MS)
    },

    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      const self = this as any
      if (!self.painting) return
      const touch = e.touches[0]
      if (!touch) return
      if (!self.boardRect) {
        self.measureBoard()
        return
      }
      const cell = self.hitTest(touch.clientX, touch.clientY) as
        | { r: number; c: number }
        | null
      if (!cell) return
      const key = `${cell.r}-${cell.c}`
      if (key === self.lastPaintKey) return
      if (!self.strokeStarted) {
        self.strokeStarted = true
        this.triggerEvent('paintstart', { r: self.originR, c: self.originC })
        this.triggerEvent('paintmark', { r: self.originR, c: self.originC })
        self.lastPaintR = self.originR
        self.lastPaintC = self.originC
        self.lastPaintKey = `${self.originR}-${self.originC}`
      }
      const fromR = Number(self.lastPaintR)
      const fromC = Number(self.lastPaintC)
      const path = cellsOnPath(fromR, fromC, cell.r, cell.c)
      for (const pos of path) {
        this.triggerEvent('paintmark', { r: pos.r, c: pos.c })
        self.lastPaintR = pos.r
        self.lastPaintC = pos.c
        self.lastPaintKey = `${pos.r}-${pos.c}`
      }
    },

    onTouchEnd() {
      this.clearHoldTimer()
      const self = this as any
      const shouldEndStroke = Boolean(self.painting && self.strokeStarted)
      self.painting = false
      self.strokeStarted = false
      self.lastPaintKey = ''
      self.lastPaintR = -1
      self.lastPaintC = -1
      self.originR = -1
      self.originC = -1
      if (shouldEndStroke) {
        this.triggerEvent('paintend', {})
      }
    },

    clearHoldTimer() {
      const self = this as any
      if (self.holdTimer) {
        clearTimeout(self.holdTimer)
        self.holdTimer = 0
      }
    },

    measureBoard() {
      const self = this as any
      this.createSelectorQuery()
        .select('.board')
        .boundingClientRect()
        .exec((res) => {
          self.boardRect = (res && res[0]) || null
        })
    },

    hitTest(clientX: number, clientY: number): { r: number; c: number } | null {
      const self = this as any
      const rect = self.boardRect as WechatMiniprogram.BoundingClientRectCallbackResult | null
      const size = this.data.size as number
      if (!rect || !size || rect.width <= 0 || rect.height <= 0) return null
      const x = clientX - rect.left
      const y = clientY - rect.top
      if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null
      const c = Math.min(size - 1, Math.floor((x / rect.width) * size))
      const r = Math.min(size - 1, Math.floor((y / rect.height) * size))
      return { r, c }
    },
  },
})
