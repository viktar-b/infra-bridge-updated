import { familiesToBim, type FamiliesToBimOptions } from 'brepjs-bim';
import type { ResolvedElement } from 'brepjs-families';
import { PROJECT_SPEC } from '../exportConfig.ts';

function isCivilSite(element: ResolvedElement): boolean {
  return element.semantics?.kind === 'site';
}

export function flattenNestedSitesForProjection(root: ResolvedElement): ResolvedElement {
  if (root.semantics?.kind !== 'site') return root;
  const siteChildren = root.children.filter(isCivilSite);
  if (siteChildren.length === 0) return root;

  const projectKeyPath = root.keyPath;
  const environment: ResolvedElement = {
    ...root,
    keyPath: `${projectKeyPath}/environment`,
    children: root.children.filter((child) => !isCivilSite(child)),
  };

  return {
    type: 'Group',
    archetype: undefined,
    semantics: undefined,
    keyPath: projectKeyPath,
    keyed: true,
    geometry: root.geometry,
    localTransforms: [],
    props: {},
    attributes: {},
    relationships: [],
    children: [environment, ...siteChildren],
  };
}

export function projectInfraBridge(
  root: ResolvedElement,
  evaluators: Pick<FamiliesToBimOptions, 'bodyEvaluator' | 'proxyEvaluator'>
) {
  return familiesToBim(flattenNestedSitesForProjection(root), {
    project: PROJECT_SPEC,
    ...evaluators,
  });
}
