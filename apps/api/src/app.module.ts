import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AccountModule } from './account/account.module'
import { AuthModule } from './auth/auth.module'
import { OnboardingModule } from './onboarding/onboarding.module'
import { GuardarModule } from './guardar/guardar.module'
import { PixModule } from './pix/pix.module'
import { PrismaModule } from './prisma/prisma.module'
import { WithdrawModule } from './withdraw/withdraw.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AccountModule,
    PixModule,
    GuardarModule,
    WithdrawModule,
    OnboardingModule,
  ],
})
export class AppModule {}
