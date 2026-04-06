import { z } from 'zod'

/** Alinhado ao DTO da API: valor em reais. */
export const sacarFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, { message: 'Indique o valor' })
    .transform((s) => parseFloat(s.replace(/\s/g, '').replace(',', '.')))
    .refine((n) => Number.isFinite(n), { message: 'Indique um valor válido' })
    .refine((n) => n >= 0.01, { message: 'Valor mínimo: R$ 0,01' })
    .refine((n) => n <= 50_000, { message: 'Valor máximo por operação: R$ 50.000,00' }),
})

export type SacarFormInput = z.input<typeof sacarFormSchema>
export type SacarFormValues = z.output<typeof sacarFormSchema>
