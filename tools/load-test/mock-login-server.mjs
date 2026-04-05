/**
 * Minimal HTTP stub for POST /api/v1/auth/login.
 * Used by login-concurrent-500.mjs to simulate concurrent authentication.
 */
import http from 'node:http'

const PORT = Number(process.env.PORT || 34568)

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

let loginCount = 0

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (req.method === 'POST' && req.url === '/api/v1/auth/login') {
    try {
      const body = await parseBody(req)
      const { email, password } = body
      if (!email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'missing credentials' }))
        return
      }
      loginCount += 1
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          accessToken: `mock-token-${loginCount}`,
          tokenType: 'Bearer',
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
  process.stderr.write(`mock login API listening on http://127.0.0.1:${PORT}\n`)
})
