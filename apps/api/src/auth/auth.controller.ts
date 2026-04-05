import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { CurrentUser } from './current-user.decorator'
import { LoginDto } from './dto/login.dto'
import { SetPasswordDto } from './dto/set-password.dto'
import { JwtAuthGuard } from './jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Post('password')
  @UseGuards(JwtAuthGuard)
  setPassword(@CurrentUser('sub') userId: string, @Body() dto: SetPasswordDto) {
    return this.auth.setPassword(userId, dto.password)
  }
}
