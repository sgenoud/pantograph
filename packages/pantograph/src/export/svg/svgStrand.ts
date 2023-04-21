import type { Strand } from "../../models/Strand";
import { svgSegmentToPath } from "./svgSegment";

export function svgStrand(strand: Strand) {
  const start = `M ${strand.firstPoint.join(" ")}`;
  const segments = strand.segments.map(svgSegmentToPath).join(" ");
  return `${start} ${segments}`;
}
