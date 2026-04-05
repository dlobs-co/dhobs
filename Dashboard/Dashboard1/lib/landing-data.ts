export interface HoverCard {
  tagline: string
  flow: [string, string, string]
}

export const HOVER_CARDS: Record<string, HoverCard> = {
  'Jellyfin': {
    tagline: 'Private media server — your movies, shows & music',
    flow: ['Install', 'Add media library', 'Stream on any device'],
  },
  'Nextcloud': {
    tagline: 'Self-hosted cloud storage & collaboration',
    flow: ['Install', 'Upload files', 'Access from anywhere'],
  },
  'Theia IDE': {
    tagline: 'Full VS Code experience in your browser',
    flow: ['Install', 'Open workspace', 'Code in-browser'],
  },
  'Matrix': {
    tagline: 'Encrypted self-hosted messaging',
    flow: ['Install', 'Create room', 'Invite contacts'],
  },
  'Vaultwarden': {
    tagline: 'Self-hosted password vault compatible with Bitwarden',
    flow: ['Install', 'Import passwords', 'Auto-fill anywhere'],
  },
  'Kiwix': {
    tagline: 'Offline Wikipedia, books & references',
    flow: ['Install', 'Download ZIM packs', 'Browse offline'],
  },
  'Ollama': {
    tagline: 'Run large language models locally',
    flow: ['Install', 'Pull a model', 'Chat privately'],
  },
  'Open WebUI': {
    tagline: 'ChatGPT-style interface for your local Ollama',
    flow: ['Install', 'Connect to Ollama', 'Chat in-browser'],
  },
  'VPN Manager': {
    tagline: 'WireGuard VPN control panel',
    flow: ['Install', 'Generate keys', 'Connect remotely'],
  },
}

export interface ContainerStat {
  name: string
  status: string
  cpu: string
  mem: string
}

export interface StorageStat {
  name: string
  size: string
  bytes: number
}

export interface StatsData {
  cpu: string
  memPerc: string
  memBytes: string
  netDown: string
  netUp: string
  storage: StorageStat[]
  topContainers: ContainerStat[]
  containers: ContainerStat[]
}

export const MOCK_STATS: StatsData = {
  cpu: '12.4',
  memPerc: '38.2',
  memBytes: '6.1',
  netDown: '2.3',
  netUp: '0.8',
  storage: [
    { name: 'jellyfin-data', size: '4200', bytes: 4200000000 },
    { name: 'nextcloud-data', size: '1800', bytes: 1800000000 },
    { name: 'matrix-data', size: '320', bytes: 320000000 },
    { name: 'vaultwarden-data', size: '48', bytes: 48000000 },
    { name: 'ollama-models', size: '7600', bytes: 7600000000 },
  ],
  topContainers: [
    { name: 'jellyfin', status: 'running', cpu: '3.2%', mem: '512 MiB / 16 GiB' },
    { name: 'nextcloud', status: 'running', cpu: '1.8%', mem: '384 MiB / 16 GiB' },
    { name: 'ollama', status: 'running', cpu: '5.1%', mem: '2.1 GiB / 16 GiB' },
  ],
  containers: [
    { name: 'jellyfin', status: 'running', cpu: '3.2%', mem: '512 MiB / 16 GiB' },
    { name: 'nextcloud', status: 'running', cpu: '1.8%', mem: '384 MiB / 16 GiB' },
    { name: 'matrix', status: 'running', cpu: '0.4%', mem: '128 MiB / 16 GiB' },
    { name: 'vaultwarden', status: 'running', cpu: '0.1%', mem: '32 MiB / 16 GiB' },
    { name: 'ollama', status: 'running', cpu: '5.1%', mem: '2.1 GiB / 16 GiB' },
    { name: 'kiwix', status: 'running', cpu: '0.2%', mem: '64 MiB / 16 GiB' },
  ],
}
