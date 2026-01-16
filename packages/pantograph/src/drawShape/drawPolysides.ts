import { draw } from "../draw";
import range from "../utils/range";

export function drawPolysides(
  radius: number,
  sidesCount: number,
  sagitta?: number,
) {
  const points = range(sidesCount).map((i) => {
    const theta = -((Math.PI * 2) / sidesCount) * i;
    return [radius * Math.sin(theta), radius * Math.cos(theta)] as [
      number,
      number,
    ];
  });

  let drawing = draw(points[points.length - 1]);
  for (const point of points) {
    if (sagitta) {
      drawing = drawing.sagittaArcTo(point, sagitta);
    } else {
      drawing = drawing.lineTo(point);
    }
  }
  return drawing.close();
}
