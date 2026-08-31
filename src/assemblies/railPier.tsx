/** @jsxImportSource brepjs-families */

import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { Footing } from '../families/footing.tsx';
import { RailPierStem } from '../families/railPierStem.tsx';
import { MATERIALS } from '../materials.ts';
import { placement, spatialGroup, transformProp } from '../placement.ts';

const railPierProps = z.object({
  stemLongitudinalWidth: z.number().positive(),
  stemTransverseLength: z.number().positive(),
  stemHeight: z.number().positive(),
  footingLength: z.number().positive(),
  footingWidth: z.number().positive(),
  footingThickness: z.number().positive(),
  footingBearingDegrees: z.number(),
  name: z.string().trim().min(1).default('Rail bridge pier'),
  transform: transformProp,
});

export type RailPierProps = z.output<typeof railPierProps>;
export type RailPierInput = z.input<typeof railPierProps>;

function semantics(props: RailPierProps) {
  return civilSemantics({
    kind: 'spatial-part',
    category: 'bridge-part',
    role: 'pier',
    composition: 'partial',
    subdivision: 'vertical',
    properties: { name: props.name },
  });
}

/** Reusable masonry rail pier with a centred transverse footing. */
export const RailPier = family<RailPierProps, RailPierInput>(
  'RailPier',
  ({
    stemLongitudinalWidth,
    stemTransverseLength,
    stemHeight,
    footingLength,
    footingWidth,
    footingThickness,
    footingBearingDegrees,
    transform,
  }) =>
    spatialGroup(transform, [
      <RailPierStem
        key="pier-stem"
        longitudinalWidth={stemLongitudinalWidth}
        transverseLength={stemTransverseLength}
        height={stemHeight}
        material={MATERIALS.graniteMasonry}
      />,
      <Footing
        key="footing"
        transform={placement([0, stemTransverseLength / 2, 0], footingBearingDegrees)}
        length={footingLength}
        width={footingWidth}
        thickness={footingThickness}
        material={MATERIALS.reinforcedConcrete}
        name="Foundation - rail bridge"
      />,
    ]),
  { props: railPierProps, semantics }
);
