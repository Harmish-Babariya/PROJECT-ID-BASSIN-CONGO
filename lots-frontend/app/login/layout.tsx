import { LanguageProvider } from "@/contexts/LanguageContext"

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LanguageProvider>{children}</LanguageProvider>
}
