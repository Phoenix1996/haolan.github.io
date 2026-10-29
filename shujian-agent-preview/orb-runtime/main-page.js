import { OrbCanvas } from './orb-canvas.js?v=orbs-1'

const welcome = document.getElementById('welcomeOrb')
const taskStatus = document.getElementById('taskStatusOrb')
const voiceCanvas = document.getElementById('voiceControlOrb')

const welcomeOrb = welcome ? new OrbCanvas(welcome, { state: 'idle', size: 64, pattern: 'logo' }) : null
if (taskStatus) new OrbCanvas(taskStatus, { state: 'complete', size: 20 })

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
