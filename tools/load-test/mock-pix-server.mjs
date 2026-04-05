/**
 * HTTP stub mínimo para POST /api/v1/pix/transfers.
 * Usado por pix-concurrent-500.mjs para simular 500 pedidos Pix em paralelo.
 */
import http from 'node:http'

const PORT = Number(process.env.PORT || 34569)

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

let transferSeq = 0

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (req.method === 'POST' && req.url === '/api/v1/pix/transfers') {
    try {
      const body = await parseBody(req)
      const { amount, pixKey, reference } = body
      if (amount == null || pixKey == null) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'amount and pixKey required' }))
        return
      }
      transferSeq += 1
      res.writeHead(202, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          id: `pix-mock-${transferSeq}`,
          status: 'processing',
          reference: reference ?? null,
        }),
      )
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'invalid body' }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(PORT, '127.0.0.1', () => {
  process.stderr.write(`mock Pix API listening on http://127.0.0.1:${PORT}\n`)
})
