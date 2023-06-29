import { Arc } from "../../models/segments/Arc.js";
import { CubicBezier } from "../../models/segments/CubicBezier.js";
import { EllipseArc } from "../../models/segments/EllipseArc.js";
import { Line } from "../../models/segments/Line.js";
import { QuadraticBezier } from "../../models/segments/QuadraticBezier.js";
import { Segment } from "../../models/segments/Segment.js";

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

  if (segment instanceof QuadraticBezier) {
    return {
      type: segment.segmentType,
      firstPoint: segment.firstPoint,
      lastPoint: segment.lastPoint,
      controlPoint: segment.controlPoint,
    };
  }

  if (segment instanceof CubicBezier) {
    return {
      type: segment.segmentType,
      firstPoint: segment.firstPoint,
      lastPoint: segment.lastPoint,
      firstControlPoint: segment.firstControlPoint,
      lastControlPoint: segment.lastControlPoint,
    };
  }

  throw new Error("Unknown segment type");
}
