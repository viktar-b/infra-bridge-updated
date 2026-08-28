# IFC authoring: brepjs-bim vs the SketchUp donor

How to close the gap between this repo’s export (`dist/model.ifc`, brepjs-bim 0.22) and `fixtures/Donor-Infra-Bridge.ifc`.

The donor was written by **SketchUp 2024 + IFC-manager 5.3.3**, schema `IFC4X3_ADD2`. It is a mesh-classified scene, not a Blender / Bonsai file. Byte-identical STEP is not the goal. The goal is the same civil tree, classes, predefined types, names, placements, materials, and georeference — with kernel solids instead of frozen tessellation where the profile allows.

Evidence: STEP inventory of both files, 2026-08-27. Viewport reconstruction of the 47-product civil core is already first-class. The IFC file is not.

---

## What already matches

| Layer | Donor | Ours | Status |
| --- | --- | --- | --- |
| Bridges | 3 (`GIRDER` + 2× `ARCHED`) | 3 | Match |
| Bridge parts | 18 | 18 | Same partition; enums differ (below) |
| Beam / column / footing / slab / wall / railing / fill | 8 / 7 / 7 / 3 / 4 / 2 / 4 | Same counts | Typed |
| Materials (civil set) | 6 named materials | Same 6 | Match (`virtual_black` is donor-only, used on the geo-ref proxy) |
| Units in the model module | mm | mm | Match. Export converts to SI metres |
| Identity | SketchUp tags | Key-path GlobalIds | Different scheme; ours is the right one for a parametric tree |

`ArchSegment` is already authored as `product` / `member` / `arch-segment`. That is `IfcMember.ARCH_SEGMENT` in IFC4.2+. Do **not** retarget it to `IfcBridgePart` or `IfcBeam`. `RailArchSuperstructure` already occupies `SUPERSTRUCTURE`.

---

## Two workstreams

Gaps fall in two places. Mixing them produces either a local workaround that the next bridge will copy, or a model change that 0.22 will ignore.

1. **brepjs-bim (and a little families)** — adapter, categories, writer. This repo cannot emit `IfcMember` no matter how the family is named.
2. **This model** — `civilSemantics` roles, composition, CRS on `project`, extra SketchUp sites, descriptions. Several of these already have 0.22 hooks and are unused here.

`src/placement.ts` (`spatialGroup`, `placedGeometry`, axis stamping) is a **workaround** for workstream 1, not the long-term API. Keep it until `familiesToBim` consumes `tRotate`. Do not copy it into domain-neutral families; it knows `kind === 'product'`.

---

## 1. Framework: what brepjs-bim must gain

The low-level `BimModel` already has more IFC than the declarative path uses: `ProjectCrs` → `IfcProjectedCRS` + `IfcMapConversion`, `addElementAssembly`, `setSurfaceStyle`, `compositionType` on site/bridge/part, `EarthworksFillPredefinedType` including `BACKFILL`. Most of the remaining work is **wiring `familiesToBim`** and **two missing categories**.

### 1.1 Consume `tRotate` (delete the repo-local bake)

`familiesToBim` currently errors:

- civil spatial with a rotate op **or** non-default `axisX` / `axisZ`: *bake the orientation into child geometry*
- spec-routed product with a rotate op: *orient via `axisX` instead of `tRotate`*

`SiteSpec` / `BridgeSpec` / `BridgePartSpec` already accept `origin` / `axisX` / `axisZ`. The adapter refuses to pass a rotated spatial frame because descendant relativization is translation-only.

**Change:** while walking the tree, fold `tRotate` (+ `tTranslate`) into `origin` + `axisX` + `axisZ` on the element that owns the pose. For civil spatial, either:

- write that frame on the spatial entity (donor-like; SketchUp puts 120° on the site), or
- peel yaw onto children **inside the adapter**, once, instead of every civil example reinventing `spatialGroup`.

Until this lands, every bearing civil model needs a `placement.ts`. That is the highest-leverage library change.

`ApproachSlab` exposes the same gap when a body has a local Datum offset beneath a baked pitch. The typed slab keeps the right dimensions and volume, but its IFC round trip does not retain the authored world bounds because `composedOrigin()` peels only outer translations. Fix this in `familiesToBim` by folding the rotated Datum offset into the slab spec placement. Do not move that adapter workaround into the Family.

### 1.2 Typed `IfcMember` (`ARCH_SEGMENT`)

0.22 `BimCategory` has no `MEMBER`. `CIVIL_PRODUCT_ROUTES` has no `member`. With `proxyEvaluator`, the eight arch bands become `IfcBuildingElementProxy`; without it, export is a hard error.

**Add:**

- `BimCategory` `'MEMBER'`, `MemberSpec`, `addMember`
- Predefined types from IFC4X3 `IfcMemberTypeEnum`, including `ARCH_SEGMENT`
- `CIVIL_PRODUCT_ROUTES`: `category: 'member'`, `roles: ['arch-segment', …]` → that adder
- **Exact authored body** (same ownership model as Earthworks Fill / proxy). An arch band is not a `dimensionsMm` rectangle. Envelope extrusion would be the wrong solid.

Writer: `IfcMember` + `IfcMemberType` with `PredefinedType = ARCH_SEGMENT`. Keep family semantics unchanged.

### 1.3 Typed `IfcSign` (`PICTORAL`)

Same pattern. No `SIGN` category. Four name plates proxy today.

**Add:** `addSign`, `SignSpec`, `CIVIL_PRODUCT_ROUTES` `sign` / `marker` → `IfcSign` with `PredefinedType = PICTORAL` (that is the IFC4X3 spelling; the donor uses it). Exact tessellated body: plate + glyphs is not a rectangle extrusion. Proxy already requires a single solid (`csg.fuse`), which this route should keep.

### 1.4 Occurrence identity (Name / Description / Tag / ObjectType)

Typed building writers ignore the family’s name and emit `Beam 1` … `Wall 4`. `BeamSpec` (and siblings) have **no `name` field**. `semanticName()` in the adapter is used for spatial, earthworks, and proxy only.

The donor has semantic `Name`, long `Description`, `ObjectType` (`arch_segment`, `pictoral`, `backfill`), and SketchUp `Tag`s.

**Add** `name` / `description` / `objectType` / `tag` on typed specs, fill them from families identity props (`name`) and `civilSemantics.properties`, and write them on the occurrence. Stop synthesizing `Beam ${i+1}` when a name exists.

Related writer bug: `writeBeamEntity` (and slab/column) take `_predefinedType` and still write `PredefinedType: null`. Occurrence predefined type is discarded even when the spec has it.

### 1.5 Exact body for compound typed products

The civil product routes synthesize their specs from family semantics. By default, that means rebuilding from `dimensionsMm`:

```
beam / column / footing / slab / wall / railing
  → RECTANGULAR profile + IfcExtrudedAreaSolid
```

The beam route also honours a family-supplied profile. `AbutmentSupportBeam` uses that seam to send its signed five-point `ARBITRARY_CLOSED` section to `BeamSpec`, so its viewport and IFC solids now match without falling back to tessellation.

Exact kernel preservation in this profile is **only** Earthworks Fill (and proxy). Compound products without a suitable typed spec still lose their authored shape. That is why:

- `RoadRailing` (posts + two rails) becomes a guardrail **panel**
- `SpandrelWall` (elliptical arch openings) becomes a **box**

Posted railings *can* tessellate on the hand-authored `RailingSpec` (`infill: 'POSTED'`). The civil adapter never sets that; it only forwards envelope length / thickness / height.

**Add** an opt-in exact-body path for routed civil products (reuse `bodyEvaluator`), or honour a family-supplied railing/wall spec instead of synthesizing a rectangle. Viewport mesh stays the source of truth when the envelope would lie.

Rectangular girders, stems, pads, and decks can stay SweptSolid. That is better BIM than the donor’s triangulated face sets.

### 1.6 Types, styles, schema, writer quality

| Gap | 0.22 today | Donor | Library change |
| --- | --- | --- | --- |
| `Ifc*Type` grouping | One type per category (`BeamType`, all 8 beams) | Per-family types (3 beam types, 2 column, …) | Group types by family/role/predefined type, not category alone |
| Surface style | `setSurfaceStyle` exists; writer honours it for railings/coverings | 54 `IfcStyledItem` + `IfcColourRGB` | Apply styles to every body representation |
| Schema token | `IFC4` \| `IFC4X3` (web-ifc) | `IFC4X3_ADD2` | Optional `IFC4X3_ADD2` if the writer backend can emit it; not required for class parity |
| Length unit on export | Always SI metre | `MILLI` `METRE` | Optional mm `IfcSIUNIT`; metres are the IFC convention — do not chase mm just to look like SketchUp |
| Writer | web-ifc 0.0.77 (`GetLineType() Attempt to Access Invalid ExpressID` on write; file still lands) | IFC-manager | Prefer IfcOpenShell on the write path, or silence/fix the ExpressID issue. Package already **validates** with IfcOpenShell; it does not **serialize** with it |
| Assembly | `addElementAssembly` on `BimModel` | 2× `IfcElementAssembly.FACTORY` highway markers | `familiesToBim` route for an assembly family if those extras are in scope |

`ProjectCrs` is already written when `model.init({ crs })` is set. `familiesToBim({ project: { crs } })` is enough; no new IFC entity work.

---

## 2. This repo: what to include once the adapter can express it

These are model/export changes. Several work on 0.22 **today**.

### 2.1 Already supported — do here

| Change | Why | How |
| --- | --- | --- |
| Earthworks role `backfill` | Donor `IfcEarthworksFill.BACKFILL`. Adapter map already has `backfill → BACKFILL`. We author `embankment` | `EarthFill` `civilSemantics.role: 'backfill'` |
| Composition `collection` / `partial` | Adapter: `collection → COMPLEX`, `element → ELEMENT`, `partial → PARTIAL`. We stamp `element` on every spatial node. Donor uses COMPLEX on containers and PARTIAL on nested parts | Set `composition` on sites / parts to match the donor tree (see table below) |
| Subdivision `lateral` | Adapter: `lateral → LATERAL`. Donor uses `LATERAL` on every bridge part. We use `vertical` / `longitudinal` / `regional` | Only if donor enum parity is required. Ours is the better civil reading (pier = vertical, girder = longitudinal). Prefer keeping ours unless a checker demands LATERAL |
| Georeference | Donor `EPSG:32760` + `IfcMapConversion` | Pass `crs` on `familiesToBim` `project`. Map conversion eastings/northings in the donor look millimetre-scaled UTM (`729011225.88`, `9063960607.64`); export is metres, so use `729011.226`, `9063960.608` (and confirm against the SketchUp GIS setup before locking) |
| Application / MVD strings | Donor `IFC-manager` / `ViewDefinition [ReferenceView]` | `toIfc` `applicationName`, `mvdViewDefinition` — cosmetic |
| Project name | Donor `ifc silly sample scene - project` | Keep `infra-bridge`. Do not copy the SketchUp joke name |

### 2.2 After Member / Sign / exact-body land

- Leave `ArchSegment` and `BridgeNameSign` semantics as they are. Export should stop listing them in `projected.proxied`.
- Keep fused single-solid signs (proxy already requires that).
- Decide exact-body vs posted-spec for `RoadRailing` and exact-body vs voided wall for `SpandrelWall`.

### 2.3 Names and descriptions (needs 1.4)

Identity `name` already exists on product families (`Main girder`, `Road bridge - approach slab`, `Road rail bridge - name sign`, …). Spatial names come from `semantics.properties.name` and mostly survive. Typed products do not.

Once the writer uses `semanticName`, pass donor-like names at the occurrence (not only family defaults), and put SketchUp descriptions in `properties.description` (or `attributes` once families expose it).

Donor examples to restore:

- `road river bridge - main girder` / `bridge road - cross girder` / `road river bridge - abutment support beam`
- `rail bridge - arch segment` + description *An arch segment, forming part of the rail bridge's structure.*
- `road rail bridge - name sign` + the long plaque description
- `rail bridge - filler` (we say `Rail bridge fill`)

### 2.4 SketchUp scene extras (optional; not the civil core)

The donor has **six** sites and two assemblies this tree never authored:

| Donor entity | Include? |
| --- | --- |
| `environment - site` (COMPLEX) | Only if the surrounding mesh is in scope |
| `road parking - site` | Same |
| `road - site` | Same |
| `geo-reference` `IfcBuildingElementProxy` | **No.** Use `ProjectCrs` instead of a dummy product |
| 2× `highway location marker` `IfcElementAssembly.FACTORY` | Only if markers are part of the mechanical port |

Matching the donor **civil core** does not require these. Matching the donor **file** does.

### 2.5 Placement after 1.1

When the adapter folds yaw:

- Sites may carry `axisX` for `ROAD_SITE_SET_OUT.bearingDegrees` (120°), as SketchUp did.
- Delete yaw-peel from `spatialGroup`. Keep `foldPose` / `placement()` as sugar if useful.
- Stop stamping `axisX` after `family()` validation; the adapter should read transforms.

Until then, keep `src/placement.ts`.

---

## Donor vs ours: composition (for 2.1)

Donor composition / usage / predefined type on the 18 parts (LATERAL throughout):

| Part | Donor composition | Donor type | Ours (all ELEMENT) |
| --- | --- | --- | --- |
| Road approaches | COMPLEX | NOTDEFINED | `surface-structure` / LONGITUDINAL / SURFACESTRUCTURE |
| Road abutments | PARTIAL | ABUTMENT | VERTICAL / ABUTMENT |
| Road deck | ELEMENT | DECK | REGION / DECK |
| Road superstructure | ELEMENT | SUPERSTRUCTURE | LONGITUDINAL / SUPERSTRUCTURE |
| Road / rail substructure | COMPLEX | SUBSTRUCTURE | REGION / SUBSTRUCTURE |
| Piers | PARTIAL | PIER | VERTICAL / PIER |
| Rail superstructure | ELEMENT | SUPERSTRUCTURE | LONGITUDINAL / SUPERSTRUCTURE |

Predefined types on parts already agree except approach (`SURFACESTRUCTURE` vs `NOTDEFINED`). Prefer keeping `SURFACESTRUCTURE`.

Donor sites: one COMPLEX environment + PARTIAL children. Ours: three ELEMENT transport sites.

---

## Geometry policy (do not copy SketchUp tessellation)

| Product | Donor body | 0.22 export | Target |
| --- | --- | --- | --- |
| Girders, stems, pads, slabs, simple walls | Tessellation | SweptSolid rectangle | **Keep SweptSolid** |
| Abutment support beams | Tessellation | SweptSolid five-point profile | **Keep exact typed profile** |
| Earthworks fill | Tessellation | Exact tessellation | Keep exact |
| Arch member, sign | Tessellation | Proxy tessellation | Typed class + exact body |
| Posted railing, voided spandrel | Tessellation | Envelope SweptSolid | Exact body or posted/voided spec |
| Extra SketchUp meshes | Tessellation | Absent | Only if extras are in scope |

SweptSolid + Qto from spec is the advantage of this stack. Chasing 54 `IfcTriangulatedFaceSet`s would throw that away.

---

## Definition of done (civil-core match)

Not byte-equal files. A receiver that understands IFC4X3 should see:

1. 3 `IfcSite` (or 6 if extras are in) / 3 `IfcBridge` / 18 `IfcBridgePart` with agreed enums.
2. 8 `IfcBeam`, 7 `IfcColumn`, 7 `IfcFooting`, 3 `IfcSlab`, 4 `IfcWall`, 2 `IfcRailing`, 4 `IfcEarthworksFill.BACKFILL`.
3. 8 `IfcMember.ARCH_SEGMENT`, 4 `IfcSign.PICTORAL` — **zero** proxies for those twelve.
4. Occurrence `Name` (and descriptions if authored) from the family, not `Beam 1`.
5. `EPSG:32760` map conversion; no geo-ref proxy.
6. Rectangular products as SweptSolid; arch, sign, fill, and compound railing/spandrel as the kernel solid.
7. `projected.proxied` empty for this tree.
8. `src/placement.ts` yaw-peel gone because the adapter folded the pose.

Out of scope unless explicitly added: highway markers, environment/parking/road sites, millimetre file units, `IFC4X3_ADD2` header token, SketchUp surface colours, `virtual_black`, donor GlobalIds, donor quantities-only Qto sets (ours are richer and should stay).

---

## Suggested order

**Library (brepjs-bim)**

1. Fold `tRotate` in `familiesToBim` (spatial + spec-routed products).
2. Occurrence `name` / `description` / `tag` / write `PredefinedType` on the entity.
3. `addMember` + exact body + civil route `member` / `arch-segment`.
4. `addSign` + exact body + civil route `sign` / `marker`.
5. Exact-body (or posted/voided spec) for civil railing and wall.
6. Type grouping by role; surface styles on all bodies; IfcOpenShell write path when feasible.

**This repo (can interleave)**

1. `EarthFill` role `backfill`; optional composition enums; `project.crs`.
2. After (3)–(5): drop proxy expectations in tests; restore donor names/descriptions.
3. After (1): simplify `placement.ts`.
4. Only then: extra SketchUp sites / marker assemblies.

Do not invent Member/Sign mappings in this example that 0.22 will still proxy. Wait for the typed routes, then the families as they already are become the donor classes.
