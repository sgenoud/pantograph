import { describe, it, expect } from "vitest";

import { lineLineDistance } from "../../../src/algorithms/distances/lineLineDistance";
import { Line } from "../../../src/models/segments/Line";

describe("linelineDistance", () => {
  it("is zero when intersecting", () => {
    const line1 = new Line([0, -1], [0, 1]);

    expect(lineLineDistance(line1, line1)).toBeCloseTo(0);
    expect(lineLineDistance(line1, new Line([-1, 0], [1, 0]))).toBeCloseTo(0);
  });

  it("is the correct value when not intersecting", () => {
    const line1 = new Line([-1, 0], [1, 0]);

    expect(lineLineDistance(line1, new Line([-1, 5], [0, 1]))).toBeCloseTo(1);
    expect(lineLineDistance(line1, new Line([0, 1], [-1, 5]))).toBeCloseTo(1);
    expect(lineLineDistance(new Line([-1, 5], [0, 1]), line1)).toBeCloseTo(1);
    expect(lineLineDistance(new Line([0, 1], [-1, 5]), line1)).toBeCloseTo(1);

    expect(lineLineDistance(line1, new Line([-10, 5], [-2, 0]))).toBeCloseTo(1);
    expect(lineLineDistance(line1, new Line([-2, 0], [-10, 5]))).toBeCloseTo(1);
    expect(lineLineDistance(new Line([-10, 5], [-2, 0]), line1)).toBeCloseTo(1);
    expect(lineLineDistance(new Line([-2, 0], [-10, 5]), line1)).toBeCloseTo(1);
  });

  it("is the correct value when parallel", () => {
    const line1 = new Line([-1, 0], [1, 0]);

    expect(lineLineDistance(line1, new Line([0, 1], [5, 1]))).toBeCloseTo(1);

    expect(lineLineDistance(line1, new Line([2, 1], [5, 1]))).toBeCloseTo(
      Math.sqrt(2)
    );
    expect(lineLineDistance(line1, new Line([-20, 1], [-2, 1]))).toBeCloseTo(
      Math.sqrt(2)
    );

    expect(lineLineDistance(new Line([0, 1], [5, 1]), line1)).toBeCloseTo(1);
    expect(lineLineDistance(new Line([2, 1], [5, 1]), line1)).toBeCloseTo(
      Math.sqrt(2)
    );
    expect(lineLineDistance(new Line([-20, 1], [-2, 1]), line1)).toBeCloseTo(
      Math.sqrt(2)
    );
  });
});
