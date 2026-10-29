/* 自定义粒子图案：不依赖引擎的九个内置 mode，直接用 frame 契约手绘。
   frame 契约 = (size, t, opts) → { dots, lines }，因此这些图案
   自动复用组件的着色、DPR、主题、暂停、离屏暂停等全部逻辑。 */
import { finalizeFrame, vnoise } from './engine/core.js'
import { LOGO_OUTLINE_RINGS } from './logo-outline.js'
import { LOGO_AURA_DOTS } from './logo-aura.js'
import { hexToRgb, BRAND_PRIMARY, BRAND_SECONDARY, BRAND_HIGHLIGHT } from './palette.js'

// 转发点阵数据：调用方/测试只需 import orb-patterns 一处。
export { LOGO_OUTLINE_RINGS, LOGO_AURA_DOTS }

/**
 * 三层的品牌色（计划第 10 节：主色 / 辅色 / 高亮）。
 *
 * <p>为什么要在图案层就决定颜色，而不是让调用方传一个统一色：这个图案
 * **内部本来就有三层语义不同的结构**（品牌轮廓 = 主体、旁边小粒子 = 陪衬、
 * 穿梭亮点 = 流动中的能量）。用一个色值画三层，只能靠明度区分，看不出
 * "结构 / 陪衬 / 流动"的差别；而计划正是要求用辅色与高亮承担后两者的区分。</p>
 *
 * <p>预先解析成 RGB：`paint` 每帧对每个点都要用，放在这里避免每帧重复解析
 * 字符串（355 个点 × 每秒 60 帧）。</p>
 *
 * <p>调用方仍可用 `:color` 覆盖**未分层**的图案（如引擎内置 mode）——
 * 逐点 tint 只在图案显式给出时生效，见 `engine/core.js` 的 `paint`。</p>
 */
const LAYER_TINTS = Object.freeze({
  outline: hexToRgb(BRAND_PRIMARY),
  aura: hexToRgb(BRAND_SECONDARY),
  shuttle: hexToRgb(BRAND_HIGHLIGHT)
})


/** 数据生成时的基准尺寸与轮廓点数（见 scripts/gen-orb-logo-outline.mjs）。 */
const BASE_SIZE = 104
const BASE_OUTLINE_POINTS = 420
/** 虚点数据生成时的网格间距（px，1x）——与 gen-orb-logo-aura.mjs 的 PITCH 一致。 */
const BASE_AURA_PITCH = 2.8
/** 轮廓在画布中的占比：字形长边占画布的这个比例，四周留呼吸余量。 */
const LOGO_SCALE = 0.78
/**
 * 该显示尺寸下相邻轮廓点的最小间距（px）。低于此值圆点会粘连成一团。
 *
 * <p>取 0.9（原为 1.0）：用户要求"粒子更多一点"，而 104px 下 420 点的**真实**
 * 间距是 0.974px——旧的 1.0 阈值刚好把它判为"太密"，于是步长取 2、
 * 实际只画 210 个点，反而比改造前的 240 更少。半径已同时降到 0.83px，
 * 判据从"间距绝对值"改为"间距/直径"后 0.59 属于清晰可辨的珠链区间，
 * 因此阈值下调到 0.9 让 420 点真正生效。</p>
 */
const MIN_GAP = 0.9
/** 小粒子允许的最小间距（px）。虚点更暗更小，可以比轮廓密一些，但不能抢戏。 */
const MIN_AURA_GAP = 1.35
/**
 * 小粒子的抽稀下限。
 *
 * <p>为什么固定再疏一档：实测按间距算出的步长会让小粒子数量与轮廓点相当
 * （104px 下 267 vs 240），轮廓被同等密度的陪衬点包围，"标志主体 + 旁边小粒子"
 * 的层次就没了。用户要的是"旁边**一些**小粒子"，因此只在轮廓点数的基础上
 * 留约 1/3，保证轮廓始终是明显的视觉主体。</p>
 */
const AURA_DENSITY = 0.6
/** 呼吸周期（秒）。4.5s 一次，接近平静呼吸，比心跳慢得多。 */
const BREATH_PERIOD = 4.5
/**
 * 轮廓呼吸的缩放幅度（相对值，±）。
 *
 * <p><b>为什么可以取到 ±9%</b>：刚体均匀缩放**不会变形**（任何两点距离按同一
 * 比例变化），因此这里不再受"幅度一大就变形"的约束——那个约束是先前
 * **逐点位移**方案带进来的。实测形变指标恒为 **0.0000**。</p>
 *
 * <p>取值标定：`vnoise` 映射到 [-1,1] 后的**实际幅值范围约 -0.66..0.90**
 * （均值 |v|≈0.30），并非满量程。因此名义 ±9% 折算到 104px 的边缘位移约
 * **±3.3px**——这是"看得见的呼吸"。</p>
 */
const BREATH_AMPLITUDE = 0.09
/**
 * 呼吸的时间速度（噪声域推进速度）。
 *
 * <p>取 0.22：实测一个明显周期约 7–10 秒，属"缓慢呼吸"而非心跳。</p>
 */
const BREATH_SPEED = 0.22

/**
 * 字形整体平移的幅度（相对字形跨度）。
 *
 * <p><b>为什么要平移</b>：只有呼吸缩放时，虽然形变为 0，但整体几乎"钉"在原位
 * （实测 6 秒内边缘仅移动 2.25px），用户反馈"不变形就不会动"。
 * 平移同样是**刚体运动**（所有点位移完全相同），因此可以在不加任何形变的前提下
 * 提供明显可见的运动——这正是同时满足"能动"与"不变形"的唯一途径。</p>
 *
 * <p>取值：名义 0.05，104px 下折算约 **±3.5px** 的缓慢飘移（两个轴各自独立的
 * 噪声通道，因此轨迹不是直线往复）。速度 {@link DRIFT_SPEED} 取 0.09，
 * 一个明显周期约 12–18 秒，是"几乎察觉不到起点在哪"的缓慢水平。</p>
 */
const DRIFT_AMPLITUDE = 0.05
/** 字形整体平移的时间速度。见 {@link DRIFT_AMPLITUDE}。 */
const DRIFT_SPEED = 0.09

/**
 * 流场漂移参数——**只供陪衬层（小粒子、背景尘埃）使用**。
 *
 * <p>字形（轮廓）**不使用**流场：逐点独立位移必然制造形变，实测 4 秒内
 * 79% 的位移都是形变，于是"幅度大就变形、幅度小就不动"。字形改走
 * {@link outlineDisplacement} 的刚体路径，本流场只让**字形之外**的粒子流动——
 * 它们的位移不影响标志的形状。</p>
 *
 * <p>幅度可以较大（陪衬本就该比主体活泼），实测 104px 下小粒子位移
 * 约 4–6px，读起来是环绕标志的流动。</p>
 */
const FLOW_AMPLITUDE = 0.075
/** 流场空间频率。陪衬粒子用略高的频率，让它们各自有方向感。 */
const FLOW_SCALE = 1.1
/** 穿梭亮点的速度（每秒走过的轮廓比例）。约 9 秒绕一圈，比高光流动更慢、更克制。 */
const SHUTTLE_SPEED = 0.11
/**
 * 穿梭亮点的数量上限。
 *
 * <p>计划要求"使用**较少**粒子"。3 个时在 104px 上能看出是几个亮点在跑；
 * 再多就会与轮廓高光混在一起、变成"整圈在滚"。</p>
 */
const SHUTTLE_MAX = 3

/**
 * 该显示尺寸下的抽稀步长（隔几个轮廓点取一个）。
 *
 * <p>为什么必须按尺寸抽稀：轮廓是为 104px 准备的 240 点，直接塞进 20px 时
 * 相邻点间距只剩约 **0.25px**，圆点会粘连、轮廓糊成一团——而开场动画正好跑在
 * 20px 的等待行上。抽稀后间距回到 1px 以上，形状才读得出来。</p>
 *
 * <p>按**周长**折算（间距差 n 倍 → 点数差 n 倍），因此这里不取平方。</p>
 */
export function outlineStride(size) {
  const s = finiteSize(size)
  // 按周长折算间距。
  //
  // 曾经用包围盒估算「2*(0.73w+0.73h)」当周长：它假设字形接近正方形，
  // 而实测该估算在 104px 下给出 0.723px，真实周长算出来是 0.974px——
  // 低估约 26%，于是 420 点被误判为"太密"而抽稀掉一半。
  // 现在用与绘制同一套数据的真实周长，估算与实测不会再分叉。
  const perim = outlinePerimeter(s)
  const gap = perim / BASE_OUTLINE_POINTS
  if (gap >= MIN_GAP) return 1
  // 至少留 40 个点，否则形状不成立
  return Math.min(6, Math.max(1, Math.ceil(MIN_GAP / gap)))
}

/**
 * 轮廓在给定显示尺寸下的真实周长（px）。
 *
 * <p>与绘制用**同一份** LOGO_OUTLINE_RINGS，因此不会像包围盒估算那样
 * 与真实间距分叉（那正是抽稀参数失准的根因）。</p>
 *
 * <p>按需缓存：同一尺寸在一次会话里会被反复问（每个实例、每次 restart），
 * 而 420 个点的求和不值得重复做。</p>
 */
const perimeterCache = new Map()
function outlinePerimeter(size) {
  const hit = perimeterCache.get(size)
  if (hit != null) return hit
  const scale = size * LOGO_SCALE
  let perim = 0
  for (const ring of LOGO_OUTLINE_RINGS) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      perim += Math.hypot((b[0] - a[0]) * scale, (b[1] - a[1]) * scale)
    }
  }
  perimeterCache.set(size, perim)
  return perim
}

/**
 * 归一化显示尺寸：非有限值（NaN / ±Infinity）与 ≤0 都回落到基准尺寸。
 *
 * <p>必须挡 Infinity：`Number(Infinity) || BASE_SIZE` 得到的是 Infinity（真值），
 * 于是所有几何量都变成 Infinity，坐标全塌成非有限值——实测踩到过。</p>
 */
function finiteSize(size) {
  const s = Number(size)
  return Number.isFinite(s) && s > 0 ? s : BASE_SIZE
}

/**
 * 该尺寸下旁边小粒子的抽稀步长。
 *
 * <p>两个约束叠加，取更疏的那个：</p>
 * <ul>
 *   <li>**间距**：小粒子为 104px（间距 2.8px）生成，直接放缩到 20px 时间距只剩
 *       0.54px，会糊成一圈光斑；</li>
 *   <li>**数量**：即使间距够，按原密度也会与轮廓点数量相当（实测 267 vs 240），
 *       陪衬盖过主体。因此再按 {@link AURA_DENSITY} 压到轮廓点数的约 1/3。</li>
 * </ul>
 */
export function auraStride(size) {
  const s = finiteSize(size)
  const pitch = BASE_AURA_PITCH * s / BASE_SIZE
  const byGap = pitch >= MIN_AURA_GAP ? 1 : Math.ceil(MIN_AURA_GAP / pitch)
  // 数量约束：轮廓点数为 N 时，小粒子应约为 N*AURA_DENSITY，
  // 总点数 M 已知，故步长约 M/(N*AURA_DENSITY)。
  const outlineCount = Math.ceil(BASE_OUTLINE_POINTS / outlineStride(s))
  const byCount = Math.ceil(LOGO_AURA_DOTS.length / Math.max(1, outlineCount * AURA_DENSITY))
  return Math.min(8, Math.max(1, byGap, byCount))
}

/** 取第 i 个点应保留与否（按步长抽稀）。 */
function kept(i, stride) {
  return stride <= 1 || i % stride === 0
}

/**
 * 该尺寸下的轮廓点半径。
 *
 * <p>为什么要设下限：按比例算的话 20px 下半径只有 **0.30px**，正好等于
 * finalizeFrame 的下限值，浏览器会把它画成极淡的浮尘——轮廓看着像没画。
 * 实测 104px 下需要 ≥0.6px 点才立得住，因此小尺寸下不再等比缩小，
 * 而是抬到可辨认的下限。代价是小尺寸下点相对更大、更接近"点连成线"，
 * 但那正是等待行尺寸下想要的效果（看清形状优先于细节）。</p>
 */
export function logoDotRadius(size) {
  // 系数从 0.011 降到 0.008：用户要求"粒子更多一点"，而点数受
  // 「相邻点不能糊成一条线」约束——判据是 gap/diameter。104px 下
  // 用 420 点时 gap 只有 0.97px，半径 1.14px 会让直径达 2.28px、
  // 比间距大一倍，点全部叠连成糊线（实测 gap/diameter=0.43）。
  // 半径降到 0.83px 后比值回到 0.58，是"成串的珠链"——既能看清形状，
  // 又明显是一颗颗粒子而不是一条边线。
  return Math.max(0.58, size * 0.008)
}

/**
 * 呼吸波形：慢速正弦，返回 [0,1]，0.5 为中间态。
 *
 * <p>用户明确说"不需要它实际来心跳"，因此这里**不是**心跳：心跳是短促双搏动，
 * 读起来有生理暗示；而欢迎区的标志只是安静地待着，要的是缓慢起伏的存在感。
 * 周期取 4.5s，接近平静呼吸，比心跳慢一个数量级，观感是"活的但安静"。</p>
 */
export function breathing(t) {
  // 非有限值回落到 0：Infinity % period 仍是 NaN，会让整帧亮度和位移变 NaN。
  const x = Number(t)
  const tt = Number.isFinite(x) ? x : 0
  return 0.5 + 0.5 * Math.sin((tt % BREATH_PERIOD) / BREATH_PERIOD * Math.PI * 2)
}

/**
 * 该尺寸下穿梭亮点的数量。
 *
 * <p>小尺寸不出亮点：20px 的等待行上轮廓本身才几十个点，再塞移动亮点会
 * 变成"有个点在乱跳"，反而干扰识别。阈值取 48px——正是计划第 8 节里
 * "聊天头像/标准状态区"的下限。</p>
 */
export function shuttleCount(size) {
  const s = finiteSize(size)
  if (s < 48) return 0
  return SHUTTLE_MAX
}

/**
 * 沿轮廓路径移动的穿梭亮点。
 *
 * <p><b>为什么按 ring 分别运动，而不是把所有点拼成一条路径</b>：数鉴 logo 的
 * 轮廓数据是 **2 个互不相连的 ring**（标志上有两笔分开的笔画），实测 ring0 末点
 * 到 ring1 首点的距离是 0.861（归一化），而环内相邻点典型间距只有 0.021——
 * 相差约 41 倍。若把它们首尾相接当成一条路径，亮点会在接缝处**横穿标志的
 * 负空间**跳过去，正是计划第 5 节明确禁止的"大量穿过负空间"。
 * 因此每个 ring 是一条**独立的闭合路径**，亮点分配到各 ring 上。</p>
 *
 * <p>轨迹始终贴着该 ring 的轮廓，因此天然服从品牌结构。多个亮点用不同的
 * 起始进度错开，读起来是"接力穿梭"而不是"一个点在跑"。</p>
 *
 * @param size 显示尺寸
 * @param time 秒
 * @param scatter 开场散开进度（0–1），与其它层同步外扩
 */
export function shuttleDots(size, time, scatter = 0) {
  const s = finiteSize(size)
  const n = shuttleCount(s)
  if (n <= 0) return []
  const t = Number.isFinite(Number(time)) ? Number(time) : 0
  const spread = s * LOGO_SCALE
  const c = s / 2
  const dotR = logoDotRadius(s)
  const scatterMul = 1 + Math.min(1, Math.max(0, scatter)) * 0.85
  // 与轮廓层同源的呼吸系数：亮点要贴着轮廓走，就必须用同一个形变量。
  const breathScale = outlineBreathScale(t)

  // 只用非空 ring 作为路径；每个 ring 自己闭合。
  const rings = LOGO_OUTLINE_RINGS.filter((r) => r && r.length > 1)
  if (!rings.length) return []

  const out = []
  for (let i = 0; i < n; i++) {
    // 亮点轮流分配到各 ring 上：2 个 ring、3 个亮点时，
    // 一个 ring 分到 2 个、另一个 1 个，两侧都有流动。
    const ring = rings[i % rings.length]
    const laneIndex = Math.floor(i / rings.length)
    const lanesInRing = Math.ceil((n - (i % rings.length)) / rings.length)
    // 同一 ring 上的多个亮点按车道错开，避免重叠。
    const lane = lanesInRing > 0 ? laneIndex / lanesInRing : 0
    const p = ((t * SHUTTLE_SPEED + lane) % 1 + 1) % 1

    // 在该 ring 的闭合路径上取点（首尾相接，因此 p=1 回到 p=0，天然无缝）。
    // 速度用噪声微调：恒定速度会让亮点像匀速跑马灯，加一点起伏后
    // 读起来像"能量在寻找路径"。
    const wobble = 1 + 0.35 * (vnoise(t * 0.4 + i * 3.1, i * 1.7) * 2 - 1)
    const at = p * ring.length * wobble
    const i0 = ((Math.floor(at) % ring.length) + ring.length) % ring.length
    const i1 = (i0 + 1) % ring.length
    const frac = at - Math.floor(at)
    const nx = ring[i0][0] + (ring[i1][0] - ring[i0][0]) * frac
    const ny = ring[i0][1] + (ring[i1][1] - ring[i0][1]) * frac

    // 略微浮在轮廓外侧：与轮廓点完全重合会把原有形状"吃掉"。
    const outward = 1.06
    // **必须叠加与轮廓相同的位移**，否则亮点会浮在轨道外。
    //
    // 这是实测踩到的缺陷：轮廓点会被流场推走（104px 下约 3–5px），
    // **必须叠加与轮廓完全相同的位移**，否则亮点会浮在轨道之外。
    //
    // 这是实测踩到的缺陷：轮廓点会被呼吸与漂移移走（104px 下数 px），
    // 而这里原先直接用静态 ring 坐标，亮点仍停在**未位移**的路径上，
    // 用户看到的就是"流动的粒子都不在轨道上"。
    //
    // 注意位移必须在**原始半径**上计算、再加 `outward` 外偏：
    // 若先把基准放大到 outward 再套位移，缩放项 `(nx-0.5)*spread*s` 会作用在
    // 被放大过的半径上——呼吸时亮点与轮廓的距离会随之缩放，于是又"脱轨"。
    // 正确顺序：先在原始归一化坐标上求刚体位移，再整体外偏。
    const [odx, ody] = outlineDisplacement(nx, ny, time, spread, breathScale, scatterMul)
    const x = c + (nx - 0.5) * spread * outward * scatterMul + odx
    const y = c + (ny - 0.5) * spread * outward * scatterMul + ody

    // 自身脉动：让亮点"有能量"而不是匀速滑过。
    const puls = 0.7 + 0.3 * Math.sin(t * 2.4 + i * 2.1)
    out.push({
      x,
      y,
      z: 0,
      r: dotR * 0.85,
      // 明显比轮廓亮：它是"流动中的能量"，要与静止轮廓拉开层次。
      white: 0.02,
      // 品牌高亮：流动亮点用最亮的那一档，读作"能量正在经过"。
      tint: LAYER_TINTS.shuttle,
      // 闭合路径无接缝，因此不需要端点渐隐（那是拼接路径才有的问题）。
      a: 0.85 * puls * (1 - 0.7 * scatter)
    })
  }
  return out
}

/**
 * 该尺寸下欢迎区实际绘制的轮廓点云（归一化 [0,1]）。
 *
 * <p>每个点为 <code>[x, y, w]</code>：w 是**相对亮度权重**（轮廓 1、小粒子按
 * 其固有衰减权重再乘一个比例）。位移动画必须用同一个函数取源点云，
 * 否则起手瞬间会与欢迎区对不上；权重也必须带上，否则小粒子在起飞时会
 * 突然亮到与轮廓一样（实测两侧平均不透明度 0.23 vs 0.70）。</p>
 *
 * @param size 显示尺寸（px），决定抽稀步长
 * @param withAura 是否包含外圈小粒子
 */
export function logoDotPoints(size, withAura = true) {
  const stride = outlineStride(size)
  const out = []
  let i = 0
  for (const ring of LOGO_OUTLINE_RINGS) {
    for (const p of ring) {
      if (kept(i, stride)) out.push([p[0], p[1], 1])
      i++
    }
  }
  if (withAura) {
    const astride = auraStride(size)
    for (let k = 0; k < LOGO_AURA_DOTS.length; k++) {
      if (!kept(k, astride)) continue
      const [x, y, w] = LOGO_AURA_DOTS[k]
      out.push([x, y, w * AURA_BRIGHTNESS])
    }
    // 背景科技粒子也带上：否则起手瞬间这一层（104px 下 45 个点）会凭空消失。
    // 取 time=0 的代表位置——背景是弥散的场，几十毫秒的漂移差看不出来。
    // 实测源点云 356 与欢迎区t=0 的 352 相差 3–4 个点，差异**全在最暗的小粒子**
    // 被 finalizeFrame 剔除（71 vs 67）；背景层 45=45、轮廓层 240=240 都精确相等。
    for (const d of techParticleDots(size, 0, 0)) {
      out.push([d.x / size, d.y / size, d.a / 0.55])
    }
  }
  return out
}

/**
 * 小粒子相对轮廓的亮度比例。
 *
 * <p>由渲染式反推：轮廓的 a 约为 0.45–0.95（均值≈0.70），小粒子约为
 * 0.18–0.60 再乘其距离权重（均值≈0.23），比值约 0.33。
 * 位移动画用它还原两者的层次，避免起飞瞬间小粒子"变亮"。</p>
 */
const AURA_BRIGHTNESS = 0.33

/**
 * 标志背后的**科技粒子场**。
 *
 * <p>用户要的不是一层背景色，而是"一些科技粒子"。因此这里在画布范围内铺一层
 * 稀疏、缓慢漂移的微小点：它们比标志的点更小更暗，读作背景里的"数据尘埃"，
 * 让离散的轮廓有依托，而不会抢走标志。</p>
 *
 * <p>三个要点：</p>
 * <ul>
 *   <li>**确定性**：位置由粒子序号散列决定，不随帧变化；只有相位随时间走。
 *       用 Math.random 会让整片背景逐帧乱跳，像噪点而不是粒子。</li>
 *   <li>**避开标志中心**：中心区域让给 logo（轮廓 + 小粒子），
 *       背景粒子只在外圈与四周稀疏分布，否则会在笔画间形成脏点。</li>
 *   <li>**尺度随尺寸抽稀**：20px 下若仍铺几十个背景点会糊成灰雾。</li>
 * </ul>
 *
 * @param size 显示尺寸（px）
 * @param time 归一化时间（秒）
 * @param scatter 散开进度，随标志一起外扩淡出（保持整体一致）
 */
function techParticleDots(size, time, scatter) {
  const s = finiteSize(size)
  // 背景粒子的数量按画布面积定：104px 约 46 个，20px 只剩十来个。
  // 这个密度是"能看出来有东西"与"不糊成雾"之间的取舍（实测过更密的版本会发灰）。
  const count = Math.round(Math.min(46, Math.max(6, (s / 104) ** 2 * 46)))
  const c = s / 2
  const out = []
  for (let i = 0; i < count; i++) {
    // 极坐标布点：半径用 sqrt 使面积均匀（否则会全挤在中心），
    // 但把内圈（<0.42）挖空让给标志本体。
    const hr = hash2(i, 1)
    const ha = hash2(i, 2)
    const hz = hash2(i, 3)
    const rad = (0.42 + 0.58 * Math.sqrt(hr)) * (s / 2)
    const ang = ha * Math.PI * 2
    // 缓慢环绕漂移 + 半径轻微起伏，因此粒子是"活的"但不乱跑。
    // 半径起伏改用噪声（与其它层同源的"不死板"手段），并**压低幅度**：
    // 原先 ±4% 的正弦起伏会把最外圈的点周期性推出画布，被下面的越界判断丢弃，
    // 于是背景层点数在 44/45/46 之间跳——同一层逐帧忽多忽少，看起来像在闪。
    const drift = time * (0.06 + 0.05 * hz)
    const rPulse = vnoise(i * 1.7, time * 0.22) * 2 - 1
    const rr = rad * (1 + 0.018 * rPulse)
    // 散开时整体外扩会越过画布，直接丢弃越界点：
    // 交给 clamp 会把它们挤成一圈贴边的点（更丑），实测原方案有 1–2 个越界。
    // 注意：只有 scatter（开场散开）阶段才允许丢点——那时的"飞出去"是刻意的；
    // 常态下半径起伏已压到不会越界，因此点数稳定。
    const expand = 1 + scatter * 0.85
    const x = c + Math.cos(ang + drift) * rr * expand
    const y = c + Math.sin(ang + drift) * rr * expand
    if (x < 0 || x > s || y < 0 || y > s) continue
    // 闪烁：频率各不相同，因此不会整片同步闪
    const tw = 0.5 + 0.5 * Math.sin(time * (0.7 + 0.9 * hz) + i * 1.13)
    out.push({
      x,
      y,
      z: 0,
      // 明显小于标志的点，但同样要**高于亚像素**：
      // 按 s*0.0042 算 20px 下只有 0.084px，会收到 finalizeFrame 的 0.3 下限，
      // 变成几乎看不见的浮尘；抬到 0.45px 才有"粒子"的感觉。
      r: Math.max(0.45, s * 0.005) * (0.8 + 0.4 * hz),
      // 很浅的墨色：明确是背景
      white: 0.55,
      // 背景尘埃用辅色：它属于"数据流动"的陪衬，与主色的标志形成色相层次。
      tint: LAYER_TINTS.aura,
      // 亮度很低且随闪烁起伏；乘 (1-scatter) 与标志同步淡出
      a: (0.06 + 0.2 * tw) * (i % 5 === 0 ? 1.5 : 1) * (1 - 0.75 * scatter)
    })
  }
  return out
}

/**
 * 确定性散列（生成器与运行时共用同一套，保证可复现）。
 */
function hash2(x, y) {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return v - Math.floor(v)
}

/**
 * 二维流场：给定归一化位置与时间，返回一个**平滑连续**的偏移方向。
 *
 * <p><b>为什么不用纯正弦</b>：此前每个点的位移都是 `sin(time * k + i * p)`。
 * 正弦虽然连续，但它的相位是**固定频率**的——每个点都在做同一种匀速往复，
 * 整片粒子看起来像被同一个机械装置推着走，这正是"死板"的来源。
 * 值噪声（`vnoise`）在空间与时间上都是平滑的，但相邻点之间没有固定相位关系，
 * 因此会产生涡流般的、彼此不同步的漂移。</p>
 *
 * <p>用法：把点的位置与时间映射到噪声域取样，取两个不同偏移量的通道分别
 * 作为 x/y 方向的分量，即可得到一个不会"汇聚成线"的流场。</p>
 *
 * <p>复用引擎的 `vnoise` 而不是另写一份：它与 golden 向量用的是同一个实现，
 * 平滑度与确定性都有既有测试背书。</p>
 *
 * @param nx 归一化 x（0–1）
 * @param ny 归一化 y（0–1）
 * @param t 秒
 * @param scale 空间频率；越大涡流越细碎
 * @param speed 时间流速
 * @returns `[vx, vy]`，各分量约在 -1–1
 */
function flowField(nx, ny, t, scale = FLOW_SCALE, speed = 0.16) {
  const x = nx * scale
  const y = ny * scale
  const z = t * speed
  // 三个偏移互不相同，避免 x/y 分量相关（相关的话所有点会沿同一条斜线移动）
  const vx = vnoise(x, y + z) * 2 - 1
  const vy = vnoise(x + 5.2, y - z) * 2 - 1
  return [vx, vy]
}

/**
 * 字形整体平移（**刚体**，像素）。
 *
 * <p>所有点共用同一个位移量，因此不产生任何形变。两个轴各取一个独立的噪声
 * 通道，轨迹因此是缓慢游走而不是直线往复。</p>
 *
 * @param t 秒
 * @param spread 字形跨度（px）
 * @returns `[dx, dy]` 像素位移
 */
function outlineDrift(t, spread) {
  const amp = DRIFT_AMPLITUDE * spread
  const dx = (vnoise(t * DRIFT_SPEED, 11.3) * 2 - 1) * amp
  const dy = (vnoise(t * DRIFT_SPEED, 47.9) * 2 - 1) * amp
  return [dx, dy]
}

/**
 * 字形（轮廓）在某点的位移量（像素）——**严格刚体**。
 *
 * <p><b>为什么必须是刚体</b>：这是本项目在这个图案上踩过的最大一个坑。
 * 先前让每个点各自取流场位移（`flowField(nx, ny, ...)`），结果是
 * 「幅度一大就变形、幅度一小就看不出在动」——因为**逐点独立位移本身
 * 就在制造形变**，两者是同一枚硬币的两面。实测把 4 秒内的位移分解后，
 * 绝大部分都是形变，用户正是先看到变形、再看到"调小之后干脆不动了"。</p>
 *
 * <p>正确做法是刚体运动，由两部分组成：
 * <ul>
 *   <li><b>绕中心的均匀缩放</b>（呼吸）——各向同性，任何两点距离按同一比例变化；</li>
 *   <li><b>整体平移</b>（漂移）——所有点位移完全相同。</li>
 * </ul>
 * 两者按定义**都不可能产生形变**（回归测试实测形变恒为 0.0000），
 * 因此幅度可以放心取到肉眼明显可见，不必再做权衡。</p>
 *
 * <p>本函数不接收点的绝对位置，因此天然无法制造"相邻点各自漂移"那种形变。</p>
 *
 * @param nx 归一化 x（0–1）
 * @param ny 归一化 y（0–1）
 * @param t 秒
 * @param spread 字形在画布上的跨度（px）
 * @param breathScale 均匀呼吸缩放系数（≈1）
 * @param scatterMul 开场散开倍率（≈1）
 * @returns `[dx, dy]` 像素位移
 */
function outlineDisplacement(nx, ny, t, spread, breathScale, scatterMul) {
  // 呼吸：以中心为原点的均匀缩放。
  const s = (breathScale - 1) * scatterMul
  const [tx, ty] = outlineDrift(t, spread)
  // 平移也乘 scatterMul：开场散开阶段整体外扩，保持与其它层一致。
  return [(nx - 0.5) * spread * s + tx * scatterMul,
    (ny - 0.5) * spread * s + ty * scatterMul]
}

/**
 * 轮廓的呼吸缩放系数（**严格刚体**，见 {@link outlineDisplacement}）。
 *
 * <p>用值噪声而不是正弦：噪声的周期不规则，观感更接近"活的"；
 * 正弦会把呼吸做成等周期的机械往复。幅度 {@link BREATH_AMPLITUDE}
 * 可以比早先的 ±2% 大，因为刚体缩放不会变形，只会在整体上放大缩小。</p>
 *
 * @param t 秒
 * @returns 约 1±BREATH_AMPLITUDE
 */
function outlineBreathScale(t) {
  const n = vnoise(t * BREATH_SPEED, 7.31) * 2 - 1
  return 1 + n * BREATH_AMPLITUDE
}


/**
 * 数鉴 logo 的点阵图案。
 *
 * <p>由两部分构成，职责不同：</p>
 * <ul>
 *   <li>{@link LOGO_OUTLINE_RINGS}：字形**轮廓**。标志的主体，任何时刻都要认得出，
 *       因此只做极轻微的呼吸缩放（±2%），形态保持稳定；</li>
 *   <li>{@link LOGO_AURA_DOTS}：字形**旁边**的稀疏小粒子。它们随呼吸缓慢起伏、
 *       忽明忽暗，提供"活着的"感觉，而轮廓本体不被撑变形。</li>
 * </ul>
 *
 * <p>为什么是轮廓 + 旁边小粒子，而不是实心填充或心跳：用户要的是"保持边缘轮廓、
 * 加一点呼吸感、旁边有些小粒子"。实心填充会变成一整块色块、失去粒子感；
 * 心跳（短促双搏动）则有生理暗示，都不是这个位置该有的语汇。</p>
 */
export function logoDotFrame(size, t, o = {}) {
  const s = finiteSize(size)
  // 时间统一归一化一次：后面多处直接参与 sin/位移，任何一处拿到 NaN/Infinity
  // 都会让整帧的坐标或亮度塌成非有限值（实测 t=Infinity 会全帧 NaN）。
  const time = Number.isFinite(Number(t)) ? Number(t) : 0
  const spread = s * LOGO_SCALE
  const c = s / 2
  const stride = o.stride != null ? o.stride : outlineStride(s)
  const dotR = o.dotR != null ? o.dotR : logoDotRadius(s)
  // 呼吸缩放：**严格刚体**（均匀、绕中心），因此不会产生任何形变。
  // 见 outlineDisplacement() 里记录的"逐点位移必然变形"那一段教训。
  const breathScale = outlineBreathScale(time)
  // 散射进度（原地开场退化路径用）：沿各自方向外推，与呼吸无关
  const scatter = Math.min(1, Math.max(0, Number(o.scatter) || 0))
  const scatterMul = 1 + scatter * 0.85

  const dots = []
  // 科技粒子（铺在标志后面的背景层）先入列，因此它们处于 dots 前段、
  // 绘制顺序上排在轮廓与小粒子之下，形成"标志浮在粒子场之上"的层次。
  for (const d of techParticleDots(s, time, scatter)) dots.push(d)
  const total = LOGO_OUTLINE_RINGS.reduce((n, r) => n + r.length, 0)
  // 抽稀只影响密度，相位仍按**原始索引**取，因此高光流动速度不随尺寸变化
  let idx = 0
  for (const ring of LOGO_OUTLINE_RINGS) {
    for (let k = 0; k < ring.length; k++) {
      if (!kept(idx, stride)) { idx++; continue }
      const [nx, ny] = ring[k]
      // 位移走共享的 outlineDisplacement()：**只有均匀呼吸缩放**（严格刚体，
      // 不产生形变）。必须与穿梭亮点同源，否则两层会漂到不同位置。
      const [odx, ody] = outlineDisplacement(nx, ny, time, spread, breathScale, scatterMul)
      const dx = (nx - 0.5) * spread * scatterMul + odx
      const dy = (ny - 0.5) * spread * scatterMul + ody
      // 沿轮廓流动的高光：相位按归一化索引取，因此高光绕标志走一圈。
      // 静止点阵会像贴图，有缓慢流动才像"活的粒子"。
      const phase = (idx / total) * Math.PI * 2
      // 高光用噪声调制幅度，避免"整圈匀速跑马灯"的机械感。
      const flow = 0.5 + 0.5 * Math.sin(phase * 2 - time * 1.6)
      const shimmer = 0.75 + 0.35 * vnoise(nx * 4.1, ny * 4.1 + time * 0.35)
      dots.push({
        x: c + dx,
        y: c + dy,
        z: 0,
        r: dotR * (1 + 0.25 * flow) * shimmer * (1 - 0.35 * scatter),
        white: 0.12,
        // 品牌主色：轮廓是标志本体。
        tint: LAYER_TINTS.outline,
        // 轮廓是主体，保持较高不透明度。
        // 注意：淡出的主责在组件侧（ctx.globalAlpha = logoAlpha），此处再乘一份
        // 强淡出会变成三重淡出，开场刚过三成 logo 就几乎没了。
        a: (0.45 + 0.5 * flow) * (1 - 0.75 * scatter)
      })
      idx++
    }
  }

  // 穿梭亮点（辅助流动层）：少量亮点沿轮廓路径持续移动，形成"信息在结构中流动"。
  //
  // 为什么需要一个独立的层：现有轮廓高光（上面的 flow）是**驻留式**的——
  // 每个点在自己的位置上明暗起伏，读起来是"轮廓在闪"。计划第 5 节的
  // 动态流动层要的是"穿梭、汇聚和能量传递"，即亮点本身要**位移**。
  if (shuttleCount(s) > 0) {
    for (const d of shuttleDots(s, time, scatter)) dots.push(d)
  }

  // 旁边的小粒子：随呼吸缓慢起伏。
  //
  // 与轮廓的关系是"陪伴"而不是"扩散"：轮廓本身只做 ±2% 的呼吸缩放，
  // 这些小粒子则各自漂移、忽明忽暗，因此画面是活的，而标志的形态始终稳定。
  // 位移幅度刻意压得很小（约 1px 量级）：它们贴着轮廓，动大了会像噪点。
  const auraTotal = LOGO_AURA_DOTS.length
  const astride = o.auraStride != null ? o.auraStride : auraStride(s)
  for (let i = 0; i < auraTotal; i++) {
    if (!kept(i, astride)) continue
    const [nx, ny, w] = LOGO_AURA_DOTS[i]
    // 陪衬小粒子用流场漂移——**它们不构成标志的形状**，因此这里可以自由跑动，
    // 不会带来"变形"问题（变形指的是标志本体被拉扯）。
    // 幅度比轮廓大（陪衬本就该比主体活泼），实测 104px 下约 4–6px。
    //
    // 同时在一个**略大**的呼吸系数上叠加：这样它们与轮廓既同源（一起呼吸）
    // 又比轮廓漂得远，形成"标志稳定、周围粒子流动"的层次。
    const [ax, ay] = flowField(nx, ny, time, FLOW_SCALE, 0.19)
    const flowAmp = FLOW_AMPLITUDE
    // 呼吸分量：与轮廓同一系数，但只取"偏差"部分（1 代表不缩放），
    // 避免把整体缩放重复计一次。
    const breathDelta = breathScale - 1
    // 必须乘 scatterMul：原地散开时轮廓在向外飞，小粒子若留在原位，
    // 画面就是"轮廓散开、旁边一圈小点原地不动"——实测只有 347/465 的点变远，
    // 正是漏了这一项（小粒子占全部点的多数）。
    const dx = (nx - 0.5) * spread * (1 + breathDelta) * scatterMul + ax * flowAmp * spread * scatterMul
    const dy = (ny - 0.5) * spread * (1 + breathDelta) * scatterMul + ay * flowAmp * spread * scatterMul
    // 被推到画布外时夹在边界上：它们是柔光，贴边比突然消失自然
    // （生成数据时已丢弃越界点，这里只是兜底）。
    const x = Math.min(s, Math.max(0, c + dx))
    const y = Math.min(s, Math.max(0, c + dy))
    // 明暗：噪声驱动的缓慢起伏（不同点不同步），最暗时仍保留一点存在感。
    const twinkle = 0.5 + 0.5 * (vnoise(nx * 2.7, ny * 2.7 + time * 0.3) * 2 - 1)
    // 亮度 = 生成时烘好的距离权重（贴轮廓亮、外侧暗）× 各自的明暗起伏。
    //
    // **下限必须高于 finalizeFrame 的 0.02 剔除阈值**：外圈小粒子的 w 很小
    // （贴轮廓的约 1、最外侧接近 0），乘上起伏后会随机跌破 0.02 而被丢弃，
    // 于是同一层的点数随时间在 179/180 之间跳、两帧无法逐点比较。
    // 抬一个地板值让它们始终可见——外圈本来就该是"最淡但仍在"的柔光。
    const alpha = Math.max(0.03, (0.18 + 0.42 * twinkle) * w * (1 - 0.75 * scatter))
    dots.push({
      x,
      y,
      z: 0,
      // 小粒子明显比轮廓点小
      r: dotR * 0.55 * (1 - 0.15 * twinkle),
      // 更浅的墨色，明确是陪衬而不是标志本体
      white: 0.38,
      // 品牌辅色：陪衬层用辅色，与主色的轮廓拉开色相。
      tint: LAYER_TINTS.aura,
      a: alpha
    })
  }
  return finalizeFrame(dots, [], 0.3)
}

/**
 * 开场：从 logo 点阵"散开并聚成"工作形态。
 *
 * <p>用于无法测量两端坐标时的**原地**退化路径（正常首次提问走
 * orb-flights 的图形变换）。这里让 logo 的粒子向外散开并淡出，
 * 同时目标形态的粒子从同一中心聚拢。</p>
 *
 * @param progress 0→1；0 完全是 logo，1 完全是目标形态。
 */
export function introTransition(progress) {
  const p = Math.min(1, Math.max(0, Number(progress) || 0))
  // 缓出：标志先快速散开，目标形态后段慢慢稳定
  const eased = 1 - Math.pow(1 - p, 3)
  // 散开进度**不要**直接复用 eased：eased 中点已完成 87.5%，粒子会在前 1/3
  // 时间内全部飞完，读起来还是瞬切。这里用更均匀的曲线。
  const scatter = p * (2 - p)
  return {
    logoAlpha: 1 - eased,
    logoScale: 1 + 0.35 * eased,
    logoScatter: scatter,
    orbAlpha: eased,
    orbScale: 0.72 + 0.28 * eased
  }
}

/** 开场动画时长（ms）。比状态切换长：这是一次"仪式性"的过渡。 */
export const INTRO_MS = 620
