/** @jsxImportSource brepjs-families */

import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { spatialGroup, transformProp } from '../placement.ts';
import { RAIL_SITE_OCCURRENCES, railBridgeKey, type RailSiteOccurrenceKey } from '../setout.ts';
import { RailArchBridge } from './railArchBridge.tsx';

const railSiteOccurrenceKeys = RAIL_SITE_OCCURRENCES.map(({ occurrenceKey }) => occurrenceKey) as [
  RailSiteOccurrenceKey,
  ...RailSiteOccurrenceKey[],
];

const railSiteProps = z.object({
  occurrenceKey: z.enum(railSiteOccurrenceKeys),
  bridgeName: z.string().trim().min(1).default('Rail bridge'),
  siteName: z.string().trim().min(1),
  transform: transformProp,
});

export type RailSiteProps = z.output<typeof railSiteProps>;
export type RailSiteInput = z.input<typeof railSiteProps>;

function semantics({ siteName }: RailSiteProps) {
  return civilSemantics({
    kind: 'site',
    category: 'site',
    role: 'transport-site',
    composition: 'partial',
    properties: { name: siteName },
  });
}

/** Parameterized civil Site containing one keyed rail-arch Bridge occurrence. */
export const RailSite = family<RailSiteProps, RailSiteInput>(
  'RailSite',
  ({ occurrenceKey, bridgeName, transform }) =>
    spatialGroup(transform, [
      <RailArchBridge key={railBridgeKey(occurrenceKey)} name={bridgeName} />,
    ]),
  { props: railSiteProps, semantics }
);
