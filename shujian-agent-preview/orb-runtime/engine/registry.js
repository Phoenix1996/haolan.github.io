/* 本文件源自 thinking-orbs@0.3.1 (MIT, Copyright (c) 2026 Jakub Antalik)。
   上游 https://github.com/Jakubantalik/Libraries.dev ，仅做 TS→JS 类型剥离，未改动任何数学。
   重新生成与校验方式见同目录 README.md。 */
import { paintFrame } from "./core.js";
import { frameBraid } from "./braid.js";
import { frameGlobe, frameRubik, frameWave } from "./lattice.js";
import { frameMorph } from "./morph.js";
import { frameOrbits } from "./orbits.js";
import { frameRibbon } from "./ribbon.js";
import { frameWeb } from "./web.js";
/*!
 * The portable surface: pure geometry, no canvas. The React Native port
 * imports exactly these functions, so its output is identical to the web's
 * by construction rather than by re-implementation.
 */
const MODE_FRAMES = {
  orbits: frameOrbits,
  globe: frameGlobe,
  rubik: frameRubik,
  wave: frameWave,
  web: frameWeb,
  braid: frameBraid,
  ribbon: frameRibbon,
  // ring shares ribbon's geometry — the `faceOn` profile flag switches it
  ring: frameRibbon,
  morph: frameMorph
};
/*! Canvas painters, derived from the geometry. The 2D-canvas binding. */
const MODE_DRAWS = Object.fromEntries(
  Object.entries(MODE_FRAMES).map(([key, frame]) => [
    key,
    (ctx, size, t, dark, opts) => paintFrame(ctx, frame(size, t, opts), dark)
  ])
);
export {
  MODE_DRAWS,
  MODE_FRAMES
};
