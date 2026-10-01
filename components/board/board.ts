Component({
  properties: {
    size: { type: Number, value: 5 },
    regions: { type: Array, value: [] },
    board: { type: Array, value: [] },
    conflictMap: { type: Object, value: {} },
    highlight: { type: Object, value: {} },
    colors: { type: Array, value: [] },
  },
  methods: {
    onCellTap(e: WechatMiniprogram.TouchEvent) {
      const { r, c } = e.currentTarget.dataset as { r: string; c: string }
      this.triggerEvent('celltap', { r: Number(r), c: Number(c) })
    },
  },
})
