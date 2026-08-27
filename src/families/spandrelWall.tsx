/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, el, family } from 'brepjs-families';
import { z } from 'zod';
import { transformProp } from '../placement.ts';

const spandrelWallProps = z.object({
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

function openingTools(
  bayStart: number,
  bayWidth: number,
  openingRun: number,
  openingRise: number,
  thickness: number,
  segments: number
): readonly csg.IRNode[] {
  const left = Array.from({ length: segments + 1 }, (_, index) => {
    const angle = ((segments - index) * Math.PI) / (2 * segments);
    return [bayStart + openingRun * Math.cos(angle), 0, openingRise * Math.sin(angle)] as const;
  });
  const right = Array.from({ length: segments + 1 }, (_, index) => {
    const angle = (index * Math.PI) / (2 * segments);
    return [
      bayStart + bayWidth - openingRun * Math.cos(angle),
      0,
      openingRise * Math.sin(angle),
    ] as const;
  });
  return [
    csg.extrude(csg.polygon([[bayStart, 0, 0], ...left]), [0, thickness, 0]),
    csg.extrude(csg.polygon([...right, [bayStart + bayWidth, 0, 0]]), [0, thickness, 0]),
  ];
}

/** Masonry wall with regular arch openings cut from one rectangular extrusion. */
export const SpandrelWall = family<SpandrelWallProps, SpandrelWallInput>(
  'SpandrelWall',
  ({ length, thickness, height, bayCount, openingRun, openingRise, curveSegments, transform }) => {
    const bayWidth = length / bayCount;
    const openings = Array.from({ length: bayCount }, (_, index) =>
      openingTools(index * bayWidth, bayWidth, openingRun, openingRise, thickness, curveSegments)
    ).flat();
    return el('Geometry', {
      transform: transform ?? [],
      node: csg.cutAll(csg.box(length, thickness, height), openings),
    });
  },
  { props: spandrelWallProps, semantics }
);
