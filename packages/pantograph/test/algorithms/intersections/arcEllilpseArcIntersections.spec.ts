import { describe, it, expect } from "vitest";

import { arcEllipseArcIntersection } from "../../../src/algorithms/intersections/arcEllipseArcIntersection";
import { Arc } from "../../../src/models/segments/Arc";
import { EllipseArc } from "../../../src/models/segments/EllipseArc";

//import { debugImg, dpnt } from "../../debug";

describe("arcEllipseArcIntersection", () => {
  describe("should return the intersection points of an arc and an ellipse arc", () => {
    it("should work for one direction", () => {
      const arc = new Arc([0, -1.5], [1.5, 0], [0, 0], true).rotate(-45);
      const ellipseArc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false)
        .translateX(-2)
        .rotate(5);
      const intersections = arcEllipseArcIntersection(arc, ellipseArc);

      //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))], "one");
      expect(intersections.length).toBe(3);
      expect(intersections).toMatchSnapshot();
    });

    it("should work for the opposite direction", () => {
      const arc = new Arc([0, -1.5], [1.5, 0], [0, 0], true);
      const ellipseArc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, true)
        .translateX(-2)
        .rotate(5);
      const intersections = arcEllipseArcIntersection(arc, ellipseArc);

      //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(1);
      expect(intersections).toMatchSnapshot();
    });
  });

  it("should work for two common points", () => {
    const arc = new Arc([0, -1.5], [1.5, 0], [0, 0], true)
      .rotate(-45)
      .translateY(-2);
    const ellipseArc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false)
      .translateX(-2)
      .rotate(5)
      .translateX(0.5);

    const intersections = arcEllipseArcIntersection(arc, ellipseArc);

    //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))], "two");
    expect(intersections.length).toBe(2);
    expect(intersections).toMatchSnapshot();
  });

  describe("for tangent common points", () => {
    it("should work for the ellipse inside the circle", () => {
      const arc = new Arc([0, -2], [2, 0], [0, 0], true).rotate(-45);
      const ellipseArc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false)
        .translateX(-2)
        .rotate(1);

      const intersections = arcEllipseArcIntersection(arc, ellipseArc);

      //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(2);
      expect(intersections).toMatchSnapshot();
    });

    it("should work for the circle inside the ellipse", () => {
      const arc = new Arc([0, -1], [1, 0], [0, 0], true).rotate(45);
      const ellipseArc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false)
        .translateX(-2)
        .rotate(1);

      const intersections = arcEllipseArcIntersection(arc, ellipseArc);

      //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(2);
      expect(intersections).toMatchSnapshot();
    });
  });

  it("should work for no intersection", () => {
    const arc = new Arc([0, -1], [1, 0], [0, 0], true).rotate(45).translateY(3);
    const ellipseArc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false)
      .translateX(-2)
      .rotate(1);

    const intersections = arcEllipseArcIntersection(arc, ellipseArc);

    //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(0);
  });

  it("should work for axis aligned ellipses", () => {
    const arc = new Arc([0, -1.5], [1.5, 0], [0, 0], true).rotate(-45);
    const ellipseArc = new EllipseArc(
      [0, 0],
      [2, 1],
      [2, 0],
      2,
      1,
      0,
      false,
    ).translateX(-2);
    const intersections = arcEllipseArcIntersection(arc, ellipseArc);

    //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(3);
    expect(intersections).toMatchSnapshot();
  });
});
