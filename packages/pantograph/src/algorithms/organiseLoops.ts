import { Figure } from "../models/Figure";
import { Loop } from "../models/Loop";

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
  allLoops: ContainedLoop[]
): ContainedLoop[][] => {
  return outerLoops.flatMap(({ loop: outerLoop }) => {
    return cleanEdgeCases(
      allLoops.filter(
        ({ loop, isIn }) => loop === outerLoop || isIn.indexOf(outerLoop) !== -1
      )
    );
  });
};

const handleNestedLoops = (
  nestedLoops: ContainedLoop[],
  allLoops: ContainedLoop[]
): ContainedLoop[][] => {
  const firstLevelOuterLoops = allLoops.filter(({ isIn }) => isIn.length <= 1);

  const innerLevelsLoops = cleanEdgeCases(
    addContainmentInfo(nestedLoops.map(({ loop }) => loop))
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
  const basicGrouping =
    groupByBoundingBoxOverlap(loops).map(addContainmentInfo);
  return basicGrouping.flatMap(cleanEdgeCases).map((compounds) => {
    if (compounds.length === 1) return new Figure(compounds[0].loop);

    compounds.sort((a, b) => a.isIn.length - b.isIn.length);
    const [contour, ...holes] = compounds.map(({ loop }) => loop);
    return new Figure(contour, holes);
  });
}
