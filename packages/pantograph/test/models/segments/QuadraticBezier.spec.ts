import { describe, it, expect } from "vitest";

import { QuadraticBezier } from "../../../src/models/segments/QuadraticBezier.js";
import { add, scalarMultiply } from "../../../src/vectorOperations.js";
//import { debugImg, dpnt, drawBbox } from "../../debug.js";

describe("QuadraticBezier", () => {
  it("should detect when a point is on the curve", () => {
    const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0]);

    expect(curve.isOnSegment([0.75, 0.25])).toBe(true);
    expect(curve.isOnSegment([0, 0])).toBe(true);
    expect(curve.isOnSegment([1, 1])).toBe(true);
    expect(curve.translateX(5).isOnSegment([5.75, 0.25])).toBe(true);

    //debugImg([curve.translateY(5), dpnt([0.75, 5.25]), dpnt([0, 0])]);

    expect(curve.translateY(5).isOnSegment([0.75, 5.25])).toBe(true);

    expect(
      curve.rotate(-45, [0.75, 0.25]).translateX(5).isOnSegment([5.75, 0.25]),
    ).toBe(true);
  });

  it("handles point to param and param to point correctly", () => {
    const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1])
      .rotate(-15, [0.75, 0.25])
      .translateX(0.12);

    const intervals = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

    //debugImg([curve, ...intervals.map((i) => dpnt(curve.paramPoint(i)))]);

    intervals.forEach((i) => {
      expect(curve.pointToParam(curve.paramPoint(i))).toBeCloseTo(i);
    });
  });

  it("splits correctly in one point", () => {
    const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1])
      .translateX(0.12)
      .rotate(-15, [0.5, 0.5]);

    const curves = curve.splitAt([curve.paramPoint(0.66)]);

    expect(curves.length).toBe(2);

    //debugImg([{ shape: curve, color: "red" }, ...curves]);

    expect(curves[0].firstPoint).toEqual(curve.firstPoint);
    expect(curves[0].lastPoint).toEqual(curve.paramPoint(0.66));
    expect(curves[1].firstPoint).toEqual(curve.paramPoint(0.66));
    expect(curves[0].paramPoint(0.5)).toBeVector(curve.paramPoint(0.33));
    expect(curves[1].lastPoint).toBeVector(curve.lastPoint);
  });

  it("splits correctly in multiple points", () => {
    const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1])
      .translateX(0.12)
      .rotate(-15, [0.5, 0.5]);

    const curves = curve.splitAt([
      curve.paramPoint(0.75),
      curve.paramPoint(0.25),
    ]);

    //debugImg([{ shape: curve, color: "red" }, ...curves]);

    expect(curves.length).toBe(3);

    expect(curves[0].firstPoint).toEqual(curve.firstPoint);
    expect(curves[0].lastPoint).toEqual(curve.paramPoint(0.25));
    expect(curves[1].firstPoint).toEqual(curve.paramPoint(0.25));
    expect(curves[1].paramPoint(0.5)).toBeVector(curve.paramPoint(0.5));
    expect(curves[1].lastPoint).toEqual(curve.paramPoint(0.75));
    expect(curves[2].firstPoint).toEqual(curve.paramPoint(0.75));
    expect(curves[2].lastPoint).toEqual(curve.lastPoint);
  });

  it("splits correctly in multiple points and ignores duplicates", () => {
    const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1])
      .translateX(0.12)
      .rotate(-15, [0.5, 0.5]);

    const curves = curve.splitAt([
      curve.paramPoint(0.75),
      curve.paramPoint(1),
      curve.paramPoint(0.25),
      curve.paramPoint(0),
      curve.paramPoint(0.7500000001),
    ]);

    //debugImg([{ shape: curve, color: "red" }, ...curves]);

    expect(curves.length).toBe(3);

    expect(curves[0].firstPoint).toEqual(curve.firstPoint);
    expect(curves[0].lastPoint).toEqual(curve.paramPoint(0.25));
    expect(curves[1].firstPoint).toEqual(curve.paramPoint(0.25));
    expect(curves[1].paramPoint(0.5)).toBeVector(curve.paramPoint(0.5));
    expect(curves[1].lastPoint).toEqual(curve.paramPoint(0.75));
    expect(curves[2].firstPoint).toEqual(curve.paramPoint(0.75));
    expect(curves[2].lastPoint).toEqual(curve.lastPoint);
  });

  it("splits correctly at many points", () => {
    const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1])
      .rotate(-75, [0.5, 0.5])
      .translateX(0.12);

    const curves = curve.splitAt([
      curve.paramPoint(0.1),
      curve.paramPoint(0.2),
      curve.paramPoint(0.3),
      curve.paramPoint(0.4),
      curve.paramPoint(0.5),
      curve.paramPoint(0.6),
      curve.paramPoint(0.75),
      curve.paramPoint(0.8),
      curve.paramPoint(0.25),
      curve.paramPoint(0.9),
    ]);

    //debugImg([{ shape: curve, color: "red" }, ...curves]);

    expect(curves.length).toBe(11);
    expect(curves).toMatchSnapshot();
  });

  it("computes the distance to a point close to the curve correctly", () => {
    const curve = new QuadraticBezier([0, 0], [1, 1], [0.1, 1.1]);

    const distantPoint = (param: number, distance: number) => {
      const p0 = curve.paramPoint(param);
      const p1 = curve.normalAt(p0);
      return add(scalarMultiply(p1, distance), p0);
    };

    expect(curve.distanceFrom(distantPoint(0, 0.1))).toBeCloseTo(0.1);
    expect(curve.distanceFrom(distantPoint(0.2, 0.1))).toBeCloseTo(0.1);
    expect(curve.distanceFrom(distantPoint(0.4, 0.1))).toBeCloseTo(0.1);
    expect(curve.distanceFrom(distantPoint(0.6, 0.1))).toBeCloseTo(0.1);
    expect(curve.distanceFrom(distantPoint(0.8, 1))).toBeCloseTo(1);
    expect(curve.distanceFrom(distantPoint(0.9, 0.1))).toBeCloseTo(0.1);

    expect(curve.distanceFrom(distantPoint(0.1, -0.1))).toBeCloseTo(0.1);
    expect(curve.distanceFrom(distantPoint(0.2, -0.1))).toBeCloseTo(0.1);
    expect(curve.distanceFrom(distantPoint(0.4, -0.1))).toBeCloseTo(0.1);
    expect(curve.distanceFrom(distantPoint(0.6, -0.1))).toBeCloseTo(0.1);
    expect(curve.distanceFrom(distantPoint(0.8, -0.1))).toBeCloseTo(0.1);
    expect(curve.distanceFrom(distantPoint(0.9, -0.1))).toBeCloseTo(0.1);
  });

  it("computes the distance to a point far from the endpoint curve correctly", () => {
    const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1]);

    //debugImg([{ shape: curve, color: "red" }, dpnt([-2, 0]), dpnt([2, 1])]);

    expect(curve.distanceFrom([-2, 0])).toBeCloseTo(2);
    expect(curve.distanceFrom([2, 1])).toBeCloseTo(1);
  });

  it("compute the bounding box correctly", () => {
    const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1]);
    //debugImg([{ shape: curve, color: "red" }, drawBbox(curve)]);
    expect(curve.boundingBox).toMatchSnapshot();

    const curve2 = new QuadraticBezier([0, 0], [1, 1], [1, 0.1]).rotate(15);
    //debugImg([{ shape: curve2, color: "red" }, drawBbox(curve2)]);
    expect(curve2.boundingBox).toMatchSnapshot();

    const curve3 = new QuadraticBezier([0, 0], [1, 1], [1, 0.5]).rotate(45);
    //debugImg([{ shape: curve3, color: "red" }, drawBbox(curve3)]);
    expect(curve3.boundingBox).toMatchSnapshot();

    const curve4 = new QuadraticBezier([-0.5, 0], [1, 0], [-1, 1]);
    //debugImg([{ shape: curve4, color: "red" }, drawBbox(curve4)]);
    expect(curve4.boundingBox).toMatchSnapshot();
  });
});
