/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from '../placement.ts';

const mainGirderProps = z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    depth: z.number().positive(),
    material: z.string().trim().min(1),
    name: z.string().trim().min(1).default('Main girder'),
    transform: transformProp,
});

export type MainGirderProps = z.output<typeof mainGirderProps>;
export type MainGirderInput = z.input<typeof mainGirderProps>;

function semantics(props: MainGirderProps) {
  return civilSemantics({
    kind: 'product',
    category: 'beam',
    role: 'girder',
    material: props.material,
    dimensionsMm: { length: props.length, width: props.width, height: props.depth },
    properties: { name: props.name, datum: 'lower-centreline-end' },
  });
}

/** Rectangular main girder extending along -X from its lower-centreline end Datum. */
export const MainGirder = family<MainGirderProps, MainGirderInput>(
  'MainGirder',
  ({ length, width, depth, transform }) =>
    placedGeometry(
      csg.translate(csg.box(length, width, depth), [-length, -width / 2, 0]),
      transform
    ),
  { props: mainGirderProps, semantics }
);
