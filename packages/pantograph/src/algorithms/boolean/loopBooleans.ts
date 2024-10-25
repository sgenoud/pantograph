import { Vector } from "../../definitions";
import zip from "../../utils/zip";

import { Segment } from "../../models/segments/Segment";
import { Strand } from "../../models/Strand";
import { reprVector, sameVector } from "../../vectorOperations";
import { Loop } from "../../models/Loop";
import { findIntersectionsAndOverlaps } from "../intersections";
import removeDuplicatePoints from "../../utils/removeDuplicatePoints";
import { stitchSegments } from "../stitchSegments";
import { strandsBetweenIntersections } from "./strandsBetweenIntersections";

const rotateToStartAt = (segments: Segment[], point: Vector) => {
  const startIndex = segments.findIndex((segment: Segment) => {
    return sameVector(point, segment.firstPoint);
  });

  const start = segments.slice(0, startIndex);
  const end = segments.slice(startIndex);

  return end.concat(start);
};

const rotateToStartAtSegment = (segments: Segment[], segment: Segment) => {
  let usedSegments = segments;

  const onSegment = (seg: Segment) => {
    return (
      sameVector(seg.firstPoint, segment.firstPoint) &&
      sameVector(seg.lastPoint, segment.lastPoint)
    );
  };

  let startIndex = segments.findIndex(onSegment);

  // it is also possible that the segment is oriented the other way. We still
  // need to align a start point
  if (startIndex === -1) {
    const reversedSegments = segments.map((s) => s.reverse());
    reversedSegments.reverse();
    startIndex = reversedSegments.findIndex(onSegment);
    if (startIndex === -1) {
      console.error(
        reversedSegments.map((c) => c.repr),
        segment.repr,
      );
      throw new Error("Failed to rotate to segment start");
    }
    usedSegments = reversedSegments;
  }

  const start = usedSegments.slice(0, startIndex);
  const end = usedSegments.slice(startIndex);

  return end.concat(start);
};

type IntersectionStrand = [Strand, Strand | "same"];

function removeNonCrossingPoint(
  allIntersections: Vector[],
  segmentedCurve: Segment[],
  loopToCheck: Loop,
) {
  return allIntersections.filter((intersection: Vector) => {
    const segmentsOfIntersection = segmentedCurve.filter((s) => {
      return (
        sameVector(s.firstPoint, intersection) ||
        sameVector(s.lastPoint, intersection)
      );
    });
    if (segmentsOfIntersection.length % 2) {
      throw new Error("Bug in the intersection algo on non crossing point");
    }

    const isInside = segmentsOfIntersection.map((segment: Segment): boolean => {
      return loopToCheck.contains(segment.midPoint);
    });

    // Either they are all inside or outside
    const segmentsOnTheSameSide =
      isInside.every((i) => i) || !isInside.some((i) => i);

    return !segmentsOnTheSameSide;
  });
}

/* When two shape intersect we cut them into segments between the intersection
 * points.
 *
 * This function returns the list of segments that have the same start and end
 * at the same intersection points or null if there is no intersection.
 */
function loopIntersectionStrands(
  first: Loop,
  second: Loop,
  precision?: number,
): IntersectionStrand[] | null {
  // For each segment of each blueprint we figure out where the intersection
  // points are.
  let allIntersections: Vector[] = [];
  const allCommonSegments: Segment[] = [];

  const firstCurvePoints: Vector[][] = new Array(first.segments.length)
    .fill(0)
    .map(() => []);
  const secondCurvePoints: Vector[][] = new Array(second.segments.length)
    .fill(0)
    .map(() => []);

  first.segments.forEach((thisSegments, firstIndex) => {
    second.segments.forEach((otherSegments, secondIndex) => {
      const { intersections, overlaps } = findIntersectionsAndOverlaps(
        thisSegments,
        otherSegments,
        precision,
      );

      allIntersections.push(...intersections);
      firstCurvePoints[firstIndex].push(...intersections);
      secondCurvePoints[secondIndex].push(...intersections);

      allCommonSegments.push(...overlaps);
      const commonSegmentsPoints = overlaps.flatMap((s) => [
        s.firstPoint,
        s.lastPoint,
      ]);
      allIntersections.push(...commonSegmentsPoints);
      firstCurvePoints[firstIndex].push(...commonSegmentsPoints);
      secondCurvePoints[secondIndex].push(...commonSegmentsPoints);
    });
  });

  allIntersections = removeDuplicatePoints(allIntersections, precision);

  // If there is only one intersection point we consider that the loops
  // are not intersecting
  if (!allIntersections.length || allIntersections.length === 1) return null;

  // We further split the segments at the intersections
  const cutCurve = ([segment, intersections]: [
    Segment,
    Vector[],
  ]): Segment[] => {
    if (!intersections.length) return [segment];
    return segment.splitAt(intersections);
  };
  let firstCurveSegments = zip([first.segments, firstCurvePoints] as [
    Segment[],
    Vector[][],
  ]).flatMap(cutCurve);

  let secondCurveSegments = zip([second.segments, secondCurvePoints] as [
    Segment[],
    Vector[][],
  ]).flatMap(cutCurve);

  // We need to remove intersection points that are not crossing into each
  // other (i.e. the two blueprints are only touching in one point and not
  // intersecting there.)
  allIntersections = removeNonCrossingPoint(
    allIntersections,
    firstCurveSegments,
    second,
  );

  if (!allIntersections.length && !allCommonSegments.length) return null;

  // We align the beginning of the segments
  if (!allCommonSegments.length) {
    const startAt = allIntersections[0];
    firstCurveSegments = rotateToStartAt(firstCurveSegments, startAt);
    secondCurveSegments = rotateToStartAt(secondCurveSegments, startAt);
  } else {
    // When there are common segments we always start on one
    const startSegment = allCommonSegments[0];
    firstCurveSegments = rotateToStartAtSegment(
      firstCurveSegments,
      startSegment,
    );
    secondCurveSegments = rotateToStartAtSegment(
      secondCurveSegments,
      startSegment,
    );
  }

  // We group segments between intersections in strands
  let strandsFromFirst = Array.from(
    strandsBetweenIntersections(
      firstCurveSegments,
      allIntersections,
      allCommonSegments,
    ),
  );

  let strandsFromSecond = Array.from(
    strandsBetweenIntersections(
      secondCurveSegments,
      allIntersections,
      allCommonSegments,
    ),
  );

  if (
    !sameVector(
      strandsFromSecond[0].lastPoint,
      strandsFromFirst[0].lastPoint,
    ) ||
    (allCommonSegments.length > 0 && strandsFromSecond[0].segmentsCount !== 1)
  ) {
    strandsFromSecond = strandsFromSecond.map((s) => s.reverse()).reverse();
    if (
      !sameVector(strandsFromSecond[0].lastPoint, strandsFromFirst[0].lastPoint)
    ) {
      strandsFromFirst = strandsFromFirst.map((s) => s.reverse()).reverse();
    }
  }

  return zip([strandsFromFirst, strandsFromSecond]).map(([first, second]) => {
    if (
      first.segmentsCount === 1 &&
      allCommonSegments.some((commonSegment) => {
        return first.segments[0].isSame(commonSegment);
      })
    ) {
      return [first, "same"];
    }
    return [first, second];
  });
}

function mergeStrandsAsLoop(strands: Strand[]) {
  let outStrand = strands[0];

  for (const strand of strands.slice(1)) {
    outStrand = outStrand.extend(strand);
  }

  if (!sameVector(outStrand.firstPoint, outStrand.lastPoint)) {
    console.error(
      reprVector(outStrand.firstPoint),
      reprVector(outStrand.lastPoint),
    );
    throw new Error("Bug in the intersection algo on non closing strand");
  }

  return new Loop(outStrand.segments);
}

function mergeDiscontinuities(
  inputStrands: Strand[],
  discontinuities: number[],
) {
  const strands = zip([
    discontinuities.slice(0, -1),
    discontinuities.slice(1),
  ]).map(([start, end]) => {
    return mergeStrandsAsLoop(inputStrands.slice(start, end));
  });

  let lastStrand = inputStrands.slice(
    discontinuities[discontinuities.length - 1],
  );
  if (discontinuities[0] !== 0) {
    lastStrand = lastStrand.concat(inputStrands.slice(0, discontinuities[0]));
  }
  strands.push(mergeStrandsAsLoop(lastStrand));

  return strands;
}

function groupLoops(inputStrands: Strand[]): Loop[] {
  if (!inputStrands.length) return [];

  const startPoints = inputStrands.map((c) => c.firstPoint);
  let endPoints = inputStrands.map((c) => c.lastPoint);
  endPoints = endPoints.slice(-1).concat(endPoints.slice(0, -1));

  const discontinuities = zip([startPoints, endPoints]).flatMap(
    ([startPoint, endPoint], index) => {
      if (!sameVector(startPoint, endPoint)) {
        return index;
      }
      return [];
    },
  );

  try {
    return mergeDiscontinuities(inputStrands, discontinuities);
  } catch (e) {
    // Sometimes the shapes are weird enough that our assumptions about the
    // strands do not work
    return stitchSegments(inputStrands.flatMap((s) => s.segments))
      .filter((c) => c.length > 1)
      .filter((c) => sameVector(c[0].firstPoint, c.at(-1)!.lastPoint))
      .map((c) => new Loop(c));
  }
}

const extendStrandList = (strandList: Strand[], strand: Strand) => {
  if (strandList.length === 0) return [strand];
  const lastStrand = strandList.at(-1)!;
  if (sameVector(lastStrand.lastPoint, strand.firstPoint)) {
    return strandList.slice(0, -1).concat([lastStrand.extend(strand)]);
  } else if (sameVector(lastStrand.lastPoint, strand.lastPoint)) {
    return strandList
      .slice(0, -1)
      .concat([lastStrand.extend(strand.reverse())]);
  } else {
    return strandList.concat([strand]);
  }
};

const prependStrandList = (strandList: Strand[], strand: Strand) => {
  if (strandList.length === 0) return [strand];
  if (sameVector(strandList[0].firstPoint, strand.lastPoint)) {
    return [strand.extend(strandList[0])].concat(strandList.slice(1));
  } else {
    return [strand].concat(strandList);
  }
};

export function loopBooleanOperation(
  first: Loop,
  second: Loop,
  {
    firstInside,
    secondInside,
  }: {
    firstInside: "keep" | "remove";
    secondInside: "keep" | "remove";
  },
):
  | Loop[]
  | { identical: true }
  | {
      firstCurveInSecond: boolean;
      secondCurveInFirst: boolean;
      identical: false;
    } {
  const strands = loopIntersectionStrands(first, second);

  // The case where we have no intersections
  if (!strands) {
    const firstStrandPoint = first.segments[0].midPoint;
    const firstCurveInSecond = second.contains(firstStrandPoint);

    const secondStrandPoint = second.segments[0].midPoint;
    const secondCurveInFirst = first.contains(secondStrandPoint);

    return {
      identical: false,
      firstCurveInSecond,
      secondCurveInFirst,
    };
  }

  if (strands.every(([, secondStrand]) => secondStrand === "same")) {
    return { identical: true };
  }

  let lastWasSame: null | Strand = null;
  let strandsIn: number | null = null;

  const s = strands.flatMap(([firstStrand, secondStrand]) => {
    let mergedStrands: Strand[] = [];
    let strandsOut = 0;

    // When two strands are on top of each other we base our decision on the
    // fact that every point should have one strand entering, and one going
    // out.
    if (secondStrand === "same") {
      if (strandsIn === 1) {
        strandsIn = 1;
        return firstStrand;
      }

      if (strandsIn === 2 || strandsIn === 0) {
        strandsIn = null;
        return [];
      }

      if (strandsIn === null) {
        if (!lastWasSame) lastWasSame = firstStrand;
        else lastWasSame = lastWasSame.extend(firstStrand);
        return [];
      }

      console.error("weird situation");
      return [];
    }

    // Every strand is kept or removed according to the fact that it is within
    // or not of the other closed loop

    const firstSegmentPoint = firstStrand.segments[0].midPoint;
    const firstSegmentInSecondShape = second.contains(firstSegmentPoint);

    if (
      (firstInside === "keep" && firstSegmentInSecondShape) ||
      (firstInside === "remove" && !firstSegmentInSecondShape)
    ) {
      strandsOut += 1;
      mergedStrands = extendStrandList(mergedStrands, firstStrand);
    }

    const secondSegmentPoint = secondStrand.segments[0].midPoint;
    const secondSegmentInFirstShape = first.contains(secondSegmentPoint);

    if (
      (secondInside === "keep" && secondSegmentInFirstShape) ||
      (secondInside === "remove" && !secondSegmentInFirstShape)
    ) {
      const strandToAdd = secondStrand;

      strandsOut += 1;

      if (strandsOut === 2 && mergedStrands.length) {
        mergedStrands = extendStrandList(mergedStrands, strandToAdd);
        lastWasSame = null;
      } else {
        mergedStrands = [strandToAdd];
      }
    }

    // This is the case where the information about the strands entering the
    // previous node where not known and no strand was selected
    if (strandsIn === null && strandsOut === 1 && lastWasSame) {
      mergedStrands = prependStrandList(mergedStrands, lastWasSame);
    }

    if (strandsOut === 1) {
      strandsIn = strandsOut;
      lastWasSame = null;
    }
    if (!mergedStrands.length) {
      lastWasSame = null;
      return [];
    }
    return mergedStrands;
  });

  // We now have a bunch of strands, we need to group them into loops
  return groupLoops(s);
}

export const fuseLoops = (first: Loop, second: Loop): Loop[] => {
  const result = loopBooleanOperation(first, second, {
    firstInside: "remove",
    secondInside: "remove",
  });

  if (Array.isArray(result)) return result;

  if (result.identical) {
    return [first];
  }

  if (result.firstCurveInSecond) {
    return [second];
  }

  if (result.secondCurveInFirst) {
    return [first];
  }

  return [first, second];
};

export const cutLoops = (first: Loop, second: Loop): Loop[] => {
  const result = loopBooleanOperation(first, second, {
    firstInside: "remove",
    secondInside: "keep",
  });

  if (Array.isArray(result)) return result;

  if (result.identical) {
    return [];
  }

  if (result.firstCurveInSecond) {
    return [];
  }

  if (result.secondCurveInFirst) {
    return [first, second];
  }

  return [first];
};

export const intersectLoops = (first: Loop, second: Loop): Loop[] => {
  const result = loopBooleanOperation(first, second, {
    firstInside: "keep",
    secondInside: "keep",
  });

  if (Array.isArray(result)) return result;

  if (result.identical) {
    return [first];
  }

  if (result.firstCurveInSecond) {
    return [first];
  }

  if (result.secondCurveInFirst) {
    return [second];
  }

  return [];
};
