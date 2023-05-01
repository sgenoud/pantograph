import { Vector } from "../../definitions";
import { Segment } from "../../models/segments/Segment";
import { Loop } from "../../models/Loop";
import { Strand } from "../../models/Strand";
import { findIntersectionsAndOverlaps } from "../intersections";
import removeDuplicatePoints from "../../utils/removeDuplicatePoints";
import zip from "../../utils/zip";
import { strandsBetweenIntersections } from "./strandsBetweenIntersections";
import type { Figure } from "../../models/Figure";
import type { Stroke } from "../../models/Stroke";

function strandLoopSections(
  loop: Loop,
  strand: Stroke,
  precision = 1e-9
): Strand[] {
  let allIntersections: Vector[] = [];
  const allCommonSegments: Segment[] = [];

  const splitPoints: Vector[][] = new Array(strand.segments.length)
    .fill(0)
    .map(() => []);

  strand.segments.forEach((strandSegment, strandIndex) => {
    loop.segments.forEach((loopSegment) => {
      const { intersections, overlaps } = findIntersectionsAndOverlaps(
        strandSegment,
        loopSegment,
        precision
      );

      allIntersections.push(...intersections);
      splitPoints[strandIndex].push(...intersections);

      allCommonSegments.push(...overlaps);
      const commonSegmentsPoints = overlaps.flatMap((s) => [
        s.firstPoint,
        s.lastPoint,
      ]);
      allIntersections.push(...commonSegmentsPoints);
      splitPoints[strandIndex].push(...commonSegmentsPoints);
    });
  });

  allIntersections = removeDuplicatePoints(allIntersections, precision);

  const strandSegments = zip([strand.segments, splitPoints] as [
    Segment[],
    Vector[][]
  ]).flatMap(([segment, intersections]: [Segment, Vector[]]): Segment[] => {
    if (!intersections.length) return [segment];
    return segment.splitAt(intersections);
  });

  return Array.from(
    strandsBetweenIntersections(
      strandSegments,
      allIntersections,
      allCommonSegments
    )
  );
}

export function eraseStrandWithinLoop(
  strand: Stroke,
  loop: Loop,
  eraseOnBorder = false
) {
  const strands = strandLoopSections(loop, strand);

  // We keep only the strands that are outside the loop
  return strands.filter((strand) => {
    const strandCenter = strand.segments[0].midPoint;
    if (loop.onStroke(strandCenter)) return !eraseOnBorder;

    return !loop.contains(strandCenter);
  });
}

export function eraseStrandOutsideLoop(
  strand: Stroke,
  loop: Loop,
  eraseOnBorder = false
) {
  const strands = strandLoopSections(loop, strand);

  // We keep only the strands that are outside the loop
  return strands.filter((strand) => {
    const strandCenter = strand.segments[0].midPoint;
    if (loop.onStroke(strandCenter)) return !eraseOnBorder;

    return loop.contains(strandCenter);
  });
}

export function eraseStrandWithinFigure(
  strand: Stroke,
  figure: Figure,
  eraseOnBorder = false
) {
  const outsideStrands = eraseStrandWithinLoop(
    strand,
    figure.contour,
    eraseOnBorder
  );

  const inLoopStrand = figure.holes.flatMap((hole: Loop) =>
    eraseStrandOutsideLoop(strand, hole, eraseOnBorder)
  );

  return [...outsideStrands, ...inLoopStrand];
}

export function eraseStrandOutsideFigure(
  strand: Stroke,
  figure: Figure,
  eraseOnBorder = false
) {
  let insideStrands = eraseStrandOutsideLoop(
    strand,
    figure.contour,
    eraseOnBorder
  );

  figure.holes.forEach((hole: Loop) => {
    insideStrands = insideStrands.flatMap((strand) =>
      eraseStrandWithinLoop(strand, hole, eraseOnBorder)
    );
  });

  return insideStrands;
}
