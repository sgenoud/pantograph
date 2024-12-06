import { describe, it, expect } from "vitest";
import { approximateEllipticalArcAsCubicBeziers } from "../../../src/algorithms/conversions/ellipseToBezier";
import {
  svgEllipse,
  EllipseArc,
} from "../../../src/models/segments/EllipseArc";

import range from "../../../src/utils/range";

function expectBezierApproximation(
  arc: EllipseArc,
  beziers: any,
  margin = 0.001,
) {
  beziers.forEach((bezier: any) => {
    range(11).forEach((t) => {
      expect(arc.distanceFrom(bezier.paramPoint(t / 10))).toBeLessThan(margin);
    });
  });
}

describe("ellipseToBezier", () => {
  it("should convert an ellipse arc to cubic beziers", () => {
    const arc = svgEllipse([-1, 0], [1, 0.2], 1.5, 1, 12, false, false);

    const beziers = approximateEllipticalArcAsCubicBeziers(arc as EllipseArc);
    expectBezierApproximation(arc as EllipseArc, beziers);
  });

  it("should convert an ellipse arc to cubic beziers with inverted axes", () => {
    const arc = svgEllipse([-1, 0], [1, 0.2], 0.5, 1.5, 12, false, false);

    const beziers = approximateEllipticalArcAsCubicBeziers(arc as EllipseArc);
    expectBezierApproximation(arc as EllipseArc, beziers);
  });

  it("should convert an ellipse arc to cubic beziers taking the bigger sweep", () => {
    const arc = svgEllipse([-1, 0], [1, 0.2], 1.5, 0.5, 12, true, false);

    const beziers = approximateEllipticalArcAsCubicBeziers(arc as EllipseArc);
    expectBezierApproximation(arc as EllipseArc, beziers);
  });

  it("should convert an ellipse arc to cubic beziers taking the inverse orientation", () => {
    const arc = svgEllipse([-1, 0], [1, 0.2], 1.5, 0.5, 12, false, true);

    const beziers = approximateEllipticalArcAsCubicBeziers(arc as EllipseArc);
    expectBezierApproximation(arc as EllipseArc, beziers);
  });
});
