import { PARTICLE_COUNT, WORLD_SIZE } from './config.js';

const HALF_WORLD = WORLD_SIZE / 2;

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  generate(count, camera, canvasWidth, canvasHeight) {
    const w = canvasWidth / (camera.zoom || 1);
    const h = canvasHeight / (camera.zoom || 1);
    const spread = Math.max(w, h);
    const cx = camera.x || 0;
    const cy = camera.y || 0;

    for (let i = 0; i < count; i++) {
      // Generate within world bounds only
      const x = (Math.random() - 0.5) * WORLD_SIZE;
      const y = (Math.random() - 0.5) * WORLD_SIZE;
      this.particles.push({
        x,
        y,
        size: Math.random() * 3 + 1.5,
        energy: 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }
  }

  update(camera, canvasWidth, canvasHeight) {
    // Move particles and keep within world bounds
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Bounce off world boundaries
      if (p.x > HALF_WORLD) { p.x = HALF_WORLD; p.vx = -p.vx; }
      if (p.x < -HALF_WORLD) { p.x = -HALF_WORLD; p.vx = -p.vx; }
      if (p.y > HALF_WORLD) { p.y = HALF_WORLD; p.vy = -p.vy; }
      if (p.y < -HALF_WORLD) { p.y = -HALF_WORLD; p.vy = -p.vy; }
    }

    // Cull particles far from view
    const w = canvasWidth / (camera.zoom || 1);
    const h = canvasHeight / (camera.zoom || 1);
    const spread = Math.max(w, h);
    const left = camera.x - w / 2;
    const right = camera.x + w / 2;
    const top = camera.y - h / 2;
    const bottom = camera.y + h / 2;

    this.particles = this.particles.filter(p =>
      p.x > left - spread && p.x < right + spread &&
      p.y > top - spread && p.y < bottom + spread
    );

    // Respawn to maintain count - only within world bounds
    while (this.particles.length < PARTICLE_COUNT) {
      const x = (Math.random() - 0.5) * WORLD_SIZE;
      const y = (Math.random() - 0.5) * WORLD_SIZE;
      this.particles.push({
        x,
        y,
        size: Math.random() * 3 + 1.5,
        energy: 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }
  }

  draw(ctx, camera, canvasWidth, canvasHeight) {
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';

    const w = canvasWidth / camera.zoom;
    const h = canvasHeight / camera.zoom;
    const left = camera.x - w / 2;
    const right = camera.x + w / 2;
    const top = camera.y - h / 2;
    const bottom = camera.y + h / 2;

    for (const p of this.particles) {
      if (p.x < left || p.x > right || p.y < top || p.y > bottom) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  removeIndices(indices) {
    // Remove by index in descending order to avoid shifting
    const sorted = [...indices].sort((a, b) => b - a);
    for (const idx of sorted) {
      if (idx >= 0 && idx < this.particles.length) {
        this.particles.splice(idx, 1);
      }
    }
  }

  addParticles(newParticles) {
    this.particles.push(...newParticles);
  }
}
