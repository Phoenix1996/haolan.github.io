/** 状态交叉淡入的纯计算，与 Canvas 无关，便于单测。 */

/**
 * 状态切换的过渡时长（ms）。
 *
 * <p>计划 `ANALYTICS-AGENT-THINKING-ORB` 第 5 节原写"约 200–300ms"，
 * 最初取 240ms。用户实测反馈**切换太快、看不出粒子在重排**，故加长到 420ms：
 * 配合绕中心缩放（旧形态外扩、新形态内长），这个时长才够看清"粒子重新布置"的过程。</p>
 *
 * <p>为什么不更长：事件可能**毫秒级连发**（实测同一轮里 MODEL_COMPLETED 与
 * TOOL_STARTED 相距 0ms），过渡会被下一次切换打断。420ms 在"看得清"与
 * "少被打断"之间取平衡——真实工具步均 3.0s、模型调用均 4.0s，
 * 一次完整过渡只占典型步长的约 14%。</p>
 *
 * <p>打断时的行为是**从当前目标重新开始**，不是从屏幕上的中间态继续
 * （那需要离屏快照，代价更大）。因此极端密集的事件会让过渡显得快，
 * 这与"事件本身确实紧挨着"是一致的，不是缺陷。</p>
 *
 * <p>为什么不做成可配 prop：计划第 1 节明确"不增加功能开关"，
 * 且这是纯观感常数，没有按场景调整的必要。</p>
 */
export const STATE_FADE_MS = 420

/**
 * 过渡进度 `0→1`（smoothstep 缓入缓出）。
 *
 * <p>为什么从 ease-out cubic 改成 smoothstep：ease-out 在时间过半时已完成
 * **87.5%**，等于"唰"一下就结束了——用户反馈"切换太快、看不出粒子在重排"
 * 正是这个曲线的直接后果。smoothstep（3x²−2x³）在时间过半时进度正好 50%，
 * 把可见的混合过程摊到整个时长里，因此**同样的时长**下观感明显更从容。
 * 两端导数为 0，也不会出现"起步突然一窜"。</p>
 *
 * <p>边界：负数（时钟回拨/入参异常）按 0 处理返回起始值，超时返回 1。
 * 不做平滑外推——进度必须单调且落在 [0,1] 内。</p>
 */
export function fadeProgress(elapsedMs, durationMs = STATE_FADE_MS) {
  const duration = Number(durationMs)
  const elapsed = Number(elapsedMs)
  if (!Number.isFinite(duration) || duration <= 0) return 1
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0
  if (elapsed >= duration) return 1
  const x = elapsed / duration
  return x * x * (3 - 2 * x)
}

/**
 * 是否应该为这次 state 变化启动交叉淡入。
 *
 * <p>三种情况必须**直接切换**而不是淡入：</p>
 * <ul>
 *   <li>`reduced`：系统要求减少动效，画静态帧，不能引入新的动画；</li>
 *   <li>`paused`：没有 rAF 循环推进进度，淡入会永远停在起始帧（等于卡住不更新）；</li>
 *   <li>没有可用的旧帧快照（首次挂载、或尺寸刚变过）：没有"旧"可淡出，
 *       强行淡入只会从空白淡入，比直接出现更奇怪。</li>
 * </ul>
 */
export function shouldStartFade({ reduced, paused, hasSnapshot }) {
  return !reduced && !paused && Boolean(hasSnapshot)
}

/**
 * 这一帧是否需要画**两个**形态。
 *
 * <p>抽成函数是为了能被直接断言：它原先写成 draw 闭包里的内联条件
 * （`if (previous && fade < 1)`），测试只能去测引擎的单形态绘制，
 * 于是"淡完后仍走双形态"这种退化完全测不出来——变异自检时确认漏掉了。</p>
 *
 * <p>`fade >= 1` 时旧形态的透明度是 0（画面本身没错），但会白白多跑一整趟
 * arc/fill（最重的模式 500+ 个点），因此必须真的跳过，而不是"画成透明"。</p>
 */
export function shouldCrossFade(previous, fade) {
  return Boolean(previous) && fade < 1
}

/**
 * 过渡期间「扩散」的缩放范围。
 *
 * <p>只做透明度交叉时，观感是"一张图溶解成另一张"；加上绕中心的缩放后，
 * 读起来是**粒子在向外流动、新形态从内侧成形**，而不是两团互不相干的点交替出现。</p>
 *
 * <p>为什么要分成内外两档（而不是让两个形态都从 1 开始缩放）：
 * 若新形态也从 1 放大到同一倍数，两个形态在中段的半径会**重合**，
 * 半透明叠加后糊成一圈；让旧形态始终在外、新形态始终在内，
 * 两者半径全程不重合，过渡因此始终可辨认。</p>
 *
 * <p>为什么上限是 1.12（实测得出，不是估的）：过渡扩散只作用于旧形态，
 * 而最外圈的点放大后不能越过画布半宽。实测九个 state 在各自时间轴上的**
 * 最坏**半径（含点半径）为画布的 44.0%（`listening`），
 * 因此安全上限 = 0.5 / 0.44 ≈ 1.136，取 1.12 留一点余量。
 * 曾按"约 0.41"估成 1.25，那样最外圈会到 53% 半宽、边缘被裁掉一排点。</p>
 */
export const TRANSITION_SCALE_OUT = 1.12

/**
 * 新形态的成型起点（<1，因此始终在旧形态内侧）。
 *
 * <p>取 0.85：比 1 明显小，能看出"从内侧长出来"，又不至于小到像另一个物体。</p>
 */
export const TRANSITION_SCALE_IN = 0.85

/**
 * 旧形态的扩散倍率：`fade` 从 0→1 时由 1 放大到 {@link TRANSITION_SCALE_OUT}。
 *
 * <p>与透明度用**同一个 fade**，两者严格同步：点扩到最外圈时透明度正好为 0，
 * 不会出现"已经看不见却还在往外飞"或"还在可见时突然停住"。</p>
 */
export function fadeOutScale(fade) {
  const f = clamp01(fade)
  return 1 + (TRANSITION_SCALE_OUT - 1) * f
}

/**
 * 新形态的成型倍率：`fade` 从 0→1 时由 {@link TRANSITION_SCALE_IN} 长到 1。
 *
 * <p>与 {@link fadeOutScale} 同为"向外"，因此过渡像一个向外推的波：
 * 旧形态从中心推向边缘并消散，新形态从内侧长出并稳定。
 * 两者半径全程不重合（旧 ≥1，新 ≤1），不会互相糊掉。</p>
 */
export function fadeInScale(fade) {
  const f = clamp01(fade)
  return TRANSITION_SCALE_IN + (1 - TRANSITION_SCALE_IN) * f
}

/** 把值夹到 [0,1]；非有限值按 0 处理（时钟异常时不能污染变换矩阵）。 */
function clamp01(x) {
  const v = Number(x)
  if (!Number.isFinite(v)) return 0
  return v < 0 ? 0 : v > 1 ? 1 : v
}
