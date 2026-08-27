/** @jsxImportSource brepjs-families */

import { el, family } from 'brepjs-families';
import { z } from 'zod';
import { RailSite } from '../assemblies/railSite.tsx';
import { RoadSite } from '../assemblies/roadSite.tsx';
import { placement, transformProp } from '../placement.ts';
import { RAIL_SITE_OCCURRENCES, ROAD_SITE_SET_OUT, railSiteKey } from '../setout.ts';

const emptyProps = z.object({ transform: transformProp });
type EmptyProps = z.output<typeof emptyProps>;
type EmptyInput = z.input<typeof emptyProps>;

/** Root authored infrastructure Model with one road and two repeated rail bridges. */
export const InfraBridge = family<EmptyProps, EmptyInput>(
  'InfraBridge',
  ({ transform }) =>
    el('Group', { transform: transform ?? [] }, [
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
    ]),
  { props: emptyProps }
);
