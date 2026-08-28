---
name: design-brepjs-family
description: Design or improve a brepjs Family as one deep declarative JSX module. Use when creating, reconstructing, refactoring, or preparing a Family for drop-in distribution, or checking its props, semantics, placement, private CSG kernel, and exporter parity.
---

# Design a brepjs Family

Read the repository instructions and the **Family invocation seam** and **Family projection seam** definitions in [CONTEXT.md](../../../CONTEXT.md).

Apply [codebase-design](../codebase-design/SKILL.md), then [principle-type-system-discipline](../principle-type-system-discipline/SKILL.md), [principle-boundary-discipline](../principle-boundary-discipline/SKILL.md), and [typescript-best-practices](../typescript-best-practices/SKILL.md). For a recurring correction, read [principle-encode-lessons-in-structure](../principle-encode-lessons-in-structure/SKILL.md) before adding instructions. Read [UPSTREAM.md](../UPSTREAM.md) only when refreshing these vendored skills.

A Family is done when one public JSX invocation controls validation, target-neutral semantics, placement, viewport geometry, and adapter input without duplicating the geometry recipe or overstating exporter fidelity.

## Parametric drop-in Family

A **parametric drop-in Family** is a source-owned JSX module that another brepjs project can copy, edit, and use through documented engineering properties. It depends only on public brepjs packages and explicitly declared, copyable dependencies, never on hidden project set-out, assemblies, material catalogs, assets, or exporter implementation.

Its invocation schema validates caller data, while the Family privately derives definition-owned semantics, Datum-aware geometry, and adapter-visible data from one authoritative model. Parameters vary documented aspects of one stated topology; arbitrary topology is not required.

A **drop-in-ready Family** has a portable interface, co-located contract documentation, and declared dependencies. A **published drop-in Family** additionally has a complete registry payload and passes a clean consumer fixture. Export portability is a separate claim proven through classification, body, and placement parity.

The consuming project owns copied source. Registry updates present explicit diffs and never overwrite local changes automatically.

Every exported leaf Family targets the drop-in-ready standard. Assemblies may remain project-specific because they intentionally own set-out, occurrence composition, and material selection.

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

Route each derivation by who must consume it:

```text
Validated Family props
          │
          ▼
Is the derivation target-neutral?
     ┌────┴────┐
    no        yes
    │           │
CSG kernel   Does an adapter consume it?
                ┌────┴────┐
               no        yes
               │           │
        Private pure    Resolved schema
          derivation       output
               └─────┬─────┘
                     ▼
              Authored CSG body
                     │
                     ▼
       Can the typed adapter express it exactly?
            ┌────────┴────────┐
           yes                no
           │                   │
     Prove parity       Preserve the authored body
                       and report the adapter gap
```

## 1. Trace both seams

Read the Family, callers, composed schemas, set-out data, tests, placement helpers, and every adapter that reads the resolved element. Build a preservation ledger with:

- invocation props, defaults, exports, and validation behavior;
- units, axes, datum, handedness, and placement;
- identity, key paths, material, and semantics;
- fixed topology, runtime initialization, assets, and performance controls;
- public package dependencies and copyable sibling dependencies;
- geometry branches, bounds, volume, openings, and occurrence count;
- adapter route and resolved props it consumes;
- classification, body, and placement fidelity after projection.

For an existing Family, treat every export and accepted input as interface until the user approves otherwise. Record latent validation gaps separately. Settle interface and package-ownership decisions before editing. For reconstruction, distinguish measurements from assumptions and retain each parameter's source.

Done when every caller and adapter dependency is accounted for and the behavior to preserve is explicit.

## 2. Define one declarative model

Validate caller data at the invocation seam with Zod. Keep `z.input` explicit for JSX callers and `z.output` explicit for render, semantics, and resolved props. Use named dimension objects, discriminated unions for real variants, and relational validation for a new or deliberately redesigned interface.

For a drop-in Family, export the Family, its complete props schema, and explicit `z.input` and `z.output` types. Export a nested schema only when another Family or assembly intentionally composes it. Preserve existing exports during an interface-preserving refactor, re-exporting from the original module if ownership moves.

Keep core semantics definition-owned. Represent a genuine semantic or geometric alternative with a discriminated variant; do not accept an arbitrary semantics override that can contradict the authored body. Keep units, axes, Datum, fixed topology, runtime requirements, and performance controls beside the interface through expressive schema names and concise JSDoc.

A drop-in-ready Family may depend on public brepjs packages and declared sibling modules with real shared ownership. Keep project set-out, assemblies, material catalogs, private assets, and exporter implementations outside it. An asset-backed Family must carry the asset in its declared payload and expose explicit, idempotent initialization; otherwise classify it as project-specific. Keep temporary upstream workarounds in a named compatibility module outside the Family.

Derive each target-neutral profile, path, layout, or normalized dimension once in a pure function defined before its first use. Put adapter-consumed results on the outer schema output. Keep a target-neutral derivation private when only semantics and the kernel consume it. Keep CSG nodes, contours, cutting tools, evaluator handles, and disposable resources inside the kernel implementation.

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

`resolve()` keeps the outer Family's identity, props, semantics, key path, and children while rendering the kernel to an intrinsic. A rectangular kernel may remain one expression; depth comes from the public Family interface, not extra builder layers. Keep private types and helpers in the same file until intentional reuse gives another module ownership. Shared target-neutral Family contracts belong in `brepjs-families`; exporter vocabulary belongs in its adapter.

Done when the public renderer contains no kernel recipe and the kernel is absent from the resolved product tree.

## 4. Verify through the exported Family

Resolve and evaluate the public Family. Cover each branch that changes validation or geometry: handedness, datum and placement, relational dimensions, optional or repeated features, resolved profiles, and semantic envelopes. Match the assertion to the authored feature: use volume or section checks for profiles, opening or volume checks for cuts, and occurrence or component checks for repeated compounds. Bounds alone verify only envelopes.

Check projection along three independent axes:

- **Classification fidelity:** category, role, and predefined type.
- **Body fidelity:** profile, openings, components, bounds, and volume.
- **Placement fidelity:** world Datum, origin, and orientation.

When an adapter can represent the Family exactly, compare its projected spec or solid with the authored CSG and exercise a practical export/import round trip. Volume equality does not prove placement. When the adapter cannot express the body, measure and report the loss, then keep the authored Family authoritative. A proxy may preserve the body while losing classification; record both facts.

For drop-in publication, add a registry payload that declares copied source, sibling modules, tests, assets, runtime initialization, and source revision. Prove the payload in one clean consumer fixture that imports every registered Family through its public entry point. The fixture must typecheck, resolve, and evaluate each Family without private repository imports. Registry updates may compare revisions and present a diff, but the copied source remains consumer-owned.

For analysis, return the interface, recommended seam, ownership decisions, adapter gaps, portability state, and verification plan without editing. For implementation, run focused tests during the change, then typecheck and run the full suite.

Done when every recorded interface fact matches its baseline or an approved change, and all required checks pass.

## What not to do

- Do not expose CSG nodes, shapes, evaluator handles, or IFC objects through invocation props.
- Do not call a Family drop-in-ready while it depends on undeclared project files or hidden runtime initialization.
- Do not call a Family published until its complete payload passes the clean consumer fixture.
- Do not remove an export merely because repository search finds no consumer.
- Do not abbreviate `z.input` or `z.output` with a helper that only hides Zod vocabulary.
- Do not derive separate profiles or layouts for semantics, CSG, and adapters, or hide adapter-required data inside the kernel.
- Do not expose a private layout merely because semantics also needs its envelope.
- Do not import `brepjs-bim` into a Family for a structurally compatible type.
- Do not accept arbitrary caller-supplied semantics that can contradict the definition-owned body.
- Do not create `utils.ts`, a registry, factory, port, or package contract for one helper or hypothetical consumer.
- Do not move local Datum arithmetic or private types to a shared module without an intentional second owner.
- Do not duplicate public prop shapes or use `any`, unchecked `as`, or non-null assertions.
- Do not export or directly test the private kernel; test the public Family.
- Do not evaluate shapes, allocate evaluators, dispose borrowed handles, or perform top-level kernel work in a Family module.
- Do not treat a correct IFC category or matching bounds as proof of body parity.
- Do not rebuild a detailed authored body from envelope dimensions and call the projection exact.
- Do not tighten latent relational validation during an interface-preserving kernel extraction.
- Do not wrap a one-expression rectangular kernel in extra builders or factories.
- Do not let registry updates overwrite consumer-owned source automatically.
- Do not change defaults, prop names, validation timing, semantics, datum, placement, or key behavior as an internal refactor.
