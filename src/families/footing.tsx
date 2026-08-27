/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from '../placement.ts';

const footingProps = z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    thickness: z.number().positive(),
    material: z.string().trim().min(1),
    name: z.string().trim().min(1).default('Pier footing'),
    transform: transformProp,
});

export type FootingProps = z.output<typeof footingProps>;
export type FootingInput = z.input<typeof footingProps>;

function semantics(props: FootingProps) {
  return civilSemantics({
    kind: 'product',
    category: 'footing',
    role: 'pad',
    material: props.material,
    dimensionsMm: { length: props.length, width: props.width, height: props.thickness },
    properties: { name: props.name, datum: 'top-centre' },
  });
}

/** Rectangular footing below its top-centre Datum in engineering coordinates. */
export const Footing = family<FootingProps, FootingInput>(
  'Footing',
  ({ length, width, thickness, transform }) =>
    placedGeometry(
      csg.translate(csg.box(length, width, thickness), [-length / 2, -width / 2, -thickness]),
      transform
    ),
  { props: footingProps, semantics }
);
