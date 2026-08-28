import { csg } from 'brepjs';
import { el, tTranslate, type Element, type TransformOp } from 'brepjs-families';
import { z } from 'zod';

export type FamilyVec3 = readonly [number, number, number];

/** Optional ordered translation and rotation operations accepted by every leaf Family. */
export const transformProp = z
  .custom<readonly TransformOp[]>((value) => value === undefined || Array.isArray(value))
  .optional();

export interface FoldedFamilyPose {
  readonly origin: FamilyVec3;
  readonly axisX: FamilyVec3;
  readonly axisZ: FamilyVec3;
  readonly rotateOps: readonly TransformOp[];
}

const EPS = 1e-9;

/** Fold an ordered Family transform list into an origin and local coordinate axes. */
export function foldFamilyPose(ops: readonly TransformOp[] | undefined): FoldedFamilyPose {
  let origin: [number, number, number] = [0, 0, 0];
  let axisX: [number, number, number] = [1, 0, 0];
  let axisZ: [number, number, number] = [0, 0, 1];
  const rotateOps: TransformOp[] = [];
  for (const op of ops ?? []) {
    if (op.op === 'translate') {
      origin = add(origin, op.v);
      continue;
    }
    rotateOps.push(op);
    const axis = op.axis ?? [0, 0, 1];
    const at = op.at ?? [0, 0, 0];
    origin = rotatePoint(origin, op.angleDeg, axis, at);
    axisX = rotateVector(axisX, op.angleDeg, axis);
    axisZ = rotateVector(axisZ, op.angleDeg, axis);
  }
  return { origin, axisX, axisZ, rotateOps };
}

/** Build a Geometry intrinsic with rotations baked into CSG and translation kept as placement. */
export function placedGeometry(
  node: csg.IRNode,
  transform: readonly TransformOp[] | undefined
): Element {
  const pose = foldFamilyPose(transform);
  return el('Geometry', {
    transform: translationOps(pose.origin),
    node: bakeRotations(node, pose.rotateOps),
  });
}

function translationOps(origin: FamilyVec3): TransformOp[] {
  if (Math.abs(origin[0]) < EPS && Math.abs(origin[1]) < EPS && Math.abs(origin[2]) < EPS) {
    return [];
  }
  return [tTranslate([origin[0], origin[1], origin[2]])];
}

function bakeRotations(node: csg.IRNode, rotateOps: readonly TransformOp[]): csg.IRNode {
  let output = node;
  for (const op of rotateOps) {
    if (op.op !== 'rotate') continue;
    output = csg.rotate(output, op.angleDeg, {
      ...(op.axis ? { axis: op.axis } : {}),
      ...(op.at ? { at: op.at } : {}),
    });
  }
  return output;
}

function add(a: FamilyVec3, b: FamilyVec3): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function rotatePoint(
  point: FamilyVec3,
  angleDegrees: number,
  axis: FamilyVec3,
  at: FamilyVec3
): [number, number, number] {
  const rotated = rotateVector(
    [point[0] - at[0], point[1] - at[1], point[2] - at[2]],
    angleDegrees,
    axis
  );
  return [rotated[0] + at[0], rotated[1] + at[1], rotated[2] + at[2]];
}

function rotateVector(
  vector: FamilyVec3,
  angleDegrees: number,
  axis: FamilyVec3
): [number, number, number] {
  const length = Math.hypot(axis[0], axis[1], axis[2]);
  const normalizedAxis: FamilyVec3 =
    length < EPS ? [0, 0, 1] : [axis[0] / length, axis[1] / length, axis[2] / length];
  const radians = (angleDegrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const dot =
    normalizedAxis[0] * vector[0] +
    normalizedAxis[1] * vector[1] +
    normalizedAxis[2] * vector[2];
  const cross: FamilyVec3 = [
    normalizedAxis[1] * vector[2] - normalizedAxis[2] * vector[1],
    normalizedAxis[2] * vector[0] - normalizedAxis[0] * vector[2],
    normalizedAxis[0] * vector[1] - normalizedAxis[1] * vector[0],
  ];
  const oneMinusCosine = 1 - cosine;
  return [
    vector[0] * cosine + cross[0] * sine + normalizedAxis[0] * dot * oneMinusCosine,
    vector[1] * cosine + cross[1] * sine + normalizedAxis[1] * dot * oneMinusCosine,
    vector[2] * cosine + cross[2] * sine + normalizedAxis[2] * dot * oneMinusCosine,
  ];
}
