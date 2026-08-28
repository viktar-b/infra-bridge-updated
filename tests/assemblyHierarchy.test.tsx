/** @jsxImportSource brepjs-families */

import { beforeAll, describe, expect, expectTypeOf, it } from 'vitest';
import { init } from 'brepjs';
import { resolve, type ResolvedElement } from 'brepjs-families';
import { RailArchBridge, type RailArchBridgeInput } from '../src/assemblies/railArchBridge.tsx';
import { RailArchSuperstructure } from '../src/assemblies/railArchSuperstructure.tsx';
import { RailPier } from '../src/assemblies/railPier.tsx';
import { RailSite } from '../src/assemblies/railSite.tsx';
import type { RailSubstructureInput } from '../src/assemblies/railSubstructure.tsx';
import { RoadAbutment } from '../src/assemblies/roadAbutment.tsx';
import { RoadDeck } from '../src/assemblies/roadDeck.tsx';
import { RoadGirderBridge } from '../src/assemblies/roadGirderBridge.tsx';
import { RoadPier } from '../src/assemblies/roadPier.tsx';
import { RoadSite } from '../src/assemblies/roadSite.tsx';
import { RoadSuperstructure } from '../src/assemblies/roadSuperstructure.tsx';
import { MATERIALS } from '../src/materials.ts';
import { RAIL_BRIDGE_SET_OUT, ROAD_BRIDGE_SET_OUT } from '../src/setout.ts';

const roadPierDimensions = {
  footingLength: ROAD_BRIDGE_SET_OUT.piers.footing.length,
  footingWidth: ROAD_BRIDGE_SET_OUT.piers.footing.width,
  footingThickness: ROAD_BRIDGE_SET_OUT.piers.footing.thickness,
  stemLength: ROAD_BRIDGE_SET_OUT.piers.stem.length,
  stemWidth: ROAD_BRIDGE_SET_OUT.piers.stem.width,
  stemHeight: ROAD_BRIDGE_SET_OUT.piers.stem.height,
  capOffset: ROAD_BRIDGE_SET_OUT.piers.stem.capOffset,
  crossGirderLength: ROAD_BRIDGE_SET_OUT.piers.crossGirder.length,
  crossGirderWidth: ROAD_BRIDGE_SET_OUT.piers.crossGirder.width,
  crossGirderDepth: ROAD_BRIDGE_SET_OUT.piers.crossGirder.depth,
  crossGirderSetout: ROAD_BRIDGE_SET_OUT.piers.crossGirder.setout,
  crossGirderInset: ROAD_BRIDGE_SET_OUT.piers.crossGirder.inset,
} as const;

const railPierDimensions = {
  stemLongitudinalWidth: RAIL_BRIDGE_SET_OUT.piers.stem.longitudinalWidth,
  stemTransverseLength: RAIL_BRIDGE_SET_OUT.piers.stem.transverseLength,
  stemHeight: RAIL_BRIDGE_SET_OUT.piers.stem.height,
  footingLength: RAIL_BRIDGE_SET_OUT.piers.footing.length,
  footingWidth: RAIL_BRIDGE_SET_OUT.piers.footing.width,
  footingThickness: RAIL_BRIDGE_SET_OUT.piers.footing.thickness,
  footingBearingDegrees: RAIL_BRIDGE_SET_OUT.piers.footing.bearingFromStemDegrees,
} as const;

const railSuperstructureDimensions = {
  ...RAIL_BRIDGE_SET_OUT.superstructure,
  signWidth: RAIL_BRIDGE_SET_OUT.superstructure.sign.width,
  signHeight: RAIL_BRIDGE_SET_OUT.superstructure.sign.height,
  signPlateDepth: RAIL_BRIDGE_SET_OUT.superstructure.sign.plateDepth,
  signReliefDepth: RAIL_BRIDGE_SET_OUT.superstructure.sign.reliefDepth,
} as const;

beforeAll(async () => {
  await init();
}, 120_000);

describe('owned infrastructure Assemblies', () => {
  it('keeps rail job dimensions out of Bridge and Substructure input contracts', () => {
    expectTypeOf<keyof RailArchBridgeInput>().toEqualTypeOf<'name' | 'transform'>();
    expectTypeOf<keyof RailSubstructureInput>().toEqualTypeOf<'name' | 'transform'>();
  });

  it('keeps RoadAbutment as a validated BridgePart definition boundary', () => {
    const root = resolve(
      <RoadAbutment
        key="abutment"
        transverseSide="negative"
        {...ROAD_BRIDGE_SET_OUT.abutment}
        material={MATERIALS.reinforcedConcrete}
      />
    );
    expect(root).toMatchObject({
      type: 'RoadAbutment',
      semantics: { kind: 'spatial-part', category: 'bridge-part', role: 'abutment' },
    });
    expect(childKeys(root)).toEqual(['abutment-support-beam']);
    expect(root.children[0]?.semantics).toMatchObject({ kind: 'product', category: 'beam' });
  });

  it('composes RoadPier from the three intended keyed Families', () => {
    const root = resolve(
      <RoadPier
        key="pier"
        concreteMaterial={MATERIALS.reinforcedConcrete}
        stemMaterial={MATERIALS.graniteMasonry}
        girderMaterial={MATERIALS.bridgeTimber}
        {...roadPierDimensions}
      />
    );
    expect(root.semantics).toMatchObject({
      kind: 'spatial-part',
      category: 'bridge-part',
      role: 'pier',
    });
    expect(childKeys(root)).toEqual(['cross-girder', 'pier-stem', 'footing']);
    expect(localOrigin(root.children[0])).toEqual([2_000, -150, -756]);
    expect(localOrigin(root.children[2])).toEqual([0, 0, -3_042.321]);
  });

  it('composes RailPier from one stem and one centred footing', () => {
    const root = resolve(<RailPier key="pier" {...railPierDimensions} />);
    expect(root.semantics).toMatchObject({
      kind: 'spatial-part',
      category: 'bridge-part',
      role: 'pier',
    });
    expect(childKeys(root)).toEqual(['pier-stem', 'footing']);
    expect(localOrigin(root.children[1])).toEqual([0, 2_200, 0]);
    expect(localXAxis(root.children[1]).map((value) => Math.round(value))).toEqual([0, -1, 0]);
  });

  it('makes all ten rail-superstructure products explicit', () => {
    const root = resolve(
      <RailArchSuperstructure key="superstructure" {...railSuperstructureDimensions} />
    );
    expect(root.semantics).toMatchObject({
      kind: 'spatial-part',
      category: 'bridge-part',
      role: 'superstructure',
    });
    expect(childKeys(root)).toEqual([
      'filler-01',
      'filler-02',
      'arch-segment-01',
      'arch-segment-02',
      'arch-segment-03',
      'arch-segment-04',
      'name-sign-01',
      'name-sign-02',
      'spandrel-wall-01',
      'spandrel-wall-02',
    ]);
  });

  it('reuses one RailArchBridge definition with nested rotated pier Frames', () => {
    const root = resolve(<RailArchBridge key="rail" />);
    expect(childKeys(root)).toEqual(['superstructure', 'substructure']);
    const substructure = root.children[1];
    expect(substructure).toMatchObject({
      type: 'RailSubstructure',
      semantics: { kind: 'spatial-part', category: 'bridge-part', role: 'substructure' },
    });
    expect(substructure === undefined ? [] : childKeys(substructure)).toEqual([
      'pier-01',
      'pier-02',
    ]);
    const origin = worldOrigin(
      substructure?.children[0],
      substructure === undefined ? [root] : [substructure, root]
    );
    expect(origin[0]).toBeCloseTo(-2_200, 6);
    expect(origin[1]).toBeCloseTo(5_000, 6);
    expect(origin[2]).toBeCloseTo(-490, 6);
  });

  it('keeps all five road major BridgeParts explicit', () => {
    const root = resolve(<RoadGirderBridge key="road" />);
    expect(childKeys(root)).toEqual([
      'substructure',
      'superstructure',
      'deck',
      'approach-01',
      'approach-02',
    ]);
  });

  it('resolves the named road-bridge set-out controls at each Assembly boundary', () => {
    const root = resolve(<RoadGirderBridge key="road" />);
    const [substructure, superstructure, , startApproach, endApproach] = root.children;

    expect(substructure?.children.map((child) => localOrigin(child))).toEqual([
      [-4_795.5, 0, 0],
      [0, 0, 0],
      [4_845.5, 0, 0],
    ]);
    expect(superstructure?.children.map((child) => localOrigin(child))).toEqual([
      [4_945.5, 1_675, -356],
      [4_945.5, 0, -356],
      [4_945.5, -1_675, -356],
    ]);
    expect(localOrigin(startApproach)).toEqual([-4_945.5, -1_684, 0]);
    expect(localOrigin(endApproach)).toEqual([4_945.5, -1_684, 0]);
  });

  it('derives RoadDeck child set-out from its typed authored dimensions', () => {
    const defaultRoot = resolve(
      <RoadDeck
        key="default-deck"
        {...ROAD_BRIDGE_SET_OUT.deck.dimensions}
        {...ROAD_BRIDGE_SET_OUT.deck.railing}
      />
    );
    expect(defaultRoot.children.map((child) => localOrigin(child))).toEqual([
      [4_945.5, -1_675, -56],
      [4_945.5, 1_684, 0],
      [4_945.5, -1_684, 0],
    ]);

    const variantRoot = resolve(
      <RoadDeck
        key="variant-deck"
        length={10_000}
        width={4_000}
        slabThickness={100}
        setoutInset={10}
        {...ROAD_BRIDGE_SET_OUT.deck.railing}
      />
    );

    expect(childKeys(variantRoot)).toEqual(['bridge-deck', 'railing-01', 'railing-02']);
    expect(variantRoot.children.map((child) => localOrigin(child))).toEqual([
      [4_990, -1_990, -100],
      [4_990, 2_000, 0],
      [4_990, -2_000, 0],
    ]);
    expect(
      variantRoot.children.map((child) => localXAxis(child).map((value) => Math.round(value)))
    ).toEqual([
      [-1, 0, 0],
      [1, 0, 0],
      [-1, 0, 0],
    ]);
  });

  it('coordinates repeated main-girder dimensions through RoadSuperstructure props', () => {
    const root = resolve(
      <RoadSuperstructure
        key="superstructure"
        girderLength={10_000}
        girderWidth={300}
        girderDepth={400}
      />
    );

    expect(childKeys(root)).toEqual(['main-girder-01', 'main-girder-02', 'main-girder-03']);
    for (const child of root.children) {
      expect(
        child.semantics !== undefined && 'dimensionsMm' in child.semantics
          ? child.semantics.dimensionsMm
          : undefined
      ).toMatchObject({
        length: 10_000,
        width: 300,
        height: 400,
      });
    }
  });

  it('owns one road Site definition with the keyed road Bridge', () => {
    const root = resolve(<RoadSite key="road-site" />);
    expect(root).toMatchObject({
      type: 'RoadSite',
      semantics: { kind: 'site', properties: { name: 'Road river bridge site' } },
    });
    expect(childKeys(root)).toEqual(['road-river-bridge']);
  });

  it('reuses one typed rail Site definition with distinct bridge keys', () => {
    const first = resolve(
      <RailSite key="rail-site-01" occurrenceKey="01" siteName="Rail site 01" />
    );
    const second = resolve(
      <RailSite key="rail-site-02" occurrenceKey="02" siteName="Rail site 02" />
    );
    expect(first.type).toBe('RailSite');
    expect(second.type).toBe('RailSite');
    expect(first.semantics?.properties?.['name']).toBe('Rail site 01');
    expect(second.semantics?.properties?.['name']).toBe('Rail site 02');
    expect(childKeys(first)).toEqual(['rail-bridge-01']);
    expect(childKeys(second)).toEqual(['rail-bridge-02']);
  });
});

function childKeys(root: ResolvedElement): readonly string[] {
  return root.children.map(({ keyPath }) => keyPath.slice(keyPath.lastIndexOf('/') + 1));
}

function localOrigin(el: ResolvedElement | undefined): readonly [number, number, number] {
  const op = el?.localTransforms.find((item) => item.op === 'translate');
  return op?.op === 'translate' ? op.v : [0, 0, 0];
}

function localXAxis(el: ResolvedElement | undefined): readonly [number, number, number] {
  const axis = el?.props['axisX'];
  if (Array.isArray(axis) && axis.length === 3 && axis.every((value) => typeof value === 'number')) {
    return axis as [number, number, number];
  }
  const op = el?.localTransforms.find((item) => item.op === 'rotate');
  const degrees = op?.op === 'rotate' ? op.angleDeg : 0;
  const radians = (degrees * Math.PI) / 180;
  return [Math.cos(radians), Math.sin(radians), 0];
}

function applyOps(
  point: readonly [number, number, number],
  ops: ResolvedElement['localTransforms']
): readonly [number, number, number] {
  let [x, y, z] = point;
  for (const op of ops) {
    if (op.op === 'translate') {
      x += op.v[0];
      y += op.v[1];
      z += op.v[2];
      continue;
    }
    const radians = (op.angleDeg * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const nextX = x * cos - y * sin;
    const nextY = x * sin + y * cos;
    x = nextX;
    y = nextY;
  }
  return [x, y, z];
}

function worldOrigin(
  el: ResolvedElement | undefined,
  ancestors: readonly ResolvedElement[]
): readonly [number, number, number] {
  if (el === undefined) return [0, 0, 0];
  return applyOps([0, 0, 0], [
    ...el.localTransforms,
    ...ancestors.flatMap((ancestor) => ancestor.localTransforms),
  ]);
}
