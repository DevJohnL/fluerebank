import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private bcryptRounds(): number {
    const n = Number(this.config.get('BCRYPT_SALT_ROUNDS', '12'))
    return Number.isFinite(n) && n >= 10 ? n : 12
  }

  async issueAccessTokenForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const accessToken = await this.signAccessToken(user)
    return { accessToken, tokenType: 'Bearer' as const, mustSetPassword: !user.passwordHash }
  }

  private async signAccessToken(user: { id: string; email: string; passwordHash: string | null }) {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      mustSetPassword: !user.passwordHash,
    })
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const accessToken = await this.signAccessToken(user)
    return {
      accessToken,
      tokenType: 'Bearer' as const,
      mustSetPassword: false,
    }
  }

  async setPassword(userId: string, plainPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    if (user.passwordHash) {
      throw new BadRequestException({
        error: {
          code: 'PASSWORD_ALREADY_SET',
          message: 'A palavra-passe já foi definida para esta conta.',
        },
      })
    }
    const passwordHash = await bcrypt.hash(plainPassword, this.bcryptRounds())
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })
    const updated = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })
    const accessToken = await this.signAccessToken(updated)
    return {
      accessToken,
      tokenType: 'Bearer' as const,
      mustSetPassword: false,
    }
  }
}
