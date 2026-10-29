/**
 * 数鉴智能体的统一视觉状态层。
 *
 * <p>计划 `analytics-agent-logo.md` 第 5 节定义了 9 个「业务可见的视觉状态」
 * （idle / thinking / searching / generating / complete …）。这些名字与引擎内部的
 * 9 个 mode 名（working / searching / composing / breathing …）**不是一一对应**，
 * 而且引擎的 `resolvePreset` 只认识后者——传 `idle` 进去会在
 * `PRESETS[undefined][size]` 处直接抛错（实测）。
 *
 * <p>因此本模块负责三件事，且**不修改内置引擎**（`presets.js` 是上游 0.3.1 的
 * 原样副本，改动它会破坏 golden 向量与"未改动上游数学"的声明）：
 *
 * <ol>
 *   <li><b>名字映射</b>：把业务状态翻成引擎 state；已经是引擎 state 的原样透传，
 *       因此现有调用方（`working`/`searching`/`composing`/`solving`）完全不受影响，
 *       不需要重命名——计划第 5 节明确要求"避免无必要重命名"。</li>
 *   <li><b>参数覆盖</b>：`idle`/`complete` 需要比内置预设更慢、更明显的呼吸与收束，
 *       通过组件已有的 `opts` 覆盖通道实现，而不是去改内置预设表。</li>
 *   <li><b>完成脉冲</b>：`complete` 需要在进入时**只触发一次**的亮度脉冲，
 *       由 `completionPulse()` 提供曲线、组件负责加法混合绘制。</li>
 * </ol>
 *
 * <p>语音输入与朗读复用已经存在的 `listening`、`connecting`、`composing` 引擎状态，
 * 不在这里增加音量映射或新的业务状态；需要语音活跃反馈时由调用方传入已有状态。</p>
 */

/** 引擎真正认识的 state（取值域来自 engine/profiles.js 的 BASE_PROFILES）。 */
const ENGINE_STATES = new Set([
  'working', 'searching', 'solving', 'listening',
  'connecting', 'weaving', 'composing', 'breathing', 'shaping'
])

/**
 * 业务状态 → 引擎 state。
 *
 * <p>映射依据（计划第 5 节对各状态的描述）：
 *  - `idle`「安静呼吸、主体稳定、内部轻微流动」→ `breathing`（呼吸环）；
 *  - `thinking`「有序推理」→ `composing`（此前生产环境已这样用）；
 *  - `generating`「组织与输出、有方向的连续流动」→ `composing`；
 *  - `complete`「运动减速、一次亮度脉冲、恢复 idle」→ `breathing`（收束态）
 *    再叠加脉冲，见 `COMPLETE_PULSE_MS`。</p>
 */
const AGENT_TO_ENGINE = Object.freeze({
  idle: 'breathing',
  thinking: 'composing',
  searching: 'searching',
  generating: 'composing',
  complete: 'breathing'
})

/**
 * `idle` 的参数覆盖：把呼吸做得比内置预设更慢、更明显。
 *
 * <p>为什么要覆盖：内置 `ring` 预设带 `spin: 0`，它同时关掉相机旋转、环面转角
 * 与倾角摆动，只剩被 `wobMul: 0.368` 缩放后的起伏——实测振幅峰值仅 6px，
 * 78px 的环上几乎看不出在动。计划要求 idle 是"3～5 秒自然呼吸"，因此这里
 * 放大起伏并压低速度。`BREATH_PERIOD` 侧的 4.5s 由 logo 图案使用，
 * 引擎 mode 的周期由 `speed` 决定，这里取 0.55 约等于 4～5 秒一轮。</p>
 */
const IDLE_OPTS = Object.freeze({ wobMul: 1.35 })

/** `idle` 的速度倍率（相对预设）。越小越慢。 */
export const IDLE_SPEED = 0.55

/**
 * 完成脉冲的持续时长（ms）。
 *
 * <p>取 1100ms：短于 0.6s 会像"闪一下"（容易被当成渲染抖动而非"完成"），
 * 长于 1.5s 会和随后的 idle 呼吸混在一起、读不出"这是一个事件"。</p>
 */
export const COMPLETE_PULSE_MS = 1100

/** `complete` 的速度倍率：收束要明显变慢，运动减速是"完成"的主要读法。 */
export const COMPLETE_SPEED = 0.42

/**
 * 解析业务状态。
 *
 * @param raw 业务状态名，或已经是引擎 state
 * @returns `{ engineState, opts, speed, pulse }`
 *  - `engineState`：可直接交给 `resolvePreset` 的名字；
 *  - `opts`：需要叠加到预设之上的覆盖项（可能为 `null`）；
 *  - `speed`：速度倍率（`null` 表示保持预设）；
 *  - `pulse`：是否为一次性完成脉冲状态。
 *
 * <p>未知取值回落到 `composing`，与 `orbStateForEvent` 的保守取向一致：
 * 宁可显示通用的"思考"，也不要因为一个没见过的状态名让画布整个抛错。</p>
 */
export function resolveAgentState(raw) {
  const key = String(raw == null ? '' : raw).trim().toLowerCase()
  if (AGENT_TO_ENGINE[key]) {
    const engineState = AGENT_TO_ENGINE[key]
    const isIdle = key === 'idle'
    const isComplete = key === 'complete'
    return {
      engineState,
      opts: isIdle || isComplete ? { ...IDLE_OPTS } : null,
      speed: isIdle ? IDLE_SPEED : (isComplete ? COMPLETE_SPEED : null),
      pulse: isComplete
    }
  }
  // 已是引擎 state：原样透传，现有调用方不受影响。
  if (ENGINE_STATES.has(key)) {
    return { engineState: key, opts: null, speed: null, pulse: false }
  }
  return { engineState: 'composing', opts: null, speed: null, pulse: false }
}

/** 该状态名是否被本层认识（业务状态或引擎 state）。 */
export function isKnownAgentState(raw) {
  const key = String(raw == null ? '' : raw).trim().toLowerCase()
  return Boolean(AGENT_TO_ENGINE[key]) || ENGINE_STATES.has(key)
}

/** 业务状态目录（供预览页与测试遍历；顺序按计划第 5 节）。 */
export const AGENT_STATES = Object.freeze(['idle', 'thinking', 'searching', 'generating', 'complete'])
