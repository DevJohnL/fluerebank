import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'

/** Limite simples por operação (reais); limites dia/noite podem vir de estratégias depois. */
const MAX_AMOUNT_BRL = 50_000

export class CreatePixTransferDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_AMOUNT_BRL)
  amount!: number

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(77)
  pixKey!: string

  @IsOptional()
  @IsString()
  @MaxLength(140)
  reference?: string
}
