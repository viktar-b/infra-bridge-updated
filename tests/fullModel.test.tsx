/** @jsxImportSource brepjs-families */

import { beforeAll, describe, expect, it } from 'vitest';
import { csg, init, unwrap } from 'brepjs';
import { familiesToBim, toIfc } from 'brepjs-bim';
import { civilSemantics, el, family, resolve, tTranslate, type ResolvedElement } from 'brepjs-families';
import { Footing } from '../src/families/footing.tsx';
import { MATERIALS } from '../src/materials.ts';
import { buildInfraBridge } from '../src/main.tsx';
import { RAIL_SITE_OCCURRENCES, railBridgeKey, railSiteKey } from '../src/setout.ts';

beforeAll(async () => {
  await init();
}, 120_000);

describe('complete declarative infrastructure bridge model', () => {
  it('authors the complete hierarchy with typed civil semantics', async () => {
    const nodes = flatten(resolve(await buildInfraBridge()));
    const sites = nodes.filter(({ semantics }) => semantics?.kind === 'site');
    const facilities = nodes.filter(({ semantics }) => semantics?.kind === 'facility');
    const parts = nodes.filter(({ semantics }) => semantics?.kind === 'spatial-part');
    const products = nodes.filter(({ semantics }) => semantics?.kind === 'product');

    expect(sites).toHaveLength(3);
    expect(
      sites.every(
        ({ semantics }) =>
          semantics?.kind === 'site' &&
          'category' in semantics &&
          semantics.category === 'site' &&
          semantics.role === 'transport-site' &&
          semantics.composition === 'element'
      )
    ).toBe(true);
    expect(facilities).toHaveLength(3);
    expect(
      facilities.every(
        ({ semantics }) =>
          semantics?.kind === 'facility' &&
          'category' in semantics &&
          semantics.category === 'bridge' &&
          semantics.composition === 'element'
      )
    ).toBe(true);
    expect(parts).toHaveLength(18);
    expect(
      parts.every(
        ({ semantics }) =>
          semantics?.kind === 'spatial-part' &&
          'category' in semantics &&
          semantics.category === 'bridge-part' &&
          semantics.composition === 'element' &&
          semantics.subdivision !== undefined &&
          ['longitudinal', 'vertical', 'regional'].includes(semantics.subdivision)
      )
    ).toBe(true);
    expect(products).toHaveLength(47);
    expect(categoryCounts(products.map(({ semantics }) => semanticCategory(semantics)))).toEqual({
      beam: 8,
      column: 7,
      'earthworks-fill': 4,
      footing: 7,
      member: 8,
      railing: 2,
      sign: 4,
      slab: 3,
      wall: 4,
    });
    expect(
      products.every(
        ({ semantics }) =>
          semantics?.kind === 'product' &&
          'category' in semantics &&
          'dimensionsMm' in semantics &&
          semantics.material.length > 0 &&
          ['length', 'width', 'height'].every((key) => (semantics.dimensionsMm[key] ?? 0) > 0)
      )
    ).toBe(true);
  });

  it('builds rail Site occurrences directly from the authored set-out table', async () => {
    const root = resolve(await buildInfraBridge());
    const railSites = root.children.filter(({ type }) => type === 'RailSite');

    expect(
      railSites.map(({ keyPath, localTransforms, semantics, children }) => ({
        siteKey: keyPath.slice(keyPath.lastIndexOf('/') + 1),
        siteName: semantics?.properties?.['name'],
        origin: localOriginFrom(localTransforms),
        bearing: localXAxisFrom(localTransforms),
        bridgeKey: firstChildLocalKey(children),
      }))
    ).toEqual(
      RAIL_SITE_OCCURRENCES.map(({ occurrenceKey, siteName, origin, bearingDegrees }) => ({
        siteKey: railSiteKey(occurrenceKey),
        siteName,
        origin,
        bearing: [
          Math.cos((bearingDegrees * Math.PI) / 180),
          Math.sin((bearingDegrees * Math.PI) / 180),
          0,
        ],
        bridgeKey: railBridgeKey(occurrenceKey),
      }))
    );
  });

  it('resolves exactly three Bridges, eighteen BridgeParts, and 47 scoped products', async () => {
    const root = resolve(await buildInfraBridge());
    const nodes = flatten(root);
    expect(root).toMatchObject({
      type: 'InfraBridge',
      keyPath: 'infra-bridge',
    });
    expect(root.semantics).toBeUndefined();
    expect(nodes.filter(({ semantics }) => semantics?.kind === 'site')).toHaveLength(3);
    expect(nodes.filter(({ semantics }) => semantics?.kind === 'facility')).toHaveLength(3);
    expect(nodes.filter(({ semantics }) => semantics?.kind === 'spatial-part')).toHaveLength(18);
    expect(productNodes(nodes)).toHaveLength(47);

    const railBridges = nodes.filter(({ semantics }) => semantics?.kind === 'facility').slice(1);
    expect(railBridges.map(({ type }) => type)).toEqual(['RailArchBridge', 'RailArchBridge']);
    expect(new Set(nodes.map(({ keyPath }) => keyPath)).size).toBe(nodes.length);
  });

  it('leaves rotated civil sites to familiesToBim translation-only spatial rules', async () => {
    const root = resolve(await buildInfraBridge());
    using evaluator = new csg.Evaluator();
    const result = familiesToBim(root, {
      project: { name: 'infra-bridge', projectId: 'infra-bridge' },
      bodyEvaluator: evaluator,
      proxyEvaluator: evaluator,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('FAMILIES_UNSUPPORTED_TRANSFORM');
    expect(result.error.message).toContain('infra-bridge/road-site');
  });

  it('exports a translation-only civil tree through familiesToBim', async () => {
    const AxisAlignedBridgePart = family(
      'AxisAlignedBridgePart',
      () =>
        el('Group', {}, [
          <Footing
            key="footing"
            transform={[tTranslate([100, 0, 0])]}
            length={1_000}
            width={800}
            thickness={400}
            material={MATERIALS.reinforcedConcrete}
          />,
        ]),
      {
        semantics: civilSemantics({
          kind: 'spatial-part',
          category: 'bridge-part',
          role: 'pier',
          composition: 'element',
          subdivision: 'vertical',
          properties: { name: 'Axis-aligned pier' },
        }),
      }
    );
    const AxisAlignedBridge = family(
      'AxisAlignedBridge',
      () => el('Group', {}, [<AxisAlignedBridgePart key="part" />]),
      {
        semantics: civilSemantics({
          kind: 'facility',
          category: 'bridge',
          role: 'girder',
          composition: 'element',
          properties: { name: 'Axis-aligned bridge' },
        }),
      }
    );
    const AxisAlignedSite = family(
      'AxisAlignedSite',
      () => el('Group', {}, [<AxisAlignedBridge key="bridge" />]),
      {
        semantics: civilSemantics({
          kind: 'site',
          category: 'site',
          role: 'transport-site',
          composition: 'element',
          properties: { name: 'Axis-aligned site' },
        }),
      }
    );

    const root = resolve(<AxisAlignedSite key="site" />);
    using evaluator = new csg.Evaluator();
    const projected = unwrap(
      familiesToBim(root, {
        project: { name: 'infra-bridge', projectId: 'infra-bridge' },
        bodyEvaluator: evaluator,
      })
    );
    using bim = projected.model;
    expect(projected.proxied).toEqual([]);
    expect(bim.getBridges()).toHaveLength(1);
    expect(bim.getBridgeParts()).toHaveLength(1);
    expect(bim.getFootings()).toHaveLength(1);
    const bytes = unwrap(
      await toIfc(bim, {
        applicationName: 'infra-bridge',
        applicationVersion: '0',
        ifcSchema: 'IFC4X3',
      })
    );
    expect(bytes.byteLength).toBeGreaterThan(0);
  }, 60_000);
});

function flatten(root: ResolvedElement): readonly ResolvedElement[] {
  return [root, ...root.children.flatMap(flatten)];
}

function productNodes(nodes: readonly ResolvedElement[]): readonly ResolvedElement[] {
  return nodes.filter(({ semantics }) => semantics?.kind === 'product');
}

function semanticCategory(semantics: ResolvedElement['semantics']): string {
  return semantics !== undefined && 'category' in semantics ? semantics.category : 'missing';
}

function firstChildLocalKey(children: readonly ResolvedElement[]): string | undefined {
  const child = children[0];
  return child?.keyPath.slice(child.keyPath.lastIndexOf('/') + 1);
}

function localOriginFrom(
  ops: ResolvedElement['localTransforms']
): readonly [number, number, number] {
  const op = ops.find((item) => item.op === 'translate');
  return op?.op === 'translate' ? op.v : [0, 0, 0];
}

function localXAxisFrom(
  ops: ResolvedElement['localTransforms']
): readonly [number, number, number] {
  const op = ops.find((item) => item.op === 'rotate');
  const degrees = op?.op === 'rotate' ? op.angleDeg : 0;
  const radians = (degrees * Math.PI) / 180;
  return [Math.cos(radians), Math.sin(radians), 0];
}

function categoryCounts(categories: readonly string[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const category of categories) counts[category] = (counts[category] ?? 0) + 1;
  return counts;
}
