/** @jsxImportSource brepjs-families */

import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placement, spatialGroup, transformProp } from '../placement.ts';
import { ROAD_BRIDGE_DATUM } from '../setout.ts';
import { RoadGirderBridge } from './roadGirderBridge.tsx';

const roadSiteProps = z.object({
  name: z.string().trim().min(1).default('Road river bridge site'),
  transform: transformProp,
});

export type RoadSiteProps = z.output<typeof roadSiteProps>;
export type RoadSiteInput = z.input<typeof roadSiteProps>;

function semantics({ name }: RoadSiteProps) {
  return civilSemantics({
    kind: 'site',
    category: 'site',
    role: 'transport-site',
    composition: 'partial',
    properties: { name: name },
  });
}

/** Civil Site containing the keyed road-girder Bridge occurrence. */
export const RoadSite = family<RoadSiteProps, RoadSiteInput>(
  'RoadSite',
  ({ transform }) =>
    spatialGroup(transform, [
      <RoadGirderBridge
        key="road-river-bridge"
        transform={placement(ROAD_BRIDGE_DATUM.origin, ROAD_BRIDGE_DATUM.bearingFromSiteDegrees)}
      />,
    ]),
  { props: roadSiteProps, semantics }
);
