import { ConflictException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { AuthService } from '../auth/auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRegistrationDto } from './dto/create-registration.dto'

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async createRegistration(dto: CreateRegistrationDto) {
    const fullName = dto.fullName.trim()
    const email = dto.email.trim().toLowerCase()
    const birthDate = dto.birthDate.trim()
    const phone = dto.phone.trim()

    const existingUser = await this.prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new ConflictException({
        error: {
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'Já existe uma conta com este e-mail.',
        },
      })
    }

    try {
      const { registration, userId } = await this.prisma.$transaction(async (tx) => {
        const registration = await tx.registration.create({
          data: { fullName, email, birthDate, phone },
        })
        const user = await tx.user.create({
          data: { email, passwordHash: null },
        })
        await tx.account.create({
          data: { userId: user.id },
        })
        return { registration, userId: user.id }
      })

      const tokens = await this.auth.issueAccessTokenForUser(userId)
      return {
        id: registration.id,
        accessToken: tokens.accessToken,
        tokenType: tokens.tokenType,
        mustSetPassword: tokens.mustSetPassword,
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({
          error: {
            code: 'EMAIL_ALREADY_REGISTERED',
            message: 'Já existe uma conta com este e-mail.',
          },
        })
      }
      throw e
    }
  }
}
