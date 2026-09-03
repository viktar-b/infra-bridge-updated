# brepjs upstream issue ledger

This file tracks changes that this repository needs from
[`andymai/brepjs`](https://github.com/andymai/brepjs). It is a cross-repository staging and status
ledger. Local implementation tickets still belong under `.scratch/` as described in
`docs/agents/issue-tracker.md`.

Tested on 2026-09-03 with:

- `brepjs@18.164.3`
- `brepjs-bim@0.23.2`
- `brepjs-families@0.12.0`
- `occt-wasm@4.3.3`

The 2026-09-03 bump consumed [andymai/brepjs#2278](https://github.com/andymai/brepjs/pull/2278) (`brepjs-bim@0.23.2`: multi-item IFC Body import) and [andymai/brepjs#2284](https://github.com/andymai/brepjs/pull/2284) (`brepjs@18.164.3`: rigid `applyMatrix`). Neither closes [andymai/brepjs#2272](https://github.com/andymai/brepjs/issues/2272). The full suite still reports 58 passing tests and the two pending RoadRailing / SpandrelWall exact-Body checks.

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

## Filed

### BREP-005: Preserve compound and voided Bodies on typed civil routes

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, Families adapter |
| Kind | Bug and API design |
| Status | `filed` |
| Upstream | [andymai/brepjs#2272](https://github.com/andymai/brepjs/issues/2272), filed 2026-09-01 |
| Last verified | 2026-09-03 |

#### Problem

The civil Product routes synthesize typed specs from semantic envelope dimensions. This is exact
for a rectangular Product. It is false for a compound or voided Product.

`RoadRailing` authors two rails and repeated tapered posts. The typed route exports a solid
guardrail panel. Each projected railing has 5.230 times the authored volume.

`SpandrelWall` cuts paired arch openings. The typed route exports a solid box. Each projected wall
has 1.963 times the authored volume.

The IFC writers also move both envelope Bodies across their transverse Datum. The focused leaf
fixture records the Body and placement losses independently.

`#2273` made IFC import match those projected envelopes. `#2278` (`brepjs-bim@0.23.2`) now
reads every Body representation item, which is a prerequisite for a multi-solid railing
round-trip. The remaining defect is that the projected Body is still the envelope, not the
authored compound or voided solid. After `#2272` lands, round-trip assertions should use
`geometry.solids` / `completeness` rather than the one-solid `geometry.solid` alias.

Installed `0.23.2` still materializes an exact Body only for Earthworks Fill. The existing
helper rejects compounds (`solids.length !== 1`), so `RoadRailing`'s `csg.compound` cannot
reuse it without a multi-solid or documented fuse step. `RailingSpec.infill: 'POSTED'` is a
generic box post/rail, not this Family's six-point tapered profile, and is not a workaround.

The existing Family-supplied Beam profile used by `AbutmentSupportBeam` proves that a typed route
can preserve a richer parametric definition when the spec supports it.

#### Reproduction

Resolve and evaluate the model, project it through `familiesToBim`, and compare authored and typed
BIM volumes for the two `RoadRailing` and four `SpandrelWall` occurrences.

`tests/familyProjection.test.tsx` still asserts the known incorrect result: `RoadRailing`
projected volume is more than twice the authored volume, and `SpandrelWall` projected volume is
more than 1.5 times the authored volume. `tests/fullModel.test.tsx` keeps the intended equality
checks pending.

#### Expected result

At the Family projection seam, use a typed parametric IFC Body only when it matches the authored
Family Body. Otherwise, preserve the exact authored Body or accept a Family-supplied typed
specification.

The IFC class must remain typed. An exact Body is not a request to downgrade the occurrence to a
proxy.

#### Acceptance criteria

- A civil Product can opt into an exact evaluated Body, or supply a typed spec that describes the
  same shape.
- Body evaluation supports the multi-solid railing compound or defines a clear fusion step.
- `RoadRailing` exports its posts and rails as `IfcRailing.GUARDRAIL`.
- `SpandrelWall` exports its arch openings as `IfcWall`.
- Authored and projected volume and world bounds agree within the established geometry tolerance.
- Rectangular girders, stems, pads, and decks continue to use parametric swept solids.
- The five-point `AbutmentSupportBeam` profile continues to use its supplied parametric profile.
- Evaluator and model ownership rules remain explicit and leak-free.

#### Local completion

Choose the upstream path for `RoadRailing` and `SpandrelWall`, add round-trip assertions, and
remove the known envelope mismatch. See `LOCAL-006`.

## Ready to file

### BREP-002: Add a typed exact-body IfcMember route

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim` |
| Kind | Enhancement |
| Status | `ready` |
| Upstream | Not filed |
| Last verified | 2026-09-02 |

#### Problem

`ArchSegment` declares Product category `member` and role `arch-segment`.
`brepjs-bim` has no `MEMBER` category, `MemberSpec`,
`addMember`, or civil Product route. Eight correctly authored arch bands therefore become
`IfcBuildingElementProxy`. Without `proxyEvaluator`, export fails.

An arch band cannot use a rectangular envelope extrusion. Its authored Body is the extrusion of
the band between its inner and outer curves.

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
| Last verified | 2026-09-02 |

#### Problem

`BridgeNameSign` declares Product category `sign` and role `marker`. `brepjs-bim` has no `SIGN`
category, `SignSpec`,
`addSign`, or civil Product route. Four signs therefore become `IfcBuildingElementProxy`.

The sign Body is now one plain authored plate, with text carried as metadata. It still falls back
to `IfcBuildingElementProxy` because no typed Sign route exists.

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
| Last verified | 2026-09-02 |

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

## Deferred

### BREP-009: Support an IFC4X3_ADD2 schema token

| Field | Value |
| --- | --- |
| Target | `packages/brepjs-bim`, IFC writer |
| Kind | Enhancement |
| Status | `deferred` |
| Upstream | Not filed |
| Last verified | 2026-09-02 |

#### Difference

`toIfc` accepts `IFC4` or `IFC4X3`. The donor header uses `IFC4X3_ADD2`.

#### Desired result

Allow `IFC4X3_ADD2` when the selected writer backend can emit and validate that schema identifier.
Keep `IFC4X3` as a supported value.

#### Reactivate when

An IFC receiver rejects `IFC4X3`, requires the exact ADD2 header token, or the writer backend adds
first-class ADD2 support.

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

### LOCAL-006: Select the typed exact-Body path after BREP-005

Use the upstream contract to preserve the posts and rails in `RoadRailing` and the arch openings
in `SpandrelWall`. Keep the five-point `AbutmentSupportBeam` profile on its existing parametric
Beam path.

Add volume, bounds, IFC class, material, and round-trip assertions for each affected Family.

### LOCAL-007: Add optional donor scene objects after BREP-011

The donor contains objects that this model does not yet author:

- `environment - site`, composition `COMPLEX`
- `road parking - site`, composition `PARTIAL`
- `road - site`, composition `PARTIAL`
- Two `highway location marker` assemblies with predefined type `FACTORY`

The donor places its other transport sites below the `COMPLEX` environment as `PARTIAL` children.
If these objects are added, reparent the three existing transport sites to match that hierarchy.
Add the objects only when their source geometry and set-out are in scope. Use the project CRS from
`LOCAL-002` instead of copying the donor `geo-reference` proxy.

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
initialization. Datum-aware placement is available after BREP-014; remaining exporter gaps for
compound and voided Bodies are BREP-005.

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
- BREP-005 and LOCAL-006 continue to track exporter fidelity separately from Family
  parametricity.
