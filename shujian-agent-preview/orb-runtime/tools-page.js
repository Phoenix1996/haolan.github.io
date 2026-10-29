/* 工具预览页：把「工具图标」和「它绑定的粒子状态」放在一起看。
 *
 * 每个已绑定的工具都是一张卡片：粒子动画作底、图标压在中心，右边写清
 * 工具名 / 语义键 / 对应的引擎状态。点卡片把上面的大预览切过去，
 * 粒子走的是逐粒位移重组，不是淡入。
 */
import { OrbCanvas } from './orb-canvas.js?v=orbs-1'

const sets = window.TRACE_TOOL_SETS || {}
const labels = window.TRACE_TOOL_LABELS || {}
const orbMap = window.TRACE_TOOL_ORB || {}
const setIds = Object.keys(sets)

let activeSetId = window.TRACE_TOOL_ACTIVE || setIds[0]
try {
  const saved = window.localStorage.getItem('traceIconSet')
  if (saved && sets[saved]) activeSetId = saved
} catch (error) {
  /* 隐私模式或 file:// 下 localStorage 可能抛错，忽略 */
}

const icons = (sets[activeSetId] && sets[activeSetId].icons) || {}

const orbLabel = (state) =>
  typeof window.traceToolOrbLabel === 'function' ? window.traceToolOrbLabel(state) : state

/** 显示名与引擎名不一致时一并写出来（planning 实际跑的是 weaving），避免"哪个才是 weaving"这种歧义。 */
const orbText = (state) => {
  const label = orbLabel(state)
  return label === state ? state : label + ' · ' + state
}

function glyphNode(key) {
  if (typeof window.traceToolIconNode === 'function') {
    return window.traceToolIconNode(key, activeSetId)
  }
  return document.createTextNode('')
}

const heroCanvas = document.getElementById('heroOrb')
const heroIcon = document.getElementById('heroIcon')
const heroName = document.getElementById('heroName')
const heroKey = document.getElementById('heroKey')
const heroState = document.getElementById('heroState')
const boundGrid = document.getElementById('boundGrid')
const freeGrid = document.getElementById('freeGrid')

const boundKeys = Object.keys(orbMap).filter((key) => icons[key])
const freeKeys = Object.keys(icons).filter((key) => !orbMap[key])

const defaultKey = boundKeys.indexOf('model-think') !== -1 ? 'model-think' : boundKeys[0]
const hero = heroCanvas ? new OrbCanvas(heroCanvas, { state: orbMap[defaultKey] || 'working', size: 120 }) : null
const cards = new Map()

function selectTool(key) {
  if (hero) hero.setState(orbMap[key] || 'working')
  if (heroIcon) {
    heroIcon.textContent = ''
    heroIcon.appendChild(glyphNode(key))
  }
  if (heroName) heroName.textContent = labels[key] || key
  if (heroKey) heroKey.textContent = key
  if (heroState) heroState.textContent = orbText(orbMap[key] || 'working')
  cards.forEach((card, cardKey) => card.setAttribute('aria-pressed', String(cardKey === key)))
}

boundKeys.forEach((key) => {
  const card = document.createElement('button')
  card.type = 'button'
  card.className = 'tool-card'
  card.setAttribute('aria-pressed', 'false')

  const orbWrap = document.createElement('span')
  orbWrap.className = 'tool-orb'
  const canvas = document.createElement('canvas')
  canvas.width = 56
  canvas.height = 56
  canvas.setAttribute('aria-hidden', 'true')
  const glyph = document.createElement('span')
  glyph.className = 'tool-glyph'
  glyph.appendChild(glyphNode(key))
  orbWrap.appendChild(canvas)
  orbWrap.appendChild(glyph)

  const meta = document.createElement('span')
  meta.className = 'tool-name'
  meta.innerHTML =
    '<strong>' + (labels[key] || key) + '</strong>' +
    '<code>' + key + '</code>' +
    '<em>→ ' + orbText(orbMap[key] || '') + '</em>'

  card.appendChild(orbWrap)
  card.appendChild(meta)
  card.addEventListener('click', () => selectTool(key))
  boundGrid.appendChild(card)
  cards.set(key, card)

  // 每张卡片一颗独立的画布，各自跑自己的状态；离屏时由 OrbCanvas 自己停掉。
  new OrbCanvas(canvas, { state: orbMap[key] || 'working', size: 56 })
})

freeKeys.forEach((key) => {
  const chip = document.createElement('div')
  chip.className = 'icon-chip'
  const glyph = document.createElement('span')
  glyph.className = 'glyph'
  glyph.appendChild(glyphNode(key))
  const meta = document.createElement('span')
  meta.className = 'meta'
  meta.innerHTML = '<strong>' + (labels[key] || key) + '</strong><code>' + key + '</code>'
  chip.appendChild(glyph)
  chip.appendChild(meta)
  freeGrid.appendChild(chip)
})

selectTool(defaultKey)
