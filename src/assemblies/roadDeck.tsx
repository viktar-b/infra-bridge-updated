/** @jsxImportSource brepjs-families */

import { civilSemantics, el, family } from 'brepjs-families';
import { z } from 'zod';
import { BridgeDeck } from '../families/bridgeDeck.tsx';
import { placement, transformProp } from '../placement.ts';
import { RoadRailing, roadRailingPostProfileSchema } from '../families/roadRailing.tsx';
import { MATERIALS } from '../materials.ts';
import { roadDeckSetOut } from '../setout.ts';

const roadDeckProps = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  slabThickness: z.number().positive(),
  setoutInset: z.number().nonnegative(),
  railWidth: z.number().positive(),
  railHeight: z.number().positive(),
  upperRailBase: z.number(),
  postPitch: z.number().positive(),
  postThickness: z.number().positive(),
  postRunIn: z.number().nonnegative(),
  postRunOut: z.number().nonnegative(),
  postProfile: roadRailingPostProfileSchema,
  name: z.string().trim().min(1).default('Road bridge deck'),
  transform: transformProp,
});

export type RoadDeckProps = z.output<typeof roadDeckProps>;
export type RoadDeckInput = z.input<typeof roadDeckProps>;

function semantics({ name }: RoadDeckProps) {
  return civilSemantics({
    kind: 'spatial-part',
    category: 'bridge-part',
    role: 'deck',
    composition: 'element',
    subdivision: 'regional',
    properties: { name: name },
  });
}

/** Deck slab and both keyed edge guardrails around the bridge control Datum. */
export const RoadDeck = family<RoadDeckProps, RoadDeckInput>(
  'RoadDeck',
  ({
    length,
    width,
    slabThickness,
    setoutInset,
    railWidth,
    railHeight,
    upperRailBase,
    postPitch,
    postThickness,
    postRunIn,
    postRunOut,
    postProfile,
    transform,
  }) => {
    const setOut = roadDeckSetOut({ length, width, slabThickness, setoutInset });
    const railingProps = {
      length,
      setoutInset,
      railWidth,
      railHeight,
      lowerRailBase: -slabThickness,
      upperRailBase,
      postPitch,
      postThickness,
      postRunIn,
      postRunOut,
      postProfile,
      material: MATERIALS.bridgeTimber,
    } as const;
    return el('Group', { transform: transform ?? [] }, [
      <BridgeDeck
        key="bridge-deck"
        transform={placement(setOut.slab.origin, setOut.slab.bearingDegrees)}
        length={length}
        width={width}
        thickness={slabThickness}
        setoutInset={setoutInset}
        material={MATERIALS.bridgeTimber}
        name="Road river bridge - bridge deck"
      />,
      ...setOut.railingOccurrences.map(({ key, origin, bearingDegrees, longitudinalSide }) => (
        <RoadRailing
          key={key}
          transform={placement(origin, bearingDegrees)}
          longitudinalSide={longitudinalSide}
          {...railingProps}
        />
      )),
    ]);
  },
  { props: roadDeckProps, semantics }
);
