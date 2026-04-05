import { BadRequestException, Body, Controller, Headers, Post, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreatePixTransferDto } from './dto/create-pix-transfer.dto'
import { PixService } from './pix.service'

@Controller('pix')
@UseGuards(JwtAuthGuard)
export class PixController {
  constructor(private readonly pix: PixService) {}

  @Post('transfers')
  async createTransfer(
    @CurrentUser('sub') userId: string,
    @Headers('idempotency-key') idempotencyKeyHeader: string | undefined,
    @Body() dto: CreatePixTransferDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const idempotencyKey = idempotencyKeyHeader?.trim()
    if (!idempotencyKey) {
      throw new BadRequestException({
        error: {
          code: 'IDEMPOTENCY_KEY_REQUIRED',
          message:
            'O cabeçalho Idempotency-Key é obrigatório para evitar transferências duplicadas.',
        },
      })
    }

    const result = await this.pix.transfer(userId, idempotencyKey, dto)
    res.status(result.duplicate ? 200 : 201)
    return result
  }
}
