import type { Metadata } from "next";
import { Archivo_Narrow, Courier_Prime } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./contexts/LanguageContext";

const archivoNarrow = Archivo_Narrow({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const courierPrime = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "ID BASSIN DU CONGO - Structuration & Traçabilité Café-Cacao",
  description: "Plateforme technologique de structuration, traçabilité et gouvernance des filières café et cacao dans le bassin du Congo. Conformité EUDR & ESG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${archivoNarrow.variable} ${courierPrime.variable} antialiased`}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
