import { useCallback, useMemo, useReducer } from 'react'
import { submitRegistration } from '../../lib/onboarding'
import { STEPS } from './onboardingSteps'
import { validateStep, type RegistrationFields } from './onboardingValidation'

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

type State = {
  stepIndex: number
  fields: RegistrationFields
  submitStatus: SubmitStatus
  errorMessage: string | null
  fieldError: string | null
  accessToken: string | null
}

const initialFields: RegistrationFields = {
  fullName: '',
  email: '',
  birthDate: '',
  phone: '',
}

const initialState: State = {
  stepIndex: 0,
  fields: initialFields,
  submitStatus: 'idle',
  errorMessage: null,
  fieldError: null,
  accessToken: null,
}

type Action =
  | { type: 'field'; field: keyof RegistrationFields; value: string }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'setFieldError'; message: string }
  | { type: 'submitStart' }
  | { type: 'submitSuccess'; accessToken: string }
  | { type: 'submitError'; message: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'field':
      return {
        ...state,
        fields: { ...state.fields, [action.field]: action.value },
        fieldError: null,
      }
    case 'setFieldError':
      return { ...state, fieldError: action.message }
    case 'back':
      return {
        ...state,
        stepIndex: Math.max(0, state.stepIndex - 1),
        fieldError: null,
        errorMessage: null,
      }
    case 'next': {
      const step = STEPS[state.stepIndex]
      const err = validateStep(step, state.fields)
      if (err) return { ...state, fieldError: err }
      if (state.stepIndex >= STEPS.length - 1) return state
      return { ...state, stepIndex: state.stepIndex + 1, fieldError: null }
    }
    case 'submitStart':
      return { ...state, submitStatus: 'loading', errorMessage: null }
    case 'submitSuccess':
      return { ...state, submitStatus: 'success', accessToken: action.accessToken }
    case 'submitError':
      return { ...state, submitStatus: 'error', errorMessage: action.message }
    default:
      return state
  }
}

export function useOnboardingWizard() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const step = STEPS[state.stepIndex]
  const isLastStep = state.stepIndex === STEPS.length - 1
  const progressLabel = useMemo(
    () => `Passo ${state.stepIndex + 1} de ${STEPS.length}`,
    [state.stepIndex],
  )

  const setField = useCallback((field: keyof RegistrationFields, value: string) => {
    dispatch({ type: 'field', field, value })
  }, [])

  const goNext = useCallback(() => {
    dispatch({ type: 'next' })
  }, [])

  const goBack = useCallback(() => {
    dispatch({ type: 'back' })
  }, [])

  const submit = useCallback(async () => {
    const err = validateStep(step, state.fields)
    if (err) {
      dispatch({ type: 'setFieldError', message: err })
      return
    }
    dispatch({ type: 'submitStart' })
    const result = await submitRegistration(state.fields)
    if (!result.ok) {
      dispatch({ type: 'submitError', message: result.message })
      return
    }
    dispatch({ type: 'submitSuccess', accessToken: result.data.accessToken })
  }, [state.fields, step])

  return {
    state,
    step,
    isLastStep,
    progressLabel,
    setField,
    goNext,
    goBack,
    submit,
  }
}
