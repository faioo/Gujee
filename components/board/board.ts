/* 棋盘：点按切换；长按拖动涂抹 × */
Component({
  properties: {
    size: { type: Number, value: 5 },
    regions: { type: Array, value: [] },
    board: { type: Array, value: [] },
    conflictMap: { type: Object, value: {} },
    highlight: { type: Object, value: {} },
    colors: { type: Array, value: [] },
  },

  lifetimes: {
    attached() {
      const self = this as any
      self.painting = false
      self.skipNextTap = false
      self.boardRect = null
      self.lastPaintKey = ''
      setTimeout(() => self.measureBoard(), 80)
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
      this.triggerEvent('celltap', { r: Number(r), c: Number(c) })
    },

    onLongPress(e: WechatMiniprogram.TouchEvent) {
      const self = this as any
      const { r, c } = e.currentTarget.dataset as { r: string; c: string }
      self.painting = true
      self.skipNextTap = true
      self.lastPaintKey = `${r}-${c}`
      self.measureBoard()
      this.triggerEvent('paintstart', { r: Number(r), c: Number(c) })
      this.triggerEvent('paintmark', { r: Number(r), c: Number(c) })
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
      self.lastPaintKey = key
      this.triggerEvent('paintmark', { r: cell.r, c: cell.c })
    },

    onTouchEnd() {
      const self = this as any
      if (!self.painting) return
      self.painting = false
      self.lastPaintKey = ''
      this.triggerEvent('paintend', {})
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
