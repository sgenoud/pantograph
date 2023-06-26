import { Line } from "../../models/segments/Line.js";
import { Arc } from "../../models/segments/Arc.js";
import { Loop } from "../../models/Loop.js";
import { Figure } from "../../models/Figure.js";
import { Diagram } from "../../models/Diagram.js";
import { EllipseArc } from "../../models/segments/EllipseArc.js";
import {CubicBezier} from "../../models/segments/CubicBezier.js";

const importSegment = (json: any) => {
  if (json.type === "LINE") {
    return new Line(json.firstPoint, json.lastPoint);
  }
  if (json.type === "ARC") {
    return new Arc(
      json.firstPoint,
      json.lastPoint,
      json.center,
      json.clockwise
    );
  }
  if (json.type === "ELLIPSE_ARC") {
    return new EllipseArc(
      json.firstPoint,
      json.lastPoint,
      json.center,
      json.majorRadius,
      json.minorRadius,
      json.tiltAngle,
      json.clockwise,
      { angleUnits: "rad" }
    );
  }
  if (json.type === "CUBIC_BEZIER") {
    return new CubicBezier(
      json.firstPoint,
      json.lastPoint,
      json.firstControlPoint,
      json.lastControlPoint
    );
  }
  throw new Error("Unknown segment type");
};

const importLoop = (json: any) => {
  const segments = json.segments.map(importSegment);
  return new Loop(segments);
};

const importFigure = (json: any) => {
  const contour = importLoop(json.contour);
  const holes = json.holes.map(importLoop);
  return new Figure(contour, holes);
};

const importDiagram = (json: any) => {
  const figures = json.figures.map(importFigure);
  return new Diagram(figures);
};

export function importJSON(json: any) {
  if (json.type === "DIAGRAM") {
    return importDiagram(json);
  }
  if (json.type === "FIGURE") {
    return importFigure(json);
  }
  if (json.type === "LOOP") {
    return importLoop(json);
  }
  if (
    json.type === "LINE" ||
    json.type === "ARC" ||
    json.type === "ELLIPSE_ARC" ||
    json.type === "CUBIC_BEZIER"
  ) {
    return importSegment(json);
  }
  throw new Error("Unknown shape type");
}
