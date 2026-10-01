import { getLevels } from '../../data/levels'
import { createWxStorage, loadProgress } from '../../utils/storage'
import { getNormalLevels, getTutorialLevels } from '../../utils/tutorialFlow'
import type { Level } from '../../utils/types'

interface LevelItem {
  id: string
  name: string
  size: number
  difficulty: number
  difficultyLabel: string
  done: boolean
}

function toItem(level: Level, doneSet: Set<string>): LevelItem {
  const labels = ['教学', '入门', '进阶', '挑战']
  return {
    id: level.id,
    name: level.name,
    size: level.size,
    difficulty: level.difficulty,
    difficultyLabel: labels[level.difficulty] ?? '',
    done: doneSet.has(level.id),
  }
}

Page({
  data: {
    tutorials: [] as LevelItem[],
    normals: [] as LevelItem[],
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const levels = getLevels()
    const progress = loadProgress(createWxStorage())
    const done = new Set(progress.completedIds)
    this.setData({
      tutorials: getTutorialLevels(levels).map((l) => toItem(l, done)),
      normals: getNormalLevels(levels).map((l) => toItem(l, done)),
    })
  },

  openLevel(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.navigateTo({ url: `/pages/game/game?id=${id}` })
  },
})
