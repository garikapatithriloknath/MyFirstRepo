import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExpression, setCalculatorMemory } from './calculator-core.mjs';

test('evaluates basic arithmetic', () => {
  assert.equal(evaluateExpression('12 + 5 * 3'), 27);
  assert.equal(evaluateExpression('(8 + 2) / 5'), 2);
});

test('handles scientific functions', () => {
  assert.equal(evaluateExpression('sqrt(81)'), 9);
  assert.equal(evaluateExpression('sin(0)'), 0);
  assert.equal(evaluateExpression('2 ^ 10'), 1024);
  assert.equal(evaluateExpression('log(100)'), 2);
  assert.equal(evaluateExpression('pow(2, 10)'), 1024);
  assert.equal(evaluateExpression('mod(10, 3)'), 1);
});

test('supports memory operations', () => {
  setCalculatorMemory(20);
  assert.equal(evaluateExpression('sqrt(16) + memory'), 24);
  assert.equal(evaluateExpression('memory + 5'), 25);
});

test('rejects invalid expressions', () => {
  assert.throws(() => evaluateExpression('2 +'), /Invalid expression/);
  assert.throws(() => evaluateExpression('alert(1)'), /Invalid expression/);
});
