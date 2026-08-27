/** @jsxImportSource brepjs-families */

import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { MainGirder } from '../families/mainGirder.tsx';
import { placement, spatialGroup, transformProp } from '../placement.ts';
import { MATERIALS } from '../materials.ts';
import { ROAD_BRIDGE_SET_OUT } from '../setout.ts';

const roadSuperstructureProps = z.object({
  girderLength: z.number().positive(),
  girderWidth: z.number().positive(),
  girderDepth: z.number().positive(),
  name: z.string().trim().min(1).default('Road bridge superstructure'),
  transform: transformProp,
});

export type RoadSuperstructureProps = z.output<typeof roadSuperstructureProps>;
export type RoadSuperstructureInput = z.input<typeof roadSuperstructureProps>;

function semantics({ name }: RoadSuperstructureProps) {
  return civilSemantics({
    kind: 'spatial-part',
    category: 'bridge-part',
    role: 'superstructure',
    composition: 'element',
    subdivision: 'longitudinal',
    properties: { name: name },
  });
}

/** Three explicit longitudinal girder Occurrences at reviewable transverse set-outs. */
export const RoadSuperstructure = family<RoadSuperstructureProps, RoadSuperstructureInput>(
  'RoadSuperstructure',
  ({ girderLength, girderWidth, girderDepth, transform }) => {
    const girderProps = {
      length: girderLength,
      width: girderWidth,
      depth: girderDepth,
      material: MATERIALS.bridgeTimber,
      name: 'Road river bridge - main girder',
    } as const;

    return spatialGroup(
      transform,
      ROAD_BRIDGE_SET_OUT.mainGirders.occurrences.map(({ key, origin, bearingDegrees }) => (
        <MainGirder key={key} transform={placement(origin, bearingDegrees)} {...girderProps} />
      ))
    );
  },
  { props: roadSuperstructureProps, semantics }
);
