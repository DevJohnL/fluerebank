import { z } from 'zod'

/** Alinhado ao DTO da API: valor em reais, chave Pix 3–77 caracteres. */
export const pixFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, { message: 'Indique o valor' })
    .transform((s) => parseFloat(s.replace(/\s/g, '').replace(',', '.')))
    .refine((n) => Number.isFinite(n), { message: 'Indique um valor válido' })
    .refine((n) => n >= 0.01, { message: 'Valor mínimo: R$ 0,01' })
    .refine((n) => n <= 50_000, { message: 'Valor máximo por operação: R$ 50.000,00' }),
  pixKey: z
    .string()
    .trim()
    .min(3, { message: 'Chave Pix demasiado curta' })
    .max(77, { message: 'Chave Pix demasiado longa' }),
  reference: z.string().max(140, { message: 'Descrição demasiado longa' }).optional(),
})

export type PixFormInput = z.input<typeof pixFormSchema>
export type PixFormValues = z.output<typeof pixFormSchema>
