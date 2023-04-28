import { drawRect } from "../../src/drawShape";
import { draw } from "../../src/main";
import { Dieline } from "./Dieline";
import { drawFlaps } from "./drawFlaps";

export function basicRectangularBody(
  sectionWidth: number,
  height: number,
  sectionDepth: number,
  pasteFlapHeight: number
) {
  const leftPane = drawRect(sectionDepth, height).translateX(
    -sectionWidth - sectionDepth / 2
  );
  const frontPane = drawRect(sectionWidth, height).translateX(
    -sectionWidth / 2
  );

  const body = new Dieline(leftPane).fuseFold(frontPane);
  body.fuseFold(body.translateX(sectionDepth + sectionWidth));
  body.fuseFold(
    drawFlaps
      .left(height, pasteFlapHeight, { contractionMode: "sharp" })
      .translateX(-sectionWidth - sectionDepth)
  );

  return body;
}

export function rectangularBodyWithEndTabs(
  sectionWidth: number,
  height: number,
  sectionDepth: number,
  pasteFlapHeight: number,
  endTabHeight: number
) {
  const body = basicRectangularBody(
    sectionWidth,
    height,
    sectionDepth,
    pasteFlapHeight
  );

  const verticalLine = draw([0, -endTabHeight / 2])
    .vLine(endTabHeight)
    .asStrand();
  const horizontalLine = draw([0, -endTabHeight / 2])
    .hLine(sectionDepth)
    .asStrand();

  const topTabs = new Dieline(
    drawRect(sectionWidth * 2 + sectionDepth * 2, endTabHeight),
    {
      cutLines: [
        verticalLine,
        verticalLine.translateX(-sectionWidth),
        verticalLine.translateX(sectionDepth),
      ],
      foldLinesForwards: [
        horizontalLine,
        horizontalLine.translateX(-sectionWidth - sectionDepth),
      ],
    }
  ).translateY(height / 2 + endTabHeight / 2);

  return body.fuseBody(topTabs).fuseBody(topTabs.mirror("x"));
}
