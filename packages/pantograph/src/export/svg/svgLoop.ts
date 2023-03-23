import type { Loop } from "../../models/Loop";
import { svgSegmentToPath } from "./svgSegment";

export function svgLoop(loop: Loop) {
  const start = `M ${loop.firstPoint.join(" ")}`;
  const segments = loop.segments.map(svgSegmentToPath).join(" ");
  return `${start} ${segments} Z`;
}
