import { Line } from "../../models/segments/Line.js";
import { EllipseArc } from "../../models/segments/EllipseArc.js";
import { Vector } from "../../definitions.js";

// Using the derivation from http://www.nabla.hr/CS-EllipseAndLine1.htm
export function lineEllipseArcIntersection(
  line: Line,
  arc: EllipseArc,
  precision = 1e-9,
) {
  const lineP = line.transform(arc.ellipseReferenceFrameTransform);

  const m = lineP.slope;
  const c = lineP.yIntercept;

  const a2 = arc.majorRadius * arc.majorRadius;
  const b2 = arc.minorRadius * arc.minorRadius;
  const ab = arc.majorRadius * arc.minorRadius;

  const m2 = lineP.slope * lineP.slope;
  const c2 = lineP.yIntercept * lineP.yIntercept;

  // Helper function to convert back the intersection from the ellipse
  // reference frame to the original frame
  // It also checks that the intersection is within the bounds of the segments
  const filterIntersectionInRef = (intersections: Vector[]) =>
    intersections
      .map((point) =>
        arc.reverseEllipseReferenceFrameTransform.transform(point),
      )
      .filter((point) => line.isOnSegment(point) && arc.isOnSegment(point));

  // We handle the case of the line being vertical
  if (!Number.isFinite(m)) {
    // Vertical line
    const x = lineP.firstPoint[0];

    // Outside
    if (Math.abs(x) - arc.majorRadius > precision) return [];

    // Tangent
    if (Math.abs(Math.abs(x) - arc.majorRadius) < precision) {
      return filterIntersectionInRef([[x, 0]]);
    }

    const y = arc.minorRadius * Math.sqrt(1 - (x * x) / a2);

    const p1: Vector = [x, y];
    const p2: Vector = [x, -y];

    return filterIntersectionInRef([p1, p2]);
  }

  const discriminant = a2 * m2 + b2 - c2;

  if (discriminant < -precision) {
    return [];
  }

  const denominator = a2 * m2 + b2;

  // We have a tangent line
  if (Math.abs(discriminant) < precision) {
    const x = -(a2 * m * c) / denominator;
    const y = (b2 * c) / denominator;
    return filterIntersectionInRef([[x, y]]);
  }

  const sqrtDiscriminant = Math.sqrt(discriminant);

  const p1: Vector = [
    -(a2 * m * c + ab * sqrtDiscriminant) / denominator,
    (b2 * c - ab * m * sqrtDiscriminant) / denominator,
  ];
  const p2: Vector = [
    -(a2 * m * c - ab * sqrtDiscriminant) / denominator,
    (b2 * c + ab * m * sqrtDiscriminant) / denominator,
  ];

  return filterIntersectionInRef([p1, p2]);
}
