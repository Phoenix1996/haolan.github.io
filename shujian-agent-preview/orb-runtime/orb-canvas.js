/* 外置预览适配器：直接调用项目内置的粒子引擎、状态解析、Logo 点阵与淡入曲线。 */
import { MODE_FRAMES, paintFrame, resolvePreset } from './index.js'
import { resolveAgentState, COMPLETE_PULSE_MS } from './agent-states.js'
import {
  STATE_FADE_MS,
  fadeProgress,
  shouldStartFade,
  shouldCrossFade,
  fadeOutScale,
  fadeInScale
} from './orb-fade.js'
import { logoDotFrame, introTransition, INTRO_MS } from './orb-patterns.js'
import { BRAND_HIGHLIGHT, completionPulse, hexToRgb, ORB_BRAND_COLOR } from './palette.js'

function cappedDpr() {
  return Math.min(2, window.devicePixelRatio || 1)
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
    this.presetSize = this.size <= 24 ? 20 : 64
    this.pattern = options.pattern || ''
    this.introFromLogo = options.introFrom === 'logo'
    this.tint = hexToRgb(options.color || ORB_BRAND_COLOR)
    this.highlightTint = hexToRgb(BRAND_HIGHLIGHT)
    this.state = ''
    this.frameConfig = null
    this.previousFrame = null
    this.fadeStartedAt = 0
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
        this.fadeStartedAt = 0
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
    const resolved = resolveAgentState(rawState)
    const preset = resolvePreset(resolved.engineState, this.presetSize)
    const frameFn = this.pattern === 'logo' ? logoDotFrame : MODE_FRAMES[preset.mode]
    const opts = this.pattern
      ? {}
      : { ...preset.opts, ...(resolved.opts || {}) }
    const stateSpeed = resolved.speed == null ? 1 : resolved.speed
    const speed = (this.pattern ? 1 : preset.speed) * stateSpeed
    return { engineState: resolved.engineState, pulse: resolved.pulse, frameFn, opts, speed, tint: this.tint }
  }

  setState(nextState, initial = false) {
    if (this.destroyed) return
    const next = String(nextState || 'composing')
    if (!initial && next === this.state) return
    const resolved = resolveAgentState(next)
    const snapshot = this.frameConfig
      ? { frameFn: this.frameConfig.frameFn, opts: { ...this.frameConfig.opts }, tint: this.frameConfig.tint }
      : null
    this.previousFrame = shouldStartFade({
      reduced: this.reducedMotion,
      paused: this.paused,
      hasSnapshot: Boolean(snapshot)
    }) ? snapshot : null
    this.fadeStartedAt = this.previousFrame ? performance.now() : 0
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
    this.presetSize = size <= 24 ? 20 : 64
    const dpr = cappedDpr()
    this.canvas.width = Math.round(size * dpr)
    this.canvas.height = Math.round(size * dpr)
    this.canvas.style.width = size + 'px'
    this.canvas.style.height = size + 'px'
    this.previousFrame = null
    this.fadeStartedAt = 0
    if (this.state) this.frameConfig = this.makeFrameConfig(this.state)
    this.draw(performance.now(), 1)
    if (!this.reducedMotion && !this.paused) this.start()
  }

  setPaused(paused) {
    this.paused = Boolean(paused)
    if (this.paused) {
      this.stop()
      this.previousFrame = null
      this.fadeStartedAt = 0
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
      this.fadeStartedAt = 0
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

  draw(nowMs, fadeOverride) {
    if (!this.ctx || !this.frameConfig) return
    const size = this.size
    const dpr = cappedDpr()
    const ctx = this.ctx
    const tSec = (nowMs / 1000) * this.frameConfig.speed
    const fade = fadeOverride == null
      ? (this.fadeStartedAt ? fadeProgress(nowMs - this.fadeStartedAt, STATE_FADE_MS) : 1)
      : fadeOverride
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
    if (shouldCrossFade(this.previousFrame, fade)) {
      ctx.globalAlpha = 1 - fade
      ctx.translate(half, half)
      ctx.scale(fadeOutScale(fade), fadeOutScale(fade))
      ctx.translate(-half, -half)
      paintFrame(ctx, this.previousFrame.frameFn(size, tSec, this.previousFrame.opts), false, this.previousFrame.tint)
      ctx.restore()
      ctx.save()
      ctx.globalAlpha = fade
      ctx.translate(half, half)
      ctx.scale(fadeInScale(fade), fadeInScale(fade))
      ctx.translate(-half, -half)
      paintFrame(ctx, this.frameConfig.frameFn(size, tSec, this.frameConfig.opts), false, this.frameConfig.tint)
    } else {
      paintFrame(ctx, this.frameConfig.frameFn(size, tSec, this.frameConfig.opts), false, this.frameConfig.tint)
    }
    ctx.restore()
    if (this.fadeStartedAt && fade >= 1) {
      this.fadeStartedAt = 0
      this.previousFrame = null
    }
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
