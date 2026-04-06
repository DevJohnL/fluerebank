import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import type { PixTransfer, Transaction } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import type { CreatePixTransferDto } from './dto/create-pix-transfer.dto'

function amountToCents(amount: number): bigint {
  return BigInt(Math.round(amount * 100))
}

@Injectable()
export class PixService {
  constructor(private readonly prisma: PrismaService) {}

  async transfer(userId: string, idempotencyKey: string, dto: CreatePixTransferDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    })
    if (!user?.passwordHash) {
      throw new ForbiddenException({
        error: {
          code: 'PASSWORD_REQUIRED',
          message: 'Defina a sua palavra-passe antes de usar o Pix.',
        },
      })
    }

    const amountCents = amountToCents(dto.amount)
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

    const pixKey = dto.pixKey.trim()

    return await this.prisma.$transaction(
      async (tx) => {
        const account = await tx.account.findUnique({ where: { userId } })
        if (!account) {
          throw new HttpException(
            {
              error: {
                code: 'ACCOUNT_NOT_FOUND',
                message: 'Conta não encontrada para este utilizador.',
              },
            },
            HttpStatus.NOT_FOUND,
          )
        }

        const existing = await tx.pixTransfer.findUnique({
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

        if (account.balanceCents < amountCents) {
          throw new HttpException(
            {
              error: {
                code: 'INSUFFICIENT_FUNDS',
                message: 'Saldo insuficiente para esta transferência.',
              },
            },
            HttpStatus.BAD_REQUEST,
          )
        }

        const recipientAccount = await tx.account.findFirst({
          where: { user: { email: pixKey } },
          select: { id: true, balanceCents: true, userId: true },
        })

        if (!recipientAccount) {
          throw new HttpException(
            {
              error: {
                code: 'RECIPIENT_NOT_ON_PLATFORM',
                message: 'Não existe conta na plataforma para esta chave Pix.',
              },
            },
            HttpStatus.BAD_REQUEST,
          )
        }

        if (recipientAccount.id === account.id) {
          throw new HttpException(
            {
              error: {
                code: 'CANNOT_TRANSFER_TO_SELF',
                message: 'Não pode enviar Pix para a própria conta.',
              },
            },
            HttpStatus.BAD_REQUEST,
          )
        }

        const description = `Pix enviado · ${pixKey}`
        const ledgerAt = new Date()

        const ledgerDebit = await tx.transaction.create({
          data: {
            accountId: account.id,
            type: 'PIX_DEBIT',
            amountCents,
            description,
            createdAt: ledgerAt,
          },
        })

        await tx.transaction.create({
          data: {
            accountId: recipientAccount.id,
            type: 'PIX_CREDIT',
            amountCents,
            description: `Pix recebido · ${pixKey}`,
            createdAt: ledgerAt,
          },
        })

        const pix = await tx.pixTransfer.create({
          data: {
            accountId: account.id,
            idempotencyKey,
            amountCents,
            pixKey,
            reference: dto.reference?.trim() || null,
            status: 'COMPLETED',
            transactionId: ledgerDebit.id,
          },
          include: { transaction: true },
        })

        await tx.account.update({
          where: { id: account.id },
          data: { balanceCents: account.balanceCents - amountCents },
        })

        await tx.account.update({
          where: { id: recipientAccount.id },
          data: { balanceCents: recipientAccount.balanceCents + amountCents },
        })

        return this.toResponse(pix, false)
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15_000,
      },
    )
  }

  private toResponse(
    pix: PixTransfer & { transaction: Transaction },
    duplicate: boolean,
  ): {
    id: string
    duplicate: boolean
    status: string
    amount: number
    pixKey: string
    reference: string | null
    transactionId: string
    createdAt: string
  } {
    return {
      id: pix.id,
      duplicate,
      status: pix.status.toLowerCase(),
      amount: Number(pix.amountCents) / 100,
      pixKey: pix.pixKey,
      reference: pix.reference,
      transactionId: pix.transactionId,
      createdAt: pix.createdAt.toISOString(),
    }
  }
}
