import { Type } from 'class-transformer'
import { IsNumber, Max, Min } from 'class-validator'

/** Limite por operação (reais); alinhado ao Pix. */
const MAX_AMOUNT_BRL = 50_000

export class CreateWithdrawCodeDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_AMOUNT_BRL)
  amount!: number
}
