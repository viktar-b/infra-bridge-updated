/** @jsxImportSource brepjs-families */

import { beforeAll, describe, expect, it } from 'vitest';
import { csg, getBounds, init, isShape3D, measureVolume, unwrap, type Bounds3D } from 'brepjs';
import { disposeImportedModel, familiesToBim, fromIfc, placedSolids, toIfc, type BimModel } from 'brepjs-bim';
import {
  civilSemantics,
  el,
  evaluateModel,
  family,
  resolve,
  tRotate,
  tTranslate,
  type ResolvedElement,
} from 'brepjs-families';
import { flattenNestedSitesForProjection, projectInfraBridge } from '../src/export/projectInfraBridge.ts';
import { Footing } from '../src/families/footing.tsx';
import { MATERIALS } from '../src/materials.ts';
import { IFC_META, PROJECT_SPEC } from '../src/exportConfig.ts';
import { InfraBridge } from '../src/model/infraBridge.tsx';
import { buildInfraBridge } from '../src/main.tsx';
import { EMPTY_CIVIL_SITES, RAIL_SITE_OCCURRENCES, ROAD_SITE_SET_OUT, railBridgeKey, railSiteKey } from '../src/setout.ts';

beforeAll(async () => {
  await init();
}, 120_000);

describe('complete declarative infrastructure bridge model', () => {
  it('authors the complete hierarchy with typed civil semantics', async () => {
    const root = resolve(await buildInfraBridge());
    const nodes = flatten(root);
    const sites = nodes.filter(({ semantics }) => semantics?.kind === 'site');
    const facilities = nodes.filter(({ semantics }) => semantics?.kind === 'facility');
    const parts = nodes.filter(({ semantics }) => semantics?.kind === 'spatial-part');
    const products = nodes.filter(({ semantics }) => semantics?.kind === 'product');

    expect(sites).toHaveLength(6);
    expect(
      sites.every(
        ({ semantics }) =>
          semantics?.kind === 'site' &&
          'category' in semantics &&
          semantics.category === 'site' &&
          semantics.role === 'transport-site'
      )
    ).toBe(true);
    expect(root.semantics).toMatchObject({
      kind: 'site',
      category: 'site',
      role: 'transport-site',
      composition: 'collection',
      properties: { name: 'environment - site' },
    });
    expect(
      root.children.every(
        ({ semantics }) =>
          semantics?.kind === 'site' &&
          'composition' in semantics &&
          semantics.composition === 'partial'
      )
    ).toBe(true);
    expect(root.children.map(({ type }) => type)).toEqual([
      'RoadSite',
      'RailSite',
      'RailSite',
      'EmptyCivilSite',
      'EmptyCivilSite',
    ]);
    const emptySites = root.children.filter(({ type }) => type === 'EmptyCivilSite');
    expect(
      emptySites.map(({ keyPath, semantics, children, geometry }) => ({
        key: keyPath.slice(keyPath.lastIndexOf('/') + 1),
        name: semantics?.properties?.['name'],
        childCount: children.length,
        geometry: geometry.kind,
        hasFacility: children.some((child) => child.semantics?.kind === 'facility'),
        hasProduct: children.some((child) => child.semantics?.kind === 'product'),
      }))
    ).toEqual([
      {
        key: EMPTY_CIVIL_SITES.parking.key,
        name: EMPTY_CIVIL_SITES.parking.name,
        childCount: 0,
        geometry: 'Empty',
        hasFacility: false,
        hasProduct: false,
      },
      {
        key: EMPTY_CIVIL_SITES.road.key,
        name: EMPTY_CIVIL_SITES.road.name,
        childCount: 0,
        geometry: 'Empty',
        hasFacility: false,
        hasProduct: false,
      },
    ]);
    expect(
      products.every(
        ({ keyPath }) =>
          keyPath.startsWith('infra-bridge/road-site') ||
          keyPath.startsWith('infra-bridge/rail-site-0')
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
          semantics.subdivision !== undefined &&
          ['longitudinal', 'vertical', 'regional'].includes(semantics.subdivision)
      )
    ).toBe(true);
    expect(
      categoryCounts(
        parts.map(({ type, semantics }) =>
          semantics !== undefined && 'composition' in semantics
            ? `${type}:${semantics.composition}`
            : type
        )
      )
    ).toEqual({
      'RailArchSuperstructure:element': 2,
      'RailPier:partial': 4,
      'RailSubstructure:collection': 2,
      'RoadAbutment:partial': 2,
      'RoadApproach:collection': 2,
      'RoadDeck:element': 1,
      'RoadPier:partial': 3,
      'RoadSubstructure:collection': 1,
      'RoadSuperstructure:element': 1,
    });
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
        bearingDegrees: localBearingFrom(localTransforms),
        bridgeKey: firstChildLocalKey(children),
        rotated: localTransforms.some((op) => op.op === 'rotate'),
      }))
    ).toEqual(
      RAIL_SITE_OCCURRENCES.map(({ occurrenceKey, siteName, origin, bearingDegrees }) => ({
        siteKey: railSiteKey(occurrenceKey),
        siteName,
        origin,
        bearingDegrees,
        bridgeKey: railBridgeKey(occurrenceKey),
        rotated: true,
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
    expect(root.semantics).toMatchObject({
      kind: 'site',
      category: 'site',
      role: 'transport-site',
      composition: 'collection',
      properties: { name: 'environment - site' },
    });
    expect(nodes.filter(({ semantics }) => semantics?.kind === 'site')).toHaveLength(6);
    expect(nodes.filter(({ semantics }) => semantics?.kind === 'facility')).toHaveLength(3);
    expect(nodes.filter(({ semantics }) => semantics?.kind === 'spatial-part')).toHaveLength(18);
    expect(productNodes(nodes)).toHaveLength(47);
    expect(nodes.some(({ type }) => type.endsWith('Kernel'))).toBe(false);

    const railBridges = nodes.filter(({ semantics }) => semantics?.kind === 'facility').slice(1);
    expect(railBridges.map(({ type }) => type)).toEqual(['RailArchBridge', 'RailArchBridge']);
    expect(new Set(nodes.map(({ keyPath }) => keyPath)).size).toBe(nodes.length);
  });

  it('lifts nested Sites to Project siblings for projection', async () => {
    const root = resolve(await buildInfraBridge());
    const flattened = flattenNestedSitesForProjection(root);
    expect(flattened).toMatchObject({
      type: 'Group',
      keyPath: 'infra-bridge',
      keyed: true,
    });
    expect(flattened.semantics).toBeUndefined();
    expect(flattened.children[0]).toMatchObject({
      type: 'InfraBridge',
      keyPath: 'infra-bridge/environment',
      semantics: {
        kind: 'site',
        composition: 'collection',
        properties: { name: 'environment - site' },
      },
    });
    expect(flattened.children[0]?.children).toEqual([]);
    expect(flattened.children.slice(1).map(({ keyPath, type }) => ({ keyPath, type }))).toEqual([
      { keyPath: 'infra-bridge/road-site', type: 'RoadSite' },
      { keyPath: 'infra-bridge/rail-site-01', type: 'RailSite' },
      { keyPath: 'infra-bridge/rail-site-02', type: 'RailSite' },
      { keyPath: 'infra-bridge/road-parking', type: 'EmptyCivilSite' },
      { keyPath: 'infra-bridge/road', type: 'EmptyCivilSite' },
    ]);
  });

  it('keeps the environment root pose on the projection wrapper', async () => {
    const root = resolve(
      InfraBridge({
        key: 'infra-bridge',
        transform: [tTranslate([1_000, 2_000, 3_000])],
      })
    );
    const flattened = flattenNestedSitesForProjection(root);
    expect(flattened.localTransforms).toEqual(root.localTransforms);
    expect(flattened.children[0]?.localTransforms).toEqual([]);

    using evaluator = new csg.Evaluator();
    const unmoved = projectFullModel(resolve(await buildInfraBridge()), evaluator);
    using unmovedModel = unmoved.model;
    const moved = projectFullModel(root, evaluator);
    using movedModel = moved.model;

    const unmovedOrigin = siteOrigin(unmovedModel, ROAD_SITE_SET_OUT.name);
    const movedOrigin = siteOrigin(movedModel, ROAD_SITE_SET_OUT.name);
    expect(unmovedOrigin).toEqual([17_320.508, 30_000, 0]);
    expect(movedOrigin).toEqual([18_320.508, 32_000, 3_000]);
  });

  it('rejects nested Sites under a collection Site until BREP-015', async () => {
    const root = resolve(await buildInfraBridge());
    using evaluator = new csg.Evaluator();
    const projected = familiesToBim(root, {
      project: PROJECT_SPEC,
      bodyEvaluator: evaluator,
      proxyEvaluator: evaluator,
    });
    expect(projected.ok).toBe(false);
    if (projected.ok) return;
    expect(projected.error.code).toBe('FAMILIES_INVALID_CIVIL_HIERARCHY');
  });

  it('exports the full authored tree through projectInfraBridge', async () => {
    const root = resolve(await buildInfraBridge());
    using evaluator = new csg.Evaluator();
    const projected = projectFullModel(root, evaluator);
    using bim = projected.model;
    expect(bim.getAllElements().filter(({ category }) => category === 'SITE')).toHaveLength(6);
    expect(bim.getBridges()).toHaveLength(3);
    expect(bim.getBridgeParts()).toHaveLength(18);
    expect(bim.getBeams()).toHaveLength(8);
    expect(bim.getColumns()).toHaveLength(7);
    expect(bim.getFootings()).toHaveLength(7);
    expect(bim.getSlabs()).toHaveLength(3);
    expect(bim.getWalls()).toHaveLength(4);
    expect(bim.getRailings()).toHaveLength(2);
    expect(bim.getEarthworksFills()).toHaveLength(4);
    expect(bim.getEarthworksFills().every(({ spec }) => spec.predefinedType === 'BACKFILL')).toBe(
      true
    );
    expect(
      categoryCounts(bim.getBridgeParts().map(({ spec }) => spec.compositionType ?? 'missing'))
    ).toEqual({ COMPLEX: 5, ELEMENT: 4, PARTIAL: 9 });
    expect(projected.proxied).toHaveLength(12);
    expect(projected.proxied.every(({ type }) => type === 'ArchSegment' || type === 'BridgeNameSign')).toBe(
      true
    );
    expect(
      flatten(root)
        .filter(
          ({ semantics }) =>
            semantics?.kind === 'site' ||
            semantics?.kind === 'facility' ||
            semantics?.kind === 'spatial-part'
        )
        .some(({ localTransforms }) => localTransforms.some((op) => op.op === 'rotate'))
    ).toBe(true);
    const bytes = unwrap(await toIfc(bim, IFC_META));
    expect(bytes.byteLength).toBeGreaterThan(10_000);
    const step = new TextDecoder('latin1').decode(bytes);
    expect(step).toContain('ViewDefinition [ReferenceView]');
    expect(step).not.toContain('ViewDefinition [ReferenceView_v1.2]');
    expect(step).toContain("IFCPROJECTEDCRS('EPSG:32760'");
    expect(step).toContain('729011.226');
    expect(step).toContain('9063960.608');
    expect(step).not.toMatch(/IFCBUILDINGELEMENTPROXY\([^;]*'geo-reference'/);
  }, 60_000);

  it('preserves both ApproachSlab dimensions and volumes through typed BIM projection', async () => {
    const root = resolve(await buildInfraBridge());
    const approachSlabs = flatten(root).filter(({ type }) => type === 'ApproachSlab');
    using evaluator = new csg.Evaluator();
    const evaluated = evaluateModel(root, evaluator, {}, { shapes: true });
    const projected = projectFullModel(root, evaluator);
    using bim = projected.model;

    expect(approachSlabs).toHaveLength(2);
    const projectedSlabs: Array<{
      readonly guid: string;
      readonly volumeMm3: number;
    }> = [];
    for (const approachSlab of approachSlabs) {
      const localId = projected.idByKeyPath.get(approachSlab.keyPath);
      expect(localId).toBeDefined();
      if (localId === undefined) continue;
      const slab = bim.getElement(localId);
      expect(slab?.category).toBe('SLAB');
      if (slab?.category !== 'SLAB') continue;
      expect(slab.spec).toMatchObject({
        length: approachSlab.props['length'],
        width: approachSlab.props['width'],
        thickness: approachSlab.props['thickness'],
        predefinedType: 'FLOOR',
      });

      const authoredShape = evaluated.byKeyPath.get(approachSlab.keyPath)?.shape;
      expect(authoredShape?.ok).toBe(true);
      if (authoredShape === undefined || !authoredShape.ok) continue;
      expect(isShape3D(authoredShape.value)).toBe(true);
      if (!isShape3D(authoredShape.value)) continue;
      const authoredVolume = unwrap(measureVolume(authoredShape.value));
      const projectedVolume = unwrap(measureVolume(slab.geometry));
      expect(projectedVolume).toBeCloseTo(authoredVolume, 3);
      projectedSlabs.push({
        guid: slab.guid,
        volumeMm3: projectedVolume,
      });
    }

    const bytes = unwrap(await toIfc(bim, IFC_META));
    const imported = unwrap(await fromIfc(bytes));
    try {
      expect(imported.diagnostics.issues.filter(({ severity }) => severity === 'error')).toEqual([]);
      for (const expected of projectedSlabs) {
        const slab = imported.elements.find(({ guid }) => guid === expected.guid);
        expect(slab?.category).toBe('SLAB');
        expect(slab?.geometry.fidelity).toBe('PARAMETRIC');
        if (slab === undefined) continue;
        const solid = slab.geometry.solid;
        expect(solid).not.toBeNull();
        if (solid === null) continue;
        expect(unwrap(measureVolume(solid))).toBeCloseTo(expected.volumeMm3, 3);
        const quantities = slab.psets.find(({ name }) => name === 'Qto_SlabBaseQuantities');
        expect(quantities?.properties['NetVolume']).toBeCloseTo(expected.volumeMm3 / 1e9, 9);
      }
    } finally {
      disposeImportedModel(imported);
    }
  }, 60_000);

  it('exports pitched ApproachSlab occurrences with authored tRotate', async () => {
    const root = resolve(await buildInfraBridge());
    const approachSlabs = flatten(root).filter(({ type }) => type === 'ApproachSlab');
    using evaluator = new csg.Evaluator();
    const projected = projectFullModel(root, evaluator);
    using bim = projected.model;

    expect(approachSlabs).toHaveLength(2);
    expect(
      approachSlabs.every(({ localTransforms }) =>
        localTransforms.some((op) => op.op === 'rotate')
      )
    ).toBe(true);
    for (const approachSlab of approachSlabs) {
      const localId = projected.idByKeyPath.get(approachSlab.keyPath);
      expect(localId).toBeDefined();
      if (localId === undefined) continue;
      expect(bim.getElement(localId)?.category).toBe('SLAB');
    }
  }, 60_000);

  it('preserves the pitched ApproachSlab upper-inner Datum through BIM projection', async () => {
    const root = resolve(await buildInfraBridge());
    const approachSlabs = flatten(root).filter(({ type }) => type === 'ApproachSlab');
    using evaluator = new csg.Evaluator();
    const evaluated = evaluateModel(root, evaluator, {}, { shapes: true });
    const projected = projectFullModel(root, evaluator);
    using bim = projected.model;

    expect(approachSlabs).toHaveLength(2);
    const roundTrip: Array<{
      readonly guid: string;
      readonly authoredBounds: readonly number[];
    }> = [];

    for (const approachSlab of approachSlabs) {
      const localId = projected.idByKeyPath.get(approachSlab.keyPath);
      expect(localId).toBeDefined();
      if (localId === undefined) continue;
      const slab = bim.getElement(localId);
      expect(slab?.category).toBe('SLAB');
      if (slab?.category !== 'SLAB') continue;

      const authoredShape = evaluated.byKeyPath.get(approachSlab.keyPath)?.shape;
      expect(authoredShape?.ok).toBe(true);
      if (authoredShape === undefined || !authoredShape.ok) continue;
      const authoredBounds = boundsTuple(getBounds(authoredShape.value));
      expect(slab.spec.axisX).not.toEqual([1, 0, 0]);
      roundTrip.push({ guid: slab.guid, authoredBounds });
    }

    expect(roundTrip[0]?.authoredBounds[0]).toBeCloseTo(10_021.783, 2);

    const bytes = unwrap(await toIfc(bim, IFC_META));
    const imported = unwrap(await fromIfc(bytes));
    try {
      expect(imported.diagnostics.issues.filter(({ severity }) => severity === 'error')).toEqual([]);
      for (const expected of roundTrip) {
        const slab = imported.elements.find(({ guid }) => guid === expected.guid);
        expect(slab?.category).toBe('SLAB');
        expect(slab?.geometry.fidelity).toBe('PARAMETRIC');
        const solid = slab?.geometry.solid;
        expect(solid).not.toBeNull();
        if (solid === null || solid === undefined) continue;
        expectTupleClose(
          boundsTuple(getBounds(solid)),
          expected.authoredBounds,
          2,
          `${expected.guid} IFC round-trip`
        );
      }
    } finally {
      disposeImportedModel(imported);
    }
  }, 60_000);

  it('preserves both signed abutment-support profiles through typed BIM projection', async () => {
    const root = resolve(await buildInfraBridge());
    const supportBeams = flatten(root).filter(({ type }) => type === 'AbutmentSupportBeam');
    using evaluator = new csg.Evaluator();
    const evaluated = evaluateModel(root, evaluator, {}, { shapes: true });
    const projected = projectFullModel(root, evaluator);
    using bim = projected.model;

    expect(supportBeams).toHaveLength(2);
    const profiles: unknown[] = [];
    const projectedBeams: Array<{ readonly guid: string; readonly volumeMm3: number }> = [];
    for (const supportBeam of supportBeams) {
      const localId = projected.idByKeyPath.get(supportBeam.keyPath);
      expect(localId).toBeDefined();
      if (localId === undefined) continue;
      const beam = bim.getElement(localId);
      expect(beam?.category).toBe('BEAM');
      if (beam?.category !== 'BEAM') continue;
      profiles.push(beam.spec.profile);
      expect(beam.spec.profile).toEqual(supportBeam.props['profile']);
      expect(beam.spec.origin).toEqual([0, 0, 0]);

      const authoredShape = evaluated.byKeyPath.get(supportBeam.keyPath)?.shape;
      expect(authoredShape?.ok).toBe(true);
      if (authoredShape === undefined || !authoredShape.ok) continue;
      expect(isShape3D(authoredShape.value)).toBe(true);
      if (!isShape3D(authoredShape.value)) continue;
      const projectedVolume = unwrap(measureVolume(beam.geometry));
      expect(projectedVolume).toBeCloseTo(unwrap(measureVolume(authoredShape.value)), 3);
      projectedBeams.push({ guid: beam.guid, volumeMm3: projectedVolume });
    }

    expect(profiles).toEqual([
      {
        kind: 'ARBITRARY_CLOSED',
        points: [
          [0, 0],
          [-195, 0],
          [-175, 20],
          [-175, 556.993],
          [0, 539.493],
        ],
      },
      {
        kind: 'ARBITRARY_CLOSED',
        points: [
          [0, 0],
          [195, 0],
          [175, 20],
          [175, 556.993],
          [0, 539.493],
        ],
      },
    ]);

    const bytes = unwrap(await toIfc(bim, IFC_META));
    const imported = unwrap(await fromIfc(bytes));
    try {
      expect(imported.diagnostics.issues.filter(({ severity }) => severity === 'error')).toEqual([]);
      for (const expected of projectedBeams) {
        const beam = imported.elements.find(({ guid }) => guid === expected.guid);
        expect(beam?.category).toBe('BEAM');
        expect(beam?.geometry.fidelity).toBe('PARAMETRIC');
        if (beam === undefined) continue;
        const solid = beam.geometry.solid;
        expect(solid).not.toBeNull();
        if (solid === null) continue;
        expect(unwrap(measureVolume(solid))).toBeCloseTo(expected.volumeMm3, 3);
        const quantities = beam.psets.find(({ name }) => name === 'Qto_BeamBaseQuantities');
        expect(quantities?.properties['NetVolume']).toBeCloseTo(expected.volumeMm3 / 1e9, 9);
      }
    } finally {
      disposeImportedModel(imported);
    }
  }, 60_000);

  it('preserves every remaining exact Family body through BIM projection', async () => {
    const expectedCategories = new Map<string, string>([
      ['ArchSegment', 'PROXY'],
      ['BridgeDeck', 'SLAB'],
      ['BridgeNameSign', 'PROXY'],
      ['CrossGirder', 'BEAM'],
      ['EarthFill', 'EARTHWORKS_FILL'],
      ['Footing', 'FOOTING'],
      ['MainGirder', 'BEAM'],
      ['PierStem', 'COLUMN'],
      ['RailPierStem', 'COLUMN'],
    ]);
    const root = resolve(await buildInfraBridge());
    const exactFamilies = flatten(root).filter(({ type }) => expectedCategories.has(type));
    using evaluator = new csg.Evaluator();
    const evaluated = evaluateModel(root, evaluator, {}, { shapes: true });
    const projected = projectFullModel(root, evaluator);
    using bim = projected.model;

    expect(exactFamilies).toHaveLength(37);
    for (const familyElement of exactFamilies) {
      const localId = projected.idByKeyPath.get(familyElement.keyPath);
      expect(localId).toBeDefined();
      if (localId === undefined) continue;
      const projectedElement = bim.getElement(localId);
      expect(projectedElement?.category).toBe(expectedCategories.get(familyElement.type));
      if (projectedElement === undefined || projectedElement === null) continue;
      if (projectedElement.category === 'CURTAIN_WALL') continue;

      const authoredShape = evaluated.byKeyPath.get(familyElement.keyPath)?.shape;
      expect(authoredShape?.ok).toBe(true);
      if (authoredShape === undefined || !authoredShape.ok || !isShape3D(authoredShape.value)) {
        continue;
      }
      const projectedShapes = unwrap(placedSolids(projectedElement));
      try {
        expect(projectedShapes.length).toBeGreaterThan(0);
        const projectedVolume = projectedShapes.reduce(
          (sum, shape) => sum + unwrap(measureVolume(shape)),
          0
        );
        expect(projectedVolume).toBeCloseTo(unwrap(measureVolume(authoredShape.value)), 3);
      } finally {
        for (const shape of projectedShapes) shape[Symbol.dispose]();
      }
    }
  }, 60_000);

  it('preserves the posted RoadRailing body through typed BIM projection', async () => {
    const root = resolve(await buildInfraBridge());
    const railings = flatten(root).filter(({ type }) => type === 'RoadRailing');
    using evaluator = new csg.Evaluator();
    const evaluated = evaluateModel(root, evaluator, {}, { shapes: true });
    const projected = projectFullModel(root, evaluator);
    using bim = projected.model;

    expect(railings).toHaveLength(2);
    const projectedRailings: Array<{ readonly guid: string; readonly volumeMm3: number }> = [];
    for (const railing of railings) {
      const localId = projected.idByKeyPath.get(railing.keyPath);
      expect(localId).toBeDefined();
      if (localId === undefined) continue;
      const projectedRailing = bim.getElement(localId);
      expect(projectedRailing?.category).toBe('RAILING');
      if (projectedRailing?.category !== 'RAILING') continue;
      expect(projectedRailing.spec.predefinedType).toBe('GUARDRAIL');
      expect(projectedRailing.spec.materialName).toBe(railing.props['material']);
      expect(projectedRailing.geometry.kind).toBe('EXACT');
      if (projectedRailing.geometry.kind !== 'EXACT') continue;
      expect(projectedRailing.geometry.solids.length).toBeGreaterThan(1);

      const authoredShape = evaluated.byKeyPath.get(railing.keyPath)?.shape;
      expect(authoredShape?.ok).toBe(true);
      if (authoredShape === undefined || !authoredShape.ok) continue;
      expect(isShape3D(authoredShape.value)).toBe(true);
      if (!isShape3D(authoredShape.value)) continue;
      const projectedShapes = unwrap(placedSolids(projectedRailing));
      try {
        expect(projectedShapes.length).toBeGreaterThan(1);
        const projectedVolume = projectedShapes.reduce(
          (sum, shape) => sum + unwrap(measureVolume(shape)),
          0
        );
        expect(projectedVolume).toBeCloseTo(unwrap(measureVolume(authoredShape.value)), 3);
        projectedRailings.push({ guid: projectedRailing.guid, volumeMm3: projectedVolume });
      } finally {
        for (const shape of projectedShapes) shape[Symbol.dispose]();
      }
    }

    const bytes = unwrap(await toIfc(bim, IFC_META));
    const imported = unwrap(await fromIfc(bytes));
    try {
      expect(imported.diagnostics.issues.filter(({ severity }) => severity === 'error')).toEqual([]);
      for (const expected of projectedRailings) {
        const railing = imported.elements.find(({ guid }) => guid === expected.guid);
        expect(railing?.category).toBe('RAILING');
        expect(railing?.predefinedType).toBe('GUARDRAIL');
        expect(railing?.geometry.fidelity).toBe('TESSELLATED_MANIFOLD');
        expect(railing?.geometry.completeness).toBe('COMPLETE');
        expect(railing?.geometry.solids.length).toBeGreaterThan(1);
        expect(railing?.geometry.volumeMm3).not.toBeNull();
        if (railing?.geometry.volumeMm3 === null || railing?.geometry.volumeMm3 === undefined) {
          continue;
        }
        expect(railing.geometry.volumeMm3 / expected.volumeMm3).toBeCloseTo(1, 5);
        expect(railing?.material?.name).toBe(MATERIALS.bridgeTimber);
      }
    } finally {
      disposeImportedModel(imported);
    }
  }, 60_000);

  it('preserves the opened SpandrelWall body through typed BIM projection', async () => {
    const root = resolve(await buildInfraBridge());
    const walls = flatten(root).filter(({ type }) => type === 'SpandrelWall');
    using evaluator = new csg.Evaluator();
    const evaluated = evaluateModel(root, evaluator, {}, { shapes: true });
    const projected = projectFullModel(root, evaluator);
    using bim = projected.model;

    expect(walls).toHaveLength(4);
    const projectedWalls: Array<{ readonly guid: string; readonly volumeMm3: number }> = [];
    for (const wall of walls) {
      const localId = projected.idByKeyPath.get(wall.keyPath);
      expect(localId).toBeDefined();
      if (localId === undefined) continue;
      const projectedWall = bim.getElement(localId);
      expect(projectedWall?.category).toBe('WALL');
      if (projectedWall?.category !== 'WALL') continue;
      expect(projectedWall.spec.materialName).toBe(wall.props['material']);
      expect(projectedWall.geometry.kind).toBe('EXACT');

      const authoredShape = evaluated.byKeyPath.get(wall.keyPath)?.shape;
      expect(authoredShape?.ok).toBe(true);
      if (authoredShape === undefined || !authoredShape.ok) continue;
      expect(isShape3D(authoredShape.value)).toBe(true);
      if (!isShape3D(authoredShape.value)) continue;
      const projectedShapes = unwrap(placedSolids(projectedWall));
      try {
        expect(projectedShapes.length).toBeGreaterThan(0);
        const projectedVolume = projectedShapes.reduce(
          (sum, shape) => sum + unwrap(measureVolume(shape)),
          0
        );
        expect(projectedVolume).toBeCloseTo(unwrap(measureVolume(authoredShape.value)), 3);
        projectedWalls.push({ guid: projectedWall.guid, volumeMm3: projectedVolume });
      } finally {
        for (const shape of projectedShapes) shape[Symbol.dispose]();
      }
    }

    const bytes = unwrap(await toIfc(bim, IFC_META));
    const imported = unwrap(await fromIfc(bytes));
    try {
      expect(imported.diagnostics.issues.filter(({ severity }) => severity === 'error')).toEqual([]);
      for (const expected of projectedWalls) {
        const wall = imported.elements.find(({ guid }) => guid === expected.guid);
        expect(wall?.category).toBe('WALL');
        expect(wall?.geometry.fidelity).toBe('TESSELLATED_MANIFOLD');
        expect(wall?.geometry.completeness).toBe('COMPLETE');
        expect(wall?.geometry.volumeMm3).not.toBeNull();
        if (wall?.geometry.volumeMm3 === null || wall?.geometry.volumeMm3 === undefined) continue;
        expect(wall.geometry.volumeMm3 / expected.volumeMm3).toBeCloseTo(1, 5);
        expect(wall?.material?.name).toBe(MATERIALS.graniteMasonry);
        const quantities = wall?.psets.find(({ name }) => name === 'Qto_WallBaseQuantities');
        expect(quantities?.properties['NetVolume']).toBeCloseTo(expected.volumeMm3 / 1e9, 9);
      }
    } finally {
      disposeImportedModel(imported);
    }
  }, 60_000);

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

  it('exports a rotated civil Site, Bridge, Bridge Part, and Product through familiesToBim', async () => {
    const RotatedBridgePart = family(
      'RotatedBridgePart',
      () =>
        el('Group', { transform: [tRotate(30)] }, [
          <Footing
            key="footing"
            transform={[tRotate(-15), tTranslate([100, 0, 0])]}
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
          properties: { name: 'Rotated pier' },
        }),
      }
    );
    const RotatedBridge = family(
      'RotatedBridge',
      () => el('Group', { transform: [tRotate(45)] }, [<RotatedBridgePart key="part" />]),
      {
        semantics: civilSemantics({
          kind: 'facility',
          category: 'bridge',
          role: 'girder',
          composition: 'element',
          properties: { name: 'Rotated bridge' },
        }),
      }
    );
    const RotatedSite = family(
      'RotatedSite',
      () => el('Group', { transform: [tRotate(20)] }, [<RotatedBridge key="bridge" />]),
      {
        semantics: civilSemantics({
          kind: 'site',
          category: 'site',
          role: 'transport-site',
          composition: 'element',
          properties: { name: 'Rotated site' },
        }),
      }
    );

    const root = resolve(<RotatedSite key="site" />);
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
    expect(root.localTransforms.some((op) => op.op === 'rotate')).toBe(true);
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

function projectFullModel(root: ResolvedElement, evaluator: csg.Evaluator) {
  return unwrap(
    projectInfraBridge(root, {
      bodyEvaluator: evaluator,
      proxyEvaluator: evaluator,
    })
  );
}

function siteOrigin(model: BimModel, name: string) {
  const site = model
    .getAllElements()
    .find((element) => element.category === 'SITE' && element.spec.name === name);
  expect(site?.category).toBe('SITE');
  return site?.category === 'SITE' ? site.spec.origin : undefined;
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

function localBearingFrom(ops: ResolvedElement['localTransforms']): number {
  const op = ops.find((item) => item.op === 'rotate');
  return op?.op === 'rotate' ? op.angleDeg : 0;
}

function categoryCounts(categories: readonly string[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const category of categories) counts[category] = (counts[category] ?? 0) + 1;
  return counts;
}

function boundsTuple(bounds: Bounds3D): readonly number[] {
  return [bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax, bounds.zMin, bounds.zMax];
}

function expectTupleClose(
  actual: readonly number[],
  expected: readonly number[],
  precision: number,
  label: string
): void {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((value, index) =>
    expect(actual[index], `${label} bound ${index}`).toBeCloseTo(value, precision)
  );
}
