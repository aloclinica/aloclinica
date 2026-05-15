/**
 * Centralized Zod schemas for the AloClínica project.
 *
 * Wraps the existing imperative validators in `form-validators.ts` so they
 * can be plugged directly into react-hook-form / zodResolver / edge functions.
 *
 * Important business rules:
 * - Idade mínima de cadastro: 16 anos (não 18) — ver memory `core`.
 * - CPF/CNPJ devem passar pelos dígitos verificadores reais.
 */
import { z } from "zod";
import {
  validarCPF,
  validarCNPJ,
  validarCRM,
  validarEmail,
  validarTelefone,
  validarNome,
  validarNomeEmpresa,
  validarEstado,
  validarSenha,
  VALID_STATES,
} from "./form-validators";

// ──────────────── Primitives ────────────────

export const cpfSchema = z
  .string()
  .trim()
  .refine((v) => validarCPF(v), { message: "CPF inválido" });

export const cnpjSchema = z
  .string()
  .trim()
  .refine((v) => validarCNPJ(v), { message: "CNPJ inválido" });

export const emailSchema = z
  .string()
  .trim()
  .max(255, { message: "Email muito longo" })
  .refine((v) => validarEmail(v), { message: "Email inválido" });

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => validarTelefone(v), {
    message: "Telefone inválido (use DDD + número)",
  });

export const fullNameSchema = z
  .string()
  .trim()
  .refine((v) => validarNome(v), {
    message: "Informe nome e sobrenome (somente letras)",
  });

export const companyNameSchema = z
  .string()
  .trim()
  .refine((v) => validarNomeEmpresa(v), { message: "Razão social inválida" });

export const stateSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => validarEstado(v), { message: "UF inválida" });

export const crmSchema = z
  .object({
    number: z.string().trim().min(1, { message: "CRM obrigatório" }),
    state: stateSchema,
  })
  .refine(({ number, state }) => validarCRM(number, state), {
    message: "CRM inválido",
    path: ["number"],
  });

/**
 * Idade mínima de 16 anos. Aceita ISO date string (YYYY-MM-DD) ou Date.
 */
export const birthDateMin16Schema = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v : new Date(v)))
  .refine((d) => !Number.isNaN(d.getTime()), { message: "Data inválida" })
  .refine(
    (d) => {
      const today = new Date();
      const age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      const day = today.getDate() - d.getDate();
      const finalAge = m < 0 || (m === 0 && day < 0) ? age - 1 : age;
      return finalAge >= 16 && finalAge <= 120;
    },
    { message: "Idade mínima de 16 anos" },
  );

export const passwordSchema = z
  .string()
  .min(8, { message: "Senha deve ter ao menos 8 caracteres" })
  .max(128, { message: "Senha muito longa" })
  .refine((v) => validarSenha(v).isValid, {
    message: "Senha fraca: use maiúsculas, minúsculas, números e símbolos",
  });

// ──────────────── Compound schemas ────────────────

export const patientSignupSchema = z
  .object({
    name: fullNameSchema,
    email: emailSchema,
    phone: phoneSchema,
    cpf: cpfSchema,
    birthDate: birthDateMin16Schema,
    password: passwordSchema,
    confirmPassword: z.string(),
    consent: z.literal(true, {
      errorMap: () => ({ message: "Você deve aceitar os termos" }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

export const b2bLeadSchema = z.object({
  companyName: companyNameSchema,
  cnpj: cnpjSchema,
  contactName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  message: z.string().trim().max(2000).optional(),
});

export { VALID_STATES };

// ──────────────── Inferred types ────────────────
export type PatientSignupInput = z.infer<typeof patientSignupSchema>;
export type B2BLeadInput = z.infer<typeof b2bLeadSchema>;