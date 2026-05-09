export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.position = { x: canvas.width / 2, y: canvas.height / 2 };
    this.active = false;

    this.setupTouchEvents();
    this.setupMouseEvents();
  }

  setupTouchEvents() {
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        this.position.x = touch.clientX;
        this.position.y = touch.clientY;
        this.active = true;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        this.position.x = touch.clientX;
        this.position.y = touch.clientY;
        this.active = true;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      // Keep last position for drift
      this.active = false;
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.active = false;
    }, { passive: false });
  }

  setupMouseEvents() {
    window.addEventListener('mousemove', (e) => {
      this.position.x = e.clientX;
      this.position.y = e.clientY;
      this.active = true;
    });
  }

  getPosition() {
    return { x: this.position.x, y: this.position.y };
  }

  resize(width, height) {
    this.position.x = width / 2;
    this.position.y = height / 2;
  }
}
