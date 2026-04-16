import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'

function getMigrationStatus(lockDir: string, containerBaseName: string): boolean {
  if (!fs.existsSync(lockDir)) return false
  const locks = fs.readdirSync(lockDir)
  return locks.includes(containerBaseName)
}

describe('migration lock detection', () => {
  it('returns false when lock dir does not exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    expect(getMigrationStatus('/data/.migration-locks', 'nextcloud')).toBe(false)
  })

  it('returns false when lock file absent', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readdirSync').mockReturnValue([] as any)
    expect(getMigrationStatus('/data/.migration-locks', 'nextcloud')).toBe(false)
  })

  it('returns true when lock file present for container', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['nextcloud'] as any)
    expect(getMigrationStatus('/data/.migration-locks', 'nextcloud')).toBe(true)
  })

  it('returns false for different container when lock present for another', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['nextcloud'] as any)
    expect(getMigrationStatus('/data/.migration-locks', 'matrix-server')).toBe(false)
  })

  beforeEach(() => vi.restoreAllMocks())
})
