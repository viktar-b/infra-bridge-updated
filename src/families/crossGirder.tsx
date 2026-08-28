/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from './familyPlacement.ts';

/** Complete invocation schema for one handed rectangular cross-girder, in millimetres. */
export const crossGirderProps = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  depth: z.number().positive(),
  transverseSide: z.enum(['positive', 'negative']).default('positive'),
  material: z.string().trim().min(1),
  name: z.string().trim().min(1).default('Cross girder'),
  transform: transformProp,
});

export type CrossGirderProps = z.output<typeof crossGirderProps>;
export type CrossGirderInput = z.input<typeof crossGirderProps>;

type CrossGirderKernelProps = Pick<
  CrossGirderProps,
  'length' | 'width' | 'depth' | 'transverseSide' | 'transform'
>;

function semantics(props: CrossGirderProps) {
  return civilSemantics({
    kind: 'product',
    category: 'beam',
    role: 'cross-girder',
    material: props.material,
    dimensionsMm: { length: props.length, width: props.width, height: props.depth },
    properties: { name: props.name, datum: 'lower-end-corner' },
  });
}

const CrossGirderKernel = family<CrossGirderKernelProps>(
  'CrossGirderKernel',
  ({ length, width, depth, transverseSide, transform }) => {
    const datumOffset = [
      -length,
      transverseSide === 'positive' ? 0 : -width,
      0,
    ] satisfies readonly [number, number, number];
    return placedGeometry(csg.translate(csg.box(length, width, depth), datumOffset), transform);
  }
);

/** Pier cross-girder extending along -X from its lower-end control Datum. */
export const CrossGirder = family<CrossGirderProps, CrossGirderInput>(
  'CrossGirder',
  ({ length, width, depth, transverseSide, transform }) => (
    <CrossGirderKernel
      length={length}
      width={width}
      depth={depth}
      transverseSide={transverseSide}
      transform={transform}
    />
  ),
  { props: crossGirderProps, semantics }
);
