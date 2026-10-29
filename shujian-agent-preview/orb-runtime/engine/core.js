/* 本文件源自 thinking-orbs@0.3.1 (MIT, Copyright (c) 2026 Jakub Antalik)。
   上游 https://github.com/Jakubantalik/Libraries.dev ，仅做 TS→JS 类型剥离，未改动任何数学。
   重新生成与校验方式见同目录 README.md。 */
/*! A stroked edge between two projected points (the `connecting` web). */
/*!
 * One rendered instant: a complete, final set of draw instructions.
 * `dots` is already z-sorted into draw order and radius-clamped; `lines`
 * are drawn first. Nothing here needs further interpretation, which is what
 * makes a frame portable to any 2D renderer.
 */
function lerp(a, b, f) {
  return a + (b - a) * f;
}
function frac(x) {
  return x - Math.floor(x);
}
/*! Value noise on a 2D lattice — smooth, deterministic, cheap. */
function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let fx = x - xi;
  let fy = y - yi;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = hashD(xi, yi);
  const b = hashD(xi + 1, yi);
  const c = hashD(xi, yi + 1);
  const d = hashD(xi + 1, yi + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
/*! Deterministic hash in [0, 1). */
function hashD(a, b) {
  const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return h - Math.floor(h);
}
/*! Stable directions on a unit sphere (Fibonacci lattice). */
function fibDir(i, n) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - 2 * (i + 0.5) / n;
  const rad = Math.sqrt(1 - y * y);
  const a = i * golden;
  return [rad * Math.cos(a), y, rad * Math.sin(a)];
}
/*! Shortest signed angular distance, wrapped to (-π, π]. */
function angleDelta(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}
/*! Shared spin + tilt + orthographic projection. */
function makeProj(yaw, tilt, cx, cy, scale) {
  const st = Math.sin(tilt);
  const ct = Math.cos(tilt);
  const sy = Math.sin(yaw);
  const cyw = Math.cos(yaw);
  return (x, y, z) => {
    const x1 = x * cyw + z * sy;
    const z1 = -x * sy + z * cyw;
    const y1 = y * ct - z1 * st;
    const z2 = y * st + z1 * ct;
    return [cx + x1 * scale, cy - y1 * scale, z2];
  };
}
/*!
 * Painter: z-sort far→near, matte grayscale dots. On dark substrates the
 * ink value is mirrored (1 - white) so near dots read bright — the same
 * depth language on an inverted substrate.
 */
/*!
 * 墨色计算。tint 分支从上游 0.3.2 原样移植（0.3.1 源码里还没有这个参数）。
 *
 * <p>为什么要把 0.3.2 的 tint 移植进来，而不是自己写一套染色：
 * 上游的着色不是简单替换颜色，而是**保留深度明暗**——每个点仍按 white 在
 * 品牌色与基底色之间插值（浅底向白走、深底向黑走），因此彩色球的立体感
 * 与灰度版完全一致。自己写一套必然丢掉这层 ramp，球会变成一坨平色。</p>
 *
 * <p>几何部分（上面的 hashD/fibDir/makeProj 等）仍严格保持 0.3.1，
 * 由 golden 向量逐值钉住；tint 只影响绘制，不参与几何，因此不影响那套校验。</p>
 */
function inkColor(w, alpha, dark, tint) {
  if (!tint) {
    const g = Math.round((dark ? 1 - w : w) * 255);
    return `rgba(${g},${g},${g},${alpha})`;
  }
  const ramp = (c) => Math.round(dark ? c * (1 - w) : c + (255 - c) * w);
  return `rgba(${ramp(tint.r)},${ramp(tint.g)},${ramp(tint.b)},${alpha})`;
}
function paint(ctx, dots, dark, rMin = 0.3, tint) {
  var _a;
  for (const d of dots) {
    const alpha = (_a = d.a) != null ? _a : 1;
    const w = Math.min(1, Math.max(0, d.white));
    // 逐点 tint 覆盖：自定义图案可以给某一层指定自己的品牌色
    // （主色画轮廓、辅色画陪衬、高亮画流动亮点）。仍然走同一条 inkColor
    // ramp，因此层次与深度明暗的规则完全一致，只是色相不同。
    // 未指定时用调用方的 tint，因此 `color` prop 对未分层的图案照旧生效。
    ctx.fillStyle = inkColor(w, alpha, dark, d.tint || tint);
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
}
/*! Stroke pass for edge-based modes. Runs before `paint` so nodes sit on top. */
function paintLines(ctx, lines, dark, tint) {
  var _a;
  for (const l of lines) {
    const alpha = (_a = l.a) != null ? _a : 1;
    const w = Math.min(1, Math.max(0, l.white));
    ctx.strokeStyle = inkColor(w, alpha, dark, l.tint || tint);
    ctx.lineWidth = l.w;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
  }
}
/*!
 * Turn raw mode output into a finished frame: drop invisible marks, clamp
 * radii to the mode's floor, and z-sort far→near into draw order.
 *
 * This runs in the GEOMETRY step, not the painter, so a frame is a complete
 * set of draw instructions: every value is final and the array order is the
 * order to draw in. That is what lets the RN and SwiftUI ports share this
 * output verbatim — a port draws the list, it never re-derives anything —
 * and what lets the golden-vector tests compare numbers instead of pixels.
 */
function finalizeFrame(dots, lines, rMin = 0.3) {
  var _a;
  const visible = [];
  for (const d of dots) {
    if (((_a = d.a) != null ? _a : 1) < 0.02) continue;
    d.r = Math.max(rMin, d.r);
    visible.push(d);
  }
  visible.sort((a, b) => a.z - b.z);
  return { dots: visible, lines: lines.filter((l) => {
    var _a2;
    return ((_a2 = l.a) != null ? _a2 : 1) >= 0.02;
  }) };
}
/*! Paint a finished frame. Lines first, so nodes sit on top of their edges. */
function paintFrame(ctx, frame, dark, tint) {
  if (frame.lines.length) paintLines(ctx, frame.lines, dark, tint);
  paint(ctx, frame.dots, dark, 0.3, tint);
}
/*!
 * Dot radii were tuned for a 300pt frame; sub-linear scaling keeps small
 * spinners legible. Lower pow = radii shrink less with size.
 */
function radiusScale(size, pow) {
  return (size / 300) ** pow;
}
export {
  angleDelta,
  fibDir,
  finalizeFrame,
  frac,
  hashD,
  lerp,
  makeProj,
  paint,
  paintFrame,
  paintLines,
  radiusScale,
  vnoise
};
