import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../prisma/prisma.module'
import { WithdrawController } from './withdraw.controller'
import { WithdrawService } from './withdraw.service'

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WithdrawController],
  providers: [WithdrawService],
})
export class WithdrawModule {}
