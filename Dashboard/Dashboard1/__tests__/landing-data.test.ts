import { describe, it, expect } from 'vitest'
import { HOVER_CARDS, MOCK_STATS } from '@/lib/landing-data'

const REQUIRED_SERVICE_NAMES = [
  'Jellyfin',
  'Nextcloud',
  'Theia IDE',
  'Matrix',
  'Vaultwarden',
  'Kiwix',
  'Ollama',
  'Open WebUI',
  'VPN Manager',
]

describe('HOVER_CARDS', () => {
  it('has an entry for every service tile', () => {
    for (const name of REQUIRED_SERVICE_NAMES) {
      expect(HOVER_CARDS[name], `missing hover card for "${name}"`).toBeDefined()
    }
  })

  it('every card has tagline and flow fields', () => {
    for (const [name, card] of Object.entries(HOVER_CARDS)) {
      expect(typeof card.tagline, `${name}.tagline should be string`).toBe('string')
      expect(card.tagline.length, `${name}.tagline is empty`).toBeGreaterThan(0)
      expect(Array.isArray(card.flow), `${name}.flow should be array`).toBe(true)
      expect(card.flow.length, `${name}.flow should have exactly 3 steps`).toBe(3)
      for (const step of card.flow) {
        expect(typeof step).toBe('string')
        expect(step.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('MOCK_STATS', () => {
  it('has all required fields', () => {
    expect(typeof MOCK_STATS.cpu).toBe('string')
    expect(typeof MOCK_STATS.memPerc).toBe('string')
    expect(typeof MOCK_STATS.memBytes).toBe('string')
    expect(typeof MOCK_STATS.netDown).toBe('string')
    expect(typeof MOCK_STATS.netUp).toBe('string')
    expect(Array.isArray(MOCK_STATS.storage)).toBe(true)
    expect(Array.isArray(MOCK_STATS.topContainers)).toBe(true)
    expect(Array.isArray(MOCK_STATS.containers)).toBe(true)
  })

  it('storage entries have name, size, bytes', () => {
    for (const s of MOCK_STATS.storage) {
      expect(typeof s.name).toBe('string')
      expect(typeof s.size).toBe('string')
      expect(typeof s.bytes).toBe('number')
    }
  })

  it('container entries have name, status, cpu, mem', () => {
    for (const c of MOCK_STATS.containers) {
      expect(typeof c.name).toBe('string')
      expect(typeof c.status).toBe('string')
      expect(typeof c.cpu).toBe('string')
      expect(typeof c.mem).toBe('string')
    }
  })
})
