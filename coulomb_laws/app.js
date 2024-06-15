const v1 =  document.getElementById('v1');
const v2 = document.getElementById('v2');
const v3 = document.getElementById('v3');
const btn = document.getElementById('btn');
const result = document.getElementById('result');

// Botones superiores
const forceRadio = document.getElementById('forceRadio');
const charge1Radio = document.getElementById('charge1Radio');
const charge2Radio = document.getElementById('charge2Radio');
const distancebwtheobjectsRadio = document.getElementById('distancebwtheobjectsRadio');

let force;
const k = 8.98755e9 ;
let charge1 = v1;
let charge2 = v2;
let distancebwtheobjects = v3;


const variable1 = document.getElementById('variable1');
const variable2 = document.getElementById('variable2');
const variable3 = document.getElementById('variable3');

forceRadio.addEventListener('click', function() {
  variable1.textContent = '(q1) Charge 1 (C)';
  variable2.textContent = '(q2) Charge 2 (C)';
  variable3.textContent = '(r) Distance b/w the objects (m)';
  charge1 = v1;
  charge2 = v2;
  distancebwtheobjects = v3;
  result.textContent = '';
});

charge1Radio.addEventListener('click', function() {
  variable1.textContent = '(F) Force (N)';
  variable2.textContent = '(q2) Charge 2 (C)';
  variable3.textContent = '(r) Distance b/w the objects (m)';
  force = v1;
  charge2 = v2;
  distancebwtheobjects = v3;
  result.textContent = '';
});

charge2Radio.addEventListener('click', function() {
  variable1.textContent = '(F) Force (N)';
  variable2.textContent = '(q1) Charge 1 (C)';
  variable3.textContent = '(r) Distance b/w the objects (m)';
  force = v1;
  charge1 = v2;
  distancebwtheobjects = v3;
  result.textContent = '';
});

distancebwtheobjectsRadio.addEventListener('click', function() {
  variable1.textContent = '(F) Force (N)';
  variable2.textContent = '(q1) Charge 1 (C)';
  variable3.textContent = '(q2) Charge 2 (C)';
  force = v1;
  charge1 = v2;
  charge2 = v3;
  result.textContent = '';
});

btn.addEventListener('click', function() {
  
  if(forceRadio.checked)
    result.textContent = `Force = ${computeForce().toFixed(2)} N`;

  else if(charge1Radio.checked)
    result.textContent = `Charge 1 = ${computeCharge1().toFixed(2)} C`;

  else if(charge2Radio.checked)
    result.textContent = `Charge 2 = ${computeCharge2().toFixed(2)} C`;

  else if(distancebwtheobjectsRadio.checked)
    result.textContent = `Distance b/w the objects = ${computeDistancebwtheobjects().toFixed(2)} m`;
})

// calculacion

function computeForce() {
  return (k * Number(charge1.value) * Number(charge2.value)) / Math.pow(Number(distancebwtheobjects.value), 2);
}

function computeCharge1() {
  return (Number(force.value) * Math.pow(Number(distancebwtheobjects.value), 2)) / (k * Number(charge2.value));
}

function computeCharge2() {
  return (Number(force.value) * Math.pow(Number(distancebwtheobjects.value), 2)) / (k * Number(charge1.value));
}

function computeDistancebwtheobjects() {
  return Math.sqrt((k * Number(charge1.value) * Number(charge2.value)) / Number(force.value));
}