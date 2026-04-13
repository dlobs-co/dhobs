import { stopContainer, startContainer } from './docker'
import { execSync } from 'child_process'
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

const RESTIC_REPO = process.env.RESTIC_REPO || '/data/backups/restic'
const RESTIC_PASSWORD_FILE = process.env.RESTIC_PASSWORD_FILE || '/data/secrets/restic_password'

function resticEnv(): Record<string, string> {
  return {
    ...process.env as Record<string, string>,
    RESTIC_REPOSITORY: RESTIC_REPO,
    RESTIC_PASSWORD_FILE: RESTIC_PASSWORD_FILE,
  }
}

function restic(args: string[], opts: { cwd?: string } = {}): string {
  const cmd = `restic ${args.join(' ')}`
  return execSync(cmd, {
    ...opts,
    env: resticEnv(),
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
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
    const containerName = containerMap[service] || `project-s-${service}`
    const snapshotPath = `/snapshots/${service}`
    const serviceRestore = path.join(restoreDir, service)

    if (!fs.existsSync(serviceRestore)) continue

    stopContainer(containerName)
    try {
      execSync(`rm -rf ${snapshotPath}/*`, { stdio: 'ignore' })
      execSync(`cp -a ${serviceRestore}/. ${snapshotPath}/`, { stdio: 'ignore' })
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
