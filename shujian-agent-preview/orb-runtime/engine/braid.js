/* 本文件源自 thinking-orbs@0.3.1 (MIT, Copyright (c) 2026 Jakub Antalik)。
   上游 https://github.com/Jakubantalik/Libraries.dev ，仅做 TS→JS 类型剥离，未改动任何数学。
   重新生成与校验方式见同目录 README.md。 */
import { fibDir, finalizeFrame, frac, makeProj, radiusScale } from "./core.js";
const frameBraid = (size, t, o) => {
  var _a, _b, _c, _d, _e, _f;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 * 0.76;
  const pt = makeProj(t * 0.4, 0.3, cx, cy, 1);
  const rs = radiusScale(size, (_a = o.rsPow) != null ? _a : 0.6);
  const dots = [];
  const ghostN = (_b = o.ghostN) != null ? _b : 150;
  for (let i = 0; i < ghostN; i++) {
    const d = fibDir(i, ghostN);
    const [px, py, z] = pt(d[0] * R, d[1] * R, d[2] * R);
    const depth = (z / R + 1) / 2;
    dots.push({ x: px, y: py, z, r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * depth });
  }
  const strandN = (_c = o.strandN) != null ? _c : 52;
  const turns = (_d = o.turns) != null ? _d : 3;
  for (let s = 0; s < 3; s++) {
    const phase = s / 3 * 2 * Math.PI;
    for (let i = 0; i < strandN; i++) {
      const u = (frac(i / strandN + t * 0.045) * 2 - 1) * 0.96;
      const surf = Math.sqrt(Math.max(0, 1 - u * u));
      const endFade = Math.min(1, (1 - Math.abs(u)) / 0.1);
      const a = u * Math.PI * turns + phase;
      const weave = 1 + 0.075 * Math.sin(u * Math.PI * turns * 2 + phase * 2 + t * 0.8);
      const rr = surf * R * weave;
      const [px, py, zr] = pt(Math.cos(a) * rr, u * R * weave, Math.sin(a) * rr);
      const depth = (zr / R + 1) / 2;
      dots.push({
        x: px,
        y: py,
        z: zr,
        r: (((_e = o.rBase) != null ? _e : 1.2) + ((_f = o.rDepth) != null ? _f : 1.8) * depth) * rs,
        white: 0.55 - 0.45 * depth,
        a: endFade * (0.45 + 0.55 * depth)
      });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
};
export {
  frameBraid
};
