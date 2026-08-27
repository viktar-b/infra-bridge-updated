/** @jsxImportSource brepjs-families */

import { civilSemantics, el, family } from 'brepjs-families';
import { z } from 'zod';
import { RAIL_BRIDGE_SET_OUT } from '../setout.ts';
import { placement, transformProp } from '../placement.ts';
import { RailPier } from './railPier.tsx';

const railSubstructureProps = z.object({
  name: z.string().trim().min(1).default('Rail bridge substructure'),
  transform: transformProp,
});

export type RailSubstructureProps = z.output<typeof railSubstructureProps>;
export type RailSubstructureInput = z.input<typeof railSubstructureProps>;

function semantics(props: RailSubstructureProps) {
  return civilSemantics({
    kind: 'spatial-part',
    category: 'bridge-part',
    role: 'substructure',
    composition: 'element',
    subdivision: 'regional',
    properties: { name: props.name },
  });
}

/** Two explicit rail-pier BridgeParts around one substructure frame. */
export const RailSubstructure = family<RailSubstructureProps, RailSubstructureInput>(
  'RailSubstructure',
  ({ transform }) => {
    return el('Group', { transform: transform ?? [] },
      RAIL_BRIDGE_SET_OUT.piers.occurrences.map(({ key, origin }) => (
        <RailPier
          key={key}
          transform={placement(origin)}
          stemLongitudinalWidth={RAIL_BRIDGE_SET_OUT.piers.stem.longitudinalWidth}
          stemTransverseLength={RAIL_BRIDGE_SET_OUT.piers.stem.transverseLength}
          stemHeight={RAIL_BRIDGE_SET_OUT.piers.stem.height}
          footingLength={RAIL_BRIDGE_SET_OUT.piers.footing.length}
          footingWidth={RAIL_BRIDGE_SET_OUT.piers.footing.width}
          footingThickness={RAIL_BRIDGE_SET_OUT.piers.footing.thickness}
          footingBearingDegrees={RAIL_BRIDGE_SET_OUT.piers.footing.bearingFromStemDegrees}
        />
      ))
    );
  },
  { props: railSubstructureProps, semantics }
);
