/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from './familyPlacement.ts';

/** Reusable five-point bearing-seat section schema, in millimetres. */
export const abutmentSupportBeamSectionProps = z
  .object({
    width: z.number().positive(),
    toeInset: z.number().positive(),
    toeHeight: z.number().positive(),
    bearingSeatHeight: z.number().positive(),
    backHeight: z.number().positive(),
  })
  .superRefine((section, context) => {
    if (section.toeInset >= section.width) {
      context.addIssue({
        code: 'custom',
        path: ['toeInset'],
        message: 'toeInset must be less than width',
      });
    }
    if (section.toeHeight >= section.bearingSeatHeight) {
      context.addIssue({
        code: 'custom',
        path: ['toeHeight'],
        message: 'toeHeight must be less than bearingSeatHeight',
      });
    }
  });

export type AbutmentSupportBeamSection = z.output<typeof abutmentSupportBeamSectionProps>;
export type AbutmentSupportBeamSectionInput = z.input<typeof abutmentSupportBeamSectionProps>;

type SectionPoint = readonly [transverse: number, elevation: number];

interface ArbitraryClosedProfile {
  readonly kind: 'ARBITRARY_CLOSED';
  readonly points: readonly SectionPoint[];
}

function sectionProfile(
  section: AbutmentSupportBeamSection,
  transverseSide: 'positive' | 'negative'
): ArbitraryClosedProfile {
  const { width, toeInset, toeHeight, bearingSeatHeight, backHeight } = section;
  const direction = transverseSide === 'positive' ? 1 : -1;
  const transverse = (distance: number) => direction * distance;
  const shoulder = width - toeInset;
  return {
    kind: 'ARBITRARY_CLOSED',
    points: [
      [0, 0],
      [transverse(width), 0],
      [transverse(shoulder), toeHeight],
      [transverse(shoulder), bearingSeatHeight],
      [0, backHeight],
    ],
  };
}

/** Complete invocation schema for a five-point support beam, with dimensions in millimetres. */
export const abutmentSupportBeamProps = z.object({
  length: z.number().positive(),
  section: abutmentSupportBeamSectionProps,
  transverseSide: z.enum(['positive', 'negative']),
  material: z.string().trim().min(1),
  name: z.string().trim().min(1).default('Abutment support beam'),
  transform: transformProp,
}).transform((props) => ({
  ...props,
  // Carry one exact section across the Family projection seam so the kernel and adapters agree.
  profile: sectionProfile(props.section, props.transverseSide),
}));

export type AbutmentSupportBeamProps = z.output<typeof abutmentSupportBeamProps>;
export type AbutmentSupportBeamInput = z.input<typeof abutmentSupportBeamProps>;

type AbutmentSupportBeamKernelProps = Pick<
  AbutmentSupportBeamProps,
  'length' | 'profile' | 'transform'
>;

function semantics(props: AbutmentSupportBeamProps) {
  const { width, bearingSeatHeight, backHeight } = props.section;
  return civilSemantics({
    kind: 'product',
    category: 'beam',
    role: 'beam',
    material: props.material,
    dimensionsMm: { length: props.length, width, height: Math.max(bearingSeatHeight, backHeight) },
    properties: { name: props.name, datum: 'lower-end-corner' },
  });
}

const AbutmentSupportBeamKernel = family<AbutmentSupportBeamKernelProps>(
  'AbutmentSupportBeamKernel',
  ({ length, profile, transform }) => {
    const face = csg.polygon(
      profile.points.map(
        ([transverse, elevation]) =>
          [0, transverse, elevation] satisfies readonly [number, number, number]
      )
    );
    return placedGeometry(csg.extrude(face, [length, 0, 0]), transform);
  }
);

/** Five-point bearing-seat profile extruded along the beam member axis. */
export const AbutmentSupportBeam = family<AbutmentSupportBeamProps, AbutmentSupportBeamInput>(
  'AbutmentSupportBeam',
  ({ length, profile, transform }) => (
    <AbutmentSupportBeamKernel length={length} profile={profile} transform={transform} />
  ),
  { props: abutmentSupportBeamProps, semantics }
);
