import { Chain } from '../chain.js';
import { BaseCreature } from './base.js';

export class Serpent extends BaseCreature {
  setupCreature() {
    const dist = 6 + (this.complexityStage || 0) * 2;
    const count = 30 + (this.complexityStage || 0) * 3;
    this.chains.push(new Chain(count, dist, 14, 3, 0.3));
  }

  updateChains() {
    this.chains[0].update(this.x, this.y);
  }

  upgradeComplexity(stage) {
    this.complexityStage = stage;
    const dist = 6 + stage * 2;
    const count = 30 + stage * 3;
    this.chains[0] = new Chain(count, dist, 14, 3, 0.3);
  }

  draw(ctx) {
    if (this.isDying) return;

    const chain = this.chains[0];
    ctx.globalAlpha = this.getStateAlpha();
    ctx.shadowBlur = this.getGlowIntensity() + this.attackPhase * 20;
    ctx.shadowColor = this.getGlowColor();
    ctx.strokeStyle = this.getColor();

    // Hunting glow trail
    if (this.isHunting) {
      const pulse = (this.huntTimer % 20) / 20;
      ctx.strokeStyle = this.getGlowColor();
      ctx.lineWidth = 4;
      ctx.globalAlpha = (1 - pulse) * 0.3 * this.getStateAlpha();
      ctx.beginPath();
      ctx.moveTo(chain.segments[0].x, chain.segments[0].y);
      for (let i = 1; i < chain.segments.length; i++) {
        ctx.lineTo(chain.segments[i].x, chain.segments[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = this.getStateAlpha();
      ctx.strokeStyle = this.getColor();
    }

    // Segments with barbs
    for (let i = 0; i < chain.segments.length; i++) {
      const seg = chain.segments[i];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, seg.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (i % 3 === 0 && i > 2 && i < chain.segments.length - 3) {
        const angle = seg.angle;
        const barbLen = 8 + this.attackPhase * 15;
        for (const side of [-1, 1]) {
          const barbAngle = angle + side * Math.PI / 2;
          const bx = seg.x + Math.cos(barbAngle) * barbLen;
          const by = seg.y + Math.sin(barbAngle) * barbLen;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(seg.x, seg.y);
          ctx.lineTo(bx, by);
          const tipAngle = barbAngle + side * 0.5;
          ctx.lineTo(bx + Math.cos(tipAngle) * 5, by + Math.sin(tipAngle) * 5);
          ctx.stroke();
        }
      }
    }

    // Main body line
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(chain.segments[0].x, chain.segments[0].y);
    for (let i = 1; i < chain.segments.length; i++) {
      ctx.lineTo(chain.segments[i].x, chain.segments[i].y);
    }
    ctx.stroke();

    // Snake head with jaw
    const head = chain.segments[0];
    const headAngle = head.angle;
    const jawOpen = 0.3 + this.attackPhase * 0.5;

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(head.x + Math.cos(headAngle) * 15, head.y + Math.sin(headAngle) * 15);
    ctx.lineTo(head.x + Math.cos(headAngle + jawOpen) * 12, head.y + Math.sin(headAngle + jawOpen) * 12);
    ctx.lineTo(head.x, head.y);
    ctx.lineTo(head.x + Math.cos(headAngle - jawOpen) * 12, head.y + Math.sin(headAngle - jawOpen) * 12);
    ctx.lineTo(head.x + Math.cos(headAngle) * 15, head.y + Math.sin(headAngle) * 15);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = this.getColor();
    const eyeDist = 6;
    ctx.beginPath();
    ctx.arc(head.x + Math.cos(headAngle + 0.2) * eyeDist, head.y + Math.sin(headAngle + 0.2) * eyeDist, 2, 0, Math.PI * 2);
    ctx.arc(head.x + Math.cos(headAngle - 0.2) * eyeDist, head.y + Math.sin(headAngle - 0.2) * eyeDist, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
