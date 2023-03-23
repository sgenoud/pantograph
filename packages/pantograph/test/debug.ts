import terminalImage from "terminal-image";
import { exportSVG } from "../src/export/svg/exportSVG";

import fs from "node:fs";
import { fileURLToPath } from "node:url";

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

export const printPolygon = (p: any) =>
  console.log(
    `polygon(${JSON.stringify(p.segments.map((s: any) => s.firstPoint))})`
  );
