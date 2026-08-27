/** @jsxImportSource brepjs-families */

import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { placement, spatialGroup, transformProp } from '../placement.ts';
import { RAIL_BRIDGE_SET_OUT } from '../setout.ts';
import { RailArchSuperstructure } from './railArchSuperstructure.tsx';
import { RailSubstructure } from './railSubstructure.tsx';

const railArchBridgeProps = z.object({
  name: z.string().trim().min(1).default('Rail bridge'),
  transform: transformProp,
});

export type RailArchBridgeProps = z.output<typeof railArchBridgeProps>;
export type RailArchBridgeInput = z.input<typeof railArchBridgeProps>;

function semantics(props: RailArchBridgeProps) {
  return civilSemantics({
    kind: 'facility',
    category: 'bridge',
    role: 'arched',
    composition: 'element',
    properties: { name: props.name },
  });
}

/** One parameterized rail-arch Bridge definition, intended for repeated instantiation. */
export const RailArchBridge = family<RailArchBridgeProps, RailArchBridgeInput>(
  'RailArchBridge',
  ({ transform }) => {
    const componentTransform = placement([0, 0, 0], RAIL_BRIDGE_SET_OUT.componentBearingDegrees);
    return spatialGroup(transform, [
      <RailArchSuperstructure
        key="superstructure"
        transform={componentTransform}
        {...RAIL_BRIDGE_SET_OUT.superstructure}
        signWidth={RAIL_BRIDGE_SET_OUT.superstructure.sign.width}
        signHeight={RAIL_BRIDGE_SET_OUT.superstructure.sign.height}
        signPlateDepth={RAIL_BRIDGE_SET_OUT.superstructure.sign.plateDepth}
        signReliefDepth={RAIL_BRIDGE_SET_OUT.superstructure.sign.reliefDepth}
      />,
      <RailSubstructure key="substructure" transform={componentTransform} />,
    ]);
  },
  { props: railArchBridgeProps, semantics }
);
