import { describe, it, expect } from "vitest";

import { importJSON } from "../../src/import/json/importJSON";
import { fuseAll } from "../../src/booleanOperations";

import mandala from "./mandala.json";
import mandala2 from "./mandala2.json";

describe("mandala", () => {
  it("should fuse the mandala", () => {
    const fused = fuseAll(mandala.map(importJSON));
    expect(fused).toMatchSnapshot();
  });

  it("should fuse the second mandala", () => {
    const importedMandala = mandala2.map(importJSON);
    const fused = fuseAll(importedMandala.slice());
    expect(fused).toMatchSnapshot();
  });
});
