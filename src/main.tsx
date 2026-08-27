/**
 * Infra-bridge model. `export default` the element tree — the tools own
 * evaluation. Font registration is kernel work, so it happens inside the
 * async builder rather than at module top-level.
 *
 *   npm run preview        live viewer (add -- --watch for re-render on save)
 *   npm start              print per-element mesh stats
 *   npm run export:ifc     write dist/model.ifc
 *   npm test               resolve + mesh every element
 *
 * Units are mm.
 */
import { InfraBridge } from './model/infraBridge.tsx';
import { loadProjectFont } from './fonts/projectFont.ts';

/** Load owned assets and build the authored Model. */
export async function buildInfraBridge() {
  await loadProjectFont();
  return InfraBridge({ key: 'infra-bridge' });
}

export default async function () {
  return buildInfraBridge();
}
