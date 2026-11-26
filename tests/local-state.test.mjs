import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../lib/local-state.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { localState } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

function useStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  globalThis.window = { localStorage: {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  } };
  return values;
}

test('migrates legacy and date-keyed progress to the canonical store', () => {
  const backing = useStorage({ theme: 'dark', 'minarah-prayers-2026-11-26': '{"fajr":true}' });
  assert.equal(localState.getItem('theme'), 'dark');
  assert.equal(localState.getItem('minarah-prayers-2026-11-26'), '{"fajr":true}');
  assert.equal(JSON.parse(backing.get('minarah-local-v1')).version, 1);
});

test('exports and imports a validated portable backup', () => {
  useStorage();
  localState.setItem('mode', 'adult');
  const backup = localState.exportBackup();
  localState.setItem('mode', 'kids');
  localState.importBackup(backup);
  assert.equal(localState.getItem('mode'), 'adult');
  assert.throws(() => localState.importBackup('{broken'), SyntaxError);
  assert.throws(() => localState.importBackup('{"version":9,"values":{}}'), /non reconnu/);
});

test('preserves corrupt canonical data for recovery before migration', () => {
  const backing = useStorage({ 'minarah-local-v1': '{broken', theme: 'pistachio' });
  assert.equal(localState.getItem('theme'), 'pistachio');
  assert.equal(backing.get('minarah-corrupt-v1'), '{broken');
});
