/**
 * 状态切换时粒子「位移重组」的纯计算，与 Canvas 无关。
 *
 * <p>原先的过渡是**绕中心的交叉淡入**：旧形态放大外扩、新形态从 0.85 倍内长，
 * 两者只靠透明度混合。它的观感问题是两团粒子各自溶解、互不相干——同一批粒子
 * 在画面上"凭空消失又凭空出现"，读不到"粒子换了一种排列"。用户实测反馈正是
 * 这一点：切换时像是从中间整体渐变。</p>
 *
 * <p>引擎的 frame 本身就是纯几何（`frameFn(size, t, opts)` 返回
 * `{ dots: [{x,y,z,r,a,white}], lines }`），因此可以真正做位移：
 * 同一帧里同时采样旧形态与新形态，把粒子**按角度秩配对**后逐粒插值，
 * 于是每颗粒子都有一条从旧位置到新位置的连续路径，中途不消失、不重生。</p>
 *
 * <p>为什么按角度排序配对，而不是按数组下标：引擎输出的 dots 是 z 序
 * （远→近），同一个粒子在相邻两帧里的下标会漂移；按角度（绕画布中心）排序后
 * 再做秩匹配，配对才在时间上稳定，粒子不会互相穿身而过。</p>
 *
 * <p>为什么逐粒错峰：整体同步插值读起来像"一张图被拉伸"，错峰之后先到的粒子
 * 先就位、后到的补位，观感才是"一团粒子在重新排布"。</p>
 */

/**
 * 位移重组的总时长（ms）。
 *
 * <p>比原交叉淡入的 420ms 长一些：位移必须走过画面上的实际距离，太快就读不出
 * 路径，只剩"闪一下"。560ms 仍在"事件连发时可被打断"的容忍范围内——
 * 而且本实现被打断时从**画面上的当前混合态**继续，不会跳帧（见 `orb-canvas.js`
 * 的 frozen 快照）。</p>
 */
export const MORPH_MS = 560

/** 每颗粒子的最大启动延迟，占总时长的比例。上限压在 0.3：再大就会有粒子在过渡结束时还没到位。 */
const STAGGER = 0.3

/** 新增/消失粒子的起点与终点：相对中心的位置比例（0 = 画布中心，1 = 目标位置）。 */
const SPAWN_RATIO = 0.35

/** 半径下限，与引擎 `finalizeFrame` 的 rMin 一致，避免出现看不见又占位的零半径点。 */
const R_MIN = 0.3

function clamp01(x) {
  const v = Number(x)
  if (!Number.isFinite(v)) return 0
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/**
 * 过渡进度 `0→1`。
 *
 * <p>这里**不做**全局缓动：缓动交给每颗粒子自己的 stagger 曲线，
 * 否则全局缓动会把所有粒子的起步同时压慢，错峰反而被削平。</p>
 */
export function morphProgress(elapsedMs, durationMs = MORPH_MS) {
  const duration = Number(durationMs)
  const elapsed = Number(elapsedMs)
  if (!Number.isFinite(duration) || duration <= 0) return 1
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0
  if (elapsed >= duration) return 1
  return elapsed / duration
}

/** 自然减速（ease-out-quart）：粒子先快后慢地落位，不做回弹。 */
function easeOutQuart(x) {
  const t = clamp01(x)
  const u = 1 - t
  return 1 - u * u * u * u
}

/**
 * 第 `index` 颗粒子的启动延迟，落在 `[0, STAGGER]`。
 *
 * <p>用确定性散列而不是 `Math.random()`：同一颗粒子每帧拿到的延迟必须一致，
 * 否则它会逐帧改变路径、抖成噪点。</p>
 */
export function particleDelay(index) {
  const h = Math.sin((index + 1) * 127.1 + 311.7) * 43758.5453
  return (h - Math.floor(h)) * STAGGER
}

/** 第 `index` 颗粒子在这一刻的完成度 `0→1`。过渡结束（raw = 1）时全部为 1。 */
export function particleProgress(raw, index) {
  const delay = particleDelay(index)
  return easeOutQuart((clamp01(raw) - delay) / (1 - delay))
}

/** 把点按绕画布中心的角度排序，供秩配对使用。返回新数组，不修改入参。 */
export function sortByAngle(dots, cx, cy) {
  return dots
    .map((dot) => ({ dot, angle: Math.atan2(dot.y - cy, dot.x - cx) }))
    .sort((a, b) => a.angle - b.angle)
    .map((item) => item.dot)
}

function mixNumber(from, to, f) {
  return from + (to - from) * f
}

/**
 * 把旧形态与新形态混合成一帧。
 *
 * <p>三条规则：</p>
 * <ol>
 *   <li><b>两帧都有的粒子</b>：位置、半径、透明度、明暗全部按该粒子自己的
 *       进度插值，因此它从旧位置走到新位置，全程可见。</li>
 *   <li><b>只有新形态有的粒子</b>：从自身目标位置的 35%（更靠中心）长出，
 *       半径由小到大、透明度由 0 到满——是"补位"，不是凭空出现。</li>
 *   <li><b>只有旧形态有的粒子</b>：向中心收拢 35% 并淡出——是"退场"。</li>
 * </ol>
 *
 * <p>线（`connecting` 的连线）不做位置插值：连线是拓扑而不是粒子，
 * 逐条插值会拉出穿过画面的长边。旧线随进度淡出、新线淡入。</p>
 */
export function blendFrames(oldFrame, newFrame, raw, cx, cy) {
  const oldDots = sortByAngle(oldFrame.dots, cx, cy)
  const newDots = sortByAngle(newFrame.dots, cx, cy)
  const count = Math.max(oldDots.length, newDots.length)
  const dots = new Array(count)

  for (let i = 0; i < count; i++) {
    const from = oldDots[i]
    const to = newDots[i]
    const p = particleProgress(raw, i)
    if (from && to) {
      const fromAlpha = from.a == null ? 1 : from.a
      const toAlpha = to.a == null ? 1 : to.a
      dots[i] = {
        x: mixNumber(from.x, to.x, p),
        y: mixNumber(from.y, to.y, p),
        z: mixNumber(from.z, to.z, p),
        r: mixNumber(from.r, to.r, p),
        a: mixNumber(fromAlpha, toAlpha, p),
        white: mixNumber(from.white == null ? 0.5 : from.white, to.white == null ? 0.5 : to.white, p),
        tint: p < 0.5 ? to.tint || from.tint : from.tint || to.tint
      }
    } else if (to) {
      const targetAlpha = to.a == null ? 1 : to.a
      const startX = cx + (to.x - cx) * SPAWN_RATIO
      const startY = cy + (to.y - cy) * SPAWN_RATIO
      const startR = Math.max(R_MIN, to.r * SPAWN_RATIO)
      dots[i] = {
        x: mixNumber(startX, to.x, p),
        y: mixNumber(startY, to.y, p),
        z: to.z,
        r: mixNumber(startR, to.r, p),
        a: targetAlpha * p,
        white: to.white == null ? 0.5 : to.white,
        tint: to.tint
      }
    } else {
      const fromAlpha = from.a == null ? 1 : from.a
      const endX = cx + (from.x - cx) * SPAWN_RATIO
      const endY = cy + (from.y - cy) * SPAWN_RATIO
      dots[i] = {
        x: mixNumber(from.x, endX, p),
        y: mixNumber(from.y, endY, p),
        z: from.z,
        r: Math.max(R_MIN, from.r * (1 - (1 - SPAWN_RATIO) * p)),
        a: fromAlpha * (1 - p),
        white: from.white == null ? 0.5 : from.white,
        tint: from.tint
      }
    }
  }

  // 配对时按角度排过序，绘制前必须回到 z 序，否则近处的点会被远处的盖住。
  dots.sort((a, b) => a.z - b.z)

  const fade = clamp01(raw)
  const lines = []
  for (const line of oldFrame.lines || []) {
    lines.push({ ...line, a: (line.a == null ? 1 : line.a) * (1 - fade) })
  }
  for (const line of newFrame.lines || []) {
    lines.push({ ...line, a: (line.a == null ? 1 : line.a) * fade })
  }

  return { dots, lines }
}
