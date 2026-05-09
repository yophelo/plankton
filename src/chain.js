export class Segment {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.angle = 0;
  }
}

export class Chain {
  constructor(count, distance, startRadius, endRadius, stiffness = 0.6) {
    this.segments = [];
    this.distance = distance;
    this.stiffness = stiffness;

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const radius = startRadius + (endRadius - startRadius) * t;
      this.segments.push(new Segment(0, 0, radius));
    }
  }

  update(x, y) {
    const first = this.segments[0];
    first.x = x;
    first.y = y;

    for (let i = 1; i < this.segments.length; i++) {
      const prev = this.segments[i - 1];
      const seg = this.segments[i];
      const dx = prev.x - seg.x;
      const dy = prev.y - seg.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      seg.angle = angle;

      if (dist > 0) {
        const targetX = prev.x - Math.cos(angle) * this.distance;
        const targetY = prev.y - Math.sin(angle) * this.distance;
        seg.x += (targetX - seg.x) * this.stiffness;
        seg.y += (targetY - seg.y) * this.stiffness;

        const maxDist = this.distance * 2;
        const cdx = prev.x - seg.x;
        const cdy = prev.y - seg.y;
        if (Math.sqrt(cdx * cdx + cdy * cdy) > maxDist) {
          const a = Math.atan2(cdy, cdx);
          seg.x = prev.x - Math.cos(a) * maxDist;
          seg.y = prev.y - Math.sin(a) * maxDist;
        }
      }
    }
  }

  draw(ctx, color, lineWidth = 2) {
    if (this.segments.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.segments[0].x, this.segments[0].y);
    for (let i = 1; i < this.segments.length; i++) {
      ctx.lineTo(this.segments[i].x, this.segments[i].y);
    }
    ctx.stroke();

    for (let i = 0; i < this.segments.length; i++) {
      if (i % 2 === 0 && this.segments[i].radius > 0) {
        ctx.beginPath();
        ctx.arc(this.segments[i].x, this.segments[i].y, this.segments[i].radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}
