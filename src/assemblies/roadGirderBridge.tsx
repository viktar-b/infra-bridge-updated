/** @jsxImportSource brepjs-families */

import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { ROAD_BRIDGE_SET_OUT } from '../setout.ts';
import { placement, spatialGroup, transformProp } from '../placement.ts';
import { RoadApproach } from './roadApproach.tsx';
import { RoadDeck } from './roadDeck.tsx';
import { RoadSubstructure } from './roadSubstructure.tsx';
import { RoadSuperstructure } from './roadSuperstructure.tsx';

const emptyProps = z.object({ transform: transformProp });
type EmptyProps = z.output<typeof emptyProps>;
type EmptyInput = z.input<typeof emptyProps>;

const semantics = civilSemantics({
    kind: 'facility',
    category: 'bridge',
    role: 'girder',
    composition: 'element',
    properties: { name: 'Road river bridge' },
  });

/** Complete keyed road-girder bridge hierarchy around one civil set-out Datum. */
export const RoadGirderBridge = family<EmptyProps, EmptyInput>(
  'RoadGirderBridge',
  ({ transform }) =>
    spatialGroup(transform, [
      <RoadSubstructure key="substructure" />,
      <RoadSuperstructure
        key="superstructure"
        girderLength={ROAD_BRIDGE_SET_OUT.mainGirders.dimensions.length}
        girderWidth={ROAD_BRIDGE_SET_OUT.mainGirders.dimensions.width}
        girderDepth={ROAD_BRIDGE_SET_OUT.mainGirders.dimensions.depth}
      />,
      <RoadDeck
        key="deck"
        {...ROAD_BRIDGE_SET_OUT.deck.dimensions}
        {...ROAD_BRIDGE_SET_OUT.deck.railing}
      />,
      ...ROAD_BRIDGE_SET_OUT.approaches.occurrences.map(({ key, side, origin, bearingDegrees }) => (
        <RoadApproach
          key={key}
          transform={placement(origin, bearingDegrees)}
          side={side}
          slopeDegrees={ROAD_BRIDGE_SET_OUT.approaches.slopeDegrees}
          slabLength={ROAD_BRIDGE_SET_OUT.approaches.dimensions.length}
          slabWidth={ROAD_BRIDGE_SET_OUT.approaches.dimensions.width}
          slabThickness={ROAD_BRIDGE_SET_OUT.approaches.dimensions.thickness}
        />
      )),
    ]),
  { props: emptyProps, semantics }
);
