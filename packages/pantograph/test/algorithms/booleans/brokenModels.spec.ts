import { describe, it, expect } from "vitest";
import { importJSON } from "../../../src/import/json/importJSON";

import { cut } from "../../../src/booleanOperations";

import fixture from "./fixture1.json";

describe("tests that correspond to bugs found in real models", () => {
  it.only("should cut the model in fixture 1", () => {
    const [a, b] = fixture.map(importJSON);
    const cutted = cut(a, b);
    expect(cutted).toMatchSnapshot();
  });
});
