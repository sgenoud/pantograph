import { Line } from "../../models/segments/Line";
import { Loop } from "../../models/Loop";
import { Segment } from "../../models/segments/Segment";
import {
  crossProduct,
  sameVector,
  squareDistance,
  subtract,
} from "../../vectorOperations";
import { distance } from "../distances";
import { offsetSegment, DegenerateSegment } from "./offsetSegment";
import { Vector } from "../../definitions";
import { Arc, tangentArc } from "../../models/segments/Arc";
import { Diagram } from "../../models/Diagram";
import { findIntersectionsAndOverlaps } from "../intersections";
import { Figure } from "../../models/Figure";
import { stitchSegments } from "../stitchSegments";
import { Stroke } from "../../models/Stroke";
import { Strand } from "../../models/Strand";

const PRECISION = 1e-8;

export function rawOffsets(
  segmentsToOffset: Segment[],
  offset: number,
  loop = true
): Segment[] {
  const offsetSegments: OffsetSegmentPair[] = segmentsToOffset.map((c) => ({
    offset: offsetSegment(c, offset),
    original: c,
  }));

  // Ideally we would use the length of the segment to make sure it is
  // not only a point, but the algo we have access to are a bit to
  // convoluted to be usable here

  const offsettedArray: Segment[] = [];

  let savedLastSegment = loop ? null : offsetSegments.at(-1)!;

  let previousSegment = loop ? offsetSegments.at(-1) : null;

  // We have no offseted segments
  if (offsettedArray.length === 1) return offsettedArray;

  const appendSegment = (segment: OffsetSegmentPair) => {
    if (!savedLastSegment) {
      savedLastSegment = segment;
    } else if (!(segment.offset instanceof DegenerateSegment)) {
      offsettedArray.push(segment.offset);
    } else if (
      !sameVector(segment.offset.firstPoint, segment.offset.lastPoint)
    ) {
      offsettedArray.push(
        new Line(segment.offset.firstPoint, segment.offset.lastPoint)
      );
    }
  };
  const iterateOffsetSegments = function* (): Generator<OffsetSegmentPair> {
    for (const segment of offsetSegments.slice(0, -1)) {
      yield segment;
    }
    // This should never happen
    if (!savedLastSegment) throw new Error("Bug in the offset algorithm");
    yield savedLastSegment;
  };

  for (const segment of iterateOffsetSegments()) {
    if (!previousSegment) {
      previousSegment = segment;
      continue;
    }
    const previousLastPoint = previousSegment.offset.lastPoint;
    const firstPoint = segment.offset.firstPoint;

    // When the offset segments do still touch we do nothing
    if (sameVector(previousLastPoint, firstPoint)) {
      appendSegment(previousSegment);
      previousSegment = segment;
      continue;
    }

    let intersections: Vector[] = [];

    if (
      !(previousSegment.offset instanceof DegenerateSegment) &&
      !(segment.offset instanceof DegenerateSegment)
    ) {
      // When the offset segments intersect we cut them and save them at
      const { intersections: pointIntersections, overlaps } =
        findIntersectionsAndOverlaps(
          previousSegment.offset,
          segment.offset,
          PRECISION / 100
        );
      intersections = [
        ...pointIntersections,
        ...overlaps.flatMap((c) => [c.firstPoint, c.lastPoint]),
      ];
    }

    if (intersections.length > 0) {
      let intersection = intersections[0];
      if (intersections.length > 1) {
        // We choose the intersection point the closest to the end of the
        // original segment endpoint (why? not sure, following
        // https://github.com/jbuckmccready/cavalier_contours/)

        const originalEndpoint = previousSegment?.original.lastPoint;
        const distances = intersections.map((i) =>
          squareDistance(i, originalEndpoint)
        );
        intersection = intersections[distances.indexOf(Math.min(...distances))];
      }

      // We need to be a lot more careful here with multiple intersections
      // as well as cases where segments overlap

      const splitPreviousSegment = (previousSegment.offset as Segment).splitAt([
        intersection,
      ])[0];
      const splitSegment = (segment.offset as Segment)
        .splitAt([intersection])
        .at(-1);

      if (!splitSegment) throw new Error("Bug in the splitting algo in offset");

      appendSegment({
        offset: splitPreviousSegment,
        original: previousSegment.original,
      });
      previousSegment = { offset: splitSegment, original: segment.original };
      continue;
    }

    // When the offset segments do not intersect we link them with an arc of
    // radius offset
    const center = previousSegment.original.lastPoint;
    const clockwise =
      crossProduct(
        subtract(firstPoint, center),
        subtract(previousLastPoint, center)
      ) > 0;

    const joiner = new Arc(previousLastPoint, firstPoint, center, clockwise);

    appendSegment(previousSegment);
    offsettedArray.push(joiner);
    previousSegment = segment;
  }

  appendSegment(previousSegment);
  return offsettedArray;
}

interface OffsetSegmentPair {
  offset: Segment | DegenerateSegment;
  original: Segment;
}

function findOffsetSelfIntersections(
  segments: Segment[]
): Map<number, Vector[]> {
  // We remove the self intersections with the use the the algorithm as described in
  // https://github.com/jbuckmccready/CavalierContours#offset-algorithm-and-stepwise-example

  const allIntersections: Map<number, Vector[]> = new Map();
  const updateIntersections = (index: number, newPoints: Vector[]) => {
    const intersections = allIntersections.get(index) || [];
    allIntersections.set(index, [...intersections, ...newPoints]);
  };

  segments.forEach((firstSegment, firstIndex) => {
    segments.slice(firstIndex + 1).forEach((secondSegment, secondIndex) => {
      const { intersections: rawIntersections, overlaps } =
        findIntersectionsAndOverlaps(firstSegment, secondSegment, PRECISION);

      const intersections = [
        ...rawIntersections,
        ...overlaps.flatMap((c) => [c.firstPoint, c.lastPoint]),
      ].filter((intersection) => {
        const onFirstSegmentExtremity =
          sameVector(intersection, firstSegment.firstPoint) ||
          sameVector(intersection, firstSegment.lastPoint);

        const onSecondSegmentExtremity =
          sameVector(intersection, secondSegment.firstPoint) ||
          sameVector(intersection, secondSegment.lastPoint);

        return !(onFirstSegmentExtremity && onSecondSegmentExtremity);
      });

      if (!intersections.length) return;

      updateIntersections(firstIndex, intersections);
      updateIntersections(secondIndex + firstIndex + 1, intersections);
    });
  });

  return allIntersections;
}

function findIntersections(
  segments: Segment[],
  intersectWith: Segment[]
): Map<number, Vector[]> {
  const allIntersections: Map<number, Vector[]> = new Map();
  const updateIntersections = (index: number, newPoints: Vector[]) => {
    const intersections = allIntersections.get(index) || [];
    allIntersections.set(index, [...intersections, ...newPoints]);
  };

  segments.forEach((firstSegment, firstIndex) => {
    intersectWith.forEach((segmentsToCheck) => {
      const { intersections: rawIntersections, overlaps } =
        findIntersectionsAndOverlaps(firstSegment, segmentsToCheck, PRECISION);

      const intersections = [
        ...rawIntersections,
        ...overlaps.flatMap((c) => [c.firstPoint, c.lastPoint]),
      ].filter((intersection) => {
        return (
          sameVector(intersection, firstSegment.firstPoint) ||
          sameVector(intersection, firstSegment.lastPoint)
        );
      });

      if (!intersections.length) return;

      updateIntersections(firstIndex, intersections);
    });
  });

  return allIntersections;
}

function findEndIntersections(
  segments: Segment[],
  strand: Strand,
  offset: number
) {
  const circle = new Loop([
    new Arc([-offset, 0], [offset, 0], [0, 0], true),
    new Arc([offset, 0], [-offset, 0], [0, 0], true),
  ]);

  const startCircle = circle.translateTo(strand.firstPoint);
  const endCircle = circle.translateTo(strand.lastPoint);

  return findIntersections(segments, [
    ...startCircle.segments,
    ...endCircle.segments,
  ]);
}

function mergeIntersectionMaps(maps: Map<number, Vector[]>[]) {
  const mergedMap = new Map<number, Vector[]>(maps[0]);
  maps.forEach((map) => {
    for (const [key, value] of map) {
      const previousValue = mergedMap.get(key) || [];
      mergedMap.set(key, [...previousValue, ...value]);
    }
  });
  return mergedMap;
}

function splitSegmentsAtIntersections(
  intersections: Map<number, Vector[]>,
  segments: Segment[]
): Segment[] {
  return segments.flatMap((segment, index) => {
    if (!intersections.has(index)) return segment;

    const segmentIntersections = intersections.get(index);
    if (!segmentIntersections) return segment;

    return segment.splitAt(segmentIntersections);
  });
}

function pruneDegenerateSegments(
  segments: Segment[],
  originalStroke: Stroke,
  offset: number
): Segment[] {
  // We remove all the segments that are closer to the original segment than the offset
  return segments.filter((segment) => {
    const closeSegment = originalStroke.segments.some((c) => {
      return distance(c, segment) < Math.abs(offset) - PRECISION;
    });
    return !closeSegment;
  });
}

export function offsetLoop(loop: Loop, offset: number): Diagram {
  const correctedOffset = loop.clockwise ? offset : -offset;
  const offsettedArray = rawOffsets(loop.segments, correctedOffset);

  if (offsettedArray.length < 2) return new Diagram();

  // We remove the self intersections with the use the the algorithm as described in
  // https://github.com/jbuckmccready/CavalierContours#offset-algorithm-and-stepwise-example

  const allIntersections = findOffsetSelfIntersections(offsettedArray);

  if (!allIntersections.size) {
    const offsettedLoop = new Loop(offsettedArray);
    return new Diagram([new Figure(offsettedLoop)]);
    /* this was in the replicad algorithm - not sure why
    if (!loop.intersects(offsettedLoop)) return offsettedLoop;
    return new Diagram();
    */
  }
  const splitSegments = splitSegmentsAtIntersections(
    allIntersections,
    offsettedArray
  );

  // We remove all the segments that are closer to the original segment than the offset
  const prunedSegments = pruneDegenerateSegments(splitSegments, loop, offset);

  if (!prunedSegments.length) return new Diagram();

  const segmentsGrouped = stitchSegments(prunedSegments);

  const newLoops = segmentsGrouped
    .filter((c) => c.length > 1)
    .filter((c) => sameVector(c[0].firstPoint, c.at(-1)!.lastPoint))
    .map((c) => new Loop(c));

  if (!newLoops.length) return new Diagram();
  return new Diagram(newLoops.map((l) => new Figure(l)));
}

export function offsetStrand(strand: Strand, offset: number): Stroke[] {
  const offsettedArray = rawOffsets(strand.segments, offset, false);
  const backOffsettedArray = rawOffsets(strand.segments, -offset, false);

  // We remove the self intersections with the use the the algorithm as described in
  // https://github.com/jbuckmccready/CavalierContours#offset-algorithm-and-stepwise-example

  const allIntersections = mergeIntersectionMaps([
    findOffsetSelfIntersections(offsettedArray),
    findIntersections(offsettedArray, backOffsettedArray),
    findEndIntersections(offsettedArray, strand, offset),
  ]);

  if (!allIntersections.size) {
    return [new Strand(offsettedArray)];
  }
  const splitSegments = splitSegmentsAtIntersections(
    allIntersections,
    offsettedArray
  );

  // We remove all the segments that are closer to the original segment than the offset
  const prunedSegments = pruneDegenerateSegments(splitSegments, strand, offset);

  if (!prunedSegments.length) return [];

  const segmentsGrouped = stitchSegments(prunedSegments);

  return segmentsGrouped.map((c) => {
    if (sameVector(c[0].firstPoint, c.at(-1)!.lastPoint)) return new Loop(c);
    return new Strand(c);
  });
}

export function outlineStrand(
  strand: Strand,
  width: number,
  endCap: "round" | "butt" = "round"
): Diagram {
  const offset = width / 2;
  const frontOffsettedArray = rawOffsets(strand.segments, offset, false);
  const backOffsettedArray = rawOffsets(strand.segments, -offset, false).map(
    (s) => s.reverse()
  );
  backOffsettedArray.reverse();

  const makeJoiner = (fromSegment: Segment, toSegment: Segment) => {
    if (endCap === "round") {
      return tangentArc(
        fromSegment.lastPoint,
        toSegment.firstPoint,
        fromSegment.tangentAtLastPoint
      );
    }
    return new Line(fromSegment.lastPoint, toSegment.firstPoint);
  };

  const offsettedArray = [
    ...frontOffsettedArray,
    makeJoiner(
      frontOffsettedArray[frontOffsettedArray.length - 1],
      backOffsettedArray[0]
    ),
    ...backOffsettedArray,
    makeJoiner(
      backOffsettedArray[backOffsettedArray.length - 1],
      frontOffsettedArray[0]
    ),
  ];

  const allIntersections = findOffsetSelfIntersections(offsettedArray);

  if (!allIntersections.size) {
    const offsettedLoop = new Loop(offsettedArray);
    return new Diagram([new Figure(offsettedLoop)]);
  }
  const splitSegments = splitSegmentsAtIntersections(
    allIntersections,
    offsettedArray
  );

  // We remove all the segments that are closer to the original segment than the offset
  const prunedSegments = pruneDegenerateSegments(splitSegments, strand, offset);

  if (!prunedSegments.length) return new Diagram();

  const segmentsGrouped = stitchSegments(prunedSegments);

  const newLoops = segmentsGrouped
    .filter((c) => c.length > 1)
    .filter((c) => sameVector(c[0].firstPoint, c.at(-1)!.lastPoint))
    .map((c) => new Loop(c));

  if (!newLoops.length) return new Diagram();
  return new Diagram(newLoops.map((l) => new Figure(l)));
}
