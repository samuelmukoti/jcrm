import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!existsSync(resolve(root, 'frontend/node_modules'))) {
  const install = spawnSync('npm', ['ci', '--prefix', 'frontend'], { cwd: root, stdio: 'inherit' });
  if (install.status) process.exit(install.status);
}
const processes = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }
  setTimeout(() => process.exit(code), 400).unref();
}
function start(command, args, env = {}) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', detached: true, env: { ...process.env, ...env } });
  processes.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code || 0); });
  return child;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
start('./mvnw', ['-B', '-pl', 'backend', 'spring-boot:run', '-Dspring-boot.run.jvmArguments=--enable-native-access=ALL-UNNAMED'], { JCRM_DB_PATH: process.env.JCRM_DB_PATH || resolve(root, 'data/jcrm.db') });
start('npm', ['--prefix', 'frontend', 'run', 'dev']);
console.log('\nJCRM is starting. Open http://localhost:5173 once the API reports ready.\n');
