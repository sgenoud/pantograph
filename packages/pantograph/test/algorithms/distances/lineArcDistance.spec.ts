import { describe, it, expect } from "vitest";

import { lineArcDistance } from "../../../src/algorithms/distances/lineArcDistance";
import { Arc, threePointsArc } from "../../../src/models/segments/Arc";
import { Line } from "../../../src/models/segments/Line";

describe("linelineDistance", () => {
  it("is zero when intersecting", () => {
    const line = new Line([0, -1], [0, 1]);
    const arc = new Arc([0, -1], [0, 1], [-0.5, 0]);

    expect(lineArcDistance(line, arc.translateX(-0.2))).toBeCloseTo(0);
    expect(lineArcDistance(line, arc)).toBeCloseTo(0);
  });

  it("is the correct value when not intersecting", () => {
    const arc = threePointsArc([-0.5, -1], [0, 0], [-0.5, 1]);

    expect(lineArcDistance(new Line([5, 0], [2, 0]), arc)).toBeCloseTo(2);
    expect(lineArcDistance(new Line([2, 5], [2, -5]), arc)).toBeCloseTo(2);
    expect(lineArcDistance(new Line([-2, 5], [-2, -5]), arc)).toBeCloseTo(1.5);
    expect(lineArcDistance(new Line([-1, 0.1], [-1, -0.1]), arc)).toBeCloseTo(
      0.9807,
    );
    expect(lineArcDistance(new Line([-0.6, -1.5], [-0.6, 0]), arc)).toBeCloseTo(
      0.1,
    );
  });
});
