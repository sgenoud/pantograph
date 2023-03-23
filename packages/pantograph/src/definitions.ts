export type Vector = [number, number];

export function isVector(vector: unknown): vector is Vector {
  return Array.isArray(vector) && vector.length === 2;
}
