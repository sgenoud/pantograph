import { Diagram } from "../../models/Diagram";
import { Figure } from "../../models/Figure";
import { Loop } from "../../models/Loop";
import { Arc } from "../../models/segments/Arc";
import { Line } from "../../models/segments/Line";
import { svgDiagram } from "./svgDiagram";
import { svgFigure } from "./svgFigure";
import { svgLoop } from "./svgLoop";
import { svgSegmentToPath } from "./svgSegment";
import { wrapSVG } from "./wrapSVG";

type Shape = Loop | Figure | Diagram | Arc | Line;

export function svgBody(shape: Shape) {
  if (shape instanceof Diagram) {
    return svgDiagram(shape);
  } else if (shape instanceof Figure) {
    return svgFigure(shape);
  } else if (shape instanceof Loop) {
    return `<path d="${svgLoop(shape)}" />`;
  } else if (shape instanceof Arc || shape instanceof Line) {
    return `<path d="${`M ${shape.firstPoint.join(" ")}`} ${svgSegmentToPath(
      shape
    )}" />`;
  } else {
    throw new Error("Unknown shape type");
  }
}

export function exportSVG(shape: Shape | Shape[], margin = 1) {
  if (Array.isArray(shape)) {
    const flipped = shape.map((s) => s.mirror());
    const body = flipped.map((s) => svgBody(s)).join("\n");
    const bbox = flipped
      .slice(1)
      .reduce((bbox, s) => bbox.merge(s.boundingBox), flipped[0].boundingBox);

    return wrapSVG(body, bbox);
  }
  const flipped = shape.mirror();
  return wrapSVG(svgBody(flipped), flipped.boundingBox, margin);
}
