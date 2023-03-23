import { describe, it, expect } from "vitest";
import { Line } from "../../../src/models/segments/Line";
import { radRotation } from "../../quickShapes";

describe("Line", () => {
  it("checks isOnSegment correctly", () => {
    const line = new Line([0, 0], [1, 1]);
    expect(line.isOnSegment([0, 0])).toBe(true);
    expect(line.isOnSegment([1, 1])).toBe(true);
    expect(line.isOnSegment([0.5, 0.5])).toBe(true);
    expect(line.isOnSegment([0.25, 0.25])).toBe(true);
    expect(line.isOnSegment([0.75, 0.75])).toBe(true);

    expect(line.isOnSegment([0.5, 0.25])).toBe(false);
    expect(line.isOnSegment([0.5, 0.75])).toBe(false);
    expect(line.isOnSegment([0.25, 0.5])).toBe(false);
    expect(line.isOnSegment([0.75, 0.5])).toBe(false);

    expect(line.isOnSegment([-1, -1])).toBe(false);
    expect(line.isOnSegment([2, 2])).toBe(false);

    expect(line.reverse().isOnSegment([0.2, 0.2])).toBe(true);
  });

  it("checks the precision for small changes of angle", () => {
    const line = new Line([0, 0], [1, 1]);

    const tr = radRotation(line.precision * 10);
    expect(line.isOnSegment(tr.transform([0.5, 0.5]))).toBe(false);

    const tr2 = radRotation(line.precision / 10);
    expect(line.isOnSegment(tr2.transform([0.5, 0.5]))).toBe(true);
  });

  it("checks isOnSegment correctly for vertical lines", () => {
    const line = new Line([0, 0], [0, 1]);
    expect(line.isOnSegment([0, 0])).toBe(true);
    expect(line.isOnSegment([0, 1])).toBe(true);
    expect(line.isOnSegment([0, 0.5])).toBe(true);
    expect(line.isOnSegment([0, 0.25])).toBe(true);
    expect(line.isOnSegment([0, 0.75])).toBe(true);

    expect(line.isOnSegment([0.5, 0.5])).toBe(false);
    expect(line.isOnSegment([0.25, 0.5])).toBe(false);
    expect(line.isOnSegment([0.75, 0.5])).toBe(false);

    expect(line.isOnSegment([-1, -1])).toBe(false);
    expect(line.isOnSegment([2, 2])).toBe(false);

    expect(line.reverse().isOnSegment([0, 0.2])).toBe(true);
  });

  it("computes distance correctly", () => {
    const line = new Line([0, 0], [0, 1]);

    expect(line.distanceFrom([0, 0])).toBe(0);
    expect(line.distanceFrom([0, 1])).toBe(0);

    expect(line.distanceFrom([0.5, 0.5])).toBeCloseTo(0.5);
    expect(line.distanceFrom([0.25, 0.25])).toBeCloseTo(0.25);

    expect(line.distanceFrom([Math.PI, Math.PI / 4])).toBeCloseTo(Math.PI);

    expect(line.distanceFrom([-1, 0])).toBeCloseTo(1);
    expect(line.distanceFrom([0, 2])).toBeCloseTo(1);

    expect(line.distanceFrom([3, 5])).toBeCloseTo(5);
  });

  describe("line splitting", () => {
    const line = new Line([0, 0], [1, 1]);

    it("splits line correctly", () => {
      const [first, second] = line.splitAt([0.5, 0.5]);
      expect(first.firstPoint).toBeVector([0, 0]);
      expect(first.lastPoint).toBeVector([0.5, 0.5]);
      expect(second.firstPoint).toBeVector([0.5, 0.5]);
      expect(second.lastPoint).toBeVector([1, 1]);

      const [first2, second2] = line.reverse().splitAt([0.25, 0.25]);

      expect(first2.firstPoint).toBeVector([1, 1]);
      expect(first2.lastPoint).toBeVector([0.25, 0.25]);
      expect(second2.firstPoint).toBeVector([0.25, 0.25]);
      expect(second2.lastPoint).toBeVector([0, 0]);
    });

    it("sorts split points correctly", () => {
      const [first, second, third] = line.splitAt([
        [0.5, 0.5],
        [0.25, 0.25],
      ]);

      expect(first.firstPoint).toBeVector([0, 0]);
      expect(first.lastPoint).toBeVector([0.25, 0.25]);
      expect(second.firstPoint).toBeVector([0.25, 0.25]);
      expect(second.lastPoint).toBeVector([0.5, 0.5]);
      expect(third.firstPoint).toBeVector([0.5, 0.5]);
      expect(third.lastPoint).toBeVector([1, 1]);

      const [firstR, secondR, thirdR] = line.reverse().splitAt([
        [0.25, 0.25],
        [0.5, 0.5],
      ]);

      expect(firstR.firstPoint).toBeVector([1, 1]);
      expect(firstR.lastPoint).toBeVector([0.5, 0.5]);
      expect(secondR.firstPoint).toBeVector([0.5, 0.5]);
      expect(secondR.lastPoint).toBeVector([0.25, 0.25]);
      expect(thirdR.firstPoint).toBeVector([0.25, 0.25]);
      expect(thirdR.lastPoint).toBeVector([0, 0]);
    });

    it("splits correctly when the segment is near parallel to X", () => {
      const line = new Line(
        [-35.35533905932736, -24.644660940672612],
        [-35.3553390593274, -95.35533905932736]
      );

      const [first, second] = line.splitAt([
        -35.355339059327356, -35.355339059327385,
      ]);

      expect(first.firstPoint).toBeVector([
        -35.35533905932736, -24.644660940672612,
      ]);
      expect(first.lastPoint).toBeVector([
        -35.355339059327356, -35.355339059327385,
      ]);

      expect(second.firstPoint).toBeVector([
        -35.355339059327356, -35.355339059327385,
      ]);
      expect(second.lastPoint).toBeVector([
        -35.3553390593274, -95.35533905932736,
      ]);
    });
  });
});
