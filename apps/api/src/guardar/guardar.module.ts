import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../prisma/prisma.module'
import { GuardarController } from './guardar.controller'
import { GuardarService } from './guardar.service'

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GuardarController],
  providers: [GuardarService],
})
export class GuardarModule {}
