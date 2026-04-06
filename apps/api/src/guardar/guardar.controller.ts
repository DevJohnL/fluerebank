import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateGuardarDepositDto } from './dto/create-guardar-deposit.dto'
import { GuardarService } from './guardar.service'

@Controller('guardar')
@UseGuards(JwtAuthGuard)
export class GuardarController {
  constructor(private readonly guardar: GuardarService) {}

  @Post('deposits')
  async createDeposit(
    @CurrentUser('sub') userId: string,
    @Headers('idempotency-key') idempotencyKeyHeader: string | undefined,
    @Body() dto: CreateGuardarDepositDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const idempotencyKey = idempotencyKeyHeader?.trim()
    if (!idempotencyKey) {
      throw new BadRequestException({
        error: {
          code: 'IDEMPOTENCY_KEY_REQUIRED',
          message:
            'O cabeçalho Idempotency-Key é obrigatório para evitar operações duplicadas.',
        },
      })
    }

    const amountCents = BigInt(dto.amountCents)
    const result = await this.guardar.deposit(userId, idempotencyKey, amountCents)
    res.status(result.duplicate ? 200 : 201)
    return result
  }
}
