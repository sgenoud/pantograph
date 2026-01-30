import type { Vector } from "./definitions.js";
import { Line } from "./models/segments/Line.js";
import { Segment } from "./models/segments/Segment.js";
import { Diagram, Figure, Loop, Strand } from "./models/exports";
import { tesselateSegment } from "./algorithms/tesselate/tesselateSegment.js";
import type { TesselateSegmentOptions } from "./algorithms/tesselate/tesselateSegment.js";
import { genericConversion } from "./algorithms/conversions/helpers.js";
import { sameVector } from "./vectorOperations.js";

function linesFromPoints(points: Vector[]): Line[] {
  if (points.length < 2) return [];
  const lines: Line[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    lines.push(new Line(points[index], points[index + 1]));
  }
  return lines;
}

function tesselateToLines(
  segment: Segment,
  options?: TesselateSegmentOptions,
): Segment[] {
  return linesFromPoints(tesselateSegment(segment, options));
}

function stitchSegmentPoints(
  segments: Segment[],
  options?: TesselateSegmentOptions,
): Vector[] {
  const points: Vector[] = [];
  segments.forEach((segment, index) => {
    const segmentPoints = tesselateSegment(segment, options);
    if (segmentPoints.length === 0) return;
    if (index === 0) {
      points.push(...segmentPoints);
      return;
    }
    points.push(...segmentPoints.slice(1));
  });

  if (points.length > 1 && sameVector(points[0], points[points.length - 1])) {
    points.pop();
  }
  return points;
}

function isClockwise(points: Vector[]): boolean {
  if (points.length < 3) return false;
  const area = points
    .map((v1, i) => {
      const v2 = points[(i + 1) % points.length];
      return (v2[0] - v1[0]) * (v2[1] + v1[1]);
    })
    .reduce((a, b) => a + b, 0);
  return area > 0;
}

function orientPoints(points: Vector[], clockwise: boolean): Vector[] {
  if (points.length < 3) return points;
  if (isClockwise(points) === clockwise) return points;
  return [...points].reverse();
}

function tesselate(shape: Diagram, options?: TesselateSegmentOptions): Diagram;
function tesselate(shape: Figure, options?: TesselateSegmentOptions): Figure;
function tesselate(shape: Loop, options?: TesselateSegmentOptions): Loop;
function tesselate(shape: Strand, options?: TesselateSegmentOptions): Strand;
function tesselate(
  shape: Segment,
  options?: TesselateSegmentOptions,
): Segment[];
function tesselate(
  shape: Diagram | Figure | Loop | Strand | Segment,
  options: TesselateSegmentOptions = {},
) {
  const mapper = (segment: Segment) => tesselateToLines(segment, options);
  return genericConversion(shape, mapper);
}

function tesselatePoints(
  shape: Diagram,
  options?: TesselateSegmentOptions,
): Vector[][];
function tesselatePoints(
  shape: Figure,
  options?: TesselateSegmentOptions,
): Vector[][];
function tesselatePoints(
  shape: Loop,
  options?: TesselateSegmentOptions,
): Vector[][];
function tesselatePoints(
  shape: Strand,
  options?: TesselateSegmentOptions,
): Vector[][];
function tesselatePoints(
  shape: Segment,
  options?: TesselateSegmentOptions,
): Vector[][];
function tesselatePoints(
  shape: Diagram | Figure | Loop | Strand | Segment,
  options: TesselateSegmentOptions = {},
) {
  if (Diagram.isInstance(shape)) {
    return shape.figures.flatMap((figure) => tesselatePoints(figure, options));
  }

  if (Figure.isInstance(shape)) {
    const contour = orientPoints(
      stitchSegmentPoints(shape.contour.segments, options),
      false,
    );
    const holes = shape.holes.map((hole) =>
      orientPoints(stitchSegmentPoints(hole.segments, options), true),
    );
    return [contour, ...holes];
  }

  if (Loop.isInstance(shape)) {
    return [orientPoints(stitchSegmentPoints(shape.segments, options), false)];
  }

  if (Strand.isInstance(shape)) {
    return [stitchSegmentPoints(shape.segments, options)];
  }

  return [tesselateSegment(shape, options)];
}

export { tesselate, tesselatePoints };
