/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, el, family } from 'brepjs-families';
import { z } from 'zod';
import { transformProp } from '../placement.ts';

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

function crownPoint(
  halfSpan: number,
  rise: number,
  horizontalControlFactor: number,
  verticalControlFactor: number,
  parameter: number,
  side: -1 | 1
): readonly [number, number] {
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
  }) => {
    const left = Array.from({ length: curveSegments + 1 }, (_, index) => {
      const parameter = (curveSegments - index) / curveSegments;
      const [x, height] = crownPoint(
        halfSpan,
        crownRise,
        horizontalControlFactor,
        verticalControlFactor,
        parameter,
        -1
      );
      return [x, -halfWidth, height] as const;
    });
    const right = Array.from({ length: curveSegments }, (_, index) => {
      const parameter = (index + 1) / curveSegments;
      const [x, height] = crownPoint(
        halfSpan,
        crownRise,
        horizontalControlFactor,
        verticalControlFactor,
        parameter,
        1
      );
      return [x, -halfWidth, height] as const;
    });
    return el('Geometry', {
      transform: transform ?? [],
      node: csg.extrude(csg.polygon([...left, ...right]), [0, halfWidth * 2, 0]),
    });
  },
  { props: earthFillProps, semantics }
);
