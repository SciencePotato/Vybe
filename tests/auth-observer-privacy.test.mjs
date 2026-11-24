import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function observer(path) {
  const slots = [];
  const effects = [];
  const logged = [];
  let cursor = 0;
  let listener;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], value => { slots[i] = value; }];
    },
    useEffect: effect => effects.push(effect),
  };
  const drawer = Object.assign(() => {}, { Screen: 'DrawerScreen' });
  const dependencies = {
    react,
    '@react-native-firebase/auth': () => ({
      currentUser: null,
      onAuthStateChanged: callback => { listener = callback; return () => {}; },
    }),
    'expo-router': { useRouter: () => ({ replace() {} }) },
    'expo-router/drawer': drawer,
    'react-native-gesture-handler': { GestureHandlerRootView: 'GestureHandlerRootView' },
    '@/components/customDrawer': {},
    'react-native': { View: 'View', Text: 'Text', Button: 'Button', StyleSheet: { create: value => value } },
  };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText, {
    module, exports: module.exports,
    console: { log: (...args) => logged.push(args) },
    setTimeout() {}, clearTimeout() {},
    require(name) {
      assert.ok(name in dependencies, `Unexpected dependency ${name}`);
      return dependencies[name];
    },
  });
  const render = () => { cursor = 0; return module.exports.default(); };
  render(); effects.splice(0).forEach(effect => effect());
  return { emit: user => listener(user), render, logged };
}

for (const path of ['../app/_layout.tsx', '../app/(home)/(homeTabs)/index.tsx']) {
  test(`${path} updates auth state without logging the SDK account object`, () => {
    const screen = observer(path);
    const account = { uid: 'fixture', email: 'person@example.invalid', phoneNumber: '+15555550123' };
    screen.emit(account);
    screen.render();
    assert.equal(screen.logged.some(args => args.includes(account)), false);
  });
}

test('home auth observer updates the account-action label in both directions', () => {
  const screen = observer('../app/(home)/(homeTabs)/index.tsx');
  const label = () => screen.render().props.children.find(node => node.type === 'Button').props.title;
  assert.equal(label(), 'Sign In');
  screen.emit({ uid: 'fixture' });
  assert.equal(label(), 'Sign Out');
  screen.emit(null);
  assert.equal(label(), 'Sign In');
});
