import { Type } from 'class-transformer'
import { IsNumber, Max, Min } from 'class-validator'

const MAX_REAIS = 50_000

/** Valor em reais (alinhado ao formulário web). */
export class GenerateWithdrawCodeDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_REAIS)
  amount!: number
}
