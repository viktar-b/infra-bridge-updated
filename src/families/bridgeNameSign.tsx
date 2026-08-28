/** @jsxImportSource brepjs-families */

import {
  blueprintToContour,
  csg,
  textBlueprints,
  unwrap,
  type Blueprint,
  type CompoundBlueprint,
} from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { PROJECT_SIGN_FONT_FAMILY } from '../fonts/projectFont.ts';
import { placedGeometry, transformProp } from '../placement.ts';

/** Metrics for the bundled project OpenType font. */
export const PROJECT_SIGN_FONT = {
  family: PROJECT_SIGN_FONT_FAMILY,
  glyphWidth: 180,
  glyphHeight: 200,
  advance: 230,
} as const;

function signTextWidth(text: string): number {
  return (
    text.length * PROJECT_SIGN_FONT.advance -
    (PROJECT_SIGN_FONT.advance - PROJECT_SIGN_FONT.glyphWidth)
  );
}

const bridgeNameSignProps = z
  .object({
    text: z
      .string()
      .trim()
      .min(1)
      .regex(/^[BREPJS]+$/i, 'contains a glyph outside the project block font')
      .transform((value) => value.toUpperCase()),
    width: z.number().positive(),
    height: z.number().positive(),
    plateDepth: z.number().positive(),
    reliefDepth: z.number().positive(),
    material: z.string().trim().min(1),
    name: z.string().trim().min(1).default('Bridge name sign'),
    transform: transformProp,
  })
  .superRefine(({ text, width, height }, context) => {
    if (signTextWidth(text) > width) {
      context.addIssue({ code: 'custom', path: ['text'], message: 'does not fit the sign width' });
    }
    if (PROJECT_SIGN_FONT.glyphHeight > height) {
      context.addIssue({ code: 'custom', path: ['text'], message: 'does not fit the sign height' });
    }
  });

export type BridgeNameSignProps = z.output<typeof bridgeNameSignProps>;
export type BridgeNameSignInput = z.input<typeof bridgeNameSignProps>;

type BridgeNameSignKernelProps = Pick<
  BridgeNameSignProps,
  'text' | 'width' | 'height' | 'plateDepth' | 'reliefDepth' | 'transform'
>;

function profileFromBlueprint(blueprint: Blueprint | CompoundBlueprint) {
  if ('blueprints' in blueprint) {
    const [outline, ...holes] = blueprint.blueprints;
    if (outline === undefined) throw new Error('Project font produced an empty compound outline');
    return csg.profile(
      unwrap(blueprintToContour(outline)),
      holes.map((hole) => unwrap(blueprintToContour(hole)))
    );
  }
  return csg.profile(unwrap(blueprintToContour(blueprint)));
}

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
      font: PROJECT_SIGN_FONT.family,
    },
  });
}

const BridgeNameSignKernel = family<BridgeNameSignKernelProps>(
  'BridgeNameSignKernel',
  ({ text, width, height, plateDepth, reliefDepth, transform }) => {
    const plate = csg.translate(csg.box(width, plateDepth, height), [-width / 2, -plateDepth, 0]);
    using outlines = textBlueprints(text, {
      fontFamily: PROJECT_SIGN_FONT.family,
      fontSize: PROJECT_SIGN_FONT.glyphHeight,
    });
    const letterOffset = [
      -signTextWidth(text) / 2,
      -(plateDepth - 1),
      (height - PROJECT_SIGN_FONT.glyphHeight) / 2,
    ] satisfies readonly [number, number, number];
    const glyphs = outlines.blueprints.map((blueprint) =>
      csg.translate(
        csg.rotate(csg.extrude(profileFromBlueprint(blueprint), [0, 0, reliefDepth + 1]), 90, {
          axis: [1, 0, 0],
        }),
        letterOffset
      )
    );
    let body: csg.SolidNode = plate;
    for (const glyph of glyphs) body = csg.fuse(body, glyph);
    return placedGeometry(body, transform);
  }
);

/** Backed sign with visible lettering converted from the bundled font to Profile IR. */
export const BridgeNameSign = family<BridgeNameSignProps, BridgeNameSignInput>(
  'BridgeNameSign',
  ({ text, width, height, plateDepth, reliefDepth, transform }) => (
    <BridgeNameSignKernel
      text={text}
      width={width}
      height={height}
      plateDepth={plateDepth}
      reliefDepth={reliefDepth}
      transform={transform}
    />
  ),
  { props: bridgeNameSignProps, semantics }
);
