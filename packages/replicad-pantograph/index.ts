import {
  Diagram,
  Figure,
  Loop,
  Line,
  Segment,
  Strand,
  Stroke,
  Arc,
  EllipseArc,
  QuadraticBezier,
  CubicBezier,
  isSegment,
} from "pantograph2d/models";

import * as drawShape from "pantograph2d/drawShape";
import * as pantograph from "pantograph2d";

import {
  svgLoop,
  svgStrand,
  svgSegmentToPath,
  svgViewbox,
} from "pantograph2d/svg";

import {
  makeLine,
  assembleWire,
  Plane,
  Sketch,
  Edge,
  makeThreePointArc,
  makeEllipseArc,
  Vector,
  makeBezierCurve,
  Sketches,
  CompoundSketch,
  makePlane,
  Point,
  PlaneName,
} from "replicad";

export function sketchSegment(segment: Segment, plane: Plane) {
  if (segment instanceof Line) {
    const firstPoint = plane.toWorldCoords(segment.firstPoint);
    const lastPoint = plane.toWorldCoords(segment.lastPoint);

    return makeLine(firstPoint, lastPoint);
  }

  if (segment instanceof Arc) {
    return makeThreePointArc(
      plane.toWorldCoords(segment.firstPoint),
      plane.toWorldCoords(segment.midPoint),
      plane.toWorldCoords(segment.lastPoint),
    );
  }

  if (segment instanceof EllipseArc) {
    const xDir = new Vector(plane.xDir).rotate(
      segment.tiltAngle,
      plane.origin,
      plane.zDir,
    );

    return makeEllipseArc(
      segment.majorRadius,
      segment.minorRadius,
      segment.clockwise ? segment.firstAngle : segment.lastAngle,
      segment.clockwise ? segment.lastAngle : segment.firstAngle,
      plane.toWorldCoords(segment.center),
      plane.zDir,
      xDir,
    );
  }

  if (segment instanceof QuadraticBezier) {
    return makeBezierCurve([
      plane.toWorldCoords(segment.firstPoint),
      plane.toWorldCoords(segment.controlPoint),
      plane.toWorldCoords(segment.lastPoint),
    ]);
  }

  if (segment instanceof CubicBezier) {
    return makeBezierCurve([
      plane.toWorldCoords(segment.firstPoint),
      plane.toWorldCoords(segment.firstControlPoint),
      plane.toWorldCoords(segment.lastControlPoint),
      plane.toWorldCoords(segment.lastPoint),
    ]);
  }

  console.error(segment);
  throw new Error(`Unsupported segment type ${segment}`);
}

function sketchFromSegments(segments: Edge[], plane: Plane) {
  return new Sketch(assembleWire(segments), {
    defaultOrigin: plane.origin,
    defaultDirection: plane.zDir,
  });
}

export function sketchStroke(stroke: Stroke, plane: Plane) {
  const segments = stroke.segments.map((segment: Segment) =>
    sketchSegment(segment, plane),
  );
  return sketchFromSegments(segments, plane);
}

export function sketchFigure(figure: Figure, plane: Plane) {
  const contour = sketchStroke(figure.contour, plane);
  const holes = figure.holes.map((hole: Loop) => sketchStroke(hole, plane));

  if (holes.length === 0) {
    return contour;
  }
  return new CompoundSketch([contour, ...holes]);
}

export function sketchDiagram(diagram: Diagram, plane: Plane) {
  if (diagram.figures.length === 1) {
    return sketchFigure(diagram.figures[0], plane);
  } else {
    return new Sketches(
      diagram.figures.map((f: Figure) => sketchFigure(f, plane)),
    );
  }
}

function sketchOnPlane(
  pantographObject: any,
  plane: Plane,
): Sketch | Sketches | CompoundSketch;
function sketchOnPlane(
  pantographObject: any,
  plane?: PlaneName,
  origin?: Point | number,
): Sketch | Sketches | CompoundSketch;
function sketchOnPlane(
  pantographObject: any,
  planeInput: Plane | PlaneName = "XY",
  origin: Point | number = [0, 0, 0],
): Sketch | Sketches | CompoundSketch {
  const plane =
    planeInput instanceof Plane
      ? makePlane(planeInput)
      : makePlane(planeInput, origin);

  if (pantographObject instanceof Diagram) {
    return sketchDiagram(pantographObject, plane);
  }

  if (pantographObject instanceof Figure) {
    return sketchFigure(pantographObject, plane);
  }

  if (pantographObject instanceof Loop) {
    return sketchStroke(pantographObject, plane);
  }

  if (
    pantographObject instanceof Line ||
    pantographObject instanceof Arc ||
    pantographObject instanceof EllipseArc ||
    pantographObject instanceof QuadraticBezier ||
    pantographObject instanceof CubicBezier
  ) {
    return sketchFromSegments([sketchSegment(pantographObject, plane)], plane);
  }

  throw new Error(
    `Unsupported object type "${pantographObject.constructor.name}"`,
  );
}

function toSVGPaths(shape: any): string[] {
  if (shape instanceof Diagram) {
    return shape.figures.flatMap(toSVGPaths);
  } else if (shape instanceof Figure) {
    return shape.allLoops.map((loop: Loop) => svgLoop(loop));
  } else if (shape instanceof Loop) {
    return [svgLoop(shape)];
  } else if (shape instanceof Strand) {
    return [svgStrand(shape)];
  } else if (isSegment(shape)) {
    return [`M ${shape.firstPoint.join(" ")} ${svgSegmentToPath(shape)}`];
  }
  throw new Error(`Failed to export ${shape}`);
}

function toSVGViewBox(shape: any) {
  const boundingBox = shape.boundingBox;
  return svgViewbox(boundingBox);
}

function wrapPantograph(pantographObject: any) {
  const isPantograph =
    isSegment(pantographObject) ||
    pantographObject instanceof Loop ||
    pantographObject instanceof Figure ||
    pantographObject instanceof Diagram;

  if (!isPantograph) return pantographObject;

  const shape = pantographObject.mirror();
  return {
    toSVGPaths: () => toSVGPaths(shape),
    toSVGViewBox: () => toSVGViewBox(shape),
  };
}

function initStudioIntegration() {
  if (!(globalThis as any).registerShapeStandardizer) return;
  (globalThis as any).registerShapeStandardizer("pantograph", wrapPantograph);
}

export { sketchOnPlane, initStudioIntegration, drawShape, pantograph };
