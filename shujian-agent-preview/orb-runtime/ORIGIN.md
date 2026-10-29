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

`orb-canvas.js` 是仅供预览的 Canvas 适配器：它直接调用上述引擎、`resolveAgentState`、项目 Logo 点阵、调色板和 `orb-morph.js`。同一张 Canvas 保持运行，它没有另外绘制一套相似粒子，也没有改变正式组件。

**状态切换不再沿用生产组件的 420ms 交叉淡入。** 那个过渡只混合透明度并绕中心缩放，两个形态各自溶解，同一颗粒子在画面上是"消失又重生"。预览页改为逐粒位移：每一帧同时采样旧形态与新形态，把点按绕中心的角度排序后做秩配对，再按各自进度插值位置、半径、透明度与明暗（`orb-morph.js`；总时长 560ms，每颗粒子错峰 0–168ms 起跳，ease-out-quart 落位）。过渡中途再切换时，以**画面上的当前混合态**作为下一次的起点，因此连发的状态事件不会跳帧。`orb-fade.js` 仍原样保留（生产组件在用），预览只用它的 `shouldStartFade` 判断"这次变化该不该做动画"——减少动效、暂停、没有旧快照三种情况仍然直接切换。

状态名称和颜色以当前源码为准，而非可能过时的仓库 README：主题色来自 `palette.js`，业务状态映射来自 `agent-states.js`。欢迎区使用 `logoDotFrame`；等待、任务完成和语音演示分别调用真实的引擎状态。静态页不会连接任务 API、麦克风或数据库。

所有预览依赖均随目录提供，不从 CDN 加载。源代码及引擎许可证应与本文件一起保留。
