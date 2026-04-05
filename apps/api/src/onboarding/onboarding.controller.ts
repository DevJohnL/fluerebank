import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { CreateRegistrationDto } from './dto/create-registration.dto'
import { OnboardingService } from './onboarding.service'

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Post('registrations')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRegistrationDto) {
    return this.onboarding.createRegistration(dto)
  }
}
