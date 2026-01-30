# Pantograph package bootstrap

## Tests
- Run all tests (non-watch): `pnpm vitest --run`
- Target a single file (non-watch): `pnpm vitest --run path/to/spec.ts`

## Entry points
- Public API exports live in `src/main.ts`
- Operation aggregations live in `src/operations.ts`
- Lower-level algorithms are under `src/algorithms/`
- Shape drawing helpers are under `src/drawShape/`
- Model types and geometry primitives are under `src/models/`

## General conventions
- TypeScript ESM: use `.js` extensions in imports and `type` imports where appropriate
- Vectors are `type Vector = [number, number]` from `src/definitions.ts`
- Segment implementations live in `src/models/segments/` and implement the `AbstractSegment` interface
- Keep numeric tolerances consistent with existing `precision` usage on segments
- Prefer existing helpers in `src/vectorOperations.ts` instead of re-implementing math
- Tests live in `test/` and commonly use Vitest snapshots and optional `debugImg` tooling in `test/debug.ts`
