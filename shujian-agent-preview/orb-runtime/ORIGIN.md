# Orb 预览源码来源与许可

本目录是独立静态预览使用的浏览器 ESM 副本，来自当前 DataEase 1.5.1：

- `frontend/src/components/cxai/orbs/engine/`
- `frontend/src/components/cxai/orbs/index.js`
- `frontend/src/components/cxai/orbs/presets.js`
- `frontend/src/components/cxai/orbs/palette.js`
- `frontend/src/components/cxai/orbs/agent-states.js`
- `frontend/src/components/cxai/orbs/orb-patterns.js`
- `frontend/src/components/cxai/orbs/logo-outline.js`
- `frontend/src/components/cxai/orbs/logo-aura.js`
- `frontend/src/components/cxai/orbs/orb-fade.js`

粒子引擎副本保留其原有文件头和目录内 `LICENSE`。该许可文件随代码副本一起提供。没有复制 Vue 组件或安装新的渲染框架。

`orb-canvas.js` 是仅供预览的 Canvas 适配器：它直接调用上述引擎、`resolveAgentState`、项目 Logo 点阵、调色板和 `orb-fade.js`。状态切换沿用项目的 420ms smoothstep 交叉淡入与缩放规则，同一张 Canvas 保持运行；它没有另外绘制一套相似粒子，也没有改变正式组件。

状态名称和颜色以当前源码为准，而非可能过时的仓库 README：主题色来自 `palette.js`，业务状态映射来自 `agent-states.js`。欢迎区使用 `logoDotFrame`；等待、任务完成和语音演示分别调用真实的引擎状态。静态页不会连接任务 API、麦克风或数据库。

所有预览依赖均随目录提供，不从 CDN 加载。源代码及引擎许可证应与本文件一起保留。
