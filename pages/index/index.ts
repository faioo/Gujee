import { getLevels } from '../../data/levels'
import { isAutoMarkDeadCellsUnlocked } from '../../utils/features'
import {
  loadSettings,
  setAutoMarkDeadCells,
  setColorWeakMode,
} from '../../utils/settings'
import { createWxStorage } from '../../utils/storage'
import {
  getFirstTutorialId,
  resetTutorial,
  shouldForceTutorial,
} from '../../utils/tutorialFlow'

Page({
  data: {
    brand: '咕叽咕叽',
    brandEn: 'Goojee',
    autoMarkUnlocked: true,
    autoMarkDeadCells: false,
    colorWeakMode: false,
  },

  onShow() {
    const adapter = createWxStorage()
    if (shouldForceTutorial(adapter)) {
      const id = getFirstTutorialId(getLevels())
      if (id) {
        wx.redirectTo({ url: `/pages/game/game?id=${id}` })
        return
      }
    }
    this.refreshSettings()
  },

  refreshSettings() {
    const adapter = createWxStorage()
    const settings = loadSettings(adapter)
    this.setData({
      autoMarkUnlocked: isAutoMarkDeadCellsUnlocked(adapter),
      autoMarkDeadCells: settings.autoMarkDeadCells,
      colorWeakMode: settings.colorWeakMode,
    })
  },

  onAutoMarkChange(e: WechatMiniprogram.TouchEvent) {
    const adapter = createWxStorage()
    if (!isAutoMarkDeadCellsUnlocked(adapter)) return
    const enabled = Boolean((e.detail as { value?: boolean }).value)
    setAutoMarkDeadCells(adapter, enabled)
    this.setData({ autoMarkDeadCells: enabled })
  },

  onColorWeakChange(e: WechatMiniprogram.TouchEvent) {
    const enabled = Boolean((e.detail as { value?: boolean }).value)
    setColorWeakMode(createWxStorage(), enabled)
    this.setData({ colorWeakMode: enabled })
  },

  goLevels() {
    wx.navigateTo({ url: '/pages/levels/levels' })
  },

  replayTutorial() {
    const adapter = createWxStorage()
    resetTutorial(adapter)
    const id = getFirstTutorialId(getLevels())
    if (id) {
      wx.navigateTo({ url: `/pages/game/game?id=${id}` })
    }
  },
})
