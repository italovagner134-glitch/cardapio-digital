import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Digite seu nome completo."),
  email: z.email("Digite um e-mail válido."),
  phone: z
    .string()
    .trim()
    .min(10, "Digite um telefone válido com DDD.")
    .max(20),
  password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.email("Digite um e-mail válido."),
  password: z.string().min(1, "Digite sua senha."),
});

export type SignInInput = z.infer<typeof signInSchema>;
