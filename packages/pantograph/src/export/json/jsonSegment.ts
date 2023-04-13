import { Arc } from "../../models/segments/Arc";
import { Line } from "../../models/segments/Line";
import { Segment } from "../../models/segments/Segment";

export function jsonSegment(segment: Segment) {
  if (segment instanceof Line) {
    return {
      type: segment.segmentType,
      firstPoint: segment.firstPoint,
      lastPoint: segment.lastPoint,
    };
  }
  if (segment instanceof Arc) {
    return {
      type: segment.segmentType,
      firstPoint: segment.firstPoint,
      lastPoint: segment.lastPoint,
      center: segment.center,
      clockwise: segment.clockwise,
    };
  }

  throw new Error("Unknown segment type");
}
