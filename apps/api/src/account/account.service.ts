import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalanceForUser(userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
      include: { user: { select: { passwordHash: true } } },
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

    return {
      accountId: account.id,
      balance: Number(account.balanceCents) / 100,
      balanceCents: account.balanceCents.toString(),
      mustSetPassword: !account.user.passwordHash,
    }
  }
}
