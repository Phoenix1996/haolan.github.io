/* 本文件源自 thinking-orbs@0.3.1 (MIT, Copyright (c) 2026 Jakub Antalik)。
   上游 https://github.com/Jakubantalik/Libraries.dev ，仅做 TS→JS 类型剥离，未改动任何数学。
   重新生成与校验方式见同目录 README.md。 */
import { angleDelta, finalizeFrame, hashD, makeProj, radiusScale } from "./core.js";
function solveCycle(time, count, slotDur, rest) {
  const cyc = 2 * count * slotDur + rest;
  const tc = time % cyc;
  const amount = new Array(count).fill(0);
  let active = -1;
  if (tc < 2 * count * slotDur) {
    const slot = Math.floor(tc / slotDur);
    const p = (tc - slot * slotDur) / slotDur;
    const cl = Math.min(1, p / 0.7);
    const ep = 1 - (1 - cl) ** 3;
    if (slot < count) {
      for (let i = 0; i < slot; i++) amount[i] = 1;
      amount[slot] = ep;
      active = slot;
    } else {
      const u = 2 * count - 1 - slot;
      for (let i = 0; i < u; i++) amount[i] = 1;
      amount[u] = 1 - ep;
      active = u;
    }
  }
  return { amount, active };
}
function applyMoves(pt3, moves, sc) {
  let [x, y, z] = pt3;
  let inActive = false;
  for (let i = 0; i < moves.length; i++) {
    if (sc.amount[i] <= 0) continue;
    const mv = moves[i];
    const coord = mv.axis === 0 ? x : mv.axis === 1 ? y : z;
    if (coord < mv.lo || coord >= mv.hi) continue;
    if (i === sc.active) inActive = true;
    const a = mv.ang * sc.amount[i];
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    if (mv.axis === 0) {
      const y2 = y * ca - z * sa;
      z = y * sa + z * ca;
      y = y2;
    } else if (mv.axis === 1) {
      const x2 = x * ca + z * sa;
      z = -x * sa + z * ca;
      x = x2;
    } else {
      const x2 = x * ca - y * sa;
      y = x * sa + y * ca;
      x = x2;
    }
  }
  return [x, y, z, inActive];
}
function makeMoves(count) {
  const moves = [];
  for (let i = 0; i < count; i++) {
    const axis = Math.min(2, Math.floor(hashD(i, 2.3) * 3));
    const lo = -1 + 0.5 * Math.min(3, Math.floor(hashD(i, 5.9) * 4));
    const dir = hashD(i, 7.7) < 0.5 ? 1 : -1;
    moves.push({ axis, lo, hi: lo + 0.5, ang: dir * Math.PI / 2 });
  }
  return moves;
}
const frameGlobe = (size, t, o) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const spin = 0.5;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 * 0.82;
  const tilt = 0.4 + 0.06 * Math.sin(t * 0.35);
  const pt = makeProj(t * spin, tilt, cx, cy, radius);
  const scan = t * (spin + (1.7 - spin) * ((_a = o.scanMul) != null ? _a : 1));
  const rs = radiusScale(size, (_b = o.rsPow) != null ? _b : 0.6);
  const dimBase = (_c = o.dimBase) != null ? _c : 1;
  const dots = [];
  const latRings = (_d = o.latRings) != null ? _d : 17;
  const lonDensity = (_e = o.lonDensity) != null ? _e : 44;
  for (let li = 0; li <= latRings; li++) {
    const lat = -Math.PI / 2 + li / latRings * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = lj / lonCount * 2 * Math.PI;
      const [px, py, z] = pt(cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon));
      const depth = (z + 1) / 2;
      const d = angleDelta(lon + t * spin, scan);
      const boost = Math.exp(-(d * d) / 0.18) * Math.max(0, z);
      dots.push({
        x: px,
        y: py,
        z,
        r: (((_f = o.rBase) != null ? _f : 0.6) + ((_g = o.rDepth) != null ? _g : 1.7) * depth + ((_h = o.rBoost) != null ? _h : 1) * boost) * rs,
        white: ((_i = o.inkFar) != null ? _i : 0.62) - ((_j = o.inkSpan) != null ? _j : 0.54) * depth,
        // dimBase < 1 fades un-scanned dots so the meridian reads clearly
        a: dimBase + (1 - dimBase) * Math.min(1, boost)
      });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
};
const frameRubik = (size, t, o) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 * 0.82;
  const pt = makeProj(t * 0.55, 0.35 + 0.1 * Math.sin(t * 0.9), cx, cy, R);
  const rs = radiusScale(size, (_a = o.rsPow) != null ? _a : 0.6);
  const moveCount = (_b = o.moveCount) != null ? _b : 14;
  const moves = makeMoves(moveCount);
  const sc = solveCycle(t, moveCount, 0.42, 1.2);
  const dots = [];
  const latRings = (_c = o.latRings) != null ? _c : 15;
  const lonDensity = (_d = o.lonDensity) != null ? _d : 40;
  for (let li = 0; li <= latRings; li++) {
    const lat = -Math.PI / 2 + li / latRings * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = lj / lonCount * 2 * Math.PI;
      const [x, y, z, inActive] = applyMoves([cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon)], moves, sc);
      const [px, py, zr] = pt(x, y, z);
      const depth = (zr + 1) / 2;
      dots.push({
        x: px,
        y: py,
        z: zr,
        r: (((_e = o.rBase) != null ? _e : 0.6) + ((_f = o.rDepth) != null ? _f : 1.7) * depth + (inActive ? (_g = o.rActive) != null ? _g : 0.3 : 0)) * rs,
        white: ((_h = o.inkFar) != null ? _h : 0.62) - ((_i = o.inkSpan) != null ? _i : 0.54) * depth - (inActive ? 0.14 : 0)
      });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
};
const frameWave = (size, t, o) => {
  var _a, _b, _c, _d, _e;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 * 0.874;
  const pt = makeProj(t * 0.18, 0.38, cx, cy, 1);
  const rs = radiusScale(size, (_a = o.rsPow) != null ? _a : 0.6);
  const dots = [];
  const rings = (_b = o.rings) != null ? _b : 15;
  const lonDensity = (_c = o.lonDensity) != null ? _c : 40;
  for (let ri = 0; ri <= rings; ri++) {
    const lat = -Math.PI / 2 + ri / rings * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const w = 0.62 * Math.sin(t * 2.1 - ri * 0.52) + 0.38 * Math.sin(t * 1.27 + ri * 0.83);
    const rr = R * (0.88 + 0.105 * w);
    const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = lj / lonCount * 2 * Math.PI;
      const [px, py, z] = pt(cosLat * Math.cos(lon) * rr, sinLat * rr, cosLat * Math.sin(lon) * rr);
      const depth = (z / R + 1) / 2;
      const crest = Math.max(0, w);
      dots.push({
        x: px,
        y: py,
        z,
        r: (((_d = o.rBase) != null ? _d : 0.6) + ((_e = o.rDepth) != null ? _e : 1.7) * depth) * (1 + 0.4 * crest) * rs,
        white: 0.66 - 0.56 * depth - 0.1 * crest
      });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
};
export {
  frameGlobe,
  frameRubik,
  frameWave
};
