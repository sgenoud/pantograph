import { describe, it, expect } from "vitest";

import { ellipseArcEllipseArcIntersection } from "../../../src/algorithms/intersections/ellipseArcEllipseArcIntersection";
import { EllipseArc } from "../../../src/models/segments/EllipseArc";

//import { debugImg, dpnt } from "../../debug";

describe("arcEllipseArcIntersection", () => {
  describe("should return the intersection points of an arc and an ellipse arc", () => {
    it("should work for one direction", () => {
      const arc = new EllipseArc(
        [0, -0.5],
        [3, 0],
        [0, 0],
        3,
        0.5,
        0,
        true
      ).rotate(45);
      const ellipseArc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false)
        .translateX(-2)
        .rotate(5);
      const intersections = ellipseArcEllipseArcIntersection(arc, ellipseArc);

      //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(3);
      expect(intersections).toMatchSnapshot();
    });

    it("should work for the opposite direction", () => {
      const arc = new EllipseArc(
        [0, -0.5],
        [3, 0],
        [0, 0],
        3,
        0.5,
        0,
        false
      ).rotate(45);
      const ellipseArc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false)
        .translateX(-2)
        .rotate(5);
      const intersections = ellipseArcEllipseArcIntersection(arc, ellipseArc);

      //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))]);
      expect(intersections.length).toBe(1);
      expect(intersections).toMatchSnapshot();
    });
  });

  it("should work for two common points", () => {
    const arc = new EllipseArc([0, -0.5], [3, 0], [0, 0], 3, 0.5, 0, true);
    const ellipseArc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false)
      .translateX(-2)
      .rotate(5)
      .translateY(1);

    const intersections = ellipseArcEllipseArcIntersection(arc, ellipseArc);

    //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(2);
    expect(intersections).toMatchSnapshot();
  });

  it("should work for tangent common points", () => {
    const arc = new EllipseArc([0, -1], [3, 0], [0, 0], 3, 1, 0, true);
    const ellipseArc = new EllipseArc(
      [0, 0],
      [2, 1],
      [2, 0],
      2,
      1,
      0,
      false
    ).translateX(-2);

    const intersections = ellipseArcEllipseArcIntersection(arc, ellipseArc);

    //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(2);
    expect(intersections).toMatchSnapshot();
  });

  it("should work for no intersection", () => {
    const arc = new EllipseArc([0, -0.5], [3, 0], [0, 0], 3, 0.5, 0, true)
      .mirror("x")
      .translateY(3);
    const ellipseArc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false)
      .translateX(-2)
      .rotate(1);

    const intersections = ellipseArcEllipseArcIntersection(arc, ellipseArc);

    //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(0);
  });

  it("should work for axis aligned ellipses", () => {
    const arc = new EllipseArc([0, -0.5], [3, 0], [0, 0], 3, 0.5, 0, true);
    const ellipseArc = new EllipseArc(
      [0, 0],
      [2, 1],
      [2, 0],
      2,
      1,
      0,
      false
    ).translateX(-2);
    const intersections = ellipseArcEllipseArcIntersection(
      arc,
      ellipseArc,
      true
    );

    //debugImg([arc, ellipseArc, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(2);
    expect(intersections).toMatchSnapshot();
  });

  it("works with natural ellipses", () => {
    const arc1 = new EllipseArc([-8, 5], [-10, 0], [-8, 0], 5, 2, 90);
    const arc2 = new EllipseArc(
      [-6.123724356957945, 3.5355339059327378],
      [-24.406964702329226, -5.50455030127395],
      [-5.088448176547862, -0.3281693992235354],
      20,
      4,
      15
    );
    const intersections = ellipseArcEllipseArcIntersection(arc1, arc2, true);

    //debugImg([arc1, arc2, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(1);
    expect(intersections).toMatchSnapshot();
  });

  describe("overlapping ellipses", () => {
    it("works with one overlap", () => {
      const ellipseArc = new EllipseArc(
        [0, 0],
        [2, 1],
        [2, 0],
        2,
        1,
        0,
        false
      ).translateX(-2);

      const p0 = ellipseArc.paramPoint(-0.2);
      const p1 = ellipseArc.paramPoint(0.3);

      const arc = new EllipseArc(p0, p1, [0, 0], 2, 1, 0, false);

      const intersections = ellipseArcEllipseArcIntersection(
        arc,
        ellipseArc,
        true
      );

      //debugImg([arc, ellipseArc, ...intersections]);
      expect(intersections.length).toBe(1);
      expect(intersections[0]).toBeInstanceOf(EllipseArc);
      expect(intersections).toMatchSnapshot();
    });

    it("works with two overlaps", () => {
      const ellipseArc = new EllipseArc(
        [0, 0],
        [2, 1],
        [2, 0],
        2,
        1,
        0,
        false
      ).translateX(-2);

      const p0 = ellipseArc.paramPoint(0.4);
      const p1 = ellipseArc.paramPoint(0.3);

      const arc = new EllipseArc(p0, p1, [0, 0], 2, 1, 0, false);

      const intersections = ellipseArcEllipseArcIntersection(
        arc,
        ellipseArc,
        true
      );

      //debugImg([arc, ellipseArc, ...intersections]);
      expect(intersections.length).toBe(2);
      expect(intersections[0]).toBeInstanceOf(EllipseArc);
      expect(intersections).toMatchSnapshot();
    });

    it("works with two overlaps, with rotated ellipses", () => {
      const ellipseArc = new EllipseArc(
        [0, 0],
        [2, 1],
        [2, 0],
        2,
        1,
        0,
        false
      ).translateX(-2);

      const p0 = ellipseArc.paramPoint(0.4);
      const p1 = ellipseArc.paramPoint(0.3);

      const arc = new EllipseArc(p0, p1, [0, 0], 2, 1, 0, false);

      const intersections = ellipseArcEllipseArcIntersection(
        arc.rotate(33),
        ellipseArc.rotate(33),
        true
      );

      //debugImg([arc.rotate(33), ellipseArc.rotate(33), ...intersections]);
      expect(intersections.length).toBe(2);
      expect(intersections[0]).toBeInstanceOf(EllipseArc);
      expect(intersections).toMatchSnapshot();
    });

    it("works with no overlaps", () => {
      const ellipseArc = new EllipseArc(
        [0, 0],
        [2, 1],
        [2, 0],
        2,
        1,
        0,
        false
      ).translateX(-2);

      const p0 = ellipseArc.paramPoint(-0.2);
      const p1 = ellipseArc.paramPoint(-0.1);

      const arc = new EllipseArc(p0, p1, [0, 0], 2, 1, 0, false);

      const intersections = ellipseArcEllipseArcIntersection(
        arc,
        ellipseArc,
        true
      );

      //debugImg([arc, ellipseArc, ...intersections]);
      expect(intersections.length).toBe(0);
    });
  });
});
