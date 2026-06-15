const board = document.querySelector('#board');
const statusText = document.querySelector('#statusText');
const startRide = document.querySelector('#startRide');
const clearBoard = document.querySelector('#clearBoard');
const demoBoard = document.querySelector('#demoBoard');
const paletteTiles = document.querySelectorAll('.palette-tile');
const columns = 8;
const rows = 5;
let selectedTile = null;
let bike = null;

const route = [8, 9, 10, 11, 12, 13, 14, 15];
const preparedStreets = new Map([
  [8, 'road-horizontal start'], [9, 'road-horizontal'], [10, 'crossing'], [11, 'road-horizontal'],
  [12, 'crossing'], [13, 'road-horizontal'], [14, 'crossing'], [15, 'road-horizontal goal'],
  [2, 'road-vertical side-road'], [18, 'road-vertical side-road'],
  [20, 'road-vertical side-road'], [28, 'road-vertical side-road'],
  [6, 'road-vertical side-road'], [22, 'road-vertical side-road'],
]);
const cars = new Map([[2, '🚗'], [20, '🚙'], [22, '🚕']]);
const freeFields = new Set([1, 3, 4, 5, 17, 19, 21, 23, 27, 29]);
const safeTiles = new Set(['traffic-light', 'stop-sign', 'yield-sign', 'bike-sign']);
const solution = [[3, 'stop-sign'], [4, 'bike-sign'], [5, 'traffic-light'], [19, 'yield-sign'], [21, 'stop-sign'], [23, 'traffic-light']];

function createBoard() {
  board.innerHTML = '';
  for (let index = 0; index < columns * rows; index += 1) {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.type = 'button';
    cell.dataset.index = index;
    cell.setAttribute('aria-label', `Feld ${index + 1}`);

    if (preparedStreets.has(index)) {
      preparedStreets.get(index).split(' ').forEach(className => cell.classList.add(className));
      cell.dataset.fixed = 'street';
      const lane = document.createElement('span');
      cell.appendChild(lane);
    }

    if (cars.has(index)) {
      const car = document.createElement('span');
      car.className = 'waiting-car';
      car.textContent = cars.get(index);
      cell.appendChild(car);
      cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}: wartendes Auto`);
    }

    if (freeFields.has(index)) {
      cell.classList.add('free-field');
      cell.dataset.free = 'true';
      cell.addEventListener('dragover', event => {
        event.preventDefault();
        cell.classList.add('drop-target');
      });
      cell.addEventListener('dragleave', () => cell.classList.remove('drop-target'));
      cell.addEventListener('drop', handleDrop);
      cell.addEventListener('click', () => {
        if (selectedTile) placeTile(cell, selectedTile);
      });
    } else {
      cell.disabled = true;
    }

    board.appendChild(cell);
  }
  placeWaitingBike();
}

function handleDrop(event) {
  event.preventDefault();
  const tile = event.dataTransfer.getData('text/plain');
  placeTile(event.currentTarget, tile);
}

function placeTile(cell, tile) {
  if (!cell.dataset.free || !safeTiles.has(tile)) return;
  cell.className = 'cell free-field';
  cell.dataset.tile = tile;
  cell.classList.add(tile);
  cell.innerHTML = '';
  const marker = document.createElement('span');
  if (tile === 'traffic-light') {
    marker.innerHTML = '<span class="light red"></span><span class="light yellow"></span><span class="light green"></span>';
  } else if (tile === 'stop-sign') {
    marker.textContent = 'STOP';
  } else if (tile === 'yield-sign') {
    marker.textContent = '▽';
  } else if (tile === 'bike-sign') {
    marker.textContent = '🚲';
  }
  cell.appendChild(marker);
  updateStatus();
}

function updateStatus() {
  const count = board.querySelectorAll('[data-tile]').length;
  statusText.textContent = count < 4
    ? `Noch ${4 - count} Sicherungs-Teil(e), dann kann die Fahrt getestet werden.`
    : 'Prima! Teste jetzt, ob das Fahrrad sicher Vorfahrt hat.';
}

paletteTiles.forEach(tile => {
  tile.addEventListener('dragstart', event => {
    event.dataTransfer.setData('text/plain', tile.dataset.tile);
  });
  tile.addEventListener('click', () => {
    selectedTile = tile.dataset.tile;
    statusText.textContent = 'Teil ausgewählt: Tippe nun auf ein freies Feld neben der Straße.';
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

function placeWaitingBike() {
  clearBike();
  bike = document.createElement('div');
  bike.className = 'bike waiting';
  bike.textContent = '🚲';
  bike.setAttribute('aria-label', 'Wartendes Fahrrad');
  board.appendChild(bike);
  requestAnimationFrame(() => {
    const point = getCellCenter(board.children[route[0]]);
    bike.style.left = `${point.left}px`;
    bike.style.top = `${point.top}px`;
  });
}

function rideRoute() {
  const safetyCount = board.querySelectorAll('[data-tile]').length;
  if (safetyCount < 4) {
    statusText.textContent = 'Setze zuerst mindestens 4 Ampeln oder Schilder auf die freien Felder.';
    return;
  }
  if (!bike) placeWaitingBike();
  bike.classList.remove('waiting');
  bike.setAttribute('aria-label', 'Fahrendes Fahrrad');
  route.forEach((index, step) => {
    const point = getCellCenter(board.children[index]);
    setTimeout(() => {
      bike.style.left = `${point.left}px`;
      bike.style.top = `${point.top}px`;
      if (step === route.length - 1) statusText.textContent = 'Geschafft! Die Autos warten und das Fahrrad ist sicher vorbeigefahren.';
    }, step * 520);
  });
}

clearBoard.addEventListener('click', () => {
  createBoard();
  selectedTile = null;
  updateStatus();
});

demoBoard.addEventListener('click', () => {
  createBoard();
  solution.forEach(([index, tile]) => placeTile(board.children[index], tile));
});

startRide.addEventListener('click', rideRoute);
window.addEventListener('resize', () => {
  if (bike) {
    const currentLeft = Number.parseFloat(bike.style.left);
    const closestIndex = Number.isNaN(currentLeft) ? route[0] : route[0];
    const point = getCellCenter(board.children[closestIndex]);
    bike.style.left = `${point.left}px`;
    bike.style.top = `${point.top}px`;
  }
});

createBoard();
updateStatus();
