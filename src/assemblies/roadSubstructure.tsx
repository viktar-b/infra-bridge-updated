/** @jsxImportSource brepjs-families */

import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { MATERIALS } from '../materials.ts';
import { placement, spatialGroup, transformProp } from '../placement.ts';
import { ROAD_BRIDGE_SET_OUT } from '../setout.ts';
import { RoadPier } from './roadPier.tsx';

const emptyProps = z.object({ transform: transformProp });
type EmptyProps = z.output<typeof emptyProps>;
type EmptyInput = z.input<typeof emptyProps>;

const semantics = civilSemantics({
    kind: 'spatial-part',
    category: 'bridge-part',
    role: 'substructure',
    composition: 'element',
    subdivision: 'regional',
    properties: { name: 'Road bridge substructure' },
  });

/** Three keyed road piers; outer cross-girders face inward toward the deck. */
export const RoadSubstructure = family<EmptyProps, EmptyInput>(
  'RoadSubstructure',
  ({ transform }) => {
    const pierMaterials = {
      concreteMaterial: MATERIALS.reinforcedConcrete,
      stemMaterial: MATERIALS.graniteMasonry,
      girderMaterial: MATERIALS.bridgeTimber,
    } as const;

    return spatialGroup(
      transform,
      ROAD_BRIDGE_SET_OUT.piers.occurrences.map(
        ({ key, origin, bearingDegrees, crossGirderSide }) => (
          <RoadPier
            key={key}
            transform={placement(origin, bearingDegrees)}
            crossGirderSide={crossGirderSide}
            footingLength={ROAD_BRIDGE_SET_OUT.piers.footing.length}
            footingWidth={ROAD_BRIDGE_SET_OUT.piers.footing.width}
            footingThickness={ROAD_BRIDGE_SET_OUT.piers.footing.thickness}
            stemLength={ROAD_BRIDGE_SET_OUT.piers.stem.length}
            stemWidth={ROAD_BRIDGE_SET_OUT.piers.stem.width}
            stemHeight={ROAD_BRIDGE_SET_OUT.piers.stem.height}
            capOffset={ROAD_BRIDGE_SET_OUT.piers.stem.capOffset}
            crossGirderLength={ROAD_BRIDGE_SET_OUT.piers.crossGirder.length}
            crossGirderWidth={ROAD_BRIDGE_SET_OUT.piers.crossGirder.width}
            crossGirderDepth={ROAD_BRIDGE_SET_OUT.piers.crossGirder.depth}
            crossGirderSetout={ROAD_BRIDGE_SET_OUT.piers.crossGirder.setout}
            crossGirderInset={ROAD_BRIDGE_SET_OUT.piers.crossGirder.inset}
            {...pierMaterials}
          />
        )
      )
    );
  },
  { props: emptyProps, semantics }
);
