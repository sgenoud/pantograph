import { Segment } from "./models/segments/Segment";
import { Arc } from "./models/segments/Arc";
import { Line } from "./models/segments/Line";
import { QuadraticBezier } from "./models/segments/QuadraticBezier";
import { CubicBezier } from "./models/segments/CubicBezier";
import { EllipseArc } from "./models/segments/EllipseArc";
import { approximateBezierCurveAsArcs } from "./algorithms/conversions/bezierToArcs";
import { approximateEllipticalArcAsCubicBeziers } from "./algorithms/conversions/ellipseToBezier";
import { genericConversion } from "./algorithms/conversions/helpers";
import { Diagram, Figure, Loop, Strand } from "./main";

function mapAsArcsAndLines(s: Segment, tolerance = 1e-3): Segment[] {
  if (s instanceof Arc || s instanceof Line) {
    return [s];
  }
  if (s instanceof QuadraticBezier || s instanceof CubicBezier) {
    return approximateBezierCurveAsArcs(s, tolerance);
  }
  if (s instanceof EllipseArc) {
    return approximateEllipticalArcAsCubicBeziers(s).flatMap((s) =>
      approximateBezierCurveAsArcs(s, tolerance),
    );
  }

  throw new Error(`Unknown segment type: ${s}`);
}

function convertToArcsAndLines(shape: Diagram): Diagram;
function convertToArcsAndLines(shape: Figure): Figure;
function convertToArcsAndLines(shape: Loop): Loop;
function convertToArcsAndLines(shape: Strand): Strand;
function convertToArcsAndLines(shape: Segment): Segment[];
function convertToArcsAndLines(
  shape: Diagram | Figure | Loop | Strand | Segment,
  tolerance = 1e-3,
) {
  const mapper = (segment: Segment) => mapAsArcsAndLines(segment, tolerance);
  return genericConversion(shape, mapper);
}

export { convertToArcsAndLines };
