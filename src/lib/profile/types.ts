/** Sem login ainda (Parte 6 do prompt: "se ainda não houver login, é isso
 * mesmo — não invente tela de conta") — só o que o cliente digitou neste
 * aparelho, pra preencher o pedido no WhatsApp sem repetir toda hora. */
export interface CustomerProfile {
  name: string;
  phone: string;
  address: string;
}

export const EMPTY_PROFILE: CustomerProfile = { name: "", phone: "", address: "" };
