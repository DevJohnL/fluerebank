import { HttpException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

/**
 * Regras de negócio planejadas (TDD): Guardar move valor do saldo disponível para o cofre;
 * o extrato regista a saída (débito); o montante guardado só é visível na área Guardar.
 *
 * Quando `GuardarService` existir, o caso de uso real deve substituir `guardarDepositPlanned`.
 */

type TxMock = {
  account: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  transaction: {
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
    /** Comportamento semelhante ao Prisma: executa o callback na mesma “unidade lógica”. */
    $transaction: vi.fn((fn: (t: TxMock) => Promise<unknown>) => fn(tx)),
  }
}

/**
 * Comportamento esperado do fluxo Guardar até existir implementação no serviço Nest.
 * Valida saldo **antes** de abrir transação na BD para falhar cedo e evitar trabalho inútil.
 */
async function guardarDepositPlanned(
  prisma: GuardarPrismaMock,
  userId: string,
  amountCents: bigint,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new HttpException({ error: { code: 'UNAUTHORIZED', message: 'Invalid session' } }, 401)
  }

  const accPreview = await prisma.account.findUnique({ where: { userId } })
  if (!accPreview) {
    throw new HttpException({ error: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' } }, 404)
  }
  if (accPreview.balanceCents < amountCents) {
    throw new HttpException(
      {
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Saldo insuficiente para guardar este valor.',
        },
      },
      400,
    )
  }

  await prisma.$transaction(async (tx: TxMock) => {
    const acc = await tx.account.findUnique({ where: { userId } })
    if (!acc) {
      throw new HttpException({ error: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' } }, 404)
    }
    await tx.transaction.create({
      data: {
        accountId: acc.id,
        type: 'GUARDAR_DEBIT',
        amountCents,
      },
    })
    await tx.account.update({
      where: { id: acc.id },
      data: { balanceCents: acc.balanceCents - amountCents },
    })
    await tx.vaultBalance.upsert({
      where: { accountId: acc.id },
      create: { accountId: acc.id, balanceCents: amountCents },
      update: { balanceCents: { increment: amountCents } },
    })
  })
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

    try {
      await guardarDepositPlanned(prisma, 'user-1', 100n)
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
    tx.transaction.create.mockResolvedValue({
      id: 'tx-1',
      accountId: 'acc-1',
      type: 'GUARDAR_DEBIT',
      amountCents: 1_000n,
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

    await expect(guardarDepositPlanned(prisma, 'user-1', 1000n)).rejects.toThrow(/ECONNRESET/)
    expect(committed).toBe(false)
  })
})
