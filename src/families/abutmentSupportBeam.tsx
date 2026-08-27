/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from '../placement.ts';

const abutmentSupportBeamProps = z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    bearingInset: z.number().positive(),
    bearingSeatHeight: z.number().positive(),
    backHeight: z.number().positive(),
    transverseSide: z.enum(['positive', 'negative']),
    material: z.string().trim().min(1),
    name: z.string().trim().min(1).default('Abutment support beam'),
    transform: transformProp,
});

export type AbutmentSupportBeamProps = z.output<typeof abutmentSupportBeamProps>;
export type AbutmentSupportBeamInput = z.input<typeof abutmentSupportBeamProps>;

function semantics(props: AbutmentSupportBeamProps) {
  return civilSemantics({
    kind: 'product',
    category: 'beam',
    role: 'beam',
    material: props.material,
    dimensionsMm: { length: props.length, width: props.width, height: props.bearingSeatHeight },
    properties: { name: props.name, datum: 'lower-end-corner' },
  });
}

/** Five-point bearing-seat profile extruded along the beam member axis. */
export const AbutmentSupportBeam = family<AbutmentSupportBeamProps, AbutmentSupportBeamInput>(
  'AbutmentSupportBeam',
  ({ length, width, bearingInset, bearingSeatHeight, backHeight, transverseSide, transform }) => {
    const side = transverseSide === 'positive' ? 1 : -1;
    const shoulder = width - bearingInset;
    const profile = csg.polygon([
      [0, 0, 0],
      [0, side * width, 0],
      [0, side * shoulder, bearingInset],
      [0, side * shoulder, bearingSeatHeight],
      [0, 0, backHeight],
    ]);
    return placedGeometry(csg.extrude(profile, [length, 0, 0]), transform);
  },
  { props: abutmentSupportBeamProps, semantics }
);
