import { SPECIES } from './config.js';

export class UI {
  constructor() {
    this.nameEl = document.getElementById('name');
    this.descEl = document.getElementById('desc');
    this.energyBar = document.getElementById('energyBar');
    this.energyText = document.getElementById('energyText');
    this.creatureCount = document.getElementById('creatureCount');
    this.aiCreatureCount = document.getElementById('aiCreatureCount');
  }

  update(playerLevel, evolutionStage, stageEnergy, stageMaxEnergy, playerCount, aiCount) {
    const species = SPECIES[playerLevel];
    if (this.nameEl) this.nameEl.textContent = species.name;
    if (this.descEl) this.descEl.textContent = species.desc;

    const percent = Math.min(100, (stageEnergy / stageMaxEnergy) * 100);
    if (this.energyBar) this.energyBar.style.width = percent + '%';
    if (this.energyText) {
      this.energyText.textContent = `阶段 ${evolutionStage + 1}/5 - ${Math.floor(stageEnergy)} / ${stageMaxEnergy}`;
    }
    if (this.creatureCount) this.creatureCount.textContent = playerCount;
    if (this.aiCreatureCount) this.aiCreatureCount.textContent = aiCount;
  }

  showGameOver(score) {
    const survivalTime = score.survivalTime;
    const kills = score.kills;
    const maxLevel = score.maxLevel;
    const levelScore = maxLevel * 1000;
    const survivalScore = survivalTime * 10;
    const killScore = kills * 100;
    const total = levelScore + survivalScore + killScore;

    let killDetails = '';
    for (let i = 0; i < SPECIES.length; i++) {
      const count = score.killsByLevel[i] || 0;
      if (count > 0) {
        killDetails += `<div style="color:rgba(255,255,255,0.5);font-size:13px;margin:3px 0;">${SPECIES[i].name}: ${count}</div>`;
      }
    }

    const overlay = document.createElement('div');
    overlay.id = 'gameOverScreen';
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,rgba(20,10,10,0.95) 0%,rgba(5,10,15,0.98) 100%);display:flex;align-items:center;justify-content:center;z-index:1000;`;

    overlay.innerHTML = `
      <div style="text-align:center;max-width:95vw;max-height:95vh;padding:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="font-size:42px;font-weight:bold;color:#fff;text-shadow:0 0 20px rgba(255,50,50,0.8);letter-spacing:4px;margin-bottom:5px;">灭绝</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:10px;">你的所有生物已被消灭</div>
        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px 20px;margin:8px auto;display:flex;flex-wrap:wrap;gap:15px;align-items:center;justify-content:center;">
          <div style="text-align:center;">
            <div style="font-size:28px;font-weight:bold;color:#fff;">得分: ${total.toLocaleString()}</div>
          </div>
          <div style="text-align:center;padding:0 15px;border-left:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.6);font-size:12px;">最高等级</div>
            <div style="color:#4af;font-size:14px;font-weight:bold;">${SPECIES[maxLevel].name}</div>
          </div>
          <div style="text-align:center;padding:0 15px;border-left:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.6);font-size:12px;">存活时间</div>
            <div style="color:#4f4;font-size:14px;font-weight:bold;">${survivalTime}秒</div>
          </div>
          <div style="text-align:center;padding:0 15px;border-left:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.6);font-size:12px;">击杀数</div>
            <div style="color:#f44;font-size:14px;font-weight:bold;">${kills}</div>
          </div>
        </div>
        <button id="restartBtn" style="background:linear-gradient(135deg,rgba(255,50,50,0.2),rgba(200,50,50,0.2));border:2px solid rgba(255,50,50,0.6);color:#f55;font-size:18px;padding:12px 40px;border-radius:50px;cursor:pointer;font-family:'Courier New',monospace;letter-spacing:3px;margin-top:12px;touch-action:manipulation;">重新开始</button>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  showVictory(score) {
    const survivalTime = score.survivalTime;
    const kills = score.kills;
    const maxLevel = score.maxLevel;
    const levelScore = maxLevel * 1000;
    const survivalScore = survivalTime * 10;
    const killScore = kills * 100;
    const victoryBonus = 10000;
    const total = levelScore + survivalScore + killScore + victoryBonus;

    let killDetails = '';
    for (let i = 0; i < SPECIES.length; i++) {
      const count = score.killsByLevel[i] || 0;
      if (count > 0) {
        killDetails += `<div style="color:rgba(255,255,255,0.5);font-size:13px;margin:3px 0;">${SPECIES[i].name}: ${count}</div>`;
      }
    }

    const overlay = document.createElement('div');
    overlay.id = 'gameWinScreen';
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,rgba(10,20,30,0.95) 0%,rgba(5,10,15,0.98) 100%);display:flex;align-items:center;justify-content:center;z-index:1000;`;

    overlay.innerHTML = `
      <div style="text-align:center;max-width:95vw;max-height:95vh;padding:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="font-size:42px;font-weight:bold;color:#fff;text-shadow:0 0 20px rgba(0,255,255,0.8);letter-spacing:4px;margin-bottom:5px;">胜利</div>
        <div style="font-size:13px;color:rgba(0,255,255,0.8);margin-bottom:10px;">你已达到终极形态 - 利维坦</div>
        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(0,255,255,0.2);border-radius:10px;padding:12px 20px;margin:8px auto;display:flex;flex-wrap:wrap;gap:15px;align-items:center;justify-content:center;">
          <div style="text-align:center;">
            <div style="font-size:28px;font-weight:bold;color:#0ff;">得分: ${total.toLocaleString()}</div>
          </div>
          <div style="text-align:center;padding:0 15px;border-left:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.6);font-size:12px;">存活时间</div>
            <div style="color:#4f4;font-size:14px;font-weight:bold;">${survivalTime}秒</div>
          </div>
          <div style="text-align:center;padding:0 15px;border-left:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.6);font-size:12px;">击杀数</div>
            <div style="color:#f44;font-size:14px;font-weight:bold;">${kills}</div>
          </div>
          <div style="text-align:center;padding:0 15px;border-left:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.6);font-size:12px;">胜利奖励</div>
            <div style="color:#ff0;font-size:14px;font-weight:bold;">${victoryBonus.toLocaleString()}</div>
          </div>
        </div>
        <button id="victoryRestartBtn" style="background:linear-gradient(135deg,rgba(0,255,255,0.2),rgba(0,170,255,0.2));border:2px solid rgba(0,255,255,0.6);color:#0ff;font-size:18px;padding:12px 40px;border-radius:50px;cursor:pointer;font-family:'Courier New',monospace;letter-spacing:3px;margin-top:12px;touch-action:manipulation;">再次进化</button>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  removeOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
}
