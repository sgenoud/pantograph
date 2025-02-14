import { Line } from "../../models/segments/Line.js";
import { CubicBezier } from "../../models/segments/CubicBezier.js";
import { TransformationMatrix } from "../../models/TransformationMatrix.js";
import { QuadraticBezier } from "../../models/segments/QuadraticBezier.js";
import { Vector } from "../../definitions.js";

export function lineBezierIntersection(
  line: Line,
  curve: CubicBezier | QuadraticBezier,
): Vector[] {
  const [x1, y1] = line.firstPoint;
  const [x2, y2] = line.lastPoint;

  const transform = new TransformationMatrix()
    .translate(-x1, -y1)
    .rotate(-Math.atan2(y2 - y1, x2 - x1));

  const inverseTransform = transform.clone().inverse();

  const axisAlignedCurve = curve.transform(transform);
  return axisAlignedCurve
    .paramsAtY(0)
    .map((t) => {
      return axisAlignedCurve.paramPoint(t);
    })
    .map((point) => {
      return inverseTransform.transform(point);
    })
    .filter((point) => {
      return line.isOnSegment(point);
    });
}
