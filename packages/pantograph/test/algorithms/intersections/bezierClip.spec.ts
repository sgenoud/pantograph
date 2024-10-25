import { describe, it, expect } from "vitest";

import {
  bezierClip,
  /*
    * used for debugging
  fatLineFromCurve,
  fatLineIntersections,
  perpendicularFatLineFromCurve,
  perpendicularFatLineFromCurve,
  */
} from "../../../src/algorithms/intersections/bezierClip";
import { Line } from "../../../src/models/segments/Line";
import { CubicBezier } from "../../../src/models/segments/CubicBezier";
import {
  add,
  perpendicular,
  scalarMultiply,
} from "../../../src/vectorOperations";
import { QuadraticBezier } from "../../../src/models/segments/QuadraticBezier";

//import { debugImg, dpnt } from "../../debug";

function showFatLine(fatLine: any) {
  const line = new Line(fatLine.firstPoint, fatLine.lastPoint);
  const perp = perpendicular(line.tangentAtFirstPoint);

  const p1 = scalarMultiply(perp, fatLine.negativeThickness);
  const p2 = scalarMultiply(perp, fatLine.positiveThickness);

  return [
    { shape: line, color: "grey" },
    {
      shape: new Line(add(line.firstPoint, p1), add(line.lastPoint, p1)),
      color: "red",
    },
    {
      shape: new Line(add(line.firstPoint, p2), add(line.lastPoint, p2)),
      color: "blue",
    },
  ];
}

describe("bezierClip", () => {
  describe("cubic bezier", () => {
    it("should find the intersection of two bezier curve", () => {
      const curve1 = new CubicBezier([0, 0], [1, 1], [1, 0], [0, 1]);

      const rotationPoint = curve1.paramPoint(0.6);

      const curve2 = curve1.rotate(70, rotationPoint);
      const intersections = bezierClip(curve1, curve2);

      //debugImg([curve1, curve2, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(1);
      expect(intersections[0]).toBeVector(rotationPoint);
    });

    it("should find no intersection when they do not intersect", () => {
      const curve1 = new CubicBezier([0, 0], [1, 1], [1, 0], [0, 1]);
      const curve2 = curve1.translateX(-1);

      const intersections = bezierClip(curve1, curve2);

      //debugImg([curve1, curve2, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(0);
    });

    it("should find two intersections of two bezier curve", () => {
      const curve1 = new CubicBezier([0, 0], [1, 1], [1, 0], [0, 1])
        .scale(1.5)
        .rotate(-40)
        .translate(-0.5, 0.8);
      const curve2 = new CubicBezier([-0.5, 0], [1, 0], [-1, 1], [2, 3]);

      const intersections = bezierClip(curve1, curve2);

      //debugImg([curve1, curve2, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(2);
      expect(intersections[0]).toMatchSnapshot();
    });

    it("should find three intersections of two bezier curve", () => {
      const curve1 = new CubicBezier([0, 0], [1, 1], [1.2, 0], [0, 2]);
      const curve2 = curve1
        .mirror("x")
        .translate(-0.1, 1.5)
        .rotate(-40)
        .translateX(-0.5);

      const intersections = bezierClip(curve1, curve2);

      //debugImg([curve1, curve2, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(3);
      expect(intersections[0]).toMatchSnapshot();
    });
  });

  describe("quadratic bezier", () => {
    it("should find the intersection of two bezier curve", () => {
      const curve1 = new QuadraticBezier([0, 0], [1, 1], [1, 0]);

      const rotationPoint = curve1.paramPoint(0.6);

      const curve2 = curve1.rotate(70, rotationPoint);
      const intersections = bezierClip(curve1, curve2);

      //debugImg([curve1, curve2, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(1);
      expect(intersections[0]).toBeVector(rotationPoint);
    });

    it("should find no intersection when they do not intersect", () => {
      const curve1 = new QuadraticBezier([0, 0], [1, 1], [1, 0]);
      const curve2 = curve1.translateX(-1);

      const intersections = bezierClip(curve1, curve2);

      //debugImg([curve1, curve2, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(0);
    });

    it("should find two intersections of two bezier curve", () => {
      const curve1 = new QuadraticBezier([0, 0], [1, 1], [1, 0])
        .scale(1.5)
        .rotate(-40)
        .translate(-0.5, 0.6);
      const curve2 = new QuadraticBezier([-0.5, 0], [1, 0], [-1, 1]);

      const intersections = bezierClip(curve1, curve2);

      //debugImg([curve1, curve2, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(2);
      expect(intersections[0]).toMatchSnapshot();
    });
  });

  describe("cubic and quadratic bezier", () => {
    it("should find the intersection of two bezier curve", () => {
      const curve1 = new CubicBezier([0, 0], [1, 1], [1, 0], [0, 1]);
      const curve2 = new QuadraticBezier([0, 0], [1, 1], [1, 0]).rotate(
        90,
        [0.2, 0.3],
      );

      const intersections = bezierClip(curve1, curve2);

      //debugImg([curve1, curve2, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(1);
      expect(intersections[0]).toMatchSnapshot();
    });

    it("should find no intersection when they do not intersect", () => {
      const curve1 = new CubicBezier([0, 0], [1, 1], [1, 0], [0, 1]);
      const curve2 = new QuadraticBezier([-1, -1], [0, 1], [-1, 0]);

      const intersections = bezierClip(curve1, curve2);

      //debugImg([curve1, curve2, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(0);
    });

    it("should find two intersections of two bezier curve", () => {
      const curve1 = new CubicBezier([0, 0], [1, 1], [1, 0], [0, 1])
        .scale(1.5)
        .rotate(-40)
        .translate(-0.5, 0.8);
      const curve2 = new QuadraticBezier([-0.5, 0], [1, 0], [-1, 1]).translate(
        0.2,
        0.5,
      );

      const intersections = bezierClip(curve1, curve2);

      //debugImg([curve1, curve2, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(2);
      expect(intersections).toMatchSnapshot();
    });
  });
});
