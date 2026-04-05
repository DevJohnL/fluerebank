import { EMAIL_REGEX } from '../../lib/validation'
import type { StepId } from './onboardingSteps'

export type RegistrationFields = {
  fullName: string
  email: string
  birthDate: string
  phone: string
}

/** Returns a user-facing error message or null when valid */
export function validateStep(step: StepId, values: RegistrationFields): string | null {
  switch (step) {
    case 'fullName':
      return values.fullName.trim() ? null : 'Indique o seu nome completo'
    case 'email': {
      const v = values.email.trim()
      if (!v) return 'Indique o seu e-mail'
      if (!EMAIL_REGEX.test(v)) return 'E-mail inválido'
      return null
    }
    case 'birthDate':
      return values.birthDate ? null : 'Indique a data de nascimento'
    case 'phone':
      return values.phone.trim() ? null : 'Indique o telefone'
  }
}
