import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

test('auth redirects cancel obsolete timers on rerun and unmount', () => {
  const effects = [];
  const timers = new Map();
  const routes = [];
  const states = [false, { uid: 'first' }];
  let cursor = 0;
  let nextId = 0;
  const react = {
    useState: () => [states[cursor++], () => {}],
    useEffect: effect => effects.push(effect),
    createElement: () => ({}),
  };
  const module = { exports: {} };
  const source = readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText, {
    module, exports: module.exports,
    setTimeout: (callback, delay) => {
      assert.equal(delay, 100);
      timers.set(++nextId, callback);
      return nextId;
    },
    clearTimeout: id => timers.delete(id),
    require(name) {
      if (name === 'react') return react;
      if (name === 'expo-router') return { useRouter: () => ({ replace: path => routes.push(path) }) };
      if (name === '@react-native-firebase/auth') return () => ({ currentUser: null });
      return {};
    },
  });
  function render(user) {
    cursor = 0;
    effects.length = 0;
    states[1] = user;
    module.exports.default();
    return effects[1]();
  }
  const cleanup = render({ uid: 'first' });
  cleanup?.();
  const logoutCleanup = render(null);
  for (const callback of timers.values()) callback();
  timers.clear();
  assert.deepEqual(routes, ['/(auth)/Auth']);
  logoutCleanup?.();
  const unmountCleanup = render({ uid: 'second' });
  unmountCleanup?.();
  for (const callback of timers.values()) callback();
  assert.deepEqual(routes, ['/(auth)/Auth']);
});
