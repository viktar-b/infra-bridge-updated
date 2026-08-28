/** @jsxImportSource brepjs-families */

import { beforeAll, describe, expect, it } from 'vitest';
import {
  csg,
  getBounds,
  getSolids,
  init,
  measureVolume,
  unwrap,
  type AnyShape,
  type Bounds3D,
  type Dimension,
} from 'brepjs';
import {
  disposeImportedModel,
  familiesToBim,
  fromIfc,
  placedSolids,
  toIfc,
  type BimCategory,
} from 'brepjs-bim';
import {
  civilSemantics,
  el,
  evaluateModel,
  family,
  resolve,
  tTranslate,
  type ResolvedElement,
} from 'brepjs-families';
import { AbutmentSupportBeam } from '../src/families/abutmentSupportBeam.tsx';
import { ApproachSlab } from '../src/families/approachSlab.tsx';
import { ArchSegment } from '../src/families/archSegment.tsx';
import { BridgeDeck } from '../src/families/bridgeDeck.tsx';
import { BridgeNameSign } from '../src/families/bridgeNameSign.tsx';
import { CrossGirder } from '../src/families/crossGirder.tsx';
import { EarthFill } from '../src/families/earthFill.tsx';
import { Footing } from '../src/families/footing.tsx';
import { MainGirder } from '../src/families/mainGirder.tsx';
import { PierStem } from '../src/families/pierStem.tsx';
import { RailPierStem } from '../src/families/railPierStem.tsx';
import { RoadRailing } from '../src/families/roadRailing.tsx';
import { SpandrelWall } from '../src/families/spandrelWall.tsx';

const expectedCategories = new Map<string, BimCategory>([
  ['AbutmentSupportBeam', 'BEAM'],
  ['ApproachSlab', 'SLAB'],
  ['ArchSegment', 'PROXY'],
  ['BridgeDeck', 'SLAB'],
  ['BridgeNameSign', 'PROXY'],
  ['CrossGirder', 'BEAM'],
  ['EarthFill', 'EARTHWORKS_FILL'],
  ['Footing', 'FOOTING'],
  ['MainGirder', 'BEAM'],
  ['PierStem', 'COLUMN'],
  ['RailPierStem', 'COLUMN'],
  ['RoadRailing', 'RAILING'],
  ['SpandrelWall', 'WALL'],
]);

const exactBodyFamilies = new Set([
  'ApproachSlab',
  'ArchSegment',
  'BridgeDeck',
  'BridgeNameSign',
  'CrossGirder',
  'EarthFill',
  'Footing',
  'MainGirder',
  'PierStem',
  'RailPierStem',
]);

const roundTripPlacementGaps = new Set([
  'ApproachSlab',
  'BridgeDeck',
  'Footing',
  'RoadRailing',
  'SpandrelWall',
]);
const roundTripUnreadableBodies = new Set(['ArchSegment', 'BridgeNameSign', 'EarthFill']);

const placement = [tTranslate([1_000, 2_000, 3_000])];

const ProjectionPart = family(
  'ProjectionPart',
  () =>
    el('Group', {}, [
      <AbutmentSupportBeam
        key="abutment-support-beam"
        transform={placement}
        length={600}
        section={{
          width: 120,
          toeInset: 20,
          toeHeight: 20,
          bearingSeatHeight: 180,
          backHeight: 160,
        }}
        transverseSide="negative"
        material="concrete"
      />,
      <ApproachSlab
        key="approach-slab"
        transform={placement}
        length={500}
        width={300}
        thickness={40}
        longitudinalSide="negative"
        transverseSide="positive"
        material="concrete"
      />,
      <ArchSegment
        key="arch-segment"
        transform={placement}
        outerRun={500}
        outerRise={400}
        innerRun={420}
        innerRise={320}
        bandThickness={80}
        halfWidth={150}
        material="masonry"
      />,
      <BridgeDeck
        key="bridge-deck"
        transform={placement}
        length={600}
        width={300}
        thickness={40}
        setoutInset={20}
        material="timber"
      />,
      <BridgeNameSign
        key="bridge-name-sign"
        transform={placement}
        text="Bridge 42"
        width={400}
        height={120}
        plateDepth={20}
        reliefDepth={10}
        material="copper"
      />,
      <CrossGirder
        key="cross-girder"
        transform={placement}
        length={500}
        width={100}
        depth={120}
        transverseSide="negative"
        material="timber"
      />,
      <EarthFill
        key="earth-fill"
        transform={placement}
        halfSpan={300}
        halfWidth={150}
        crownRise={200}
        material="soil"
      />,
      <Footing
        key="footing"
        transform={placement}
        length={500}
        width={300}
        thickness={100}
        material="concrete"
      />,
      <MainGirder
        key="main-girder"
        transform={placement}
        length={600}
        width={80}
        depth={120}
        material="timber"
      />,
      <PierStem
        key="pier-stem"
        transform={placement}
        length={300}
        width={120}
        height={500}
        capOffset={50}
        material="masonry"
      />,
      <RailPierStem
        key="rail-pier-stem"
        transform={placement}
        longitudinalWidth={200}
        transverseLength={400}
        height={500}
        material="masonry"
      />,
      <RoadRailing
        key="road-railing"
        transform={placement}
        length={1_000}
        setoutInset={20}
        longitudinalSide="negative"
        railWidth={30}
        railHeight={30}
        lowerRailBase={100}
        upperRailBase={250}
        postPitch={250}
        postThickness={30}
        postRunIn={100}
        postRunOut={100}
        postProfile={{
          toeWidth: 80,
          toeBase: -50,
          baseWidth: 50,
          base: -40,
          transitionBase: 40,
          shaftWidth: 30,
          top: 350,
          capWidth: 60,
        }}
        material="timber"
      />,
      <SpandrelWall
        key="spandrel-wall"
        transform={placement}
        length={1_200}
        thickness={100}
        height={500}
        bayCount={2}
        openingRun={250}
        openingRise={350}
        material="masonry"
      />,
    ]),
  {
    semantics: civilSemantics({
      kind: 'spatial-part',
      category: 'bridge-part',
      role: 'superstructure',
      composition: 'element',
      subdivision: 'longitudinal',
      properties: { name: 'Projection fixture part' },
    }),
  }
);

const ProjectionBridge = family(
  'ProjectionBridge',
  () => el('Group', {}, [<ProjectionPart key="part" />]),
  {
    semantics: civilSemantics({
      kind: 'facility',
      category: 'bridge',
      role: 'girder',
      composition: 'element',
      properties: { name: 'Projection fixture bridge' },
    }),
  }
);

const ProjectionSite = family(
  'ProjectionSite',
  () => el('Group', {}, [<ProjectionBridge key="bridge" />]),
  {
    semantics: civilSemantics({
      kind: 'site',
      category: 'site',
      role: 'transport-site',
      composition: 'element',
      properties: { name: 'Projection fixture site' },
    }),
  }
);

beforeAll(async () => {
  await init();
}, 120_000);

describe('leaf Family projection fidelity', () => {
  it('checks classification, Body, and placement independently through IFC round-trip', async () => {
    const root = resolve(<ProjectionSite key="site" />);
    const leaves = flatten(root).filter(({ type }) => expectedCategories.has(type));
    expect(leaves).toHaveLength(expectedCategories.size);

    using evaluator = new csg.Evaluator();
    const evaluated = evaluateModel(root, evaluator, {}, { shapes: true });
    const projected = unwrap(
      familiesToBim(root, {
        project: { name: 'family-projection-fixture', projectId: 'family-projection-fixture' },
        bodyEvaluator: evaluator,
        proxyEvaluator: evaluator,
      })
    );
    using bim = projected.model;

    const roundTripExpectations: Array<{
      readonly familyType: string;
      readonly category: BimCategory;
      readonly guid: string;
      readonly authoredBounds: readonly number[];
      readonly projectedBounds: readonly number[];
      readonly projectedVolume: number;
    }> = [];

    for (const leaf of leaves) {
      const expectedCategory = expectedCategories.get(leaf.type);
      expect(expectedCategory).toBeDefined();
      if (expectedCategory === undefined) continue;
      const localId = projected.idByKeyPath.get(leaf.keyPath);
      expect(localId).toBeDefined();
      if (localId === undefined) continue;
      const projectedElement = bim.getElement(localId);
      expect(projectedElement?.category).toBe(expectedCategory);
      if (projectedElement === null) continue;

      const authoredShape = evaluated.byKeyPath.get(leaf.keyPath)?.shape;
      expect(authoredShape?.ok).toBe(true);
      if (authoredShape === undefined || !authoredShape.ok) continue;
      const authoredBounds = boundsTuple(getBounds(authoredShape.value));
      const authoredVolume = totalVolume([authoredShape.value]);

      const projectedShapes = unwrap(placedSolids(projectedElement));
      try {
        const projectedBounds = combinedBounds(projectedShapes);
        const projectedVolume = totalVolume(projectedShapes);

        roundTripExpectations.push({
          familyType: leaf.type,
          category: expectedCategory,
          guid: projectedElement.guid,
          authoredBounds,
          projectedBounds,
          projectedVolume,
        });

        if (exactBodyFamilies.has(leaf.type)) {
          expectTupleClose(projectedBounds, authoredBounds, 3, leaf.type);
          expect(projectedVolume, leaf.type).toBeCloseTo(authoredVolume, 3);
        } else if (leaf.type === 'AbutmentSupportBeam') {
          expect(projectedVolume, leaf.type).toBeCloseTo(authoredVolume, 3);
          expect(projectedBounds[2]).not.toBeCloseTo(authoredBounds[2] ?? 0, 3);
        } else if (leaf.type === 'RoadRailing') {
          expect(projectedVolume).toBeGreaterThan(authoredVolume * 2);
          expect(projectedBounds[0]).not.toBeCloseTo(authoredBounds[0], 3);
        } else if (leaf.type === 'SpandrelWall') {
          expectTupleClose(projectedBounds, authoredBounds, 3, leaf.type);
          expect(projectedVolume).toBeGreaterThan(authoredVolume * 1.5);
        }
      } finally {
        for (const shape of projectedShapes) shape[Symbol.dispose]();
      }
    }

    expect(projected.proxied.map(({ type }) => type).sort()).toEqual([
      'ArchSegment',
      'BridgeNameSign',
    ]);

    const bytes = unwrap(
      await toIfc(bim, {
        applicationName: 'family-projection-fixture',
        applicationVersion: '0',
        ifcSchema: 'IFC4X3',
      })
    );
    const imported = unwrap(await fromIfc(bytes));
    try {
      expect(imported.diagnostics.issues.filter(({ severity }) => severity === 'error')).toEqual([]);
      for (const expected of roundTripExpectations) {
        const importedElement = imported.elements.find(({ guid }) => guid === expected.guid);
        expect(importedElement?.category).toBe(expected.category);
        const importedSolid = importedElement?.geometry.solid;

        if (roundTripUnreadableBodies.has(expected.familyType)) {
          expect(importedElement?.geometry.fidelity, expected.familyType).toBe('NONE');
          expect(importedSolid, expected.familyType).toBeNull();
          continue;
        }
        expect(importedSolid, expected.familyType).not.toBeNull();
        expect(importedSolid, expected.familyType).toBeDefined();
        if (importedSolid === null || importedSolid === undefined) continue;
        const importedBounds = boundsTuple(getBounds(importedSolid));
        const importedVolume = totalVolume([importedSolid]);
        expect(importedVolume, expected.familyType).toBeCloseTo(expected.projectedVolume, 1);

        if (expected.familyType === 'AbutmentSupportBeam') {
          expectTupleClose(
            importedBounds,
            expected.authoredBounds,
            2,
            `${expected.familyType} IFC round-trip`
          );
          continue;
        }

        if (roundTripPlacementGaps.has(expected.familyType)) {
          expect(
            maximumDifference(importedBounds, expected.projectedBounds),
            expected.familyType
          ).toBeGreaterThan(0.01);
          continue;
        }
        expectTupleClose(
          importedBounds,
          expected.projectedBounds,
          2,
          `${expected.familyType} IFC round-trip`
        );
      }
    } finally {
      disposeImportedModel(imported);
    }
  }, 60_000);
});

function flatten(root: ResolvedElement): readonly ResolvedElement[] {
  return [root, ...root.children.flatMap(flatten)];
}

function totalVolume(shapes: readonly AnyShape<Dimension>[]): number {
  return shapes.reduce(
    (sum, shape) =>
      sum + getSolids(shape).reduce((solidSum, solid) => solidSum + unwrap(measureVolume(solid)), 0),
    0
  );
}

function combinedBounds(shapes: readonly AnyShape<Dimension>[]): readonly number[] {
  const first = shapes[0];
  if (first === undefined) throw new Error('Expected at least one projected solid');
  const initial = boundsTuple(getBounds(first));
  return shapes.slice(1).reduce<readonly number[]>((combined, shape) => {
    const next = boundsTuple(getBounds(shape));
    return [
      Math.min(combined[0] ?? Infinity, next[0] ?? Infinity),
      Math.max(combined[1] ?? -Infinity, next[1] ?? -Infinity),
      Math.min(combined[2] ?? Infinity, next[2] ?? Infinity),
      Math.max(combined[3] ?? -Infinity, next[3] ?? -Infinity),
      Math.min(combined[4] ?? Infinity, next[4] ?? Infinity),
      Math.max(combined[5] ?? -Infinity, next[5] ?? -Infinity),
    ];
  }, initial);
}

function boundsTuple(bounds: Bounds3D): readonly number[] {
  return [bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax, bounds.zMin, bounds.zMax];
}

function expectTupleClose(
  actual: readonly number[],
  expected: readonly number[],
  precision: number,
  label: string
): void {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((value, index) =>
    expect(actual[index], `${label} bound ${index}`).toBeCloseTo(value, precision)
  );
}

function maximumDifference(actual: readonly number[], expected: readonly number[]): number {
  return Math.max(...actual.map((value, index) => Math.abs(value - (expected[index] ?? value))));
}
