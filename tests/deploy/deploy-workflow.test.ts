import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const workflowPath = join(process.cwd(), '.github/workflows/deploy.yml');
const workflowSource = await readFile(workflowPath, 'utf8');

test('pins every external deployment action to a full commit SHA', () => {
  const actionReferences = [...workflowSource.matchAll(/^\s+-?\s*uses: ([^#\s]+)/gm)].map(
    (match) => match[1],
  );

  expect(actionReferences.length).toBeGreaterThan(0);
  for (const actionReference of actionReferences) {
    expect(actionReference).toMatch(/^[^@\s]+@[0-9a-f]{40}$/);
  }
});

test('reads server connection settings from GitHub secrets', () => {
  expect(workflowSource).toContain('SERVER_HOST: ${{ secrets.SERVER_HOST }}');
  expect(workflowSource).toContain('SERVER_USERNAME: ${{ secrets.SERVER_USERNAME }}');
  expect(workflowSource).toContain('SERVER_SSH_PORT: ${{ secrets.SERVER_SSH_PORT }}');
  expect(workflowSource).toContain('APP_PORT: ${{ secrets.APP_PORT }}');
});

test('restores the Bun dependency cache before installing dependencies', () => {
  const cacheStep = workflowSource.indexOf('- name: Cache Bun dependencies');
  const installStep = workflowSource.indexOf('- name: Install dependencies');

  expect(cacheStep).toBeGreaterThan(-1);
  expect(installStep).toBeGreaterThan(cacheStep);
  expect(workflowSource).toMatch(/uses: actions\/cache@[0-9a-f]{40}/);
  expect(workflowSource).toContain('path: ~/.bun/install/cache');
  expect(workflowSource).toContain(
    "key: bun-${{ runner.os }}-${{ runner.arch }}-${{ hashFiles('bun.lock') }}",
  );
});

test('runs the deployment integration check only for relevant push changes', () => {
  const detectionStep = workflowSource.indexOf('- name: Detect deployment integration changes');
  const integrationStep = workflowSource.indexOf('- name: Test deployment integration');
  const buildStep = workflowSource.indexOf('- name: Build deployment artifact');

  expect(detectionStep).toBeGreaterThan(-1);
  expect(integrationStep).toBeGreaterThan(detectionStep);
  expect(buildStep).toBeGreaterThan(integrationStep);
  expect(workflowSource).toContain(
    "if: github.event_name == 'push' && steps.deployment-integration.outputs.required == 'true'",
  );
  expect(workflowSource).toContain('deploy/run-archive.sh');
  expect(workflowSource).toContain('tests/deploy/run-archive.integration.ts');
  expect(workflowSource).toContain('bun test ./tests/deploy/run-archive.integration.ts');
});

test('exposes the production SSH key only to the copy and deployment steps', () => {
  const sshKeyExpression = '${{ secrets.PROD_SERVER_SSH_KEY }}';
  const namedStepBlocks = workflowSource.split('\n      - name: ').slice(1);
  const sshKeyConsumers = namedStepBlocks
    .filter((stepBlock) => stepBlock.includes(sshKeyExpression))
    .map((stepBlock) => stepBlock.slice(0, stepBlock.indexOf('\n')));

  expect(sshKeyConsumers).toEqual(['Copy files to server', 'Execute deployment script']);
  expect(workflowSource.match(/secrets\.PROD_SERVER_SSH_KEY/g)).toHaveLength(2);
});
