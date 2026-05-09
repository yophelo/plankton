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
      this.energyText.textContent = `Stage ${evolutionStage + 1}/5 - ${Math.floor(stageEnergy)} / ${stageMaxEnergy}`;
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
      <div style="text-align:center;max-width:90vw;overflow-y:auto;max-height:90vh;padding:20px;">
        <div style="font-size:64px;font-weight:bold;color:#fff;text-shadow:0 0 20px rgba(255,50,50,0.8);letter-spacing:6px;margin-bottom:8px;">EXTINCT</div>
        <div style="font-size:16px;color:rgba(255,255,255,0.5);margin-bottom:20px;">All your creatures have been eliminated</div>
        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin:15px auto;max-width:400px;">
          <div style="font-size:36px;font-weight:bold;color:#fff;margin-bottom:15px;">Score: ${total.toLocaleString()}</div>
          <div style="margin:12px 0;padding:10px 0;border-top:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.7);font-size:15px;"><span style="color:#4af;">Max Level:</span> ${SPECIES[maxLevel].name}</div>
            <div style="color:rgba(255,255,255,0.5);font-size:12px;">Level: ${levelScore.toLocaleString()}</div>
          </div>
          <div style="margin:12px 0;padding:10px 0;border-top:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.7);font-size:15px;"><span style="color:#4f4;">Survival:</span> ${survivalTime}s</div>
            <div style="color:rgba(255,255,255,0.5);font-size:12px;">Survival: ${survivalScore.toLocaleString()}</div>
          </div>
          <div style="margin:12px 0;padding:10px 0;border-top:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.7);font-size:15px;"><span style="color:#f44;">Kills:</span> ${kills}</div>
            <div style="color:rgba(255,255,255,0.5);font-size:12px;">Kill: ${killScore.toLocaleString()}</div>
            ${killDetails}
          </div>
        </div>
        <button id="restartBtn" style="background:linear-gradient(135deg,rgba(255,50,50,0.2),rgba(200,50,50,0.2));border:2px solid rgba(255,50,50,0.6);color:#f55;font-size:20px;padding:14px 50px;border-radius:50px;cursor:pointer;font-family:'Courier New',monospace;letter-spacing:3px;margin-top:15px;">RESTART</button>
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
      <div style="text-align:center;max-width:90vw;overflow-y:auto;max-height:90vh;padding:20px;">
        <div style="font-size:64px;font-weight:bold;color:#fff;text-shadow:0 0 20px rgba(0,255,255,0.8);letter-spacing:6px;margin-bottom:8px;">VICTORY</div>
        <div style="font-size:16px;color:rgba(0,255,255,0.8);margin-bottom:5px;">You have reached the ultimate form</div>
        <div style="font-size:20px;color:rgba(255,100,100,0.9);margin-bottom:20px;">Leviathan - Stage 5</div>
        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(0,255,255,0.2);border-radius:12px;padding:20px;margin:15px auto;max-width:400px;">
          <div style="font-size:36px;font-weight:bold;color:#0ff;margin-bottom:15px;">Score: ${total.toLocaleString()}</div>
          <div style="margin:12px 0;padding:10px 0;border-top:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.7);font-size:15px;"><span style="color:#4af;">Max Level:</span> ${SPECIES[maxLevel].name}</div>
            <div style="color:rgba(255,255,255,0.5);font-size:12px;">Level: ${levelScore.toLocaleString()}</div>
          </div>
          <div style="margin:12px 0;padding:10px 0;border-top:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.7);font-size:15px;"><span style="color:#4f4;">Survival:</span> ${survivalTime}s</div>
            <div style="color:rgba(255,255,255,0.5);font-size:12px;">Survival: ${survivalScore.toLocaleString()}</div>
          </div>
          <div style="margin:12px 0;padding:10px 0;border-top:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.7);font-size:15px;"><span style="color:#f44;">Kills:</span> ${kills}</div>
            <div style="color:rgba(255,255,255,0.5);font-size:12px;">Kill: ${killScore.toLocaleString()}</div>
            ${killDetails}
          </div>
          <div style="margin:12px 0;padding:10px 0;border-top:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(0,255,255,0.9);font-size:15px;"><span style="color:#ff0;">Victory Bonus:</span> ${victoryBonus.toLocaleString()}</div>
          </div>
        </div>
        <button id="victoryRestartBtn" style="background:linear-gradient(135deg,rgba(0,255,255,0.2),rgba(0,170,255,0.2));border:2px solid rgba(0,255,255,0.6);color:#0ff;font-size:20px;padding:14px 50px;border-radius:50px;cursor:pointer;font-family:'Courier New',monospace;letter-spacing:3px;margin-top:15px;">EVOLVE AGAIN</button>
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
