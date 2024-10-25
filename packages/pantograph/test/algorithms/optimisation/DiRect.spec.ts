import { describe, it, expect } from "vitest";

import { findGlobalMinimum } from "../../../src/algorithms/optimisation/DiRect.js";

describe("DiRect", () => {
  it("finds the global minimum of a function", () => {
    const result = findGlobalMinimum(
      (x) => (x[0] - 0.2) ** 2 + (x[1] - 0.3) ** 2 + 2,
    );

    expect(result.fMin).toBeCloseTo(2);
    expect(result.argMin).toBeVector([0.2, 0.3], 1e-7);
    expect(result.iterations).toBeLessThan(50);
  });

  it("finds the global minimum of the Branin function", () => {
    const branin = ([x, y]: [number, number]) => {
      const x1 = 15 * x - 5;
      const x2 = 15 * y;
      const b = 5.1 / (4.0 * Math.PI * Math.PI);
      const c = 5.0 / Math.PI;
      const r = 6.0;
      const s = 10.0;
      const t = 1.0 / (8.0 * Math.PI);

      const v = x2 - b * x1 * x1 + c * x1 - r;
      return v * v + s * (1.0 - t) * Math.cos(x1) + s;
    };

    const result = findGlobalMinimum(branin);

    expect(result.fMin).toBeCloseTo(0.397887);
    expect(result.iterations).toBeLessThan(50);
  });
});
