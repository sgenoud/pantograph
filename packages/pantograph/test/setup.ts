import { expect } from "vitest";
import { Loop } from "../src/models/Loop";
import type { Segment } from "../src/models/segments/Segment";
import { sameVector } from "../src/vectorOperations";

export const repr = (vector: unknown): string => {
  if (!Array.isArray(vector)) return String(vector);
  return `[${vector[0]}, ${vector[1]}]`;
};

function sameLoop(a: Loop, b: Loop): boolean {
  const first = a.simplify();
  const second = b.simplify();

  if (first.segments.length !== second.segments.length) return false;

  const startIndex = second.segments.findIndex((segment) => {
    return first.segments[0].isSame(segment);
  });
  if (startIndex === -1) return false;

  let secondSegments = second.segments
    .slice(startIndex)
    .concat(second.segments.slice(0, startIndex));

  if (!sameVector(first.firstPoint, secondSegments[0].firstPoint)) {
    secondSegments.reverse();
    secondSegments = [secondSegments.pop() as Segment, ...secondSegments];
  }

  return first.segments.every((segment, index) => {
    return segment.isSame(secondSegments[index]);
  });
}

function sameLoops(a: Loop[], b: Loop[]): boolean {
  if (a.length !== b.length) return false;

  const bToFind = [...b];

  return a.every((loop, index) => {
    const foundIndex = bToFind.findIndex((otherLoop) => {
      return sameLoop(loop, otherLoop);
    });
    if (foundIndex === -1) return false;
    bToFind.splice(foundIndex, 1);

    return true;
  });
}

expect.extend({
  toBeVector(received, expected) {
    const { isNot } = this;

    return {
      // do not alter your "pass" based on isNot. Vitest does it for you
      pass: sameVector(received, expected),
      message: () =>
        `${repr(received)} is${isNot ? " not" : ""} ${repr(expected)}`,
    };
  },

  toBeLoop(received, expected) {
    const { isNot } = this;
    return {
      pass: sameLoop(received, expected),
      message: () =>
        `${received.repr} is${isNot ? "" : " not"} ${expected.repr}`,
    };
  },

  toBeEquivalentLoops(received, expected) {
    const { isNot } = this;
    return {
      pass: sameLoops(received, expected),
      message: () =>
        `${received.map((s: any) => s.simplify().repr).join("---\n")} is${
          isNot ? "" : " not \n"
        } ${expected.map((s: any) => s.simplify().repr).join("---\n")}}`,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeVector(e: unknown): R;
      toBeEquivalentLoops(e: unknown): R;
      toBeLoop(e: unknown): R;
    }
  }
}
