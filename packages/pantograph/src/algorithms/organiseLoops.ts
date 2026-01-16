import { Figure } from "../models/Figure";
import { Loop } from "../models/Loop";

const nearlyEqual = (a: number, b: number, epsilon = 1e-7) =>
  Math.abs(a - b) <= epsilon;

const boundingBoxesEquivalent = (a: Loop, b: Loop) => {
  const boxA = a.boundingBox;
  const boxB = b.boundingBox;
  return (
    nearlyEqual(boxA.xMin, boxB.xMin) &&
    nearlyEqual(boxA.yMin, boxB.yMin) &&
    nearlyEqual(boxA.xMax, boxB.xMax) &&
    nearlyEqual(boxA.yMax, boxB.yMax)
  );
};

const loopsAreEquivalent = (a: Loop, b: Loop): boolean => {
  if (a.segmentsCount !== b.segmentsCount) return false;
  if (!boundingBoxesEquivalent(a, b)) return false;

  const aSegments = a.segments;
  const bSegments = b.segments;
  const segmentCount = aSegments.length;

  const matchesFrom = (startIndex: number, direction: 1 | -1) => {
    for (let i = 0; i < segmentCount; i += 1) {
      const bIndex =
        (startIndex + direction * i + segmentCount) % segmentCount;
      if (!aSegments[i].isSame(bSegments[bIndex])) return false;
    }
    return true;
  };

  for (let i = 0; i < segmentCount; i += 1) {
    if (!aSegments[0].isSame(bSegments[i])) continue;
    if (matchesFrom(i, 1) || matchesFrom(i, -1)) return true;
  }

  return false;
};

const dedupeEquivalentLoops = (loops: Loop[]) => {
  const unique: Loop[] = [];
  loops.forEach((loop) => {
    if (unique.some((existing) => loopsAreEquivalent(loop, existing))) {
      return;
    }
    unique.push(loop);
  });
  return unique;
};

const groupByBoundingBoxOverlap = (loops: Loop[]): Loop[][] => {
  const overlaps = loops.map((loop, i) => {
    return loops
      .slice(i + 1)
      .map((v, j): [number, Loop] => [j + i + 1, v])
      .filter(([, other]) => loop.boundingBox.overlaps(other.boundingBox))
      .map(([index]) => index);
  });
  const groups: Loop[][] = [];
  const groupsInOverlaps = Array(overlaps.length);

  overlaps.forEach((indices, i) => {
    let myGroup = groupsInOverlaps[i];
    if (!myGroup) {
      myGroup = [];
      groups.push(myGroup);
    }

    myGroup.push(loops[i]);

    if (indices.length) {
      indices.forEach((index) => {
        groupsInOverlaps[index] = myGroup;
      });
    }
  });

  return groups;
};

interface ContainedLoop {
  loop: Loop;
  isIn: Loop[];
}

const addContainmentInfo = (groupedLoops: Loop[]): ContainedLoop[] => {
  return groupedLoops.map((loop, index) => {
    const firstCurve = loop.segments[0];
    const point = firstCurve.midPoint;

    const isIn = groupedLoops.filter((potentialOuterLoop, j) => {
      if (index === j) return false;
      return potentialOuterLoop.contains(point);
    });

    return {
      loop,
      isIn,
    };
  });
};

const splitMultipleOuterLoops = (
  outerLoops: ContainedLoop[],
  allLoops: ContainedLoop[],
): ContainedLoop[][] => {
  return outerLoops.flatMap(({ loop: outerLoop }) => {
    return cleanEdgeCases(
      allLoops.filter(
        ({ loop, isIn }) =>
          loop === outerLoop || isIn.indexOf(outerLoop) !== -1,
      ),
    );
  });
};

const handleNestedLoops = (
  nestedLoops: ContainedLoop[],
  allLoops: ContainedLoop[],
): ContainedLoop[][] => {
  const firstLevelOuterLoops = allLoops.filter(({ isIn }) => isIn.length <= 1);

  const innerLevelsLoops = cleanEdgeCases(
    addContainmentInfo(nestedLoops.map(({ loop }) => loop)),
  );
  return [firstLevelOuterLoops, ...innerLevelsLoops];
};

const cleanEdgeCases = (groupedLoops: ContainedLoop[]): ContainedLoop[][] => {
  if (!groupedLoops.length) return [];

  const outerLoops = groupedLoops.filter(({ isIn }) => !isIn.length);
  const nestedLoops = groupedLoops.filter(({ isIn }) => isIn.length > 1);

  if (outerLoops.length === 1 && nestedLoops.length === 0) {
    return [groupedLoops];
  } else if (outerLoops.length > 1) {
    return splitMultipleOuterLoops(outerLoops, groupedLoops);
  } else {
    return handleNestedLoops(nestedLoops, groupedLoops);
  }
};

/**
 * Groups an array of loops such that loops that correspond to holes
 * in other loops are set in a Figure
 *
 * This algorithm assumes non intersecting loops.
 */
export function organiseLoops(loops: Loop[]): Figure[] {
  const uniqueLoops = dedupeEquivalentLoops(loops);
  const basicGrouping =
    groupByBoundingBoxOverlap(uniqueLoops).map(addContainmentInfo);
  return basicGrouping.flatMap(cleanEdgeCases).map((compounds) => {
    if (compounds.length === 1) return new Figure(compounds[0].loop);

    compounds.sort((a, b) => a.isIn.length - b.isIn.length);
    const [contour, ...holes] = compounds.map(({ loop }) => loop);
    return new Figure(contour, holes);
  });
}
