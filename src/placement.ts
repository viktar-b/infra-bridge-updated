import { csg } from 'brepjs';
import {
  el,
  tRotate,
  tTranslate,
  type Element,
  type FamilyChildren,
  type TransformOp,
} from 'brepjs-families';
import { z } from 'zod';

export type Vec3 = readonly [number, number, number];

/** Optional `tTranslate` / `tRotate` list accepted by every placed family. */
export const transformProp = z
  .custom<readonly TransformOp[]>((value) => value === undefined || Array.isArray(value))
  .optional();

const EPS = 1e-9;

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

export interface FoldedPose {
  readonly origin: Vec3;
  readonly axisX: Vec3;
  readonly axisZ: Vec3;
  readonly rotateOps: readonly TransformOp[];
}

/** Fold a transform list into one origin plus the orientation it applies to local +X/+Z. */
export function foldPose(ops: readonly TransformOp[] | undefined): FoldedPose {
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
    axisX = rotateVec(axisX, op.angleDeg, axis);
    axisZ = rotateVec(axisZ, op.angleDeg, axis);
  }
  return { origin, axisX, axisZ, rotateOps };
}

/**
 * Civil spatial Group: keep only the folded translation here, and push yaw onto
 * children. Spec-routed products cannot inherit `tRotate`.
 */
export function spatialGroup(
  transform: readonly TransformOp[] | undefined,
  children: FamilyChildren
): Element {
  const pose = foldPose(transform);
  if (!nearly(pose.axisZ, [0, 0, 1])) {
    throw new Error('civil spatial placement must keep +Z up; bake 3D pitch onto products');
  }
  const yaw = yawDegrees(pose.axisX);
  return el(
    'Group',
    { transform: translateOps(pose.origin) },
    childList(children).map((child) => applyPose(child, yaw))
  );
}

function childList(children: FamilyChildren): Element[] {
  const out: Element[] = [];
  const visit = (value: FamilyChildren) => {
    if (value === null || value === undefined || typeof value === 'boolean') return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    out.push(value as Element);
  };
  visit(children);
  return out;
}

/** Geometry intrinsic whose localTransforms are translation-only. */
export function placedGeometry(
  node: csg.IRNode,
  transform: readonly TransformOp[] | undefined
): Element {
  const pose = foldPose(transform);
  return el('Geometry', {
    transform: translateOps(pose.origin),
    node: bakeRotates(node, pose.rotateOps),
  });
}

function applyPose(child: Element, yaw: number): Element {
  const ops =
    Math.abs(yaw) < EPS
      ? [...asOps(child.props['transform'])]
      : [...asOps(child.props['transform']), tRotate(yaw)];
  const pose = foldPose(ops);
  if (isProductElement(child)) {
    return withElementProps(child, {
      transform: ops,
      axisX: pose.axisX,
      axisZ: pose.axisZ,
    });
  }
  if (Math.abs(yaw) < EPS) return child;
  return withElementProps(child, { transform: ops });
}

function isProductElement(child: Element): boolean {
  const type = child.type;
  if (typeof type === 'string') return false;
  return type.resolveSemanticsErased?.(child.props)?.kind === 'product';
}

function withElementProps(child: Element, patch: Record<string, unknown>): Element {
  return {
    type: child.type,
    key: child.key,
    children: child.children,
    props: { ...child.props, ...patch },
  };
}

function asOps(value: unknown): readonly TransformOp[] {
  return Array.isArray(value) ? (value as readonly TransformOp[]) : [];
}

function translateOps(origin: Vec3): TransformOp[] {
  if (Math.abs(origin[0]) < EPS && Math.abs(origin[1]) < EPS && Math.abs(origin[2]) < EPS) {
    return [];
  }
  return [tTranslate([origin[0], origin[1], origin[2]])];
}

function bakeRotates(node: csg.IRNode, rotateOps: readonly TransformOp[]): csg.IRNode {
  let out = node;
  for (const op of rotateOps) {
    if (op.op !== 'rotate') continue;
    out = csg.rotate(out, op.angleDeg, {
      ...(op.axis ? { axis: op.axis } : {}),
      ...(op.at ? { at: op.at } : {}),
    });
  }
  return out;
}

function yawDegrees(axisX: Vec3): number {
  return (Math.atan2(axisX[1], axisX[0]) * 180) / Math.PI;
}

function add(a: Vec3, b: Vec3): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function nearly(a: Vec3, b: Vec3): boolean {
  return (
    Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6 && Math.abs(a[2] - b[2]) < 1e-6
  );
}

function rotatePoint(point: Vec3, angleDeg: number, axis: Vec3, at: Vec3): [number, number, number] {
  const rotated = rotateVec(
    [point[0] - at[0], point[1] - at[1], point[2] - at[2]],
    angleDeg,
    axis
  );
  return [rotated[0] + at[0], rotated[1] + at[1], rotated[2] + at[2]];
}

function rotateVec(v: Vec3, angleDeg: number, axis: Vec3): [number, number, number] {
  const length = Math.hypot(axis[0], axis[1], axis[2]);
  const k: Vec3 = length < EPS ? [0, 0, 1] : [axis[0] / length, axis[1] / length, axis[2] / length];
  const theta = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const dot = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const cross: Vec3 = [
    k[1] * v[2] - k[2] * v[1],
    k[2] * v[0] - k[0] * v[2],
    k[0] * v[1] - k[1] * v[0],
  ];
  const oneMinus = 1 - cos;
  return [
    v[0] * cos + cross[0] * sin + k[0] * dot * oneMinus,
    v[1] * cos + cross[1] * sin + k[1] * dot * oneMinus,
    v[2] * cos + cross[2] * sin + k[2] * dot * oneMinus,
  ];
}
