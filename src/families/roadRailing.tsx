/** @jsxImportSource brepjs-families */

import { csg } from 'brepjs';
import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placedGeometry, transformProp } from '../placement.ts';

export const roadRailingPostProfileSchema = z.object({
  toeWidth: z.number().positive(),
  toeBase: z.number(),
  baseWidth: z.number().positive(),
  base: z.number(),
  transitionBase: z.number(),
  shaftWidth: z.number().positive(),
  top: z.number(),
  capWidth: z.number().positive(),
});

const roadRailingProps = z.object({
    length: z.number().positive(),
    setoutInset: z.number().nonnegative(),
    longitudinalSide: z.enum(['positive', 'negative']),
    railWidth: z.number().positive(),
    railHeight: z.number().positive(),
    lowerRailBase: z.number(),
    upperRailBase: z.number(),
    postPitch: z.number().positive(),
    postThickness: z.number().positive(),
    postRunIn: z.number().nonnegative(),
    postRunOut: z.number().nonnegative(),
    postProfile: roadRailingPostProfileSchema,
    material: z.string().trim().min(1),
    name: z.string().trim().min(1).default('Road bridge railing'),
    transform: transformProp,
});

export type RoadRailingProps = z.output<typeof roadRailingProps>;
export type RoadRailingInput = z.input<typeof roadRailingProps>;

function semantics(props: RoadRailingProps) {
  const profile = props.postProfile;
  const direction = props.longitudinalSide === 'positive' ? 1 : -1;
  const railMin = direction > 0 ? -props.setoutInset : -(props.length - props.setoutInset);
  const railMax = railMin + props.length;
  const finalPost = props.length - props.postRunOut;
  const postMin =
    direction > 0 ? Math.min(0, finalPost) : -Math.max(0, finalPost) - props.postThickness;
  const postMax =
    direction > 0 ? Math.max(0, finalPost) + props.postThickness : -Math.min(0, finalPost);
  const minimumZ = Math.min(
    props.lowerRailBase,
    props.upperRailBase,
    profile.toeBase,
    profile.base,
    profile.transitionBase,
    profile.top
  );
  const maximumZ = Math.max(
    props.lowerRailBase + props.railHeight,
    props.upperRailBase + props.railHeight,
    profile.toeBase,
    profile.base,
    profile.transitionBase,
    profile.top
  );
  return civilSemantics({
    kind: 'product',
    category: 'railing',
    role: 'guardrail',
    material: props.material,
    dimensionsMm: {
      length: Math.max(railMax, postMax) - Math.min(railMin, postMin),
      width: Math.max(
        props.railWidth,
        profile.toeWidth,
        profile.baseWidth,
        profile.shaftWidth,
        profile.capWidth
      ),
      height: maximumZ - minimumZ,
    },
    properties: { name: props.name, datum: 'deck-edge-control-point' },
  });
}

/** Timber guardrail generated from two rails and a repeated tapered post profile. */
export const RoadRailing = family<RoadRailingProps, RoadRailingInput>(
  'RoadRailing',
  ({
    length,
    setoutInset,
    longitudinalSide,
    railWidth,
    railHeight,
    lowerRailBase,
    upperRailBase,
    postPitch,
    postThickness,
    postRunIn,
    postRunOut,
    postProfile,
    transform,
  }) => {
    const direction = longitudinalSide === 'positive' ? 1 : -1;
    const railStart = direction > 0 ? -setoutInset : -(length - setoutInset);
    const railLength = length;
    const rails = [lowerRailBase, upperRailBase].map((base) =>
      csg.translate(csg.box(railLength, railWidth, railHeight), [railStart, 0, base])
    );
    const postProfilePolygon = csg.polygon([
      [0, postProfile.toeWidth, postProfile.toeBase],
      [0, postProfile.baseWidth, postProfile.base],
      [0, postProfile.baseWidth, postProfile.transitionBase],
      [0, postProfile.shaftWidth, postProfile.transitionBase],
      [0, postProfile.shaftWidth, postProfile.top],
      [0, postProfile.capWidth, postProfile.top],
    ]);
    const postStarts = [
      0,
      ...Array.from(
        { length: Math.max(0, Math.floor((length - postRunIn - postRunOut) / postPitch) + 1) },
        (_, index) => postRunIn + index * postPitch
      ),
      length - postRunOut,
    ];
    const posts = postStarts.map((distance) =>
      csg.translate(csg.extrude(postProfilePolygon, [direction * postThickness, 0, 0]), [
        direction * distance,
        0,
        0,
      ])
    );
    return placedGeometry(csg.compound([...rails, ...posts]), transform);
  },
  { props: roadRailingProps, semantics }
);
