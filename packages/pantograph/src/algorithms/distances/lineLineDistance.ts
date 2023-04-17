import { lineLineParams } from "../intersections/lineLineIntersection";
import type { Line } from "../../models/segments/Line";
import { distance } from "../../vectorOperations";

function segmentPosition(intersectionParam: number) {
  if (intersectionParam < 0) return "before";
  if (intersectionParam > 1) return "after";
  return "between";
}

const handleBetween = (
  lineBetween: Line,
  otherLine: Line,
  otherPosition: "before" | "after"
) => {
  if (otherPosition === "before")
    return lineBetween.distanceFrom(otherLine.firstPoint);
  else if (otherPosition === "after")
    return lineBetween.distanceFrom(otherLine.lastPoint);
  else throw new Error("Invalid position");
};

export function lineLineDistance(line1: Line, line2: Line): number {
  const intersectionParams = lineLineParams(line1, line2);

  if (intersectionParams === "parallel") {
    return Math.min(
      line1.distanceFrom(line2.firstPoint),
      line1.distanceFrom(line2.lastPoint)
    );
  }

  const { intersectionParam1, intersectionParam2 } = intersectionParams;

  const firstPosition = segmentPosition(intersectionParam1);
  const secondPosition = segmentPosition(intersectionParam2);

  if (firstPosition === "between" && secondPosition === "between") {
    return 0;
  } else if (firstPosition === "between" && secondPosition !== "between") {
    return handleBetween(line1, line2, secondPosition);
  } else if (secondPosition === "between" && firstPosition !== "between") {
    return handleBetween(line2, line1, firstPosition);
  } else if (firstPosition === "before" && secondPosition === "before") {
    return distance(line1.firstPoint, line2.firstPoint);
  } else if (firstPosition === "after" && secondPosition === "after") {
    return distance(line1.lastPoint, line2.lastPoint);
  } else if (firstPosition === "before" && secondPosition === "after") {
    return distance(line1.firstPoint, line2.lastPoint);
  } else if (firstPosition === "after" && secondPosition === "before") {
    return distance(line1.lastPoint, line2.firstPoint);
  } else {
    throw new Error("Invalid position");
  }
}
