import { OrbCanvas, resolveAgentState } from './orb-canvas.js?v=orbs-1'

const canvas = document.getElementById('orbCanvas')
if (canvas) {
  // 状态按钮只更新当前实例，不替换 canvas，也不重置共享动画时间轴。
  const orb = new OrbCanvas(canvas, { state: 'waiting-void', size: 104 })
  const states = {
    'waiting-void': { label: '留白', description: '留白：由上游 breathing（ring）直接衍生——同样的环带、呼吸节奏与深度明暗，只把落在 Logo 轮廓里的点拿掉，孔壁外的点略微外推并提亮；空洞半径随呼吸在 0.020–0.030 之间胀缩。' },
    'waiting-logo': { label: '归位', description: '归位：等待时中间留空，约每 9.2 秒粒子聚成 Logo 轮廓——静候 4s → 归位 1.2s → 停留 2.2s → 散开 1.2s。成形走的是逐粒位移，不是淡入。' },
    'waiting-a': { label: '核光', description: '核光：中心密、边缘疏的点云，亮度与点径向外衰减，整体做 6% 的慢呼吸。最安静的一档。' },
    'waiting-b': { label: '尘环', description: '尘环：3/4 俯角的细管尘环，绕竖轴约 21 秒一圈，靠深度明暗区分前后。立体感最强。' },
    'waiting-c': { label: '双弧', description: '双弧：两个反向旋转的椭圆点弧，交点随时间移动，形成不断变化的透镜形。最几何。' },
    idle: { label: '等待', description: 'idle 映射到 breathing：沿用上游 ring 形态，作为对照。' },
    thinking: { label: '思考', description: 'thinking 映射到 composing：沿用现有组织与连续流动形态。' },
    searching: { label: '检索', description: 'searching 直接映射到引擎 searching 状态。' },
    generating: { label: '生成', description: 'generating 映射到 composing：沿用现有组织与连续流动形态。' },
    complete: { label: '完成', description: 'complete 映射到 breathing，并在进入时触发一次完成脉冲。' },
    listening: { label: '聆听', description: 'listening → wave：上游 Waving 横向波纹形态。' },
    connecting: { label: '连接', description: 'connecting → web：节点与连线形态。' },
    composing: { label: '播报', description: '播报复用 composing 引擎状态；项目没有独立 speaking 形态。' },
    working: { label: '轨道', description: 'working → orbits：上游原生形态，多轨道绕转，最接近"持续推理"。' },
    solving: { label: '立方', description: 'solving → rubik：上游原生形态，立方体面依次旋转。' },
    weaving: { label: '规划', description: 'weaving → braid：双股交错编织；官网的 Agent 演示把这一档显示为 planning。' },
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
    engineState.textContent = state.indexOf('waiting') === 0 ? state : resolved.engineState
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

  selectState('waiting-void', true)
  window.addEventListener('pagehide', () => {
    stopFlow()
    orb.destroy()
  }, { once: true })
}
