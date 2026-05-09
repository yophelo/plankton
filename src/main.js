import { Game } from './game.js';
import { audio } from './audio.js';
import { CONTROL_MODE } from './input.js';

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();

  const startButton = document.getElementById('startButton');
  const startScreen = document.getElementById('startScreen');
  const controlToggle = document.getElementById('controlToggle');

  let selectedMode = CONTROL_MODE.JOYSTICK;

  // Control mode toggle on start screen
  if (controlToggle) {
    controlToggle.addEventListener('click', () => {
      if (selectedMode === CONTROL_MODE.JOYSTICK) {
        selectedMode = CONTROL_MODE.TOUCH_FOLLOW;
        controlToggle.textContent = '🎯 触摸跟随';
      } else {
        selectedMode = CONTROL_MODE.JOYSTICK;
        controlToggle.textContent = '🕹️ 虚拟摇杆';
      }
    });
    controlToggle.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (selectedMode === CONTROL_MODE.JOYSTICK) {
        selectedMode = CONTROL_MODE.TOUCH_FOLLOW;
        controlToggle.textContent = '🎯 触摸跟随';
      } else {
        selectedMode = CONTROL_MODE.JOYSTICK;
        controlToggle.textContent = '🕹️ 虚拟摇杆';
      }
    });
  }

  function handleStart() {
    // Init audio on user gesture
    audio.init();
    audio.resume();
    game.setControlMode(selectedMode);

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
