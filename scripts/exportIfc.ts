import { mkdirSync, writeFileSync } from 'node:fs';
import { init, unwrap, csg } from 'brepjs';
import { resolve } from 'brepjs-families';
import { toIfc } from 'brepjs-bim';
import { IFC_META } from '../src/exportConfig.ts';
import { projectInfraBridge } from '../src/export/projectInfraBridge.ts';
import { buildInfraBridge } from '../src/main.tsx';

await init();
const tree = resolve(await buildInfraBridge());
using evaluator = new csg.Evaluator();
const projected = projectInfraBridge(tree, {
  bodyEvaluator: evaluator,
  proxyEvaluator: evaluator,
});
if (!projected.ok) {
  console.error(`${projected.error.code}: ${projected.error.message}`);
  process.exit(1);
}
using bim = projected.value.model;
const bytes = unwrap(await toIfc(bim, IFC_META));
mkdirSync('dist', { recursive: true });
writeFileSync('dist/model.ifc', Buffer.from(bytes));
console.log(`wrote dist/model.ifc (${projected.value.idByKeyPath.size} elements)`);
if (projected.value.proxied.length > 0) {
  console.warn(
    `proxied (no typed IFC route): ${projected.value.proxied.map((p) => p.keyPath).join(', ')}`
  );
}
