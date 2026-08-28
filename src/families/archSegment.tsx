/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from './familyPlacement.ts';

/** Complete invocation schema for one sampled quarter-arch band, in millimetres. */
export const archSegmentProps = z.object({
  outerRun: z.number().positive(),
  outerRise: z.number().positive(),
  innerRun: z.number().positive(),
  innerRise: z.number().positive(),
  bandThickness: z.number().positive(),
  halfWidth: z.number().positive(),
  horizontalControlFactor: z.number().min(0).max(1).default(0.548),
  verticalControlFactor: z.number().min(0).max(1).default(0.566),
  curveSegments: z.number().int().min(4).max(48).default(6),
  material: z.string().trim().min(1),
  name: z.string().trim().min(1).default('Rail bridge arch segment'),
  transform: transformProp,
});

export type ArchSegmentProps = z.output<typeof archSegmentProps>;
export type ArchSegmentInput = z.input<typeof archSegmentProps>;

type ArchSegmentKernelProps = Pick<
  ArchSegmentProps,
  | 'outerRun'
  | 'outerRise'
  | 'innerRun'
  | 'innerRise'
  | 'bandThickness'
  | 'halfWidth'
  | 'horizontalControlFactor'
  | 'verticalControlFactor'
  | 'curveSegments'
  | 'transform'
>;

function archBandPoints({
  outerRun,
  outerRise,
  innerRun,
  innerRise,
  bandThickness,
  halfWidth,
  horizontalControlFactor,
  verticalControlFactor,
  curveSegments,
}: Omit<ArchSegmentKernelProps, 'transform'>): readonly (readonly [number, number, number])[] {
  const outer = Array.from({ length: curveSegments + 1 }, (_, index) => {
    const parameter = index / curveSegments;
    const remaining = 1 - parameter;
    return [
      3 * remaining * parameter ** 2 * outerRun * (1 - horizontalControlFactor) +
        parameter ** 3 * outerRun -
        bandThickness,
      -halfWidth,
      3 * remaining ** 2 * parameter * verticalControlFactor * outerRise +
        3 * remaining * parameter ** 2 * outerRise +
        parameter ** 3 * outerRise,
    ] satisfies readonly [number, number, number];
  });
  const inner = Array.from({ length: curveSegments + 1 }, (_, index) => {
    const angle = ((curveSegments - index) * Math.PI) / (2 * curveSegments);
    return [
      innerRun * (1 - Math.cos(angle)),
      -halfWidth,
      innerRise * Math.sin(angle),
    ] satisfies readonly [number, number, number];
  });
  return [...outer, ...inner];
}

function semantics(props: ArchSegmentProps) {
  return civilSemantics({
    kind: 'product',
    category: 'member',
    role: 'arch-segment',
    material: props.material,
    dimensionsMm: { length: props.outerRun, width: props.halfWidth * 2, height: props.outerRise },
    properties: {
      name: props.name,
      datum: 'outer-springing-corner',
      profile: 'elliptical-arch-band',
    },
  });
}

const ArchSegmentKernel = family<ArchSegmentKernelProps>(
  'ArchSegmentKernel',
  ({ halfWidth, transform, ...profileProps }) =>
    placedGeometry(
      csg.extrude(csg.polygon(archBandPoints({ ...profileProps, halfWidth })), [
        0,
        halfWidth * 2,
        0,
      ]),
      transform
    )
);

/** One reusable quarter arch band between named outer and inner elliptical curves. */
export const ArchSegment = family<ArchSegmentProps, ArchSegmentInput>(
  'ArchSegment',
  ({
    outerRun,
    outerRise,
    innerRun,
    innerRise,
    bandThickness,
    halfWidth,
    horizontalControlFactor,
    verticalControlFactor,
    curveSegments,
    transform,
  }) => (
    <ArchSegmentKernel
      outerRun={outerRun}
      outerRise={outerRise}
      innerRun={innerRun}
      innerRise={innerRise}
      bandThickness={bandThickness}
      halfWidth={halfWidth}
      horizontalControlFactor={horizontalControlFactor}
      verticalControlFactor={verticalControlFactor}
      curveSegments={curveSegments}
      transform={transform}
    />
  ),
  { props: archSegmentProps, semantics }
);
