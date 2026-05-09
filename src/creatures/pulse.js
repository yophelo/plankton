import { Chain } from '../chain.js';
import { BaseCreature } from './base.js';

export class Pulse extends BaseCreature {
  setupCreature() {
    for (let i = 0; i < 5; i++) {
      this.chains.push(new Chain(12, 6, 4, 1, 0.4));
    }
  }

  updateChains() {
    this.centerCollision = { x: this.x, y: this.y, radius: 20 };

    const pulse = Math.sin(this.timer * 0.1) * 10 * (1 - this.attackPhase) + this.attackPhase * -20;

    for (let i = 0; i < this.chains.length; i++) {
      const angle = (Math.PI * 2 / 5) * i + this.timer * 0.02;
      const tx = this.x + Math.cos(angle) * (20 + pulse);
      const ty = this.y + Math.sin(angle) * (20 + pulse);
      this.chains[i].update(tx, ty);
    }
  }

  draw(ctx) {
    if (this.isDying) return;

    ctx.globalAlpha = this.getStateAlpha();
    ctx.shadowBlur = this.getGlowIntensity() + this.attackPhase * 20;
    ctx.shadowColor = this.getGlowColor();
    ctx.strokeStyle = this.getColor();
    ctx.lineWidth = 2;

    // Pentagon core
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i + this.timer * 0.02;
      const r = 15 - this.attackPhase * 5;
      const px = this.x + Math.cos(angle) * r;
      const py = this.y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Tentacles
    this.chains.forEach(chain => chain.draw(ctx, this.getColor(), 1.5));

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
