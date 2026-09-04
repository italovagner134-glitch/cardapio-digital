import type { Metadata } from "next";
import { Sora, Inter, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Display — geométrica, arredondada e amigável. Usada em títulos e headers
// do painel. Evita o clichê serifa+creme: aqui a personalidade vem do peso
// e da forma, não de contraste editorial.
const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Corpo — grotesca neutra, legível em telas pequenas e em formulários.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

// Utilitária — a voz do cupom/comanda: números de pedido, preços, totais.
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-utility",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cardápio Digital — Seu restaurante digital sem complicação",
  description:
    "QR Code + WhatsApp + pedidos + cardápio digital para pequenos restaurantes. Sem comissão por pedido, sem complicação.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${sora.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
