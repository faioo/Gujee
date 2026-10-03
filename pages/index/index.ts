import { getLevels } from '../../data/levels'
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
