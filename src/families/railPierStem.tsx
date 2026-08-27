/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, el, family } from 'brepjs-families';
import { z } from 'zod';
import { transformProp } from '../placement.ts';

const railPierStemProps = z.object({
  longitudinalWidth: z.number().positive(),
  transverseLength: z.number().positive(),
  height: z.number().positive(),
  material: z.string().trim().min(1),
  name: z.string().trim().min(1).default('Rail bridge pier stem'),
  transform: transformProp,
});

export type RailPierStemProps = z.output<typeof railPierStemProps>;
export type RailPierStemInput = z.input<typeof railPierStemProps>;

function semantics(props: RailPierStemProps) {
  return civilSemantics({
    kind: 'product',
    category: 'column',
    role: 'pier-stem',
    material: props.material,
    dimensionsMm: {
      length: props.longitudinalWidth,
      width: props.transverseLength,
      height: props.height,
    },
    properties: { name: props.name, datum: 'lower-longitudinal-centreline-corner' },
  });
}

/** Masonry rail pier: +X longitudinal, +Y transverse, +Z upward. */
export const RailPierStem = family<RailPierStemProps, RailPierStemInput>(
  'RailPierStem',
  ({ longitudinalWidth, transverseLength, height, transform }) =>
    el('Geometry', {
      transform: transform ?? [],
      node: csg.translate(csg.box(longitudinalWidth, transverseLength, height), [
        -longitudinalWidth / 2,
        0,
        0,
      ]),
    }),
  { props: railPierStemProps, semantics }
);
