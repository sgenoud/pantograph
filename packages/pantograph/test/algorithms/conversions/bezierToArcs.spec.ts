import { it, expect } from "vitest";
import { approximateBezierCurveAsArcs } from "../../../src/algorithms/conversions/bezierToArcs";
//import { debugImg, dpnt } from "../../debug";
import { CubicBezier } from "../../../src/models/segments/CubicBezier";
import { QuadraticBezier } from "../../../src/models/segments/QuadraticBezier";

it("approximate a cubic bezier with arcs", () => {
  const bezier = new CubicBezier([0, 0], [3, 0], [1, 1], [2, 3]);

  const arcs = approximateBezierCurveAsArcs(bezier, 1e-3);

  //debugImg([{ shape: bezier, color: "blue" }, ...arcs], "bezier-to-arcs");
  expect(arcs).toMatchSnapshot();
});

it("approximate a squiggly cubic bezier with arcs", () => {
  const bezier = new CubicBezier([0, 0], [3, 0], [1, 1], [2, -3]);

  const arcs = approximateBezierCurveAsArcs(bezier, 1e-3);

  //debugImg([{ shape: bezier, color: "blue" }, ...arcs], "bezier-to-arcs");
  expect(arcs).toMatchSnapshot();
});

it("approximate a quadratic bezier with arcs ", () => {
  const bezier = new QuadraticBezier([0, 0], [1, 1], [2, 3]);

  const arcs = approximateBezierCurveAsArcs(bezier, 1e-3);

  //debugImg([{ shape: bezier, color: "blue" }, ...arcs], "bezier-to-arcs");
  expect(arcs).toMatchSnapshot();
});
