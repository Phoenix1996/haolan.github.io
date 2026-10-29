/**
 * 数鉴智能体的「待命」候选形态——预览侧自绘，不属于上游 thinking-orbs
 * （上游 9 个 mode 里没有等待态，idle 目前借用 `ring`）。
 *
 * <p><b>为什么另画。</b>借来的 `ring` 是一圈带瓦楞的环带整体匀速起伏：像"某个东西
 * 在转"，读不出"系统在位、还在等数据"。等待态要的是**安静的仪表，不是运转的机器**。</p>
 *
 * <p>这里给三个方向，共用同一套约束：60 秒内不出现重复节奏感、20px 下必须还是一个
 * 完整字形、全部确定性（同一时刻同一帧，绝不能用 Math.random）、只用点。</p>
 *
 * <ol>
 *   <li><b>核光 / core</b>：中心密、边缘疏的点云，亮度与大小向外衰减，整体做 6% 的慢呼吸。
 *       读作"一颗在呼吸的光核"，没有任何机构感。</li>
 *   <li><b>尘环 / torus</b>：3/4 俯角的细管尘环，绕竖轴慢转（约 21 秒一圈），
 *       靠深度明暗区分前后。信息量最大，立体感最强。</li>
 *   <li><b>双弧 / duo</b>：两个反向旋转的椭圆点弧，交点随时间移动，形成不断变化的透镜形。
 *       最几何、最"工具感"。</li>
 * </ol>
 */
import { finalizeFrame, hashD, makeProj } from './engine/core.js'
import { frameRibbon } from './engine/ribbon.js'
import { resolvePreset } from './presets.js'
import { logoDotFrame, logoDotPoints } from './orb-patterns.js'
import { blendFrames } from './orb-morph.js'

const TAU = Math.PI * 2

/** 三个形态共用的速度倍率（`frameConfig.speed` 会再乘一次，业务侧仍可整体调速）。 */
export const WAITING_SPEED = 1

/** 小尺寸下点半径要相对更大，否则整组会糊成一层灰。20px 的内联场合按引擎
 *  自身 20px 预设的做法（约 1.7 倍放大）补偿，否则单点不足 1px、几乎看不见。 */
function dotBase(size, scale) {
  const boost = size <= 24 ? 1.7 : 1
  return Math.max(0.75, scale * boost * Math.sqrt(size / 300))
}

/* ------------------------------------------------------------------ 核光 core */

export function frameWaitCore(size, t) {
  const cx = size / 2
  const cy = size / 2
  const R = (size / 2) * 0.56
  const count = size <= 24 ? 16 : 56
  const baseR = dotBase(size, 2.9)
  const breath = 1 + 0.06 * Math.sin(t * 1.05)

  const dots = []
  for (let i = 0; i < count; i++) {
    const h1 = hashD(i * 1.7 + 0.3, 2.4)
    const h2 = hashD(i * 2.9 + 7.1, 5.7)
    const radius = Math.sqrt(h1) * R * breath
    // 每颗粒子按自己的相位轻微漂移，避免整团像一张被缩放的静态图
    const angle = i * 2.39996 + (h2 - 0.5) * 0.5 * Math.sin(t * 0.7 + h1 * TAU)
    const falloff = Math.min(1, Math.max(0, 1 - radius / (R * 1.12)))
    dots.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      z: 0,
      r: baseR * (0.45 + 0.75 * falloff),
      white: 0.3 + 0.52 * falloff,
      a: 0.32 + 0.62 * falloff
    })
  }
  return finalizeFrame(dots, [], 0.3)
}

/* ----------------------------------------------------------------- 尘环 torus */

export function frameWaitTorus(size, t) {
  const cx = size / 2
  const cy = size / 2
  const R = (size / 2) * 0.58
  const tube = R * 0.24
  const count = size <= 24 ? 30 : 112
  const baseR = dotBase(size, 2.1)
  const yaw = t * 0.3
  const tilt = 0.62 + 0.05 * Math.sin(t * 0.5)
  const project = makeProj(yaw, tilt, cx, cy, 1)
  const breath = 1 + 0.022 * Math.sin(t * 0.9)

  const dots = []
  for (let i = 0; i < count; i++) {
    // 三圈错开采样，让点在管面上分布均匀而不是排成一条螺旋线
    const u = (i / count) * TAU * 3 + hashD(i, 1.3) * 0.28
    const v = i * 2.39996 + hashD(i, 9.7) * 0.5
    const major = (R + Math.cos(v) * tube) * breath
    const minor = Math.sin(v) * tube * 0.55
    const [px, py, z] = project(Math.cos(u) * major, minor, Math.sin(u) * major)
    const depth = Math.min(1, Math.max(0, (z / (R * 1.25) + 1) / 2))
    dots.push({
      x: px,
      y: py,
      z,
      r: baseR * (0.62 + 0.85 * depth),
      white: 0.26 + 0.56 * depth,
      a: 0.3 + 0.62 * depth
    })
  }
  return finalizeFrame(dots, [], 0.3)
}

/* ------------------------------------------------------------ 留白 waiting-void */

/**
 * 「留白」：**直接从上游 breathing（ring）衍生**，不是另画一套点阵。
 *
 * <p>取 `resolvePreset('breathing', 档位)` 的原始参数跑一遍 `frameRibbon`（ring 与 ribbon
 * 共用同一份几何，`faceOn` 开关决定它是环带还是缎带），拿到和 breathing 完全一致的
 * 环带、深度明暗与起伏；然后只做一件事：**把落在 Logo 轮廓里的点拿掉**，
 * 并把紧贴孔壁的点往外推一点、提亮一档。</p>
 *
 * <p>因此它和 breathing 是同一族：同样的带子、同样的呼吸节奏、同样的深度；差别只有
 * 中间那道形状——空洞随呼吸在 0.020–0.030 之间缓慢胀缩，最紧的几帧轮廓最清楚。</p>
 */
const VOID_GRID = 64
let voidFieldCache = null

/** 归一化（0..1）坐标下，每个格子到 Logo 轮廓的最近距离。一次算好，永久复用。 */
function voidField() {
  if (voidFieldCache) return voidFieldCache
  const n = VOID_GRID
  const points = logoDotPoints(1024, false)
  const field = new Float32Array(n * n)
  for (let gy = 0; gy < n; gy++) {
    const y = (gy + 0.5) / n
    for (let gx = 0; gx < n; gx++) {
      const x = (gx + 0.5) / n
      let best = 1
      for (let k = 0; k < points.length; k++) {
        const dx = points[k][0] - x
        const dy = points[k][1] - y
        const d = dx * dx + dy * dy
        if (d < best) best = d
      }
      field[gy * n + gx] = Math.sqrt(best)
    }
  }
  voidFieldCache = field
  return field
}

/** 与 orb-canvas 一致的三档预设选择，保证衍生出来的环带和 breathing 用的是同一套参数。 */
function presetKeyForSize(size) {
  if (size <= 24) return 20
  if (size <= 40) return 32
  return 64
}

export function frameWaitVoid(size, t) {
  const preset = resolvePreset('breathing', presetKeyForSize(size))
  const source = frameRibbon(size, t * preset.speed, preset.opts)
  const field = voidField()
  const n = VOID_GRID
  const outline = logoDotPoints(1024, false)
  const hole = 0.025 + 0.005 * Math.sin(t * 0.62)
  const holeSq = hole * hole
  const rMin = preset.opts.rMin == null ? 0.3 : preset.opts.rMin

  const dots = []
  for (let i = 0; i < source.dots.length; i++) {
    const dot = source.dots[i]
    const nx = dot.x / size
    const ny = dot.y / size
    const gx = Math.min(n - 1, Math.max(0, Math.floor(nx * n)))
    const gy = Math.min(n - 1, Math.max(0, Math.floor(ny * n)))
    const coarse = field[gy * n + gx]
    if (coarse > hole + 0.05) {
      dots.push(dot) // 离得远，原样保留
      continue
    }
    // 孔壁附近：精确算到最近轮廓点，既能判空，也能得到"往外推"的方向
    let best = Infinity
    let bestX = 0
    let bestY = 0
    for (let k = 0; k < outline.length; k++) {
      const ox = outline[k][0] - nx
      const oy = outline[k][1] - ny
      const d2 = ox * ox + oy * oy
      if (d2 < best) {
        best = d2
        bestX = outline[k][0]
        bestY = outline[k][1]
      }
    }
    if (best < holeSq) continue // 落在 Logo 里 → 挖空
    const distance = Math.sqrt(best)
    const push = Math.min(1, (hole + 0.024 - distance) / 0.024) * 0.02
    let vx = nx - bestX
    let vy = ny - bestY
    const len = Math.sqrt(vx * vx + vy * vy) || 1
    vx /= len
    vy /= len
    const edge = Math.min(1, (distance - hole) / 0.03)
    dots.push({
      x: (nx + vx * push) * size,
      y: (ny + vy * push) * size,
      z: dot.z,
      r: dot.r * (1 + 0.22 * (1 - edge)),
      white: Math.min(1, dot.white + 0.18 * (1 - edge)),
      a: dot.a == null ? 1 : dot.a
    })
  }
  return finalizeFrame(dots, [], rMin)
}

/* ------------------------------------------------------------ 归位 waiting-logo */

/**
 * 「归位」：等待时中间留空，隔一会儿粒子自己聚成 Logo 轮廓，停住，再散开。
 *
 * <p>为什么这样能安住人：中间那块空白不是"没画东西"，而是一个**会兑现的承诺**——
 * 用户盯着它的时候，每 9 秒左右能看到一次"聚拢成形"的完成感，等待因此有了节奏，
 * 而不是无穷无尽的呼吸。同理也不做成一直在变的形态：成形后要**停住两秒多**，
 * 让人看清那是 Logo，而不是一团正在乱动的点。</p>
 *
 * <p>时间轴（秒，循环 9.2s）：</p>
 * <pre>
 *   0.0–4.0  静候：只有一圈稀疏的点贴着边缘，中间空
 *   4.0–5.2  归位：粒子从环上向中间汇聚，逐渐成为 Logo 点阵
 *   5.2–7.4  停留：Logo 呼吸（±3%），保持可辨认
 *   7.4–8.6  散开：退回外环
 *   8.6–9.2  静候
 * </pre>
 *
 * <p>成形用的是与状态切换同一套 `blendFrames`：按角度秩配对后逐粒位移，
 * 因此读起来是"外圈那些点走过去拼成了 Logo"，不是两张图互相淡入。</p>
 */
const CYCLE = 9.2
const FORM_AT = 4.0
const FORM_MS = 1.2
const HOLD_END = 7.4
const BACK_END = 8.6

function smoothstep(x) {
  const v = Math.min(1, Math.max(0, x))
  return v * v * (3 - 2 * v)
}

/** 静候态：一圈稀疏的点，中间刻意留空。 */
function ringFrame(size, t) {
  const cx = size / 2
  const cy = size / 2
  const R = (size / 2) * 0.84
  const count = size <= 24 ? 8 : 18
  const baseR = Math.max(0.85, 2.6 * Math.sqrt(size / 300))
  const breath = 1 + 0.03 * Math.sin(t * 1.05)
  const dots = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    const radius = R * breath
    const depthWave = 0.5 + 0.5 * Math.sin(angle * 2 + t * 0.9)
    dots.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      z: 0,
      r: baseR * (0.65 + 0.45 * depthWave),
      white: 0.34 + 0.3 * depthWave,
      a: 0.4 + 0.4 * depthWave
    })
  }
  return finalizeFrame(dots, [], 0.3)
}

export function frameWaitLogo(size, t) {
  const cycle = ((t % CYCLE) + CYCLE) % CYCLE
  let raw = 0
  if (cycle < FORM_AT) raw = 0
  else if (cycle < FORM_AT + FORM_MS) raw = smoothstep((cycle - FORM_AT) / FORM_MS)
  else if (cycle < HOLD_END) raw = 1
  else if (cycle < BACK_END) raw = 1 - smoothstep((cycle - HOLD_END) / (BACK_END - HOLD_END))

  const ring = ringFrame(size, t)
  if (raw <= 0.002) return ring
  const logo = logoDotFrame(size, t, {})
  if (raw >= 0.998) return logo
  return blendFrames(ring, logo, raw, size / 2, size / 2)
}

export function frameWaitDuo(size, t) {
  const cx = size / 2
  const cy = size / 2
  const R = (size / 2) * 0.66
  const count = size <= 24 ? 9 : 26
  const baseR = dotBase(size, 2.3)
  const arcs = [
    { direction: 1, squash: 0.5, phase: 0.35 },
    { direction: -1, squash: 0.5, phase: -0.35 }
  ]

  const dots = []
  for (let k = 0; k < arcs.length; k++) {
    const arc = arcs[k]
    const spin = t * 0.34 * arc.direction + k * Math.PI * 0.5 + arc.phase
    const cos = Math.cos(spin)
    const sin = Math.sin(spin)
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU
      const ex = Math.cos(a) * R
      const ey = Math.sin(a) * R * arc.squash
      // 弧上留一段亮区，其余压暗：读作"一条正在生成的点线"，而不是满圈等亮的环
      const crest = 0.5 + 0.5 * Math.cos(a * 2 + spin * 1.5)
      dots.push({
        x: cx + ex * cos - ey * sin,
        y: cy + ex * sin + ey * cos,
        z: 0,
        r: baseR * (0.62 + 0.55 * crest),
        white: 0.4 + 0.42 * crest,
        a: 0.4 + 0.5 * crest
      })
    }
  }
  return finalizeFrame(dots, [], 0.3)
}

/** 状态名 → 形态。`waiting` 是旧名，保留指向默认候选。 */
export const WAITING_FRAMES = {
  'waiting': frameWaitTorus,
  'waiting-a': frameWaitCore,
  'waiting-b': frameWaitTorus,
  'waiting-c': frameWaitDuo,
  'waiting-logo': frameWaitLogo,
  'waiting-void': frameWaitVoid
}

/** 判断某个状态名是否属于预览自绘的待命族。 */
export function isWaitingState(rawState) {
  const key = String(rawState == null ? '' : rawState).trim().toLowerCase()
  return Object.prototype.hasOwnProperty.call(WAITING_FRAMES, key)
}
