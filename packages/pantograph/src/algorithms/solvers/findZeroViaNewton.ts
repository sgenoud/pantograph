export function findZeroViaNewton(
  f: (x: number) => number,
  fPrime: (x: number) => number,
  x0: number,
  precision = 1e-6,
  maxIterations = 100,
): null | number {
  let x = x0;
  let iteration = 0;
  while (Math.abs(f(x)) > precision && iteration < maxIterations) {
    x = x - f(x) / fPrime(x);
    iteration++;
  }
  if (iteration === maxIterations) {
    return null;
  }
  return x;
}
