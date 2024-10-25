import { draw, polarToCartesian } from "pantograph2d";
import { drawRect } from "pantograph2d/drawShape";

import { drawFlaps, Dieline, linearSpread } from "../src/main.js";

export function toothedGear(
  outerRadius: number,
  toothDepth: number,
  teethCount = 80,
  mode = "straight",
) {
  const angle = 360 / teethCount;
  const innerRadius = outerRadius - toothDepth;
  const pen = draw([outerRadius, 0]);
  for (let i = 1; i <= teethCount; i++) {
    const firstPoint = polarToCartesian(outerRadius, angle * (i - 0.5));
    if (mode === "straight") {
      pen.lineTo(firstPoint);
    } else {
      pen.bulgeArcTo(firstPoint, 1);
    }
    pen.lineTo(polarToCartesian(innerRadius, angle * (i - 0.5)));
    pen.lineTo(polarToCartesian(innerRadius, angle * i));
    pen.lineTo(polarToCartesian(outerRadius, angle * i));
  }
  return new Dieline(pen.close());
}

export function teethStrip(
  toothWidth: number,
  toothHeight: number,
  toothDepth: number,
  teethCount: number,
) {
  const totalWidth = toothWidth * 2 + toothDepth;
  const totalHeight = toothHeight * teethCount;

  const strip = new Dieline(drawRect(totalWidth, totalHeight));

  const foldLine = draw([0, totalHeight / 2])
    .vLine(-totalHeight)
    .asStrand();
  strip.addFoldLine(foldLine.translateX(toothDepth / 2));
  strip.addFoldLine(foldLine.translateX(-toothDepth / 2));

  const cutLine = draw([-totalWidth / 2, totalHeight / 2])
    .hLine(totalWidth)
    .asStrand();
  for (let i = 1; i < teethCount; i++) {
    strip.addCutLine(cutLine.translateY(-i * toothHeight));
  }

  return strip;
}

export function circleWithPasteFlaps(
  radius: number,
  flapHeight: number,
  flapWidth: number,
) {
  const perimeter = 2 * Math.PI * radius;
  const flapCount = Math.ceil(perimeter / flapWidth);

  const angle = 360 / flapCount;

  const outerRadius = radius + flapHeight;

  const body = draw([radius, 0]);
  const foldLines = draw([radius, 0]);

  for (let i = 1; i <= flapCount; i++) {
    const midPoint = polarToCartesian(outerRadius, angle * (i - 0.5));
    const endPoint = polarToCartesian(radius, angle * i);

    body.lineTo(midPoint);
    body.lineTo(endPoint);

    foldLines.lineTo(endPoint);
  }

  return new Dieline(body.close(), {
    foldLinesBackwards: [foldLines.asStrand()],
  });
}

export function smallPasteFlapsStrip(
  width: number,
  height: number,
  flapHeight = 5,
  flapWidth = 5,
) {
  const flapCount = Math.ceil(width / flapWidth);

  const actualFlapWidth = width / flapCount;

  const body = draw([-width / 2, 0]).vLine(height / 2);

  for (let i = 1; i <= flapCount; i++) {
    body.line(actualFlapWidth * 0.5, flapHeight);
    body.line(actualFlapWidth * 0.5, -flapHeight);
  }
  body.vLine(-height / 2);

  const foldLines = [
    draw([-width / 2, height / 2])
      .hLine(width)
      .asStrand(),
    draw([-width / 2, -height / 2])
      .hLine(width)
      .asStrand(),
  ];

  return new Dieline(body.closeWithMirror(), { foldLinesBackwards: foldLines });
}

export function triangularFlap(
  partWidth: number,
  height: number,
  foldHeight: number,
) {
  const base = new Dieline(drawRect(partWidth, height));

  base
    .fuseFold(
      drawFlaps
        .top(partWidth, foldHeight, {
          contraction: foldHeight * 2,
          contractionMode: "sharp",
        })
        .translateY(height / 2),
    )
    .fuseFold(
      drawFlaps
        .bottom(partWidth, foldHeight, {
          contraction: foldHeight * 2,
          contractionMode: "sharp",
        })
        .translateY(-height / 2),
    );

  return base
    .clone()
    .fuseFold(base.translateX(-partWidth))
    .fuseFold(base.translateX(partWidth))
    .fuseFold(
      drawFlaps
        .right(height, foldHeight, { contractionMode: "sharp" })
        .translateX(partWidth * 1.5),
    );
}

// See number 39
export function starExtrusionWithFlaps(
  extrusionDepth,
  sideLength,
  sides,
  flapHeight,
) {
  const oneSpike = new Dieline(
    drawRect(extrusionDepth, sideLength).translateY(sideLength / 2),
  );
  oneSpike.fuseFold(oneSpike.clone().mirror("x"));

  const allSpikes = linearSpread(2 * sideLength, sides, "y").distribute(
    oneSpike,
  );

  const doubleTriangle = new Dieline(
    draw([0, 0])
      .vLine(sideLength)
      .line(-flapHeight, -sideLength)
      .closeWithMirror(),
    { cutLines: [draw([0, 0]).hLine(-flapHeight).asStrand()] },
  ).translateX(-extrusionDepth / 2);

  const triangleSpread = linearSpread(2 * sideLength, sides + 1, "y");
  const allDoubleTriangles = [
    ...triangleSpread.distribute(doubleTriangle),
    ...triangleSpread.distribute(doubleTriangle.mirror("y")),
  ];

  const accordeon = allSpikes
    .slice(1)
    .reduce((prev, curr) => prev.fuseFold(curr, "forwards"), allSpikes[0]);

  allDoubleTriangles.forEach((triangle) => {
    accordeon.fuseFold(triangle, "backwards");
  });

  const toCut = drawRect(extrusionDepth + 3 * flapHeight, 2 * sideLength);
  accordeon.cutShape(toCut.translateY(sideLength * (sides + 1)));
  accordeon.cutShape(toCut.translateY(-sideLength * (sides + 1)));

  accordeon.fuseFold(
    drawFlaps
      .bottom(extrusionDepth, flapHeight, {
        contractionMode: "sharp",
      })
      .translateY(-sideLength * sides),
    "forwards",
  );

  return accordeon;
}
