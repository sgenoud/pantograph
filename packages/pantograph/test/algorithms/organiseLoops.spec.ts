import { describe, it, expect } from "vitest";

import { organiseLoops } from "../../src/algorithms/organiseLoops";

import { Figure } from "../../src/models/Figure";

import { rect, translation, rotation } from "../quickShapes";

describe("organiseLoops", () => {
  it("returns a single figure if there are no holes", () => {
    const loops = [rect(2, 2)];

    expect(organiseLoops(loops)).toEqual([new Figure(loops[0])]);
  });

  it("organises a single hole", () => {
    const loops = [rect(2, 2), rect(1, 1)];

    expect(organiseLoops(loops)).toEqual([new Figure(loops[0], [loops[1]])]);
  });

  it("organises multiple figures without holes", () => {
    const loops = [
      rect(2, 2),
      rect(2, 2).transform(translation({ x: 5 })),
      rect(2, 2).transform(translation({ x: 10 })),
      rect(2, 2).transform(translation({ x: 15 })),
    ];

    expect(organiseLoops(loops)).toEqual([
      new Figure(loops[0]),
      new Figure(loops[1]),
      new Figure(loops[2]),
      new Figure(loops[3]),
    ]);
  });

  it("assigns the hole to the correct loop", () => {
    const loops = [
      rect(2, 2),
      rect(2, 2).transform(translation({ x: 5 })),
      rect(2, 2).transform(translation({ x: 10 })),
      rect(2, 2).transform(translation({ x: 15 })),
      rect(1, 1).transform(translation({ x: 5 })),
    ];

    const organised = organiseLoops(loops);

    expect(organised).toContainEqual(new Figure(loops[0]));
    expect(organised).toContainEqual(new Figure(loops[2]));
    expect(organised).toContainEqual(new Figure(loops[3]));
    expect(organised).toContainEqual(new Figure(loops[1], [loops[4]]));
  });

  it("considers works correctly with nested loops", () => {
    const loops = [rect(2, 2), rect(5, 5), rect(8, 8), rect(1, 1)];

    const organised = organiseLoops(loops);

    expect(organised).toContainEqual(new Figure(loops[0], [loops[3]]));
    expect(organised).toContainEqual(new Figure(loops[2], [loops[1]]));
  });

  it("works correcty even when the bounding box overlap but not the loops", () => {
    const loops = [
      rect(10, 1).transform(rotation(45)),
      rect(0.1, 0.1).transform(translation({ x: 3 })),
    ];
    expect(loops[0].boundingBox.overlaps(loops[1].boundingBox)).toBe(true);

    const organised = organiseLoops(loops);

    expect(organised).toContainEqual(new Figure(loops[0]));
    expect(organised).toContainEqual(new Figure(loops[1]));
  });
});
