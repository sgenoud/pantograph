import { describe, it, expect } from "vitest";

import {
  cutFiguresLists,
  fuseFiguresLists,
} from "../../../src/algorithms/boolean/figureBooleans";
import { Figure } from "../../../src/models/Figure";

import { polygon, rect, translation } from "../../quickShapes";

const squareFig = (size = 2) => new Figure(rect(size, size));

const holedFig = (contourSize = 4, holeSize = 2) =>
  new Figure(rect(contourSize, contourSize), [rect(holeSize, holeSize)]);

const rectInRect = holedFig();

describe("figure booleans", () => {
  describe("fuseFiguresLists", () => {
    it("should fuse holes", () => {
      const fusedFigures = fuseFiguresLists(
        [rectInRect],
        [squareFig(2).transform(translation({ x: 1 }))]
      );
      expect(fusedFigures.length).toBe(1);
      expect(fusedFigures[0].contour).toBeLoop(rect(4, 4));
      expect(fusedFigures[0].holes).toBeEquivalentLoops([
        rect(1, 2).transform(translation({ x: -0.5 })),
      ]);
    });

    it("should fuse contour and keep holes", () => {
      const fusedFigures = fuseFiguresLists(
        [rectInRect.transform(translation({ x: -2 }))],
        [rectInRect.transform(translation({ x: 2 }))]
      );
      expect(fusedFigures.length).toBe(1);
      expect(fusedFigures[0].contour).toBeLoop(rect(8, 4));
      expect(fusedFigures[0].holes).toBeEquivalentLoops([
        rect(2, 2).transform(translation({ x: -2 })),
        rect(2, 2).transform(translation({ x: 2 })),
      ]);
    });

    it("should fuse contour and fuse holes", () => {
      const fusedFigures = fuseFiguresLists(
        [rectInRect.transform(translation({ x: -0.5 }))],
        [rectInRect.transform(translation({ x: 0.5 }))]
      );
      expect(fusedFigures.length).toBe(1);
      expect(fusedFigures[0].contour).toBeLoop(rect(5, 4));
      expect(fusedFigures[0].holes).toBeEquivalentLoops([rect(1, 2)]);
    });

    it("fuses a figure with a whole", () => {
      const figures: [Figure[], Figure[]] = [
        [rectInRect],
        [new Figure(rect(4, 4)).transform(translation({ x: 2, y: 2 }))],
      ];
      const fusedFigures = fuseFiguresLists(...figures);

      expect(fusedFigures.length).toBe(1);
      expect(fusedFigures[0].contour).toBeLoop(
        polygon([
          [0, 2],
          [-2, 2],
          [-2, -2],
          [2, -2],
          [2, 0],
          [4, 0],
          [4, 4],
          [0, 4],
        ])
      );
      expect(fusedFigures[0].holes).toBeEquivalentLoops([
        polygon([
          [0, 1],
          [-1, 1],
          [-1, -1],
          [1, -1],
          [1, 0],
          [0, 0],
        ]),
      ]);
    });
  });

  describe("cutFiguresLists", () => {
    it("cuts holes", () => {
      const cutFigures = cutFiguresLists([squareFig(4)], [squareFig(2)]);

      expect(cutFigures.length).toBe(1);
      expect(cutFigures[0].contour).toBeLoop(rect(4, 4));
      expect(cutFigures[0].holes).toBeEquivalentLoops([rect(2, 2)]);
    });

    it("cuts within a cut", () => {
      const cutFigures = cutFiguresLists([squareFig(6)], [rectInRect]);

      expect(cutFigures.length).toBe(2);
      expect(cutFigures[0].contour).toBeLoop(rect(6, 6));
      expect(cutFigures[0].holes).toBeEquivalentLoops([rect(4, 4)]);

      expect(cutFigures[1].contour).toBeLoop(rect(2, 2));
      expect(cutFigures[1].holes).toEqual([]);
    });

    it("cuts a contour", () => {
      const figures: [Figure[], Figure[]] = [
        [squareFig(6)],
        [rectInRect.transform(translation({ x: 3, y: 3 }))],
      ];
      const cutFigures = cutFiguresLists(...figures);

      expect(cutFigures.length).toBe(2);

      expect(cutFigures[0].contour).toBeLoop(
        polygon([
          [-3, -3],
          [3, -3],
          [3, 1],
          [1, 1],
          [1, 3],
          [-3, 3],
        ])
      );
      expect(cutFigures[0].holes).toEqual([]);

      expect(cutFigures[1].contour).toBeLoop(
        rect(1, 1).transform(translation({ x: 2.5, y: 2.5 }))
      );
      expect(cutFigures[1].holes).toEqual([]);
    });

    it("cuts a figure with a whole", () => {
      const figures: [Figure[], Figure[]] = [
        [rectInRect],
        [squareFig(4).transform(translation({ x: 2, y: 2 }))],
      ];
      const cutFigures = cutFiguresLists(...figures);

      expect(cutFigures.length).toBe(1);
      expect(cutFigures[0].contour).toBeLoop(
        polygon([
          [0, 2],
          [-2, 2],
          [-2, -2],
          [2, -2],
          [2, 0],
          [1, 0],
          [1, -1],
          [-1, -1],
          [-1, 1],
          [0, 1],
        ])
      );
      expect(cutFigures[0].holes).toEqual([]);
    });

    it("cuts a figure with intersecting wholes", () => {
      const figures: [Figure[], Figure[]] = [
        [
          new Figure(rect(8, 8), [
            rect(3, 6).transform(translation({ x: -1.5 })),
          ]),
        ],
        [rectInRect],
      ];

      const cutFigures = cutFiguresLists(...figures);

      expect(cutFigures.length).toBe(2);

      expect(cutFigures[0].contour).toBeLoop(rect(8, 8));
      expect(cutFigures[0].holes).toBeEquivalentLoops([
        polygon([
          [0, 2],
          [0, 3],
          [-3, 3],
          [-3, -3],
          [0, -3],
          [0, -2],
          [2, -2],
          [2, 2],
        ]),
      ]);
      expect(cutFigures[1].contour).toBeLoop(
        rect(1, 2).transform(translation({ x: 0.5 }))
      );
    });

    it("cuts a contour with non intersectin holes", () => {
      const figures: [Figure[], Figure[]] = [
        [holedFig(6, 1)],
        [rectInRect.transform(translation({ x: 3, y: 3 }))],
      ];

      const cutFigures = cutFiguresLists(...figures);

      expect(cutFigures.length).toBe(2);

      expect(cutFigures[0].contour).toBeLoop(
        polygon([
          [-3, -3],
          [3, -3],
          [3, 1],
          [1, 1],
          [1, 3],
          [-3, 3],
        ])
      );
      expect(cutFigures[0].holes).toBeEquivalentLoops([rect(1, 1)]);

      expect(cutFigures[1].contour).toBeLoop(
        rect(1, 1).transform(translation({ x: 2.5, y: 2.5 }))
      );
      expect(cutFigures[1].holes).toEqual([]);
    });

    it("cuts a contour with intersectin holes", () => {
      const figures: [Figure[], Figure[]] = [
        [holedFig(6, 5)],
        [holedFig(6, 4).transform(translation({ x: 1, y: 1 }))],
      ];

      const cutFigures = cutFiguresLists(...figures);

      expect(cutFigures.length).toBe(2);

      expect(cutFigures[0].contour).toBeLoop(
        polygon([
          [-2, 2.5],
          [-2, 3],
          [-3, 3],
          [-3, -3],
          [3, -3],
          [3, -2],
          [2.5, -2],
          [2.5, -2.5],
          [-2.5, -2.5],
          [-2.5, 2.5],
        ])
      );

      expect(cutFigures[0].holes).toEqual([]);
      expect(cutFigures[1].contour).toBeLoop(
        polygon([
          [2.5, -1],
          [2.5, 2.5],
          [-1, 2.5],
          [-1, 3],
          [3, 3],
          [3, -1],
        ])
      );
      expect(cutFigures[1].holes).toEqual([]);
    });
  });
});
