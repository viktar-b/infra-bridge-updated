# Changelog

Dated notes for this repo. Newest entry first. Add a new `## YYYY-MM-DD` block when dependencies or authoring/export behaviour change.

---

## 2026-08-27

### Dependencies

| Package | Previous example (vendored) | This repo (installed) |
| --- | --- | --- |
| `brepjs` | 18.150.1 | 18.163.0 |
| `brepjs-families` | 0.7.0 | 0.11.0 |
| `brepjs-bim` | 0.16.1 | 0.22.0 |
| `brepjs-cad` | (internal) | 0.177.0 |
| `occt-wasm` | 4.2.0 | 4.3.2 |
| `zod` | 4.4.3 | 4.4.3 |

`package.json` ranges: `brepjs ^18`, `brepjs-families >=0.10 <1`, `brepjs-bim >=0.21 <1`. Preview and export use the published `brep` CLI (`brepjs-cad`), not vendored tarballs.

### What changed

Mechanical port of the authored infra-bridge onto the published family/BIM stack so the old scaffold can be compared with the new one. Geometry, set-out, and civil hierarchy stay the same; the authoring and export APIs do not. The 0.7 / 0.16 APIs no longer exist on npm, and the published packages already replace the local wrappers this example used to carry.

- **Placement.** Families 0.11 dropped `frame` / `yawFrame`. Occurrences still *author* `tRotate` + `tTranslate`. `spatialGroup` peels yaw off civil spatial nodes (translation-only IFC frames) and pushes it onto children. Product families bake remaining rotates into CSG and stamp `axisX` / `axisZ` for the spec path. `src/placement.ts` owns that pose folding.
- **Civil meaning.** `civilSite` / `civilProduct` / `civilVocabulary.ts` deleted. Families call `civilSemantics()` directly. Site role is `transport-site`. No `kind: 'project'`; the root is an untyped group and `familiesToBim` detects civil structure from descendants.
- **Composition.** `assembly()` / `model()` collapsed to `family()` rendering `el('Group', …)`. Keys still mint identity; GlobalIds still derive from key paths.
- **IFC.** `familiesToBim` replaces `projectInfraBridge` / `evaluatedModel`. Use `bodyEvaluator` (Earthworks Fill), `proxyEvaluator` (unrouted products), and `toIfc(..., { ifcSchema: 'IFC4X3' })`. Typed civil products: beam, column, footing, railing, slab, wall. Member and sign stay outside that profile and export as `IfcBuildingElementProxy`. Full-tree export succeeds; civil spatial nodes are translation-only.

`ArchSegment` is authored as `product` / `member` / `arch-segment`. That maps to IFC `IfcMember` with `PredefinedType = ARCH_SEGMENT` (in the schema since IFC4.2). It is **not** `IfcBridgePart` — that class is the spatial container (`RailArchSuperstructure` already occupies `SUPERSTRUCTURE`). brepjs-bim 0.22 has no `addMember` / `MEMBER` category, so the eight arch bands export as `IfcBuildingElementProxy`.

### Future actions

- Ask brepjs-bim for a typed `IfcMember` route (`CIVIL_PRODUCT_ROUTES` `member` / `arch-segment` → `PredefinedType: ARCH_SEGMENT`) so `ArchSegment` stops proxying. Keep the family semantics as they are; do not retarget it to `IfcBridgePart` or `IfcBeam`.
- Same request for `IfcSign` (`BridgeNameSign`: `product` / `sign` / `marker`) if signs should be typed rather than proxied.
- Decide whether compound typed products (`RoadRailing`, `SpandrelWall`) should stay spec-rebuilt envelopes or need an exact-body path like Earthworks Fill.
