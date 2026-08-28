/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from './familyPlacement.ts';

/** Complete invocation schema for one handed rectangular approach slab, in millimetres. */
export const approachSlabProps = z.object({
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

type ApproachSlabKernelProps = Pick<
  ApproachSlabProps,
  'length' | 'width' | 'thickness' | 'longitudinalSide' | 'transverseSide' | 'transform'
>;

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

const ApproachSlabKernel = family<ApproachSlabKernelProps>(
  'ApproachSlabKernel',
  ({ length, width, thickness, longitudinalSide, transverseSide, transform }) => {
    const datumOffset = [
      longitudinalSide === 'positive' ? 0 : -length,
      transverseSide === 'positive' ? 0 : -width,
      -thickness,
    ] satisfies readonly [number, number, number];
    return placedGeometry(
      csg.translate(csg.box(length, width, thickness), datumOffset),
      transform
    );
  }
);

/** Road slab set out from its upper-inner Datum; +X follows traffic, +Y is transverse, +Z is up. */
export const ApproachSlab = family<ApproachSlabProps, ApproachSlabInput>(
  'ApproachSlab',
  ({ length, width, thickness, longitudinalSide, transverseSide, transform }) => (
    <ApproachSlabKernel
      length={length}
      width={width}
      thickness={thickness}
      longitudinalSide={longitudinalSide}
      transverseSide={transverseSide}
      transform={transform}
    />
  ),
  { props: approachSlabProps, semantics }
);
