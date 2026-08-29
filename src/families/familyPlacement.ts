import { csg } from 'brepjs';
import { el, type Element, type TransformOp } from 'brepjs-families';
import { z } from 'zod';

/** Optional ordered translation and rotation operations accepted by every leaf Family. */
export const transformProp = z
  .custom<readonly TransformOp[]>((value) => value === undefined || Array.isArray(value))
  .optional();

/** Build a Geometry intrinsic that keeps the authored transform list as placement. */
export function placedGeometry(
  node: csg.IRNode,
  transform: readonly TransformOp[] | undefined
): Element {
  return el('Geometry', {
    transform: transform ?? [],
    node,
  });
}
