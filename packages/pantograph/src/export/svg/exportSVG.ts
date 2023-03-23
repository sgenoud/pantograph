import { Diagram } from "../../models/Diagram";
import { Figure } from "../../models/Figure";
import { Loop } from "../../models/Loop";
import { svgDiagram } from "./svgDiagram";
import { svgFigure } from "./svgFigure";
import { svgLoop } from "./svgLoop";
import { wrapSVG } from "./wrapSVG";

type Shape = Loop | Figure | Diagram;

export function svgBody(shape: Shape) {
  if (shape instanceof Diagram) {
    return svgDiagram(shape);
  } else if (shape instanceof Figure) {
    return svgFigure(shape);
  } else if (shape instanceof Loop) {
    return `<path d="${svgLoop(shape)}" />`;
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
