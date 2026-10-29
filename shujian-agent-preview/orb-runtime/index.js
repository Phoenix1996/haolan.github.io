/* 数鉴智能体思考动画：内置引擎的统一出口。
   引擎来自 thinking-orbs@0.3.1（MIT，Copyright (c) 2026 Jakub Antalik），
   来源与校验方式见 ./README.md。组件层见 ./ShujianOrb.vue。 */
export {
  MODE_DRAWS,
  MODE_FRAMES,
  STATE_TO_MODE,
  finalizeFrame,
  makeProj,
  paint,
  paintFrame,
  paintLines,
  radiusScale,
  resolvePreset
} from './engine/index.js'

/* 品牌色板：粒子的主色/辅色/高亮与完成脉冲曲线。
   唯一定义处见 ./palette.js，其它模块只 import，不写字面量。 */
export {
  BRAND_HIGHLIGHT,
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  BRAND_VIOLET,
  ORB_BRAND_COLOR,
  completionPulse,
  hexToRgb,
  mixHex
} from './palette.js'
