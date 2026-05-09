import { Chain } from '../chain.js';
import { BaseCreature } from './base.js';

export class Leviathan extends BaseCreature {
  setupCreature() {
    this.complexityStage = this.complexityStage || 0;
    const count = 18 + this.complexityStage * 3;
    const distance = 23;
    const startRadius = 28 + this.complexityStage * 2;
    const endRadius = 6 + this.complexityStage * 1;
    this.chains.push(new Chain(count, distance, startRadius, endRadius, 0.28));
  }

  upgradeComplexity(stage) {
    this.complexityStage = stage;
    this.chains = [];
    this.setupCreature();
  }

  updateChains() {
    this.chains[0].update(this.x, this.y);
  }

  draw(ctx) {
    if (this.isDying) return;

    const chain = this.chains[0];
    ctx.globalAlpha = this.getStateAlpha();
    ctx.shadowBlur = this.getGlowIntensity() + this.attackPhase * 20;
    ctx.shadowColor = this.getGlowColor();
    ctx.strokeStyle = this.getColor();

    // Hunting expanding rings
    if (this.isHunting) {
      const head = chain.segments[0];
      const pulse = (this.huntTimer % 40) / 40;
      for (let i = 0; i < 3; i++) {
        const t = (pulse + i * 0.33) % 1;
        const r = 40 + t * 80;
        const alpha = (1 - t) * 0.4 * this.getStateAlpha();
        ctx.strokeStyle = this.getGlowColor();
        ctx.lineWidth = 4 - i;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(head.x, head.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = this.getStateAlpha();
      ctx.strokeStyle = this.getColor();
    }

    // Main body line
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(chain.segments[0].x, chain.segments[0].y);
    for (let i = 1; i < chain.segments.length; i++) {
      ctx.lineTo(chain.segments[i].x, chain.segments[i].y);
    }
    ctx.stroke();

    // Segments with double outlines and decorations
    for (let i = 0; i < chain.segments.length; i++) {
      const seg = chain.segments[i];

      // Outer ring
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, seg.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner ring
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, seg.radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Gear decoration every 4th segment
      if (i % 4 === 0) {
        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.rotate(this.timer * 0.02 * (i % 2 === 0 ? 1 : -1));
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, seg.radius + 9, 0, Math.PI * 2);
        ctx.stroke();

        for (let j = 0; j < 5; j++) {
          const angle = (j / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(
            Math.cos(angle) * (seg.radius + 9),
            Math.sin(angle) * (seg.radius + 9),
            2.5, 0, Math.PI * 2
          );
          ctx.stroke();
        }
        ctx.restore();
      }

      // Spike ring every 7th segment
      if (i % 7 === 0 && i > 0) {
        ctx.lineWidth = 2;
        const spikes = 6;
        for (let j = 0; j < spikes; j++) {
          const angle = (j / spikes) * Math.PI * 2 + this.timer * 0.01;
          const innerR = seg.radius;
          const outerR = seg.radius + 7;
          ctx.beginPath();
          ctx.moveTo(seg.x + Math.cos(angle) * innerR, seg.y + Math.sin(angle) * innerR);
          ctx.lineTo(seg.x + Math.cos(angle) * outerR, seg.y + Math.sin(angle) * outerR);
          ctx.stroke();
        }
      }
    }

    // Black hole attack effect
    if (this.attackPhase > 0) {
      const head = chain.segments[0];
      const radius = 40 * this.attackPhase;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(head.x, head.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(head.x, head.y, radius + Math.random() * 10, 0, Math.PI * 2);
      ctx.stroke();

      // Orbiting particles
      if (this.attackPhase > 0.5) {
        ctx.fillStyle = this.getColor();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + this.timer * 0.1;
          const orbitR = radius + 20 + Math.sin(this.timer * 0.2 + i) * 10;
          ctx.beginPath();
          ctx.arc(
            head.x + Math.cos(angle) * orbitR,
            head.y + Math.sin(angle) * orbitR,
            2, 0, Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
