import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup(provider) {
  const slots = [];
  const alerts = [];
  let cursor = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], value => { slots[i] = value; }];
    },
    useRef(initial) {
      const i = cursor++;
      return slots[i] ??= { current: initial };
    },
  };
  const module = { exports: {} };
  const output = ts.transpileModule(readFileSync(new URL('../app/(auth)/Auth.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(output, {
    module, exports: module.exports,
    alert: message => alerts.push(message),
    require(name) {
      if (name === 'react') return react;
      if (name === 'firebase/app') return {};
      if (name === '@react-native-firebase/auth') return () => provider;
      if (name === 'react-native') return {
        ...Object.fromEntries(['Text', 'View', 'KeyboardAvoidingView', 'TextInput', 'Button', 'ActivityIndicator'].map(name => [name, name])),
        StyleSheet: { create: value => value },
      };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  function all(tree) {
    if (Array.isArray(tree)) return tree.flatMap(all);
    if (!tree || typeof tree !== 'object') return [];
    return [tree, ...all(tree.props.children)];
  }
  const render = () => { cursor = 0; return all(module.exports.default()); };
  const fields = () => render().filter(node => node.type === 'TextInput');
  fields()[0].props.onChangeText('person@example.invalid');
  fields()[1].props.onChangeText(' password ');
  return {
    fields, alerts,
    button: title => render().find(node => node.props.title === title)?.props,
    loading: () => render().some(node => node.type === 'ActivityIndicator'),
  };
}

for (const firstTitle of ['Login', 'Create account']) {
  test(`same-frame ${firstTitle} excludes both repeated and opposite auth operations`, async () => {
    let resolve;
    const pending = new Promise(accept => { resolve = accept; });
    const calls = [];
    const screen = setup({
      signInWithEmailAndPassword: () => { calls.push('login'); return pending; },
      createUserWithEmailAndPassword: () => { calls.push('signup'); return pending; },
    });
    const login = screen.button('Login').onPress;
    const signup = screen.button('Create account').onPress;
    const first = firstTitle === 'Login' ? login : signup;
    const request = first();
    const repeatedLogin = login();
    const repeatedSignup = signup();
    const overlappingCalls = [...calls];
    const loading = screen.loading();
    resolve();
    await Promise.all([request, repeatedLogin, repeatedSignup]);
    assert.deepEqual(overlappingCalls, [firstTitle === 'Login' ? 'login' : 'signup']);
    assert.equal(loading, true);
    assert.equal(screen.loading(), false);
    await screen.button('Login').onPress();
    assert.equal(calls.length, 2);
  });
}

test('registration rejection preserves both edited fields and restores retry controls', async () => {
  const screen = setup({
    createUserWithEmailAndPassword: async () => { throw new Error('Try again later'); },
  });
  await screen.button('Create account').onPress();
  assert.equal(screen.loading(), false);
  assert.equal(screen.fields()[0].props.value, 'person@example.invalid');
  assert.equal(screen.fields()[1].props.value, ' password ');
  assert.equal(screen.alerts[0], 'Registration failed: Try again later');
  assert.ok(screen.button('Create account'));
});

test('password text stays masked while the email input remains independently editable', () => {
  const screen = setup({});
  assert.equal(screen.fields()[1].props.secureTextEntry, true);
  assert.equal(screen.fields()[0].props.secureTextEntry, undefined);
  screen.fields()[0].props.onChangeText('other@example.invalid');
  assert.equal(screen.fields()[1].props.value, ' password ');
});
