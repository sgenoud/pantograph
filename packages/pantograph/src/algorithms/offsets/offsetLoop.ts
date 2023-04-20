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
import { Arc } from "../../models/segments/Arc";
import { Diagram } from "../../models/Diagram";
import { findIntersectionsAndOverlaps } from "../intersections";
import { Figure } from "../../models/Figure";
import { stitchSegments } from "../stitchSegments";

const PRECISION = 1e-8;

export function rawOffsets(
  segmentsToOffset: Segment[],
  offset: number
): Segment[] {
  const offsetSegments: OffsetSegmentPair[] = segmentsToOffset.map((c) => ({
    offset: offsetSegment(c, offset),
    original: c,
  }));

  // Ideally we would use the length of the segment to make sure it is
  // not only a point, but the algo we have access to are a bit to
  // convoluted to be usable here

  const offsettedArray: Segment[] = [];

  let savedLastSegment: null | OffsetSegmentPair = null;

  let previousSegment = offsetSegments.at(-1);

  // We have no offseted segments
  if (!previousSegment) return [];
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

export function offsetLoop(loop: Loop, offset: number): Diagram {
  const correctedOffset = loop.clockwise ? offset : -offset;
  const offsettedArray = rawOffsets(loop.segments, correctedOffset);

  if (offsettedArray.length < 2) return new Diagram();

  // We remove the self intersections with the use the the algorithm as described in
  // https://github.com/jbuckmccready/CavalierContours#offset-algorithm-and-stepwise-example

  const allIntersections: Map<number, Vector[]> = new Map();
  const updateIntersections = (index: number, newPoints: Vector[]) => {
    const intersections = allIntersections.get(index) || [];
    allIntersections.set(index, [...intersections, ...newPoints]);
  };

  offsettedArray.forEach((firstSegment, firstIndex) => {
    offsettedArray
      .slice(firstIndex + 1)
      .forEach((secondSegment, secondIndex) => {
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

  if (!allIntersections.size) {
    const offsettedLoop = new Loop(offsettedArray);
    return new Diagram([new Figure(offsettedLoop)]);

    /* this was in the replicad algorithm - not sure why
    if (!loop.intersects(offsettedLoop)) return offsettedLoop;
    return new Diagram();
    */
  }

  const splitSegments = offsettedArray.flatMap((segment, index) => {
    if (!allIntersections.has(index)) return segment;

    const intersections = allIntersections.get(index) || [];
    const splitSegments = segment.splitAt(intersections);
    return splitSegments;
  });

  // We remove all the segments that are closer to the original segment than the offset
  const prunedSegments = splitSegments.filter((segment) => {
    const closeSegment = loop.segments.some((c) => {
      return distance(c, segment) < Math.abs(offset) - PRECISION;
    });
    return !closeSegment;
  });

  if (!prunedSegments.length) return new Diagram();

  const segmentsGrouped = stitchSegments(prunedSegments);

  const newLoops = segmentsGrouped
    .filter((c) => c.length > 1)
    .filter((c) => sameVector(c[0].firstPoint, c.at(-1)!.lastPoint))
    .map((c) => new Loop(c));

  if (!newLoops.length) return new Diagram();
  return new Diagram(newLoops.map((l) => new Figure(l)));
}
