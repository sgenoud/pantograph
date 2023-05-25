import { Arc } from "../../models/segments/Arc";
import { EllipseArc } from "../../models/segments/EllipseArc";
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

  if (segment instanceof EllipseArc) {
    return {
      type: segment.segmentType,
      firstPoint: segment.firstPoint,
      lastPoint: segment.lastPoint,
      center: segment.center,
      clockwise: segment.clockwise,
      majorRadius: segment.majorRadius,
      minorRadius: segment.minorRadius,
      tiltAngle: segment.tiltAngle,
    };
  }

  throw new Error("Unknown segment type");
}
