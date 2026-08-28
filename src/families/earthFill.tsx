/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from '../placement.ts';

const earthFillProps = z.object({
  halfSpan: z.number().positive(),
  halfWidth: z.number().positive(),
  crownRise: z.number().positive(),
  horizontalControlFactor: z.number().min(0).max(1).default(0.548),
  verticalControlFactor: z.number().min(0).max(1).default(0.566),
  curveSegments: z.number().int().min(4).max(48).default(6),
  material: z.string().trim().min(1),
  name: z.string().trim().min(1).default('Rail bridge fill'),
  transform: transformProp,
});

export type EarthFillProps = z.output<typeof earthFillProps>;
export type EarthFillInput = z.input<typeof earthFillProps>;

type EarthFillKernelProps = Pick<
  EarthFillProps,
  | 'halfSpan'
  | 'halfWidth'
  | 'crownRise'
  | 'horizontalControlFactor'
  | 'verticalControlFactor'
  | 'curveSegments'
  | 'transform'
>;

function semantics(props: EarthFillProps) {
  return civilSemantics({
    kind: 'product',
    category: 'earthworks-fill',
    role: 'embankment',
    material: props.material,
    dimensionsMm: { length: props.halfSpan * 2, width: props.halfWidth * 2, height: props.crownRise },
    properties: { name: props.name, datum: 'crown-centreline-low-point', profile: 'cubic-crown' },
  });
}

function crownPoint({
  halfSpan,
  rise,
  horizontalControlFactor,
  verticalControlFactor,
  parameter,
  side,
}: {
  readonly halfSpan: number;
  readonly rise: number;
  readonly horizontalControlFactor: number;
  readonly verticalControlFactor: number;
  readonly parameter: number;
  readonly side: -1 | 1;
}): readonly [number, number] {
  const remaining = 1 - parameter;
  return [
    side *
      (3 * remaining * parameter ** 2 * halfSpan * (1 - horizontalControlFactor) +
        parameter ** 3 * halfSpan),
    3 * remaining ** 2 * parameter * verticalControlFactor * rise +
      3 * remaining * parameter ** 2 * rise +
      parameter ** 3 * rise,
  ];
}

function crownProfile({
  halfSpan,
  crownRise,
  horizontalControlFactor,
  verticalControlFactor,
  curveSegments,
}: Omit<EarthFillKernelProps, 'halfWidth' | 'transform'>): readonly (readonly [number, number])[] {
  const left = Array.from({ length: curveSegments + 1 }, (_, index) =>
    crownPoint({
      halfSpan,
      rise: crownRise,
      horizontalControlFactor,
      verticalControlFactor,
      parameter: (curveSegments - index) / curveSegments,
      side: -1,
    })
  );
  const right = Array.from({ length: curveSegments }, (_, index) =>
    crownPoint({
      halfSpan,
      rise: crownRise,
      horizontalControlFactor,
      verticalControlFactor,
      parameter: (index + 1) / curveSegments,
      side: 1,
    })
  );
  return [...left, ...right];
}

const EarthFillKernel = family<EarthFillKernelProps>(
  'EarthFillKernel',
  ({ halfWidth, transform, ...profileProps }) => {
    const face = csg.polygon(
      crownProfile(profileProps).map(
        ([x, height]) => [x, -halfWidth, height] satisfies readonly [number, number, number]
      )
    );
    return placedGeometry(csg.extrude(face, [0, halfWidth * 2, 0]), transform);
  }
);

/** Soil above a cubic crown, extruded across the bridge width. */
export const EarthFill = family<EarthFillProps, EarthFillInput>(
  'EarthFill',
  ({
    halfSpan,
    halfWidth,
    crownRise,
    horizontalControlFactor,
    verticalControlFactor,
    curveSegments,
    transform,
  }) => (
    <EarthFillKernel
      halfSpan={halfSpan}
      halfWidth={halfWidth}
      crownRise={crownRise}
      horizontalControlFactor={horizontalControlFactor}
      verticalControlFactor={verticalControlFactor}
      curveSegments={curveSegments}
      transform={transform}
    />
  ),
  { props: earthFillProps, semantics }
);
