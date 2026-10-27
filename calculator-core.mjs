const allowedFunctions = new Map([
  ['sin', Math.sin],
  ['cos', Math.cos],
  ['tan', Math.tan],
  ['asin', Math.asin],
  ['acos', Math.acos],
  ['atan', Math.atan],
  ['sqrt', Math.sqrt],
  ['log', Math.log10],
  ['ln', Math.log],
  ['abs', Math.abs],
  ['floor', Math.floor],
  ['ceil', Math.ceil],
  ['round', Math.round],
  ['exp', Math.exp],
  ['pow', Math.pow],
  ['mod', (a, b) => a % b],
]);

const TOKEN_PATTERN = /\s*(\d*\.?\d+|sin|cos|tan|asin|acos|atan|sqrt|log|ln|abs|floor|ceil|round|exp|pow|mod|memory|\(|\)|\+|-|\*|\/|\^|%|π|e|,|\.)\s*/g;

function tokenize(expression) {
  const tokens = [];
  const normalized = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/∞/g, 'Infinity');
  const matches = normalized.matchAll(TOKEN_PATTERN);

  for (const match of matches) {
    tokens.push(match[1]);
  }

  if (tokens.length === 0 || normalized.replace(/\s+/g, '') !== tokens.join('')) {
    throw new Error('Invalid expression');
  }

  return tokens;
}

function parseExpression(tokens, start = 0, end = tokens.length) {
  let index = start;

  function parseAdditive() {
    let value = parseMultiplicative();
    while (index < end && (tokens[index] === '+' || tokens[index] === '-')) {
      const operator = tokens[index++];
      const right = parseMultiplicative();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  function parseMultiplicative() {
    let value = parsePower();
    while (index < end && (tokens[index] === '*' || tokens[index] === '/' || tokens[index] === '%')) {
      const operator = tokens[index++];
      const right = parsePower();
      if (operator === '*') value *= right;
      else if (operator === '/') value /= right;
      else value %= right;
    }
    return value;
  }

  function parsePower() {
    let value = parseUnary();
    if (index < end && tokens[index] === '^') {
      index++;
      value = Math.pow(value, parseUnary());
    }
    return value;
  }

  function parseUnary() {
    if (index < end && (tokens[index] === '+' || tokens[index] === '-')) {
      const sign = tokens[index++];
      return parseUnary() * (sign === '-' ? -1 : 1);
    }

    return parsePrimary();
  }

  function parsePrimary() {
    if (index >= end) {
      throw new Error('Invalid expression');
    }

    const token = tokens[index];

    if (token === '(') {
      index++;
      const value = parseAdditive();
      if (tokens[index] !== ')') {
        throw new Error('Invalid expression');
      }
      index++;
      return value;
    }

    if (token === 'pi' || token === 'e') {
      index++;
      return token === 'pi' ? Math.PI : Math.E;
    }

    if (token === 'memory') {
      index++;
      return globalThis.__calculatorMemory ?? 0;
    }

    if (token === ',') {
      throw new Error('Invalid expression');
    }

    const numberMatch = token.match(/^\d*\.?\d+$/);
    if (numberMatch) {
      index++;
      return Number(token);
    }

    const functionName = allowedFunctions.get(token);
    if (functionName) {
      index++;
      if (tokens[index] !== '(') {
        throw new Error('Invalid expression');
      }
      index++;
      const argumentsList = [];
      if (tokens[index] !== ')') {
        argumentsList.push(parseAdditive());
        while (tokens[index] === ',') {
          index++;
          argumentsList.push(parseAdditive());
        }
      }
      if (tokens[index] !== ')') {
        throw new Error('Invalid expression');
      }
      index++;

      if (argumentsList.length !== functionName.length) {
        throw new Error('Invalid expression');
      }
      return functionName(...argumentsList);
    }

    if (token === 'memory') {
      index++;
      return globalThis.__calculatorMemory ?? 0;
    }

    throw new Error('Invalid expression');
  }

  const result = parseAdditive();
  if (index !== end) {
    throw new Error('Invalid expression');
  }
  return result;
}

export function evaluateExpression(expression, memoryValue = globalThis.__calculatorMemory ?? 0) {
  if (typeof expression !== 'string' || expression.trim() === '') {
    throw new Error('Invalid expression');
  }

  const tokens = tokenize(expression);
  const parsed = parseExpression(tokens);

  if (!Number.isFinite(parsed)) {
    throw new Error('Result is not finite');
  }

  const memory = memoryValue;
  globalThis.__calculatorMemory = memory;
  return parsed;
}

export function setCalculatorMemory(value) {
  globalThis.__calculatorMemory = Number(value);
  return globalThis.__calculatorMemory;
}

export function getCalculatorMemory() {
  return globalThis.__calculatorMemory ?? 0;
}

export function formatResult(value) {
  if (!Number.isFinite(value)) {
    return 'Error';
  }
  return Number(value.toFixed(10)).toString();
}

export function replaceFunctionSyntax(expression) {
  return expression
    .replace(/\^/g, '^')
    .replace(/\s+/g, ' ')
    .trim();
}
