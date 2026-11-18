import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const image = process.env.JCRM_IMAGE || 'jcrm:container-test';
function docker(args, options = {}) {
  const result = spawnSync('docker', args, {
    cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`docker ${args.slice(0, 4).join(' ')} failed:\n${result.stderr || result.stdout || 'See build output above.'}`);
  return result.stdout?.trim() || '';
}

for (const mode of ['preview', 'prod']) docker(['compose', '-f', `docker-compose.${mode}.yml`, 'config', '--quiet']);
if (!process.argv.includes('--skip-build')) docker(['build', '-t', image, '.'], { stdio: 'inherit' });

for (const mode of ['preview', 'prod']) {
  const project = `jcrm-container-test-${process.pid}-${mode}`;
  const prefix = ['compose', '-p', project, '-f', `docker-compose.${mode}.yml`];
  const env = { ...process.env, JCRM_IMAGE: image, HTTP_BIND: '127.0.0.1', HTTP_PORT: '0' };
  const compose = (args, options = {}) => docker([...prefix, ...args], { env, ...options });
  const request = (path, cookie, body) => {
    const args = ['exec', '-T', 'jcrm', 'curl', '--fail', '--silent', '--show-error', '--include', '--max-time', '10'];
    if (cookie) args.push('--header', `Cookie: ${cookie}`);
    if (body) args.push('--header', 'Content-Type: application/json', '--data', JSON.stringify(body));
    args.push(`http://127.0.0.1:8080${path}`);
    const response = compose(args);
    const divider = response.indexOf('\r\n\r\n');
    assert.ok(divider > 0, 'Expected HTTP response headers');
    return { headers: response.slice(0, divider), body: response.slice(divider + 4) };
  };
  try {
    compose(['up', '-d', '--no-build', '--wait', '--wait-timeout', '120']);
    assert.equal(compose(['exec', '-T', 'jcrm', 'id', '-u']), '10001');
    const id = compose(['ps', '-q', 'jcrm']);
    assert.equal(docker(['inspect', '--format', '{{.State.Health.Status}}', id]), 'healthy');
    if (mode === 'prod') assert.equal(docker(['inspect', '--format', '{{.HostConfig.ReadonlyRootfs}}', id]), 'true');
    const first = request('/api/workspace');
    const cookie = first.headers.match(/^set-cookie:\s*([^;\r\n]+)/im)?.[1];
    assert.ok(cookie, 'Expected an isolated demo session');
    const data = JSON.parse(first.body);
    assert.equal(data.members.length, 5);
    assert.equal(data.accounts.length, 25);
    assert.equal(data.contacts.length, 50);
    assert.equal(data.deals.length, 35);
    const index = request('/').body;
    assert.ok(index.includes('<title>JCRM'));
    const asset = index.match(/<script[^>]*src="([^"]+)"/)?.[1];
    assert.ok(asset, 'Expected the bundled frontend');
    assert.ok(request(asset).body.length > 1000);
    assert.ok(request(`/deals/${data.deals[0].id}`).body.includes('<title>JCRM'));
    if (mode === 'prod') {
      const created = JSON.parse(request('/api/tasks', cookie, {
        accountId: data.accounts[0].id, dealId: null, title: 'Container persistence verification',
        dueDate: data.workspace.today, ownerId: data.members[0].id,
        completed: false, version: 1, requestKey: crypto.randomUUID(),
      }).body);
      compose(['up', '-d', '--no-build', '--force-recreate', '--wait', '--wait-timeout', '120']);
      const restored = JSON.parse(request('/api/workspace', cookie).body);
      assert.equal(restored.workspace.id, data.workspace.id);
      assert.ok(restored.tasks.some(t => t.id === created.id), 'Named-volume data must survive recreation');
      compose(['exec', '-T', 'jcrm', 'sqlite3', '/data/jcrm.db', ".backup '/data/verification-backup.db'"]);
      assert.equal(compose(['exec', '-T', 'jcrm', 'sqlite3', '/data/verification-backup.db', 'PRAGMA integrity_check;']), 'ok');
    }
    console.log(`${mode}: healthy non-root container; automatic seed, UI/API and deep links verified${mode === 'prod' ? '; read-only root, persisted edits, recreation and backup verified' : ''}.`);
  } catch (error) {
    try { console.error(compose(['logs', '--no-color', '--tail', '50'])); } catch {}
    throw error;
  } finally {
    // Only remove this uniquely named test project's containers and volumes.
    compose(['down', '--volumes', '--remove-orphans', '--timeout', '10']);
  }
}
