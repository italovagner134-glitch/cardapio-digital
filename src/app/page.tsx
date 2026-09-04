import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Placeholder da Fase 1. A landing institucional completa (seção 7 do
 * briefing) é a próxima peça a construir — esta página só evita um 404 e dá
 * acesso a cadastro/login enquanto isso.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <span className="font-heading text-lg font-semibold text-foreground">Cardápio Digital</span>
      <h1 className="max-w-xl font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        Seu restaurante digital sem complicação.
      </h1>
      <p className="max-w-md text-muted-foreground">
        Você cuida do restaurante. A gente cuida do digital.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/cadastro">Começar agora</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    </div>
  );
}
