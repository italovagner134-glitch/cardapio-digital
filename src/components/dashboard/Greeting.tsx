"use client";

import { useSyncExternalStore } from "react";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function subscribe() {
  // Não muda em tempo real — só precisamos do valor no momento da renderização.
  return () => {};
}

function getSnapshot() {
  return greetingForHour(new Date().getHours());
}

function getServerSnapshot() {
  return "Olá";
}

interface GreetingProps {
  name: string | null;
}

/**
 * Saudação calculada no horário local de quem está vendo a tela.
 * useSyncExternalStore evita mismatch de hidratação: o servidor sempre
 * renderiza "Olá", o cliente troca pelo horário real assim que hidrata.
 */
export function Greeting({ name }: GreetingProps) {
  const greeting = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const firstName = name?.trim().split(" ")[0];

  return (
    <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
      {greeting}
      {firstName ? `, ${firstName}` : ""} 👋
    </h1>
  );
}
