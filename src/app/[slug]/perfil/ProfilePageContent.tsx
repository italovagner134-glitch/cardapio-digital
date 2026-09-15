"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Info, Phone, User } from "lucide-react";
import { SolidHeader } from "@/components/store/SolidHeader";
import { useStoreOverlays } from "@/lib/store-context";
import { useProfile } from "@/lib/profile/use-profile";
import { EMPTY_PROFILE } from "@/lib/profile/types";
import { buildWhatsAppContactUrl } from "@/lib/whatsapp";

interface ProfilePageContentProps {
  storeWhatsapp: string | null;
}

/** Sem login (Parte 6: "se ainda não houver login, é isso mesmo — não
 * invente tela de conta") — só nome/telefone/endereço salvos neste
 * aparelho, que alimentam a mensagem de pedido no WhatsApp. */
export function ProfilePageContent({ storeWhatsapp }: ProfilePageContentProps) {
  const { openInfo } = useStoreOverlays();
  const { profile, save } = useProfile();
  const [form, setForm] = useState(EMPTY_PROFILE);

  // O snapshot real do localStorage só existe depois de montar (o valor
  // inicial de useProfile() é sempre vazio, pra bater com o servidor — ver
  // lib/profile/store.ts). Ajusta o rascunho do formulário durante o
  // próprio render, sem efeito: `profile` só troca de referência quando o
  // dado externo muda de verdade (mesmo objeto cacheado enquanto nada
  // grava), então comparar referência aqui é seguro e barato.
  const [lastProfile, setLastProfile] = useState(profile);
  if (profile !== lastProfile) {
    setLastProfile(profile);
    setForm(profile);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    save(form);
    toast.success("Dados salvos neste aparelho");
  }

  return (
    <div>
      <SolidHeader title="Perfil" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-name" className="text-sm font-semibold text-content">
            Nome
          </label>
          <input
            id="profile-name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Seu nome"
            className="h-11 rounded-xl border border-line bg-surface px-3 text-sm text-content outline-none focus-visible:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-phone" className="text-sm font-semibold text-content">
            Telefone
          </label>
          <input
            id="profile-phone"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="(00) 00000-0000"
            className="h-11 rounded-xl border border-line bg-surface px-3 text-sm text-content outline-none focus-visible:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-address" className="text-sm font-semibold text-content">
            Endereço de entrega
          </label>
          <textarea
            id="profile-address"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            placeholder="Rua, número, bairro, referência"
            rows={2}
            className="rounded-xl border border-line bg-surface p-3 text-sm text-content outline-none focus-visible:border-primary"
          />
        </div>

        <button
          type="submit"
          className="mt-1 flex h-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-onprimary transition-transform duration-150 active:scale-[0.98]"
        >
          Salvar
        </button>
      </form>

      <div className="flex flex-col gap-1 border-t border-line px-4 py-4">
        <button
          type="button"
          onClick={openInfo}
          className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-content active:bg-surface2"
        >
          <Info size={18} className="text-muted" aria-hidden="true" />
          Informações da loja
        </button>
        {storeWhatsapp && (
          <a
            href={buildWhatsAppContactUrl(storeWhatsapp, "Olá! Vi o cardápio e queria tirar uma dúvida.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-content active:bg-surface2"
          >
            <Phone size={18} className="text-muted" aria-hidden="true" />
            Fale no WhatsApp
          </a>
        )}
      </div>

      {!form.name && !form.phone && !form.address && (
        <p className="flex items-center gap-2 px-4 pb-6 text-xs text-muted">
          <User size={14} aria-hidden="true" />
          Preencha uma vez e reaproveitamos nos próximos pedidos deste aparelho.
        </p>
      )}
    </div>
  );
}
