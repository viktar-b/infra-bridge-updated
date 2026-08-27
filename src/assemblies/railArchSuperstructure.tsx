/** @jsxImportSource brepjs-families */

import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { ArchSegment } from '../families/archSegment.tsx';
import { placement, spatialGroup, transformProp } from '../placement.ts';
import { BridgeNameSign } from '../families/bridgeNameSign.tsx';
import { EarthFill } from '../families/earthFill.tsx';
import { SpandrelWall } from '../families/spandrelWall.tsx';
import { MATERIALS } from '../materials.ts';
import { railArchSuperstructureSetOut } from '../setout.ts';

const railArchSuperstructureProps = z.object({
  halfSpan: z.number().positive(),
  halfWidth: z.number().positive(),
  outerRise: z.number().positive(),
  innerRun: z.number().positive(),
  innerRise: z.number().positive(),
  archBandThickness: z.number().positive(),
  baseElevation: z.number(),
  wallOffset: z.number().positive(),
  wallThickness: z.number().positive(),
  wallHeight: z.number().positive(),
  wallBayCount: z.number().int().positive(),
  signElevation: z.number(),
  signWidth: z.number().positive(),
  signHeight: z.number().positive(),
  signPlateDepth: z.number().positive(),
  signReliefDepth: z.number().positive(),
  name: z.string().trim().min(1).default('Rail arch superstructure'),
  transform: transformProp,
});

export type RailArchSuperstructureProps = z.output<typeof railArchSuperstructureProps>;
export type RailArchSuperstructureInput = z.input<typeof railArchSuperstructureProps>;

function semantics(props: RailArchSuperstructureProps) {
  return civilSemantics({
    kind: 'spatial-part',
    category: 'bridge-part',
    role: 'superstructure',
    composition: 'element',
    subdivision: 'longitudinal',
    properties: { name: props.name },
  });
}

/** Symmetric two-span masonry arch superstructure with explicit major Occurrences. */
export const RailArchSuperstructure = family<
  RailArchSuperstructureProps,
  RailArchSuperstructureInput
>(
  'RailArchSuperstructure',
  ({
    halfSpan,
    halfWidth,
    outerRise,
    innerRun,
    innerRise,
    archBandThickness,
    baseElevation,
    wallOffset,
    wallThickness,
    wallHeight,
    wallBayCount,
    signElevation,
    signWidth,
    signHeight,
    signPlateDepth,
    signReliefDepth,
    transform,
  }) => {
    const archProps = {
      outerRun: halfSpan,
      outerRise,
      innerRun,
      innerRise,
      bandThickness: archBandThickness,
      halfWidth,
      material: MATERIALS.graniteMasonry,
    } as const;
    const fillProps = {
      halfSpan,
      halfWidth,
      crownRise: outerRise,
      material: MATERIALS.genericSoil,
    } as const;
    const signProps = {
      text: 'BREPJS',
      width: signWidth,
      height: signHeight,
      plateDepth: signPlateDepth,
      reliefDepth: signReliefDepth,
      material: MATERIALS.copper,
      name: 'Road rail bridge - name sign',
    } as const;
    const wallProps = {
      length: halfSpan * 4,
      thickness: wallThickness,
      height: wallHeight,
      bayCount: wallBayCount,
      openingRun: innerRun,
      openingRise: innerRise,
      material: MATERIALS.graniteMasonry,
    } as const;
    const { fillOccurrences, archOccurrences, signOccurrences, wallOccurrences } =
      railArchSuperstructureSetOut({
        halfSpan,
        innerRun,
        archBandThickness,
        baseElevation,
        wallOffset,
        signElevation,
      });

    return spatialGroup(transform, [
      ...fillOccurrences.map(({ key, origin }) => (
        <EarthFill key={key} transform={placement(origin)} {...fillProps} />
      )),
      ...archOccurrences.map(({ key, origin, bearingDegrees }) => (
        <ArchSegment key={key} transform={placement(origin, bearingDegrees)} {...archProps} />
      )),
      ...signOccurrences.map(({ key, origin, bearingDegrees }) => (
        <BridgeNameSign key={key} transform={placement(origin, bearingDegrees)} {...signProps} />
      )),
      ...wallOccurrences.map(({ key, origin, bearingDegrees }) => (
        <SpandrelWall key={key} transform={placement(origin, bearingDegrees)} {...wallProps} />
      )),
    ]);
  },
  { props: railArchSuperstructureProps, semantics }
);
