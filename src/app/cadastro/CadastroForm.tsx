"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type SignUpActionState } from "./actions";

export function CadastroForm() {
  const [state, formAction, isPending] = useActionState<SignUpActionState, FormData>(signUp, {
    status: "idle",
  });

  if (state.status === "check-email") {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-card-foreground">
          Enviamos um link de confirmação para <strong>{state.email}</strong>.
        </p>
        <p className="text-muted-foreground">
          Abra seu e-mail e clique no link para ativar sua conta e continuar.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required placeholder="Seu nome" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telefone com DDD</Label>
        <Input id="phone" name="phone" autoComplete="tel" required placeholder="(11) 99999-9999" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@restaurante.com" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  );
}
