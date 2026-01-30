import { Arc } from "../../models/segments/Arc.js";
import { CubicBezier } from "../../models/segments/CubicBezier.js";
import { EllipseArc } from "../../models/segments/EllipseArc.js";
import { Line } from "../../models/segments/Line.js";
import { QuadraticBezier } from "../../models/segments/QuadraticBezier.js";
import { Segment } from "../../models/segments/Segment.js";

export function jsonSegment(segment: Segment) {
  if (Line.isInstance(segment)) {
    return {
      type: segment.segmentType,
      firstPoint: segment.firstPoint,
      lastPoint: segment.lastPoint,
    };
  }
  if (Arc.isInstance(segment)) {
    return {
      type: segment.segmentType,
      firstPoint: segment.firstPoint,
      lastPoint: segment.lastPoint,
      center: segment.center,
      clockwise: segment.clockwise,
    };
  }

  if (EllipseArc.isInstance(segment)) {
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

  if (QuadraticBezier.isInstance(segment)) {
    return {
      type: segment.segmentType,
      firstPoint: segment.firstPoint,
      lastPoint: segment.lastPoint,
      controlPoint: segment.controlPoint,
    };
  }

  if (CubicBezier.isInstance(segment)) {
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
