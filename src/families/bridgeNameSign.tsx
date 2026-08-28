/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from './familyPlacement.ts';

/** Complete invocation schema for one plain sign plate with normalized text metadata. */
export const bridgeNameSignProps = z.object({
  text: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.toUpperCase()),
  width: z.number().positive(),
  height: z.number().positive(),
  plateDepth: z.number().positive(),
  reliefDepth: z.number().positive(),
  material: z.string().trim().min(1),
  name: z.string().trim().min(1).default('Bridge name sign'),
  transform: transformProp,
});

export type BridgeNameSignProps = z.output<typeof bridgeNameSignProps>;
export type BridgeNameSignInput = z.input<typeof bridgeNameSignProps>;

type BridgeNameSignKernelProps = Pick<
  BridgeNameSignProps,
  'width' | 'height' | 'plateDepth' | 'reliefDepth' | 'transform'
>;

function semantics(props: BridgeNameSignProps) {
  return civilSemantics({
    kind: 'product',
    category: 'sign',
    role: 'marker',
    material: props.material,
    dimensionsMm: {
      length: props.width,
      width: props.plateDepth + props.reliefDepth,
      height: props.height,
    },
    properties: {
      name: props.name,
      datum: 'lower-centre-back-face',
      text: props.text,
      textRepresentation: 'metadata-only',
    },
  });
}

const BridgeNameSignKernel = family<BridgeNameSignKernelProps>(
  'BridgeNameSignKernel',
  ({ width, height, plateDepth, reliefDepth, transform }) =>
    placedGeometry(
      csg.translate(csg.box(width, plateDepth + reliefDepth, height), [
        -width / 2,
        -(plateDepth + reliefDepth),
        0,
      ]),
      transform
    )
);

/** Plain sign plate with text carried as target-neutral metadata and no font runtime dependency. */
export const BridgeNameSign = family<BridgeNameSignProps, BridgeNameSignInput>(
  'BridgeNameSign',
  ({ width, height, plateDepth, reliefDepth, transform }) => (
    <BridgeNameSignKernel
      width={width}
      height={height}
      plateDepth={plateDepth}
      reliefDepth={reliefDepth}
      transform={transform}
    />
  ),
  { props: bridgeNameSignProps, semantics }
);
