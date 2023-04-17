import { describe, it, expect } from "vitest";
import {
  Arc,
  tangentArc,
  threePointsArc,
} from "../../../src/models/segments/Arc";
import {
  add,
  normalize,
  polarToCartesian,
} from "../../../src/vectorOperations";
import { debugImg } from "../../debug";

import { translation } from "../../quickShapes";

describe("Arc", () => {
  describe("checks isOnSegment correctly", () => {
    it("handles the case where the arc is ccw", () => {
      const arc = new Arc([0, 0], [1, 1], [0, 1]);

      expect(arc.isOnSegment([0.5, 0.5])).toBe(false);
      expect(arc.isOnSegment([0, 0])).toBe(true);
      expect(arc.isOnSegment([1, 1])).toBe(true);
      expect(
        arc.isOnSegment(add([0, 1], polarToCartesian(1, -Math.PI / 4)))
      ).toBe(true);

      expect(
        arc.isOnSegment(add([0, 1], polarToCartesian(1, Math.PI / 4)))
      ).toBe(false);
    });

    it("handles the case where the arc is ccw", () => {
      const arc = new Arc([0, 0], [1, 1], [0, 1], true);

      expect(arc.isOnSegment([0.5, 0.5])).toBe(false);
      expect(arc.isOnSegment([0, 0])).toBe(true);
      expect(arc.isOnSegment([1, 1])).toBe(true);
      expect(
        arc.isOnSegment(add([0, 1], polarToCartesian(1, Math.PI / 4)))
      ).toBe(true);

      expect(
        arc.isOnSegment(add([0, 1], polarToCartesian(1, -Math.PI / 4)))
      ).toBe(false);
    });
  });

  it("checks the precision for small changes of position", () => {
    const arc = new Arc([0, 0], [1, 1], [0, 1]);
    const point = add([0, 1], polarToCartesian(1, -Math.PI / 4));

    const tr = translation({ x: arc.precision * 10 });
    expect(arc.isOnSegment(tr.transform(point))).toBe(false);

    const tr2 = translation({ x: arc.precision / 10 });
    expect(arc.isOnSegment(tr2.transform(point))).toBe(true);
  });

  it("computes distance correctly", () => {
    const arc = new Arc([0, 0], [1, 1], [0, 1]);

    const p = (r: number) => add([0, 1], polarToCartesian(r, -Math.PI / 4));
    expect(arc.distanceFrom(p(0.5))).toBeCloseTo(0.5);
    expect(arc.distanceFrom(p(2))).toBeCloseTo(1);

    expect(arc.distanceFrom(p(-1))).toBeCloseTo(2 * Math.cos(Math.PI / 8));

    expect(arc.distanceFrom([0, -1])).toBeCloseTo(1);
    expect(arc.distanceFrom([-1, 0])).toBeCloseTo(1);
    expect(arc.distanceFrom([2, 1])).toBeCloseTo(1);
    expect(arc.distanceFrom([1, 2])).toBeCloseTo(1);
  });

  describe("split arcs", () => {
    it("handles the case for a simple split", () => {
      const arc = new Arc([0, 0], [1, 1], [0, 1]);

      const p = (theta: number) =>
        add([0, 1], polarToCartesian(1, -Math.PI / 2 + (theta * Math.PI) / 2));

      const checkForValue = (theta: number) => {
        const [arc1, arc2] = arc.splitAt(p(theta));
        expect(arc1?.firstPoint).toBeVector([0, 0]);
        expect(arc1?.lastPoint).toBeVector(p(theta));
        expect(arc2?.firstPoint).toBeVector(p(theta));
        expect(arc2?.lastPoint).toBeVector([1, 1]);
      };

      checkForValue(0.0001);
      checkForValue(0.1);
      checkForValue(0.5);
      checkForValue(0.95);
      checkForValue(0.9999);
    });

    it("handles the case for a multiple splits", () => {
      const arc = new Arc([0, 0], [1, 1], [0, 1]);

      const p = (theta: number) =>
        add([0, 1], polarToCartesian(1, -Math.PI / 2 + (theta * Math.PI) / 2));

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
      const arc = new Arc([0, 0], [1, 1], [0, 1]);

      const p = (theta: number) =>
        add([0, 1], polarToCartesian(1, -Math.PI / 2 + (theta * Math.PI) / 2));

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

describe("three points arc", () => {
  it("computes the right arc with counter clockwise points", () => {
    const arc = threePointsArc([2, 0], [1, 1], [0, 0]);

    expect(arc.isOnSegment([1, 1])).toBe(true);
    expect(arc.center).toBeVector([1, 0]);
    expect(arc.radius).toBe(1);
  });

  it("computes the right arc with clockwise points", () => {
    const arc = threePointsArc([0, 0], [1, 1], [2, 0]);
    expect(arc.isOnSegment([1, 1])).toBe(true);
    expect(arc.center).toBeVector([1, 0]);
    expect(arc.radius).toBe(1);
  });

  it("computes a nearly full arc from three points", () => {
    const arc = threePointsArc([0, 0], [1, 1], [-1e-5, 0]);

    expect(arc.isOnSegment([1, 1])).toBe(true);
    expect(arc.center[0]).toBeCloseTo(0);
    expect(arc.center[1]).toBeCloseTo(1);
  });

  it("fails on three points that are collinear", () => {
    expect(() => threePointsArc([0, 0], [1, 1], [2, 2])).toThrow();
  });

  it("fails on three points that are not all different", () => {
    expect(() => threePointsArc([0, 0], [1, 1], [0, 0])).toThrow();
  });
});

describe("tangentArc arc", () => {
  it("computes the right arc with clockwise points", () => {
    const arc = tangentArc([0, 0], [2, 0], [1, 1]);

    expect(arc.tangentAtFirstPoint).toBeVector(normalize([1, 1]));
    expect(arc.clockwise).toBe(true);
  });
  it("computes the right arc with counter clockwise points", () => {
    const arc = tangentArc([2, 0], [0, 0], [-1, 1]);

    expect(arc.tangentAtFirstPoint).toBeVector(normalize([-1, 1]));
    expect(arc.clockwise).toBe(false);
  });

  it("computes a half circle clockwise", () => {
    const arc = tangentArc([0, 0], [2, 0], [0, 1]);

    expect(arc.tangentAtFirstPoint).toBeVector(normalize([0, 1]));
    expect(arc.tangentAtLastPoint).toBeVector(normalize([0, -1]));

    expect(arc.center).toBeVector([1, 0]);

    expect(arc.clockwise).toBe(true);
  });

  it("computes a half circle counter clockwise", () => {
    const arc = tangentArc([0, 0], [2, 0], [0, -1]);

    expect(arc.tangentAtFirstPoint).toBeVector(normalize([0, -1]));
    expect(arc.tangentAtLastPoint).toBeVector(normalize([0, 1]));

    expect(arc.center).toBeVector([1, 0]);
    expect(arc.clockwise).toBe(false);
  });

  it("fails on two points that are collinear with the direction", () => {
    expect(() => tangentArc([0, 0], [1, 1], [1, 1])).toThrow();
  });
});
