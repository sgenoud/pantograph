import { describe, it, expect } from "vitest";
import { RAD2DEG } from "../../../src/main";
import {
  EllipseArc,
  svgEllipse,
} from "../../../src/models/segments/EllipseArc";
import { add, scalarMultiply } from "../../../src/vectorOperations";
import { debugImg, dpnt } from "../../debug";

describe("EllipseArc", () => {
  it("should handle major and minor axes correctly", () => {
    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, true);
    const arc2 = new EllipseArc([0, 0], [2, 1], [2, 0], 1, 2, -90, true);

    expect(arc.majorRadius).toBe(2);
    expect(arc.minorRadius).toBe(1);

    expect(arc2.majorRadius).toBe(2);
    expect(arc2.minorRadius).toBe(1);

    expect(arc.tiltAngle).toBeCloseTo(0);
    expect(arc2.tiltAngle).toBeCloseTo(0);

    expect(arc.isSame(arc2)).toBe(true);
  });

  it("should handle translations correctly", () => {
    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, true);
    const translatedArc = arc.translate(1, 1);

    expect(translatedArc.firstPoint).toEqual([1, 1]);
    expect(translatedArc.lastPoint).toEqual([3, 2]);
    expect(translatedArc.center).toEqual([3, 1]);
    expect(translatedArc.majorRadius).toBe(arc.majorRadius);
    expect(translatedArc.minorRadius).toBe(arc.minorRadius);
    expect(translatedArc.tiltAngle).toBe(arc.tiltAngle);

    expect(translatedArc.deltaAngle).toBeCloseTo(arc.deltaAngle);
    expect(translatedArc.firstAngle).toBeCloseTo(arc.firstAngle);
    expect(translatedArc.lastAngle).toBeCloseTo(arc.lastAngle);
  });

  it("should handle rotations correctly", () => {
    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, true);
    const rotatedArc = arc.rotate(90);

    expect(rotatedArc.firstPoint).toBeVector([0, 0]);
    expect(rotatedArc.lastPoint).toBeVector([-1, 2]);
    expect(rotatedArc.center).toBeVector([0, 2]);
    expect(rotatedArc.tiltAngle * RAD2DEG).toBe(arc.tiltAngle * RAD2DEG + 90);
    expect(rotatedArc.majorRadius).toBeCloseTo(arc.majorRadius);
    expect(rotatedArc.minorRadius).toBeCloseTo(arc.minorRadius);

    expect(rotatedArc.deltaAngle).toBeCloseTo(arc.deltaAngle);
  });

  it("should handle major and minor axes correctly when tilted", () => {
    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, true).rotate(
      33,
    );
    const arc2 = new EllipseArc([0, 0], [2, 1], [2, 0], 1, 2, -90, true).rotate(
      33,
    );

    expect(arc.majorRadius).toBe(2);
    expect(arc.minorRadius).toBe(1);

    expect(arc2.majorRadius).toBe(2);
    expect(arc2.minorRadius).toBe(1);

    expect(arc.tiltAngle).toBeCloseTo(arc.tiltAngle);

    expect(arc.deltaAngle).toBeCloseTo(arc2.deltaAngle);
    expect(arc.firstAngle).toBeCloseTo(arc2.firstAngle);
    expect(arc.lastAngle).toBeCloseTo(arc2.lastAngle);

    expect(arc.isSame(arc2)).toBe(true);
  });

  it("should handle tilt angle correctly", () => {
    const arc = new EllipseArc([-2, 0], [2, 0], [0, 0], 2, 1, 0, true).rotate(
      -33,
    );
    //debugImg(arc);
    expect(arc.tiltAngle * RAD2DEG).toBeCloseTo(360 - 33);
  });

  it("should reverse correctly", () => {
    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, true)
      .rotate(33)
      .translate(2, 3);

    expect(arc.reverse().clockwise).toBe(!arc.clockwise);
    expect(arc.reverse().isSame(arc)).toBe(true);
  });

  it("should have stable param to point methods", () => {
    const arc = new EllipseArc([0, 0], [4, 0], [2, 0], 2, 1, 0, true)
      .translateX(-2)
      .rotate(33);

    const p = arc.paramPoint(0.22);
    expect(arc.pointToParam(p)).toBeCloseTo(0.22);
  });

  it("should compute the bounding box correctly", () => {
    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false).rotate(
      22,
    );
    const arc2 = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, true).rotate(
      22,
    );
    expect(arc.boundingBox).toMatchSnapshot();
    expect(arc2.boundingBox).toMatchSnapshot();
  });

  it("should compute distances to a point correctly", () => {
    const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false);

    const distantPoint = (param: number, distance: number) => {
      const p0 = arc.paramPoint(param);
      const p1 = arc.normalAt(p0);
      return add(scalarMultiply(p1, distance), p0);
    };

    expect(arc.distanceFrom([2, 0])).toBeCloseTo(1);
    expect(arc.distanceFrom(distantPoint(0, 0.8))).toBeCloseTo(0.8);
    expect(arc.distanceFrom(distantPoint(0.2, 0.8))).toBeCloseTo(0.8);
    expect(arc.distanceFrom(distantPoint(0.4, 0.8))).toBeCloseTo(0.8);
    expect(arc.distanceFrom(distantPoint(0.6, 0.8))).toBeCloseTo(0.8);
    expect(arc.distanceFrom(distantPoint(0.8, 8))).toBeCloseTo(8);
    expect(arc.distanceFrom(distantPoint(0.9, 0.8))).toBeCloseTo(0.8);

    expect(arc.distanceFrom(distantPoint(0.1, -0.1))).toBeCloseTo(0.1);
    expect(arc.distanceFrom(distantPoint(0.2, -0.1))).toBeCloseTo(0.1);
    expect(arc.distanceFrom(distantPoint(0.4, -0.1))).toBeCloseTo(0.1);
    expect(arc.distanceFrom(distantPoint(0.6, -0.1))).toBeCloseTo(0.1);
    expect(arc.distanceFrom(distantPoint(0.8, -0.1))).toBeCloseTo(0.1);
    expect(arc.distanceFrom(distantPoint(0.9, -0.1))).toBeCloseTo(0.1);
  });

  describe("split arcs", () => {
    it("handles the case for a simple split", () => {
      const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false);
      const p = (theta: number) => arc.paramPoint(theta);

      const checkForValue = (theta: number) => {
        const [arc1, arc2] = arc.splitAt(p(theta));
        expect(arc1?.firstPoint).toBeVector([0, 0]);
        expect(arc1?.lastPoint).toBeVector(p(theta));
        expect(arc2?.firstPoint).toBeVector(p(theta));
        expect(arc2?.lastPoint).toBeVector([2, 1]);
      };

      checkForValue(0.0001);
      checkForValue(0.1);
      checkForValue(0.5);
      checkForValue(0.95);
      checkForValue(0.9999);
    });

    it("handles the case for a multiple splits", () => {
      const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false);
      const p = (theta: number) => arc.paramPoint(theta);

      const points = [0.5, 0.002, 0.25, 0.999];

      const sortedPoints = [...points].sort((a, b) => a - b);
      sortedPoints.unshift(0);
      sortedPoints.push(1);

      const arcs = arc.splitAt(points.map(p));

      expect(arcs.length).toBe(points.length + 1);

      arcs.forEach((arc, i) => {
        expect(arc?.firstPoint).toBeVector(p(sortedPoints[i]));
        expect(arc?.lastPoint).toBeVector(p(sortedPoints[i + 1]));
      });
    });

    it("handles the case for a multiple splits with two points that are the same", () => {
      const arc = new EllipseArc([0, 0], [2, 1], [2, 0], 2, 1, 0, false);
      const p = (theta: number) => arc.paramPoint(theta);

      const points = [0.5, 0.002, 0.25, 0.999, 0.5 + 1e-12];

      const sortedPoints = [...points.slice(0, -1)].sort((a, b) => a - b);
      sortedPoints.unshift(0);
      sortedPoints.push(1);

      const arcs = arc.splitAt(points.map(p));

      expect(arcs.length).toBe(points.length);

      arcs.forEach((arc, i) => {
        expect(arc?.firstPoint).toBeVector(p(sortedPoints[i]));
        expect(arc?.lastPoint).toBeVector(p(sortedPoints[i + 1]));
      });
    });
  });
});

describe("svgEllipse", () => {
  it("draws the correct ellipse with the correct attributes", () => {
    const arc = svgEllipse([0, 2], [2, 1], 3, 1, 0, true, false);

    //debugImg([arc, dpnt([0, 0])]);
    expect(arc).toMatchSnapshot();
  });

  it("changes the tilt angle as expected", () => {
    const arc = svgEllipse([0, 0], [42.42, 42.42], 30, 50, 45, false, true);

    //debugImg([arc]);
    expect(arc).toMatchSnapshot();
  });
});
