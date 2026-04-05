import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRegistrationDto } from './dto/create-registration.dto'

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async createRegistration(dto: CreateRegistrationDto) {
    const row = await this.prisma.registration.create({
      data: {
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        birthDate: dto.birthDate.trim(),
        phone: dto.phone.trim(),
      },
    })
    return { id: row.id }
  }
}
