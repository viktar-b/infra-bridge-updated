# Leaf Family contracts

Each module in this directory is a source-owned, drop-in-ready Family. Copy the selected `.tsx`
file together with `familyPlacement.ts`. The modules import only `brepjs`, `brepjs-families`,
`zod`, and that sibling placement module. They do not import project set-out, assemblies,
materials, assets, or exporter code.

Every public Family module exports three parts of its invocation interface:

- the complete Zod props schema, named `<familyName>Props`;
- an explicit `z.input` type named `<FamilyName>Input` for JSX callers;
- an explicit `z.output` type named `<FamilyName>Props` for rendering, semantics, and projection.

`AbutmentSupportBeam` also exports its intentionally composable section schema and input/output
types. `RoadRailing` does the same for its post profile. Kernels, CSG nodes, sampled profiles, and
layout derivations stay private.

## Runtime and coordinates

- All lengths and coordinates are millimetres. Angles in `transform` operations are degrees.
- Local axes are right-handed. `+X` is longitudinal, `+Y` is transverse, and `+Z` is up unless a
  Family row below states a more specific direction.
- Call `await init()` from `brepjs` once before evaluating geometry. Family module import and JSX
  construction perform no kernel work.
- The caller owns each `csg.Evaluator` used for evaluation. Family modules allocate no evaluator
  and expose no disposable handles.
- Use TypeScript JSX with `jsx: "react-jsx"`, `jsxImportSource: "brepjs-families"`, and explicit
  `.ts` or `.tsx` import extensions.
- The current source is verified with `brepjs@19.0.1`, `brepjs-families@0.12.0`,
  `brepjs-bim@0.24.0`, `occt-wasm@4.4.0`, and `zod@4.5.4`.
- `BridgeNameSign` has no font or asset initialization. Its text is uppercase metadata, and its
  Body is a plain plate.

`familyPlacement.ts` keeps the authored `transform` list on the Geometry intrinsic.
`familiesToBim` folds `tRotate` and `tTranslate` into IFC `origin`/`axisX`/`axisZ`, including
Datum-aware slab and footing origins. Typed routes still synthesize rectangular envelopes
from semantic dimensions for compound and voided Bodies; that remaining adapter gap is
[`UPSTREAM_ISSUES.md`](../../UPSTREAM_ISSUES.md) BREP-005 / [andymai/brepjs#2272](https://github.com/andymai/brepjs/issues/2272).

## Fixed topology and Datum ledger

| Family | Fixed authored topology | Local Datum and parameter branches | Accepted relational gaps |
| --- | --- | --- | --- |
| `AbutmentSupportBeam` | One five-point closed section extruded along `+X`. | Lower-end corner. `transverseSide` mirrors the section across `Y = 0`. | `backHeight` may be below or above the bearing seat. Existing validation only requires `toeInset < width` and `toeHeight < bearingSeatHeight`. |
| `ApproachSlab` | One rectangular solid. | Upper-inner corner. Longitudinal and transverse side props select any of four `X/Y` directions; thickness extends along `-Z`. | No relationship beyond positive dimensions. |
| `ArchSegment` | One quarter-arch band extruded across `Y`, with one sampled cubic outer curve and one sampled elliptical inner curve. | Outer springing corner. `curveSegments` controls 4 to 48 samples per curve. | Inner and outer curve ordering and `bandThickness` fit are not relationally validated. |
| `BridgeDeck` | One rectangular solid. | Lower set-out point. Its lower corner is at `X = -setoutInset`, `Y = -(width - setoutInset)`. | `setoutInset` may exceed the slab length or width. |
| `BridgeNameSign` | One rectangular plate with depth `plateDepth + reliefDepth`. | Lower centre of the back face. Text is normalized to uppercase metadata and does not change the Body. | Text fitting is intentionally outside this Family. |
| `CrossGirder` | One rectangular solid extending along `-X`. | Lower-end corner. `transverseSide` selects positive or negative `Y`. | No relationship beyond positive dimensions. |
| `EarthFill` | One symmetric sampled cubic crown profile extruded across `Y`. | Crown centreline low point at the profile base. `curveSegments` controls 4 to 48 samples per half. | Control factors may create a poor profile while remaining inside their accepted 0 to 1 range. |
| `Footing` | One rectangular solid. | Top centre. The Body extends down along `-Z`. | No relationship beyond positive dimensions. |
| `MainGirder` | One rectangular solid extending along `-X`. | Lower centreline end. | No relationship beyond positive dimensions. |
| `PierStem` | One rectangular solid centred on `X/Y`. | Pier-cap control point. The stem top is `capOffset` below the Datum and the Body extends down. | `capOffset` is any nonnegative value. |
| `RailPierStem` | One rectangular solid centred on `X` and extending along `+Y/+Z`. | Lower longitudinal-centreline corner. | No relationship beyond positive dimensions. |
| `RoadRailing` | One compound with exactly two rails and repeated posts from one six-point closed profile. | Deck-edge control point. `longitudinalSide` changes rail and post direction. Post count follows the documented pitch, run-in, run-out, and endpoint formula in the module. | Run-in and run-out may exceed length. Generated and endpoint posts may coincide. Profile elevations and widths are not ordered relationally. |
| `SpandrelWall` | One rectangular wall cut by two sampled quarter-arch tools per bay. | Lower-start corner, extending along `+X/+Y/+Z`. `bayCount` changes repetition and `curveSegments` changes each curve sample count. | Opening run may exceed bay width, and opening rise may exceed wall height. |

These accepted gaps are part of the current invocation interface. Tightening them requires a
separate migration decision and tests.

## Projection status

The authored CSG Body remains authoritative. With `brepjs-bim@0.24.0`, simple rectangular
beams, columns, slabs, and footings preserve classification, Body, and Datum-aware placement.
Wall and railing `.geometry` is a `ProductBody` union; volume and bounds checks use
`placedSolids()`. The typed `AbutmentSupportBeam` IFC output preserves its authored profile, but
the eager `BimModel` solid swaps the profile axes (BREP-012). `ArchSegment` and `BridgeNameSign`
preserve their Bodies through proxy projection but lose typed classification (BREP-002,
BREP-003). The IFC reader reconstructs those tessellated Bodies as `TESSELLATED_MANIFOLD`
(BREP-013). `EarthFill` preserves a typed exact Body.

`RoadRailing` and `SpandrelWall` retain typed classification, but the adapter still rebuilds
envelope solids and does not keep the compound posts or arch openings (BREP-005). The IFC
importer can now read every Body representation item, and `#2286` published the exact-Body
writer contract, but the Families adapter does not yet use it. The separate upstream ledger
contains measured reproductions and acceptance criteria.
