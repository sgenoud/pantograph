import { CubicBezier } from "../../models/segments/CubicBezier";
import { TransformationMatrix } from "../../models/TransformationMatrix";
import type { EllipseArc } from "../../models/segments/EllipseArc";

export function approximateEllipticalArcAsCubicBeziers(
  ellipseArc: EllipseArc,
): CubicBezier[] {
  const sweepAngle = ellipseArc.deltaAngle;
  const segments = Math.ceil(Math.abs(sweepAngle) / (Math.PI / 2));
  const anglePerSegment = sweepAngle / segments;
  const kappa = (4 * Math.tan(anglePerSegment / 4)) / 3;

  const orientation = ellipseArc.clockwise ? -1 : 1;

  const angles = Array.from(
    { length: segments + 1 },
    (_, i) => ellipseArc.firstAngle + i * anglePerSegment * orientation,
  );

  const zippedAngles = angles
    .slice(0, -1)
    .map((angle, index) => [angle, angles[index + 1]]);

  return zippedAngles.map(([startAngle, endAngle]) => {
    const cosStart = Math.cos(startAngle);
    const sinStart = Math.sin(startAngle);
    const cosEnd = Math.cos(endAngle);
    const sinEnd = Math.sin(endAngle);

    const [centerX, centerY] = ellipseArc.center;
    const r = ellipseArc.minorRadius;
    const R = ellipseArc.majorRadius;

    const rotationMatrix = new TransformationMatrix().rotate(
      ellipseArc.tiltAngle,
      ellipseArc.center,
    );
    const rotateInFrame = (p: [number, number]) => rotationMatrix.transform(p);

    const p0 = rotateInFrame([centerX + R * cosStart, centerY + r * sinStart]);
    const c0 = rotateInFrame([
      centerX + R * (cosStart - kappa * sinStart * orientation),
      centerY + r * (sinStart + kappa * cosStart * orientation),
    ]);
    const c1 = rotateInFrame([
      centerX + R * (cosEnd + kappa * sinEnd * orientation),
      centerY + r * (sinEnd - kappa * cosEnd * orientation),
    ]);
    const p1 = rotateInFrame([centerX + R * cosEnd, centerY + r * sinEnd]);

    return new CubicBezier(p0, p1, c0, c1);
  });
}
