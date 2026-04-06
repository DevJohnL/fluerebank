import { HttpException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../prisma/prisma.service'
import { PixService } from './pix.service'

/**
 * Regras de negócio planejadas (TDD): Pix só entre contas da plataforma; extrato e saldo
 * coerentes em tempo real quando há envio e receção na mesma hora.
 *
 * Estes testes falham até a implementação validar o destinatário e liquidar crédito/débito internos.
 */

type TxMock = {
  account: {
    findUnique: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  user: {
    findUnique: ReturnType<typeof vi.fn>
  }
  pixTransfer: {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  transaction: {
    create: ReturnType<typeof vi.fn>
  }
}

function createTxMock(): TxMock {
  return {
    account: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    pixTransfer: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
  }
}

function createPrismaWithTransaction(tx: TxMock): Pick<PrismaService, 'user' | '$transaction'> {
  return {
    user: {
      findUnique: vi.fn(),
    },
    /** Prisma passa opções como segundo argumento (isolationLevel, timeout, …). */
    $transaction: vi.fn((fn: (t: TxMock) => Promise<unknown>, ..._args: unknown[]) => fn(tx)),
  } as Pick<PrismaService, 'user' | '$transaction'>
}

describe('PixService — recipient must exist on the platform', () => {
  let tx: TxMock
  let prisma: Pick<PrismaService, 'user' | '$transaction'>
  let service: PixService

  beforeEach(() => {
    tx = createTxMock()
    prisma = createPrismaWithTransaction(tx)
    service = new PixService(prisma as PrismaService)
  })

  it('rejects the transfer before any ledger write when the pix key does not belong to a platform account', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: 'hashed' })

    tx.account.findUnique.mockResolvedValue({
      id: 'acc-sender',
      userId: 'user-sender',
      balanceCents: 100_000n,
    })
    tx.pixTransfer.findUnique.mockResolvedValue(null)
    /** Destinatário não encontrado na plataforma (contrato futuro: resolver chave → conta). */
    tx.account.findFirst.mockResolvedValue(null)

    /** Mocks completos para o fluxo atual (liquidação sem validar destino) — o teste exige rejeição antes disto. */
    const ledgerAt = new Date('2026-04-05T12:00:00.000Z')
    tx.transaction.create.mockResolvedValue({
      id: 'tx-ledger',
      accountId: 'acc-sender',
      type: 'PIX_DEBIT',
      amountCents: 5000n,
      createdAt: ledgerAt,
    })
    tx.pixTransfer.create.mockResolvedValue({
      id: 'pix-row',
      status: 'COMPLETED',
      amountCents: 5000n,
      pixKey: 'nao-existe-na-plataforma@example.com',
      reference: null,
      transactionId: 'tx-ledger',
      createdAt: ledgerAt,
      transaction: {
        id: 'tx-ledger',
        accountId: 'acc-sender',
        type: 'PIX_DEBIT',
        amountCents: 5000n,
        createdAt: ledgerAt,
      },
    })
    tx.account.update.mockResolvedValue({})

    try {
      await service.transfer('user-sender', 'idempotency-reject-unknown', {
        amount: 50,
        pixKey: 'nao-existe-na-plataforma@example.com',
      })
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException)
      const ex = e as HttpException
      expect(ex.getStatus()).toBe(400)
      const body = ex.getResponse() as { error?: { code?: string; message?: string } }
      expect(body.error?.code).toBe('RECIPIENT_NOT_ON_PLATFORM')
      expect(body.error?.message).toMatch(/plataforma|conta/i)
      expect(tx.transaction.create).not.toHaveBeenCalled()
      expect(tx.pixTransfer.create).not.toHaveBeenCalled()
      expect(tx.account.update).not.toHaveBeenCalled()
      return
    }

    expect.fail(
      'transfer must be rejected before any Pix is sent when the recipient is not on the platform',
    )
  })
})

describe('PixService — balance and statement stay in sync for same-hour send and receive', () => {
  let tx: TxMock
  let prisma: Pick<PrismaService, 'user' | '$transaction'>
  let service: PixService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-05T14:30:00.000Z'))
    tx = createTxMock()
    prisma = createPrismaWithTransaction(tx)
    service = new PixService(prisma as PrismaService)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('records paired debit and credit and updates both balances so statement net matches balance within the same hour', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: 'hashed' })

    const senderInitial = 1_000_000n
    const receiverInitial = 50_000n
    const amountCents = 25_000n

    tx.account.findUnique.mockResolvedValue({
      id: 'acc-sender',
      userId: 'user-sender',
      balanceCents: senderInitial,
    })
    tx.pixTransfer.findUnique.mockResolvedValue(null)

    tx.account.findFirst.mockResolvedValue({
      id: 'acc-receiver',
      userId: 'user-receiver',
      balanceCents: receiverInitial,
    })

    tx.user.findUnique.mockResolvedValue({ email: 'remetente@fluerebank.local' })

    const at = new Date('2026-04-05T14:30:00.000Z')

    tx.transaction.create.mockResolvedValue({
      id: 'tx-debit',
      accountId: 'acc-sender',
      type: 'PIX_DEBIT',
      amountCents,
      createdAt: at,
    })

    tx.pixTransfer.create.mockResolvedValue({
      id: 'pix-1',
      status: 'COMPLETED',
      amountCents,
      pixKey: 'destinatario@fluerebank.local',
      reference: null,
      transactionId: 'tx-debit',
      createdAt: at,
      transaction: {
        id: 'tx-debit',
        accountId: 'acc-sender',
        type: 'PIX_DEBIT',
        amountCents,
        createdAt: at,
      },
    })

    tx.account.update.mockResolvedValue({} as never)

    await service.transfer('user-sender', 'idempotency-internal-pair', {
      amount: Number(amountCents) / 100,
      pixKey: 'destinatario@fluerebank.local',
    })

    /** Débito na origem e crédito no destino na mesma janela horária (UTC). */
    expect(tx.transaction.create).toHaveBeenCalledTimes(2)

    const debitCall = tx.transaction.create.mock.calls.find(
      (c) => (c[0] as { data?: { type?: string } }).data?.type === 'PIX_DEBIT',
    )
    const creditCall = tx.transaction.create.mock.calls.find(
      (c) => (c[0] as { data?: { type?: string } }).data?.type === 'PIX_CREDIT',
    )
    expect(debitCall).toBeDefined()
    expect(creditCall).toBeDefined()

    const debitCreatedAt = (debitCall![0] as { data?: { createdAt?: Date } }).data?.createdAt
    const creditCreatedAt = (creditCall![0] as { data?: { createdAt?: Date } }).data?.createdAt
    expect(debitCreatedAt).toBeDefined()
    expect(creditCreatedAt).toBeDefined()
    expect(debitCreatedAt!.getUTCHours()).toBe(creditCreatedAt!.getUTCHours())

    expect(tx.account.update).toHaveBeenCalledTimes(2)

    const senderNet =
      senderInitial -
      BigInt(
        (debitCall![0] as { data: { amountCents: bigint } }).data.amountCents,
      )
    const receiverNet =
      receiverInitial +
      BigInt(
        (creditCall![0] as { data: { amountCents: bigint } }).data.amountCents,
      )

    const senderUpdate = tx.account.update.mock.calls.find(
      (c) => (c[0] as { where?: { id?: string } }).where?.id === 'acc-sender',
    )
    const receiverUpdate = tx.account.update.mock.calls.find(
      (c) => (c[0] as { where?: { id?: string } }).where?.id === 'acc-receiver',
    )
    expect(senderUpdate).toBeDefined()
    expect(receiverUpdate).toBeDefined()
    expect((senderUpdate![0] as { data: { balanceCents: bigint } }).data.balanceCents).toBe(
      senderNet,
    )
    expect((receiverUpdate![0] as { data: { balanceCents: bigint } }).data.balanceCents).toBe(
      receiverNet,
    )
  })
})
