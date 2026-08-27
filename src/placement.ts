import { z } from 'zod';
import { tRotate, tTranslate, type TransformOp } from 'brepjs-families';

/** Optional `tTranslate` / `tRotate` list accepted by every placed family. */
export const transformProp = z
  .custom<readonly TransformOp[]>((value) => value === undefined || Array.isArray(value))
  .optional();

/** Compose the families transform vocabulary for a plan bearing and origin. */
export function placement(
  origin: readonly [number, number, number],
  bearingDegrees = 0
): TransformOp[] {
  const ops: TransformOp[] = [];
  if (bearingDegrees !== 0) ops.push(tRotate(bearingDegrees));
  if (origin[0] !== 0 || origin[1] !== 0 || origin[2] !== 0) {
    ops.push(tTranslate([origin[0], origin[1], origin[2]] as const));
  }
  return ops;
}
