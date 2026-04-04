import { test, expect } from '@playwright/test'

test.describe('Página inicial — cliques nos CTAs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('utilizador clica em Entrar', async ({ page }) => {
    const cta = page.getByRole('button', { name: 'Entrar', exact: true })
    await expect(cta).toBeVisible()
    await expect(cta).toBeEnabled()
    await cta.click()
    await expect(page).toHaveURL(/\/entrar$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Entrar' }),
    ).toBeVisible()
  })

  test('utilizador clica em Abrir conta', async ({ page }) => {
    const cta = page.getByRole('button', { name: 'Abrir conta', exact: true })
    await expect(cta).toBeVisible()
    await expect(cta).toBeEnabled()
    await cta.click()
    await expect(page).toHaveURL(/\/abrir-conta$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Abrir conta' }),
    ).toBeVisible()
  })

  test('utilizador clica em Começar agora', async ({ page }) => {
    const cta = page.getByRole('button', { name: 'Começar agora', exact: true })
    await expect(cta).toBeVisible()
    await expect(cta).toBeEnabled()
    await cta.click()
    await expect(page).toHaveURL(/\/comecar$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Começar agora' }),
    ).toBeVisible()
  })

  test('utilizador clica em Ver como funciona', async ({ page }) => {
    const cta = page.getByRole('button', { name: 'Ver como funciona', exact: true })
    await expect(cta).toBeVisible()
    await expect(cta).toBeEnabled()
    await cta.click()
    const secaoVantagens = page.locator('#vantagens')
    await expect(secaoVantagens).toBeInViewport()
    await expect(
      page.getByRole('heading', { name: /O essencial para o dia a dia/i }),
    ).toBeVisible()
  })
})
