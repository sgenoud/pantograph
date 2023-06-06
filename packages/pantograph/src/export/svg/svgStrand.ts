import type { Strand } from "../../models/Strand.js";
import { svgSegmentToPath } from "./svgSegment.js";

export function svgStrand(strand: Strand) {
  const start = `M ${strand.firstPoint.join(" ")}`;
  const segments = strand.segments.map(svgSegmentToPath).join(" ");
  return `${start} ${segments}`;
}
