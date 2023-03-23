export function allCombinations(count: number): [number, number][] {
  const result: [number, number][] = [];

  for (let i = 0; i < count; i++) {
    for (let j = 0; j <= i; j++) {
      result.push([i, j]);
    }
  }

  return result;
}

export function* combineDifferentValues<T>(array: T[]): Generator<[T, T]> {
  for (const [i, j] of allCombinations(array.length)) {
    if (i === j) continue;
    yield [array[i], array[j]];
  }
}
