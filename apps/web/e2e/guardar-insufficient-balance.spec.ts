import { test, expect } from '@playwright/test'

/**
 * Contrato UX/API: sem saldo disponível, o utilizador vê mensagem e o pedido não conclui
 * a transação (idealmente validação no cliente antes do POST; no servidor, rejeição 400
 * antes de qualquer escrita transacional).
 */

const ACCOUNT_PATH = '/api/v1/account'
const GUARDAR_DEPOSIT_PATH = '/api/v1/guardar/deposits'

test.describe('Guardar — saldo insuficiente', () => {
  test('mostra mensagem e não conclui o pedido quando o saldo é zero e o valor é positivo', async ({
    page,
  }) => {
    let postGuardarCount = 0

    await page.route(`**${ACCOUNT_PATH}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accountId: 'acc-e2e',
          balance: 0,
          balanceCents: '0',
          mustSetPassword: false,
        }),
      })
    })

    await page.route(`**${GUARDAR_DEPOSIT_PATH}`, async (route) => {
      if (route.request().method() === 'POST') {
        postGuardarCount += 1
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'should-not-happen', status: 'completed' }),
        })
        return
      }
      await route.fallback()
    })

    await page.goto('/')
    await page.setContent(
      `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><title>Guardar mock</title></head>
<body>
  <p id="balance" aria-live="polite"></p>
  <label for="amount">Valor a guardar (€)</label>
  <input id="amount" type="number" min="0" step="0.01" value="10" />
  <button id="guardar" type="button">Guardar</button>
  <p id="msg" role="alert"></p>
  <script>
    let balanceCents = 0;
    fetch('${ACCOUNT_PATH}', { headers: { 'Authorization': 'Bearer e2e-token' } })
      .then((r) => r.json())
      .then((j) => {
        balanceCents = Number(j.balanceCents || 0);
        document.getElementById('balance').textContent = 'Saldo: ' + (balanceCents / 100).toFixed(2) + ' €';
      });

    document.getElementById('guardar').addEventListener('click', async () => {
      const euros = parseFloat(document.getElementById('amount').value || '0');
      const cents = Math.round(euros * 100);
      const msg = document.getElementById('msg');
      msg.textContent = '';
      if (cents <= 0) {
        msg.textContent = 'Indique um valor válido.';
        return;
      }
      if (balanceCents < cents) {
        msg.textContent = 'Saldo insuficiente para guardar este valor.';
        return;
      }
      await fetch('${GUARDAR_DEPOSIT_PATH}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer e2e-token',
        },
        body: JSON.stringify({ amountCents: cents }),
      });
    });
  </script>
</body>
</html>`,
    )

    await expect(page.getByText(/Saldo:\s*0/)).toBeVisible()
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByRole('alert')).toContainText(/saldo insuficiente/i)
    expect(postGuardarCount).toBe(0)
  })
})
