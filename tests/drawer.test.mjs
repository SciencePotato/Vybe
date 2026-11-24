import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const slots = [], effects = [];
  let cursor = 0, mounted = false;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = value; }];
    },
    useEffect(effect) { if (!mounted) effects.push(effect); },
  };
  const { outputText } = ts.transpileModule(
    readFileSync(new URL('../components/customDrawer.tsx', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } },
  );
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports,
    require: name => name === 'react'
      ? { default: react, ...react }
      : { DrawerContentScrollView: 'ScrollView', DrawerItemList: 'Items' },
  });
  return props => {
    cursor = 0;
    let tree = module.exports.default(props);
    if (!mounted) {
      mounted = true;
      effects.forEach(effect => effect());
      cursor = 0;
      tree = module.exports.default(props);
    }
    return tree.props.children[0].props;
  };
}

function props(title) {
  return {
    state: {
      index: 1,
      routes: [{ name: '(auth)/Auth', key: 'auth' }, { name: '(home)', key: 'home' }],
    },
    descriptors: { auth: { title: 'Auth' }, home: { title } },
  };
}

test('filtering auth routes preserves the focused home route at its new index', () => {
  const filtered = setup()(props('Home'));
  assert.equal(filtered.state.routes.length, 1);
  assert.equal(filtered.state.routes[filtered.state.index]?.key, 'home');
  assert.equal('auth' in filtered.descriptors, false);
});

test('drawer items consume updated navigation descriptors on rerender', () => {
  const render = setup();
  render(props('Old title'));
  const filtered = render(props('New title'));
  assert.equal(filtered.descriptors.home.title, 'New title');
});
