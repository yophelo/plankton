import { Chain } from '../chain.js';
import { BaseCreature } from './base.js';

export class Photon extends BaseCreature {
  setupCreature() {
    this.chains.push(new Chain(4, 5, 6, 1, 0.8));
  }

  updateChains() {
    this.chains[0].update(this.x, this.y);
  }

  draw(ctx) {
    if (this.isDying) return;

    const seg = this.chains[0].segments[0];
    ctx.globalAlpha = this.getStateAlpha();
    ctx.shadowBlur = this.getGlowIntensity() + this.attackPhase * 20;
    ctx.shadowColor = this.getGlowColor();
    ctx.fillStyle = this.getColor();

    const r = 4 + Math.random() * 2 + this.attackPhase * 10 + (this.isHunting ? 3 : 0);
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, r, 0, Math.PI * 2);
    ctx.fill();

    if (this.isHunting) {
      const pulse = (this.huntTimer % 30) / 30;
      ctx.strokeStyle = this.getGlowColor();
      ctx.lineWidth = 2;
      ctx.globalAlpha = (1 - pulse) * 0.5 * this.getStateAlpha();
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, r + pulse * 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = this.getStateAlpha();
    }

    this.chains[0].draw(ctx, this.getColor(), 2);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
