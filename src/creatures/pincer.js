import { Chain } from '../chain.js';
import { BaseCreature } from './base.js';

export class Pincer extends BaseCreature {
  setupCreature() {
    this.complexityStage = this.complexityStage || 0;
    // Main body
    this.chains.push(new Chain(10, 8, 20, 5, 0.7));
    // Main claw arms
    if (this.complexityStage >= 0) {
      this.chains.push(new Chain(6, 12, 10, 5, 0.85));
      this.chains.push(new Chain(6, 12, 10, 5, 0.85));
    }
    // Small arms for higher complexity
    if (this.complexityStage >= 1) {
      this.chains.push(new Chain(4, 6, 6, 3, 0.9));
      this.chains.push(new Chain(4, 6, 6, 3, 0.9));
    }
  }

  upgradeComplexity(stage) {
    this.complexityStage = stage;
    this.chains = [];
    this.setupCreature();
  }

  updateChains() {
    this.chains[0].update(this.x, this.y);

    const angle = this.angle;
    const spread = 0.3 - this.attackPhase * 0.25;
    const reach = 70 + this.attackPhase * 30;

    if (this.chains.length > 1) {
      const lx = this.x + Math.cos(angle - spread) * reach;
      const ly = this.y + Math.sin(angle - spread) * reach;
      this.chains[1].update(lx, ly);
    }
    if (this.chains.length > 2) {
      const rx = this.x + Math.cos(angle + spread) * reach;
      const ry = this.y + Math.sin(angle + spread) * reach;
      this.chains[2].update(rx, ry);
    }
    if (this.chains.length > 3) {
      const sSpread = 0.6 - this.attackPhase * 0.2;
      const sReach = 50 + this.attackPhase * 20;
      const slx = this.x + Math.cos(angle - sSpread) * sReach;
      const sly = this.y + Math.sin(angle - sSpread) * sReach;
      this.chains[3].update(slx, sly);
    }
    if (this.chains.length > 4) {
      const sSpread = 0.6 - this.attackPhase * 0.2;
      const sReach = 50 + this.attackPhase * 20;
      const srx = this.x + Math.cos(angle + sSpread) * sReach;
      const sry = this.y + Math.sin(angle + sSpread) * sReach;
      this.chains[4].update(srx, sry);
    }
  }

  draw(ctx) {
    if (this.isDying) return;

    ctx.globalAlpha = this.getStateAlpha();
    ctx.shadowBlur = this.getGlowIntensity() + this.attackPhase * 20;
    ctx.shadowColor = this.getGlowColor();
    ctx.strokeStyle = this.getColor();
    ctx.lineWidth = 2;

    const head = this.chains[0].segments[0];
    const headSize = 20;

    // Diamond head
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(head.x + headSize, head.y);
    ctx.lineTo(head.x, head.y - headSize);
    ctx.lineTo(head.x - headSize, head.y);
    ctx.lineTo(head.x, head.y + headSize);
    ctx.closePath();
    ctx.stroke();

    // Inner diamond
    ctx.lineWidth = 2;
    const inner = headSize * 0.6;
    ctx.beginPath();
    ctx.moveTo(head.x + inner, head.y);
    ctx.lineTo(head.x, head.y - inner);
    ctx.lineTo(head.x - inner, head.y);
    ctx.lineTo(head.x, head.y + inner);
    ctx.closePath();
    ctx.stroke();

    // Cross pattern
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(head.x - headSize, head.y);
    ctx.lineTo(head.x + headSize, head.y);
    ctx.moveTo(head.x, head.y - headSize);
    ctx.lineTo(head.x, head.y + headSize);
    ctx.stroke();

    // Corner dots
    const dotDist = headSize * 0.7;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const dx = head.x + Math.cos(a) * dotDist;
      const dy = head.y + Math.sin(a) * dotDist;
      ctx.beginPath();
      ctx.arc(dx, dy, 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body hexagonal segments
    const body = this.chains[0];
    ctx.lineWidth = 2;
    for (let i = 1; i < body.segments.length; i++) {
      const seg = body.segments[i];
      const r = seg.radius * 1.5;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2;
        const px = seg.x + Math.cos(a) * r;
        const py = seg.y + Math.sin(a) * r;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Body spine
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    for (let i = 1; i < body.segments.length; i++) {
      ctx.lineTo(body.segments[i].x, body.segments[i].y);
    }
    ctx.stroke();

    // Main claw arms
    [this.chains[1], this.chains[2]].forEach((arm) => {
      if (!arm) return;

      // Arm segments diamonds
      for (let i = 0; i < arm.segments.length; i++) {
        const seg = arm.segments[i];
        if (i % 2 === 0) {
          const r = seg.radius * 1.2;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(seg.x + r, seg.y);
          ctx.lineTo(seg.x, seg.y - r);
          ctx.lineTo(seg.x - r, seg.y);
          ctx.lineTo(seg.x, seg.y + r);
          ctx.closePath();
          ctx.stroke();
        }
      }

      // Arm line
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(arm.segments[arm.segments.length - 1].x, arm.segments[arm.segments.length - 1].y);
      for (let i = arm.segments.length - 2; i >= 0; i--) {
        ctx.lineTo(arm.segments[i].x, arm.segments[i].y);
      }
      ctx.stroke();

      // Pincer tips
      const tip = arm.segments[0];
      const next = arm.segments[1] || tip;
      const tipAngle = Math.atan2(tip.y - next.y, tip.x - next.x);
      const pincerLen = 12;

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x + Math.cos(tipAngle + 0.5) * pincerLen, tip.y + Math.sin(tipAngle + 0.5) * pincerLen);
      ctx.lineTo(tip.x + Math.cos(tipAngle) * pincerLen * 1.5, tip.y + Math.sin(tipAngle) * pincerLen * 1.5);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x + Math.cos(tipAngle - 0.5) * pincerLen, tip.y + Math.sin(tipAngle - 0.5) * pincerLen);
      ctx.lineTo(tip.x + Math.cos(tipAngle) * pincerLen * 1.5, tip.y + Math.sin(tipAngle) * pincerLen * 1.5);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();

      // Tip circle
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Attack wave effects
      if (this.attackPhase > 0.5) {
        const t = (this.attackPhase - 0.5) / 0.5;
        ctx.strokeStyle = this.getColor();
        for (let i = 0; i < 3; i++) {
          const r = 20 + t * 60 + i * 20;
          const alpha = (1 - t) * 0.6 * (1 - i * 0.3);
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 3 - i * 0.5;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, r, tipAngle - Math.PI / 4, tipAngle + Math.PI / 4);
          ctx.stroke();
        }
        if (t < 0.3) {
          ctx.globalAlpha = (1 - t / 0.3) * 0.8;
          ctx.fillStyle = this.getGlowColor();
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = (1 - t) * 0.7;
        ctx.lineWidth = 4;
        for (let i = 0; i < 5; i++) {
          const a = tipAngle + (Math.random() - 0.5) * 0.4;
          const len = 30 + t * 50;
          ctx.beginPath();
          ctx.moveTo(tip.x, tip.y);
          ctx.lineTo(tip.x + Math.cos(a) * len, tip.y + Math.sin(a) * len);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    });

    // Small arms
    const smallArms = [];
    if (this.chains.length > 3) smallArms.push(this.chains[3]);
    if (this.chains.length > 4) smallArms.push(this.chains[4]);

    smallArms.forEach(arm => {
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.getColor();
      ctx.beginPath();
      ctx.moveTo(arm.segments[arm.segments.length - 1].x, arm.segments[arm.segments.length - 1].y);
      for (let i = arm.segments.length - 2; i >= 0; i--) {
        ctx.lineTo(arm.segments[i].x, arm.segments[i].y);
      }
      ctx.stroke();

      for (let i = 0; i < arm.segments.length; i += 2) {
        const seg = arm.segments[i];
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, seg.radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }

      const tip = arm.segments[0];
      const next = arm.segments[1] || tip;
      const tipAngle = Math.atan2(tip.y - next.y, tip.x - next.x);
      const len = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x + Math.cos(tipAngle + 0.4) * len, tip.y + Math.sin(tipAngle + 0.4) * len);
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x + Math.cos(tipAngle - 0.4) * len, tip.y + Math.sin(tipAngle - 0.4) * len);
      ctx.stroke();
    });

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
