import { test, expect } from '@playwright/test'

test.describe('Entrar — login', () => {
  test('utilizador submete credenciais e inicia sessão', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'e2e-access-token',
          tokenType: 'Bearer',
        }),
      })
    })

    await page.goto('/entrar')

    await page.getByLabel('E-mail').fill('demo@example.local')
    await page.getByLabel('Palavra-passe').fill('secret123')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page).toHaveURL(/\/conta$/)

    const token = await page.evaluate(() => sessionStorage.getItem('fluerebank_access_token'))
    expect(token).toBe('e2e-access-token')
  })
})
