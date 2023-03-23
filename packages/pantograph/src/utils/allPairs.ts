export function allPairs<S, T>(list1: T[], list2: S[]): [T, S][] {
  const result: [T, S][] = [];

  for (const l1 of list1) {
    for (const l2 of list2) {
      result.push([l1, l2]);
    }
  }

  return result;
}
