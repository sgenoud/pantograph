import { BoundingBox } from "../../models/BoundingBox.js";

export function svgViewbox(bbox: BoundingBox, margin = 1) {
  const minX = bbox.xMin - margin;
  const minY = bbox.yMin - margin;

  return `${minX} ${minY} ${bbox.width + 2 * margin} ${
    bbox.height + 2 * margin
  }`;
}

// The list comes from https://oreillymedia.github.io/Using_SVG/guide/units.html
export type SVGUnit = "mm" | "cm" | "in" | "pc" | "px" | "pt";

export function wrapSVG(
  body: string,
  boundingBox: BoundingBox,
  margin = 1,
  unit: null | SVGUnit,
) {
  const vbox = svgViewbox(boundingBox, margin);
  const sizes = unit
    ? `width="${boundingBox.width + 2 * margin}${unit}" height="${
        boundingBox.height + 2 * margin
      }${unit}"`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="${vbox}" fill="none" stroke="black" stroke-width="0.2%" vector-effect="non-scaling-stroke" ${sizes}>
    ${body}
</svg>`;
}
