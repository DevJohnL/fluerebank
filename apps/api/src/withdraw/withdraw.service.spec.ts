import { HttpException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../prisma/prisma.service'
import { WithdrawService } from './withdraw.service'

/**
 * TDD: saque em numerário — o utilizador escolhe valor e obtém código (ou boleto no futuro).
 * Aqui validamos apenas regras de domínio: saldo e limite de geração de código consecutiva.
 */

function createPrismaMock(): Pick<PrismaService, 'account'> {
  return {
    account: {
      findUnique: vi.fn(),
    },
  } as Pick<PrismaService, 'account'>
}

describe('WithdrawService — generateWithdrawCode', () => {
  let prisma: Pick<PrismaService, 'account'>
  let service: WithdrawService

  beforeEach(() => {
    prisma = createPrismaMock()
    service = new WithdrawService(prisma as PrismaService)
  })

  it('rejects when the requested amount exceeds the account balance', async () => {
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 'acc-1',
      balanceCents: 5000n,
    })

    try {
      await service.generateWithdrawCode('user-1', 5001n)
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException)
      const ex = e as HttpException
      expect(ex.getStatus()).toBe(400)
      const body = ex.getResponse() as { error?: { code?: string } }
      expect(body.error?.code).toBe('INSUFFICIENT_FUNDS')
      return
    }

    expect.fail('must reject withdrawal when amount is greater than balance')
  })

  it('allows the first three code generations in a row for the same user', async () => {
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 'acc-stable',
      balanceCents: 100_000n,
    })

    const r1 = await service.generateWithdrawCode('user-repeat', 1000n)
    const r2 = await service.generateWithdrawCode('user-repeat', 1000n)
    const r3 = await service.generateWithdrawCode('user-repeat', 1000n)

    expect(r1.code).toBeTruthy()
    expect(r2.code).toBeTruthy()
    expect(r3.code).toBeTruthy()
    expect(r1.code).not.toBe(r2.code)
  })

  it('rejects the fourth consecutive code generation for the same user', async () => {
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 'acc-stable',
      balanceCents: 100_000n,
    })

    await service.generateWithdrawCode('user-limit', 1000n)
    await service.generateWithdrawCode('user-limit', 1000n)
    await service.generateWithdrawCode('user-limit', 1000n)

    try {
      await service.generateWithdrawCode('user-limit', 1000n)
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException)
      const ex = e as HttpException
      expect(ex.getStatus()).toBe(429)
      const body = ex.getResponse() as { error?: { code?: string } }
      expect(body.error?.code).toBe('WITHDRAW_CODE_LIMIT_EXCEEDED')
      return
    }

    expect.fail('must reject the fourth consecutive withdraw code request')
  })
})
