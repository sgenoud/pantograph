import { describe, it, expect } from "vitest";

import { handleOverlaps } from "../../../src/algorithms/intersections/cubicBezierCubicBezierIntersection";
import { CubicBezier } from "../../../src/models/segments/CubicBezier";

import { debugImg, dpnt } from "../../debug";

describe("handleOverlaps", () => {
  it("should return null if there is no overlap", () => {
    const curve1 = new CubicBezier([0, 0], [1, 1], [2, 1], [3, 0]);
    const curve2 = new CubicBezier([0, 1], [1, 0], [2, 0], [3, 1]);
    expect(handleOverlaps(curve1, curve2)).toBe(null);
  });

  it("should return the first one if it is included in the second one", () => {
    const curve1 = new CubicBezier([0, 0], [1, 1], [2, 1], [3, 0]);
    const curve2 = curve1.splitAtParameters([0.33])[0];

    const overlap = handleOverlaps(curve1, curve2);

    //debugImg([curve1, curve2, { shape: overlap!, color: "blue" }]);

    expect(overlap).toBeInstanceOf(CubicBezier);
    expect(overlap!.firstPoint).toEqual(curve1.firstPoint);
    expect(overlap!.lastPoint).toBeVector(curve1.paramPoint(0.33));

    expect(curve2.isSame(overlap!)).toBe(true);
  });

  it("should return the second one if it is included in the second one", () => {
    const curve1 = new CubicBezier([0, 0], [1, 1], [2, 1], [3, 0]);
    const curve2 = curve1.splitAtParameters([0.33])[0];

    const overlap = handleOverlaps(curve2, curve1);

    //debugImg([curve1, curve2, { shape: overlap!, color: "blue" }]);

    expect(overlap).toBeInstanceOf(CubicBezier);
    expect(overlap!.firstPoint).toEqual(curve1.firstPoint);
    expect(overlap!.lastPoint).toBeVector(curve1.paramPoint(0.33));

    expect(curve2.isSame(overlap!)).toBe(true);
  });

  it("should return the full curve if they are the same", () => {
    const curve = new CubicBezier([0, 0], [1, 1], [2, 1], [3, 0]);

    const overlap = handleOverlaps(curve, curve);

    expect(overlap).toBeInstanceOf(CubicBezier);

    expect(curve.isSame(overlap!)).toBe(true);
  });

  it("should return the crossing if they intersect", () => {
    const curve = new CubicBezier([0, 0], [1, 1], [2, 1], [3, 0]);

    const p1 = curve.paramPoint(0.3);
    const p2 = curve.paramPoint(0.6);

    const curve1 = curve.splitAt([p2])[0];
    const curve2 = curve.splitAt([p1])[1];

    const overlap = handleOverlaps(curve1, curve2);

    expect(overlap).toBeInstanceOf(CubicBezier);

    debugImg([curve1, curve2, { shape: overlap!, color: "blue" }]);
    expect(overlap!.firstPoint).toBeVector(p1);
    expect(overlap!.lastPoint).toBeVector(p2);
    expect(overlap).toMatchSnapshot();
  });
});
