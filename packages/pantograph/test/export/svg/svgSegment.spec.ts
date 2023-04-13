import { describe, it, expect } from "vitest";
import { Arc } from "../../../src/models/segments/Arc";
import { svgSegmentToPath } from "../../../src/export/svg/svgSegment";

describe("arc as a path element", () => {
  it("should be able to export an arc", () => {
    const arc = new Arc([0, 0], [1, 1], [0, 1]);
    expect(svgSegmentToPath(arc)).toBe("A 1 1 0 0 1 1 1");
  });

  it("should be able to export the other small arc", () => {
    const arc = new Arc([0, 0], [1, 1], [1, 0], true);
    expect(svgSegmentToPath(arc)).toBe("A 1 1 0 0 0 1 1");
  });

  it("should be able to export the clockwise long arc", () => {
    const arc = new Arc([0, 0], [1, 1], [0, 1], true);
    expect(svgSegmentToPath(arc)).toBe("A 1 1 0 1 0 1 1");
  });

  it("should be able to export the counter clockwise long arc", () => {
    const arc = new Arc([0, 0], [1, 1], [1, 0]);
    expect(svgSegmentToPath(arc)).toBe("A 1 1 0 1 1 1 1");
  });
});
