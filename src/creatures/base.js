export class BaseCreature {
  constructor(x, y, type, config, isAI = false) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.config = config;
    this.isAI = isAI;
    this.velocity = { x: 0, y: 0 };

    if (!isAI) {
      this.playerColor = '#0ff';
      this.playerGlow = '#0af';
    }

    this.angle = 0;
    this.timer = 0;
    this.attackPhase = 0;
    this.isAttacking = false;
    this.isHunting = false;
    this.huntTimer = 0;
    this.huntCooldownTimer = 0;
    this.chains = [];
    this.props = {};
    this.centerCollision = null;
    this.isDying = false;
    this.deathProgress = 0;
    this.isFrozen = true;
    this.frozenTimer = 6;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.scale = 1;

    if (this.isAI) {
      this.energy = 0;
      this.evolutionStage = 0;
      this.groupId = Math.random();
    }

    this.complexityStage = 0;
    this.setupCreature();
  }

  setupCreature() {}

  update(targetX, targetY, isHunting, worldW, worldH, particles) {
    this.timer++;

    if (this.isDying) {
      this.deathProgress = Math.min(this.deathProgress + 0.03, 1);
      return [];
    }

    if (this.isFrozen) {
      this.frozenTimer--;
      if (this.frozenTimer <= 0) {
        this.isFrozen = false;
      }
      this.updateChains();
      return [];
    }

    if (this.isHunting) {
      this.huntTimer++;
      const duration = this.config.huntDuration || 180;
      if (this.huntTimer >= duration) {
        this.isHunting = false;
        this.huntTimer = 0;
        this.huntCooldownTimer = this.config.huntCooldown || 300;
      }
    } else if (this.huntCooldownTimer > 0) {
      this.huntCooldownTimer--;
    }

    if (this.isAttacking) {
      this.attackPhase += 0.08;
      if (this.attackPhase >= 1) {
        this.attackPhase = 0;
        this.isAttacking = false;
      }
    } else {
      this.attackPhase = 0;
    }

    let eaten = [];
    if (!this.isAttacking) {
      eaten = this.detectAndEatParticles(particles);
      if (eaten.length > 0) {
        this.isAttacking = true;
        this.attackPhase = 0;
      }
    }

    this.updateChains();
    return eaten;
  }

  detectAndEatParticles(particles) {
    const eaten = [];
    if (this.chains.length === 0 && !this.centerCollision) return eaten;

    particles.forEach((p, idx) => {
      if (p.invulnerable) return;
      let hit = false;

      if (!hit && this.centerCollision) {
        const dx = p.x - this.centerCollision.x;
        const dy = p.y - this.centerCollision.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const threshold = this.centerCollision.radius + (p.size || 2);
        if (dist < threshold) {
          eaten.push(idx);
          hit = true;
        }
      }

      if (!hit) {
        for (const chain of this.chains) {
          if (hit) break;
          for (const seg of chain.segments) {
            const dx = p.x - seg.x;
            const dy = p.y - seg.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const threshold = (seg.radius || 10) + (p.size || 2);
            if (dist < threshold) {
              eaten.push(idx);
              hit = true;
              break;
            }
          }
        }
      }
    });

    return eaten;
  }

  detectAndAttackCreatures(allCreatures) {
    if (this.chains.length === 0 && !this.centerCollision) return null;

    const range = 500 * (this.scale || 1);
    const rangeSq = range * range;

    for (const other of allCreatures) {
      if (other === this || other.groupId === this.groupId) continue;

      const dx = other.x - this.x;
      const dy = other.y - this.y;
      if (dx * dx + dy * dy > rangeSq) continue;

      let collided = false;

      // Center vs center
      if (!collided && this.centerCollision && other.centerCollision) {
        const cdx = other.centerCollision.x - this.centerCollision.x;
        const cdy = other.centerCollision.y - this.centerCollision.y;
        const distSq = cdx * cdx + cdy * cdy;
        const r = this.centerCollision.radius + other.centerCollision.radius;
        if (distSq < r * r) collided = true;
      }

      // Center vs other chains
      if (!collided && this.centerCollision && other.chains.length > 0) {
        for (const chain of other.chains) {
          if (collided) break;
          const step = Math.max(1, Math.floor(chain.segments.length / 6));
          for (let i = 0; i < chain.segments.length; i += step) {
            const seg = chain.segments[i];
            const sdx = seg.x - this.centerCollision.x;
            const sdy = seg.y - this.centerCollision.y;
            const distSq = sdx * sdx + sdy * sdy;
            const r = this.centerCollision.radius + (seg.radius || 10);
            if (distSq < r * r) { collided = true; break; }
          }
        }
      }

      // Other center vs our chains
      if (!collided && other.centerCollision && this.chains.length > 0) {
        for (const chain of this.chains) {
          if (collided) break;
          const step = Math.max(1, Math.floor(chain.segments.length / 6));
          for (let i = 0; i < chain.segments.length; i += step) {
            const seg = chain.segments[i];
            const sdx = other.centerCollision.x - seg.x;
            const sdy = other.centerCollision.y - seg.y;
            const distSq = sdx * sdx + sdy * sdy;
            const r = (seg.radius || 10) + other.centerCollision.radius;
            if (distSq < r * r) { collided = true; break; }
          }
        }
      }

      // Chain vs chain
      if (!collided && this.chains.length > 0 && other.chains.length > 0) {
        for (const myChain of this.chains) {
          if (collided) break;
          const myStep = Math.max(1, Math.floor(myChain.segments.length / 5));
          for (let i = 0; i < myChain.segments.length && !collided; i += myStep) {
            const mySeg = myChain.segments[i];
            for (const otherChain of other.chains) {
              if (collided) break;
              const oStep = Math.max(1, Math.floor(otherChain.segments.length / 5));
              for (let j = 0; j < otherChain.segments.length; j += oStep) {
                const oSeg = otherChain.segments[j];
                const sdx = oSeg.x - mySeg.x;
                const sdy = oSeg.y - mySeg.y;
                const distSq = sdx * sdx + sdy * sdy;
                const r = (mySeg.radius || 10) + (oSeg.radius || 10);
                if (distSq < r * r) { collided = true; break; }
              }
            }
          }
        }
      }

      if (collided) {
        const victim = this.determineVictim(this, other);
        if (victim !== null) return victim;
      }
    }

    return null;
  }

  getBounds() {
    let minX = this.x, maxX = this.x, minY = this.y, maxY = this.y;
    this.chains.forEach(chain => {
      chain.segments.forEach(seg => {
        minX = Math.min(minX, seg.x - seg.radius);
        maxX = Math.max(maxX, seg.x + seg.radius);
        minY = Math.min(minY, seg.y - seg.radius);
        maxY = Math.max(maxY, seg.y + seg.radius);
      });
    });
    return { minX, maxX, minY, maxY };
  }

  determineVictim(a, b) {
    if (a.type === b.type) return null;
    return a.type > b.type ? b : a;
  }

  updateChains() {}

  draw(ctx) {}

  startDeath() {
    if (this.isDying) return [];
    this.isDying = true;
    this.deathProgress = 0;
    const particles = [];
    this.chains.forEach(chain => {
      chain.segments.forEach(seg => {
        const count = Math.max(2, Math.ceil(seg.radius / 1.5));
        const spread = Math.max(5, seg.radius);
        const s = this.scale || 1;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: seg.x + (Math.random() - 0.5) * spread,
            y: seg.y + (Math.random() - 0.5) * spread,
            size: (Math.random() * 3 + 1.5) * s,
            energy: Math.ceil(s),
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8
          });
        }
      });
    });
    return particles;
  }

  isDeathComplete() {
    return this.isDying && this.deathProgress >= 1;
  }

  getGlowIntensity() {
    let intensity = this.isAI ? 15 : 30;
    if (this.isHunting) {
      intensity += 20;
    } else if (this.huntCooldownTimer > 0) {
      intensity *= 0.5;
    }
    return intensity;
  }

  getColor() {
    return this.isAI ? this.config.color : (this.playerColor || this.config.color);
  }

  getGlowColor() {
    return this.isAI ? this.config.glow : (this.playerGlow || this.config.glow);
  }

  tryStartHunt() {
    if (!this.isHunting && this.huntCooldownTimer === 0) {
      this.isHunting = true;
      this.huntTimer = 0;
      return true;
    }
    return false;
  }

  canHunt() {
    return !this.isHunting && this.huntCooldownTimer === 0;
  }

  getStateAlpha() {
    return this.huntCooldownTimer > 0 ? 0.6 : 1;
  }

  getStateColorMultiplier() {
    if (this.isHunting) return 1.3;
    if (this.huntCooldownTimer > 0) return 0.7;
    return 1;
  }
}
