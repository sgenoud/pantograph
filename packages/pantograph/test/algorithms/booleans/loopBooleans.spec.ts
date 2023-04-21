import { describe, it, expect } from "vitest";

import {
  cutLoops,
  fuseLoops,
  intersectLoops,
} from "../../../src/algorithms/boolean/loopBooleans";

import { rect, translation, polygon } from "../../quickShapes";

describe("boolean for loops", () => {
  describe("fuseLoops", () => {
    it("handles two loops that don't overlap", () => {
      const loops = [rect(2, 2), rect(2, 2).transform(translation({ x: 5 }))];
      expect(fuseLoops(loops[0], loops[1])).toEqual(loops);
    });

    it("handles two loops that overlap", () => {
      const loops = [rect(2, 2), rect(2, 2).transform(translation({ x: 1 }))];
      const fused = fuseLoops(loops[0], loops[1]);
      expect(fused.length).toEqual(1);
      expect(fused[0]).toBeLoop(rect(3, 2).transform(translation({ x: 0.5 })));
    });

    it("handles two loops that cross", () => {
      const loops = [rect(4, 2), rect(2, 4)];
      const fused = fuseLoops(loops[0], loops[1]);
      expect(fused.length).toEqual(1);
      expect(fused[0]).toBeLoop(
        polygon([
          [-1, 1],
          [-1, 2],
          [1, 2],
          [1, 1],
          [2, 1],
          [2, -1],
          [1, -1],
          [1, -2],
          [-1, -2],
          [-1, -1],
          [-2, -1],
          [-2, 1],
        ])
      );
    });

    it("handles two loops that only share a side", () => {
      const loops = [
        rect(2, 2).transform(translation({ x: -1 })),
        rect(2, 1).transform(translation({ x: 1 })),
      ];
      const fused = fuseLoops(loops[0], loops[1]);
      expect(fused.length).toEqual(1);
      expect(fused[0].boundingBox).toEqual(rect(4, 2).boundingBox);
    });

    it("handles two loops that are very similar", () => {
      const loops = [rect(2, 4).transform(translation({ y: -1 })), rect(2, 2)];

      const fused = fuseLoops(loops[0], loops[1]);
      expect(fused.length).toEqual(1);
      expect(fused[0].simplify()).toBeLoop(loops[0]);
    });

    it("handles two loops that share a complete side", () => {
      const loops = [
        rect(2, 2).transform(translation({ x: -1 })),
        rect(2, 2).transform(translation({ x: 1 })),
      ];
      const fused = fuseLoops(loops[0], loops[1]);
      expect(fused.length).toEqual(1);
      expect(fused[0]).toBeLoop(rect(4, 2));
    });

    it("handles two loops that only share a corner", () => {
      const loops = [
        rect(2, 2),
        polygon([
          [1, 0],
          [2, 0],
          [2, 2],
        ]),
      ];
      const fused = fuseLoops(loops[0], loops[1]);
      expect(fused).toBeEquivalentLoops(loops);
    });

    it("handles a loop included in another one", () => {
      const loops = [rect(2, 2), rect(1, 1)];
      const fused = fuseLoops(loops[0], loops[1]);
      expect(fused.length).toEqual(1);
      expect(fused[0]).toBeLoop(loops[0]);
    });

    it("handles a loop included in another one that touches its boundaries", () => {
      const loops = [
        rect(2, 2),
        polygon([
          [0, 1],
          [1, 0],
          [-1, 0],
        ]),
      ];
      const fused = fuseLoops(loops[0], loops[1]);
      expect(fused.length).toEqual(1);
      expect(fused[0]).toBeLoop(loops[0]);
    });

    it("handles shapes that create an inside loop", () => {
      const loops = [
        rect(2, 4).transform(translation({ x: -1 })),
        polygon([
          [0, 2],
          [3, 2],
          [3, -2],
          [0, -2],
          [0, -1],
          [1, -1],
          [1, 1],
          [0, 1],
        ]),
      ];
      const fused = fuseLoops(loops[0], loops[1]);
      expect(fused.length).toEqual(2);

      expect(fused).toBeEquivalentLoops([
        rect(5, 4).transform(translation({ x: 0.5 })),
        rect(1, 2).transform(translation({ x: 0.5 })),
      ]);
    });

    it("handles closing a set of squares", () => {
      const p1 = polygon([
        [-35, -35],
        [-35, -95],
        [35, -95],
        [35, -24],
        [-24, -24],
        [-24, 24],
        [35, 24],
        [35, 95],
        [-35, 95],
        [-35, 35],
        [-95, 35],
        [-95, -35],
      ]);
      const p2 = polygon([
        [95, 35],
        [24, 35],
        [24, -35],
        [95, -35],
      ]);

      const fused = fuseLoops(p1, p2);

      expect(fused).toBeEquivalentLoops([
        polygon([
          [24, -24],
          [-24, -24],
          [-24, 24],
          [24, 24],
        ]),
        polygon([
          [35, 35],
          [35, 95],
          [-35, 95],
          [-35, 35],
          [-95, 35],
          [-95, -35],
          [-35, -35],
          [-35, -95],
          [35, -95],
          [35, -35],
          [95, -35],
          [95, 35],
        ]),
      ]);
    });
  });

  describe("cutLoops", () => {
    it("handles two loops that don't overlap", () => {
      const loops = [rect(2, 2), rect(2, 2).transform(translation({ x: 5 }))];
      expect(cutLoops(loops[0], loops[1])).toEqual([loops[0]]);
    });

    it("handles two loops that overlap", () => {
      const loops = [rect(2, 2), rect(2, 2).transform(translation({ x: 1 }))];
      const cut = cutLoops(loops[0], loops[1]);
      expect(cut.length).toEqual(1);
      expect(cut[0]).toBeLoop(rect(1, 2).transform(translation({ x: -0.5 })));
    });

    it("handles two loops that cross", () => {
      const loops = [rect(4, 2), rect(2, 4)];
      const cut = cutLoops(loops[0], loops[1]);
      expect(cut).toBeEquivalentLoops([
        rect(1, 2).transform(translation({ x: -1.5 })),
        rect(1, 2).transform(translation({ x: 1.5 })),
      ]);
    });

    it("handles two loops that only share a side", () => {
      const loops = [
        rect(2, 2).transform(translation({ x: -1.5 })),
        rect(2, 1).transform(translation({ x: 2 })),
      ];
      const cut = cutLoops(loops[0], loops[1]);
      expect(cut.length).toEqual(1);
      expect(cut[0]).toBeLoop(loops[0]);
    });

    it("handles two loops that are very similar", () => {
      const loops = [rect(2, 4).transform(translation({ y: -1 })), rect(2, 2)];

      const cut = cutLoops(loops[0], loops[1]);
      expect(cut[0].simplify()).toBeLoop(
        rect(2, 2).transform(translation({ y: -2 }))
      );
    });

    it("handles two loops that share a complete side", () => {
      const loops = [
        rect(2, 2).transform(translation({ x: -1 })),
        rect(2, 2).transform(translation({ x: 1 })),
      ];
      const cut = cutLoops(loops[0], loops[1]);
      expect(cut.length).toEqual(1);
      expect(cut[0]).toBeLoop(loops[0]);
    });

    it("handles two loops that only share a corner", () => {
      const loops = [
        rect(2, 2),
        polygon([
          [1, 0],
          [2, 0],
          [2, 2],
        ]),
      ];
      const cut = cutLoops(loops[0], loops[1]);
      expect(cut.length).toEqual(1);
      expect(cut[0]).toBeLoop(loops[0]);
    });

    it("handles a loop included in another one", () => {
      const loops = [rect(2, 2), rect(1, 1)];
      const cut = cutLoops(loops[0], loops[1]);
      expect(cut).toBeEquivalentLoops(loops);
    });

    it("handles a loop included in another one that touches its boundaries", () => {
      const loops = [
        rect(2, 2),
        polygon([
          [0, 1],
          [1, 0],
          [-1, 0],
        ]),
      ];
      const cut = cutLoops(loops[0], loops[1]);
      expect(cut).toBeEquivalentLoops(loops);
    });

    it("handles shapes that cuts a shape into pieces", () => {
      const loops = [
        rect(4, 4),
        fuseLoops(rect(2, 4), rect(4, 2))[0],
        fuseLoops(rect(2, 12), rect(12, 2))[0],
      ];
      const cornerRects = [
        rect(1, 1).transform(translation({ x: -1.5, y: -1.5 })),
        rect(1, 1).transform(translation({ x: 1.5, y: 1.5 })),
        rect(1, 1).transform(translation({ x: 1.5, y: -1.5 })),
        rect(1, 1).transform(translation({ x: -1.5, y: 1.5 })),
      ];
      expect(cutLoops(loops[0], loops[1])).toBeEquivalentLoops(cornerRects);
      expect(cutLoops(loops[0], loops[2])).toBeEquivalentLoops(cornerRects);
    });
  });

  describe("intersectLoops", () => {
    it("handles two loops that don't overlap", () => {
      const loops = [rect(2, 2), rect(2, 2).transform(translation({ x: 5 }))];
      expect(intersectLoops(loops[0], loops[1])).toEqual([]);
    });

    it("handles two loops that overlap", () => {
      const loops = [rect(2, 2), rect(2, 2).transform(translation({ x: 1 }))];
      const intersected = intersectLoops(loops[0], loops[1]);
      expect(intersected.length).toEqual(1);
      expect(intersected[0]).toBeLoop(
        rect(1, 2).transform(translation({ x: 0.5 }))
      );
    });

    it("handles two loops that cross", () => {
      const loops = [rect(4, 2), rect(2, 4)];
      const intersected = intersectLoops(loops[0], loops[1]);
      expect(intersected.length).toEqual(1);
      expect(intersected[0]).toBeLoop(rect(2, 2));
    });

    it("handles two loops that only share a side", () => {
      const loops = [
        rect(2, 2).transform(translation({ x: -1 })),
        rect(2, 1).transform(translation({ x: 1 })),
      ];
      const intersected = intersectLoops(loops[0], loops[1]);
      expect(intersected).toEqual([]);
    });

    it("handles two loops that are very similar", () => {
      const loops = [rect(2, 4).transform(translation({ y: -1 })), rect(2, 2)];

      const intersected = intersectLoops(loops[0], loops[1]);
      expect(intersected.length).toEqual(1);
      expect(intersected[0].simplify()).toBeLoop(loops[1]);
    });

    it("handles two loops that share a complete side", () => {
      const loops = [
        rect(2, 2).transform(translation({ x: -1 })),
        rect(2, 2).transform(translation({ x: 1 })),
      ];
      const intersected = intersectLoops(loops[0], loops[1]);
      expect(intersected).toEqual([]);
    });

    it("handles two loops that only share a corner", () => {
      const loops = [
        rect(2, 2),
        polygon([
          [1, 0],
          [2, 0],
          [2, 2],
        ]),
      ];
      const intersected = intersectLoops(loops[0], loops[1]);
      expect(intersected).toEqual([]);
    });

    it("handles a loop included in another one", () => {
      const loops = [rect(2, 2), rect(1, 1)];
      const intersected = intersectLoops(loops[0], loops[1]);
      expect(intersected.length).toEqual(1);
      expect(intersected[0]).toBeLoop(loops[1]);
    });

    it("handles a loop included in another one that touches its boundaries", () => {
      const loops = [
        rect(2, 2),
        polygon([
          [0, 1],
          [1, 0],
          [-1, 0],
        ]),
      ];
      const intersected = intersectLoops(loops[0], loops[1]);
      expect(intersected.length).toEqual(1);
      expect(intersected[0]).toBeLoop(loops[1]);
    });

    it("handles shapes have sub shapes starting with common segments", () => {
      const loops = [
        polygon([
          [0, 2],
          [3, 2],
          [3, -2],
          [0, -2],
          [0, -1],
          [2, -1],
          [2, 1],
          [0, 1],
        ]),
        rect(2, 4),
      ];
      const smallRects = [
        rect(1, 1).transform(translation({ x: 0.5, y: 1.5 })),
        rect(1, 1).transform(translation({ x: 0.5, y: -1.5 })),
      ];
      expect(intersectLoops(loops[0], loops[1])).toBeEquivalentLoops(
        smallRects
      );

      expect(intersectLoops(loops[1], loops[0])).toBeEquivalentLoops(
        smallRects
      );
    });

    it("handles cutting a weird shape from a square", () => {
      const p1 = polygon([
        [93, 33],
        [26, 33],
        [26, -33],
        [93, -33],
      ]);
      const p2 = polygon([
        [-37, -37],
        [-37, -97],
        [37, -97],
        [37, -22],
        [-22, -22],
        [-22, 22],
        [37, 22],
        [37, 97],
        [-37, 97],
        [-37, 37],
        [-97, 37],
        [-97, -37],
      ]);

      const cut = cutLoops(p1, p2);

      expect(cut).toBeEquivalentLoops([
        polygon([
          [37, 33],
          [37, 22],
          [26, 22],
          [26, -22],
          [37, -22],
          [37, -33],
          [93, -33],
          [93, 33],
        ]),
      ]);
    });
  });
});
