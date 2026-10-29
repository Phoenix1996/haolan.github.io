import { OrbCanvas } from './orb-canvas.js?v=orbs-1'

const welcome = document.getElementById('welcomeOrb')
const taskStatus = document.getElementById('taskStatusOrb')
const voiceCanvas = document.getElementById('voiceControlOrb')

const welcomeOrb = welcome ? new OrbCanvas(welcome, { state: 'idle', size: 64, pattern: 'logo' }) : null
const taskOrb = taskStatus ? new OrbCanvas(taskStatus, { state: 'complete', size: 24 }) : null

// 状态条里还有一颗 20px 的粒子，和标题栏那颗同一状态、同一时刻切换。
const stripCanvas = document.getElementById('runStripOrb')
const stripOrb = stripCanvas ? new OrbCanvas(stripCanvas, { state: 'complete', size: 40 }) : null

function setState(state) {
  if (!state) return
  if (taskOrb) taskOrb.setState(state)
  if (stripOrb) stripOrb.setState(state)
}

// 轨迹/发送动作会广播 preview:tool；这里按工具 → 粒子状态的映射切 orb。
// 两者解耦：轨迹面板不直接引用画布，画布也不认识工具。
document.addEventListener('preview:tool', (event) => {
  const tool = event.detail && event.detail.tool
  if (tool && typeof window.traceToolOrb === 'function') setState(window.traceToolOrb(tool))
})

// 兼容旧事件（对比页、工具页仍直接指定状态名）。
document.addEventListener('preview:orb-state', (event) => {
  setState(event.detail && event.detail.state)
})

if (voiceCanvas) {
  const voiceOrb = new OrbCanvas(voiceCanvas, { state: 'idle', size: 20 })
  const toggle = document.querySelector('[data-voice-orb-toggle]')
  if (toggle) {
    toggle.setAttribute('aria-pressed', 'false')
    toggle.setAttribute('aria-label', '连续语音预览')
    toggle.title = '连续语音预览；不会采集音频'
    toggle.addEventListener('click', function () {
      const active = this.getAttribute('aria-pressed') !== 'true'
      this.setAttribute('aria-pressed', String(active))
      this.setAttribute('aria-label', active ? '停止连续语音预览' : '连续语音预览')
      this.title = active ? '停止连续语音预览；不会采集音频' : '连续语音预览；不会采集音频'
      this.classList.toggle('is-orb-active', active)
      voiceOrb.setState(active ? 'listening' : 'idle')
    })
  }
}

if (welcomeOrb) {
  // 欢迎区初始隐藏；切换视图后复核几何，确保同一实例在显示时恢复动画。
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => window.requestAnimationFrame(() => welcomeOrb.refreshVisibility()))
  })
}
