/** @jsxImportSource brepjs-families */

import { beforeAll, describe, expect, it } from 'vitest';
import { csg, getBounds, init } from 'brepjs';
import { evaluateModel, resolve, type ResolvedElement } from 'brepjs-families';
import { AbutmentSupportBeam } from '../src/families/abutmentSupportBeam.tsx';
import { ApproachSlab } from '../src/families/approachSlab.tsx';
import { RoadRailing } from '../src/families/roadRailing.tsx';
import { MATERIALS } from '../src/materials.ts';
import { ROAD_BRIDGE_SET_OUT } from '../src/setout.ts';

beforeAll(async () => {
  await init();
}, 120_000);

describe('completed road-bridge Families', () => {
  it('authors ApproachSlab around its upper-inner Datum with the default transverse side', () => {
    const resolved = resolve(
      <ApproachSlab
        key="slab"
        length={2_435.296}
        width={3_600}
        thickness={200}
        longitudinalSide="negative"
        material={MATERIALS.prefabricatedConcrete}
      />
    );
    expect(resolved.semantics).toMatchObject({
      kind: 'product',
      category: 'slab',
      role: 'deck',
      material: MATERIALS.prefabricatedConcrete,
      dimensionsMm: { length: 2_435.296, width: 3_600, height: 200 },
      properties: { datum: 'upper-inner-corner' },
    });
    expectBounds(resolved, [-2_435.296, 0, -3_600, 0, -200, 0]);
  });

  it.each([
    {
      label: 'longitudinally',
      longitudinalSide: 'positive',
      transverseSide: 'negative',
      expectedBounds: [0, 100, -50, 0, -10, 0],
    },
    {
      label: 'transversely',
      longitudinalSide: 'negative',
      transverseSide: 'positive',
      expectedBounds: [-100, 0, 0, 50, -10, 0],
    },
  ] as const)(
    'mirrors ApproachSlab $label without moving its Datum',
    ({ longitudinalSide, transverseSide, expectedBounds }) => {
      const resolved = resolve(
        <ApproachSlab
          key="slab"
          length={100}
          width={50}
          thickness={10}
          longitudinalSide={longitudinalSide}
          transverseSide={transverseSide}
          material={MATERIALS.prefabricatedConcrete}
        />
      );
      expectBounds(resolved, expectedBounds);
    }
  );

  it('authors the five-point AbutmentSupportBeam section in engineering axes', () => {
    const resolved = resolve(
      <AbutmentSupportBeam
        key="beam"
        length={3_600}
        section={{
          width: 195,
          toeInset: 20,
          toeHeight: 20,
          bearingSeatHeight: 556.993,
          backHeight: 539.493,
        }}
        transverseSide="negative"
        material={MATERIALS.reinforcedConcrete}
      />
    );
    expect(resolved.semantics).toMatchObject({
      kind: 'product',
      category: 'beam',
      material: MATERIALS.reinforcedConcrete,
      dimensionsMm: { length: 3_600, width: 195, height: 556.993 },
    });
    expectBounds(resolved, [0, 3_600, -195, 0, 0, 556.993]);
  });

  it('mirrors the AbutmentSupportBeam section without moving its Datum', () => {
    const resolved = resolve(
      <AbutmentSupportBeam
        key="beam"
        length={3_600}
        section={{
          width: 195,
          toeInset: 20,
          toeHeight: 20,
          bearingSeatHeight: 556.993,
          backHeight: 539.493,
        }}
        transverseSide="positive"
        material={MATERIALS.reinforcedConcrete}
      />
    );
    expectBounds(resolved, [0, 3_600, 0, 195, 0, 556.993]);
  });

  it('derives the profile and envelope from independent toe controls', () => {
    const resolved = resolve(
      <AbutmentSupportBeam
        key="beam"
        length={100}
        section={{
          width: 50,
          toeInset: 8,
          toeHeight: 3,
          bearingSeatHeight: 40,
          backHeight: 60,
        }}
        transverseSide="positive"
        material={MATERIALS.reinforcedConcrete}
      />
    );

    expect(resolved.props['profile']).toEqual({
      kind: 'ARBITRARY_CLOSED',
      points: [
        [0, 0],
        [50, 0],
        [42, 3],
        [42, 40],
        [0, 60],
      ],
    });
    expect(resolved.semantics).toMatchObject({
      dimensionsMm: { length: 100, width: 50, height: 60 },
    });
    expectBounds(resolved, [0, 100, 0, 50, 0, 60]);
  });

  it.each([
    {
      label: 'a toe inset equal to the section width',
      section: {
        width: 20,
        toeInset: 20,
        toeHeight: 5,
        bearingSeatHeight: 40,
        backHeight: 30,
      },
      message: 'toeInset must be less than width',
    },
    {
      label: 'a toe height equal to the bearing-seat height',
      section: {
        width: 20,
        toeInset: 5,
        toeHeight: 40,
        bearingSeatHeight: 40,
        backHeight: 30,
      },
      message: 'toeHeight must be less than bearingSeatHeight',
    },
  ])('rejects $label before kernel evaluation', ({ section, message }) => {
    expect(() =>
      resolve(
        <AbutmentSupportBeam
          key="invalid"
          length={100}
          section={section}
          transverseSide="positive"
          material={MATERIALS.reinforcedConcrete}
        />
      )
    ).toThrow(message);
  });

  it('authors a reusable repeated-post RoadRailing with a deck-edge Datum', () => {
    const resolved = resolve(
      <RoadRailing
        key="railing"
        length={9_909}
        setoutInset={9}
        longitudinalSide="negative"
        railWidth={96}
        railHeight={196}
        lowerRailBase={-56}
        upperRailBase={404}
        postPitch={900}
        postThickness={96}
        postRunIn={847.5}
        postRunOut={114}
        postProfile={ROAD_BRIDGE_SET_OUT.deck.railing.postProfile}
        material={MATERIALS.bridgeTimber}
      />
    );
    expect(resolved.semantics).toMatchObject({
      kind: 'product',
      category: 'railing',
      role: 'guardrail',
      material: MATERIALS.bridgeTimber,
      dimensionsMm: { length: 9_909, width: 290.055, height: 956 },
    });
    expectBounds(resolved, [-9_900, 9, 0, 290.055, -336, 620]);
  });

  it('derives RoadRailing semantics from a non-default rail envelope', () => {
    const resolved = resolve(
      <RoadRailing
        key="variant"
        length={3_000}
        setoutInset={0}
        longitudinalSide="positive"
        railWidth={500}
        railHeight={100}
        lowerRailBase={-400}
        upperRailBase={700}
        postPitch={1_000}
        postThickness={96}
        postRunIn={500}
        postRunOut={500}
        postProfile={ROAD_BRIDGE_SET_OUT.deck.railing.postProfile}
        material={MATERIALS.bridgeTimber}
      />
    );
    expect(
      resolved.semantics !== undefined && 'dimensionsMm' in resolved.semantics
        ? resolved.semantics.dimensionsMm
        : undefined
    ).toMatchObject({
      length: 3_000,
      width: 500,
      height: 1_200,
    });
    expectBounds(resolved, [0, 3_000, 0, 500, -400, 800]);
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
