import { Chain } from '../chain.js';
import { BaseCreature } from './base.js';

export class Glider extends BaseCreature {
  setupCreature() {
    this.complexityStage = this.complexityStage || 0;
    this.props.wavePhase = 0;

    // Spine
    this.chains.push(new Chain(25, 8, 0, 0, 0.5));

    // Wing pairs based on complexity
    const wingPairs = Math.min(this.complexityStage + 1, 3);
    for (let i = 0; i < wingPairs; i++) {
      this.chains.push(new Chain(20 - i * 2, 8, 0, 0, 0.5));
      this.chains.push(new Chain(20 - i * 2, 8, 0, 0, 0.5));
    }

    // Tail fins at complexity >= 2
    if (this.complexityStage >= 2) {
      this.chains.push(new Chain(8, 6, 0, 0, 0.6));
      this.chains.push(new Chain(8, 6, 0, 0, 0.6));
    }
  }

  upgradeComplexity(stage) {
    this.complexityStage = stage;
    this.chains = [];
    this.setupCreature();
  }

  updateChains() {
    this.props.wavePhase += 0.08;
    this.chains[0].update(this.x, this.y);

    const wingPairs = Math.min(this.complexityStage + 1, 3);
    for (let i = 0; i < wingPairs; i++) {
      const dist = 35 + i * 15;
      const wave = Math.sin(this.props.wavePhase + i * 0.5) * 15;
      const leftIdx = 1 + i * 2;
      const rightIdx = 2 + i * 2;

      if (this.chains[leftIdx]) {
        const lx = Math.cos(this.angle - Math.PI / 2) * dist;
        const ly = Math.sin(this.angle - Math.PI / 2) * dist + wave;
        this.chains[leftIdx].update(this.x + lx, this.y + ly);
      }
      if (this.chains[rightIdx]) {
        const rx = Math.cos(this.angle + Math.PI / 2) * dist;
        const ry = Math.sin(this.angle + Math.PI / 2) * dist - wave;
        this.chains[rightIdx].update(this.x + rx, this.y + ry);
      }
    }

    // Tail fins
    if (this.complexityStage >= 2) {
      const spine = this.chains[0];
      const tail = spine.segments[spine.segments.length - 1];
      const wave = Math.sin(this.props.wavePhase) * 20;
      const tailLeftIdx = 1 + wingPairs * 2;
      const tailRightIdx = 2 + wingPairs * 2;
      if (this.chains[tailLeftIdx]) {
        this.chains[tailLeftIdx].update(
          tail.x + Math.cos(tail.angle - 0.5) * 40,
          tail.y + Math.sin(tail.angle - 0.5) * 40 + wave
        );
      }
      if (this.chains[tailRightIdx]) {
        this.chains[tailRightIdx].update(
          tail.x + Math.cos(tail.angle + 0.5) * 40,
          tail.y + Math.sin(tail.angle + 0.5) * 40 - wave
        );
      }
    }
  }

  draw(ctx) {
    if (this.isDying) return;

    ctx.globalAlpha = this.getStateAlpha();
    ctx.shadowBlur = this.getGlowIntensity() + this.attackPhase * 20;
    ctx.shadowColor = this.getGlowColor();

    const spine = this.chains[0];
    const wingPairs = Math.min(this.complexityStage + 1, 3);

    // Wing membranes (filled)
    for (let p = wingPairs - 1; p >= 0; p--) {
      const leftWing = this.chains[1 + p * 2];
      const rightWing = this.chains[2 + p * 2];
      if (!leftWing || !rightWing) continue;

      const alpha = 0.15 + p * 0.1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.getColor();

      // Left membrane
      for (let i = 0; i < Math.min(spine.segments.length, leftWing.segments.length) - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(spine.segments[i].x, spine.segments[i].y);
        ctx.lineTo(leftWing.segments[i].x, leftWing.segments[i].y);
        ctx.lineTo(leftWing.segments[i + 1].x, leftWing.segments[i + 1].y);
        ctx.lineTo(spine.segments[i + 1].x, spine.segments[i + 1].y);
        ctx.fill();
      }

      // Right membrane
      for (let i = 0; i < Math.min(spine.segments.length, rightWing.segments.length) - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(spine.segments[i].x, spine.segments[i].y);
        ctx.lineTo(rightWing.segments[i].x, rightWing.segments[i].y);
        ctx.lineTo(rightWing.segments[i + 1].x, rightWing.segments[i + 1].y);
        ctx.lineTo(spine.segments[i + 1].x, spine.segments[i + 1].y);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    ctx.strokeStyle = this.getColor();
    ctx.lineWidth = 1.5;

    // Wing outlines
    for (let p = 0; p < wingPairs; p++) {
      const leftWing = this.chains[1 + p * 2];
      const rightWing = this.chains[2 + p * 2];
      if (leftWing) leftWing.draw(ctx, this.getColor(), 1.5);
      if (rightWing) rightWing.draw(ctx, this.getColor(), 1.5);
    }

    // Spine
    ctx.lineWidth = 2;
    spine.draw(ctx, this.getColor(), 2);

    // Tail fin membrane
    if (this.complexityStage >= 2) {
      const tailLeftIdx = 1 + wingPairs * 2;
      const tailRightIdx = 2 + wingPairs * 2;
      const tailLeft = this.chains[tailLeftIdx];
      const tailRight = this.chains[tailRightIdx];
      if (tailLeft && tailRight) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = this.getColor();
        ctx.beginPath();
        ctx.moveTo(tailLeft.segments[0].x, tailLeft.segments[0].y);
        for (const seg of tailLeft.segments) {
          ctx.lineTo(seg.x, seg.y);
        }
        for (let i = tailRight.segments.length - 1; i >= 0; i--) {
          ctx.lineTo(tailRight.segments[i].x, tailRight.segments[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Manta head
    const head = spine.segments[0];
    const headSize = 25;
    const jawOpen = this.attackPhase * 0.4;

    ctx.strokeStyle = this.getColor();
    ctx.lineWidth = 3;

    // Left wing of head
    ctx.beginPath();
    ctx.moveTo(head.x + Math.cos(this.angle) * headSize, head.y + Math.sin(this.angle) * headSize);
    ctx.lineTo(
      head.x + Math.cos(this.angle - Math.PI / 2 - jawOpen) * headSize * 0.6,
      head.y + Math.sin(this.angle - Math.PI / 2 - jawOpen) * headSize * 0.6
    );
    ctx.lineTo(
      head.x + Math.cos(this.angle + Math.PI) * headSize * 0.3,
      head.y + Math.sin(this.angle + Math.PI) * headSize * 0.3
    );
    ctx.lineTo(head.x + Math.cos(this.angle) * headSize, head.y + Math.sin(this.angle) * headSize);
    ctx.stroke();

    // Right wing of head
    ctx.beginPath();
    ctx.moveTo(head.x + Math.cos(this.angle) * headSize, head.y + Math.sin(this.angle) * headSize);
    ctx.lineTo(
      head.x + Math.cos(this.angle + Math.PI / 2 + jawOpen) * headSize * 0.6,
      head.y + Math.sin(this.angle + Math.PI / 2 + jawOpen) * headSize * 0.6
    );
    ctx.lineTo(
      head.x + Math.cos(this.angle + Math.PI) * headSize * 0.3,
      head.y + Math.sin(this.angle + Math.PI) * headSize * 0.3
    );
    ctx.lineTo(head.x + Math.cos(this.angle) * headSize, head.y + Math.sin(this.angle) * headSize);
    ctx.stroke();

    // Center line
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(head.x + Math.cos(this.angle) * headSize, head.y + Math.sin(this.angle) * headSize);
    ctx.lineTo(
      head.x + Math.cos(this.angle + Math.PI) * headSize * 0.3,
      head.y + Math.sin(this.angle + Math.PI) * headSize * 0.3
    );
    ctx.stroke();

    // Attack effect
    if (this.attackPhase > 0.2) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      for (let i = 0; i < 4; i++) {
        const t = i / 3;
        const leftAngle = this.angle - Math.PI / 2 - jawOpen;
        const px = head.x + Math.cos(this.angle) * headSize * (1 - t * 0.7);
        const py = head.y + Math.sin(this.angle) * headSize * (1 - t * 0.7);
        const rayLen = 10 + this.attackPhase * 8;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(leftAngle) * rayLen, py + Math.sin(leftAngle) * rayLen);
        ctx.stroke();
      }
      for (let i = 0; i < 4; i++) {
        const t = i / 3;
        const rightAngle = this.angle + Math.PI / 2 + jawOpen;
        const px = head.x + Math.cos(this.angle) * headSize * (1 - t * 0.7);
        const py = head.y + Math.sin(this.angle) * headSize * (1 - t * 0.7);
        const rayLen = 10 + this.attackPhase * 8;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(rightAngle) * rayLen, py + Math.sin(rightAngle) * rayLen);
        ctx.stroke();
      }

      if (this.attackPhase > 0.6) {
        const t = (this.attackPhase - 0.6) / 0.4;
        ctx.strokeStyle = this.getColor();
        ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
          const r = 20 + t * 40 + i * 15;
          const alpha = (1 - t) * 0.5 * (1 - i * 0.4);
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(
            head.x + Math.cos(this.angle) * headSize,
            head.y + Math.sin(this.angle) * headSize,
            r, this.angle - Math.PI / 3, this.angle + Math.PI / 3
          );
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }

    // Eyes
    ctx.fillStyle = this.getColor();
    const eyeOffset = headSize * 0.4;
    ctx.beginPath();
    ctx.arc(
      head.x + Math.cos(this.angle - Math.PI / 2) * eyeOffset + Math.cos(this.angle) * headSize * 0.3,
      head.y + Math.sin(this.angle - Math.PI / 2) * eyeOffset + Math.sin(this.angle) * headSize * 0.3,
      3, 0, Math.PI * 2
    );
    ctx.arc(
      head.x + Math.cos(this.angle + Math.PI / 2) * eyeOffset + Math.cos(this.angle) * headSize * 0.3,
      head.y + Math.sin(this.angle + Math.PI / 2) * eyeOffset + Math.sin(this.angle) * headSize * 0.3,
      3, 0, Math.PI * 2
    );
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
