export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.targetZoom = 1;
  }

  update(targetX, targetY) {
    // Smooth follow
    this.x += (targetX - this.x) * 0.05;
    this.y += (targetY - this.y) * 0.05;
    // Smooth zoom
    this.zoom += (this.targetZoom - this.zoom) * 0.02;
  }

  setZoomForLevel(level) {
    const zoomLevels = [1.6, 1.4, 1.2, 1.0, 0.85, 0.7, 0.6, 0.5];
    this.targetZoom = zoomLevels[Math.min(level, zoomLevels.length - 1)];
  }

  screenToWorld(screenX, screenY, canvasWidth, canvasHeight) {
    return {
      x: (screenX - canvasWidth / 2) / this.zoom + this.x,
      y: (screenY - canvasHeight / 2) / this.zoom + this.y
    };
  }

  getScreenBounds(canvasWidth, canvasHeight, margin = 1) {
    const w = canvasWidth / this.zoom;
    const h = canvasHeight / this.zoom;
    return {
      left: this.x - (w / 2) * margin,
      right: this.x + (w / 2) * margin,
      top: this.y - (h / 2) * margin,
      bottom: this.y + (h / 2) * margin
    };
  }

  isInView(x, y, radius, canvasWidth, canvasHeight) {
    const bounds = this.getScreenBounds(canvasWidth, canvasHeight, 1.5);
    const pad = (radius || 100) * (1 / this.zoom);
    return x + pad > bounds.left && x - pad < bounds.right &&
           y + pad > bounds.top && y - pad < bounds.bottom;
  }
}
