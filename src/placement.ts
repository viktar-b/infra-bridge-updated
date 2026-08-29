import { el, tRotate, tTranslate, type Element, type TransformOp } from 'brepjs-families';

export { placedGeometry, transformProp } from './families/familyPlacement.ts';

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

/** Civil spatial Group that forwards the authored transform to `familiesToBim`. */
export function spatialGroup(
  transform: readonly TransformOp[] | undefined,
  children: readonly Element[]
): Element {
  return el('Group', { transform: transform ?? [] }, children);
}
