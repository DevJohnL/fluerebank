import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AccountModule } from './account/account.module'
import { AuthModule } from './auth/auth.module'
import { OnboardingModule } from './onboarding/onboarding.module'
import { PixModule } from './pix/pix.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AccountModule,
    PixModule,
    OnboardingModule,
  ],
})
export class AppModule {}
