import type { Metadata } from "next"
import { Courier_Prime, Archivo_Narrow } from "next/font/google"
import "./globals.css"

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
})

const archivoNarrow = Archivo_Narrow({
  variable: "--font-archivo-narrow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "ID Bassin Congo",
  description: "Plateforme de tracabilite agricole EUDR",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${courierPrime.variable} ${archivoNarrow.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
