export const PARTICLE_COUNT = 4000;
export const BASE_STAGE_ENERGY = 40;
export const WORLD_SIZE = 4000;

export const INITIAL_AI_COUNTS = {
  0: 10,
  1: 7,
  2: 6,
  3: 6,
  4: 3,
  5: 2,
  6: 1,
  7: 1
};

export function stageEnergy(level) {
  return BASE_STAGE_ENERGY * Math.pow(2, level);
}

export const SPECIES = [
  {
    name: 'I. 光子',
    desc: '微尘级 - 神经质的高频移动',
    color: '#fff',
    glow: '#fff',
    speed: 0.035,
    huntSpeed: 0.04,
    huntDuration: 180,
    huntCooldown: 300
  },
  {
    name: 'II. 飞梭',
    desc: '幼体级 - 僵硬的冲刺与滑行',
    color: '#aff',
    glow: '#0ff',
    speed: 0.028,
    huntSpeed: 0.04,
    huntDuration: 180,
    huntCooldown: 300
  },
  {
    name: 'III. 水母',
    desc: '腔肠级 - 径向收缩与喷射',
    color: '#faa',
    glow: '#f00',
    speed: 0.025,
    huntSpeed: 0.032,
    huntDuration: 180,
    huntCooldown: 300
  },
  {
    name: 'IV. 蛇刺',
    desc: '环节级 - 正弦波游动与倒刺',
    color: '#afa',
    glow: '#0f0',
    speed: 0.021,
    huntSpeed: 0.032,
    huntDuration: 240,
    huntCooldown: 360
  },
  {
    name: 'V. 双螯',
    desc: '甲壳级 - 重装甲与机械剪切',
    color: '#fa0',
    glow: '#ff0',
    speed: 0.014,
    huntSpeed: 0.032,
    huntDuration: 240,
    huntCooldown: 420
  },
  {
    name: 'VI. 滑翔者',
    desc: '蝠鲼级 - 优雅的波浪飞行',
    color: '#aaa',
    glow: '#fff',
    speed: 0.013,
    huntSpeed: 0.035,
    huntDuration: 300,
    huntCooldown: 480
  },
  {
    name: 'VII. 九头蛇',
    desc: '聚合级 - 多核心独立索敌',
    color: '#d0f',
    glow: '#a0f',
    speed: 0.011,
    huntSpeed: 0.035,
    huntDuration: 300,
    huntCooldown: 540
  },
  {
    name: 'VIII. 利维坦',
    desc: '巨兽级 - 吞噬一切的引力场',
    color: '#f44',
    glow: '#800',
    speed: 0.011,
    huntSpeed: 0.032,
    huntDuration: 360,
    huntCooldown: 600
  }
];
