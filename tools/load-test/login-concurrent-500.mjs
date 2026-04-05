/**
 * Load scenario: 500 simultaneous login requests (500 concurrent)
 * against the mock login API (contract placeholder until real auth exists).
 *
 * Run: node tools/load-test/login-concurrent-500.mjs
 * Requires Node.js 18+ (global fetch).
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SERVER_SCRIPT = join(__dirname, 'mock-login-server.mjs')

const TOTAL = 500
const CONCURRENCY = 500
const PORT = Number(process.env.MOCK_LOGIN_PORT || 34_568)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForHealth(baseUrl, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(`${baseUrl}/health`)
      if (r.ok) return
    } catch {
      /* retry */
    }
    await sleep(50)
  }
  throw new Error('mock server did not become ready in time')
}

async function runPool(total, concurrency, fn) {
  let next = 0
  let ok = 0
  let fail = 0
  const failures = []

  async function worker() {
    for (;;) {
      const i = next
      next += 1
      if (i >= total) break
      try {
        const result = await fn(i)
        if (result) ok += 1
        else {
          fail += 1
          if (failures.length < 20) failures.push(`index ${i}: not 200`)
        }
      } catch (e) {
        fail += 1
        if (failures.length < 20) failures.push(`index ${i}: ${e}`)
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return { ok, fail, failures }
}

async function main() {
  const child = spawn(process.execPath, [SERVER_SCRIPT], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const onChildError = (err) => {
    process.stderr.write(`child error: ${err}\n`)
  }
  child.on('error', onChildError)

  const cleanup = () => {
    try {
      child.kill('SIGTERM')
    } catch {
      /* ignore */
    }
  }
  process.on('SIGINT', () => {
    cleanup()
    process.exit(130)
  })

  try {
    await waitForHealth(`http://127.0.0.1:${PORT}`)
    const url = `http://127.0.0.1:${PORT}/api/v1/auth/login`
    const t0 = Date.now()

    const { ok, fail, failures } = await runPool(TOTAL, CONCURRENCY, async (i) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `user${i}@example.local`,
          password: 'load-test-secret',
        }),
      })
      return res.status === 200
    })

    const durationMs = Date.now() - t0
    const rps = (TOTAL / (durationMs / 1000)).toFixed(1)

    const report = {
      scenario: 'auth_login_500_concurrent',
      totalRequests: TOTAL,
      concurrency: CONCURRENCY,
      successCount: ok,
      failureCount: fail,
      durationMs,
      requestsPerSecond: Number(rps),
      pass: fail === 0 && ok === TOTAL,
    }

    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)

    if (!report.pass) {
      process.stderr.write(`sample failures:\n${failures.join('\n')}\n`)
      process.exitCode = 1
    }
  } finally {
    cleanup()
    await sleep(100)
  }
}

main().catch((e) => {
  process.stderr.write(String(e))
  process.stderr.write('\n')
  process.exit(1)
})
