import type { Vector } from "./definitions";
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
} from "./models/exports";

export { draw } from "./draw";
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
} from "./operations";

export { exportSVG, svgBody } from "./export/svg/exportSVG";

export { exportJSON } from "./export/json/exportJSON";
export { importJSON } from "./import/json/importJSON";
