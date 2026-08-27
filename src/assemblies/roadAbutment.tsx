/** @jsxImportSource brepjs-families */

import { civilSemantics, el, family } from 'brepjs-families';
import { z } from 'zod';
import { AbutmentSupportBeam } from '../families/abutmentSupportBeam.tsx';
import { transformProp } from '../placement.ts';

const roadAbutmentProps = z.object({
  transverseSide: z.enum(['positive', 'negative']),
  length: z.number().positive(),
  width: z.number().positive(),
  bearingInset: z.number().positive(),
  bearingSeatHeight: z.number().positive(),
  backHeight: z.number().positive(),
  material: z.string().trim().min(1),
  name: z.string().trim().min(1).default('Road bridge abutment'),
  transform: transformProp,
});

export type RoadAbutmentProps = z.output<typeof roadAbutmentProps>;
export type RoadAbutmentInput = z.input<typeof roadAbutmentProps>;

function semantics(props: RoadAbutmentProps) {
  return civilSemantics({
    kind: 'spatial-part',
    category: 'bridge-part',
    role: 'abutment',
    composition: 'element',
    subdivision: 'vertical',
    properties: { name: props.name },
  });
}

/** Road abutment BridgePart around the lower support-beam Datum. */
export const RoadAbutment = family<RoadAbutmentProps, RoadAbutmentInput>(
  'RoadAbutment',
  ({ transverseSide, length, width, bearingInset, bearingSeatHeight, backHeight, material, transform }) =>
    el('Group', { transform: transform ?? [] }, [
      <AbutmentSupportBeam
        key="abutment-support-beam"
        length={length}
        width={width}
        bearingInset={bearingInset}
        bearingSeatHeight={bearingSeatHeight}
        backHeight={backHeight}
        transverseSide={transverseSide}
        material={material}
        name="Road river bridge - abutment support beam"
      />,
    ]),
  { props: roadAbutmentProps, semantics }
);
