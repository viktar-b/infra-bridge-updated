/** @jsxImportSource brepjs-families */

import { civilSemantics, el, family } from 'brepjs-families';
import { z } from 'zod';
import { CrossGirder } from '../families/crossGirder.tsx';
import { Footing } from '../families/footing.tsx';
import { PierStem } from '../families/pierStem.tsx';
import { placement, transformProp } from '../placement.ts';

const roadPierProps = z.object({
  concreteMaterial: z.string().trim().min(1),
  stemMaterial: z.string().trim().min(1),
  girderMaterial: z.string().trim().min(1),
  crossGirderSide: z.enum(['positive', 'negative']).default('positive'),
  footingLength: z.number().positive(),
  footingWidth: z.number().positive(),
  footingThickness: z.number().positive(),
  stemLength: z.number().positive(),
  stemWidth: z.number().positive(),
  stemHeight: z.number().positive(),
  capOffset: z.number().nonnegative(),
  crossGirderLength: z.number().positive(),
  crossGirderWidth: z.number().positive(),
  crossGirderDepth: z.number().positive(),
  crossGirderSetout: z.number(),
  crossGirderInset: z.number().nonnegative(),
  name: z.string().trim().min(1).default('Road pier'),
  transform: transformProp,
});

export type RoadPierProps = z.output<typeof roadPierProps>;
export type RoadPierInput = z.input<typeof roadPierProps>;

function semantics(props: RoadPierProps) {
  return civilSemantics({
    kind: 'spatial-part',
    category: 'bridge-part',
    role: 'pier',
    composition: 'element',
    subdivision: 'vertical',
    properties: { name: props.name },
  });
}

/** Reusable road-pier composition around the pier-cap control point. */
export const RoadPier = family<RoadPierProps, RoadPierInput>(
  'RoadPier',
  ({
    concreteMaterial,
    stemMaterial,
    girderMaterial,
    crossGirderSide,
    footingLength,
    footingWidth,
    footingThickness,
    stemLength,
    stemWidth,
    stemHeight,
    capOffset,
    crossGirderLength,
    crossGirderWidth,
    crossGirderDepth,
    crossGirderSetout,
    crossGirderInset,
    transform,
  }) =>
    el('Group', { transform: transform ?? [] }, [
      <CrossGirder
        key="cross-girder"
        transform={placement([
          crossGirderSetout,
          crossGirderSide === 'positive' ? -crossGirderInset : crossGirderInset,
          -capOffset,
        ])}
        length={crossGirderLength}
        width={crossGirderWidth}
        depth={crossGirderDepth}
        transverseSide={crossGirderSide}
        material={girderMaterial}
      />,
      <PierStem
        key="pier-stem"
        length={stemLength}
        width={stemWidth}
        height={stemHeight}
        capOffset={capOffset}
        material={stemMaterial}
      />,
      <Footing
        key="footing"
        transform={placement([0, 0, -(capOffset + stemHeight)])}
        length={footingLength}
        width={footingWidth}
        thickness={footingThickness}
        material={concreteMaterial}
      />,
    ]),
  { props: roadPierProps, semantics }
);
