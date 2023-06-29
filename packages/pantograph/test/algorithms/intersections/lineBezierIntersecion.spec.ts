import { describe, it, expect } from "vitest";

import { lineBezierIntersection } from "../../../src/algorithms/intersections/lineBezierIntersection.js";
import { Line } from "../../../src/models/segments/Line.js";
import { CubicBezier } from "../../../src/models/segments/CubicBezier.js";
import { QuadraticBezier } from "../../../src/models/segments/QuadraticBezier.js";
//import { debugImg, dpnt } from "../../debug.js";

describe("lineCubicBezierIntersection", () => {
  describe("cubic bézier", () => {
    it("should find intersections in a simple case", () => {
      const curve = new CubicBezier([0, 0], [1, 1], [1, 0.1], [0, 1.2]);
      const line = new Line([0, -0.5], [1, 1.5]);

      const intersections = lineBezierIntersection(line, curve);

      //debugImg([curve, line, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(3);
      expect(intersections).toMatchSnapshot();
    });

    it("should find intersections on an extremity", () => {
      const curve = new CubicBezier([0, 0], [1, 1], [1, 0.1], [0, 1.2]);
      const line = new Line([0, -0.5], [0, 0.5]).rotate(45);

      const intersections = lineBezierIntersection(line, curve);

      //debugImg([curve, line, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(1);
      expect(intersections[0]).toBeVector([0, 0]);
    });

    it("should not find intersections when there are none", () => {
      const curve = new CubicBezier([0, 0], [1, 1], [1, 0.1], [0, 1.2]);
      const line = new Line([-10, -0.5], [2, 0.5]).rotate(45);

      const intersections = lineBezierIntersection(line, curve);

      //debugImg([curve, line, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(0);
    });
  });

  describe("quadratic bézier", () => {
    it("should find intersections in a simple case", () => {
      const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1]).rotate(15);
      const line = new Line([0, -0.5], [1, 1.5]);

      const intersections = lineBezierIntersection(line, curve);

      //debugImg([curve, line, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(2);
      expect(intersections).toMatchSnapshot();
    });

    it("should find intersections on an extremity", () => {
      const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1]);
      const line = new Line([0, -0.5], [0, 0.5]).rotate(45);

      const intersections = lineBezierIntersection(line, curve);

      //debugImg([curve, line, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(1);
      expect(intersections[0]).toBeVector([0, 0]);
    });

    it("should not find intersections when there are none", () => {
      const curve = new QuadraticBezier([0, 0], [1, 1], [1, 0.1]);
      const line = new Line([-10, -0.5], [2, 0.5]).rotate(45);

      const intersections = lineBezierIntersection(line, curve);

      //debugImg([curve, line, ...intersections.map((i) => dpnt(i))]);

      expect(intersections.length).toBe(0);
    });
  });
});
