import { describe, it, expect } from "vitest";

import { lineEllipseArcIntersection } from "../../../src/algorithms/intersections/lineEllipseArcIntersection";
import { Line } from "../../../src/models/segments/Line";
import { EllipseArc } from "../../../src/models/segments/EllipseArc";

//import { debugImg, dpnt } from "../../debug";

describe("lineEllipseArcIntersections", () => {
  it("should return the intersection point of a line and an arc", () => {
    const line = new Line([-1, -1], [1, 1]);

    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false);
    const intersections = lineEllipseArcIntersection(line, arc);

    //debugImg([line, arc, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(1);
    expect(intersections[0]).toBeVector([0, 0]);
  });

  it("should return multiple intersections of a line and an arc", () => {
    const line = new Line([-5, -5], [1, 1]);
    const arc = new EllipseArc(
      [0, 0],
      [2, 1],
      [2, 0],
      2,
      1,
      0,
      false,
    ).translate(-3.2, -2);
    const intersections = lineEllipseArcIntersection(line, arc);

    //debugImg([line, arc, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(2);
    expect(intersections).toMatchSnapshot();
  });

  it("should return nothing when crossing outisde of the arcs", () => {
    const line = new Line([-1, 1], [2, 0]);

    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false);
    const intersections = lineEllipseArcIntersection(line, arc);

    //debugImg([line, arc, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(0);
  });

  it("should handle tangent lines to the arc", () => {
    const line = new Line([4, -1], [4, 1]).rotate(33);
    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false).rotate(
      33,
    );

    const intersections = lineEllipseArcIntersection(line, arc);

    //debugImg([line, arc, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(1);
    expect(intersections).toMatchSnapshot();
  });

  it("should handle vertical lines with the arc", () => {
    const line = new Line([3.5, -1], [3.5, 1]).rotate(33);
    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false).rotate(
      33,
    );

    const intersections = lineEllipseArcIntersection(line, arc);

    //debugImg([line, arc, ...intersections.map((p) => dpnt(p))]);
    expect(intersections.length).toBe(2);
    expect(intersections).toMatchSnapshot();
  });

  it("should return nothing when there is not intersection", () => {
    const line = new Line([12, -1], [12, 1]);
    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false).rotate(
      33,
    );

    const intersections = lineEllipseArcIntersection(line, arc);
    expect(intersections.length).toBe(0);
  });
});
