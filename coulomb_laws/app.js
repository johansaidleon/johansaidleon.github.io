const K = 8.98755e9; // constante de Coulomb (N·m²/C²)

const v1 = document.getElementById('v1');
const v2 = document.getElementById('v2');
const v3 = document.getElementById('v3');
const btn = document.getElementById('btn');
const result = document.getElementById('result');

const label1 = document.getElementById('variable1');
const label2 = document.getElementById('variable2');
const label3 = document.getElementById('variable3');

const modes = {
  forceRadio: {
    labels: ['(q1) Carga 1 (C)', '(q2) Carga 2 (C)', '(r) Distancia entre las cargas (m)'],
    calc: (a, b, c) => ({ text: 'Fuerza', unit: 'N', value: (K * a * b) / (c * c), invalid: c === 0 })
  },
  charge1Radio: {
    labels: ['(F) Fuerza (N)', '(q2) Carga 2 (C)', '(r) Distancia entre las cargas (m)'],
    calc: (F, q2, r) => ({ text: 'Carga 1', unit: 'C', value: (F * r * r) / (K * q2), invalid: q2 === 0 })
  },
  charge2Radio: {
    labels: ['(F) Fuerza (N)', '(q1) Carga 1 (C)', '(r) Distancia entre las cargas (m)'],
    calc: (F, q1, r) => ({ text: 'Carga 2', unit: 'C', value: (F * r * r) / (K * q1), invalid: q1 === 0 })
  },
  distancebwtheobjectsRadio: {
    labels: ['(F) Fuerza (N)', '(q1) Carga 1 (C)', '(q2) Carga 2 (C)'],
    calc: (F, q1, q2) => {
      const ratio = (K * q1 * q2) / F;
      return { text: 'Distancia', unit: 'm', value: Math.sqrt(ratio), invalid: F === 0 || ratio < 0 };
    }
  }
};

function currentMode() {
  const checked = document.querySelector('input[name="variables"]:checked');
  return modes[checked.id];
}

function format(n) {
  const abs = Math.abs(n);
  return abs !== 0 && (abs < 0.01 || abs >= 1e6) ? n.toExponential(3) : n.toFixed(2);
}

function showResult(message, isError) {
  result.textContent = message;
  result.classList.toggle('error', Boolean(isError));
}

function applyMode() {
  [label1.textContent, label2.textContent, label3.textContent] = currentMode().labels;
  showResult('');
}

document.querySelectorAll('input[name="variables"]').forEach(r => r.addEventListener('change', applyMode));

btn.addEventListener('click', () => {
  if (v1.value === '' || v2.value === '' || v3.value === '') {
    showResult('Completa los tres campos.', true);
    return;
  }
  const out = currentMode().calc(Number(v1.value), Number(v2.value), Number(v3.value));
  if (out.invalid || !Number.isFinite(out.value)) {
    showResult('Con esos valores no se puede calcular (revisa ceros o signos).', true);
    return;
  }
  showResult(`${out.text} = ${format(out.value)} ${out.unit}`);
});

applyMode();
