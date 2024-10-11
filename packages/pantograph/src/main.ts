import type { Vector } from "./definitions.js";
export { Vector };

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function polarToCartesian(r: number, theta: number): Vector {
  const x = Math.cos(theta * DEG2RAD) * r;
  const y = Math.sin(theta * DEG2RAD) * r;
  return [x, y];
}

export function cartesianToPolar([x, y]: Vector): [number, number] {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x) * RAD2DEG;
  return [r, theta];
}

export type {
  Diagram,
  Figure,
  Loop,
  Strand,
  Stroke,
  TransformationMatrix,
  BoundingBox,
  Segment,
  Line,
  Arc,
  EllipseArc,
  CubicBezier,
} from "./models/exports.js";

export { draw } from "./draw.js";
export {
  // Surface booleans
  fuseAll,
  fuse,
  cut,
  intersect,
  // Strand booleans
  eraseStrand,
  confineStrand,
  // Offset
  offset,
  outlineStroke,
} from "./operations.js";

export { exportSVG, svgBody } from "./export/svg/exportSVG.js";

export { exportJSON } from "./export/json/exportJSON.js";
export { importJSON } from "./import/json/importJSON.js";

export { stitchAsLoops, segmentsGraph } from "./algorithms/stitchSegments.js";
