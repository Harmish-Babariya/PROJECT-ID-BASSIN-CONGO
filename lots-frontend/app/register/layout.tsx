import { LanguageProvider } from "@/contexts/LanguageContext"

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LanguageProvider>{children}</LanguageProvider>
}
