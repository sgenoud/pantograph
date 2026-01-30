import { Line } from "../../models/segments/Line.js";

import type { Vector } from "../../definitions.js";
import { Segment } from "../../models/segments/Segment.js";
import { Arc } from "../../models/segments/Arc.js";
import { CubicBezier } from "../../models/segments/CubicBezier.js";
import { lineArcIntersection } from "./lineArcIntersection.js";
import { lineLineIntersection } from "./lineLineIntersection.js";
import { arcArcIntersection } from "./arcArcIntersection.js";
import { EllipseArc } from "../../models/segments/EllipseArc.js";
import { lineEllipseArcIntersection } from "./lineEllipseArcIntersection.js";
import { arcEllipseArcIntersection } from "./arcEllipseArcIntersection.js";
import { ellipseArcEllipseArcIntersection } from "./ellipseArcEllipseArcIntersection.js";
import { lineBezierIntersection } from "./lineBezierIntersection.js";
import { arcsCubicBezierIntersection } from "./arcsCubicBezierIntersection.js";
import { QuadraticBezier } from "../../models/segments/QuadraticBezier.js";
import { arcsQuadraticBezierIntersection } from "./arcsQuadraticBezierIntersection.js";
import { bezierClip } from "./bezierClip.js";
import { cubicBezierCubicBezierIntersection } from "./cubicBezierCubicBezierIntersection.js";
import { quadraticBezierQuadraticBezierIntersection } from "./quadraticBezierQuadraticBezierIntersection.js";

export function findIntersections(
  segment1: Segment,
  segment2: Segment,
  precision?: number,
): Vector[] {
  if (Line.isInstance(segment1) && Line.isInstance(segment2)) {
    const intersection = lineLineIntersection(
      segment1,
      segment2,
      false,
      precision,
    );
    if (intersection === null) return [];
    return [intersection as Vector];
  }
  if (Line.isInstance(segment1) && Arc.isInstance(segment2)) {
    return lineArcIntersection(segment1, segment2, precision);
  }
  if (Arc.isInstance(segment1) && Line.isInstance(segment2)) {
    return lineArcIntersection(segment2, segment1, precision);
  }
  if (Arc.isInstance(segment1) && Arc.isInstance(segment2)) {
    return arcArcIntersection(segment1, segment2, false, precision) as Vector[];
  }

  throw new Error("Not implemented");
}

export function findIntersectionsAndOverlaps(
  segment1: Segment,
  segment2: Segment,
  precision?: number,
): { intersections: Vector[]; overlaps: Segment[]; count: number } {
  // If we have two lines, checks are fast enough to not use bounding boxes
  if (Line.isInstance(segment1) && Line.isInstance(segment2)) {
    const intersection = lineLineIntersection(
      segment1,
      segment2,
      true,
      precision,
    );
    if (intersection === null)
      return { intersections: [], overlaps: [], count: 0 };
    if (Line.isInstance(intersection))
      return { intersections: [], overlaps: [intersection], count: 1 };
    return { intersections: [intersection], overlaps: [], count: 1 };
  }

  if (!segment1.boundingBox.overlaps(segment2.boundingBox)) {
    return { intersections: [], overlaps: [], count: 0 };
  }

  if (Line.isInstance(segment1) && Arc.isInstance(segment2)) {
    const intersections = lineArcIntersection(segment1, segment2, precision);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (Arc.isInstance(segment1) && Line.isInstance(segment2)) {
    const intersections = lineArcIntersection(segment2, segment1, precision);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (Arc.isInstance(segment1) && Arc.isInstance(segment2)) {
    const intersections = arcArcIntersection(
      segment1,
      segment2,
      true,
      precision,
    );
    if (!intersections.length)
      return { intersections: [], overlaps: [], count: 0 };
    if (Arc.isInstance(intersections[0]))
      return {
        intersections: [],
        overlaps: intersections as Arc[],
        count: intersections.length,
      };
    return {
      intersections: intersections as Vector[],
      overlaps: [],
      count: intersections.length,
    };
  }

  if (Line.isInstance(segment1) && EllipseArc.isInstance(segment2)) {
    const intersections = lineEllipseArcIntersection(
      segment1,
      segment2,
      precision,
    );
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (Line.isInstance(segment2) && EllipseArc.isInstance(segment1)) {
    const intersections = lineEllipseArcIntersection(
      segment2,
      segment1,
      precision,
    );
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (Arc.isInstance(segment1) && EllipseArc.isInstance(segment2)) {
    const intersections = arcEllipseArcIntersection(segment1, segment2);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (Arc.isInstance(segment2) && EllipseArc.isInstance(segment1)) {
    const intersections = arcEllipseArcIntersection(segment2, segment1);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (EllipseArc.isInstance(segment1) && EllipseArc.isInstance(segment2)) {
    const intersections = ellipseArcEllipseArcIntersection(
      segment1,
      segment2,
      true,
    );
    if (!intersections.length)
      return { intersections: [], overlaps: [], count: 0 };
    if (EllipseArc.isInstance(intersections[0]))
      return {
        intersections: [],
        overlaps: intersections as EllipseArc[],
        count: intersections.length,
      };
    return {
      intersections: intersections as Vector[],
      overlaps: [],
      count: intersections.length,
    };
  }

  if (
    Line.isInstance(segment1) &&
    (CubicBezier.isInstance(segment2) || QuadraticBezier.isInstance(segment2))
  ) {
    const intersections = lineBezierIntersection(segment1, segment2);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    Line.isInstance(segment2) &&
    (CubicBezier.isInstance(segment1) || QuadraticBezier.isInstance(segment1))
  ) {
    const intersections = lineBezierIntersection(segment2, segment1);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    (Arc.isInstance(segment1) || EllipseArc.isInstance(segment1)) &&
    QuadraticBezier.isInstance(segment2)
  ) {
    const intersections = arcsQuadraticBezierIntersection(segment1, segment2);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    (Arc.isInstance(segment2) || EllipseArc.isInstance(segment2)) &&
    QuadraticBezier.isInstance(segment1)
  ) {
    const intersections = arcsQuadraticBezierIntersection(segment2, segment1);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    (Arc.isInstance(segment1) || EllipseArc.isInstance(segment1)) &&
    CubicBezier.isInstance(segment2)
  ) {
    const intersections = arcsCubicBezierIntersection(segment1, segment2);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    (Arc.isInstance(segment2) || EllipseArc.isInstance(segment2)) &&
    CubicBezier.isInstance(segment1)
  ) {
    const intersections = arcsCubicBezierIntersection(segment2, segment1);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    QuadraticBezier.isInstance(segment1) &&
    QuadraticBezier.isInstance(segment2)
  ) {
    const intersections = quadraticBezierQuadraticBezierIntersection(
      segment1,
      segment2,
    );
    if (!intersections.length)
      return { intersections: [], overlaps: [], count: 0 };
    if (QuadraticBezier.isInstance(intersections[0]))
      return {
        intersections: [],
        overlaps: intersections as QuadraticBezier[],
        count: intersections.length,
      };
    return {
      intersections: intersections as Vector[],
      overlaps: [],
      count: intersections.length,
    };
  }

  if (
    (QuadraticBezier.isInstance(segment1) && CubicBezier.isInstance(segment2)) ||
    (QuadraticBezier.isInstance(segment2) && CubicBezier.isInstance(segment1))
  ) {
    const intersections = bezierClip(segment1, segment2);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (CubicBezier.isInstance(segment1) && CubicBezier.isInstance(segment2)) {
    const intersections = cubicBezierCubicBezierIntersection(
      segment1,
      segment2,
    );
    if (!intersections.length)
      return { intersections: [], overlaps: [], count: 0 };
    if (CubicBezier.isInstance(intersections[0]))
      return {
        intersections: [],
        overlaps: intersections as CubicBezier[],
        count: intersections.length,
      };
    return {
      intersections: intersections as Vector[],
      overlaps: [],
      count: intersections.length,
    };
  }

  throw new Error("Not implemented");
}
