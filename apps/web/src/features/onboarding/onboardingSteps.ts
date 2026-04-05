export const STEPS = ['fullName', 'email', 'birthDate', 'phone'] as const
export type StepId = (typeof STEPS)[number]

export const STEP_QUESTIONS: Record<StepId, string> = {
  fullName: 'Qual é o seu nome completo?',
  email: 'Qual é o seu e-mail?',
  birthDate: 'Qual é a sua data de nascimento?',
  phone: 'Qual é o seu número de telefone?',
}
