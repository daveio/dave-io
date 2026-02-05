/**
 * USCSS NOSTROMO — LEXICAL DATABASE
 * MU/TH/UR 6000 APPROVED WORD LIST
 *
 * ~200 science fiction words for passphrase generation.
 * All lowercase, no duplicates. Organized by category for maintainability.
 */

const alienNostromo = [
  'nostromo', 'xenomorph', 'facehugger', 'chestburster', 'ovomorph',
  'sulaco', 'narcissus', 'ripley', 'android', 'synthetic',
  'hypersleep', 'stasis', 'derelict', 'beacon', 'airlock',
  'flamethrower', 'cocoon', 'hive', 'queen', 'colonial',
  'marines', 'dropship', 'powerloader', 'weyland', 'yutani',
  'quarantine', 'containment', 'specimen', 'infestation', 'lurker',
  'ventshaft', 'corridor', 'bulkhead', 'reactor', 'shuttle',
  'distress', 'acheron', 'hadley', 'bishop', 'jonesy',
]

const spaceShips = [
  'nebula', 'pulsar', 'quasar', 'starship', 'frigate',
  'cruiser', 'dreadnought', 'orbital', 'station', 'docking',
  'thruster', 'warp', 'hyperspace', 'lightspeed', 'payload',
  'cargo', 'manifest', 'hangar', 'bridge', 'cockpit',
  'helm', 'portside', 'stern', 'vessel', 'flotilla',
  'armada', 'convoy', 'asteroid', 'comet', 'eclipse',
]

const cyberpunkTech = [
  'cybernetic', 'neural', 'uplink', 'datastream', 'mainframe',
  'terminal', 'cipher', 'protocol', 'override', 'reboot',
  'firmware', 'kernel', 'daemon', 'proxy', 'firewall',
  'decrypt', 'encrypt', 'handshake', 'subroutine', 'algorithm',
  'matrix', 'cortex', 'implant', 'augment', 'interface',
  'hologram', 'avatar', 'transistor', 'binary', 'quantum',
]

const dystopiaWorld = [
  'colony', 'outpost', 'bunker', 'wasteland', 'frontier',
  'habitat', 'sector', 'quadrant', 'perimeter', 'barricade',
  'garrison', 'citadel', 'archive', 'vault', 'foundry',
  'refinery', 'forge', 'smelter', 'generator', 'turbine',
  'conduit', 'pipeline', 'silo', 'depot', 'terraform',
]

const biologyHorror = [
  'mutation', 'parasite', 'symbiote', 'pathogen', 'contagion',
  'organism', 'embryo', 'larva', 'chrysalis', 'metamorphosis',
  'predator', 'apex', 'carapace', 'mandible', 'thorax',
  'proboscis', 'tendril', 'membrane', 'spore', 'toxin',
  'venom', 'enzyme', 'genome', 'helix', 'strand',
]

const actionsStates = [
  'breach', 'lockdown', 'jettison', 'purge', 'activate',
  'initiate', 'calibrate', 'stabilize', 'disengage', 'detach',
  'eject', 'deploy', 'extract', 'salvage', 'scavenge',
  'recon', 'survey', 'transmit', 'broadcast', 'intercept',
  'scramble', 'isolate', 'sterilize', 'terminate', 'engage',
]

const adjectives = [
  'rogue', 'phantom', 'shadow', 'crimson', 'obsidian',
  'titanium', 'chromium', 'cobalt', 'plasma', 'ionic',
  'thermal', 'cryogenic', 'volatile', 'dormant', 'sentient',
  'autonomous', 'hostile', 'corroded', 'hazardous', 'classified',
  'restricted', 'critical', 'primary', 'omega', 'alpha',
]

export const SCIFI_WORDS: string[] = [
  ...alienNostromo,
  ...spaceShips,
  ...cyberpunkTech,
  ...dystopiaWorld,
  ...biologyHorror,
  ...actionsStates,
  ...adjectives,
]

// Verify no duplicates at module load (development safety net)
if (import.meta.dev) {
  const unique = new Set(SCIFI_WORDS)
  if (unique.size !== SCIFI_WORDS.length) {
    const dupes = SCIFI_WORDS.filter((w, i) => SCIFI_WORDS.indexOf(w) !== i)
    console.warn(`[WORD CORPUS] Duplicate words detected: ${dupes.join(', ')}`)
  }
}
