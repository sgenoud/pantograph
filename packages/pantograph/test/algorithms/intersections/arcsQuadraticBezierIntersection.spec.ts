import { describe, it, expect } from "vitest";

import { arcsQuadraticBezierIntersection } from "../../../src/algorithms/intersections/arcsQuadraticBezierIntersection";
import { Arc } from "../../../src/models/segments/Arc";
import { EllipseArc } from "../../../src/models/segments/EllipseArc";

import { QuadraticBezier } from "../../../src/models/segments/QuadraticBezier";

//import { debugImg, dpnt } from "../../debug";

describe("arcsQuadraticBezierIntersection", () => {
  describe("should return the intersection points of an arc and cubic curve", () => {
    it("works for 2 intersection points", () => {
      const arc = new Arc([0, -1.5], [1.5, 0], [0, 0]).rotate(-30);
      const curve = new QuadraticBezier([0, 0], [1, 1], [0, 1.1]).translate(
        0.5,
        -1.8
      );
      const intersections = arcsQuadraticBezierIntersection(arc, curve);

      //debugImg([arc, curve, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(2);
      expect(intersections).toMatchSnapshot();
    });

    it("works for 1 intersection points", () => {
      const arc = new Arc([0, -1.5], [1.5, 0], [0, 0]).rotate(-30);
      const curve = new QuadraticBezier([0, 0], [1, 1], [0, 1.1]).translate(
        0.5,
        -1.5
      );
      const intersections = arcsQuadraticBezierIntersection(arc, curve);

      //debugImg([arc, curve, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(1);
      expect(intersections).toMatchSnapshot();
    });

    it.fails("works for a tangent points", () => {
      // This fails for now, the precision is not good enough. I should either
      // change the precision or the algorithm.
      const curve = new QuadraticBezier([1, 0], [1, 1], [0, 0]);

      const intersectionPoint = curve.paramPoint(0.5);

      const arc = new Arc([0, -1.5], [1.5, 0], [0, 0])
        .rotate(45)
        .translateX(-1.5)
        .translateTo(intersectionPoint);

      const intersections = arcsQuadraticBezierIntersection(arc, curve);

      //debugImg([arc, curve, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(1);
      expect(intersections[0]).toBeVector(intersectionPoint);
    });

    it("works for no intersection points", () => {
      const arc = new Arc([0, -1.5], [1.5, 0], [0, 0]).rotate(-30);
      const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1]).translate(
        0.5,
        0
      );
      const intersections = arcsQuadraticBezierIntersection(arc, curve);

      //debugImg([arc, curve, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(0);
    });
  });

  describe("should return the intersection points of an ellipse arc and cubic curve", () => {
    it("works for 2 intersection points", () => {
      const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, true).rotate(
        5
      );
      const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1]).translate(
        -0.1,
        0.2
      );
      const intersections = arcsQuadraticBezierIntersection(arc, curve);

      //debugImg([arc, curve, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(2);
      expect(intersections).toMatchSnapshot();
    });

    it("works for 1 intersection points", () => {
      const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, true).rotate(
        -25
      );
      const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1]).translate(
        -0.6,
        -0.5
      );
      const intersections = arcsQuadraticBezierIntersection(arc, curve);

      //debugImg([arc, curve, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(1);
      expect(intersections).toMatchSnapshot();
    });

    it("works for no intersection points", () => {
      const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, true).rotate(
        5
      );
      const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1]).translate(
        1,
        -0.5
      );
      const intersections = arcsQuadraticBezierIntersection(arc, curve);

      //debugImg([arc, curve, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(0);
    });
  });
});
