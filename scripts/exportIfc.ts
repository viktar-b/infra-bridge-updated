import { mkdirSync, writeFileSync } from 'node:fs';
import { init, unwrap, csg } from 'brepjs';
import { resolve } from 'brepjs-families';
import { familiesToBim, toIfc } from 'brepjs-bim';
import { buildInfraBridge } from '../src/main.tsx';

await init();
const tree = resolve(await buildInfraBridge());
using evaluator = new csg.Evaluator();
const projected = familiesToBim(tree, {
  project: { name: 'infra-bridge', projectId: 'infra-bridge' },
  bodyEvaluator: evaluator,
  proxyEvaluator: evaluator,
});
if (!projected.ok) {
  console.error(`${projected.error.code}: ${projected.error.message}`);
  process.exit(1);
}
using bim = projected.value.model;
const bytes = unwrap(
  await toIfc(bim, {
    applicationName: 'infra-bridge',
    applicationVersion: '0',
    ifcSchema: 'IFC4X3',
  })
);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/model.ifc', Buffer.from(bytes));
console.log(`wrote dist/model.ifc (${projected.value.idByKeyPath.size} elements)`);
if (projected.value.proxied.length > 0) {
  console.warn(
    `proxied (no typed IFC route): ${projected.value.proxied.map((p) => p.keyPath).join(', ')}`
  );
}
