import { Strand } from "../../models/Strand.js";
import { Diagram } from "../../models/Diagram.js";
import { Figure } from "../../models/Figure.js";
import { Loop } from "../../models/Loop.js";
import { BoundingBox } from "../../models/BoundingBox.js";
import { svgDiagram } from "./svgDiagram.js";
import { svgFigure } from "./svgFigure.js";
import { svgLoop } from "./svgLoop.js";
import { svgSegmentToPath } from "./svgSegment.js";
import { svgStrand } from "./svgStrand.js";
import { SVGUnit, wrapSVG } from "./wrapSVG.js";
import type { Stroke } from "../../models/Stroke.js";
import { Segment } from "../../main.js";
import { isSegment } from "../../models/segments/utils/isSegment.js";

type Shape = Figure | Diagram | Stroke | Segment;

export function svgBody(shape: Shape) {
  if (shape instanceof Diagram) {
    return svgDiagram(shape);
  } else if (shape instanceof Figure) {
    return svgFigure(shape);
  } else if (shape instanceof Loop) {
    return `<path d="${svgLoop(shape)}" />`;
  } else if (shape instanceof Strand) {
    return `<path d="${svgStrand(shape)}" />`;
  } else if (isSegment(shape)) {
    return `<path d="${`M ${shape.firstPoint.join(" ")}`} ${svgSegmentToPath(
      shape,
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

const flibBbox = (bbox: BoundingBox) => {
  return new BoundingBox(bbox.xMin, -bbox.yMax, bbox.xMax, -bbox.yMin);
};

export function exportSVG(
  shape: ConfiguredShape | ConfiguredShape[],
  {
    margin = 1,
    unit = null,
    viewBox,
  }: {
    margin?: number;
    unit?: null | SVGUnit;
    viewBox?: BoundingBox;
  } = {},
) {
  if (Array.isArray(shape)) {
    const flipped = shape.map((s) => extractShape(s).mirror());
    const body = flipped
      .map((s, i) => addConfig(shape[i], svgBody(s)))
      .join("\n");
    const bbox = flipped
      .slice(1)
      .reduce((bbox, s) => bbox.merge(s.boundingBox), flipped[0].boundingBox);

    return wrapSVG(body, viewBox ? flibBbox(viewBox) : bbox, margin, unit);
  }
  const flipped = extractShape(shape).mirror();
  return wrapSVG(
    addConfig(shape, svgBody(flipped)),
    viewBox ? flibBbox(viewBox) : flipped.boundingBox,
    margin,
    unit,
  );
}
