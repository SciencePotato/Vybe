const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

test('credential fields opt out of native keyboard text transformations', () => {
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState: value => [value, () => {}],
    useRef: value => ({ current: value }),
  };
  const native = Object.fromEntries(
    ['View', 'Text', 'TextInput', 'KeyboardAvoidingView', 'Button', 'ActivityIndicator']
      .map(name => [name, name]),
  );
  native.StyleSheet = { create: styles => styles };
  const dependencies = { react, 'react-native': native, '@react-native-firebase/auth': () => ({}) };
  const module = { exports: {} };
  const source = ts.transpileModule(
    readFileSync(new URL('../app/(auth)/Auth.tsx', 'file://' + __filename), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } },
  ).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require: name => dependencies[name] ?? (() => { throw new Error(`Unexpected import ${name}`); })(),
  });
  const nodes = tree => !tree || typeof tree !== 'object' ? [] :
    Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props.children)];
  const inputs = nodes(module.exports.default()).filter(node => node.type === 'TextInput');
  assert.equal(inputs.length, 2);
  for (const input of inputs) {
    assert.equal(input.props.autoCapitalize, 'none', input.props.placeholder);
    assert.equal(input.props.autoCorrect, false, input.props.placeholder);
  }
  assert.equal(inputs[1].props.secureTextEntry, true);
});
