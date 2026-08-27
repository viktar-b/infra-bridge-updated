/** @jsxImportSource brepjs-families */

import { civilSemantics, family, tRotate, tTranslate } from 'brepjs-families';
import { z } from 'zod';
import { ApproachSlab } from '../families/approachSlab.tsx';
import { MATERIALS } from '../materials.ts';
import { placement, spatialGroup, transformProp } from '../placement.ts';
import { ROAD_BRIDGE_SET_OUT } from '../setout.ts';
import { RoadAbutment } from './roadAbutment.tsx';

const roadApproachProps = z.object({
  side: z.enum(['start', 'end']),
  slopeDegrees: z.number().positive(),
  slabLength: z.number().positive(),
  slabWidth: z.number().positive(),
  slabThickness: z.number().positive(),
  name: z.string().trim().min(1).default('Road bridge approach'),
  transform: transformProp,
});

export type RoadApproachProps = z.output<typeof roadApproachProps>;
export type RoadApproachInput = z.input<typeof roadApproachProps>;

function semantics(props: RoadApproachProps) {
  return civilSemantics({
    kind: 'spatial-part',
    category: 'bridge-part',
    role: 'surface-structure',
    composition: 'element',
    subdivision: 'longitudinal',
    properties: { name: props.name },
  });
}

/** One pitched approach slab and its nested abutment BridgePart. */
export const RoadApproach = family<RoadApproachProps, RoadApproachInput>(
  'RoadApproach',
  ({ side, slopeDegrees, slabLength, slabWidth, slabThickness, transform }) => {
    const sign = side === 'start' ? 1 : -1;
    const structuralSide = side === 'start' ? 'negative' : 'positive';
    const { slab, abutment } = ROAD_BRIDGE_SET_OUT.approaches;
    return spatialGroup(transform, [
      <ApproachSlab
        key="approach-slab"
        transform={[
          tRotate(90),
          tRotate(-sign * slopeDegrees, { axis: [1, 0, 0] }),
          tTranslate([slab.xOffset, sign * slab.runFromDeckEnd, slab.elevation]),
        ]}
        length={slabLength}
        width={slabWidth}
        thickness={slabThickness}
        longitudinalSide={structuralSide}
        transverseSide="negative"
        material={MATERIALS.prefabricatedConcrete}
        name="Road bridge - approach slab"
      />,
      <RoadAbutment
        key="abutment"
        transform={placement([
          abutment.xOffset,
          sign * abutment.runFromDeckEnd,
          abutment.elevation,
        ])}
        transverseSide={structuralSide}
        length={ROAD_BRIDGE_SET_OUT.abutment.length}
        width={ROAD_BRIDGE_SET_OUT.abutment.width}
        bearingInset={ROAD_BRIDGE_SET_OUT.abutment.bearingInset}
        bearingSeatHeight={ROAD_BRIDGE_SET_OUT.abutment.bearingSeatHeight}
        backHeight={ROAD_BRIDGE_SET_OUT.abutment.backHeight}
        material={MATERIALS.reinforcedConcrete}
      />,
    ]);
  },
  { props: roadApproachProps, semantics }
);
