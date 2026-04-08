import { LanguageProvider } from "@/contexts/LanguageContext"
import LoginForm from "./login/LoginForm"

export default function HomePage() {
  return (
    <LanguageProvider>
      <LoginForm />
    </LanguageProvider>
  )
}
