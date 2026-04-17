import { execFileSync } from 'child_process'

function dockerCmd(args: string[]): void {
  execFileSync('docker', args, { stdio: 'ignore' })
}

export function pauseContainer(containerName: string) {
  try {
    dockerCmd(['pause', containerName])
  } catch (e) {
    console.warn(`Failed to pause ${containerName}: ${e}`)
  }
}

export function unpauseContainer(containerName: string) {
  try {
    dockerCmd(['unpause', containerName])
  } catch (e) {
    console.warn(`Failed to unpause ${containerName}: ${e}`)
  }
}

export function stopContainer(containerName: string) {
  try {
    dockerCmd(['stop', containerName])
  } catch (e) {
    console.warn(`Failed to stop ${containerName}: ${e}`)
  }
}

export function startContainer(containerName: string) {
  try {
    dockerCmd(['start', containerName])
  } catch (e) {
    console.warn(`Failed to start ${containerName}: ${e}`)
  }
}
