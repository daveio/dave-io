/**
 * USCSS NOSTROMO — LEXICAL DATABASE
 * MU/TH/UR 6000 APPROVED WORD LIST
 *
 * Science fiction words for passphrase generation.
 * All lowercase, no duplicates. Organized by franchise and category.
 *
 * Sources: Alien, Farscape, Stargate, Star Trek, Dollhouse, Babylon 5,
 *          plus general sci-fi vocabulary.
 */

// ── ALIEN / ALIENS ──────────────────────────────────────────────────────

const alienFranchise = [
  'nostromo', 'xenomorph', 'facehugger', 'chestburster', 'ovomorph',
  'sulaco', 'narcissus', 'ripley', 'android', 'synthetic',
  'hypersleep', 'stasis', 'derelict', 'beacon', 'airlock',
  'flamethrower', 'cocoon', 'hive', 'queen', 'colonial',
  'marines', 'dropship', 'powerloader', 'weyland', 'yutani',
  'quarantine', 'containment', 'specimen', 'infestation', 'lurker',
  'ventshaft', 'corridor', 'bulkhead', 'reactor', 'shuttle',
  'distress', 'acheron', 'hadley', 'bishop', 'jonesy',
]

// ── FARSCAPE ────────────────────────────────────────────────────────────

const farscape = [
  'moya', 'talyn', 'leviathan', 'starburst', 'prowler',
  'peacekeeper', 'scarran', 'nebari', 'luxan', 'delvian',
  'hynerian', 'diagnosan', 'bannik', 'zenetan', 'charrids',
  'wormhole', 'marauder', 'pantak', 'frag', 'dentic',
  'amnexus', 'treblin', 'amnesia', 'unrealized', 'ancients',
  'kkore', 'tormented', 'aurora', 'grayza', 'brindz',
  'eidelons', 'crystherium', 'prowess', 'paddac', 'zhaan',
]

// ── STARGATE ────────────────────────────────────────────────────────────

const stargate = [
  'stargate', 'chevron', 'chappa', 'kawoosh', 'naquadah',
  'asgard', 'goauld', 'tokra', 'jaffa', 'wraith',
  'replicator', 'ancient', 'ascended', 'atlantis', 'daedalus',
  'prometheus', 'destiny', 'ori', 'prior', 'harcesis',
  'sarcophagus', 'zatarc', 'kull', 'anubis', 'apophis',
  'tealc', 'abydos', 'chulak', 'dakara', 'tollana',
  'naquadria', 'trinium', 'tretonin', 'kino', 'icarus',
]

// ── STAR TREK ───────────────────────────────────────────────────────────

const startrek = [
  'enterprise', 'phaser', 'tricorder', 'transporter', 'dilithium',
  'photon', 'torpedo', 'deflector', 'nacelle', 'warpcore',
  'holodeck', 'turbolift', 'jefferies', 'antimatter', 'tachyon',
  'subspace', 'borg', 'collective', 'assimilate', 'tribble',
  'romulan', 'klingon', 'vulcan', 'cardassian', 'bajoran',
  'dominion', 'changeling', 'trill', 'andorian', 'ferengi',
  'duranium', 'isolinear', 'positronic', 'tetryon', 'chroniton',
]

// ── DOLLHOUSE ───────────────────────────────────────────────────────────

const dollhouse = [
  'dollhouse', 'imprint', 'actives', 'handler', 'attic',
  'rossum', 'wedge', 'composite', 'tabula', 'rasa',
  'engram', 'wipe', 'glitch', 'echo', 'whiskey',
  'november', 'sierra', 'tango', 'foxtrot', 'alpha',
  'epitaph', 'butcher', 'disruptor', 'mindwipe', 'persona',
]

// ── BABYLON 5 ───────────────────────────────────────────────────────────

const babylon5 = [
  'vorlon', 'minbari', 'narn', 'centauri', 'drakh',
  'shadow', 'ranger', 'triluminary', 'starfire', 'whitestar',
  'jumpgate', 'hyperion', 'earthforce', 'nightwatch', 'psi',
  'telepath', 'sleeper', 'technomagus', 'firstones', 'lorien',
  'islandia', 'zathras', 'chrysalis', 'endgame', 'deconstruction',
]

// ── GENERAL SCI-FI ──────────────────────────────────────────────────────

const spaceAndShips = [
  'nebula', 'pulsar', 'quasar', 'frigate', 'dreadnought',
  'orbital', 'docking', 'thruster', 'payload', 'cargo',
  'manifest', 'hangar', 'cockpit', 'helm', 'vessel',
  'flotilla', 'armada', 'convoy', 'asteroid', 'comet',
]

const techAndCyber = [
  'cybernetic', 'neural', 'uplink', 'datastream', 'mainframe',
  'terminal', 'cipher', 'protocol', 'override', 'reboot',
  'firmware', 'kernel', 'daemon', 'proxy', 'firewall',
  'decrypt', 'encrypt', 'handshake', 'subroutine', 'algorithm',
  'cortex', 'implant', 'augment', 'interface', 'hologram',
  'transistor', 'binary', 'quantum', 'lattice', 'resonance',
]

const worldsAndPlaces = [
  'colony', 'outpost', 'bunker', 'wasteland', 'frontier',
  'habitat', 'sector', 'quadrant', 'perimeter', 'barricade',
  'garrison', 'citadel', 'archive', 'vault', 'foundry',
  'refinery', 'forge', 'smelter', 'generator', 'turbine',
  'conduit', 'pipeline', 'silo', 'depot', 'terraform',
]

const biologyAndHorror = [
  'mutation', 'parasite', 'symbiote', 'pathogen', 'contagion',
  'organism', 'embryo', 'larva', 'metamorphosis', 'predator',
  'apex', 'carapace', 'mandible', 'thorax', 'proboscis',
  'tendril', 'membrane', 'spore', 'toxin', 'venom',
  'enzyme', 'genome', 'helix', 'strand', 'prion',
]

const actionsStates = [
  'breach', 'lockdown', 'jettison', 'purge', 'activate',
  'initiate', 'calibrate', 'stabilize', 'disengage', 'detach',
  'eject', 'deploy', 'extract', 'salvage', 'scavenge',
  'recon', 'survey', 'transmit', 'broadcast', 'intercept',
  'scramble', 'isolate', 'sterilize', 'terminate', 'engage',
]

const modifiers = [
  'rogue', 'phantom', 'crimson', 'obsidian', 'titanium',
  'chromium', 'cobalt', 'plasma', 'ionic', 'thermal',
  'cryogenic', 'volatile', 'dormant', 'sentient', 'autonomous',
  'hostile', 'corroded', 'hazardous', 'classified', 'restricted',
  'critical', 'omega', 'temporal', 'spatial', 'inverted',
]

export const SCIFI_WORDS: string[] = [
  ...alienFranchise,
  ...farscape,
  ...stargate,
  ...startrek,
  ...dollhouse,
  ...babylon5,
  ...spaceAndShips,
  ...techAndCyber,
  ...worldsAndPlaces,
  ...biologyAndHorror,
  ...actionsStates,
  ...modifiers,
]

// Verify no duplicates at module load (development safety net)
if (import.meta.dev) {
  const unique = new Set(SCIFI_WORDS)
  if (unique.size !== SCIFI_WORDS.length) {
    const dupes = SCIFI_WORDS.filter((w, i) => SCIFI_WORDS.indexOf(w) !== i)
    console.warn(`[WORD CORPUS] Duplicate words detected: ${dupes.join(', ')}`)
  }
}
