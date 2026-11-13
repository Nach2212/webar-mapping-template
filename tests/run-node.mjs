// node tests/run-node.mjs — corre las pruebas unitarias sin navegador.
import { runAll } from './unit.js';

const { total, failed } = await runAll((name, err) => {
  console.log(`${err ? '✗' : '✓'} ${name}${err ? '\n    ' + err.message : ''}`);
});
console.log(`\n${total - failed}/${total} pruebas OK`);
process.exit(failed ? 1 : 0);
