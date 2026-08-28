import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  abutmentSupportBeamProps,
  type AbutmentSupportBeamInput,
  type AbutmentSupportBeamProps,
} from '../src/families/abutmentSupportBeam.tsx';
import {
  approachSlabProps,
  type ApproachSlabInput,
  type ApproachSlabProps,
} from '../src/families/approachSlab.tsx';
import {
  archSegmentProps,
  type ArchSegmentInput,
  type ArchSegmentProps,
} from '../src/families/archSegment.tsx';
import {
  bridgeDeckProps,
  type BridgeDeckInput,
  type BridgeDeckProps,
} from '../src/families/bridgeDeck.tsx';
import {
  bridgeNameSignProps,
  type BridgeNameSignInput,
  type BridgeNameSignProps,
} from '../src/families/bridgeNameSign.tsx';
import {
  crossGirderProps,
  type CrossGirderInput,
  type CrossGirderProps,
} from '../src/families/crossGirder.tsx';
import {
  earthFillProps,
  type EarthFillInput,
  type EarthFillProps,
} from '../src/families/earthFill.tsx';
import {
  footingProps,
  type FootingInput,
  type FootingProps,
} from '../src/families/footing.tsx';
import {
  mainGirderProps,
  type MainGirderInput,
  type MainGirderProps,
} from '../src/families/mainGirder.tsx';
import {
  pierStemProps,
  type PierStemInput,
  type PierStemProps,
} from '../src/families/pierStem.tsx';
import {
  railPierStemProps,
  type RailPierStemInput,
  type RailPierStemProps,
} from '../src/families/railPierStem.tsx';
import {
  roadRailingPostProfileSchema,
  roadRailingProps,
  type RoadRailingInput,
  type RoadRailingPostProfile,
  type RoadRailingPostProfileInput,
  type RoadRailingProps,
} from '../src/families/roadRailing.tsx';
import {
  spandrelWallProps,
  type SpandrelWallInput,
  type SpandrelWallProps,
} from '../src/families/spandrelWall.tsx';

const supportSection = {
  width: 50,
  toeInset: 5,
  toeHeight: 5,
  bearingSeatHeight: 25,
  backHeight: 30,
} as const;

const postProfile = {
  toeWidth: 30,
  toeBase: -10,
  baseWidth: 20,
  base: 0,
  transitionBase: 10,
  shaftWidth: 10,
  top: 100,
  capWidth: 15,
} as const;

describe('drop-in leaf Family contracts', () => {
  it('exports explicit schema-derived invocation and resolved types', () => {
    expectTypeOf<AbutmentSupportBeamInput>().toEqualTypeOf<
      z.input<typeof abutmentSupportBeamProps>
    >();
    expectTypeOf<AbutmentSupportBeamProps>().toEqualTypeOf<
      z.output<typeof abutmentSupportBeamProps>
    >();
    expectTypeOf<ApproachSlabInput>().toEqualTypeOf<z.input<typeof approachSlabProps>>();
    expectTypeOf<ApproachSlabProps>().toEqualTypeOf<z.output<typeof approachSlabProps>>();
    expectTypeOf<ArchSegmentInput>().toEqualTypeOf<z.input<typeof archSegmentProps>>();
    expectTypeOf<ArchSegmentProps>().toEqualTypeOf<z.output<typeof archSegmentProps>>();
    expectTypeOf<BridgeDeckInput>().toEqualTypeOf<z.input<typeof bridgeDeckProps>>();
    expectTypeOf<BridgeDeckProps>().toEqualTypeOf<z.output<typeof bridgeDeckProps>>();
    expectTypeOf<BridgeNameSignInput>().toEqualTypeOf<z.input<typeof bridgeNameSignProps>>();
    expectTypeOf<BridgeNameSignProps>().toEqualTypeOf<z.output<typeof bridgeNameSignProps>>();
    expectTypeOf<CrossGirderInput>().toEqualTypeOf<z.input<typeof crossGirderProps>>();
    expectTypeOf<CrossGirderProps>().toEqualTypeOf<z.output<typeof crossGirderProps>>();
    expectTypeOf<EarthFillInput>().toEqualTypeOf<z.input<typeof earthFillProps>>();
    expectTypeOf<EarthFillProps>().toEqualTypeOf<z.output<typeof earthFillProps>>();
    expectTypeOf<FootingInput>().toEqualTypeOf<z.input<typeof footingProps>>();
    expectTypeOf<FootingProps>().toEqualTypeOf<z.output<typeof footingProps>>();
    expectTypeOf<MainGirderInput>().toEqualTypeOf<z.input<typeof mainGirderProps>>();
    expectTypeOf<MainGirderProps>().toEqualTypeOf<z.output<typeof mainGirderProps>>();
    expectTypeOf<PierStemInput>().toEqualTypeOf<z.input<typeof pierStemProps>>();
    expectTypeOf<PierStemProps>().toEqualTypeOf<z.output<typeof pierStemProps>>();
    expectTypeOf<RailPierStemInput>().toEqualTypeOf<z.input<typeof railPierStemProps>>();
    expectTypeOf<RailPierStemProps>().toEqualTypeOf<z.output<typeof railPierStemProps>>();
    expectTypeOf<RoadRailingInput>().toEqualTypeOf<z.input<typeof roadRailingProps>>();
    expectTypeOf<RoadRailingProps>().toEqualTypeOf<z.output<typeof roadRailingProps>>();
    expectTypeOf<RoadRailingPostProfileInput>().toEqualTypeOf<
      z.input<typeof roadRailingPostProfileSchema>
    >();
    expectTypeOf<RoadRailingPostProfile>().toEqualTypeOf<
      z.output<typeof roadRailingPostProfileSchema>
    >();
    expectTypeOf<SpandrelWallInput>().toEqualTypeOf<z.input<typeof spandrelWallProps>>();
    expectTypeOf<SpandrelWallProps>().toEqualTypeOf<z.output<typeof spandrelWallProps>>();
  });

  it('keeps every existing default and invocation transform visible on exported schemas', () => {
    expect(
      abutmentSupportBeamProps.parse({
        length: 100,
        section: supportSection,
        transverseSide: 'positive',
        material: 'concrete',
      })
    ).toMatchObject({ name: 'Abutment support beam' });
    expect(
      approachSlabProps.parse({
        length: 100,
        width: 50,
        thickness: 10,
        longitudinalSide: 'positive',
        material: 'concrete',
      })
    ).toMatchObject({ name: 'Approach slab', transverseSide: 'negative' });
    expect(
      archSegmentProps.parse({
        outerRun: 100,
        outerRise: 80,
        innerRun: 70,
        innerRise: 50,
        bandThickness: 10,
        halfWidth: 20,
        material: 'masonry',
      })
    ).toMatchObject({
      name: 'Rail bridge arch segment',
      horizontalControlFactor: 0.548,
      verticalControlFactor: 0.566,
      curveSegments: 6,
    });
    expect(
      bridgeDeckProps.parse({
        length: 100,
        width: 50,
        thickness: 10,
        setoutInset: 2,
        material: 'timber',
      })
    ).toMatchObject({ name: 'Bridge deck' });
    expect(
      bridgeNameSignProps.parse({
        text: ' bridge 42 ',
        width: 100,
        height: 50,
        plateDepth: 5,
        reliefDepth: 2,
        material: 'copper',
      })
    ).toMatchObject({ name: 'Bridge name sign', text: 'BRIDGE 42' });
    expect(
      crossGirderProps.parse({ length: 100, width: 20, depth: 30, material: 'timber' })
    ).toMatchObject({ name: 'Cross girder', transverseSide: 'positive' });
    expect(
      earthFillProps.parse({ halfSpan: 100, halfWidth: 50, crownRise: 40, material: 'soil' })
    ).toMatchObject({
      name: 'Rail bridge fill',
      horizontalControlFactor: 0.548,
      verticalControlFactor: 0.566,
      curveSegments: 6,
    });
    expect(
      footingProps.parse({ length: 100, width: 50, thickness: 10, material: 'concrete' })
    ).toMatchObject({ name: 'Pier footing' });
    expect(
      mainGirderProps.parse({ length: 100, width: 20, depth: 30, material: 'timber' })
    ).toMatchObject({ name: 'Main girder' });
    expect(
      pierStemProps.parse({
        length: 100,
        width: 50,
        height: 80,
        capOffset: 10,
        material: 'masonry',
      })
    ).toMatchObject({ name: 'Pier stem' });
    expect(
      railPierStemProps.parse({
        longitudinalWidth: 100,
        transverseLength: 200,
        height: 300,
        material: 'masonry',
      })
    ).toMatchObject({ name: 'Rail bridge pier stem' });
    expect(
      roadRailingProps.parse({
        length: 1_000,
        setoutInset: 0,
        longitudinalSide: 'positive',
        railWidth: 10,
        railHeight: 10,
        lowerRailBase: 20,
        upperRailBase: 60,
        postPitch: 200,
        postThickness: 10,
        postRunIn: 100,
        postRunOut: 100,
        postProfile,
        material: 'timber',
      })
    ).toMatchObject({ name: 'Road bridge railing' });
    expect(
      spandrelWallProps.parse({
        length: 1_000,
        thickness: 100,
        height: 500,
        bayCount: 2,
        openingRun: 200,
        openingRise: 300,
        material: 'masonry',
      })
    ).toMatchObject({ name: 'Rail bridge spandrel wall', curveSegments: 6 });
  });
});
