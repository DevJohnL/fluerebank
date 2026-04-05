/**
 * Minimal HTTP stub for POST /api/v1/onboarding/registrations.
 * Used by onboarding-spike.mjs to validate throughput (10k requests, 500 concurrent).
 */
import http from 'node:http'

const PORT = Number(process.env.PORT || 34567)

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

let registrationCount = 0

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (req.method === 'POST' && req.url === '/api/v1/onboarding/registrations') {
    try {
      const body = await parseBody(req)
      const { fullName, email, birthDate, phone } = body
      if (!fullName || !email || !birthDate || !phone) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'missing required fields' }))
        return
      }
      registrationCount += 1
      res.writeHead(201, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          id: `reg-${registrationCount}`,
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
  process.stderr.write(`mock onboarding API listening on http://127.0.0.1:${PORT}\n`)
})
