import { Chain } from '../chain.js';
import { BaseCreature } from './base.js';

export class Dart extends BaseCreature {
  setupCreature() {
    this.chains.push(new Chain(8, 8, 10, 2, 0.9));
    this.thrustAngle = 0;
    this.thrustDistance = 0;
  }

  updateChains() {
    if (this.attackPhase > 0) {
      if (this.attackPhase < 0.1) {
        this.thrustAngle = this.angle;
      }
      let target = 0;
      if (this.attackPhase < 0.3) {
        target = (this.attackPhase / 0.3) * 25;
      } else if (this.attackPhase < 0.6) {
        target = 25;
      } else {
        target = 25 * (1 - (this.attackPhase - 0.6) / 0.4);
      }
      this.thrustDistance += (target - this.thrustDistance) * 0.3;
    } else {
      this.thrustDistance *= 0.8;
    }

    const tx = this.x + Math.cos(this.thrustAngle) * this.thrustDistance;
    const ty = this.y + Math.sin(this.thrustAngle) * this.thrustDistance;
    this.chains[0].update(tx, ty);
  }

  draw(ctx) {
    if (this.isDying) return;

    const head = this.chains[0].segments[0];
    const chain = this.chains[0];

    ctx.globalAlpha = this.getStateAlpha();
    ctx.shadowBlur = this.getGlowIntensity() + this.attackPhase * 20;
    ctx.shadowColor = this.getGlowColor();
    ctx.strokeStyle = this.getColor();
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    for (let i = 1; i < chain.segments.length; i++) {
      ctx.lineTo(chain.segments[i].x, chain.segments[i].y);
    }
    ctx.stroke();

    for (let i = 1; i < chain.segments.length; i++) {
      const seg = chain.segments[i];
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, seg.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    const angle = this.attackPhase > 0.1 ? this.thrustAngle : this.angle;
    const len = 20 + this.attackPhase * 5;

    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(head.x + Math.cos(angle) * len, head.y + Math.sin(angle) * len);
    ctx.lineTo(head.x + Math.cos(angle + 2.5) * 15, head.y + Math.sin(angle + 2.5) * 15);
    ctx.lineTo(head.x, head.y);
    ctx.lineTo(head.x + Math.cos(angle - 2.5) * 15, head.y + Math.sin(angle - 2.5) * 15);
    ctx.closePath();
    ctx.stroke();

    if (this.attackPhase > 0) {
      ctx.fillStyle = `rgba(170, 255, 255, ${this.attackPhase * 0.6})`;
      ctx.fill();

      if (this.attackPhase > 0.2 && this.attackPhase < 0.7) {
        const t = (this.attackPhase - 0.2) / 0.5;
        const r = 10 + t * 30;
        const alpha = (1 - t) * 0.5;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.getGlowColor();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(head.x + Math.cos(angle) * len, head.y + Math.sin(angle) * len, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
