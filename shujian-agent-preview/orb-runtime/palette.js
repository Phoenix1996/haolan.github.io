/**
 * 数鉴智能体品牌色板（粒子动画专用）。
 *
 * <p><b>色值来自项目既有的主题变量，不是另立一套。</b>计
 * `analytics-agent-logo.md` 第 10 节把这几个 hex 列在"缺少规范时参考"之下，
 * 而本项目**已有**品牌规范（`Beta2Workspace.vue` 的 `--cxai-brand*` 令牌），
 * 因此按该节「优先使用品牌色与主题变量」的先后顺序，应以主题变量为准。</p>
 *
 * <p>为什么在 JS 里再写一遍、而不是直接读 CSS 变量：粒子画在 Canvas 上，
 * `fillStyle` 拿不到 `var(--cxai-brand)`。因此这里是那些令牌在 JS 侧的镜像，
 * 并由 `cxai-orbs-brand-layers.test.mjs` 直接读取 `Beta2Workspace.vue` 的令牌
 * 定义做等值断言——令牌改了而这里没跟着改，测试会失败，不会静默漂移。</p>
 */

/** 主色：粒子主体、品牌轮廓。对应 `--cxai-brand`。 */
export const BRAND_PRIMARY = '#6558ef'

/** 辅色：陪衬小粒子、背景尘埃（比主色浅，向后收）。对应 `--cxai-brand-light`。 */
export const BRAND_SECONDARY = '#8a6ff5'

/**
 * 高亮：轮廓内部的填充点、沿轮廓穿梭的流动亮点。对应 `--cxai-brand-strong`。
 *
 * <p><b>为什么"高亮"取的是加深色而不是提亮色</b>：粒子画在**浅色底**上，
 * 对比度来自变深而不是变浅——比主色更浅的颜色在白底上反而更看不见。
 * 因此这里用同族的加深色来表达"更实、更近"。</p>
 */
export const BRAND_HIGHLIGHT = '#4f46c8'

/**
 * 强调用的柔和蓝紫。对应 `--cxai-brand-current-border`，
 * 默认不参与主体着色，留给需要"最轻一档"的层次。
 */
export const BRAND_VIOLET = '#b9b8ff'

/**
 * 粒子动画的默认颜色。保持旧导出名 `ORB_BRAND_COLOR` 的兼容语义：
 * 调用方传 `:color="ORB_BRAND_COLOR"` 的行为不变，只是色值改为主题主色。
 */
export const ORB_BRAND_COLOR = BRAND_PRIMARY

/**
 * 把 `#rrggbb` 解析成 0–255 的 RGB 分量。
 *
 * <p>与 `ShujianOrb.vue` 内的 `parseTint` 是两回事：那个负责**容错解析任意
 * 调用方输入**（含 `rgb()` 形式、失败回落灰度），这里只服务本模块内部的
 * 色值运算（如把主色按比例混向高亮）。内部常量解析失败属于编码错误，
 * 因此直接抛错而不是静默回落。</p>
 */
export function hexToRgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || '').trim())
  if (!m) throw new Error(`不是合法的 #rrggbb 色值：${hex}`)
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/**
 * 按比例在两色之间线性插值，返回 `#rrggbb`。
 *
 * @param from 起始色
 * @param to 目标色
 * @param t 0 → from，1 → to（越界会被夹紧）
 */
export function mixHex(from, to, t) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const k = Math.min(1, Math.max(0, Number(t) || 0))
  const ch = (x, y) => Math.round(x + (y - x) * k).toString(16).padStart(2, '0')
  return `#${ch(a.r, b.r)}${ch(a.g, b.g)}${ch(a.b, b.b)}`
}

/**
 * 完成脉冲的强度曲线：快速上升、缓慢衰减，且在 1 处**恰好归零**。
 *
 * <p>为什么要单独定义曲线而不是用 `1 - t`：脉冲是「一次轻微提亮」，
 * 需要明确的前沿（让人察觉"这一步结束了"）与柔和的拖尾。线性衰减看起来
 * 像亮度在慢慢漏掉；这里前 12% 冲到峰值、其余时间二次衰减。</p>
 *
 * @param progress 0→1，进入 complete 状态后经过的比例
 * @returns 0→1 的强度；progress 越界时夹紧，因此调用方不需自行保护
 */
export function completionPulse(progress) {
  const p = Math.min(1, Math.max(0, Number(progress) || 0))
  if (p >= 1) return 0
  const RISE = 0.12
  if (p < RISE) return p / RISE
  const decay = (p - RISE) / (1 - RISE)
  return (1 - decay) ** 2
}
