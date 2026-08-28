import {
  el,
  tRotate,
  tTranslate,
  type Element,
  type FamilyChildren,
  type TransformOp,
} from 'brepjs-families';
import { foldFamilyPose, type FamilyVec3 } from './families/familyPlacement.ts';

export { placedGeometry, transformProp } from './families/familyPlacement.ts';
export type {
  FamilyVec3 as Vec3,
  FoldedFamilyPose as FoldedPose,
} from './families/familyPlacement.ts';

type Vec3 = FamilyVec3;

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

/** Fold a transform list into one origin plus the orientation it applies to local +X/+Z. */
export const foldPose = foldFamilyPose;

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

function yawDegrees(axisX: Vec3): number {
  return (Math.atan2(axisX[1], axisX[0]) * 180) / Math.PI;
}

function nearly(a: Vec3, b: Vec3): boolean {
  return (
    Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6 && Math.abs(a[2] - b[2]) < 1e-6
  );
}
