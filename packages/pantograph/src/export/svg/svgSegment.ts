import { Arc } from "../../models/segments/Arc.js";
import { CubicBezier } from "../../models/segments/CubicBezier.js";
import { EllipseArc } from "../../models/segments/EllipseArc.js";
import { Line } from "../../models/segments/Line.js";
import { QuadraticBezier } from "../../models/segments/QuadraticBezier.js";
import { Segment } from "../../models/segments/Segment.js";
import { RAD2DEG } from "../../vectorOperations.js";

function formatPoint([x, y]: [number, number]) {
  return `${x} ${y}`;
}

export function svgSegmentToPath(segment: Segment) {
  if (Line.isInstance(segment)) {
    return `L ${formatPoint(segment.lastPoint)}`;
  }
  if (Arc.isInstance(segment)) {
    return `A ${segment.radius} ${segment.radius} 0 ${
      segment.angularLength > Math.PI ? "1" : "0"
    } ${segment.clockwise ? "0" : "1"} ${formatPoint(segment.lastPoint)}`;
  }
  if (EllipseArc.isInstance(segment)) {
    return `A ${segment.majorRadius} ${segment.minorRadius} ${
      segment.tiltAngle * RAD2DEG
    } ${segment.deltaAngle > Math.PI ? "1" : "0"} ${
      segment.clockwise ? "0" : "1"
    } ${formatPoint(segment.lastPoint)}`;
  }

  if (QuadraticBezier.isInstance(segment)) {
    return `Q ${[
      formatPoint(segment.controlPoint),
      formatPoint(segment.lastPoint),
    ].join(" ")}`;
  }

  if (CubicBezier.isInstance(segment)) {
    return `C ${[
      formatPoint(segment.firstControlPoint),
      formatPoint(segment.lastControlPoint),
      formatPoint(segment.lastPoint),
    ].join(" ")}`;
  }

  throw new Error("Unknown segment type");
}
