import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();

  const startButton = document.getElementById('startButton');
  const startScreen = document.getElementById('startScreen');

  if (startButton && startScreen) {
    startButton.addEventListener('click', () => {
      startScreen.classList.add('hidden');
      setTimeout(() => {
        startScreen.style.display = 'none';
        game.start();
      }, 500);
    });

    // Also support touch on start button
    startButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      startScreen.classList.add('hidden');
      setTimeout(() => {
        startScreen.style.display = 'none';
        game.start();
      }, 500);
    });
  }
});
