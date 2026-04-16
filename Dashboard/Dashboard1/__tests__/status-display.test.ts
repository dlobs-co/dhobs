import { describe, it, expect } from 'vitest'

function statusColor(status: string): string {
  if (status === 'migrating') return '#f59e0b'
  if (['running', 'healthy'].includes(status)) return '#22c55e'
  if (['unhealthy', 'exited', 'dead'].includes(status)) return '#ef4444'
  if (['restarting', 'paused'].includes(status)) return '#f59e0b'
  return '#22c55e'
}

function statusLabel(status: string): string {
  if (status === 'migrating') return 'Migrating...'
  if (['running', 'healthy'].includes(status)) return 'Running'
  if (status === 'unhealthy') return 'Unhealthy'
  if (status === 'exited') return 'Exited'
  if (status === 'dead') return 'Dead'
  if (status === 'restarting') return 'Restarting'
  if (status === 'paused') return 'Paused'
  return 'Running'
}

describe('statusColor', () => {
  it('migrating → amber', () => expect(statusColor('migrating')).toBe('#f59e0b'))
  it('running → green', () => expect(statusColor('running')).toBe('#22c55e'))
  it('unhealthy → red', () => expect(statusColor('unhealthy')).toBe('#ef4444'))
  it('restarting → amber', () => expect(statusColor('restarting')).toBe('#f59e0b'))
})

describe('statusLabel', () => {
  it('migrating → Migrating...', () => expect(statusLabel('migrating')).toBe('Migrating...'))
  it('running → Running', () => expect(statusLabel('running')).toBe('Running'))
  it('unhealthy → Unhealthy', () => expect(statusLabel('unhealthy')).toBe('Unhealthy'))
  it('unknown → Running', () => expect(statusLabel('unknown')).toBe('Running'))
})
