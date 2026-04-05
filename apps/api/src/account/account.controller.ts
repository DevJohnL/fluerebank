import { Controller, Get, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AccountService } from './account.service'

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get()
  me(@CurrentUser('sub') userId: string) {
    return this.account.getBalanceForUser(userId)
  }
}
