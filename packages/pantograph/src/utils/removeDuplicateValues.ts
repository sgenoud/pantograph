const asFixed = (p: number, precision = 1e-9): string => {
  let num = p;
  if (Math.abs(p) < precision) num = 0;
  return num.toFixed(-Math.log10(precision));
};
export default function removeDuplicateValues(
  points: number[],
  precision = 1e-9,
): number[] {
  return Array.from(
    new Map(points.map((p) => [asFixed(p, precision), p])).values(),
  );
}
