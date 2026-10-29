import { OrbCanvas, resolveAgentState } from './orb-canvas.js?v=orbs-1'

const canvas = document.getElementById('orbCanvas')
if (canvas) {
  // 状态按钮只更新当前实例，不替换 canvas，也不重置共享动画时间轴。
  const orb = new OrbCanvas(canvas, { state: 'idle', size: 104 })
  const states = {
    idle: { label: '等待', description: 'idle 映射到 breathing：低速呼吸，作为等待状态。' },
    thinking: { label: '思考', description: 'thinking 映射到 composing：沿用现有组织与连续流动形态。' },
    searching: { label: '检索', description: 'searching 直接映射到引擎 searching 状态。' },
    generating: { label: '生成', description: 'generating 映射到 composing：沿用现有组织与连续流动形态。' },
    complete: { label: '完成', description: 'complete 映射到 breathing，并在进入时触发一次完成脉冲。' },
    listening: { label: '聆听', description: 'listening 是引擎已有状态，直接传入。' },
    connecting: { label: '连接', description: 'connecting 是引擎已有状态，直接传入。' },
    composing: { label: '播报', description: '播报复用 composing 引擎状态；项目没有独立 speaking 形态。' }
  }
  const stateLabel = document.getElementById('stateLabel')
  const engineState = document.getElementById('engineState')
  const stateDescription = document.getElementById('stateDescription')
  const caption = document.getElementById('orbCaption')
  const flowButton = document.getElementById('flowButton')
  const pauseButton = document.getElementById('pauseButton')
  const reduceMotion = document.getElementById('reduceMotion')
  const motionNote = document.getElementById('motionNote')
  const stateButtons = Array.from(document.querySelectorAll('[data-state]'))
  const sizeButtons = Array.from(document.querySelectorAll('[data-size]'))
  const flow = ['idle', 'thinking', 'searching', 'generating', 'complete']
  let currentState = 'idle'
  let flowTimer = 0
  let flowIndex = 0
  let flowDeadline = 0
  let flowRemaining = 0
  let flowPaused = false

  function setFlowButton(active) {
    flowButton.setAttribute('aria-pressed', String(active))
    flowButton.querySelector('span').textContent = active ? '停止流程' : '播放完整流程'
  }

  function stopFlow() {
    if (flowTimer) window.clearTimeout(flowTimer)
    flowTimer = 0
    flowIndex = 0
    flowDeadline = 0
    flowRemaining = 0
    flowPaused = false
    setFlowButton(false)
  }

  function scheduleFlow(delay = 1800) {
    if (flowPaused) return
    flowDeadline = performance.now() + delay
    flowTimer = window.setTimeout(nextFlowState, delay)
  }

  function selectState(state, fromFlow = false) {
    if (!states[state]) return
    if (!fromFlow) stopFlow()
    currentState = state
    orb.setState(state)
    const description = states[state]
    const resolved = resolveAgentState(state)
    stateLabel.textContent = description.label
    engineState.textContent = resolved.engineState
    stateDescription.textContent = description.description
    caption.textContent = description.label + '状态'
    canvas.setAttribute('aria-label', description.label + '状态粒子动画')
    stateButtons.forEach((button) => {
      const selected = button.dataset.state === state
      button.setAttribute('aria-pressed', String(selected))
    })
  }

  function nextFlowState() {
    if (flowIndex >= flow.length) {
      stopFlow()
      return
    }
    selectState(flow[flowIndex], true)
    flowIndex += 1
    scheduleFlow()
  }

  stateButtons.forEach((button) => {
    button.addEventListener('click', () => selectState(button.dataset.state))
  })
  sizeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const size = Number(button.dataset.size)
      orb.setSize(size)
      sizeButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)))
      canvas.setAttribute('aria-label', states[currentState].label + '状态粒子动画，' + size + '像素')
    })
  })

  flowButton.addEventListener('click', () => {
    if (flowTimer || flowPaused) {
      stopFlow()
      return
    }
    flowIndex = 0
    setFlowButton(true)
    nextFlowState()
  })

  pauseButton.addEventListener('click', () => {
    const paused = pauseButton.getAttribute('aria-pressed') !== 'true'
    orb.setPaused(paused)
    if (paused && flowTimer) {
      flowRemaining = Math.max(0, flowDeadline - performance.now())
      window.clearTimeout(flowTimer)
      flowTimer = 0
      flowPaused = true
    } else if (!paused && flowPaused) {
      flowPaused = false
      scheduleFlow(flowRemaining)
      flowRemaining = 0
    }
    pauseButton.setAttribute('aria-pressed', String(paused))
    pauseButton.textContent = paused ? '恢复动画' : '暂停动画'
  })

  reduceMotion.addEventListener('change', () => {
    orb.setReducedMotion(reduceMotion.checked)
    const systemReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    motionNote.textContent = reduceMotion.checked || systemReduced
      ? '减少动态效果已生效；状态变化显示静态代表帧。'
      : '系统减少动态偏好仍会自动生效；动画使用现有 Orb 过渡。'
  })

  selectState('idle', true)
  window.addEventListener('pagehide', () => {
    stopFlow()
    orb.destroy()
  }, { once: true })
}
