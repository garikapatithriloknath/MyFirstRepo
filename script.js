import { evaluateExpression, formatResult, getCalculatorMemory, setCalculatorMemory } from './calculator-core.mjs';

const state = {
  expression: '',
  result: '0',
  mode: 'basic',
  memory: 0,
  history: [],
  isEvaluated: false,
};

const expressionElement = document.querySelector('#expression');
const resultElement = document.querySelector('#result');
const historyList = document.querySelector('#history-list');
const themeToggle = document.querySelector('#theme-toggle');
const themeIcon = document.querySelector('.theme-icon');
const modeButtons = document.querySelectorAll('.mode-button');
const scientificButtons = document.querySelectorAll('.scientific');

const allowedOperators = new Set(['+', '-', '*', '/', '^', '%']);
const operatorLabels = new Map([
  ['+', '+'],
  ['-', '−'],
  ['*', '×'],
  ['/', '÷'],
  ['^', '^'],
  ['%', '%'],
]);

function updateDisplay() {
  expressionElement.textContent = state.expression || '0';
  resultElement.textContent = state.result;
}

function updateHistory() {
  historyList.replaceChildren();
  state.history.slice(0, 8).forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'history-item';
    item.innerHTML = `<span>${entry.expression}</span><strong>${entry.result}</strong>`;
    historyList.appendChild(item);
  });
}

function setCalculationMode(mode) {
  state.mode = mode;
  modeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });
  scientificButtons.forEach((button) => {
    button.classList.toggle('hidden', mode !== 'scientific');
  });
}

function appendValue(value) {
  if (state.isEvaluated && /\d|\./.test(value)) {
    state.expression = '';
    state.isEvaluated = false;
  }

  const lastCharacter = state.expression.slice(-1);
  if (value === '.' && lastCharacter === '.') {
    return;
  }

  if (/[0-9]/.test(value) || value === '.') {
    state.expression += value;
  } else {
    if (!state.expression || /[+\-*/^%()]$/.test(state.expression)) {
      return;
    }
    state.expression += value;
  }

  state.result = '0';
  updateDisplay();
}

function applyOperator(value) {
  if (!state.expression) {
    return;
  }

  const lastCharacter = state.expression.slice(-1);
  if (allowedOperators.has(lastCharacter) && allowedOperators.has(value)) {
    state.expression = state.expression.slice(0, -1) + value;
  } else if (lastCharacter === '(' && value === '-') {
    state.expression += value;
  } else if (lastCharacter === '.') {
    state.expression = state.expression.slice(0, -1);
    state.expression += value;
  } else {
    state.expression += value;
  }

  state.isEvaluated = false;
  updateDisplay();
}

function evaluateCurrentExpression() {
  if (!state.expression) {
    return;
  }

  try {
    const result = evaluateExpression(state.expression, state.memory);
    const formatted = formatResult(result);
    state.result = formatted;
    state.history.unshift({ expression: state.expression, result: formatted });
    state.history = state.history.slice(0, 8);
    state.isEvaluated = true;
    state.expression = formatted;
    updateHistory();
  } catch (error) {
    state.result = 'Error';
  }

  updateDisplay();
}

function deleteLastCharacter() {
  state.expression = state.expression.slice(0, -1);
  state.result = '0';
  updateDisplay();
}

function clearCalculator() {
  state.expression = '';
  state.result = '0';
  state.isEvaluated = false;
  updateDisplay();
}

function toggleNegative() {
  if (!state.expression) {
    state.expression = '-';
    return;
  }

  if (state.expression.startsWith('-')) {
    state.expression = state.expression.slice(1);
  } else {
    state.expression = `-${state.expression}`;
  }

  updateDisplay();
}

function handleMemory(action) {
  const currentValue = Number(state.result === 'Error' ? 0 : state.result || 0);
  if (action === 'clear') {
    state.memory = 0;
    setCalculatorMemory(0);
  } else if (action === 'read') {
    state.expression += state.memory;
  } else if (action === 'add') {
    state.memory += currentValue;
    setCalculatorMemory(state.memory);
  } else if (action === 'subtract') {
    state.memory -= currentValue;
    setCalculatorMemory(state.memory);
  } else if (action === 'save') {
    state.memory = Number(state.expression || 0);
    setCalculatorMemory(state.memory);
  }

  state.result = formatResult(state.memory);
  updateDisplay();
}

function handleKeypadClick(event) {
  const button = event.currentTarget;
  const value = button.dataset.value;
  const operator = button.dataset.operator;

  if (value) {
    appendValue(value);
  } else if (operator === 'equals') {
    evaluateCurrentExpression();
  } else if (operator === 'delete') {
    deleteLastCharacter();
  } else if (operator === 'clear-all') {
    clearCalculator();
  } else if (operator === 'negate') {
    toggleNegative();
  } else if (operator === 'parenthesis') {
    const openCount = (state.expression.match(/\(/g) || []).length;
    const closeCount = (state.expression.match(/\)/g) || []).length;
    state.expression += openCount > closeCount ? ')' : '(';
    updateDisplay();
  }
}

function handleKeyboard(event) {
  if (event.key >= '0' && event.key <= '9') appendValue(event.key);
  else if (event.key === '.') appendValue('.');
  else if (allowedOperators.has(event.key)) applyOperator(event.key);
  else if (event.key === 'Enter' || event.key === '=') evaluateCurrentExpression();
  else if (event.key === 'Backspace') deleteLastCharacter();
  else if (event.key === 'Escape') clearCalculator();
  else if (event.key === '(' || event.key === ')') appendValue(event.key);
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('calculator-theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const isLight = savedTheme ? savedTheme === 'light' : prefersLight;
  document.body.classList.toggle('light-theme', isLight);
  themeIcon.textContent = isLight ? '☾' : '☀';
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem('calculator-theme', isLight ? 'light' : 'dark');
  themeIcon.textContent = isLight ? '☾' : '☀';
}

function initialize() {
  document.querySelectorAll('.key').forEach((button) => {
    button.addEventListener('click', handleKeypadClick);
  });

  document.querySelectorAll('.memory-button').forEach((button) => {
    button.addEventListener('click', () => handleMemory(button.dataset.memoryAction));
  });

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setCalculationMode(button.dataset.mode));
  });

  themeToggle.addEventListener('click', toggleTheme);
  document.addEventListener('keydown', handleKeyboard);
  initializeTheme();
  setCalculationMode('basic');
  state.memory = getCalculatorMemory();
  updateDisplay();
  updateHistory();
}

initialize();
