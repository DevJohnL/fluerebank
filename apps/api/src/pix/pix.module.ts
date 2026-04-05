import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../prisma/prisma.module'
import { PixController } from './pix.controller'
import { PixService } from './pix.service'

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PixController],
  providers: [PixService],
})
export class PixModule {}
