import { Chain } from '../chain.js';
import { BaseCreature } from './base.js';

export class Hydra extends BaseCreature {
  setupCreature() {
    this.complexityStage = this.complexityStage || 0;
    this.props.rotation = 0;
    this.props.coreSize = 25;
    this.props.headTargets = [];

    // Head chains
    const headCount = Math.min(this.complexityStage + 1, 5);
    for (let i = 0; i < headCount; i++) {
      this.chains.push(new Chain(18, 8, 14, 4, 0.4));
      this.props.headTargets.push({ x: 0, y: 0, phase: Math.random() * Math.PI * 2 });
    }

    // Small tentacle chains for higher complexity
    if (this.complexityStage >= 2) {
      const tentCount = Math.min((this.complexityStage - 1) * 2, 4);
      for (let i = 0; i < tentCount; i++) {
        this.chains.push(new Chain(8, 5, 6, 2, 0.6));
      }
    }
  }

  upgradeComplexity(stage) {
    this.complexityStage = stage;
    this.chains = [];
    this.props.headTargets = [];
    this.setupCreature();
  }

  updateChains() {
    this.props.rotation += 0.02 + this.attackPhase * 0.15;
    this.centerCollision = { x: this.x, y: this.y, radius: this.props.coreSize + 15 };

    const headCount = this.props.headTargets.length;
    for (let i = 0; i < headCount; i++) {
      const target = this.props.headTargets[i];
      const speed = 0.05 + i * 0.01 + this.attackPhase * 0.15;
      target.phase += speed;
      const orbitRadius = 80;
      const angle = target.phase + (i / headCount) * Math.PI * 2;
      target.x = this.x + Math.cos(angle) * orbitRadius;
      target.y = this.y + Math.sin(angle) * orbitRadius;
      this.chains[i].update(target.x, target.y);
    }

    // Small tentacles
    const tentStart = headCount;
    const tentCount = this.chains.length - headCount;
    for (let i = 0; i < tentCount; i++) {
      const angle = (i / tentCount) * Math.PI * 2 + this.props.rotation;
      const r = this.props.coreSize + 15 + Math.sin(this.timer * 0.1 + i) * 10;
      this.chains[tentStart + i].update(
        this.x + Math.cos(angle) * r,
        this.y + Math.sin(angle) * r
      );
    }
  }

  draw(ctx) {
    if (this.isDying) return;

    ctx.globalAlpha = this.getStateAlpha();
    ctx.shadowBlur = this.getGlowIntensity() + this.attackPhase * 20;
    ctx.shadowColor = this.getGlowColor();
    ctx.strokeStyle = this.getColor();

    const headCount = this.props.headTargets.length;

    // Draw small tentacles
    for (let i = headCount; i < this.chains.length; i++) {
      this.chains[i].draw(ctx, this.getColor(), 1.5);
    }

    // Rotating core rings
    ctx.save();
    ctx.translate(this.x, this.y);
    for (let ring = 0; ring < 3; ring++) {
      ctx.rotate(this.props.rotation * (ring % 2 === 0 ? 1 : -1));
      const r = this.props.coreSize + ring * 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // Spokes
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        ctx.lineTo(Math.cos(angle) * (r + 6), Math.sin(angle) * (r + 6));
        ctx.stroke();
      }
    }

    // Core cross
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(15, 0);
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 15);
    ctx.stroke();
    ctx.restore();

    // Head chains with snake heads
    ctx.lineWidth = 2.5;
    for (let i = 0; i < headCount; i++) {
      const chain = this.chains[i];
      const head = chain.segments[0];

      // Chain line to core
      ctx.beginPath();
      ctx.moveTo(head.x, head.y);
      for (let j = 1; j < chain.segments.length; j++) {
        ctx.lineTo(chain.segments[j].x, chain.segments[j].y);
      }
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      // Snake head with jaw
      const headAngle = head.angle;
      const jawOpen = 0.4 + this.attackPhase * 0.6;
      const headLen = 18;

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(head.x + Math.cos(headAngle) * headLen, head.y + Math.sin(headAngle) * headLen);
      ctx.lineTo(head.x + Math.cos(headAngle + jawOpen) * headLen * 0.8, head.y + Math.sin(headAngle + jawOpen) * headLen * 0.8);
      ctx.lineTo(head.x, head.y);
      ctx.lineTo(head.x + Math.cos(headAngle - jawOpen) * headLen * 0.8, head.y + Math.sin(headAngle - jawOpen) * headLen * 0.8);
      ctx.lineTo(head.x + Math.cos(headAngle) * headLen, head.y + Math.sin(headAngle) * headLen);
      ctx.stroke();

      // Eyes
      ctx.fillStyle = this.getColor();
      ctx.beginPath();
      ctx.arc(head.x + Math.cos(headAngle + 0.3) * 8, head.y + Math.sin(headAngle + 0.3) * 8, 3, 0, Math.PI * 2);
      ctx.arc(head.x + Math.cos(headAngle - 0.3) * 8, head.y + Math.sin(headAngle - 0.3) * 8, 3, 0, Math.PI * 2);
      ctx.fill();

      // Attack glow pulse
      if (this.attackPhase > 0.3 && this.attackPhase < 0.7) {
        const t = (this.attackPhase - 0.3) / 0.4;
        const r = 8 + t * 12;
        const alpha = (1 - t) * 0.6;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.getGlowColor();
        ctx.beginPath();
        ctx.arc(head.x, head.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Expanding ring attack effect
    if (this.attackPhase > 0.3 && this.attackPhase < 0.8) {
      const t = (this.attackPhase - 0.3) / 0.5;
      ctx.strokeStyle = this.getColor();
      for (let i = 0; i < 3; i++) {
        const r = 30 + t * 80 + i * 25;
        const alpha = (1 - t) * 0.5 * (1 - i * 0.3);
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 3 - i * 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (t < 0.3) {
        ctx.globalAlpha = (1 - t / 0.3) * 0.8;
        ctx.fillStyle = this.getGlowColor();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
