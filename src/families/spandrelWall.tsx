/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from './familyPlacement.ts';

/** Complete invocation schema for a wall with paired arch cuts in each bay, in millimetres. */
export const spandrelWallProps = z.object({
  length: z.number().positive(),
  thickness: z.number().positive(),
  height: z.number().positive(),
  bayCount: z.number().int().min(1).max(8),
  openingRun: z.number().positive(),
  openingRise: z.number().positive(),
  curveSegments: z.number().int().min(4).max(24).default(6),
  material: z.string().trim().min(1),
  name: z.string().trim().min(1).default('Rail bridge spandrel wall'),
  transform: transformProp,
});

export type SpandrelWallProps = z.output<typeof spandrelWallProps>;
export type SpandrelWallInput = z.input<typeof spandrelWallProps>;

type SpandrelWallKernelProps = Pick<
  SpandrelWallProps,
  | 'length'
  | 'thickness'
  | 'height'
  | 'bayCount'
  | 'openingRun'
  | 'openingRise'
  | 'curveSegments'
  | 'transform'
>;

function semantics(props: SpandrelWallProps) {
  return civilSemantics({
    kind: 'product',
    category: 'wall',
    role: 'wall',
    material: props.material,
    dimensionsMm: { length: props.length, width: props.thickness, height: props.height },
    properties: {
      name: props.name,
      datum: 'lower-start-corner',
      openingProfile: 'paired-elliptical-arches',
    },
  });
}

function openingProfiles({
  bayStart,
  bayWidth,
  openingRun,
  openingRise,
  segments,
}: {
  readonly bayStart: number;
  readonly bayWidth: number;
  readonly openingRun: number;
  readonly openingRise: number;
  readonly segments: number;
}): readonly (readonly (readonly [number, number, number])[])[] {
  const left = Array.from({ length: segments + 1 }, (_, index) => {
    const angle = ((segments - index) * Math.PI) / (2 * segments);
    return [
      bayStart + openingRun * Math.cos(angle),
      0,
      openingRise * Math.sin(angle),
    ] satisfies readonly [number, number, number];
  });
  const right = Array.from({ length: segments + 1 }, (_, index) => {
    const angle = (index * Math.PI) / (2 * segments);
    return [
      bayStart + bayWidth - openingRun * Math.cos(angle),
      0,
      openingRise * Math.sin(angle),
    ] satisfies readonly [number, number, number];
  });
  return [
    [[bayStart, 0, 0], ...left],
    [...right, [bayStart + bayWidth, 0, 0]],
  ];
}

const SpandrelWallKernel = family<SpandrelWallKernelProps>(
  'SpandrelWallKernel',
  ({ length, thickness, height, bayCount, openingRun, openingRise, curveSegments, transform }) => {
    const bayWidth = length / bayCount;
    const openings = Array.from({ length: bayCount }, (_, index) =>
      openingProfiles({
        bayStart: index * bayWidth,
        bayWidth,
        openingRun,
        openingRise,
        segments: curveSegments,
      })
    )
      .flat()
      .map((profile) => csg.extrude(csg.polygon(profile), [0, thickness, 0]));
    return placedGeometry(csg.cutAll(csg.box(length, thickness, height), openings), transform);
  }
);

/** Masonry wall with regular arch openings cut from one rectangular extrusion. */
export const SpandrelWall = family<SpandrelWallProps, SpandrelWallInput>(
  'SpandrelWall',
  ({ length, thickness, height, bayCount, openingRun, openingRise, curveSegments, transform }) => (
    <SpandrelWallKernel
      length={length}
      thickness={thickness}
      height={height}
      bayCount={bayCount}
      openingRun={openingRun}
      openingRise={openingRise}
      curveSegments={curveSegments}
      transform={transform}
    />
  ),
  { props: spandrelWallProps, semantics }
);
