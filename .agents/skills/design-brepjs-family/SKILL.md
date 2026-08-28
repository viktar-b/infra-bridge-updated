---
name: design-brepjs-family
description: Design or improve a brepjs Family as one deep declarative JSX module. Use when creating, reconstructing, or refactoring a Family, or checking its props, semantics, placement, private CSG kernel, and exporter parity.
---

# Design a brepjs Family

Read the repository instructions and the **Family invocation seam** and **Family projection seam** definitions in [CONTEXT.md](../../../CONTEXT.md).

Apply [codebase-design](../codebase-design/SKILL.md), then [principle-type-system-discipline](../principle-type-system-discipline/SKILL.md), [principle-boundary-discipline](../principle-boundary-discipline/SKILL.md), and [typescript-best-practices](../typescript-best-practices/SKILL.md). For a recurring correction, read [principle-encode-lessons-in-structure](../principle-encode-lessons-in-structure/SKILL.md) before adding instructions. Read [UPSTREAM.md](../UPSTREAM.md) only when refreshing these vendored skills.

A Family is done when one public JSX invocation controls validation, target-neutral semantics, placement, viewport geometry, and adapter input without duplicating the geometry recipe.

## Family flow

Runtime data crosses two seams:

```text
Caller JSX (`z.input`)
          │
          ▼
┌─ Family invocation seam ─────────────────────────────┐
│ Zod validation → defaults → target-neutral derivation │
└──────────────────────┬────────────────────────────────┘
                       ▼
        Validated Family props (`z.output`)
                       │
         ┌─────────────┴──────────────┐
         │ Family projection seam     │
         ▼                            ▼
Explicit JSX → private `*Kernel`   Semantics + resolved props
                       │              │
                       ▼              ▼
                    CSG IR       Downstream adapter
                       │              │
                       ▼              ▼
             Viewport evaluation   BIM/export
```

Write the module dependency-first so the exported Family reads as its conclusion:

```text
Composable schemas and exported types
                   │
                   ▼
Private types and pure derivations
                   │
                   ▼
Complete props schema and exported types
                   │
                   ▼
Semantics → Private `*Kernel`
                   │
                   ▼
Exported Family: declarative JSX only
```

## 1. Trace both seams

Read the Family, callers, composed schemas, set-out data, tests, placement helpers, and every adapter that reads the resolved element. Capture:

- invocation props, defaults, exports, and validation behavior;
- units, axes, datum, handedness, and placement;
- identity, key paths, material, and semantics;
- bounds, volume, openings, and occurrence count;
- resolved props consumed by adapters.

For an existing Family, treat every export and accepted input as interface until the user approves otherwise. Record latent validation gaps separately. Settle interface and package-ownership decisions before editing. For reconstruction, distinguish measurements from assumptions and retain each parameter's source.

Done when every caller and adapter dependency is accounted for and the behavior to preserve is explicit.

## 2. Define one declarative model

Validate caller data at the invocation seam with Zod. Keep `z.input` explicit for JSX callers and `z.output` explicit for render, semantics, and resolved props. Use named dimension objects, discriminated unions for real variants, and relational validation for a new or deliberately redesigned interface.

Export a schema only when another Family or assembly intentionally composes it. Preserve existing exports during an interface-preserving refactor, re-exporting from the original module if ownership moves.

Derive each target-neutral profile, path, layout, or normalized dimension once in a pure function defined before its first use. Put adapter-consumed results on the outer schema output. Keep implementation-only results private even when semantics and the kernel share them.

Done when semantics, kernel geometry, and adapters use one authoritative input or derived representation.

## 3. Cross into one private kernel

The exported Family owns schema, semantics, placement, identity-facing behavior, and adapter-visible derivation. Its renderer explicitly passes validated values through JSX into one non-exported `*Kernel` Family.

```tsx
type MemberKernelProps = Pick<MemberProps, 'length' | 'profile' | 'transform'>;

const MemberKernel = family<MemberKernelProps>(
  'MemberKernel',
  ({ length, profile, transform }) =>
    placedGeometry(buildMemberIr({ length, profile }), transform)
);

export const Member = family<MemberProps, MemberInput>(
  'Member',
  ({ length, profile, transform }) => (
    <MemberKernel length={length} profile={profile} transform={transform} />
  ),
  { props: memberProps, semantics }
);
```

`resolve()` keeps the outer Family's identity, props, semantics, key path, and children while rendering the kernel to an intrinsic. Keep private types and helpers in the same file until real reuse earns a shared module. Shared target-neutral Family contracts belong in `brepjs-families`; exporter vocabulary belongs in its adapter.

Done when the public renderer contains no kernel recipe and the kernel is absent from the resolved product tree.

## 4. Verify through the exported Family

Resolve and evaluate the public Family. Cover each branch that changes validation or geometry: handedness, datum and placement, relational dimensions, optional or repeated features, bounds or volume, resolved profiles, and semantic envelopes.

When an adapter can represent the Family exactly, compare its projected spec or solid with the authored CSG and exercise a practical export/import round trip. Otherwise report the adapter gap and keep the authored Family authoritative.

For analysis, return the interface, recommended seam, ownership decisions, adapter gaps, and verification plan without editing. For implementation, run focused tests during the change, then typecheck and run the full suite.

Done when every recorded interface fact matches its baseline or an approved change, and all required checks pass.

## What not to do

- Do not expose CSG nodes, shapes, evaluator handles, or IFC objects through invocation props.
- Do not remove an export merely because repository search finds no consumer.
- Do not abbreviate `z.input` or `z.output` with a helper that only hides Zod vocabulary.
- Do not derive separate profiles or layouts for semantics, CSG, and adapters, or hide adapter-required data inside the kernel.
- Do not import `brepjs-bim` into a Family for a structurally compatible type.
- Do not create `utils.ts`, a registry, factory, port, or package contract for one helper or hypothetical consumer.
- Do not duplicate public prop shapes or use `any`, unchecked `as`, or non-null assertions.
- Do not export or directly test the private kernel; test the public Family.
- Do not evaluate shapes, allocate evaluators, dispose borrowed handles, or perform top-level kernel work in a Family module.
- Do not change defaults, prop names, validation timing, semantics, datum, placement, or key behavior as an internal refactor.
