import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateRegistrationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string

  @IsEmail()
  @MaxLength(320)
  email!: string

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  birthDate!: string

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  phone!: string
}
