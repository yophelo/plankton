import { WORLD_SIZE } from './config.js';

export function updateFlocking(creature, mouseWorldPos, allCreatures, isAI = false) {
  // Wander behavior
  if (creature.wanderAngle === undefined) {
    creature.wanderAngle = Math.random() * Math.PI * 2;
  }
  creature.wanderAngle += (Math.random() - 0.5) * 0.3;

  const wanderDist = 200;
  let targetX = creature.x + Math.cos(creature.wanderAngle) * wanderDist;
  let targetY = creature.y + Math.sin(creature.wanderAngle) * wanderDist;

  if (!isAI) {
    // Player follows mouse/touch input
    targetX = mouseWorldPos.x;
    targetY = mouseWorldPos.y;
  } else {
    // AI flocking behaviors
    let cohesionX = 0, cohesionY = 0, cohesionCount = 0;
    let sepX = 0, sepY = 0;
    let fleeX = 0, fleeY = 0;
    let preyX = 0, preyY = 0, preyFound = false;

    for (const other of allCreatures) {
      if (other === creature) continue;

      const dx = other.x - creature.x;
      const dy = other.y - creature.y;
      const distSq = dx * dx + dy * dy;

      // Cohesion with same type (group together)
      if (other.type === creature.type && other.groupId === creature.groupId && distSq < 300 * 300) {
        cohesionX += other.x;
        cohesionY += other.y;
        cohesionCount++;
      }

      // Separation (avoid too close)
      if (distSq < 80 * 80 && distSq > 0) {
        const dist = Math.sqrt(distSq);
        sepX -= dx / dist;
        sepY -= dy / dist;
      }

      // Predator avoidance (flee from higher type)
      if (other.type > creature.type && distSq < 400 * 400) {
        const dist = Math.sqrt(distSq);
        fleeX -= dx / dist * 2;
        fleeY -= dy / dist * 2;
      }

      // Prey pursuit (chase lower type when hunting)
      if (creature.isHunting && other.type < creature.type && distSq < 500 * 500 && !preyFound) {
        preyX = other.x;
        preyY = other.y;
        preyFound = true;
      }
    }

    // Apply cohesion
    if (cohesionCount > 0) {
      const cx = cohesionX / cohesionCount;
      const cy = cohesionY / cohesionCount;
      targetX += (cx - creature.x) * 0.3;
      targetY += (cy - creature.y) * 0.3;
    }

    // Apply separation
    targetX += sepX * 30;
    targetY += sepY * 30;

    // Apply flee
    targetX += fleeX * 100;
    targetY += fleeY * 100;

    // Apply prey pursuit
    if (preyFound) {
      targetX = preyX;
      targetY = preyY;
    }

    // Boundary avoidance
    const boundary = WORLD_SIZE / 2 - 200;
    if (creature.x > boundary) targetX -= 100;
    if (creature.x < -boundary) targetX += 100;
    if (creature.y > boundary) targetY -= 100;
    if (creature.y < -boundary) targetY += 100;
  }

  return { x: targetX, y: targetY };
}

export class AIManager {
  constructor() {
    this.groups = new Map();
    this.respawnTimers = new Map();
  }

  createGroup(groupId, level) {
    this.groups.set(groupId, {
      level: level,
      energy: 0,
      evolutionStage: 0,
      isEvolving: false
    });
  }

  getGroup(groupId) {
    return this.groups.get(groupId);
  }

  addEnergy(groupId, amount) {
    const group = this.groups.get(groupId);
    if (group) {
      group.energy += amount;
    }
  }

  scheduleRespawn(type, delay = 600) {
    const key = `${type}_${Date.now()}_${Math.random()}`;
    this.respawnTimers.set(key, { type, timer: delay });
  }

  updateRespawns() {
    const ready = [];
    for (const [key, data] of this.respawnTimers.entries()) {
      data.timer--;
      if (data.timer <= 0) {
        ready.push(data.type);
        this.respawnTimers.delete(key);
      }
    }
    return ready;
  }
}
