export const PARTICLE_COUNT = 4000;
export const BASE_STAGE_ENERGY = 25;
export const WORLD_SIZE = 10000;

export const INITIAL_AI_COUNTS = {
  0: 10,
  1: 7,
  2: 6,
  3: 4,
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
    name: 'I. Photon',
    desc: 'Micro - High frequency movement',
    color: '#fff',
    glow: '#fff',
    speed: 0.05,
    huntSpeed: 0.055,
    huntDuration: 180,
    huntCooldown: 300
  },
  {
    name: 'II. Dart',
    desc: 'Larval - Rigid thrust and glide',
    color: '#aff',
    glow: '#0ff',
    speed: 0.04,
    huntSpeed: 0.055,
    huntDuration: 180,
    huntCooldown: 300
  },
  {
    name: 'III. Pulse',
    desc: 'Cnidarian - Radial contraction jets',
    color: '#faa',
    glow: '#f00',
    speed: 0.035,
    huntSpeed: 0.045,
    huntDuration: 180,
    huntCooldown: 300
  },
  {
    name: 'IV. Serpent',
    desc: 'Segmented - Sine wave with barbs',
    color: '#afa',
    glow: '#0f0',
    speed: 0.03,
    huntSpeed: 0.045,
    huntDuration: 240,
    huntCooldown: 360
  },
  {
    name: 'V. Pincer',
    desc: 'Crustacean - Heavy armor shear',
    color: '#fa0',
    glow: '#ff0',
    speed: 0.02,
    huntSpeed: 0.045,
    huntDuration: 240,
    huntCooldown: 420
  },
  {
    name: 'VI. Glider',
    desc: 'Manta - Elegant wave flight',
    color: '#aaa',
    glow: '#fff',
    speed: 0.018,
    huntSpeed: 0.05,
    huntDuration: 300,
    huntCooldown: 480
  },
  {
    name: 'VII. Hydra',
    desc: 'Aggregate - Multi-core seeking',
    color: '#d0f',
    glow: '#a0f',
    speed: 0.015,
    huntSpeed: 0.05,
    huntDuration: 300,
    huntCooldown: 540
  },
  {
    name: 'VIII. Leviathan',
    desc: 'Titan - All-consuming gravity',
    color: '#f44',
    glow: '#800',
    speed: 0.015,
    huntSpeed: 0.045,
    huntDuration: 360,
    huntCooldown: 600
  }
];
