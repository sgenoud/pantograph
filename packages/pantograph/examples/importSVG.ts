import { DOMParser } from "xmldom";

import { drawRect } from "../src/drawShape/drawRect.js";
import { drawSVGPath } from "../src/drawShape/drawSVGPath.js";
import { drawCircle } from "../src/drawShape/drawCircle.js";
import { drawEllipse } from "../src/drawShape/drawEllipse.js";
import { Diagram, Strand } from "../src/main.js";

export function importSVG(svg: string, { width }: { width?: number } = {}) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "text/html");

  console.log(doc);

  let strokes: (Diagram | Strand)[] = [];

  for (let path of Array.from(doc.getElementsByTagName("path"))) {
    const commands = path.getAttribute("d");
    console.log(commands);
    if (commands) strokes.push(...drawSVGPath(commands));
  }

  for (let path of Array.from(doc.getElementsByTagName("polygon"))) {
    let commands = path.getAttribute("points");
    strokes.push(...drawSVGPath(`M${commands}z`));
  }

  for (let path of Array.from(doc.getElementsByTagName("rect"))) {
    const x = parseFloat(path.getAttribute("x") ?? "0");
    const y = parseFloat(path.getAttribute("y") ?? "0");
    const width = parseFloat(path.getAttribute("width") ?? "0");
    const height = parseFloat(path.getAttribute("height") ?? "0");

    let rx = parseFloat(path.getAttribute("rx") ?? "0");
    let ry = parseFloat(path.getAttribute("ry") ?? "0");

    strokes.push(
      drawRect(width, height, { rx, ry }).translate(
        x + width / 2,
        y + height / 2
      )
    );
  }

  for (let path of Array.from(doc.getElementsByTagName("circle"))) {
    const cx = parseFloat(path.getAttribute("cx") ?? "0");
    const cy = parseFloat(path.getAttribute("cy") ?? "0");
    const r = parseFloat(path.getAttribute("r") ?? "0");

    strokes.push(drawCircle(r).translate(cx, cy));
  }

  for (let path of Array.from(doc.getElementsByTagName("ellipse"))) {
    const cx = parseFloat(path.getAttribute("cx") ?? "0");
    const cy = parseFloat(path.getAttribute("cy") ?? "0");
    const rx = parseFloat(path.getAttribute("rx") ?? "0");
    const ry = parseFloat(path.getAttribute("ry") ?? "0");

    strokes.push(drawEllipse(rx, ry).translate(cx, cy));
  }

  // TODO: handle transforms and stokes

  // TODO: handle fusing of paths as defined by the SVG spec
  strokes = strokes.map((stroke) => stroke.mirror());

  console.log(strokes);

  if (width && strokes.length) {
    const bbox = strokes.slice(1).reduce((bbox, stroke) => {
      return stroke.boundingBox.merge(bbox);
    }, strokes[0].boundingBox);
    const factor = width / bbox.width;
    strokes = strokes.map((s) => s.scale(factor, bbox.center));
  }

  return strokes;
}
