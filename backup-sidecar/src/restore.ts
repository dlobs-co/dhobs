import { stopContainer, startContainer } from './docker'
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getDb } from './db'

const containerMap: Record<string, string> = {
  dashboard: 'project-s-dashboard',
  jellyfin: 'project-s-jellyfin',
  nextcloud: 'project-s-nextcloud',
  mariadb: 'project-s-nextcloud-db',
  matrix: 'project-s-matrix-server',
  vaultwarden: 'project-s-vaultwarden'
}

// Strict whitelist — reject any service name not explicitly known
const ALLOWED_SERVICES = new Set(Object.keys(containerMap))

const RESTIC_REPO = process.env.RESTIC_REPO || '/data/backups/restic'
const RESTIC_PASSWORD_FILE = process.env.RESTIC_PASSWORD_FILE || '/data/secrets/restic_password'
const SNAPSHOTS_BASE = '/snapshots'

function resticEnv(): Record<string, string> {
  return {
    ...process.env as Record<string, string>,
    RESTIC_REPOSITORY: RESTIC_REPO,
    RESTIC_PASSWORD_FILE: RESTIC_PASSWORD_FILE,
  }
}

function restic(args: string[], opts: { cwd?: string } = {}): string {
  return execFileSync('restic', args, {
    ...opts,
    env: resticEnv(),
    encoding: 'utf-8',
  }).trim()
}

export async function runRestoreJob(jobId: string, backupRow: any, services: string[], restoreId: number) {
  const snapshotId = backupRow.archive_path?.replace('restic-', '') || jobId
  const restoreDir = `/tmp/restore-${jobId}`

  if (!fs.existsSync(`${RESTIC_REPO}/config`)) {
    throw new Error('Restic repository not initialized')
  }

  console.log(`Restoring Restic snapshot ${snapshotId}...`)
  restic(['restore', snapshotId, '--target', restoreDir])

  for (const service of services) {
    if (!ALLOWED_SERVICES.has(service)) {
      console.warn(`Unknown service "${service}" — skipping`)
      continue
    }

    const containerName = containerMap[service]
    const snapshotPath = path.resolve(SNAPSHOTS_BASE, service)
    const serviceRestore = path.join(restoreDir, service)

    // Boundary check — prevent path traversal via crafted service name
    if (!snapshotPath.startsWith(SNAPSHOTS_BASE + path.sep)) {
      console.warn(`Path traversal attempt for service "${service}" — skipping`)
      continue
    }

    if (!fs.existsSync(serviceRestore)) continue

    stopContainer(containerName)
    try {
      // Clear destination without spawning a shell
      if (fs.existsSync(snapshotPath)) {
        for (const entry of fs.readdirSync(snapshotPath)) {
          fs.rmSync(path.join(snapshotPath, entry), { recursive: true, force: true })
        }
      }
      execFileSync('cp', ['-a', `${serviceRestore}/.`, `${snapshotPath}/`], { stdio: 'ignore' })
    } finally {
      startContainer(containerName)
    }
  }

  fs.rmSync(restoreDir, { recursive: true, force: true })

  const db = getDb()
  db.prepare('UPDATE restore_log SET status = ? WHERE id = ?').run('success', restoreId)
  db.prepare('UPDATE backup_history SET status = ? WHERE job_id = ?').run('restored', jobId)
  console.log(`Restore ${jobId} complete`)
}
