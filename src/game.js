import { SPECIES, PARTICLE_COUNT, WORLD_SIZE, INITIAL_AI_COUNTS, stageEnergy } from './config.js';
import { Camera } from './camera.js';
import { InputHandler, CONTROL_MODE } from './input.js';
import { ParticleSystem } from './particles.js';
import { AIManager, updateFlocking } from './ai.js';
import { UI } from './ui.js';
import { audio } from './audio.js';
import { Photon } from './creatures/photon.js';
import { Dart } from './creatures/dart.js';
import { Pulse } from './creatures/pulse.js';
import { Serpent } from './creatures/serpent.js';
import { Pincer } from './creatures/pincer.js';
import { Glider } from './creatures/glider.js';
import { Hydra } from './creatures/hydra.js';
import { Leviathan } from './creatures/leviathan.js';

const CREATURE_CLASSES = [Photon, Dart, Pulse, Serpent, Pincer, Glider, Hydra, Leviathan];

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    this.camera = new Camera();
    this.input = new InputHandler(this.canvas);
    this.particleSystem = new ParticleSystem();
    this.aiManager = new AIManager();
    this.ui = new UI();

    this.creatures = [];
    this.aiCreatures = [];
    this.playerLevel = 0;
    this.evolutionStage = 0;
    this.stageEnergy = 0;
    this.stageMaxEnergy = stageEnergy(0);

    this.frameCount = 0;
    this.gameStarted = false;
    this.gameOver = false;

    // Screen shake state
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;

    this.score = {
      startTime: 0,
      survivalTime: 0,
      maxLevel: 0,
      kills: 0,
      killsByLevel: {}
    };

    this.playerGroupId = 'player_group';

    this.resize();
    this.setupEvents();
    this.drawBlackScreen();
    this.animate();
  }

  drawBlackScreen() {
    this.ctx.fillStyle = '#050a0f';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  setupEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.resize(), 100);
    });
  }

  start() {
    if (this.gameStarted) return;
    this.gameStarted = true;
    this.gameOver = false;
    this.init();
  }

  setControlMode(mode) {
    this.input.setMode(mode);
  }

  init() {
    this.creatures = [];
    this.aiCreatures = [];
    this.aiManager = new AIManager();
    this.particleSystem = new ParticleSystem();
    this.playerLevel = 0;
    this.evolutionStage = 0;
    this.stageEnergy = 0;
    this.stageMaxEnergy = stageEnergy(0);
    this.score = { startTime: Date.now(), survivalTime: 0, maxLevel: 0, kills: 0, killsByLevel: {} };

    this.createPlayer(0, 0);
    this.createAllAICreatures();
    this.particleSystem.generate(PARTICLE_COUNT, this.camera, this.width, this.height);
    this.camera.setZoomForLevel(0);
    this.ui.update(this.playerLevel, this.evolutionStage, this.stageEnergy, this.stageMaxEnergy, this.creatures.length, this.aiCreatures.length);
  }

  createPlayer(x, y) {
    const CreatureClass = CREATURE_CLASSES[this.playerLevel];
    const config = SPECIES[this.playerLevel];
    const creature = new CreatureClass(x, y, this.playerLevel, config, false);
    creature.groupId = this.playerGroupId;
    this.creatures.push(creature);
  }

  createAllAICreatures() {
    for (const [typeStr, count] of Object.entries(INITIAL_AI_COUNTS)) {
      const type = parseInt(typeStr);
      const groupId = `ai_group_${type}_${Math.random()}`;
      this.aiManager.createGroup(groupId, type);

      for (let i = 0; i < count; i++) {
        this.spawnAICreature(type, groupId);
      }
    }
  }

  spawnAICreature(type, groupId) {
    const halfWorld = WORLD_SIZE / 2;
    // Lower level creatures spawn closer to center so player encounters them early
    const spawnRadius = type <= 2 ? halfWorld * 0.5 : halfWorld * 0.5 + type * halfWorld * 0.15;
    const safeZone = 400; // minimum distance from player spawn (0,0)
    let x, y, dist;
    do {
      x = (Math.random() - 0.5) * spawnRadius * 2;
      y = (Math.random() - 0.5) * spawnRadius * 2;
      dist = Math.sqrt(x * x + y * y);
    } while (dist < safeZone);
    const CreatureClass = CREATURE_CLASSES[type];
    const config = SPECIES[type];
    const creature = new CreatureClass(x, y, type, config, true);
    creature.groupId = groupId;
    this.aiCreatures.push(creature);
  }

  getMouseWorldPos() {
    if (this.input.mode === CONTROL_MODE.JOYSTICK) {
      // In joystick mode, return a target position relative to the player
      const dir = this.input.getJoystickDirection();
      if (this.creatures.length > 0 && (Math.abs(dir.dx) > 0.01 || Math.abs(dir.dy) > 0.01)) {
        const leader = this.creatures[0];
        // Project target 300 units in joystick direction
        return {
          x: leader.x + dir.dx * 300,
          y: leader.y + dir.dy * 300
        };
      }
      // No input: return player position (stay still)
      if (this.creatures.length > 0) {
        return { x: this.creatures[0].x, y: this.creatures[0].y };
      }
    }
    const pos = this.input.getPosition();
    return {
      x: (pos.x - this.width / 2) / this.camera.zoom + this.camera.x,
      y: (pos.y - this.height / 2) / this.camera.zoom + this.camera.y
    };
  }

  update() {
    if (!this.gameStarted || this.gameOver) return;

    this.frameCount++;
    this.score.survivalTime = Math.floor((Date.now() - this.score.startTime) / 1000);

    // Respawn AI
    const respawnTypes = this.aiManager.updateRespawns();
    for (const type of respawnTypes) {
      const groupId = `ai_respawn_${type}_${Math.random()}`;
      this.aiManager.createGroup(groupId, type);
      this.spawnAICreature(type, groupId);
    }

    const mouseWorld = this.getMouseWorldPos();
    const allCreatures = [...this.creatures, ...this.aiCreatures];
    const eatenByPlayer = new Set();
    const eatenByAI = new Set();
    const attacks = [];

    // Update AI creatures
    for (const creature of this.aiCreatures) {
      if (!creature || creature.isDying) continue;

      if (creature.isFrozen) {
        creature.update(creature.x, creature.y, false, WORLD_SIZE, WORLD_SIZE, this.particleSystem.particles);
        continue;
      }

      // AI flocking
      const target = updateFlocking(creature, mouseWorld, allCreatures, true);
      let dx = target.x - creature.x;
      let dy = target.y - creature.y;

      // Photon jitter
      if (creature.type === 0) {
        dx += (Math.random() - 0.5) * 20;
        dy += (Math.random() - 0.5) * 20;
      }

      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = (creature.isHunting ? creature.config.huntSpeed : creature.config.speed) * 100;
      let vx, vy;
      if (dist > speed) {
        vx = (dx / dist) * speed;
        vy = (dy / dist) * speed;
      } else {
        vx = dx;
        vy = dy;
      }

      creature.x += vx;
      creature.y += vy;

      // World boundaries
      const halfWorld = WORLD_SIZE / 2;
      if (creature.x > halfWorld) { creature.x = halfWorld; if (vx > 0) creature.wanderAngle = Math.PI + (Math.random() - 0.5) * Math.PI / 2; }
      if (creature.x < -halfWorld) { creature.x = -halfWorld; if (vx < 0) creature.wanderAngle = (Math.random() - 0.5) * Math.PI / 2; }
      if (creature.y > halfWorld) { creature.y = halfWorld; if (vy > 0) creature.wanderAngle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2; }
      if (creature.y < -halfWorld) { creature.y = -halfWorld; if (vy < 0) creature.wanderAngle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2; }

      if (Math.sqrt(vx * vx + vy * vy) > 0.1) {
        creature.angle = Math.atan2(vy, vx);
      }
      creature.velocity.x = vx;
      creature.velocity.y = vy;

      // AI hunt trigger - higher chance when player is near boundary
      let huntChance = 0.001;
      if (this.creatures.length > 0) {
        const player = this.creatures[0];
        const halfWorld = WORLD_SIZE / 2;
        const playerBoundaryDist = Math.min(
          halfWorld - Math.abs(player.x),
          halfWorld - Math.abs(player.y)
        );
        // If player is within 300 units of boundary, gradually increase hunt chance
        // for AI that could reach them (same or higher type)
        if (playerBoundaryDist < 300 && creature.type >= player.type) {
          const proximity = 1 - (playerBoundaryDist / 300); // 0~1, closer = higher
          huntChance += proximity * 0.004; // up to 0.005 total (5x base rate)
        }
      }
      if (creature.canHunt() && Math.random() < huntChance) {
        creature.tryStartHunt();
      }

      const eaten = creature.update(creature.x, creature.y, false, WORLD_SIZE, WORLD_SIZE, this.particleSystem.particles);
      if (eaten && eaten.length > 0) {
        const group = this.aiManager.getGroup(creature.groupId);
        eaten.forEach(idx => {
          if (idx >= 0 && idx < this.particleSystem.particles.length) {
            eatenByAI.add(idx);
            if (group) {
              const p = this.particleSystem.particles[idx];
              if (p) group.energy += (p.energy || 1);
            }
          }
        });
      }

      const victim = creature.detectAndAttackCreatures(allCreatures);
      if (victim && !attacks.some(a => a.creature === victim)) {
        attacks.push({ creature: victim, killedByPlayer: false });
      }
    }

    // AI evolution check
    if (this.frameCount % 10 === 0) {
      for (const [groupId, group] of this.aiManager.groups.entries()) {
        if (group.isEvolving) continue;
        const maxE = stageEnergy(group.level);
        if (group.energy >= maxE) {
          group.energy = 0;
          group.evolutionStage++;
          if (group.evolutionStage >= 5) {
            if (group.level < SPECIES.length - 1) {
              this.evolveAIGroup(groupId);
            }
            group.evolutionStage = 0;
          } else if (group.evolutionStage <= 2) {
            this.addAICreatureToGroup(groupId);
          } else {
            this.upgradeAIGroupComplexity(groupId);
          }
        }
      }
    }

    if (this.creatures.length === 0) {
      this.updateCamera();
      return;
    }

    // Update player creatures
    let playerLostCreature = false;
    for (const creature of this.creatures) {
      if (!creature || creature.isDying) continue;

      if (creature.isFrozen) {
        creature.update(creature.x, creature.y, false, WORLD_SIZE, WORLD_SIZE, this.particleSystem.particles);
        continue;
      }

      const target = updateFlocking(creature, mouseWorld, allCreatures, false);
      let dx = target.x - creature.x;
      let dy = target.y - creature.y;

      if (creature.type === 0) {
        dx += (Math.random() - 0.5) * 30;
        dy += (Math.random() - 0.5) * 30;
      }

      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = (creature.isHunting ? creature.config.huntSpeed : creature.config.speed) * 100;
      let vx, vy;
      if (dist > speed) {
        vx = (dx / dist) * speed;
        vy = (dy / dist) * speed;
      } else {
        vx = dx;
        vy = dy;
      }

      creature.x += vx;
      creature.y += vy;

      // Elastic boundary for player
      const halfWorld = WORLD_SIZE / 2;
      const bounceForce = 0.3;
      let hitBoundary = false;
      if (creature.x > halfWorld) {
        creature.x = halfWorld - (creature.x - halfWorld) * bounceForce;
        vx = -Math.abs(vx) * bounceForce;
        hitBoundary = true;
      }
      if (creature.x < -halfWorld) {
        creature.x = -halfWorld + (-halfWorld - creature.x) * bounceForce;
        vx = Math.abs(vx) * bounceForce;
        hitBoundary = true;
      }
      if (creature.y > halfWorld) {
        creature.y = halfWorld - (creature.y - halfWorld) * bounceForce;
        vy = -Math.abs(vy) * bounceForce;
        hitBoundary = true;
      }
      if (creature.y < -halfWorld) {
        creature.y = -halfWorld + (-halfWorld - creature.y) * bounceForce;
        vy = Math.abs(vy) * bounceForce;
        hitBoundary = true;
      }
      // Clamp to ensure within bounds
      creature.x = Math.max(-halfWorld, Math.min(halfWorld, creature.x));
      creature.y = Math.max(-halfWorld, Math.min(halfWorld, creature.y));
      if (hitBoundary) {
        this.shakeIntensity = Math.max(this.shakeIntensity, 4);
      }

      if (Math.sqrt(vx * vx + vy * vy) > 0.1) {
        creature.angle = Math.atan2(vy, vx);
      }
      creature.velocity.x = vx;
      creature.velocity.y = vy;

      // Player hunt trigger
      if (creature.canHunt() && Math.random() < 0.0015) {
        creature.tryStartHunt();
      }

      const eaten = creature.update(creature.x, creature.y, false, WORLD_SIZE, WORLD_SIZE, this.particleSystem.particles);
      if (eaten && eaten.length > 0) {
        eaten.forEach(idx => {
          if (idx >= 0 && idx < this.particleSystem.particles.length && !eatenByAI.has(idx)) {
            eatenByPlayer.add(idx);
          }
        });
      }

      const victim = creature.detectAndAttackCreatures(allCreatures);
      if (victim && !attacks.some(a => a.creature === victim)) {
        attacks.push({ creature: victim, killedByPlayer: true });
      }
    }

    // Process attacks
    if (attacks.length > 0) {
      for (const attack of attacks) {
        const victim = attack.creature;
        const deathParticles = victim.startDeath();
        this.particleSystem.addParticles(deathParticles);

        if (victim.isAI) {
          const idx = this.aiCreatures.indexOf(victim);
          if (idx > -1) {
            this.aiCreatures.splice(idx, 1);
            if (attack.killedByPlayer) {
              this.score.kills++;
              const t = victim.type;
              if (!this.score.killsByLevel[t]) this.score.killsByLevel[t] = 0;
              this.score.killsByLevel[t]++;
              audio.playKill();
            }
            // Schedule respawn
            this.aiManager.scheduleRespawn(victim.type);
          }
        } else {
          const idx = this.creatures.indexOf(victim);
          if (idx > -1) {
            this.creatures.splice(idx, 1);
            playerLostCreature = true;
          }
        }
      }
    }

    // Player creature loss handling
    if (playerLostCreature) {
      if (this.creatures.length === 0) {
        this.triggerGameOver();
        return;
      } else if (this.evolutionStage > 0) {
        this.evolutionStage--;
        this.ui.update(this.playerLevel, this.evolutionStage, this.stageEnergy, this.stageMaxEnergy, this.creatures.length, this.aiCreatures.length);
      }
    }

    // Remove eaten particles
    const allEaten = new Set([...eatenByPlayer, ...eatenByAI]);
    if (allEaten.size > 0) {
      this.particleSystem.removeIndices(allEaten);
    }

    // Update particles (cull/respawn) after detection and removal to keep indices stable
    this.particleSystem.update(this.camera, this.width, this.height);

    // Add energy from player-eaten particles
    let energyGained = 0;
    for (const idx of eatenByPlayer) {
      energyGained += 1;
    }
    if (energyGained > 0 && this.stageEnergy < this.stageMaxEnergy) {
      this.stageEnergy += energyGained;
      if (this.stageEnergy > this.stageMaxEnergy) this.stageEnergy = this.stageMaxEnergy;
      this.ui.update(this.playerLevel, this.evolutionStage, this.stageEnergy, this.stageMaxEnergy, this.creatures.length, this.aiCreatures.length);
      // Play eat sound (throttled to avoid spam)
      if (this.frameCount % 3 === 0) audio.playEat();
    }

    // Check evolution
    if (this.stageEnergy >= this.stageMaxEnergy && this.creatures.length > 0) {
      this.advanceStage();
    }

    this.updateCamera();
  }

  advanceStage() {
    this.stageEnergy = 0;
    this.evolutionStage++;

    if (this.evolutionStage >= 5) {
      // Evolve to next species
      this.evolutionStage = 0;
      if (this.playerLevel < SPECIES.length - 1) {
        this.playerLevel++;
        this.score.maxLevel = Math.max(this.score.maxLevel, this.playerLevel);
        this.camera.setZoomForLevel(this.playerLevel);
        audio.playLevelUp();

        // Reset to single creature of new type
        const leader = this.creatures[0];
        const pos = leader ? { x: leader.x, y: leader.y } : { x: 0, y: 0 };
        this.creatures = [];
        const CreatureClass = CREATURE_CLASSES[this.playerLevel];
        const config = SPECIES[this.playerLevel];
        const creature = new CreatureClass(pos.x, pos.y, this.playerLevel, config, false);
        creature.groupId = this.playerGroupId;
        this.creatures.push(creature);
      } else {
        // Victory - reached max level stage 5
        this.triggerVictory();
        return;
      }
    } else if (this.evolutionStage <= 2) {
      audio.playEvolve();
      // Stages 1-2: spawn new creature in group
      const leader = this.creatures[0];
      if (leader) {
        const offset = 50 + Math.random() * 50;
        const angle = Math.random() * Math.PI * 2;
        this.createPlayerAt(leader.x + Math.cos(angle) * offset, leader.y + Math.sin(angle) * offset);
      }
    } else {
      audio.playEvolve();
      // Stages 3-4: upgrade complexity
      const newComplexity = this.evolutionStage - 2;
      for (const creature of this.creatures) {
        if (creature.upgradeComplexity) {
          creature.upgradeComplexity(newComplexity);
        }
      }
    }

    this.stageMaxEnergy = stageEnergy(this.playerLevel);
    this.ui.update(this.playerLevel, this.evolutionStage, this.stageEnergy, this.stageMaxEnergy, this.creatures.length, this.aiCreatures.length);
  }

  createPlayerAt(x, y) {
    const CreatureClass = CREATURE_CLASSES[this.playerLevel];
    const config = SPECIES[this.playerLevel];
    const creature = new CreatureClass(x, y, this.playerLevel, config, false);
    creature.groupId = this.playerGroupId;
    if (this.evolutionStage >= 3 && creature.upgradeComplexity) {
      creature.upgradeComplexity(this.evolutionStage - 2);
    }
    this.creatures.push(creature);
  }

  evolveAIGroup(groupId) {
    const group = this.aiManager.getGroup(groupId);
    if (!group) return;

    const oldLevel = group.level;
    group.level++;
    group.evolutionStage = 0;

    // Upgrade all creatures in this group
    const groupCreatures = this.aiCreatures.filter(c => c.groupId === groupId);
    for (const creature of groupCreatures) {
      const idx = this.aiCreatures.indexOf(creature);
      if (idx > -1) {
        this.aiCreatures.splice(idx, 1);
        const CreatureClass = CREATURE_CLASSES[group.level];
        const config = SPECIES[group.level];
        const newCreature = new CreatureClass(creature.x, creature.y, group.level, config, true);
        newCreature.groupId = groupId;
        this.aiCreatures.push(newCreature);
      }
    }
  }

  upgradeAIGroupComplexity(groupId) {
    const group = this.aiManager.getGroup(groupId);
    if (!group) return;
    const complexity = group.evolutionStage - 2;
    const groupCreatures = this.aiCreatures.filter(c => c.groupId === groupId);
    for (const creature of groupCreatures) {
      if (creature.upgradeComplexity) {
        creature.upgradeComplexity(complexity);
      }
    }
  }

  addAICreatureToGroup(groupId) {
    const group = this.aiManager.getGroup(groupId);
    if (!group) return;
    const groupCreatures = this.aiCreatures.filter(c => c.groupId === groupId);
    if (groupCreatures.length > 0) {
      const leader = groupCreatures[0];
      const offset = 80;
      const angle = Math.random() * Math.PI * 2;
      const x = leader.x + Math.cos(angle) * offset;
      const y = leader.y + Math.sin(angle) * offset;
      const CreatureClass = CREATURE_CLASSES[group.level];
      const config = SPECIES[group.level];
      const creature = new CreatureClass(x, y, group.level, config, true);
      creature.groupId = groupId;
      this.aiCreatures.push(creature);
    }
  }

  updateCamera() {
    if (this.creatures.length > 0) {
      let avgX = 0, avgY = 0;
      for (const c of this.creatures) {
        avgX += c.x;
        avgY += c.y;
      }
      avgX /= this.creatures.length;
      avgY /= this.creatures.length;
      this.camera.update(avgX, avgY);
    }
  }

  triggerGameOver() {
    this.gameOver = true;
    this.score.survivalTime = Math.floor((Date.now() - this.score.startTime) / 1000);
    audio.playDeath();
    const overlay = this.ui.showGameOver(this.score);
    const btn = overlay.querySelector('#restartBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        overlay.remove();
        this.resetGame();
      });
    }
  }

  triggerVictory() {
    this.gameOver = true;
    this.score.survivalTime = Math.floor((Date.now() - this.score.startTime) / 1000);
    this.score.maxLevel = SPECIES.length - 1;
    const overlay = this.ui.showVictory(this.score);
    const btn = overlay.querySelector('#victoryRestartBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        overlay.remove();
        this.resetGame();
      });
    }
  }

  resetGame() {
    this.gameOver = false;
    this.init();
  }

  draw() {
    // Pure black base - the void outside world bounds
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (!this.gameStarted) return;

    // Screen shake offset
    let shakeX = 0, shakeY = 0;
    if (this.shakeIntensity > 0.5) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }

    // Draw particles
    this.particleSystem.draw(this.ctx, this.camera, this.width, this.height);

    // Draw creatures in world space
    const screenBounds = this.camera.getScreenBounds(this.width, this.height, 1.5);

    this.ctx.save();
    this.ctx.translate(this.width / 2 + shakeX, this.height / 2 + shakeY);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Draw world boundary walls
    this.drawBoundary();

    // Draw player creatures
    for (const creature of this.creatures) {
      if (this.isInScreen(creature, screenBounds)) {
        creature.draw(this.ctx);
      }
    }

    // Draw AI creatures
    for (const creature of this.aiCreatures) {
      if (this.isInScreen(creature, screenBounds)) {
        creature.draw(this.ctx);
      }
    }

    this.ctx.restore();

    // Draw joystick overlay (screen space)
    this.input.drawJoystick(this.ctx);
  }

  drawBoundary() {
    const half = WORLD_SIZE / 2;
    const ctx = this.ctx;
    // Large offset to cover any visible area outside the boundary
    const outer = half + 5000;

    // --- Draw pure black void outside world bounds ---
    ctx.save();
    ctx.fillStyle = '#000000';
    // Top void
    ctx.fillRect(-outer, -outer, outer * 2, outer - half);
    // Bottom void
    ctx.fillRect(-outer, half, outer * 2, outer - half);
    // Left void
    ctx.fillRect(-outer, -half, outer - half, WORLD_SIZE);
    // Right void
    ctx.fillRect(half, -half, outer - half, WORLD_SIZE);
    ctx.restore();

    // --- Draw world interior background (deep sea color) ---
    ctx.save();
    ctx.fillStyle = '#050a0f';
    ctx.fillRect(-half, -half, WORLD_SIZE, WORLD_SIZE);
    ctx.restore();

    // --- Draw fade-to-black gradient at inner edges (transition zone) ---
    const fadeWidth = 80;
    ctx.save();
    // Left edge fade (inside world, dark gradient toward boundary)
    const gradL = ctx.createLinearGradient(-half, 0, -half + fadeWidth, 0);
    gradL.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradL.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradL;
    ctx.fillRect(-half, -half, fadeWidth, WORLD_SIZE);

    // Right edge fade
    const gradR = ctx.createLinearGradient(half, 0, half - fadeWidth, 0);
    gradR.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradR.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradR;
    ctx.fillRect(half - fadeWidth, -half, fadeWidth, WORLD_SIZE);

    // Top edge fade
    const gradT = ctx.createLinearGradient(0, -half, 0, -half + fadeWidth);
    gradT.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradT.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradT;
    ctx.fillRect(-half, -half, WORLD_SIZE, fadeWidth);

    // Bottom edge fade
    const gradB = ctx.createLinearGradient(0, half, 0, half - fadeWidth);
    gradB.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradB.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradB;
    ctx.fillRect(-half, half - fadeWidth, WORLD_SIZE, fadeWidth);
    ctx.restore();

    // --- Calculate proximity for glow effects ---
    let minDist = half;
    for (const c of this.creatures) {
      const dx = Math.min(half - Math.abs(c.x), half);
      const dy = Math.min(half - Math.abs(c.y), half);
      minDist = Math.min(minDist, dx, dy);
    }
    // Glow intensifies when player is within 300 units of boundary
    const glowRange = 300;
    const proximity = Math.max(0, 1 - minDist / glowRange);
    const baseAlpha = 0.15 + proximity * 0.5;
    const glowSize = 8 + proximity * 20;

    // Animated pulse
    const pulse = 0.8 + 0.2 * Math.sin(this.frameCount * 0.03);
    const alpha = baseAlpha * pulse;

    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.lineWidth = 2 + proximity * 2;
    ctx.shadowColor = `rgba(0, 255, 255, ${alpha * 0.8})`;
    ctx.shadowBlur = glowSize;

    // Draw boundary rectangle
    ctx.strokeRect(-half, -half, WORLD_SIZE, WORLD_SIZE);

    // Draw corner accents
    const cornerSize = 60 + proximity * 40;
    const corners = [
      [-half, -half, 1, 1],
      [half, -half, -1, 1],
      [-half, half, 1, -1],
      [half, half, -1, -1]
    ];
    ctx.lineWidth = 3 + proximity * 2;
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * cornerSize);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * cornerSize, cy);
      ctx.stroke();
    }

    // Inner warning glow when very close
    if (proximity > 0.3) {
      const innerAlpha = (proximity - 0.3) * 0.4;
      const gradient = ctx.createLinearGradient(-half, 0, -half + 50, 0);
      gradient.addColorStop(0, `rgba(255, 50, 50, ${innerAlpha})`);
      gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');

      // Left edge warning
      if (this.creatures.some(c => c.x < -half + glowRange)) {
        ctx.fillStyle = gradient;
        ctx.fillRect(-half, -half, 50, WORLD_SIZE);
      }
      // Right edge warning
      const gradWR = ctx.createLinearGradient(half, 0, half - 50, 0);
      gradWR.addColorStop(0, `rgba(255, 50, 50, ${innerAlpha})`);
      gradWR.addColorStop(1, 'rgba(255, 50, 50, 0)');
      if (this.creatures.some(c => c.x > half - glowRange)) {
        ctx.fillStyle = gradWR;
        ctx.fillRect(half - 50, -half, 50, WORLD_SIZE);
      }
      // Top edge warning
      const gradWT = ctx.createLinearGradient(0, -half, 0, -half + 50);
      gradWT.addColorStop(0, `rgba(255, 50, 50, ${innerAlpha})`);
      gradWT.addColorStop(1, 'rgba(255, 50, 50, 0)');
      if (this.creatures.some(c => c.y < -half + glowRange)) {
        ctx.fillStyle = gradWT;
        ctx.fillRect(-half, -half, WORLD_SIZE, 50);
      }
      // Bottom edge warning
      const gradWB = ctx.createLinearGradient(0, half, 0, half - 50);
      gradWB.addColorStop(0, `rgba(255, 50, 50, ${innerAlpha})`);
      gradWB.addColorStop(1, 'rgba(255, 50, 50, 0)');
      if (this.creatures.some(c => c.y > half - glowRange)) {
        ctx.fillStyle = gradWB;
        ctx.fillRect(-half, half - 50, WORLD_SIZE, 50);
      }
    }

    ctx.restore();
  }

  isInScreen(creature, bounds) {
    const pad = (creature.scale || 1) * 150;
    return creature.x + pad > bounds.left && creature.x - pad < bounds.right &&
           creature.y + pad > bounds.top && creature.y - pad < bounds.bottom;
  }

  animate() {
    if (this.gameStarted && !this.gameOver) {
      this.update();
    }
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}
