import { Route, Routes } from 'react-router-dom'
import { EntrarPage } from './features/auth/EntrarPage'
import { ContaHomePage } from './features/conta/ContaHomePage'
import { HomeScreen } from './features/home/HomeScreen'
import { OnboardingContaPage } from './features/onboarding/OnboardingContaPage'
import { PixPage } from './features/pix/PixPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/entrar" element={<EntrarPage />} />
      <Route path="/abrir-conta" element={<OnboardingContaPage />} />
      <Route path="/comecar" element={<OnboardingContaPage />} />
      <Route path="/conta" element={<ContaHomePage />} />
      <Route path="/conta/pix" element={<PixPage />} />
    </Routes>
  )
}
