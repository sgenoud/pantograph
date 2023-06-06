import { Strand } from "../../models/Strand.js";
import { Diagram } from "../../models/Diagram.js";
import { Figure } from "../../models/Figure.js";
import { Loop } from "../../models/Loop.js";
import { Arc } from "../../models/segments/Arc.js";
import { Line } from "../../models/segments/Line.js";
import { svgDiagram } from "./svgDiagram.js";
import { svgFigure } from "./svgFigure.js";
import { svgLoop } from "./svgLoop.js";
import { svgSegmentToPath } from "./svgSegment.js";
import { svgStrand } from "./svgStrand.js";
import { SVGUnit, wrapSVG } from "./wrapSVG.js";
import type { Stroke } from "../../models/Stroke.js";
import { EllipseArc } from "../../models/segments/EllipseArc.js";

type Shape = Figure | Diagram | Arc | Line | EllipseArc | Stroke;

export function svgBody(shape: Shape) {
  if (shape instanceof Diagram) {
    return svgDiagram(shape);
  } else if (shape instanceof Figure) {
    return svgFigure(shape);
  } else if (shape instanceof Loop) {
    return `<path d="${svgLoop(shape)}" />`;
  } else if (shape instanceof Strand) {
    return `<path d="${svgStrand(shape)}" />`;
  } else if (
    shape instanceof Arc ||
    shape instanceof Line ||
    shape instanceof EllipseArc
  ) {
    return `<path d="${`M ${shape.firstPoint.join(" ")}`} ${svgSegmentToPath(
      shape
    )}" />`;
  } else {
    throw new Error("Unknown shape type");
  }
}

type ConfiguredShape = Shape | { shape: Shape; color?: string };

const extractShape = (shape: ConfiguredShape) =>
  "shape" in shape ? shape.shape : shape;

const addConfig = (shape: ConfiguredShape, body: string) => {
  if (!("shape" in shape)) return body;
  const { color } = shape;
  if (!color) return body;
  return `<g stroke="${color}">${body}</g>`;
};

export function exportSVG(
  shape: ConfiguredShape | ConfiguredShape[],
  {
    margin = 1,
    unit = null,
  }: {
    margin?: number;
    unit?: null | SVGUnit;
  } = {}
) {
  if (Array.isArray(shape)) {
    const flipped = shape.map((s) => extractShape(s).mirror());
    const body = flipped
      .map((s, i) => addConfig(shape[i], svgBody(s)))
      .join("\n");
    const bbox = flipped
      .slice(1)
      .reduce((bbox, s) => bbox.merge(s.boundingBox), flipped[0].boundingBox);

    return wrapSVG(body, bbox, margin, unit);
  }
  const flipped = extractShape(shape).mirror();
  return wrapSVG(
    addConfig(shape, svgBody(flipped)),
    flipped.boundingBox,
    margin,
    unit
  );
}
