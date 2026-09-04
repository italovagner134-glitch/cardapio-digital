"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validations/auth";

export type SignUpActionState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "check-email"; email: string };

export async function signUp(
  _prevState: SignUpActionState,
  formData: FormData,
): Promise<SignUpActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { status: "error", error: "Esse e-mail já tem uma conta. Tente entrar." };
    }
    return { status: "error", error: "Não foi possível criar sua conta. Tente novamente." };
  }

  // Se a confirmação de e-mail estiver ativa no projeto, o cadastro não vem
  // com sessão ainda — o dono precisa clicar no link enviado por e-mail.
  if (!data.session) {
    return { status: "check-email", email: parsed.data.email };
  }

  redirect("/app");
}
