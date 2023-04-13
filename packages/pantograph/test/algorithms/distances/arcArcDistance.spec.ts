import { describe, it, expect } from "vitest";

import { arcArcDistance } from "../../../src/algorithms/distances/arcArcDistance";
import { threePointsArc } from "../../../src/models/segments/Arc";

describe("arcArcDistance", () => {
  it("is zero when intersecting", () => {
    const arc1 = threePointsArc([-0.5, -1], [0, 0], [-0.5, 1]);
    const arc2 = threePointsArc([0.5, -1], [0, 0], [0.5, 1]);

    expect(arcArcDistance(arc1, arc2)).toBeCloseTo(0);
    expect(arcArcDistance(arc1, arc2.translateX(-0.2))).toBeCloseTo(0);
    expect(arcArcDistance(arc1, arc2.translateX(-1))).toBeCloseTo(0);

    expect(arcArcDistance(arc1, arc1.rotate(5, arc1.center))).toBeCloseTo(0);
  });

  it("works with centers outside each other", () => {
    const arc1 = threePointsArc([-0.5, -1], [0, 0], [-0.5, 1]);
    const arc2 = threePointsArc([0.5, -1], [0, 0], [0.5, 1]);

    expect(arcArcDistance(arc1, arc2.translateX(0.2))).toBeCloseTo(0.2);
    expect(
      arcArcDistance(arc1, arc2.translateX(0.3).rotate(10, arc1.center))
    ).toBeCloseTo(0.3);
    expect(arcArcDistance(arc1, arc2.translate(-5, 2))).toBeCloseTo(4);
  });

  it("works with centers inside each other", () => {
    const arc1 = threePointsArc([-0.5, -1], [0, 0], [-0.5, 1]);
    const arc2 = threePointsArc([-0.5, -0.5], [0, 0], [-0.5, 0.5])
      .translateX(-0.1)
      .rotate(10, arc1.center);

    expect(arcArcDistance(arc1, arc2)).toBeCloseTo(0.1);
    expect(arcArcDistance(arc2, arc1)).toBeCloseTo(0.1);
    expect(arcArcDistance(arc1, arc2.rotate(180, arc1.center))).toBeCloseTo(
      1.36176
    );
    expect(arcArcDistance(arc2.rotate(180, arc1.center), arc1)).toBeCloseTo(
      1.36176
    );
  });
});
