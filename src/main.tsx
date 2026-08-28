/**
 * Infra-bridge model. `export default` the element tree — the tools own
 * evaluation.
 *
 *   npm run preview        live viewer (add -- --watch for re-render on save)
 *   npm start              print per-element mesh stats
 *   npm run export:ifc     write dist/model.ifc
 *   npm test               resolve + mesh every element
 *
 * Units are mm.
 */
import { InfraBridge } from './model/infraBridge.tsx';

/** Build the authored Model without performing top-level kernel work. */
export async function buildInfraBridge() {
  return InfraBridge({ key: 'infra-bridge' });
}

export default async function () {
  return buildInfraBridge();
}
