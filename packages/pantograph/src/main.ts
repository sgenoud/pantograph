export { draw } from "./draw";
export { fuse, fuseAll, cut, intersect } from "./operations";

export { exportSVG, svgBody } from "./export/svg/exportSVG";

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
} from "./models/exports";
