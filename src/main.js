import { Game } from './game.js';
import { audio } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();

  const startButton = document.getElementById('startButton');
  const startScreen = document.getElementById('startScreen');

  function handleStart() {
    // Init audio on user gesture
    audio.init();
    audio.resume();

    startScreen.classList.add('hidden');
    setTimeout(() => {
      startScreen.style.display = 'none';
      game.start();
      audio.startBGM();
    }, 500);
  }

  if (startButton && startScreen) {
    startButton.addEventListener('click', handleStart);

    // Also support touch on start button
    startButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleStart();
    });
  }

  // Audio toggle button
  const audioBtn = document.getElementById('audioToggle');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const on = audio.toggle();
      audioBtn.textContent = on ? '🔊' : '🔇';
    });
    audioBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      const on = audio.toggle();
      audioBtn.textContent = on ? '🔊' : '🔇';
    });
  }
});
