/* 本文件源自 thinking-orbs@0.3.1 (MIT, Copyright (c) 2026 Jakub Antalik)。
   上游 https://github.com/Jakubantalik/Libraries.dev ，仅做 TS→JS 类型剥离，未改动任何数学。
   重新生成与校验方式见同目录 README.md。 */
import { finalizeFrame } from "./core.js";
function smoothE(x) {
  return x * x * (3 - 2 * x);
}
function polyPath(verts) {
  const V = verts.length;
  const L = [];
  let total = 0;
  for (let i = 0; i < V; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % V];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    L.push(l);
    total += l;
  }
  return (f) => {
    let target = f * total;
    let i = 0;
    while (target > L[i] && i < V - 1) {
      target -= L[i];
      i++;
    }
    const a = verts[i];
    const b = verts[(i + 1) % V];
    const ff = L[i] ? Math.min(1, target / L[i]) : 0;
    return [a[0] + (b[0] - a[0]) * ff, a[1] + (b[1] - a[1]) * ff];
  };
}
const CIRCLE = (f) => {
  const a = -Math.PI / 2 + f * 2 * Math.PI;
  return [Math.cos(a) * 0.24, Math.sin(a) * 0.24];
};
const TRIANGLE = polyPath([
  [0, -0.26],
  [0.24, 0.16],
  [-0.24, 0.16]
]);
const SQUARE = polyPath([
  [0, -0.2],
  [0.2, -0.2],
  [0.2, 0.2],
  [-0.2, 0.2],
  [-0.2, -0.2]
]);
const CYCLE = [CIRCLE, TRIANGLE, SQUARE];
function morphN(d) {
  return Math.max(6, Math.round(34 * d));
}
const HOLD = 1.4;
const MORPH = 0.9;
const SEG = HOLD + MORPH;
const frameMorph = (size, t, o) => {
  var _a, _b, _c;
  const K = CYCLE.length;
  const tc = t % (SEG * K);
  const k = Math.floor(tc / SEG);
  const local = tc - k * SEG;
  const m = local > HOLD ? smoothE((local - HOLD) / MORPH) : 0;
  const sprd = (_a = o.spread) != null ? _a : 1;
  const pA = CYCLE[k];
  const pB = CYCLE[(k + 1) % K];
  const M = 160;
  const pts = [];
  for (let i = 0; i < M; i++) {
    const f = i / M;
    const a = pA(f);
    const b = pB(f);
    pts.push([(a[0] + (b[0] - a[0]) * m) * sprd, (a[1] + (b[1] - a[1]) * m) * sprd]);
  }
  const L = [];
  let total = 0;
  for (let i = 0; i < M; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % M];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    L.push(l);
    total += l;
  }
  const n = morphN((_b = o.iconD) != null ? _b : 1);
  const re = ((_c = o.rDot) != null ? _c : 0.021) * 1.35 * sprd;
  const pulse = 1 + 0.02 * Math.sin(local * 3.1);
  const dots = [];
  const c2 = size / 2;
  let seg = 0;
  let acc = 0;
  for (let k2 = 0; k2 < n; k2++) {
    const target = k2 / n * total;
    while (acc + L[seg] < target && seg < M - 1) {
      acc += L[seg];
      seg++;
    }
    const a = pts[seg];
    const b = pts[(seg + 1) % M];
    const f = L[seg] ? Math.min(1, (target - acc) / L[seg]) : 0;
    const x = (a[0] + (b[0] - a[0]) * f) * pulse;
    const y = (a[1] + (b[1] - a[1]) * f) * pulse;
    dots.push({
      x: c2 + x * size,
      y: c2 + y * size,
      z: 0,
      r: Math.max(0.35, re * size),
      white: 0.1
    });
  }
  return finalizeFrame(dots, [], o.rMin);
};
export {
  frameMorph
};
