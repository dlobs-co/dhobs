import { createServer, IncomingMessage, ServerResponse } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer, WebSocket } from 'ws'
import * as pty from 'node-pty'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3069', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const wss = new WebSocketServer({ server, path: '/ws/terminal' })

  wss.on('connection', (ws: WebSocket) => {
    let shell: pty.IPty | null = null

    try {
      shell = pty.spawn('/bin/bash', [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME || '/root',
        env: process.env as Record<string, string>,
      })
    } catch (err) {
      ws.send('\r\n\x1b[31mFailed to spawn shell: ' + String(err) + '\x1b[0m\r\n')
      ws.close()
      return
    }

    // pty output → WebSocket
    shell.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })

    shell.onExit(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('\r\n\x1b[33m[Process exited]\x1b[0m\r\n')
        ws.close()
      }
    })

    // WebSocket → pty input / resize
    ws.on('message', (message: Buffer) => {
      try {
        const msg = JSON.parse(message.toString())
        if (msg.type === 'input' && shell) {
          shell.write(msg.data)
        } else if (msg.type === 'resize' && shell) {
          const cols = Math.max(1, parseInt(msg.cols, 10))
          const rows = Math.max(1, parseInt(msg.rows, 10))
          shell.resize(cols, rows)
        }
      } catch {
        // not JSON — treat as raw input
        if (shell) shell.write(message.toString())
      }
    })

    const cleanup = () => {
      if (shell) {
        try { shell.kill() } catch { /* already dead */ }
        shell = null
      }
    }

    ws.on('close', cleanup)
    ws.on('error', cleanup)
  })

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
