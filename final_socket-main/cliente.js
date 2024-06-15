// Función para generar datos aleatorios
function generateRandomData() {
  const temperature = (Math.random() * (35 - 15) + 15).toFixed(2);
  const humidity = (Math.random() * (80 - 20) + 20).toFixed(2);
  const airQuality = (Math.random() * (100 - 40) + 40).toFixed(0);
  const rainfall = (Math.random() * (50 - 0) + 0).toFixed(2);
  return `Temperatura: ${temperature}°C, Humedad: ${humidity}%, Calidad de aire: ${airQuality}, Lluvia: ${rainfall} cm`;
}

// Conectar a Socket.IO
const socket = io();

// Obtener referencias a los elementos HTML
const dataDisplay = document.getElementById('data-display');
const getDataButton = document.getElementById('get-data');
const getStatusButton = document.getElementById('get-status');

// Manejar click en el botón "Obtener datos"
getDataButton.addEventListener('click', () => {
  const data = generateRandomData();
  dataDisplay.innerHTML = `<p>${data}</p>`;
});

// Manejar click en el botón "Obtener estado"
getStatusButton.addEventListener('click', () => {
  dataDisplay.innerHTML = '<p>Sistema en funcionamiento</p>';
});
