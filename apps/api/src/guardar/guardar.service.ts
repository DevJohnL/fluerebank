import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import type { GuardarDeposit, Transaction } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class GuardarService {
  constructor(private readonly prisma: PrismaService) {}

  async deposit(userId: string, idempotencyKey: string, amountCents: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    })
    if (!user) {
      throw new HttpException(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid session' } },
        HttpStatus.UNAUTHORIZED,
      )
    }
    if (!user.passwordHash) {
      throw new ForbiddenException({
        error: {
          code: 'PASSWORD_REQUIRED',
          message: 'Defina a sua palavra-passe antes de guardar.',
        },
      })
    }

    if (amountCents <= 0n) {
      throw new HttpException(
        {
          error: {
            code: 'INVALID_AMOUNT',
            message: 'O valor deve ser maior que zero.',
          },
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const accPreview = await this.prisma.account.findUnique({ where: { userId } })
    if (!accPreview) {
      throw new HttpException(
        { error: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' } },
        HttpStatus.NOT_FOUND,
      )
    }
    if (accPreview.balanceCents < amountCents) {
      throw new HttpException(
        {
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: 'Saldo insuficiente para guardar este valor.',
          },
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    return await this.prisma.$transaction(
      async (tx) => {
        const account = await tx.account.findUnique({ where: { userId } })
        if (!account) {
          throw new HttpException(
            { error: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' } },
            HttpStatus.NOT_FOUND,
          )
        }

        const existing = await tx.guardarDeposit.findUnique({
          where: {
            accountId_idempotencyKey: {
              accountId: account.id,
              idempotencyKey,
            },
          },
          include: { transaction: true },
        })

        if (existing) {
          return this.toResponse(existing, true)
        }

        const description = 'Guardar · reserva no cofre'

        const ledger = await tx.transaction.create({
          data: {
            accountId: account.id,
            type: 'GUARDAR_DEBIT',
            amountCents,
            description,
          },
        })

        const deposit = await tx.guardarDeposit.create({
          data: {
            accountId: account.id,
            idempotencyKey,
            amountCents,
            transactionId: ledger.id,
          },
          include: { transaction: true },
        })

        await tx.account.update({
          where: { id: account.id },
          data: { balanceCents: account.balanceCents - amountCents },
        })

        await tx.vaultBalance.upsert({
          where: { accountId: account.id },
          create: { accountId: account.id, balanceCents: amountCents },
          update: { balanceCents: { increment: amountCents } },
        })

        return this.toResponse(deposit, false)
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15_000,
      },
    )
  }

  private toResponse(
    row: GuardarDeposit & { transaction: Transaction },
    duplicate: boolean,
  ): {
    id: string
    duplicate: boolean
    status: string
    amountCents: string
    transactionId: string
    createdAt: string
  } {
    return {
      id: row.id,
      duplicate,
      status: 'completed',
      amountCents: row.amountCents.toString(),
      transactionId: row.transactionId,
      createdAt: row.createdAt.toISOString(),
    }
  }
}
