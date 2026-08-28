/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from '../placement.ts';

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

const abutmentSupportBeamProps = z.object({
  length: z.number().positive(),
  section: abutmentSupportBeamSectionProps,
  transverseSide: z.enum(['positive', 'negative']),
  material: z.string().trim().min(1),
  name: z.string().trim().min(1).default('Abutment support beam'),
  transform: transformProp,
}).transform((props) => ({
  ...props,
  // The validated output carries the exact section through the families-to-BIM seam.
  profile: sectionProfile(props.section, props.transverseSide),
}));

export type AbutmentSupportBeamProps = z.output<typeof abutmentSupportBeamProps>;
export type AbutmentSupportBeamInput = z.input<typeof abutmentSupportBeamProps>;

type AbutmentSupportBeamGeometryProps = Pick<
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

const AbutmentSupportBeamGeometry = family<AbutmentSupportBeamGeometryProps>(
  'AbutmentSupportBeamGeometry',
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
    <AbutmentSupportBeamGeometry length={length} profile={profile} transform={transform} />
  ),
  { props: abutmentSupportBeamProps, semantics }
);

function sectionProfile(
  section: AbutmentSupportBeamSection,
  transverseSide: 'positive' | 'negative'
): ArbitraryClosedProfile {
  const side = transverseSide === 'positive' ? 1 : -1;
  const shoulder = section.width - section.toeInset;
  return {
    kind: 'ARBITRARY_CLOSED',
    points: [
      [0, 0],
      [side * section.width, 0],
      [side * shoulder, section.toeHeight],
      [side * shoulder, section.bearingSeatHeight],
      [0, section.backHeight],
    ],
  };
}
