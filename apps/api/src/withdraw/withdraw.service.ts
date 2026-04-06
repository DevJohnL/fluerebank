import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Regras de saque em numerário (caixa / boleto): validação de saldo e limite de pedidos
 * de código consecutivos. Integrações com ATM e emissão de boleto ficam fora desta camada.
 */
@Injectable()
export class WithdrawService {
  /** Pedidos de código bem-sucedidos seguidos, por utilizador (em memória até haver persistência). */
  private readonly consecutiveCodeGenerationsByUserId = new Map<string, number>()

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera um código de levantamento (ex.: para ATM). Incrementa o contador de pedidos consecutivos.
   */
  async generateWithdrawCode(userId: string, amountCents: bigint): Promise<{ code: string }> {
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

    const account = await this.prisma.account.findUnique({
      where: { userId },
      select: { id: true, balanceCents: true },
    })

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

    if (amountCents > account.balanceCents) {
      throw new HttpException(
        {
          error: {
            code: 'INSUFFICIENT_FUNDS',
            message: 'Saldo insuficiente para este levantamento.',
          },
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const previous = this.consecutiveCodeGenerationsByUserId.get(userId) ?? 0
    if (previous >= 3) {
      throw new HttpException(
        {
          error: {
            code: 'WITHDRAW_CODE_LIMIT_EXCEEDED',
            message:
              'Atingiu o número máximo de pedidos de código seguidos. Tente mais tarde ou conclua o levantamento em curso.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    this.consecutiveCodeGenerationsByUserId.set(userId, previous + 1)

    return {
      code: `WD-${account.id.slice(0, 8)}-${previous + 1}`,
    }
  }
}
