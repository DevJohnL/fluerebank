import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { GenerateWithdrawCodeDto } from './dto/generate-withdraw-code.dto'
import { WithdrawService } from './withdraw.service'

@Controller('withdraw')
@UseGuards(JwtAuthGuard)
export class WithdrawController {
  constructor(private readonly withdraw: WithdrawService) {}

  @Post('code')
  async generateCode(@CurrentUser('sub') userId: string, @Body() dto: GenerateWithdrawCodeDto) {
    const amountCents = BigInt(Math.round(dto.amount * 100))
    return this.withdraw.generateWithdrawCode(userId, amountCents)
  }
}
