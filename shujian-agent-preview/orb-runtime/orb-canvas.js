/* 外置预览适配器：直接调用项目内置的粒子引擎、状态解析、Logo 点阵与淡入曲线。 */
import { MODE_FRAMES, paintFrame, resolvePreset } from './index.js'
import { resolveAgentState, COMPLETE_PULSE_MS } from './agent-states.js'
import { shouldStartFade } from './orb-fade.js'
import { blendFrames, morphProgress } from './orb-morph.js'
import { WAITING_FRAMES, isWaitingState, WAITING_SPEED } from './waiting.js'
import { logoDotFrame, introTransition, INTRO_MS } from './orb-patterns.js'
import { BRAND_HIGHLIGHT, completionPulse, hexToRgb, ORB_BRAND_COLOR } from './palette.js'

function cappedDpr() {
  return Math.min(2, window.devicePixelRatio || 1)
}

/** 引擎预设按 20 / 32 / 64 三档调参（官网 Playground 也是这三个尺寸），按实际尺寸就近取档。 */
function presetForSize(size) {
  if (size <= 24) return 20
  if (size <= 40) return 32
  return 64
}

/**
 * 用一张 Canvas 保持 ShujianOrb 的共享时钟和状态交叉淡入。
 * 状态切换只更新当前帧函数，不替换 Canvas 或重建播放器。
 */
export class OrbCanvas {
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.ctx = canvas && canvas.getContext('2d')
    this.size = Number(options.size) || 64
    this.presetSize = presetForSize(this.size)
    this.pattern = options.pattern || ''
    this.introFromLogo = options.introFrom === 'logo'
    this.tint = hexToRgb(options.color || ORB_BRAND_COLOR)
    this.highlightTint = hexToRgb(BRAND_HIGHLIGHT)
    this.state = ''
    this.frameConfig = null
    this.previousFrame = null
    this.morphStartedAt = 0
    this.lastBlended = null
    this.completePulseStartedAt = 0
    this.paused = Boolean(options.paused)
    this.manualReducedMotion = Boolean(options.reducedMotion)
    this.systemReducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
    this.reducedMotion = this.manualReducedMotion || Boolean(this.systemReducedMotion && this.systemReducedMotion.matches)
    this.introStartedAt = this.introFromLogo && !this.reducedMotion && !this.paused ? performance.now() : 0
    this.introProgress = this.introStartedAt ? 0 : 1
    this.rafId = 0
    this.running = false
    this.visible = true
    this.destroyed = false
    this.lastTime = 0
    this.onMotionPreference = () => {
      this.reducedMotion = this.manualReducedMotion || Boolean(this.systemReducedMotion && this.systemReducedMotion.matches)
      if (this.reducedMotion) {
        this.stop()
        this.previousFrame = null
        this.morphStartedAt = 0
        this.lastBlended = null
        this.introStartedAt = 0
        this.introProgress = 1
        this.draw(performance.now(), 1)
      } else {
        this.draw(performance.now(), 1)
        this.start()
      }
    }
    if (this.systemReducedMotion) {
      if (this.systemReducedMotion.addEventListener) this.systemReducedMotion.addEventListener('change', this.onMotionPreference)
      else if (this.systemReducedMotion.addListener) this.systemReducedMotion.addListener(this.onMotionPreference)
    }
    this.onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') this.stop()
      else this.refreshVisibility()
    }
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    if (typeof IntersectionObserver !== 'undefined') {
      this.visibilityObserver = new IntersectionObserver((entries) => {
        const entry = entries[0]
        this.visible = Boolean(entry && entry.isIntersecting)
        if (this.visible) this.start()
        else this.stop()
      })
      this.visibilityObserver.observe(canvas)
    }
    this.setSize(this.size)
    this.setState(options.state || 'idle', true)
  }

  makeFrameConfig(rawState) {
    // 待命族是预览侧自绘形态（上游 9 个 mode 里没有等待态），因此不走
    // resolvePreset；logo 图案优先级更高，在这里之前已经分流。
    if (this.pattern !== 'logo' && isWaitingState(rawState)) {
      const key = String(rawState).trim().toLowerCase()
      return {
        engineState: key,
        pulse: false,
        frameFn: WAITING_FRAMES[key],
        opts: {},
        speed: WAITING_SPEED,
        tint: this.tint
      }
    }
    const resolved = resolveAgentState(rawState)
    const preset = resolvePreset(resolved.engineState, this.presetSize)
    const frameFn = this.pattern === 'logo' ? logoDotFrame : MODE_FRAMES[preset.mode]
    // 预览侧临时覆写（例如 compare.html?wave=30 把 wave 的相机倾角调到 30°）。
    const previewOpts = (window.PREVIEW_ORB_OPTS && window.PREVIEW_ORB_OPTS[resolved.engineState]) || null
    const opts = this.pattern
      ? {}
      : { ...preset.opts, ...(resolved.opts || {}), ...(previewOpts || {}) }
    const stateSpeed = resolved.speed == null ? 1 : resolved.speed
    const speed = (this.pattern ? 1 : preset.speed) * stateSpeed
    return { engineState: resolved.engineState, pulse: resolved.pulse, frameFn, opts, speed, tint: this.tint }
  }

  setState(nextState, initial = false) {
    if (this.destroyed) return
    const next = String(nextState || 'composing')
    if (!initial && next === this.state) return
    const resolved = resolveAgentState(next)
    // 过渡进行中又被要求切换时，用**画面上的当前混合态**当起点：
    // 否则粒子会从上一个形态的目标位置重新起步，连发的状态事件看上去就是跳帧。
    const snapshot = this.previousFrame && this.lastBlended
      ? { frozen: this.lastBlended }
      : (this.frameConfig
        ? {
            frameFn: this.frameConfig.frameFn,
            opts: { ...this.frameConfig.opts },
            tint: this.frameConfig.tint,
            speed: this.frameConfig.speed
          }
        : null)
    this.previousFrame = shouldStartFade({
      reduced: this.reducedMotion,
      paused: this.paused,
      hasSnapshot: Boolean(snapshot)
    }) ? snapshot : null
    this.morphStartedAt = this.previousFrame ? performance.now() : 0
    this.lastBlended = null
    if (resolved.pulse && this.state !== 'complete') this.completePulseStartedAt = performance.now()
    else if (!resolved.pulse) this.completePulseStartedAt = 0
    this.state = next
    this.frameConfig = this.makeFrameConfig(next)
    this.draw(performance.now(), this.previousFrame ? 0 : 1)
    if (this.reducedMotion || this.paused) this.stop()
    else this.start()
  }

  setSize(nextSize) {
    const size = Number(nextSize)
    if (!Number.isFinite(size) || size <= 0 || this.destroyed) return
    this.size = size
    this.presetSize = presetForSize(size)
    const dpr = cappedDpr()
    this.canvas.width = Math.round(size * dpr)
    this.canvas.height = Math.round(size * dpr)
    this.canvas.style.width = size + 'px'
    this.canvas.style.height = size + 'px'
    this.previousFrame = null
    this.morphStartedAt = 0
    this.lastBlended = null
    if (this.state) this.frameConfig = this.makeFrameConfig(this.state)
    this.draw(performance.now(), 1)
    if (!this.reducedMotion && !this.paused) this.start()
  }

  setPaused(paused) {
    this.paused = Boolean(paused)
    if (this.paused) {
      this.stop()
      this.previousFrame = null
      this.morphStartedAt = 0
      this.lastBlended = null
      this.draw(performance.now(), 1)
    } else if (!this.reducedMotion) {
      this.draw(performance.now(), 1)
      this.start()
    }
  }

  setReducedMotion(reduced) {
    this.manualReducedMotion = Boolean(reduced)
    this.reducedMotion = this.manualReducedMotion || Boolean(this.systemReducedMotion && this.systemReducedMotion.matches)
    if (this.reducedMotion) {
      this.stop()
      this.previousFrame = null
      this.morphStartedAt = 0
      this.lastBlended = null
      this.introStartedAt = 0
      this.introProgress = 1
      this.draw(performance.now(), 1)
    } else if (!this.paused) {
      this.draw(performance.now(), 1)
      this.start()
    }
  }

  refreshVisibility() {
    if (this.destroyed || !this.canvas) return
    const rect = this.canvas.getBoundingClientRect()
    this.visible = this.canvas.offsetParent !== null && rect.width > 0 && rect.height > 0
    if (this.visible) this.start()
    else this.stop()
  }

  draw(nowMs, morphOverride) {
    if (!this.ctx || !this.frameConfig) return
    const size = this.size
    const dpr = cappedDpr()
    const ctx = this.ctx
    const tSec = (nowMs / 1000) * this.frameConfig.speed
    const raw = morphOverride == null
      ? (this.morphStartedAt ? morphProgress(nowMs - this.morphStartedAt) : 1)
      : morphOverride
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    const half = size / 2
    ctx.save()
    if (this.introFromLogo && this.introProgress < 1) {
      const { logoAlpha, logoScatter, orbAlpha, orbScale } = introTransition(this.introProgress)
      if (logoAlpha > 0.01) {
        ctx.globalAlpha = logoAlpha
        paintFrame(ctx, logoDotFrame(size, tSec, { scatter: logoScatter }), false, this.frameConfig.tint)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      if (orbAlpha > 0.01) {
        ctx.globalAlpha = orbAlpha
        ctx.translate(half, half)
        ctx.scale(orbScale, orbScale)
        ctx.translate(-half, -half)
        paintFrame(ctx, this.frameConfig.frameFn(size, tSec, this.frameConfig.opts), false, this.frameConfig.tint)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      ctx.globalAlpha = 1
      ctx.restore()
      return
    }
    if (this.previousFrame) {
      // 同一帧里采样新旧两个形态，逐粒插值出中间态：粒子走的是连续路径，
      // 不再靠透明度把两团点溶解在一起。
      const oldFrame = this.sampleFrame(this.previousFrame, size, nowMs)
      const blended = blendFrames(
        oldFrame,
        this.frameConfig.frameFn(size, tSec, this.frameConfig.opts),
        raw,
        half,
        half
      )
      // 记住这一刻的混合结果：过渡中途再来一次切换时，它直接成为新的起点。
      this.lastBlended = blended
      paintFrame(ctx, blended, false, this.frameConfig.tint)
      if (raw >= 1) {
        this.morphStartedAt = 0
        this.previousFrame = null
        this.lastBlended = null
      }
    } else {
      paintFrame(ctx, this.frameConfig.frameFn(size, tSec, this.frameConfig.opts), false, this.frameConfig.tint)
    }
    ctx.restore()
    if (this.frameConfig.pulse && this.completePulseStartedAt) {
      const pulse = completionPulse((nowMs - this.completePulseStartedAt) / COMPLETE_PULSE_MS)
      if (pulse > 0) {
        const radius = half * (0.55 + 0.45 * (1 - pulse))
        const glow = ctx.createRadialGradient(half, half, 0, half, half, radius)
        const { r, g, b } = this.highlightTint
        glow.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + (0.5 * pulse) + ')')
        glow.addColorStop(1, 'rgba(216,245,255,0)')
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(half, half, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
  }

  /**
   * 取过渡「起点」那一边的形态。
   *
   * <p>两种来源：过渡被中途打断时是**冻结的混合结果**（`frozen`，已经是坐标数组），
   * 其余情况是上一次的形态函数——它仍按自己的速度在走，因此过渡期间两个形态
   * 都在动，读起来是「活的粒子在重排」，而不是两帧定格图在互相溶解。</p>
   */
  sampleFrame(snapshot, size, nowMs) {
    if (snapshot.frozen) return snapshot.frozen
    const speed = snapshot.speed == null ? 1 : snapshot.speed
    return snapshot.frameFn(size, (nowMs / 1000) * speed, snapshot.opts)
  }

  start() {
    if (this.running || this.destroyed || this.paused || this.reducedMotion || document.visibilityState === 'hidden') return
    if (this.canvas.offsetParent === null) return
    if (!this.visible || this.running) return
    this.running = true
    const loop = (now) => {
      if (!this.running || this.destroyed) return
      this.lastTime = now
      if (this.introStartedAt) {
        this.introProgress = Math.min(1, (now - this.introStartedAt) / INTRO_MS)
        if (this.introProgress >= 1) this.introStartedAt = 0
      }
      this.draw(now)
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.rafId = 0
  }

  destroy() {
    this.stop()
    this.destroyed = true
    if (this.visibilityObserver) this.visibilityObserver.disconnect()
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    if (this.systemReducedMotion) {
      if (this.systemReducedMotion.removeEventListener) this.systemReducedMotion.removeEventListener('change', this.onMotionPreference)
      else if (this.systemReducedMotion.removeListener) this.systemReducedMotion.removeListener(this.onMotionPreference)
    }
  }
}

export { resolveAgentState }
