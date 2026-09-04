import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { CadastroForm } from "./CadastroForm";

export const metadata: Metadata = { title: "Criar conta — Cardápio Digital" };

export default function CadastroPage() {
  return (
    <AuthCard
      title="Criar sua conta"
      subtitle="Você cuida do restaurante. A gente cuida do digital."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </>
      }
    >
      <CadastroForm />
    </AuthCard>
  );
}
