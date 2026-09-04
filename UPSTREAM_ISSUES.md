# brepjs upstream issue ledger

This file tracks changes that this repository needs from
[`andymai/brepjs`](https://github.com/andymai/brepjs). It is a cross-repository staging and status
ledger. Local implementation tickets still belong under `.scratch/` as described in
`docs/agents/issue-tracker.md`.

Tested on 2026-09-04 with:

- `brepjs@19.0.1`
- `brepjs-bim@0.24.1`
- `brepjs-families@0.12.0`
- `occt-wasm@4.4.0`

The 2026-09-04 bump consumed [andymai/brepjs#2295](https://github.com/andymai/brepjs/pull/2295)
(`brepjs-bim@0.24.1`): civil-semantic walls and railings keep authored exact Bodies when they
differ from the parametric envelope. That closes [andymai/brepjs#2272](https://github.com/andymai/brepjs/issues/2272)
(BREP-005). `brepjs@19.0.1`, `brepjs-families@0.12.0`, and `occt-wasm@4.4.0` are unchanged. The
`ProductBody` union and `takeExactProductBody()` landed earlier in `0.24.0`
([andymai/brepjs#2286](https://github.com/andymai/brepjs/pull/2286)).

Civil wall and railing routes require `bodyEvaluator` (already supplied here). Callers still use
`placedSolids()` or `bodySolids()` for ProductBody geometry. The RoadRailing and SpandrelWall
exact-Body checks now run in the full suite.

## Policy

- Give each concern a stable `BREP-NNN` ID. Do not reuse or renumber IDs.
- Keep one independently shippable upstream change in each entry.
- Use these states:
  - `candidate`: the problem is known, but the API choice, reduced reproduction, or filing text is
    not complete.
  - `ready`: verified on the current release and upstream `main`, searched for duplicates, and
    ready to file.
  - `filed`: filed upstream with its URL and date.
  - `deferred`: valid, but not worth filing until its stated trigger occurs.
  - `resolved`: fixed upstream and consumed here; the local workaround or stale expectation is
    gone.
  - `closed`: rejected, superseded, or no longer required. Record why.
- A `ready` entry must state the problem, actual result, expected result, reproduction, evidence,
  and acceptance criteria.
- After filing, keep the entry until this repository consumes the fix. An upstream merge alone
  does not make an entry `resolved`.

## Resolved

### BREP-005: Preserve compound and voided Bodies on typed civil routes

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, Families adapter |
| Kind | Bug and API design |
| Status | `resolved` |
| Upstream | [andymai/brepjs#2272](https://github.com/andymai/brepjs/issues/2272), closed by [andymai/brepjs#2295](https://github.com/andymai/brepjs/pull/2295) in `brepjs-bim@0.24.1` |
| Last verified | 2026-09-04 (`brepjs-bim@0.24.1`) |

`#2286` (`brepjs-bim@0.24.0`) published the shared `ProductBody` contract and
`takeExactProductBody()`. `#2295` connects evaluated Family Bodies to that contract. Civil-semantic
walls and railings keep a parametric Body only after a volume-then-union coincidence proof against
the post-opening candidate. Otherwise they retain the authored exact Body, including disconnected
solids and CSG cuts, without changing `IfcWall` / `IfcRailing.GUARDRAIL`. Missing `bodyEvaluator`
(or `proxyEvaluator`) is `FAMILIES_PRODUCT_BODY_EVALUATOR_REQUIRED`; the adapter does not fall back
to a parametric envelope.

This repository consumed the release by bumping `brepjs-bim` to `0.24.1`, replacing the known
envelope-mismatch assertions in `tests/familyProjection.test.tsx`, and enabling the RoadRailing and
SpandrelWall exact-Body round-trips in `tests/fullModel.test.tsx`. Round-trip checks use
`geometry.solids`, `completeness`, and `volumeMm3` rather than the one-solid `geometry.solid` alias.
Rectangular girders, stems, pads, decks, and the five-point `AbutmentSupportBeam` profile stay on
their parametric paths.

### BREP-001: Compose Family transforms into IFC placements

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, Families adapter |
| Kind | Bug |
| Status | `resolved` |
| Upstream | [andymai/brepjs#2259](https://github.com/andymai/brepjs/issues/2259), closed by [andymai/brepjs#2260](https://github.com/andymai/brepjs/pull/2260) in `brepjs@18.164.0` / `brepjs-bim@0.23.0` / `brepjs-families@0.12.0` |
| Last verified | 2026-09-02 |

`familiesToBim` now folds `tRotate` and `tTranslate` into IFC `origin`/`axisX`/`axisZ` for typed
Products and civil Site, Bridge, and Bridge Part nodes. This repository consumed the release by
removing yaw peeling, Product `axisX`/`axisZ` stamping, and CSG rotation baking from
`src/placement.ts` and `src/families/familyPlacement.ts`.

A rotated Site, Bridge, Bridge Part, and Footing now export. Pitched `ApproachSlab` occurrences
keep their authored `tRotate` list and export as `IfcSlab`. Datum-aware world bounds were a
follow-on defect, now resolved as BREP-014.

### BREP-013: Reconstruct tessellated proxy and Earthworks Fill Bodies on IFC import

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, IFC importer |
| Kind | Bug |
| Status | `resolved` |
| Upstream | Not filed separately; fixed by [andymai/brepjs#2273](https://github.com/andymai/brepjs/pull/2273) in `brepjs@18.164.1` / `brepjs-bim@0.23.1` |
| Last verified | 2026-09-02 |

`fromIfc` now undoes web-ifc's Y-up mesh frame and sews triangles through `buildTriFace` /
`sewAndSolidify`. Closed tessellated Bodies return as `TESSELLATED_MANIFOLD` solids.

This repository consumed the release by replacing the `fidelity = NONE` / `solid = null`
expectations in `tests/familyProjection.test.tsx`. `ArchSegment`, `BridgeNameSign`, and
`EarthFill` now round-trip with matching world bounds and volume within a relative `1e-5`
tessellation tolerance.

### BREP-014: Preserve Datum-aware origins on typed civil routes

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, Families adapter |
| Kind | Bug |
| Status | `resolved` |
| Upstream | [andymai/brepjs#2270](https://github.com/andymai/brepjs/issues/2270), closed by [andymai/brepjs#2271](https://github.com/andymai/brepjs/pull/2271) and [andymai/brepjs#2273](https://github.com/andymai/brepjs/pull/2273) in `brepjs@18.164.1` / `brepjs-bim@0.23.1` |
| Last verified | 2026-09-02 |

`#2271` composes inner Body Datum translations into the typed Product frame. `#2273` makes the
IFC importer honour rectangle-profile `Position` and a single composed placement, so IFC
round-trip bounds match the authored world Datum.

Unrotated `ApproachSlab`, `BridgeDeck`, and `Footing` no longer shift by half their length and
width. Both pitched `ApproachSlab` occurrences import at the authored upper-inner Datum; the
first occurrence's `xMin` is `10021.783`.

This repository consumed the release by removing the `roundTripPlacementGaps` exceptions in
`tests/familyProjection.test.tsx` and enabling the pitched `ApproachSlab` world-bounds
regression in `tests/fullModel.test.tsx`. `placedSolids()` without `parentFrame` remains
relative to the containing spatial structure; world-bounds evidence is the IFC round-trip.

## Ready to file

### BREP-002: Add a typed exact-body IfcMember route

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim` |
| Kind | Enhancement |
| Status | `ready` |
| Upstream | Not filed |
| Last verified | 2026-09-03 |

#### Problem

`ArchSegment` declares Product category `member` and role `arch-segment`.
`brepjs-bim` has no `MEMBER` category, `MemberSpec`,
`addMember`, or civil Product route. Eight correctly authored arch bands therefore become
`IfcBuildingElementProxy`. Without `proxyEvaluator`, export fails.

An arch band cannot use a rectangular envelope extrusion. Its authored Body is the extrusion of
the band between its inner and outer curves.

`fromIfc` also omits donor `IfcMember` rows. On 2026-09-03, importing the donor fixture with
the schema token rewritten to `IFC4X3` returned 38 of 50 products; the eight arch segments
were absent rather than classified as PROXY. A typed Member route must cover import as well as
export.

#### Reproduction

Run `npm run export:ifc`. The command reports eight `ArchSegment` key paths under
`proxied (no typed IFC route)`. `tests/fullModel.test.tsx:130-153` records the same fallback.

#### Expected result

Project Product category `member`, role `arch-segment` to `IfcMember.ARCH_SEGMENT` and preserve
the exact authored Body.

#### Acceptance criteria

- `BimCategory` includes `MEMBER`, with a `MemberSpec`, `addMember`, and `getMembers` path.
- The writer emits `IfcMember` and an `IfcMemberType` with `PredefinedType = ARCH_SEGMENT`.
- The Families adapter routes `member` and `arch-segment` without a proxy fallback.
- The exact Body, material, stable key-path identity, and placement survive IFC round-trip.
- This model exports eight typed members and no `ArchSegment` proxies.

#### Local completion

Replace the proxy expectation with eight typed members after this repository consumes the
upstream release.

### BREP-003: Add a typed exact-body IfcSign route

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim` |
| Kind | Enhancement |
| Status | `ready` |
| Upstream | Not filed |
| Last verified | 2026-09-03 |

#### Problem

`BridgeNameSign` declares Product category `sign` and role `marker`. `brepjs-bim` has no `SIGN`
category, `SignSpec`,
`addSign`, or civil Product route. Four signs therefore become `IfcBuildingElementProxy`.

The sign Body is now one plain authored plate, with text carried as metadata. It still falls back
to `IfcBuildingElementProxy` because no typed Sign route exists.

`fromIfc` also omits donor `IfcSign` rows. The same 2026-09-03 donor import dropped the four
name signs; they are the rest of the 12-product gap beside the omitted members. A typed Sign
route must cover import as well as export.

#### Reproduction

Run `npm run export:ifc`. The command reports four `BridgeNameSign` key paths under
`proxied (no typed IFC route)`. `tests/fullModel.test.tsx:130-153` records the same fallback.

#### Expected result

Project Product category `sign`, role `marker` to `IfcSign.PICTORAL` and preserve the exact
authored Body.

#### Acceptance criteria

- `BimCategory` includes `SIGN`, with a `SignSpec`, `addSign`, and `getSigns` path.
- The writer emits `IfcSign` and an `IfcSignType` with `PredefinedType = PICTORAL`.
- The Families adapter routes `sign` and `marker` without a proxy fallback.
- The plate Body, text metadata, material, stable key-path identity, and placement survive IFC
  round-trip.
- This model exports four typed signs and no `BridgeNameSign` proxies.

#### Local completion

Replace the proxy expectation with four typed signs after this repository consumes the upstream
release.

### BREP-004: Preserve authored occurrence identity on typed Products

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-families`, `packages/brepjs-bim` |
| Kind | Bug and API enhancement |
| Status | `ready` |
| Upstream | Not filed |
| Last verified | 2026-09-02 |

#### Problem

Resolved Families carry authored names, and civil semantics can carry other identity properties.
The typed BIM specs do not expose `name`, `description`, `objectType`, or `tag`. The serializer
therefore generates names such as `Beam 4`, `Slab 1`, and `Wall 1`.

For example, the authored name `Road river bridge - main girder` imports from the generated IFC
as `Beam 4` or `Beam 5`. Spatial objects, Earthworks Fill, and proxies already use semantic names;
typed Product routes do not.

#### Reproduction

1. Run `npm run export:ifc`.
2. Import `dist/model.ifc` with `fromIfc` or inspect its `IfcBeam` rows.
3. Compare the occurrence names with the `name` properties authored by the Families under
   `src/families/`.

#### Expected result

The Family projection seam must carry occurrence identity into every typed BIM route. The writer
must use the authored name when present and generate a numbered fallback only when it is absent.

#### Acceptance criteria

- Typed specs can carry `name`, `description`, `objectType`, and `tag` where the IFC occurrence
  supports them.
- `familiesToBim` reads `attributes.name` and the agreed target-neutral semantic properties.
- Every typed Product writer writes the supplied occurrence identity.
- Existing fallback names remain available for low-level specs that omit identity.
- Round-trip tests cover at least Beam, Slab, Column, Wall, Railing, Footing, and Earthworks Fill.
- Type-object grouping remains separate from occurrence identity. See BREP-007.

#### Local completion

Author the remaining donor occurrence names and descriptions after the upstream contract is
available. See `LOCAL-003`.

### BREP-006: Do not emit Invalid ExpressID errors for successful IFC writes

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, IFC writer |
| Kind | Bug |
| Status | `ready` |
| Upstream | Not filed |
| Last verified | 2026-09-03 (`brepjs-bim@0.24.0`) |

#### Problem

`toIfc` returns a usable IFC file but prints repeated web-ifc errors:

```text
[WEB-IFC][error][GetLineType()] Attempt to Access Invalid ExpressID
```

For this model, IDs `11`, `169`, `201`, `233`, and `265` are each reported twice. The command
still exits with status 0 and writes the file. Successful export therefore looks broken and
pollutes CLI and CI output.

#### Reproduction

Run `npm run export:ifc` with the package baseline at the top of this file.

#### Expected result

A successful `toIfc` call must not emit web-ifc error diagnostics. Real write failures must still
return a typed error. Replacing the writer backend with IfcOpenShell is one possible implementation,
not part of the required contract.

#### Acceptance criteria

- The current model serializes without `Invalid ExpressID` diagnostics.
- The returned bytes still pass the existing independent IFC validation and round-trip checks.
- A real invalid write still returns or reports an actionable error.
- Tests identify the invalid lookup source instead of globally suppressing web-ifc errors.

## Candidates

### BREP-007: Group IFC types by Family identity or civil role

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim` |
| Kind | API design |
| Status | `candidate` |
| Upstream | Not filed |
| Last verified | 2026-09-02 |

#### Problem

The writer currently derives one type group for each `(category, predefinedType)` pair. Products
with different Family definitions or civil roles can therefore share one generic type. For
example, main girders, cross girders, and support beams can all become one `IfcBeamType.BEAM`.

Occurrence names do not solve this problem. They identify individual Products, while the type
object identifies the reusable Family definition.

#### Expected result

The Family projection seam should expose stable type identity separately from occurrence
identity. The writer should group by that identity and predefined type, with deterministic type
GlobalIds.

#### Work needed before filing

- Decide whether the public key is `typeKey`, Family definition identity, or a target-neutral
  civil role.
- Prove the grouping on main girder, cross girder, and abutment support beam occurrences.
- Define fallback grouping for low-level `BimModel` callers that do not supply a type identity.

#### Acceptance criteria

- Different Family definitions can produce different `Ifc*Type` objects even when they share an
  IFC category and predefined type.
- Repeated occurrences of the same Family definition share one type object.
- Type and relationship GUIDs remain deterministic.
- Existing callers without type identity retain a documented fallback.

### BREP-008: Apply surface styles to every Product Body

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, IFC writer |
| Kind | Enhancement |
| Status | `candidate` |
| Upstream | Not filed |
| Last verified | 2026-09-02 |

#### Problem

`BimModel.setSurfaceStyle` stores colour and transparency, but the writer currently applies it
only where a geometry writer exposes its Body item, notably Railing and Covering. Other typed
Products keep their material association but do not receive `IfcStyledItem` on the Body.

#### Expected result

Every Product Body writer should return or expose the representation item needed by the common
style path. `setSurfaceStyle` should behave consistently across supported typed categories and
exact Bodies.

#### Work needed before filing

- Add a minimal Beam or Slab reproduction that sets a surface style and inspects the IFC graph.
- Decide how one style applies to a compound Body with more than one representation item.
- Confirm style behavior for tessellated exact Bodies.

#### Acceptance criteria

- A style set on each supported physical category emits `IfcSurfaceStyle`, `IfcStyledItem`, and
  `IfcColourRGB` linked to its Body item or items.
- Unstyled Products do not gain synthetic styles.
- Compound and tessellated Bodies have documented style behavior.
- Import or graph tests verify the colour and transparency values.

### BREP-011: Route declarative Families to IfcElementAssembly

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-families`, `packages/brepjs-bim` |
| Kind | API design |
| Status | `candidate` |
| Upstream | Not filed |
| Last verified | 2026-09-02 |

#### Problem

The low-level `BimModel` supports `addElementAssembly`, aggregation, and nesting. The declarative
Families adapter has no assembly route. A Family cannot declare an assembly container and project
its children to `IfcElementAssembly` without dropping to the low-level API.

Two optional highway location markers in the donor use `IfcElementAssembly.FACTORY`, which
provides the current consumer case.

#### Expected result

Define a target-neutral Family projection contract for assembly identity, predefined type,
assembly place, and ordered children. Route it through `familiesToBim` without giving the assembly
container a false Body.

#### Work needed before filing

- Decide the target-neutral semantics or archetype for an assembly.
- Decide when children use aggregation and when they use ordered nesting.
- Build one reduced marker assembly reproduction.

#### Acceptance criteria

- A declarative Family can project to an `IfcElementAssembly` container.
- The container has no synthetic Body.
- Its children retain typed IFC classes, stable key-path identities, and placements.
- The author can choose the supported aggregation or nesting relationship.
- `FACTORY` and other supported predefined types pass through the adapter.

### BREP-012: Keep arbitrary Beam profile geometry consistent with IFC output

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, Beam geometry and Families adapter |
| Kind | Bug |
| Status | `candidate` |
| Upstream | Not filed |
| Last verified | 2026-09-02 |

#### Problem

`AbutmentSupportBeam` carries one `ARBITRARY_CLOSED` profile through the Family projection seam.
The profile and volume survive IFC round-trip, but the eager `BimModel` geometry returned by
`familiesToBim` swaps the section axes and sign. The model and its serialized IFC therefore
describe different placed solids.

In `tests/familyProjection.test.tsx`, the authored fixture bounds are
`[1000, 1600, 1880, 2000, 3000, 3180]`. `placedSolids()` on the projected Beam returns
`[1000, 1600, 2000, 2180, 3000, 3120]`. Importing the written IFC returns the authored bounds and
the same volume.

`#2273` made rectangle-profile IFC import match `placedSolids()`. This arbitrary-profile Beam is
unchanged: IFC import still matches the authored bounds, and eager `placedSolids()` still does
not.

#### Expected result

`beamToSolid`, the IFC profile writer, and the IFC reader must use one documented mapping from
profile coordinates to the Beam's transverse and vertical axes.

#### Work needed before filing

- Reduce the failure to one `BeamSpec` with an asymmetric `ARBITRARY_CLOSED` profile.
- Verify the coordinate convention on upstream `main` and search for an existing issue.
- Decide whether the defect belongs in `extendedProfileToFace`, `beamToSolid`, or both.

#### Acceptance criteria

- Eager Beam geometry and IFC round-trip geometry have the same profile, volume, and placed bounds.
- Positive and negative asymmetric profile coordinates retain their sign.
- Core rectangular Beam profiles keep their current orientation.

### BREP-015: Aggregate nested Sites under a collection Site

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, Families adapter |
| Kind | API design |
| Status | `candidate` |
| Upstream | Not filed |
| Last verified | 2026-09-04 (`brepjs-bim@0.24.1`) |

#### Problem

`civilParentAccepts` allows `kind: 'site'` only when `parent === 'project'`. A Site whose parent is a Site with `composition: 'collection'` is `FAMILIES_INVALID_CIVIL_HIERARCHY`. LOCAL-007 authors that tree: `InfraBridge` is the collection environment Site, and its children are partial `transport-site` Sites, including empty parking and road placeholders.

The same check also needs a Site-typed `familiesToBim` root. Today's adapter maps the root key path onto the project when the root itself is civil, then still rejects nested Sites under that root. Role stays `transport-site`; COMPLEX versus PARTIAL is `composition`, not a new civil role.

#### Expected result

- A Site may sit under the families-to-BIM project **or** under a Site with `composition: 'collection'`.
- Child Sites use `composition: 'partial' | 'element'`.
- Empty geometry on every civil spatial node (existing rule).
- `CIVIL_COMPOSITION` already maps `collection → COMPLEX` and `partial → PARTIAL`.
- Role remains `transport-site`.
- The root of `familiesToBim` may itself be a Site.
- Aggregation is `IfcRelAggregates` from the COMPLEX parent to PARTIAL children.
- `PROJECT_SPEC` CRS stays on the project. No geo-reference Product.

#### Work needed before filing

- Reduce the failure to one collection Site with two empty partial Site children and a Site-typed `familiesToBim` root.
- Confirm `civilParentAccepts` is the only gate, and that a Site root does not collide with the project stable key.
- Decide whether `element` Sites may nest under `collection`, or only `partial`.

#### Acceptance criteria

- Nested Sites under a collection Site project without `FAMILIES_INVALID_CIVIL_HIERARCHY`.
- A Site-typed `familiesToBim` root projects as `IfcSite` COMPLEX and aggregates its Site children.
- Child Sites keep their authored key paths, placements, and empty geometry.
- Role `transport-site` is unchanged.
- This model's environment Site aggregates five PARTIAL Sites over `IfcRelAggregates`.

## Deferred

### BREP-009: Support an IFC4X3_ADD2 schema token

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, IFC writer and importer |
| Kind | Enhancement |
| Status | `deferred` |
| Upstream | Not filed |
| Last verified | 2026-09-03 |

#### Difference

`toIfc` accepts `IFC4` or `IFC4X3`. The donor header uses `IFC4X3_ADD2`. `fromIfc` rejects that
token with `SCHEMA_UNSUPPORTED`. Rewriting `FILE_SCHEMA` to `IFC4X3` lets the same bytes import
on `brepjs-bim@0.23.2`; the workaround is local to the probe, not part of export.

#### Desired result

Treat `IFC4X3_ADD2` as an alias of `IFC4X3` on both write and read when the selected backend
can emit or parse that identifier. Keep `IFC4X3` as a supported value.

#### Reactivate when

An IFC receiver rejects `IFC4X3`, requires the exact ADD2 header token, this repository needs to
import the donor fixture without rewriting the header, or the writer backend adds first-class
ADD2 support.

### BREP-010: Make the IFC length unit configurable

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, units and IFC writer |
| Kind | Enhancement |
| Status | `deferred` |
| Upstream | Not filed |
| Last verified | 2026-09-02 |

#### Difference

The model and Family projection seam use millimetres. The writer converts lengths to SI metres.
The donor declares a millimetre-prefixed metre unit.

#### Desired result

Keep metre output as the default, but allow a caller to select a supported IFC length unit. The
writer must scale placements, geometry, and quantities consistently.

#### Reactivate when

A target receiver requires millimetre IFC units or a round-trip test proves that metre output
causes a real interoperability failure.

## Local follow-ups

These items belong in this repository. They are kept here because they depend on, or were found
while defining, the upstream work above.

### LOCAL-003: Restore donor occurrence identity after BREP-004

Use authored occurrence names and descriptions after typed specs support them. Known donor values
include:

- `road river bridge - main girder`
- `bridge road - cross girder`
- `road river bridge - abutment support beam`
- `rail bridge - arch segment`, description: `An arch segment, forming part of the rail bridge's structure.`
- `road rail bridge - name sign`
- `rail bridge - filler`

Extract the exact long sign description from `fixtures/Donor-Infra-Bridge.ifc` before adding its
regression assertion. Carry `ObjectType` and `Tag` only through the target-neutral contract agreed
in BREP-004.

### LOCAL-005: Remove proxy expectations after BREP-002 and BREP-003

Change the full-model export assertions from twelve proxies to eight typed Members and four typed
Signs. Require `projected.proxied` to be empty for the authored civil Products.

### LOCAL-007: Author environment and empty civil Sites; markers wait on BREP-011

The environment collection Site (`InfraBridge`, name `environment - site`) and the empty parking and road partial Sites are authored. Transport Sites use `composition: 'partial'`. IFC `IfcRelAggregates` nesting is blocked on BREP-015; this repository hoists nested Sites to Project siblings at the export boundary until that release is consumed. Highway location markers still wait on BREP-011. Do not copy the donor `geo-reference` proxy; CRS stays `PROJECT_SPEC`.

### LOCAL-008: Apply remaining export metadata

MVD `ViewDefinition [ReferenceView]` and application name `infra-bridge` are set in
`src/exportConfig.ts`. The donor application name `IFC-manager` is not copied; this repository
does not impersonate the SketchUp exporter.

After BREP-008, author the required surface colours and verify them against the donor. Do not add
the donor-only `virtual_black` material unless an included scene object uses it.

### LOCAL-009: Define and prove the reusable Family package interface

The Family modules are now source-portable and document their copyable sibling dependency, but
this repository does not yet publish a supported package interface. Define one explicit entry
point for the Families, composable schemas, and public types that another brepjs project may
import. Keep private kernels and project assemblies out of that entry point.

Add a consumer fixture outside this model's source tree that imports every supported Family only
through the package entry point, resolves and evaluates one occurrence, and projects the Families
whose adapters are exact. The fixture must not import project set-out tables, assemblies, or
another private repository path.

Document the required `brepjs`, `brepjs-families`, and `brepjs-bim` versions or peer dependency
ranges, the millimetre unit contract, the civil-semantics dependency, and any required runtime
initialization. Datum-aware placement is available after BREP-014; compound and voided Bodies
round-trip after BREP-005.

Acceptance criteria:

- One documented entry point defines the supported Family interface.
- All current public Family exports are either included or deliberately classified as
  project-specific.
- A separate consumer fixture typechecks, resolves, evaluates, and verifies the supported
  Families without private imports.
- Package documentation states units, axes, Datum conventions, runtime initialization, and
  dependency compatibility.
- The package does not expose private kernels, CSG resources, set-out data, or exporter types.

## Closed local follow-ups

These items are complete in this repository. IDs are stable and are not reused.

### LOCAL-001: Apply civil semantics already supported by the adapter

Done on 2026-08-31. `EarthFill` uses role `backfill` and exports as `IfcEarthworksFill.BACKFILL`.
Bridge Parts author `collection` / `element` / `partial`, which the adapter maps to `COMPLEX` /
`ELEMENT` / `PARTIAL`:

| Bridge-part group | Composition |
| --- | --- |
| Road approaches | `COMPLEX` |
| Road abutments | `PARTIAL` |
| Road deck | `ELEMENT` |
| Road superstructure | `ELEMENT` |
| Road and rail substructures | `COMPLEX` |
| Road and rail piers | `PARTIAL` |
| Rail superstructure | `ELEMENT` |

Subdivision stays function-based (`LONGITUDINAL`, `VERTICAL`, `REGION`). The donor stamps `LATERAL`
on every Bridge Part; that is not required by a known checker.

### LOCAL-006: Select the typed exact-Body path after BREP-005

Done on 2026-09-04 with `brepjs-bim@0.24.1`. `RoadRailing` keeps its posts and rails and
`SpandrelWall` keeps its arch openings through typed projection. Focused and full-model fixtures
assert volume, bounds, IFC class, material, and round-trip. `AbutmentSupportBeam` stays on its
parametric profile path.

### LOCAL-002: Configure and verify the project CRS

Done on 2026-08-31. `src/exportConfig.ts` passes `EPSG:32760` to `familiesToBim` with metre
easting `729011.226` and northing `9063960.608`, derived by dividing the donor millimetre-prefixed
`IfcMapConversion` values by 1000. Export emits `IfcProjectedCRS` and `IfcMapConversion` and does
not add a `geo-reference` geometry Product.

### LOCAL-004: Remove the placement workaround after BREP-001

Done on 2026-08-29 with `brepjs@18.164.0`. `spatialGroup` and `placedGeometry` now forward
authored `tRotate`/`tTranslate` lists. The pitched `ApproachSlab` world-bounds regression was
consumed with BREP-014 on `brepjs@18.164.1`.

### LOCAL-010: Remove the project font from BridgeNameSign

The project font, font loader, and glyph-outline kernel were removed on 2026-08-28 by explicit
scope decision. `BridgeNameSign` keeps its existing JSX props, normalizes arbitrary non-empty text
to uppercase metadata, and authors one plain plate with depth `plateDepth + reliefDepth`. It has no
asset initialization or project module dependency.

BREP-003 remains responsible for typed `IfcSign` classification. BREP-013 is resolved: the IFC
reader now reconstructs the tessellated proxy Body as `TESSELLATED_MANIFOLD`.

Acceptance criteria:

- The sign source has no project asset or font dependency. Implemented.
- Text metadata normalization and the plain-plate topology are documented. Implemented.
- A clean process can evaluate the sign after normal `brepjs` initialization. Implemented in the
  focused Family tests; a published consumer fixture remains under LOCAL-009.
- The plain plate remains one exact authored Body before projection. Typed Sign classification
  remains an upstream gap (BREP-003). Proxy Body import reconstruction is resolved (BREP-013).

### LOCAL-011: State and validate each Family's parametric topology

The Families vary parameters within fixed authored topologies. `RoadRailing` always has two rails
and one six-point post profile. `SpandrelWall` always creates paired elliptical openings.
`ArchSegment` and `EarthFill` use fixed curve constructions. These are valid parametric modules,
but they are not arbitrary railing, wall, arch, or earthworks generators.

`src/families/README.md` now documents every fixed topology, axes, Datum, runtime contract,
performance control, and accepted relational gap. The focused tests cover curve sampling,
handedness, repetition, profiles, cuts, and placement without tightening current accepted input.

Acceptance criteria:

- Every packaged Family documents its fixed topology, axes, Datum, parameter meaning, and known
  invalid relationships.
- Tests cover each branch that changes topology, handedness, repetition, or placement.
- Profile and subtractive Families use volume, section, opening, or component assertions instead
  of bounds alone.
- Relational validation changes are reviewed as interface changes rather than hidden inside
  kernel refactors.
- Exporter fidelity for compound and voided Bodies is resolved (BREP-005 / LOCAL-006)
  and stays separate from Family parametricity.
