import { BoundingBox } from "../../models/BoundingBox";

export function SVGViewbox(bbox: BoundingBox, margin = 1) {
  const minX = bbox.xMin - margin;
  const minY = bbox.yMin - margin;

  return `${minX} ${minY} ${bbox.width + 2 * margin} ${
    bbox.height + 2 * margin
  }`;
}

export function wrapSVG(body: string, boundingBox: BoundingBox, margin = 1) {
  const vbox = SVGViewbox(boundingBox, margin);
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="${vbox}" fill="none" stroke="black" stroke-width="0.2%" vector-effect="non-scaling-stroke">
    ${body}
</svg>`;
}
