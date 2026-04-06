import { Type } from 'class-transformer'
import { IsInt, Max, Min } from 'class-validator'

const MAX_AMOUNT_CENTS = 50_000 * 100

export class CreateGuardarDepositDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_AMOUNT_CENTS)
  amountCents!: number
}
