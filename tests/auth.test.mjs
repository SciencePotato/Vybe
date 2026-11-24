import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup(provider) {
  const slots = [], alerts = [];
  let cursor = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = value; }];
    },
  };
  const native = Object.fromEntries(
    ['Text', 'View', 'KeyboardAvoidingView', 'TextInput', 'Button', 'ActivityIndicator'].map(name => [name, name]),
  );
  native.StyleSheet = { create: value => value };
  const { outputText } = ts.transpileModule(
    readFileSync(new URL('../app/(auth)/Auth.tsx', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } },
  );
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports, alert: message => alerts.push(message),
    require(name) {
      if (name === 'react') return { default: react, ...react };
      if (name === 'react-native') return native;
      if (name === '@react-native-firebase/auth') return { default: () => provider };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    return [node, ...(node.props?.children ?? []).flat(Infinity).flatMap(nodes)];
  }
  function render() {
    cursor = 0;
    return nodes(module.exports.default());
  }
  const fields = render().filter(node => node.type === 'TextInput');
  fields[0].props.onChangeText('person@example.invalid');
  fields[1].props.onChangeText(' password with spaces ');
  return {
    press: title => render().find(node => node.props?.title === title).props.onPress(),
    loading: () => render().some(node => node.type === 'ActivityIndicator'),
    alerts,
  };
}

test('login forwards the entered password unchanged', async () => {
  const calls = [];
  const screen = setup({ signInWithEmailAndPassword: async (...args) => { calls.push(args); } });
  await screen.press('Login');
  assert.deepEqual(calls, [['person@example.invalid', ' password with spaces ']]);
  assert.equal(screen.loading(), false);
});

test('a rejected login reports the failure and restores the controls', async () => {
  let reject;
  const pending = new Promise((_yes, no) => { reject = no; });
  const screen = setup({ signInWithEmailAndPassword: () => pending });
  const request = screen.press('Login');
  assert.equal(screen.loading(), true);
  reject(new Error('Invalid credentials'));
  await request;
  assert.deepEqual(screen.alerts, ['Sign in failed: Invalid credentials']);
  assert.equal(screen.loading(), false);
});

test('registration confirms account creation without claiming an email was sent', async () => {
  const screen = setup({ createUserWithEmailAndPassword: async () => ({ user: {} }) });
  await screen.press('Create account');
  assert.deepEqual(screen.alerts, ['Account created.']);
  assert.equal(screen.loading(), false);
});
