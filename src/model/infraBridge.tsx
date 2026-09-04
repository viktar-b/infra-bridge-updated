/** @jsxImportSource brepjs-families */

import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { EmptyCivilSite } from '../assemblies/emptyCivilSite.tsx';
import { RailSite } from '../assemblies/railSite.tsx';
import { RoadSite } from '../assemblies/roadSite.tsx';
import { placement, spatialGroup, transformProp } from '../placement.ts';
import {
  EMPTY_CIVIL_SITES,
  RAIL_SITE_OCCURRENCES,
  ROAD_SITE_SET_OUT,
  railSiteKey,
} from '../setout.ts';

const emptyProps = z.object({ transform: transformProp });
type EmptyProps = z.output<typeof emptyProps>;
type EmptyInput = z.input<typeof emptyProps>;

function environmentSemantics() {
  return civilSemantics({
    kind: 'site',
    category: 'site',
    role: 'transport-site',
    composition: 'collection',
    properties: { name: 'environment - site' },
  });
}

/** Collection environment Site holding the keyed transport Sites and empty civil placeholders. */
export const InfraBridge = family<EmptyProps, EmptyInput>(
  'InfraBridge',
  ({ transform }) =>
    spatialGroup(transform, [
      <RoadSite
        key="road-site"
        transform={placement(ROAD_SITE_SET_OUT.origin, ROAD_SITE_SET_OUT.bearingDegrees)}
      />,
      ...RAIL_SITE_OCCURRENCES.map(
        ({ occurrenceKey, siteName, bridgeName, origin, bearingDegrees }) => (
          <RailSite
            key={railSiteKey(occurrenceKey)}
            occurrenceKey={occurrenceKey}
            siteName={siteName}
            bridgeName={bridgeName}
            transform={placement(origin, bearingDegrees)}
          />
        )
      ),
      <EmptyCivilSite
        key={EMPTY_CIVIL_SITES.parking.key}
        name={EMPTY_CIVIL_SITES.parking.name}
        transform={placement(
          EMPTY_CIVIL_SITES.parking.origin,
          EMPTY_CIVIL_SITES.parking.bearingDegrees
        )}
      />,
      <EmptyCivilSite
        key={EMPTY_CIVIL_SITES.road.key}
        name={EMPTY_CIVIL_SITES.road.name}
        transform={placement(
          EMPTY_CIVIL_SITES.road.origin,
          EMPTY_CIVIL_SITES.road.bearingDegrees
        )}
      />,
    ]),
  { props: emptyProps, semantics: environmentSemantics }
);
