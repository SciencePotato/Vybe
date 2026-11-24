import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup(user, signOut) {
  const alerts = [], routes = [];
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState: initial => [initial, () => {}],
    useEffect() {},
  };
  const native = {
    View: 'View', Text: 'Text', Button: 'Button', StyleSheet: { create: value => value },
  };
  const { outputText } = ts.transpileModule(
    readFileSync(new URL('../app/(home)/(homeTabs)/index.tsx', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } },
  );
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports,
    alert: message => alerts.push(message),
    require(name) {
      if (name === 'react') return { default: react, ...react };
      if (name === 'react-native') return native;
      if (name === '@react-native-firebase/auth') return { default: () => ({ currentUser: user, signOut }) };
      if (name === 'expo-router') return { useRouter: () => ({ replace: path => routes.push(path) }) };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  const tree = module.exports.default();
  return { press: tree.props.children.find(child => child.type === 'Button').props.onPress, alerts, routes };
}

test('a failed sign-out reports failure without navigating as if signed out', async () => {
  const rejected = Promise.reject(new Error('native sign-out failed'));
  void rejected.catch(() => {});
  const screen = setup({ uid: 'fixture' }, () => rejected);
  await screen.press();
  await Promise.resolve();
  assert.deepEqual(screen.alerts, ['Sign out failed. Please try again.']);
  assert.deepEqual(screen.routes, []);
});

test('the signed-out button routes to login without invoking sign-out', async () => {
  const screen = setup(null, () => { throw new Error('must not sign out an absent user'); });
  await screen.press();
  assert.deepEqual(screen.routes, ['/(auth)/Auth']);
  assert.deepEqual(screen.alerts, []);
});
