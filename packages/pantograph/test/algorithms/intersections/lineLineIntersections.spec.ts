import { describe, it, expect } from "vitest";
import type { Vector } from "../../../src/definitions";

import { lineLineIntersection } from "../../../src/algorithms/intersections/lineLineIntersection";
import { Line } from "../../../src/models/segments/Line";

import { TransformationMatrix } from "../../../src/models/TransformationMatrix";

const rotate = (point: Vector, angle: number) => {
  return new TransformationMatrix().rotate(angle).transform(point);
};

describe("lineLineIntersections", () => {
  it("computes intersections correctly", () => {
    const line1 = new Line([0, 0], [1, 1]);

    expect(
      lineLineIntersection(line1, new Line([0.5, -0.5], [0.5, 5]))
    ).toBeVector([0.5, 0.5]);

    expect(
      lineLineIntersection(line1, new Line([0.5, 5], [0.5, -0.5]))
    ).toBeVector([0.5, 0.5]);

    expect(lineLineIntersection(line1, new Line([0, 10], [1, -9]))).toBeVector([
      0.5, 0.5,
    ]);
  });

  it("returns null when there is no intersection", () => {
    const line1 = new Line([0, 0], [1, 1]);
    const line2 = new Line([5, -0.5], [10, 5]);

    expect(lineLineIntersection(line1, line2)).toBeNull();
  });

  it("returns null when lines are nearly parallel", () => {
    const line1 = new Line([0, 0], [1, 1]);
    const line2 = new Line([0, 0], rotate([1, 1], line1.precision / 10));

    expect(lineLineIntersection(line1, line2)).toBeNull();
  });

  it("returns null when lines are parallel", () => {
    const line1 = new Line([0, 0], [1, 1]);
    const line2 = new Line([1, 0], [2, 1]);

    expect(lineLineIntersection(line1, line2)).toBeNull();
  });

  it("does not include intersections on extremities", () => {
    const line1 = new Line([0, 0], [1, 1]);
    expect(lineLineIntersection(line1, new Line([0, -1], [0, 1]))).toBeVector([
      0, 0,
    ]);
    expect(lineLineIntersection(line1, new Line([1, -1], [1, 1]))).toBeVector([
      1, 1,
    ]);
  });

  it("detects perfect overlaps", () => {
    const line1 = new Line([0, 0], [1, 1]);
    expect(lineLineIntersection(line1, line1, true)).toEqual(line1);
  });

  it("detects no overlap when lines are parallel", () => {
    const line1 = new Line([0, 0], [1, 1]);
    const line2 = new Line([0, 0.5], [1, 1.5]);
    expect(lineLineIntersection(line1, line2, true)).toEqual(null);
  });

  it("detects no overlap when two segments do not overlap", () => {
    const line1 = new Line([0, 0], [1, 1]);
    const line2 = new Line([2, 2], [2.5, 2.5]);
    expect(lineLineIntersection(line1, line2, true)).toEqual(null);
  });

  it("detects overlaps", () => {
    const line1 = new Line([0, 0], [1, 1]);
    const line2 = new Line([0.5, 0.5], [1.5, 1.5]);
    expect(lineLineIntersection(line1, line2, true)).toEqual(
      new Line([0.5, 0.5], [1, 1])
    );
  });

  it("detects overlaps with a point in common", () => {
    const line1 = new Line([0, 0], [1, 1]);
    const line2 = new Line([0, 0], [0.5, 0.5]);
    expect(lineLineIntersection(line1, line2, true)).toEqual(
      new Line([0, 0], [0.5, 0.5])
    );
  });

  it("detects overlaps when directions are inverted", () => {
    const line1 = new Line([0, 0], [1, 1]);
    const line2 = new Line([1.5, 1.5], [0.5, 0.5]);
    expect(lineLineIntersection(line1, line2, true)).toEqual(
      new Line([0.5, 0.5], [1, 1])
    );
    expect(
      lineLineIntersection(line1.reverse(), line2.reverse(), true)
    ).toEqual(new Line([0.5, 0.5], [1, 1]));
  });

  describe("behaviour on ends", () => {
    it("does not include intersections on extremities", () => {
      const line1 = new Line([0, 0], [1, 1]);
      expect(lineLineIntersection(line1, new Line([1, 1], [0, 1]))).toBeVector([
        1, 1,
      ]);
    });
  });
});
