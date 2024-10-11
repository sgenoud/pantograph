import { findIntersectionsAndOverlaps } from "../../../algorithms/intersections/index.js";
import { Vector } from "../../../definitions.js";
import { allCombinations } from "../../../utils/allCombinations.js";
import {
  sameVector,
  distance as vecDistance,
} from "../../../vectorOperations.js";
import { Segment } from "../Segment.js";

export function* intersectingSegments(segments: Segment[]) {
  for (const [segmentIndex, otherSegmentIndex] of allCombinations(
    segments.length
  )) {
    if (segmentIndex === otherSegmentIndex) continue;
    const segment = segments[segmentIndex];
    const otherSegment = segments[otherSegmentIndex];

    if (!segment.boundingBox.overlaps(otherSegment.boundingBox)) {
      continue;
    }
    const intersections = findIntersectionsAndOverlaps(segment, otherSegment);
    const epsilon = Math.max(segment.precision, otherSegment.precision);

    if (intersections.count === 0) continue;
    if (intersections.count === 1 && !intersections.overlaps.length) {
      const distance = segmentIndex - otherSegmentIndex;

      const intersection = intersections.intersections[0];

      console.log("array distance", distance);
      console.log(
        "first",
        vecDistance(segment.firstPoint, intersection),
        "last",
        vecDistance(segment.lastPoint, intersection),
        epsilon
      );

      if (distance === 1) {
        if (sameVector(segment.firstPoint, intersection, epsilon)) continue;
      }
      if (distance === -1) {
        if (sameVector(segment.lastPoint, intersection, epsilon)) continue;
      }
      if (distance === segments.length - 1) {
        if (
          sameVector(segment.lastPoint, intersection, epsilon) &&
          sameVector(otherSegment.firstPoint, intersection, epsilon)
        )
          continue;
      }
      if (-distance === segments.length - 1) {
        if (
          sameVector(segment.firstPoint, intersection, epsilon) &&
          sameVector(otherSegment.lastPoint, intersection, epsilon)
        )
          continue;
      }
    }
    if (intersections.count === 2 && segments.length === 2) {
      if (
        (sameVector(
          segment.firstPoint,
          intersections.intersections[0],
          epsilon
        ) &&
          sameVector(
            segment.lastPoint,
            intersections.intersections[1],
            epsilon
          )) ||
        (sameVector(
          segment.firstPoint,
          intersections.intersections[1],
          epsilon
        ) &&
          sameVector(
            segment.lastPoint,
            intersections.intersections[0],
            epsilon
          ))
      )
        continue;
    }

    yield [segmentIndex, otherSegmentIndex, intersections] as const;
  }
}

export function splitAtSelfIntersections(segments: Segment[]) {
  const segmentsToSplit: Map<number, Vector[]> = new Map();

  for (const [
    segmentIndex,
    otherSegmentIndex,
    intersections,
  ] of intersectingSegments(segments)) {
    if (!segmentsToSplit.has(segmentIndex)) {
      segmentsToSplit.set(segmentIndex, []);
    }
    if (!segmentsToSplit.has(otherSegmentIndex)) {
      segmentsToSplit.set(otherSegmentIndex, []);
    }

    if (intersections.intersections.length) {
      segmentsToSplit.get(segmentIndex)!.push(...intersections.intersections);
      segmentsToSplit
        .get(otherSegmentIndex)!
        .push(...intersections.intersections);
    }

    if (intersections.overlaps.length) {
      const overlapPoints = intersections.overlaps.flatMap((overlap) => [
        overlap.firstPoint,
        overlap.lastPoint,
      ]);
      segmentsToSplit.get(segmentIndex)!.push(...overlapPoints);
      segmentsToSplit.get(otherSegmentIndex)!.push(...overlapPoints);
    }
  }

  if (segmentsToSplit.size === 0) {
    return segments;
  }

  console.log(segmentsToSplit);

  let firstSplitIndex: null | number = null;
  const newSegments = segments.flatMap((segment, index) => {
    if (!segmentsToSplit.has(index)) {
      return [segment];
    }
    if (firstSplitIndex === null) {
      firstSplitIndex = index + 1;
    }

    const splitPoints = segmentsToSplit.get(index)!;
    const splitted = segment.splitAt(splitPoints);

    console.log(
      "split",
      [
        segment.info,
        JSON.stringify(splitPoints),
        splitted.map((s) => s.info).join(" : "),
      ].join("\n")
    );

    return splitted;
  });

  return newSegments
    .slice(firstSplitIndex!)
    .concat(newSegments.slice(0, firstSplitIndex!));
}

export function checkSelfIntersections(
  segments: Segment[],
  type = "Stroke"
): void {
  const selfIntersectionsFinder = intersectingSegments(segments);
  const { done, value } = selfIntersectionsFinder.next();

  if (done) return;

  const intersectionStr = value[2].intersections.length
    ? JSON.stringify(value[2].intersections)
    : value[2].overlaps.map((o) => o.info).join(", ");

  throw new Error(
    `${type} segments must not intersect, but segments ${
      segments[value[0]].info
    } and ${segments[value[1]].info} do at ${intersectionStr}`
  );
}
