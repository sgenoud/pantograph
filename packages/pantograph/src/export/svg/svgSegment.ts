import { Line } from "../../models/segments/Line";
import { Segment } from "../../models/segments/Segment";

export function svgSegmentToPath(segment: Segment) {
  if (segment instanceof Line) {
    return `L ${segment.lastPoint.join(" ")}`;
  }
  throw new Error("Unknown segment type");
}
