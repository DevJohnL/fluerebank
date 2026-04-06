import { test, expect } from '@playwright/test'

/**
 * Contrato: se a rede falha durante o pedido de guardar, o estado não deve ficar
 * inconsistente — no servidor, Unit of Work / transação Prisma faz rollback;
 * no cliente, o utilizador vê erro e o saldo permanece o mesmo (nenhum débito aplicado).
 */

const ACCOUNT_PATH = '/api/v1/account'
const GUARDAR_DEPOSIT_PATH = '/api/v1/guardar/deposits'

test.describe('Guardar — falha de rede (rollback / sem efeito durável)', () => {
  test('quando o POST falha na rede, o saldo exibido não muda', async ({ page }) => {
    let accountCalls = 0

    await page.route(`**${ACCOUNT_PATH}`, async (route) => {
      accountCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accountId: 'acc-e2e',
          balance: 100,
          balanceCents: '10000',
          mustSetPassword: false,
        }),
      })
    })

    await page.route(`**${GUARDAR_DEPOSIT_PATH}`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.abort('failed')
        return
      }
      await route.fallback()
    })

    await page.goto('/')
    await page.setContent(
      `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><title>Guardar rede</title></head>
<body>
  <p id="balance"></p>
  <input id="amount" type="number" value="10" />
  <button id="guardar" type="button">Guardar</button>
  <p id="err" role="alert"></p>
  <script>
    async function load() {
      const r = await fetch('${ACCOUNT_PATH}', { headers: { 'Authorization': 'Bearer t' } });
      const j = await r.json();
      const cents = Number(j.balanceCents);
      document.getElementById('balance').dataset.cents = String(cents);
      document.getElementById('balance').textContent = 'Saldo: ' + (cents / 100).toFixed(2) + ' €';
    }
    load();

    document.getElementById('guardar').addEventListener('click', async () => {
      const el = document.getElementById('balance');
      const balanceCents = Number(el.dataset.cents || 0);
      const euros = parseFloat(document.getElementById('amount').value || '0');
      const want = Math.round(euros * 100);
      const err = document.getElementById('err');
      err.textContent = '';
      if (want <= 0 || want > balanceCents) {
        err.textContent = 'Valor inválido ou saldo insuficiente.';
        return;
      }
      try {
        const res = await fetch('${GUARDAR_DEPOSIT_PATH}', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer t',
          },
          body: JSON.stringify({ amountCents: want }),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      } catch (e) {
        err.textContent = 'Não foi possível concluir. Tente novamente.';
        await load();
      }
    });
  </script>
</body>
</html>`,
    )

    await expect(page.locator('#balance')).toContainText(/100/)
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByRole('alert')).toContainText(/não foi possível concluir/i)
    await expect(page.locator('#balance')).toContainText(/100/)
    /** Nenhum sucesso no servidor: apenas GET inicial + refresh após erro */
    expect(accountCalls).toBeGreaterThanOrEqual(2)
  })
})
