import terminalImage from "terminal-image";
import { exportSVG } from "../src/export/svg/exportSVG";

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { BoundingBox } from "../src/main";
import { polygon } from "./quickShapes";
import { drawCircle } from "../src/drawShape";

// There is a junk drawer of function that I use for debugging.

export function show(image: any) {
  const svgAsString = exportSVG(image);
  console.log(svgAsString);
  // eslint-disable-next-line no-console
  terminalImage.buffer(Buffer.from(svgAsString)).then((data) => {
    console.log(data);
  });
}

export const debugImg = (figures: any, name = "show", dir = "./__debug__") => {
  const svg = exportSVG(figures);
  const dirURL = new URL(dir, import.meta.url);

  if (!fs.existsSync(fileURLToPath(dirURL))) {
    fs.mkdirSync(fileURLToPath(dirURL), { recursive: true });
  }

  const fileURL = new URL(`${dir}/${name}.svg`, import.meta.url);
  fs.writeFileSync(fileURLToPath(fileURL), svg);
};

export const dpnt = (point: any, radius = 0.05) => {
  return drawCircle(radius).translateTo(point);
};

export const printPolygon = (p: any) =>
  console.log(
    `polygon(${JSON.stringify(p.segments.map((s: any) => s.firstPoint))})`
  );

export const drawBbox = (shape: { boundingBox: BoundingBox }) => {
  const { xMin, yMin, xMax, yMax } = shape.boundingBox;
  return polygon([
    [xMin, yMin],
    [xMax, yMin],
    [xMax, yMax],
    [xMin, yMax],
  ]);
};
