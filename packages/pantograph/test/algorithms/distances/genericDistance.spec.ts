import { describe, it, expect } from "vitest";

import { genericDistance } from "../../../src/algorithms/distances/genericDistance";
import { Arc, threePointsArc } from "../../../src/models/segments/Arc";
import { EllipseArc } from "../../../src/models/segments/EllipseArc";
import {
  add,
  perpendicular,
  scalarMultiply,
} from "../../../src/vectorOperations";
import { debugImg } from "../../debug";

describe("genericDistance", () => {
  it("computes the distance between two arcs correctly", () => {
    const a1 = new Arc([320, 0], [280, 0], [300, 15.000000000000004], true);
    const a2 = new Arc(
      [275.99266686420884, 24.676735625661472],
      [377.5646496724898, 167.5240988148737],
      [256.25, 146.25],
      false
    );

    expect(genericDistance(a1, a2)).toBeCloseTo(25);

    const arc1 = threePointsArc([-0.5, -1], [0, 0], [-0.5, 1]);
    const arc2 = threePointsArc([-0.5, -0.5], [0, 0], [-0.5, 0.5])
      .translateX(-0.1)
      .rotate(10, arc1.center);

    expect(genericDistance(arc1, arc2)).toBeCloseTo(0.1);
    expect(genericDistance(arc2, arc1)).toBeCloseTo(0.1);
    expect(genericDistance(arc1, arc2.rotate(180, arc1.center))).toBeCloseTo(
      1.36176
    );
    expect(genericDistance(arc2.rotate(180, arc1.center), arc1)).toBeCloseTo(
      1.36176
    );
  });

  it("computes the distance between an ellipse arc and an arc correctly", () => {
    const ellipse = new EllipseArc(
      [0, -0.5],
      [3, 0],
      [0, 0],
      3,
      0.5,
      0,
      true
    ).rotate(45);

    const p = ellipse.paramPoint(0.5235);
    const normal = ellipse.normalAt(p);

    const arcPoint = add(p, scalarMultiply(normal, 1.5));

    const center = add(arcPoint, scalarMultiply(normal, 3));
    const start = add(center, scalarMultiply(perpendicular(normal), 3));
    const end = add(center, scalarMultiply(perpendicular(normal), -3));

    const arc = new Arc(start, end, center);

    expect(genericDistance(ellipse, arc)).toBeCloseTo(1.5);
  });

  it.skip("works with natural ellipses", () => {
    const arc1 = new EllipseArc([-8, 5], [-10, 0], [-8, 0], 5, 2, 90).translate(
      2,
      5
    );
    const arc2 = new EllipseArc(
      [-6.123724356957945, 3.5355339059327378],
      [-24.406964702329226, -5.50455030127395],
      [-5.088448176547862, -0.3281693992235354],
      20,
      4,
      15
    ).translate(2, 5);
    expect(genericDistance(arc1, arc2, 1e-11)).toBeCloseTo(0);
  });
});
