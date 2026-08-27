/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from '../placement.ts';

const bridgeDeckProps = z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    thickness: z.number().positive(),
    setoutInset: z.number().nonnegative(),
    material: z.string().trim().min(1),
    name: z.string().trim().min(1).default('Bridge deck'),
    transform: transformProp,
});

export type BridgeDeckProps = z.output<typeof bridgeDeckProps>;
export type BridgeDeckInput = z.input<typeof bridgeDeckProps>;

function semantics(props: BridgeDeckProps) {
  return civilSemantics({
    kind: 'product',
    category: 'slab',
    role: 'deck',
    material: props.material,
    dimensionsMm: { length: props.length, width: props.width, height: props.thickness },
    properties: { name: props.name, setoutInset: props.setoutInset, datum: 'lower-setout-point' },
  });
}

/** Flat deck slab; +X is longitudinal, +Y transverse, and +Z upward. */
export const BridgeDeck = family<BridgeDeckProps, BridgeDeckInput>(
  'BridgeDeck',
  ({ length, width, thickness, setoutInset, transform }) =>
    placedGeometry(
      csg.translate(csg.box(length, width, thickness), [
        -setoutInset,
        -(width - setoutInset),
        0,
      ]),
      transform
    ),
  { props: bridgeDeckProps, semantics }
);
