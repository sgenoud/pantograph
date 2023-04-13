import { Arc } from "../../models/segments/Arc";
import { Line } from "../../models/segments/Line";
import { Segment } from "../../models/segments/Segment";

export function svgSegmentToPath(segment: Segment) {
  if (segment instanceof Line) {
    return `L ${segment.lastPoint.join(" ")}`;
  }
  if (segment instanceof Arc) {
    return `A ${segment.radius} ${segment.radius} 0 ${
      segment.angularLength > Math.PI ? "1" : "0"
    } ${segment.clockwise ? "0" : "1"} ${segment.lastPoint.join(" ")}`;
  }

  throw new Error("Unknown segment type");
}
