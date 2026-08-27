/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, el, family } from 'brepjs-families';
import { z } from 'zod';
import { transformProp } from '../placement.ts';

const approachSlabProps = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  thickness: z.number().positive(),
  longitudinalSide: z.enum(['positive', 'negative']),
  transverseSide: z.enum(['positive', 'negative']).default('negative'),
  material: z.string().trim().min(1),
  name: z.string().trim().min(1).default('Approach slab'),
  transform: transformProp,
});

export type ApproachSlabProps = z.output<typeof approachSlabProps>;
export type ApproachSlabInput = z.input<typeof approachSlabProps>;

function semantics(props: ApproachSlabProps) {
  return civilSemantics({
    kind: 'product',
    category: 'slab',
    role: 'deck',
    material: props.material,
    dimensionsMm: { length: props.length, width: props.width, height: props.thickness },
    properties: { name: props.name, datum: 'upper-inner-corner' },
  });
}

/** Pitched road slab; +X follows traffic, +Y is transverse, and +Z is upward. */
export const ApproachSlab = family<ApproachSlabProps, ApproachSlabInput>(
  'ApproachSlab',
  ({ length, width, thickness, longitudinalSide, transverseSide, transform }) =>
    el('Geometry', {
      transform: transform ?? [],
      node: csg.translate(csg.box(length, width, thickness), [
        longitudinalSide === 'positive' ? 0 : -length,
        transverseSide === 'positive' ? 0 : -width,
        -thickness,
      ]),
    }),
  { props: approachSlabProps, semantics }
);
