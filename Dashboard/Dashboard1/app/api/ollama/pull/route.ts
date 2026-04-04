import { NextRequest } from 'next/server'
import { request as httpRequest } from 'http'

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://ollama:11434'

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  const payload = JSON.stringify({ name, stream: true })
  const url = new URL(`${OLLAMA_BASE}/api/pull`)

  const stream = new ReadableStream({
    start(controller) {
      const options = {
        hostname: url.hostname,
        port: Number(url.port) || 11434,
        path: '/api/pull',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      }

      const ollamaReq = httpRequest(options, (res) => {
        res.on('data', (chunk: Buffer) => {
          controller.enqueue(chunk)
        })
        res.on('end', () => {
          controller.close()
        })
        res.on('error', (err) => {
          controller.error(err)
        })
      })

      ollamaReq.on('error', (err) => {
        controller.error(err)
      })

      ollamaReq.write(payload)
      ollamaReq.end()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
