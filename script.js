const board = document.querySelector('#board');
const statusText = document.querySelector('#statusText');
const startRide = document.querySelector('#startRide');
const clearBoard = document.querySelector('#clearBoard');
const demoBoard = document.querySelector('#demoBoard');
const paletteTiles = document.querySelectorAll('.palette-tile');
const columns = 7;
const rows = 5;
let selectedTile = null;
let bike = null;

const demoRoute = [
  [14, 'road-horizontal'], [15, 'road-horizontal'], [16, 'traffic-light'], [17, 'road-horizontal'],
  [18, 'curve'], [25, 'road-vertical'], [32, 'school'], [31, 'sign'], [30, 'crossing']
];

function createBoard() {
  board.innerHTML = '';
  for (let index = 0; index < columns * rows; index += 1) {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.type = 'button';
    cell.dataset.index = index;
    cell.setAttribute('aria-label', `Feld ${index + 1}`);
    if (index === 14) cell.classList.add('start');
    if (index === 30) cell.classList.add('goal');
    cell.addEventListener('dragover', event => {
      event.preventDefault();
      cell.classList.add('drop-target');
    });
    cell.addEventListener('dragleave', () => cell.classList.remove('drop-target'));
    cell.addEventListener('drop', handleDrop);
    cell.addEventListener('click', () => {
      if (selectedTile) placeTile(cell, selectedTile);
    });
    board.appendChild(cell);
  }
}

function handleDrop(event) {
  event.preventDefault();
  const tile = event.dataTransfer.getData('text/plain');
  placeTile(event.currentTarget, tile);
}

function placeTile(cell, tile) {
  cell.className = 'cell';
  if (Number(cell.dataset.index) === 14) cell.classList.add('start');
  if (Number(cell.dataset.index) === 30) cell.classList.add('goal');
  cell.classList.add(tile);
  cell.dataset.tile = tile;
  const marker = document.createElement('span');
  if (tile === 'traffic-light') {
    marker.innerHTML = '<span class="light red"></span><span class="light yellow"></span><span class="light green"></span>';
  } else if (tile === 'sign') {
    marker.textContent = '30';
  } else if (tile === 'school') {
    marker.textContent = '🏫';
  }
  cell.appendChild(marker);
  updateStatus();
}

function updateStatus() {
  const count = board.querySelectorAll('[data-tile]').length;
  statusText.textContent = count < 6
    ? `Noch ${6 - count} Teil(e) bis zur Probefahrt.`
    : 'Super! Jetzt kann das Fahrrad die Strecke ausprobieren.';
}

paletteTiles.forEach(tile => {
  tile.addEventListener('dragstart', event => {
    event.dataTransfer.setData('text/plain', tile.dataset.tile);
  });
  tile.addEventListener('click', () => {
    selectedTile = tile.dataset.tile;
    statusText.textContent = 'Teil ausgewählt: Tippe nun auf ein Feld.';
  });
});

function clearBike() {
  if (bike) bike.remove();
  bike = null;
}

function getCellCenter(cell) {
  const boardRect = board.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  return {
    left: cellRect.left - boardRect.left + cellRect.width / 2,
    top: cellRect.top - boardRect.top + cellRect.height / 2,
  };
}

function rideRoute() {
  const routeCells = [...board.querySelectorAll('[data-tile]')]
    .sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));
  if (routeCells.length < 6) {
    statusText.textContent = 'Baue zuerst mindestens 6 Puzzleteile auf das Feld.';
    return;
  }
  clearBike();
  bike = document.createElement('div');
  bike.className = 'bike';
  bike.textContent = '🚲';
  bike.setAttribute('aria-label', 'Fahrendes Fahrrad');
  board.appendChild(bike);
  routeCells.forEach((cell, step) => {
    const point = getCellCenter(cell);
    setTimeout(() => {
      bike.style.left = `${point.left}px`;
      bike.style.top = `${point.top}px`;
      if (step === routeCells.length - 1) statusText.textContent = 'Geschafft! Das Fahrrad ist sicher angekommen.';
    }, step * 520);
  });
}

clearBoard.addEventListener('click', () => {
  clearBike();
  createBoard();
  selectedTile = null;
  updateStatus();
});

demoBoard.addEventListener('click', () => {
  clearBike();
  createBoard();
  demoRoute.forEach(([index, tile]) => placeTile(board.children[index], tile));
});

startRide.addEventListener('click', rideRoute);
createBoard();
updateStatus();
