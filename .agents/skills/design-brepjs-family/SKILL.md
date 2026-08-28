---
name: design-brepjs-family
description: Design a brepjs Family as a deep declarative module. Use when creating a Family, reconstructing one from reference geometry, or improving its interface, semantics, placement, JSX composition, kernel implementation, or exporter parity.
---

# Design a brepjs Family

Read and apply these project-local skills before working:

- [codebase-design](../codebase-design/SKILL.md) for module, interface, seam, depth, leverage, and locality.
- [principle-type-system-discipline](../principle-type-system-discipline/SKILL.md), [principle-boundary-discipline](../principle-boundary-discipline/SKILL.md), then [typescript-best-practices](../typescript-best-practices/SKILL.md), for schema and TypeScript decisions.

If the work generalizes a correction that has appeared more than once, read [principle-encode-lessons-in-structure](../principle-encode-lessons-in-structure/SKILL.md) before deciding whether the lesson belongs in a schema, helper, test, or instruction.

These are vendored non-standard skills. Their sources and update procedure live in [UPSTREAM.md](../UPSTREAM.md); read it only when refreshing the snapshots.

A Family is done when one public JSX invocation controls validation, target-neutral semantics, placement, viewport geometry, and adapter input without duplicating the geometry recipe.

## Establish the interface

Read the repository instructions, the Family, every caller, set-out data, tests, placement helpers, and each adapter that consumes the resolved element.

Record:

- invocation props, defaults, and validation errors;
- axes, datum, handedness, units, and placement behavior;
- identity, key-path, material, and semantic behavior;
- observable geometry such as bounds, volume, openings, and occurrence count;
- resolved props consumed by exporters or other adapters.

For an existing Family, keep this interface fixed unless the user explicitly requests a change. Accepted invalid inputs and validation errors are part of that interface. Record latent validation gaps for a separate decision instead of tightening them during an interface-preserving refactor. For reconstruction, distinguish evidence from assumptions and retain the source measurements used for each parameter.

Completion: every caller and adapter dependency is accounted for, and every behavior that must survive the work is explicit.

## Choose one declarative source of truth

Validate invocation data with a Zod schema and derive invocation and resolved types with `z.input` and `z.output`. Use named objects for related dimensions and discriminated unions for real variants. For a new or explicitly redesigned interface, add relational validation when field-level checks cannot protect the geometry.

Define target-neutral profiles, paths, occurrence layouts, or normalized dimensions in one place. Keep derived values on the outer Family props when an adapter reads them. When semantics and geometry share implementation-only data, use one pure derivation function from the validated props and keep its result out of the resolved props.

Completion: every semantic, geometry, and adapter value comes from one authoritative input or one derived representation.

## Keep the public Family declarative

The exported Family owns its schema, defaults, target-neutral semantics, identity-facing behavior, placement contract, and derivation shared by multiple projections. Its renderer uses JSX to state which validated values enter the private geometry implementation.

Put kernel work behind a non-exported geometry Family. Derive its props from the public resolved type:

```tsx
type MemberGeometryProps = Pick<MemberProps, 'length' | 'profile' | 'transform'>;

const MemberGeometry = family<MemberGeometryProps>(
  'MemberGeometry',
  ({ length, profile, transform }) =>
    placedGeometry(buildMemberIr({ length, profile }), transform)
);

export const Member = family<MemberProps, MemberInput>(
  'Member',
  ({ length, profile, transform }) => (
    <MemberGeometry length={length} profile={profile} transform={transform} />
  ),
  { props: memberProps, semantics }
);
```

`resolve()` retains the outer Family's identity, props, and semantics while rendering nested private Families down to an intrinsic. This is an internal seam, not another public product or an adapter abstraction.

Keep the private implementation in the same file until size or real reuse justifies a private sibling module.

Completion: the exported renderer contains no direct kernel recipe. Resolving it retains the public Family's type, props, semantics, key path, and children; the private geometry Family does not appear as a separate product.

## Verify through the public seam

Resolve and evaluate the exported Family rather than its private geometry implementation. Cover the branches that can change the result:

- invalid relational dimensions;
- handed or directional variants;
- datum and placement;
- bounds and volume;
- repeated, optional, fused, or voided features;
- resolved profile and semantic envelope;
- typed adapter parity when the adapter can express the authored geometry.

For adapter-bound geometry, compare the authored CSG result with the projected spec. Serialize and import it again when the exporter supports a practical round-trip test. If the adapter cannot express the geometry, report the capability gap and preserve the authored Family geometry as the source of truth; do not distort the Family to make a lossy adapter look exact.

For analysis-only work, deliver the recorded interface, recommended seam, known adapter gaps, guardrails, and verification plan without editing files. For implementation work, typecheck, run focused tests during the change, and run the full suite at the end.

Completion: every recorded interface fact either matches its baseline or has an explicitly requested change. For implementation, all required checks pass.

## Hard guardrails: what not to do

- Keep invocation props domain-focused. Do not expose `csg.IRNode`, evaluated shapes, evaluator handles, or IFC objects through the public interface.
- Derive shared geometry once. Do not calculate separate profiles in the CSG implementation, semantics, and adapter path.
- Keep adapter-visible derived props on the outer Family. Do not hide them inside a nested renderer that `ResolvedElement.props` cannot expose.
- Keep implementation-only layouts behind a pure derivation function. Do not add them to schema output merely so semantics and CSG can share a calculation.
- Keep target vocabulary in its adapter. Do not import `brepjs-bim` into a Family merely to satisfy a structurally compatible profile.
- Build CSG IR during rendering. Do not evaluate shapes, allocate evaluators, dispose borrowed handles, or perform top-level kernel work in the model module.
- Derive private prop types with schema outputs, `Pick`, or `Omit`. Do not duplicate public shapes or use `any`, unchecked `as`, or non-null assertions.
- Use a concrete private JSX Family for one kernel implementation. Do not add a port, registry, factory, or adapter interface when nothing varies.
- Test the exported Family seam. Do not export or directly test the private geometry Family.
- Preserve existing defaults, prop names, validation timing, semantics, datum, and key behavior during an improvement. Do not label an interface change as an internal refactor.
- Keep private implementation local. Do not split it into extra files or exports until sprawl or reuse makes that split pay for itself.
