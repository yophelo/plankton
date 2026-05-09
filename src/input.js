export const CONTROL_MODE = {
  TOUCH_FOLLOW: 'follow',
  JOYSTICK: 'joystick'
};

export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.position = { x: canvas.width / 2, y: canvas.height / 2 };
    this.active = false;

    // Control mode
    this.mode = CONTROL_MODE.JOYSTICK;

    // Joystick state
    this.joystick = {
      active: false,
      centerX: 0,
      centerY: 0,
      currentX: 0,
      currentY: 0,
      dx: 0,
      dy: 0,
      radius: 50,
      outerRadius: 70,
      touchId: null
    };

    this.setupTouchEvents();
    this.setupMouseEvents();
  }

  setMode(mode) {
    this.mode = mode;
    this.joystick.active = false;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
  }

  setupTouchEvents() {
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.mode === CONTROL_MODE.TOUCH_FOLLOW) {
        const touch = e.touches[0];
        if (touch) {
          this.position.x = touch.clientX;
          this.position.y = touch.clientY;
          this.active = true;
        }
      } else {
        // Joystick mode: use the rightmost touch or any touch on right half
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (this.joystick.touchId === null) {
            this.joystick.touchId = touch.identifier;
            this.joystick.centerX = touch.clientX;
            this.joystick.centerY = touch.clientY;
            this.joystick.currentX = touch.clientX;
            this.joystick.currentY = touch.clientY;
            this.joystick.active = true;
            this.joystick.dx = 0;
            this.joystick.dy = 0;
            break;
          }
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.mode === CONTROL_MODE.TOUCH_FOLLOW) {
        const touch = e.touches[0];
        if (touch) {
          this.position.x = touch.clientX;
          this.position.y = touch.clientY;
          this.active = true;
        }
      } else {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.joystick.touchId) {
            this.joystick.currentX = touch.clientX;
            this.joystick.currentY = touch.clientY;
            let dx = touch.clientX - this.joystick.centerX;
            let dy = touch.clientY - this.joystick.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > this.joystick.radius) {
              dx = (dx / dist) * this.joystick.radius;
              dy = (dy / dist) * this.joystick.radius;
            }
            // Normalize to -1..1
            this.joystick.dx = dx / this.joystick.radius;
            this.joystick.dy = dy / this.joystick.radius;
            break;
          }
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (this.mode === CONTROL_MODE.TOUCH_FOLLOW) {
        this.active = false;
      } else {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.joystick.touchId) {
            this.joystick.active = false;
            this.joystick.touchId = null;
            this.joystick.dx = 0;
            this.joystick.dy = 0;
            break;
          }
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      if (this.mode === CONTROL_MODE.TOUCH_FOLLOW) {
        this.active = false;
      } else {
        this.joystick.active = false;
        this.joystick.touchId = null;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
      }
    }, { passive: false });
  }

  setupMouseEvents() {
    window.addEventListener('mousemove', (e) => {
      if (this.mode === CONTROL_MODE.TOUCH_FOLLOW) {
        this.position.x = e.clientX;
        this.position.y = e.clientY;
        this.active = true;
      }
    });

    // Mouse joystick simulation (click and drag)
    let mouseDown = false;
    let mouseCenterX = 0, mouseCenterY = 0;

    window.addEventListener('mousedown', (e) => {
      if (this.mode === CONTROL_MODE.JOYSTICK) {
        mouseDown = true;
        mouseCenterX = e.clientX;
        mouseCenterY = e.clientY;
        this.joystick.centerX = e.clientX;
        this.joystick.centerY = e.clientY;
        this.joystick.active = true;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mode === CONTROL_MODE.JOYSTICK && mouseDown) {
        let dx = e.clientX - mouseCenterX;
        let dy = e.clientY - mouseCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.joystick.radius) {
          dx = (dx / dist) * this.joystick.radius;
          dy = (dy / dist) * this.joystick.radius;
        }
        this.joystick.dx = dx / this.joystick.radius;
        this.joystick.dy = dy / this.joystick.radius;
        this.joystick.currentX = mouseCenterX + dx;
        this.joystick.currentY = mouseCenterY + dy;
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.mode === CONTROL_MODE.JOYSTICK) {
        mouseDown = false;
        this.joystick.active = false;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
      }
    });
  }

  getPosition() {
    return { x: this.position.x, y: this.position.y };
  }

  /** Get joystick direction as normalized vector (-1 to 1) */
  getJoystickDirection() {
    return { dx: this.joystick.dx, dy: this.joystick.dy };
  }

  isJoystickActive() {
    return this.mode === CONTROL_MODE.JOYSTICK && this.joystick.active;
  }

  /** Draw joystick overlay (call from game draw, in screen space) */
  drawJoystick(ctx) {
    if (this.mode !== CONTROL_MODE.JOYSTICK || !this.joystick.active) return;

    const { centerX, centerY, dx, dy, radius, outerRadius } = this.joystick;

    // Outer ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.fill();

    // Inner thumb
    const thumbX = centerX + dx * radius;
    const thumbY = centerY + dy * radius;
    ctx.beginPath();
    ctx.arc(thumbX, thumbY, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  resize(width, height) {
    this.position.x = width / 2;
    this.position.y = height / 2;
  }
}
