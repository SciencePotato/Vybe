import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup(cachedUser) {
  const slots = [];
  const effects = [];
  const routes = [];
  const timers = [];
  let cursor = 0;
  let callback;
  const router = { replace: route => routes.push(route) };
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], value => { slots[i] = value; }];
    },
    useEffect(effect, dependencies) {
      const i = cursor++;
      const previous = slots[i];
      if (!previous || dependencies.some((value, j) => value !== previous.dependencies[j])) {
        slots[i] = { dependencies };
        effects.push(effect);
      }
    },
  };
  const dependencies = {
    react,
    '@react-native-firebase/auth': () => ({
      currentUser: cachedUser,
      onAuthStateChanged: fn => { callback = fn; return () => {}; },
    }),
    'expo-router': { useRouter: () => router },
    'expo-router/drawer': Object.assign(() => {}, { Screen: 'Screen' }),
    'react-native-gesture-handler': { GestureHandlerRootView: 'GestureHandlerRootView' },
    '@/components/customDrawer': {},
  };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText, {
    module, exports: module.exports, console: { log() {} },
    setTimeout: fn => { timers.push(fn); return timers.length; },
    require(name) {
      assert.ok(name in dependencies, `Unexpected dependency ${name}`);
      return dependencies[name];
    },
  });
  const render = () => {
    cursor = 0; module.exports.default(); effects.splice(0).forEach(effect => effect());
  };
  render();
  return {
    routes,
    flush: () => timers.splice(0).forEach(fn => fn()),
    emit: user => { callback(user); render(); },
  };
}

for (const cachedUser of [null, { uid: 'cached-fixture' }]) {
  test(`initial ${cachedUser ? 'cached account' : 'signed-out'} routing waits for the first SDK state`, () => {
    const root = setup(cachedUser);
    root.flush();
    assert.deepEqual(root.routes, []);
    root.emit(cachedUser);
    root.flush();
    assert.deepEqual(root.routes, [cachedUser ? '/(home)/(homeTabs)' : '/(auth)/Auth']);
  });
}
