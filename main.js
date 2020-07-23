"use strict";

if (location.protocol !== 'file:') {
  // Register service worker so app can be installed as a PWA
  navigator.serviceWorker.register('service-worker.js', {scope: './'});
}

const board = document.getElementById('board');

let tilesScore = 0;
let horizontalBonus = 0;
let verticalBonus = 0;
let allColorsBonus = 0;
let filledSquares = [];

// Create squares
const colors = ['blue', 'orange-red', 'red', 'black-blue', 'white-blue'];
for (let y=0; y< 5; y++) {
  for (let x=0; x< 5; x++) {
    board.insertAdjacentHTML('beforeend', `<span class="square" data-x="${x}" data-y="${y}" data-color="${colors[x]}"></span>`);
  }
  // Rotate colors on each row
  colors.unshift(colors.pop());
}

function updateBoardSize() {
  let size = 0;
  if (window.innerWidth > window.innerHeight) {
    const bodyMargin = window.innerHeight * 0.02;
    size = Math.min(window.innerHeight - (bodyMargin * 2), window.innerWidth - (window.innerHeight * 0.45)) + 'px';
  } else {
    const bodyMargin = window.innerWidth * 0.02;
    size = Math.min(window.innerWidth - (bodyMargin * 2), window.innerHeight - (window.innerHeight * 0.45)) + 'px';
  }
  board.style.width  = size;
  board.style.height = size;
  board.style.fontSize = size;
}
updateBoardSize();
window.onresize = updateBoardSize;

// Setup audio
const clinks = [
  new Audio('sounds/clink.mp3'),
  new Audio('sounds/clink.mp3'),
  new Audio('sounds/clink.mp3'),
  new Audio('sounds/clink.mp3'),
];
function playClink() {
  const clink = clinks.pop();
  clink.play();
  clinks.unshift(clink);
}
const swooshSound = new Audio('sounds/swoosh.mp3');

function calculateSquareValues() {
  for (const square of [...board.querySelectorAll('.square:not(.filled)')]) {
    let tileValue = 0;

    let adjacentX = 0;
    let adjacentY = 0;

    for (let s = square; s = getAdjacentFilledSquare(s, 'right');) { tileValue++; adjacentX++; }
    for (let s = square; s = getAdjacentFilledSquare(s, 'left');)  { tileValue++; adjacentX++; }
    for (let s = square; s = getAdjacentFilledSquare(s, 'down');)  { tileValue++; adjacentY++; }
    for (let s = square; s = getAdjacentFilledSquare(s, 'up');)    { tileValue++; adjacentY++; }

    if (adjacentX > 0) tileValue++;
    if (adjacentY > 0) tileValue++;
    if ((adjacentX + adjacentY) === 0) tileValue = 1;

    square.tileValue = tileValue;

    square.horizontalBonus = (adjacentX === 4) ? 2 : 0;
    square.verticalBonus   = (adjacentY === 4) ? 7 : 0;

    const filledSameColor = [...board.querySelectorAll(`.square.filled[data-color="${square.dataset.color}"]`)];
    square.allColorsBonus = (filledSameColor.length === 4) ? 10 : 0;

    square.totalValue = square.tileValue + square.horizontalBonus + square.verticalBonus + square.allColorsBonus;
    square.textContent = square.totalValue;
  }
}
calculateSquareValues();

function getAdjacentFilledSquare(square, direction) {
  let x = parseInt(square.dataset.x);
  let y = parseInt(square.dataset.y);
  if (direction === 'right') x++;
  if (direction === 'left')  x--;
  if (direction === 'down')  y++;
  if (direction === 'up')    y--;
  return board.querySelector(`.square.filled[data-x="${x}"][data-y="${y}"]`);
}

board.onmousedown = event => {
  if (event.target.classList.contains('square')) {
    toggleSquare(event.target);
    event.preventDefault();
  }
}
board.onmouseover = event => {
  if (event.buttons === 1) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (element.classList.contains('square')) {
      toggleSquare(element);
    }
  }
}
board.ontouchstart = event => {
  if (event.target.classList.contains('square')) {
    toggleSquare(event.target);
    event.preventDefault();
  }
}

function flashScoreBox(scoreBox) {
  scoreBox.classList.remove('flash');
  setTimeout(() => {
    scoreBox.classList.add('flash');
    setTimeout(() => scoreBox.classList.remove('flash'), 500);
  }, 100);
}

function toggleSquare(square) {
  const value = parseInt(square.textContent);
  if (!square.classList.contains('filled')) {
    playClink();
    square.classList.add('filled', 'active');
    if (filledSquares.length) {
      filledSquares[filledSquares.length-1].classList.remove('active');
    }
    filledSquares.push(square);
    tilesScore += square.tileValue;
    verticalBonus   += square.verticalBonus;
    horizontalBonus += square.horizontalBonus;
    allColorsBonus  += square.allColorsBonus;
    if (square.tileValue       > 0) flashScoreBox(document.querySelector('.tiles-score-box'));
    if (square.verticalBonus   > 0) flashScoreBox(document.querySelector('.vertical-bonus-score-box'));
    if (square.horizontalBonus > 0) flashScoreBox(document.querySelector('.horizontal-bonus-score-box'));
    if (square.allColorsBonus  > 0) flashScoreBox(document.querySelector('.all-colors-bonus-score-box'));
  } else if (square === filledSquares[filledSquares.length-1]) {
    const activeSquare = filledSquares.pop();
    activeSquare.classList.remove('filled', 'active');
    tilesScore      -= square.tileValue;
    verticalBonus   -= square.verticalBonus;
    horizontalBonus -= square.horizontalBonus;
    allColorsBonus  -= square.allColorsBonus;
    if (filledSquares.length) {
      filledSquares[filledSquares.length-1].classList.add('active');
    }
    swooshSound.play();
  }
  calculateSquareValues();
  updateScores();
}

function updateScores() {
  const bonusDisplayText = score => (score > 0) ? `+${score}` : '0';
  document.getElementById('tiles-score').textContent = tilesScore;
  document.getElementById('horizontal-bonus').textContent = bonusDisplayText(horizontalBonus);
  document.getElementById('vertical-bonus').textContent = bonusDisplayText(verticalBonus);
  document.getElementById('all-colors-bonus').textContent = bonusDisplayText(allColorsBonus);
  document.getElementById('total-score').textContent = tilesScore + horizontalBonus + verticalBonus + allColorsBonus;
}

function undo() {
  const activeSquare = board.querySelector('.active');
  if (activeSquare) {
    toggleSquare(activeSquare);
  }
  swooshSound.play();
}
document.getElementById('undo-button').onclick = undo;

function clear() {
  for (const square of [...board.getElementsByClassName('square')]) {
    square.classList.remove('filled', 'active');
    square.textContent = '1';
  }
  filledSquares = [];
  tilesScore = 0;
  horizontalBonus = 0;
  verticalBonus = 0;
  allColorsBonus = 0;
  updateScores();
  swooshSound.play();
}
document.getElementById('clear-button').onclick = clear;

window.addEventListener('keypress', event => {
  if (event.ctrlKey && event.key === 'z') {
    undo();
  }
});
