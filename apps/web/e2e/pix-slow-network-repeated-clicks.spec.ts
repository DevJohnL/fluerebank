import { test, expect } from '@playwright/test'

/**
 * Contexto: utilizador com rede lenta tenta concluir o mesmo Pix e clica várias vezes
 * no botão de envio (impaciência / falta de feedback).
 *
 * Contrato esperado (quando a API existir): o mesmo pedido lógico não deve gerar
 * várias transferências — típico via Idempotency-Key + UX (botão desativado durante o voo).
 *
 * Este spec não depende da app React: usa uma página mínima na mesma origem e intercepta
 * POST /api/v1/pix/transfers para simular rede lenta e deduplicação por chave.
 */

const PIX_TRANSFER_PATH = '/api/v1/pix/transfers'

test.describe('Pix — rede lenta e cliques repetidos no mesmo envio', () => {
  test('com Idempotency-Key e servidor idempotente, só uma transferência é contabilizada', async ({
    page,
  }) => {
    let transferLedger = 0

    const inflightByKey = new Map<string, Promise<Record<string, unknown>>>()

    await page.route(`**${PIX_TRANSFER_PATH}`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      const headers = route.request().headers()
      const key =
        headers['idempotency-key'] ??
        headers['Idempotency-Key'] ??
        'no-key'

      if (!inflightByKey.has(key)) {
        inflightByKey.set(
          key,
          (async () => {
            await new Promise((r) => setTimeout(r, 1200))
            transferLedger += 1
            return {
              id: 'transfer-mock-1',
              status: 'completed',
            }
          })(),
        )
      }

      const payload = await inflightByKey.get(key)!
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      })
    })

    await page.goto('/')
    await page.setContent(
      `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><title>Pix mock</title></head>
<body>
  <button id="send" type="button">Enviar Pix</button>
  <p id="status"></p>
  <script>
    const IDEMPOTENCY_KEY = 'same-pix-attempt-001';
    document.getElementById('send').addEventListener('click', () => {
      fetch('${PIX_TRANSFER_PATH}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': IDEMPOTENCY_KEY,
        },
        body: JSON.stringify({
          amount: 10.5,
          pixKey: 'destinatario@example.com',
        }),
      }).catch(() => {});
    });
  </script>
</body>
</html>`,
    )

    const btn = page.getByRole('button', { name: 'Enviar Pix' })
    await expect(btn).toBeVisible()

    for (let i = 0; i < 5; i += 1) {
      await btn.click()
    }

    await expect
      .poll(() => transferLedger, { timeout: 15_000 })
      .toBe(1)
  })

  test('sem Idempotency-Key, vários cliques geram várias transferências no servidor (risco)', async ({
    page,
  }) => {
    let transferLedger = 0

    await page.route(`**${PIX_TRANSFER_PATH}`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }
      await new Promise((r) => setTimeout(r, 300))
      transferLedger += 1
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: `t-${transferLedger}`, status: 'completed' }),
      })
    })

    await page.goto('/')
    await page.setContent(
      `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><title>Pix mock sem chave</title></head>
<body>
  <button id="send" type="button">Enviar Pix</button>
  <script>
    document.getElementById('send').addEventListener('click', () => {
      fetch('${PIX_TRANSFER_PATH}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10, pixKey: 'x@y.com' }),
      }).catch(() => {});
    });
  </script>
</body>
</html>`,
    )

    const btn = page.getByRole('button', { name: 'Enviar Pix' })
    for (let i = 0; i < 5; i += 1) {
      await btn.click()
    }

    await expect
      .poll(() => transferLedger, { timeout: 10_000 })
      .toBe(5)
  })
})
