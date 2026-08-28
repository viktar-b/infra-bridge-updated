# brepjs Families

This context describes the language used to define parametric building Families and carry their resolved meaning into geometry and export targets.

## Language

**Family invocation seam**:
The boundary where caller JSX enters a Family and becomes validated, defaulted Family properties.
_Avoid_: Input seam, call seam

**Family projection seam**:
The boundary where a resolved Family presents target-neutral properties and semantics to private geometry and downstream adapters.
_Avoid_: Families-to-BIM seam, output seam
