import { pauseContainer, unpauseContainer } from './docker'
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

export async function initResticRepo() {
  if (fs.existsSync(path.join(RESTIC_REPO, 'config'))) {
    console.log('Restic repository already initialized')
    return
  }
  console.log('Initializing Restic repository...')
  fs.mkdirSync(RESTIC_REPO, { recursive: true })
  // Generate password if not present
  const pwDir = path.dirname(RESTIC_PASSWORD_FILE)
  fs.mkdirSync(pwDir, { recursive: true })
  if (!fs.existsSync(RESTIC_PASSWORD_FILE)) {
    const pw = execSync('openssl rand -hex 32').toString().trim()
    fs.writeFileSync(RESTIC_PASSWORD_FILE, pw)
  }
  restic(['init'])
  console.log('Restic repository initialized')
}

export async function runBackupJob(jobId: string, services: string[], includeMedia: boolean = false) {
  try {
    await initResticRepo()

    const stagingDir = `/tmp/staging-${jobId}`
    fs.mkdirSync(stagingDir, { recursive: true })

    const backupServices = [...services]
    if (includeMedia) backupServices.push('media')

    for (const service of backupServices) {
      const containerName = containerMap[service] || `project-s-${service}`
      const snapshotPath = `/snapshots/${service}`
      const serviceStaging = path.join(stagingDir, service)

      if (!fs.existsSync(snapshotPath)) continue

      fs.mkdirSync(serviceStaging, { recursive: true })

      if (service === 'mariadb') {
        try {
          execSync(`docker exec project-s-nextcloud-db sh -c 'exec mysqldump --all-databases -uroot -p"$MYSQL_ROOT_PASSWORD" > /var/lib/mysql/dump.sql'`, { stdio: 'ignore' })
        } catch (e) { console.warn('mysqldump failed', e) }
      }

      const startPause = Date.now()
      if (service !== 'media') pauseContainer(containerName)

      try {
        execSync(`cp -a ${snapshotPath}/. ${serviceStaging}/`, { stdio: 'ignore' })
      } finally {
        if (service !== 'media') unpauseContainer(containerName)
        const duration = Date.now() - startPause
        if (service !== 'media') console.log(`Paused ${containerName} for ${duration}ms`)
      }
    }

    // Run Restic backup
    console.log(`Running Restic backup for job ${jobId}...`)
    const output = restic(['backup', stagingDir, `--tag=job-${jobId}`, '--json'])
    const result = JSON.parse(output)

    const size = result.total_bytes_processed || 0
    const filesAdded = result.files_new || 0

    fs.rmSync(stagingDir, { recursive: true, force: true })

    const db = getDb()
    db.prepare(`
      UPDATE backup_history
      SET status = 'success', archive_path = ?, archive_size = ?, checksum = ?, iv = ?
      WHERE job_id = ?
    `).run(`restic-${jobId}`, size, `restic`, `restic`, jobId)

    console.log(`Backup ${jobId} complete: ${size} bytes processed, ${filesAdded} files added`)
  } catch (err) {
    console.error('Backup failed:', err)
    const db = getDb()
    db.prepare(`
      UPDATE backup_history SET status = 'failed', error_message = ?
      WHERE job_id = ?
    `).run(String(err), jobId)
  }
}

export function listSnapshots(): any[] {
  try {
    if (!fs.existsSync(path.join(RESTIC_REPO, 'config'))) return []
    const output = restic(['snapshots', '--json'])
    return JSON.parse(output)
  } catch {
    return []
  }
}

export function restoreSnapshot(snapshotId: string, targetDir: string) {
  if (!fs.existsSync(path.join(RESTIC_REPO, 'config'))) {
    throw new Error('Restic repository not initialized')
  }
  fs.mkdirSync(targetDir, { recursive: true })
  restic(['restore', snapshotId, '--target', targetDir])
  console.log(`Restored snapshot ${snapshotId} to ${targetDir}`)
}
