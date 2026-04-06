import { HttpException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../prisma/prisma.service'
import { GuardarService } from './guardar.service'

/**
 * Regras de negócio (TDD): Guardar move valor do saldo disponível para o cofre;
 * o extrato regista a saída (GUARDAR_DEBIT); validação de saldo antes de abrir transação na BD.
 */

type TxMock = {
  account: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  transaction: {
    create: ReturnType<typeof vi.fn>
  }
  guardarDeposit: {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  vaultBalance: {
    upsert: ReturnType<typeof vi.fn>
  }
}

function createTxMock(): TxMock {
  return {
    account: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    guardarDeposit: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    vaultBalance: {
      upsert: vi.fn(),
    },
  }
}

type GuardarPrismaMock = {
  user: { findUnique: ReturnType<typeof vi.fn> }
  account: { findUnique: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function createGuardarPrismaMock(tx: TxMock): GuardarPrismaMock {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({ passwordHash: 'hashed' }),
    },
    account: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fn: (t: TxMock) => Promise<unknown>) => fn(tx)),
  }
}

describe('Guardar — saldo insuficiente', () => {
  it('rejects with INSUFFICIENT_BALANCE before starting a DB transaction', async () => {
    const tx = createTxMock()
    const prisma = createGuardarPrismaMock(tx)
    prisma.account.findUnique.mockResolvedValue({
      id: 'acc-1',
      userId: 'user-1',
      balanceCents: 50n,
    })

    const service = new GuardarService(prisma as unknown as PrismaService)

    try {
      await service.deposit('user-1', 'idem-1', 100n)
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException)
      const ex = e as HttpException
      expect(ex.getStatus()).toBe(400)
      const body = ex.getResponse() as { error?: { code?: string; message?: string } }
      expect(body.error?.code).toBe('INSUFFICIENT_BALANCE')
      expect(body.error?.message).toMatch(/saldo|insuficiente/i)
      expect(prisma.$transaction).not.toHaveBeenCalled()
      expect(tx.transaction.create).not.toHaveBeenCalled()
      expect(tx.account.update).not.toHaveBeenCalled()
      expect(tx.vaultBalance.upsert).not.toHaveBeenCalled()
      return
    }

    expect.fail('must reject before any transactional write when balance is insufficient')
  })
})

describe('Guardar — falha de rede / rollback', () => {
  it('does not commit when a write fails inside $transaction (rollback)', async () => {
    const tx = createTxMock()
    const prisma = createGuardarPrismaMock(tx)

    prisma.account.findUnique.mockResolvedValue({
      id: 'acc-1',
      userId: 'user-1',
      balanceCents: 10_000n,
    })

    tx.account.findUnique.mockResolvedValue({
      id: 'acc-1',
      userId: 'user-1',
      balanceCents: 10_000n,
    })
    tx.guardarDeposit.findUnique.mockResolvedValue(null)
    tx.transaction.create.mockResolvedValue({
      id: 'tx-1',
      accountId: 'acc-1',
      type: 'GUARDAR_DEBIT',
      amountCents: 1_000n,
    })
    tx.guardarDeposit.create.mockResolvedValue({
      id: 'gd-1',
      accountId: 'acc-1',
      idempotencyKey: 'idem-1',
      amountCents: 1_000n,
      transactionId: 'tx-1',
      createdAt: new Date(),
      transaction: {
        id: 'tx-1',
        accountId: 'acc-1',
        type: 'GUARDAR_DEBIT',
        amountCents: 1_000n,
        description: null,
        createdAt: new Date(),
      },
    })
    tx.account.update.mockResolvedValue({ id: 'acc-1', balanceCents: 9000n })
    tx.vaultBalance.upsert.mockRejectedValue(new Error('ECONNRESET'))

    let committed = false
    prisma.$transaction.mockImplementation(async (fn: (t: TxMock) => Promise<unknown>) => {
      try {
        const result = await fn(tx)
        committed = true
        return result
      } catch (err) {
        committed = false
        throw err
      }
    })

    const service = new GuardarService(prisma as unknown as PrismaService)

    await expect(service.deposit('user-1', 'idem-1', 1000n)).rejects.toThrow(/ECONNRESET/)
    expect(committed).toBe(false)
  })
})
