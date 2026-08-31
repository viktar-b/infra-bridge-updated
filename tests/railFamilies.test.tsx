/** @jsxImportSource brepjs-families */

import { beforeAll, describe, expect, it } from 'vitest';
import { csg, getBounds, init, isShape3D, measureVolume, unwrap } from 'brepjs';
import { evaluateModel, resolve, type ResolvedElement } from 'brepjs-families';
import { ArchSegment } from '../src/families/archSegment.tsx';
import { BridgeNameSign } from '../src/families/bridgeNameSign.tsx';
import { EarthFill } from '../src/families/earthFill.tsx';
import { RailPierStem } from '../src/families/railPierStem.tsx';
import { SpandrelWall } from '../src/families/spandrelWall.tsx';
import { MATERIALS } from '../src/materials.ts';

beforeAll(async () => {
  await init();
}, 120_000);

describe('rail-arch bridge Families', () => {
  it('authors the cubic-crown EarthFill in physical millimetres', () => {
    const resolved = resolve(
      <EarthFill
        key="fill"
        halfSpan={5_000}
        halfWidth={1_750}
        crownRise={4_084.236}
        material={MATERIALS.genericSoil}
      />
    );
    expect(resolved.semantics).toMatchObject({
      kind: 'product',
      category: 'earthworks-fill',
      role: 'backfill',
      material: MATERIALS.genericSoil,
      dimensionsMm: { length: 10_000, width: 3_500, height: 4_084.236 },
      properties: { profile: 'cubic-crown' },
    });
    expectBounds(resolved, [-5_000, 5_000, -1_750, 1_750, 0, 4_084.236]);
    expect(evaluatedVolume(resolved)).toBeLessThan(10_000 * 3_500 * 4_084.236);
  });

  it('uses curveSegments as the EarthFill crown sampling control', () => {
    const resolved = resolve(
      <EarthFill
        key="fill"
        halfSpan={5_000}
        halfWidth={1_750}
        crownRise={4_084.236}
        curveSegments={8}
        material={MATERIALS.genericSoil}
      />
    );
    expect(resolved.geometry.kind).toBe('Extrude');
    if (resolved.geometry.kind !== 'Extrude') return;
    expect(resolved.geometry.profile.kind).toBe('Polygon');
    if (resolved.geometry.profile.kind !== 'Polygon') return;
    expect(resolved.geometry.profile.points).toHaveLength(17);
  });

  it('authors one reusable curved ArchSegment with named outer and inner controls', () => {
    const resolved = resolve(
      <ArchSegment
        key="arch"
        outerRun={5_000}
        outerRise={4_084.236}
        innerRun={4_250}
        innerRise={3_333.333}
        bandThickness={750}
        halfWidth={1_750}
        material={MATERIALS.graniteMasonry}
      />
    );
    expect(resolved.semantics).toMatchObject({
      kind: 'product',
      category: 'member',
      role: 'arch-segment',
      material: MATERIALS.graniteMasonry,
      dimensionsMm: { length: 5_000, width: 3_500, height: 4_084.236 },
    });
    expectBounds(resolved, [-750, 4_250, -1_750, 1_750, 0, 4_084.236]);
    expect(evaluatedVolume(resolved)).toBeLessThan(5_000 * 3_500 * 4_084.236);
  });

  it('uses curveSegments for both ArchSegment boundary curves', () => {
    const resolved = resolve(
      <ArchSegment
        key="arch"
        outerRun={5_000}
        outerRise={4_084.236}
        innerRun={4_250}
        innerRise={3_333.333}
        bandThickness={750}
        halfWidth={1_750}
        curveSegments={8}
        material={MATERIALS.graniteMasonry}
      />
    );
    expect(resolved.geometry.kind).toBe('Extrude');
    if (resolved.geometry.kind !== 'Extrude') return;
    expect(resolved.geometry.profile.kind).toBe('Polygon');
    if (resolved.geometry.profile.kind !== 'Polygon') return;
    expect(resolved.geometry.profile.points).toHaveLength(18);
  });

  it('authors the regular two-bay SpandrelWall as a closed cut solid', () => {
    const resolved = resolve(
      <SpandrelWall
        key="wall"
        length={20_000}
        thickness={450}
        height={4_484.236}
        bayCount={2}
        openingRun={4_250}
        openingRise={3_333.333}
        material={MATERIALS.graniteMasonry}
      />
    );
    expect(resolved.semantics).toMatchObject({
      kind: 'product',
      category: 'wall',
      material: MATERIALS.graniteMasonry,
      dimensionsMm: { length: 20_000, width: 450, height: 4_484.236 },
    });
    expect(resolved.geometry.kind).toBe('CutAll');
    if (resolved.geometry.kind === 'CutAll') expect(resolved.geometry.tools).toHaveLength(4);
    expectBounds(resolved, [0, 20_000, 0, 450, 0, 4_484.236]);
    expect(evaluatedVolume(resolved)).toBeLessThan(20_000 * 450 * 4_484.236);
  });

  it('cuts two arch tools for every SpandrelWall bay', () => {
    const resolved = resolve(
      <SpandrelWall
        key="wall"
        length={24_000}
        thickness={450}
        height={4_484.236}
        bayCount={3}
        openingRun={3_000}
        openingRise={3_000}
        curveSegments={8}
        material={MATERIALS.graniteMasonry}
      />
    );
    expect(resolved.geometry.kind).toBe('CutAll');
    if (resolved.geometry.kind !== 'CutAll') return;
    expect(resolved.geometry.tools).toHaveLength(6);
    for (const tool of resolved.geometry.tools) {
      expect(tool.kind).toBe('Extrude');
      if (tool.kind !== 'Extrude') continue;
      expect(tool.profile.kind).toBe('Polygon');
      if (tool.profile.kind === 'Polygon') expect(tool.profile.points).toHaveLength(10);
    }
    expect(evaluatedVolume(resolved)).toBeLessThan(24_000 * 450 * 4_484.236);
  });

  it('authors the masonry RailPierStem from its lower Datum', () => {
    const resolved = resolve(
      <RailPierStem
        key="stem"
        longitudinalWidth={1_500}
        transverseLength={4_400}
        height={3_780.346}
        material={MATERIALS.graniteMasonry}
      />
    );
    expect(resolved.semantics).toMatchObject({
      kind: 'product',
      category: 'column',
      role: 'pier-stem',
      material: MATERIALS.graniteMasonry,
      dimensionsMm: { length: 1_500, width: 4_400, height: 3_780.346 },
    });
    expectBounds(resolved, [-750, 750, 0, 4_400, 0, 3_780.346]);
  });

  it('authors a plain BridgeNameSign plate with normalized text metadata', () => {
    const resolved = resolve(
      <BridgeNameSign
        key="sign"
        text="BREPJS"
        width={1_600}
        height={400}
        plateDepth={30}
        reliefDepth={20}
        material={MATERIALS.copper}
      />
    );
    expect(resolved.semantics).toMatchObject({
      kind: 'product',
      category: 'sign',
      material: MATERIALS.copper,
      dimensionsMm: { length: 1_600, width: 50, height: 400 },
      properties: {
        text: 'BREPJS',
        textRepresentation: 'metadata-only',
      },
    });
    expect(resolved.geometry.kind).toBe('Translate');
    expectBounds(resolved, [-800, 800, -50, 0, 0, 400]);
    expect(evaluatedVolume(resolved)).toBeCloseTo(1_600 * 50 * 400, 3);
  });

  it('accepts arbitrary non-empty sign text without a font asset', () => {
    const resolved = resolve(
      <BridgeNameSign
        key="sign"
        text=" Bridge 42 "
        width={1_000}
        height={200}
        plateDepth={20}
        reliefDepth={10}
        material={MATERIALS.copper}
      />
    );
    expect(resolved.props['text']).toBe('BRIDGE 42');
    expect(resolved.semantics?.properties?.['text']).toBe('BRIDGE 42');
  });
});

function expectBounds(resolved: ResolvedElement, expected: readonly number[]): void {
  using evaluator = new csg.Evaluator();
  const evaluated = evaluateModel(resolved, evaluator, {}, { shapes: true });
  const shape = evaluated.byKeyPath.get(resolved.keyPath)?.shape;
  expect(shape?.ok).toBe(true);
  if (shape === undefined || !shape.ok) return;
  const bounds = getBounds(shape.value);
  const actual = [bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax, bounds.zMin, bounds.zMax];
  expected.forEach((value, index) => {
    expect(actual[index]).toBeCloseTo(value, 3);
  });
}

function evaluatedVolume(resolved: ResolvedElement): number {
  using evaluator = new csg.Evaluator();
  const evaluated = evaluateModel(resolved, evaluator, {}, { shapes: true });
  const shape = evaluated.byKeyPath.get(resolved.keyPath)?.shape;
  expect(shape?.ok).toBe(true);
  if (shape === undefined || !shape.ok || !isShape3D(shape.value)) return 0;
  return unwrap(measureVolume(shape.value));
}
