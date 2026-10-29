/* 九种形态并排对照：一次性把引擎的全部状态渲染出来，方便和官网页面逐一对图。
   每个卡片自己一颗画布，互不影响；切换尺寸是重建实例（预设按尺寸分档）。 */
import { OrbCanvas } from './orb-canvas.js?v=orbs-1'

const STATES = [
  { id: 'working', zh: '工作 / 轨道', alias: '' },
  { id: 'searching', zh: '检索', alias: '' },
  { id: 'solving', zh: '求解 / 立方', alias: '' },
  { id: 'listening', zh: '聆听 / 波', alias: '' },
  { id: 'connecting', zh: '连接', alias: '官网演示写作 Solving' },
  { id: 'weaving', zh: '编织 / 规划', alias: '官网演示写作 Planning' },
  { id: 'composing', zh: '组织 / 播报', alias: '' },
  { id: 'breathing', zh: '呼吸 / 等待', alias: '官网演示写作 Thinking' }
]

const SIZES = [20, 32, 64, 104]

const grid = document.getElementById('compareGrid')
const sizeButtons = Array.from(document.querySelectorAll('[data-compare-size]'))
let currentSize = 64
let orbs = []

// 例：compare.html?wave=30 把 listening(wave) 的相机倾角从默认 21.8° 调到 30°，
// 用来对齐"官网看起来更斜"的观感；不传参数则与上游完全一致。
const params = new URLSearchParams(location.search)
const waveDeg = Number(params.get('wave'))
if (Number.isFinite(waveDeg) && waveDeg > 0 && waveDeg < 80) {
  window.PREVIEW_ORB_OPTS = { listening: { camTilt: (waveDeg * Math.PI) / 180 } }
}

function render() {
  orbs.forEach((orb) => orb.destroy())
  orbs = []
  grid.innerHTML = ''
  grid.style.setProperty('--compare-orb', currentSize + 'px')

  STATES.forEach((state) => {
    const card = document.createElement('div')
    card.className = 'compare-card' + (state.alias ? ' compare-card--alias' : '')

    const orbWrap = document.createElement('div')
    orbWrap.className = 'compare-orb'
    const canvas = document.createElement('canvas')
    canvas.width = currentSize
    canvas.height = currentSize
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('aria-label', state.zh + ' 粒子动画')
    orbWrap.appendChild(canvas)

    const meta = document.createElement('div')
    meta.className = 'compare-meta'
    meta.innerHTML =
      '<strong>' + state.zh + '</strong>' +
      '<code>' + state.id + '</code>' +
      (state.alias ? '<em>' + state.alias + '</em>' : '')

    card.appendChild(orbWrap)
    card.appendChild(meta)
    grid.appendChild(card)

    orbs.push(new OrbCanvas(canvas, { state: state.id, size: currentSize }))
  })
}

sizeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentSize = Number(button.dataset.compareSize)
    sizeButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)))
    render()
  })
})

render()

window.addEventListener('pagehide', () => {
  orbs.forEach((orb) => orb.destroy())
}, { once: true })
