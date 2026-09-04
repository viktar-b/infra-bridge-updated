/** @jsxImportSource brepjs-families */

import { civilSemantics, family } from 'brepjs-families';
import { z } from 'zod';
import { spatialGroup, transformProp } from '../placement.ts';

export const emptyCivilSiteProps = z.object({
  name: z.string().trim().min(1),
  transform: transformProp,
});

export type EmptyCivilSiteProps = z.output<typeof emptyCivilSiteProps>;
export type EmptyCivilSiteInput = z.input<typeof emptyCivilSiteProps>;

function semantics({ name }: EmptyCivilSiteProps) {
  return civilSemantics({
    kind: 'site',
    category: 'site',
    role: 'transport-site',
    composition: 'partial',
    properties: { name },
  });
}

/** PARTIAL civil Site with Empty geometry and no products. */
export const EmptyCivilSite = family<EmptyCivilSiteProps, EmptyCivilSiteInput>(
  'EmptyCivilSite',
  ({ transform }) => spatialGroup(transform, []),
  { props: emptyCivilSiteProps, semantics }
);
